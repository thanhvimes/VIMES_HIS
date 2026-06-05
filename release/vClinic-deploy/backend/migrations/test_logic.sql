
CREATE OR REPLACE FUNCTION hms_check_registration_v2(p_payload JSONB)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object('isValid', true, 'message', 'Test', 'severity', 'SUCCESS');
END;
$$ LANGUAGE plpgsql;
