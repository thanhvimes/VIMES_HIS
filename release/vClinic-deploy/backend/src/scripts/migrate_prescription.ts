
import { pool } from '../config/database';

async function migrate() {
    try {
        console.log("Starting Prescription migration...");
        
        await pool.query(`
            -- 1. Hàm tìm kiếm thuốc (Drug Catalog)
            CREATE OR REPLACE FUNCTION hms_search_drugs_v1(p_query TEXT) 
            RETURNS JSONB AS $$
            DECLARE
                v_result JSONB;
            BEGIN
                -- Giả lập tìm kiếm từ danh mục thuốc (hms_pharmacy_list hoặc hms_feelist tùy DB)
                -- Ở VIMES, thuốc thường nằm trong hms_feelist với group thuốc hoặc bảng riêng hms_druglist
                -- Ở đây ta dùng hms_feelist lọc theo group thuốc (thường bắt đầu bằng D hoặc theo hfl_type)
                SELECT jsonb_agg(t) INTO v_result
                FROM (
                    SELECT 
                        hfl_feeid as "id",
                        hfl_name as "name",
                        hfl_unit as "unit",
                        hfl_cost as "price",
                        hfl_desc as "usageRoute"
                    FROM hms_feelist
                    WHERE hfl_active = 'Y' 
                    AND (hfl_name ILIKE '%' || p_query || '%' OR hfl_feeid::TEXT LIKE p_query || '%')
                    AND hfl_groupid LIKE 'D%' -- Giả định D là thuốc
                    ORDER BY hfl_name
                    LIMIT 50
                ) t;
                
                return COALESCE(v_result, '[]'::JSONB);
            END;
            $$ LANGUAGE plpgsql;

            -- 2. Hàm lưu đơn thuốc
            CREATE OR REPLACE FUNCTION hms_save_prescription_v1(p_payload JSONB) 
            RETURNS JSONB AS $$
            DECLARE
                v_docno BIGINT := (p_payload->>'docNo')::BIGINT;
                v_user TEXT := p_payload->>'currentUser';
                v_items JSONB := p_payload->'items';
                v_order_id BIGINT;
                v_item JSONB;
            BEGIN
                -- Tạo Header đơn thuốc
                INSERT INTO hms_pharmaorder (
                    hpo_docno,
                    hpo_doctor,
                    hpo_orderdate,
                    hpo_status,
                    hpo_createdby,
                    hpo_createddate
                ) VALUES (
                    v_docno,
                    v_user,
                    NOW(),
                    'O', 
                    v_user,
                    NOW()
                ) RETURNING hpo_orderid INTO v_order_id;

                -- Lưu chi tiết từng loại thuốc
                FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
                LOOP
                    INSERT INTO hms_pharmaorderline (
                        hpol_orderid,
                        hpol_itemid,
                        hpol_qtyorder,
                        hpol_usage,
                        hpol_unit
                    ) VALUES (
                        v_order_id,
                        (v_item->>'id')::TEXT,
                        (v_item->>'quantity')::NUMERIC,
                        (v_item->>'usage')::TEXT,
                        (v_item->>'unit')::TEXT
                    );
                END LOOP;

                RETURN jsonb_build_object(
                    'success', true,
                    'orderId', v_order_id,
                    'message', 'Đã lưu đơn thuốc thành công'
                );

            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Lỗi Database HMS Save Prescription: %', SQLERRM;
            END;
            $$ LANGUAGE plpgsql;
        `);

        console.log("Prescription Migration completed successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Error creating Prescription functions:", e);
        process.exit(1);
    }
}

migrate();
