-- Migration 055: Create split_fullname function for Vietnamese patient name parsing
-- Idempotent definition: CREATE OR REPLACE FUNCTION

CREATE OR REPLACE FUNCTION public.split_fullname(p_fullname text)
RETURNS TABLE (
    surname text,
    midname text,
    firstname text
)
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
    v_clean text;
    v_parts text[];
    v_len int;
BEGIN
    v_clean := trim(regexp_replace(COALESCE(p_fullname, ''), '\s+', ' ', 'g'));
    
    IF v_clean = '' THEN
        RETURN QUERY SELECT ''::text, ''::text, ''::text;
        RETURN;
    END IF;

    v_parts := string_to_array(v_clean, ' ');
    v_len := array_length(v_parts, 1);

    IF v_len = 1 THEN
        RETURN QUERY SELECT v_parts[1]::text, ''::text, v_parts[1]::text;
    ELSIF v_len = 2 THEN
        RETURN QUERY SELECT v_parts[1]::text, ''::text, v_parts[2]::text;
    ELSE
        RETURN QUERY SELECT 
            v_parts[1]::text, 
            array_to_string(v_parts[2:v_len - 1], ' ')::text, 
            v_parts[v_len]::text;
    END IF;
END;
$function$;
