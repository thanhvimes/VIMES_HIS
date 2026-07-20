import { query } from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function check() {
    try {
        const docRes = await query(`
            SELECT id, doc_no, patient_name, signature_status, signature_type, 
                   (signature IS NOT NULL AND signature != '') as has_signature,
                   updated_at
            FROM health_check_masters
            ORDER BY updated_at DESC
            LIMIT 10
        `);
        
        let output = '--- LATEST 10 DOCUMENTS IN DB ---\n';
        output += JSON.stringify(docRes.rows, null, 2);
        
        const destPath = 'C:\\Users\\Thanhhv\\.gemini\\antigravity-ide\\brain\\a14e6a1d-3a18-4d67-a099-eb799aa37bc2\\db-output.txt';
        fs.writeFileSync(destPath, output, 'utf-8');
        console.log('Saved DB output to:', destPath);
    } catch (err: any) {
        console.error('Error running check:', err.message);
    }
    process.exit(0);
}

check();
