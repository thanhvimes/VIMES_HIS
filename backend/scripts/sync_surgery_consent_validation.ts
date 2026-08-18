import { query } from '../src/config/database';
import { validateDocx } from '../src/template-studio/docx-validator';
import { ContractCatalog } from '../src/template-studio/contract-catalog';
import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
    const templateRoot = path.resolve(__dirname, '../templates/documents');
    const contracts = new ContractCatalog(templateRoot);
    const contract = await contracts.get('SURGERY_CONSENT');
    const docxPath = path.resolve(templateRoot, 'SURGERY_CONSENT/v1/template.docx');
    const docxBuffer = await fs.readFile(docxPath);
    
    const validation = validateDocx(docxBuffer, contract.allowedFields, contract.fieldMeta);
    console.log('SURGERY_CONSENT docx validation:', JSON.stringify(validation, null, 2));

    await query(`
        UPDATE hms_document_template_version 
        SET validation_result = $1::jsonb,
            artifact_size = $2,
            status = 'PUBLISHED'
        WHERE id = (
            SELECT v.id FROM hms_document_template_version v 
            JOIN hms_document_template t ON t.id = v.template_id 
            WHERE t.code = 'SURGERY_CONSENT' AND v.version = 1
        )
    `, [JSON.stringify(validation), docxBuffer.length]);

    console.log('✅ Updated SURGERY_CONSENT validation_result in database successfully!');
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
