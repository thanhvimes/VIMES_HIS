// Script to create SMS templates table
const pool = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function createSMSTemplatesTable() {
    try {
        console.log('Reading SQL script...');
        const sqlScript = fs.readFileSync(
            path.join(__dirname, 'sql', 'create-sms-templates-table.sql'),
            'utf8'
        );

        console.log('Executing SQL script...');
        await pool.query(sqlScript);

        console.log('✅ SMS templates table created successfully!');

        // Verify
        const result = await pool.query('SELECT COUNT(*) FROM hms_booking_sms_templates');
        console.log(`📊 Total templates: ${result.rows[0].count}`);

        // Show templates
        const templates = await pool.query(`
            SELECT template_id, template_type, dept_code, patient_type, 
                   LEFT(template_content, 50) as content_preview
            FROM hms_booking_sms_templates
            ORDER BY template_type, dept_code NULLS FIRST, patient_type NULLS FIRST
        `);

        console.log('\n📋 Templates created:');
        templates.rows.forEach(t => {
            const dept = t.dept_code || 'ALL';
            const type = t.patient_type || 'ALL';
            console.log(`  - ${t.template_type} | ${dept} | ${type}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating SMS templates table:', error.message);
        process.exit(1);
    }
}

createSMSTemplatesTable();
