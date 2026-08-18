"""pyHanko PAdES provider; key material stays inside this service."""
import io
import os
from pathlib import Path
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign import signers, timestamps
from pyhanko.sign.fields import SigSeedSubFilter, SigFieldSpec
from .provider_contract import SignerCertificate

class PadesProvider:
    def __init__(self) -> None:
        self.pfx_path = Path(os.environ.get("SIGNING_PFX_PATH", "/run/secrets/signing.pfx"))
        self.pfx_password = os.environ.get("SIGNING_PFX_PASSWORD", "").encode()

    def signer(self):
        return signers.SimpleSigner.load_pkcs12(str(self.pfx_path), passphrase=self.pfx_password)

    def timestamper(self):
        tsa_url = os.environ.get("SIGNING_TSA_URL", "").strip()
        return timestamps.HTTPTimeStamper(tsa_url, timeout=10) if tsa_url else None

    def sign_pdf(self, source: bytes, field_name: str, page_index: int, rect: tuple[float, float, float, float], reason: str | None = None) -> bytes:
        if not self.pfx_path.exists():
            raise FileNotFoundError(str(self.pfx_path))
        writer = IncrementalPdfFileWriter(io.BytesIO(source))
        field = SigFieldSpec(sig_field_name=field_name, on_page=page_index, box=rect)
        metadata = signers.PdfSignatureMetadata(field_name=field_name, md_algorithm="sha256", subfilter=SigSeedSubFilter.PADES, reason=reason)
        output = io.BytesIO()
        timestamper = self.timestamper()
        signers.sign_pdf(writer, signature_meta=metadata, signer=signers.SimpleSigner.load_pkcs12(str(self.pfx_path), passphrase=self.pfx_password), timestamper=timestamper, existing_fields_only=False, new_field_spec=field, output=output)
        return output.getvalue()

    def certificate(self) -> SignerCertificate:
        signer = self.signer()
        cert = signer.signing_cert
        return SignerCertificate(subject=cert.subject.human_friendly, issuer=cert.issuer.human_friendly, serial=str(cert.serial_number), not_after=cert.not_valid_after.isoformat(), key_id=str(cert.serial_number))

    def sign_digest(self, digest: bytes) -> bytes:
        # External two-phase providers should implement this method through
        # PKCS#11/Remote CA. pyHanko's SimpleSigner signs PDF structures, not
        # an arbitrary pre-hashed payload, so fail closed here.
        raise NotImplementedError('Use provider-specific two-phase signer for digest signing')
