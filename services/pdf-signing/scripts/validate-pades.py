"""Validate a PDF signature and optionally assert a tamper fixture is invalid.

Usage in the signing image:
  python scripts/validate-pades.py signed.pdf --pfx secrets/signing.pfx --password change-me-test-only
  python scripts/validate-pades.py tampered.pdf --pfx secrets/signing.pfx --password change-me-test-only --expect-invalid
"""
from __future__ import annotations

import argparse
from pathlib import Path

from asn1crypto import x509
from cryptography.hazmat.primitives.serialization import Encoding, pkcs12
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign.validation import validate_pdf_signature
from pyhanko_certvalidator import ValidationContext


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--pfx", type=Path)
    parser.add_argument("--password", default="")
    parser.add_argument("--expect-invalid", action="store_true")
    args = parser.parse_args()

    trust = None
    if args.pfx:
        _, cert, _ = pkcs12.load_key_and_certificates(
            args.pfx.read_bytes(), args.password.encode()
        )
        if cert is None:
            raise SystemExit("PFX does not contain a certificate")
        trust = ValidationContext(
            trust_roots=[x509.Certificate.load(cert.public_bytes(Encoding.DER))]
        )

    with args.pdf.open("rb") as stream:
        reader = PdfFileReader(stream)
        signatures = reader.embedded_regular_signatures
        if not signatures:
            raise SystemExit("No embedded PDF signature found")
        status = validate_pdf_signature(
            signatures[0], signer_validation_context=trust, skip_diff=False
        )

    valid = bool(status.bottom_line)
    print(status.pretty_print_details())
    if args.expect_invalid:
        return 0 if not valid else 1
    return 0 if valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
