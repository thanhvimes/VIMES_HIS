using System.Security.Cryptography;
using System.Text;
using Microsoft.Data.Sqlite;
using Vimes.Agent.Contracts;
using Vimes.Agent.Printing;

namespace Vimes.Agent.Persistence;

public interface IPayloadProtector
{
    byte[] Protect(string value);
    string Unprotect(byte[] value);
}

public sealed class DpapiMachinePayloadProtector : IPayloadProtector
{
    private static readonly byte[] Entropy = Encoding.UTF8.GetBytes("VIMES.WorkstationAgent.Printing.v1");
    public byte[] Protect(string value) => ProtectedData.Protect(Encoding.UTF8.GetBytes(value), Entropy, DataProtectionScope.LocalMachine);
    public string Unprotect(byte[] value) => Encoding.UTF8.GetString(ProtectedData.Unprotect(value, Entropy, DataProtectionScope.LocalMachine));
}

public sealed class SqlitePrintJobStore(string databasePath, IPayloadProtector protector) : IPrintJobStore
{
    private string ConnectionString => new SqliteConnectionStringBuilder { DataSource = databasePath, Mode = SqliteOpenMode.ReadWriteCreate, Pooling = false }.ToString();

    public async Task InitializeAsync(CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(databasePath) ?? AppContext.BaseDirectory);
        await using var connection = new SqliteConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        var command = connection.CreateCommand();
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS print_jobs (
                id TEXT PRIMARY KEY,
                printer TEXT NOT NULL,
                encrypted_data BLOB NOT NULL,
                copies INTEGER NOT NULL,
                idempotency_key TEXT NULL UNIQUE,
                status INTEGER NOT NULL,
                error_code TEXT NULL,
                error_message TEXT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_print_jobs_status ON print_jobs(status);
            """;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public Task SaveAsync(PrintJob job, CancellationToken cancellationToken) => UpsertAsync(job, cancellationToken);
    public Task UpdateAsync(PrintJob job, CancellationToken cancellationToken) => UpsertAsync(job, cancellationToken);

    public async Task<PrintJob?> GetAsync(string id, CancellationToken cancellationToken) =>
        await QuerySingleAsync("SELECT * FROM print_jobs WHERE id=$value LIMIT 1", id, cancellationToken);

    public async Task<PrintJob?> FindByIdempotencyKeyAsync(string key, CancellationToken cancellationToken) =>
        await QuerySingleAsync("SELECT * FROM print_jobs WHERE idempotency_key=$value LIMIT 1", key, cancellationToken);

    public async Task<IReadOnlyList<PrintJob>> RecoverPendingAsync(CancellationToken cancellationToken)
    {
        var result = new List<PrintJob>();
        await using var connection = new SqliteConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM print_jobs WHERE status IN ($queued,$processing) ORDER BY created_at";
        command.Parameters.AddWithValue("$queued", (int)AgentJobStatus.Queued);
        command.Parameters.AddWithValue("$processing", (int)AgentJobStatus.Processing);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) result.Add(Read(reader));
        return result;
    }

    private async Task UpsertAsync(PrintJob job, CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO print_jobs(id,printer,encrypted_data,copies,idempotency_key,status,error_code,error_message,created_at,updated_at)
            VALUES($id,$printer,$data,$copies,$key,$status,$errorCode,$errorMessage,$created,$updated)
            ON CONFLICT(id) DO UPDATE SET status=$status,error_code=$errorCode,error_message=$errorMessage,updated_at=$updated;
            """;
        command.Parameters.AddWithValue("$id", job.Id);
        command.Parameters.AddWithValue("$printer", job.Printer);
        command.Parameters.AddWithValue("$data", protector.Protect(job.Data));
        command.Parameters.AddWithValue("$copies", job.Copies);
        command.Parameters.AddWithValue("$key", (object?)job.IdempotencyKey ?? DBNull.Value);
        command.Parameters.AddWithValue("$status", (int)job.Status);
        command.Parameters.AddWithValue("$errorCode", (object?)job.ErrorCode ?? DBNull.Value);
        command.Parameters.AddWithValue("$errorMessage", (object?)job.ErrorMessage ?? DBNull.Value);
        command.Parameters.AddWithValue("$created", job.CreatedAt.ToString("O"));
        command.Parameters.AddWithValue("$updated", job.UpdatedAt.ToString("O"));
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<PrintJob?> QuerySingleAsync(string sql, string value, CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.AddWithValue("$value", value);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? Read(reader) : null;
    }

    private PrintJob Read(SqliteDataReader reader) => new()
    {
        Id = reader.GetString(reader.GetOrdinal("id")),
        Printer = reader.GetString(reader.GetOrdinal("printer")),
        Data = protector.Unprotect((byte[])reader["encrypted_data"]),
        Copies = reader.GetInt32(reader.GetOrdinal("copies")),
        IdempotencyKey = reader.IsDBNull(reader.GetOrdinal("idempotency_key")) ? null : reader.GetString(reader.GetOrdinal("idempotency_key")),
        Status = (AgentJobStatus)reader.GetInt32(reader.GetOrdinal("status")),
        ErrorCode = reader.IsDBNull(reader.GetOrdinal("error_code")) ? null : reader.GetString(reader.GetOrdinal("error_code")),
        ErrorMessage = reader.IsDBNull(reader.GetOrdinal("error_message")) ? null : reader.GetString(reader.GetOrdinal("error_message")),
        CreatedAt = DateTimeOffset.Parse(reader.GetString(reader.GetOrdinal("created_at"))),
        UpdatedAt = DateTimeOffset.Parse(reader.GetString(reader.GetOrdinal("updated_at")))
    };
}
