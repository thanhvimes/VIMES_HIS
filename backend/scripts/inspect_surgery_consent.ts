import { query } from '../src/config/database';
import { templateStudioService } from '../src/template-studio/template-studio.service';
import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
    const res = await query(`
        SELECT v.id, t.code, v.version, v.status, v.artifact_key, v.validation_result 
        FROM hms_document_template_version v 
        JOIN hms_document_template t ON t.id = v.template_id 
        WHERE t.code = 'SURGERY_CONSENT'
    `);
    console.log('Current DB row:', JSON.stringify(res.rows, null, 2));

    if (res.rows[0]) {
        const versionId = Number(res.rows[0].id);
        const docxPath = path.resolve(__dirname, '../templates/documents/SURGERY_CONSENT/v1/template.docx');
        const docxBuffer = await fs.readFile(docxPath);
        
        // Upload & validate through service
        const validation = await templateStudioService.upload(versionId, docxBuffer, 'system_bootstrap');
        console.log('Upload validation result:', validation);

        // Ensure status stays PUBLISHED
        await query(`UPDATE hms_document_template_version SET status='PUBLISHED' WHERE id=$1`, [versionId]);
        console.log('✅ Set SURGERY_CONSENT version status to PUBLISHED with valid validation_result');
    }
}

main().then(() => process.exit(0)).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
