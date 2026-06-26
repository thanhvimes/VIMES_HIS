import { query } from '../src/config/database';

async function check() {
    try {
        const res = await query("SELECT count(*) FROM hms_patient");
        console.log("hms_patient rows count:", res.rows[0].count);
    } catch (e: any) {
        console.error("hms_patient check failed:", e.message);
    }
    try {
        const res = await query("SELECT count(*) FROM hms_doc");
        console.log("hms_doc rows count:", res.rows[0].count);
    } catch (e: any) {
        console.error("hms_doc check failed:", e.message);
    }
    try {
        const res = await query("SELECT count(*) FROM hms_exam");
        console.log("hms_exam rows count:", res.rows[0].count);
    } catch (e: any) {
        console.error("hms_exam check failed:", e.message);
    }
    process.exit(0);
}

check();
