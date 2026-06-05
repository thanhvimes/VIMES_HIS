-- Migration: Create health_check_documents table
-- Description: Table to store health check documents for synchronization with VNeID (Quyết định 1551/QĐ-BYT)

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

-- Index for scanning unsent / error documents
CREATE INDEX IF NOT EXISTS idx_health_check_docs_send_status ON health_check_documents(send_status);
CREATE INDEX IF NOT EXISTS idx_health_check_docs_patient ON health_check_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_check_docs_doc_no ON health_check_documents(doc_no);
