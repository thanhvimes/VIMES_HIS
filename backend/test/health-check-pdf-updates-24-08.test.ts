import test from 'node:test';
import assert from 'node:assert';
import { generateXmlPayload } from '../src/controllers/health-check/xml-generator';

test('KSK PDF 24-08-2026 - Item 8: XML1 includes Tiền sử from history_data and XML11 includes service_name for Paraclinical', () => {
    const master = {
        patient_name: 'NGUYỄN VĂN AN',
        cccd: '037090001234',
        dob: '1990-05-15',
        doc_no: 'HS-2026-0001',
        history_data: {
            tsbt_tang_huyet_ap: '1',
            tsbt_dai_thao_duong: '1',
            tsgd_mac_benh: '1',
            tsgd_ma_benh: 'I10'
        }
    };

    const clinical = {};
    const lab = {
        paraclinical_items: [
            {
                service_code: 'XN.001',
                reg_code: '22.0120.1370',
                service_name: 'Định lượng Glucose máu',
                index_code: 'H18',
                value: '5.2',
                unit: 'mmol/L',
                description: 'Đường huyết lúc đói',
                conclusion: 'Bình thường',
                order_id: '100234'
            }
        ]
    };
    const conclusion = {
        fitness_class: '1',
        diagnosis: 'K76.0'
    };

    const xml = generateXmlPayload('3', master, clinical, lab, conclusion);

    // Assert XML1 history
    assert.ok(xml.includes('<TSBT_TANG_HUYET_AP>1</TSBT_TANG_HUYET_AP>'), 'Phải chứa tiền sử tăng huyết áp = 1');
    assert.ok(xml.includes('<TSBT_DAI_THAO_DUONG>1</TSBT_DAI_THAO_DUONG>'), 'Phải chứa tiền sử đái tháo đường = 1');
    assert.ok(xml.includes('<TSGD_MAC_BENH>1</TSGD_MAC_BENH>'), 'Phải chứa tiền sử gia đình mắc bệnh = 1');
    assert.ok(xml.includes('<TSGD_MA_BENH>I10</TSGD_MA_BENH>'), 'Phải chứa mã bệnh gia đình I10');

    // Giải mã Base64 XML11 trong Envelope
    const xml11Match = xml.match(/<LOAIHOSO>XML11<\/LOAIHOSO>\s*<NOIDUNGFILE>([^<]+)<\/NOIDUNGFILE>/);
    const xml11Content = xml11Match ? Buffer.from(xml11Match[1], 'base64').toString('utf-8') : xml;

    // Assert XML11 paraclinical với MA_DICH_VU lấy từ hfl_ma_chi_so hoặc reg_code
    assert.ok(xml11Content.includes('<MA_DICH_VU>22.0120.1370</MA_DICH_VU>'), 'Phải sử dụng mã cho MA_DICH_VU');
    assert.ok(xml11Content.includes('<MA_CHI_SO>H18</MA_CHI_SO>'), 'Phải sử dụng mã index_code cho MA_CHI_SO');
    assert.ok(xml11Content.includes('<GIA_TRI>5.2</GIA_TRI>'), 'Phải có giá trị kết quả');
    assert.ok(xml11Content.includes('<MO_TA>Đường huyết lúc đói</MO_TA>'), 'Phải có mô tả');
    assert.ok(xml11Content.includes('<KET_LUAN>Bình thường</KET_LUAN>'), 'Phải có kết luận');
});

test('KSK PDF 24-08-2026 - Item 6: Push Response strictly verifies CM_SUCCESS / PS_SYNC_SUCCESS', () => {
    const isSuccessResponse = (status: number, resCode?: string) => {
        const trimmed = String(resCode || '').trim();
        return status === 200 && (trimmed === 'CM_SUCCESS' || trimmed === 'PS_SYNC_SUCCESS');
    };

    assert.strictEqual(isSuccessResponse(200, 'CM_SUCCESS'), true, 'CM_SUCCESS phải thành công');
    assert.strictEqual(isSuccessResponse(200, 'PS_SYNC_SUCCESS'), true, 'PS_SYNC_SUCCESS phải thành công');
    assert.strictEqual(isSuccessResponse(200, 'PS_CCCD_DUPLICATE_IN_6_MONTHS'), false, 'Trùng CCCD 6 tháng phải báo lỗi không được coi là thành công');
    assert.strictEqual(isSuccessResponse(200, 'CM_INVALID_REQUEST'), false, 'Invalid request phải báo lỗi');
    assert.strictEqual(isSuccessResponse(200, undefined), false, 'Không có mã kết quả phải coi là lỗi');
    assert.strictEqual(isSuccessResponse(500, 'CM_SUCCESS'), false, 'HTTP 500 phải coi là lỗi');
});

test('KSK PDF 24-08-2026 - Item 5: Send button gate condition', () => {
    const canSendDocument = (doc: any) => {
        const isDone = doc.status === 'ĐÃ_KẾT_LUẬN' || 
                       doc.conclusion_data?.fitness_class || 
                       doc.conclusion_data?.ket_luan_loai_suc_khoe || 
                       doc.conclusion_data?.diagnosis;
        return !!isDone;
    };

    assert.strictEqual(canSendDocument({ status: 'ĐÃ_KẾT_LUẬN' }), true, 'Đã kết luận cho phép gửi');
    assert.strictEqual(canSendDocument({ conclusion_data: { fitness_class: '1' } }), true, 'Có phân loại sức khỏe cho phép gửi');
    assert.strictEqual(canSendDocument({ conclusion_data: { diagnosis: 'Z00.0' } }), true, 'Có chẩn đoán kết luận cho phép gửi');
});

test('XML11 MA_DICH_VU takes hfl_ma_chi_so from hms_fee_list when present', () => {
    const master = { patient_name: 'TEST', cccd: '037090001234', dob: '1990-05-15', doc_no: 'HS-001' };
    const lab = {
        paraclinical_items: [
            {
                service_code: 'B1100467',
                hfl_ma_chi_so: 'H173',
                reg_code: '22.0308.1306',
                service_name: 'Nghiệm pháp Coombs gián tiếp',
                index_code: 'B1100467',
                value: '4.1',
                unit: 'mmol/L',
                conclusion: 'Bình thường'
            }
        ]
    };
    const xml = generateXmlPayload('3', master, {}, lab, { fitness_class: '1' });
    const xml11Match = xml.match(/<LOAIHOSO>XML11<\/LOAIHOSO>\s*<NOIDUNGFILE>([^<]+)<\/NOIDUNGFILE>/);
    const xml11Content = xml11Match ? Buffer.from(xml11Match[1], 'base64').toString('utf-8') : xml;

    assert.ok(xml11Content.includes('<MA_DICH_VU>H173</MA_DICH_VU>'), 'MA_DICH_VU phải được lấy từ trường hfl_ma_chi_so (H173)');
    assert.ok(xml11Content.includes('<MA_CHI_SO>B1100467</MA_CHI_SO>'), 'MA_CHI_SO');
});

test('KSK PDF 24-08-2026 - Item 5: Send button gate condition continuation', () => {
    const canSendDocument = (doc: any) => {
        const isDone = doc.status === 'ĐÃ_KẾT_LUẬN' || 
                       doc.conclusion_data?.fitness_class || 
                       doc.conclusion_data?.ket_luan_loai_suc_khoe || 
                       doc.conclusion_data?.diagnosis;
        return !!isDone;
    };
    assert.strictEqual(canSendDocument({ status: 'ĐANG_KHÁM', conclusion_data: {} }), false, 'Chưa kết luận không được phép gửi');
    assert.strictEqual(canSendDocument({}), false, 'Hồ sơ trống không được phép gửi');
});
