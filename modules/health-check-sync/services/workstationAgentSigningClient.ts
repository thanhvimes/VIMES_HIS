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

  providers(signal?: AbortSignal) {
    return this.request<AgentSigningProvider[]>('/api/v1/signing/providers', { signal });
  }

  certificates(sessionId?: number, signal?: AbortSignal) {
    const query = sessionId === undefined ? '' : `?sessionId=${encodeURIComponent(sessionId)}`;
    return this.request<AgentSigningCertificate[]>(`/api/v1/signing/certificates${query}`, { signal });
  }

  createJob(payload: AgentSignHashRequest, sessionId?: number, signal?: AbortSignal) {
    const query = sessionId === undefined ? '' : `?sessionId=${encodeURIComponent(sessionId)}`;
    return this.request<AgentSigningJobAccepted>(`/api/v1/signing/jobs${query}`, {
      method: 'POST', body: JSON.stringify(payload), signal,
    });
  }

  getJob(jobId: string, signal?: AbortSignal) {
    return this.request<AgentSigningJob>(`/api/v1/signing/jobs/${encodeURIComponent(jobId)}`, { signal });
  }

  cancelJob(jobId: string, signal?: AbortSignal) {
    return this.request<AgentSigningJob>(`/api/v1/signing/jobs/${encodeURIComponent(jobId)}/cancel`, {
      method: 'POST', signal,
    });
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.accessToken}`, ...(init.headers || {}) },
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
