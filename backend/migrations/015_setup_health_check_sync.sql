-- SQL Migration: Initialize Master-Detail Database Schema for health-check-sync
-- Description: Stores 17 forms of health check data for VNeID syncing (QĐ 1551/QĐ-BYT)

-- 1. Table Master: Stores administrative, status, and signature info
CREATE TABLE IF NOT EXISTS health_check_masters (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(20),
    patient_name VARCHAR(100),
    cccd VARCHAR(20),
    dob DATE,
    gender VARCHAR(10),
    doc_no VARCHAR(50) UNIQUE,
    form_type VARCHAR(10) NOT NULL,
    xml_data TEXT,
    send_status VARCHAR(20) DEFAULT 'Unsent' NOT NULL,
    signature_status VARCHAR(20) DEFAULT 'Unsigned' NOT NULL,
    signature_type VARCHAR(10) DEFAULT 'USB' NOT NULL,
    signature TEXT,
    sent_at TIMESTAMP,
    transaction_id VARCHAR(100),
    error_message VARCHAR(500),
    barcode_printed VARCHAR(1) DEFAULT 'N' NOT NULL,
    response_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Table Detail: Stores clinical, lab, and conclusion JSONB data
CREATE TABLE IF NOT EXISTS health_check_details (
    id SERIAL PRIMARY KEY,
    master_id INTEGER NOT NULL REFERENCES health_check_masters(id) ON DELETE CASCADE,
    clinical_data JSONB,
    lab_data JSONB,
    conclusion_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Optimization Indexes
-- B-Tree Indexes on Master fields for high-performance sorting/filtering
CREATE INDEX IF NOT EXISTS idx_hc_masters_patient ON health_check_masters(patient_id);
CREATE INDEX IF NOT EXISTS idx_hc_masters_name ON health_check_masters(patient_name);
CREATE INDEX IF NOT EXISTS idx_hc_masters_cccd ON health_check_masters(cccd);
CREATE INDEX IF NOT EXISTS idx_hc_masters_status ON health_check_masters(send_status);
CREATE INDEX IF NOT EXISTS idx_hc_masters_doc_no ON health_check_masters(doc_no);

-- GIN Indexes on JSONB fields inside Detail for deep clinical queries
CREATE INDEX IF NOT EXISTS idx_hc_details_clinical ON health_check_details USING gin (clinical_data);
CREATE INDEX IF NOT EXISTS idx_hc_details_lab ON health_check_details USING gin (lab_data);

-- 4. Automatically update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_health_check_masters_updated_at ON health_check_masters;
CREATE TRIGGER trg_health_check_masters_updated_at
BEFORE UPDATE ON health_check_masters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_health_check_details_updated_at ON health_check_details;
CREATE TRIGGER trg_health_check_details_updated_at
BEFORE UPDATE ON health_check_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
