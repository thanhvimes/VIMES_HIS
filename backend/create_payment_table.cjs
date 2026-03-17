// Script to create portal_payment_transactions table
const { query } = require('./src/config/database');

async function createPaymentTable() {
    try {
        console.log('Creating portal_payment_transactions table...');

        await query(`
            CREATE TABLE IF NOT EXISTS portal_payment_transactions (
                transaction_id SERIAL PRIMARY KEY,
                bill_id VARCHAR(50) NOT NULL,
                docno VARCHAR(50),
                account_id INTEGER,
                patient_no VARCHAR(20),
                patient_name VARCHAR(200),
                amount NUMERIC(15, 2) NOT NULL,
                payment_method VARCHAR(50) DEFAULT 'VIETQR',
                status VARCHAR(20) DEFAULT 'PENDING',
                qr_content TEXT,
                bank_transaction_id VARCHAR(100),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                paid_at TIMESTAMP
            );
        `);

        console.log('✅ Table created successfully');

        await query(`CREATE INDEX IF NOT EXISTS idx_portal_payment_bill_id ON portal_payment_transactions(bill_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_portal_payment_account_id ON portal_payment_transactions(account_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_portal_payment_status ON portal_payment_transactions(status)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_portal_payment_created_at ON portal_payment_transactions(created_at DESC)`);

        console.log('✅ Indexes created successfully');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createPaymentTable();
