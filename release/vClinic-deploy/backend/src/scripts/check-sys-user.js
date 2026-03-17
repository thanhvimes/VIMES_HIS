// ==================== CHECK SYS_USER TABLE ====================
// File: backend/src/scripts/check-sys-user.js

const { query } = require('../config/database');

async function checkSysUser() {
    try {
        console.log('🔍 Checking sys_user table structure...\n');

        // Check if table exists
        const tableCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'sys_user'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ Table sys_user does not exist!');
            console.log('\n📝 Creating sys_user table...');

            // Create table
            await query(`
                CREATE TABLE IF NOT EXISTS sys_user (
                    su_userid VARCHAR(20) PRIMARY KEY,
                    su_name VARCHAR(100),
                    su_password VARCHAR(255),
                    su_groupid VARCHAR(10),
                    su_deptid VARCHAR(20),
                    su_roomid INTEGER,
                    su_hms_xdept VARCHAR(100),
                    su_hms_xroom VARCHAR(100),
                    su_tel VARCHAR(20),
                    su_certificate VARCHAR(50),
                    su_position VARCHAR(50),
                    su_title VARCHAR(50),
                    su_isactive VARCHAR(1) DEFAULT 'Y',
                    
                    -- HMS Modules
                    su_hms_rmmodule VARCHAR(1) DEFAULT '0',
                    su_hms_emmodule VARCHAR(1) DEFAULT '0',
                    su_hms_tmmodule VARCHAR(1) DEFAULT '0',
                    su_hms_usmodule VARCHAR(1) DEFAULT '0',
                    su_hms_pamodule VARCHAR(1) DEFAULT '0',
                    su_hms_esmodule VARCHAR(1) DEFAULT '0',
                    su_hms_hfmodule VARCHAR(1) DEFAULT '0',
                    su_hms_pmmodule VARCHAR(1) DEFAULT '0',
                    su_hms_opmodule VARCHAR(1) DEFAULT '0',
                    su_hms_crmodule VARCHAR(1) DEFAULT '0',
                    su_hms_sysmodule VARCHAR(1) DEFAULT '0',
                    su_hms_labmodule VARCHAR(1) DEFAULT '0',
                    su_hms_mmmodule VARCHAR(1) DEFAULT '0',
                    su_hms_smmodule VARCHAR(1) DEFAULT '0',
                    su_hms_armodule VARCHAR(1) DEFAULT '0',
                    su_hms_mamodule VARCHAR(1) DEFAULT '0',
                    su_hms_bbmodule VARCHAR(1) DEFAULT '0',
                    su_hms_prmodule VARCHAR(1) DEFAULT '0',
                    su_hms_fammodule VARCHAR(1) DEFAULT '0',
                    su_hms_sipmodule VARCHAR(1) DEFAULT '0',
                    su_hms_stmodule VARCHAR(1) DEFAULT '0',
                    su_hms_srmmodule VARCHAR(1) DEFAULT '0',
                    su_hms_mramodule VARCHAR(1) DEFAULT '0',
                    su_hms_cmmodule VARCHAR(1) DEFAULT '0',
                    su_hms_emrmodule VARCHAR(1) DEFAULT '0',
                    su_hms_hmmodule VARCHAR(1) DEFAULT '0',
                    su_hms_tramodule VARCHAR(1) DEFAULT '0',
                    su_hms_inmodule VARCHAR(1) DEFAULT '0',
                    su_hms_nmmodule VARCHAR(1) DEFAULT '0',
                    su_hms_tmvmodule VARCHAR(1) DEFAULT '0',
                    su_hms_dsmmodule VARCHAR(1) DEFAULT '0',
                    su_hms_itsmodule VARCHAR(1) DEFAULT '0',
                    
                    -- ERP Modules
                    su_erp_famodule VARCHAR(1) DEFAULT '0',
                    su_erp_hrmodule VARCHAR(1) DEFAULT '0',
                    su_erp_apmodule VARCHAR(1) DEFAULT '0',
                    su_erp_armodule VARCHAR(1) DEFAULT '0',
                    su_erp_glmodule VARCHAR(1) DEFAULT '0',
                    su_erp_pomodule VARCHAR(1) DEFAULT '0',
                    su_erp_somodule VARCHAR(1) DEFAULT '0',
                    su_erp_simodule VARCHAR(1) DEFAULT '0',
                    su_erp_bilmodule VARCHAR(1) DEFAULT '0'
                );
            `);

            console.log('✅ Table created successfully!');
        } else {
            console.log('✅ Table sys_user exists');
        }

        // Check columns
        const columns = await query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'sys_user'
            ORDER BY ordinal_position;
        `);

        console.log(`\n📊 Table has ${columns.rows.length} columns:`);
        console.log('\nKey columns:');
        const keyColumns = ['su_userid', 'su_name', 'su_groupid', 'su_deptid', 'su_roomid', 'su_isactive'];
        keyColumns.forEach(col => {
            const found = columns.rows.find(c => c.column_name === col);
            if (found) {
                console.log(`  ✅ ${col}: ${found.data_type}`);
            } else {
                console.log(`  ❌ ${col}: MISSING`);
            }
        });

        // Check module columns
        const moduleColumns = columns.rows.filter(c => c.column_name.includes('module'));
        console.log(`\n📦 Module columns: ${moduleColumns.length}`);

        // Check existing users
        const users = await query('SELECT su_userid, su_name, su_groupid, su_deptid FROM sys_user');
        console.log(`\n👥 Existing users: ${users.rows.length}`);
        users.rows.forEach(u => {
            console.log(`  - ${u.su_userid}: ${u.su_name} (${u.su_groupid}, ${u.su_deptid || 'NO DEPT'})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

checkSysUser();
