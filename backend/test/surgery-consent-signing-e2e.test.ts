import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { documentService } from '../src/document-engine/document.service';
import { signatureService } from '../src/document-signature/signature.service';
import { PlaceholderRepository } from '../src/document-signature/placeholder.repository';
import { query } from '../src/config/database';

test('SURGERY_CONSENT - Full Digital Signature End-to-End Workflow (Doctor & Patient)', async () => {
    // 1. Load sample data & manifest for SURGERY_CONSENT
    const templateDir = path.resolve(__dirname, '../templates/documents/SURGERY_CONSENT/v1');
    const sampleData = JSON.parse(await fs.readFile(path.join(templateDir, 'sample-data.json'), 'utf8'));
    const manifest = JSON.parse(await fs.readFile(path.join(templateDir, 'manifest.json'), 'utf8'));

    assert.equal(manifest.code, 'SURGERY_CONSENT');
    assert.equal(manifest.documentType, 'SURGERY_CONSENT');
    assert.equal(sampleData.patient.fullName, 'HOÀNG MINH TRÍ');
    assert.equal(sampleData.doctor.fullName, 'BS. CKII NGUYỄN VĂN AN');

    // 2. Render Document to DOCX / PDF
    const renderResult = await documentService.render({
        templateCode: 'SURGERY_CONSENT',
        outputFormat: 'docx',
        data: sampleData
    });

    assert.ok(renderResult);
    assert.ok(renderResult.content);
    assert.ok(renderResult.content.length > 0);
    assert.equal(renderResult.template.code, 'SURGERY_CONSENT');

    // Compute SHA-256 of the rendered document
    const documentSha256 = crypto.createHash('sha256').update(renderResult.content).digest('hex');
    assert.equal(documentSha256.length, 64);

    // 3. Verify Database Template & Placeholders for SURGERY_CONSENT
    const templateRes = await query('SELECT id, active_version_id FROM hms_document_template WHERE code=$1', ['SURGERY_CONSENT']);
    assert.ok(templateRes.rows[0], 'Template SURGERY_CONSENT should exist in database');
    const templateId = Number(templateRes.rows[0].id);
    const versionId = Number(templateRes.rows[0].active_version_id);

    const placeholderRepo = new PlaceholderRepository();
    const placeholders = await placeholderRepo.list(versionId);

    assert.equal(placeholders.length, 2, 'Should have exactly 2 signature placeholders');

    const patientPlaceholder = placeholders.find(p => p.code === 'SIG_PATIENT');
    const doctorPlaceholder = placeholders.find(p => p.code === 'SIG_DOCTOR');

    assert.ok(patientPlaceholder, 'SIG_PATIENT placeholder must exist');
    assert.equal(patientPlaceholder.signer_role, 'PATIENT');
    assert.equal(patientPlaceholder.signing_order, 1);
    assert.equal(Number(patientPlaceholder.page_index), 0);
    assert.equal(Number(patientPlaceholder.x1_pt), 50);
    assert.equal(Number(patientPlaceholder.x2_pt), 260);

    assert.ok(doctorPlaceholder, 'SIG_DOCTOR placeholder must exist');
    assert.equal(doctorPlaceholder.signer_role, 'DOCTOR');
    assert.equal(doctorPlaceholder.signing_order, 2);
    assert.equal(Number(doctorPlaceholder.page_index), 0);
    assert.equal(Number(doctorPlaceholder.x1_pt), 335);
    assert.equal(Number(doctorPlaceholder.x2_pt), 545);

    // Ensure signature boxes do not overlap
    assert.ok(Number(patientPlaceholder.x2_pt) < Number(doctorPlaceholder.x1_pt), 'Boxes must not overlap');

    // 4. Create Signing Session
    const documentId = `SURGERY_DOC_${Date.now()}`;
    const session = await signatureService.createSession({
        documentId,
        documentVersion: 1,
        documentSha256,
        sourceArtifactKey: `documents/${documentId}.pdf`,
        expiresAt: new Date(Date.now() + 60 * 60_000), // 1 hour TTL
        createdBy: 'nurse_reception_01'
    });

    assert.ok(session.id);
    assert.equal(session.status, 'OPEN');
    assert.equal(session.document_sha256, documentSha256);

    // 5. Step 1: Patient Signing Flow (SIG_PATIENT)
    const patientReq = await signatureService.createRequest({
        sessionId: session.id,
        placeholderId: Number(patientPlaceholder.id),
        placementType: 'PLACEHOLDER',
        pageIndex: Number(patientPlaceholder.page_index),
        x1Pt: Number(patientPlaceholder.x1_pt),
        y1Pt: Number(patientPlaceholder.y1_pt),
        x2Pt: Number(patientPlaceholder.x2_pt),
        y2Pt: Number(patientPlaceholder.y2_pt),
        pageWidthPt: Number(patientPlaceholder.page_width_pt),
        pageHeightPt: Number(patientPlaceholder.page_height_pt),
        pageRotation: 0,
        signerUserId: 'patient_hoang_tri',
        signerRole: 'PATIENT',
        signingOrder: 1,
        reason: 'Tôi đồng ý phẫu thuật theo chỉ định của Bác sĩ',
        location: 'Hà Nội',
        idempotencyKey: `req_patient_${Date.now()}`
    });

    assert.equal(patientReq.status, 'PENDING');
    assert.equal(patientReq.signer_role, 'PATIENT');

    // Prepare patient signature
    const patientPrepared = await signatureService.prepare(patientReq.id, 'patient_hoang_tri');
    assert.equal(patientPrepared.status, 'PREPARED');
    assert.ok(patientPrepared.transactionId);

    // Transition to AUTHORIZED and complete signature for patient
    await query(`UPDATE hms_document_signature_request SET status='AUTHORIZED' WHERE id=$1`, [patientReq.id]);

    const patientSignedSha = crypto.createHash('sha256').update(documentSha256 + '_patient_signed').digest('hex');
    const patientCompleted = await signatureService.complete(
        patientReq.id,
        patientPrepared.transactionId,
        `documents/${documentId}_p1.pdf`,
        patientSignedSha,
        'patient_hoang_tri'
    );

    assert.equal(patientCompleted.status, 'SIGNED');
    assert.equal(patientCompleted.result_artifact_sha256, patientSignedSha);

    // 6. Step 2: Doctor Signing Flow (SIG_DOCTOR)
    const doctorReq = await signatureService.createRequest({
        sessionId: session.id,
        placeholderId: Number(doctorPlaceholder.id),
        placementType: 'PLACEHOLDER',
        pageIndex: Number(doctorPlaceholder.page_index),
        x1Pt: Number(doctorPlaceholder.x1_pt),
        y1Pt: Number(doctorPlaceholder.y1_pt),
        x2Pt: Number(doctorPlaceholder.x2_pt),
        y2Pt: Number(doctorPlaceholder.y2_pt),
        pageWidthPt: Number(doctorPlaceholder.page_width_pt),
        pageHeightPt: Number(doctorPlaceholder.page_height_pt),
        pageRotation: 0,
        signerUserId: 'doctor_dr_an',
        signerRole: 'DOCTOR',
        signingOrder: 2,
        reason: 'Đã giải thích cặn kẽ tình trạng bệnh và cam đoan phẫu thuật',
        location: 'Khoa Ngoại',
        idempotencyKey: `req_doctor_${Date.now()}`
    });

    assert.equal(doctorReq.status, 'PENDING');
    assert.equal(doctorReq.signer_role, 'DOCTOR');

    // Prepare doctor signature
    const doctorPrepared = await signatureService.prepare(doctorReq.id, 'doctor_dr_an');
    assert.equal(doctorPrepared.status, 'PREPARED');
    assert.ok(doctorPrepared.transactionId);

    // Transition to AUTHORIZED and complete signature for doctor
    await query(`UPDATE hms_document_signature_request SET status='AUTHORIZED' WHERE id=$1`, [doctorReq.id]);

    const finalSignedSha = crypto.createHash('sha256').update(patientSignedSha + '_doctor_signed').digest('hex');
    const doctorCompleted = await signatureService.complete(
        doctorReq.id,
        doctorPrepared.transactionId,
        `documents/${documentId}_final.pdf`,
        finalSignedSha,
        'doctor_dr_an'
    );

    assert.equal(doctorCompleted.status, 'SIGNED');
    assert.equal(doctorCompleted.result_artifact_sha256, finalSignedSha);

    // 7. Complete Session
    const completedSession = await signatureService.repository.setSessionStatus(session.id, ['OPEN', 'PROCESSING', 'PARTIALLY_SIGNED'], 'COMPLETED');
    assert.equal(completedSession.status, 'COMPLETED');
    assert.ok(completedSession.completed_at);

    // 8. Audit Trail Verification
    const auditLogs = await signatureService.repository.listAudit(session.id);
    assert.ok(auditLogs.length >= 2, 'Must record audit events for both signatures');

    const patientAudit = auditLogs.find(a => a.actor_id === 'patient_hoang_tri');
    const doctorAudit = auditLogs.find(a => a.actor_id === 'doctor_dr_an');

    assert.ok(patientAudit, 'Patient audit event must exist');
    assert.equal(patientAudit.action, 'SIGNATURE_COMPLETED');
    assert.equal(patientAudit.result, 'SUCCESS');

    assert.ok(doctorAudit, 'Doctor audit event must exist');
    assert.equal(doctorAudit.action, 'SIGNATURE_COMPLETED');
    assert.equal(doctorAudit.result, 'SUCCESS');
    assert.equal(doctorAudit.document_sha256_after, finalSignedSha);
});
