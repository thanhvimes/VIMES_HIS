-- Migration: Create tables for native PACS & RIS
-- Create hms_pacs_template_custom and hms_pacs_favorites

CREATE TABLE IF NOT EXISTS hms_pacs_template_custom (
    hptc_id SERIAL PRIMARY KEY,
    hptc_doctor VARCHAR(50) NOT NULL,
    hptc_name VARCHAR(200) NOT NULL,
    hptc_modality VARCHAR(20) NOT NULL,
    hptc_content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hms_pacs_favorites (
    hpf_doctor VARCHAR(50) NOT NULL,
    hpf_orderid INT NOT NULL,
    hpf_itemid INT NOT NULL,
    PRIMARY KEY (hpf_doctor, hpf_orderid, hpf_itemid)
);
