import test from 'node:test';
import assert from 'node:assert/strict';

test('Excel Header Parsing: Kiểm tra chống lệch cột với đúng tiêu đề mẫu Excel KSK', () => {
    // 36 tiêu đề chuẩn trong file mẫu mau_import_nhan_vien_ksk.xlsx
    const sampleHeaders = [
        'MA_KH', 'HO_TEN', 'GIOI_TINH', 'NGAY_SINH', 'MA_DAN_TOC',
        'MA_NGHE_NGHIEP', 'MA_DOI_TUONG_KSK', 'SO_CCCD', 'NGAYCAP_CCCD', 'NOICAP_CCCD',
        'NGUOI_GIAM_HO', 'SO_CCCD_NGH', 'DIA_CHI', 'MATINH_CU_TRU', 'MAXA_CU_TRU',
        'DIEN_THOAI', 'BOPHAN', 'CHUCVU', 'GHICHU',
        // Thể lực & sinh hiệu
        'CHIEU_CAO', 'CAN_NANG', 'HUYET_AP', 'MACH', 'NHIET_DO', 'NHIP_THO', 'THE_LUC',
        // Lâm sàng chuyên khoa
        'NOI_KHOA', 'NGOAI_KHOA', 'DA_LIEU', 'SAN_PHU_KHOA', 'MAT', 'TAI_MUI_HONG', 'RANG_HAM_MAT',
        // Phân loại & kết luận
        'PHAN_LOAI_SK', 'KET_LUAN', 'BENH_TAT_LUU_Y'
    ];

    const removeAccents = (str: string) => {
        return str.normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/đ/g, 'd')
                  .replace(/Đ/g, 'd')
                  .replace(/[_\-\s]+/g, ' ')
                  .trim()
                  .toLowerCase();
    };

    const rawHeaders = sampleHeaders.map(h => removeAccents(String(h || '')));
    const compactHeaders = rawHeaders.map(h => h.replace(/\s+/g, ''));

    const findHeaderIdx = (exactPatterns: string[], fallbackSubstrings: string[] = []) => {
        const exactIdx = compactHeaders.findIndex(h => exactPatterns.includes(h));
        if (exactIdx !== -1) return exactIdx;
        const prefixIdx = compactHeaders.findIndex(h => exactPatterns.some(p => p.length >= 4 && h.startsWith(p)));
        if (prefixIdx !== -1) return prefixIdx;
        if (fallbackSubstrings.length > 0) {
            return compactHeaders.findIndex(h => fallbackSubstrings.some(fb => fb.length >= 4 && h.includes(fb)));
        }
        return -1;
    };

    const nameIdx = findHeaderIdx(['hoten', 'ten', 'fullname', 'name', 'hovaten'], ['hovaten']);
    const phoneIdx = findHeaderIdx(['dienthoai', 'sdt', 'phone', 'telephone', 'sodienthoai', 'mobile']);
    const respIdx = findHeaderIdx(['nhiptho', 'respiration', 'breathingrate', 'resp']);
    const theLucIdx = findHeaderIdx(['theluc', 'thetrang', 'physical', 'toantrang', 'khamtheluc', 'thelucsuckhoe']);
    const noiKhoaIdx = findHeaderIdx(['noikhoa', 'khamnoikhoa', 'internal', 'noikhoatongquat', 'chuyenkhoanoikhoa'], ['noikhoa']);
    const ngoaiKhoaIdx = findHeaderIdx(['ngoaikhoa', 'khamngoaikhoa', 'surgery', 'ngoaitongquat', 'external', 'chuyenkhoangoaikhoa'], ['ngoaikhoa']);
    const daLieuIdx = findHeaderIdx(['dalieu', 'khamdalieu', 'dermatology', 'chuyenkhoadalieu'], ['dalieu']);
    const phuKhoaIdx = findHeaderIdx(['sanphukhoa', 'khamsanphukhoa', 'phukhoa', 'khamphukhoa', 'gynecology', 'obgyn'], ['phukhoa', 'sanphukhoa']);
    const matIdx = findHeaderIdx(['mat', 'khammat', 'chuyenkhoamat', 'eye', 'nhankhoa', 'khamnhankhoa', 'thiluc'], ['chuyenkhoamat', 'khammat']);
    const tmhIdx = findHeaderIdx(['taimuihong', 'khamtaimuihong', 'chuyenkhoataimuihong', 'chuyenkhoatmh', 'tmh', 'ent'], ['taimuihong']);
    const rhmIdx = findHeaderIdx(['ranghammat', 'khamranghammat', 'chuyenkhoaranghammat', 'chuyenkhoarhm', 'rhm', 'dental'], ['ranghammat']);

    // Dòng dữ liệu NV001 từ file mẫu
    const rowNV001: any[] = [
        'NV001', 'Nguyễn Văn An', 'Nam', '15/05/1990', '1',
        '1471', '14', '037095000123', '20/10/2021', 'Cục C06',
        '', '', '12 Láng Hạ, Ba Đình, Hà Nội', '01', '00001',
        '0912345678', 'Phòng Kỹ thuật', 'Lái xe / Kỹ sư', 'Khám sức khỏe định kỳ',
        170, 68, '120/80', 75, 36.5, 18, 'Thể lực tốt',
        'Tim đều, phổi trong', 'Bình thường', 'Bình thường', '', 'Mắt phải 10/10, Mắt trái 10/10',
        'Tai mũi họng bình thường', 'Không sâu răng, không viêm lợi', 'Loại 1', 'Đủ sức khỏe làm việc', ''
    ];

    // Xác nhận vị trí các cột khớp chính xác tuyệt đối
    assert.equal(compactHeaders[nameIdx], 'hoten');
    assert.equal(compactHeaders[phoneIdx], 'dienthoai');
    assert.equal(compactHeaders[noiKhoaIdx], 'noikhoa');
    assert.equal(compactHeaders[ngoaiKhoaIdx], 'ngoaikhoa');
    assert.equal(compactHeaders[daLieuIdx], 'dalieu');
    assert.equal(compactHeaders[phuKhoaIdx], 'sanphukhoa');
    assert.equal(compactHeaders[matIdx], 'mat');
    assert.equal(compactHeaders[tmhIdx], 'taimuihong');
    assert.equal(compactHeaders[rhmIdx], 'ranghammat');

    // Xác nhận giá trị lấy từ dòng dữ liệu
    assert.equal(rowNV001[phoneIdx], '0912345678');
    assert.equal(rowNV001[noiKhoaIdx], 'Tim đều, phổi trong');
    assert.notEqual(rowNV001[noiKhoaIdx], 'Cục C06'); // KHÔNG bị nhầm vào NOICAP_CCCD
    assert.equal(rowNV001[ngoaiKhoaIdx], 'Bình thường');
    assert.equal(rowNV001[daLieuIdx], 'Bình thường');
    assert.notEqual(rowNV001[daLieuIdx], '1'); // KHÔNG bị nhầm vào MA_DAN_TOC
    assert.equal(rowNV001[matIdx], 'Mắt phải 10/10, Mắt trái 10/10');
    assert.notEqual(rowNV001[matIdx], '01'); // KHÔNG bị nhầm vào MATINH_CU_TRU
    assert.equal(rowNV001[tmhIdx], 'Tai mũi họng bình thường');
    assert.notEqual(rowNV001[tmhIdx], '0912345678'); // TUYỆT ĐỐI KHÔNG BỊ GÁN SỐ ĐIỆN THOẠI VÀO TMH!
    assert.equal(rowNV001[rhmIdx], 'Không sâu răng, không viêm lợi');
    assert.equal(rowNV001[theLucIdx], 'Thể lực tốt');
    assert.equal(rowNV001[respIdx], 18);
});
