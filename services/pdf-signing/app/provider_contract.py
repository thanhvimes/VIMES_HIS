from dataclasses import dataclass
from typing import Protocol

@dataclass(frozen=True)
class SignerCertificate:
    subject: str
    issuer: str
    serial: str
    not_after: str
    key_id: str

class SignatureProvider(Protocol):
    def certificate(self) -> SignerCertificate: ...
    def sign_digest(self, digest: bytes) -> bytes: ...

class ProviderConfigurationError(RuntimeError):
    pass
