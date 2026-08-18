import React from 'react';
import { VIMES_LOGO_BASE64 } from '../../../config/vimesLogoBase64';

interface PrintFormMau3Props {
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
    doctorSignatures
}) => {
    const clinical = document.clinical_data || document.clinicalData || {};
    const extra = clinical.extra || {};
    const lab = document.lab_data || document.labData || {};
    const conclusion = document.conclusion_data || document.conclusionData || {};

    const normalizeSignatureKey = (value: any) => String(value || '')
        .trim()
        .toUpperCase()
        .replace(/^HMS_/, '')
        .replace(/\.JPE?G\.?$/, '');

    const resolveConclusionSignature = () => {
        if (!doctorSignatures) return null;
        const normalizedSignatures = new Map(
            Object.entries(doctorSignatures).map(([key, value]) => [normalizeSignatureKey(key), value])
        );
        const candidates = [
            conclusion.doctor_code,
            conclusion.doctor_username,
            conclusion.conclusion_doctor,
            conclusion.doctor,
            getConclusionDoctorName()
        ];
        for (const candidate of candidates) {
            const normalized = normalizeSignatureKey(candidate);
            if (normalized && normalizedSignatures.has(normalized)) {
                return normalizedSignatures.get(normalized) || null;
            }
        }
        return null;
    };

    const resolveSpecialtyDoctorName = (specKey: string, fallbackName?: string) => {
        const metadata = clinical.specialty_metadata?.[specKey];
        if (metadata?.doctorName) return metadata.doctorName;
        if (metadata?.doctorId && Array.isArray(doctors)) {
            const doc = doctors.find((d: any) => d.id === metadata.doctorId || d.code === metadata.doctorId);
            if (doc) return doc.name || doc.fullname;
        }
        return fallbackName || getConclusionDoctorName();
    };

    const renderCheckbox = (checked: boolean, label: string) => (
        <span className="inline-flex items-center gap-1 mr-3">
            <span className="inline-block w-3.5 h-3.5 border border-black text-[10px] leading-none font-sans font-bold text-center flex items-center justify-center shrink-0" style={{ transform: 'translateY(-1px)' }}>
                {checked ? 'x' : ''}
            </span>
            <span>{label}</span>
        </span>
    );

    const isNam = document.gender === 'Nam' || document.gender === '1';
    const isNu = document.gender === 'Nữ' || document.gender === '2' || document.gender === '0';

    const dobStr = document.dob ? new Date(document.dob).toLocaleDateString('vi-VN') : '';
    const birthYear = document.dob ? new Date(document.dob).getFullYear() : 0;
    const currentYear = new Date().getFullYear();
    const age = birthYear > 0 ? currentYear - birthYear : '';

    const isDriver = document.form_type === 'driver' || document.form_type === 'mau3-driver' || Boolean(extra.is_driver);
    const licenseClass = extra.hang_lai_xe || 'B2';
    const driverExamPurpose = extra.driver_exam_purpose || 'Cấp mới';

    const tsgd = String(extra.tsgd_mac_benh || '').trim();
    const hasTsgd = tsgd === '1' || (tsgd !== '' && tsgd !== '0' && tsgd !== 'Không');

    const formatFitnessClassName = (val: string) => {
        const map: Record<string, string> = {
            '1': 'Rất khỏe',
            '2': 'Khỏe',
            '3': 'Trung bình',
            '4': 'Yếu',
            '5': 'Rất yếu'
        };
        return map[val] || 'Khỏe';
    };

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

    const isTreating = extra.ts_mac_benh === '1' || extra.ts_mac_benh === 1;
    const medicineNames = extra.ten_thuoc || '';

    // Sắc giác (1: Bình thường, 2: Mù màu toàn bộ, 3: Mù màu đỏ, 4: Mù màu xanh lá, 5: Mù màu vàng)
    const rawSacGiac = String(clinical.sac_giac || '').trim();
    const isSacGiacBt = rawSacGiac === '1' || rawSacGiac === '0' || rawSacGiac === '' || rawSacGiac === 'Bình thường';
    const isMuMauToanBo = rawSacGiac === '2';
    const isMuMauDo = rawSacGiac === '3';
    const isMuMauXanh = rawSacGiac === '4';
    const isMuMauVang = rawSacGiac === '5';

    // Thị trường
    const rawTtNgang = String(clinical.thi_truong_ngang_hai_mat || '').toLowerCase();
    const isTtNgangBt = rawTtNgang === '1' || rawTtNgang === 'bình thường' || rawTtNgang === '' || !rawTtNgang.includes('hạn chế');
    const rawTtDung = String(clinical.thi_truong_dung_hai_mat || '').toLowerCase();
    const isTtDungBt = rawTtDung === '1' || rawTtDung === 'bình thường' || rawTtDung === '' || !rawTtDung.includes('hạn chế');

    // Kết luận lái xe
    const rawKetLuan = String(conclusion.ket_luan_loai_suc_khoe || '').trim();
    const isDuDieuKien = rawKetLuan.toLowerCase().includes('đủ điều kiện') && !rawKetLuan.toLowerCase().includes('không đủ');
    const isKhongDuDieuKien = rawKetLuan.toLowerCase().includes('không đủ điều kiện');
    const isKhamLai = rawKetLuan.toLowerCase().includes('khám lại') || rawKetLuan.toLowerCase().includes('sau');

    const conclusionSig = resolveConclusionSignature();

    return (
        <div className="print-form-mau3 flex flex-col items-center gap-8 py-6 bg-slate-100 dark:bg-slate-900 print:bg-white print:p-0 print:gap-0">
            {/* ========================================== TRANG 1 ========================================== */}
            <div className="a4-page bg-white text-black p-8 shadow-md print:shadow-none w-[210mm] min-h-[297mm] box-border relative flex flex-col justify-between text-[12.5px] leading-relaxed">
                <div>
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 border-b-2 border-black pb-2 mb-3">
                        <div className="col-span-6 flex items-start gap-2">
                            <img src={logoUrl || VIMES_LOGO_BASE64} alt="Logo" className="w-12 h-12 object-contain shrink-0 mt-0.5" />
                            <div>
                                <div className="font-extrabold uppercase text-[12px] leading-tight">{hospitalName || 'CƠ SỞ KHÁM BỆNH, CHỮA BỆNH'}</div>
                                <div className="text-[11px] text-slate-700">Mã CSKCB: <span className="font-bold font-mono">{maCskcb || '01001'}</span></div>
                                <div className="text-[11px] text-slate-700">Số hồ sơ KSK: <span className="font-bold font-mono">{document.doc_no || 'KSK-001'}</span></div>
                            </div>
                        </div>
                        <div className="col-span-6 text-center">
                            <div className="font-bold uppercase text-[12px] leading-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                            <div className="font-bold text-[11.5px] leading-tight">Độc lập - Tự do - Hạnh phúc</div>
                            <div className="text-[11px] mt-0.5 tracking-tighter">-----------------------</div>
                        </div>
                    </div>

                    {/* Form Title */}
                    <div className="text-center my-3">
                        <h1 className="text-[16px] font-black uppercase tracking-wide">
                            {isDriver ? 'GIẤY KHÁM SỨC KHỎE CỦA NGƯỜI LÁI XE' : 'GIẤY KHÁM SỨC KHỎE'}
                        </h1>
                        <p className="text-[11.5px] italic font-semibold text-slate-700">
                            {isDriver 
                                ? '(Dùng cho người học lái xe, nâng hạng hoặc đổi giấy phép lái xe)' 
                                : '(Dành cho người từ đủ 18 tuổi trở lên theo Thông tư số 32/2023/TT-BYT & QĐ 2062/QĐ-BYT)'}
                        </p>
                    </div>

                    {/* Phần I: Thông tin đối tượng */}
                    <div className="mb-4">
                        <div className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-2">
                            {isDriver ? 'I. THÔNG TIN CỦA NGƯỜI LÁI XE' : 'I. THÔNG TIN CỦA NGƯỜI ĐƯỢC KHÁM SỨC KHỎE'}
                        </div>
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-9 space-y-1">
                                <div>
                                    <span className="font-bold">1. Họ và tên (chữ in hoa): </span>
                                    <span className="font-extrabold text-[13.5px] uppercase font-sans tracking-wide">{document.patient_name || ''}</span>
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
                                    {document.cccd_date && <span className="ml-3 font-semibold">Cấp ngày: {document.cccd_date}</span>}
                                    {document.cccd_place && <span className="ml-2 font-semibold">Nơi cấp: {document.cccd_place}</span>}
                                </div>
                                <div>
                                    <span className="font-bold">5. Nơi ở hiện tại: </span>
                                    <span className="font-semibold">{document.address || ''}</span>
                                </div>
                                {isDriver ? (
                                    <div className="flex gap-6">
                                        <div>
                                            <span className="font-bold">6. Đề nghị khám lái xe hạng: </span>
                                            <span className="font-extrabold text-[#0f766e] text-[13px] uppercase border border-black px-1.5 py-0.2 rounded bg-slate-50">{licenseClass}</span>
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
                                        <span className="font-bold font-mono">{document.phone || ''}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold">Nhóm máu: </span>
                                        <span className="font-bold">{document.blood_group || extra.nhom_mau || 'O'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Khung Ảnh 4x6 */}
                            <div className="col-span-3 flex flex-col items-center justify-center">
                                <div className="w-[30mm] h-[40mm] border-2 border-dashed border-slate-400 rounded flex flex-col items-center justify-center text-center p-1 bg-slate-50">
                                    <span className="text-[10.5px] font-bold text-slate-500">Ảnh 4 x 6 cm</span>
                                    <span className="text-[8.5px] text-slate-400 italic mt-1">(Đóng dấu giáp lai hoặc ảnh điện tử)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phần II: Tiền sử bệnh */}
                    <div className="mb-2">
                        <div className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-2">
                            {isDriver ? 'II. TIỀN SỬ BỆNH CỦA NGƯỜI LÁI XE' : 'II. TIỀN SỬ BỆNH TẬT'}
                        </div>
                        
                        {/* Tiền sử gia đình */}
                        <div className="mb-2 text-[12px]">
                            <span className="font-bold">1. Tiền sử gia đình: </span>
                            <span>Có ai trong gia đình mắc bệnh: truyền nhiễm, tim mạch, đái tháo đường, lao, hen phế quản, động kinh, tâm thần... </span>
                            {renderCheckbox(!hasTsgd, 'Không')}
                            {renderCheckbox(hasTsgd, 'Có')}
                            {hasTsgd && extra.tsgd_ma_benh && <span className="font-bold italic">({extra.tsgd_ma_benh})</span>}
                        </div>

                        {/* Tiền sử bản thân (22 chỉ tiêu) */}
                        <div className="mb-2">
                            <span className="font-bold text-[12px] block mb-1">2. Tiền sử bản thân (Đánh giá Có/Không theo QĐ 1551 &amp; QĐ 2062/QĐ-BYT):</span>
                            <table className="w-full border-collapse border border-black text-[10.5px]">
                                <thead>
                                    <tr className="bg-slate-100 text-center font-bold">
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
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="border border-black p-0.5 text-center font-bold">{left.id}</td>
                                                <td className="border border-black p-0.5 pl-1">{left.label.replace(/^\d+\.\s*/, '')}</td>
                                                <td className="border border-black p-0.5 text-center font-bold">{!isLeftYes ? 'x' : ''}</td>
                                                <td className="border border-black p-0.5 text-center font-bold text-red-600">{isLeftYes ? 'x' : ''}</td>

                                                <td className="border border-black p-0.5 text-center font-bold">{right.id}</td>
                                                <td className="border border-black p-0.5 pl-1">{right.label.replace(/^\d+\.\s*/, '')}</td>
                                                <td className="border border-black p-0.5 text-center font-bold">{!isRightYes ? 'x' : ''}</td>
                                                <td className="border border-black p-0.5 text-center font-bold text-red-600">{isRightYes ? 'x' : ''}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Tiền sử thai sản (đối với nữ) & Câu hỏi khác */}
                        <div className="text-[11.5px] space-y-1 mb-2">
                            {isNu && (
                                <div>
                                    <span className="font-bold">3. Tiền sử thai sản (đối với nữ): </span>
                                    {renderCheckbox(extra.tsbt_thai_san !== '1', 'Không')}
                                    {renderCheckbox(extra.tsbt_thai_san === '1', 'Có')}
                                    {extra.tsbt_thai_san === '1' && extra.tsbt_ma_benh_thai_san && (
                                        <span className="font-semibold italic ml-2">Mã bệnh: {extra.tsbt_ma_benh_thai_san}</span>
                                    )}
                                </div>
                            )}
                            <div>
                                <span className="font-bold">{isNu ? '4' : '3'}. Câu hỏi khác: </span>
                                <span>Có đang điều trị bệnh gì không? </span>
                                {renderCheckbox(!isTreating, 'Không')}
                                {renderCheckbox(isTreating, 'Có')}
                                {isTreating && medicineNames && (
                                    <span className="font-semibold italic ml-2">Thuốc đang dùng: {medicineNames}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chữ ký người đề nghị KSK */}
                <div className="pt-2 border-t border-black">
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
                            <div className="italic text-[10.5px] text-slate-500 mb-8">(Ký và ghi rõ họ tên)</div>
                            <div className="font-extrabold uppercase text-[12.5px] font-sans">{document.patient_name || ''}</div>
                        </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 mt-2 font-mono">Trang 1/3</div>
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
                                <span className="font-bold block text-slate-600 text-[11px]">Chiều cao:</span>
                                <span className="font-bold font-mono text-[13px]">{clinical.chieu_cao || clinical.height || '168'}</span> cm
                            </div>
                            <div>
                                <span className="font-bold block text-slate-600 text-[11px]">Cân nặng:</span>
                                <span className="font-bold font-mono text-[13px]">{clinical.can_nang || clinical.weight || '62'}</span> kg
                            </div>
                            <div>
                                <span className="font-bold block text-slate-600 text-[11px]">Chỉ số BMI:</span>
                                <span className="font-bold font-mono text-[13px]">{clinical.chi_so_bmi || clinical.bmi || '22.0'}</span>
                            </div>
                            <div>
                                <span className="font-bold block text-slate-600 text-[11px]">Mạch:</span>
                                <span className="font-bold font-mono text-[13px]">{clinical.mach || clinical.pulse || '75'}</span> lần/phút
                            </div>
                            <div>
                                <span className="font-bold block text-slate-600 text-[11px]">Huyết áp:</span>
                                <span className="font-bold font-mono text-[13px]">{clinical.huyet_ap || clinical.bp || '120/80'}</span> mmHg
                            </div>
                        </div>
                    </div>

                    {/* Phần IV: Khám lâm sàng chuyên khoa */}
                    <div className="mb-2">
                        <div className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-2">
                            IV. KHÁM LÂM SÀNG CHUYÊN KHOA
                        </div>

                        <table className="w-full border-collapse border border-black text-[11.5px]">
                            <thead>
                                <tr className="bg-slate-100 text-center font-bold">
                                    <th className="border border-black p-1.5 w-[28%] text-left">Chuyên khoa khám</th>
                                    <th className="border border-black p-1.5 text-left">Nội dung khám &amp; Kết quả</th>
                                    <th className="border border-black p-1.5 w-[25%]">Họ tên, chữ ký Bác sĩ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* 1. Tâm thần */}
                                <tr>
                                    <td className="border border-black p-1.5 font-bold align-top">1. Tâm thần</td>
                                    <td className="border border-black p-1.5 align-top">
                                        <div>{clinical.noi_khoa_tam_than || clinical.tam_than || 'Bình thường, không có rối loạn tâm thần, hành vi.'}</div>
                                    </td>
                                    <td className="border border-black p-1.5 text-center align-bottom h-14">
                                        <div className="font-bold text-[11px] uppercase">{resolveSpecialtyDoctorName('internal')}</div>
                                    </td>
                                </tr>

                                {/* 2. Thần kinh */}
                                <tr>
                                    <td className="border border-black p-1.5 font-bold align-top">2. Thần kinh</td>
                                    <td className="border border-black p-1.5 align-top">
                                        <div>{clinical.noi_khoa_than_kinh || clinical.than_kinh || 'Bình thường, phản xạ gân xương đều, không có dấu hiệu thần kinh khu trú.'}</div>
                                    </td>
                                    <td className="border border-black p-1.5 text-center align-bottom h-14">
                                        <div className="font-bold text-[11px] uppercase">{resolveSpecialtyDoctorName('internal')}</div>
                                    </td>
                                </tr>

                                {/* 3. Mắt */}
                                <tr>
                                    <td className="border border-black p-1.5 font-bold align-top">
                                        3. Mắt
                                    </td>
                                    <td className="border border-black p-1.5 align-top space-y-1">
                                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-1 border border-slate-200 rounded">
                                            <div>
                                                <span className="font-bold block">Không kính:</span>
                                                MP: <span className="font-bold font-mono">{clinical.khong_kinh_mat_phai || '10/10'}</span>; 
                                                MT: <span className="font-bold font-mono ml-1">{clinical.khong_kinh_mat_trai || '10/10'}</span>; 
                                                Hai mắt: <span className="font-bold font-mono ml-1">{clinical.khong_kinh_hai_mat || '10/10'}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold block">Có kính:</span>
                                                MP: <span className="font-bold font-mono">{clinical.co_kinh_mat_phai || '--'}</span>; 
                                                MT: <span className="font-bold font-mono ml-1">{clinical.co_kinh_mat_trai || '--'}</span>; 
                                                Hai mắt: <span className="font-bold font-mono ml-1">{clinical.co_kinh_hai_mat || '--'}</span>
                                            </div>
                                        </div>
                                        <div className="text-[11px]">
                                            <span className="font-bold">Thị trường ngang: </span>
                                            {renderCheckbox(isTtNgangBt, 'Bình thường')}
                                            {renderCheckbox(!isTtNgangBt, 'Hạn chế')}
                                            <span className="font-bold ml-2">Thị trường đứng: </span>
                                            {renderCheckbox(isTtDungBt, 'Bình thường')}
                                            {renderCheckbox(!isTtDungBt, 'Hạn chế')}
                                        </div>
                                        <div className="text-[11px]">
                                            <span className="font-bold">Sắc giác: </span>
                                            {renderCheckbox(isSacGiacBt, 'Bình thường')}
                                            {renderCheckbox(isMuMauToanBo, 'Mù màu toàn bộ')}
                                            {renderCheckbox(isMuMauDo, 'Mù màu đỏ')}
                                            {renderCheckbox(isMuMauXanh, 'Mù màu xanh')}
                                            {renderCheckbox(isMuMauVang, 'Mù màu vàng')}
                                        </div>
                                        <div className="text-[10.5px] italic text-slate-600">
                                            Bệnh mắt khác: {clinical.kham_mat || clinical.benh_khac_mat || 'Kết mạc, giác mạc bình thường.'}
                                        </div>
                                    </td>
                                    <td className="border border-black p-1.5 text-center align-bottom h-16">
                                        <div className="font-bold text-[11px] uppercase">{resolveSpecialtyDoctorName('eye')}</div>
                                    </td>
                                </tr>

                                {/* 4. Tai - Mũi - Họng */}
                                <tr>
                                    <td className="border border-black p-1.5 font-bold align-top">
                                        4. Tai - Mũi - Họng
                                    </td>
                                    <td className="border border-black p-1.5 align-top space-y-1">
                                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-1 border border-slate-200 rounded">
                                            <div>
                                                <span className="font-bold">Tai trái: </span>
                                                Nói thường: <span className="font-bold font-mono">{clinical.tai_trai_noi_thuong || '5'}m</span>; 
                                                Nói thầm: <span className="font-bold font-mono ml-1">{clinical.tai_trai_noi_tham || '0.5'}m</span>
                                            </div>
                                            <div>
                                                <span className="font-bold">Tai phải: </span>
                                                Nói thường: <span className="font-bold font-mono">{clinical.tai_phai_noi_thuong || '5'}m</span>; 
                                                Nói thầm: <span className="font-bold font-mono ml-1">{clinical.tai_phai_noi_tham || '0.5'}m</span>
                                            </div>
                                        </div>
                                        <div className="text-[10.5px] italic text-slate-600">
                                            Bệnh TMH khác: {clinical.kham_tai_mui_hong || clinical.benh_khac_tai_mui_hong || 'Tai sạch, màng nhĩ hai bên nguyên vẹn, mũi họng sạch.'}
                                        </div>
                                    </td>
                                    <td className="border border-black p-1.5 text-center align-bottom h-14">
                                        <div className="font-bold text-[11px] uppercase">{resolveSpecialtyDoctorName('ent')}</div>
                                    </td>
                                </tr>

                                {/* 5. Tim mạch */}
                                <tr>
                                    <td className="border border-black p-1.5 font-bold align-top">5. Tim mạch</td>
                                    <td className="border border-black p-1.5 align-top">
                                        <div>{clinical.noi_khoa_tuan_hoan || clinical.tim_mach || 'Tiếng tim T1, T2 đều rõ, không có tiếng thổi bệnh lý.'}</div>
                                    </td>
                                    <td className="border border-black p-1.5 text-center align-bottom h-14">
                                        <div className="font-bold text-[11px] uppercase">{resolveSpecialtyDoctorName('internal')}</div>
                                    </td>
                                </tr>

                                {/* 6. Hô hấp */}
                                <tr>
                                    <td className="border border-black p-1.5 font-bold align-top">6. Hô hấp</td>
                                    <td className="border border-black p-1.5 align-top">
                                        <div>{clinical.noi_khoa_ho_hap || clinical.kq_lam_sang_ho_hap || clinical.ho_hap || 'Rì rào phế nang êm dịu 2 phế trường, không rale.'}</div>
                                    </td>
                                    <td className="border border-black p-1.5 text-center align-bottom h-14">
                                        <div className="font-bold text-[11px] uppercase">{resolveSpecialtyDoctorName('internal')}</div>
                                    </td>
                                </tr>

                                {/* 7. Cơ - Xương - Khớp */}
                                <tr>
                                    <td className="border border-black p-1.5 font-bold align-top">7. Cơ xương khớp</td>
                                    <td className="border border-black p-1.5 align-top">
                                        <div>{clinical.noi_khoa_co_xuong_khop || clinical.kq_co_xuong_khop || 'Hệ vận động, cột sống và các khớp linh hoạt, không biến dạng.'}</div>
                                    </td>
                                    <td className="border border-black p-1.5 text-center align-bottom h-14">
                                        <div className="font-bold text-[11px] uppercase">{resolveSpecialtyDoctorName('surgery')}</div>
                                    </td>
                                </tr>

                                {/* 8. Nội tiết & Thai sản */}
                                <tr>
                                    <td className="border border-black p-1.5 font-bold align-top">8. Nội tiết / Khác</td>
                                    <td className="border border-black p-1.5 align-top">
                                        <div>Tuyến giáp không to, các cơ quan nội tiết bình thường. {isNu && clinical.kham_san_phu_khoa && `Sản phụ khoa: ${clinical.kham_san_phu_khoa}`}</div>
                                    </td>
                                    <td className="border border-black p-1.5 text-center align-bottom h-14">
                                        <div className="font-bold text-[11px] uppercase">{resolveSpecialtyDoctorName('internal')}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="pt-2 text-right text-[10px] text-slate-500 font-mono">Trang 2/3</div>
            </div>

            {/* ========================================== TRANG 3 ========================================== */}
            <div className="a4-page bg-white text-black p-8 shadow-md print:shadow-none w-[210mm] min-h-[297mm] box-border relative flex flex-col justify-between text-[12px] leading-normal">
                <div>
                    {/* Phần V: Khám cận lâm sàng */}
                    <div className="mb-4">
                        <div className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-2">
                            V. KHÁM CẬN LÂM SÀNG
                        </div>

                        {isDriver ? (
                            <div className="space-y-2">
                                {/* A. Xét nghiệm ma túy */}
                                <div className="p-2.5 border border-black rounded bg-slate-50">
                                    <div className="font-bold text-[12px] text-slate-900 mb-1 flex items-center justify-between">
                                        <span>1. Xét nghiệm Ma túy (Morphin/Heroin, Amphetamin, Marijuana, Methamphetamin, Codein):</span>
                                        <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold border border-emerald-300">Bắt buộc</span>
                                    </div>
                                    <div className="text-[12px]">
                                        Kết quả: <span className="font-extrabold text-[12.5px] text-[#0f766e]">{lab.kq_xn_mai_tuy || lab.kq_xn_ma_tuy || 'Âm tính'}</span>
                                    </div>
                                </div>

                                {/* B. Xét nghiệm nồng độ cồn */}
                                <div className="p-2.5 border border-black rounded bg-slate-50">
                                    <div className="font-bold text-[12px] text-slate-900 mb-1 flex items-center justify-between">
                                        <span>2. Xét nghiệm Nồng độ cồn (Định lượng nồng độ trong máu hoặc hơi thở):</span>
                                        <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold border border-emerald-300">Bắt buộc</span>
                                    </div>
                                    <div className="text-[12px]">
                                        Kết quả: <span className="font-extrabold text-[12.5px] font-mono text-[#0f766e]">{lab.kq_xn_nong_do_con || '0.0 mg/L (Âm tính)'}</span>
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
                                            <div className="font-bold text-[12px] text-slate-900 mb-1">
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
                            /* Biểu mẫu KSK định kỳ / Thông thường (Mẫu 3) */
                            <div className="space-y-2.5">
                                {(() => {
                                    const paraclinicalItems: any[] = lab.paraclinical_items || lab.paraclinicalItems || [];
                                    const validItems = paraclinicalItems.filter((item: any) => {
                                        const val = String(item.value || item.conclusion || item.description || '').trim();
                                        return val !== '' && val !== 'undefined' && val !== 'null';
                                    });

                                    const xnItems = validItems.filter((x: any) => x.type === 'XN' || String(x.group_id || '').startsWith('A'));
                                    const haItems = validItems.filter((x: any) => x.type === 'HA' || String(x.group_id || '').startsWith('B2') || String(x.group_id || '').startsWith('C'));
                                    const tdItems = validItems.filter((x: any) => x.type === 'TD' || String(x.group_id || '').startsWith('B3') || String(x.group_id || '').startsWith('D'));

                                    const hasBloodFields = !!(lab.blood_test?.hemoglobin || lab.blood_test?.glycemia || lab.blood_test?.glucose || lab.glycemia || lab.hemoglobin);
                                    const hasUrineFields = !!(lab.urine_test?.protein || lab.urine_test?.sugar || lab.protein);

                                    if (validItems.length === 0 && !hasBloodFields && !hasUrineFields && !lab.ket_luan_xn_khac) {
                                        return (
                                            <div className="p-3 border border-dashed border-slate-300 rounded text-center text-slate-500 italic text-[11.5px]">
                                                Không có chỉ định hoặc chưa có kết quả cận lâm sàng
                                            </div>
                                        );
                                    }

                                    return (
                                        <>
                                            {/* 1. Xét nghiệm (Máu & Nước tiểu) */}
                                            {(xnItems.length > 0 || hasBloodFields || hasUrineFields) && (
                                                <div className="border border-black rounded overflow-hidden">
                                                    <div className="bg-slate-100 px-2.5 py-1 font-bold text-[11.5px] border-b border-black">
                                                        1. KẾT QUẢ XÉT NGHIỆM
                                                    </div>
                                                    <table className="w-full text-[11.5px] border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50 text-slate-700 border-b border-black">
                                                                <th className="p-1.5 text-center w-[8%] border-r border-black">STT</th>
                                                                <th className="p-1.5 text-left border-r border-black">Tên xét nghiệm / Chỉ số</th>
                                                                <th className="p-1.5 text-center w-[25%] border-r border-black">Kết quả</th>
                                                                <th className="p-1.5 text-center w-[15%] border-r border-black">Đơn vị</th>
                                                                <th className="p-1.5 text-left w-[25%]">Đánh giá / Kết luận</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {/* Chỉ số đường máu / hemoglobin từ core fields nếu chưa có trong xnItems */}
                                                            {hasBloodFields && !xnItems.some(x => String(x.service_name || '').toLowerCase().includes('đường') || String(x.service_name || '').toLowerCase().includes('glucose')) && (
                                                                <tr className="border-b border-slate-200">
                                                                    <td className="p-1.5 text-center border-r border-black">1</td>
                                                                    <td className="p-1.5 font-semibold border-r border-black">Đường máu (Glucose / Glycemia)</td>
                                                                    <td className="p-1.5 text-center font-bold text-[#0f766e] border-r border-black">{lab.blood_test?.glycemia || lab.glycemia || lab.blood_test?.glucose || ''}</td>
                                                                    <td className="p-1.5 text-center border-r border-black">mmol/L</td>
                                                                    <td className="p-1.5">Bình thường</td>
                                                                </tr>
                                                            )}
                                                            {hasUrineFields && !xnItems.some(x => String(x.service_name || '').toLowerCase().includes('protein') || String(x.service_name || '').toLowerCase().includes('nước tiểu')) && (
                                                                <tr className="border-b border-slate-200">
                                                                    <td className="p-1.5 text-center border-r border-black">{hasBloodFields ? 2 : 1}</td>
                                                                    <td className="p-1.5 font-semibold border-r border-black">Protein nước tiểu</td>
                                                                    <td className="p-1.5 text-center font-bold text-[#0f766e] border-r border-black">{lab.urine_test?.protein || lab.protein || 'Âm tính'}</td>
                                                                    <td className="p-1.5 text-center border-r border-black">g/L</td>
                                                                    <td className="p-1.5">Bình thường</td>
                                                                </tr>
                                                            )}
                                                            {xnItems.map((item: any, idx: number) => (
                                                                <tr key={idx} className="border-b border-slate-200 last:border-b-0">
                                                                    <td className="p-1.5 text-center border-r border-black">{idx + 1}</td>
                                                                    <td className="p-1.5 font-semibold border-r border-black">{item.service_name || item.index_name}</td>
                                                                    <td className="p-1.5 text-center font-bold text-[#0f766e] border-r border-black">{item.value || item.conclusion}</td>
                                                                    <td className="p-1.5 text-center border-r border-black">{item.unit || ''}</td>
                                                                    <td className="p-1.5">{item.conclusion || item.description || 'Bình thường'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* 2. Chẩn đoán hình ảnh */}
                                            {haItems.length > 0 && (
                                                <div className="border border-black rounded overflow-hidden">
                                                    <div className="bg-slate-100 px-2.5 py-1 font-bold text-[11.5px] border-b border-black">
                                                        2. CHẨN ĐOÁN HÌNH ẢNH (X-QUANG, SIÊU ÂM, CT, MRI)
                                                    </div>
                                                    <div className="p-2 space-y-1.5">
                                                        {haItems.map((item: any, idx: number) => (
                                                            <div key={idx} className="text-[11.5px]">
                                                                <span className="font-bold">• {item.service_name}: </span>
                                                                <span className="font-semibold text-slate-800">{item.value || item.conclusion || item.description || 'Bình thường'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3. Thăm dò chức năng */}
                                            {tdItems.length > 0 && (
                                                <div className="border border-black rounded overflow-hidden">
                                                    <div className="bg-slate-100 px-2.5 py-1 font-bold text-[11.5px] border-b border-black">
                                                        3. THĂM DÒ CHỨC NĂNG (ĐIỆN TIM, ĐIỆN NÃO, ĐO CHỨC NĂNG HÔ HẤP...)
                                                    </div>
                                                    <div className="p-2 space-y-1.5">
                                                        {tdItems.map((item: any, idx: number) => (
                                                            <div key={idx} className="text-[11.5px]">
                                                                <span className="font-bold">• {item.service_name}: </span>
                                                                <span className="font-semibold text-slate-800">{item.value || item.conclusion || item.description || 'Bình thường'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Kết luận CLS khác nếu có */}
                                            {lab.ket_luan_xn_khac && (
                                                <div className="p-2 border border-black rounded bg-slate-50 text-[11.5px]">
                                                    <span className="font-bold">Kết luận cận lâm sàng khác: </span>
                                                    <span className="font-semibold">{lab.ket_luan_xn_khac}</span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Phần VI: Kết luận */}
                    <div className="mb-4">
                        <div className="font-bold text-[13px] uppercase border-b border-black pb-0.5 mb-2">
                            VI. KẾT LUẬN
                        </div>

                        <div className="p-3 border-2 border-black rounded-lg bg-slate-50/50 space-y-2">
                            {isDriver ? (
                                <div className="text-[13px]">
                                    <span className="font-bold">1. Đánh giá tình trạng sức khỏe:</span>
                                    <div className="pl-3 mt-1 space-y-1">
                                        <div>
                                            {renderCheckbox(isDuDieuKien, '')}
                                            <span className={`font-bold ${isDuDieuKien ? 'text-[#0f766e] text-[13.5px]' : ''}`}>
                                                Đủ điều kiện sức khỏe lái xe hạng: <span className="underline uppercase font-extrabold">{licenseClass}</span>
                                            </span>
                                        </div>
                                        <div>
                                            {renderCheckbox(isKhongDuDieuKien, '')}
                                            <span className={`font-bold ${isKhongDuDieuKien ? 'text-red-600 text-[13.5px]' : ''}`}>
                                                Không đủ điều kiện sức khỏe lái xe hạng: <span className="uppercase font-extrabold">{licenseClass}</span>
                                            </span>
                                        </div>
                                        <div>
                                            {renderCheckbox(isKhamLai, '')}
                                            <span className="font-semibold">Khám lại sau: ....................................................</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[13px]">
                                    <span className="font-bold">1. Phân loại sức khỏe: </span>
                                    <span className="font-bold text-[13.5px] text-[#0f766e]">
                                        Loại {conclusion.fitness_class || 'I'} - {formatFitnessClassName(conclusion.fitness_class || '1')}
                                    </span>
                                </div>
                            )}

                            <div className="text-[12px]">
                                <span className="font-bold">2. Các bệnh, tật (nếu có) / Mã ICD-10: </span>
                                <span className="font-semibold font-mono text-slate-800">
                                    {conclusion.diagnosis || conclusion.ket_luan_benh || 'Không phát hiện bất thường (Z00.0)'}
                                </span>
                            </div>

                            {!isDriver && (
                                <div className="text-[12px]">
                                    <span className="font-bold">3. Tình trạng sức khỏe; mắc các bệnh, tật (nếu có): </span>
                                    <span className="font-semibold text-slate-800">
                                        {conclusion.cac_benh_tat_neu_co || extra.cac_benh_tat_neu_co || 'Bình thường'}
                                    </span>
                                </div>
                            )}

                            <div className="text-[12px]">
                                <span className="font-bold">{isDriver ? '3' : '4'}. Các vấn đề sức khỏe cần lưu ý: </span>
                                <span className="font-semibold">
                                    {conclusion.cac_van_de_luu_y || conclusion.ket_luan_cac_van_de_suc_khoe || 'Không có vấn đề bất thường, duy trì lối sống lành mạnh.'}
                                </span>
                            </div>

                            <div className="text-[11px] italic text-slate-600 pt-1 border-t border-slate-200">
                                * Giấy khám sức khỏe này có giá trị sử dụng trong thời hạn 06 tháng kể từ ngày ký kết luận.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phần Ký số & Đóng dấu */}
                <div className="pt-2">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        {/* Đại diện CSKCB */}
                        <div>
                            <div className="font-bold uppercase text-[12px] leading-tight">ĐẠI DIỆN CƠ SỞ KCB</div>
                            <div className="italic text-[10.5px] text-slate-500 mb-2">(Ký, ghi rõ họ tên và đóng dấu)</div>
                            
                            {/* Khung dấu / Chữ ký số CSKB */}
                            <div className="h-20 flex flex-col items-center justify-center">
                                <div className="border border-teal-600 bg-teal-50/60 text-teal-800 px-3 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                    </svg>
                                    <span>ĐÃ KÝ SỐ ĐIỆN TỬ CSKCB</span>
                                </div>
                                <div className="text-[10px] font-bold mt-1 uppercase text-slate-700">{hospitalName}</div>
                            </div>
                        </div>

                        {/* Bác sĩ kết luận */}
                        <div>
                            <div className="italic text-[11.5px]">
                                Ngày {getReportDate().day} tháng {getReportDate().month} năm {getReportDate().year}
                            </div>
                            <div className="font-bold uppercase text-[12px] mt-0.5 leading-tight">NGƯỜI KẾT LUẬN</div>
                            <div className="italic text-[10.5px] text-slate-500 mb-2">(Ký, ghi rõ họ tên và chức danh)</div>

                            {/* Chữ ký bác sĩ */}
                            <div className="h-20 flex flex-col items-center justify-center">
                                {conclusionSig ? (
                                    <img src={conclusionSig} alt="Chữ ký" className="max-h-16 max-w-[140px] object-contain" />
                                ) : (
                                    <div className="border border-emerald-600 bg-emerald-50/60 text-emerald-800 px-3 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                        <span>CHỮ KÝ SỐ BÁC SĨ HỢP LỆ</span>
                                    </div>
                                )}
                            </div>
                            <div className="font-extrabold uppercase text-[12.5px] font-sans tracking-wide text-slate-900 mt-1">
                                {getConclusionDoctorName()}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-3 pt-1 border-t border-slate-300">
                        <span>Hệ thống Quản lý Y tế VIMES HIS - QĐ 1551/QĐ-BYT</span>
                        <span>Trang 3/3</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintFormMau3;
