import test from 'node:test'; import assert from 'node:assert/strict';
import { applyMapping } from '../src/template-studio/mapping-engine';

test('mapping preview contract returns data for valid payload', () => { const result = applyMapping([{ source: 'patient.name', target: 'patient.fullName', transform: 'trim' }], { patient: { name: ' A ' } }); assert.deepEqual(result, { data: { patient: { fullName: 'A' } }, errors: [] }); });
test('mapping preview contract returns stable errors for invalid payload', () => { const result = applyMapping([{ source: 'patient.name', target: 'patient.fullName', transform: 'javascript:eval' }], { patient: { name: 'A' } }); assert.equal(result.data && Object.keys(result.data).length, 0); assert.equal(result.errors.length, 1); });
test('mapping preview accepts masked source values', () => { const result = applyMapping([{ source: 'patient.phone', target: 'patient.phone' }], { patient: { phone: '***1234' } }); assert.equal((result.data.patient as any).phone, '***1234'); });
