import React from 'react';
import { VIMES_LOGO_BASE64 } from '../../../config/vimesLogoBase64';
import { formatDate, parseDateSafe } from '../../../utils/formatters';

interface PrintFormMau1Props {
    resolvedLocation?: { province?: string; ward?: string };
    document: any;
    hospitalName: string;
    logoUrl?: string;
    getReportDate: () => { day: number; month: number; year: number };
    getConclusionDoctorName: () => string;
    doctors?: any[];
    icd10Names?: Record<string, string>;
    COMMON_ICD10?: { code: string; name: string }[];
    maCskcb?: string;
    doctorSignatures?: Record<string, string>;
}

const TARGET_GROUP_MAP: Record<string, string> = {
    '1': '1 - Người cao tuổi',
    '2': '2 - Người khuyết tật',
    '3': '3 - Người thuộc hộ nghèo, cận nghèo',
    '4': '4 - Người có công',
    '5': '5 - Người mắc bệnh mạn tính',
    '6': '6 - Người sống tại vùng đồng bào DTTS & miền núi',
    '7': '7 - Người sống tại vùng ĐK KTXH đặc biệt khó khăn',
    '8': '8 - Người sống tại xã đảo',
    '9': '9 - Người sống tại đặc khu',
    '10': '10 - Trẻ em trong cơ sở giáo dục mầm non',
    '11': '11 - Học sinh trong các cơ sở giáo dục phổ thông',
    '12': '12 - Sinh viên',
    '13': '13 - Người lao động',
    '14': '14 - Người lao động không chính thức',
    '15': '15 - Người chưa có Bảo hiểm y tế',
    '16': '16 - Các đối tượng khác'
};

const FUNDING_SOURCE_MAP: Record<string, string> = {
    '1': '1 - Ngân sách Trung ương',
    '2': '2 - Ngân sách Địa phương',
    '3': '3 - Quỹ Bảo hiểm y tế',
    '4': '4 - Người sử dụng lao động',
    '5': '5 - Xã hội hóa',
    '9': '9 - Khác'
};

const ETHNIC_MAP: Record<string, string> = {
    '01': 'Kinh',
    '02': 'Tày',
    '03': 'Thái',
    '04': 'Hoa',
    '05': 'Khơ-me',
    '06': 'Mường',
    '07': 'Nùng',
    '08': 'HMông',
    '09': 'Dao',
    '10': 'Gia-rai',
    '11': 'Ê-đê',
    '12': 'Ba-na',
    '13': 'Xơ-đăng',
    '14': 'Sán Chay',
    '15': 'Cơ-ho',
    '16': 'Chăm',
    '17': 'Sán Dìu',
    '18': 'Hrê',
    '19': 'Mnông',
    '20': 'Ra-glai'
};

export const PrintFormMau1: React.FC<PrintFormMau1Props> = ({
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
    const extra = rawClinical.extra || {};
    const examination = rawClinical.examination || {};
    const clinical = { ...examination, ...rawClinical };
    const rawLab = docNormalized.lab_data || docNormalized.labData || rawClinical.lab || {};
    const lab = { ...rawLab, ...(rawClinical.lab || {}) };
    const rawConclusion = docNormalized.conclusion_data || docNormalized.conclusionData || rawClinical.conclusion || {};
    const conclusion = { ...rawConclusion, ...(rawClinical.conclusion || {}) };
    const paraclinicalItems: any[] = lab.paraclinical_items || lab.paraclinicalItems || [];

    const formatIcd10String = (codeStr: any) => {
        if (!codeStr) return '';
        const raw = String(codeStr).trim();
        if (!raw) return '';
        const codes = raw.split(/[,;\+]/).map(s => s.trim()).filter(Boolean);
        const formatted = codes.map(code => {
            const upper = code.toUpperCase();
            const localMatch = (COMMON_ICD10 || []).find(item => item.code.toUpperCase() === upper);
            if (localMatch) {
                return `${upper} - ${localMatch.name}`;
            }
            const apiMatch = (icd10Names || {})[upper];
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
        if (plStr === '1' || plStr === 'I') return 'Loại I';
        if (plStr === '2' || plStr === 'II') return 'Loại II';
        if (plStr === '3' || plStr === 'III') return 'Loại III';
        if (plStr === '4' || plStr === 'IV') return 'Loại IV';
        if (plStr === '5' || plStr === 'V') return 'Loại V';
        return plStr.startsWith('Loại') ? plStr : `Loại ${plStr}`;
    };

    const normalizeSignatureKey = (value: any) => String(value || '')
        .trim()
        .toUpperCase()
        .replace(/^HMS_/, '')
        .replace(/\.JPE?G\.?$/, '');

    const renderCheckbox = (checked: boolean, label: string) => (
        <span className="inline-flex items-center gap-1 mr-3 text-[12px] whitespace-nowrap">
            <span className="inline-block w-3.5 h-3.5 border border-black text-[10px] leading-none font-sans font-bold text-center flex items-center justify-center shrink-0" style={{ transform: 'translateY(-0.5px)' }}>
                {checked ? 'x' : ''}
            </span>
            <span>{label}</span>
        </span>
    );

    // Gender
    const isChildNam = docNormalized.gender === 'Nam' || docNormalized.gender === '1' || docNormalized.gender === 1;
    const isChildNu = docNormalized.gender === 'Nữ' || docNormalized.gender === '2' || docNormalized.gender === '0' || docNormalized.gender === 2 || docNormalized.gender === 0;

    // Sinh non
    const isSinhNon = extra.sinh_non === '1' || extra.sinhNon === '1' || extra.sinh_non === true;
    const isNotSinhNon = extra.sinh_non === '0' || extra.sinhNon === '0' || extra.sinh_non === false || !extra.sinh_non;

    // Mối quan hệ
    const rel = String(extra.moi_quan_he_voi_tre || '').trim().toLowerCase();
    const isCha = rel.includes('cha') || rel.includes('bố') || rel === '1';
    const isMe = rel.includes('mẹ') || rel === '2';
    const isOngBa = rel.includes('ông') || rel.includes('bà') || rel === '3';
    const isAnhChi = rel.includes('anh') || rel.includes('chị') || rel === '4';
    const isHoHang = rel.includes('họ hàng') || rel.includes('bác') || rel.includes('chú') || rel.includes('cô') || rel.includes('dì') || rel === '5';
    const isKhac = !isCha && !isMe && !isOngBa && !isAnhChi && !isHoHang && rel !== '';

    // Tiền sử
    const hasTsbt = extra.tsbt_mac_benh === '1' || extra.tsbtMacBenh === '1' || (!!extra.ts_ban_than && extra.ts_ban_than !== '0' && extra.ts_ban_than.toLowerCase() !== 'không') || !!extra.tsbt_ma_benh || !!extra.tsbtMaBenh;
    const tsbtCodes = extra.tsbt_ma_benh || extra.tsbtMaBenh || '';
    const tsbtDesc = String(extra.ts_ban_than || '').trim();
    const tsbtText = [tsbtCodes ? `Mã ICD: ${formatIcd10String(tsbtCodes)}` : '', tsbtDesc].filter(Boolean).join(' - ');

    const hasTsgd = extra.tsgd_mac_benh === '1' || extra.tsgdMacBenh === '1' || (!!extra.ts_gia_dinh && extra.ts_gia_dinh !== '0' && extra.ts_gia_dinh.toLowerCase() !== 'không') || !!extra.tsgd_ma_benh || !!extra.tsgdMaBenh;
    const tsgdCodes = extra.tsgd_ma_benh || extra.tsgdMaBenh || '';
    const tsgdDesc = String(extra.ts_gia_dinh || '').trim();
    const tsgdText = [tsgdCodes ? `Mã ICD: ${formatIcd10String(tsgdCodes)}` : '', tsgdDesc].filter(Boolean).join(' - ');

    const isLaoExposed = extra.ts_tiep_xuc_lao === '1' || extra.ts_tiep_xuc_lao === true || extra.tsTiepXucLao === '1';
    const isNghienRuou = extra.tsbt_nghien_ruou === '1' || extra.tsbtNghienRuou === '1';
    const tsbtMaBenhKhac = extra.tsbt_ma_benh_khac || extra.tsbtMaBenhKhac || '';

    // Dấu hiệu sinh tồn
    const isNhietDoNormal = extra.dg_dhst_nhiet_do === '1';
    const isNhietDoHal = extra.dg_dhst_nhiet_do === '3';
    const isNhietDoSot = extra.dg_dhst_nhiet_do === '2' || (!isNhietDoNormal && !isNhietDoHal && !!extra.dg_dhst_nhiet_do && extra.dg_dhst_nhiet_do !== '0');

    const isMachNormal = extra.dg_dhst_mach === '1';
    const isMachNhanh = extra.dg_dhst_mach === '2' || (!isMachNormal && !!extra.dg_dhst_mach && extra.dg_dhst_mach !== '0');

    const isNhipThoNormal = extra.dg_dhst_nhip_tho === '1';
    const isNhipThoCham = extra.dg_dhst_nhip_tho === '3';
    const isNhipThoNhanh = extra.dg_dhst_nhip_tho === '2' || (!isNhipThoNormal && !isNhipThoCham && !!extra.dg_dhst_nhip_tho && extra.dg_dhst_nhip_tho !== '0');

    // Dinh dưỡng
    const isVongDauNormal = extra.dg_vong_dau === '1';
    const isVongDauTo = extra.dg_vong_dau === '2';
    const isVongDauNho = extra.dg_vong_dau === '3';

    // Dân tộc
    const getEthnicDisplay = () => {
        const rawEthnic = String(clinical.ethnic || clinical.nation || '').trim();
        if (ETHNIC_MAP[rawEthnic]) return ETHNIC_MAP[rawEthnic];
        if (rawEthnic && isNaN(Number(rawEthnic))) return rawEthnic;
        return 'Kinh';
    };

    // Đối tượng
    const getTargetGroupDisplay = () => {
        const rawTg = String(clinical.target_group || clinical.doi_tuong || '').trim();
        if (TARGET_GROUP_MAP[rawTg]) return TARGET_GROUP_MAP[rawTg];
        return rawTg || '10 - Trẻ em trong cơ sở giáo dục mầm non';
    };

    // Nguồn chi trả
    const getFundingSourceDisplay = () => {
        const rawFs = String(clinical.funding_source || clinical.nguon_chi_tra || '').trim();
        if (FUNDING_SOURCE_MAP[rawFs]) return FUNDING_SOURCE_MAP[rawFs];
        return rawFs || '3 - Quỹ Bảo hiểm y tế';
    };

    // Format ngày khám
    const getExamDateDisplay = () => {
        if (docNormalized.created_at) return formatDate(docNormalized.created_at);
        if (docNormalized.ngay_vao) return formatDate(docNormalized.ngay_vao);
        return '.../.../....';
    };

    // Extract Lab values safely
    const hasBloodTestData = !!(lab.hemoglobin || lab.glycemia || lab.chi_so_hc || lab.chi_so_bach_cau || lab.chi_so_tieu_cau || lab.ure || lab.creatinin || lab.asat_ast || lab.alat_alt);
    const hasUrineTestData = !!(lab.duong_nuoc_tieu || lab.protein_nuoc_tieu || lab.nuoc_tieu_khac);
    const hasOtherLabData = !!(lab.other_result || (paraclinicalItems && paraclinicalItems.length > 0));

    return (
        <>
            {/* ==================== CHILD PAGE 1 ==================== */}
            <div className="a4-page overflow-hidden">
                <div className="flex justify-between items-start text-[12px] leading-relaxed mb-2">
                    <div className="flex items-center gap-3">
                        <img src={logoUrl || VIMES_LOGO_BASE64} alt="Logo" className="h-10 w-auto object-contain shrink-0" />
                        <div>
                            <strong className="block uppercase font-bold text-[13px]">{hospitalNameNormalized || 'BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH'}</strong>
                            <div>Số: {docNormalized.doc_no || '....../GKSK-.........'}</div>
                        </div>
                    </div>
                    <div className="text-center">
                        <strong className="block uppercase font-bold text-[12.5px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
                        <strong className="block font-bold underline text-[12px] tracking-wider">Độc lập - Tự do - Hạnh phúc</strong>
                        <div className="italic text-[11px] mt-0.5">............., ngày {getReportDate().day} tháng {getReportDate().month} năm 20{getReportDate().year % 100}</div>
                    </div>
                </div>

                <div className="text-center my-2">
                    <h1 className="text-[15px] font-bold uppercase leading-tight tracking-wide">
                        MẪU GIẤY KHÁM SỨC KHỎE VÀ KHÁM SỨC KHỎE ĐỊNH KỲ DÙNG<br />
                        CHO TRẺ EM DƯỚI 06 TUỔI
                    </h1>
                </div>

                <h2 className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mt-2 mb-1.5 tracking-wide text-center">THÔNG TIN HÀNH CHÍNH</h2>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] leading-snug">
                    <div>1. Họ và tên (In hoa): <strong className="uppercase font-bold text-[13px]">{docNormalized.patient_name || docNormalized.ho_ten}</strong></div>
                    <div>2. Mã định danh (CCCD): <strong>{docNormalized.cccd || docNormalized.so_cccd || '................................'}</strong></div>

                    <div>3. Ngày sinh: <strong>{docNormalized.dob ? formatDate(docNormalized.dob) : '.../.../....'}</strong></div>
                    <div className="flex items-center">
                        <span className="mr-2">4. Giới:</span>
                        {renderCheckbox(isChildNam, 'Nam')}
                        {renderCheckbox(isChildNu, 'Nữ')}
                    </div>

                    <div className="flex items-center">
                        <span className="mr-2">5. Sinh non:</span>
                        {renderCheckbox(isSinhNon, 'Có')}
                        {renderCheckbox(isNotSinhNon, 'Không')}
                    </div>
                    <div>6. Tuần thai khi sinh: <strong>{extra.tuan_thai_khi_sinh || extra.tuan_thai || '...'}</strong> tuần</div>

                    <div>7. Cân nặng lúc sinh: <strong>{extra.can_nang_luc_sinh || '...'}</strong> {extra.can_nang_luc_sinh ? (Number(extra.can_nang_luc_sinh) > 50 ? 'gram' : 'kg') : ''}</div>
                    <div>8. Dân tộc: <strong>{getEthnicDisplay()}</strong></div>

                    <div>9. Đối tượng: <strong>{getTargetGroupDisplay()}</strong></div>
                    <div>10. Nguồn chi trả: <strong>{getFundingSourceDisplay()}</strong></div>

                    <div>11. Nhóm máu: <strong>{clinical.blood_group || '...'}</strong></div>
                    <div>12. Điện thoại liên hệ: <strong>{clinical.phone || docNormalized.phone || '................................'}</strong></div>

                    <div className="col-span-2">
                        13. Nơi ở hiện tại: <strong>{(() => {
                            const rawDetail = String(clinical.address || docNormalized.address || '').trim();
                            const provName = String(clinical.province || clinical.province_name || clinical.ten_tinh || extra.ten_tinh || extra.province || resolvedLocation?.province || '').trim();
                            const wardName = String(clinical.ward || clinical.ward_name || clinical.ten_xa || extra.ten_xa || extra.ward || resolvedLocation?.ward || '').trim();
                            const distName = String(clinical.district || clinical.district_name || clinical.ten_huyen || extra.ten_huyen || '').trim();

                            const parts = [];
                            if (rawDetail) parts.push(rawDetail);
                            if (wardName && !rawDetail.toLowerCase().includes(wardName.toLowerCase())) parts.push(wardName);
                            if (distName && !rawDetail.toLowerCase().includes(distName.toLowerCase()) && !wardName.toLowerCase().includes(distName.toLowerCase())) parts.push(distName);
                            if (provName && !rawDetail.toLowerCase().includes(provName.toLowerCase())) parts.push(provName);

                            return parts.length > 0 ? parts.join(', ') : '................................';
                        })()}</strong>
                    </div>

                    <div>14. Họ tên người đi cùng trẻ: <strong>{extra.ho_ten_nguoi_di_cung || '................................'}</strong></div>
                    <div>15. Mã định danh/CCCD người đi cùng: <strong>{extra.so_cccd_nguoi_di_cung || '................................'}</strong></div>

                    <div className="col-span-2 flex items-center flex-wrap">
                        <span className="mr-2">16. Mối quan hệ với trẻ:</span>
                        {renderCheckbox(isCha, 'Cha')}
                        {renderCheckbox(isMe, 'Mẹ')}
                        {renderCheckbox(isOngBa, 'Ông/bà')}
                        {renderCheckbox(isAnhChi, 'Anh/chị')}
                        {renderCheckbox(isHoHang, 'Họ hàng')}
                        {renderCheckbox(isKhac, 'Khác')}
                    </div>

                    <div>17. Họ tên bố/mẹ/người giám hộ: <strong>{extra.nguoi_giam_ho || docNormalized.guardian_name || extra.ho_ten_nguoi_di_cung || '................................'}</strong></div>
                    <div>18. Số định danh người giám hộ: <strong>{extra.so_cccd_ngh || docNormalized.guardian_cccd || extra.so_cccd_nguoi_di_cung || '................................'}</strong></div>

                    <div>19. Con thứ mấy: <strong>{extra.con_thu_may || '...'}</strong></div>
                    <div>20. Tổng số con: <strong>{extra.tong_so_con || '...'}</strong></div>

                    <div>21. Ngày khám: <strong>{getExamDateDisplay()}</strong></div>
                    <div>22. Cơ sở khám: <strong>{maCskcb || clinical.ma_gtin_cskcb || clinical.ma_cskcb || hospitalNameNormalized}</strong></div>
                    
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div>Loại hình khám bệnh, chữa bệnh: <strong>{clinical.loai_hinh_kcb === '01' ? '01 - Khám bệnh' : clinical.loai_hinh_kcb === '02' ? '02 - Chữa bệnh' : clinical.loai_hinh_kcb === '03' ? '03 - Khám bệnh, chữa bệnh' : clinical.loai_hinh_kcb === '04' ? '04 - Khám sức khỏe' : clinical.loai_hinh_kcb || '04 - Khám sức khỏe'}</strong></div>
                        <div>23. Lý do khám: <strong>{clinical.ly_do_vv || 'Khám sức khỏe định kỳ'}</strong></div>
                    </div>

                    {/* TIỀN SỬ */}
                    <div className="col-span-2 space-y-1 mt-1 border-t border-dashed border-slate-300 pt-1">
                        <div className="font-bold">24. Tiền sử bệnh/tật:</div>
                        <div className="pl-4 flex items-center">
                            <span className="w-24 font-medium">- Bản thân:</span>
                            {renderCheckbox(hasTsbt, 'Có')}
                            {renderCheckbox(!hasTsbt, 'Không')}
                            <span className="ml-2">(ghi rõ tên bệnh nếu có): <strong>{hasTsbt ? (tsbtText || '...') : '...'}</strong></span>
                        </div>
                        <div className="pl-4 flex items-center">
                            <span className="w-24 font-medium">- Gia đình:</span>
                            {renderCheckbox(hasTsgd, 'Có')}
                            {renderCheckbox(!hasTsgd, 'Không')}
                            <span className="ml-2">(ghi rõ tên bệnh nếu có): <strong>{hasTsgd ? (tsgdText || '...') : '...'}</strong></span>
                        </div>
                        <div className="pl-4 flex items-center">
                            <span className="w-64 font-medium">- Tiền sử tiếp xúc người bệnh lao:</span>
                            {renderCheckbox(isLaoExposed, 'Có')}
                            {renderCheckbox(!isLaoExposed, 'Không')}
                        </div>
                        <div className="pl-4 flex items-center">
                            <span className="w-64 font-medium">- Tiền sử nghiện rượu, bia:</span>
                            {renderCheckbox(isNghienRuou, 'Có')}
                            {renderCheckbox(!isNghienRuou, 'Không')}
                        </div>
                        {tsbtMaBenhKhac && (
                            <div className="pl-4 flex items-center">
                                <span className="font-medium">- Bệnh khác (ICD-10): <strong>{formatIcd10String(tsbtMaBenhKhac)}</strong></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* DẤU HIỆU SINH TỒN */}
                <h2 className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mt-2.5 mb-1 tracking-wide">ĐÁNH GIÁ DẤU HIỆU SINH TỒN &amp; THỂ LỰC</h2>
                <div className="text-[12.5px] space-y-1 leading-snug pl-2">
                    <div className="flex items-center">
                        <span className="w-56 font-medium">Nhiệt độ: <strong>{clinical.nhiet_do || examination.temperature || extra.nhiet_do || '...'}</strong> °C</span>
                        {renderCheckbox(isNhietDoNormal, 'Bình thường')}
                        {renderCheckbox(isNhietDoSot, 'Sốt')}
                        {renderCheckbox(isNhietDoHal, 'Hạ thân nhiệt')}
                    </div>
                    <div className="flex items-center">
                        <span className="w-56 font-medium">Mạch: <strong>{examination.pulse || clinical.pulse || extra.pulse || '...'}</strong> lần/phút</span>
                        {renderCheckbox(isMachNormal, 'Bình thường')}
                        {renderCheckbox(isMachNhanh, 'Nhanh')}
                    </div>
                    <div className="flex items-center">
                        <span className="w-56 font-medium">Nhịp thở: <strong>{clinical.nhip_tho || examination.breathing_rate || extra.nhip_tho || '...'}</strong> lần/phút</span>
                        {renderCheckbox(isNhipThoNormal, 'Bình thường')}
                        {renderCheckbox(isNhipThoNhanh, 'Thở nhanh')}
                        {renderCheckbox(isNhipThoCham, 'Thở chậm')}
                    </div>
                    <div className="flex items-center">
                        <span className="w-56 font-medium">Huyết áp: <strong>{examination.blood_pressure || clinical.bp || extra.bp || '...'}</strong> mmHg</span>
                        <span className="font-medium">Chỉ số BMI: <strong>{examination.bmi || clinical.bmi || extra.bmi || '...'}</strong></span>
                    </div>
                </div>

                {/* ĐÁNH GIÁ DINH DƯỠNG */}
                <h2 className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mt-2.5 mb-1 tracking-wide">ĐÁNH GIÁ DINH DƯỠNG</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] leading-snug pl-2">
                    <div>Chiều dài / Chiều cao: <strong>{examination.height || clinical.height || extra.height || '...'}</strong> cm</div>
                    <div>Chiều dài/Tuổi: <strong>{extra.chieu_dai_tuoi_sd || '...'}</strong> SD</div>

                    <div>Cân nặng: <strong>{examination.weight || clinical.weight || extra.weight || '...'}</strong> kg</div>
                    <div>Cân nặng/Tuổi: <strong>{extra.can_nang_tuoi_sd || '...'}</strong> SD</div>

                    <div className="flex items-center col-span-2">
                        <span className="w-56 font-medium">Vòng đầu (cm): <strong>{extra.vong_ddau || extra.vong_dau || '...'}</strong></span>
                        {renderCheckbox(isVongDauNormal, 'Bình thường')}
                        {renderCheckbox(isVongDauTo, 'Đầu to')}
                        {renderCheckbox(isVongDauNho, 'Đầu nhỏ')}
                    </div>

                    <div>Chu vi vòng cánh tay: <strong>{extra.chu_vi_vong_canh_tay || '...'}</strong> mm</div>
                    <div>Vòng ngực: <strong>{extra.vong_nguc || '...'}</strong> cm</div>

                    <div className="col-span-2 flex items-center flex-wrap pt-0.5 gap-y-1">
                        {renderCheckbox(extra.phu_dinh_duong === '1', 'Phù dinh dưỡng')}
                        {renderCheckbox(extra.thieu_mau === '1', 'Dấu hiệu thiếu máu')}
                        {renderCheckbox(extra.coi_xuong === '1', 'Dấu hiệu còi xương')}
                        {renderCheckbox(extra.suy_dinh_duong === '1', 'Suy dinh dưỡng')}
                        {renderCheckbox(extra.thua_can_beo_phi === '1', 'Thừa cân/béo phì')}
                    </div>
                </div>

                <div className="absolute bottom-6 right-8 text-[11px] text-slate-500 font-sans">1/3</div>
            </div>

            {/* ==================== CHILD PAGE 2 ==================== */}
            <div className="a4-page overflow-hidden">
                <h2 className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-1.5 tracking-wide">ĐÁNH GIÁ PHÁT TRIỂN TINH THẦN - VẬN ĐỘNG</h2>
                <table className="a4-table w-full text-[12px] text-center mb-3">
                    <thead>
                        <tr className="bg-slate-50 font-bold">
                            <th className="w-[70%] text-left">Hành vi và năng lực trẻ theo độ tuổi</th>
                            <th className="w-[15%] text-center">Có</th>
                            <th className="w-[15%] text-center">Không</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="text-left py-1">Phát triển tinh thần bình thường của trẻ theo độ tuổi</td>
                            <td className="font-bold">{extra.pt_tinh_than_binh_thuong === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.pt_tinh_than_binh_thuong === '0' ? 'x' : ''}</td>
                        </tr>
                        <tr>
                            <td className="text-left py-1">Phát triển vận động bình thường của trẻ theo độ tuổi</td>
                            <td className="font-bold">{extra.pt_van_dong_binh_thuong === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.pt_van_dong_binh_thuong === '0' ? 'x' : ''}</td>
                        </tr>
                        <tr>
                            <td className="text-left py-1">Trẻ có nguy cơ tự kỷ (với trẻ từ 16–30 tháng tuổi)</td>
                            <td className="font-bold">{extra.nguy_co_tu_ky === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.nguy_co_tu_ky === '0' || !extra.nguy_co_tu_ky ? 'x' : ''}</td>
                        </tr>
                    </tbody>
                </table>

                <h2 className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-1.5 tracking-wide">ĐÁNH GIÁ TIÊM CHỦNG</h2>
                <table className="a4-table w-full text-[12px] text-center mb-3">
                    <thead>
                        <tr className="bg-slate-50 font-bold">
                            <th className="w-[70%] text-left">Kiểm tra sổ tiêm chủng</th>
                            <th className="w-[15%] text-center">Có</th>
                            <th className="w-[15%] text-center">Không</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="text-left py-1">Lao (sơ sinh)</td>
                            <td className="font-bold">{extra.tiem_chung_lao === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.tiem_chung_lao === '0' ? 'x' : ''}</td>
                        </tr>
                        <tr>
                            <td className="text-left py-1">Viêm gan B mũi 1 (sơ sinh)</td>
                            <td className="font-bold">{extra.tiem_chung_vgb_mui1 === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.tiem_chung_vgb_mui1 === '0' ? 'x' : ''}</td>
                        </tr>
                        <tr>
                            <td className="text-left py-1">Tiêm chủng đầy đủ các loại vắc xin theo độ tuổi</td>
                            <td className="font-bold">{extra.tiem_chung_day_du === '1' ? 'x' : ''}</td>
                            <td className="font-bold">{extra.tiem_chung_day_du === '0' ? 'x' : ''}</td>
                        </tr>
                    </tbody>
                </table>

                <h2 className="font-bold text-[14px] uppercase border-b border-black pb-0.5 mt-2 mb-1.5 tracking-wide text-center">KHÁM LÂM SÀNG</h2>
                <div className="text-[12px] italic mb-2 text-slate-700">
                    Quan sát toàn trạng: <strong>{extra.lam_sang_quan_sat || 'Nét mặt, tư thế, tỷ lệ cân đối, vận động bình thường, không có dấu hiệu bệnh cấp/mạn tính.'}</strong>
                </div>

                <div className="text-[12.5px] space-y-2.5 pl-1">
                    {/* 1. Toàn trạng */}
                    <div>
                        <strong className="block mb-1 text-[13px]">1. Toàn trạng</strong>
                        <div className="flex items-center pl-4 mb-1 flex-wrap">
                            <span className="w-32 font-medium">- Màu sắc da:</span>
                            {renderCheckbox(extra.mau_sac_da === '1', 'Hồng hào')}
                            {renderCheckbox(extra.mau_sac_da === '2', 'Nhợt')}
                            {renderCheckbox(extra.mau_sac_da === '3', 'Vàng da')}
                            {renderCheckbox(extra.mau_sac_da === '4', 'Tím tái')}
                            {renderCheckbox(extra.mau_sac_da === '5', 'Sạm da')}
                        </div>
                        <div className="flex items-center pl-4">
                            <span className="w-32 font-medium">- Lòng bàn tay:</span>
                            {renderCheckbox(extra.long_ban_tay === '1', 'Bình thường (hồng)')}
                            {renderCheckbox(extra.long_ban_tay === '2' || extra.long_ban_tay === '0', 'Không bình thường (nhợt)')}
                        </div>
                    </div>

                    {/* 2. Đầu - cổ */}
                    <div>
                        <strong className="block mb-1 text-[13px]">2. Đầu - cổ</strong>
                        <div className="pl-4 space-y-1.5">
                            <div>
                                <strong className="block font-semibold text-[12.5px] mb-1 text-teal-950">2.1. Khám đầu - cổ</strong>
                                <div className="flex items-center pl-4 mb-1 flex-wrap">
                                    <span className="w-56 font-medium">- Thóp (trẻ nhỏ còn thóp):</span>
                                    {renderCheckbox(extra.thop === '1', 'Bình thường')}
                                    {renderCheckbox(extra.thop === '2', 'Rộng')}
                                    {renderCheckbox(extra.thop === '3', 'Hẹp')}
                                    {renderCheckbox(extra.thop === '4', 'Thóp phồng')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Kích thước &amp; hình dạng đầu:</span>
                                    {renderCheckbox(extra.kich_thuoc_dau === '1', 'Bình thường')}
                                    {renderCheckbox(extra.kich_thuoc_dau === '2', 'Đầu to')}
                                    {renderCheckbox(extra.kich_thuoc_dau === '3', 'Đầu nhỏ')}
                                    {renderCheckbox(extra.kich_thuoc_dau === '0', 'Bất thường')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Vận động cổ:</span>
                                    {renderCheckbox(extra.van_dong_co === '1', 'Bình thường')}
                                    {renderCheckbox(extra.van_dong_co === '0' || extra.van_dong_co === '2', 'Giới hạn / Vẹo cổ')}
                                </div>
                                <div className="flex items-center pl-4">
                                    <span className="w-56 font-medium">- Khối bất thường:</span>
                                    {renderCheckbox(extra.khoi_bat_thuong_dau_co === '1', 'Có')}
                                    {renderCheckbox(extra.khoi_bat_thuong_dau_co === '0' || !extra.khoi_bat_thuong_dau_co, 'Không')}
                                </div>
                            </div>

                            <div className="pt-1">
                                <strong className="block font-semibold text-[12.5px] mb-1 text-teal-950">2.2. Khám mắt</strong>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Vị trí 2 mắt:</span>
                                    {renderCheckbox(extra.vi_tri_2_mat === '1', 'Bình thường (cân đối)')}
                                    {renderCheckbox(extra.vi_tri_2_mat === '0' || extra.vi_tri_2_mat === '2', '2 mắt xa nhau / Bất thường')}
                                </div>
                                <div className="flex items-center pl-4 mb-1 flex-wrap">
                                    <span className="w-56 font-medium">- Mí mắt và kết mạc:</span>
                                    {renderCheckbox(extra.mi_mat_ket_mac === '1', 'Bình thường')}
                                    {renderCheckbox(extra.mi_mat_ket_mac === '2' || extra.mi_mat_ket_mac === '0', 'Sưng/đỏ')}
                                    {renderCheckbox(extra.mi_mat_ket_mac === '3', 'Chảy ghèn/mủ')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Lác mắt:</span>
                                    {renderCheckbox(extra.lac_mat === '1', 'Có')}
                                    {renderCheckbox(extra.lac_mat === '0' || !extra.lac_mat, 'Không')}
                                </div>
                                <div className="flex items-center pl-4">
                                    <span className="w-56 font-medium">- Đồng tử (kích thước, phản xạ):</span>
                                    {renderCheckbox(extra.dong_tu === '1', 'Bình thường')}
                                    {renderCheckbox(extra.dong_tu === '0' || extra.dong_tu === '2', 'Không bình thường')}
                                </div>
                            </div>

                            <div className="pt-1">
                                <strong className="block font-semibold text-[12.5px] mb-1 text-teal-950">2.3. Khám tai</strong>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Tai và màng nhĩ:</span>
                                    {renderCheckbox(extra.tai_mang_nhi === '1', 'Bình thường')}
                                    {renderCheckbox(extra.tai_mang_nhi === '0' || extra.tai_mang_nhi === '2', 'Không bình thường')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Đáp ứng với âm thanh:</span>
                                    {renderCheckbox(extra.dap_ung_am_thanh === '1', 'Bình thường (nhạy bén)')}
                                    {renderCheckbox(extra.dap_ung_am_thanh === '0' || extra.dap_ung_am_thanh === '2', 'Kém phản xạ')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Có khối sưng sau tai:</span>
                                    {renderCheckbox(extra.khoi_sung_sau_tai === '1', 'Có')}
                                    {renderCheckbox(extra.khoi_sung_sau_tai === '0' || !extra.khoi_sung_sau_tai, 'Không')}
                                </div>
                                <div className="flex items-center pl-4">
                                    <span className="w-56 font-medium">- Dấu hiệu chảy mủ, nước tai:</span>
                                    {renderCheckbox(extra.chay_mu_nuoc_tai === '1', 'Có')}
                                    {renderCheckbox(extra.chay_mu_nuoc_tai === '0' || !extra.chay_mu_nuoc_tai, 'Không')}
                                </div>
                            </div>

                            <div className="pt-1">
                                <strong className="block font-semibold text-[12.5px] mb-1 text-teal-950">2.4. Khám mũi - họng</strong>
                                <div className="flex items-center pl-4 mb-1 flex-wrap">
                                    <span className="w-56 font-medium">- Hình dạng mũi:</span>
                                    {renderCheckbox(extra.hinh_dang_mui === '1', 'Bình thường')}
                                    {renderCheckbox(extra.hinh_dang_mui === '2' || extra.hinh_dang_mui === '0', 'Mũi to, dày / Bất thường')}
                                    {renderCheckbox(extra.hinh_dang_mui === '3', 'Bất sản xương mũi')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Chảy nước mũi:</span>
                                    {renderCheckbox(extra.chay_nuoc_mui === '1', 'Có')}
                                    {renderCheckbox(extra.chay_nuoc_mui === '0' || !extra.chay_nuoc_mui, 'Không')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Nghẹt mũi:</span>
                                    {renderCheckbox(extra.nghet_mui === '1', 'Có')}
                                    {renderCheckbox(extra.nghet_mui === '0' || !extra.nghet_mui, 'Không')}
                                </div>
                                <div className="flex items-center pl-4">
                                    <span className="w-56 font-medium">- Họng:</span>
                                    {renderCheckbox(extra.hong === '1', 'Bình thường (sạch)')}
                                    {renderCheckbox(extra.hong === '0' || extra.hong === '2', 'Sưng đỏ / Có mủ')}
                                </div>
                            </div>

                            <div className="pt-1">
                                <strong className="block font-semibold text-[12.5px] mb-1 text-teal-950">2.5. Khám miệng, răng (với trẻ đã có răng)</strong>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Hình dạng miệng:</span>
                                    {renderCheckbox(extra.hinh_dang_mieng === '1', 'Bình thường')}
                                    {renderCheckbox(extra.hinh_dang_mieng === '0' || extra.hinh_dang_mieng === '2', 'Sứt môi, chẻ vòm')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Răng sữa sơ sinh:</span>
                                    {renderCheckbox(extra.rang_sua_so_sinh === '1', 'Có')}
                                    {renderCheckbox(extra.rang_sua_so_sinh === '0' || !extra.rang_sua_so_sinh, 'Không')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Hình dạng lưỡi:</span>
                                    {renderCheckbox(extra.hinh_dang_luoi === '1', 'Bình thường')}
                                    {renderCheckbox(extra.hinh_dang_luoi === '0' || extra.hinh_dang_luoi === '2', 'Lưỡi to bè / Bất thường')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Dính thắng lưỡi:</span>
                                    {renderCheckbox(extra.dinh_thang_luoi === '1', 'Có')}
                                    {renderCheckbox(extra.dinh_thang_luoi === '0' || !extra.dinh_thang_luoi, 'Không')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Nấm miệng:</span>
                                    {renderCheckbox(extra.nam_mieng === '1', 'Có')}
                                    {renderCheckbox(extra.nam_mieng === '0' || !extra.nam_mieng, 'Không')}
                                </div>
                                <div className="flex items-center pl-4 mb-1">
                                    <span className="w-56 font-medium">- Cằm nhỏ, tụt về sau:</span>
                                    {renderCheckbox(extra.cam_nho_tut_sau === '1', 'Có')}
                                    {renderCheckbox(extra.cam_nho_tut_sau === '0' || !extra.cam_nho_tut_sau, 'Không')}
                                </div>
                                <div className="flex items-center pl-4">
                                    <span className="w-56 font-medium">- Vết sâu, mảng bám trên răng:</span>
                                    {renderCheckbox(extra.vet_sau_mang_bam === '1', 'Có')}
                                    {renderCheckbox(extra.vet_sau_mang_bam === '0' || !extra.vet_sau_mang_bam, 'Không')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 right-8 text-[11px] text-slate-500 font-sans">2/3</div>
            </div>

            {/* ==================== CHILD PAGE 3 ==================== */}
            <div className="a4-page overflow-hidden">
                <div className="text-[12.5px] space-y-2 pl-1 pt-1">
                    {/* 3. Hô hấp */}
                    <div>
                        <strong className="block mb-1 text-[13px]">3. Hô hấp</strong>
                        <div className="flex items-center pl-4 mb-1">
                            <span className="w-56 font-medium">- Nhịp thở không đều:</span>
                            {renderCheckbox(extra.nhip_tho_khong_deu === '0' || !extra.nhip_tho_khong_deu, 'Không (đều)')}
                            {renderCheckbox(extra.nhip_tho_khong_deu === '1', 'Có cơn ngưng thở trên 5 giây')}
                        </div>
                        <div className="flex items-center pl-4 mb-1">
                            <span className="w-56 font-medium">- Thở rút lõm lồng ngực:</span>
                            {renderCheckbox(extra.tho_rut_lom_long_nguc === '1', 'Có')}
                            {renderCheckbox(extra.tho_rut_lom_long_nguc === '0' || !extra.tho_rut_lom_long_nguc, 'Không')}
                        </div>
                        <div className="flex items-center pl-4 mb-1">
                            <span className="w-56 font-medium">- Tiếng thở bất thường:</span>
                            {renderCheckbox(extra.tieng_tho_bat_thuong === '1', 'Có (khò khè, rít)')}
                            {renderCheckbox(extra.tieng_tho_bat_thuong === '0' || !extra.tieng_tho_bat_thuong, 'Không')}
                        </div>
                        <div className="flex items-center pl-4 mb-1">
                            <span className="w-56 font-medium">- Dấu hiệu suy hô hấp:</span>
                            {renderCheckbox(extra.dh_suy_ho_hap === '1', 'Có')}
                            {renderCheckbox(extra.dh_suy_ho_hap === '0' || !extra.dh_suy_ho_hap, 'Không')}
                        </div>
                        <div className="flex items-center pl-4">
                            <span className="w-56 font-medium">- Nghe phổi:</span>
                            {renderCheckbox(extra.nghe_phoi === '1', 'Bình thường (phổi trong)')}
                            {renderCheckbox(extra.nghe_phoi === '0' || extra.nghe_phoi === '2', 'Có rale / Bất thường')}
                        </div>
                    </div>

                    {/* 4. Tim mạch */}
                    <div>
                        <strong className="block mb-1 text-[13px]">4. Tim mạch</strong>
                        <div className="flex items-center pl-4 mb-1">
                            <span className="w-56 font-medium">- Vị trí mỏm tim:</span>
                            {renderCheckbox(extra.vi_tri_mom_tim === '1', 'Bình thường')}
                            {renderCheckbox(extra.vi_tri_mom_tim === '0' || extra.vi_tri_mom_tim === '2', 'Lệch vị trí / Bất thường')}
                        </div>
                        <div className="flex items-center pl-4 mb-1 flex-wrap">
                            <span className="w-56 font-medium">- Mạch ngoại vi (mạch quay-bẹn):</span>
                            {renderCheckbox(extra.mach_ngoai_vi === '1', 'Bắt rõ')}
                            {renderCheckbox(extra.mach_ngoai_vi === '2', 'Mạch nhẹ')}
                            {renderCheckbox(extra.mach_ngoai_vi === '3' || extra.mach_ngoai_vi === '0', 'Không bắt được')}
                        </div>
                        <div className="flex items-center pl-4">
                            <span className="w-56 font-medium">- Nghe tim (loạn nhịp, tiếng thổi):</span>
                            {renderCheckbox(extra.nghe_tim === '0' || extra.nghe_tim === '2', 'Có tiếng thổi / Loạn nhịp')}
                            {renderCheckbox(extra.nghe_tim === '1' || !extra.nghe_tim, 'Không (T1, T2 đều rõ)')}
                        </div>
                    </div>

                    {/* 5. Bụng và cơ quan sinh dục */}
                    <div>
                        <strong className="block mb-1 text-[13px]">5. Bụng và cơ quan sinh dục</strong>
                        <div className="flex items-center pl-4 mb-1">
                            <span className="w-56 font-medium">- Hình dáng bụng, rốn:</span>
                            {renderCheckbox(extra.hinh_dang_bung_ron === '1', 'Bình thường (mềm, khô)')}
                            {renderCheckbox(extra.hinh_dang_bung_ron === '0' || extra.hinh_dang_bung_ron === '2', 'Chướng / Thoát vị rốn')}
                        </div>
                        <div className="flex items-center pl-4 mb-1">
                            <span className="w-56 font-medium">- Gan, lách to:</span>
                            {renderCheckbox(extra.gan_lach_to === '1', 'Có')}
                            {renderCheckbox(extra.gan_lach_to === '0' || !extra.gan_lach_to, 'Không')}
                        </div>
                        <div className="flex items-center pl-4 mb-1">
                            <span className="w-56 font-medium">- Khối bất thường:</span>
                            {renderCheckbox(extra.khoi_bat_thuong_bung === '1', 'Có')}
                            {renderCheckbox(extra.khoi_bat_thuong_bung === '0' || !extra.khoi_bat_thuong_bung, 'Không')}
                        </div>
                        <div className="flex items-center pl-4 mb-1">
                            <span className="w-56 font-medium">- Lỗ hậu môn:</span>
                            {renderCheckbox(extra.lo_hau_mon === '1', 'Bình thường (thông suốt)')}
                            {renderCheckbox(extra.lo_hau_mon === '0' || extra.lo_hau_mon === '2', 'Dị tật vô hậu môn')}
                        </div>
                        <div className="flex items-center pl-4">
                            <span className="w-56 font-medium">- Cơ quan sinh dục ngoài:</span>
                            {renderCheckbox(extra.cq_sinh_duc_ngoai === '1', 'Bình thường')}
                            {renderCheckbox(extra.cq_sinh_duc_ngoai === '0' || extra.cq_sinh_duc_ngoai === '2', 'Bất thường')}
                        </div>
                    </div>

                    {/* 6. Cơ xương và thần kinh */}
                    <div>
                        <strong className="block mb-1 text-[13px]">6. Cơ xương và thần kinh</strong>
                        <div className="pl-4 space-y-1 text-[12px]">
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Vận động không đối xứng:</span>
                                {renderCheckbox(extra.van_dong_khong_doi_xung === '1', 'Có')}
                                {renderCheckbox(extra.van_dong_khong_doi_xung === '0' || !extra.van_dong_khong_doi_xung, 'Không')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Phản xạ bú:</span>
                                {renderCheckbox(extra.phan_xa_bu === '1', 'Tốt')}
                                {renderCheckbox(extra.phan_xa_bu === '0', 'Yếu / Không có')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Phản xạ nắm:</span>
                                {renderCheckbox(extra.phan_xa_nam === '1', 'Tốt')}
                                {renderCheckbox(extra.phan_xa_nam === '0', 'Yếu / Không có')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Phản xạ Moro:</span>
                                {renderCheckbox(extra.phan_xa_moro === '1', 'Tốt')}
                                {renderCheckbox(extra.phan_xa_moro === '0', 'Bất thường')}
                            </div>
                            <div className="flex items-center flex-wrap">
                                <span className="w-56 font-medium">- Trương lực cơ:</span>
                                {renderCheckbox(extra.truong_luc_co === '1', 'Bình thường')}
                                {renderCheckbox(extra.truong_luc_co === '2', 'Tăng')}
                                {renderCheckbox(extra.truong_luc_co === '3', 'Giảm')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Khớp háng:</span>
                                {renderCheckbox(extra.khop_hang === '1', 'Bình thường')}
                                {renderCheckbox(extra.khop_hang === '0' || extra.khop_hang === '2', 'Trật khớp háng')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Phản xạ cơ:</span>
                                {renderCheckbox(extra.phan_xa_co === '1', 'Bình thường')}
                                {renderCheckbox(extra.phan_xa_co === '0' || extra.phan_xa_co === '2', 'Không bình thường')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Kiểm tra lưng, cột sống:</span>
                                {renderCheckbox(extra.kiem_tra_lung_cot_song === '1', 'Bình thường')}
                                {renderCheckbox(extra.kiem_tra_lung_cot_song === '0' || extra.kiem_tra_lung_cot_song === '2', 'Không bình thường')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Khám tứ chi và khớp:</span>
                                {renderCheckbox(extra.kham_tu_chi_khop === '1', 'Bình thường')}
                                {renderCheckbox(extra.kham_tu_chi_khop === '0' || extra.kham_tu_chi_khop === '2', 'Không bình thường')}
                            </div>
                            <div className="flex items-center">
                                <span className="w-56 font-medium">- Quan sát dáng đi (nếu biết đi):</span>
                                {renderCheckbox(extra.quan_sat_dang_di === '1', 'Bình thường')}
                                {renderCheckbox(extra.quan_sat_dang_di === '0' || extra.quan_sat_dang_di === '2', 'Khập khiễng / Bất thường')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* KHÁM CẬN LÂM SÀNG */}
                <h2 className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mt-2 mb-1 tracking-wide">KHÁM CẬN LÂM SÀNG</h2>
                <div className="text-[12px] space-y-1 pl-2">
                    {/* Xét nghiệm máu */}
                    <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[11.5px] bg-slate-50/70 p-1.5 rounded border border-slate-200">
                        <div className="col-span-3 font-bold text-[12px] text-teal-950 mb-0.5">1. Xét nghiệm máu &amp; Sinh hóa:</div>
                        <div>- Huyết sắc tố (Hb): <strong>{lab.hemoglobin || '...'}</strong> g/L</div>
                        <div>- Đường máu (Glucose): <strong>{lab.glycemia || '...'}</strong> mmol/L</div>
                        <div>- Hồng cầu (RBC): <strong>{lab.chi_so_hc || '...'}</strong> T/L</div>
                        <div>- Bạch cầu (WBC): <strong>{lab.chi_so_bach_cau || '...'}</strong> G/L</div>
                        <div>- Tiểu cầu (PLT): <strong>{lab.chi_so_tieu_cau || '...'}</strong> G/L</div>
                        <div>- Ure: <strong>{lab.ure || '...'}</strong> mmol/L</div>
                        <div>- Creatinin: <strong>{lab.creatinin || '...'}</strong> µmol/L</div>
                        <div>- AST (ASAT): <strong>{lab.asat_ast || '...'}</strong> U/L</div>
                        <div>- ALT (ALAT): <strong>{lab.alat_alt || '...'}</strong> U/L</div>
                    </div>

                    {/* Xét nghiệm nước tiểu & Khác */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11.5px] bg-slate-50/70 p-1.5 rounded border border-slate-200 mt-1">
                        <div className="col-span-2 font-bold text-[12px] text-teal-950 mb-0.5">2. Phân tích nước tiểu &amp; Cận lâm sàng khác:</div>
                        <div>- Đường nước tiểu: <strong>{lab.duong_nuoc_tieu || 'Âm tính (-) / Chưa làm'}</strong></div>
                        <div>- Protein nước tiểu: <strong>{lab.protein_nuoc_tieu || 'Âm tính (-) / Chưa làm'}</strong></div>
                        {(lab.other_result || paraclinicalItems.length > 0) && (
                            <div className="col-span-2">
                                - Kết quả CLS khác: <strong>{lab.other_result || paraclinicalItems.map((p: any) => `${p.service_name || ''}: ${p.value || p.result || ''} ${p.unit || ''}`).filter(Boolean).join('; ')}</strong>
                            </div>
                        )}
                    </div>
                </div>

                {/* KẾT LUẬN VÀ TƯ VẤN */}
                <h2 className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mt-2 mb-1 tracking-wide text-center">KẾT LUẬN VÀ TƯ VẤN</h2>
                
                <div className="text-[12.5px] space-y-1.5 leading-snug pl-2">
                    {/* Phân loại sức khỏe */}
                    <div className="flex items-center flex-wrap">
                        <span className="font-bold mr-2">1. Phân loại sức khỏe:</span>
                        {renderCheckbox(conclusion.fitness_class === '1' || conclusion.fitness_class === 'I', 'Loại I (Rất khỏe)')}
                        {renderCheckbox(conclusion.fitness_class === '2' || conclusion.fitness_class === 'II', 'Loại II (Khỏe)')}
                        {renderCheckbox(conclusion.fitness_class === '3' || conclusion.fitness_class === 'III', 'Loại III (Trung bình)')}
                        {renderCheckbox(conclusion.fitness_class === '4' || conclusion.fitness_class === 'IV', 'Loại IV (Yếu)')}
                        {renderCheckbox(conclusion.fitness_class === '5' || conclusion.fitness_class === 'V', 'Loại V (Rất yếu)')}
                    </div>

                    {/* Đánh giá chung */}
                    <div className="flex items-center flex-wrap">
                        <span className="font-bold mr-2">2. Đánh giá sức khỏe:</span>
                        {renderCheckbox(conclusion.fitness_class === '1' || conclusion.fitness_class === '2', 'Bình thường.')}
                        {renderCheckbox(isLaoExposed, 'Có nguy cơ mắc lao (tiền sử tiếp xúc).')}
                        {renderCheckbox(conclusion.fitness_class !== '1' && conclusion.fitness_class !== '2' && !!conclusion.fitness_class, 'Có vấn đề về sức khỏe.')}
                    </div>
                    
                    {/* Các bệnh tật phát hiện */}
                    <div>
                        <span className="font-bold">3. Các bệnh tật, dị tật phát hiện (nếu có): </span>
                        <strong>{formatIcd10String(conclusion.diagnosis) || 'Không phát hiện bất thường'}</strong>
                    </div>

                    {/* Vấn đề lưu ý */}
                    <div>
                        <span className="font-bold">4. Các vấn đề cần lưu ý, theo dõi &amp; hướng dẫn chăm sóc: </span>
                        <strong>{conclusion.cac_van_de_luu_y || 'Theo dõi và hướng dẫn chăm sóc trẻ định kỳ theo độ tuổi.'}</strong>
                    </div>
                    
                    {/* Tư vấn và hẹn khám */}
                    <div className="flex items-center flex-wrap">
                        <span className="font-bold mr-2">5. Tư vấn &amp; Quản lý:</span>
                        {renderCheckbox(conclusion.quan_ly_benh === 'Hẹn khám lần sau' || extra.quan_ly_benh === 'Hẹn khám lần sau' || !conclusion.quan_ly_benh, 'Hẹn khám định kỳ lần sau')}
                        {renderCheckbox(conclusion.quan_ly_benh === 'Chuyển cơ sở' || extra.quan_ly_benh === 'Chuyển cơ sở', 'Chuyển cơ sở khám bệnh, chữa bệnh chuyên khoa')}
                    </div>
                </div>

                {/* Chữ ký */}
                <div className="flex justify-end mt-2 text-[12px] px-8">
                    <div className="text-center w-64 flex flex-col items-center">
                        <span className="italic text-[11px] mb-0.5 font-normal">Ngày {getReportDate().day} tháng {getReportDate().month} năm 20{getReportDate().year % 100}</span>
                        <strong className="block font-bold uppercase text-[12.5px] tracking-wider mb-0.5">NGƯỜI KẾT LUẬN</strong>
                        <span className="italic text-[10.5px] text-slate-500 font-normal mb-2">(Ký, ghi rõ họ tên và đóng dấu)</span>

                        {(() => {
                            if (docNormalized.signature_status === 'Signed' || docNormalized.signature_status === 'signed') {
                                return (
                                    <div className="my-1.5 p-2 border border-green-600 rounded bg-green-50/50 text-[10px] font-bold text-green-700 leading-tight text-left w-full shadow-sm max-w-[220px] font-sans">
                                        <div className="flex items-center gap-1 mb-0.5 text-green-800">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            <span>SIGNED DIGITALLY</span>
                                        </div>
                                        By: {hospitalNameNormalized || 'BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH'}<br/>
                                        Time: {docNormalized.updated_at ? new Date(docNormalized.updated_at).toLocaleString('vi-VN') : '2026-06-03'}
                                    </div>
                                );
                            }

                            return <div className="h-12"></div>;
                        })()}
                        
                        <span className="font-bold text-[13px] mt-1 text-slate-900 block">{getConclusionDoctorName()}</span>
                    </div>
                </div>

                <div className="absolute bottom-6 right-8 text-[11px] text-slate-500 font-sans">3/3</div>
            </div>
        </>
    );
};

export default PrintFormMau1;
