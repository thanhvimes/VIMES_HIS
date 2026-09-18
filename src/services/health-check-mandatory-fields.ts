import { getHealthCheckSettings } from '../config/health-check-settings';
import { findValue } from '../controllers/health-check/xml-generator';
import { resolveProvinceName, resolveVillageName } from './administrative-catalog.service';

export interface MandatoryFieldsValidationInput {
    master?: any;
    clinical?: any;
    lab?: any;
    conclusion?: any;
    formType?: string;
    // Flat properties if called directly from controller / client
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

export interface MandatoryFieldsValidationResult {
    valid: boolean;
    errors: string[];
    fieldErrors: Record<string, string>;
}

/**
 * Helper: Parse date flexibly supporting YYYYMMDD, DD/MM/YYYY, YYYY-MM-DD, and Date objects
 */
function parseDateFlexible(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    const s = String(val).trim();
    if (!s) return null;

    // Format YYYYMMDD (e.g. 19680810)
    if (/^\d{8}$/.test(s)) {
        const y = parseInt(s.substring(0, 4), 10);
        const m = parseInt(s.substring(4, 6), 10) - 1;
        const d = parseInt(s.substring(6, 8), 10);
        const dt = new Date(y, m, d);
        return isNaN(dt.getTime()) ? null : dt;
    }
    // Format DD/MM/YYYY (e.g. 10/08/1968)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
        const parts = s.split('/');
        const dt = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        return isNaN(dt.getTime()) ? null : dt;
    }
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Kiểm tra 17 trường bắt buộc theo Quyết định 2062/QĐ-BYT, 3176/QĐ-BYT và 1804/QĐ-BYT
 * (Chi tiết từ file đặc tả "Các trường bắt buộc.xlsx"):
 * 1. HO_TEN
 * 2. GIOI_TINH
 * 3. NGAY_SINH
 * 4. MA_DAN_TOC
 * 5. SO_CCCD
 * 8. DIA_CHI
 * 9. MATINH_CU_TRU
 * 10. MAXA_CU_TRU
 * 11. MA_NGHE_NGHIEP
 * 15. LY_DO_VV
 * 17. MA_CSKCB
 * 18. MA_GTIN_CSKCB
 * 19. DOI_TUONG
 * 20. NGUON_CHI_TRA
 * 21. MA_LOAI_KCB
 * 22. NGAY_VAO
 * 119. PHAN_LOAI_SK
 */
export function validateMandatoryPortalFields(input: MandatoryFieldsValidationInput): MandatoryFieldsValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};

    const master = input.master || {};
    const clinical = input.clinical || master.clinical_data || master.clinicalData || {};
    const lab = input.lab || master.lab_data || master.labData || {};
    const conclusion = input.conclusion || master.conclusion_data || master.conclusionData || {};
    const formType = String(input.formType || master.form_type || master.formType || '3').trim();
    const isChild = formType === '1' || formType === 'mau1-child' || formType === 'child';

    const src = { master, clinical, lab, conclusion, history: master.history_data || clinical.history || {} };
    const settings = getHealthCheckSettings();

    // 1. Họ và tên (HO_TEN)
    const hoTen = String(input.patientName || master.patientName || master.patient_name || findValue('HO_TEN', src) || '').trim();
    if (!hoTen) {
        errors.push('Họ và tên bắt buộc nhập (HO_TEN)');
        fieldErrors.patientName = 'Họ và tên bắt buộc nhập';
    } else if (hoTen !== hoTen.toUpperCase()) {
        errors.push('Họ và tên phải viết IN HOA có dấu theo hướng dẫn Quyết định 3176/QĐ-BYT');
        fieldErrors.patientName = 'Họ và tên phải viết IN HOA có dấu';
    } else if (hoTen.length > 255) {
        errors.push('Họ và tên không được vượt quá 255 ký tự');
        fieldErrors.patientName = 'Họ và tên tối đa 255 ký tự';
    }

    // 2. Giới tính (GIOI_TINH)
    const rawGender = String(input.gender ?? master.gender ?? findValue('GIOI_TINH', src) ?? '').trim();
    if (!rawGender) {
        errors.push('Giới tính bắt buộc chọn (GIOI_TINH)');
        fieldErrors.gender = 'Giới tính bắt buộc chọn';
    } else {
        const lowerG = rawGender.toLowerCase();
        if (!['1', '2', 'nam', 'nữ', 'nu', 'male', 'female', 'm', 'f'].includes(lowerG)) {
            errors.push('Giới tính không hợp lệ (1: Nam, 2: Nữ)');
            fieldErrors.gender = 'Giới tính không hợp lệ';
        }
    }

    // 3. Ngày sinh (NGAY_SINH)
    const rawDob = input.dob || master.dob || findValue('NGAY_SINH', src);
    if (!rawDob) {
        errors.push('Ngày sinh bắt buộc nhập (NGAY_SINH)');
        fieldErrors.dob = 'Ngày sinh bắt buộc nhập';
    } else {
        const d = parseDateFlexible(rawDob);
        if (!d) {
            errors.push('Ngày sinh không hợp lệ');
            fieldErrors.dob = 'Ngày sinh không hợp lệ';
        } else if (d.getTime() > Date.now()) {
            errors.push('Ngày sinh không được ở tương lai');
            fieldErrors.dob = 'Ngày sinh không được ở tương lai';
        }
    }

    // 4. Dân tộc (MA_DAN_TOC)
    const rawDanToc = String(input.ethnic || clinical.ethnic || findValue('MA_DAN_TOC', src) || '').trim();
    if (!rawDanToc) {
        errors.push('Dân tộc bắt buộc chọn (MA_DAN_TOC)');
        fieldErrors.ethnic = 'Dân tộc bắt buộc chọn';
    }

    // 5. Mã định danh / CCCD (SO_CCCD) - đúng 12 chữ số
    const rawCccd = String(input.cccd || master.cccd || findValue('SO_CCCD', src) || '').trim();
    const cleanCccd = rawCccd.replace(/\D/g, '');
    const hasNoCccdFlag = Boolean(input.noCccd ?? clinical.no_cccd);
    const rawGuardianCccd = String(input.guardianCccd || clinical.extra?.so_cccd_ngh || findValue('SO_CCCD_NGH', src) || '').trim();
    const cleanGuardianCccd = rawGuardianCccd.replace(/\D/g, '');

    if (isChild && hasNoCccdFlag) {
        if (!cleanGuardianCccd) {
            errors.push('Trẻ em chưa có CCCD bắt buộc phải nhập số CCCD người giám hộ (SO_CCCD_NGH)');
            fieldErrors.guardianCccd = 'CCCD người giám hộ bắt buộc nhập khi trẻ chưa có CCCD';
        } else if (cleanGuardianCccd.length !== 12) {
            errors.push('Số CCCD người giám hộ phải gồm đúng 12 chữ số');
            fieldErrors.guardianCccd = 'CCCD người giám hộ phải gồm 12 chữ số';
        }
    } else {
        if (!cleanCccd) {
            errors.push('Mã định danh/CCCD bắt buộc nhập (SO_CCCD)');
            fieldErrors.cccd = 'Mã định danh/CCCD bắt buộc nhập';
        } else if (cleanCccd.length !== 12) {
            errors.push('Mã định danh/CCCD phải gồm đúng 12 chữ số (SO_CCCD)');
            fieldErrors.cccd = 'CCCD phải gồm đúng 12 chữ số';
        }
    }

    // 9. Mã Tỉnh (MATINH_CU_TRU)
    const rawTinh = String(input.maTinhCuTru || clinical.matinh_cu_tru || findValue('MATINH_CU_TRU', src) || '').trim();
    if (!rawTinh) {
        errors.push('Mã Tỉnh cư trú bắt buộc chọn (MATINH_CU_TRU)');
        fieldErrors.maTinhCuTru = 'Mã Tỉnh cư trú bắt buộc chọn';
    }

    // 10. Mã Xã (MAXA_CU_TRU)
    const rawXa = String(input.maXaCuTru || clinical.maxa_cu_tru || findValue('MAXA_CU_TRU', src) || '').trim();
    if (!rawXa) {
        errors.push('Mã Xã cư trú bắt buộc chọn (MAXA_CU_TRU)');
        fieldErrors.maXaCuTru = 'Mã Xã cư trú bắt buộc chọn';
    }

    // 8. Nơi ở hiện tại (DIA_CHI)
    // Nếu ô địa chỉ chi tiết để trống nhưng người dùng đã chọn Tỉnh và Xã (hoặc có tên Xã/Tỉnh):
    // Tự động ghép [Tên Xã, Tên Tỉnh] làm nơi ở hiện tại hợp lệ
    let rawDiaChi = String(input.address || clinical.address || findValue('DIA_CHI', src) || '').trim();
    if (!rawDiaChi) {
        const wardName = clinical.ward_name || clinical.ten_xa || clinical.ward || resolveVillageName(rawXa);
        const provName = clinical.province_name || clinical.ten_tinh || clinical.province || resolveProvinceName(rawTinh);
        rawDiaChi = [wardName, provName].map(s => String(s || '').trim()).filter(Boolean).join(', ');
    }

    if (!rawDiaChi) {
        errors.push('Nơi ở hiện tại bắt buộc nhập (DIA_CHI)');
        fieldErrors.address = 'Nơi ở hiện tại bắt buộc nhập';
    } else if (rawDiaChi.length > 1024) {
        errors.push('Nơi ở hiện tại tối đa 1024 ký tự');
        fieldErrors.address = 'Địa chỉ tối đa 1024 ký tự';
    }

    // 11. Nghề nghiệp (MA_NGHE_NGHIEP)
    let rawNghe = String(input.maNgheNghiep || clinical.ma_nghe_nghiep || findValue('MA_NGHE_NGHIEP', src) || '').trim();
    if (isChild && !rawNghe) {
        rawNghe = '00';
    }
    if (!rawNghe) {
        errors.push('Nghề nghiệp bắt buộc chọn (MA_NGHE_NGHIEP)');
        fieldErrors.maNgheNghiep = 'Nghề nghiệp bắt buộc chọn';
    }

    // 15. Lý do khám sức khỏe (LY_DO_VV)
    const rawLyDo = String(input.lyDoVv || clinical.ly_do_vv || findValue('LY_DO_VV', src) || '').trim();
    if (!rawLyDo) {
        errors.push('Lý do khám sức khỏe bắt buộc nhập (LY_DO_VV)');
        fieldErrors.lyDoVv = 'Lý do khám sức khỏe bắt buộc nhập';
    }

    // 17. Mã cơ sở KCB (MA_CSKCB)
    const rawMaCskcb = String(input.maCskcb || clinical.ma_cskcb || settings?.ma_cskcb_byt || (settings?.ma_cskcb ? settings.ma_cskcb.slice(0, 5) : '') || findValue('MA_CSKCB', src) || '37101').trim();
    if (!rawMaCskcb) {
        errors.push('Mã cơ sở KCB bắt buộc nhập (MA_CSKCB)');
        fieldErrors.maCskcb = 'Mã CSKCB bắt buộc nhập';
    }

    // 18. Mã cơ sở KCB theo chuẩn GLN (MA_GTIN_CSKCB)
    const rawGtin = String(input.maGtinCskcb || clinical.ma_gtin_cskcb || settings?.ma_gtin_cskcb || settings?.ma_cskcb || findValue('MA_GTIN_CSKCB', src) || '8934285008135').trim();
    if (!rawGtin) {
        errors.push('Mã GLN/GTIN cơ sở KCB bắt buộc nhập (MA_GTIN_CSKCB)');
        fieldErrors.maGtinCskcb = 'Mã GLN cơ sở bắt buộc nhập';
    }

    // 19. Đối tượng (DOI_TUONG)
    const rawDoiTuong = String(input.targetGroup || clinical.target_group || findValue('DOI_TUONG', src) || '').trim();
    if (!rawDoiTuong) {
        errors.push('Đối tượng khám sức khỏe bắt buộc chọn theo Quyết định 2062/QĐ-BYT (DOI_TUONG)');
        fieldErrors.targetGroup = 'Đối tượng bắt buộc chọn';
    }

    // 20. Nguồn chi trả (NGUON_CHI_TRA)
    const rawNguon = String(input.fundingSource ?? clinical.funding_source ?? findValue('NGUON_CHI_TRA', src) ?? '').trim();
    if (!rawNguon) {
        errors.push('Nguồn chi trả bắt buộc chọn (NGUON_CHI_TRA)');
        fieldErrors.fundingSource = 'Nguồn chi trả bắt buộc chọn';
    } else if (!['1', '2', '3', '4', '5', '9'].includes(rawNguon)) {
        errors.push('Nguồn chi trả không hợp lệ; chỉ chấp nhận mã 1, 2, 3, 4, 5, 9');
        fieldErrors.fundingSource = 'Nguồn chi trả chỉ chấp nhận mã 1, 2, 3, 4, 5, 9';
    }

    // 21. Loại hình KCB (MA_LOAI_KCB)
    const rawLoaiHinh = String(input.loaiHinhKcb || clinical.loai_hinh_kcb || findValue('MA_LOAI_KCB', src) || '01').trim();
    if (!rawLoaiHinh) {
        errors.push('Loại hình KCB bắt buộc chọn theo Quyết định 1804/QĐ-BYT (MA_LOAI_KCB)');
        fieldErrors.loaiHinhKcb = 'Loại hình KCB bắt buộc chọn';
    }

    // 22. Ngày khám sức khỏe (NGAY_VAO)
    const rawNgayVao = input.ngayVao || clinical.ngay_vao || master.created_at || findValue('NGAY_VAO', src);
    if (!rawNgayVao) {
        errors.push('Ngày khám sức khỏe bắt buộc có (NGAY_VAO)');
        fieldErrors.ngayVao = 'Ngày khám sức khỏe bắt buộc có';
    }

    // 119. Phân loại sức khỏe (PHAN_LOAI_SK)
    if (!isChild) {
        const rawPl = String(input.fitnessClass ?? conclusion.fitness_class ?? conclusion.ket_luan_loai_suc_khoe ?? findValue('PHAN_LOAI_SK', src) ?? '').trim();
        const romanMap: Record<string, string> = {
            'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
            'LOẠI I': '1', 'LOẠI II': '2', 'LOẠI III': '3', 'LOẠI IV': '4', 'LOẠI V': '5',
            'LOAI I': '1', 'LOAI II': '2', 'LOAI III': '3', 'LOAI IV': '4', 'LOAI V': '5',
            'LOẠI 1': '1', 'LOẠI 2': '2', 'LOẠI 3': '3', 'LOẠI 4': '4', 'LOẠI 5': '5',
            'LOAI 1': '1', 'LOAI 2': '2', 'LOAI 3': '3', 'LOAI 4': '4', 'LOAI 5': '5',
        };
        const upperPl = rawPl.toUpperCase().trim();
        const cleanPl = upperPl.replace(/^LOẠI\s*|^LOAI\s*/i, '').trim();
        const mappedPl = romanMap[upperPl] || romanMap[cleanPl] || (['1', '2', '3', '4', '5'].includes(cleanPl) ? cleanPl : rawPl);

        if (!mappedPl) {
            errors.push('Phân loại sức khỏe kết luận bắt buộc chọn (PHAN_LOAI_SK)');
            fieldErrors.fitnessClass = 'Phân loại sức khỏe kết luận bắt buộc chọn';
        } else if (!['1', '2', '3', '4', '5'].includes(mappedPl)) {
            errors.push('Phân loại sức khỏe không hợp lệ; chỉ chấp nhận mã 1 đến 5 (Loại I đến V)');
            fieldErrors.fitnessClass = 'Phân loại sức khỏe chỉ chấp nhận từ 1 đến 5 (Loại I đến V)';
        }
    } else {
        // Đối với trẻ em: bắt buộc có đánh giá thể lực hoặc phân loại phát triển
        const childPl = String(conclusion.danh_gia_the_luc || conclusion.fitness_class || input.fitnessClass || input.childFitnessSummary || clinical.danh_gia_the_luc || findValue('PHAN_LOAI_SK', src) || '').trim();
        if (!childPl) {
            errors.push('Đánh giá thể lực/phát triển của trẻ bắt buộc nhập khi kết luận');
            fieldErrors.fitnessClass = 'Đánh giá thể lực của trẻ bắt buộc nhập';
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        fieldErrors
    };
}

