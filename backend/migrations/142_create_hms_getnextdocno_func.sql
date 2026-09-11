-- Migration 142: Create function hms_getnextdocno if not exists and align sequence
-- Description: Tạo hàm hms_getnextdocno sinh mã hồ sơ tiếp theo và đồng bộ sequence với MAX(hd_docno)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'hms_getnextdocno'
    ) THEN
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'hms_doc_hd_docno_seq' AND relkind = 'S') THEN
            EXECUTE '
                CREATE FUNCTION hms_getnextdocno() 
                RETURNS integer AS $func$
                BEGIN
                    RETURN nextval(''hms_doc_hd_docno_seq'')::integer;
                END;
                $func$ LANGUAGE plpgsql;
            ';
        ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'hms_doc_hd_docno_asq' AND relkind = 'S') THEN
            EXECUTE '
                CREATE FUNCTION hms_getnextdocno() 
                RETURNS integer AS $func$
                BEGIN
                    RETURN nextval(''hms_doc_hd_docno_asq'')::integer;
                END;
                $func$ LANGUAGE plpgsql;
            ';
        ELSE
            EXECUTE '
                CREATE FUNCTION hms_getnextdocno() 
                RETURNS integer AS $func$
                BEGIN
                    RETURN (SELECT COALESCE(MAX(hd_docno), 0) + 1 FROM hms_doc);
                END;
                $func$ LANGUAGE plpgsql;
            ';
        END IF;
    END IF;
END $$;

DO $$
DECLARE
    v_max_doc INTEGER;
    v_seq_val BIGINT;
BEGIN
    SELECT COALESCE(MAX(hd_docno), 0) INTO v_max_doc FROM hms_doc;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'hms_doc_hd_docno_seq' AND relkind = 'S') THEN
        SELECT last_value INTO v_seq_val FROM hms_doc_hd_docno_seq;
        IF v_seq_val <= v_max_doc THEN
            PERFORM setval('hms_doc_hd_docno_seq', v_max_doc + 1, false);
        END IF;
    END IF;
END $$;
