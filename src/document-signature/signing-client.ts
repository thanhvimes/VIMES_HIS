export interface SigningClientOptions { baseUrl?: string; timeoutMs?: number; }
export class PdfSigningClient {
    private readonly baseUrl: string; private readonly timeoutMs: number;
    constructor(options: SigningClientOptions = {}) { this.baseUrl = String(options.baseUrl || process.env.PDF_SIGNING_URL || 'http://127.0.0.1:8080').replace(/\/$/, ''); this.timeoutMs = Number(options.timeoutMs || process.env.PDF_SIGNING_TIMEOUT_MS || 30000); }
    private async request<T>(path: string, init: RequestInit = {}): Promise<T> { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs); try { const response = await fetch(`${this.baseUrl}${path}`, { ...init, signal: controller.signal, headers: { 'content-type': 'application/json', ...(init.headers || {}) } }); const body: any = await response.json().catch(() => ({})); if (!response.ok) throw Object.assign(new Error(body.detail || body.message || `Signing service HTTP ${response.status}`), { status: response.status, code: body.code || 'SIGNING_SERVICE_ERROR' }); return body as T; } finally { clearTimeout(timer); } }
    readiness() { return this.request<{ ready: boolean; provider: string }>('/ready'); }
    providerInfo() { return this.request<Record<string, unknown>>('/v1/provider-info'); }
    prepare(payload: Record<string, unknown>) { return this.request<Record<string, unknown>>('/v1/prepare', { method: 'POST', body: JSON.stringify(payload) }); }
    signPdf(payload: Record<string, unknown>) { return this.request<Record<string, unknown>>('/v1/sign-pdf', { method: 'POST', body: JSON.stringify(payload) }); }
    externalPrepare(payload: Record<string, unknown>) { return this.request<{ transaction_id: string; hash_base64: string; hash_algorithm: 'SHA256'; profile: string; expires_in: number }>('/v1/external/prepare', { method: 'POST', body: JSON.stringify(payload) }); }
    externalComplete(payload: { transaction_id: string; raw_signature_base64: string }) { return this.request<{ transaction_id: string; pdf_base64: string; pdf_sha256: string; profile: string; status: string }>('/v1/external/complete', { method: 'POST', body: JSON.stringify(payload) }); }
    xmlDsigPrepare(payload: Record<string, unknown>) { return this.request<{ transaction_id: string; hash_base64: string; hash_algorithm: 'SHA256'; profile: string; expires_in: number }>('/v1/xml-dsig/prepare', { method: 'POST', body: JSON.stringify(payload) }); }
    xmlDsigComplete(payload: { transaction_id: string; raw_signature_base64: string }) { return this.request<{ transaction_id: string; xml_base64: string; xml_sha256: string; profile: string; status: string }>('/v1/xml-dsig/complete', { method: 'POST', body: JSON.stringify(payload) }); }
}
export const pdfSigningClient = new PdfSigningClient();
