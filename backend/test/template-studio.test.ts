import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildJsonSchema, ContractCatalog } from '../src/template-studio/contract-catalog';
import { validateDocx } from '../src/template-studio/docx-validator';
import { LocalTemplateArtifactStorage } from '../src/template-studio/local-template-storage';

const templateRoot = path.resolve(process.cwd(), 'templates', 'documents');

test('contract catalog exposes scalar and repeating fields', async () => {
    const contract = await new ContractCatalog(templateRoot).get('PRESCRIPTION');
    assert.equal(contract.allowedFields.has('patient.fullName'), true);
    assert.equal(contract.allowedFields.has('items[].name'), true);
    const items = contract.fields.find(field => field.path === 'items');
    assert.equal(items?.type, 'array');
});

test('JSON schema builder locks object fields and describes arrays', () => {
    const schema = buildJsonSchema({ patient: { fullName: 'An' }, items: [{ name: 'Thuốc' }] });
    assert.deepEqual(schema.required, ['patient', 'items']);
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.properties?.items.items?.properties?.name.type, 'string');
});

test('DOCX validator accepts all five framework templates', async () => {
    const codes = ['DISCHARGE_SUMMARY', 'LAB_RESULT', 'OUTPATIENT_EXAM', 'PRESCRIPTION', 'TREATMENT_SHEET'];
    for (const code of codes) {
        const contract = await new ContractCatalog(templateRoot).get(code);
        const docx = await fs.readFile(path.join(templateRoot, code, 'v1', 'template.docx'));
        const result = validateDocx(docx, contract.allowedFields);
        assert.equal(result.valid, true, `${code}: ${JSON.stringify(result.errors)}`);
        assert.equal(result.tags.includes('patient.fullName'), true, `${code}: missing patient.fullName`);
    }
});

test('DOCX validator rejects non-ZIP input', () => {
    const result = validateDocx(Buffer.from('not a docx'));
    assert.equal(result.valid, false);
    assert.equal(result.errors[0].code, 'INVALID_SIGNATURE');
});

test('local artifact storage prevents traversal and round-trips content', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vimes-template-storage-'));
    try {
        const storage = new LocalTemplateArtifactStorage(root);
        await storage.put('PRESCRIPTION/v1/example.docx', Buffer.from('content'));
        assert.equal((await storage.get('PRESCRIPTION/v1/example.docx')).toString(), 'content');
        await assert.rejects(() => storage.put('../escape.docx', Buffer.from('bad')), /Unsafe/);
    } finally {
        await fs.rm(root, { recursive: true, force: true });
    }
});
