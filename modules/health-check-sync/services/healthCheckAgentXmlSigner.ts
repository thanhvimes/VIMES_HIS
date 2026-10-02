import { healthCheckService } from '../../../services/healthCheckService';
import { 
  AgentSigningCertificate, 
  WorkstationAgentSigningClient, 
  normalizeCertificate 
} from './workstationAgentSigningClient';

const AGENT_HTTP_URL = 'http://127.0.0.1:18181';
const AGENT_HTTPS_URL = 'https://127.0.0.1:18182';
// Vite dev proxy: browser → localhost:5173/agent-proxy → 127.0.0.1:18181
// Bypasses Chrome's Private Network Access (PNA) policy without Extension
const AGENT_PROXY_URL = '/agent-proxy';
const STORAGE_KEY_REMEMBERED_CERT = 'vimes_remembered_cert_thumbprint';

export interface UsbTokenStatus {
  agentRunning: boolean;
  connected: boolean;
  certificate?: AgentSigningCertificate;
  certificates: AgentSigningCertificate[];
  error?: string;
}

export function isExtensionReady(): boolean {
  return typeof document !== 'undefined' && (
    document.documentElement.hasAttribute('data-vimes-extension-ready') ||
    Boolean((window as any).__VIMES_AGENT_EXTENSION__)
  );
}

export function getAgentBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return AGENT_HTTPS_URL;
  }
  return AGENT_HTTP_URL;
}

export function getRememberedThumbprint(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_REMEMBERED_CERT);
  } catch {
    return null;
  }
}

export function setRememberedThumbprint(thumbprint: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_REMEMBERED_CERT, thumbprint);
  } catch {
    // Ignore storage errors
  }
}

export function clearRememberedThumbprint(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_REMEMBERED_CERT);
  } catch {
    // Ignore storage errors
  }
}

export function callViaExtension<T>(url: string, init: RequestInit = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestId = 'req_' + Math.random().toString(36).substring(2, 10);
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('Extension Bridge timeout: Không nhận được phản hồi từ VIMES Extension sau 15s.'));
    }, 15000);

    function handler(event: MessageEvent) {
      if (!event.data || event.data.source !== 'VIMES_EXTENSION_BRIDGE') return;
      if (event.data.requestId !== requestId) return;
      clearTimeout(timeout);
      window.removeEventListener('message', handler);

      const res = event.data.payload;
      if (!res || !res.ok) {
        reject(new Error(res?.error || 'Lỗi giao tiếp Extension Bridge'));
        return;
      }
      if (!res.responseOk) {
        const body = res.data || {};
        reject(new Error(body.message || body.code || `Agent HTTP ${res.status}`));
        return;
      }
      resolve(res.data as T);
    }

    window.addEventListener('message', handler);
    window.postMessage({
      source: 'VIMES_HIS_PAGE',
      type: 'VIMES_AGENT_REQUEST',
      requestId,
      payload: {
        url,
        method: init.method || 'GET',
        headers: init.headers || {},
        body: init.body
      }
    }, '*');
  });
}

export async function agentJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getAgentBaseUrl();
  const fullUrl = `${baseUrl}${path}`;

  // Priority 1: Use VIMES Extension bridge (no PNA issues)
  if (isExtensionReady()) {
    try {
      return await callViaExtension<T>(fullUrl, init);
    } catch (extError) {
      console.warn('[VIMES Signer] Extension bridge error, falling back to Vite proxy:', extError);
    }
  }

  // Priority 2: Use Vite dev-server proxy (/agent-proxy → 127.0.0.1:18181)
  // This bypasses Chrome PNA because browser calls same-origin (localhost:5173/agent-proxy)
  // and Vite server-side forwards to 127.0.0.1:18181 (server-side has no PNA restriction)
  const proxyUrl = `${AGENT_PROXY_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(proxyUrl, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }
    });
    console.debug('[VIMES Signer] Gọi qua Vite proxy:', proxyUrl, response.status);
  } catch (proxyErr) {
    console.warn('[VIMES Signer] Vite proxy lỗi, thử kết nối trực tiếp:', proxyErr);
    // Priority 3: Direct fetch to 127.0.0.1 (will fail on Chrome without Extension, but ok on Edge/Firefox)
    try {
      response = await fetch(fullUrl, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init.headers || {}) }
      });
    } catch (directErr) {
      console.error('[VIMES Signer] Kết nối trực tiếp thất bại:', directErr);
      throw new Error(
        'Không thể kết nối tới VIMES Workstation Agent.\n' +
        'Vui lòng đảm bảo ứng dụng VIMES Workstation Agent đang chạy trên máy tính.'
      );
    }
  }

  const body: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.code || `Workstation Agent HTTP ${response.status}`);
  return body as T;
}

export function getValidCertificates(certificates: AgentSigningCertificate[]): AgentSigningCertificate[] {
  const normalized = (certificates || []).map(normalizeCertificate);
  return normalized.filter(item =>
    item.isValidNow &&
    item.certificateBase64 &&
    // Allow both RSA and ECDSA certs (modern HSMs use ECDSA)
    (item.keyAlgorithm.toUpperCase().includes('RSA') || item.keyAlgorithm.toUpperCase().includes('EC')) &&
    // Filter out VIMES Agent's own SSL cert (CN=localhost, self-signed)
    !item.subject.toLowerCase().includes('cn=localhost') &&
    !item.issuer.toLowerCase().includes('cn=localhost') &&
    // Filter out auto-generated internal certs (UUID-style CN)
    !/^cn=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/.test(item.subject.toLowerCase())
  );
}

export async function createAgentSession(): Promise<string> {
  const health = await agentJson<{ status: string }>('/api/v1/health');
  if (health.status !== 'ok') throw new Error('VIMES Workstation Agent chưa sẵn sàng.');
  const challenge = await agentJson<{ challengeId: string; signingPayload: string }>('/api/v1/session/challenge', { method: 'POST', body: '{}' });
  const signed = await healthCheckService.signAgentChallenge(challenge.signingPayload);
  const session = await agentJson<{ accessToken: string }>('/api/v1/session/authorize', { method: 'POST', body: JSON.stringify({ challengeId: challenge.challengeId, signature: signed.signatureBase64 }) });
  return session.accessToken;
}

export function createSmartAgentClient(token: string): WorkstationAgentSigningClient {
  // Use proxy URL as base so WorkstationAgentSigningClient constructs correct URLs
  const effectiveBaseUrl = AGENT_PROXY_URL;
  
  const smartFetcher: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
    
    // Extract clean relative API path without proxy prefix or host
    let apiPath = url;
    if (apiPath.startsWith(AGENT_HTTP_URL)) {
      apiPath = apiPath.slice(AGENT_HTTP_URL.length);
    } else if (apiPath.startsWith(AGENT_HTTPS_URL)) {
      apiPath = apiPath.slice(AGENT_HTTPS_URL.length);
    } else if (apiPath.includes('127.0.0.1:18181')) {
      apiPath = apiPath.replace(/https?:\/\/127\.0\.0\.1:18181/, '');
    } else if (apiPath.includes('127.0.0.1:18182')) {
      apiPath = apiPath.replace(/https?:\/\/127\.0\.0\.1:18182/, '');
    }
    
    // Strip /agent-proxy prefix if present
    if (apiPath.startsWith(AGENT_PROXY_URL)) {
      apiPath = apiPath.slice(AGENT_PROXY_URL.length);
    } else if (apiPath.includes(AGENT_PROXY_URL)) {
      apiPath = apiPath.replace(AGENT_PROXY_URL, '');
    }
    if (!apiPath.startsWith('/')) {
      apiPath = '/' + apiPath;
    }

    // Priority 1: Extension bridge takes direct absolute URL (e.g. http://127.0.0.1:18181/api/v1/signing/providers)
    if (isExtensionReady()) {
      const absoluteUrl = `${getAgentBaseUrl()}${apiPath}`;
      try {
        const data = await callViaExtension<any>(absoluteUrl, init || {});
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err: any) {
        console.warn('[VIMES Signer] Extension fetcher fallback to proxy fetch:', err);
      }
    }
    
    // Priority 2: Use Vite proxy path (/agent-proxy/api/v1/...)
    const proxyUrl = `${AGENT_PROXY_URL}${apiPath}`;
    return fetch(proxyUrl, init);
  };
  
  return new WorkstationAgentSigningClient(token, effectiveBaseUrl, smartFetcher);
}

export async function detectUsbTokenStatus(): Promise<UsbTokenStatus> {
  try {
    const token = await createAgentSession();
    const agent = createSmartAgentClient(token);
    const rawCerts = await agent.certificates();
    const valid = getValidCertificates(rawCerts);

    if (!valid.length) {
      return {
        agentRunning: true,
        connected: false,
        certificates: []
      };
    }

    // Check remembered certificate
    const rememberedThumbprint = getRememberedThumbprint();
    let activeCert = rememberedThumbprint 
      ? valid.find(c => c.thumbprint.toUpperCase() === rememberedThumbprint.toUpperCase()) 
      : undefined;

    if (!activeCert) {
      activeCert = valid[0];
      if (valid.length === 1) {
        setRememberedThumbprint(activeCert.thumbprint);
      }
    }

    return {
      agentRunning: true,
      connected: true,
      certificate: activeCert,
      certificates: valid
    };
  } catch (err: any) {
    return {
      agentRunning: false,
      connected: false,
      certificates: [],
      error: err.message
    };
  }
}

export function selectCertificate(certificates: AgentSigningCertificate[]): AgentSigningCertificate {
  const valid = getValidCertificates(certificates);
  if (!valid.length) {
    throw new Error(
      'Không tìm thấy chứng thư số RSA còn hiệu lực trên USB Token.\n\n' +
      'Vui lòng kiểm tra:\n' +
      '1. USB Token đã cắm chắc chắn vào cổng USB máy tính.\n' +
      '2. Phần mềm quản lý Token của nhà cung cấp (Ban Cơ yếu Chính phủ, Viettel, VNPT, Bkav, FPT...) đã được cài đặt và nhận diện Token.\n' +
      '3. Dịch vụ Smart Card (SCardSvr) trên Windows đang được Bật (Running).'
    );
  }

  // 1. Check if user already remembered a certificate
  const rememberedThumbprint = getRememberedThumbprint();
  if (rememberedThumbprint) {
    const remembered = valid.find(c => c.thumbprint.toUpperCase() === rememberedThumbprint.toUpperCase());
    if (remembered) return remembered;
  }

  // 2. If only one certificate exists, auto-select and remember it
  if (valid.length === 1) {
    setRememberedThumbprint(valid[0].thumbprint);
    return valid[0];
  }

  // 3. If multiple certificates exist and none remembered, ask user with clean prompt & remember choice
  const choices = valid.map((item, index) => {
    const cn = item.subject.match(/CN=([^,]+)/i)?.[1] || item.subject;
    const expiry = new Date(item.notAfter).toLocaleDateString('vi-VN');
    return `${index + 1}. ${cn} (Hạn dùng: ${expiry})`;
  }).join('\n');

  const selected = Number(window.prompt(
    `Hệ thống tìm thấy ${valid.length} chứng thư số trên thiết bị USB Token.\n` +
    `Nhập số thứ tự để chọn ký:\n\n${choices}`,
    '1'
  ));

  if (!Number.isInteger(selected) || selected < 1 || selected > valid.length) {
    throw new Error('Đã hủy thao tác chọn chứng thư ký số.');
  }

  const chosen = valid[selected - 1];
  setRememberedThumbprint(chosen.thumbprint);
  return chosen;
}

export async function signHealthCheckXmlWithAgent(documentId: string): Promise<any> {
  const token = await createAgentSession();
  const agent = createSmartAgentClient(token);
  
  const providers = await agent.providers();
  if (!providers.some(provider => provider.id && provider.status === 'available' && provider.keyAlgorithms.some(algorithm => algorithm.toUpperCase().includes('RSA')))) {
    throw new Error('Workstation Agent không có capability ký RSA khả dụng.');
  }

  const certificate = selectCertificate(await agent.certificates());
  const prepared = await healthCheckService.prepareXmlSignature(
    documentId, 
    certificate.certificateBase64!, 
    certificate.certificateChainBase64 || []
  );

  const accepted = await agent.createJob({
    transactionId: prepared.transactionId,
    certificateThumbprint: certificate.thumbprint,
    hashBase64: prepared.hashBase64,
    hashAlgorithm: prepared.hashAlgorithm,
    documentLabel: prepared.documentLabel,
    expiresAt: prepared.expiresAt,
  });

  const job = await agent.waitForTerminalJob(accepted.jobId);
  if (job.status !== 'completed' || !job.result) {
    throw new Error(job.errorMessage || `Ký số không hoàn tất (${job.status}).`);
  }

  if (job.result.transactionId !== prepared.transactionId || job.result.certificateThumbprint.toUpperCase() !== certificate.thumbprint.toUpperCase()) {
    throw new Error('Kết quả Agent không khớp giao dịch/chứng thư đã chọn.');
  }

  return await healthCheckService.completeXmlSignature(documentId, prepared.transactionId, job.result.signatureBase64);
}

/**
 * Ký số Bác sĩ kết luận (Bước 1: CKS_NGUOI_KET_LUAN) qua Workstation Agent USB Token
 */
export async function signDoctorConclusionXmlWithAgent(
  documentId: string,
  doctorName?: string,
  doctorId?: string
): Promise<{ signature: string; applyRes: any }> {
  const token = await createAgentSession();
  const agent = createSmartAgentClient(token);

  const providers = await agent.providers();
  if (!providers.some(provider => provider.id && provider.status === 'available' && provider.keyAlgorithms.some(algorithm => algorithm.toUpperCase().includes('RSA')))) {
    throw new Error('Workstation Agent không có capability ký RSA khả dụng.');
  }

  const certificate = selectCertificate(await agent.certificates());
  const step1 = await healthCheckService.getTwoTierSignStep1Hash(documentId);
  if (!step1 || !step1.hashBase64) {
    throw new Error((step1 as any)?.error || 'Không thể tạo mã băm Bước 1 cho Bác sĩ kết luận.');
  }

  const txId = 'step1_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const accepted = await agent.createJob({
    transactionId: txId,
    certificateThumbprint: certificate.thumbprint,
    hashBase64: step1.hashBase64,
    hashAlgorithm: 'SHA256',
    documentLabel: `Ký Bác sĩ kết luận KSK ${step1.docNo || documentId} - ${step1.patientName || doctorName || ''}`,
    expiresAt: new Date(Date.now() + 300000).toISOString(),
  });

  const job = await agent.waitForTerminalJob(accepted.jobId);
  if (job.status !== 'completed' || !job.result) {
    throw new Error(job.errorMessage || `Ký số không hoàn tất (${job.status}).`);
  }

  if (job.result.transactionId !== txId || job.result.certificateThumbprint.toUpperCase() !== certificate.thumbprint.toUpperCase()) {
    throw new Error('Kết quả Agent không khớp giao dịch/chứng thư đã chọn.');
  }

  const cleanSig = job.result.signatureBase64;
  const applyRes = await healthCheckService.applyTwoTierSignStep1(documentId, cleanSig, doctorName, doctorId);
  return {
    signature: cleanSig,
    applyRes
  };
}


export interface BatchSignProgressInfo {
  current: number;
  total: number;
  docId: string;
  patientName?: string;
  status: 'signing' | 'success' | 'failed';
  error?: string;
}

export interface BatchSignAgentResult {
  total: number;
  succeeded: string[];
  failed: Array<{ id: string; error: string }>;
  signatures: Record<string, string>;
}

export async function batchSignHealthCheckXmlWithAgent(
  docIds: string[],
  options?: {
    onProgress?: (info: BatchSignProgressInfo) => void;
    autoSendPortal?: boolean;
    docs?: any[];
  }
): Promise<BatchSignAgentResult> {
  if (!docIds || docIds.length === 0) {
    return { total: 0, succeeded: [], failed: [], signatures: {} };
  }

  // 1. Create single agent session for the entire batch
  const token = await createAgentSession();
  const agent = createSmartAgentClient(token);

  const providers = await agent.providers();
  if (!providers.some(provider => provider.id && provider.status === 'available' && provider.keyAlgorithms.some(algorithm => algorithm.toUpperCase().includes('RSA')))) {
    throw new Error('Workstation Agent không có capability ký RSA khả dụng.');
  }

  // 2. Select certificate once for the batch
  const certificate = selectCertificate(await agent.certificates());

  const succeeded: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];
  const signatures: Record<string, string> = {};

  for (let i = 0; i < docIds.length; i++) {
    const docId = docIds[i];
    const docMeta = options?.docs?.find(d => String(d.id) === String(docId));
    const patientName = docMeta?.patient_name || docMeta?.doc_no || `Hồ sơ ${docId}`;

    if (options?.onProgress) {
      options.onProgress({
        current: i + 1,
        total: docIds.length,
        docId,
        patientName,
        status: 'signing'
      });
    }

    try {
      const prepared = await healthCheckService.prepareXmlSignature(
        docId,
        certificate.certificateBase64!,
        certificate.certificateChainBase64 || []
      );

      const accepted = await agent.createJob({
        transactionId: prepared.transactionId,
        certificateThumbprint: certificate.thumbprint,
        hashBase64: prepared.hashBase64,
        hashAlgorithm: prepared.hashAlgorithm,
        documentLabel: prepared.documentLabel,
        expiresAt: prepared.expiresAt,
      });

      const job = await agent.waitForTerminalJob(accepted.jobId);
      if (job.status !== 'completed' || !job.result) {
        throw new Error(job.errorMessage || `Ký số không hoàn tất (${job.status}).`);
      }

      const completed = await healthCheckService.completeXmlSignature(
        docId,
        prepared.transactionId,
        job.result.signatureBase64
      );

      succeeded.push(docId);
      const rawSig = completed?.signed_file?.data_base64 || completed?.signedXmlBase64 || job.result.signatureBase64;
      if (rawSig) {
        signatures[docId] = rawSig;
      }

      if (options?.onProgress) {
        options.onProgress({
          current: i + 1,
          total: docIds.length,
          docId,
          patientName,
          status: 'success'
        });
      }
    } catch (err: any) {
      const errMsg = err.message || 'Lỗi không xác định khi ký XML';
      failed.push({ id: docId, error: errMsg });

      if (options?.onProgress) {
        options.onProgress({
          current: i + 1,
          total: docIds.length,
          docId,
          patientName,
          status: 'failed',
          error: errMsg
        });
      }
    }
  }

  // 3. Auto send to portal if requested and there are succeeded documents
  if (options?.autoSendPortal && succeeded.length > 0) {
    try {
      await healthCheckService.sendDocuments(succeeded);
    } catch (sendErr: any) {
      console.warn('[VIMES Batch Sign] Gửi Cổng tự động gặp lỗi:', sendErr);
    }
  }

  return {
    total: docIds.length,
    succeeded,
    failed,
    signatures
  };
}
