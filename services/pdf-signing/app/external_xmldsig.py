"""Two-phase enveloped XMLDSig using a raw RSA signature from Workstation Agent."""
import base64
import copy
import hashlib
import hmac
from dataclasses import dataclass

from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa, utils
from lxml import etree


DS = "http://www.w3.org/2000/09/xmldsig#"
NS = {"ds": DS}
C14N = "http://www.w3.org/2001/10/xml-exc-c14n#"
ENVELOPED = "http://www.w3.org/2000/09/xmldsig#enveloped-signature"
RSA_SHA256 = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
SHA256 = "http://www.w3.org/2001/04/xmlenc#sha256"


@dataclass
class ExternalXmlDsigState:
    source_xml: bytes
    signed_info_c14n: bytes
    certificate_der: bytes
    certificate_chain_der: list[bytes]
    reference_digest: bytes
    signature_container_xpath: str


def _decode(value: str, label: str) -> bytes:
    try:
        decoded = base64.b64decode(value, validate=True)
    except Exception as exc:
        raise ValueError(f"Invalid {label} Base64") from exc
    if not decoded:
        raise ValueError(f"Empty {label}")
    return decoded


def _parse(xml: bytes) -> etree._Element:
    if len(xml) > 25 * 1024 * 1024:
        raise ValueError("XML exceeds configured signing size limit")
    if b"<!DOCTYPE" in xml.upper() or b"<!ENTITY" in xml.upper():
        raise ValueError("DTD and entities are forbidden in signed XML")
    parser = etree.XMLParser(resolve_entities=False, load_dtd=False, no_network=True, remove_blank_text=False)
    try:
        return etree.fromstring(xml, parser)
    except etree.XMLSyntaxError as exc:
        raise ValueError("Invalid XML document") from exc


def _c14n(node: etree._Element) -> bytes:
    return etree.tostring(node, method="c14n", exclusive=True, with_comments=False)


def _unsigned_c14n(root: etree._Element) -> bytes:
    clone = copy.deepcopy(root)
    for signature in clone.xpath(".//ds:Signature", namespaces=NS):
        signature.getparent().remove(signature)
    return _c14n(clone)


def _signed_info(reference_digest: bytes) -> etree._Element:
    node = etree.Element(etree.QName(DS, "SignedInfo"), nsmap={"ds": DS})
    etree.SubElement(node, etree.QName(DS, "CanonicalizationMethod"), Algorithm=C14N)
    etree.SubElement(node, etree.QName(DS, "SignatureMethod"), Algorithm=RSA_SHA256)
    reference = etree.SubElement(node, etree.QName(DS, "Reference"), URI="")
    transforms = etree.SubElement(reference, etree.QName(DS, "Transforms"))
    etree.SubElement(transforms, etree.QName(DS, "Transform"), Algorithm=ENVELOPED)
    etree.SubElement(transforms, etree.QName(DS, "Transform"), Algorithm=C14N)
    etree.SubElement(reference, etree.QName(DS, "DigestMethod"), Algorithm=SHA256)
    etree.SubElement(reference, etree.QName(DS, "DigestValue")).text = base64.b64encode(reference_digest).decode()
    return node


def prepare_external_xmldsig(xml: bytes, certificate_base64: str, certificate_chain_base64: list[str], signature_container_xpath: str = "//*[local-name()='CKS_BENH_VIEN']") -> tuple[ExternalXmlDsigState, bytes]:
    root = _parse(xml)
    if root.xpath(".//ds:Signature", namespaces=NS):
        raise ValueError("XML already contains a digital signature")
    containers = root.xpath(signature_container_xpath)
    if len(containers) != 1:
        raise ValueError("XML must contain exactly one signature container")
    if (containers[0].text or "").strip() or len(containers[0]):
        raise ValueError("Signature container must be empty")
    cert_der = _decode(certificate_base64, "certificate")
    cert = x509.load_der_x509_certificate(cert_der)
    if not isinstance(cert.public_key(), rsa.RSAPublicKey):
        raise ValueError("XMLDSig currently requires an RSA certificate")
    chain = [_decode(item, "certificate chain") for item in certificate_chain_base64[:10]]
    digest = hashlib.sha256(_unsigned_c14n(root)).digest()
    signed_info_c14n = _c14n(_signed_info(digest))
    state = ExternalXmlDsigState(xml, signed_info_c14n, cert_der, chain, digest, signature_container_xpath)
    return state, hashlib.sha256(signed_info_c14n).digest()


def complete_external_xmldsig(state: ExternalXmlDsigState, raw_signature_base64: str) -> bytes:
    signature_value = _decode(raw_signature_base64, "raw signature")
    cert = x509.load_der_x509_certificate(state.certificate_der)
    try:
        cert.public_key().verify(signature_value, hashlib.sha256(state.signed_info_c14n).digest(), padding.PKCS1v15(), utils.Prehashed(hashes.SHA256()))
    except Exception as exc:
        raise ValueError("Raw signature does not match XML SignedInfo") from exc
    root = _parse(state.source_xml)
    if hashlib.sha256(_unsigned_c14n(root)).digest() != state.reference_digest:
        raise ValueError("XML content changed after preparation")
    container = root.xpath(state.signature_container_xpath)[0]
    # Keep the ds prefix stable: changing SignedInfo's namespace context after
    # preparation changes its canonical bytes and invalidates the signature.
    signature = etree.SubElement(container, etree.QName(DS, "Signature"), nsmap={"ds": DS})
    signature.append(_signed_info(state.reference_digest))
    etree.SubElement(signature, etree.QName(DS, "SignatureValue")).text = base64.b64encode(signature_value).decode()
    key_info = etree.SubElement(signature, etree.QName(DS, "KeyInfo"))
    x509_data = etree.SubElement(key_info, etree.QName(DS, "X509Data"))
    for certificate in [state.certificate_der, *state.certificate_chain_der]:
        etree.SubElement(x509_data, etree.QName(DS, "X509Certificate")).text = base64.b64encode(certificate).decode()
    result = etree.tostring(root, xml_declaration=True, encoding="UTF-8")
    verify_xmldsig(result)
    return result


def verify_xmldsig(xml: bytes) -> None:
    root = _parse(xml)
    signatures = root.xpath(".//ds:Signature", namespaces=NS)
    if len(signatures) != 1:
        raise ValueError("Expected exactly one XML digital signature")
    signature = signatures[0]
    signed_info = signature.find(f"{{{DS}}}SignedInfo")
    digest_value = signed_info.findtext(f".//{{{DS}}}DigestValue") if signed_info is not None else None
    cert_value = signature.findtext(f".//{{{DS}}}X509Certificate")
    signature_value = signature.findtext(f"{{{DS}}}SignatureValue")
    if not all((signed_info is not None, digest_value, cert_value, signature_value)):
        raise ValueError("Incomplete XML digital signature")
    actual_digest = hashlib.sha256(_unsigned_c14n(root)).digest()
    if not hmac.compare_digest(actual_digest, _decode(digest_value, "digest")):
        raise ValueError("XML reference digest mismatch")
    cert = x509.load_der_x509_certificate(_decode(cert_value, "certificate"))
    try:
        cert.public_key().verify(_decode(signature_value, "signature"), _c14n(signed_info), padding.PKCS1v15(), hashes.SHA256())
    except Exception as exc:
        raise ValueError("Invalid XML digital signature") from exc
