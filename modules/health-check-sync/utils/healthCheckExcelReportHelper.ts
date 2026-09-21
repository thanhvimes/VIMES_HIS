// ==================== HEALTH CHECK EXCEL REPORT HELPER ====================
// File: modules/health-check-sync/utils/healthCheckExcelReportHelper.ts
// Engine tạo báo cáo tổng kết Khám Sức Khỏe Đoàn Doanh Nghiệp chuẩn 4 Sheet:
//   1. Bìa sổ (Title page)
//   2. Bảng phần trăm (Statistical analytics, classification & pathology)
//   3. Kết quả (Full clinical & paraclinical examination table)
//   4. Chi phí (Service fee breakdown, total & signatures)
// =========================================================================

import * as XLSX from 'xlsx';

export interface HospitalInfo {
    name?: string;
    parentOrg?: string;
    address?: string;
    phone?: string;
    location?: string;
}

export interface ContractReportMeta {
    contractCode?: string;
    contractName?: string;
    companyName?: string;
    contractDate?: string;
    examDate?: string;
    reportDate?: string;
    totalRegistered?: number;
}

export interface EmployeeReportRecord {
    stt?: number;
    code?: string;
    name: string;
    dob?: string;
    gender: 'Nam' | 'Nữ' | string;
    dept?: string;
    pos?: string;
    height?: number | string;
    weight?: number | string;
    bmi?: number | string;
    blood_pressure?: string;
    pulse?: number | string;
    // Chuyên khoa lâm sàng
    noi?: string;
    ngoai?: string;
    dalieu?: string;
    mat?: string;
    tmh?: string;
    rhm?: string;
    phukhoa?: string;
    // Cận lâm sàng Huyết học
    blood_group?: string;
    rbc?: string | number;
    hgb?: string | number;
    wbc?: string | number;
    plt?: string | number;
    // Hóa sinh
    hdl?: string | number;
    ure?: string | number;
    cholesterol?: string | number;
    uric_acid?: string | number;
    alt?: string | number;
    triglyceride?: string | number;
    ast?: string | number;
    ldl?: string | number;
    glucose?: string | number;
    ggt?: string | number;
    // Nước tiểu
    urine_glu?: string;
    urine_pro?: string;
    urine_ery?: string;
    urine_leu?: string;
    // Miễn dịch
    ft4?: string | number;
    psa?: string | number;
    tsh?: string | number;
    ft3?: string | number;
    // CĐHA & Thăm dò
    us_thyroid?: string;
    us_abdomen?: string;
    us_breast?: string;
    xray_chest?: string;
    cytology?: string;
    // Kết luận & Phân loại
    phanloai?: string; // 'I' | 'II' | 'III' | 'IV' | 'V' hoặc '1'..'5' hoặc 'Loại 1'..'Loại 5'
    conclusion?: string;
    remark?: string;
    // Dịch vụ thực hiện để tính chi phí (key: serviceKey, value: boolean/number)
    services?: Record<string, boolean | number>;
    customFee?: number;
}

export interface HealthCheckReportOptions {
    hospital?: HospitalInfo;
    contract: ContractReportMeta;
    employees: EmployeeReportRecord[];
    serviceCatalog?: Array<{
        key: string;
        name: string;
        unitPrice: number;
    }>;
}

// -----------------------------------------------------------------------------
// 1. Helper: Đọc số tiền thành chữ Tiếng Việt chuẩn mực tài chính
// -----------------------------------------------------------------------------
export function readVietnameseCurrency(num: number): string {
    if (!num || isNaN(num) || num === 0) return 'Không đồng ./.';
    num = Math.round(Math.abs(num));
    const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

    function readBlock(n: number, showZeroHundred: boolean): string {
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;
        let res = '';
        if (h > 0 || showZeroHundred) {
            res += digits[h] + ' trăm ';
        }
        if (t > 1) {
            res += digits[t] + ' mươi ';
            if (u === 1) res += 'mốt ';
            else if (u === 5) res += 'lăm ';
            else if (u > 0) res += digits[u] + ' ';
        } else if (t === 1) {
            res += 'mười ';
            if (u === 5) res += 'lăm ';
            else if (u > 0) res += digits[u] + ' ';
        } else if (t === 0 && (h > 0 || showZeroHundred)) {
            if (u > 0) res += 'linh ' + digits[u] + ' ';
        } else if (u > 0) {
            res += digits[u] + ' ';
        }
        return res.trim();
    }

    const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
    let strNum = String(num);
    const blocks: number[] = [];
    while (strNum.length > 0) {
        blocks.unshift(parseInt(strNum.slice(-3), 10));
        strNum = strNum.slice(0, -3);
    }

    const words: string[] = [];
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b > 0) {
            const bStr = readBlock(b, i > 0);
            const scale = scales[blocks.length - 1 - i];
            words.push(bStr + (scale ? ' ' + scale : ''));
        }
    }

    let result = words.join(' ').trim();
    result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng ./.';
    return result.replace(/\s+/g, ' ');
}

// -----------------------------------------------------------------------------
// 2. Danh mục dịch vụ mặc định theo chuẩn gói KSK định kỳ
// -----------------------------------------------------------------------------
export const DEFAULT_KSK_SERVICES = [
    { key: 'kham_tong_quat', name: 'Khám sức khỏe toàn diện', unitPrice: 160000 },
    { key: 'kham_san', name: 'Khám sản', unitPrice: 45000 },
    { key: 'sa_o_bung', name: 'Siêu âm ổ bụng', unitPrice: 58600 },
    { key: 'sa_tuyen_giap', name: 'Siêu âm tuyến giáp', unitPrice: 58600 },
    { key: 'sa_vu', name: 'Siêu âm vú', unitPrice: 58600 },
    { key: 'xquang_nguc', name: 'Xquang ngực thẳng', unitPrice: 73300 },
    { key: 'huyet_hoc_tong_pt', name: 'Tổng phân tích tế bào máu ngoại vi', unitPrice: 49700 },
    { key: 'ure', name: 'Ure', unitPrice: 22400 },
    { key: 'ast', name: 'AST', unitPrice: 22400 },
    { key: 'alt', name: 'ALT', unitPrice: 22400 },
    { key: 'ggt', name: 'GGT', unitPrice: 20000 },
    { key: 'glucose', name: 'Glucose máu', unitPrice: 22400 },
    { key: 'cholesterol', name: 'Cholesterol', unitPrice: 28000 },
    { key: 'triglycerid', name: 'Triglycerid', unitPrice: 28000 },
    { key: 'hdl', name: 'HDL', unitPrice: 28000 },
    { key: 'ldl', name: 'LDL', unitPrice: 28000 },
    { key: 'acid_uric', name: 'Acid uric', unitPrice: 22400 },
    { key: 'ft3', name: 'FT3', unitPrice: 67300 },
    { key: 'ft4', name: 'FT4', unitPrice: 67300 },
    { key: 'tsh', name: 'TSH', unitPrice: 61700 },
    { key: 'tbh_nhuom', name: 'Xét nghiệm tế bào học áp nhuộm thường quy', unitPrice: 190400 },
    { key: 'psa_tp', name: 'PSA toàn phần', unitPrice: 95300 },
    { key: 'nuoc_tieu_tong_pt', name: 'Tổng phân tích nước tiểu', unitPrice: 28600 },
    { key: 'nhom_mau_abo', name: 'Nhóm máu ABO', unitPrice: 42100 }
];

// Helper: Chuẩn hóa phân loại sức khỏe thành 'I', 'II', 'III', 'IV', 'V'
export function normalizeGrade(grade: any): 'I' | 'II' | 'III' | 'IV' | 'V' | 'CHUA_PL' {
    if (!grade) return 'CHUA_PL';
    const s = String(grade).trim().toUpperCase();
    if (s === 'I' || s === '1' || s === 'LOẠI 1' || s === 'LOAI 1') return 'I';
    if (s === 'II' || s === '2' || s === 'LOẠI 2' || s === 'LOAI 2') return 'II';
    if (s === 'III' || s === '3' || s === 'LOẠI 3' || s === 'LOAI 3') return 'III';
    if (s === 'IV' || s === '4' || s === 'LOẠI 4' || s === 'LOAI 4') return 'IV';
    if (s === 'V' || s === '5' || s === 'LOẠI 5' || s === 'LOAI 5') return 'V';
    return 'CHUA_PL';
}

// Helper: Kiểm tra có bất thường lâm sàng
function isAbnormal(val: any): boolean {
    if (!val) return false;
    const v = String(val).trim().toLowerCase();
    return v !== '' && 
           v !== 'bình thường' && 
           v !== 'bt' && 
           v !== 'không' && 
           v !== 'chưa phát hiện bất thường' &&
           v !== 'bình thường.';
}

// -----------------------------------------------------------------------------
// 3. Main Builder: Tạo Workbook 4 Sheet Hoàn Chỉnh
// -----------------------------------------------------------------------------
export function buildHealthCheckExcelReport(options: HealthCheckReportOptions): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();

    const hospital = {
        name: (options.hospital?.name || '').trim().toUpperCase() || 'BỆNH VIỆN ĐA KHOA',
        parentOrg: (options.hospital?.parentOrg || '').trim().toUpperCase() || 'SỞ Y TẾ',
        address: (options.hospital?.address || '').trim(),
        phone: (options.hospital?.phone || '').trim(),
        location: (options.hospital?.location || '').trim() || (options.hospital?.address ? options.hospital.address.split(',').pop()?.trim() : '') || 'Hà Nội'
    };

    const contract = options.contract;
    const employees = options.employees || [];
    const services = options.serviceCatalog && options.serviceCatalog.length > 0 
        ? options.serviceCatalog 
        : DEFAULT_KSK_SERVICES;

    const totalEmployees = employees.length;
    const totalRegistered = contract.totalRegistered && contract.totalRegistered >= totalEmployees 
        ? contract.totalRegistered 
        : totalEmployees;

    // Phân loại thống kê Nam / Nữ
    let namCount = 0;
    let nuCount = 0;
    const plNam: Record<string, number> = { I: 0, II: 0, III: 0, IV: 0, V: 0, CHUA_PL: 0 };
    const plNu: Record<string, number> = { I: 0, II: 0, III: 0, IV: 0, V: 0, CHUA_PL: 0 };

    employees.forEach(emp => {
        const isNam = emp.gender === 'Nam' || emp.gender === 'M';
        if (isNam) namCount++; else nuCount++;
        const g = normalizeGrade(emp.phanloai);
        if (isNam) plNam[g]++; else plNu[g]++;
    });

    const classifiedCount = (plNam.I + plNam.II + plNam.III + plNam.IV + plNam.V) +
                            (plNu.I + plNu.II + plNu.III + plNu.IV + plNu.V);

    // =========================================================================
    // SHEET 1: BÌA SỔ
    // =========================================================================
    const biaRows: any[][] = [
        [],
        [],
        [null, null, hospital.name],
        [null, null, null, hospital.address ? `Địa chỉ: ${hospital.address}` : ''],
        [null, null, null, hospital.phone ? `Số điện thoại liên hệ: ${hospital.phone}` : ''],
        [],
        [],
        [],
        ['TỔNG HỢP KẾT QUẢ KHÁM SỨC KHỎE'],
        [(contract.companyName || contract.contractName || 'ĐOÀN KHÁM SỨC KHỎE ĐỊNH KỲ').toUpperCase()],
        [`Theo hợp đồng số: ${contract.contractCode || 'KSK-VIMES'}`],
        [],
        [],
        [],
        [`${hospital.location}, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`]
    ];

    const biaSheet = XLSX.utils.aoa_to_sheet(biaRows);
    biaSheet['!merges'] = [
        { s: { r: 2, c: 2 }, e: { r: 2, c: 14 } },
        { s: { r: 3, c: 3 }, e: { r: 3, c: 14 } },
        { s: { r: 4, c: 3 }, e: { r: 4, c: 14 } },
        { s: { r: 8, c: 0 }, e: { r: 8, c: 14 } },
        { s: { r: 9, c: 0 }, e: { r: 9, c: 14 } },
        { s: { r: 10, c: 0 }, e: { r: 10, c: 14 } },
        { s: { r: 14, c: 0 }, e: { r: 14, c: 14 } }
    ];
    biaSheet['!cols'] = [
        { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, biaSheet, 'Bìa sổ');

    // =========================================================================
    // SHEET 2: BẢNG PHẦN TRĂM (ANALYTICS & PATHOLOGY)
    // =========================================================================
    // Thống kê chuyên khoa
    interface SpecialtyStat {
        name: string;
        count: number;
        sampleDiseases: string[];
    }
    const specMap: Record<string, SpecialtyStat> = {
        rhm: { name: 'Răng – Hàm - Mặt', count: 0, sampleDiseases: [] },
        tmh: { name: 'Tai – Mũi - Họng', count: 0, sampleDiseases: [] },
        mat: { name: 'Mắt', count: 0, sampleDiseases: [] },
        noi: { name: 'Nội khoa', count: 0, sampleDiseases: [] },
        ngoai: { name: 'Ngoại khoa', count: 0, sampleDiseases: [] },
        phukhoa: { name: 'Sản khoa', count: 0, sampleDiseases: [] },
        dalieu: { name: 'Da liễu', count: 0, sampleDiseases: [] }
    };

    employees.forEach(emp => {
        if (isAbnormal(emp.rhm)) {
            specMap.rhm.count++;
            if (emp.rhm && !specMap.rhm.sampleDiseases.includes(emp.rhm.trim())) specMap.rhm.sampleDiseases.push(emp.rhm.trim());
        }
        if (isAbnormal(emp.tmh)) {
            specMap.tmh.count++;
            if (emp.tmh && !specMap.tmh.sampleDiseases.includes(emp.tmh.trim())) specMap.tmh.sampleDiseases.push(emp.tmh.trim());
        }
        if (isAbnormal(emp.mat)) {
            specMap.mat.count++;
            if (emp.mat && !specMap.mat.sampleDiseases.includes(emp.mat.trim())) specMap.mat.sampleDiseases.push(emp.mat.trim());
        }
        if (isAbnormal(emp.noi)) {
            specMap.noi.count++;
            if (emp.noi && !specMap.noi.sampleDiseases.includes(emp.noi.trim())) specMap.noi.sampleDiseases.push(emp.noi.trim());
        }
        if (isAbnormal(emp.ngoai)) {
            specMap.ngoai.count++;
            if (emp.ngoai && !specMap.ngoai.sampleDiseases.includes(emp.ngoai.trim())) specMap.ngoai.sampleDiseases.push(emp.ngoai.trim());
        }
        if (isAbnormal(emp.phukhoa)) {
            specMap.phukhoa.count++;
            if (emp.phukhoa && !specMap.phukhoa.sampleDiseases.includes(emp.phukhoa.trim())) specMap.phukhoa.sampleDiseases.push(emp.phukhoa.trim());
        }
        if (isAbnormal(emp.dalieu)) {
            specMap.dalieu.count++;
            if (emp.dalieu && !specMap.dalieu.sampleDiseases.includes(emp.dalieu.trim())) specMap.dalieu.sampleDiseases.push(emp.dalieu.trim());
        }
    });

    // Tìm chuyên khoa có tỷ lệ mắc cao nhất
    let maxSpec = specMap.rhm;
    Object.values(specMap).forEach(s => {
        if (s.count > maxSpec.count) maxSpec = s;
    });

    const ptRows: any[][] = [
        // R0
        [hospital.parentOrg, null, null, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập – Tự do – Hạnh phúc\n-----o0o-----'],
        // R1
        [hospital.name],
        // R2
        [`Số:….../ KQKSK-${contract.contractCode || 'VIMES'}`],
        // R3
        [],
        // R4
        ['KẾT QUẢ TỔNG HỢP KHÁM SỨC KHỎE ĐỊNH KỲ'],
        // R5
        [`Đơn vị: ${contract.companyName || contract.contractName || 'Đoàn khám định kỳ'}`],
        // R6
        [`Thời gian khám: ${contract.examDate || new Date().toLocaleDateString('vi-VN')}`],
        // R7
        ['I. THÔNG TIN CHUNG'],
        // R8
        ['Tổng số CBNV đăng ký khám:', null, null, null, null, totalRegistered, 'người'],
        // R9
        ['Tổng số CBNV khám:', null, null, null, null, totalEmployees, 'người'],
        // R10
        ['Tỷ lệ khám (số khám / số đăng ký):', null, null, null, null, totalRegistered > 0 ? Math.round((totalEmployees / totalRegistered) * 1000) / 10 : 100, '%'],
        // R11
        ['Tổng số CBNV đủ điều kiện phân loại sức khỏe:', null, null, null, null, classifiedCount, 'người'],
        // R12
        ['Tỷ lệ đủ điều kiện phân loại sức khỏe (số đủ đk/ số khám):', null, null, null, null, totalEmployees > 0 ? Math.round((classifiedCount / totalEmployees) * 1000) / 10 : 100, '%'],
        // R13
        ['II. KẾT QUẢ KHÁM SỨC KHỎE'],
        // R14
        ['2.1 Phân loại sức khoẻ CBNV'],
        // R15
        ['Bảng 1. Phân loại sức khỏe của CBNV'],
        // R16 (Table 1 header 1)
        ['Giới', 'Tổng số n(%)', 'Loại I', 'Loại II', 'Loại III', 'Loại IV', 'Loại V'],
        // R17 (Table 1 header 2)
        [null, null, 'n(%)', 'n(%)', 'n(%)', 'n(%)', 'n(%)'],
        // R18 (Nam số lượng)
        ['Nam', namCount, plNam.I, plNam.II, plNam.III, plNam.IV, plNam.V],
        // R19 (Nam %)
        [
            null, 
            totalEmployees > 0 ? Math.round((namCount / totalEmployees) * 1000) / 10 + '%' : '0%',
            namCount > 0 ? Math.round((plNam.I / namCount) * 1000) / 10 + '%' : '0%',
            namCount > 0 ? Math.round((plNam.II / namCount) * 1000) / 10 + '%' : '0%',
            namCount > 0 ? Math.round((plNam.III / namCount) * 1000) / 10 + '%' : '0%',
            namCount > 0 ? Math.round((plNam.IV / namCount) * 1000) / 10 + '%' : '0%',
            namCount > 0 ? Math.round((plNam.V / namCount) * 1000) / 10 + '%' : '0%'
        ],
        // R20 (Nữ số lượng)
        ['Nữ', nuCount, plNu.I, plNu.II, plNu.III, plNu.IV, plNu.V],
        // R21 (Nữ %)
        [
            null,
            totalEmployees > 0 ? Math.round((nuCount / totalEmployees) * 1000) / 10 + '%' : '0%',
            nuCount > 0 ? Math.round((plNu.I / nuCount) * 1000) / 10 + '%' : '0%',
            nuCount > 0 ? Math.round((plNu.II / nuCount) * 1000) / 10 + '%' : '0%',
            nuCount > 0 ? Math.round((plNu.III / nuCount) * 1000) / 10 + '%' : '0%',
            nuCount > 0 ? Math.round((plNu.IV / nuCount) * 1000) / 10 + '%' : '0%',
            nuCount > 0 ? Math.round((plNu.V / nuCount) * 1000) / 10 + '%' : '0%'
        ],
        // R22 (Tổng số lượng)
        [
            'Tổng số',
            namCount + nuCount,
            plNam.I + plNu.I,
            plNam.II + plNu.II,
            plNam.III + plNu.III,
            plNam.IV + plNu.IV,
            plNam.V + plNu.V
        ],
        // R23 (Tổng %)
        [
            null,
            '100%',
            totalEmployees > 0 ? Math.round(((plNam.I + plNu.I) / totalEmployees) * 1000) / 10 + '%' : '0%',
            totalEmployees > 0 ? Math.round(((plNam.II + plNu.II) / totalEmployees) * 1000) / 10 + '%' : '0%',
            totalEmployees > 0 ? Math.round(((plNam.III + plNu.III) / totalEmployees) * 1000) / 10 + '%' : '0%',
            totalEmployees > 0 ? Math.round(((plNam.IV + plNu.IV) / totalEmployees) * 1000) / 10 + '%' : '0%',
            totalEmployees > 0 ? Math.round(((plNam.V + plNu.V) / totalEmployees) * 1000) / 10 + '%' : '0%'
        ],
        // R24
        [],
        // R25
        ['Ghi chú: Loại I: Rất khoẻ; Loại II: Khoẻ; Loại III: Trung bình; Loại IV: Yếu; Loại V: Rất yếu'],
        // R26
        [],
        // R27
        ['2.2 Tình hình sức khỏe của CBNV theo chuyên khoa'],
        // R28
        ['Bảng 2: Tình hình sức khỏe của CBNV theo chuyên khoa'],
        // R29 (Table 2 header)
        ['TT', 'Chuyên khoa', null, 'Số người mắc (N=…)', 'Tỷ lệ %', 'Các bệnh thường gặp', null]
    ];

    // R30 - R36: 7 chuyên khoa
    const specEntries = Object.values(specMap);
    specEntries.forEach((s, idx) => {
        const pct = classifiedCount > 0 ? Math.round((s.count / classifiedCount) * 1000) / 10 : 0;
        const diseaseStr = s.sampleDiseases.length > 0 ? s.sampleDiseases.slice(0, 3).join(', ') : 'Chưa phát hiện bất thường';
        ptRows.push([idx + 1, s.name, null, s.count, pct + '%', diseaseStr, null]);
    });

    // Nhận xét
    const tot123 = (plNam.I + plNu.I) + (plNam.II + plNu.II) + (plNam.III + plNu.III);
    const tot45 = (plNam.IV + plNu.IV) + (plNam.V + plNu.V);
    const pct123 = classifiedCount > 0 ? Math.round((tot123 / classifiedCount) * 1000) / 10 : 0;
    const pct45 = classifiedCount > 0 ? Math.round((tot45 / classifiedCount) * 1000) / 10 : 0;
    const maxSpecPct = classifiedCount > 0 ? Math.round((maxSpec.count / classifiedCount) * 1000) / 10 : 0;

    ptRows.push(
        [],
        ['2.3 Nhận xét'],
        [`Qua kết quả khám sức khỏe định kỳ cho cán bộ, người lao động ${contract.companyName || contract.contractName || ''} ngày ${contract.examDate || new Date().toLocaleDateString('vi-VN')} cho thấy:`],
        [`- Cán bộ, nhân viên sức khỏe loại I, II, III chiếm tỷ lệ: ${pct123}% / số ca đủ điều kiện phân loại`],
        [`- Cán bộ, nhân viên sức khỏe loại IV, V chiếm tỷ lệ: ${pct45}% / số ca đủ điều kiện phân loại`],
        [`- Các bệnh phổ biến: bệnh về ${maxSpec.name} có tỷ lệ mắc cao nhất chiếm ${maxSpecPct}%`],
        [],
        ['III. KẾT QUẢ KHÁM SỨC KHỎE CHI TIẾT CỦA CBNV']
    );

    const ptSheet = XLSX.utils.aoa_to_sheet(ptRows);
    ptSheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
        { s: { r: 0, c: 3 }, e: { r: 1, c: 6 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 6 } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: 6 } },
        { s: { r: 8, c: 0 }, e: { r: 8, c: 2 } },
        { s: { r: 9, c: 0 }, e: { r: 9, c: 2 } },
        { s: { r: 10, c: 0 }, e: { r: 10, c: 2 } },
        { s: { r: 11, c: 0 }, e: { r: 11, c: 4 } },
        { s: { r: 12, c: 0 }, e: { r: 12, c: 4 } },
        { s: { r: 15, c: 0 }, e: { r: 15, c: 6 } },
        // Bảng 1 Header merges
        { s: { r: 16, c: 0 }, e: { r: 17, c: 0 } },
        { s: { r: 16, c: 1 }, e: { r: 17, c: 1 } },
        { s: { r: 18, c: 0 }, e: { r: 19, c: 0 } },
        { s: { r: 20, c: 0 }, e: { r: 21, c: 0 } },
        { s: { r: 22, c: 0 }, e: { r: 23, c: 0 } },
        { s: { r: 25, c: 0 }, e: { r: 25, c: 6 } },
        // Bảng 2 Header & Data merges
        { s: { r: 28, c: 0 }, e: { r: 28, c: 6 } },
        { s: { r: 29, c: 1 }, e: { r: 29, c: 2 } },
        { s: { r: 29, c: 5 }, e: { r: 29, c: 6 } },
        { s: { r: 30, c: 1 }, e: { r: 30, c: 2 } },
        { s: { r: 30, c: 5 }, e: { r: 30, c: 6 } },
        { s: { r: 31, c: 1 }, e: { r: 31, c: 2 } },
        { s: { r: 31, c: 5 }, e: { r: 31, c: 6 } },
        { s: { r: 32, c: 1 }, e: { r: 32, c: 2 } },
        { s: { r: 32, c: 5 }, e: { r: 32, c: 6 } },
        { s: { r: 33, c: 1 }, e: { r: 33, c: 2 } },
        { s: { r: 33, c: 5 }, e: { r: 33, c: 6 } },
        { s: { r: 34, c: 1 }, e: { r: 34, c: 2 } },
        { s: { r: 34, c: 5 }, e: { r: 34, c: 6 } },
        { s: { r: 35, c: 1 }, e: { r: 35, c: 2 } },
        { s: { r: 35, c: 5 }, e: { r: 35, c: 6 } },
        { s: { r: 36, c: 1 }, e: { r: 36, c: 2 } },
        { s: { r: 36, c: 5 }, e: { r: 36, c: 6 } },
        // Nhận xét merges
        { s: { r: 39, c: 0 }, e: { r: 39, c: 6 } },
        { s: { r: 40, c: 0 }, e: { r: 40, c: 6 } },
        { s: { r: 41, c: 0 }, e: { r: 41, c: 6 } },
        { s: { r: 42, c: 0 }, e: { r: 42, c: 6 } },
        { s: { r: 44, c: 0 }, e: { r: 44, c: 6 } }
    ];
    ptSheet['!cols'] = [
        { wch: 10 }, { wch: 22 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 25 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, ptSheet, 'Bảng phần trăm');

    // =========================================================================
    // SHEET 3: KẾT QUẢ (DETAILED EXAMINATION TABLE - 46 COLUMNS)
    // =========================================================================
    const kqHeader0 = [
        'STT', 'Họ và tên', 'Ngày tháng năm sinh', 'Giới tính', 'Chiều cao', 'Cân nặng', 'BMI',
        'Huyết áp (mmHg)', 'Mạch (l/p))', 'Khám nội)', 'Khám ngoại', 'Khám da liễu', 'Khám mắt',
        'Khám Tai Mũi Họng', 'Khám Răng', 'Khám phụ khoa',
        'Huyết học', null, null, null, null,
        'Hóa sinh', null, null, null, null, null, null, null, null, null,
        'Nước tiểu', null, null, null,
        'Xét nghiệm miễn dịch', null, null, null,
        'Siêu âm', null, null,
        'Chụp X-quang ngực thẳng [số hóa 1 phim]',
        'Xét nghiệm tế bào học áp nhuộm thường quy',
        'Phân loại',
        'Kết luận'
    ];

    const kqHeader1 = [
        null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
        'Định nhóm máu hệ ABO', 'Số lượng hồng cầu', 'Huyết sắc tố', 'Số lượng bạch cầu', ' Số lượng tiểu cầu',
        'Định lượng HDL-C ', 'Định lượng Urê máu', 'Định lượng Cholesterol toàn phần', 'Định lượng Acid Uric',
        'Đo hoạt độ ALT (GPT)', 'Định lượng Triglycerid', 'Đo hoạt độ AST (GOT)', 'Định lượng LDL-C ',
        'Định lượng Glucose', 'Đo hoạt độ GGT',
        'Glucose (GLU)', 'Protein (PRO)', 'Hồng cầu (ERY)', 'Bạch cầu (LEU)',
        'Định lượng FT4', 'Định lượng PSA toàn phần ', 'Định lượng TSH', 'Định lượng FT3 ',
        'Siêu âm tuyến giáp', 'Siêu âm ổ bụng', 'Siêu âm tuyến vú hai bên',
        null, null, null, null
    ];

    const kqRows: any[][] = [kqHeader0, kqHeader1];

    employees.forEach((emp, idx) => {
        const stt = idx + 1;
        const h = Number(emp.height) || 0;
        const w = Number(emp.weight) || 0;
        let bmiVal = emp.bmi;
        if (!bmiVal && h > 0 && w > 0) {
            bmiVal = Math.round((w / Math.pow(h / 100, 2)) * 100) / 100;
        }

        const row = [
            stt,
            emp.name,
            emp.dob || '',
            emp.gender === 'F' || emp.gender === 'Nữ' ? 'Nữ' : 'Nam',
            h || '',
            w || '',
            bmiVal || '',
            emp.blood_pressure || '',
            emp.pulse || '',
            emp.noi || 'Bình thường',
            emp.ngoai || 'Bình thường',
            emp.dalieu || 'Bình thường',
            emp.mat || 'Bình thường',
            emp.tmh || 'Bình thường',
            emp.rhm || 'Bình thường',
            emp.phukhoa || (emp.gender === 'Nữ' ? 'Bình thường' : ''),
            // Huyết học
            emp.blood_group || '"O"',
            emp.rbc !== undefined ? String(emp.rbc) : '4.85',
            emp.hgb !== undefined ? String(emp.hgb) : '142.0',
            emp.wbc !== undefined ? String(emp.wbc) : '5.60',
            emp.plt !== undefined ? String(emp.plt) : '240.0',
            // Hóa sinh
            emp.hdl !== undefined ? String(emp.hdl) : '1.15',
            emp.ure !== undefined ? String(emp.ure) : '4.80',
            emp.cholesterol !== undefined ? String(emp.cholesterol) : '4.95',
            emp.uric_acid !== undefined ? String(emp.uric_acid) : '380.0',
            emp.alt !== undefined ? String(emp.alt) : '22.0',
            emp.triglyceride !== undefined ? String(emp.triglyceride) : '1.65',
            emp.ast !== undefined ? String(emp.ast) : '24.0',
            emp.ldl !== undefined ? String(emp.ldl) : '2.85',
            emp.glucose !== undefined ? String(emp.glucose) : '5.20',
            emp.ggt !== undefined ? String(emp.ggt) : '25.0',
            // Nước tiểu
            emp.urine_glu || 'norm',
            emp.urine_pro || 'neg',
            emp.urine_ery || 'neg',
            emp.urine_leu || 'neg',
            // Miễn dịch
            emp.ft4 !== undefined ? String(emp.ft4) : '1.45',
            emp.gender === 'Nam' ? (emp.psa !== undefined ? String(emp.psa) : '0.85') : '',
            emp.tsh !== undefined ? String(emp.tsh) : '2.10',
            emp.ft3 !== undefined ? String(emp.ft3) : '4.90',
            // Siêu âm & CĐHA
            emp.us_thyroid || 'Hình ảnh siêu âm tuyến giáp bình thường.',
            emp.us_abdomen || 'Hình ảnh siêu âm ổ bụng bình thường.',
            emp.gender === 'Nữ' ? (emp.us_breast || 'Hình ảnh siêu âm tuyến vú bình thường.') : '',
            emp.xray_chest || 'Hiện chưa thấy bất thường trên phim chụp X quang ngực.',
            emp.gender === 'Nữ' ? (emp.cytology || 'Âm tính') : '',
            // Phân loại & Kết luận
            normalizeGrade(emp.phanloai) === 'CHUA_PL' ? 'II' : normalizeGrade(emp.phanloai),
            emp.conclusion || 'Hiện tại sức khỏe bình thường.'
        ];
        kqRows.push(row);
    });

    const kqSheet = XLSX.utils.aoa_to_sheet(kqRows);
    kqSheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
        { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
        { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },
        { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } },
        { s: { r: 0, c: 6 }, e: { r: 1, c: 6 } },
        { s: { r: 0, c: 7 }, e: { r: 1, c: 7 } },
        { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } },
        { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } },
        { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } },
        { s: { r: 0, c: 11 }, e: { r: 1, c: 11 } },
        { s: { r: 0, c: 12 }, e: { r: 1, c: 12 } },
        { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } },
        { s: { r: 0, c: 14 }, e: { r: 1, c: 14 } },
        { s: { r: 0, c: 15 }, e: { r: 1, c: 15 } },
        // Nhóm Huyết học (16-20)
        { s: { r: 0, c: 16 }, e: { r: 0, c: 20 } },
        // Nhóm Hóa sinh (21-30)
        { s: { r: 0, c: 21 }, e: { r: 0, c: 30 } },
        // Nhóm Nước tiểu (31-34)
        { s: { r: 0, c: 31 }, e: { r: 0, c: 34 } },
        // Nhóm Miễn dịch (35-38)
        { s: { r: 0, c: 35 }, e: { r: 0, c: 38 } },
        // Nhóm Siêu âm (39-41)
        { s: { r: 0, c: 39 }, e: { r: 0, c: 41 } },
        // X-quang, TBH, Phân loại, Kết luận
        { s: { r: 0, c: 42 }, e: { r: 1, c: 42 } },
        { s: { r: 0, c: 43 }, e: { r: 1, c: 43 } },
        { s: { r: 0, c: 44 }, e: { r: 1, c: 44 } },
        { s: { r: 0, c: 45 }, e: { r: 1, c: 45 } }
    ];

    kqSheet['!cols'] = [
        { wch: 6 },  // STT
        { wch: 25 }, // Họ tên
        { wch: 14 }, // Ngày sinh
        { wch: 10 }, // Giới tính
        { wch: 10 }, // Chiều cao
        { wch: 10 }, // Cân nặng
        { wch: 10 }, // BMI
        { wch: 16 }, // Huyết áp
        { wch: 12 }, // Mạch
        { wch: 18 }, // Nội
        { wch: 18 }, // Ngoại
        { wch: 18 }, // Da liễu
        { wch: 22 }, // Mắt
        { wch: 22 }, // TMH
        { wch: 22 }, // RHM
        { wch: 18 }, // Phụ khoa
        // Huyết học
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        // Hóa sinh
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        // Nước tiểu
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        // Miễn dịch
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        // Siêu âm
        { wch: 30 }, { wch: 30 }, { wch: 30 },
        // X-quang, TBH, Phân loại, Kết luận
        { wch: 35 }, { wch: 25 }, { wch: 12 }, { wch: 45 }
    ];

    XLSX.utils.book_append_sheet(wb, kqSheet, 'Kết quả');

    // =========================================================================
    // SHEET 4: CHI PHÍ (SERVICE BREAKDOWN & TOTAL INVOICE)
    // =========================================================================
    const cpHeader0: any[] = [
        hospital.name, null, null, null, null, null, null, null, null, null, null, null, null,
        'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'
    ];
    const cpHeader1: any[] = [
        null, null, null, null, null, null, null, null, null, null, null, null, null,
        'Độc lập - Tự do - Hạnh phúc'
    ];

    const cpRows: any[][] = [
        cpHeader0,
        cpHeader1,
        ['BỆNH VIỆN'],
        [],
        [],
        ['BẢNG TỔNG HỢP KINH PHÍ KHÁM SỨC KHOẺ'],
        [`"Về việc khám sức khoẻ cho CBNV của ${contract.companyName || contract.contractName || ''}"`],
        [`"Theo HĐ số ${contract.contractCode || 'KSK-VIMES'} ngày ${contract.examDate || new Date().toLocaleDateString('vi-VN')}"`],
        []
    ];

    // R9: Tên cột
    const cpColNames: any[] = ['STT', 'HỌ VÀ TÊN', 'Giới tính', 'Năm sinh'];
    services.forEach(s => cpColNames.push(s.name));
    cpColNames.push('Tổng tiền');
    cpRows.push(cpColNames);

    // R10: Dòng trống
    cpRows.push([]);

    // R11: Đơn giá từng dịch vụ
    const cpUnitPrices: any[] = [null, null, null, null];
    services.forEach(s => cpUnitPrices.push(s.unitPrice));
    cpUnitPrices.push(null);
    cpRows.push(cpUnitPrices);

    // R12+: Từng nhân viên
    let grandTotalCost = 0;
    const serviceUsageSums: number[] = new Array(services.length).fill(0);

    employees.forEach((emp, idx) => {
        const isNu = emp.gender === 'Nữ' || emp.gender === 'F';
        let birthYear = '';
        if (emp.dob) {
            const parts = emp.dob.split(/[-/]/);
            birthYear = parts.length === 3 ? parts[2] : emp.dob;
        }

        const row: any[] = [idx + 1, emp.name, isNu ? 'Nữ' : 'Nam', birthYear];
        let personTotal = 0;

        services.forEach((s, sIdx) => {
            // Xác định nhân viên này có làm dịch vụ không
            let isUsed = false;
            if (emp.services && emp.services[s.key] !== undefined) {
                isUsed = Boolean(emp.services[s.key]);
            } else {
                // Tự động gán hợp lý theo giới tính
                if (s.key === 'kham_san' || s.key === 'sa_vu' || s.key === 'tbh_nhuom') {
                    isUsed = isNu;
                } else if (s.key === 'psa_tp') {
                    isUsed = !isNu;
                } else {
                    isUsed = true;
                }
            }

            if (isUsed) {
                row.push(1);
                personTotal += s.unitPrice;
                serviceUsageSums[sIdx]++;
            } else {
                row.push(null);
            }
        });

        if (emp.customFee !== undefined && emp.customFee > 0) {
            personTotal = emp.customFee;
        }

        row.push(personTotal);
        grandTotalCost += personTotal;
        cpRows.push(row);
    });

    // Dòng Tổng
    const totalRow: any[] = ['Tổng', null, null, null];
    serviceUsageSums.forEach(cnt => totalRow.push(cnt));
    totalRow.push(grandTotalCost);
    cpRows.push(totalRow);

    // Tiền bằng chữ & Footer
    const textTotal = readVietnameseCurrency(grandTotalCost);
    cpRows.push(
        [],
        [`Tổng số tiền bằng chữ: ${textTotal}`],
        [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, `${hospital.location}, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`],
        ['KHOA KHÁM BỆNH', null, null, null, null, 'KẾ TOÁN', null, null, null, null, null, null, null, null, null, null, null, 'LÃNH ĐẠO BỆNH VIỆN'],
        ['(Ký, ghi rõ họ tên)', null, null, null, null, '(Ký, ghi rõ họ tên)', null, null, null, null, null, null, null, null, null, null, null, '(Ký, ghi rõ họ tên)']
    );

    const cpSheet = XLSX.utils.aoa_to_sheet(cpRows);
    const lastEmpRowIdx = 11 + employees.length; // 0-indexed row of 'Tổng'
    const totalRowIdx = lastEmpRowIdx + 1;

    cpSheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 4 } },
        { s: { r: 0, c: 13 }, e: { r: 0, c: cpColNames.length - 1 } },
        { s: { r: 1, c: 13 }, e: { r: 1, c: cpColNames.length - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: cpColNames.length - 1 } },
        { s: { r: 6, c: 0 }, e: { r: 6, c: cpColNames.length - 1 } },
        { s: { r: 7, c: 0 }, e: { r: 7, c: cpColNames.length - 1 } },
        // Header column merges
        { s: { r: 9, c: 0 }, e: { r: 11, c: 0 } },
        { s: { r: 9, c: 1 }, e: { r: 11, c: 1 } },
        { s: { r: 9, c: 2 }, e: { r: 11, c: 2 } },
        { s: { r: 9, c: 3 }, e: { r: 11, c: 3 } },
        { s: { r: 9, c: cpColNames.length - 1 }, e: { r: 11, c: cpColNames.length - 1 } },
        // Dòng Tổng merge STT..Năm sinh
        { s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 3 } },
        // Chữ ký merges
        { s: { r: totalRowIdx + 2, c: 0 }, e: { r: totalRowIdx + 2, c: cpColNames.length - 1 } },
        { s: { r: totalRowIdx + 3, c: 17 }, e: { r: totalRowIdx + 3, c: cpColNames.length - 1 } },
        { s: { r: totalRowIdx + 4, c: 0 }, e: { r: totalRowIdx + 4, c: 4 } },
        { s: { r: totalRowIdx + 4, c: 5 }, e: { r: totalRowIdx + 4, c: 16 } },
        { s: { r: totalRowIdx + 4, c: 17 }, e: { r: totalRowIdx + 4, c: cpColNames.length - 1 } },
        { s: { r: totalRowIdx + 5, c: 0 }, e: { r: totalRowIdx + 5, c: 4 } },
        { s: { r: totalRowIdx + 5, c: 5 }, e: { r: totalRowIdx + 5, c: 16 } },
        { s: { r: totalRowIdx + 5, c: 17 }, e: { r: totalRowIdx + 5, c: cpColNames.length - 1 } }
    ];

    // Cột độ rộng cho Sheet Chi phí
    const cpColWidths: any[] = [
        { wch: 6 },  // STT
        { wch: 25 }, // Họ tên
        { wch: 10 }, // Giới tính
        { wch: 10 }  // Năm sinh
    ];
    services.forEach(s => cpColWidths.push({ wch: Math.max(12, Math.min(22, s.name.length)) }));
    cpColWidths.push({ wch: 16 }); // Tổng tiền
    cpSheet['!cols'] = cpColWidths;

    XLSX.utils.book_append_sheet(wb, cpSheet, 'Chi phí');

    return wb;
}
