import React from 'react';
import { VIMES_LOGO_BASE64 } from '../../../config/vimesLogoBase64';

interface PrintFormMau3Props {
    resolvedLocation?: { province?: string; ward?: string };
    document: any;
    hospitalName: string;
    logoUrl?: string;
    getReportDate: () => { day: number; month: number; year: number };
    getConclusionDoctorName: () => string;
    doctors: any[];
    icd10Names: Record<string, string>;
    COMMON_ICD10: { code: string; name: string }[];
    maCskcb?: string;
    doctorSignatures?: Record<string, string>;
}

export const PrintFormMau3: React.FC<PrintFormMau3Props> = ({
    document,
    hospitalName,
    logoUrl,
    getReportDate,
    getConclusionDoctorName,
    doctors,
    icd10Names,
    COMMON_ICD10,
    maCskcb,
    doctorSignatures,
    resolvedLocation
}) => {
    const rawClinical = document.clinical_data || document.clinicalData || {};
    const clinicalExam = rawClinical.clinical_exam || rawClinical.clinicalExam || {};
    const examination = rawClinical.examination || {};
    const extra = rawClinical.extra || {};
    const clinical = { ...examination, ...rawClinical, ...clinicalExam };
    const lab = document.lab_data || document.labData || {};
    const conclusion = document.conclusion_data || document.conclusionData || {};

    const formatPl = (plValue: any) => {
        if (!plValue) return '';
        const plStr = String(plValue).trim();
        if (plStr === '1') return 'Loại I';
        if (plStr === '2') return 'Loại II';
        if (plStr === '3') return 'Loại III';
        if (plStr === '4') return 'Loại IV';
        if (plStr === '5') return 'Loại V';
        return plStr.startsWith('Loại') ? plStr : `Loại ${plStr}`;
    };

    const normalizeSignatureKey = (value: any) => String(value || '')
        .trim()
        .toUpperCase()
        .replace(/^HMS_/, '')
        .replace(/\.JPE?G\.?$/, '');

    // Sắc giác
    const rawSacGiac = String(clinical.sac_giac || '').trim();
    const hasSacGiac = rawSacGiac !== '';
    const isSacGiacBt = rawSacGiac === '1' || rawSacGiac === '0' || rawSacGiac === 'Bình thường';
    const isMuMauToanBo = rawSacGiac === '2';
    const isMuMauDo = rawSacGiac === '3';
    const isMuMauXanh = rawSacGiac === '4';
    const isMuMauVang = rawSacGiac === '5';

    // Thị trường
    const rawTtNgang = String(clinical.thi_truong_ngang_hai_mat || '').toLowerCase();
    const hasTtNgang = rawTtNgang !== '';
    const isTtNgangBt = rawTtNgang === '1' || rawTtNgang === 'bình thường' || !rawTtNgang.includes('hạn chế');

    const rawTtDung = String(clinical.thi_truong_dung_hai_mat || '').toLowerCase();
    const hasTtDung = rawTtDung !== '';
    const isTtDungBt = rawTtDung === '1' || rawTtDung === 'bình thường' || !rawTtDung.includes('hạn chế');

    // Huyết áp đa nguồn
    const bpValue = String(
        clinical.blood_pressure ||
        clinical.huyet_ap ||
        clinical.bp ||
        examination.blood_pressure ||
        examination.bp ||
        extra.huyet_ap ||
        extra.bp ||
        rawClinical.blood_pressure ||
        ''
    ).trim();

    const hasSpecialtyExamined = (specKey: string) => {
        const keyMap: Record<string, string[]> = {
            tuan_hoan: ['circulatory', 'tuan_hoan', 'internal'],
            circulatory: ['circulatory', 'tuan_hoan', 'internal'],
            ho_hap: ['respiratory', 'ho_hap', 'internal'],
            respiratory: ['respiratory', 'ho_hap', 'internal'],
            tieu_hoa: ['digestive', 'tieu_hoa', 'internal'],
            digestive: ['digestive', 'tieu_hoa', 'internal'],
            than_tiet_nieu: ['urinary', 'than_tiet_nieu', 'internal'],
            urinary: ['urinary', 'than_tiet_nieu', 'internal'],
            noi_tiet: ['endocrine', 'noi_tiet', 'internal'],
            endocrine: ['endocrine', 'noi_tiet', 'internal'],
            co_xuong_khop: ['musculoskeletal', 'co_xuong_khop', 'internal'],
            musculoskeletal: ['musculoskeletal', 'co_xuong_khop', 'internal'],
            than_kinh: ['neurology', 'than_kinh', 'internal'],
            neurology: ['neurology', 'than_kinh', 'internal'],
            tam_than: ['psychiatry', 'tam_than', 'internal'],
            psychiatry: ['psychiatry', 'tam_than', 'internal'],
            surgery: ['surgery', 'ngoai_khoa'],
            ngoai_khoa: ['surgery', 'ngoai_khoa'],
            gynecology: ['gynecology', 'san_phu_khoa'],
            san_phu_khoa: ['gynecology', 'san_phu_khoa'],
            eye: ['eye', 'mat'],
            mat: ['eye', 'mat'],
            ent: ['ent', 'tai_mui_hong'],
            tai_mui_hong: ['ent', 'tai_mui_hong'],
            dental: ['dental', 'rang_ham_mat'],
            rang_ham_mat: ['dental', 'rang_ham_mat'],
            dermatology: ['dermatology', 'da_lieu'],
            da_lieu: ['dermatology', 'da_lieu']
        };

        const keysToCheck = keyMap[specKey] || [specKey];
        for (const k of keysToCheck) {
            const metadata = clinical.specialty_metadata?.[k] || (clinical.clinical_exam && clinical.clinical_exam.specialty_metadata?.[k]);
            if (metadata && (metadata.status === 'ĐÃ_KHÁM' || metadata.status === 'ĐÃ_DUYỆT') && (metadata.doctorId || metadata.doctorName)) {
                return true;
            }
        }

        if (specKey === 'tam_than' || specKey === 'psychiatry') {
            return !!(clinical.noi_khoa_tam_than || clinical.tam_than || clinical.kq_tam_than || clinical.noi_khoa_tam_than_pl);
        }
        if (specKey === 'than_kinh' || specKey === 'neurology') {
            return !!(clinical.noi_khoa_than_kinh || clinical.than_kinh || clinical.kq_than_kinh || clinical.noi_khoa_than_kinh_pl);
        }
        if (specKey === 'eye' || specKey === 'mat') {
            return !!(clinical.khong_kinh_mat_phai || clinical.khong_kinh_mat_trai || clinical.co_kinh_mat_phai || clinical.co_kinh_mat_trai || clinical.kham_mat || clinical.benh_khac_mat || (hasTtNgang && !isTtNgangBt) || (hasSacGiac && !isSacGiacBt) || clinical.kham_mat_pl);
        }
        if (specKey === 'ent' || specKey === 'tai_mui_hong') {
            return !!(clinical.tai_trai_noi_thuong || clinical.tai_trai_noi_tham || clinical.tai_phai_noi_thuong || clinical.tai_phai_noi_tham || clinical.kham_tai_mui_hong || clinical.benh_khac_tai_mui_hong || clinical.kham_tai_mui_hong_pl);
        }
        if (specKey === 'dental' || specKey === 'rang_ham_mat') {
            return !!(clinical.ham_tren || clinical.ham_duoi || clinical.kham_rang_ham_mat || clinical.benh_rang_ham_mat || clinical.benh_khac_rang_ham_mat || clinical.kham_rang_ham_mat_pl);
        }
        if (specKey === 'tuan_hoan' || specKey === 'circulatory') {
            return !!(clinical.noi_khoa_tuan_hoan || clinical.tim_mach || clinical.kq_tim_mach || clinical.noi_khoa_tuan_hoan_pl);
        }
        if (specKey === 'ho_hap' || specKey === 'respiratory') {
            return !!(clinical.noi_khoa_ho_hap || clinical.kq_lam_sang_ho_hap || clinical.ho_hap || clinical.noi_khoa_ho_hap_pl);
        }
        if (specKey === 'tieu_hoa' || specKey === 'digestive') {
            return !!(clinical.noi_khoa_tieu_hoa || clinical.kq_tieu_hoa || clinical.noi_khoa_tieu_hoa_pl);
        }
        if (specKey === 'than_tiet_nieu' || specKey === 'urinary') {
            return !!(clinical.noi_khoa_than_tn_sd || clinical.tiet_nieu_sinh_duc || clinical.kq_tiet_nieu || clinical.noi_khoa_than_tietnieu_pl);
        }
        if (specKey === 'noi_tiet' || specKey === 'endocrine') {
            return !!(clinical.noi_khoa_noi_tiet || clinical.kq_noi_tiet || clinical.kq_noi_tiet_chuyen_hoa || clinical.noi_khoa_noi_tiet_pl);
        }
        if (specKey === 'co_xuong_khop' || specKey === 'musculoskeletal') {
            return !!(clinical.noi_khoa_co_xuong_khop || clinical.kq_co_xuong_khop || clinical.kq_co_xuong_khop_m5 || clinical.noi_khoa_co_xuong_khop_pl);
        }
        if (specKey === 'surgery' || specKey === 'ngoai_khoa') {
            return !!(clinical.external || clinical.kq_ngoai_khoa || clinical.kham_ngoai_khoa || clinical.kham_ngoai_khoa_pl);
        }
        if (specKey === 'gynecology' || specKey === 'san_phu_khoa') {
            return !!(clinical.gynecology || clinical.kham_san_phu_khoa || clinical.kham_san_phu_khoa_pl);
        }
        if (specKey === 'dermatology' || specKey === 'da_lieu') {
            return !!(clinical.dermatology || clinical.kq_da_lieu || clinical.kham_da_lieu || clinical.kham_da_lieu_pl);
        }
        return false;
    };

    const resolveSpecialtyDoctorName = (specKey: string) => {
        const metaKeyMap: Record<string, string[]> = {
            tam_than: ['psychiatry', 'tam_than', 'internal'],
            psychiatry: ['psychiatry', 'tam_than', 'internal'],
            than_kinh: ['neurology', 'than_kinh', 'internal'],
            neurology: ['neurology', 'than_kinh', 'internal'],
            tuan_hoan: ['circulatory', 'tuan_hoan', 'internal'],
            circulatory: ['circulatory', 'tuan_hoan', 'internal'],
            ho_hap: ['respiratory', 'ho_hap', 'internal'],
            respiratory: ['respiratory', 'ho_hap', 'internal'],
            tieu_hoa: ['digestive', 'tieu_hoa', 'internal'],
            digestive: ['digestive', 'tieu_hoa', 'internal'],
            than_tiet_nieu: ['urinary', 'than_tiet_nieu', 'internal'],
            urinary: ['urinary', 'than_tiet_nieu', 'internal'],
            noi_tiet: ['endocrine', 'noi_tiet', 'internal'],
            endocrine: ['endocrine', 'noi_tiet', 'internal'],
            co_xuong_khop: ['musculoskeletal', 'co_xuong_khop', 'internal'],
            musculoskeletal: ['musculoskeletal', 'co_xuong_khop', 'internal'],
            eye: ['eye', 'mat'],
            mat: ['eye', 'mat'],
            ent: ['ent', 'tai_mui_hong'],
            tai_mui_hong: ['ent', 'tai_mui_hong'],
            surgery: ['surgery', 'ngoai_khoa'],
            ngoai_khoa: ['surgery', 'ngoai_khoa'],
            dental: ['dental', 'rang_ham_mat'],
            rang_ham_mat: ['dental', 'rang_ham_mat'],
            dermatology: ['dermatology', 'da_lieu'],
            da_lieu: ['dermatology', 'da_lieu'],
            gynecology: ['gynecology', 'san_phu_khoa'],
            san_phu_khoa: ['gynecology', 'san_phu_khoa']
        };

        const checkKeys = metaKeyMap[specKey] || [specKey];
        for (const k of checkKeys) {
            const metadata = clinical.specialty_metadata?.[k] || (clinical.clinical_exam && clinical.clinical_exam.specialty_metadata?.[k]);
            if (metadata?.doctorName) return metadata.doctorName;
            if (metadata?.doctorId && Array.isArray(doctors)) {
                const doc = doctors.find((d: any) => String(d.id) === String(metadata.doctorId) || String(d.code) === String(metadata.doctorId) || String(d.hee_employee_id) === String(metadata.doctorId));
                if (doc) return doc.name || doc.fullname || doc.hee_fullname;
            }
        }

        const internalMeta = clinical.specialty_metadata?.internal || (clinical.clinical_exam && clinical.clinical_exam.specialty_metadata?.internal);
        if (['tam_than', 'psychiatry', 'than_kinh', 'neurology', 'tuan_hoan', 'circulatory', 'ho_hap', 'respiratory', 'tieu_hoa', 'digestive', 'than_tiet_nieu', 'urinary', 'noi_tiet', 'endocrine', 'co_xuong_khop', 'musculoskeletal'].includes(specKey)) {
            if (internalMeta?.doctorName) return internalMeta.doctorName;
            if (internalMeta?.doctorId && Array.isArray(doctors)) {
                const doc = doctors.find((d: any) => String(d.id) === String(internalMeta.doctorId) || String(d.code) === String(internalMeta.doctorId) || String(d.hee_employee_id) === String(internalMeta.doctorId));
                if (doc) return doc.name || doc.fullname || doc.hee_fullname;
            }
        }

        // Fallback conclusion doctor if examined
        if (hasSpecialtyExamined(specKey)) {
            return getConclusionDoctorName();
        }

        return '';
    };

    const resolveSpecialtyDoctorSignature = (specKey: string) => {
        const metaKeyMap: Record<string, string[]> = {
            tam_than: ['psychiatry', 'tam_than', 'internal'],
            psychiatry: ['psychiatry', 'tam_than', 'internal'],
            than_kinh: ['neurology', 'than_kinh', 'internal'],
            neurology: ['neurology', 'than_kinh', 'internal'],
            tuan_hoan: ['circulatory', 'tuan_hoan', 'internal'],
            circulatory: ['circulatory', 'tuan_hoan', 'internal'],
            ho_hap: ['respiratory', 'ho_hap', 'internal'],
            respiratory: ['respiratory', 'ho_hap', 'internal'],
            tieu_hoa: ['digestive', 'tieu_hoa', 'internal'],
            digestive: ['digestive', 'tieu_hoa', 'internal'],
            than_tiet_nieu: ['urinary', 'than_tiet_nieu', 'internal'],
            urinary: ['urinary', 'than_tiet_nieu', 'internal'],
            noi_tiet: ['endocrine', 'noi_tiet', 'internal'],
            endocrine: ['endocrine', 'noi_tiet', 'internal'],
            co_xuong_khop: ['musculoskeletal', 'co_xuong_khop', 'internal'],
            musculoskeletal: ['musculoskeletal', 'co_xuong_khop', 'internal'],
            eye: ['eye', 'mat'],
            mat: ['eye', 'mat'],
            ent: ['ent', 'tai_mui_hong'],
            tai_mui_hong: ['ent', 'tai_mui_hong'],
            surgery: ['surgery', 'ngoai_khoa'],
            ngoai_khoa: ['surgery', 'ngoai_khoa'],
            dental: ['dental', 'rang_ham_mat'],
            rang_ham_mat: ['dental', 'rang_ham_mat'],
            dermatology: ['dermatology', 'da_lieu'],
            da_lieu: ['dermatology', 'da_lieu'],
            gynecology: ['gynecology', 'san_phu_khoa'],
            san_phu_khoa: ['gynecology', 'san_phu_khoa']
        };

        const checkKeys = metaKeyMap[specKey] || [specKey];
        for (const k of checkKeys) {
            const metadata = clinical.specialty_metadata?.[k] || (clinical.clinical_exam && clinical.clinical_exam.specialty_metadata?.[k]);
            if (metadata?.signature) return metadata.signature;
        }

        const doctorName = resolveSpecialtyDoctorName(specKey);
        if (!doctorName || !doctorSignatures) return null;

        const normalizedSignatures = new Map(
            Object.entries(doctorSignatures).map(([key, value]) => [normalizeSignatureKey(key), value])
        );

        const candidates: any[] = [doctorName];
        if (Array.isArray(doctors)) {
            const foundDoc = doctors.find((d: any) => d.name === doctorName || d.fullname === doctorName || d.hee_fullname === doctorName);
            if (foundDoc) {
                candidates.push(foundDoc.code, foundDoc.username, foundDoc.id, foundDoc.hee_employee_id, foundDoc.name);
            }
        }

        for (const candidate of candidates) {
            const normalized = normalizeSignatureKey(candidate);
            if (normalized && normalizedSignatures.has(normalized)) {
                return normalizedSignatures.get(normalized) || null;
            }
        }

        return null;
    };

    const renderCheckbox = (checked: boolean, label: string) => (
        <span className="inline-flex items-center gap-1 mr-3 text-black">
            <span className="inline-block w-3.5 h-3.5 border border-black text-[10px] leading-none font-bold text-center flex items-center justify-center shrink-0" style={{ transform: 'translateY(-1px)' }}>
                {checked ? 'x' : ''}
            </span>
            <span>{label}</span>
        </span>
    );

    const renderDoctorSignCell = (specKey: string, aliasKey?: string) => {
        const isExamined = hasSpecialtyExamined(specKey) || (aliasKey ? hasSpecialtyExamined(aliasKey) : false);
        if (!isExamined) {
            return (
                <td className="border border-black p-1 text-center align-middle h-14 min-h-[50px]"></td>
            );
        }
        const primaryKey = hasSpecialtyExamined(specKey) ? specKey : (aliasKey || specKey);
        const docName = resolveSpecialtyDoctorName(primaryKey);
        const sig = resolveSpecialtyDoctorSignature(primaryKey);
        return (
            <td className="border border-black p-1 text-center align-bottom h-14 min-h-[50px]">
                <div className="h-7 flex items-center justify-center">
                    {sig ? (
                        <img src={sig} alt="Chữ ký" className="max-h-6 max-w-[90px] object-contain" />
                    ) : (
                        <div className="h-4"></div>
                    )}
                </div>
                <div className="font-bold text-[10.5px] uppercase text-black">{docName}</div>
            </td>
        );
    };

    const isNam = document.gender === 'Nam' || document.gender === '1';
    const isNu = document.gender === 'Nữ' || document.gender === '2' || document.gender === '0';
    const isSigned = document.signature_status === 'Signed' || document.signatureStatus === 'Signed';

    const dobStr = document.dob ? new Date(document.dob).toLocaleDateString('vi-VN') : '';
    const birthYear = document.dob ? new Date(document.dob).getFullYear() : 0;
    const currentYear = new Date().getFullYear();
    const age = birthYear > 0 ? currentYear - birthYear : '';

    const isDriver = document.form_type === 'driver' || document.form_type === 'mau3-driver' || Boolean(extra.is_driver);
    const licenseClass = extra.hang_lai_xe || 'B2';
    const driverExamPurpose = extra.driver_exam_purpose || 'Cấp mới';

    const tsgd = String(extra.tsgd_mac_benh || rawClinical.tsgd_mac_benh || clinical.tsgd_mac_benh || '').trim();
    const hasTsgd = tsgd === '1' || (tsgd !== '' && tsgd !== '0' && tsgd !== 'Không' && tsgd !== 'false');
    const tsgdMaBenh = String(extra.tsgd_ma_benh || rawClinical.tsgd_ma_benh || clinical.tsgd_ma_benh || '').trim();

    const historyItems = [
        { id: 1, label: '1. Bệnh hay bị thương trong 5 năm qua', val: extra.ts_benh_thuong_5_nam },
        { id: 2, label: '2. Bệnh thần kinh hoặc bị thương ở đầu', val: extra.ts_than_kinh_chan_thuong_dau },
        { id: 3, label: '3. Bệnh mắt hoặc giảm thị lực', val: extra.ts_benh_mat_giam_thi_luc },
        { id: 4, label: '4. Bệnh tai, giảm sức nghe hoặc thăng bằng', val: extra.ts_benh_tai_giam_nghe },
        { id: 5, label: '5. Bệnh ở tim hoặc nhồi máu cơ tim', val: extra.ts_benh_tim_mach },
        { id: 6, label: '6. Phẫu thuật can thiệp tim - mạch', val: extra.ts_phau_thuat_tim_mach },
        { id: 7, label: '7. Tăng huyết áp', val: extra.ts_tang_huyet_ap },
        { id: 8, label: '8. Khó thở', val: extra.ts_kho_tho },
        { id: 9, label: '9. Bệnh phổi, hen, viêm phế quản mạn', val: extra.ts_benh_phoi_hen },
        { id: 10, label: '10. Bệnh thận, lọc máu', val: extra.ts_benh_than_loc_mau },
        { id: 11, label: '11. Nghiện rượu, bia', val: extra.tsbt_nghien_ruou },
        { id: 12, label: '12. Đái tháo đường, tăng đường huyết', val: extra.ts_dai_thao_duong },
        { id: 13, label: '13. Bệnh tâm thần', val: extra.ts_benh_tam_than },
        { id: 14, label: '14. Mất ý thức, rối loạn ý thức', val: extra.ts_mat_roi_loan_y_thuc },
        { id: 15, label: '15. Ngất, chóng mặt, ngất xỉu', val: extra.ts_ngat_chong_mat },
        { id: 16, label: '16. Bệnh tiêu hóa', val: extra.ts_benh_tieu_hoa },
        { id: 17, label: '17. Rối loạn giấc ngủ, ngưng thở khi ngủ', val: extra.ts_roi_loan_giac_ngu },
        { id: 18, label: '18. Tai biến mạch máu não hoặc liệt', val: extra.ts_tai_bien_mach_mau_nao || extra.ts_tai_bien_mach_nao },
        { id: 19, label: '19. Bệnh hoặc tổn thương cột sống', val: extra.ts_benh_cot_song },
        { id: 20, label: '20. Sử dụng rượu thường xuyên, liên tục', val: extra.ts_su_dung_ruou },
        { id: 21, label: '21. Sử dụng ma túy và chất gây nghiện', val: extra.ts_su_dung_ma_tuy },
        { id: 22, label: '22. Bệnh khác (ghi rõ mã ICD-10)', val: extra.tsbt_ma_benh_khac ? 1 : 0 },
    ];

    const hasTreatingValue = !!(extra.tsbt_ma_benh || extra.benh_dang_dieu_tri || extra.ten_thuoc || extra.tsbt_ten_thuoc_lieu_luong);
    const isTreating = String(extra.ts_mac_benh) === '1' || String(extra.tsbt_dang_dieu_tri_benh) === '1' || extra.ts_mac_benh === 1 || extra.tsbt_dang_dieu_tri_benh === 1 || hasTreatingValue;
    const treatingDetails = [
        extra.tsbt_ma_benh ? `Mã bệnh (ICD-10): ${extra.tsbt_ma_benh}` : '',
        extra.benh_dang_dieu_tri || extra.ten_thuoc || extra.tsbt_ten_thuoc_lieu_luong ? `Thuốc: ${extra.benh_dang_dieu_tri || extra.ten_thuoc || extra.tsbt_ten_thuoc_lieu_luong}` : ''
    ].filter(Boolean).join('; ');

    const hasThaiSanValue = !!(extra.tsbt_ma_benh_thai_san || extra.tsbt_ten_thuoc_thai_san);
    const isThaiSan = String(extra.tsbt_thai_san) === '1' || extra.tsbt_thai_san === 1 || extra.tsbt_thai_san === true || hasThaiSanValue;

    // Phân trang động cho Cận lâm sàng & Kết luận
    const paraclinicalItems: any[] = lab.paraclinical_items || lab.paraclinicalItems || [];
    const rawValidItems = paraclinicalItems.filter((item: any) => {
        const val = String(item.value || item.conclusion || item.description || item.service_name || '').trim();
        return val !== '' && val !== 'undefined' && val !== 'null';
    });

    const allClsItems = [...rawValidItems];
    const hasBloodFields = !!(lab.blood_test?.hemoglobin || lab.blood_test?.glycemia || lab.blood_test?.glucose || lab.glycemia || lab.hemoglobin);
    const hasUrineFields = !!(lab.urine_test?.protein || lab.urine_test?.sugar || lab.protein);

    if (hasBloodFields && !allClsItems.some(x => String(x.service_name || '').toLowerCase().includes('đường') || String(x.service_name || '').toLowerCase().includes('glucose'))) {
        allClsItems.unshift({
            service_name: 'Đường máu (Glucose / Glycemia)',
            group_name: 'Sinh hóa máu',
            value: `${lab.blood_test?.glycemia || lab.glycemia || lab.blood_test?.glucose || ''} mmol/L`,
            conclusion: lab.ket_luan_duong_mau || (lab.blood_test?.glycemia || lab.glycemia || lab.blood_test?.glucose ? 'Bình thường' : '--')
        });
    }

    if (hasUrineFields && !allClsItems.some(x => String(x.service_name || '').toLowerCase().includes('protein') || String(x.service_name || '').toLowerCase().includes('nước tiểu'))) {
        allClsItems.unshift({
            service_name: 'Tổng phân tích nước tiểu (Protein nước tiểu)',
            group_name: 'Nước tiểu',
            value: `${lab.urine_test?.protein || lab.protein || ''} ${lab.urine_test?.protein || lab.protein ? 'g/L' : ''}`,
            conclusion: lab.ket_luan_nuoc_tieu || (lab.urine_test?.protein || lab.protein ? 'Bình thường' : '--')
        });
    }

    const MAX_CLS_WITH_CONCLUSION = 3;
    const MAX_CLS_PER_PAGE_ONLY = 8;

    interface ClsPageConfig {
        type: 'cls-and-conclusion' | 'cls-only' | 'conclusion-only';
        items: any[];
        startIndex: number;
    }

    const clsPages: ClsPageConfig[] = [];

    if (isDriver) {
        clsPages.push({
            type: 'cls-and-conclusion',
            items: [],
            startIndex: 0
        });
    } else if (allClsItems.length <= MAX_CLS_WITH_CONCLUSION) {
        clsPages.push({
            type: 'cls-and-conclusion',
            items: allClsItems,
            startIndex: 0
        });
    } else {
        let remaining = [...allClsItems];
        let currentIndex = 0;

        while (remaining.length > 0) {
            if (remaining.length <= MAX_CLS_WITH_CONCLUSION) {
                clsPages.push({
                    type: 'cls-and-conclusion',
                    items: remaining,
                    startIndex: currentIndex
                });
                remaining = [];
            } else {
                const batch = remaining.slice(0, MAX_CLS_PER_PAGE_ONLY);
                clsPages.push({
                    type: 'cls-only',
                    items: batch,
                    startIndex: currentIndex
                });
                currentIndex += batch.length;
                remaining = remaining.slice(MAX_CLS_PER_PAGE_ONLY);

                if (remaining.length === 0) {
                    clsPages.push({
                        type: 'conclusion-only',
                        items: [],
                        startIndex: currentIndex
                    });
                }
            }
        }
    }

    const totalPages = 2 + clsPages.length;

    const renderConclusionSection = () => (
        <>
            {/* Phần VI: Kết luận */}
            <div className="mb-4">
                <div className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-2">
                    {isDriver ? 'VI. KẾT LUẬN' : 'VI. KẾT LUẬN'}
                </div>

                <div className="p-3 border-2 border-black rounded-lg bg-slate-50/50 space-y-2">
                    {isDriver ? (
                        <div className="text-[13px]">
                            <span className="font-bold">1. Đánh giá tình trạng sức khỏe:</span>
                            <div className="mt-1 font-bold text-[13.5px]">
                                {conclusion.fitness_class === '1' || conclusion.fitness_class === 1 || conclusion.ket_luan_loai_suc_khoe === 'Loại I'
                                    ? `ĐỦ ĐIỀU KIỆN SỨC KHỎE ĐỂ LÁI XE HẠNG ${licenseClass}`
                                    : conclusion.fitness_class
                                        ? `KẾT LUẬN: LOẠI ${conclusion.fitness_class} - ${conclusion.diagnosis || ''}`
                                        : (conclusion.ket_luan_loai_suc_khoe || '--')}
                            </div>
                        </div>
                    ) : (
                        <div className="text-[13px]">
                            <span className="font-bold">1. Phân loại sức khỏe: </span>
                            <span className="font-extrabold text-[14px]">
                                {conclusion.fitness_class
                                    ? `LOẠI ${conclusion.fitness_class}`
                                    : conclusion.ket_luan_loai_suc_khoe || '--'}
                            </span>
                        </div>
                    )}

                    <div className="text-[12px]">
                        <span className="font-bold">2. Các bệnh, tật (nếu có) / Mã ICD-10: </span>
                        <span className="font-semibold font-mono">
                            {conclusion.diagnosis || conclusion.ket_luan_benh || '--'}
                        </span>
                    </div>

                    {!isDriver && (
                        <div className="text-[12px]">
                            <span className="font-bold">3. Tình trạng sức khỏe; mắc các bệnh, tật (nếu có): </span>
                            <span className="font-semibold">
                                {conclusion.cac_benh_tat_neu_co || extra.cac_benh_tat_neu_co || ''}
                            </span>
                        </div>
                    )}

                    <div className="text-[12px]">
                        <span className="font-bold">{isDriver ? '3' : '4'}. Các vấn đề sức khỏe cần lưu ý: </span>
                        <span className="font-semibold">
                            {conclusion.cac_van_de_luu_y || conclusion.ket_luan_cac_van_de_suc_khoe || ''}
                        </span>
                    </div>

                    <div className="text-[11px] italic pt-1 border-t border-black">
                        * Giấy khám sức khỏe này có giá trị sử dụng trong thời hạn 06 tháng kể từ ngày ký kết luận.
                    </div>
                </div>
            </div>

            {/* Phần Ký tên Bác sĩ & Đóng dấu */}
            <div className="pt-2">
                <div className="grid grid-cols-2 gap-4 text-center">
                    {/* Đại diện CSKCB (Đã bỏ chữ tên bệnh viện theo yêu cầu) */}
                    <div>
                        <div className="font-bold uppercase text-[12px] leading-tight">ĐẠI DIỆN CƠ SỞ KCB</div>
                        <div className="italic text-[10.5px] mb-2">(Ký, ghi rõ họ tên và đóng dấu)</div>
                        <div className="h-20 flex flex-col items-center justify-center">
                            {isSigned ? (
                                <div className="border border-black bg-slate-50 px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 text-black">
                                    <span>✓ ĐÃ KÝ SỐ ĐIỆN TỬ CSKCB</span>
                                </div>
                            ) : (
                                <div className="h-16"></div>
                            )}
                        </div>
                    </div>

                    {/* Bác sĩ kết luận */}
                    <div>
                        <div className="italic text-[11.5px]">
                            Ngày {getReportDate().day} tháng {getReportDate().month} năm {getReportDate().year}
                        </div>
                        <div className="font-bold uppercase text-[12px] mt-0.5 leading-tight">NGƯỜI KẾT LUẬN</div>
                        <div className="italic text-[10.5px] mb-2">(Ký và ghi rõ họ tên)</div>
                        
                        <div className="h-16 flex flex-col items-center justify-center"></div>

                        <div className="font-extrabold uppercase text-[12.5px] tracking-wide">
                            {getConclusionDoctorName()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div className="print-form-mau3 flex flex-col items-center gap-8 py-6 bg-slate-100 dark:bg-slate-900 print:bg-white print:p-0 print:gap-0 font-['Times_New_Roman',Times,serif]">
            {/* ========================================== TRANG 1 ========================================== */}
            <div className="a4-page bg-white text-black p-8 shadow-md print:shadow-none w-[210mm] min-h-[297mm] box-border relative flex flex-col justify-between text-[12.5px] leading-relaxed">
                <div>
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 border-b-2 border-black pb-2 mb-3">
                        <div className="col-span-6 flex items-start gap-2">
                            <img src={logoUrl || VIMES_LOGO_BASE64} alt="Logo" className="w-12 h-12 object-contain shrink-0 mt-0.5" />
                            <div>
                                <div className="font-extrabold uppercase text-[12px] leading-tight text-black">{hospitalName || 'CƠ SỞ KHÁM BỆNH, CHỮA BỆNH'}</div>
                                <div className="text-[11px] text-black">Mã CSKCB: <span className="font-bold font-mono">{maCskcb || '01001'}</span></div>
                                <div className="text-[11px] text-black">Số hồ sơ KSK: <span className="font-bold font-mono">{document.doc_no || 'KSK-001'}</span></div>
                            </div>
                        </div>
                        <div className="col-span-6 text-center text-black">
                            <div className="font-bold uppercase text-[12px] leading-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                            <div className="font-bold text-[11.5px] leading-tight">Độc lập - Tự do - Hạnh phúc</div>
                            <div className="text-[11px] mt-0.5 tracking-tighter">-----------------------</div>
                        </div>
                    </div>

                    {/* Form Title */}
                    <div className="text-center my-3 text-black">
                        <h1 className="text-[16px] font-black uppercase tracking-wide">
                            {isDriver ? 'GIẤY KHÁM SỨC KHỎE CỦA NGƯỜI LÁI XE' : 'GIẤY KHÁM SỨC KHỎE'}
                        </h1>
                        <p className="text-[11.5px] italic font-semibold">
                            {isDriver 
                                ? '(Dùng cho người học lái xe, nâng hạng hoặc đổi giấy phép lái xe)' 
                                : '(Dành cho người từ đủ 18 tuổi trở lên theo Thông tư số 32/2023/TT-BYT & QĐ 2062/QĐ-BYT)'}
                        </p>
                    </div>

                    {/* Phần I: Thông tin đối tượng */}
                    <div className="mb-4 text-black">
                        <div className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-2">
                            {isDriver ? 'I. THÔNG TIN CỦA NGƯỜI LÁI XE' : 'I. THÔNG TIN CỦA NGƯỜI ĐƯỢC KHÁM SỨC KHỎE'}
                        </div>
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-9 space-y-1">
                                <div>
                                    <span className="font-bold">1. Họ và tên (chữ in hoa): </span>
                                    <span className="font-extrabold text-[13.5px] uppercase tracking-wide">{document.patient_name || ''}</span>
                                </div>
                                <div className="flex gap-6">
                                    <div>
                                        <span className="font-bold">2. Giới tính: </span>
                                        {renderCheckbox(isNam, 'Nam')}
                                        {renderCheckbox(isNu, 'Nữ')}
                                    </div>
                                    <div>
                                        <span className="font-bold">3. Ngày sinh: </span>
                                        <span className="font-bold font-mono">{dobStr}</span>
                                        {age && <span className="ml-2 font-semibold">({age} tuổi)</span>}
                                    </div>
                                </div>
                                <div>
                                    <span className="font-bold">4. Số CCCD/Định danh/Hộ chiếu: </span>
                                    <span className="font-bold font-mono text-[13px]">{document.cccd || ''}</span>
                                    {(document.cccd_date || clinical.cccd_date || clinical.ngaycap_cccd || extra.cccd_date) && <span className="ml-3 font-semibold">Cấp ngày: {document.cccd_date || clinical.cccd_date || clinical.ngaycap_cccd || extra.cccd_date}</span>}
                                    {(document.cccd_place || clinical.cccd_place || clinical.noicap_cccd || extra.cccd_place) && <span className="ml-2 font-semibold">Nơi cấp: {document.cccd_place || clinical.cccd_place || clinical.noicap_cccd || extra.cccd_place}</span>}
                                </div>
                                <div>
                                    <span className="font-bold">5. Nơi ở hiện tại: </span>
                                    {(() => {
    const rawDetail = String(clinical.address || document.address || rawClinical.address || extra.address || document.patient_address || document.hp_dtladdr || document.hd_dtladdr || document.dia_chi || clinical.dia_chi || extra.dia_chi || document.patient?.address || document.patient?.hp_dtladdr || '').trim();
    const provName = String(clinical.province || clinical.province_name || clinical.ten_tinh || extra.ten_tinh || extra.province || resolvedLocation?.province || '').trim();
    const wardName = String(clinical.ward || clinical.ward_name || clinical.ten_xa || extra.ten_xa || extra.ward || resolvedLocation?.ward || '').trim();
    const distName = String(clinical.district || clinical.district_name || clinical.ten_huyen || extra.ten_huyen || '').trim();

    const parts = [];
    if (rawDetail) parts.push(rawDetail);
    if (wardName && !rawDetail.toLowerCase().includes(wardName.toLowerCase())) parts.push(wardName);
    if (distName && !rawDetail.toLowerCase().includes(distName.toLowerCase()) && !wardName.toLowerCase().includes(distName.toLowerCase())) parts.push(distName);
    if (provName && !rawDetail.toLowerCase().includes(provName.toLowerCase())) parts.push(provName);

    const fullAddr = parts.length > 0 ? parts.join(', ') : '';
    return <span className="font-semibold">{fullAddr}</span>;
})()}
                                </div>
                                {isDriver ? (
                                    <div className="flex gap-6">
                                        <div>
                                            <span className="font-bold">6. Đề nghị khám lái xe hạng: </span>
                                            <span className="font-extrabold text-[13px] uppercase border border-black px-1.5 py-0.2 rounded bg-slate-50">{licenseClass}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold">Mục đích khám: </span>
                                            <span className="font-semibold">{driverExamPurpose}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-6">
                                        <div>
                                            <span className="font-bold">6. Nghề nghiệp / Nơi công tác: </span>
                                            <span className="font-semibold">{document.workplace || extra.workplace || document.position || 'Tự do'}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold">Lý do khám: </span>
                                            <span className="font-semibold">{extra.ly_do_kham || 'Khám sức khỏe định kỳ'}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-6">
                                    <div>
                                        <span className="font-bold">7. Số điện thoại liên hệ: </span>
                                        <span className="font-bold font-mono">{clinical.phone || document.phone || rawClinical.phone || extra.phone || document.sdt || document.hp_tel || document.patient_phone || ''}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold">Nhóm máu: </span>
                                        <span className="font-bold">{clinical.blood_group || document.blood_group || rawClinical.blood_group || extra.nhom_mau || clinical.nhom_mau || ''}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Khung Ảnh 4x6 */}
                            <div className="col-span-3 flex flex-col items-center justify-center">
                                <div className="w-[30mm] h-[40mm] border-2 border-dashed border-black rounded flex flex-col items-center justify-center text-center p-1 bg-slate-50">
                                    <span className="text-[10.5px] font-bold text-black">Ảnh 4 x 6 cm</span>
                                    <span className="text-[8.5px] text-black italic mt-1">(Đóng dấu giáp lai hoặc ảnh điện tử)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phần II: Tiền sử bệnh */}
                    <div className="mb-2 text-black">
                        <div className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-2">
                            {isDriver ? 'II. TIỀN SỬ BỆNH CỦA NGƯỜI LÁI XE' : 'II. TIỀN SỬ BỆNH TẬT'}
                        </div>
                        
                        {/* Tiền sử gia đình */}
                        <div className="mb-2 text-[12px]">
                            <span className="font-bold">1. Tiền sử gia đình: </span>
                            <span>Có ai trong gia đình mắc bệnh: truyền nhiễm, tim mạch, đái tháo đường, lao, hen phế quản, ung thư, động kinh, rối loạn tâm thần... </span>
                            {renderCheckbox(!hasTsgd, 'Không')}
                            {renderCheckbox(hasTsgd, 'Có')}
                            {hasTsgd && tsgdMaBenh && <span className="font-bold italic ml-1">({tsgdMaBenh})</span>}
                        </div>

                        {/* Tiền sử bản thân (22 chỉ tiêu) */}
                        <div className="mb-2">
                            <span className="font-bold text-[12px] block mb-1">2. Tiền sử bản thân (Đánh giá Có/Không theo QĐ 1551 &amp; QĐ 2062/QĐ-BYT):</span>
                            <table className="w-full border-collapse border border-black text-[10.5px]">
                                <thead>
                                    <tr className="bg-slate-100 text-center font-bold text-black">
                                        <th className="border border-black p-0.5 w-6">TT</th>
                                        <th className="border border-black p-0.5 text-left">Tên bệnh, tình trạng sức khỏe</th>
                                        <th className="border border-black p-0.5 w-10">Không</th>
                                        <th className="border border-black p-0.5 w-10">Có</th>
                                        <th className="border border-black p-0.5 w-6">TT</th>
                                        <th className="border border-black p-0.5 text-left">Tên bệnh, tình trạng sức khỏe</th>
                                        <th className="border border-black p-0.5 w-10">Không</th>
                                        <th className="border border-black p-0.5 w-10">Có</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 11 }).map((_, i) => {
                                        const left = historyItems[i];
                                        const right = historyItems[i + 11];
                                        const isLeftYes = left.val === 1 || left.val === '1' || left.val === true;
                                        const isRightYes = right.val === 1 || right.val === '1' || right.val === true;

                                        return (
                                            <tr key={i}>
                                                <td className="border border-black p-0.5 text-center font-bold">{left.id}</td>
                                                <td className="border border-black p-0.5 pl-1">{left.label.replace(/^\d+\.\s*/, '')}</td>
                                                <td className="border border-black p-0.5 text-center font-bold">{!isLeftYes ? 'x' : ''}</td>
                                                <td className="border border-black p-0.5 text-center font-bold">{isLeftYes ? 'x' : ''}</td>

                                                <td className="border border-black p-0.5 text-center font-bold">{right.id}</td>
                                                <td className="border border-black p-0.5 pl-1">{right.label.replace(/^\d+\.\s*/, '')}</td>
                                                <td className="border border-black p-0.5 text-center font-bold">{!isRightYes ? 'x' : ''}</td>
                                                <td className="border border-black p-0.5 text-center font-bold">{isRightYes ? 'x' : ''}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {/* Hiển thị chi tiết mã ICD-10 của mục 22 Bệnh khác nếu có */}
                            {extra.tsbt_ma_benh_khac && (
                                <div className="mt-1 text-[11px] font-semibold text-black bg-slate-50 p-1 border border-black rounded">
                                    <span className="font-bold">• Mã bệnh khác (Mục 22 - Ghi rõ mã ICD-10): </span>
                                    <span className="font-mono font-bold">{extra.tsbt_ma_benh_khac}</span>
                                </div>
                            )}
                        </div>

                        {/* Tiền sử thai sản (đối với nữ) & Câu hỏi khác */}
                        <div className="text-[11.5px] space-y-1 mb-2">
                            {isNu && (
                                <div>
                                    <span className="font-bold">3. Tiền sử thai sản (đối với nữ): </span>
                                    {renderCheckbox(!isThaiSan, 'Không')}
                                    {renderCheckbox(isThaiSan, 'Có')}
                                    {isThaiSan && (
                                        <span className="font-semibold italic ml-2 text-black">
                                            {extra.tsbt_ma_benh_thai_san ? `Mã bệnh: ${extra.tsbt_ma_benh_thai_san}. ` : ''}
                                            {extra.tsbt_ten_thuoc_thai_san ? `Tên thuốc điều trị: ${extra.tsbt_ten_thuoc_thai_san}` : ''}
                                        </span>
                                    )}
                                </div>
                            )}
                            <div>
                                <span className="font-bold">{isNu ? '4' : '3'}. Câu hỏi khác: </span>
                                <span>Có đang điều trị bệnh gì không? </span>
                                {renderCheckbox(!isTreating, 'Không')}
                                {renderCheckbox(isTreating, 'Có')}
                                {isTreating && treatingDetails && (
                                    <span className="font-semibold italic ml-2 text-black">
                                        Bệnh &amp; Thuốc đang dùng: {treatingDetails}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chữ ký người đề nghị KSK */}
                <div className="pt-2 border-t border-black text-black">
                    <div className="text-[11.5px] italic mb-1">
                        &quot;Tôi xin cam đoan những điều khai trên đây hoàn toàn đúng với sự thật theo sự hiểu biết của tôi.&quot;
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center mt-2">
                        <div></div>
                        <div>
                            <div className="italic text-[11.5px]">
                                Ngày {getReportDate().day} tháng {getReportDate().month} năm {getReportDate().year}
                            </div>
                            <div className="font-bold uppercase text-[12px] mt-0.5">NGƯỜI ĐỀ NGHỊ KHÁM SỨC KHỎE</div>
                            <div className="italic text-[10.5px] mb-8">(Ký và ghi rõ họ tên)</div>
                            <div className="font-extrabold uppercase text-[12.5px]">{document.patient_name || ''}</div>
                        </div>
                    </div>
                    <div className="text-right text-[10px] mt-2 font-mono">Trang 1/{totalPages}</div>
                </div>
            </div>

            {/* ========================================== TRANG 2 ========================================== */}
            <div className="a4-page bg-white text-black p-8 shadow-md print:shadow-none w-[210mm] min-h-[297mm] box-border relative flex flex-col justify-between text-[12px] leading-normal">
                <div>
                    {/* Phần III: Khám thể lực */}
                    <div className="mb-3">
                        <div className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-2">
                            III. KHÁM THỂ LỰC
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-[12px] border border-black p-2 bg-slate-50 rounded">
                            <div>
                                <span className="font-bold block text-[11px]">Chiều cao:</span>
                                <span className="font-bold font-mono text-[13px]">{clinical.chieu_cao || clinical.height || ''}</span> {clinical.chieu_cao || clinical.height ? 'cm' : '--'}
                            </div>
                            <div>
                                <span className="font-bold block text-[11px]">Cân nặng:</span>
                                <span className="font-bold font-mono text-[13px]">{clinical.can_nang || clinical.weight || ''}</span> {clinical.can_nang || clinical.weight ? 'kg' : '--'}
                            </div>
                            <div>
                                <span className="font-bold block text-[11px]">Chỉ số BMI:</span>
                                <span className="font-bold font-mono text-[13px]">{clinical.chi_so_bmi || clinical.bmi || ''}</span> {!clinical.chi_so_bmi && !clinical.bmi && '--'}
                            </div>
                            <div>
                                <span className="font-bold block text-[11px]">Mạch:</span>
                                <span className="font-bold font-mono text-[13px]">{clinical.mach || clinical.pulse || ''}</span> {clinical.mach || clinical.pulse ? 'lần/phút' : '--'}
                            </div>
                            <div>
                                <span className="font-bold block text-[11px]">Huyết áp:</span>
                                <span className="font-bold font-mono text-[13px]">{bpValue}</span> {bpValue ? 'mmHg' : '--'}
                            </div>
                        </div>
                    </div>

                    {/* Phần IV: Khám lâm sàng chuyên khoa */}
                    <div className="mb-2">
                        <div className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-2">
                            IV. KHÁM LÂM SÀNG CHUYÊN KHOA
                        </div>

                        {isDriver ? (
                            <table className="w-full border-collapse border border-black text-[11px]">
                                <thead>
                                    <tr className="bg-slate-100 text-center font-bold">
                                        <th className="border border-black p-1 w-[26%] text-left">Chuyên khoa khám</th>
                                        <th className="border border-black p-1 text-left">Nội dung khám &amp; Kết quả</th>
                                        <th className="border border-black p-1 w-[22%]">Họ tên, chữ ký Bác sĩ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* 1. Tâm thần */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">1. Tâm thần</td>
                                        <td className="border border-black p-1 align-top">
                                            <div>{clinical.noi_khoa_tam_than || clinical.tam_than || (hasSpecialtyExamined('tam_than') ? 'Bình thường' : '')}</div>
                                        </td>
                                        {renderDoctorSignCell('tam_than', 'psychiatry')}
                                    </tr>

                                    {/* 2. Thần kinh */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">2. Thần kinh</td>
                                        <td className="border border-black p-1 align-top">
                                            <div>{clinical.noi_khoa_than_kinh || clinical.than_kinh || (hasSpecialtyExamined('than_kinh') ? 'Bình thường' : '')}</div>
                                        </td>
                                        {renderDoctorSignCell('than_kinh', 'neurology')}
                                    </tr>

                                    {/* 3. Mắt */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">3. Mắt</td>
                                        <td className="border border-black p-1 align-top space-y-0.5">
                                            {hasSpecialtyExamined('eye') ? (
                                                <>
                                                    <div className="grid grid-cols-2 gap-1 text-[10.5px] bg-slate-50 p-1 border border-black rounded">
                                                        <div>
                                                            <span className="font-bold block">Không kính:</span>
                                                            MP: <span className="font-bold font-mono">{clinical.khong_kinh_mat_phai || '--'}</span>; 
                                                            MT: <span className="font-bold font-mono ml-1">{clinical.khong_kinh_mat_trai || '--'}</span>; 
                                                            Hai mắt: <span className="font-bold font-mono ml-1">{clinical.khong_kinh_hai_mat || '--'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-bold block">Có kính:</span>
                                                            MP: <span className="font-bold font-mono">{clinical.co_kinh_mat_phai || '--'}</span>; 
                                                            MT: <span className="font-bold font-mono ml-1">{clinical.co_kinh_mat_trai || '--'}</span>; 
                                                            Hai mắt: <span className="font-bold font-mono ml-1">{clinical.co_kinh_hai_mat || '--'}</span>
                                                        </div>
                                                    </div>
                                                    {hasTtNgang && (
                                                        <div className="text-[10.5px]">
                                                            <span className="font-bold">Thị trường ngang: </span>
                                                            {renderCheckbox(isTtNgangBt, 'Bình thường')}
                                                            {renderCheckbox(!isTtNgangBt, 'Hạn chế')}
                                                            {hasTtDung && (
                                                                <>
                                                                    <span className="font-bold ml-2">Thị trường đứng: </span>
                                                                    {renderCheckbox(isTtDungBt, 'Bình thường')}
                                                                    {renderCheckbox(!isTtDungBt, 'Hạn chế')}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                    {hasSacGiac && (
                                                        <div className="text-[10.5px]">
                                                            <span className="font-bold">Sắc giác: </span>
                                                            {renderCheckbox(isSacGiacBt, 'Bình thường')}
                                                            {renderCheckbox(isMuMauToanBo, 'Mù màu toàn bộ')}
                                                            {renderCheckbox(isMuMauDo, 'Mù màu đỏ')}
                                                            {renderCheckbox(isMuMauXanh, 'Mù màu xanh')}
                                                            {renderCheckbox(isMuMauVang, 'Mù màu vàng')}
                                                        </div>
                                                    )}
                                                    {(clinical.kham_mat || clinical.benh_khac_mat) && (
                                                        <div className="text-[10px] italic">
                                                            Bệnh mắt khác: {clinical.benh_khac_mat || clinical.kham_mat}
                                                        </div>
                                                    )}
                                                </>
                                            ) : null}
                                        </td>
                                        {renderDoctorSignCell('eye', 'mat')}
                                    </tr>

                                    {/* 4. Tai - Mũi - Họng */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">4. Tai - Mũi - Họng</td>
                                        <td className="border border-black p-1 align-top space-y-0.5">
                                            {hasSpecialtyExamined('ent') ? (
                                                <>
                                                    {(clinical.tai_trai_noi_thuong || clinical.tai_trai_noi_tham || clinical.tai_phai_noi_thuong || clinical.tai_phai_noi_tham) ? (
                                                        <div className="grid grid-cols-2 gap-1 text-[10.5px] bg-slate-50 p-1 border border-black rounded">
                                                            <div>
                                                                <span className="font-bold">Tai trái: </span>
                                                                Nói thường: <span className="font-bold font-mono">{clinical.tai_trai_noi_thuong ? `${clinical.tai_trai_noi_thuong}m` : '--'}</span>; 
                                                                Nói thầm: <span className="font-bold font-mono ml-1">{clinical.tai_trai_noi_tham ? `${clinical.tai_trai_noi_tham}m` : '--'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-bold">Tai phải: </span>
                                                                Nói thường: <span className="font-bold font-mono">{clinical.tai_phai_noi_thuong ? `${clinical.tai_phai_noi_thuong}m` : '--'}</span>; 
                                                                Nói thầm: <span className="font-bold font-mono ml-1">{clinical.tai_phai_noi_tham ? `${clinical.tai_phai_noi_tham}m` : '--'}</span>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                    {(clinical.kham_tai_mui_hong || clinical.benh_tai_mui_hong || clinical.benh_khac_tai_mui_hong) && (
                                                        <div className="text-[10px] italic">
                                                            Bệnh TMH khác: {clinical.benh_khac_tai_mui_hong || clinical.benh_tai_mui_hong || clinical.kham_tai_mui_hong}
                                                        </div>
                                                    )}
                                                </>
                                            ) : null}
                                        </td>
                                        {renderDoctorSignCell('ent', 'tai_mui_hong')}
                                    </tr>

                                    {/* 5. Tim mạch */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">5. Tim mạch</td>
                                        <td className="border border-black p-1 align-top">
                                            <div>{clinical.noi_khoa_tuan_hoan || clinical.tim_mach || clinical.kq_tim_mach || (hasSpecialtyExamined('tuan_hoan') ? 'Bình thường' : '')}</div>
                                        </td>
                                        {renderDoctorSignCell('tuan_hoan', 'circulatory')}
                                    </tr>

                                    {/* 6. Hô hấp */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">6. Hô hấp</td>
                                        <td className="border border-black p-1 align-top">
                                            <div>{clinical.noi_khoa_ho_hap || clinical.kq_lam_sang_ho_hap || clinical.ho_hap || (hasSpecialtyExamined('ho_hap') ? 'Bình thường' : '')}</div>
                                        </td>
                                        {renderDoctorSignCell('ho_hap', 'respiratory')}
                                    </tr>

                                    {/* 7. Cơ - Xương - Khớp */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">7. Cơ xương khớp</td>
                                        <td className="border border-black p-1 align-top">
                                            <div>{clinical.noi_khoa_co_xuong_khop || clinical.kq_co_xuong_khop || (hasSpecialtyExamined('co_xuong_khop') ? 'Bình thường' : '')}</div>
                                        </td>
                                        {renderDoctorSignCell('co_xuong_khop', 'musculoskeletal')}
                                    </tr>

                                    {/* 8. Nội tiết & Sản phụ khoa */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">8. Nội tiết / Khác</td>
                                        <td className="border border-black p-1 align-top">
                                            <div>
                                                {clinical.noi_khoa_noi_tiet || (hasSpecialtyExamined('noi_tiet') ? 'Bình thường' : '')}
                                                {isNu && clinical.kham_san_phu_khoa ? ` | Sản phụ khoa: ${clinical.kham_san_phu_khoa}` : ''}
                                            </div>
                                        </td>
                                        {renderDoctorSignCell('noi_tiet', 'endocrine')}
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full border-collapse border border-black text-[10.5px]">
                                <thead>
                                    <tr className="bg-slate-100 text-center font-bold">
                                        <th className="border border-black p-1 w-[24%] text-left">Chuyên khoa khám</th>
                                        <th className="border border-black p-1 text-left">Nội dung khám &amp; Kết quả</th>
                                        <th className="border border-black p-1 w-[12%] text-center">Phân loại</th>
                                        <th className="border border-black p-1 w-[20%] text-center">Họ tên, chữ ký Bác sĩ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* 1. Nội khoa */}
                                    <tr className="bg-slate-50 font-bold">
                                        <td colSpan={4} className="border border-black p-0.5 pl-1.5">1. Nội khoa</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 pl-3 align-top font-medium">a) Tuần hoàn</td>
                                        <td className="border border-black p-1 align-top">{clinical.noi_khoa_tuan_hoan || clinical.tim_mach || clinical.kq_tim_mach || (hasSpecialtyExamined('tuan_hoan') ? 'Bình thường' : '')}</td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.noi_khoa_tuan_hoan_pl)}</td>
                                        {renderDoctorSignCell('tuan_hoan', 'circulatory')}
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 pl-3 align-top font-medium">b) Hô hấp</td>
                                        <td className="border border-black p-1 align-top">{clinical.noi_khoa_ho_hap || clinical.ho_hap || clinical.kq_ho_hap || (hasSpecialtyExamined('ho_hap') ? 'Bình thường' : '')}</td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.noi_khoa_ho_hap_pl)}</td>
                                        {renderDoctorSignCell('ho_hap', 'respiratory')}
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 pl-3 align-top font-medium">c) Tiêu hóa</td>
                                        <td className="border border-black p-1 align-top">{clinical.noi_khoa_tieu_hoa || clinical.kq_tieu_hoa || (hasSpecialtyExamined('tieu_hoa') ? 'Bình thường' : '')}</td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.noi_khoa_tieu_hoa_pl)}</td>
                                        {renderDoctorSignCell('tieu_hoa', 'digestive')}
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 pl-3 align-top font-medium">d) Thận - Tiết niệu</td>
                                        <td className="border border-black p-1 align-top">{clinical.noi_khoa_than_tn_sd || clinical.tiet_nieu_sinh_duc || clinical.kq_tiet_nieu || (hasSpecialtyExamined('than_tiet_nieu') ? 'Bình thường' : '')}</td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.noi_khoa_than_tietnieu_pl)}</td>
                                        {renderDoctorSignCell('than_tiet_nieu', 'urinary')}
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 pl-3 align-top font-medium">đ) Nội tiết</td>
                                        <td className="border border-black p-1 align-top">{clinical.noi_khoa_noi_tiet || clinical.kq_noi_tiet || clinical.kq_noi_tiet_chuyen_hoa || (hasSpecialtyExamined('noi_tiet') ? 'Bình thường' : '')}</td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.noi_khoa_noi_tiet_pl)}</td>
                                        {renderDoctorSignCell('noi_tiet', 'endocrine')}
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 pl-3 align-top font-medium">e) Cơ - Xương - Khớp</td>
                                        <td className="border border-black p-1 align-top">{clinical.noi_khoa_co_xuong_khop || clinical.kq_co_xuong_khop || clinical.kq_co_xuong_khop_m5 || (hasSpecialtyExamined('co_xuong_khop') ? 'Bình thường' : '')}</td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.noi_khoa_co_xuong_khop_pl)}</td>
                                        {renderDoctorSignCell('co_xuong_khop', 'musculoskeletal')}
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 pl-3 align-top font-medium">g) Thần kinh</td>
                                        <td className="border border-black p-1 align-top">{clinical.noi_khoa_than_kinh || clinical.than_kinh || clinical.kq_than_kinh || (hasSpecialtyExamined('than_kinh') ? 'Bình thường' : '')}</td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.noi_khoa_than_kinh_pl)}</td>
                                        {renderDoctorSignCell('than_kinh', 'neurology')}
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 pl-3 align-top font-medium">h) Tâm thần</td>
                                        <td className="border border-black p-1 align-top">{clinical.noi_khoa_tam_than || clinical.tam_than || clinical.kq_tam_than || (hasSpecialtyExamined('tam_than') ? 'Bình thường' : '')}</td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.noi_khoa_tam_than_pl)}</td>
                                        {renderDoctorSignCell('tam_than', 'psychiatry')}
                                    </tr>

                                    {/* 2. Ngoại khoa */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">2. Ngoại khoa</td>
                                        <td className="border border-black p-1 align-top">{clinical.external || clinical.kq_ngoai_khoa || clinical.kham_ngoai_khoa || (hasSpecialtyExamined('surgery') ? 'Bình thường' : '')}</td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.kham_ngoai_khoa_pl)}</td>
                                        {renderDoctorSignCell('surgery', 'ngoai_khoa')}
                                    </tr>

                                    {/* 3. Sản phụ khoa */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">3. Sản phụ khoa</td>
                                        <td className="border border-black p-1 align-top">
                                            {isNu ? (clinical.gynecology || clinical.kham_san_phu_khoa || (hasSpecialtyExamined('gynecology') ? 'Bình thường' : '')) : 'Không khám'}
                                        </td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{isNu ? formatPl(clinical.kham_san_phu_khoa_pl) : ''}</td>
                                        {isNu ? renderDoctorSignCell('gynecology', 'san_phu_khoa') : <td className="border border-black p-1 text-center align-middle h-14 min-h-[50px]"></td>}
                                    </tr>

                                    {/* 4. Mắt */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">4. Mắt</td>
                                        <td className="border border-black p-1 align-top space-y-0.5">
                                            {hasSpecialtyExamined('eye') ? (
                                                <>
                                                    <div className="text-[10px]">
                                                        <span>Không kính: MP <span className="font-bold">{clinical.khong_kinh_mat_phai || '--'}</span>/10; MT <span className="font-bold">{clinical.khong_kinh_mat_trai || '--'}</span>/10</span>
                                                        {(clinical.co_kinh_mat_phai || clinical.co_kinh_mat_trai) && (
                                                            <span className="ml-2">| Có kính: MP <span className="font-bold">{clinical.co_kinh_mat_phai}</span>/10; MT <span className="font-bold">{clinical.co_kinh_mat_trai}</span>/10</span>
                                                        )}
                                                    </div>
                                                    <div>Bệnh mắt: <span className="italic">{clinical.benh_khac_mat || clinical.kham_mat || clinical.eye || 'Bình thường'}</span></div>
                                                </>
                                            ) : null}
                                        </td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.kham_mat_pl)}</td>
                                        {renderDoctorSignCell('eye', 'mat')}
                                    </tr>

                                    {/* 5. Tai - Mũi - Họng */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">5. Tai - Mũi - Họng</td>
                                        <td className="border border-black p-1 align-top space-y-0.5">
                                            {hasSpecialtyExamined('ent') ? (
                                                <>
                                                    {(clinical.tai_trai_noi_thuong || clinical.tai_phai_noi_thuong) && (
                                                        <div className="text-[10px]">
                                                            <span>Tai trái: nói thường <span className="font-bold">{clinical.tai_trai_noi_thuong || '--'}</span>m, thầm <span className="font-bold">{clinical.tai_trai_noi_tham || '--'}</span>m</span>
                                                            <span className="ml-2">| Tai phải: nói thường <span className="font-bold">{clinical.tai_phai_noi_thuong || '--'}</span>m, thầm <span className="font-bold">{clinical.tai_phai_noi_tham || '--'}</span>m</span>
                                                        </div>
                                                    )}
                                                    <div>Bệnh TMH: <span className="italic">{clinical.benh_khac_tai_mui_hong || clinical.benh_tai_mui_hong || clinical.kham_tai_mui_hong || clinical.ent || 'Bình thường'}</span></div>
                                                </>
                                            ) : null}
                                        </td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.kham_tai_mui_hong_pl)}</td>
                                        {renderDoctorSignCell('ent', 'tai_mui_hong')}
                                    </tr>

                                    {/* 6. Răng - Hàm - Mặt */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">6. Răng - Hàm - Mặt</td>
                                        <td className="border border-black p-1 align-top space-y-0.5">
                                            {hasSpecialtyExamined('dental') ? (
                                                <>
                                                    {(clinical.ham_tren || clinical.ham_duoi) && (
                                                        <div className="text-[10px]">
                                                            <span>Hàm trên: <span className="font-bold">{clinical.ham_tren || 'Bình thường'}</span></span>
                                                            <span className="ml-2">| Hàm dưới: <span className="font-bold">{clinical.ham_duoi || 'Bình thường'}</span></span>
                                                        </div>
                                                    )}
                                                    <div>Bệnh RHM: <span className="italic">{clinical.benh_khac_rang_ham_mat || clinical.benh_rang_ham_mat || clinical.kham_rang_ham_mat || clinical.dental || 'Bình thường'}</span></div>
                                                </>
                                            ) : null}
                                        </td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.kham_rang_ham_mat_pl)}</td>
                                        {renderDoctorSignCell('dental', 'rang_ham_mat')}
                                    </tr>

                                    {/* 7. Da liễu */}
                                    <tr>
                                        <td className="border border-black p-1 font-bold align-top">7. Da liễu</td>
                                        <td className="border border-black p-1 align-top">{clinical.dermatology || clinical.kq_da_lieu || clinical.kham_da_lieu || (hasSpecialtyExamined('dermatology') ? 'Bình thường' : '')}</td>
                                        <td className="border border-black p-1 text-center align-top font-semibold">{formatPl(clinical.kham_da_lieu_pl)}</td>
                                        {renderDoctorSignCell('dermatology', 'da_lieu')}
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="pt-2 text-right text-[10px] font-mono">Trang 2/{totalPages}</div>
            </div>

            {/* ========================================== TRANG 3 VÀ CÁC TRANG PHÂN TÁCH ĐỘNG ========================================== */}
            {clsPages.map((clsPage, pageIdx) => {
                const currentPageNumber = 3 + pageIdx;
                const isFirstClsPage = pageIdx === 0;
                const showConclusion = clsPage.type === 'cls-and-conclusion' || clsPage.type === 'conclusion-only';

                return (
                    <div key={pageIdx} className="a4-page bg-white text-black p-8 shadow-md print:shadow-none w-[210mm] min-h-[297mm] box-border relative flex flex-col justify-between text-[12px] leading-normal">
                        <div>
                            {/* Phần V: Khám cận lâm sàng */}
                            {clsPage.type !== 'conclusion-only' && (
                                <div className="mb-4">
                                    <div className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-2">
                                        {isFirstClsPage ? 'V. KHÁM CẬN LÂM SÀNG' : 'V. KHÁM CẬN LÂM SÀNG (Tiếp theo)'}
                                    </div>

                                    {isDriver ? (
                                        <div className="space-y-2">
                                            {/* A. Xét nghiệm ma túy */}
                                            <div className="p-2.5 border border-black rounded bg-slate-50">
                                                <div className="font-bold text-[12px] mb-1 flex items-center justify-between">
                                                    <span>1. Xét nghiệm Ma túy (Morphin/Heroin, Amphetamin, Marijuana, Methamphetamin, Codein):</span>
                                                    <span className="text-[11px] px-2 py-0.5 border border-black rounded font-bold">Bắt buộc</span>
                                                </div>
                                                <div className="text-[12px]">
                                                    Kết quả: <span className="font-extrabold text-[12.5px]">{lab.kq_xn_mai_tuy || lab.kq_xn_ma_tuy || '--'}</span>
                                                </div>
                                            </div>

                                            {/* B. Xét nghiệm nồng độ cồn */}
                                            <div className="p-2.5 border border-black rounded bg-slate-50">
                                                <div className="font-bold text-[12px] mb-1 flex items-center justify-between">
                                                    <span>2. Xét nghiệm Nồng độ cồn (Định lượng nồng độ trong máu hoặc hơi thở):</span>
                                                    <span className="text-[11px] px-2 py-0.5 border border-black rounded font-bold">Bắt buộc</span>
                                                </div>
                                                <div className="text-[12px]">
                                                    Kết quả: <span className="font-extrabold text-[12.5px] font-mono">{lab.kq_xn_nong_do_con || '--'}</span>
                                                </div>
                                            </div>

                                            {/* C. Các xét nghiệm khác */}
                                            {(() => {
                                                const otherLabText = [
                                                    lab.x_quang ? `- X-quang tim phổi: ${lab.x_quang}` : '',
                                                    lab.dien_tim ? `- Điện tâm đồ: ${lab.dien_tim}` : '',
                                                    lab.ket_luan_xn_khac ? `- Kết luận cận lâm sàng khác: ${lab.ket_luan_xn_khac}` : ''
                                                ].filter(Boolean);

                                                return otherLabText.length > 0 && (
                                                    <div className="p-2.5 border border-black rounded bg-slate-50">
                                                        <div className="font-bold text-[12px] mb-1">
                                                            3. Các xét nghiệm cận lâm sàng khác (nếu có chỉ định của Bác sĩ):
                                                        </div>
                                                        <div className="text-[11.5px] space-y-0.5">
                                                            {otherLabText.map((t, idx) => (
                                                                <div key={idx} className="font-semibold">{t}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {clsPage.items.length === 0 && isFirstClsPage && !lab.ket_luan_xn_khac ? (
                                                <div className="p-3 border border-dashed border-black rounded text-center italic text-[11.5px]">
                                                    Không có chỉ định hoặc chưa có kết quả cận lâm sàng
                                                </div>
                                            ) : (
                                                clsPage.items.map((item: any, idx: number) => {
                                                    const globalIdx = clsPage.startIndex + idx + 1;
                                                    return (
                                                        <div key={idx} className="p-2 border border-black rounded bg-slate-50/30">
                                                            <div className="font-bold text-[12px] border-b border-black pb-0.5 mb-1 flex justify-between items-center">
                                                                <span>{globalIdx}. {item.service_name || item.index_name || 'Dịch vụ kỹ thuật'}</span>
                                                                {item.group_name && <span className="text-[10.5px] font-normal italic">({item.group_name})</span>}
                                                            </div>
                                                            <div className="grid grid-cols-12 gap-2 text-[11.5px] leading-snug">
                                                                <div className="col-span-4">
                                                                    <span className="font-bold">Kết quả: </span>
                                                                    <span className="font-semibold font-mono">{item.value ? `${item.value} ${item.unit || ''}` : '--'}</span>
                                                                </div>
                                                                <div className="col-span-8">
                                                                    <span className="font-bold">Kết luận / Đánh giá: </span>
                                                                    <span>{item.conclusion || item.description || ''}</span>
                                                                </div>
                                                                {item.description && item.description !== item.conclusion && (
                                                                    <div className="col-span-12 italic text-[11px]">
                                                                        Mô tả: {item.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}

                                            {/* Kết luận CLS khác nếu có ở trang CLS cuối cùng */}
                                            {showConclusion && lab.ket_luan_xn_khac && (
                                                <div className="p-2 border border-black rounded bg-slate-50 text-[11.5px]">
                                                    <span className="font-bold">Kết luận cận lâm sàng khác: </span>
                                                    <span className="font-semibold">{lab.ket_luan_xn_khac}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Hiển thị Phần VI Kết luận và Khung Chữ ký nếu trang này là trang kết luận */}
                            {showConclusion && renderConclusionSection()}
                        </div>

                        {/* Footer trang */}
                        <div className="flex justify-between items-center text-[10px] font-mono mt-3 pt-1 border-t border-black">
                            <span>Hệ thống Quản lý Y tế VIMES HIS - QĐ 1551/QĐ-BYT</span>
                            <span>Trang {currentPageNumber}/{totalPages}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PrintFormMau3;
