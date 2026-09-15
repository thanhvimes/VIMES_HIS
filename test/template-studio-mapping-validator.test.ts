import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMappingRules } from '../src/template-studio/mapping-validator';
import { applyMapping } from '../src/template-studio/mapping-engine';

test('mapping validator accepts safe paths and transforms', () => {
  const result = validateMappingRules([{ source: 'patient.fullName', target: 'patient.name', transform: 'trim' }, { source: 'items[0].code', target: 'rows[0].code', transform: 'uppercase' }]);
  assert.equal(result.valid, true);
  assert.equal(result.rules.length, 2);
});

test('mapping validator rejects code execution and invalid paths', () => {
  const result = validateMappingRules([{ source: 'patient;eval(x)', target: 'patient.name', transform: 'javascript:alert(1)' }]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 2);
});

test('mapping engine previews nested data with safe transforms', () => {
  const result = applyMapping([{ source: 'patient.fullName', target: 'patient.name', transform: 'trim' }, { source: 'patient.age', target: 'patient.ageNumber', transform: 'number' }], { patient: { fullName: '  Nguyen Van A ', age: '42' } });
  assert.deepEqual(result.data, { patient: { name: 'Nguyen Van A', ageNumber: 42 } });
  assert.deepEqual(result.errors, []);
});

test('mapping engine transforms boolean values', () => { assert.equal(applyMapping([{ source: 'active', target: 'enabled', transform: 'boolean' }], { active: 'true' }).data.enabled, true); });
test('mapping engine transforms ISO dates', () => { assert.equal(String(applyMapping([{ source: 'dob', target: 'birthDate', transform: 'date:ISO' }], { dob: '2024-01-02' }).data.birthDate).startsWith('2024-01-02'), true); });
test('mapping engine applies defaults for missing values', () => { assert.deepEqual(applyMapping([{ source: 'missing', target: 'value', defaultValue: 'N/A' }], {}).data, { value: 'N/A' }); });
test('mapping engine supports array indexes', () => { assert.deepEqual(applyMapping([{ source: 'items[0].code', target: 'rows[0].code', transform: 'uppercase' }], { items: [{ code: 'a1' }] }).data, { rows: [{ code: 'A1' }] }); });
test('mapping engine returns stable validation errors', () => { const result = applyMapping([{ source: 'x', target: 'y', transform: 'eval:bad' }], { x: 1 }); assert.equal(result.data && Object.keys(result.data).length, 0); assert.match(result.errors[0], /transform/); });
test('mapping engine lowercases text', () => { assert.equal(applyMapping([{ source: 'x', target: 'y', transform: 'lowercase' }], { x: 'ABC' }).data.y, 'abc'); });
test('mapping engine trims text', () => { assert.equal(applyMapping([{ source: 'x', target: 'y', transform: 'trim' }], { x: '  abc  ' }).data.y, 'abc'); });
test('mapping engine converts numbers', () => { assert.equal(applyMapping([{ source: 'x', target: 'y', transform: 'number' }], { x: '12.5' }).data.y, 12.5); });
test('mapping engine formats Vietnamese dates', () => { assert.equal(applyMapping([{ source: 'x', target: 'y', transform: 'date:dd/MM/yyyy' }], { x: '2024-01-02T00:00:00Z' }).data.y, '02/01/2024'); });
test('mapping engine omits non-nullable missing fields', () => { assert.deepEqual(applyMapping([{ source: 'x', target: 'y', nullable: false }], {}).data, {}); });
test('validator accepts underscore paths', () => { assert.equal(validateMappingRules([{ source: '_patient.id', target: 'patient.id' }]).valid, true); });
test('validator accepts numeric array paths', () => { assert.equal(validateMappingRules([{ source: 'items[12].code', target: 'rows[0].code' }]).valid, true); });
test('validator rejects empty source', () => { assert.equal(validateMappingRules([{ source: '', target: 'x' }]).valid, false); });
test('validator rejects prototype traversal', () => { assert.equal(validateMappingRules([{ source: '__proto__.x', target: 'x' }]).valid, false); });
test('validator rejects function transform', () => { assert.equal(validateMappingRules([{ source: 'x', target: 'y', transform: 'function(x)' }]).valid, false); });
test('engine preserves null with nullable rule', () => { assert.deepEqual(applyMapping([{ source: 'x', target: 'y', nullable: true }], { x: null }).data, { y: undefined }); });
test('engine handles empty arrays', () => { assert.deepEqual(applyMapping([{ source: 'items[0].code', target: 'rows[0].code' }], { items: [] }).data, {}); });
test('engine handles missing nested object', () => { assert.deepEqual(applyMapping([{ source: 'patient.name', target: 'person.name' }], {}).data, {}); });
test('engine applies uppercase to unicode text', () => { assert.equal(applyMapping([{ source: 'x', target: 'y', transform: 'uppercase' }], { x: 'đặng' }).data.y, 'ĐẶNG'); });
test('validator returns normalized rules only for valid input', () => { const result = validateMappingRules([{ source: 'x', target: 'y' }, { source: 'bad path', target: 'z' }]); assert.equal(result.rules.length, 1); });
