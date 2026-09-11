-- Migration 078: Add Department of Health (SYT / HSSKDT Hanoi) Gateway Configuration and Master Status
-- Description: Supports sending health check records to BYT only, SYT only, or BOTH simultaneously (QĐ 2062 & CV 7286/SYT-QLBHYTCNTT)

-- 1. Add SYT Gateway configuration columns to health_check_settings
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS sync_target_mode VARCHAR(20) DEFAULT 'BYT_ONLY';
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS syt_url VARCHAR(255) DEFAULT 'https://api-hssk.hanoi.gov.vn';
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS syt_username VARCHAR(100);
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS syt_password TEXT;
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS syt_receiver_id VARCHAR(50) DEFAULT 'VTS';
ALTER TABLE health_check_settings ADD COLUMN IF NOT EXISTS syt_enabled BOOLEAN DEFAULT FALSE;

-- 2. Add independent SYT status columns to health_check_masters for multi-gateway tracking
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS syt_send_status VARCHAR(20) DEFAULT 'Unsent';
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS syt_sent_at TIMESTAMP;
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS syt_transaction_id VARCHAR(100);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS syt_error_message VARCHAR(500);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS syt_response_log TEXT;

-- 3. Optimization index on syt_send_status for fast filtering
CREATE INDEX IF NOT EXISTS idx_hc_masters_syt_status ON health_check_masters(syt_send_status);
