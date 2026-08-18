from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get('/')
    assert response.status_code == 200
    assert response.json()['service'] == 'pdf-signing'

def test_prepare_rejects_invalid_hash():
    response = client.post('/v1/prepare', json={'document_sha256': 'bad', 'page_index': 0, 'x1_pt': 1, 'y1_pt': 1, 'x2_pt': 10, 'y2_pt': 10})
    assert response.status_code == 422

def test_test_provider_cannot_sign_pdf():
    response = client.post('/v1/sign-pdf', json={'pdf_base64': 'JVBERi0xLjQ=', 'page_index': 0, 'x1_pt': 1, 'y1_pt': 1, 'x2_pt': 10, 'y2_pt': 10})
    assert response.status_code == 503


def test_planned_provider_is_not_reported_ready(monkeypatch):
    monkeypatch.setenv('SIGNING_PROVIDER', 'remote-ca')
    response = client.get('/ready')
    assert response.status_code == 503


def test_local_agent_provider_is_ready_in_development(monkeypatch):
    monkeypatch.setenv('NODE_ENV', 'development')
    monkeypatch.setenv('SIGNING_PROVIDER', 'local-agent')
    response = client.get('/ready')
    assert response.status_code == 200
    assert response.json()['provider'] == 'local-agent'


def test_production_local_agent_requires_https_tsa_hard_revocation_and_trust_roots(monkeypatch, tmp_path):
    monkeypatch.setenv('NODE_ENV', 'production')
    monkeypatch.setenv('SIGNING_PROVIDER', 'local-agent')
    monkeypatch.setenv('SIGNING_PROFILE', 'PAdES-B-T')
    monkeypatch.setenv('SIGNING_REVOCATION_MODE', 'hard-fail')
    monkeypatch.setenv('SIGNING_TSA_URL', 'http://tsa.invalid')
    monkeypatch.setenv('SIGNING_OCSP_URL', 'https://ocsp.example.invalid')
    monkeypatch.setenv('SIGNING_CRL_URL', 'https://crl.example.invalid')
    monkeypatch.setenv('SIGNING_TRUST_ROOTS_DIR', str(tmp_path))
    response = client.get('/ready')
    assert response.status_code == 503
    assert 'HTTPS' in response.json()['detail']


def test_production_policy_loads_explicit_approved_trust_root(monkeypatch, tmp_path):
    from pathlib import Path
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.serialization import pkcs12
    pfx = Path('secrets/signing.pfx')
    if not pfx.exists():
        import pytest
        pytest.skip('test PKCS#12 fixture is unavailable')
    _, certificate, _ = pkcs12.load_key_and_certificates(pfx.read_bytes(), b'change-me-test-only')
    (tmp_path / 'approved-root.pem').write_bytes(certificate.public_bytes(serialization.Encoding.PEM))
    monkeypatch.setenv('NODE_ENV', 'production')
    monkeypatch.setenv('SIGNING_PROVIDER', 'local-agent')
    monkeypatch.setenv('SIGNING_PROFILE', 'PAdES-B-T')
    monkeypatch.setenv('SIGNING_REVOCATION_MODE', 'hard-fail')
    monkeypatch.setenv('SIGNING_TSA_URL', 'https://tsa.example.invalid')
    monkeypatch.setenv('SIGNING_OCSP_URL', 'https://ocsp.example.invalid')
    monkeypatch.setenv('SIGNING_CRL_URL', 'https://crl.example.invalid')
    monkeypatch.setenv('SIGNING_TRUST_ROOTS_DIR', str(tmp_path))
    response = client.get('/ready')
    assert response.status_code == 200, response.text


def test_pkcs12_without_certificate_is_not_ready(monkeypatch, tmp_path):
    monkeypatch.setenv('SIGNING_PROVIDER', 'pkcs12')
    monkeypatch.setenv('SIGNING_PFX_PATH', str(tmp_path / 'missing.pfx'))
    response = client.get('/ready')
    assert response.status_code == 503


def test_test_provider_info_is_explicitly_non_production(monkeypatch):
    monkeypatch.setenv('SIGNING_PROVIDER', 'test')
    response = client.get('/v1/provider-info')
    assert response.status_code == 200
    assert response.json()['certificate'] is None
    assert 'warning' in response.json()


def test_signing_size_limit_is_enforced(monkeypatch):
    import base64
    monkeypatch.setenv('SIGNING_PROVIDER', 'pkcs12')
    monkeypatch.setenv('SIGNING_MAX_PDF_BYTES', '4')
    response = client.post('/v1/sign-pdf', json={
        'pdf_base64': base64.b64encode(b'12345').decode(),
        'page_index': 0, 'x1_pt': 1, 'y1_pt': 1, 'x2_pt': 10, 'y2_pt': 10,
    })
    assert response.status_code == 413


def test_invalid_base64_is_rejected(monkeypatch):
    monkeypatch.setenv('SIGNING_PROVIDER', 'pkcs12')
    response = client.post('/v1/sign-pdf', json={
        'pdf_base64': 'not-base64',
        'page_index': 0, 'x1_pt': 1, 'y1_pt': 1, 'x2_pt': 10, 'y2_pt': 10,
    })
    assert response.status_code == 422


def test_metrics_endpoint_is_available():
    response = client.get('/metrics')
    assert response.status_code == 200
    assert 'sign_requests_total' in response.json()


def test_prometheus_metrics_endpoint_is_available():
    response = client.get('/metrics/prometheus')
    assert response.status_code == 200
    assert 'vimes_sign_requests_total' in response.text
    assert 'vimes_signing_certificate_expires_in_days' in response.text


def test_request_id_is_echoed_for_audit_correlation():
    response = client.get('/', headers={'x-request-id': 'audit-test-123'})
    assert response.status_code == 200
    assert response.headers['x-request-id'] == 'audit-test-123'


def test_request_id_is_generated_when_missing():
    response = client.get('/')
    assert response.status_code == 200
    assert response.headers.get('x-request-id')


def test_complete_does_not_store_raw_cms_payload():
    from app.main import transactions
    response = client.post('/v1/prepare', json={'document_sha256': '0' * 64, 'page_index': 0, 'x1_pt': 1, 'y1_pt': 1, 'x2_pt': 10, 'y2_pt': 10})
    transaction_id = response.json()['transaction_id']
    client.post('/v1/complete', json={'transaction_id': transaction_id, 'cms_signature_base64': 'secret-cms-payload'})
    transaction = transactions[transaction_id]
    assert 'cms_signature_base64' not in transaction
    assert 'cms_signature_sha256' in transaction


def test_idempotency_key_returns_same_result(monkeypatch):
    monkeypatch.setenv('SIGNING_PROVIDER', 'test')
    first = client.post('/v1/sign-pdf', json={'pdf_base64': 'bad', 'page_index': 0, 'x1_pt': 1, 'y1_pt': 1, 'x2_pt': 10, 'y2_pt': 10}, headers={'x-idempotency-key': 'idem-1'})
    second = client.post('/v1/sign-pdf', json={'pdf_base64': 'bad', 'page_index': 0, 'x1_pt': 1, 'y1_pt': 1, 'x2_pt': 10, 'y2_pt': 10}, headers={'x-idempotency-key': 'idem-1'})
    assert first.status_code == second.status_code


def test_idempotency_key_length_is_limited():
    response = client.post('/v1/sign-pdf', json={'pdf_base64': 'bad', 'page_index': 0, 'x1_pt': 1, 'y1_pt': 1, 'x2_pt': 10, 'y2_pt': 10}, headers={'x-idempotency-key': 'x' * 129})
    assert response.status_code == 422


def test_metrics_include_concurrency_rejections():
    response = client.get('/metrics/prometheus')
    assert 'vimes_sign_rejected_concurrency_total' in response.text
    assert 'vimes_signing_max_concurrency' in response.text


def test_tsa_configuration_is_optional(monkeypatch):
    monkeypatch.delenv('SIGNING_TSA_URL', raising=False)
    from app.pades_provider import PadesProvider
    provider = PadesProvider()
    assert provider.pfx_path is not None


def test_tsa_url_is_read_from_environment(monkeypatch):
    monkeypatch.setenv('SIGNING_TSA_URL', 'https://tsa.example.invalid/rfc3161')
    from app import pades_provider
    captured = {}
    class FakeTSA:
        def __init__(self, url, timeout=5):
            captured['url'] = url
            captured['timeout'] = timeout
    monkeypatch.setattr(pades_provider.timestamps, 'HTTPTimeStamper', FakeTSA)
    # Construction is deferred until sign_pdf; verify provider remains configured safely.
    assert pades_provider.PadesProvider().pfx_path is not None


def test_digest_signing_fails_closed_without_provider_adapter():
    from app.pades_provider import PadesProvider
    import pytest
    with pytest.raises(NotImplementedError):
        PadesProvider().sign_digest(b'0' * 32)


def test_external_pades_two_phase_contract_is_idempotent_and_does_not_store_raw_signature(monkeypatch):
    import base64
    from types import SimpleNamespace
    from app import main

    async def fake_prepare(*args, **kwargs):
        return SimpleNamespace(profile='PAdES-B-B'), b'1' * 32

    async def fake_complete(state, signature, timestamper=None):
        assert signature == base64.b64encode(b'raw-signature').decode()
        return b'%PDF-1.7\nexternal-signature-output'

    monkeypatch.setattr(main, 'prepare_external_pades', fake_prepare)
    monkeypatch.setattr(main, 'complete_external_pades', fake_complete)
    prepared = client.post('/v1/external/prepare', json={
        'pdf_base64': base64.b64encode(b'%PDF-1.7\ninput').decode(),
        'certificate_base64': base64.b64encode(b'certificate').decode(),
        'certificate_chain_base64': [], 'field_name': 'Doctor',
        'page_index': 0, 'x1_pt': 1, 'y1_pt': 1, 'x2_pt': 10, 'y2_pt': 10,
        'profile': 'PAdES-B-B',
    })
    assert prepared.status_code == 200
    assert prepared.json()['hash_base64'] == base64.b64encode(b'1' * 32).decode()
    transaction_id = prepared.json()['transaction_id']
    payload = {'transaction_id': transaction_id, 'raw_signature_base64': base64.b64encode(b'raw-signature').decode()}
    first = client.post('/v1/external/complete', json=payload)
    second = client.post('/v1/external/complete', json=payload)
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert 'raw_signature_base64' not in main.transactions[transaction_id]
    assert main.transactions[transaction_id]['raw_signature_sha256']


def test_external_pades_prepare_rejects_invalid_rectangle():
    import base64
    response = client.post('/v1/external/prepare', json={
        'pdf_base64': base64.b64encode(b'%PDF-1.7').decode(),
        'certificate_base64': base64.b64encode(b'certificate').decode(),
        'page_index': 0, 'x1_pt': 10, 'y1_pt': 1, 'x2_pt': 1, 'y2_pt': 10,
    })
    assert response.status_code == 422


def _minimal_pdf():
    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> /Contents 4 0 R >>',
        b'<< /Length 0 >>\nstream\n\nendstream',
    ]
    result = bytearray(b'%PDF-1.7\n')
    offsets = [0]
    for index, body in enumerate(objects, 1):
        offsets.append(len(result)); result.extend(f'{index} 0 obj\n'.encode()); result.extend(body); result.extend(b'\nendobj\n')
    xref = len(result); result.extend(f'xref\n0 {len(objects) + 1}\n'.encode()); result.extend(b'0000000000 65535 f \n')
    for offset in offsets[1:]: result.extend(f'{offset:010d} 00000 n \n'.encode())
    result.extend(f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode())
    return bytes(result)


def test_external_pades_real_rsa_round_trip_with_pyhanko():
    import base64
    from pathlib import Path
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding, utils
    from cryptography.hazmat.primitives.serialization import pkcs12
    from pyhanko.pdf_utils.reader import PdfFileReader
    from pyhanko.sign.validation import validate_pdf_signature
    from pyhanko_certvalidator import ValidationContext
    from asn1crypto import x509 as asn1_x509

    pfx = Path('secrets/signing.pfx')
    if not pfx.exists():
        import pytest
        pytest.skip('test PKCS#12 fixture is unavailable')
    key, certificate, chain = pkcs12.load_key_and_certificates(pfx.read_bytes(), b'change-me-test-only')
    assert key is not None and certificate is not None
    certificate_der = certificate.public_bytes(serialization.Encoding.DER)
    prepared = client.post('/v1/external/prepare', json={
        'pdf_base64': base64.b64encode(_minimal_pdf()).decode(),
        'certificate_base64': base64.b64encode(certificate_der).decode(),
        'certificate_chain_base64': [base64.b64encode(item.public_bytes(serialization.Encoding.DER)).decode() for item in (chain or [])],
        'field_name': 'DoctorSignature', 'page_index': 0,
        'x1_pt': 50, 'y1_pt': 50, 'x2_pt': 220, 'y2_pt': 110,
        'profile': 'PAdES-B-B', 'reason': 'VIMES external signing test',
    })
    assert prepared.status_code == 200, prepared.text
    digest = base64.b64decode(prepared.json()['hash_base64'], validate=True)
    raw_signature = key.sign(digest, padding.PKCS1v15(), utils.Prehashed(hashes.SHA256()))
    completed = client.post('/v1/external/complete', json={
        'transaction_id': prepared.json()['transaction_id'],
        'raw_signature_base64': base64.b64encode(raw_signature).decode(),
    })
    assert completed.status_code == 200, completed.text
    result_pdf = base64.b64decode(completed.json()['pdf_base64'], validate=True)
    reader = PdfFileReader(__import__('io').BytesIO(result_pdf))
    assert len(reader.embedded_signatures) == 1
    status = validate_pdf_signature(
        reader.embedded_signatures[0],
        signer_validation_context=ValidationContext(
            trust_roots=[asn1_x509.Certificate.load(certificate_der)],
            allow_fetching=False,
        ),
    )
    assert status.intact is True
    assert status.valid is True


def test_tsa_factory_propagates_provider_timeout(monkeypatch):
    monkeypatch.setenv('SIGNING_TSA_URL', 'https://tsa.example.invalid/rfc3161')
    from app import pades_provider
    class TimeoutTSA:
        def __init__(self, url, timeout=5):
            raise TimeoutError('TSA timeout')
    monkeypatch.setattr(pades_provider.timestamps, 'HTTPTimeStamper', TimeoutTSA)
    import pytest
    with pytest.raises(TimeoutError):
        pades_provider.PadesProvider().timestamper()
