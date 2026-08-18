using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Vimes.Agent.Contracts;

namespace Vimes.Agent.Security;

public sealed class AgentSecurityOptions
{
    public string TrustedBackendPublicKeyPem { get; init; } = string.Empty;
    public int ChallengeLifetimeSeconds { get; init; } = 60;
    public int SessionLifetimeMinutes { get; init; } = 10;
}

public sealed class AgentSecurityException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

public sealed class AgentSessionService(AgentSecurityOptions options, TimeProvider? timeProvider = null)
{
    private readonly TimeProvider clock = timeProvider ?? TimeProvider.System;
    private readonly ConcurrentDictionary<string, ChallengeState> challenges = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, SessionState> sessions = new(StringComparer.Ordinal);

    public SessionChallenge CreateChallenge(string origin)
    {
        CleanupExpired();
        var now = clock.GetUtcNow();
        var id = RandomNumberGenerator.GetHexString(16).ToLowerInvariant();
        var nonce = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var expiresAt = now.AddSeconds(Math.Clamp(options.ChallengeLifetimeSeconds, 15, 300));
        var payload = BuildSigningPayload(id, nonce, origin, expiresAt);
        var state = new ChallengeState(id, nonce, origin, expiresAt, payload);
        challenges[id] = state;
        return new SessionChallenge(id, nonce, origin, expiresAt, payload);
    }

    public AgentSession Authorize(string challengeId, string signatureBase64, string origin)
    {
        if (string.IsNullOrWhiteSpace(options.TrustedBackendPublicKeyPem)) throw new AgentSecurityException("AGENT_NOT_ENROLLED", "Agent chưa được cấu hình public key của backend VIMES.");
        if (!challenges.TryRemove(challengeId, out var challenge)) throw new AgentSecurityException("CHALLENGE_NOT_FOUND", "Challenge không tồn tại hoặc đã được sử dụng.");
        if (challenge.ExpiresAt <= clock.GetUtcNow()) throw new AgentSecurityException("CHALLENGE_EXPIRED", "Challenge đã hết hạn.");
        if (!string.Equals(challenge.Origin, origin, StringComparison.OrdinalIgnoreCase)) throw new AgentSecurityException("ORIGIN_MISMATCH", "Origin không khớp challenge.");

        byte[] signature;
        try { signature = Convert.FromBase64String(signatureBase64); }
        catch (FormatException) { throw new AgentSecurityException("INVALID_SIGNATURE", "Chữ ký challenge không đúng định dạng Base64."); }

        using var rsa = RSA.Create();
        try { rsa.ImportFromPem(options.TrustedBackendPublicKeyPem.Replace("\\n", "\n")); }
        catch (Exception exception) when (exception is ArgumentException or CryptographicException)
        {
            throw new AgentSecurityException("INVALID_BACKEND_PUBLIC_KEY", "Public key backend VIMES không hợp lệ.");
        }
        if (!rsa.VerifyData(Encoding.UTF8.GetBytes(challenge.SigningPayload), signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1))
            throw new AgentSecurityException("INVALID_SIGNATURE", "Không xác minh được chữ ký challenge.");

        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var expiresAt = clock.GetUtcNow().AddMinutes(Math.Clamp(options.SessionLifetimeMinutes, 1, 60));
        sessions[token] = new SessionState(token, origin, expiresAt);
        return new AgentSession(token, expiresAt);
    }

    public bool Validate(string token, string origin)
    {
        if (!sessions.TryGetValue(token, out var session)) return false;
        if (session.ExpiresAt <= clock.GetUtcNow()) { sessions.TryRemove(token, out _); return false; }
        return string.Equals(session.Origin, origin, StringComparison.OrdinalIgnoreCase);
    }

    public static string BuildSigningPayload(string challengeId, string nonce, string origin, DateTimeOffset expiresAt) =>
        $"VIMES-AGENT-CHALLENGE\n{challengeId}\n{nonce}\n{origin}\n{expiresAt.ToUnixTimeSeconds()}";

    private void CleanupExpired()
    {
        var now = clock.GetUtcNow();
        foreach (var item in challenges.Where(item => item.Value.ExpiresAt <= now)) challenges.TryRemove(item.Key, out _);
        foreach (var item in sessions.Where(item => item.Value.ExpiresAt <= now)) sessions.TryRemove(item.Key, out _);
    }

    private sealed record ChallengeState(string Id, string Nonce, string Origin, DateTimeOffset ExpiresAt, string SigningPayload);
    private sealed record SessionState(string Token, string Origin, DateTimeOffset ExpiresAt);
}
