-- Migration: Create portal_payment_transactions table
-- Purpose: Track payment transactions for patient portal QR payments
-- Date: 2026-02-07

-- Create portal_payment_transactions table
CREATE TABLE IF NOT EXISTS portal_payment_transactions (
    transaction_id SERIAL PRIMARY KEY,
    bill_id VARCHAR(50) NOT NULL,              -- QR Key from hospital system
    docno VARCHAR(50),                         -- Original invoice number
    account_id UUID,                           -- Reference to portal_accounts
    patient_no VARCHAR(20),                    -- Patient number
    patient_name VARCHAR(200),                 -- Patient name
    amount NUMERIC(15, 2) NOT NULL,            -- Payment amount
    payment_method VARCHAR(50) DEFAULT 'VIETQR',
    status VARCHAR(20) DEFAULT 'PENDING',      -- PENDING, PAID, FAILED
    qr_content TEXT,                           -- QR code payload
    bank_transaction_id VARCHAR(100),          -- Bank's transaction ID
    metadata JSONB,                            -- Additional data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    CONSTRAINT fk_portal_account 
        FOREIGN KEY (account_id) 
        REFERENCES portal_accounts(id) 
        ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_portal_payment_bill_id ON portal_payment_transactions(bill_id);
CREATE INDEX IF NOT EXISTS idx_portal_payment_account_id ON portal_payment_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_portal_payment_status ON portal_payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_portal_payment_created_at ON portal_payment_transactions(created_at DESC);

-- Add comment
COMMENT ON TABLE portal_payment_transactions IS 'Stores payment transaction records for patient portal QR code payments';

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON portal_payment_transactions TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE portal_payment_transactions_transaction_id_seq TO your_app_user;
