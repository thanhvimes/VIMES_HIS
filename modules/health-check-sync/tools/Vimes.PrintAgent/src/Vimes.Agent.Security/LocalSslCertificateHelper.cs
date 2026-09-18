using System;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace Vimes.Agent.Security;

public static class LocalSslCertificateHelper
{
    private const string CertSubject = "CN=localhost, O=VIMES Workstation Agent, OU=Local SSL, C=VN";
    private const string PfxSecret = "VIMES_LOCAL_SSL_AGENT_P12";

    public static X509Certificate2? GetOrCreateLocalCertificate()
    {
        try
        {
            // 1. Check if already installed in LocalMachine or CurrentUser store
            var existing = FindExistingValidCertificate();
            if (existing != null)
            {
                return existing;
            }

            // 2. Generate a new self-signed certificate
            using var rsa = RSA.Create(2048);
            var distinguishedName = new X500DistinguishedName(CertSubject);
            var request = new CertificateRequest(distinguishedName, rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

            request.CertificateExtensions.Add(new X509KeyUsageExtension(
                X509KeyUsageFlags.DigitalSignature | X509KeyUsageFlags.KeyEncipherment,
                critical: true));

            request.CertificateExtensions.Add(new X509EnhancedKeyUsageExtension(
                new OidCollection { new Oid("1.3.6.1.5.5.7.3.1") }, // Server Authentication
                critical: false));

            var sanBuilder = new SubjectAlternativeNameBuilder();
            sanBuilder.AddDnsName("localhost");
            sanBuilder.AddIpAddress(IPAddress.Loopback);
            sanBuilder.AddIpAddress(IPAddress.IPv6Loopback);
            request.CertificateExtensions.Add(sanBuilder.Build());

            var notBefore = DateTimeOffset.UtcNow.AddDays(-1);
            var notAfter = DateTimeOffset.UtcNow.AddYears(5);
            using var ephemeralCert = request.CreateSelfSigned(notBefore, notAfter);

            var pfxBytes = ephemeralCert.Export(X509ContentType.Pfx, PfxSecret);

            // 3. Try to install into LocalMachine (works when running as Windows Service / Administrator)
            X509Certificate2? persistentCert = null;
            try
            {
                persistentCert = new X509Certificate2(
                    pfxBytes,
                    PfxSecret,
                    X509KeyStorageFlags.MachineKeySet | X509KeyStorageFlags.PersistKeySet | X509KeyStorageFlags.Exportable);

                using (var lmMy = new X509Store(StoreName.My, StoreLocation.LocalMachine))
                {
                    lmMy.Open(OpenFlags.ReadWrite);
                    lmMy.Add(persistentCert);
                }

                using (var lmRoot = new X509Store(StoreName.Root, StoreLocation.LocalMachine))
                {
                    lmRoot.Open(OpenFlags.ReadWrite);
                    lmRoot.Add(persistentCert);
                }

                return persistentCert;
            }
            catch
            {
                // Fallback to CurrentUser if LocalMachine access is restricted
                persistentCert?.Dispose();
                persistentCert = new X509Certificate2(
                    pfxBytes,
                    PfxSecret,
                    X509KeyStorageFlags.UserKeySet | X509KeyStorageFlags.PersistKeySet | X509KeyStorageFlags.Exportable);

                try
                {
                    using (var cuMy = new X509Store(StoreName.My, StoreLocation.CurrentUser))
                    {
                        cuMy.Open(OpenFlags.ReadWrite);
                        cuMy.Add(persistentCert);
                    }

                    using (var cuRoot = new X509Store(StoreName.Root, StoreLocation.CurrentUser))
                    {
                        cuRoot.Open(OpenFlags.ReadWrite);
                        cuRoot.Add(persistentCert);
                    }
                }
                catch { }

                return persistentCert;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LocalSslCertificateHelper] Unable to initialize local SSL certificate: {ex.Message}");
            return null;
        }
    }

    private static X509Certificate2? FindExistingValidCertificate()
    {
        var locations = new[] { StoreLocation.LocalMachine, StoreLocation.CurrentUser };
        foreach (var location in locations)
        {
            try
            {
                using var store = new X509Store(StoreName.My, location);
                store.Open(OpenFlags.ReadOnly);
                foreach (var cert in store.Certificates)
                {
                    if (cert.HasPrivateKey &&
                        cert.Subject.Contains("O=VIMES Workstation Agent", StringComparison.OrdinalIgnoreCase) &&
                        cert.NotAfter > DateTime.UtcNow.AddDays(30))
                    {
                        return cert;
                    }
                }
            }
            catch { }
        }
        return null;
    }
}
