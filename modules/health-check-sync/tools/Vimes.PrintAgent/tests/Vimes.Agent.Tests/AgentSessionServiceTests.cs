using System.Security.Cryptography;
using System.Text;
using Vimes.Agent.Security;
using Xunit;

namespace Vimes.Agent.Tests;

public sealed class AgentSessionServiceTests
{
    [Fact]
    public void ValidBackendSignatureCreatesOriginBoundSession()
    {
        using var rsa = RSA.Create(2048);
        var service = CreateService(rsa);
        var challenge = service.CreateChallenge("https://his.vimes.vn");
        var signature = rsa.SignData(Encoding.UTF8.GetBytes(challenge.SigningPayload), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

        var session = service.Authorize(challenge.ChallengeId, Convert.ToBase64String(signature), challenge.Origin);

        Assert.True(service.Validate(session.AccessToken, challenge.Origin));
        Assert.False(service.Validate(session.AccessToken, "https://evil.example"));
    }

    [Fact]
    public void ChallengeCannotBeReplayed()
    {
        using var rsa = RSA.Create(2048);
        var service = CreateService(rsa);
        var challenge = service.CreateChallenge("https://his.vimes.vn");
        var signature = Convert.ToBase64String(rsa.SignData(Encoding.UTF8.GetBytes(challenge.SigningPayload), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1));
        service.Authorize(challenge.ChallengeId, signature, challenge.Origin);

        var error = Assert.Throws<AgentSecurityException>(() => service.Authorize(challenge.ChallengeId, signature, challenge.Origin));

        Assert.Equal("CHALLENGE_NOT_FOUND", error.Code);
    }

    [Fact]
    public void InvalidSignatureIsRejectedAndConsumesChallenge()
    {
        using var trusted = RSA.Create(2048);
        using var attacker = RSA.Create(2048);
        var service = CreateService(trusted);
        var challenge = service.CreateChallenge("https://his.vimes.vn");
        var signature = Convert.ToBase64String(attacker.SignData(Encoding.UTF8.GetBytes(challenge.SigningPayload), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1));

        var error = Assert.Throws<AgentSecurityException>(() => service.Authorize(challenge.ChallengeId, signature, challenge.Origin));

        Assert.Equal("INVALID_SIGNATURE", error.Code);
        Assert.Throws<AgentSecurityException>(() => service.Authorize(challenge.ChallengeId, signature, challenge.Origin));
    }

    [Fact]
    public void UnenrolledAgentCannotAuthorize()
    {
        var service = new AgentSessionService(new AgentSecurityOptions());
        var challenge = service.CreateChallenge("https://his.vimes.vn");

        var error = Assert.Throws<AgentSecurityException>(() => service.Authorize(challenge.ChallengeId, "AA==", challenge.Origin));

        Assert.Equal("AGENT_NOT_ENROLLED", error.Code);
    }

    private static AgentSessionService CreateService(RSA rsa) => new(new AgentSecurityOptions
    {
        TrustedBackendPublicKeyPem = rsa.ExportSubjectPublicKeyInfoPem(),
        ChallengeLifetimeSeconds = 60,
        SessionLifetimeMinutes = 10
    });
}
