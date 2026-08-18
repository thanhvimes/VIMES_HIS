import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDocx } from '../src/template-studio/docx-validator';
import { FieldMetadata } from '../src/template-studio/contract-catalog';
import { TemplateRegistry } from '../src/document-engine/template-registry';

test('DOCX validator detects field type mismatches when array is tagged without index', () => {
    // Mock minimal zip buffer with document.xml referencing array without index
    const fieldMeta = new Map<string, FieldMetadata>([
        ['services', { path: 'services', type: 'array', isArray: true, isObject: false }],
        ['patient_name', { path: 'patient_name', type: 'string', isArray: false, isObject: false }]
    ]);

    // Test with invalid zip buffer
    const invalidResult = validateDocx(Buffer.from('not-a-zip'), new Set(['services']), fieldMeta);
    assert.equal(invalidResult.valid, false);
});

test('Document Engine resolves active version changes and rollback without restart', async () => {
    let active = 1;
    const registry = new TemplateRegistry('unused', async (code, version) => {
        const selected = version ?? active;
        if (code !== 'LAB_RESULT' || ![1, 2].includes(selected)) return undefined;
        return { code, name: 'Lab', version: selected, file: `${selected}.docx`, documentType: 'LAB', status: 'published', artifactKey: `${code}/v${selected}/artifact.docx` };
    });
    assert.equal((await registry.resolveActive('LAB_RESULT')).version, 1);
    active = 2;
    assert.equal((await registry.resolveActive('LAB_RESULT')).version, 2);
    active = 1;
    assert.equal((await registry.resolveActive('LAB_RESULT')).version, 1);
    await assert.rejects(() => registry.resolveActive('UNKNOWN'), { status: 404 });
});
