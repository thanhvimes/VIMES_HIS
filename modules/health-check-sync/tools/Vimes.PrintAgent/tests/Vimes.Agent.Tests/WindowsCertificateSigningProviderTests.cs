using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Vimes.Agent.Contracts;
using Vimes.Agent.Signing;
using Xunit;

namespace Vimes.Agent.Tests;

public sealed class WindowsCertificateSigningProviderTests
{
    [Fact]
    public void SignsSha256HashWithRsaPrivateKey()
    {
        using var rsa = RSA.Create(2048);
        var certificateRequest = new CertificateRequest("CN=VIMES RSA Test", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        certificateRequest.CertificateExtensions.Add(new X509KeyUsageExtension(X509KeyUsageFlags.DigitalSignature, true));
        using var certificate = certificateRequest.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddDays(1));
        var hash = SHA256.HashData("VIMES-DOCUMENT"u8.ToArray());
        var request = CreateRequest(certificate, hash, "SHA-256");

        var result = new WindowsCertificateSigningProvider().SignHash(certificate, request);

        using var publicKey = certificate.GetRSAPublicKey();
        Assert.NotNull(publicKey);
        Assert.True(publicKey.VerifyHash(hash, Convert.FromBase64String(result.SignatureBase64), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1));
        Assert.Equal("RSA-SHA256", result.SignatureAlgorithm);
        Assert.NotNull(result.CertificateChainBase64);
        Assert.NotEmpty(result.CertificateChainBase64);
        Assert.Equal(result.CertificateBase64, result.CertificateChainBase64[0]);
    }

    [Fact]
    public void ExposesStableWindowsProviderMetadata()
    {
        ISigningProvider provider = new WindowsCertificateSigningProvider();

        Assert.Equal("windows-certificate-store", provider.Info.Id);
        Assert.Contains("RSA", provider.Info.KeyAlgorithms);
        Assert.Contains("SHA256", provider.Info.HashAlgorithms);
        Assert.True(provider.Info.RequiresDesktopSession);
    }

    [Fact]
    public void SignsSha384HashWithEcdsaPrivateKey()
    {
        using var ecdsa = ECDsa.Create(ECCurve.NamedCurves.nistP384);
        var certificateRequest = new CertificateRequest("CN=VIMES ECDSA Test", ecdsa, HashAlgorithmName.SHA384);
        certificateRequest.CertificateExtensions.Add(new X509KeyUsageExtension(X509KeyUsageFlags.DigitalSignature, true));
        using var certificate = certificateRequest.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddDays(1));
        var hash = SHA384.HashData("VIMES-DOCUMENT"u8.ToArray());
        var request = CreateRequest(certificate, hash, "SHA384");

        var result = new WindowsCertificateSigningProvider().SignHash(certificate, request);

        using var publicKey = certificate.GetECDsaPublicKey();
        Assert.NotNull(publicKey);
        Assert.True(publicKey.VerifyHash(hash, Convert.FromBase64String(result.SignatureBase64)));
        Assert.Equal("ECDSA-SHA384", result.SignatureAlgorithm);
    }

    [Fact]
    public void RejectsExpiredCertificate()
    {
        using var rsa = RSA.Create(2048);
        var certificateRequest = new CertificateRequest("CN=Expired", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        using var certificate = certificateRequest.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-3), DateTimeOffset.UtcNow.AddDays(-2));
        var request = CreateRequest(certificate, SHA256.HashData("DATA"u8.ToArray()), "SHA256");

        var error = Assert.Throws<SigningException>(() => new WindowsCertificateSigningProvider().SignHash(certificate, request));

        Assert.Equal("CERTIFICATE_NOT_VALID", error.Code);
    }

    [Fact]
    public void RejectsHashWithWrongLength()
    {
        using var rsa = RSA.Create(2048);
        var certificateRequest = new CertificateRequest("CN=VIMES", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        using var certificate = certificateRequest.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddDays(1));
        var request = CreateRequest(certificate, new byte[16], "SHA256");

        var error = Assert.Throws<SigningException>(() => WindowsCertificateSigningProvider.ValidateRequest(request, DateTimeOffset.UtcNow));

        Assert.Equal("INVALID_HASH_LENGTH", error.Code);
    }

    private static SignHashRequest CreateRequest(X509Certificate2 certificate, byte[] hash, string algorithm) => new(
        "transaction-001", certificate.Thumbprint, Convert.ToBase64String(hash), algorithm,
        "Hồ sơ bệnh án điện tử", "BN001", DateTimeOffset.UtcNow.AddMinutes(5));
}
