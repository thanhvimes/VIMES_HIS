using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Vimes.Agent.Contracts;

namespace Vimes.Agent.Signing;

public sealed class SigningException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

public interface ISigningProvider
{
    SigningProviderInfo Info { get; }
    IReadOnlyList<SigningCertificateInfo> ListCertificates();
    SignHashResult SignHash(SignHashRequest request, DateTimeOffset? now = null);
}

public interface IPkcs11SigningProvider : ISigningProvider { }
public interface IRemoteHsmSigningProvider : ISigningProvider { }

public sealed class WindowsCertificateSigningProvider : ISigningProvider
{
    public SigningProviderInfo Info { get; } = new(
        "windows-certificate-store", "Windows Certificate Store / USB Token", "1.0", "available",
        ["RSA", "ECDSA"], ["SHA256", "SHA384", "SHA512"], true);

    public IReadOnlyList<SigningCertificateInfo> ListCertificates()
    {
        using var store = new X509Store(StoreName.My, StoreLocation.CurrentUser);
        store.Open(OpenFlags.ReadOnly | OpenFlags.OpenExistingOnly);
        return store.Certificates.Cast<X509Certificate2>()
            .Where(certificate => certificate.HasPrivateKey && SupportsDigitalSignature(certificate))
            .Select(ToInfo)
            .OrderByDescending(certificate => certificate.IsValidNow)
            .ThenByDescending(certificate => certificate.NotAfter)
            .ToArray();
    }

    public SignHashResult SignHash(SignHashRequest request, DateTimeOffset? now = null)
    {
        ValidateRequest(request, now ?? DateTimeOffset.UtcNow);
        using var store = new X509Store(StoreName.My, StoreLocation.CurrentUser);
        store.Open(OpenFlags.ReadOnly | OpenFlags.OpenExistingOnly);
        var thumbprint = NormalizeThumbprint(request.CertificateThumbprint);
        var certificate = store.Certificates.Cast<X509Certificate2>()
            .FirstOrDefault(item => NormalizeThumbprint(item.Thumbprint) == thumbprint)
            ?? throw new SigningException("CERTIFICATE_NOT_FOUND", "Không tìm thấy chứng thư trong Windows Certificate Store của người dùng.");
        return SignHash(certificate, request, now ?? DateTimeOffset.UtcNow);
    }

    public SignHashResult SignHash(X509Certificate2 certificate, SignHashRequest request, DateTimeOffset? now = null)
    {
        var signedAt = now ?? DateTimeOffset.UtcNow;
        ValidateRequest(request, signedAt);
        if (!certificate.HasPrivateKey) throw new SigningException("PRIVATE_KEY_NOT_AVAILABLE", "Chứng thư không có private key khả dụng.");
        if (!SupportsDigitalSignature(certificate)) throw new SigningException("CERTIFICATE_NOT_FOR_SIGNING", "Chứng thư không cho phép ký số.");
        if (signedAt < certificate.NotBefore || signedAt > certificate.NotAfter) throw new SigningException("CERTIFICATE_NOT_VALID", "Chứng thư chưa có hiệu lực hoặc đã hết hạn.");
        if (NormalizeThumbprint(certificate.Thumbprint) != NormalizeThumbprint(request.CertificateThumbprint)) throw new SigningException("CERTIFICATE_MISMATCH", "Chứng thư không khớp transaction.");

        var hashAlgorithm = ParseHashAlgorithm(request.HashAlgorithm);
        var hash = DecodeAndValidateHash(request.HashBase64, hashAlgorithm);
        byte[] signature;
        string signatureAlgorithm;
        using (var rsa = certificate.GetRSAPrivateKey())
        {
            if (rsa is not null)
            {
                signature = rsa.SignHash(hash, hashAlgorithm, RSASignaturePadding.Pkcs1);
                signatureAlgorithm = $"RSA-{hashAlgorithm.Name}";
                return Result(request, certificate, signature, signatureAlgorithm, signedAt);
            }
        }
        using (var ecdsa = certificate.GetECDsaPrivateKey())
        {
            if (ecdsa is not null)
            {
                signature = ecdsa.SignHash(hash);
                signatureAlgorithm = $"ECDSA-{hashAlgorithm.Name}";
                return Result(request, certificate, signature, signatureAlgorithm, signedAt);
            }
        }
        throw new SigningException("KEY_ALGORITHM_NOT_SUPPORTED", "Agent chưa hỗ trợ thuật toán private key của chứng thư.");
    }

    public static void ValidateRequest(SignHashRequest request, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(request.TransactionId) || request.TransactionId.Length > 128) throw new SigningException("INVALID_TRANSACTION_ID", "Transaction ID không hợp lệ.");
        if (string.IsNullOrWhiteSpace(request.CertificateThumbprint)) throw new SigningException("CERTIFICATE_REQUIRED", "Phải chọn chứng thư ký số.");
        if (string.IsNullOrWhiteSpace(request.DocumentLabel) || request.DocumentLabel.Length > 256) throw new SigningException("INVALID_DOCUMENT_LABEL", "Tên tài liệu không hợp lệ.");
        if (request.PatientCode?.Length > 64) throw new SigningException("INVALID_PATIENT_CODE", "Mã bệnh nhân quá dài.");
        if (request.ExpiresAt <= now) throw new SigningException("SIGNING_TRANSACTION_EXPIRED", "Giao dịch ký đã hết hạn.");
        if (request.ExpiresAt > now.AddMinutes(15)) throw new SigningException("SIGNING_TRANSACTION_TTL_TOO_LONG", "Thời hạn giao dịch ký vượt giới hạn 15 phút.");
        var algorithm = ParseHashAlgorithm(request.HashAlgorithm);
        _ = DecodeAndValidateHash(request.HashBase64, algorithm);
    }

    private static SignHashResult Result(SignHashRequest request, X509Certificate2 certificate, byte[] signature, string algorithm, DateTimeOffset signedAt) =>
        new(request.TransactionId, Convert.ToBase64String(signature), Convert.ToBase64String(certificate.Export(X509ContentType.Cert)),
            NormalizeThumbprint(certificate.Thumbprint), algorithm, signedAt, BuildCertificateChain(certificate));

    private static IReadOnlyList<string> BuildCertificateChain(X509Certificate2 certificate)
    {
        using var chain = new X509Chain();
        chain.ChainPolicy.RevocationMode = X509RevocationMode.NoCheck;
        chain.ChainPolicy.DisableCertificateDownloads = true;
        _ = chain.Build(certificate);
        var certificates = chain.ChainElements.Cast<X509ChainElement>()
            .Select(element => Convert.ToBase64String(element.Certificate.Export(X509ContentType.Cert)))
            .ToList();
        var leaf = Convert.ToBase64String(certificate.Export(X509ContentType.Cert));
        if (certificates.Count == 0 || certificates[0] != leaf) certificates.Insert(0, leaf);
        return certificates;
    }

    private static SigningCertificateInfo ToInfo(X509Certificate2 certificate)
    {
        var now = DateTimeOffset.UtcNow;
        return new SigningCertificateInfo(NormalizeThumbprint(certificate.Thumbprint), certificate.Subject, certificate.Issuer,
            certificate.SerialNumber, certificate.NotBefore, certificate.NotAfter, certificate.PublicKey.Oid.FriendlyName ?? certificate.PublicKey.Oid.Value ?? "Unknown",
            now >= certificate.NotBefore && now <= certificate.NotAfter,
            Convert.ToBase64String(certificate.Export(X509ContentType.Cert)), BuildCertificateChain(certificate));
    }

    private static bool SupportsDigitalSignature(X509Certificate2 certificate)
    {
        var keyUsage = certificate.Extensions.OfType<X509KeyUsageExtension>().FirstOrDefault();
        return keyUsage is null || keyUsage.KeyUsages.HasFlag(X509KeyUsageFlags.DigitalSignature) || keyUsage.KeyUsages.HasFlag(X509KeyUsageFlags.NonRepudiation);
    }

    private static HashAlgorithmName ParseHashAlgorithm(string value) => value.ToUpperInvariant() switch
    {
        "SHA256" or "SHA-256" => HashAlgorithmName.SHA256,
        "SHA384" or "SHA-384" => HashAlgorithmName.SHA384,
        "SHA512" or "SHA-512" => HashAlgorithmName.SHA512,
        _ => throw new SigningException("HASH_ALGORITHM_NOT_SUPPORTED", "Chỉ hỗ trợ SHA-256, SHA-384 và SHA-512.")
    };

    private static byte[] DecodeAndValidateHash(string base64, HashAlgorithmName algorithm)
    {
        byte[] hash;
        try { hash = Convert.FromBase64String(base64); }
        catch (FormatException) { throw new SigningException("INVALID_HASH", "Hash không đúng định dạng Base64."); }
        var expectedLength = algorithm == HashAlgorithmName.SHA256 ? 32 : algorithm == HashAlgorithmName.SHA384 ? 48 : 64;
        if (hash.Length != expectedLength) throw new SigningException("INVALID_HASH_LENGTH", $"Hash {algorithm.Name} phải có {expectedLength} byte.");
        return hash;
    }

    private static string NormalizeThumbprint(string? value) => new((value ?? string.Empty).Where(char.IsAsciiHexDigit).Select(char.ToUpperInvariant).ToArray());
}
