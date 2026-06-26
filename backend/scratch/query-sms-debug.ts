import { query } from '../src/config/database';

async function debug() {
    try {
        console.log("=== SMS TEMPLATES ===");
        const templates = await query("SELECT template_id, template_type, dept_code, patient_type, is_active, LEFT(template_content, 50) as content_preview FROM hms_booking_sms_templates");
        console.table(templates.rows);

        console.log("=== RECENT ONLINE PATIENTS ===");
        const patients = await query("SELECT qms_idx, qms_patientname, qms_deptid, qms_specialty_code, qms_is_insurance FROM qms_patient WHERE qms_type = 'ONL' ORDER BY qms_idx DESC LIMIT 5");
        console.table(patients.rows);

        console.log("=== DEPARTMENTS ===");
        const depts = await query("SELECT sd_id, sd_name, sd_active FROM sys_dept LIMIT 10");
        console.table(depts.rows);
    } catch (e: any) {
        console.error("Debug query failed:", e.message);
    }
    process.exit(0);
}

debug();
