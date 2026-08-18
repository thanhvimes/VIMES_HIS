import { documentSignatureService } from './documentSignatureService';
import {
  AgentSignHashResult,
  WorkstationAgentError,
  WorkstationAgentSigningClient,
} from '../modules/health-check-sync/services/workstationAgentSigningClient';

export interface CoordinateAgentSigningOptions {
  requestId: string;
  certificateThumbprint: string;
  patientCode?: string;
  sessionId?: number;
  signal?: AbortSignal;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export async function coordinateAgentSigning(
  agent: WorkstationAgentSigningClient,
  options: CoordinateAgentSigningOptions,
) {
  const certificates = await agent.certificates(options.sessionId, options.signal);
  const normalize = (value: string) => value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  const certificate = certificates.find(item => normalize(item.thumbprint) === normalize(options.certificateThumbprint));
  if (!certificate?.certificateBase64) throw new WorkstationAgentError('CERTIFICATE_EXPORT_UNAVAILABLE', 'Selected certificate cannot be exported for PAdES preparation.', 422);
  const prepared = await documentSignatureService.preparePdf(options.requestId, certificate.certificateBase64, certificate.certificateChainBase64 || [certificate.certificateBase64]) as {
    transactionId: string;
    hashBase64: string;
    hashAlgorithm: 'SHA256';
    documentLabel: string;
    expiresAt: string;
  };
  const accepted = await agent.createJob({
    transactionId: prepared.transactionId,
    certificateThumbprint: options.certificateThumbprint,
    hashBase64: prepared.hashBase64,
    hashAlgorithm: prepared.hashAlgorithm,
    documentLabel: prepared.documentLabel,
    patientCode: options.patientCode,
    expiresAt: prepared.expiresAt,
  }, options.sessionId, options.signal);
  const job = await agent.waitForTerminalJob(accepted.jobId, {
    signal: options.signal,
    pollIntervalMs: options.pollIntervalMs,
    timeoutMs: options.timeoutMs,
  });
  if (job.status !== 'completed' || !job.result) {
    throw new WorkstationAgentError(job.errorCode || `SIGNING_JOB_${job.status.toUpperCase()}`, job.errorMessage || `Signing job ended as ${job.status}.`, 422);
  }
  assertResultMatchesTransaction(job.result, prepared.transactionId, options.certificateThumbprint);
  return documentSignatureService.authorizeAgentSignature(options.requestId, job.result as unknown as Record<string, unknown>);
}

function assertResultMatchesTransaction(result: AgentSignHashResult, transactionId: string, certificateThumbprint: string) {
  const normalize = (value: string) => value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (result.transactionId !== transactionId) throw new WorkstationAgentError('SIGNING_TRANSACTION_MISMATCH', 'Agent returned a different signing transaction.', 409);
  if (normalize(result.certificateThumbprint) !== normalize(certificateThumbprint)) throw new WorkstationAgentError('CERTIFICATE_THUMBPRINT_MISMATCH', 'Agent used a different signing certificate.', 409);
}
