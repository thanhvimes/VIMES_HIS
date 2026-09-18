export type SigningJobStatus =
  | 'queued' | 'awaitingUser' | 'processing' | 'completed'
  | 'failed' | 'cancelled' | 'expired';

export interface AgentSigningProvider {
  id: string;
  displayName: string;
  version: string;
  status: string;
  keyAlgorithms: string[];
  hashAlgorithms: string[];
  requiresDesktopSession: boolean;
}

export interface AgentSigningCertificate {
  thumbprint: string;
  subject: string;
  issuer: string;
  serialNumber: string;
  notBefore: string;
  notAfter: string;
  keyAlgorithm: string;
  isValidNow: boolean;
  certificateBase64?: string;
  certificateChainBase64?: string[];
}

export interface AgentSignHashRequest {
  transactionId: string;
  certificateThumbprint: string;
  hashBase64: string;
  hashAlgorithm: 'SHA256' | 'SHA384' | 'SHA512';
  documentLabel: string;
  patientCode?: string;
  expiresAt: string;
}

export interface AgentSignHashResult {
  transactionId: string;
  signatureBase64: string;
  certificateBase64: string;
  certificateThumbprint: string;
  signatureAlgorithm: string;
  signedAt: string;
  certificateChainBase64: string[];
}

export interface AgentSigningJob {
  jobId: string;
  transactionId: string;
  status: SigningJobStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  result?: AgentSignHashResult;
  errorCode?: string;
  errorMessage?: string;
}

export interface AgentSigningJobAccepted {
  jobId: string;
  transactionId: string;
  status: SigningJobStatus;
  duplicate: boolean;
}

export class WorkstationAgentError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = 'WorkstationAgentError';
  }
}

export function normalizeProvider(raw: any): AgentSigningProvider {
  if (!raw) return raw;
  return {
    id: raw.id || raw.Id || '',
    displayName: raw.displayName || raw.DisplayName || '',
    version: raw.version || raw.Version || '',
    status: raw.status || raw.Status || '',
    keyAlgorithms: raw.keyAlgorithms || raw.KeyAlgorithms || [],
    hashAlgorithms: raw.hashAlgorithms || raw.HashAlgorithms || [],
    requiresDesktopSession: Boolean(raw.requiresDesktopSession ?? raw.RequiresDesktopSession)
  };
}

export function normalizeCertificate(raw: any): AgentSigningCertificate {
  if (!raw) return raw;
  return {
    thumbprint: raw.thumbprint || raw.Thumbprint || '',
    subject: raw.subject || raw.Subject || '',
    issuer: raw.issuer || raw.Issuer || '',
    serialNumber: raw.serialNumber || raw.SerialNumber || '',
    notBefore: raw.notBefore || raw.NotBefore || '',
    notAfter: raw.notAfter || raw.NotAfter || '',
    keyAlgorithm: raw.keyAlgorithm || raw.KeyAlgorithm || '',
    isValidNow: Boolean(raw.isValidNow ?? raw.IsValidNow),
    certificateBase64: raw.certificateBase64 || raw.CertificateBase64,
    certificateChainBase64: raw.certificateChainBase64 || raw.CertificateChainBase64
  };
}

export function normalizeSigningJobAccepted(raw: any): AgentSigningJobAccepted {
  if (!raw) return raw;
  return {
    jobId: raw.jobId || raw.JobId || '',
    transactionId: raw.transactionId || raw.TransactionId || '',
    status: (raw.status || raw.Status || 'queued').toLowerCase() as any,
    duplicate: Boolean(raw.duplicate ?? raw.Duplicate)
  };
}

export function normalizeSigningJob(raw: any): AgentSigningJob {
  if (!raw) return raw;
  const rawResult = raw.result || raw.Result;
  return {
    jobId: raw.jobId || raw.JobId || '',
    transactionId: raw.transactionId || raw.TransactionId || '',
    status: (raw.status || raw.Status || 'queued').toLowerCase() as any,
    createdAt: raw.createdAt || raw.CreatedAt || '',
    updatedAt: raw.updatedAt || raw.UpdatedAt || '',
    expiresAt: raw.expiresAt || raw.ExpiresAt || '',
    result: rawResult ? {
      transactionId: rawResult.transactionId || rawResult.TransactionId || '',
      signatureBase64: rawResult.signatureBase64 || rawResult.SignatureBase64 || '',
      certificateBase64: rawResult.certificateBase64 || rawResult.CertificateBase64 || '',
      certificateThumbprint: rawResult.certificateThumbprint || rawResult.CertificateThumbprint || '',
      signatureAlgorithm: rawResult.signatureAlgorithm || rawResult.SignatureAlgorithm || '',
      signedAt: rawResult.signedAt || rawResult.SignedAt || '',
      certificateChainBase64: rawResult.certificateChainBase64 || rawResult.CertificateChainBase64 || []
    } : undefined,
    errorCode: raw.errorCode || raw.ErrorCode,
    errorMessage: raw.errorMessage || raw.ErrorMessage
  };
}

export class WorkstationAgentSigningClient {
  private readonly baseUrl: string;

  constructor(
    private readonly accessToken: string,
    baseUrl = 'http://127.0.0.1:18181',
    private readonly fetcher: typeof fetch = fetch,
  ) {
    if (!accessToken.trim()) throw new Error('AGENT_ACCESS_TOKEN_REQUIRED');
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async providers(signal?: AbortSignal): Promise<AgentSigningProvider[]> {
    const res = await this.request<any[]>('/api/v1/signing/providers', { signal });
    return (Array.isArray(res) ? res : []).map(normalizeProvider);
  }

  async certificates(sessionId?: number, signal?: AbortSignal): Promise<AgentSigningCertificate[]> {
    const query = sessionId === undefined ? '' : `?sessionId=${encodeURIComponent(sessionId)}`;
    const res = await this.request<any[]>(`/api/v1/signing/certificates${query}`, { signal });
    return (Array.isArray(res) ? res : []).map(normalizeCertificate);
  }

  async createJob(payload: AgentSignHashRequest, sessionId?: number, signal?: AbortSignal): Promise<AgentSigningJobAccepted> {
    const query = sessionId === undefined ? '' : `?sessionId=${encodeURIComponent(sessionId)}`;
    const res = await this.request<any>(`/api/v1/signing/jobs${query}`, {
      method: 'POST', body: JSON.stringify(payload), signal,
    });
    return normalizeSigningJobAccepted(res);
  }

  async getJob(jobId: string, signal?: AbortSignal): Promise<AgentSigningJob> {
    const res = await this.request<any>(`/api/v1/signing/jobs/${encodeURIComponent(jobId)}`, { signal });
    return normalizeSigningJob(res);
  }

  async cancelJob(jobId: string, signal?: AbortSignal): Promise<AgentSigningJob> {
    const res = await this.request<any>(`/api/v1/signing/jobs/${encodeURIComponent(jobId)}/cancel`, {
      method: 'POST', signal,
    });
    return normalizeSigningJob(res);
  }

  async waitForTerminalJob(
    jobId: string,
    options: { pollIntervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {},
  ): Promise<AgentSigningJob> {
    const pollIntervalMs = options.pollIntervalMs ?? 500;
    const timeoutMs = options.timeoutMs ?? 120_000;
    if (pollIntervalMs < 100 || timeoutMs <= 0) throw new Error('INVALID_SIGNING_POLL_OPTIONS');
    const deadline = Date.now() + timeoutMs;
    while (true) {
      options.signal?.throwIfAborted();
      const job = await this.getJob(jobId, options.signal);
      if (['completed', 'failed', 'cancelled', 'expired'].includes(job.status)) return job;
      if (Date.now() >= deadline) throw new WorkstationAgentError('SIGNING_JOB_POLL_TIMEOUT', 'Timed out waiting for signing job.', 408);
      await abortableDelay(Math.min(pollIntervalMs, Math.max(0, deadline - Date.now())), options.signal);
    }
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await this.fetcher(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
          ...(init.headers || {})
        },
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      throw new WorkstationAgentError('AGENT_UNAVAILABLE', 'Cannot connect to VIMES Workstation Agent.', 503);
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = body as { code?: string; message?: string };
      throw new WorkstationAgentError(error.code || 'AGENT_REQUEST_FAILED', error.message || `Agent HTTP ${response.status}`, response.status);
    }
    return body as T;
  }
}

function abortableDelay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
  });
}
