import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');
const formPath = path.join(repoRoot, 'modules/health-check-sync/forms/DynamicForm.tsx');
const hookPath = path.join(repoRoot, 'modules/health-check-sync/hooks/useDynamicFormState.ts');
const childHookPath = path.join(repoRoot, 'modules/health-check-sync/forms/mau1-child/hooks/useChildFormState.ts');
const xmlPreviewPath = path.join(repoRoot, 'modules/health-check-sync/components/modals/XmlPreviewModal.tsx');

test('UI form selector exposes exactly the three QĐ 2062 new forms', () => {
    const source = fs.readFileSync(formPath, 'utf8');
    assert.equal((source.match(/<option value="[123]"/g) || []).length, 3);
    assert.equal(source.includes('value="driver"'), false);
});

test('XML preview UI can save the hồ sơ XML locally for comparison', () => {
    const source = fs.readFileSync(xmlPreviewPath, 'utf8');
    assert.ok(source.includes('Lưu file XML'));
    assert.ok(source.includes('new Blob([xmlContent]'));
    assert.ok(source.includes('application/xml;charset=utf-8'));
    assert.ok(source.includes('link.download'));
    assert.ok(source.includes('.xml'));
});

test('UI submit hooks include required new-form validation fields', () => {
    const source = fs.readFileSync(hookPath, 'utf8');
    assert.ok(source.includes('fundingSource'));
    assert.ok(source.includes('fitnessClass'));
    assert.ok(source.includes('validateNewFormAge'));
    assert.ok(source.includes('newErrors.dob'));
});

test('child UI submit hook includes QĐ 2062 funding and age validation', () => {
    const source = fs.readFileSync(childHookPath, 'utf8');
    assert.ok(source.includes('fundingSource'));
    assert.ok(source.includes("validateNewFormAge('1', dob)"));
});
