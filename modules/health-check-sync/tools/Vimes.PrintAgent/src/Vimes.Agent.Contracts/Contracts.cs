namespace Vimes.Agent.Contracts;

public enum AgentJobStatus { Queued, Processing, Completed, Failed, Cancelled, Expired }

public sealed record CapabilityInfo(string Name, string Version, string Status);
public sealed record AgentHealth(string Status, string Service, string Version, DateTimeOffset Timestamp);
public sealed record ApiError(string Code, string Message, string CorrelationId);
public sealed record SessionChallenge(string ChallengeId, string Nonce, string Origin, DateTimeOffset ExpiresAt, string SigningPayload);
public sealed record AuthorizeSessionRequest(string ChallengeId, string Signature);
public sealed record AgentSession(string AccessToken, DateTimeOffset ExpiresAt);

public sealed record SigningCertificateInfo(
    string Thumbprint,
    string Subject,
    string Issuer,
    string SerialNumber,
    DateTimeOffset NotBefore,
    DateTimeOffset NotAfter,
    string KeyAlgorithm,
    bool IsValidNow,
    string? CertificateBase64 = null,
    IReadOnlyList<string>? CertificateChainBase64 = null);

public sealed record SigningProviderInfo(
    string Id,
    string DisplayName,
    string Version,
    string Status,
    IReadOnlyList<string> KeyAlgorithms,
    IReadOnlyList<string> HashAlgorithms,
    bool RequiresDesktopSession);

public sealed record SignHashRequest(
    string TransactionId,
    string CertificateThumbprint,
    string HashBase64,
    string HashAlgorithm,
    string DocumentLabel,
    string? PatientCode,
    DateTimeOffset ExpiresAt);

public sealed record SignHashResult(
    string TransactionId,
    string SignatureBase64,
    string CertificateBase64,
    string CertificateThumbprint,
    string SignatureAlgorithm,
    DateTimeOffset SignedAt,
    IReadOnlyList<string>? CertificateChainBase64 = null);

public enum SigningJobStatus { Queued, AwaitingUser, Processing, Completed, Failed, Cancelled, Expired }
public sealed record SigningJobAccepted(string JobId, string TransactionId, SigningJobStatus Status, bool Duplicate = false);
public sealed record SigningJobView(
    string JobId,
    string TransactionId,
    SigningJobStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset ExpiresAt,
    SignHashResult? Result,
    string? ErrorCode,
    string? ErrorMessage);

public sealed record PrintJobRequest(string Printer, string Data, int Copies = 1, string? IdempotencyKey = null);
public sealed record PrintJobAccepted(string JobId, AgentJobStatus Status, bool Duplicate = false);
public sealed record PrintJobView(
    string JobId,
    AgentJobStatus Status,
    string Printer,
    int Copies,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    string? ErrorCode,
    string? ErrorMessage);
