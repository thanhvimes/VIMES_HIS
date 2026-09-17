import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { healthCheckTwoTierSigner } from '../src/services/health-check-two-tier-signer.service';

const SAMPLE_RAW_XML = `<?xml version="1.0" encoding="UTF-8"?>
<KHAMSUCKHOE xmlns="http://byth.gov.vn/ksk">
	<THONGTINHOSO>
		<MA_HOSO>KSK_2026_001</MA_HOSO>
		<SO_CCCD>001099012345</SO_CCCD>
		<HO_TEN>NGUYỄN VĂN AN</HO_TEN>
	</THONGTINHOSO>
	<CHUKYDONVI>
		<CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>
		<CKS_BENH_VIEN></CKS_BENH_VIEN>
	</CHUKYDONVI>
</KHAMSUCKHOE>`;

test('1. Bước 1: Chuẩn hóa XML và tính hash SHA-256 với 2 thẻ CKS để trống', () => {
    const step1 = healthCheckTwoTierSigner.getStep1Hash(SAMPLE_RAW_XML);
    assert.ok(step1.hashHex, 'Phải có hash SHA-256 dạng Hex');
    assert.ok(step1.hashBase64, 'Phải có hash SHA-256 dạng Base64');
    assert.strictEqual(step1.hashHex.length, 64, 'SHA-256 Hex phải có độ dài đúng 64 ký tự');
    
    // Kiểm tra preparedXml có 2 thẻ để trống
    assert.match(step1.preparedXml, /<CKS_NGUOI_KET_LUAN><\/CKS_NGUOI_KET_LUAN>/);
    assert.match(step1.preparedXml, /<CKS_BENH_VIEN><\/CKS_BENH_VIEN>/);

    const check = healthCheckTwoTierSigner.isFullySigned(step1.preparedXml);
    assert.strictEqual(check.fullySigned, false);
    assert.strictEqual(check.hasDoctorSig, false);
    assert.strictEqual(check.hasHospitalSig, false);
});

test('2. Bước 1 (Hoàn tất): Dán chữ ký Bác sĩ (CKS_NGUOI_KET_LUAN) và kiểm tra trạng thái', () => {
    const doctorSig = 'MIID+zCCAuwCCQDgBabc123DoctorSigBase64==';
    const xmlWithDocSig = healthCheckTwoTierSigner.applyDoctorSignature(SAMPLE_RAW_XML, doctorSig);

    assert.ok(xmlWithDocSig.includes(`<CKS_NGUOI_KET_LUAN>${doctorSig}</CKS_NGUOI_KET_LUAN>`));
    assert.ok(xmlWithDocSig.includes('<CKS_BENH_VIEN></CKS_BENH_VIEN>'));

    const check = healthCheckTwoTierSigner.isFullySigned(xmlWithDocSig);
    assert.strictEqual(check.fullySigned, false);
    assert.strictEqual(check.hasDoctorSig, true);
    assert.strictEqual(check.hasHospitalSig, false);
});

test('3. Bước 2: Băm XML đã có CKS_NGUOI_KET_LUAN (CKS_BENH_VIEN để trống) và dán chữ ký Bệnh viện', () => {
    const doctorSig = 'MIID+zCCAuwCCQDgBabc123DoctorSigBase64==';
    const xmlWithDocSig = healthCheckTwoTierSigner.applyDoctorSignature(SAMPLE_RAW_XML, doctorSig);

    const step2 = healthCheckTwoTierSigner.getStep2Hash(xmlWithDocSig);
    assert.ok(step2.hashHex);
    assert.ok(step2.hashBase64);

    // Hash Bước 2 phải khác Hash Bước 1 (do đã chứa CKS Bác sĩ)
    const step1 = healthCheckTwoTierSigner.getStep1Hash(SAMPLE_RAW_XML);
    assert.notStrictEqual(step2.hashHex, step1.hashHex, 'Hash Bước 2 phải khác Hash Bước 1');

    const hospitalSig = 'MIIEvgIBADANBgkqhkiG9w0HospitalSigBase64==';
    const fullySignedXml = healthCheckTwoTierSigner.applyHospitalSignature(xmlWithDocSig, hospitalSig);

    assert.ok(fullySignedXml.includes(`<CKS_NGUOI_KET_LUAN>${doctorSig}</CKS_NGUOI_KET_LUAN>`));
    assert.ok(fullySignedXml.includes(`<CKS_BENH_VIEN>${hospitalSig}</CKS_BENH_VIEN>`));

    const check = healthCheckTwoTierSigner.isFullySigned(fullySignedXml);
    assert.strictEqual(check.fullySigned, true, 'File XML phải đạt trạng thái đủ 2 chữ ký');
    assert.strictEqual(check.hasDoctorSig, true);
    assert.strictEqual(check.hasHospitalSig, true);
});

test('4. Tự phục hồi các định dạng XML đặc biệt (thẻ tự đóng, thiếu thẻ CHUKYDONVI)', () => {
    // Trường hợp 1: Thẻ CHUKYDONVI tự đóng <CHUKYDONVI />
    const xmlSelfClosingBlock = `<?xml version="1.0"?><KHAMSUCKHOE><THONGTINHOSO><MA>001</MA></THONGTINHOSO><CHUKYDONVI /></KHAMSUCKHOE>`;
    const prep1 = healthCheckTwoTierSigner.prepareXmlForStep1(xmlSelfClosingBlock);
    assert.match(prep1, /<CKS_NGUOI_KET_LUAN><\/CKS_NGUOI_KET_LUAN>/);
    assert.match(prep1, /<CKS_BENH_VIEN><\/CKS_BENH_VIEN>/);

    // Trường hợp 2: Thẻ con tự đóng <CKS_NGUOI_KET_LUAN/>
    const xmlSelfClosingChild = `<?xml version="1.0"?><KHAMSUCKHOE><CHUKYDONVI><CKS_NGUOI_KET_LUAN/><CKS_BENH_VIEN/></CHUKYDONVI></KHAMSUCKHOE>`;
    const prep2 = healthCheckTwoTierSigner.prepareXmlForStep1(xmlSelfClosingChild);
    assert.match(prep2, /<CKS_NGUOI_KET_LUAN><\/CKS_NGUOI_KET_LUAN>/);
    assert.match(prep2, /<CKS_BENH_VIEN><\/CKS_BENH_VIEN>/);

    // Trường hợp 3: Chưa có thẻ CHUKYDONVI nào
    const xmlMissingBlock = `<?xml version="1.0"?><KHAMSUCKHOE><THONGTINHOSO><MA>001</MA></THONGTINHOSO></KHAMSUCKHOE>`;
    const prep3 = healthCheckTwoTierSigner.prepareXmlForStep1(xmlMissingBlock);
    assert.ok(prep3.includes('<CHUKYDONVI>'));
    assert.match(prep3, /<CKS_NGUOI_KET_LUAN><\/CKS_NGUOI_KET_LUAN>/);
    assert.match(prep3, /<CKS_BENH_VIEN><\/CKS_BENH_VIEN>/);
});

test('5. Ký số thực tế bằng cặp khóa RSA (RSA-SHA256) và xác minh tính toàn vẹn', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
    });

    const docSig = 'DOCTOR_SIG_VALUE_BASE64';
    const xmlWithDoc = healthCheckTwoTierSigner.applyDoctorSignature(SAMPLE_RAW_XML, docSig);
    const step2 = healthCheckTwoTierSigner.getStep2Hash(xmlWithDoc);

    // Thực hiện ký bằng private key
    const hospitalSignature = healthCheckTwoTierSigner.signContentWithPrivateKey(step2.preparedXml, privateKey);
    assert.ok(hospitalSignature && hospitalSignature.length > 50, 'Chữ ký Base64 RSA phải được sinh ra');

    // Xác minh chữ ký bằng public key
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(Buffer.from(step2.preparedXml, 'utf8'));
    verifier.end();
    const isValid = verifier.verify(publicKey, hospitalSignature, 'base64');
    assert.strictEqual(isValid, true, 'Chữ ký số RSA-SHA256 phải được xác minh hợp lệ 100%');
});
