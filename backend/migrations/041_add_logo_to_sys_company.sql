-- Add logo field for base64 storage
ALTER TABLE sys_company ADD COLUMN IF NOT EXISTS sc_logo TEXT;
