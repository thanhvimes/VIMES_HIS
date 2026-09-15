
import { pool } from '../config/database';

async function migrate() {
    try {
        console.log("Starting CLS migration...");
        
        await pool.query(`
            -- 1. Đảm bảo bảng pcms_order tồn tại
            CREATE TABLE IF NOT EXISTS pcms_order (
                pcmso_orderid SERIAL PRIMARY KEY,
                pcmso_docno BIGINT NOT NULL,
                pcmso_doctor TEXT,
                pcmso_orderdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                pcmso_groupid TEXT,
                pcmso_status CHAR(1) DEFAULT 'O',
                pcmso_createdby TEXT,
                pcmso_createddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                pcmso_performdate TIMESTAMP
            );

            -- 2. Đảm bảo bảng pcms_order_line tồn tại
            CREATE TABLE IF NOT EXISTS pcms_order_line (
                pcmsol_orderid BIGINT REFERENCES pcms_order(pcmso_orderid),
                pcmsol_itemid TEXT,
                pcmsol_result TEXT,
                pcmsol_unit TEXT,
                pcmsol_note TEXT,
                PRIMARY KEY (pcmsol_orderid, pcmsol_itemid)
            );

            -- 3. Hàm lấy danh mục dịch vụ CLS
            CREATE OR REPLACE FUNCTION hms_get_service_catalog_v1(p_group_id TEXT DEFAULT NULL) 
            RETURNS JSONB AS $$
            DECLARE
                v_result JSONB;
            BEGIN
                SELECT jsonb_agg(t) INTO v_result
                FROM (
                    SELECT 
                        hfl_feeid as "id",
                        hfl_name as "name",
                        hfl_unit as "unit",
                        hfl_cost as "price",
                        hfl_groupid as "categoryId",
                        hfg_name as "categoryName"
                    FROM hms_feelist
                    LEFT JOIN hms_feegroup ON hfl_groupid = hfg_id
                    WHERE hfl_active = 'Y' 
                    AND (p_group_id IS NULL OR hfl_groupid LIKE p_group_id || '%')
                    ORDER BY hfl_name
                    LIMIT 200
                ) t;
                
                return COALESCE(v_result, '[]'::JSONB);
            END;
            $$ LANGUAGE plpgsql;

            -- 4. Hàm lưu phiếu chỉ định CLS
            CREATE OR REPLACE FUNCTION hms_save_cls_order_v1(p_payload JSONB) 
            RETURNS JSONB AS $$
            DECLARE
                v_docno BIGINT := (p_payload->>'docNo')::BIGINT;
                v_user TEXT := p_payload->>'currentUser';
                v_items JSONB := p_payload->'items';
                v_group_id TEXT := p_payload->>'groupId'; -- A: XN, B: HA, C: TD
                v_order_id BIGINT;
                v_item JSONB;
            BEGIN
                -- Tạo Header phiếu chỉ định
                INSERT INTO pcms_order (
                    pcmso_docno,
                    pcmso_doctor,
                    pcmso_orderdate,
                    pcmso_groupid,
                    pcmso_status,
                    pcmso_createdby,
                    pcmso_createddate
                ) VALUES (
                    v_docno,
                    v_user,
                    NOW(),
                    v_group_id,
                    'O', -- Status: Ordered
                    v_user,
                    NOW()
                ) RETURNING pcmso_orderid INTO v_order_id;

                -- Lưu chi tiết từng dịch vụ
                FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
                LOOP
                    INSERT INTO pcms_order_line (
                        pcmsol_orderid,
                        pcmsol_itemid,
                        pcmsol_unit,
                        pcmsol_note
                    ) VALUES (
                        v_order_id,
                        (v_item->>'id')::TEXT,
                        (v_item->>'unit')::TEXT,
                        (v_item->>'note')::TEXT
                    ) ON CONFLICT (pcmsol_orderid, pcmsol_itemid) DO NOTHING;
                END LOOP;

                RETURN jsonb_build_object(
                    'success', true,
                    'orderId', v_order_id,
                    'message', 'Đã lưu chỉ định thành công'
                );

            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Lỗi Database HMS Save CLS Order: %', SQLERRM;
            END;
            $$ LANGUAGE plpgsql;
        `);

        console.log("CLS Migration completed successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Error creating CLS functions:", e);
        process.exit(1);
    }
}

migrate();
