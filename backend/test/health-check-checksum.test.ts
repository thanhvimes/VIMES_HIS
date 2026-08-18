import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { canonicalJson, createHealthCheckChecksumSignature } from '../src/services/health-check-checksum';

test('checksum canonicalization removes insignificant whitespace', () => {
    assert.equal(canonicalJson({ a: 'x y', b: 1 }), '{"a":"xy","b":1}');
});

test('checksum signature is verifiable with the public RSA key', () => {
    const pair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const header = { version: '1.0.6', msg_id: 'ABC' };
    const data = { file_content: 'QUJDREVG' };
    const signature = createHealthCheckChecksumSignature(header, data, pair.privateKey);
    const hashA = crypto.createHash('sha256').update(canonicalJson(header)).digest('hex').toUpperCase();
    const hashB = crypto.createHash('sha256').update(canonicalJson(data)).digest('hex').toUpperCase();
    const verify = crypto.createVerify('SHA256');
    verify.update(`${hashA}.${hashB}`);
    verify.end();
    assert.equal(verify.verify(pair.publicKey, signature, 'base64'), true);
});
