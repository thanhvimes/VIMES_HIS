import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { verifyAgentSignature } from '../src/document-signature/agent-signature-verifier';

test('agent signature verifier rejects unsupported algorithms before certificate parsing', () => {
    assert.throws(() => verifyAgentSignature('a'.repeat(64), {
        transactionId: 'tx-1', signatureBase64: 'AA==', certificateBase64: 'AA==',
        certificateThumbprint: 'A'.repeat(40), signatureAlgorithm: 'ECDSA-SHA384', signedAt: new Date().toISOString(),
    }), (error: any) => error.code === 'SIGNATURE_ALGORITHM_NOT_SUPPORTED');
});

test('agent signature verifier rejects malformed certificates and signatures', () => {
    assert.throws(() => verifyAgentSignature('a'.repeat(64), {
        transactionId: 'tx-1', signatureBase64: 'not-base64', certificateBase64: 'AA==',
        certificateThumbprint: 'A'.repeat(40), signatureAlgorithm: 'RSA-SHA256', signedAt: new Date().toISOString(),
    }), (error: any) => error.code === 'INVALID_SIGNATURE');
});

test('agent signature migration stores verified public material without PIN or private key fields', () => {
    const source = fs.readFileSync('migrations/054_hms_document_agent_signature.sql', 'utf8');
    for (const field of ['transaction_id', 'document_sha256', 'signature_base64', 'certificate_base64', 'certificate_thumbprint', 'verified_at']) assert.match(source, new RegExp(field));
    const ddl = source.split('\n').filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('COMMENT ')).join('\n');
    assert.doesNotMatch(ddl, /\b(pin|private_key|password)\b/i);
    assert.match(source, /UNIQUE\s+REFERENCES|NOT NULL UNIQUE REFERENCES/i);
});
