import { healthCheckService } from '../../../services/healthCheckService';

const AGENT_URL = 'http://127.0.0.1:18181';
type AgentPrintJob = { jobId: string; status: string; errorMessage?: string };

async function request<T>(path: string, init: RequestInit = {}, token = ''): Promise<T> {
  let response: Response;
  try { response = await fetch(`${AGENT_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) } }); }
  catch { throw new Error('Không kết nối được VIMES Workstation Agent.'); }
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.code || `Workstation Agent HTTP ${response.status}`);
  return (body.data || body) as T;
}

async function createSession(): Promise<string> {
  const challenge = await request<{ challengeId: string; signingPayload: string }>('/api/v1/session/challenge', { method: 'POST', body: '{}' });
  const signed = await healthCheckService.signAgentChallenge(challenge.signingPayload);
  const session = await request<{ accessToken: string }>('/api/v1/session/authorize', { method: 'POST', body: JSON.stringify({ challengeId: challenge.challengeId, signature: signed.signatureBase64 }) });
  return session.accessToken;
}

export async function getAvailablePrintersViaAgent(): Promise<string[]> {
  const token = await createSession();
  return await request<string[]>('/api/v1/printing/printers', {}, token);
}

export async function printZplViaWorkstationAgent(printerQuery: string, zpl: string, idempotencyKey: string): Promise<void> {
  if (!zpl.trim()) throw new Error('Dữ liệu ZPL rỗng.');
  const token = await createSession();
  const printers = await request<string[]>('/api/v1/printing/printers', {}, token);
  const printer = printers.find(item => item.toLowerCase() === printerQuery.toLowerCase()) || printers.find(item => item.toLowerCase().includes(printerQuery.toLowerCase()));
  if (!printer) throw new Error(`Không tìm thấy máy in "${printerQuery}" trên máy trạm.`);
  const accepted = await request<AgentPrintJob>('/api/v1/printing/jobs', { method: 'POST', body: JSON.stringify({ printer, data: zpl, copies: 1, idempotencyKey }) }, token);
  let current = accepted;
  const deadline = Date.now() + 30_000;
  while (!['completed', 'failed', 'cancelled'].includes(current.status.toLowerCase())) {
    if (Date.now() >= deadline) throw new Error('Hết thời gian chờ Vimes.PrintAgent in tem.');
    await new Promise(resolve => setTimeout(resolve, 300));
    current = await request<AgentPrintJob>(`/api/v1/printing/jobs/${encodeURIComponent(accepted.jobId)}`, {}, token);
  }
  if (current.status.toLowerCase() !== 'completed') throw new Error(current.errorMessage || `Lệnh in kết thúc ở trạng thái ${current.status}.`);
}
