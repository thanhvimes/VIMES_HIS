import axios from 'axios';

export interface VimesPdfSignOptions {
  pageIndex: number;
  x1Pt: number;
  y1Pt: number;
  x2Pt: number;
  y2Pt: number;
  fieldName?: string;
  reason?: string;
  requestId?: string;
  idempotencyKey?: string;
}

export interface VimesPdfSignResult {
  pdfBase64: string;
  profile?: string;
  requestId?: string;
}

function baseUrl(): string {
  return (process.env.VIMES_SIGNING_URL || 'http://127.0.0.1:8082').replace(/\/$/, '');
}

export async function signPdfViaVimesSigningServer(
  pdfBase64: string,
  options: VimesPdfSignOptions,
): Promise<VimesPdfSignResult> {
  if (!pdfBase64) throw new Error('PDF_BASE64_REQUIRED');
  if (options.x2Pt <= options.x1Pt || options.y2Pt <= options.y1Pt) {
    throw new Error('INVALID_SIGNATURE_RECTANGLE');
  }

  const requestId = options.requestId || `his-sign-${Date.now()}`;
  const idempotencyKey = options.idempotencyKey || requestId;
  try {
    const response = await axios.post<any>(`${baseUrl()}/v1/sign-pdf`, {
      pdf_base64: pdfBase64,
      field_name: options.fieldName || 'Signature',
      page_index: options.pageIndex,
      x1_pt: options.x1Pt,
      y1_pt: options.y1Pt,
      x2_pt: options.x2Pt,
      y2_pt: options.y2Pt,
      reason: options.reason,
    }, {
      timeout: Number(process.env.VIMES_SIGNING_TIMEOUT_MS || 60000),
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Idempotency-Key': idempotencyKey,
      },
    });

    if (!response.data?.pdf_base64) throw new Error('SIGNING_RESPONSE_MISSING_PDF');
    return {
      pdfBase64: response.data.pdf_base64,
      profile: response.data.profile,
      requestId,
    };
  } catch (error) {
    const axiosError = error as any;
    const status = axiosError.response?.status;
    if (status === 429) throw new Error('SIGNING_CONCURRENCY_LIMIT');
    if (status === 413) throw new Error('SIGNING_PDF_SIZE_LIMIT');
    if (status === 503) throw new Error('SIGNING_PROVIDER_UNAVAILABLE');
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      throw new Error('SIGNING_TIMEOUT');
    }
    throw new Error(axiosError.response?.data?.detail || 'SIGNING_REQUEST_FAILED');
  }
}
