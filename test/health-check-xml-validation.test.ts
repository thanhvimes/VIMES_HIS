import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHealthCheckEnvelope } from '../src/services/health-check-xml-validation';
import { validateFinalEncodedHealthCheckXml } from '../src/services/health-check-sync.service';

const validXml = `<?xml version="1.0"?><KHAMSUCKHOE><THONGTINDONVI><MACSKCB>8934285008135</MACSKCB></THONGTINDONVI><THONGTINHOSO><SOLUONGHOSO>3</SOLUONGHOSO><DANHSACHHOSO><HOSO><FILEHOSO><LOAIHOSO>XML1</LOAIHOSO><NOIDUNGFILE><A/></NOIDUNGFILE></FILEHOSO><FILEHOSO><LOAIHOSO>XML2</LOAIHOSO><NOIDUNGFILE><B/></NOIDUNGFILE></FILEHOSO><FILEHOSO><LOAIHOSO>XML12</LOAIHOSO><NOIDUNGFILE><C/></NOIDUNGFILE></FILEHOSO></HOSO></DANHSACHHOSO></THONGTINHOSO></KHAMSUCKHOE>`;

test('XML envelope validator accepts required QĐ 2062 core files', () => {
    assert.deepEqual(validateHealthCheckEnvelope(validXml), { valid: true, errors: [] });
});

test('XML envelope validator detects count and required file errors', () => {
    const invalid = validXml.replace('<SOLUONGHOSO>3</SOLUONGHOSO>', '<SOLUONGHOSO>0</SOLUONGHOSO>').replace('<LOAIHOSO>XML12</LOAIHOSO>', '<LOAIHOSO>XML99</LOAIHOSO>');
    const result = validateHealthCheckEnvelope(invalid);
    assert.equal(result.valid, false);
    assert.ok(result.errors.includes('SOLUONGHOSO phải lớn hơn 0'));
    assert.ok(result.errors.includes('Thiếu XML12 kết luận'));
});

test('XML envelope validator rejects empty and incomplete XML', () => {
    assert.equal(validateHealthCheckEnvelope('').valid, false);
    const result = validateHealthCheckEnvelope('<KHAMSUCKHOE/>');
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 4);
});

test('XML envelope validator rejects invalid QĐ 2062 TYPE and funding codes', () => {
    const invalid = validXml
        .replace('<NOIDUNGFILE><B/></NOIDUNGFILE>', '<NOIDUNGFILE><TYPE>Unknown</TYPE><NGUON_CHI_TRA>7</NGUON_CHI_TRA></NOIDUNGFILE>');
    const result = validateHealthCheckEnvelope(invalid);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes('TYPE không hợp lệ')));
    assert.ok(result.errors.some(error => error.includes('NGUON_CHI_TRA không hợp lệ')));
});

test('XML envelope validator rejects invalid examination identifiers', () => {
    const invalid = validXml
        .replace('<SOLUONGHOSO>3</SOLUONGHOSO>', '')
        .replace('<NOIDUNGFILE><B/></NOIDUNGFILE>', '<NOIDUNGFILE><MA_LK></MA_LK><NGAY_VAO>20260813</NGAY_VAO></NOIDUNGFILE>');
    const result = validateHealthCheckEnvelope(invalid);
    assert.equal(result.valid, false);
    assert.ok(result.errors.includes('Thiếu SOLUONGHOSO'));
    assert.ok(result.errors.includes('MA_LK không được để trống'));
    assert.ok(result.errors.includes('NGAY_VAO phải có định dạng YYYYMMDDHHmm'));
});

test('final Base64 XML validation checks the exact payload sent to gateway', () => {
    const encoded = Buffer.from(validXml, 'utf8').toString('base64');
    assert.deepEqual(validateFinalEncodedHealthCheckXml(encoded), { valid: true, errors: [] });
    assert.equal(validateFinalEncodedHealthCheckXml('not-base64-xml').valid, false);
});
