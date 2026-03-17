
const { query } = require('./src/config/database');
const bcrypt = require('bcrypt');

async function seedUser() {
    try {
        const phone = '0912345678';
        const password = '123456';
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 1. Get a test patient PID
        const patientResult = await query('SELECT hp_patientno FROM hms_patient LIMIT 1');
        if (patientResult.rows.length === 0) {
            console.error('❌ No patients found in hms_patient');
            process.exit(1);
        }
        const patientNo = patientResult.rows[0].hp_patientno;

        // 2. Create account
        const accountResult = await query(`
            INSERT INTO portal_accounts (phone, password_hash)
            VALUES ($1, $2)
            ON CONFLICT (phone) DO UPDATE SET password_hash = $2
            RETURNING id
        `, [phone, passwordHash]);

        const accountId = accountResult.rows[0].id;

        // 3. Link profile
        await query(`
            INSERT INTO portal_patient_links (account_id, patient_no, is_primary)
            VALUES ($1, $2, TRUE)
            ON CONFLICT (account_id, patient_no) DO NOTHING
        `, [accountId, patientNo]);

        console.log('✅ Test account created successfully:');
        console.log(`   Phone: ${phone}`);
        console.log(`   Password: ${password}`);
        console.log(`   Linked PID: ${patientNo}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding user:', error);
        process.exit(1);
    }
}

seedUser();
