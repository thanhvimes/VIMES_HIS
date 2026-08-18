import { healthCheckService } from '../../../services/healthCheckService';
import { AgentSigningCertificate, WorkstationAgentSigningClient } from './workstationAgentSigningClient';

const AGENT_URL = 'http://127.0.0.1:18181';

async function agentJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(`${AGENT_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
  catch { throw new Error('Không kết nối được VIMES Workstation Agent tại máy trạm.'); }
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.code || `Workstation Agent HTTP ${response.status}`);
  return body as T;
}

async function createAgentSession(): Promise<string> {
  const health = await agentJson<{ status: string }>('/api/v1/health');
  if (health.status !== 'ok') throw new Error('VIMES Workstation Agent chưa sẵn sàng.');
  const challenge = await agentJson<{ challengeId: string; signingPayload: string }>('/api/v1/session/challenge', { method: 'POST', body: '{}' });
  const signed = await healthCheckService.signAgentChallenge(challenge.signingPayload);
  const session = await agentJson<{ accessToken: string }>('/api/v1/session/authorize', { method: 'POST', body: JSON.stringify({ challengeId: challenge.challengeId, signature: signed.signatureBase64 }) });
  return session.accessToken;
}

function selectCertificate(certificates: AgentSigningCertificate[]): AgentSigningCertificate {
  const valid = certificates.filter(item => item.isValidNow && item.certificateBase64 && item.keyAlgorithm.toUpperCase().includes('RSA'));
  if (!valid.length) throw new Error('Không tìm thấy chứng thư RSA còn hiệu lực trên USB Token.');
  if (valid.length === 1) return valid[0];
  const choices = valid.map((item, index) => `${index + 1}. ${item.subject} (${item.thumbprint.slice(-8)})`).join('\n');
  const selected = Number(window.prompt(`Chọn chứng thư ký số:\n${choices}`, '1'));
  if (!Number.isInteger(selected) || selected < 1 || selected > valid.length) throw new Error('Đã hủy chọn chứng thư ký số.');
  return valid[selected - 1];
}

export async function signHealthCheckXmlWithAgent(documentId: string): Promise<void> {
  const token = await createAgentSession();
  const agent = new WorkstationAgentSigningClient(token, AGENT_URL);
  const providers = await agent.providers();
  if (!providers.some(provider => provider.id && provider.status === 'available' && provider.keyAlgorithms.some(algorithm => algorithm.toUpperCase().includes('RSA')))) {
    throw new Error('Workstation Agent không có capability ký RSA khả dụng.');
  }
  const certificate = selectCertificate(await agent.certificates());
  const prepared = await healthCheckService.prepareXmlSignature(documentId, certificate.certificateBase64!, certificate.certificateChainBase64 || []);
  const accepted = await agent.createJob({
    transactionId: prepared.transactionId,
    certificateThumbprint: certificate.thumbprint,
    hashBase64: prepared.hashBase64,
    hashAlgorithm: prepared.hashAlgorithm,
    documentLabel: prepared.documentLabel,
    expiresAt: prepared.expiresAt,
  });
  const job = await agent.waitForTerminalJob(accepted.jobId);
  if (job.status !== 'completed' || !job.result) throw new Error(job.errorMessage || `Ký số không hoàn tất (${job.status}).`);
  if (job.result.transactionId !== prepared.transactionId || job.result.certificateThumbprint.toUpperCase() !== certificate.thumbprint.toUpperCase()) throw new Error('Kết quả Agent không khớp giao dịch/chứng thư đã chọn.');
  await healthCheckService.completeXmlSignature(documentId, prepared.transactionId, job.result.signatureBase64);
}
