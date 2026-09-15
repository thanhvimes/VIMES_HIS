import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOccupationBhCode, initAdministrativeCatalog } from '../src/services/administrative-catalog.service';
import { generateXmlPayload } from '../src/controllers/health-check/xml-generator';

test('Occupation mapping from ss_code to ss_vndesc', async () => {
    await initAdministrativeCatalog();

    // 1. Kiểm tra mapping mã nội bộ HIS ss_code -> ss_vndesc chuẩn Bộ Y tế
    assert.equal(resolveOccupationBhCode('1539'), '00', 'ss_code 1539 (Không có nghề nghiệp cụ thể) -> ss_vndesc 00');
    assert.equal(resolveOccupationBhCode('1471'), '83', 'ss_code 1471 (Lái xe) -> ss_vndesc 83');
    assert.equal(resolveOccupationBhCode('990'), '22', 'ss_code 990 (Nhà chuyên môn sức khỏe) -> ss_vndesc 22');
    assert.equal(resolveOccupationBhCode('4'), '04', 'ss_code 4 (Viên chức) -> ss_vndesc 04');
    assert.equal(resolveOccupationBhCode('8'), '08', 'ss_code 8 (Hưu trí) -> ss_vndesc 08');
    assert.equal(resolveOccupationBhCode('1'), '01', 'ss_code 1 (Nông dân) -> ss_vndesc 01');
    assert.equal(resolveOccupationBhCode('814'), '01', 'ss_code 814 (Quân đội) -> ss_vndesc 01');
    assert.equal(resolveOccupationBhCode('824'), '02', 'ss_code 824 (Công an) -> ss_vndesc 02');

    // 2. Kiểm tra nếu đầu vào đã là ss_vndesc hợp lệ (không phải ss_code)
    assert.equal(resolveOccupationBhCode('04'), '04', 'ss_vndesc 04 giữ nguyên');
    assert.equal(resolveOccupationBhCode('00'), '00', 'ss_vndesc 00 giữ nguyên');
    assert.equal(resolveOccupationBhCode('17360'), '17360', 'ss_vndesc 17360 giữ nguyên');

    // 3. Fallback khi rỗng hoặc null
    assert.equal(resolveOccupationBhCode(''), '00', 'Rỗng fallback về 00');
    assert.equal(resolveOccupationBhCode(null), '00', 'Null fallback về 00');
    assert.equal(resolveOccupationBhCode(undefined), '00', 'Undefined fallback về 00');

    // 4. Kiểm tra sinh XML payload chứa đúng ss_vndesc
    const master = {
        patient_name: 'NGUYỄN VĂN A',
        cccd: '037095001234',
        dob: '1985-05-15',
        doc_no: '26001234'
    };

    const xmlWithDriver = generateXmlPayload('3', master, { ma_nghe_nghiep: '1471' }, {}, {});
    assert.match(xmlWithDriver, /<MA_NGHE_NGHIEP>83<\/MA_NGHE_NGHIEP>/, 'XML chứa mã nghề nghiệp 83 cho lái xe (ss_code 1471)');

    const xmlWithDefault = generateXmlPayload('3', master, { ma_nghe_nghiep: '1539' }, {}, {});
    assert.match(xmlWithDefault, /<MA_NGHE_NGHIEP>00<\/MA_NGHE_NGHIEP>/, 'XML chứa mã nghề nghiệp 00 cho ss_code 1539');

    const xmlWithVndesc = generateXmlPayload('3', master, { ma_nghe_nghiep: '04' }, {}, {});
    assert.match(xmlWithVndesc, /<MA_NGHE_NGHIEP>04<\/MA_NGHE_NGHIEP>/, 'XML chứa mã nghề nghiệp 04');
});
