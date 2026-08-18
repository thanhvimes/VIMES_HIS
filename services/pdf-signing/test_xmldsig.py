import base64
from datetime import datetime, timedelta, timezone

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa, utils
from cryptography.x509.oid import NameOID
from lxml import etree

from app.external_xmldsig import DS, complete_external_xmldsig, prepare_external_xmldsig, verify_xmldsig
from app.main import app
from fastapi.testclient import TestClient


def certificate_fixture():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "VIMES XMLDSig Test")])
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
            .serial_number(x509.random_serial_number()).not_valid_before(datetime.now(timezone.utc) - timedelta(days=1))
            .not_valid_after(datetime.now(timezone.utc) + timedelta(days=30)).sign(key, hashes.SHA256()))
    return key, base64.b64encode(cert.public_bytes(serialization.Encoding.DER)).decode()


def test_external_xmldsig_roundtrip_and_independent_verification():
    key, certificate = certificate_fixture()
    source = b'<?xml version="1.0" encoding="UTF-8"?><KHAMSUCKHOE><THONGTINHOSO><MA>123</MA></THONGTINHOSO><CHUKYDONVI><CKS_NGUOI_KET_LUAN/><CKS_BENH_VIEN/></CHUKYDONVI></KHAMSUCKHOE>'
    state, digest = prepare_external_xmldsig(source, certificate, [])
    raw = key.sign(digest, padding.PKCS1v15(), utils.Prehashed(hashes.SHA256()))
    signed = complete_external_xmldsig(state, base64.b64encode(raw).decode())
    verify_xmldsig(signed)
    root = etree.fromstring(signed)
    assert len(root.xpath('.//ds:Signature', namespaces={'ds': DS})) == 1
    assert root.xpath('local-name(.//ds:Signature/parent::*)', namespaces={'ds': DS}) == 'CKS_BENH_VIEN'


def test_xmldsig_rejects_tampered_xml():
    key, certificate = certificate_fixture()
    source = b'<KHAMSUCKHOE><MA>123</MA><CHUKYDONVI><CKS_BENH_VIEN/></CHUKYDONVI></KHAMSUCKHOE>'
    state, digest = prepare_external_xmldsig(source, certificate, [])
    raw = key.sign(digest, padding.PKCS1v15(), utils.Prehashed(hashes.SHA256()))
    signed = complete_external_xmldsig(state, base64.b64encode(raw).decode()).replace(b'<MA>123</MA>', b'<MA>999</MA>')
    with pytest.raises(ValueError, match='digest mismatch'):
        verify_xmldsig(signed)


def test_xmldsig_rejects_wrong_signature_and_unsafe_xml():
    _, certificate = certificate_fixture()
    source = b'<KHAMSUCKHOE><CHUKYDONVI><CKS_BENH_VIEN/></CHUKYDONVI></KHAMSUCKHOE>'
    state, _ = prepare_external_xmldsig(source, certificate, [])
    with pytest.raises(ValueError, match='does not match'):
        complete_external_xmldsig(state, base64.b64encode(b'x' * 256).decode())
    with pytest.raises(ValueError, match='forbidden'):
        prepare_external_xmldsig(b'<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><x><CKS_BENH_VIEN/></x>', certificate, [])


def test_xmldsig_http_contract_is_idempotent():
    key, certificate = certificate_fixture()
    client = TestClient(app)
    source = b'<KHAMSUCKHOE><CHUKYDONVI><CKS_BENH_VIEN/></CHUKYDONVI></KHAMSUCKHOE>'
    prepared = client.post('/v1/xml-dsig/prepare', json={'xml_base64': base64.b64encode(source).decode(), 'certificate_base64': certificate}).json()
    digest = base64.b64decode(prepared['hash_base64'])
    signature = base64.b64encode(key.sign(digest, padding.PKCS1v15(), utils.Prehashed(hashes.SHA256()))).decode()
    first = client.post('/v1/xml-dsig/complete', json={'transaction_id': prepared['transaction_id'], 'raw_signature_base64': signature})
    second = client.post('/v1/xml-dsig/complete', json={'transaction_id': prepared['transaction_id'], 'raw_signature_base64': signature})
    assert first.status_code == 200
    assert second.json() == first.json()
    verify_xmldsig(base64.b64decode(first.json()['xml_base64']))
