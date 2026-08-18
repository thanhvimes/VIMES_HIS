import hashlib
import os
import secrets
import time
import threading
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException, Response, Request
from pydantic import BaseModel, Field
from .pades_provider import PadesProvider
from .external_pades import prepare_external_pades, complete_external_pades
from .external_xmldsig import prepare_external_xmldsig, complete_external_xmldsig
from .validation_policy import assert_production_policy

app = FastAPI(title="VIMES PDF Signing Service", version=os.getenv("SIGNING_SERVICE_VERSION", "0.1.0"))
transactions: dict[str, dict[str, Any]] = {}
idempotency_results: dict[str, dict[str, Any]] = {}
idempotency_created_at: dict[str, float] = {}
metrics = {"sign_requests_total": 0, "sign_success_total": 0, "sign_errors_total": 0, "sign_rejected_size_total": 0, "sign_rejected_concurrency_total": 0, "sign_duration_ms_total": 0.0, "sign_duration_samples": 0}
signing_capacity = int(os.getenv("SIGNING_MAX_CONCURRENCY", "4"))
signing_slots = threading.BoundedSemaphore(signing_capacity)

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or secrets.token_urlsafe(16)
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


class PrepareRequest(BaseModel):
    document_sha256: str = Field(pattern=r"^[a-fA-F0-9]{64}$")
    page_index: int = Field(ge=0)
    x1_pt: float = Field(ge=0)
    y1_pt: float = Field(ge=0)
    x2_pt: float = Field(gt=0)
    y2_pt: float = Field(gt=0)
    field_name: str | None = None
    appearance: dict[str, Any] = Field(default_factory=dict)
    profile: str = Field(default="PAdES-B-T", pattern=r"^PAdES-B-(B|T|LT|LTA)$")


class CompleteRequest(BaseModel):
    transaction_id: str
    cms_signature_base64: str = Field(min_length=1)

class ExternalPrepareRequest(BaseModel):
    pdf_base64: str = Field(min_length=1)
    certificate_base64: str = Field(min_length=1)
    certificate_chain_base64: list[str] = Field(default_factory=list, max_length=10)
    field_name: str = Field(default="Signature", min_length=1, max_length=150)
    page_index: int = Field(ge=0)
    x1_pt: float = Field(ge=0)
    y1_pt: float = Field(ge=0)
    x2_pt: float = Field(gt=0)
    y2_pt: float = Field(gt=0)
    reason: str | None = None
    profile: str = Field(default="PAdES-B-B", pattern=r"^PAdES-B-(B|T)$")

class ExternalCompleteRequest(BaseModel):
    transaction_id: str = Field(min_length=16, max_length=128)
    raw_signature_base64: str = Field(min_length=1)

class XmlDsigPrepareRequest(BaseModel):
    xml_base64: str = Field(min_length=1)
    certificate_base64: str = Field(min_length=1)
    certificate_chain_base64: list[str] = Field(default_factory=list, max_length=10)
    signature_container_xpath: str = Field(default="//*[local-name()='CKS_BENH_VIEN']", min_length=1, max_length=300)

class XmlDsigCompleteRequest(BaseModel):
    transaction_id: str = Field(min_length=16, max_length=128)
    raw_signature_base64: str = Field(min_length=1)

class SignPdfRequest(BaseModel):
    pdf_base64: str = Field(min_length=1)
    field_name: str = Field(default="Signature", min_length=1, max_length=150)
    page_index: int = Field(ge=0)
    x1_pt: float = Field(ge=0)
    y1_pt: float = Field(ge=0)
    x2_pt: float = Field(gt=0)
    y2_pt: float = Field(gt=0)
    reason: str | None = None


@app.get("/")
def health():
    return {"status": "ok", "service": "pdf-signing", "version": app.version}


@app.get("/ready")
def readiness():
    provider = os.getenv("SIGNING_PROVIDER", "test").lower()
    supported = {"test", "pkcs12", "local-agent"}
    planned = {"pkcs11", "remote-ca"}
    if provider not in supported | planned:
        raise HTTPException(status_code=503, detail="Unsupported SIGNING_PROVIDER")
    if os.getenv("NODE_ENV", "development") == "production" and provider == "test":
        raise HTTPException(status_code=503, detail="Test signing provider is forbidden in production")
    if provider in planned:
        raise HTTPException(status_code=503, detail="Signing provider adapter is not installed")
    try:
        assert_production_policy()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if provider == "pkcs12":
        pfx_path = os.getenv("SIGNING_PFX_PATH", "/run/secrets/signing.pfx")
        if not os.path.isfile(pfx_path):
            raise HTTPException(status_code=503, detail="PKCS#12 signing certificate is unavailable")
        try:
            certificate = PadesProvider().certificate()
            expiry = datetime.fromisoformat(certificate.not_after.replace("Z", "+00:00"))
            if expiry <= datetime.now(timezone.utc):
                raise HTTPException(status_code=503, detail="Signing certificate is expired")
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Signing certificate metadata unavailable") from exc
    return {"ready": True, "provider": provider, "profile": os.getenv("SIGNING_PROFILE", "PAdES-B-T")}

@app.get("/metrics")
def metrics_endpoint():
    samples = metrics["sign_duration_samples"]
    average = metrics["sign_duration_ms_total"] / samples if samples else 0.0
    return {**metrics, "sign_duration_ms_avg": round(average, 2), "provider": os.getenv("SIGNING_PROVIDER", "test"), "profile": os.getenv("SIGNING_PROFILE", "PAdES-B-T")}

@app.get("/metrics/prometheus")
def prometheus_metrics():
    samples = metrics["sign_duration_samples"]
    average = metrics["sign_duration_ms_total"] / samples if samples else 0.0
    cert_days = -1
    if os.getenv("SIGNING_PROVIDER", "test").lower() == "pkcs12":
        try:
            cert = PadesProvider().certificate()
            expiry = datetime.fromisoformat(cert.not_after.replace("Z", "+00:00"))
            cert_days = max(0, (expiry - datetime.now(timezone.utc)).days)
        except Exception:
            cert_days = -1
    body = "\n".join([
        f"vimes_sign_requests_total {metrics['sign_requests_total']}",
        f"vimes_sign_success_total {metrics['sign_success_total']}",
        f"vimes_sign_errors_total {metrics['sign_errors_total']}",
        f"vimes_sign_rejected_size_total {metrics['sign_rejected_size_total']}",
        f"vimes_sign_rejected_concurrency_total {metrics['sign_rejected_concurrency_total']}",
        f"vimes_signing_max_concurrency {signing_capacity}",
        f"vimes_sign_duration_ms_avg {average:.2f}",
        f"vimes_signing_certificate_expires_in_days {cert_days}",
    ]) + "\n"
    return Response(content=body, media_type="text/plain; version=0.0.4")

@app.get("/v1/provider-info")
def provider_info():
    provider = os.getenv("SIGNING_PROVIDER", "test").lower()
    if provider == "test":
        return {"provider": "test", "certificate": None, "warning": "Test provider has no production certificate"}
    if provider == "local-agent":
        return {"provider": "local-agent", "certificate": "selected-per-transaction", "profile": os.getenv("SIGNING_PROFILE", "PAdES-B-B"), "trust_policy": "configured" if os.getenv("NODE_ENV") == "production" else "development"}
    try:
        from .pades_provider import PadesProvider
        cert = PadesProvider().certificate()
        expiry = datetime.fromisoformat(cert.not_after.replace("Z", "+00:00"))
        days = max(0, (expiry - datetime.now(timezone.utc)).days)
        warning = "CERTIFICATE_EXPIRING_SOON" if days <= 30 else None
        return {"provider": provider, "certificate": cert.__dict__, "expires_in_days": days, "warning": warning}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Provider certificate metadata unavailable") from exc


@app.post("/v1/prepare")
def prepare(request: PrepareRequest):
    if request.x2_pt <= request.x1_pt or request.y2_pt <= request.y1_pt:
        raise HTTPException(status_code=422, detail="Invalid signature rectangle")
    transaction_id = secrets.token_urlsafe(24)
    digest = hashlib.sha256((request.document_sha256 + transaction_id).encode()).hexdigest()
    transactions[transaction_id] = {"request": request.model_dump(), "digest": digest, "created_at": time.time(), "status": "PREPARED"}
    return {"transaction_id": transaction_id, "digest_sha256": digest, "algorithm": "SHA-256", "profile": request.profile, "expires_in": 300}


@app.post("/v1/complete")
def complete(request: CompleteRequest):
    transaction = transactions.get(request.transaction_id)
    if not transaction or time.time() - transaction["created_at"] > 300:
        raise HTTPException(status_code=409, detail="Signing transaction expired or not found")
    if transaction["status"] != "PREPARED":
        raise HTTPException(status_code=409, detail="Signing transaction already completed")
    # CMS verification and pyHanko incremental PDF write are intentionally delegated
    # to the provider adapter in the next implementation step.
    transaction["status"] = "AUTHORIZED"
    transaction["cms_signature_sha256"] = hashlib.sha256(request.cms_signature_base64.encode()).hexdigest()
    transaction["cms_signature_bytes"] = len(request.cms_signature_base64)
    return {"transaction_id": request.transaction_id, "status": transaction["status"], "next": "provider-adapter"}


@app.post("/v1/external/prepare")
async def external_prepare(request: ExternalPrepareRequest):
    import base64
    if request.x2_pt <= request.x1_pt or request.y2_pt <= request.y1_pt:
        raise HTTPException(status_code=422, detail="Invalid signature rectangle")
    try:
        source = base64.b64decode(request.pdf_base64, validate=True)
        max_bytes = int(os.getenv("SIGNING_MAX_PDF_BYTES", str(25 * 1024 * 1024)))
        if len(source) > max_bytes:
            raise HTTPException(status_code=413, detail="PDF exceeds configured signing size limit")
        timestamper = PadesProvider().timestamper()
        state, digest = await prepare_external_pades(
            source, request.certificate_base64, request.certificate_chain_base64,
            request.field_name, request.page_index,
            (request.x1_pt, request.y1_pt, request.x2_pt, request.y2_pt),
            request.profile, request.reason, timestamper,
        )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    transaction_id = secrets.token_urlsafe(24)
    transactions[transaction_id] = {
        "external_state": state,
        "digest_sha256": digest.hex(),
        "created_at": time.time(),
        "status": "PREPARED_EXTERNAL",
    }
    return {
        "transaction_id": transaction_id,
        "hash_base64": base64.b64encode(digest).decode(),
        "hash_algorithm": "SHA256",
        "profile": request.profile,
        "expires_in": 300,
    }


@app.post("/v1/external/complete")
async def external_complete(request: ExternalCompleteRequest):
    import base64
    transaction = transactions.get(request.transaction_id)
    if not transaction or time.time() - transaction["created_at"] > 300:
        raise HTTPException(status_code=409, detail="Signing transaction expired or not found")
    if transaction["status"] == "COMPLETED_EXTERNAL":
        return transaction["result"]
    if transaction["status"] != "PREPARED_EXTERNAL":
        raise HTTPException(status_code=409, detail="Signing transaction is not completable")
    try:
        timestamper = PadesProvider().timestamper()
        result_pdf = await complete_external_pades(transaction["external_state"], request.raw_signature_base64, timestamper)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail="External signature could not be embedded") from exc
    result = {
        "transaction_id": request.transaction_id,
        "pdf_base64": base64.b64encode(result_pdf).decode(),
        "pdf_sha256": hashlib.sha256(result_pdf).hexdigest(),
        "profile": transaction["external_state"].profile,
        "status": "COMPLETED",
    }
    transaction["status"] = "COMPLETED_EXTERNAL"
    transaction["raw_signature_sha256"] = hashlib.sha256(request.raw_signature_base64.encode()).hexdigest()
    transaction["result"] = result
    return result

@app.post("/v1/xml-dsig/prepare")
def xml_dsig_prepare(request: XmlDsigPrepareRequest):
    import base64
    try:
        source = base64.b64decode(request.xml_base64, validate=True)
        state, digest = prepare_external_xmldsig(source, request.certificate_base64, request.certificate_chain_base64, request.signature_container_xpath)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    transaction_id = secrets.token_urlsafe(24)
    transactions[transaction_id] = {"xml_dsig_state": state, "created_at": time.time(), "status": "PREPARED_XMLDSIG"}
    return {"transaction_id": transaction_id, "hash_base64": base64.b64encode(digest).decode(), "hash_algorithm": "SHA256", "profile": "XMLDSig-enveloped", "expires_in": 300}

@app.post("/v1/xml-dsig/complete")
def xml_dsig_complete(request: XmlDsigCompleteRequest):
    import base64
    transaction = transactions.get(request.transaction_id)
    if not transaction or time.time() - transaction["created_at"] > 300:
        raise HTTPException(status_code=409, detail="Signing transaction expired or not found")
    if transaction["status"] == "COMPLETED_XMLDSIG":
        return transaction["result"]
    if transaction["status"] != "PREPARED_XMLDSIG":
        raise HTTPException(status_code=409, detail="Signing transaction is not completable")
    try:
        signed_xml = complete_external_xmldsig(transaction["xml_dsig_state"], request.raw_signature_base64)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    result = {"transaction_id": request.transaction_id, "xml_base64": base64.b64encode(signed_xml).decode(), "xml_sha256": hashlib.sha256(signed_xml).hexdigest(), "profile": "XMLDSig-enveloped", "status": "COMPLETED"}
    transaction["status"] = "COMPLETED_XMLDSIG"
    transaction["result"] = result
    return result

@app.post("/v1/sign-pdf")
def sign_pdf(request: SignPdfRequest, raw_request: Request):
    import base64
    idempotency_key = raw_request.headers.get("x-idempotency-key")
    if idempotency_key and len(idempotency_key) > 128:
        raise HTTPException(status_code=422, detail="X-Idempotency-Key exceeds 128 characters")
    now = time.time()
    ttl = int(os.getenv("SIGNING_IDEMPOTENCY_TTL_SECONDS", "900"))
    if idempotency_key:
        for key, created in list(idempotency_created_at.items()):
            if now - created > ttl:
                idempotency_created_at.pop(key, None)
                idempotency_results.pop(key, None)
    if idempotency_key and idempotency_key in idempotency_results:
        return idempotency_results[idempotency_key]
    started = time.perf_counter()
    metrics["sign_requests_total"] += 1
    if not signing_slots.acquire(blocking=False):
        metrics["sign_errors_total"] += 1
        metrics["sign_rejected_concurrency_total"] += 1
        raise HTTPException(status_code=429, detail="Signing concurrency limit reached")
    try:
        result = _sign_pdf_with_slot(request, started)
        if idempotency_key:
            idempotency_results[idempotency_key] = result
            idempotency_created_at[idempotency_key] = now
        return result
    finally:
        signing_slots.release()

def _sign_pdf_with_slot(request: SignPdfRequest, started: float):
    import base64
    if os.getenv("SIGNING_PROVIDER", "test").lower() == "test":
        raise HTTPException(status_code=503, detail="Test provider does not sign production PDFs")
    if request.x2_pt <= request.x1_pt or request.y2_pt <= request.y1_pt:
        raise HTTPException(status_code=422, detail="Invalid signature rectangle")
    try:
        source = base64.b64decode(request.pdf_base64, validate=True)
        max_bytes = int(os.getenv("SIGNING_MAX_PDF_BYTES", str(25 * 1024 * 1024)))
        if len(source) > max_bytes:
            metrics["sign_rejected_size_total"] += 1
            raise HTTPException(status_code=413, detail="PDF exceeds configured signing size limit")
        result = PadesProvider().sign_pdf(source, request.field_name, request.page_index, (request.x1_pt, request.y1_pt, request.x2_pt, request.y2_pt), request.reason)
        max_output_bytes = int(os.getenv("SIGNING_MAX_OUTPUT_BYTES", str(30 * 1024 * 1024)))
        if len(result) > max_output_bytes:
            metrics["sign_rejected_size_total"] += 1
            raise HTTPException(status_code=413, detail="Signed PDF exceeds configured output size limit")
        metrics["sign_success_total"] += 1
        metrics["sign_duration_ms_total"] += (time.perf_counter() - started) * 1000
        metrics["sign_duration_samples"] += 1
        return {"pdf_base64": base64.b64encode(result).decode(), "profile": "PAdES-B-T"}
    except HTTPException:
        raise
    except ValueError as exc:
        metrics["sign_errors_total"] += 1
        raise HTTPException(status_code=422, detail="Invalid PDF base64 payload") from exc
    except (KeyError, FileNotFoundError) as exc:
        raise HTTPException(status_code=503, detail="Signing provider is not configured") from exc
