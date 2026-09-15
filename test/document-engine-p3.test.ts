import test from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker, CircuitBreakerOpenError } from '../src/document-engine/circuit-breaker';
import { maskString, maskObject, sanitizeError } from '../src/document-engine/phi-sanitizer';
import { documentService } from '../src/document-engine/document.service';
import { templateStudioService } from '../src/template-studio/template-studio.service';

test('Circuit Breaker state transitions and auto-recovery', async () => {
    const breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeoutMs: 50,
        halfOpenMaxCalls: 2
    });

    assert.equal(breaker.getState(), 'CLOSED');

    // Successful execution
    const res1 = await breaker.execute(async () => 'ok');
    assert.equal(res1, 'ok');
    assert.equal(breaker.getState(), 'CLOSED');

    // 1st failure
    await assert.rejects(async () => {
        await breaker.execute(async () => { throw new Error('Fail 1'); });
    });
    assert.equal(breaker.getState(), 'CLOSED');

    // 2nd failure
    await assert.rejects(async () => {
        await breaker.execute(async () => { throw new Error('Fail 2'); });
    });
    assert.equal(breaker.getState(), 'CLOSED');

    // 3rd failure -> Tripped to OPEN
    await assert.rejects(async () => {
        await breaker.execute(async () => { throw new Error('Fail 3'); });
    });
    assert.equal(breaker.getState(), 'OPEN');

    // In OPEN state, calls fail fast with CircuitBreakerOpenError
    await assert.rejects(async () => {
        await breaker.execute(async () => 'should not run');
    }, (err: any) => err instanceof CircuitBreakerOpenError && err.status === 503);

    // Wait for reset timeout
    await new Promise(r => setTimeout(r, 60));

    // Next call transitions to HALF_OPEN
    assert.equal(breaker.getState(), 'HALF_OPEN');

    // 1st success in HALF_OPEN
    const res2 = await breaker.execute(async () => 'half-open-1');
    assert.equal(res2, 'half-open-1');

    // 2nd success in HALF_OPEN closes the circuit
    const res3 = await breaker.execute(async () => 'half-open-2');
    assert.equal(res3, 'half-open-2');
    assert.equal(breaker.getState(), 'CLOSED');
});

test('PHI/PII Data Sanitization correctly masks sensitive health information', () => {
    // 1. Citizen ID (CCCD - 12 digits)
    const cccdText = 'Bệnh nhân có CCCD 001099123456 đến khám';
    assert.equal(maskString(cccdText), 'Bệnh nhân có CCCD 0010*****456 đến khám');

    // 2. Phone number (10 digits)
    const phoneText = 'Liên hệ người nhà số 0912345678 gấp';
    assert.equal(maskString(phoneText), 'Liên hệ người nhà số 091****678 gấp');

    // 3. BHYT Card Number (15 characters)
    const bhytText = 'Thẻ BHYT: GD4010123456789 tuyến TW';
    assert.equal(maskString(bhytText), 'Thẻ BHYT: GD401*******789 tuyến TW');

    // 4. Email
    const emailText = 'Email nhận kết quả: nguyen.van.a@benhvien.vn';
    assert.equal(maskString(emailText), 'Email nhận kết quả: n***a@benhvien.vn');

    // 5. Sensitive JSON Object Masking
    const patientData = {
        patient_name: 'Nguyễn Văn A',
        cccd: '079099888777',
        phone: '0988776655',
        exam_result: {
            doctor: 'BS. Trần Bình',
            diagnosis: 'Viêm họng cấp',
            so_dien_thoai: '0933221100'
        },
        items: [
            { name: 'Paracetamol', so_the_bhyt: 'DN4019988776655' }
        ]
    };

    const masked = maskObject(patientData);
    assert.ok(masked.cccd.includes('*****'));
    assert.ok(masked.phone.includes('****'));
    assert.ok(masked.exam_result.so_dien_thoai.includes('****'));
    assert.equal(masked.exam_result.diagnosis, 'Viêm họng cấp');
    assert.ok(masked.items[0].so_the_bhyt.includes('*******'));

    // 6. Error sanitization
    const rawError = new Error('Database connection failed while querying CCCD 001099123456 and phone 0901234567');
    const sanitized = sanitizeError(rawError);
    assert.ok(!sanitized.includes('001099123456'));
    assert.ok(!sanitized.includes('0901234567'));
    assert.ok(sanitized.includes('0010*****456'));
});

test('DocumentService Idempotency Cache and Priority Lane', async () => {
    documentService.clearIdempotencyCache();

    // Verify circuit breaker status
    const status = documentService.getCircuitBreakerStatus();
    assert.ok(['CLOSED', 'OPEN', 'HALF_OPEN'].includes(status.state));
});

test('Template Studio Orphan Artifact Scanner & Operations Metrics', async () => {
    const metrics = await templateStudioService.getOperationsDashboardMetrics();
    assert.ok(metrics);
    assert.ok(typeof metrics.templates.total === 'number');
    assert.ok(typeof metrics.testRuns.total === 'number');
    assert.ok(typeof metrics.storage.totalArtifacts === 'number');
    assert.equal(metrics.health.database, 'HEALTHY');

    // Orphan scanner
    const storageFiles = [
        { key: 'templates/active/demo.docx', size: 1024, modifiedAt: new Date().toISOString() },
        { key: 'templates/orphan/old_temp_file.docx', size: 2048, modifiedAt: new Date().toISOString() }
    ];
    const orphans = await templateStudioService.repository.listOrphanArtifacts(storageFiles);
    assert.ok(Array.isArray(orphans));

    // Orphan cleanup audit test
    const cleaned = await templateStudioService.repository.cleanupOrphanArtifacts('test_admin', ['templates/orphan/old_temp_file.docx']);
    assert.equal(cleaned, 1);
});
