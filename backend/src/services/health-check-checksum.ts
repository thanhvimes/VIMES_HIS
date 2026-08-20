import crypto from 'crypto';

export function canonicalJson(value: unknown): string {
    if (typeof value === 'string') {
        return value.trim();
    }
    return JSON.stringify(value).replace(/\s+/g, '');
}

export function createHealthCheckChecksumSignature(header: unknown, data: unknown, privateKey: crypto.KeyObject | string): string {
    const hashA = crypto.createHash('sha256').update(typeof header === 'string' ? header : canonicalJson(header)).digest('hex').toUpperCase();
    const hashB = crypto.createHash('sha256').update(typeof data === 'string' ? data : canonicalJson(data)).digest('hex').toUpperCase();
    const sign = crypto.createSign('SHA256');
    sign.update(`${hashA}.${hashB}`);
    sign.end();
    return sign.sign({ key: privateKey as any, padding: crypto.constants.RSA_PKCS1_PADDING }, 'base64');
}
