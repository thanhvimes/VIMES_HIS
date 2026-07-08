-- SQL Migration: Combined database setup for health-check-sync (VNeID integration)
-- Description: Aggregates tables, indexes, triggers, and default settings for easy database setup/upgrade.

-- 1. TABLE: health_check_documents
CREATE TABLE IF NOT EXISTS health_check_documents (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(20),
    patient_name VARCHAR(100),
    doc_no VARCHAR(50),
    form_type VARCHAR(10) NOT NULL,
    json_data JSONB,
    xml_data TEXT,
    signature TEXT,
    signature_type VARCHAR(10) DEFAULT 'USB' NOT NULL,
    signature_status VARCHAR(20) DEFAULT 'Unsigned' NOT NULL,
    send_status VARCHAR(20) DEFAULT 'Unsent' NOT NULL,
    sent_at TIMESTAMP,
    transaction_id VARCHAR(100),
    error_message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_health_check_docs_send_status ON health_check_documents(send_status);
CREATE INDEX IF NOT EXISTS idx_health_check_docs_patient ON health_check_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_check_docs_doc_no ON health_check_documents(doc_no);


-- 2. TABLE: health_check_masters
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
    his_employee_id VARCHAR(50),
    his_contract_id INTEGER,
    his_doc_no VARCHAR(50),
    sync_mode VARCHAR(20) DEFAULT 'MANUAL' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hc_masters_patient ON health_check_masters(patient_id);
CREATE INDEX IF NOT EXISTS idx_hc_masters_name ON health_check_masters(patient_name);
CREATE INDEX IF NOT EXISTS idx_hc_masters_cccd ON health_check_masters(cccd);
CREATE INDEX IF NOT EXISTS idx_hc_masters_status ON health_check_masters(send_status);
CREATE INDEX IF NOT EXISTS idx_hc_masters_doc_no ON health_check_masters(doc_no);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_masters_his_emp_contract 
    ON health_check_masters(his_employee_id, his_contract_id) 
    WHERE his_employee_id IS NOT NULL AND his_contract_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hc_masters_his_contract
    ON health_check_masters(his_contract_id)
    WHERE his_contract_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hc_masters_his_doc_no
    ON health_check_masters(his_doc_no)
    WHERE his_doc_no IS NOT NULL;



-- 3. TABLE: health_check_details
CREATE TABLE IF NOT EXISTS health_check_details (
    id SERIAL PRIMARY KEY,
    master_id INTEGER NOT NULL REFERENCES health_check_masters(id) ON DELETE CASCADE,
    clinical_data JSONB,
    lab_data JSONB,
    conclusion_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hc_details_clinical ON health_check_details USING gin (clinical_data);
CREATE INDEX IF NOT EXISTS idx_hc_details_lab ON health_check_details USING gin (lab_data);


-- 4. TABLE: health_check_settings
CREATE TABLE IF NOT EXISTS health_check_settings (
    id SERIAL PRIMARY KEY,
    vneid_url VARCHAR(255) DEFAULT 'https://api-vneid.moh.gov.vn/api/v1',
    vneid_username VARCHAR(100) DEFAULT '',
    vneid_password VARCHAR(255) DEFAULT '',
    ma_cskcb VARCHAR(20) DEFAULT '15124',
    ma_gtin_cskcb VARCHAR(20) DEFAULT '1234567890123',
    auto_sync_enabled BOOLEAN DEFAULT FALSE,
    auto_sync_interval INTEGER DEFAULT 15,
    barcode_label_size_xn VARCHAR(20) DEFAULT '50x30' NOT NULL,
    barcode_label_size_ksk VARCHAR(20) DEFAULT '50x30' NOT NULL,
    barcode_show_hospital BOOLEAN DEFAULT TRUE NOT NULL,
    barcode_show_date BOOLEAN DEFAULT TRUE NOT NULL,
    barcode_show_sample_type BOOLEAN DEFAULT TRUE NOT NULL,
    allow_unsigned_sync BOOLEAN DEFAULT FALSE NOT NULL,
    barcode_zpl_template_xn TEXT DEFAULT '^XA
^CF0,26
^FO30,30^FD{hospital}^FS
^FO30,70^FD{patient}^FS
^FO30,105^FD{test}^FS
^FO30,140^FD{sample_type} - {date}^FS
^BY2,2,40
^FO30,175^BCN,,N,N
^FD{code}^FS
^FO30,225^FD{code}^FS
^XZ',
    barcode_zpl_template_ksk TEXT DEFAULT '^XA
^CF0,26
^FO30,30^FD{hospital}^FS
^FO30,70^FD{patient}^FS
^FO30,105^FD{form_name}^FS
^FO30,140^FD{info}^FS
^BY2,2,40
^FO30,175^BCN,,N,N
^FD{code}^FS
^FO30,225^FD{code}^FS
^XZ',
    barcode_printer_name VARCHAR(100) DEFAULT 'Zebra',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Insert default settings row if table is empty
INSERT INTO health_check_settings (
    vneid_url, vneid_username, vneid_password, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval
)
SELECT 
    'https://api-vneid.moh.gov.vn/api/v1', 
    'vimes_cskcb', 
    'vClinic-secure-pass-2026', 
    '15124', 
    '1234567890123', 
    FALSE, 
    15
WHERE NOT EXISTS (SELECT 1 FROM health_check_settings);


-- 5. FUNCTION & TRIGGERS: Auto update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for health_check_documents
DROP TRIGGER IF EXISTS trg_health_check_documents_updated_at ON health_check_documents;
CREATE TRIGGER trg_health_check_documents_updated_at
BEFORE UPDATE ON health_check_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for health_check_masters
DROP TRIGGER IF EXISTS trg_health_check_masters_updated_at ON health_check_masters;
CREATE TRIGGER trg_health_check_masters_updated_at
BEFORE UPDATE ON health_check_masters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for health_check_details
DROP TRIGGER IF EXISTS trg_health_check_details_updated_at ON health_check_details;
CREATE TRIGGER trg_health_check_details_updated_at
BEFORE UPDATE ON health_check_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for health_check_settings
DROP TRIGGER IF EXISTS trg_health_check_settings_updated_at ON health_check_settings;
CREATE TRIGGER trg_health_check_settings_updated_at
BEFORE UPDATE ON health_check_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- 6. ADDITIONAL ALTERATIONS & COMMENTS FOR HIS SYNC (From Migration 031)
ALTER TABLE hms_exm_contract
    ADD COLUMN IF NOT EXISTS hec_synced_count INTEGER DEFAULT 0;

COMMENT ON COLUMN health_check_masters.his_employee_id IS 'Maps to hee_employee_id in hms_exm_employee (HIS). Used as UPSERT key for re-sync.';
COMMENT ON COLUMN health_check_masters.his_contract_id IS 'Maps to hec_contract_id in hms_exm_contract (HIS). Groups records by health check contract.';
COMMENT ON COLUMN health_check_masters.his_doc_no IS 'Maps to hee_docno / hd_docno in HIS (treating doc number). Used for HIS transactions.';
COMMENT ON COLUMN health_check_masters.sync_mode IS 'HIS = synced from HIS, MANUAL = created manually in vClinic.';
COMMENT ON COLUMN hms_exm_contract.hec_synced_count IS 'Number of employee records successfully synced in the last sync operation.';

