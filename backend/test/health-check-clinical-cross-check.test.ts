import test from 'node:test';
import assert from 'node:assert/strict';
import { getClinicalCrossCheckWarnings, parseFitnessClassToNumber } from '../src/services/health-check-clinical-cross-check';

test('parseFitnessClassToNumber parses numeric, Roman and text inputs', () => {
    assert.equal(parseFitnessClassToNumber('1'), 1);
    assert.equal(parseFitnessClassToNumber('I'), 1);
    assert.equal(parseFitnessClassToNumber('Loại I'), 1);
    assert.equal(parseFitnessClassToNumber('Loại 2'), 2);
    assert.equal(parseFitnessClassToNumber('III'), 3);
    assert.equal(parseFitnessClassToNumber('Loại IV'), 4);
    assert.equal(parseFitnessClassToNumber('Loại V'), 5);
    assert.equal(parseFitnessClassToNumber(null), null);
});

test('Normal vitals with Class 1 produces no warnings', () => {
    const res = getClinicalCrossCheckWarnings({
        height: '170',
        weight: '65',
        bp: '120/80',
        pulse: '75',
        fitnessClass: '1',
        isChild: false,
    });

    assert.equal(res.hasWarnings, false);
    assert.equal(res.hasSevereWarnings, false);
    assert.equal(res.warnings.length, 0);
    assert.equal(res.calculatedBmi, 22.5);
});

test('Stage 2 Hypertension (165/105) triggers warning when rated Class 1 or Class 2', () => {
    const resClass1 = getClinicalCrossCheckWarnings({
        height: '170',
        weight: '65',
        bp: '165/105',
        pulse: '75',
        fitnessClass: '1',
        isChild: false,
    });

    assert.equal(resClass1.hasWarnings, true);
    assert.equal(resClass1.hasSevereWarnings, true);
    const bpWarn = resClass1.warnings.find((w: any) => w.id === 'BP_STAGE_2_HYPERTENSION');
    assert.ok(bpWarn);
    assert.equal(bpWarn.severity, 'warning');

    const resClass3 = getClinicalCrossCheckWarnings({
        height: '170',
        weight: '65',
        bp: '165/105',
        pulse: '75',
        fitnessClass: '3',
        isChild: false,
    });
    assert.equal(resClass3.warnings.some((w: any) => w.id === 'BP_STAGE_2_HYPERTENSION'), false);
});

test('Severe Obesity (BMI >= 30) triggers warning when rated Class 1 or Class 2', () => {
    const res = getClinicalCrossCheckWarnings({
        height: '160',
        weight: '85', // BMI ~ 33.2
        bp: '120/80',
        pulse: '75',
        fitnessClass: '1',
        isChild: false,
    });

    assert.equal(res.hasWarnings, true);
    assert.equal(res.hasSevereWarnings, true);
    const bmiWarn = res.warnings.find((w: any) => w.id === 'BMI_OBESE_II');
    assert.ok(bmiWarn);
    assert.equal(res.calculatedBmi, 33.2);
});

test('Specialty exam rating mismatch triggers warning when overall conclusion is Class 1', () => {
    const res = getClinicalCrossCheckWarnings({
        height: '170',
        weight: '65',
        bp: '120/80',
        pulse: '75',
        fitnessClass: '1',
        isChild: false,
        specialtiesPl: {
            khamMatPl: '4', // Mắt loại 4
            noiKhoaTuanHoanPl: '1',
        }
    });

    assert.equal(res.hasWarnings, true);
    assert.equal(res.hasSevereWarnings, true);
    const eyeWarn = res.warnings.find((w: any) => w.id === 'SPEC_MISMATCH_khamMatPl');
    assert.ok(eyeWarn);
    assert.match(eyeWarn.message, /Chuyên khoa "Mắt" đang đánh giá Loại 4/);
});
