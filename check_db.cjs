
const { query } = require('./backend/src/config/database');

async function checkSchema() {
    try {
        const result = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND (table_name ILIKE '%fee%' 
                 OR table_name ILIKE '%invoice%' 
                 OR table_name ILIKE '%bill%' 
                 OR table_name ILIKE '%payment%'
                 OR table_name ILIKE '%thanh_toan%'
                 OR table_name ILIKE '%vien_phi%')
            ORDER BY table_name
        `);
        console.log('📊 Tables found:', result.rows.map(r => r.table_name));

        // Search for relevant tables
        const tablesResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND (table_name ILIKE '%fee_invoice%' 
                 OR table_name ILIKE '%hms_exam%')
            ORDER BY table_name
        `);
        console.log('📊 Relevant Tables:', tablesResult.rows.map(r => r.table_name));

        for (const table of tablesResult.rows) {
            await describeTable(table.table_name);
        }

    } catch (error) {
        console.error('❌ Error checking schema:', error);
        process.exit(1);
    }
}

const fs = require('fs');

async function describeTable(tableName) {
    console.log(`\n--- Structure of ${tableName} ---`);
    const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
    `, [tableName]);

    let output = `\n--- Structure of ${tableName} ---\n`;
    output += result.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n');
    fs.appendFileSync('table_structure.txt', output + '\n');
}

checkSchema();
