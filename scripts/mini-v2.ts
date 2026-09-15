
import { pool } from '../src/config/database';

async function run() {
    try {
        const sql = `
CREATE OR REPLACE FUNCTION hms_check_registration_v2(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_mode TEXT := p_payload->>'mode';
    v_patient JSONB := p_payload->'patient';
    v_doc JSONB := p_payload->'doc';
    v_exam JSONB := p_payload->'exam';
    v_patientno INT;
    v_result JSONB;
BEGIN
    RETURN jsonb_build_object('isValid', true, 'message', 'Minimal V2', 'severity', 'SUCCESS');
END;
$$ LANGUAGE plpgsql;
`;
        console.log('🚀 Running minimal v2...');
        await pool.query(sql);
        console.log('✅ Minimal v2 DONE');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
