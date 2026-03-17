// Script to initialize settings table
const pool = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function initializeSettings() {
    try {
        console.log('Reading SQL script...');
        const sqlScript = fs.readFileSync(
            path.join(__dirname, 'sql', 'create-settings-table.sql'),
            'utf8'
        );

        console.log('Executing SQL script...');
        await pool.query(sqlScript);

        console.log('✅ Settings table created and initialized successfully!');

        // Verify
        const result = await pool.query('SELECT COUNT(*) FROM hms_booking_settings');
        console.log(`📊 Total settings: ${result.rows[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing settings:', error);
        process.exit(1);
    }
}

initializeSettings();
