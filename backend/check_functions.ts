
import { query } from './src/config/database';

async function check() {
    try {
        console.log("Checking for helper functions...");
        
        // Check hms_getage
        try {
            await query("SELECT hms_getage(CURRENT_DATE, CURRENT_DATE)");
            console.log("✅ hms_getage exists");
        } catch (e) {
            console.log("❌ hms_getage missing, creating...");
            await query(`
                CREATE OR REPLACE FUNCTION hms_getage(p_date DATE, p_birthdate DATE)
                RETURNS TEXT AS $$
                DECLARE
                    v_age INT;
                BEGIN
                    IF p_birthdate IS NULL THEN RETURN ''; END IF;
                    v_age := EXTRACT(YEAR FROM p_date) - EXTRACT(YEAR FROM p_birthdate);
                    RETURN v_age::TEXT;
                END;
                $$ LANGUAGE plpgsql;
            `);
            console.log("✅ hms_getage created");
        }

        // Check hms_getaddress
        try {
            await query("SELECT hms_getaddress(0, 0, 0)");
            console.log("✅ hms_getaddress exists");
        } catch (e) {
            console.log("❌ hms_getaddress missing, creating...");
            await query(`
                CREATE OR REPLACE FUNCTION hms_getaddress(p_prov BIGINT, p_dist BIGINT, p_vill BIGINT)
                RETURNS TEXT AS $$
                DECLARE
                    v_addr TEXT := '';
                    v_prov TEXT;
                    v_dist TEXT;
                    v_vill TEXT;
                BEGIN
                    SELECT sp_name INTO v_prov FROM sys_prov WHERE sp_id = p_prov;
                    SELECT sd_name INTO v_dist FROM sys_dist WHERE sd_id = p_dist;
                    SELECT sv_name INTO v_vill FROM sys_vill WHERE sv_id = p_vill;
                    
                    IF v_vill IS NOT NULL THEN v_addr := v_vill; END IF;
                    IF v_dist IS NOT NULL THEN v_addr := v_addr || ', ' || v_dist; END IF;
                    IF v_prov IS NOT NULL THEN v_addr := v_addr || ', ' || v_prov; END IF;
                    
                    RETURN TRIM(BOTH ', ' FROM v_addr);
                END;
                $$ LANGUAGE plpgsql;
            `);
            console.log("✅ hms_getaddress created");
        }

        console.log("Helper functions check complete.");
        process.exit(0);
    } catch (err) {
        console.error("Error checking functions:", err);
        process.exit(1);
    }
}

check();
