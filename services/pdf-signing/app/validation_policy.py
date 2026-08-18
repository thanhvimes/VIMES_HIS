"""Production trust, timestamp and revocation policy for PAdES validation."""
import os
from pathlib import Path
from urllib.parse import urlparse

from pyhanko.keys import load_certs_from_pemder
from pyhanko_certvalidator import ValidationContext


def is_production() -> bool:
    return os.getenv("NODE_ENV", "development").lower() == "production"


def _https_url(name: str) -> str:
    value = os.getenv(name, "").strip()
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc:
        raise RuntimeError(f"{name} must be an approved HTTPS endpoint")
    return value


def trust_roots() -> list:
    directory = Path(os.getenv("SIGNING_TRUST_ROOTS_DIR", "/run/trust-roots"))
    files = sorted(path for path in directory.glob("*") if path.suffix.lower() in {".pem", ".cer", ".crt", ".der"}) if directory.is_dir() else []
    if not files:
        raise RuntimeError("No approved signing trust roots are configured")
    roots = list(load_certs_from_pemder([str(path) for path in files]))
    if not roots:
        raise RuntimeError("Approved signing trust roots could not be loaded")
    return roots


def assert_production_policy() -> None:
    if not is_production():
        return
    if os.getenv("SIGNING_PROFILE") != "PAdES-B-T":
        raise RuntimeError("Production SIGNING_PROFILE must be PAdES-B-T")
    _https_url("SIGNING_TSA_URL")
    _https_url("SIGNING_OCSP_URL")
    _https_url("SIGNING_CRL_URL")
    if os.getenv("SIGNING_REVOCATION_MODE", "hard-fail") != "hard-fail":
        raise RuntimeError("Production revocation policy must be hard-fail")
    trust_roots()


def validation_context(signing_cert, other_certs):
    if not is_production():
        return ValidationContext(trust_roots=[signing_cert], other_certs=other_certs, allow_fetching=False)
    assert_production_policy()
    return ValidationContext(
        trust_roots=trust_roots(), other_certs=other_certs,
        allow_fetching=True, revocation_mode="hard-fail",
        weak_hash_algos={"md2", "md5", "sha1"},
    )
