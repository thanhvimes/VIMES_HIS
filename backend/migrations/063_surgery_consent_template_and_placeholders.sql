-- Migration 063: Seed SURGERY_CONSENT Document Template & Signature Placeholders (Doctor & Patient)

-- 1. Insert Data Contract
INSERT INTO hms_document_data_contract (code, version, name, json_schema, status, created_by)
VALUES (
  'SURGERY_CONSENT',
  1,
  'Hợp đồng dữ liệu Giấy cam đoan phẫu thuật, thủ thuật và điều trị',
  '{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["hospital", "document", "patient", "surgery", "doctor"],
    "properties": {
      "hospital": {
        "type": "object",
        "required": ["name", "department"],
        "properties": {
          "name": { "type": "string" },
          "department": { "type": "string" },
          "address": { "type": "string" }
        }
      },
      "document": {
        "type": "object",
        "required": ["number", "createdDate"],
        "properties": {
          "number": { "type": "string" },
          "createdDate": { "type": "string" },
          "location": { "type": "string" }
        }
      },
      "patient": {
        "type": "object",
        "required": ["code", "fullName", "dob", "gender"],
        "properties": {
          "code": { "type": "string" },
          "fullName": { "type": "string" },
          "dob": { "type": "string" },
          "gender": { "type": "string" },
          "address": { "type": "string" },
          "insuranceNumber": { "type": "string" },
          "phone": { "type": "string" }
        }
      },
      "representative": {
        "type": "object",
        "properties": {
          "fullName": { "type": "string" },
          "relation": { "type": "string" },
          "idNumber": { "type": "string" },
          "phone": { "type": "string" }
        }
      },
      "surgery": {
        "type": "object",
        "required": ["diagnosis", "procedureName", "anesthesiaMethod"],
        "properties": {
          "diagnosis": { "type": "string" },
          "procedureName": { "type": "string" },
          "anesthesiaMethod": { "type": "string" },
          "plannedTime": { "type": "string" },
          "explainedRisks": { "type": "string" }
        }
      },
      "doctor": {
        "type": "object",
        "required": ["fullName", "title"],
        "properties": {
          "fullName": { "type": "string" },
          "title": { "type": "string" }
        }
      }
    }
  }'::jsonb,
  'PUBLISHED',
  'system_migration'
)
ON CONFLICT (code, version) DO UPDATE 
SET json_schema = EXCLUDED.json_schema;

-- 2. Insert Template Header
INSERT INTO hms_document_template (code, name, document_type, module_code, description, category, tags, created_by)
VALUES (
  'SURGERY_CONSENT',
  'Giấy cam đoan chấp nhận phẫu thuật, thủ thuật và điều trị',
  'SURGERY_CONSENT',
  'SURGERY',
  'Mẫu biểu y tế điện tử tích hợp xác thực chữ ký số kép (Người bệnh/Thân nhân và Bác sĩ điều trị)',
  'EMR_CLINICAL',
  '["SURGERY", "CONSENT", "SIGNATURE", "ANESTHESIA"]'::jsonb,
  'system_migration'
)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW();

-- 3. Insert Template Version 1
DO $$
DECLARE
  v_template_id BIGINT;
  v_contract_id BIGINT;
  v_version_id BIGINT;
BEGIN
  SELECT id INTO v_template_id FROM hms_document_template WHERE code = 'SURGERY_CONSENT';
  SELECT id INTO v_contract_id FROM hms_document_data_contract WHERE code = 'SURGERY_CONSENT' AND version = 1;

  INSERT INTO hms_document_template_version (
    template_id,
    version,
    contract_id,
    status,
    artifact_key,
    sample_data,
    created_by,
    reviewed_by,
    reviewed_at,
    published_by,
    published_at
  )
  VALUES (
    v_template_id,
    1,
    v_contract_id,
    'PUBLISHED',
    'SURGERY_CONSENT/v1/template.docx',
    '{
      "hospital": { "name": "BỆNH VIỆN ĐA KHOA VIMES", "department": "KHOA PHẪU THUẬT - GÂY MÊ HỒI SỨC", "address": "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội" },
      "document": { "number": "GCK-2026-00088", "createdDate": "14/08/2026", "location": "Hà Nội" },
      "patient": { "code": "BN2026081401", "fullName": "HOÀNG MINH TRÍ", "dob": "20/10/1988", "gender": "Nam", "address": "Số 15 Phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội", "insuranceNumber": "DN4010199887766", "phone": "0987654321" },
      "representative": { "fullName": "NGUYỄN THỊ MAI", "relation": "Vợ người bệnh", "idNumber": "001188009988", "phone": "0912345678" },
      "surgery": { "diagnosis": "Viêm ruột thừa cấp giờ thứ 12 (K35.8)", "procedureName": "Phẫu thuật nội soi cắt ruột thừa viêm", "anesthesiaMethod": "Gây mê nội khí quản", "plannedTime": "14/08/2026 14:00", "explainedRisks": "Nguy cơ chảy máu trong/sau mổ, nhiễm trùng vết mổ, dị ứng thuốc mê/thuốc tê, tổn thương tạng lân cận đã được Bác sĩ giải thích rõ ràng." },
      "doctor": { "fullName": "BS. CKII NGUYỄN VĂN AN", "title": "Bác sĩ phẫu thuật viên chính" }
    }'::jsonb,
    'system_migration',
    'medical_director',
    NOW(),
    'system_admin',
    NOW()
  )
  ON CONFLICT (template_id, version) DO UPDATE
  SET status = 'PUBLISHED'
  RETURNING id INTO v_version_id;

  IF v_version_id IS NULL THEN
    SELECT id INTO v_version_id FROM hms_document_template_version WHERE template_id = v_template_id AND version = 1;
  END IF;

  -- Update active_version_id on template header
  UPDATE hms_document_template SET active_version_id = v_version_id WHERE id = v_template_id;

  -- 4. Seed Signature Placeholders (1: Patient, 2: Doctor)
  -- Placeholder 1: SIG_PATIENT (Cột bên trái)
  INSERT INTO hms_document_signature_placeholder (
    template_id,
    template_version_id,
    code,
    field_name,
    signer_role,
    signing_order,
    page_index,
    x1_pt,
    y1_pt,
    x2_pt,
    y2_pt,
    page_width_pt,
    page_height_pt,
    page_rotation,
    crop_box,
    normalized_rect,
    required,
    status,
    created_by
  )
  VALUES (
    v_template_id,
    v_version_id,
    'SIG_PATIENT',
    'patient_signature',
    'PATIENT',
    1,
    0,
    50.000,
    80.000,
    260.000,
    155.000,
    595.000,
    842.000,
    0,
    '[0, 0, 595, 842]'::jsonb,
    '{"x": 0.084, "y": 0.095, "width": 0.353, "height": 0.089}'::jsonb,
    TRUE,
    'ACTIVE',
    'system_migration'
  )
  ON CONFLICT (template_version_id, code) DO UPDATE
  SET x1_pt = EXCLUDED.x1_pt, y1_pt = EXCLUDED.y1_pt, x2_pt = EXCLUDED.x2_pt, y2_pt = EXCLUDED.y2_pt, updated_at = NOW();

  -- Placeholder 2: SIG_DOCTOR (Cột bên phải)
  INSERT INTO hms_document_signature_placeholder (
    template_id,
    template_version_id,
    code,
    field_name,
    signer_role,
    signing_order,
    page_index,
    x1_pt,
    y1_pt,
    x2_pt,
    y2_pt,
    page_width_pt,
    page_height_pt,
    page_rotation,
    crop_box,
    normalized_rect,
    required,
    status,
    created_by
  )
  VALUES (
    v_template_id,
    v_version_id,
    'SIG_DOCTOR',
    'doctor_signature',
    'DOCTOR',
    2,
    0,
    335.000,
    80.000,
    545.000,
    155.000,
    595.000,
    842.000,
    0,
    '[0, 0, 595, 842]'::jsonb,
    '{"x": 0.563, "y": 0.095, "width": 0.353, "height": 0.089}'::jsonb,
    TRUE,
    'ACTIVE',
    'system_migration'
  )
  ON CONFLICT (template_version_id, code) DO UPDATE
  SET x1_pt = EXCLUDED.x1_pt, y1_pt = EXCLUDED.y1_pt, x2_pt = EXCLUDED.x2_pt, y2_pt = EXCLUDED.y2_pt, updated_at = NOW();

END $$;
