import { query } from '../config/database';
import fs from 'fs';
import path from 'path';

export async function runDbDiagnostics() {
    const logPath = path.join(__dirname, '../../../db_debug.log');
    let logContent = `--- DB Diagnostics Started at ${new Date().toISOString()} ---\n`;
    
    try {
        // Test connection
        const testConn = await query('SELECT NOW()');
        logContent += `Connection successful. DB Time: ${JSON.stringify(testConn.rows[0])}\n`;
        
        // 1. Check sys_prov
        try {
            const provRes = await query(`SELECT COUNT(*) as count FROM sys_prov`);
            logContent += `sys_prov count: ${provRes.rows[0].count}\n`;
            if (Number(provRes.rows[0].count) > 0) {
                const sampleProv = await query(`SELECT sp_id::text as id, sp_name as name FROM sys_prov LIMIT 3`);
                logContent += `sys_prov sample: ${JSON.stringify(sampleProv.rows)}\n`;
            }
        } catch (e: any) {
            logContent += `Error querying sys_prov: ${e.message}\n`;
        }

        // 2. Check hms_quoctich
        try {
            const quocTichRes = await query(`SELECT COUNT(*) as count FROM hms_quoctich`);
            logContent += `hms_quoctich count: ${quocTichRes.rows[0].count}\n`;
            if (Number(quocTichRes.rows[0].count) > 0) {
                const sampleQuocTich = await query(`SELECT * FROM hms_quoctich LIMIT 1`);
                logContent += `hms_quoctich columns & sample: ${JSON.stringify(Object.keys(sampleQuocTich.rows[0]))} -> ${JSON.stringify(sampleQuocTich.rows[0])}\n`;
                const vnRes = await query(`SELECT * FROM hms_quoctich WHERE hq_name ILIKE '%Việt Nam%' OR hq_name ILIKE '%Vietnam%'`);
                logContent += `hms_quoctich Vietnam search result: ${JSON.stringify(vnRes.rows)}\n`;
            }
        } catch (e: any) {
            logContent += `Error querying hms_quoctich: ${e.message}\n`;
        }

        // 3. Check sys_sel for occupations
        try {
            const occupationRes = await query(`SELECT COUNT(*) as count FROM sys_sel WHERE trim(ss_id)='sys_occupation'`);
            logContent += `sys_sel sys_occupation count: ${occupationRes.rows[0].count}\n`;
            if (Number(occupationRes.rows[0].count) > 0) {
                const sampleOcc = await query(`SELECT ss_code as code, ss_desc as name FROM sys_sel WHERE trim(ss_id)='sys_occupation' LIMIT 3`);
                logContent += `sys_sel sys_occupation sample: ${JSON.stringify(sampleOcc.rows)}\n`;
            }
        } catch (e: any) {
            logContent += `Error querying occupations: ${e.message}\n`;
        }

        // 4. Check sys_sel for ethnicities
        try {
            const ethnicRes = await query(`SELECT COUNT(*) as count FROM sys_sel WHERE trim(ss_id)='sys_ethnic'`);
            logContent += `sys_sel sys_ethnic count: ${ethnicRes.rows[0].count}\n`;
            if (Number(ethnicRes.rows[0].count) > 0) {
                const sampleEth = await query(`SELECT ss_code as code, ss_desc as name FROM sys_sel WHERE trim(ss_id)='sys_ethnic' LIMIT 3`);
                logContent += `sys_sel sys_ethnic sample: ${JSON.stringify(sampleEth.rows)}\n`;
            }
        } catch (e: any) {
            logContent += `Error querying ethnicities: ${e.message}\n`;
        }

        // 5. Check hms_hospital
        try {
            const hospRes = await query(`SELECT COUNT(*) as count FROM hms_hospital`);
            logContent += `hms_hospital count: ${hospRes.rows[0].count}\n`;
        } catch (e: any) {
            logContent += `Error querying hms_hospital: ${e.message}\n`;
        }

        // 6. Check sys_vill (wards)
        try {
            const villRes = await query(`SELECT COUNT(*) as count FROM sys_vill`);
            logContent += `sys_vill count: ${villRes.rows[0].count}\n`;
        } catch (e: any) {
            logContent += `Error querying sys_vill: ${e.message}\n`;
        }

    } catch (error: any) {
        logContent += `CRITICAL ERROR during diagnostics: ${error.message}\n`;
    }

    logContent += `--- DB Diagnostics Ended at ${new Date().toISOString()} ---\n`;
    fs.writeFileSync(logPath, logContent, { flag: 'a' });
    console.log(`Database diagnostics written to ${logPath}`);
}
