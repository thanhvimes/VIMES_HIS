const SENSITIVE_KEY_PATTERNS = [
  /cccd/i,
  /cmnd/i,
  /citizen_id/i,
  /phone/i,
  /so_dien_thoai/i,
  /mobile/i,
  /bhyt/i,
  /insurance/i,
  /so_the/i,
  /dia_chi/i,
  /address/i,
  /patient_name/i,
  /ten_benh_nhan/i,
  /email/i
];

export function maskString(value: string): string {
  if (!value || typeof value !== 'string') return value;

  // Mask 12-digit CCCD / Citizen ID
  let masked = value.replace(/\b(\d{4})\d{5}(\d{3})\b/g, '$1*****$2');

  // Mask 10-digit Phone numbers
  masked = masked.replace(/\b(0\d{2})\d{4}(\d{3})\b/g, '$1****$2');

  // Mask 15-character BHYT card numbers (e.g. GD4010123456789)
  masked = masked.replace(/\b([A-Z]{2}\d{3})\d{7}(\d{3})\b/g, '$1*******$2');

  // Mask emails (e.g. john.doe@example.com -> j***e@example.com)
  masked = masked.replace(/\b([a-zA-Z0-9])[a-zA-Z0-9._%+-]*([a-zA-Z0-9])@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '$1***$2@$3');

  return masked;
}

export function maskObject<T>(obj: T, depth = 0): T {
  if (depth > 10 || obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') return maskString(obj) as unknown as T;
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => maskObject(item, depth + 1)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key));
    if (isSensitive && typeof val === 'string') {
      result[key] = maskString(val);
    } else if (typeof val === 'object' && val !== null) {
      result[key] = maskObject(val, depth + 1);
    } else {
      result[key] = val;
    }
  }

  return result as T;
}

export function sanitizeError(error: unknown): string {
  if (!error) return 'Unknown error';
  const rawMessage = error instanceof Error ? error.message : String(error);
  return maskString(rawMessage);
}
