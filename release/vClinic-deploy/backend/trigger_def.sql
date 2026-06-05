CREATE OR REPLACE FUNCTION public.fn_sys_audit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_changed_fields JSONB := '{}'::JSONB;
    v_user_id TEXT := current_setting('app.current_user_id', true);
    v_client_ip TEXT := current_setting('app.client_ip', true);
    v_module TEXT := current_setting('app.context_module', true);
    v_pk_column TEXT;
    v_record_id TEXT;
BEGIN
    -- Tìm cột Primary Key của bảng đang trigger
    SELECT a.attname INTO v_pk_column
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = TG_RELID AND i.indisprimary;

    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        
        -- So sánh tìm các trường thay đổi
        SELECT jsonb_object_agg(key, value) INTO v_changed_fields
        FROM (
            SELECT key, value FROM jsonb_each(v_new_data)
            EXCEPT
            SELECT key, value FROM jsonb_each(v_old_data)
        ) diff;
        
        -- Nếu không có gì thay đổi thực sự thì không log
        IF v_changed_fields IS NULL OR v_changed_fields = '{}'::JSONB THEN
            RETURN NEW;
        END IF;

        v_record_id := v_old_data->>v_pk_column;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        v_record_id := v_new_data->>v_pk_column;
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_record_id := v_old_data->>v_pk_column;
    END IF;

    -- Ghi Log
    INSERT INTO sys_audit_log (
        table_name, record_id, action, 
        old_data, new_data, changed_fields,
        user_id, client_ip, context_module
    ) VALUES (
        TG_TABLE_NAME, v_record_id, LEFT(TG_OP, 1),
        v_old_data, v_new_data, v_changed_fields,
        v_user_id, v_client_ip, v_module
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$function$
