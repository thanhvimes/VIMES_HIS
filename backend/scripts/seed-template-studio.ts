import fs from 'node:fs/promises';
import path from 'node:path';
import { query } from '../src/config/database';
import { templateStudioService } from '../src/template-studio/template-studio.service';
import { buildJsonSchema } from '../src/template-studio/contract-catalog';

function buildTestCases(sampleData: Record<string, any>) {
    const longText = structuredClone(sampleData);
    if (longText.patient) {
        longText.patient.fullName = 'NGUYỄN THỊ HOÀNG ANH PHƯƠNG THẢO TRẦN GIA BẢO';
        if ('address' in longText.patient) longText.patient.address = 'Số 123, ngõ 456, đường Nguyễn Văn Cừ, phường dài để kiểm tra tự động xuống dòng, thành phố Hà Nội';
    }
    const emptyOptional = structuredClone(sampleData);
    for (const key of ['advice', 'conclusion', 'leader']) if (key in emptyOptional) emptyOptional[key] = key === 'leader' ? {} : '';
    const manyRows = structuredClone(sampleData);
    for (const key of ['items', 'entries']) {
        if (Array.isArray(manyRows[key]) && manyRows[key].length) {
            manyRows[key] = Array.from({ length: 100 }, (_, index) => ({ ...manyRows[key][index % manyRows[key].length], i: index + 1 }));
        }
    }
    return [
        { name: 'Dữ liệu chuẩn', testType: 'NORMAL', inputData: sampleData, isRequired: true },
        { name: 'Tên và nội dung dài', testType: 'LONG_TEXT', inputData: longText, isRequired: true },
        { name: 'Thiếu dữ liệu tùy chọn', testType: 'EMPTY_OPTIONAL', inputData: emptyOptional, isRequired: true },
        { name: 'Danh sách 100 dòng', testType: 'MANY_ROWS', inputData: manyRows, isRequired: true }
    ];
}

async function ensureTestCases(versionId: number, sampleData: Record<string, any>) {
    const existing = await templateStudioService.repository.listTestCases(versionId);
    const names = new Set(existing.map(item => item.name));
    for (const testCase of buildTestCases(sampleData)) {
        if (!names.has(testCase.name)) await templateStudioService.repository.upsertTestCase(versionId, testCase, 'template-studio-bootstrap');
    }
}

async function main() {
    const templateRoot = path.resolve(process.env.DOCUMENT_TEMPLATE_DIR || path.join(process.cwd(), 'templates', 'documents'));
    const directories = (await fs.readdir(templateRoot, { withFileTypes: true })).filter(entry => entry.isDirectory());
    for (const directory of directories) {
        const code = directory.name;
        const versionRoot = path.join(templateRoot, code, 'v1');
        const [manifest, sampleData, docx] = await Promise.all([
            fs.readFile(path.join(versionRoot, 'manifest.json'), 'utf8').then(JSON.parse),
            fs.readFile(path.join(versionRoot, 'sample-data.json'), 'utf8').then(JSON.parse),
            fs.readFile(path.join(versionRoot, 'template.docx'))
        ]);
        await query(`
            INSERT INTO hms_document_data_contract (code, version, name, json_schema, status, created_by)
            VALUES ($1, 1, $2, $3::jsonb, 'PUBLISHED', 'template-studio-bootstrap')
            ON CONFLICT (code, version) DO NOTHING
        `, [code, `${manifest.name} data contract`, JSON.stringify(buildJsonSchema(sampleData))]);
        const contract = await query(`SELECT id FROM hms_document_data_contract WHERE code=$1 AND version=1`, [code]);
        const existing = await query(`SELECT id FROM hms_document_template WHERE code=$1`, [code]);
        if (existing.rows[0]) {
            await query(`
                UPDATE hms_document_template_version SET contract_id=$2
                WHERE template_id=$1 AND contract_id IS NULL
            `, [existing.rows[0].id, contract.rows[0].id]);
            const latest = await query(`SELECT id FROM hms_document_template_version WHERE template_id=$1 ORDER BY version DESC LIMIT 1`, [existing.rows[0].id]);
            await ensureTestCases(Number(latest.rows[0].id), sampleData);
            console.log(`${code}: SKIP (đã tồn tại, contract đã đồng bộ)`);
            continue;
        }
        const res = await templateStudioService.repository.createTemplate({
            code,
            name: manifest.name,
            documentType: manifest.documentType,
            moduleCode: manifest.documentType,
            description: `Imported from filesystem template ${code}@1`,
            sampleData
        }, 'template-studio-bootstrap');
        const versionId = typeof res === 'object' ? res.versionId : res;
        const validation = await templateStudioService.upload(versionId, docx, 'template-studio-bootstrap');
        await query(`UPDATE hms_document_template_version SET contract_id=$2 WHERE id=$1`, [versionId, contract.rows[0].id]);
        await ensureTestCases(versionId, sampleData);
        if (!validation.valid) throw new Error(`${code}: ${validation.errors.map(error => error.message).join('; ')}`);
        await templateStudioService.repository.transition(versionId, ['DRAFT'], 'IN_REVIEW', 'template-studio-bootstrap');
        await templateStudioService.repository.transition(versionId, ['IN_REVIEW'], 'APPROVED', 'template-studio-bootstrap');
        await templateStudioService.repository.transition(versionId, ['APPROVED'], 'PUBLISHED', 'template-studio-bootstrap');
        console.log(`${code}: IMPORTED (${validation.tags.length} tags)`);
    }
}

main().then(() => process.exit(0)).catch(error => {
    console.error('Template Studio seed failed:', error instanceof Error ? error.message : error);
    process.exit(1);
});
