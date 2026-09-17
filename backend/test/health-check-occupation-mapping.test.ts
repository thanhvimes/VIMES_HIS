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

    // 2. Kiểm tra nếu đầu vào là ss_vndesc hoặc mã nhiều chữ số -> lấy 2 ký tự đầu tiên
    assert.equal(resolveOccupationBhCode('04'), '04', 'ss_vndesc 04 giữ nguyên 2 chữ số');
    assert.equal(resolveOccupationBhCode('00'), '00', 'ss_vndesc 00 giữ nguyên 2 chữ số');
    assert.equal(resolveOccupationBhCode('17360'), '17', 'ss_vndesc 17360 lấy 2 ký tự đầu thành 17');
    assert.equal(resolveOccupationBhCode('120034'), '12', 'Mã 120034 lấy 2 ký tự đầu tiên thành 12 theo yêu cầu người dùng');
    assert.equal(resolveOccupationBhCode('10130'), '10', 'ss_vndesc 10130 lấy 2 ký tự đầu thành 10');
    assert.equal(resolveOccupationBhCode('2240'), '22', 'ss_vndesc 2240 lấy 2 ký tự đầu thành 22');
    assert.equal(resolveOccupationBhCode('100'), '17', 'ss_code 100 (Dịch vụ và tính toán) ánh xạ ra 17');

    // 3. Fallback khi rỗng hoặc null
    assert.equal(resolveOccupationBhCode(''), '00', 'Rỗng fallback về 00');
    assert.equal(resolveOccupationBhCode(null), '00', 'Null fallback về 00');
    assert.equal(resolveOccupationBhCode(undefined), '00', 'Undefined fallback về 00');

    // 4. Kiểm tra sinh XML payload chứa đúng 2 ký tự đầu của nghề nghiệp
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

    const xmlWith120034 = generateXmlPayload('3', master, { ma_nghe_nghiep: '120034' }, {}, {});
    assert.match(xmlWith120034, /<MA_NGHE_NGHIEP>12<\/MA_NGHE_NGHIEP>/, 'XML chứa mã nghề nghiệp 12 cho 120034 (2 ký tự đầu)');

    const xmlWith17360 = generateXmlPayload('3', master, { ma_nghe_nghiep: '17360' }, {}, {});
    assert.match(xmlWith17360, /<MA_NGHE_NGHIEP>17<\/MA_NGHE_NGHIEP>/, 'XML chứa mã nghề nghiệp 17 cho 17360 (2 ký tự đầu)');
});
