
import { pool } from '../config/database';

async function migrate() {
    const sql = `
    DROP FUNCTION IF EXISTS hms_get_fee_history_v1(bigint);

    -- 1. Function to fetch fee history for a document number
    CREATE OR REPLACE FUNCTION hms_get_fee_history_v1(p_docno bigint)
    RETURNS jsonb AS $$
    DECLARE
        v_results jsonb;
    BEGIN
        SELECT jsonb_agg(t) INTO v_results
        FROM (
            SELECT 
                f.hfe_fee_id::text as id,
                f.hfe_desc as name,
                COALESCE(g.hfg_name, 'DỊCH VỤ KHÁC') as category,
                f.hfe_unit as unit,
                f.hfe_quantity as quantity,
                f.hfe_unitprice as "unitPrice",
                f.hfe_cost as "totalPrice",
                f.hfe_inspaid as "insurancePaid",
                f.hfe_patdebt as "patientPaid",
                f.hfe_diffpaid as surcharge
            FROM hms_fee f
            LEFT JOIN hms_fee_group g ON f.hfe_feegroup = g.hfg_id
            WHERE f.hfe_docno = p_docno
              AND f.hfe_status != 'C' -- Not cancelled
            ORDER BY g.hfg_id, f.hfe_createddate
        ) t;
        RETURN COALESCE(v_results, '[]'::jsonb);
    END;
    $$ LANGUAGE plpgsql;
    `;

    try {
        await pool.query(sql);
        console.log("Fee migration functions created successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
    process.exit(0);
}

migrate();
