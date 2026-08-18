import crypto from 'node:crypto';
import path from 'node:path';
import { CarboneRenderer } from '../document-engine/carbone-renderer';
import { TemplateRegistry } from '../document-engine/template-registry';
import { templateRegistry } from '../document-engine/document.service';
import { renderCapacity } from '../document-engine/render-capacity';
import { ContractCatalog, validateJsonData } from './contract-catalog';
import { validateDocx } from './docx-validator';
import { LocalTemplateArtifactStorage, S3TemplateArtifactStorage, TemplateArtifactStorage } from './local-template-storage';
import { TemplateStudioRepository } from './template-studio.repository';
import { TemplateVersionStatus } from './types';

const templateRoot = path.resolve(process.env.DOCUMENT_TEMPLATE_DIR || path.join(process.cwd(), 'templates', 'documents'));
const artifactRoot = path.resolve(process.env.TEMPLATE_STUDIO_STORAGE_DIR || path.join(process.cwd(), 'storage', 'template-studio'));

import { buildPackage, unpackAndVerifyPackage, packZip, TemplatePackageMetadata } from './template-package';

export class TemplateStudioService {
    readonly repository = new TemplateStudioRepository();
    readonly contracts = new ContractCatalog(templateRoot);
    readonly storage: TemplateArtifactStorage = process.env.TEMPLATE_STUDIO_STORAGE === 's3'
        ? new S3TemplateArtifactStorage(String(process.env.S3_BUCKET || 'vimes-document-templates'))
        : new LocalTemplateArtifactStorage(artifactRoot);
    private readonly renderer = new CarboneRenderer(new TemplateRegistry(templateRoot), {
        baseUrl: process.env.CARBONE_URL || 'http://127.0.0.1:4000',
        token: process.env.CARBONE_TOKEN,
        timeoutMs: Number(process.env.CARBONE_TIMEOUT_MS || 30_000),
        converter: process.env.CARBONE_CONVERTER === 'O' ? 'O' : 'L'
    });

    async upload(versionId: number, content: Buffer, actor: string) {
        const version = await this.repository.getVersion(versionId);
        const contract = await this.contracts.get(version.templateCode);
        const validation = validateDocx(content, contract.allowedFields, contract.fieldMeta);
        const key = `${version.templateCode}/v${version.version}/${validation.sha256}.docx`;
        await this.storage.put(key, content);
        await this.repository.updateArtifact(versionId, { key, sha256: validation.sha256, size: content.length, validation }, actor);
        return validation;
    }

    async getFallbackTemplateBuffer(
        templateCode: string,
        documentType?: string,
        templateName?: string,
        category?: string,
        sampleData?: Record<string, unknown>
    ): Promise<Buffer | null> {
        const fs = await import('node:fs/promises');
        const upperCode = (templateCode || '').toUpperCase();
        const upperType = (documentType || '').toUpperCase();
        const upperCat = (category || '').toUpperCase();

        const candidates: string[] = [
            path.join(templateRoot, templateCode, 'v1', 'template.docx'),
            path.join(process.cwd(), 'templates', 'carbone-live-test', `${templateCode}.docx`),
        ];

        // Specific mappings based on code, type, or category
        if (upperCode.includes('DON_THUOC') || upperCode.includes('PRESCRIPTION') || upperType === 'PRESCRIPTION') {
            candidates.push(
                path.join(templateRoot, 'PRESCRIPTION', 'v1', 'template.docx'),
                path.join(process.cwd(), 'templates', 'carbone-live-test', 'PRESCRIPTION.docx')
            );
        } else if (upperCode.includes('SURGERY') || upperCode.includes('CAM_DOAN') || upperType === 'CONSENT_FORM' || upperCat.includes('PHAU_THUAT')) {
            candidates.push(
                path.join(templateRoot, 'SURGERY_CONSENT', 'v1', 'template.docx'),
                path.join(process.cwd(), 'templates', 'carbone-live-test', 'SURGERY_CONSENT.docx')
            );
        } else if (upperCode.includes('DISCHARGE') || upperCode.includes('RA_VIEN') || upperType === 'SUMMARY_FORM' || upperCat.includes('NOI_TRU')) {
            candidates.push(
                path.join(templateRoot, 'DISCHARGE_SUMMARY', 'v1', 'template.docx'),
                path.join(process.cwd(), 'templates', 'carbone-live-test', 'DISCHARGE_SUMMARY.docx')
            );
        } else if (upperCode.includes('LAB') || upperCode.includes('XET_NGHIEM') || upperType === 'LAB_REPORT') {
            candidates.push(
                path.join(templateRoot, 'LAB_RESULT', 'v1', 'template.docx'),
                path.join(process.cwd(), 'templates', 'carbone-live-test', 'LAB_RESULT.docx')
            );
        } else if (upperCode.includes('ULTRASOUND') || upperCode.includes('SIEU_AM') || upperType === 'IMAGING_REPORT') {
            candidates.push(
                path.join(templateRoot, 'ULTRASOUND_RESULT', 'v1', 'template.docx'),
                path.join(process.cwd(), 'templates', 'carbone-live-test', 'ULTRASOUND_RESULT.docx')
            );
        } else if (upperCode.includes('BILLING') || upperCode.includes('VIEN_PHI')) {
            candidates.push(
                path.join(templateRoot, 'BILLING_SUMMARY', 'v1', 'template.docx'),
                path.join(process.cwd(), 'templates', 'carbone-live-test', 'BILLING_SUMMARY.docx')
            );
        } else if (upperCode.includes('TREATMENT') || upperCode.includes('DIEU_TRI')) {
            candidates.push(
                path.join(templateRoot, 'TREATMENT_SHEET', 'v1', 'template.docx'),
                path.join(process.cwd(), 'templates', 'carbone-live-test', 'TREATMENT_SHEET.docx')
            );
        } else if ((upperCode.includes('KHAM') || upperCode.includes('EXAM')) && !upperCode.includes('HOI_CHAN') && !upperCat.includes('HOI_CHAN')) {
            candidates.push(
                path.join(templateRoot, 'OUTPATIENT_EXAM', 'v1', 'template.docx'),
                path.join(process.cwd(), 'templates', 'carbone-live-test', 'OUTPATIENT_EXAM.docx')
            );
        }

        for (const candidate of candidates) {
            try {
                const data = await fs.readFile(candidate);
                if (data && data.length > 0) return data;
            } catch (_) {}
        }

        // Generate a dynamic starter DOCX specifically matching this template
        try {
            const { generateStarterDocx } = await import('./docx-generator');
            return await generateStarterDocx({
                templateCode,
                templateName: templateName || templateCode,
                documentType,
                category,
                sampleData
            });
        } catch (err) {
            console.error('Dynamic DOCX generator fallback error:', err);
        }

        return null;
    }

    async download(versionId: number, actor = 'system', ip?: string): Promise<{ content: Buffer; filename: string }> {
        const version = await this.repository.getVersion(versionId);
        let content: Buffer | null = null;
        if (version.artifactKey) {
            try { content = await this.storage.get(version.artifactKey); } catch (_) {}
        }
        if (!content) {
            content = await this.getFallbackTemplateBuffer(version.templateCode, version.documentType, version.templateName, version.category, version.sampleData);
        }
        if (!content) throw Object.assign(new Error('Template version has no DOCX artifact'), { status: 404 });
        await this.repository.auditAccess(versionId, actor, 'DOWNLOAD', { artifactKey: version.artifactKey || 'fallback_starter', ip: ip || 'unknown' });
        return { content, filename: `${version.templateCode}-v${version.version}.docx` };
    }
    async artifactSignedUrl(versionId: number, expiresInSeconds = 300, actor = 'system', ip?: string) {
        const version = await this.repository.getVersion(versionId);
        if (!version.artifactKey || !this.storage.signedUrl) throw Object.assign(new Error('Signed URL is only available with S3 storage'), { status: 409 });
        const url = await this.storage.signedUrl(version.artifactKey, expiresInSeconds);
        await this.repository.auditAccess(versionId, actor, 'SIGNED_URL', { expiresInSeconds, ip: ip || 'unknown' });
        return url;
    }
    async storageCapacity() { const value: any = this.storage.capacity ? await this.storage.capacity() : { storage: 'local', unsupported: true }; if (value.bytes !== undefined) value.alert = Number(value.bytes) >= Number(process.env.TEMPLATE_ALERT_STORAGE_BYTES || 10737418240); return value; }

    async deleteVersion(versionId: number, actor: string): Promise<void> {
        const version = await this.repository.getVersion(versionId);
        if (version.artifactKey && this.storage.delete) {
            try { await this.storage.delete(version.artifactKey); } catch (_) { /* ignore storage removal error */ }
        }
        await this.repository.deleteVersion(versionId, actor);
    }

    async transition(versionId: number, expected: TemplateVersionStatus[], next: TemplateVersionStatus, actor: string, note?: string): Promise<void> {
        const version = await this.repository.getVersion(versionId);
        await this.repository.transition(versionId, expected, next, actor, note);
        if (next === 'PUBLISHED') {
            templateRegistry.invalidate(version.templateCode);
        }
    }

    async rollback(versionId: number, actor: string, reason: string): Promise<void> {
        const version = await this.repository.getVersion(versionId);
        await this.repository.rollback(versionId, actor, reason);
        templateRegistry.invalidate(version.templateCode);
    }

    async metricsSummary() {
        return this.repository.metricsSummary();
    }

    async preview(versionId: number, format: 'docx' | 'pdf', data?: Record<string, unknown>, actor = 'system', ip?: string) {
        const version = await this.repository.getVersion(versionId);
        let template: Buffer | null = null;
        if (version.artifactKey) {
            try { template = await this.storage.get(version.artifactKey); } catch (_) {}
        }
        if (!template) {
            template = await this.getFallbackTemplateBuffer(version.templateCode, version.documentType, version.templateName, version.category, version.sampleData);
        }
        if (!template) {
            throw Object.assign(new Error('Chưa có file DOCX cho phiên bản này. Vui lòng bấm Upload DOCX để tải file Word lên.'), { status: 409 });
        }

        const renderData = data || version.sampleData || { patient_name: 'Nguyễn Văn An', patient_id: 'BN-001', date: new Date().toISOString().slice(0, 10) };
        let content: Buffer;
        try { 
            content = await renderCapacity.execute(() => this.renderer.renderBuffer(template!, renderData, format)); 
        }
        catch (error: any) {
            await this.repository.auditAccess(versionId, actor, 'PREVIEW_FAILED', { format, ip: ip || 'unknown', templateCode: version.templateCode, version: version.version, error: error instanceof Error ? error.message : 'render failed' });
            throw Object.assign(new Error(`Không thể kết xuất ${format.toUpperCase()}: ${error.message || 'Render failed'}`), { status: 502, details: { templateCode: version.templateCode, version: version.version, format } });
        }
        await this.repository.auditAccess(versionId, actor, 'PREVIEW', { format, ip: ip || 'unknown', templateCode: version.templateCode, version: version.version });
        return {
            content,
            sha256: crypto.createHash('sha256').update(content).digest('hex'),
            filename: `${version.templateCode}-v${version.version}-preview.${format}`
        };
    }

    async runTest(versionId: number, testCaseId: number | undefined, data: Record<string, unknown>, actor: string) {
        const version = await this.repository.getVersion(versionId);
        let template: Buffer | null = null;
        if (version.artifactKey) {
            try { template = await this.storage.get(version.artifactKey); } catch (_) {}
        }
        if (!template) {
            template = await this.getFallbackTemplateBuffer(version.templateCode, version.documentType, version.templateName, version.category, version.sampleData);
        }
        if (!template) {
            throw Object.assign(new Error('Chưa có file DOCX cho phiên bản này. Vui lòng bấm Upload DOCX.'), { status: 409 });
        }

        const runId = await this.repository.createTestRun(versionId, testCaseId, actor);
        const startedAt = Date.now();
        try {
            const [docx, pdf] = await Promise.all([
                renderCapacity.execute(() => this.renderer.renderBuffer(template!, data, 'docx')),
                renderCapacity.execute(() => this.renderer.renderBuffer(template!, data, 'pdf'))
            ]);
            const docxSha256 = crypto.createHash('sha256').update(docx).digest('hex');
            const pdfSha256 = crypto.createHash('sha256').update(pdf).digest('hex');
            const docxKey = `test-runs/${version.templateCode}/v${version.version}/${runId}.docx`;
            const pdfKey = `test-runs/${version.templateCode}/v${version.version}/${runId}.pdf`;
            await Promise.all([this.storage.put(docxKey, docx), this.storage.put(pdfKey, pdf)]);
            await this.repository.completeTestRun(runId, {
                status: 'PASSED', validationErrors: [], validationWarnings: [], docxKey, pdfKey,
                docxSha256, pdfSha256, docxSize: docx.length, pdfSize: pdf.length, durationMs: Date.now() - startedAt,
                engineVersion: `carbone-v5/${process.env.CARBONE_CONVERTER === 'O' ? 'onlyoffice' : 'libreoffice'}`
            });
        } catch (error) {
            await this.repository.completeTestRun(runId, {
                status: 'FAILED', validationErrors: [{ code: 'RENDER_FAILED', message: error instanceof Error ? error.message : 'Render failed' }],
                validationWarnings: [], durationMs: Date.now() - startedAt,
                engineVersion: `carbone-v5/${process.env.CARBONE_CONVERTER === 'O' ? 'onlyoffice' : 'libreoffice'}`
            });
            throw error;
        }
        return this.repository.listTestRuns(versionId, 1).then(runs => runs[0]);
    }

    async runAllTests(versionId: number, actor: string) {
        const cases = await this.repository.listTestCases(versionId);
        const results: Array<any> = [];
        for (const testCase of cases) {
            try { results.push(await this.runTest(versionId, testCase.id, testCase.inputData, actor)); }
            catch (error: any) { results.push({ testCaseId: testCase.id, status: 'FAILED', error: error.message }); }
        }
        return { total: results.length, passed: results.filter(item => item.status === 'PASSED').length, failed: results.filter(item => item.status !== 'PASSED').length, results };
    }

    async exportPackage(versionId: number, actor: string): Promise<{ buffer: Buffer; filename: string; manifest: any }> {
        const data = await this.repository.getPackageData(versionId);
        let docxArtifact: Buffer | undefined;
        if (data.version.artifactKey) {
            try { docxArtifact = await this.storage.get(data.version.artifactKey); } catch (_) {}
        }

        const metadata: TemplatePackageMetadata = {
            template: {
                code: data.template.code,
                name: data.template.name,
                documentType: data.template.documentType,
                moduleCode: data.template.moduleCode,
                description: data.template.description,
                category: data.template.category,
                tags: data.template.tags,
                scope: data.template.scope,
                printConfig: data.template.printConfig
            },
            version: {
                version: data.version.version,
                changeNote: data.version.changeNote,
                sampleData: data.version.sampleData
            },
            contract: data.contract,
            testCases: data.testCases
        };

        const result = buildPackage({ metadata, docxArtifact });
        return {
            buffer: result.buffer,
            filename: `${data.template.code}-v${data.version.version}-package.zip`,
            manifest: result.manifest
        };
    }

    async previewPackage(buffer: Buffer): Promise<{
        valid: boolean;
        manifest?: any;
        metadata?: any;
        conflict: boolean;
        existingTemplateId?: number;
        testCasesCount: number;
        hasDocx: boolean;
        errors: string[];
    }> {
        const unpacked = unpackAndVerifyPackage(buffer);
        if (!unpacked.valid || !unpacked.metadata) {
            return {
                valid: false,
                conflict: false,
                testCasesCount: 0,
                hasDocx: false,
                errors: unpacked.errors
            };
        }

        const existing = await this.repository.findByCode(unpacked.metadata.template.code);
        return {
            valid: true,
            manifest: unpacked.manifest,
            metadata: unpacked.metadata,
            conflict: Boolean(existing),
            existingTemplateId: existing?.id,
            testCasesCount: unpacked.metadata.testCases?.length || 0,
            hasDocx: Boolean(unpacked.files['template.docx']),
            errors: []
        };
    }

    async importPackage(buffer: Buffer, actor: string): Promise<{
        templateId: number;
        versionId: number;
        versionNumber: number;
        templateCode: string;
    }> {
        const unpacked = unpackAndVerifyPackage(buffer);
        if (!unpacked.valid || !unpacked.metadata) {
            throw Object.assign(new Error(`Package validation failed: ${unpacked.errors.join('; ')}`), { status: 400, details: unpacked.errors });
        }

        const metadata = unpacked.metadata;
        let artifactInfo: { key: string; sha256: string; size: number; validation: any } | undefined;

        if (unpacked.files['template.docx']) {
            const docxBuffer = unpacked.files['template.docx'];
            let allowedFields: Set<string> | undefined;
            let fieldMeta: any;
            if (metadata.contract) {
                // If contract is present
                try {
                    const catalogContract = await this.contracts.get(metadata.template.code);
                    allowedFields = catalogContract.allowedFields;
                    fieldMeta = catalogContract.fieldMeta;
                } catch (_) {}
            }
            const validation = validateDocx(docxBuffer, allowedFields, fieldMeta);
            const key = `${metadata.template.code}/v${metadata.version.version || 1}/${validation.sha256}.docx`;
            await this.storage.put(key, docxBuffer);
            artifactInfo = {
                key,
                sha256: validation.sha256,
                size: docxBuffer.length,
                validation
            };
        }

        return this.repository.importPackage({ metadata, artifact: artifactInfo }, actor);
    }

    async generateStarterPack(templateCode?: string): Promise<{ buffer: Buffer; filename: string }> {
        let sampleData: Record<string, unknown> = {
            patient_name: 'NGUYỄN VĂN AN',
            patient_code: 'BN20260814001',
            dob: '15/05/1985',
            gender: 'NAM',
            address: '123 Đường Y Học, Phường 1, Quận 5, TP. Hồ Chí Minh',
            phone: '0901234567',
            insurance_number: 'DN4797931852468',
            exam_date: '14/08/2026 08:30',
            doctor_name: 'BS. CKII TRẦN MINH TUẤN',
            department_name: 'Khoa Khám Bệnh',
            diagnosis: 'Viêm dạ dày ruột cấp tính (K29.0)',
            services: [
                { stt: 1, name: 'Khám chuyên khoa Nội', quantity: 1, unit: 'Lượt', price: 150000, amount: 150000 },
                { stt: 2, name: 'Nội soi dạ dày tá tràng', quantity: 1, unit: 'Lần', price: 650000, amount: 650000 },
                { stt: 3, name: 'Tổng phân tích tế bào máu ngoại vi', quantity: 1, unit: 'Xét nghiệm', price: 120000, amount: 120000 }
            ],
            total_amount: 920000,
            insurance_paid: 736000,
            patient_paid: 184000,
            is_emergency: false,
            note: 'Tái khám sau 7 ngày hoặc khi có dấu hiệu đau bụng tăng.'
        };

        let schema: any;
        if (templateCode) {
            try {
                const contract = await this.contracts.get(templateCode);
                if (contract.sampleData && Object.keys(contract.sampleData).length) sampleData = contract.sampleData;
                schema = contract.jsonSchema;
            } catch (_) {}
        }

        const cheatSheet = `# HƯỚNG DẪN THIẾT KẾ BIỂU MẪU CARBONE V5 (VIMES HIS)

## 1. Cú pháp Thẻ đơn (Single Field)
- Thẻ cơ bản: \`{d.patient_name}\`
- Thẻ lồng nhau: \`{d.patient.address}\`

## 2. Bảng lặp (Repeating Table) & Số thứ tự
- Đặt thẻ trong dòng bảng của Word:
  | STT | Tên Dịch Vụ | Số Lượng | Đơn Giá | Thành Tiền |
  | \`{d.services[i].stt}\` | \`{d.services[i].name}\` | \`{d.services[i].quantity}\` | \`{d.services[i].price:formatNumber('#,###')}\` | \`{d.services[i].amount:formatNumber('#,###')}\` |
- Để lặp dòng tự động: Thêm chỉ số \`[i]\` vào sau tên mảng.

## 3. Thẻ Điều Kiện (Conditional if)
- Hiển thị nếu đúng: \`{d.is_emergency:if(true):show}\`
- Hiển thị theo giá trị so sánh: \`{d.gender:ifEQ('NAM'):show}\`

## 4. Các Bộ Định Dạng (Formatters)
- Ngày tháng: \`{d.exam_date:formatDate('DD/MM/YYYY')}\`
- Giờ phút ngày: \`{d.exam_date:formatDate('HH:mm DD/MM/YYYY')}\`
- Số tiền (phân tách hàng nghìn): \`{d.total_amount:formatNumber('#,###')} VNĐ\`
- Phần trăm: \`{d.discount_rate:formatNumber('0.0%')}\`
- Viết hoa chuỗi: \`{d.patient_name:upper}\`
- Viết thường chuỗi: \`{d.note:lower}\`

## 5. QR Code & Barcode
- Mã vạch Code 128: \`{d.patient_code:formatBarcode('code128')}\`
- Mã QR Code: \`{d.patient_code:formatQR}\`

## 6. Vùng Chữ Ký
- Bác sĩ điều trị: \`{d.doctor_name}\`
- Trưởng khoa: \`{d.department_head_name}\`
- Ngày ký: *Ngày {d.exam_date:formatDate('DD')} tháng {d.exam_date:formatDate('MM')} năm {d.exam_date:formatDate('YYYY')}*
`;

        const files: Record<string, Buffer> = {
            'sample-data.json': Buffer.from(JSON.stringify(sampleData, null, 2), 'utf8'),
            'carbone-syntax-guide.md': Buffer.from(cheatSheet, 'utf8')
        };
        if (schema) {
            files['schema.json'] = Buffer.from(JSON.stringify(schema, null, 2), 'utf8');
        }

        const zip = packZip(files);
        return {
            buffer: zip,
            filename: `${templateCode || 'vimes-template'}-starter-pack.zip`
        };
    }

    async getInbox(actor: string, options: { facilityId?: string; departmentId?: string } = {}) {
        return this.repository.getInbox(actor, options);
    }

    async updateAssignments(versionId: number, data: {
        assignedDesigner?: string;
        assignedTester?: string;
        assignedReviewer?: string;
        assignedPublisher?: string;
        dueDate?: string;
        effectiveFrom?: string;
        effectiveTo?: string;
        scheduledPublishAt?: string;
    }, actor: string) {
        return this.repository.updateAssignments(versionId, data, actor);
    }

    async getComments(versionId: number) {
        return this.repository.getComments(versionId);
    }

    async addComment(versionId: number, data: { content: string; category?: string; authorName?: string }, actor: string) {
        if (!data.content || !data.content.trim()) throw Object.assign(new Error('Comment content cannot be empty'), { status: 400 });
        return this.repository.addComment(versionId, data, actor);
    }

    async updateReviewChecklist(versionId: number, checklist: Record<string, unknown>, actor: string) {
        return this.repository.updateReviewChecklist(versionId, checklist, actor);
    }

    async listUserPermissions(userId?: string) {
        return this.repository.listUserPermissions(userId);
    }

    async grantUserPermission(data: { userId: string; userName?: string; roleCode: string; facilityId?: string; departmentId?: string }, actor: string) {
        if (!data.userId || !data.roleCode) throw Object.assign(new Error('userId and roleCode are required'), { status: 400 });
        return this.repository.grantUserPermission(data, actor);
    }

    async revokeUserPermission(id: number, actor: string) {
        return this.repository.revokeUserPermission(id, actor);
    }

    async getNotifications(recipientId: string, limit = 50) {
        return this.repository.getNotifications(recipientId, limit);
    }

    async markNotificationRead(id: number, recipientId?: string) {
        return this.repository.markNotificationRead(id, recipientId);
    }

    async processScheduledPublishes() {
        return this.repository.processScheduledPublishes();
    }

    async listOrphanArtifacts() {
        const storageFiles = this.storage.listKeys ? await this.storage.listKeys() : [];
        return this.repository.listOrphanArtifacts(storageFiles);
    }

    async cleanupOrphanArtifacts(actorId: string, keys?: string[]) {
        const orphans = keys && keys.length > 0
            ? keys
            : (await this.listOrphanArtifacts()).map(o => o.key);
        for (const key of orphans) {
            if (this.storage.delete) {
                await this.storage.delete(key);
            }
        }
        return this.repository.cleanupOrphanArtifacts(actorId, orphans);
    }

    async getOperationsDashboardMetrics() {
        return this.repository.getOperationsDashboardMetrics();
    }

    async generateSignedArtifactUrl(versionId: number, ttlSeconds = 300) {
        const version = await this.repository.getVersion(versionId);
        if (!version || !version.artifactKey) throw Object.assign(new Error('Artifact not found for version'), { status: 404 });
        if (this.storage.signedUrl) {
            return this.storage.signedUrl(version.artifactKey, ttlSeconds);
        }
        return `/api/v1/template-studio/versions/${versionId}/artifact`;
    }
}

export const templateStudioService = new TemplateStudioService();
