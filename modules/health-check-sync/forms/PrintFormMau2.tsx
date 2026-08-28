import React from 'react';
import { VIMES_LOGO_BASE64 } from '../../../config/vimesLogoBase64';
import { formatDate, parseDateSafe } from '../../../utils/formatters';

interface PrintFormMau2Props {
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

const TARGET_GROUP_MAP: Record<string, string> = {
    '1': 'Người cao tuổi',
    '2': 'Người khuyết tật',
    '3': 'Người thuộc hộ nghèo, cận nghèo',
    '4': 'Người có công',
    '5': 'Người mắc bệnh mạn tính',
    '6': 'Người sống tại vùng đồng bào DTTS & miền núi',
    '7': 'Người sống tại vùng ĐK KTXH đặc biệt khó khăn',
    '8': 'Người sống tại xã đảo',
    '9': 'Người sống tại đặc khu',
    '10': 'Trẻ em trong cơ sở giáo dục mầm non',
    '11': 'Học sinh trong các cơ sở giáo dục phổ thông',
    '12': 'Sinh viên',
    '13': 'Người lao động',
    '14': 'Các đối tượng khác'
};

const FUNDING_SOURCE_MAP: Record<string, string> = {
    '1': 'Ngân sách Trung ương',
    '2': 'Ngân sách Địa phương',
    '3': 'Quỹ Bảo hiểm y tế',
    '4': 'Người sử dụng lao động',
    '5': 'Xã hội hóa',
    '9': 'Khác'
};

export const PrintFormMau2: React.FC<PrintFormMau2Props> = ({
    document,
    hospitalName,
    logoUrl,
    getReportDate,
    getConclusionDoctorName,
    doctors = [],
    icd10Names = {},
    COMMON_ICD10 = [],
    maCskcb,
    doctorSignatures = {},
    resolvedLocation
}) => {
    const normalizeObject = (obj: any): any => {
        if (!obj) return obj;
        if (typeof obj === 'string') return obj.normalize('NFC');
        if (Array.isArray(obj)) return obj.map(normalizeObject);
        if (typeof obj === 'object') {
            const res: any = {};
            for (const key in obj) {
                res[key] = normalizeObject(obj[key]);
            }
            return res;
        }
        return obj;
    };

    const docNormalized = normalizeObject(document) || {};
    const hospitalNameNormalized = normalizeObject(hospitalName);

    const rawClinical = docNormalized.clinical_data || docNormalized.clinicalData || {};
    const clinicalExam = rawClinical.clinical_exam || rawClinical.clinicalExam || {};
    const examination = rawClinical.examination || {};
    const extra = rawClinical.extra || {};
    const clinical = { ...examination, ...rawClinical, ...clinicalExam };
    const lab = docNormalized.lab_data || docNormalized.labData || {};
    const conclusion = docNormalized.conclusion_data || docNormalized.conclusionData || {};
    const paraclinicalItems: any[] = lab.paraclinical_items || lab.paraclinicalItems || [];

    const isNam = docNormalized.gender === 'Nam' || docNormalized.gender === '1' || docNormalized.gender === 1;
    const isNu = docNormalized.gender === 'Nữ' || docNormalized.gender === '2' || docNormalized.gender === '0' || docNormalized.gender === 2 || docNormalized.gender === 0;

    const getAge = (dobString: any) => {
        if (!dobString) return '...';
        try {
            const birthDate = parseDateSafe(dobString);
            if (!birthDate || isNaN(birthDate.getTime())) return '...';
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age > 0 ? age : 0;
        } catch {
            return '...';
        }
    };

    const getBirthDateDetails = (dobString: any) => {
        if (!dobString) return { day: '...', month: '...', year: '...' };
        if (typeof dobString === 'string') {
            const trimmed = dobString.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                const [y, m, d] = trimmed.split('-');
                return { day: d, month: m, year: y };
            }
            if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(trimmed)) {
                const [d, m, y] = trimmed.split(/[/-]/);
                return { day: d.padStart(2, '0'), month: m.padStart(2, '0'), year: y };
            }
        }
        try {
            const birthDate = parseDateSafe(dobString);
            if (!birthDate) return { day: '...', month: '...', year: '...' };
            return {
                day: String(birthDate.getDate()).padStart(2, '0'),
                month: String(birthDate.getMonth() + 1).padStart(2, '0'),
                year: String(birthDate.getFullYear())
            };
        } catch {
            return { day: '...', month: '...', year: '...' };
        }
    };

    const formatIcd10String = (codeStr: any) => {
        if (!codeStr) return '';
        const raw = String(codeStr).trim();
        if (!raw) return '';
        const codes = raw.split(/[,;\+]/).map(s => s.trim()).filter(Boolean);
        const formatted = codes.map(code => {
            const upper = code.toUpperCase();
            const localMatch = COMMON_ICD10.find(item => item.code.toUpperCase() === upper);
            if (localMatch) {
                return `${upper} - ${localMatch.name}`;
            }
            const apiMatch = icd10Names[upper];
            if (apiMatch) {
                return `${upper} - ${apiMatch}`;
            }
            return upper;
        });
        return formatted.join(', ');
    };

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

    const renderCheckbox = (checked: boolean, label: string) => (
        <span className="inline-flex items-center gap-1 mr-3 text-[11px] whitespace-nowrap">
            <span className="inline-block w-3.5 h-3.5 border border-black text-[9px] leading-none font-sans font-bold text-center flex items-center justify-center shrink-0" style={{ transform: 'translateY(-0.5px)' }}>
                {checked ? 'x' : ''}
            </span>
            <span>{label}</span>
        </span>
    );

    const normalizeSignatureKey = (value: any) => String(value || '')
        .trim()
        .toUpperCase()
        .replace(/^HMS_/, '')
        .replace(/\.JPE?G\.?$/, '');

    const findDoctorByIdentifier = (identifier: any) => {
        const wanted = normalizeSignatureKey(identifier);
        if (!wanted) return undefined;
        return doctors.find(d => [d.id, d.hee_employee_id, d.code, d.username]
            .some(value => normalizeSignatureKey(value) === wanted));
    };

    const resolveDoctorSignature = (...candidates: any[]) => {
        if (!doctorSignatures) return null;
        const normalizedSignatures = new Map(
            Object.entries(doctorSignatures).map(([key, value]) => [normalizeSignatureKey(key), value])
        );
        for (const candidate of candidates) {
            const normalized = normalizeSignatureKey(candidate);
            if (normalized && normalizedSignatures.has(normalized)) {
                return normalizedSignatures.get(normalized) || null;
            }
        }
        return null;
    };

    const hasSpecialtyData = (specialty: string) => {
        if (specialty === 'tuan_hoan') return !!(clinicalExam.nhi_tuan_hoan || clinicalExam.internal || clinicalExam.tuan_hoan || clinical.tuan_hoan || clinical.circulatory);
        if (specialty === 'ho_hap') return !!(clinicalExam.nhi_ho_hap || clinicalExam.internal || clinicalExam.ho_hap || clinical.ho_hap || clinical.respiratory);
        if (specialty === 'tieu_hoa') return !!(clinicalExam.nhi_tieu_hoa || clinicalExam.internal || clinicalExam.tieu_hoa || clinical.tieu_hoa || clinical.digestive);
        if (specialty === 'than_tiet_nieu') return !!(clinicalExam.nhi_tiet_nieu || clinicalExam.nhi_sinh_duc || clinicalExam.internal || clinicalExam.than_tiet_nieu || clinical.than_tiet_nieu || clinical.urinary);
        if (specialty === 'than_kinh') return !!(clinicalExam.nhi_than_kinh || clinicalExam.internal || clinicalExam.than_kinh || clinical.than_kinh || clinical.neurology);
        if (specialty === 'tam_than') return !!(clinicalExam.nhi_tam_than || clinicalExam.internal || clinicalExam.tam_than || clinical.tam_than || clinical.psychiatry);
        if (specialty === 'lam_sang_khac') return !!(clinicalExam.nhi_khoa_lam_sang_khac || clinicalExam.nhi_khac || clinicalExam.internal || clinicalExam.ngoai_khoa || extra.nhi_khoa_lam_sang_khac);
        if (specialty === 'mat') return !!(clinicalExam.eye || clinicalExam.kham_mat_pl || clinicalExam.khong_kinh_mat_phai || clinicalExam.khong_kinh_mat_trai || clinical.mat);
        if (specialty === 'tai_mui_hong') return !!(clinicalExam.ent || clinicalExam.kham_tai_mui_hong_pl || clinicalExam.tai_trai_noi_thuong || clinicalExam.tai_phai_noi_thuong || clinical.tai_mui_hong);
        if (specialty === 'rang_ham_mat') return !!(clinicalExam.dental || clinicalExam.kham_rang_ham_mat_pl || clinicalExam.ham_tren || clinicalExam.ham_duoi || clinical.rang_ham_mat);
        if (specialty === 'lab') return paraclinicalItems.length > 0 || !!lab.blood_test || !!lab.urine_test;
        if (specialty === 'imaging') return paraclinicalItems.some((x: any) => String(x.service_name || '').toLowerCase().includes('x-quang') || String(x.service_name || '').toLowerCase().includes('siêu âm')) || !!lab.imaging;
        return false;
    };

    const getDoctor = (specialty: string) => {
        const metadataMap: Record<string, string[]> = {
            tuan_hoan: ['circulatory', 'tuan_hoan', 'internal'],
            ho_hap: ['respiratory', 'ho_hap', 'internal'],
            tieu_hoa: ['digestive', 'tieu_hoa', 'internal'],
            than_tiet_nieu: ['urinary', 'than_tiet_nieu', 'internal'],
            than_kinh: ['neurology', 'than_kinh', 'internal'],
            tam_than: ['psychiatry', 'tam_than', 'internal'],
            lam_sang_khac: ['surgery', 'ngoai_khoa', 'internal'],
            mat: ['eye', 'mat'],
            tai_mui_hong: ['ent', 'tai_mui_hong'],
            rang_ham_mat: ['dental', 'rang_ham_mat'],
            lab: ['lab', 'xet_nghiem'],
            imaging: ['imaging', 'cdha']
        };

        const checkKeys = metadataMap[specialty] || [specialty, 'internal'];
        for (const k of checkKeys) {
            const meta = clinical.specialty_metadata?.[k] || clinicalExam.specialty_metadata?.[k];
            if (meta?.doctorName) return meta.doctorName;
            if (meta?.doctorId && Array.isArray(doctors)) {
                const doc = doctors.find(d => [d.id, d.hee_employee_id, d.code, d.username]
                    .some(value => String(value || '').trim().toUpperCase() === String(meta.doctorId).trim().toUpperCase()));
                if (doc) return doc.name || doc.fullname || doc.hee_fullname;
            }
        }

        if (hasSpecialtyData(specialty)) {
            return getConclusionDoctorName();
        }
        return '';
    };

    const renderDoctorCell = (specialty: string) => {
        const docName = getDoctor(specialty);
        if (!docName) return null;

        const metadataMap: Record<string, string[]> = {
            tuan_hoan: ['circulatory', 'tuan_hoan', 'internal'],
            ho_hap: ['respiratory', 'ho_hap', 'internal'],
            tieu_hoa: ['digestive', 'tieu_hoa', 'internal'],
            than_tiet_nieu: ['urinary', 'than_tiet_nieu', 'internal'],
            than_kinh: ['neurology', 'than_kinh', 'internal'],
            tam_than: ['psychiatry', 'tam_than', 'internal'],
            lam_sang_khac: ['surgery', 'ngoai_khoa', 'internal'],
            ngoai_khoa: ['surgery', 'ngoai_khoa', 'external'],
            da_lieu: ['dermatology', 'da_lieu'],
            mat: ['eye', 'mat'],
            tai_mui_hong: ['ent', 'tai_mui_hong'],
            rang_ham_mat: ['dental', 'rang_ham_mat'],
            lab: ['lab', 'xet_nghiem'],
            imaging: ['imaging', 'cdha']
        };

        const checkKeys = metadataMap[specialty] || [specialty, 'internal'];
        let docMeta: any = null;
        for (const k of checkKeys) {
            const m = clinical.specialty_metadata?.[k] || clinicalExam.specialty_metadata?.[k];
            if (m) { docMeta = m; break; }
        }

        const doctorByMetadata = findDoctorByIdentifier(docMeta?.doctorCode)
            || findDoctorByIdentifier(docMeta?.doctorUsername)
            || findDoctorByIdentifier(docMeta?.doctorId);
        const doctorByName = doctors.find(d => (d.name || d.fullname || d.hee_fullname) === docName);
        const matchedDoctor = doctorByMetadata || doctorByName;
        const docCode = (docMeta?.doctorCode || docMeta?.doctorUsername || matchedDoctor?.code
            || matchedDoctor?.username || matchedDoctor?.hee_employee_id || docMeta?.doctorId || '').toString().trim().toUpperCase();

        const sigImg = docMeta?.signature || resolveDoctorSignature(
            docCode,
            docMeta?.doctorCode,
            docMeta?.doctorUsername,
            docMeta?.doctorId,
            matchedDoctor?.code,
            matchedDoctor?.username,
            matchedDoctor?.id,
            matchedDoctor?.hee_employee_id,
            matchedDoctor?.name,
            matchedDoctor?.hee_fullname,
            docName
        );
        const displayName = docName.startsWith('BS.') ? docName : `BS. ${docName}`;

        return (
            <div className="flex flex-col items-center justify-center py-1 min-h-[40px]">
                {sigImg && (
                    <img 
                        src={sigImg} 
                        alt="Chữ ký" 
                        className="h-8 max-w-[90px] object-contain shrink-0 mb-0.5" 
                    />
                )}
                <span className="font-bold text-[11.5px] text-slate-900 leading-tight text-center">{displayName}</span>
            </div>
        );
    };

    const getPl = (specialty: string) => {
        if (specialty === 'tuan_hoan') return clinicalExam.nhi_tuan_hoan_pl || clinicalExam.tuanHoanPl || clinicalExam.noi_khoa_tuan_hoan_pl || clinical.tuan_hoan_pl || '';
        if (specialty === 'ho_hap') return clinicalExam.nhi_ho_hap_pl || clinicalExam.hoHapPl || clinicalExam.noi_khoa_ho_hap_pl || clinical.ho_hap_pl || '';
        if (specialty === 'tieu_hoa') return clinicalExam.nhi_tieu_hoa_pl || clinicalExam.tieuHoaPl || clinicalExam.noi_khoa_tieu_hoa_pl || clinical.tieu_hoa_pl || '';
        if (specialty === 'than_tiet_nieu') return clinicalExam.nhi_tiet_nieu_pl || clinicalExam.thanTietNieuPl || clinicalExam.noi_khoa_than_tietnieu_pl || clinical.than_tiet_nieu_pl || '';
        if (specialty === 'than_kinh') return clinicalExam.nhi_than_kinh_pl || clinicalExam.thanKinhPl || clinicalExam.noi_khoa_than_kinh_pl || clinical.than_kinh_pl || '';
        if (specialty === 'tam_than') return clinicalExam.nhi_tam_than_pl || clinicalExam.tamThanPl || clinicalExam.noi_khoa_tam_than_pl || clinical.tam_than_pl || '';
        if (specialty === 'lam_sang_khac') return clinicalExam.nhi_khac_pl || clinicalExam.surgeryPl || clinical.ngoai_khoa_pl || '';
        if (specialty === 'ngoai_khoa') return clinicalExam.kham_ngoai_khoa_pl || clinicalExam.surgeryPl || clinical.ngoai_khoa_pl || '';
        if (specialty === 'da_lieu') return clinicalExam.kham_da_lieu_pl || clinicalExam.dermatologyPl || clinical.da_lieu_pl || '';
        if (specialty === 'mat') return clinicalExam.kham_mat_pl || clinicalExam.eyePl || clinical.kham_mat_pl || '';
        if (specialty === 'tai_mui_hong') return clinicalExam.kham_tai_mui_hong_pl || clinicalExam.entPl || clinical.kham_tai_mui_hong_pl || '';
        if (specialty === 'rang_ham_mat') return clinicalExam.kham_rang_ham_mat_pl || clinicalExam.dentalPl || clinical.kham_rang_ham_mat_pl || '';
        return '';
    };

    const renderPl = (specialty: string) => {
        const pl = getPl(specialty);
        if (!pl) return null;
        return (
            <div className="pl-3 text-[11px] mt-0.5 text-gray-700 font-normal">
                Phân loại: <strong className="text-black">{formatPl(pl)}</strong>
            </div>
        );
    };

    // Administrative fields
    const cccdDate = clinical.cccd_date || clinical.ngaycap_cccd || extra.cccd_date || extra.ngaycap_cccd || docNormalized.cccd_date || '';
    const cccdPlace = clinical.cccd_place || clinical.noicap_cccd || extra.cccd_place || extra.noicap_cccd || docNormalized.cccd_place || '';

    const priorityGroupText = TARGET_GROUP_MAP[clinical.target_group || clinical.doi_tuong || clinical.priority_group || extra.target_group] 
        || clinical.target_group || clinical.priority_group || 'Học sinh';
    const fundingSourceText = FUNDING_SOURCE_MAP[clinical.funding_source || clinical.nguon_kinh_phi || clinical.nguon_chi_tra || clinical.payment_source || extra.funding_source] 
        || clinical.funding_source || clinical.payment_source || 'Ngân sách địa phương';

    // Extracted measurements
    const examHeight = clinical.examination?.height || extra.height || clinical.height || '';
    const examWeight = clinical.examination?.weight || extra.weight || clinical.weight || '';
    const examBmi = clinical.examination?.bmi || extra.bmi || clinical.bmi || '';
    const examPulse = clinical.examination?.pulse || extra.pulse || clinical.pulse || '';
    const examBp = clinical.examination?.blood_pressure || extra.bp || extra.huyet_ap || clinical.huyet_ap || clinical.blood_pressure || clinical.bp || '';
    const physicalPl = clinical.examination?.kham_the_luc_pl || extra.kham_the_luc_pl || clinical.kham_the_luc_pl || '';

    const findParaclinicalValue = (keywords: string[]) => {
        const item = paraclinicalItems.find((x: any) => 
            keywords.some(kw => (x.service_name || x.hfe_desc || x.test_name || '').toLowerCase().includes(kw.toLowerCase()))
        );
        return item?.value || item?.result || item?.conclusion || '...';
    };

    const bloodSugar = findParaclinicalValue(['đường máu', 'glucose', 'glycemia']);
    const ureaVal = findParaclinicalValue(['urê', 'urea']);
    const creatinineVal = findParaclinicalValue(['creatinine', 'creatinin']);
    const asatVal = findParaclinicalValue(['ast', 'asat', 'got']);
    const alatVal = findParaclinicalValue(['alt', 'alat', 'gpt']);
    const urineTest = findParaclinicalValue(['nước tiểu', 'urine', 'protein', '10 thông số']);
    const xqResult = findParaclinicalValue(['x-quang ngực', 'xq ngực', 'xq tim phổi', 'chụp x-quang', 'xq', 'xquang']);

    const dobDetails = getBirthDateDetails(docNormalized.dob);
    const reportDate = getReportDate();
    const formatDateSafe = (value: any, fallback = '.../.../....') => {
        if (!value) return fallback;
        const res = formatDate(value);
        return res === '---' ? fallback : res;
    };

    // Checkboxes for obstetrics
    const rawSanKhoa = extra.san_khoa ?? extra.tsbt_thai_san ?? clinical.san_khoa;
    const rawSanKhoaKhongBt = extra.san_khoa_khong_bt ?? extra.tinh_chat_kinh_nguyet ?? extra.sanKhoaKhongBt;
    const sanKhoaMaBenh = extra.ma_benh_san_khoa_khong_bt || extra.maBenhSanKhoaKhongBt || extra.tsbt_ma_benh_thai_san || '';

    const isExplicitlyAbnormal = String(rawSanKhoa) === '0' || (rawSanKhoaKhongBt && String(rawSanKhoaKhongBt) !== '0') || !!sanKhoaMaBenh;
    const sanKhoaNormal = !isExplicitlyAbnormal;
    const sanKhoaAbnormal = isExplicitlyAbnormal;
    const sk1 = String(rawSanKhoaKhongBt) === '1';
    const sk2 = String(rawSanKhoaKhongBt) === '2';
    const sk3 = String(rawSanKhoaKhongBt) === '3';
    const sk4 = String(rawSanKhoaKhongBt) === '4';
    const sk5 = String(rawSanKhoaKhongBt) === '5';

    // Checkboxes for vaccinations
    const getVaccineStatus = (val: any) => {
        const strVal = String(val ?? '').trim();
        return {
            co: strVal === '1',
            khong: strVal === '0',
            khongNho: strVal === '99' || strVal === '2'
        };
    };

    const vacBcg = getVaccineStatus(extra.tiem_chung_bcg);
    const vacBhHgUv = getVaccineStatus(extra.tiem_chung_bh_hg_uv);
    const vacSoi = getVaccineStatus(extra.tiem_chung_soi);
    const vacBaiLiet = getVaccineStatus(extra.tiem_chung_bai_liet);
    const vacVnnbB = getVaccineStatus(extra.tiem_chung_vnnb_b);
    const vacVgb = getVaccineStatus(extra.tiem_chung_vgb);
    const vacKhac = getVaccineStatus(extra.tiem_chung_cac_loai_khac);
    const tenVacXinKhac = extra.tiem_chung_vac_xin_khac || extra.tiemChungVacXinKhac || extra.TIEM_CHUNG_VAC_XIN_KHAC || '';

    // Tiền sử gia đình
    const tsgdMacBenh = extra.tsgd_mac_benh === '1' || extra.tsgd_mac_benh === 1 || !!extra.tsgd_ma_benh;
    const tsgdMaBenh = extra.tsgd_ma_benh || extra.tsgdMaBenh || '';

    // Tiền sử bản thân (bẩm sinh / mãn tính)
    const tsbtMacBenh = extra.tsbt_mac_benh === '1' || extra.ts_mac_benh === 1 || extra.ts_mac_benh === '1' || extra.ts_benh_tat === '1' || !!extra.tsbt_ma_benh;
    const tsbtMaBenh = extra.tsbt_ma_benh || extra.tsbt_ma_benh_khac || extra.ts_benh_tat_chi_tiet || extra.ts_benh_tat_ma_benh || '';

    // Đang điều trị bệnh gì không
    const isDangDieuTri = extra.tsbt_dang_dieu_tri_benh === '1' || extra.dang_dieu_tri === '1' || !!extra.benh_dang_dieu_tri || !!extra.ten_thuoc;
    const chiTietDieuTri = extra.benh_dang_dieu_tri || extra.ten_thuoc || extra.tenThuoc || extra.chi_tiet_dieu_tri || '';

    return (
        <div className="font-serif text-black leading-tight select-text">
            <style>{`
                @page {
                    size: A4 portrait;
                    margin: 0;
                }
                .a4-page {
                    width: 210mm !important;
                    height: 297mm !important;
                    max-height: 297mm !important;
                    padding: 8mm 12mm 6mm 14mm !important;
                    margin: 0 auto !important;
                    box-sizing: border-box !important;
                    page-break-after: always !important;
                    break-after: page !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                    background: white !important;
                    font-family: "Times New Roman", Times, serif !important;
                    letter-spacing: normal !important;
                }
                .a4-page * {
                    font-family: "Times New Roman", Times, serif !important;
                    color: #000000 !important;
                }
                .a4-table {
                    border-collapse: collapse !important;
                    width: 100% !important;
                }
                .a4-table th, .a4-table td {
                    border: 1px solid #000000 !important;
                    padding: 2px 4px !important;
                    font-size: 11px !important;
                    line-height: 1.2 !important;
                    vertical-align: middle !important;
                }
                .a4-table th {
                    font-weight: bold !important;
                    background-color: #f3f4f6 !important;
                    text-align: center !important;
                }
            `}</style>

            {/* ==================== TRANG 1: TỰ KHAI HÀNH CHÍNH & TOÀN BỘ TIỀN SỬ + BỆNH NHÂN KÝ ==================== */}
            <div className="a4-page">
                <div className="flex flex-col justify-start space-y-1">
                    {/* Header: Quốc hiệu & Tên Cơ sở */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 w-[50%]">
                            {logoUrl && <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain shrink-0" />}
                            <div>
                                <strong className="text-[11px] uppercase block font-bold">{hospitalNameNormalized || 'BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH'}</strong>
                                <span className="text-[10px] block mt-0.5">Số: {docNormalized.doc_no || '....../GKSK-.........'}</span>
                            </div>
                        </div>
                        <div className="text-center w-[48%]">
                            <strong className="text-[11px] uppercase block font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
                            <strong className="text-[10px] block mt-0.5 font-bold">Độc lập - Tự do - Hạnh phúc</strong>
                            <div className="border-t border-black w-24 mx-auto mt-0.5"></div>
                        </div>
                    </div>

                    {/* Tiêu đề chính */}
                    <div className="text-center my-0.5">
                        <h1 className="text-[14.5px] font-bold uppercase tracking-wide">GIẤY KHÁM SỨC KHỎE</h1>
                        <div className="text-[10.5px] italic text-slate-700 font-medium">(Dùng cho người từ đủ 06 tuổi đến dưới 18 tuổi)</div>
                    </div>

                    {/* I. THÔNG TIN HÀNH CHÍNH */}
                    <div className="border-t border-black pt-0.5">
                        <div className="flex gap-3 items-start">
                            {/* Khung ảnh 4x6 */}
                            <div className="w-[95px] h-[120px] border border-black flex flex-col justify-center items-center text-center p-1 text-[10px] shrink-0">
                                <div>Ảnh (4 x 6 cm)</div>
                                <div className="text-[7.5px] mt-0.5 italic text-gray-500 leading-tight">(Đóng dấu giáp lai hoặc scan ảnh)</div>
                            </div>

                            {/* Cột thông tin hành chính bên cạnh ảnh */}
                            <div className="flex-grow space-y-0.5 text-[11.5px] leading-tight">
                                <div>
                                    <span className="font-bold">1. Họ và tên: </span>
                                    <strong className="uppercase font-bold text-[12px]">{docNormalized.patient_name || '................................'}</strong>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold">2. Giới tính: </span>
                                    {renderCheckbox(isNam, 'Nam')}
                                    {renderCheckbox(isNu, 'Nữ')}
                                </div>
                                <div>
                                    <span className="font-bold">3. Ngày sinh: </span>
                                    <span>{dobDetails.day}</span>/<span>{dobDetails.month}</span>/<span>{dobDetails.year}</span>
                                    <span className="ml-3 font-bold">Tuổi: </span><span>{getAge(docNormalized.dob)} tuổi</span>
                                </div>
                                <div>
                                    <span className="font-bold">4. Dân tộc: </span>
                                    <span>{clinical.nation || clinical.ethnic || 'Kinh'}</span>
                                    <span className="ml-3 font-bold">5. Nhóm máu: </span>
                                    <span>{clinical.blood_group || '...'}</span>
                                </div>
                                <div>
                                    <span className="font-bold">6. Số định danh/CCCD: </span>
                                    <span className="font-semibold">{docNormalized.cccd || '................................'}</span>
                                </div>
                                <div>
                                    <span className="font-bold">Cấp ngày: </span><span>{formatDateSafe(cccdDate)}</span>
                                    <span className="ml-2 font-bold">Tại: </span><span>{cccdPlace || '................................'}</span>
                                </div>
                                <div>
                                    <span className="font-bold">7. Đối tượng ưu tiên: </span>
                                    <span>{priorityGroupText}</span>
                                </div>
                            </div>
                        </div>

                        {/* Các dòng hành chính dưới ảnh */}
                        <div className="mt-1 space-y-0.5 text-[11.5px] leading-tight">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-bold">8. Họ tên Bố/Mẹ/Giám hộ: </span>
                                    <span>{extra.nguoi_giam_ho || '...'}</span>
                                </div>
                                <div>
                                    <span className="font-bold">Số định danh: </span>
                                    <span>{extra.so_cccd_ngh || '...'}</span>
                                </div>
                            </div>
                            <div>
                                <span className="font-bold">9. Chỗ ở hiện tại: </span>
                                <span>{(() => {
                                    const rawDetail = String(clinical.address || docNormalized.address || clinical.patient_address || '').trim();
                                    const provName = String(clinical.province || clinical.province_name || clinical.ten_tinh || extra.ten_tinh || extra.province || resolvedLocation?.province || '').trim();
                                    const wardName = String(clinical.ward || clinical.ward_name || clinical.ten_xa || extra.ten_xa || extra.ward || resolvedLocation?.ward || '').trim();
                                    const distName = String(clinical.district || clinical.district_name || clinical.ten_huyen || extra.ten_huyen || '').trim();
                                    const parts = [];
                                    if (rawDetail) parts.push(rawDetail);
                                    if (wardName && !rawDetail.toLowerCase().includes(wardName.toLowerCase())) parts.push(wardName);
                                    if (distName && !rawDetail.toLowerCase().includes(distName.toLowerCase()) && !wardName.toLowerCase().includes(distName.toLowerCase())) parts.push(distName);
                                    if (provName && !rawDetail.toLowerCase().includes(provName.toLowerCase())) parts.push(provName);
                                    return parts.length > 0 ? parts.join(', ') : '...';
                                })()}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-bold">10. Số điện thoại: </span>
                                    <span>{clinical.phone || '...'}</span>
                                </div>
                                <div>
                                    <span className="font-bold">11. Nguồn chi trả: </span>
                                    <span>{fundingSourceText}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-bold">Mã CSKCB: </span>
                                    <span className="font-semibold">{maCskcb || docNormalized.ma_cskcb || '8934285008135'}</span>
                                </div>
                                <div>
                                    <span className="font-bold">Ngày khám: </span>
                                    <span>{formatDateSafe(docNormalized.ngay_vao, '.../.../....')}</span>
                                </div>
                            </div>
                            <div>
                                <span className="font-bold">12. Lý do khám sức khỏe: </span>
                                <span className="font-semibold">{clinical.ly_do_vv || 'Khám sức khỏe định kỳ'}</span>
                            </div>
                        </div>
                    </div>

                    {/* TIỀN SỬ BỆNH TẬT */}
                    <div className="border-t border-black pt-0.5">
                        <h2 className="font-bold text-[12px] uppercase tracking-wide border-b border-black pb-0.5 mb-0.5">TIỀN SỬ BỆNH TẬT</h2>
                        
                        {/* 1. Tiền sử gia đình & 2.a Sản khoa */}
                        <div className="text-[11px] space-y-0.5 leading-tight">
                            <div>
                                <strong className="font-bold">1. Tiền sử gia đình: </strong>
                                Có ai mắc bệnh bẩm sinh/truyền nhiễm không? 
                                <span className="ml-2">{renderCheckbox(!tsgdMacBenh, 'Không')}</span>
                                <span>{renderCheckbox(tsgdMacBenh, 'Có')}</span>
                                {tsgdMacBenh && <span className="ml-1 font-bold">({formatIcd10String(tsgdMaBenh)})</span>}
                            </div>

                            <div>
                                <strong className="font-bold">2. Tiền sử bản thân: </strong>
                                <span className="font-bold">a) Sản khoa (lúc sinh): </span>
                                <span className="ml-2">{renderCheckbox(sanKhoaNormal, 'Bình thường')}</span>
                                <span>{renderCheckbox(sanKhoaAbnormal, 'Không bình thường')}</span>
                                {sanKhoaAbnormal && (
                                    <span className="inline-flex gap-2 pl-1 text-[10.5px]">
                                        {renderCheckbox(sk1, 'Đẻ thiếu tháng')}
                                        {renderCheckbox(sk2, 'Đẻ thừa cân')}
                                        {renderCheckbox(sk3, 'Có can thiệp')}
                                        {renderCheckbox(sk4, 'Đẻ ngạt')}
                                        {renderCheckbox(sk5, 'Mẹ mắc bệnh')}
                                        {sanKhoaMaBenh && <strong className="text-black">({formatIcd10String(sanKhoaMaBenh)})</strong>}
                                    </span>
                                )}
                            </div>

                            {/* 2.b Bảng tiêm chủng */}
                            <div className="pt-0.5">
                                <strong className="font-bold block mb-0.5">b) Tiêm chủng:</strong>
                                <table className="a4-table">
                                    <thead>
                                        <tr>
                                            <th className="w-[6%]">STT</th>
                                            <th className="w-[49%]">Loại vắc xin</th>
                                            <th className="w-[15%]">Có</th>
                                            <th className="w-[15%]">Không</th>
                                            <th className="w-[15%]">Không nhớ rõ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="text-center">1</td>
                                            <td>BCG (Lao)</td>
                                            <td className="text-center font-bold">{vacBcg.co ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacBcg.khong ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacBcg.khongNho ? 'x' : ''}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center">2</td>
                                            <td>Bạch hầu - Ho gà - Uốn ván (DPT)</td>
                                            <td className="text-center font-bold">{vacBhHgUv.co ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacBhHgUv.khong ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacBhHgUv.khongNho ? 'x' : ''}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center">3</td>
                                            <td>Sởi</td>
                                            <td className="text-center font-bold">{vacSoi.co ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacSoi.khong ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacSoi.khongNho ? 'x' : ''}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center">4</td>
                                            <td>Bại liệt (OPV/IPV)</td>
                                            <td className="text-center font-bold">{vacBaiLiet.co ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacBaiLiet.khong ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacBaiLiet.khongNho ? 'x' : ''}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center">5</td>
                                            <td>Viêm não Nhật Bản B</td>
                                            <td className="text-center font-bold">{vacVnnbB.co ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacVnnbB.khong ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacVnnbB.khongNho ? 'x' : ''}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center">6</td>
                                            <td>Viêm gan B</td>
                                            <td className="text-center font-bold">{vacVgb.co ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacVgb.khong ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacVgb.khongNho ? 'x' : ''}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center">7</td>
                                            <td>Vắc xin khác: <strong className="text-black">{tenVacXinKhac || ''}</strong></td>
                                            <td className="text-center font-bold">{vacKhac.co || tenVacXinKhac ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacKhac.khong ? 'x' : ''}</td>
                                            <td className="text-center font-bold">{vacKhac.khongNho ? 'x' : ''}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* 2.c & 2.d */}
                            <div className="pt-0.5">
                                <div>
                                    <strong className="font-bold">c) Tiền sử bệnh/tật bẩm sinh, mãn tính: </strong>
                                    <span className="ml-2">{renderCheckbox(!tsbtMacBenh, 'Không')}</span>
                                    <span>{renderCheckbox(tsbtMacBenh, 'Có')}</span>
                                    {tsbtMacBenh && <span className="ml-1 font-bold">({formatIcd10String(tsbtMaBenh)})</span>}
                                </div>
                                <div>
                                    <strong className="font-bold">d) Hiện tại có đang điều trị bệnh gì không: </strong>
                                    <span className="ml-2">{renderCheckbox(!isDangDieuTri, 'Không')}</span>
                                    <span>{renderCheckbox(isDangDieuTri, 'Có')}</span>
                                    {isDangDieuTri && <span className="ml-1 font-bold">({chiTietDieuTri})</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* LỜI CAM ĐOAN & CHỮ KÝ BỆNH NHÂN */}
                    <div className="pt-1">
                        <div className="text-[10.5px] italic mb-0.5">
                            Tôi xin cam đoan những điều khai trên đây hoàn toàn đúng với sự thật theo sự hiểu biết của tôi.
                        </div>

                        <div className="flex justify-end mt-1 px-4 text-[11px]">
                            <div className="text-center w-64">
                                <span className="italic block text-[11px]">Ngày {reportDate.day} tháng {reportDate.month} năm {reportDate.year}</span>
                                <strong className="block font-bold uppercase text-[11.5px] tracking-wide mt-0.5">NGƯỜI ĐỀ NGHỊ KHÁM SỨC KHỎE</strong>
                                <span className="italic text-[10px] text-slate-600 block mb-1">(Hoặc cha/mẹ/người giám hộ ký, ghi rõ họ tên)</span>
                                <div className="h-16"></div>
                                <strong className="font-bold text-[12.5px] block uppercase tracking-wide">{docNormalized.patient_name}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Page 1 */}
                <div className="text-right text-[10px] text-gray-500 font-sans border-t border-gray-300 pt-0.5">Trang 1/3</div>
            </div>

            {/* ==================== TRANG 2: BÁC SĨ KHÁM THỂ LỰC (I) & KHÁM LÂM SÀNG (II) ==================== */}
            <div className="a4-page">
                <div className="flex flex-col justify-start space-y-2">
                    {/* I. KHÁM THỂ LỰC */}
                    <div>
                        <h2 className="font-bold text-[13px] uppercase tracking-wide border-b border-black pb-0.5 mb-1.5">I. KHÁM THỂ LỰC</h2>
                        <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-[12.5px] border border-black p-2 bg-gray-50/40 rounded-xs">
                            <div>
                                <span className="font-bold">- Chiều cao: </span> <span>{examHeight || '.......'} cm</span>; 
                                <span className="font-bold ml-3">- Cân nặng: </span> <span>{examWeight || '.......'} kg</span>
                            </div>
                            <div>
                                <span className="font-bold">- Chỉ số BMI: </span> <span>{examBmi || '.......'}</span>
                            </div>
                            <div>
                                <span className="font-bold">- Mạch: </span> <span>{examPulse || '.......'} lần/phút</span>
                            </div>
                            <div>
                                <span className="font-bold">- Huyết áp: </span> <span>{examBp || '.......'} mmHg</span>
                            </div>
                            <div className="col-span-2 pt-1 border-t border-gray-300 mt-1">
                                <span className="font-bold">Phân loại thể lực: </span>
                                <div className="flex gap-4 mt-0.5 pl-2 flex-wrap">
                                    {renderCheckbox(physicalPl === '1', 'Loại I (Rất khỏe)')}
                                    {renderCheckbox(physicalPl === '2', 'Loại II (Khỏe)')}
                                    {renderCheckbox(physicalPl === '3', 'Loại III (Trung bình)')}
                                    {renderCheckbox(physicalPl === '4', 'Loại IV (Yếu)')}
                                    {renderCheckbox(physicalPl === '5', 'Loại V (Rất yếu)')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* II. KHÁM LÂM SÀNG */}
                    <div>
                        <h2 className="font-bold text-[13px] uppercase tracking-wide border-b border-black pb-0.5 mb-1.5">II. KHÁM LÂM SÀNG</h2>
                        <table className="a4-table">
                            <thead>
                                <tr>
                                    <th className="w-[70%]">Nội dung khám</th>
                                    <th className="w-[30%]">Họ tên, chữ ký của Bác sĩ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="font-bold">
                                    <td colSpan={2} className="bg-gray-100/70 py-1">1. Nhi khoa</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">a) Tuần hoàn: </span>
                                        <span>{clinicalExam.nhi_tuan_hoan || clinicalExam.tuan_hoan || clinicalExam.tim_mach || clinicalExam.kq_tim_mach || clinicalExam.noi_khoa_tuan_hoan || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('tuan_hoan')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('tuan_hoan')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">b) Hô hấp: </span>
                                        <span>{clinicalExam.nhi_ho_hap || clinicalExam.ho_hap || clinicalExam.kq_ho_hap || clinicalExam.noi_khoa_ho_hap || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('ho_hap')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('ho_hap')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">c) Tiêu hóa: </span>
                                        <span>{clinicalExam.nhi_tieu_hoa || clinicalExam.tieu_hoa || clinicalExam.kq_tieu_hoa || clinicalExam.noi_khoa_tieu_hoa || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('tieu_hoa')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('tieu_hoa')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">d) Thận - Tiết niệu, Sinh dục: </span>
                                        <span>{clinicalExam.nhi_tiet_nieu || clinicalExam.nhi_sinh_duc || clinicalExam.than_tiet_nieu || clinicalExam.kq_tiet_nieu || clinicalExam.kq_sinh_duc || clinicalExam.tiet_nieu_sinh_duc || clinicalExam.noi_khoa_than_tn_sd || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('than_tiet_nieu')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('than_tiet_nieu')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">đ) Thần kinh: </span>
                                        <span>{clinicalExam.nhi_than_kinh || clinicalExam.than_kinh || clinicalExam.kq_than_kinh || clinicalExam.noi_khoa_than_kinh || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('than_kinh')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('than_kinh')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">e) Tâm thần: </span>
                                        <span>{clinicalExam.nhi_tam_than || clinicalExam.tam_than || clinicalExam.kq_tam_than || clinicalExam.noi_khoa_tam_than || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('tam_than')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('tam_than')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">g) Khám lâm sàng khác: </span>
                                        <span>{clinicalExam.nhi_khoa_lam_sang_khac || clinicalExam.nhi_khac || clinicalExam.lam_sang_khac || extra.nhi_khoa_lam_sang_khac || 'Bình thường'}</span>
                                        {renderPl('lam_sang_khac')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('lam_sang_khac')}</td>
                                </tr>

                                <tr className="font-bold">
                                    <td colSpan={2} className="bg-gray-100/70 py-1">2. Ngoại khoa, Da liễu</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">- Ngoại khoa: </span>
                                        <span>{clinicalExam.external || clinicalExam.kq_ngoai_khoa || clinicalExam.kham_ngoai_khoa || clinicalExam.ngoai_khoa || 'Bình thường'}</span>
                                        {renderPl('ngoai_khoa')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('ngoai_khoa')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">- Da liễu: </span>
                                        <span>{clinicalExam.dermatology || clinicalExam.kq_da_lieu || clinicalExam.kham_da_lieu || clinicalExam.da_lieu || 'Bình thường'}</span>
                                        {renderPl('da_lieu')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('da_lieu')}</td>
                                </tr>

                                <tr className="font-bold">
                                    <td colSpan={2} className="bg-gray-100/70 py-1">3. Mắt</td>
                                </tr>
                                <tr>
                                    <td>
                                        <div className="space-y-0.5 pl-1">
                                            <div>
                                                <span className="font-semibold">Thị lực không kính: </span>
                                                Mắt phải: <strong>{clinicalExam.khong_kinh_mat_phai || '10/10'}</strong>, Mắt trái: <strong>{clinicalExam.khong_kinh_mat_trai || '10/10'}</strong>
                                            </div>
                                            <div>
                                                <span className="font-semibold">Thị lực có kính: </span>
                                                Mắt phải: <strong>{clinicalExam.co_kinh_mat_phai || '...'}</strong>, Mắt trái: <strong>{clinicalExam.co_kinh_mat_trai || '...'}</strong>
                                            </div>
                                            <div>
                                                <span className="font-semibold">Các bệnh về mắt: </span>
                                                <span>{clinicalExam.benh_ve_mat || clinicalExam.eye || 'Không'}</span>
                                            </div>
                                        </div>
                                        {renderPl('mat')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('mat')}</td>
                                </tr>

                                <tr className="font-bold">
                                    <td colSpan={2} className="bg-gray-100/70 py-1">4. Tai - Mũi - Họng</td>
                                </tr>
                                <tr>
                                    <td>
                                        <div className="space-y-0.5 pl-1">
                                            <div className="grid grid-cols-2 gap-1">
                                                <div>Tai trái: Nói thường <strong>{clinicalExam.tai_trai_noi_thuong || '5'}</strong>m, Nói thầm <strong>{clinicalExam.tai_trai_noi_tham || '0.5'}</strong>m</div>
                                                <div>Tai phải: Nói thường <strong>{clinicalExam.tai_phai_noi_thuong || '5'}</strong>m, Nói thầm <strong>{clinicalExam.tai_phai_noi_tham || '0.5'}</strong>m</div>
                                            </div>
                                            <div>
                                                <span className="font-semibold">Các bệnh về tai mũi họng: </span>
                                                <span>{clinicalExam.benh_tai_mui_hong || clinicalExam.ent || 'Không'}</span>
                                            </div>
                                        </div>
                                        {renderPl('tai_mui_hong')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('tai_mui_hong')}</td>
                                </tr>

                                <tr className="font-bold">
                                    <td colSpan={2} className="bg-gray-100/70 py-1">5. Răng - Hàm - Mặt</td>
                                </tr>
                                <tr>
                                    <td>
                                        <div className="space-y-0.5 pl-1">
                                            <div>
                                                Hàm trên: <span className="font-semibold">{clinicalExam.ham_tren || 'Bình thường'}</span>; 
                                                Hàm dưới: <span className="font-semibold">{clinicalExam.ham_duoi || 'Bình thường'}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold">Các bệnh về răng hàm mặt: </span>
                                                <span>{clinicalExam.benh_rang_ham_mat || clinicalExam.dental || 'Không'}</span>
                                            </div>
                                        </div>
                                        {renderPl('rang_ham_mat')}
                                    </td>
                                    <td className="text-center">{renderDoctorCell('rang_ham_mat')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Page 2 */}
                <div className="text-right text-[10px] text-gray-500 font-sans border-t border-gray-300 pt-0.5">Trang 2/3</div>
            </div>

            {/* ==================== TRANG 3: CẬN LÂM SÀNG (III) & KẾT LUẬN CHUNG (IV) ==================== */}
            <div className="a4-page">
                <div className="flex flex-col justify-start space-y-2">
                    {/* III. KHÁM CẬN LÂM SÀNG */}
                    <div>
                        <h2 className="font-bold text-[13px] uppercase tracking-wide border-b border-black pb-0.5 mb-1.5">III. KHÁM CẬN LÂM SÀNG</h2>
                        <table className="a4-table">
                            <thead>
                                <tr>
                                    <th className="w-[70%]">Nội dung khám</th>
                                    <th className="w-[30%]">Họ tên, chữ ký của Bác sĩ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const validCls = (paraclinicalItems || []).filter((item: any) => {
                                        const val = String(item.value || item.conclusion || item.description || item.result || item.service_name || '').trim();
                                        return val !== '' && val !== 'undefined' && val !== 'null' && val !== '...';
                                    });

                                    const bloodTests: any[] = [];
                                    if (lab.blood_test?.glycemia || lab.blood_test?.glucose) bloodTests.push(`- Glucose: ${lab.blood_test?.glycemia || lab.blood_test?.glucose} mmol/L`);
                                    if (lab.blood_test?.urea || lab.urea) bloodTests.push(`- Urê: ${lab.blood_test?.urea || lab.urea} mmol/L`);
                                    if (lab.blood_test?.creatinine || lab.creatinine) bloodTests.push(`- Creatinin: ${lab.blood_test?.creatinine || lab.creatinine} µmol/L`);
                                    if (lab.blood_test?.ast || lab.blood_test?.asat) bloodTests.push(`- ASAT (GOT): ${lab.blood_test?.ast || lab.blood_test?.asat} U/L`);
                                    if (lab.blood_test?.alt || lab.blood_test?.alat) bloodTests.push(`- ALAT (GPT): ${lab.blood_test?.alt || lab.blood_test?.alat} U/L`);

                                    const urineTests: any[] = [];
                                    if (lab.urine_test?.protein || lab.protein) urineTests.push(`- Tổng phân tích nước tiểu (Protein: ${lab.urine_test?.protein || lab.protein} g/L)`);

                                    const imagingTests: any[] = [];
                                    if (lab.imaging?.ket_qua || lab.x_quang || lab.xq) imagingTests.push(`- X-quang: ${lab.imaging?.ket_qua || lab.x_quang || lab.xq}`);
                                    if (lab.us?.ket_qua || lab.sieu_am) imagingTests.push(`- Siêu âm: ${lab.us?.ket_qua || lab.sieu_am}`);

                                    const hasAnyCls = validCls.length > 0 || bloodTests.length > 0 || urineTests.length > 0 || imagingTests.length > 0 || !!extra.cls_khac;

                                    if (!hasAnyCls) {
                                        return (
                                            <tr>
                                                <td className="py-2 text-center text-slate-500 italic">
                                                    Không có chỉ định hoặc chưa có kết quả cận lâm sàng
                                                </td>
                                                <td className="text-center">{renderDoctorCell('lab')}</td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <>
                                            {/* 1. Nếu có kết quả dạng bảng linh hoạt từ HIS / Chỉ định thực tế */}
                                            {validCls.length > 0 ? (
                                                <tr>
                                                    <td>
                                                        <div className="space-y-1 text-[11.5px]">
                                                            {validCls.map((item: any, idx: number) => (
                                                                <div key={idx} className="flex justify-between border-b border-gray-100 last:border-0 pb-0.5">
                                                                    <span>- <strong>{item.service_name || item.name}</strong>: {item.value || item.conclusion || item.result} {item.unit ? `(${item.unit})` : ''}</span>
                                                                    {item.reference_range && <span className="text-gray-500 text-[10.5px]">[{item.reference_range}]</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="text-center">{renderDoctorCell('lab')}</td>
                                                </tr>
                                            ) : (
                                                <>
                                                    {bloodTests.length > 0 && (
                                                        <tr>
                                                            <td>
                                                                <strong className="font-bold block">1. Xét nghiệm máu:</strong>
                                                                <div className="pl-2 text-[11.5px] grid grid-cols-2 gap-y-0.5 gap-x-2 mt-0.5">
                                                                    {bloodTests.map((t, idx) => <div key={idx}>{t}</div>)}
                                                                </div>
                                                            </td>
                                                            <td className="text-center">{renderDoctorCell('lab')}</td>
                                                        </tr>
                                                    )}
                                                    {urineTests.length > 0 && (
                                                        <tr>
                                                            <td>
                                                                <strong className="font-bold block">2. Xét nghiệm nước tiểu:</strong>
                                                                <div className="pl-2 text-[11.5px] mt-0.5">
                                                                    {urineTests.map((t, idx) => <div key={idx}>{t}</div>)}
                                                                </div>
                                                            </td>
                                                            <td className="text-center">{renderDoctorCell('lab')}</td>
                                                        </tr>
                                                    )}
                                                    {imagingTests.length > 0 && (
                                                        <tr>
                                                            <td>
                                                                <strong className="font-bold block">3. Chẩn đoán hình ảnh:</strong>
                                                                <div className="pl-2 text-[11.5px] mt-0.5">
                                                                    {imagingTests.map((t, idx) => <div key={idx}>{t}</div>)}
                                                                </div>
                                                            </td>
                                                            <td className="text-center">{renderDoctorCell('imaging')}</td>
                                                        </tr>
                                                    )}
                                                    {extra.cls_khac && (
                                                        <tr>
                                                            <td>
                                                                <strong className="font-bold block">4. Cận lâm sàng khác:</strong>
                                                                <div className="pl-2 text-[11.5px] mt-0.5">
                                                                    - Chi tiết: <span>{extra.cls_khac}</span>
                                                                </div>
                                                            </td>
                                                            <td className="text-center"></td>
                                                        </tr>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                                <tr>
                                    <td className="py-1">
                                        <strong className="font-bold">Đánh giá cận lâm sàng: </strong>
                                        <span className="font-semibold">{conclusion.danh_gia || lab.danh_gia_cls || 'Bình thường'}</span>
                                    </td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td className="py-1">
                                        <strong className="font-bold">Kết luận cận lâm sàng: </strong>
                                        <span className="font-semibold">{conclusion.diagnosis ? formatIcd10String(conclusion.diagnosis) : (lab.ket_luan_cls || 'Bình thường')}</span>
                                    </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* IV. KẾT LUẬN CHUNG */}
                    <div className="border-t border-black pt-2 mt-1">
                        <h2 className="font-bold text-[13px] uppercase tracking-wide mb-1.5">IV. KẾT LUẬN CHUNG</h2>
                        
                        <div className="text-[12.5px] space-y-1.5 leading-relaxed">
                            <div className="flex gap-6 items-center">
                                {renderCheckbox((conclusion.is_normal === '1' || conclusion.is_normal === 1 || !conclusion.diagnosis), 'Sức khỏe bình thường')}
                                {renderCheckbox((conclusion.is_normal === '0' || conclusion.is_normal === 0 || !!conclusion.diagnosis), 'Các vấn đề sức khỏe cần lưu ý / Bệnh tật')}
                            </div>
                            
                            {(conclusion.is_normal === '0' || conclusion.is_normal === 0 || !!conclusion.diagnosis) && (
                                <div className="pl-3 font-bold text-slate-900 mt-0.5">
                                    Chẩn đoán: {conclusion.diagnosis ? formatIcd10String(conclusion.diagnosis) : '...'}
                                </div>
                            )}

                            {conclusion.cac_van_de_luu_y && (
                                <div className="pl-3 text-[12px] italic text-slate-700">
                                    Lưu ý: {conclusion.cac_van_de_luu_y}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chữ ký Người kết luận */}
                    <div className="flex justify-end mt-4 px-6 text-[12.5px]">
                        <div className="text-center w-72 flex flex-col items-center">
                            <span className="italic block mb-0.5 text-[11.5px]">Ngày {reportDate.day} tháng {reportDate.month} năm {reportDate.year}</span>
                            <strong className="block font-bold uppercase tracking-wider text-[12px]">NGƯỜI KẾT LUẬN</strong>
                            <span className="italic text-[10px] block mb-2">(Ký, ghi rõ họ tên và đóng dấu)</span>
                            
                            {(() => {
                                if (docNormalized.signature_status === 'Signed') {
                                    return (
                                        <div className="my-1 p-1.5 border border-green-600 rounded bg-green-50/60 text-[10px] font-bold text-green-800 leading-tight text-left w-full shadow-xs max-w-[210px] font-sans">
                                            <div className="flex items-center gap-1 mb-0.5 text-green-900">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                                <span>ĐÃ KÝ SỐ ĐIỆN TỬ</span>
                                            </div>
                                            Đơn vị: {hospitalNameNormalized || 'Bệnh viện đa khoa tỉnh Ninh Bình'}<br/>
                                            Ngày ký: {docNormalized.updated_at ? new Date(docNormalized.updated_at).toLocaleString('vi-VN') : `${reportDate.day}/${reportDate.month}/${reportDate.year}`}
                                        </div>
                                    );
                                }
                                return <div className="h-12"></div>;
                            })()}
                            
                            <strong className="font-bold text-[13px] mt-1 block">{getConclusionDoctorName()}</strong>
                        </div>
                    </div>
                </div>

                {/* Footer Page 3 */}
                <div className="text-right text-[10px] text-gray-500 font-sans border-t border-gray-300 pt-0.5">Trang 3/3</div>
            </div>
        </div>
    );
};
