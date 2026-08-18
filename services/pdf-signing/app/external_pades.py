"""Interrupted PAdES signing using a raw signature produced by Workstation Agent."""
import base64
import hashlib
import io
from dataclasses import dataclass
from typing import Any

from asn1crypto import x509
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign import fields, signers
from pyhanko.sign.validation import async_validate_pdf_signature
from .validation_policy import validation_context
from pyhanko_certvalidator.registry import SimpleCertificateStore


@dataclass
class ExternalPadesState:
    prepared_digest: Any
    signed_attrs: Any
    prepared_pdf: bytes
    signing_cert: x509.Certificate
    cert_registry: SimpleCertificateStore
    other_certs: list
    profile: str


def _decode(value: str, label: str) -> bytes:
    try:
        result = base64.b64decode(value, validate=True)
    except Exception as exc:
        raise ValueError(f"Invalid {label} Base64") from exc
    if not result:
        raise ValueError(f"Empty {label}")
    return result


def _certificates(leaf_base64: str, chain_base64: list[str]):
    leaf = x509.Certificate.load(_decode(leaf_base64, "certificate"))
    chain = [x509.Certificate.load(_decode(item, "certificate chain")) for item in chain_base64[:10]]
    registry = SimpleCertificateStore.from_certs(cert for cert in chain if cert.dump() != leaf.dump())
    return leaf, registry, chain


def _external_signer(cert, registry, signature_value):
    return signers.ExternalSigner(
        signing_cert=cert,
        cert_registry=registry,
        signature_value=signature_value,
        prefer_pss=False,
        embed_roots=True,
    )


async def prepare_external_pades(
    source_pdf: bytes,
    certificate_base64: str,
    certificate_chain_base64: list[str],
    field_name: str,
    page_index: int,
    rect: tuple[float, float, float, float],
    profile: str,
    reason: str | None,
    timestamper=None,
) -> tuple[ExternalPadesState, bytes]:
    if not source_pdf.startswith(b"%PDF-"):
        raise ValueError("Source is not a PDF")
    if profile != "PAdES-B-B" and timestamper is None:
        raise RuntimeError("TSA is required for the requested PAdES profile")
    cert, registry, chain = _certificates(certificate_base64, certificate_chain_base64)
    placeholder_signer = _external_signer(cert, registry, bytes(512))
    writer = IncrementalPdfFileWriter(io.BytesIO(source_pdf))
    metadata = signers.PdfSignatureMetadata(
        field_name=field_name,
        md_algorithm="sha256",
        subfilter=fields.SigSeedSubFilter.PADES,
        reason=reason,
    )
    field = fields.SigFieldSpec(sig_field_name=field_name, on_page=page_index, box=rect)
    pdf_signer = signers.PdfSigner(
        metadata,
        signer=placeholder_signer,
        timestamper=timestamper,
        new_field_spec=field,
    )
    prepared_digest, tbs_document, output = await pdf_signer.async_digest_doc_for_signing(writer)
    signed_attrs = await placeholder_signer.signed_attrs(
        prepared_digest.document_digest,
        "sha256",
        use_pades=True,
    )
    digest_to_sign = hashlib.sha256(signed_attrs.dump()).digest()
    state = ExternalPadesState(
        prepared_digest=prepared_digest,
        signed_attrs=signed_attrs,
        prepared_pdf=output.getvalue(),
        signing_cert=cert,
        cert_registry=registry,
        other_certs=chain,
        profile=profile,
    )
    return state, digest_to_sign


async def complete_external_pades(state: ExternalPadesState, raw_signature_base64: str, timestamper=None) -> bytes:
    raw_signature = _decode(raw_signature_base64, "raw signature")
    signer = _external_signer(state.signing_cert, state.cert_registry, raw_signature)
    cms = await signer.async_sign_prescribed_attributes(
        "sha256",
        signed_attrs=state.signed_attrs,
        timestamper=timestamper,
    )
    output = io.BytesIO(state.prepared_pdf)
    state.prepared_digest.fill_with_cms(output, cms)
    result = output.getvalue()
    if not result.startswith(b"%PDF-") or result == state.prepared_pdf:
        raise RuntimeError("Invalid PAdES output")
    reader = PdfFileReader(io.BytesIO(result))
    if len(reader.embedded_signatures) != 1:
        raise RuntimeError("Expected exactly one PAdES signature")
    validation = await async_validate_pdf_signature(
        reader.embedded_signatures[0],
        signer_validation_context=validation_context(state.signing_cert, state.other_certs),
    )
    if not validation.intact or not validation.valid:
        raise RuntimeError("External signature verification failed")
    if state.profile == "PAdES-B-T" and (validation.timestamp_validity is None or not validation.timestamp_validity.intact or not validation.timestamp_validity.valid):
        raise RuntimeError("Trusted RFC 3161 signature timestamp is required")
    return result
