import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildJsonSchema, ContractCatalog, validateJsonData } from '../src/template-studio/contract-catalog';
import { validateDocx } from '../src/template-studio/docx-validator';
import { LocalTemplateArtifactStorage } from '../src/template-studio/local-template-storage';
import { TemplateRegistry } from '../src/document-engine/template-registry';

const templateRoot = path.resolve(process.cwd(), 'templates', 'documents');

test('contract catalog exposes scalar and repeating fields and fieldMeta', async () => {
    const contract = await new ContractCatalog(templateRoot).get('PRESCRIPTION');
    assert.equal(contract.allowedFields.has('patient.fullName'), true);
    assert.equal(contract.allowedFields.has('items[].name'), true);
    const items = contract.fields.find(field => field.path === 'items');
    assert.equal(items?.type, 'array');
    assert.equal(contract.fieldMeta.get('items')?.isArray, true);
    assert.equal(contract.fieldMeta.get('items[].name')?.type, 'string');
});
test('JSON schema builder locks object fields and describes arrays', () => {
    const schema = buildJsonSchema({ patient: { fullName: 'An' }, items: [{ name: 'Thuốc' }] });
    assert.deepEqual(schema.required, ['patient', 'items']);
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.properties?.items.items?.properties?.name.type, 'string');
});

test('data contract validator reports required, unknown and invalid type fields', async () => {
    const contract = await new ContractCatalog(templateRoot).get('PRESCRIPTION');
    const invalid = { ...contract.sampleData, patient: { ...contract.sampleData.patient as Record<string, unknown>, fullName: 123, unexpected: true } };
    delete (invalid as any).diagnosis;
    const issues = validateJsonData(contract.jsonSchema, invalid);
    assert.equal(issues.some(issue => issue.code === 'REQUIRED_FIELD' && issue.location === '$.diagnosis'), true);
    assert.equal(issues.some(issue => issue.code === 'UNKNOWN_FIELD' && issue.location === '$.patient.unexpected'), true);
    assert.equal(issues.some(issue => issue.code === 'INVALID_TYPE' && issue.location === '$.patient.fullName'), true);
});

test('DOCX validator accepts all five framework templates with fieldMeta', async () => {
    const codes = ['DISCHARGE_SUMMARY', 'LAB_RESULT', 'OUTPATIENT_EXAM', 'PRESCRIPTION', 'TREATMENT_SHEET'];
    for (const code of codes) {
        const contract = await new ContractCatalog(templateRoot).get(code);
        const docx = await fs.readFile(path.join(templateRoot, code, 'v1', 'template.docx'));
        const result = validateDocx(docx, contract.allowedFields, contract.fieldMeta);
        assert.equal(result.valid, true, `${code}: ${JSON.stringify(result.errors)}`);
        assert.equal(result.tags.includes('patient.fullName'), true, `${code}: missing patient.fullName`);
        assert.equal(result.errors.length, 0);
    }
});

test('DOCX validator rejects non-ZIP input', () => {
    const result = validateDocx(Buffer.from('not a docx'));
    assert.equal(result.valid, false);
    assert.equal(result.errors[0].code, 'INVALID_SIGNATURE');
});

test('local artifact storage prevents traversal, round-trips content and supports delete', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vimes-template-storage-'));
    try {
        const storage = new LocalTemplateArtifactStorage(root);
        await storage.put('PRESCRIPTION/v1/example.docx', Buffer.from('content'));
        assert.equal((await storage.get('PRESCRIPTION/v1/example.docx')).toString(), 'content');
        assert.equal(await storage.exists('PRESCRIPTION/v1/example.docx'), true);
        await storage.delete('PRESCRIPTION/v1/example.docx');
        assert.equal(await storage.exists('PRESCRIPTION/v1/example.docx'), false);
        await assert.rejects(() => storage.put('../escape.docx', Buffer.from('bad')), /Unsafe/);
    } finally {
        await fs.rm(root, { recursive: true, force: true });
    }
});

test('local artifact storage is safe for concurrent idempotent writes', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vimes-template-storage-concurrent-'));
    try {
        const storage = new LocalTemplateArtifactStorage(root);
        const content = Buffer.from('same-sha-content');
        await Promise.all(Array.from({ length: 12 }, () => storage.put('LAB_RESULT/v1/same.docx', content)));
        assert.equal((await storage.get('LAB_RESULT/v1/same.docx')).toString(), content.toString());
        assert.equal(await storage.exists('LAB_RESULT/v1/same.docx'), true);
    } finally {
        await fs.rm(root, { recursive: true, force: true });
    }
});

test('template registry supports cache invalidation', async () => {
    const registry = new TemplateRegistry(templateRoot);
    const list1 = await registry.list();
    assert.equal(list1.length >= 5, true);
    registry.invalidate('PRESCRIPTION');
    const list2 = await registry.list();
    assert.equal(list2.length >= 5, true);
});
