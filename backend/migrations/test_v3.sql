
CREATE OR REPLACE FUNCTION hms_check_registration_v3(p_payload JSONB)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object('isValid', true, 'message', 'V3 Test', 'severity', 'SUCCESS');
END;
$$ LANGUAGE plpgsql;
