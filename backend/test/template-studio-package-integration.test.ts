import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { packZip, unpackZip, buildPackage, unpackAndVerifyPackage, TemplatePackageMetadata } from '../src/template-studio/template-package';

test('packZip and unpackZip round-trip files accurately', () => {
    const originalFiles: Record<string, Buffer> = {
        'manifest.json': Buffer.from(JSON.stringify({ format: 'VIMES_TEMPLATE_PACKAGE_V1', templateCode: 'TEST_01' }), 'utf8'),
        'document.docx': Buffer.from('PK\x03\x04synthetic-docx-binary-content', 'binary'),
        'sub/folder/data.json': Buffer.from('{"hello":"xin chào thế giới 🇻🇳"}', 'utf8')
    };

    const zipBuffer = packZip(originalFiles);
    assert.ok(zipBuffer.length > 0);
    assert.equal(zipBuffer.readUInt32LE(0), 0x04034b50); // ZIP local header

    const unpacked = unpackZip(zipBuffer);
    assert.deepEqual(Object.keys(unpacked).sort(), Object.keys(originalFiles).sort());
    assert.equal(unpacked['manifest.json'].toString('utf8'), originalFiles['manifest.json'].toString('utf8'));
    assert.equal(unpacked['document.docx'].toString('binary'), originalFiles['document.docx'].toString('binary'));
    assert.equal(unpacked['sub/folder/data.json'].toString('utf8'), originalFiles['sub/folder/data.json'].toString('utf8'));
});

test('unpackZip rejects Zip Slip path traversal entries', () => {
    // Manually craft a malicious ZIP entry with traversal
    const maliciousFiles: Record<string, Buffer> = {
        '../../evil.txt': Buffer.from('malicious', 'utf8')
    };
    const zip = packZip(maliciousFiles);
    assert.throws(() => unpackZip(zip), /unsafe entry path/i);
});

test('buildPackage creates valid manifest with SHA-256 hashes and unpacks cleanly', () => {
    const metadata: TemplatePackageMetadata = {
        template: {
            code: 'PRESCRIPTION_V1',
            name: 'Đơn thuốc điện tử Ngoại trú',
            documentType: 'FORM',
            moduleCode: 'OUTPATIENT',
            category: 'Đơn thuốc',
            tags: ['ngoai_tru', 'don_thuoc']
        },
        version: {
            version: 1,
            sampleData: { patient_name: 'NGUYEN VAN A', total: 100000 },
            changeNote: 'Initial package version'
        },
        contract: {
            code: 'PRESCRIPTION_V1',
            name: 'Đơn thuốc Ngoại trú Contract',
            version: 1,
            jsonSchema: { type: 'object', properties: { patient_name: { type: 'string' } } }
        },
        testCases: [
            { name: 'Case 1: Standard Patient', testType: 'NORMAL', inputData: { patient_name: 'A' }, isRequired: true }
        ]
    };

    const docxArtifact = Buffer.from('synthetic-docx-file-content');
    const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const privateKeyPem = keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const publicKeyPem = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();

    const { buffer, manifest } = buildPackage({ metadata, docxArtifact, privateKeyPem });
    assert.equal(manifest.templateCode, 'PRESCRIPTION_V1');
    assert.equal(manifest.version, 1);
    assert.ok(manifest.signature);
    assert.ok(manifest.files['template.docx']);
    assert.ok(manifest.files['metadata.json']);
    assert.ok(manifest.files['contract.json']);
    assert.ok(manifest.files['test-cases.json']);

    // Unpack and verify
    const result = unpackAndVerifyPackage(buffer, publicKeyPem);
    assert.equal(result.valid, true, `Errors: ${result.errors.join(', ')}`);
    assert.equal(result.signatureValid, true);
    assert.equal(result.metadata?.template.code, 'PRESCRIPTION_V1');
    assert.equal(result.metadata?.testCases.length, 1);
});

test('unpackAndVerifyPackage detects tampered file content', () => {
    const metadata: TemplatePackageMetadata = {
        template: { code: 'TAMPER_01', name: 'Test Tamper', documentType: 'FORM' },
        version: { version: 1, sampleData: {} },
        testCases: []
    };
    const { buffer } = buildPackage({ metadata });
    const unpacked = unpackZip(buffer);

    // Tamper with metadata.json content without changing manifest
    unpacked['metadata.json'] = Buffer.from(JSON.stringify({ ...metadata, template: { ...metadata.template, name: 'HACKED' } }));
    const tamperedZip = packZip(unpacked);

    const verifyResult = unpackAndVerifyPackage(tamperedZip);
    assert.equal(verifyResult.valid, false);
    assert.match(verifyResult.errors[0], /checksum mismatch/i);
});

test('unpackAndVerifyPackage rejects package without manifest', () => {
    const zip = packZip({ 'random.txt': Buffer.from('hello') });
    const verifyResult = unpackAndVerifyPackage(zip);
    assert.equal(verifyResult.valid, false);
    assert.match(verifyResult.errors[0], /missing manifest/i);
});
