
import { pool } from '../config/database';

async function migrate() {
    const sql = `
    DROP FUNCTION IF EXISTS hms_get_operation_catalog_v1(text, text);
    DROP FUNCTION IF EXISTS hms_get_operation_history_v1(bigint);
    DROP FUNCTION IF EXISTS hms_save_operation_v1(jsonb);
    DROP FUNCTION IF EXISTS hms_delete_operation_v1(integer);

    -- 1. Function to search for PT/TT services
    CREATE OR REPLACE FUNCTION hms_get_operation_catalog_v1(p_search_query text DEFAULT '', p_group_id text DEFAULT '')
    RETURNS jsonb AS $$
    DECLARE
        v_results jsonb;
    BEGIN
        SELECT jsonb_agg(t) INTO v_results
        FROM (
            SELECT 
                hfl_feeid as code,
                hfl_name as name,
                hfl_unit as unit,
                hfl_servprice as price,
                hfl_groupid as "group",
                CASE 
                    WHEN hfl_groupid LIKE 'B4%' OR hfl_groupid LIKE 'B5%' THEN 'PT'
                    ELSE 'TT'
                END as type
            FROM hms_feelist
            WHERE hfl_active = 'Y'
              AND (hfl_name ILIKE '%' || p_search_query || '%' OR hfl_feeid ILIKE '%' || p_search_query || '%')
              AND (p_group_id = '' OR hfl_groupid = p_group_id)
              AND (hfl_groupid LIKE 'B%' OR hfl_groupid LIKE 'F%' OR hfl_groupid LIKE 'C%')
            LIMIT 50
        ) t;
        RETURN COALESCE(v_results, '[]'::jsonb);
    END;
    $$ LANGUAGE plpgsql;

    -- 2. Function to fetch operation history
    CREATE OR REPLACE FUNCTION hms_get_operation_history_v1(p_docno bigint)
    RETURNS jsonb AS $$
    DECLARE
        v_results jsonb;
    BEGIN
        SELECT jsonb_agg(t) INTO v_results
        FROM (
            SELECT 
                o.ho_idx::text as id,
                f.hfl_name as "serviceName",
                to_char(o.ho_createddate, 'DD/MM/YYYY') as "requestDate",
                CASE WHEN o.ho_type = 'P' THEN 'PT' ELSE 'TT' END as type,
                o.ho_beforeopera as "operationType",
                to_char(o.ho_performdate, 'YYYY-MM-DD') as "operationDate",
                o.ho_roomid::text as room,
                to_char(o.ho_startdate, 'HH24:MI') as "startTime",
                '' as "endTime",
                o.ho_practitioner as "mainSurgeon",
                o.ho_assistant as "assistantSurgeons",
                o.ho_anesthetist as "anesthesiologist",
                o.ho_user4 as nurses,
                o.ho_user5 as technicians,
                o.ho_inmethod as method,
                o.ho_comment as steps,
                o.ho_note as instruments,
                '' as medications, 
                '{}'::text[] as images,
                o.ho_status::text as status
            FROM hms_operation o
            JOIN hms_feelist f ON o.ho_itemid = f.hfl_feeid
            WHERE o.ho_docno = p_docno AND o.ho_status != 'C'
            ORDER BY o.ho_performdate DESC, o.ho_idx DESC
        ) t;
        RETURN COALESCE(v_results, '[]'::jsonb);
    END;
    $$ LANGUAGE plpgsql;

    -- 3. Function to save/update operation record
    CREATE OR REPLACE FUNCTION hms_save_operation_v1(p_payload jsonb)
    RETURNS jsonb AS $$
    DECLARE
        v_id bigint;
        v_docno bigint;
        v_itemid text;
        v_user text;
    BEGIN
        v_docno := (p_payload->>'docNo')::bigint;
        v_itemid := (p_payload->>'itemId');
        v_id := NULLIF((p_payload->>'id'), '')::bigint;
        v_user := COALESCE(p_payload->>'user', 'admin');

        IF v_id IS NOT NULL THEN
            UPDATE hms_operation SET
                ho_performdate = (p_payload->>'operationDate')::timestamp,
                ho_practitioner = (p_payload->>'mainSurgeon'),
                ho_anesthetist = (p_payload->>'anesthesiologist'),
                ho_assistant = (p_payload->>'assistantSurgeons'),
                ho_user4 = (p_payload->>'nurses'),
                ho_user5 = (p_payload->>'technicians'),
                ho_inmethod = (p_payload->>'method'),
                ho_comment = (p_payload->>'steps'),
                ho_beforeopera = (p_payload->>'operationType'),
                ho_note = (p_payload->>'instruments'),
                ho_roomid = (p_payload->>'room'),
                ho_startdate = (p_payload->>'operationDate')::date + (COALESCE(p_payload->>'startTime', '00:00') || ':00')::time,
                ho_type = CASE WHEN (p_payload->>'type') = 'PT' THEN 'P' ELSE 'T' END,
                ho_updatedby = v_user,
                ho_updateddate = CURRENT_TIMESTAMP
            WHERE ho_idx = v_id;
        ELSE
            INSERT INTO hms_operation (
                ho_docno, ho_itemid, ho_performdate, ho_practitioner, 
                ho_anesthetist, ho_assistant, ho_user4, ho_user5,
                ho_inmethod, ho_comment, ho_beforeopera, ho_note,
                ho_roomid, ho_startdate, ho_type, ho_status, 
                ho_createdby, ho_createddate, ho_qty
            ) VALUES (
                v_docno, v_itemid, (p_payload->>'operationDate')::timestamp, 
                (p_payload->>'mainSurgeon'), (p_payload->>'anesthesiologist'), 
                (p_payload->>'assistantSurgeons'), (p_payload->>'nurses'), (p_payload->>'technicians'),
                (p_payload->>'method'), (p_payload->>'steps'), (p_payload->>'operationType'), (p_payload->>'instruments'),
                (p_payload->>'room'), (p_payload->>'operationDate')::date + (COALESCE(p_payload->>'startTime', '00:00') || ':00')::time,
                CASE WHEN (p_payload->>'type') = 'PT' THEN 'P' ELSE 'T' END, 'A', 
                v_user, CURRENT_TIMESTAMP, 1
            ) RETURNING ho_idx INTO v_id;
        END IF;

        RETURN jsonb_build_object('success', true, 'id', v_id);
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM);
    END;
    $$ LANGUAGE plpgsql;

    -- 4. Function to delete/cancel operation
    CREATE OR REPLACE FUNCTION hms_delete_operation_v1(p_op_id integer)
    RETURNS jsonb AS $$
    BEGIN
        UPDATE hms_operation SET ho_status = 'C' WHERE ho_idx = p_op_id;
        RETURN jsonb_build_object('success', true);
    END;
    $$ LANGUAGE plpgsql;
    `;

    try {
        await pool.query(sql);
        console.log("Operation migration functions updated successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
    process.exit(0);
}

migrate();
