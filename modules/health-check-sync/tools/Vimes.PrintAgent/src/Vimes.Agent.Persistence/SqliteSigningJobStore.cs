using System.Text.Json;
using Microsoft.Data.Sqlite;
using Vimes.Agent.Contracts;
using Vimes.Agent.Signing;

namespace Vimes.Agent.Persistence;

public sealed class SqliteSigningJobStore(string databasePath, IPayloadProtector protector) : ISigningJobStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private string ConnectionString => new SqliteConnectionStringBuilder { DataSource = databasePath, Mode = SqliteOpenMode.ReadWriteCreate, Pooling = false }.ToString();

    public async Task InitializeAsync(CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(databasePath) ?? AppContext.BaseDirectory);
        await using var connection = new SqliteConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        var command = connection.CreateCommand();
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS signing_jobs (
                id TEXT PRIMARY KEY,
                transaction_id TEXT NOT NULL UNIQUE,
                encrypted_request BLOB NOT NULL,
                target_session_id INTEGER NOT NULL,
                status INTEGER NOT NULL,
                encrypted_result BLOB NULL,
                error_code TEXT NULL,
                error_message TEXT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_signing_jobs_status ON signing_jobs(status);
            """;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public Task SaveAsync(SigningJob job, CancellationToken cancellationToken) => UpsertAsync(job, cancellationToken);
    public Task UpdateAsync(SigningJob job, CancellationToken cancellationToken) => UpsertAsync(job, cancellationToken);
    public Task<SigningJob?> GetAsync(string id, CancellationToken cancellationToken) => QuerySingleAsync("SELECT * FROM signing_jobs WHERE id=$value LIMIT 1", id, cancellationToken);
    public Task<SigningJob?> FindByTransactionIdAsync(string transactionId, CancellationToken cancellationToken) => QuerySingleAsync("SELECT * FROM signing_jobs WHERE transaction_id=$value LIMIT 1", transactionId, cancellationToken);

    public async Task<IReadOnlyList<SigningJob>> RecoverPendingAsync(CancellationToken cancellationToken)
    {
        var result = new List<SigningJob>();
        await using var connection = new SqliteConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM signing_jobs WHERE status IN ($queued,$waiting,$processing) ORDER BY created_at";
        command.Parameters.AddWithValue("$queued", (int)SigningJobStatus.Queued);
        command.Parameters.AddWithValue("$waiting", (int)SigningJobStatus.AwaitingUser);
        command.Parameters.AddWithValue("$processing", (int)SigningJobStatus.Processing);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) result.Add(Read(reader));
        return result;
    }

    private async Task UpsertAsync(SigningJob job, CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO signing_jobs(id,transaction_id,encrypted_request,target_session_id,status,encrypted_result,error_code,error_message,created_at,updated_at,expires_at)
            VALUES($id,$transaction,$request,$session,$status,$result,$errorCode,$errorMessage,$created,$updated,$expires)
            ON CONFLICT(id) DO UPDATE SET status=$status,encrypted_result=$result,error_code=$errorCode,error_message=$errorMessage,updated_at=$updated;
            """;
        command.Parameters.AddWithValue("$id", job.Id);
        command.Parameters.AddWithValue("$transaction", job.Request.TransactionId);
        command.Parameters.AddWithValue("$request", protector.Protect(JsonSerializer.Serialize(job.Request, JsonOptions)));
        command.Parameters.AddWithValue("$session", job.TargetSessionId);
        command.Parameters.AddWithValue("$status", (int)job.Status);
        command.Parameters.AddWithValue("$result", job.Result is null ? DBNull.Value : protector.Protect(JsonSerializer.Serialize(job.Result, JsonOptions)));
        command.Parameters.AddWithValue("$errorCode", (object?)job.ErrorCode ?? DBNull.Value);
        command.Parameters.AddWithValue("$errorMessage", (object?)job.ErrorMessage ?? DBNull.Value);
        command.Parameters.AddWithValue("$created", job.CreatedAt.ToString("O"));
        command.Parameters.AddWithValue("$updated", job.UpdatedAt.ToString("O"));
        command.Parameters.AddWithValue("$expires", job.Request.ExpiresAt.ToString("O"));
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<SigningJob?> QuerySingleAsync(string sql, string value, CancellationToken cancellationToken)
    {
        await using var connection = new SqliteConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        var command = connection.CreateCommand();
        command.CommandText = sql;
        command.Parameters.AddWithValue("$value", value);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? Read(reader) : null;
    }

    private SigningJob Read(SqliteDataReader reader)
    {
        var request = JsonSerializer.Deserialize<SignHashRequest>(protector.Unprotect((byte[])reader["encrypted_request"]), JsonOptions)
            ?? throw new InvalidDataException("Stored signing request is invalid.");
        SignHashResult? result = reader.IsDBNull(reader.GetOrdinal("encrypted_result")) ? null
            : JsonSerializer.Deserialize<SignHashResult>(protector.Unprotect((byte[])reader["encrypted_result"]), JsonOptions);
        return new SigningJob
        {
            Id = reader.GetString(reader.GetOrdinal("id")), Request = request,
            TargetSessionId = reader.GetInt32(reader.GetOrdinal("target_session_id")),
            Status = (SigningJobStatus)reader.GetInt32(reader.GetOrdinal("status")), Result = result,
            ErrorCode = reader.IsDBNull(reader.GetOrdinal("error_code")) ? null : reader.GetString(reader.GetOrdinal("error_code")),
            ErrorMessage = reader.IsDBNull(reader.GetOrdinal("error_message")) ? null : reader.GetString(reader.GetOrdinal("error_message")),
            CreatedAt = DateTimeOffset.Parse(reader.GetString(reader.GetOrdinal("created_at"))),
            UpdatedAt = DateTimeOffset.Parse(reader.GetString(reader.GetOrdinal("updated_at")))
        };
    }
}
