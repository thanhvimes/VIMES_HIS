-- Migration: Create portal_accounts table
-- Purpose: Authentication accounts for patients on the patient portal
-- Date: 2026-02-02

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS portal_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Index on phone for quick login lookups
CREATE INDEX IF NOT EXISTS idx_portal_accounts_phone ON portal_accounts(phone);
