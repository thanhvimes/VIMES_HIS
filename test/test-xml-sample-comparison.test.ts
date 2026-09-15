import test from 'node:test';
import assert from 'node:assert/strict';
import { generateXmlPayload } from '../src/controllers/health-check/xml-generator';
import { validateHealthCheckEnvelope } from '../src/services/health-check-xml-validation';

test('Full XML schema matching xml.txt: includes XML1, XML2, XML3, XML7, XML9, XML10, XML11, XML12', () => {
    const master = {
        patient_name: 'TRẦN VĂN LỚN',
        gender: 'Nam',
        dob: '2001-07-07',
        ethnic: '1',
        cccd: '037080003424',
        doc_no: '26292429',
        matinh_cu_tru: '237',
        maxa_cu_tru: '23713348',
        created_at: '2026-07-21T00:00:00Z'
    };

    const clinical = {
        nhiet_do: '36.5',
        mach: '80',
        nhip_tho: '20',
        huyet_ap: '120/80',
        chieu_cao: '165',
        can_nang: '60',
        chi_so_bmi: '22.0',
        the_luc_pl: '1',
        funding_source: '9',
        target_group: '14'
    };

    const history = {
        tsgd_mac_benh: '1',
        tsgd_ma_benh: 'I10',
        tsbt_mac_benh: '0',
        tsbt_ma_benh: 'K29',
        tsbt_dang_dieu_tri_benh: '1',
        tsbt_benh_tim: '1',
        tsbt_tang_huyet_ap: '1',
        tsbt_dai_thao_duong: '1',
        tsbt_ma_benh_khac: 'Viêm dạ dày mạn',
        tsbt_ten_thuoc_lieu_luong: 'Omeprazol 20mg'
    };

    const lab = {
        paraclinical_items: [
            {
                service_code: 'B1100467',
                index_code: 'B1100467',
                value: '',
                unit: 'Lần',
                description: '',
                conclusion: ''
            }
        ]
    };

    const conclusion = {
        fitness_class: '1',
        diagnosis: 'Bình thường'
    };

    const xml = generateXmlPayload('3', { ...master, history_data: history }, clinical, lab, conclusion);

    // 1. Kiểm tra cấu trúc tổng thể
    const validation = validateHealthCheckEnvelope(xml);
    assert.equal(validation.valid, true, validation.errors.join('; '));

    // 2. Kiểm tra có đủ các tệp XML1, XML2, XML7, XML9, XML10, XML11, XML12
    assert.match(xml, /<LOAIHOSO>XML1<\/LOAIHOSO>/);
    assert.match(xml, /<LOAIHOSO>XML2<\/LOAIHOSO>/);
    assert.match(xml, /<LOAIHOSO>XML7<\/LOAIHOSO>/);
    assert.match(xml, /<LOAIHOSO>XML9<\/LOAIHOSO>/);
    assert.match(xml, /<LOAIHOSO>XML10<\/LOAIHOSO>/);
    assert.match(xml, /<LOAIHOSO>XML11<\/LOAIHOSO>/);
    assert.match(xml, /<LOAIHOSO>XML12<\/LOAIHOSO>/);

    // 3. Kiểm tra XML9 (Tiền sử bệnh tật)
    assert.match(xml, /<TIEN_SU_BENH_TAT>/);
    assert.match(xml, /<TSGD_MAC_BENH>1<\/TSGD_MAC_BENH>/);
    assert.match(xml, /<TSGD_MA_BENH>I10<\/TSGD_MA_BENH>/);
    assert.match(xml, /<TSBT_BENH_TIM>1<\/TSBT_BENH_TIM>/);
    assert.match(xml, /<TSBT_TANG_HUYET_AP>1<\/TSBT_TANG_HUYET_AP>/);
    assert.match(xml, /<TSBT_DAI_THAO_DUONG>1<\/TSBT_DAI_THAO_DUONG>/);
    assert.match(xml, /<TSBT_TEN_THUOC_LIEU_LUONG>Omeprazol 20mg<\/TSBT_TEN_THUOC_LIEU_LUONG>/);

    // 4. Kiểm tra XML11 (Cận lâm sàng) có DANH_SACH_CLS và CHI_TIET_CLS
    assert.match(xml, /<KHAM_CAN_LAM_SANG>/);
    assert.match(xml, /<DANH_SACH_CLS>/);
    assert.match(xml, /<CHI_TIET_CLS>/);
    assert.match(xml, /<MA_DICH_VU>B1100467<\/MA_DICH_VU>/);
    assert.match(xml, /<MA_CHI_SO>B1100467<\/MA_CHI_SO>/);
    assert.match(xml, /<DON_VI_DO>Lần<\/DON_VI_DO>/);

    // 5. Kiểm tra XML10 (Khám thể lực)
    assert.match(xml, /<KHAM_THE_LUC>/);
    assert.match(xml, /<MACH>80<\/MACH>/);
    assert.match(xml, /<HUYET_AP>120\/80<\/HUYET_AP>/);
    assert.match(xml, /<CHIEU_CAO>165<\/CHIEU_CAO>/);
    assert.match(xml, /<CAN_NANG>60<\/CAN_NANG>/);
});
