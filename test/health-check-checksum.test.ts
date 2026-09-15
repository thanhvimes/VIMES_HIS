import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { createHealthCheckChecksumSignature, canonicalJson } from '../src/services/health-check-checksum';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

test('creates valid verifiable signature over canonical header and data', () => {
    const header = { version: '1.0.6', sender_id: '8934285008135', msg_id: '123' };
    const data = 'QUJD';
    const signature = createHealthCheckChecksumSignature(header, data, privateKey);
    assert.ok(signature.length > 50);

    const hashA = crypto.createHash('sha256').update(canonicalJson(header)).digest('hex').toUpperCase();
    const hashB = crypto.createHash('sha256').update(canonicalJson(data)).digest('hex').toUpperCase();
    const verify = crypto.createVerify('SHA256');
    verify.update(`${hashA}.${hashB}`);
    verify.end();
    assert.equal(verify.verify({ key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(signature, 'base64')), true);
});
