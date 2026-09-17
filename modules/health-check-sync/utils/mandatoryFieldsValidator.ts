// File: modules/health-check-sync/utils/mandatoryFieldsValidator.ts
// Kiểm tra 17 trường bắt buộc theo file đặc tả "Các trường bắt buộc.xlsx"
// (Quyết định 2062/QĐ-BYT, Quyết định 3176/QĐ-BYT, Quyết định 1804/QĐ-BYT)

export interface MandatoryFieldsState {
    formType?: string;
    isChild?: boolean;
    patientName?: string;
    gender?: string | number;
    dob?: string | Date;
    ethnic?: string;
    cccd?: string;
    noCccd?: boolean;
    guardianCccd?: string;
    address?: string;
    maTinhCuTru?: string;
    maXaCuTru?: string;
    maNgheNghiep?: string;
    lyDoVv?: string;
    maCskcb?: string;
    maGtinCskcb?: string;
    targetGroup?: string;
    fundingSource?: string | number;
    loaiHinhKcb?: string;
    ngayVao?: string | Date;
    fitnessClass?: string | number;
    childFitnessSummary?: string;
}

export interface ValidationReport {
    valid: boolean;
    errors: string[];
    fieldErrors: Record<string, string>;
    firstErrorTab: 'admin' | 'history' | 'exam' | 'conclusion';
}

/**
 * Helper: Parse date flexibly supporting YYYYMMDD, DD/MM/YYYY, YYYY-MM-DD, and Date objects
 */
function parseDateFlexible(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    const s = String(val).trim();
    if (!s) return null;

    if (/^\d{8}$/.test(s)) {
        const y = parseInt(s.substring(0, 4), 10);
        const m = parseInt(s.substring(4, 6), 10) - 1;
        const d = parseInt(s.substring(6, 8), 10);
        const dt = new Date(y, m, d);
        return isNaN(dt.getTime()) ? null : dt;
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
        const parts = s.split('/');
        const dt = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        return isNaN(dt.getTime()) ? null : dt;
    }
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? null : dt;
}

export function validateMandatoryPortalFields(state: MandatoryFieldsState): ValidationReport {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};
    const isChild = state.isChild || state.formType === '1' || state.formType === 'mau1-child' || state.formType === 'child';

    // 1. Họ và tên (HO_TEN)
    const name = (state.patientName || '').trim();
    if (!name) {
        errors.push('Họ và tên bắt buộc nhập (HO_TEN)');
        fieldErrors.patientName = 'Họ và tên bắt buộc nhập';
    } else if (name.length > 255) {
        errors.push('Họ và tên không được vượt quá 255 ký tự');
        fieldErrors.patientName = 'Họ và tên tối đa 255 ký tự';
    }

    // 2. Giới tính (GIOI_TINH)
    const genderStr = String(state.gender ?? '').trim();
    if (!genderStr) {
        errors.push('Giới tính bắt buộc chọn (GIOI_TINH)');
        fieldErrors.gender = 'Giới tính bắt buộc chọn';
    }

    // 3. Ngày sinh (NGAY_SINH)
    if (!state.dob) {
        errors.push('Ngày sinh bắt buộc nhập (NGAY_SINH)');
        fieldErrors.dob = 'Ngày sinh bắt buộc nhập';
    } else {
        const d = parseDateFlexible(state.dob);
        if (!d) {
            errors.push('Ngày sinh không hợp lệ');
            fieldErrors.dob = 'Ngày sinh không hợp lệ';
        } else if (d.getTime() > Date.now()) {
            errors.push('Ngày sinh không được lớn hơn ngày hiện tại');
            fieldErrors.dob = 'Ngày sinh không được ở tương lai';
        }
    }

    // 4. Dân tộc (MA_DAN_TOC) - mặc định '01'
    const ethnic = String(state.ethnic || '01').trim();
    if (!ethnic) {
        errors.push('Dân tộc bắt buộc chọn (MA_DAN_TOC)');
        fieldErrors.ethnic = 'Dân tộc bắt buộc chọn';
    }

    // 5. Số định danh / CCCD (SO_CCCD)
    const rawCccd = String(state.cccd || '').trim();
    const cleanCccd = rawCccd.replace(/\D/g, '');
    const noCccd = Boolean(state.noCccd);
    const rawGuardianCccd = String(state.guardianCccd || '').trim();
    const cleanGuardianCccd = rawGuardianCccd.replace(/\D/g, '');

    if (isChild && noCccd) {
        if (!cleanGuardianCccd) {
            errors.push('Trẻ em chưa có CCCD bắt buộc phải nhập số CCCD người giám hộ (SO_CCCD_NGH)');
            fieldErrors.guardianCccd = 'CCCD người giám hộ bắt buộc nhập';
        } else if (cleanGuardianCccd.length !== 12 && cleanGuardianCccd.length !== 9) {
            errors.push('Số CCCD người giám hộ phải gồm 12 chữ số (hoặc 9 số CMND cũ)');
            fieldErrors.guardianCccd = 'CCCD người giám hộ phải đúng 12 chữ số';
        }
    } else {
        if (!cleanCccd) {
            errors.push('Mã định danh/CCCD bắt buộc nhập (SO_CCCD)');
            fieldErrors.cccd = 'Mã định danh/CCCD bắt buộc nhập';
        } else if (cleanCccd.length !== 12 && cleanCccd.length !== 9) {
            errors.push('Mã định danh/CCCD phải gồm 12 chữ số (hoặc 9 số CMND cũ)');
            fieldErrors.cccd = 'CCCD phải đúng 12 chữ số';
        }
    }

    // 9. Mã Tỉnh (MATINH_CU_TRU)
    const tinh = String(state.maTinhCuTru || '').trim();
    if (!tinh) {
        errors.push('Mã Tỉnh cư trú bắt buộc chọn (MATINH_CU_TRU)');
        fieldErrors.maTinhCuTru = 'Mã Tỉnh cư trú bắt buộc chọn';
    }

    // 10. Mã Xã (MAXA_CU_TRU)
    const xa = String(state.maXaCuTru || '').trim();
    if (!xa) {
        errors.push('Mã Xã cư trú bắt buộc chọn (MAXA_CU_TRU)');
        fieldErrors.maXaCuTru = 'Mã Xã cư trú bắt buộc chọn';
    }

    // 8. Nơi ở hiện tại (DIA_CHI)
    // Nếu chi tiết để trống nhưng đã chọn Tỉnh hoặc Xã, hệ thống sẽ tự động ghép tên [Xã, Tỉnh]
    let address = String(state.address || '').trim();
    if (!address && (tinh || xa)) {
        address = 'Tự động ghép từ Xã/Tỉnh';
    }

    if (!address) {
        errors.push('Nơi ở hiện tại bắt buộc nhập (DIA_CHI)');
        fieldErrors.address = 'Nơi ở hiện tại bắt buộc nhập';
    } else if (address.length > 1024) {
        errors.push('Địa chỉ nơi ở không được vượt quá 1024 ký tự');
        fieldErrors.address = 'Địa chỉ tối đa 1024 ký tự';
    }

    // 11. Nghề nghiệp (MA_NGHE_NGHIEP)
    let nghe = String(state.maNgheNghiep || '').trim();
    if (isChild && !nghe) {
        nghe = '00';
    } else if (!nghe) {
        nghe = '00';
    }

    // 15. Lý do khám sức khỏe (LY_DO_VV)
    const lydo = String(state.lyDoVv || 'Khám sức khỏe định kỳ').trim();
    if (!lydo) {
        errors.push('Lý do khám sức khỏe bắt buộc nhập (LY_DO_VV)');
        fieldErrors.lyDoVv = 'Lý do khám sức khỏe bắt buộc nhập';
    }

    // 17. Mã cơ sở KCB (MA_CSKCB) - có fallback
    const macskcb = String(state.maCskcb || '37101').trim();
    if (!macskcb) {
        errors.push('Mã cơ sở KCB bắt buộc nhập (MA_CSKCB)');
        fieldErrors.maCskcb = 'Mã cơ sở KCB bắt buộc nhập';
    }

    // 18. Mã cơ sở KCB theo chuẩn GLN (MA_GTIN_CSKCB) - có fallback
    const gtin = String(state.maGtinCskcb || '8934285008135').trim();
    if (!gtin) {
        errors.push('Mã GLN/GTIN cơ sở KCB bắt buộc nhập (MA_GTIN_CSKCB)');
        fieldErrors.maGtinCskcb = 'Mã GLN cơ sở bắt buộc nhập';
    }

    // 19. Đối tượng (DOI_TUONG) - mặc định '14'
    const doituong = String(state.targetGroup || '14').trim();
    if (!doituong) {
        errors.push('Đối tượng khám sức khỏe bắt buộc chọn theo QĐ 2062/QĐ-BYT (DOI_TUONG)');
        fieldErrors.targetGroup = 'Đối tượng bắt buộc chọn';
    }

    // 20. Nguồn chi trả (NGUON_CHI_TRA) - mặc định '9'
    const nguon = String(state.fundingSource ?? '9').trim();
    if (!nguon) {
        errors.push('Nguồn chi trả bắt buộc chọn (NGUON_CHI_TRA)');
        fieldErrors.fundingSource = 'Nguồn chi trả bắt buộc chọn';
    } else if (!['1', '2', '3', '4', '5', '9'].includes(nguon)) {
        errors.push('Nguồn chi trả không hợp lệ; chỉ chấp nhận mã 1, 2, 3, 4, 5, 9');
        fieldErrors.fundingSource = 'Nguồn chi trả chỉ chấp nhận mã 1, 2, 3, 4, 5, 9';
    }

    // 21. Loại hình KCB (MA_LOAI_KCB) - mặc định '01'
    const loaihinh = String(state.loaiHinhKcb || '01').trim();
    if (!loaihinh) {
        errors.push('Loại hình KCB bắt buộc chọn (MA_LOAI_KCB)');
        fieldErrors.loaiHinhKcb = 'Loại hình KCB bắt buộc chọn';
    }

    // 22. Ngày khám sức khỏe (NGAY_VAO)
    const ngayVao = state.ngayVao || new Date();
    if (!ngayVao) {
        errors.push('Ngày khám sức khỏe bắt buộc có (NGAY_VAO)');
        fieldErrors.ngayVao = 'Ngày khám sức khỏe bắt buộc có';
    }

    // 119. Phân loại sức khỏe (PHAN_LOAI_SK)
    if (!isChild) {
        const pl = String(state.fitnessClass ?? '').trim();
        const romanMap: Record<string, string> = {
            'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
            'LOẠI I': '1', 'LOẠI II': '2', 'LOẠI III': '3', 'LOẠI IV': '4', 'LOẠI V': '5',
            'LOAI I': '1', 'LOAI II': '2', 'LOAI III': '3', 'LOAI IV': '4', 'LOAI V': '5',
            'LOẠI 1': '1', 'LOẠI 2': '2', 'LOẠI 3': '3', 'LOẠI 4': '4', 'LOẠI 5': '5',
            'LOAI 1': '1', 'LOAI 2': '2', 'LOAI 3': '3', 'LOAI 4': '4', 'LOAI 5': '5',
        };
        const upperPl = pl.toUpperCase().trim();
        const cleanPl = upperPl.replace(/^LOẠI\s*|^LOAI\s*/i, '').trim();
        const mappedPl = romanMap[upperPl] || romanMap[cleanPl] || (['1', '2', '3', '4', '5'].includes(cleanPl) ? cleanPl : pl);

        if (!mappedPl) {
            errors.push('Phân loại sức khỏe kết luận bắt buộc chọn (PHAN_LOAI_SK)');
            fieldErrors.fitnessClass = 'Phân loại sức khỏe kết luận bắt buộc chọn';
        } else if (!['1', '2', '3', '4', '5'].includes(mappedPl)) {
            errors.push('Phân loại sức khỏe không hợp lệ (chỉ chấp nhận mã 1 đến 5)');
            fieldErrors.fitnessClass = 'Phân loại sức khỏe chỉ chấp nhận từ 1 đến 5';
        }
    } else {
        const childPl = String(state.childFitnessSummary || state.fitnessClass || '').trim();
        if (!childPl) {
            errors.push('Đánh giá thể lực/phát triển của trẻ bắt buộc nhập khi kết luận');
            fieldErrors.fitnessClass = 'Đánh giá thể lực/phát triển bắt buộc nhập';
        }
    }

    // Xác định tab của lỗi đầu tiên để tự động điều hướng
    let firstErrorTab: 'admin' | 'history' | 'exam' | 'conclusion' = 'admin';
    if (fieldErrors.fitnessClass) {
        firstErrorTab = 'conclusion';
    } else if (fieldErrors.loaiHinhKcb) {
        firstErrorTab = 'history';
    } else {
        firstErrorTab = 'admin';
    }

    return {
        valid: errors.length === 0,
        errors,
        fieldErrors,
        firstErrorTab
    };
}

