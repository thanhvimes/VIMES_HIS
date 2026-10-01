import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveChildRelationCode, generateXmlPayload } from '../src/controllers/health-check/xml-generator';

test('1. resolveChildRelationCode maps Vietnamese relationship text to standard numeric codes per QD 2062', () => {
    // 1: Cha / Bố / Ba
    assert.equal(resolveChildRelationCode('Cha'), '1');
    assert.equal(resolveChildRelationCode('cha'), '1');
    assert.equal(resolveChildRelationCode('Bố'), '1');
    assert.equal(resolveChildRelationCode('bố'), '1');
    assert.equal(resolveChildRelationCode('Ba'), '1');
    assert.equal(resolveChildRelationCode('Bố đẻ'), '1');

    // 2: Mẹ / Má
    assert.equal(resolveChildRelationCode('Mẹ'), '2');
    assert.equal(resolveChildRelationCode('mẹ'), '2');
    assert.equal(resolveChildRelationCode('Má'), '2');
    assert.equal(resolveChildRelationCode('Mẹ đẻ'), '2');

    // 3: Ông/Bà
    assert.equal(resolveChildRelationCode('Ông'), '3');
    assert.equal(resolveChildRelationCode('Bà'), '3');
    assert.equal(resolveChildRelationCode('Ông/Bà'), '3');
    assert.equal(resolveChildRelationCode('Ông nội'), '3');
    assert.equal(resolveChildRelationCode('Bà ngoại'), '3');

    // 4: Anh/Chị
    assert.equal(resolveChildRelationCode('Anh'), '4');
    assert.equal(resolveChildRelationCode('Chị'), '4');
    assert.equal(resolveChildRelationCode('Anh/Chị'), '4');
    assert.equal(resolveChildRelationCode('Anh trai'), '4');
    assert.equal(resolveChildRelationCode('Chị gái'), '4');

    // 5: Họ hàng
    assert.equal(resolveChildRelationCode('Họ hàng'), '5');
    assert.equal(resolveChildRelationCode('Bác'), '5');
    assert.equal(resolveChildRelationCode('Chú'), '5');
    assert.equal(resolveChildRelationCode('Cô'), '5');
    assert.equal(resolveChildRelationCode('Dì'), '5');
    assert.equal(resolveChildRelationCode('Cậu'), '5');
    assert.equal(resolveChildRelationCode('Mợ'), '5');

    // 9: Khác / Người giám hộ
    assert.equal(resolveChildRelationCode('Khác'), '9');
    assert.equal(resolveChildRelationCode('Người giám hộ'), '9');
    assert.equal(resolveChildRelationCode('Bố nuôi'), '1'); // contains Bố
    assert.equal(resolveChildRelationCode('Người nhà khác'), '9');

    // Đã là mã số chuẩn
    assert.equal(resolveChildRelationCode('1'), '1');
    assert.equal(resolveChildRelationCode('2'), '2');
    assert.equal(resolveChildRelationCode('3'), '3');
    assert.equal(resolveChildRelationCode('4'), '4');
    assert.equal(resolveChildRelationCode('5'), '5');
    assert.equal(resolveChildRelationCode('9'), '9');

    // Trường hợp rỗng / không chọn
    assert.equal(resolveChildRelationCode(''), '');
    assert.equal(resolveChildRelationCode('0'), '');
    assert.equal(resolveChildRelationCode(null), '');
    assert.equal(resolveChildRelationCode(undefined), '');
});

test('2. generateXmlPayload for Child Under 6 serializes MOI_QUAN_HE_VOI_TRE as numeric code (2 for Mẹ)', () => {
    const master = {
        patientName: 'BÉ NGUYỄN VĂN AN',
        dob: '2024-05-10', // Trẻ dưới 6 tuổi
        gender: 'Nam',
        cccd: '',
        docNo: 'TEST-CHILD-REL-01'
    };

    const clinical = {
        extra: {
            ho_ten_nguoi_di_cung: 'Lưu Thị Hoa',
            so_cccd_nguoi_di_cung: '034192004890',
            moi_quan_he_voi_tre: 'Mẹ', // Người dùng chọn "Mẹ"
            dien_thoai_nguoi_di_cung: '0836839292'
        }
    };

    const xml = generateXmlPayload('1', master, clinical, {}, { conclusion: 'Bình thường' });

    // Kiểm tra thẻ MOI_QUAN_HE_VOI_TRE
    assert.ok(xml.includes('<MOI_QUAN_HE_VOI_TRE>2</MOI_QUAN_HE_VOI_TRE>'), 'XML phải sinh ra mã 2 cho Mẹ');
    assert.ok(!xml.includes('<MOI_QUAN_HE_VOI_TRE>Mẹ</MOI_QUAN_HE_VOI_TRE>'), 'XML KHÔNG được để nguyên chữ Mẹ');
});

test('3. generateXmlPayload correctly maps various relationships in XML output', () => {
    const relationships = [
        { text: 'Cha', expectedCode: '1' },
        { text: 'Bố', expectedCode: '1' },
        { text: 'Mẹ', expectedCode: '2' },
        { text: 'Ông', expectedCode: '3' },
        { text: 'Bà', expectedCode: '3' },
        { text: 'Anh/Chị', expectedCode: '4' },
        { text: 'Bác', expectedCode: '5' },
        { text: 'Họ hàng', expectedCode: '5' },
        { text: 'Người giám hộ', expectedCode: '9' },
        { text: 'Khác', expectedCode: '9' },
        { text: '2', expectedCode: '2' }
    ];

    for (const rel of relationships) {
        const master = {
            patientName: 'TEST TRẺ EM',
            dob: '2023-01-01',
            gender: 'Nữ',
            docNo: `TEST-REL-${rel.expectedCode}`
        };
        const clinical = {
            extra: {
                ho_ten_nguoi_di_cung: 'Người Đi Cùng',
                moi_quan_he_voi_tre: rel.text
            }
        };
        const xml = generateXmlPayload('1', master, clinical, {}, {});
        assert.ok(
            xml.includes(`<MOI_QUAN_HE_VOI_TRE>${rel.expectedCode}</MOI_QUAN_HE_VOI_TRE>`),
            `Quan hệ "${rel.text}" phải được mã hóa thành mã "${rel.expectedCode}" trong XML`
        );
    }
});

test('4. generateXmlPayload emits empty MOI_QUAN_HE_VOI_TRE when no relation provided', () => {
    const master = {
        patientName: 'TEST TRẺ EM',
        dob: '2023-01-01',
        gender: 'Nữ',
        docNo: 'TEST-REL-EMPTY'
    };
    const clinical = {
        extra: {
            ho_ten_nguoi_di_cung: '',
            moi_quan_he_voi_tre: ''
        }
    };
    const xml = generateXmlPayload('1', master, clinical, {}, {});
    assert.ok(
        xml.includes('<MOI_QUAN_HE_VOI_TRE></MOI_QUAN_HE_VOI_TRE>'),
        'Khi không có mối quan hệ, XML sinh thẻ rỗng'
    );
});
