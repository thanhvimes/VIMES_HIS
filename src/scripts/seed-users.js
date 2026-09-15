// ==================== SEED USER DATA ====================
// File: backend/src/scripts/seed-users.js

const { query } = require('../config/database');

async function seedUsers() {
    try {
        console.log('🌱 Seeding user data...');

        // User 1: Admin
        await query(`
            INSERT INTO sys_user (
                su_userid, su_name, su_password, su_groupid, su_deptid, su_roomid,
                su_isactive,
                su_hms_rmmodule, su_hms_emmodule, su_hms_tmmodule, su_hms_usmodule,
                su_hms_pamodule, su_hms_esmodule, su_hms_hfmodule, su_hms_pmmodule,
                su_hms_opmodule, su_hms_crmodule, su_hms_sysmodule, su_hms_labmodule,
                su_hms_mmmodule, su_hms_smmodule, su_hms_armodule, su_hms_mamodule,
                su_hms_bbmodule, su_hms_prmodule, su_hms_fammodule, su_hms_sipmodule,
                su_hms_stmodule, su_hms_srmmodule, su_hms_mramodule, su_hms_cmmodule,
                su_hms_emrmodule, su_hms_hmmodule
            ) VALUES (
                'admin', 'Quản trị viên Hệ thống', 'password', 'M', 'IT', 1,
                'Y',
                '1', '1', '1', '1',
                '1', '1', '1', '1',
                '1', '1', '1', '1',
                '1', '1', '1', '1',
                '1', '1', '1', '1',
                '1', '1', '1', '1',
                '1', '1'
            ) ON CONFLICT (su_userid) DO UPDATE SET
                su_password = EXCLUDED.su_password,
                su_name = EXCLUDED.su_name
        `);
        console.log('✅ Created user: admin');

        // User 2: Doctor
        await query(`
            INSERT INTO sys_user (
                su_userid, su_name, su_password, su_groupid, su_deptid, su_roomid,
                su_hms_xdept, su_isactive,
                su_hms_rmmodule, su_hms_emmodule, su_hms_tmmodule, su_hms_pamodule,
                su_hms_esmodule, su_hms_crmodule, su_hms_emrmodule
            ) VALUES (
                'doctor01', 'BS. Nguyễn Văn A', 'password', 'D', 'KB', 65,
                'KB,NOITH', 'Y',
                '1', '0', '1', '1',
                '1', '1', '1'
            ) ON CONFLICT (su_userid) DO UPDATE SET
                su_password = EXCLUDED.su_password,
                su_name = EXCLUDED.su_name
        `);
        console.log('✅ Created user: doctor01');

        // User 3: Nurse
        await query(`
            INSERT INTO sys_user (
                su_userid, su_name, su_password, su_groupid, su_deptid, su_roomid,
                su_isactive,
                su_hms_rmmodule, su_hms_pamodule, su_hms_esmodule
            ) VALUES (
                'nurse01', 'DD. Trần Thị B', 'password', 'N', 'KB', 65,
                'Y',
                '1', '1', '1'
            ) ON CONFLICT (su_userid) DO UPDATE SET
                su_password = EXCLUDED.su_password,
                su_name = EXCLUDED.su_name
        `);
        console.log('✅ Created user: nurse01');

        console.log('🎉 Seed data completed successfully!');
        console.log('\n📝 Test credentials:');
        console.log('   - admin / password');
        console.log('   - doctor01 / password');
        console.log('   - nurse01 / password');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

seedUsers();
