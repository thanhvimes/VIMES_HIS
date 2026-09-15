import crypto from 'node:crypto';

export interface AgentSignatureSubmission {
    transactionId: string;
    signatureBase64: string;
    certificateBase64: string;
    certificateThumbprint: string;
    signatureAlgorithm: string;
    signedAt: string;
    certificateChainBase64?: string[];
}

const digestInfoPrefix: Record<string, Buffer> = {
    SHA256: Buffer.from('3031300d060960864801650304020105000420', 'hex'),
    SHA384: Buffer.from('3041300d060960864801650304020205000430', 'hex'),
    SHA512: Buffer.from('3051300d060960864801650304020305000440', 'hex'),
};

const cleanThumbprint = (value: string) => value.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
const decodeStrictBase64 = (value: string, code: string): Buffer => {
    if (!value || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw Object.assign(new Error(code), { status: 422, code });
    const decoded = Buffer.from(value, 'base64');
    if (!decoded.length || decoded.toString('base64').replace(/=+$/, '') !== value.replace(/=+$/, '')) throw Object.assign(new Error(code), { status: 422, code });
    return decoded;
};

export function verifyAgentSignature(documentSha256: string, submission: AgentSignatureSubmission) {
    if (!/^[a-f0-9]{64}$/i.test(documentSha256)) throw Object.assign(new Error('Invalid document hash'), { status: 422, code: 'INVALID_DOCUMENT_HASH' });
    if (!submission.transactionId || submission.transactionId.length > 128) throw Object.assign(new Error('Invalid transaction'), { status: 422, code: 'INVALID_TRANSACTION_ID' });
    if (!/^RSA-SHA256$/i.test(submission.signatureAlgorithm)) throw Object.assign(new Error('Unsupported detached signature algorithm'), { status: 422, code: 'SIGNATURE_ALGORITHM_NOT_SUPPORTED' });
    const certificateBytes = decodeStrictBase64(submission.certificateBase64, 'INVALID_CERTIFICATE');
    const chain = submission.certificateChainBase64 || [submission.certificateBase64];
    if (chain.length === 0 || chain.length > 10 || chain[0].replace(/=+$/, '') !== submission.certificateBase64.replace(/=+$/, '')) throw Object.assign(new Error('Invalid certificate chain'), { status: 422, code: 'INVALID_CERTIFICATE_CHAIN' });
    chain.forEach(value => decodeStrictBase64(value, 'INVALID_CERTIFICATE_CHAIN'));
    const signature = decodeStrictBase64(submission.signatureBase64, 'INVALID_SIGNATURE');
    let certificate: crypto.X509Certificate;
    try { certificate = new crypto.X509Certificate(certificateBytes); }
    catch { throw Object.assign(new Error('Invalid signing certificate'), { status: 422, code: 'INVALID_CERTIFICATE' }); }
    const actualThumbprint = cleanThumbprint(certificate.fingerprint);
    if (actualThumbprint !== cleanThumbprint(submission.certificateThumbprint)) throw Object.assign(new Error('Certificate thumbprint mismatch'), { status: 422, code: 'CERTIFICATE_THUMBPRINT_MISMATCH' });
    const signedAt = new Date(submission.signedAt);
    if (!Number.isFinite(signedAt.getTime())) throw Object.assign(new Error('Invalid signing time'), { status: 422, code: 'INVALID_SIGNED_AT' });
    if (signedAt.getTime() > Date.now() + 5 * 60_000) throw Object.assign(new Error('Signing time is in the future'), { status: 422, code: 'INVALID_SIGNED_AT' });
    if (signedAt < new Date(certificate.validFrom) || signedAt > new Date(certificate.validTo)) throw Object.assign(new Error('Certificate was not valid at signing time'), { status: 422, code: 'CERTIFICATE_NOT_VALID_AT_SIGNING_TIME' });
    let recovered: Buffer;
    try { recovered = crypto.publicDecrypt({ key: certificate.publicKey, padding: crypto.constants.RSA_PKCS1_PADDING }, signature); }
    catch { throw Object.assign(new Error('Signature verification failed'), { status: 422, code: 'SIGNATURE_INVALID' }); }
    const expected = Buffer.concat([digestInfoPrefix.SHA256, Buffer.from(documentSha256, 'hex')]);
    if (recovered.length !== expected.length || !crypto.timingSafeEqual(recovered, expected)) throw Object.assign(new Error('Signature verification failed'), { status: 422, code: 'SIGNATURE_INVALID' });
    return {
        certificateSubject: certificate.subject,
        certificateIssuer: certificate.issuer,
        certificateSerial: certificate.serialNumber,
        certificateThumbprint: actualThumbprint,
        signedAt: signedAt.toISOString(),
        hashAlgorithm: 'SHA256' as const,
    };
}
