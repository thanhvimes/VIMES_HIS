namespace Vimes.Agent.Host;

public sealed class AgentOptions
{
    public const string SectionName = "Agent";
    public string[] AllowedOrigins { get; init; } = ["http://localhost:3000", "http://localhost:5173"];
    public int MaximumPrintPayloadBytes { get; init; } = 1_048_576;
    public string DataDirectory { get; init; } = string.Empty;
}
