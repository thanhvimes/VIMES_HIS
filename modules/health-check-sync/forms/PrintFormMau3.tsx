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
    doctorSignatures?: Record<string, string>;
}

const STATIC_LABELS = {
    hospitalTitle: "VIMES HIS",
    nationalTitle: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
    nationalSubtitle: "Độc lập - Tự do - Hạnh phúc",
    formTitle: "MẪU KHÁM SỨC KHỎE ĐỊNH KỲ",
    formSubtitle: "(Dùng cho người từ đủ 18 tuổi trở lên)",
    photoLabel: "Ảnh (4 x 6 cm)",
    lblHoTen: "1. Họ và tên (viết chữ in hoa):",
    lblGioiTinh: "2. Giới tính:",
    lblNgaySinh: "3. Ngày sinh:",
    lblTuoi: "Tuổi:",
    lblTuoiSuffix: "tuổi",
    lblCccd: "4. Số CCCD/Hộ chiếu/Mã định danh:",
    lblCapNgay: "5. Cấp ngày:",
    lblNoiCap: "Nơi cấp:",
    lblDanToc: "6. Dân tộc:",
    lblDoiTuong: "7. Đối tượng:",
    lblNguonChiTra: "8. Nguồn chi trả:",
    lblNhomMau: "9. Nhóm máu:",
    lblNoiO: "10. Nơi ở hiện tại:",
    lblTinhThanh: "Tỉnh/ thành:",
    lblPhuongXa: "phường/ xã:",
    lblSoNhaThon: "số nhà/ thôn/ xóm:",
    lblSdt: "11. Số điện thoại liên hệ:",
    lblLoaiHinhKcb: "Loại hình khám bệnh, chữa bệnh:",
    cccdNote: "* Lưu ý: Trường hợp đối tượng KSK có CCCD gắn chíp hoặc có số định danh công dân đã thực hiện kết nối với cơ sở dữ liệu quốc gia về dân cư, phần HÀNH CHÍNH nêu trên chỉ cần ghi mục (1) Họ và tên, (3) Ngày tháng năm sinh, (4) số định danh công dân",
    lblNgheNghiep: "7. Nghề nghiệp:",
    lblNoiCongTac: "8. Nơi công tác, học tập:",
    lblNgayBatDauLamViec: "9. Ngày bắt đầu vào làm việc tại đơn vị hiện nay:",
    lblNgheCongViecTruocDay: "10. Nghề, công việc trước đây (liệt kê công việc đã làm trong 10 năm gần đây, tính từ thời điểm gần nhất):",
    titleTienSuBenh: "TIỀN SỬ BỆNH CỦA ĐỐI TƯỢNG KHÁM SỨC KHỎE",
    lblTienSuGiaDinh: "1. Tiền sử gia đình:",
    tsgdDetail: "Có ai trong gia đình ông (bà) mắc một trong các bệnh: truyền nhiễm, tim mạch, đái tháo đường, lao, hen phế quản, ung thư, động kinh, rối loạn tâm thần, bệnh khác:",
    lblKhong: "Không",
    lblCo: "Có",
    lblTsgdGhiRo: "Nếu \"có\", đề nghị ghi cụ thể tên bệnh:",
    lblTienSuBanThan: "2. Tiền sử bản thân: Ông (bà) đã/đang mắc bệnh, tình trạng bệnh nào sau đây không:",
    colTT: "TT",
    colTenBenh: "Tên bệnh, tật",
    colSTT: "STT",
    colCó: "Có",
    colKhông: "Không",
    lblCauHoiKhac: "3. Câu hỏi khác (nếu có):",
    lblDangDieuTri: "a) Ông (bà) có đang điều trị bệnh gì không?",
    lblCamDoan: "Tôi xin cam đoan những điều khai trên đây hoàn toàn đúng với sự thật theo sự hiểu biết của tôi.",
    lblNguoiDeNghi: "Người đề nghị khám sức khỏe",
    lblKyGhiRo: "(Ký và ghi rõ họ, tên)",
    titleTheLuc: "II. KHÁM THỂ LỰC",
    lblChieuCao: "Chiều cao:",
    lblCanNang: "Cân nặng:",
    lblBmi: "Chỉ số BMI:",
    lblMach: "Mạch:",
    lblHuyetAp: "Huyết áp:",
    lblPhanLoaiTheLuc: "Phân loại thể lực:",
    titleLamSang: "III. KHÁM LÂM SÀNG",
    lamSangNote: "phải khám đầy đủ các nội dung theo chuyên khoa để khẳng định có/hay không có bệnh, tật theo quy định tại Quyết định số 498/QĐ-BYT ngày 28 tháng 12 năm 2017 của Bộ trưởng Bộ Y tế",
    colNoidungKham: "Nội dung khám",
    colChuKyBs: "Họ tên và chữ ký của Bác sỹ chuyên khoa",
    colChuKyBsCns: "Họ tên, chữ ký của Bác sỹ",
    lblNoiKhoa: "1. Nội khoa",
    lblTuanHoan: "a) Tuần hoàn:",
    lblHoHap: "b) Hô hấp:",
    lblTieuHoa: "c) Tiêu hóa:",
    lblThanTietNieu: "d) Thận - Tiết niệu:",
    lblNoiTiet: "đ) Nội tiết:",
    lblCoXuongKhop: "e) Cơ - xương - khớp:",
    lblThanKinh: "g) Thần kinh:",
    lblTamThan: "h) Tâm thần:",
    lblNgoaiKhoa: "2. Ngoại khoa",
    lblDaLieu: "3. Da liễu:",
    lblSanPhuKhoa: "4. Sản Phụ khoa:",
    lblMat: "5. Mắt:",
    lblThiLucKhongKinh: "Kết quả khám thị lực: Không kính: Mắt phải:",
    lblThiLucCoKinh: "Có kính: Mắt phải:",
    lblMatMatTrai: "Mắt trái:",
    lblBenhMat: "Các bệnh về mắt (nếu có):",
    lblTaiMuiHong: "6. Tai - Mũi - Họng:",
    lblThinhLuc: "Kết quả khám thính lực:",
    lblTaiTrai: "Tai trái: Nói thường:",
    lblTaiPhai: "Tai phải: Nói thường:",
    lblNoiTham: "Nói thầm:",
    lblBenhTmh: "Các bệnh về tai mũi họng (nếu có):",
    lblRangHamMat: "7. Răng-hàm-mặt:",
    lblKqHam: "Kết quả khám: Hàm trên:",
    lblHamDuoi: "Hàm dưới:",
    lblBenhRhm: "Các bệnh về răng hàm mặt (nếu có):",
    titleCanLamSang: "III. KHÁM CẬN LÂM SÀNG",
    clsNote: "1. Khám phân loại sức khỏe để đi học, đi làm thực hiện khám cận lâm sàng",
    lblXnMau: "a) Xét nghiệm máu",
    lblTongPhanTichMau: "- Tổng phân tích tế bào máu ngoại vi:",
    lblDuongMau: "- Đường máu:",
    lblUre: "- Urê:",
    lblCreatinine: "- Creatinine:",
    lblAsat: "- ASAT:",
    lblAlat: "- ALAT:",
    lblXnNuocTieu: "b) Xét nghiệm nước tiểu",
    lblXnNuocTieuMay: "- Tổng phân tích nước tiểu (Bằng máy tự động):",
    lblXqNguc: "c) Chẩn đoán hình ảnh (XQ tim phổi thẳng)",
    lblXqResult: "Kết quả:",
    lblClsKhac: "d) Kết quả khám Cận lâm sàng khác",
    lblChiTiet: "Chi tiết:",
    lblDanhGia: "Đánh giá:",
    lblKetLuan: "Kết luận:",
    titleKetLuan: "V. KẾT LUẬN",
    lblTinhTrangSk: "1. Tình trạng sức khỏe (1):",
    lblPhanLoaiSk: "2. Phân loại sức khỏe (2):",
    lblLoaiI: "Loại I (Rất khỏe)",
    lblLoaiII: "Loại II (Khỏe)",
    lblLoaiIII: "Loại III (Trung bình)",
    lblLoaiIV: "Loại IV (Yếu)",
    lblLoaiV: "Loại V (Rất yếu)",
    lblNguoiKetLuan: "NGƯỜI KẾT LUẬN",
    lblKyGhiRoDongDau: "(Ký, ghi rõ họ tên và đóng dấu)",
    note1: "1 Ghi rõ các bệnh, tật, hoặc giới thiệu khám chuyên khoa để khám bệnh, chữa bệnh (nếu có).",
    note2: "2 Phân loại sức khỏe theo quy định của Bộ Y tế."
};

export const PrintFormMau3: React.FC<PrintFormMau3Props> = ({
    document,
    hospitalName,
    logoUrl,
    getReportDate,
    getConclusionDoctorName,
    doctors,
    icd10Names,
    COMMON_ICD10,
    doctorSignatures
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

    const docNormalized = normalizeObject(document);
    const hospitalNameNormalized = normalizeObject(hospitalName);
    const L = normalizeObject(STATIC_LABELS);

    const clinical = docNormalized.clinical_data || docNormalized.clinicalData || {};
    const clinicalExam = clinical.clinical_exam || clinical.clinicalExam || {};
    const extra = clinical.extra || {};
    const lab = docNormalized.lab_data || docNormalized.labData || {};
    const conclusion = docNormalized.conclusion_data || docNormalized.conclusionData || {};
    const paraclinicalItems = lab.paraclinical_items || lab.paraclinicalItems || [];

    const isNam = docNormalized.gender === 'Nam' || docNormalized.gender === '1';
    const isNu = docNormalized.gender === 'Nữ' || docNormalized.gender === '2' || docNormalized.gender === '0';

    const getAge = (dobString: any) => {
        if (!dobString) return '...';
        try {
            const birthDate = new Date(dobString);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        } catch {
            return '...';
        }
    };

    const getBirthDateDetails = (dobString: any) => {
        if (!dobString) return { day: '...', month: '...', year: '...' };
        try {
            const birthDate = new Date(dobString);
            return {
                day: String(birthDate.getDate()).padStart(2, '0'),
                month: String(birthDate.getMonth() + 1).padStart(2, '0'),
                year: birthDate.getFullYear()
            };
        } catch {
            return { day: '...', month: '...', year: '...' };
        }
    };

    const formatIcd10String = (codeStr: string) => {
        if (!codeStr) return '';
        const codes = codeStr.split(',').map(s => s.trim()).filter(Boolean);
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

    const hasSpecialtyData = (specialty: string) => {
        if (specialty === 'tuan_hoan') return !!(clinicalExam.tuan_hoan || clinicalExam.tuanHoan);
        if (specialty === 'ho_hap') return !!(clinicalExam.ho_hap || clinicalExam.hoHap);
        if (specialty === 'tieu_hoa') return !!(clinicalExam.tieu_hoa || clinicalExam.tieuHoa);
        if (specialty === 'than_tiet_nieu') return !!(clinicalExam.than_tiet_nieu || clinicalExam.thanTietNieu);
        if (specialty === 'than_kinh') return !!(clinicalExam.than_kinh || clinicalExam.thanKinh);
        if (specialty === 'tam_than') return !!(clinicalExam.tam_than || clinicalExam.tamThan);
        if (specialty === 'co_xuong_khop') return !!(clinicalExam.co_xuong_khop || clinicalExam.coXuongKhop);
        if (specialty === 'noi_tiet') return !!(clinicalExam.noi_tiet || clinicalExam.noiTiet);
        if (specialty === 'ngoai_khoa') return !!(clinicalExam.surgery || clinicalExam.ngoai_khoa_pl || clinicalExam.ngoai_khoa || clinicalExam.external);
        if (specialty === 'san_phu_khoa') return !!(clinicalExam.gynecological || clinicalExam.san_phu_khoa_pl || clinicalExam.phu_khoa || clinicalExam.gynecology);
        if (specialty === 'mat') return !!(clinicalExam.eye || clinicalExam.kham_mat_pl || clinicalExam.khong_kinh_mat_phai || clinicalExam.khong_kinh_mat_trai);
        if (specialty === 'tai_mui_hong') return !!(clinicalExam.ent || clinicalExam.kham_tai_mui_hong_pl || clinicalExam.tai_trai_noi_thuong || clinicalExam.tai_phai_noi_thuong);
        if (specialty === 'rang_ham_mat') return !!(clinicalExam.dental || clinicalExam.kham_rang_ham_mat_pl || clinicalExam.ham_tren || clinicalExam.ham_duoi);
        if (specialty === 'da_lieu') return !!(clinicalExam.dermatology || clinicalExam.da_lieu_pl || clinicalExam.kham_da_lieu || clinicalExam.kq_da_lieu);
        return false;
    };

    const getDoctor = (specialty: string) => {
        const hasData = hasSpecialtyData(specialty);
        if (!hasData) return '';

        const metadataMap: Record<string, string> = {
            tuan_hoan: 'internal',
            ho_hap: 'internal',
            tieu_hoa: 'internal',
            than_tiet_nieu: 'internal',
            than_kinh: 'internal',
            tam_than: 'internal',
            co_xuong_khop: 'internal',
            noi_tiet: 'internal',
            ngoai_khoa: 'surgery',
            san_phu_khoa: 'gynecological',
            mat: 'eye',
            tai_mui_hong: 'ent',
            rang_ham_mat: 'dental',
            da_lieu: 'dermatology'
        };
        
        const metaKey = metadataMap[specialty];
        const docMeta = clinical.specialty_metadata?.[metaKey] || clinicalExam.specialty_metadata?.[metaKey];
        if (docMeta?.doctorId) {
            const found = doctors.find(d => [d.id, d.hee_employee_id, d.code, d.username]
                .some(value => String(value || '').trim().toUpperCase() === String(docMeta.doctorId).trim().toUpperCase()));
            if (found) return found.name || found.hee_fullname;
        }

        if (metaKey && clinicalExam.specialty_metadata?.[metaKey]?.doctorName) {
            return clinicalExam.specialty_metadata[metaKey].doctorName;
        }
        return '';
    };

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

    const renderDoctorCell = (specialty: string) => {
        const docName = getDoctor(specialty);
        if (!docName) return null;

        const metadataMap: Record<string, string> = {
            tuan_hoan: 'internal',
            ho_hap: 'internal',
            tieu_hoa: 'internal',
            than_tiet_nieu: 'internal',
            than_kinh: 'internal',
            tam_than: 'internal',
            co_xuong_khop: 'internal',
            noi_tiet: 'internal',
            ngoai_khoa: 'surgery',
            san_phu_khoa: 'gynecological',
            mat: 'eye',
            tai_mui_hong: 'ent',
            rang_ham_mat: 'dental',
            da_lieu: 'dermatology',
            lab: 'lab',
            imaging: 'imaging'
        };
        
        const metaKey = metadataMap[specialty];
        const docMeta = clinical.specialty_metadata?.[metaKey] || clinicalExam.specialty_metadata?.[metaKey];

        const doctorByMetadata = findDoctorByIdentifier(docMeta?.doctorCode)
            || findDoctorByIdentifier(docMeta?.doctorUsername)
            || findDoctorByIdentifier(docMeta?.doctorId);
        const doctorByName = doctors.find(d => (d.name || d.hee_fullname) === docName);
        const matchedDoctor = doctorByMetadata || doctorByName;
        let docCode = (docMeta?.doctorCode || docMeta?.doctorUsername || matchedDoctor?.code
            || matchedDoctor?.username || matchedDoctor?.hee_employee_id || docMeta?.doctorId || '').toString().trim().toUpperCase();

        if (!docCode) {
            const conclusion = document.conclusion_data || document.conclusionData || {};
            docCode = (conclusion.doctor_code || conclusion.doctor_username || conclusion.conclusion_doctor || conclusion.doctor || '').toString().trim().toUpperCase();
        }

        const sigImg = resolveDoctorSignature(
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
            <div className="flex items-center justify-center gap-2 py-1 min-h-[44px]">
                {sigImg && (
                    <img 
                        src={sigImg} 
                        alt="Chữ ký" 
                        className="h-10 max-w-[100px] object-contain shrink-0" 
                    />
                )}
                <span className="font-bold text-[12px] text-slate-800 leading-tight">{displayName}</span>
            </div>
        );
    };

    const getPl = (specialty: string) => {
        if (specialty === 'tuan_hoan') return clinicalExam.tuan_hoan_pl || clinicalExam.tuanHoanPl || clinical.tuan_hoan_pl || '';
        if (specialty === 'ho_hap') return clinicalExam.ho_hap_pl || clinicalExam.hoHapPl || clinical.ho_hap_pl || '';
        if (specialty === 'tieu_hoa') return clinicalExam.tieu_hoa_pl || clinicalExam.tieuHoaPl || clinical.tieu_hoa_pl || '';
        if (specialty === 'than_tiet_nieu') return clinicalExam.than_tiet_nieu_pl || clinicalExam.thanTietNieuPl || clinical.than_tiet_nieu_pl || '';
        if (specialty === 'noi_tiet') return clinicalExam.noi_tiet_pl || clinicalExam.noiTietPl || clinical.noi_tiet_pl || '';
        if (specialty === 'co_xuong_khop') return clinicalExam.co_xuong_khop_pl || clinicalExam.coXuongKhopPl || clinical.co_xuong_khop_pl || '';
        if (specialty === 'than_kinh') return clinicalExam.than_kinh_pl || clinicalExam.thanKinhPl || clinical.than_kinh_pl || '';
        if (specialty === 'tam_than') return clinicalExam.tam_than_pl || clinicalExam.tamThanPl || clinical.tam_than_pl || '';
        if (specialty === 'ngoai_khoa') return clinicalExam.ngoai_khoa_pl || clinicalExam.surgeryPl || clinical.ngoai_khoa_pl || '';
        if (specialty === 'da_lieu') return clinicalExam.da_lieu_pl || clinicalExam.dermatologyPl || clinical.da_lieu_pl || '';
        if (specialty === 'san_phu_khoa') return clinicalExam.san_phu_khoa_pl || clinicalExam.gynecologicalPl || clinical.san_phu_khoa_pl || '';
        if (specialty === 'mat') return clinicalExam.kham_mat_pl || clinicalExam.eyePl || clinical.kham_mat_pl || '';
        if (specialty === 'tai_mui_hong') return clinicalExam.kham_tai_mui_hong_pl || clinicalExam.entPl || clinical.kham_tai_mui_hong_pl || '';
        if (specialty === 'rang_ham_mat') return clinicalExam.kham_rang_ham_mat_pl || clinicalExam.dentalPl || clinical.kham_rang_ham_mat_pl || '';
        return '';
    };

    const renderPl = (specialty: string) => {
        const pl = getPl(specialty);
        return (
            <div className="pl-4 text-[12px] mt-0.5 text-gray-500 font-normal">
                Phân loại: {pl || ''}
            </div>
        );
    };

    const cccdDate = clinical.cccd_date || clinical.ngaycap_cccd || extra.cccd_date || extra.ngaycap_cccd || docNormalized.cccd_date || '';
    const cccdPlace = clinical.cccd_place || clinical.noicap_cccd || extra.cccd_place || extra.noicap_cccd || docNormalized.cccd_place || '';

    // Extracted measurements
    const examHeight = clinical.examination?.height || extra.height || '';
    const examWeight = clinical.examination?.weight || extra.weight || '';
    const examBmi = clinical.examination?.bmi || extra.bmi || '';
    const examPulse = clinical.examination?.pulse || extra.pulse || '';
    const examBp = clinical.examination?.blood_pressure || extra.bp || '';
    const physicalPl = clinical.examination?.kham_the_luc_pl || extra.kham_the_luc_pl || '';

    // Extracted history checkboxes
    const ts5Nam = extra.ts_benh_thuong_5_nam || 0;
    const tsThanKinh = extra.ts_than_kinh_chan_thuong_dau || 0;
    const tsMat = extra.ts_benh_mat_giam_thi_luc || 0;
    const tsTai = extra.ts_benh_tai_giam_nghe || 0;
    const tsTimMach = extra.ts_benh_tim_mach || 0;
    const tsPhauThuatTim = extra.ts_phau_thuat_tim_mach || 0;
    const tsHuyetAp = extra.ts_tang_huyet_ap || 0;
    const tsKhoTho = extra.ts_kho_tho || 0;
    const tsPhoiHen = extra.ts_benh_phoi_hen || 0;
    const tsThan = extra.ts_benh_than_loc_mau || 0;
    const tsSuDungRuou = extra.ts_su_dung_ruou || 0;
    const tsTieuDuong = extra.ts_dai_thao_duong || 0;
    const tsTamThan = extra.ts_benh_tam_than || 0;
    const tsYThuc = extra.ts_mat_roi_loan_y_thuc || 0;
    const tsChongMat = extra.ts_ngat_chong_mat || 0;
    const tsTieuHoa = extra.ts_benh_tieu_hoa || 0;
    const tsGiacNgu = extra.ts_roi_loan_giac_ngu || 0;
    const tsTaiBien = extra.ts_tai_bien_mach_mau_nao || 0;
    const tsBenhCotSong = extra.ts_benh_cot_song || 0;
    const tsSuDungMaTuy = extra.ts_su_dung_ma_tuy || 0;

    const findParaclinicalValue = (keywords: string[]) => {
        const item = paraclinicalItems.find((x: any) => 
            keywords.some(kw => x.service_name?.toLowerCase().includes(kw.toLowerCase()))
        );
        return item?.value || '...';
    };

    const bloodSugar = findParaclinicalValue(['đường máu', 'glucose', 'glycemia']);
    const ureaVal = findParaclinicalValue(['urê', 'urea']);
    const creatinineVal = findParaclinicalValue(['creatinine', 'creatinin']);
    const asatVal = findParaclinicalValue(['ast', 'asat', 'got']);
    const alatVal = findParaclinicalValue(['alt', 'alat', 'gpt']);

    const urineTest = findParaclinicalValue(['nước tiểu', 'urine', 'protein']);
    const xqResult = findParaclinicalValue(['x-quang ngực', 'xq ngực', 'xq tim phổi', 'chụp x-quang', 'xq']);

    const dobDetails = getBirthDateDetails(docNormalized.dob);
    const reportDate = getReportDate();

    return (
        <div className="font-serif text-black leading-tight select-text">
            <style>{`
                .a4-page {
                    font-size: 12.5px;
                    font-family: "Times New Roman", Times, serif !important;
                    letter-spacing: normal !important;
                    line-height: 1.25 !important;
                }
                .a4-page * {
                    font-family: "Times New Roman", Times, serif !important;
                    letter-spacing: normal !important;
                }
                .a4-table th, .a4-table td {
                    padding: 2px 4px !important;
                    font-size: 12px !important;
                    line-height: 1.2 !important;
                }
                .a4-table th {
                    font-weight: bold;
                    background-color: #f3f4f6;
                }
                .line-underline {
                    border-bottom: 1px dotted black;
                    display: inline-block;
                    min-width: 100px;
                }
            `}</style>

            {/* ==================== PAGE 1 ==================== */}
            <div className="a4-page flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 w-[50%]">
                            {logoUrl && <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain shrink-0" />}
                            <div>
                                <strong className="text-[12px] uppercase block">{hospitalName || 'BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH'}</strong>
                                <span className="text-[11px] block mt-0.5">Số: ....../GKSK-.........</span>
                            </div>
                        </div>
                        <div className="text-center w-[48%]">
                            <strong className="text-[12px] uppercase block">{L.nationalTitle}</strong>
                            <strong className="text-[11px] block mt-0.5">{L.nationalSubtitle}</strong>
                            <div className="border-t border-black w-24 mx-auto mt-1"></div>
                        </div>
                    </div>

                    <div className="text-center my-4">
                        <h2 className="text-[16px] font-bold uppercase tracking-wide">{L.formTitle}</h2>
                        <span className="text-[13px] font-bold italic">{L.formSubtitle}</span>
                    </div>

                    <div className="flex gap-4 mt-2">
                        <div className="w-[120px] h-[160px] border border-black flex flex-col justify-center items-center text-center p-2 text-[11px] shrink-0">
                            <div>{L.photoLabel}</div>
                        </div>

                        <div className="flex-grow space-y-1.5 text-[13px]">
                            <div>
                                <span className="font-bold">{L.lblHoTen}</span> <span className="uppercase font-bold text-[13.5px]">{docNormalized.patient_name}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span><span className="font-bold">{L.lblGioiTinh}</span></span>
                                <span className="flex items-center gap-1">{isNam ? '☑' : '☐'} Nam</span>
                                <span className="flex items-center gap-1">{isNu ? '☑' : '☐'} Nữ</span>
                            </div>
                            <div>
                                <span className="font-bold">{L.lblNgaySinh}</span> <span>{dobDetails.day}</span> tháng <span>{dobDetails.month}</span> năm <span>{dobDetails.year}</span> <span className="ml-4 font-bold">({L.lblTuoi} {getAge(docNormalized.dob)} {L.lblTuoiSuffix})</span>
                            </div>
                            <div>
                                <span className="font-bold">{L.lblCccd}</span> <span>{docNormalized.cccd || '................................'}</span>
                            </div>
                            <div>
                                <span className="font-bold">{L.lblCapNgay}</span> <span>{cccdDate ? new Date(cccdDate).toLocaleDateString('vi-VN') : '.../.../....'}</span> <span className="ml-4 font-bold">{L.lblNoiCap}</span> <span>{cccdPlace || '................................'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><span className="font-bold">{L.lblDanToc}</span> <span>{clinical.nation || 'Kinh'}</span></div>
                                <div><span className="font-bold">{L.lblDoiTuong}</span> <span>{clinical.patient_type || '...'}</span></div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><span className="font-bold">{L.lblNguonChiTra}</span> <span>{clinical.payment_source || 'Khác'}</span></div>
                                <div><span className="font-bold">{L.lblNhomMau}</span> <span>{clinical.blood_group || '...'}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-[13px]">
                        <div>
                            <span className="font-bold">{L.lblNoiO}</span> {L.lblTinhThanh} <span className="font-semibold">{clinical.province || 'Tỉnh Ninh Bình'}</span>, {L.lblPhuongXa} <span className="font-semibold">{clinical.ward || 'Hoa Lư'}</span>, {L.lblSoNhaThon} <span>{clinical.address_detail || '...'}</span>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblSdt}</span> <span>{clinical.phone || '...'}</span>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblLoaiHinhKcb}</span> <span>{clinical.exam_type || '...'}</span>
                        </div>
                        <div className="text-[11px] italic leading-snug">
                            {L.cccdNote}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><span className="font-bold">{L.lblNgheNghiep}</span> <span>{clinical.job || '...'}</span></div>
                            <div><span className="font-bold">{L.lblNoiCongTac}</span> <span>{clinical.workplace || '...'}</span></div>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblNgayBatDauLamViec}</span> <span>{extra.ngay_bat_dau_lam_viec ? new Date(extra.ngay_bat_dau_lam_viec).toLocaleDateString('vi-VN') : '.../.../....'}</span>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblNgheCongViecTruocDay}</span>
                            <div className="pl-4 mt-0.5">
                                a) {extra.nghe_truoc_day_1 || '...'}
                            </div>
                            <div className="pl-4">
                                b) {extra.nghe_truoc_day_2 || '...'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="font-bold text-[14px] text-center uppercase tracking-wide">{L.titleTienSuBenh}</h3>
                        <div className="mt-1 text-[13px]">
                            <span className="font-bold">{L.lblTienSuGiaDinh}</span>
                            <div className="pl-4 leading-normal">
                                {L.tsgdDetail}
                                <div className="flex gap-8 mt-1">
                                    <span className="flex items-center gap-1">{extra.tsgd_mac_benh !== '1' ? '☑' : '☐'} a) {L.lblKhong}</span>
                                    <span className="flex items-center gap-1">{extra.tsgd_mac_benh === '1' ? '☑' : '☐'} b) {L.lblCo}; {L.lblTsgdGhiRo} <span className="font-bold">{extra.tsgd_ma_benh || '...'}</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 text-[13px]">
                            <span className="font-bold">{L.lblTienSuBanThan}</span>
                            <table className="a4-table w-full mt-1.5" data-mau3-history-part="1">
                                <thead>
                                    <tr className="font-bold text-center bg-gray-50">
                                        <th className="w-[5%]">{L.colTT}</th>
                                        <th className="w-[35%]">{L.colTenBenh}</th>
                                        <th className="w-[5%]">{L.colCó}</th>
                                        <th className="w-[5%]">{L.colKhông}</th>
                                        <th className="w-[5%]">{L.colSTT}</th>
                                        <th className="w-[35%]">{L.colTenBenh}</th>
                                        <th className="w-[5%]">{L.colCó}</th>
                                        <th className="w-[5%]">{L.colKhông}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="text-center">1</td>
                                        <td>Có bệnh hay bị thương trong 5 năm qua</td>
                                        <td className="text-center">{ts5Nam === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{ts5Nam === 0 ? 'x' : ''}</td>
                                        <td className="text-center">12</td>
                                        <td>Đái tháo đường</td>
                                        <td className="text-center">{tsTieuDuong === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{tsTieuDuong === 0 ? 'x' : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center">2</td>
                                        <td>Có bệnh thần kinh hay bị thương ở đầu</td>
                                        <td className="text-center">{tsThanKinh === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{tsThanKinh === 0 ? 'x' : ''}</td>
                                        <td className="text-center">13</td>
                                        <td>Bệnh tâm thần</td>
                                        <td className="text-center">{tsTamThan === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{tsTamThan === 0 ? 'x' : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center">3</td>
                                        <td>Bệnh mắt hoặc giảm thị lực</td>
                                        <td className="text-center">{tsMat === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{tsMat === 0 ? 'x' : ''}</td>
                                        <td className="text-center">14</td>
                                        <td>Mất ý thức, rối loạn ý thức</td>
                                        <td className="text-center">{tsYThuc === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{tsYThuc === 0 ? 'x' : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center">4</td>
                                        <td>Bệnh ở tai, giảm sức nghe hoặc thăng bằng</td>
                                        <td className="text-center">{tsTai === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{tsTai === 0 ? 'x' : ''}</td>
                                        <td className="text-center">15</td>
                                        <td>Ngất, chóng mặt</td>
                                        <td className="text-center">{tsChongMat === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{tsChongMat === 0 ? 'x' : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center">5</td>
                                        <td>Bệnh ở tim hoặc các bệnh tim mạch khác</td>
                                        <td className="text-center">{tsTimMach === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{tsTimMach === 0 ? 'x' : ''}</td>
                                        <td className="text-center">16</td>
                                        <td>Bệnh tiêu hóa</td>
                                        <td className="text-center">{tsTieuHoa === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{tsTieuHoa === 0 ? 'x' : ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center">6</td>
                                        <td>Phẫu thuật can thiệp tim - mạch</td>
                                        <td className="text-center">{tsPhauThuatTim === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{tsPhauThuatTim === 0 ? 'x' : ''}</td>
                                        <td className="text-center">17</td>
                                        <td>Rối loạn giấc ngủ</td>
                                        <td className="text-center">{tsGiacNgu === 1 ? 'x' : ''}</td>
                                        <td className="text-center">{tsGiacNgu === 0 ? 'x' : ''}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="text-right text-[11px] text-gray-500 font-sans" data-mau3-page-number>Trang 1/3</div>
            </div>

            {/* ==================== PAGE 2 ==================== */}
            <div className="a4-page flex flex-col justify-between">
                <div>
                    <table className="a4-table w-full" data-mau3-history-part="2">
                        <thead>
                            <tr className="font-bold text-center bg-gray-50">
                                <th className="w-[5%]">{L.colTT}</th>
                                <th className="w-[35%]">{L.colTenBenh}</th>
                                <th className="w-[5%]">{L.colCó}</th>
                                <th className="w-[5%]">{L.colKhông}</th>
                                <th className="w-[5%]">{L.colSTT}</th>
                                <th className="w-[35%]">{L.colTenBenh}</th>
                                <th className="w-[5%]">{L.colCó}</th>
                                <th className="w-[5%]">{L.colKhông}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="text-center">7</td>
                                <td>Tăng huyết áp</td>
                                <td className="text-center">{tsHuyetAp === 1 ? 'x' : ''}</td>
                                <td className="text-center">{tsHuyetAp === 0 ? 'x' : ''}</td>
                                <td className="text-center">18</td>
                                <td>Tai biến mạch máu não hoặc liệt</td>
                                <td className="text-center">{tsTaiBien === 1 ? 'x' : ''}</td>
                                <td className="text-center">{tsTaiBien === 0 ? 'x' : ''}</td>
                            </tr>
                            <tr>
                                <td className="text-center">8</td>
                                <td>Khó thở</td>
                                <td className="text-center">{tsKhoTho === 1 ? 'x' : ''}</td>
                                <td className="text-center">{tsKhoTho === 0 ? 'x' : ''}</td>
                                <td className="text-center">19</td>
                                <td>Bệnh hoặc tổn thương cột sống</td>
                                <td className="text-center">{tsBenhCotSong === 1 ? 'x' : ''}</td>
                                <td className="text-center">{tsBenhCotSong === 0 ? 'x' : ''}</td>
                            </tr>
                            <tr>
                                <td className="text-center">9</td>
                                <td>Bệnh phổi, hen, viêm phế quản mạn</td>
                                <td className="text-center">{tsPhoiHen === 1 ? 'x' : ''}</td>
                                <td className="text-center">{tsPhoiHen === 0 ? 'x' : ''}</td>
                                <td className="text-center">20</td>
                                <td>Sử dụng rượu thường xuyên, liên tục</td>
                                <td className="text-center">{tsSuDungRuou === 1 ? 'x' : ''}</td>
                                <td className="text-center">{tsSuDungRuou === 0 ? 'x' : ''}</td>
                            </tr>
                            <tr>
                                <td className="text-center">10</td>
                                <td>Bệnh thận, lọc máu</td>
                                <td className="text-center">{tsThan === 1 ? 'x' : ''}</td>
                                <td className="text-center">{tsThan === 0 ? 'x' : ''}</td>
                                <td className="text-center">21</td>
                                <td>Sử dụng ma túy và chất gây nghiện</td>
                                <td className="text-center">{tsSuDungMaTuy === 1 ? 'x' : ''}</td>
                                <td className="text-center">{tsSuDungMaTuy === 0 ? 'x' : ''}</td>
                            </tr>
                            <tr>
                                <td className="text-center">11</td>
                                <td>Nghiện rượu, bia</td>
                                <td className="text-center">{tsSuDungRuou === 1 ? 'x' : ''}</td>
                                <td className="text-center">{tsSuDungRuou === 0 ? 'x' : ''}</td>
                                <td className="text-center">22</td>
                                <td>Bệnh khác</td>
                                <td className="text-center">{extra.ts_benh_khac === 1 || extra.tsbt_ma_benh ? 'x' : ''}</td>
                                <td className="text-center">{extra.ts_benh_khac === 0 && !extra.tsbt_ma_benh ? 'x' : ''}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="mt-2 text-[13px] space-y-1">
                        <span className="font-bold">{L.lblCauHoiKhac}</span>
                        <div className="pl-4">
                            {L.lblDangDieuTri}
                            <div className="flex gap-8 mt-1">
                                <span className="flex items-center gap-1">{extra.dang_dieu_tri !== '1' ? '☑' : '☐'} {L.lblKhong}</span>
                                <span className="flex items-center gap-1">{extra.dang_dieu_tri === '1' ? '☑' : '☐'} {L.lblCo} (Nếu có, xin hãy liệt kê tên bệnh, các thuốc đang dùng và liều lượng):</span>
                            </div>
                            {extra.dang_dieu_tri === '1' && (
                                <div className="mt-1 font-semibold pl-4 text-gray-800">
                                    {extra.chi_tiet_dieu_tri || '...'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-[13px] mt-3 italic pl-4">
                        {L.lblCamDoan}
                    </div>

                    <div className="flex justify-end mt-4 px-6 text-[13px]">
                        <div className="text-center w-72">
                            <span className="italic block mb-0.5">Ngày {reportDate.day} tháng {reportDate.month} năm {reportDate.year}</span>
                            <strong className="block font-bold">{L.lblNguoiDeNghi}</strong>
                            <span className="italic text-[11px] block">{L.lblKyGhiRo}</span>
                            <div className="h-16"></div>
                            <span className="font-bold text-[14px] mt-1 block">{docNormalized.patient_name}</span>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-black pt-2">
                        <h2 className="font-bold text-[14px] uppercase tracking-wide mb-2">{L.titleTheLuc}</h2>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[13.5px]">
                            <div>
                                <span className="font-bold">{L.lblChieuCao}</span> {examHeight || '.......'} cm; <span className="font-bold ml-2">{L.lblCanNang}</span> {examWeight || '.......'} Kg;
                            </div>
                            <div>
                                <span className="font-bold">{L.lblBmi}</span> {examBmi || '.......'}
                            </div>
                            <div>
                                <span className="font-bold">{L.lblMach}</span> {examPulse || '.......'} lần/phút;
                            </div>
                            <div>
                                <span className="font-bold">{L.lblHuyetAp}</span> {examBp || '.......'} mmHg
                            </div>
                            <div className="col-span-2">
                                <span className="font-bold">{L.lblPhanLoaiTheLuc}</span> {physicalPl || '.......'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h2 className="font-bold text-[14px] uppercase tracking-wide border-b border-black pb-0.5 mb-2">{L.titleLamSang}</h2>
                        <div className="text-[11.5px] italic mb-2 leading-tight">
                            {L.lamSangNote}
                        </div>

                        <table className="a4-table w-full">
                            <thead>
                                <tr className="font-bold bg-gray-50 text-center">
                                    <th className="w-[70%]">{L.colNoidungKham}</th>
                                    <th className="w-[30%]">{L.colChuKyBs}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="font-bold">
                                    <td colSpan={2} className="bg-gray-100/50">{L.lblNoiKhoa}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblTuanHoan}</span> <span className="text-slate-800">{clinicalExam.tuan_hoan || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('tuan_hoan')}
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('tuan_hoan')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblHoHap}</span> <span className="text-slate-800">{clinicalExam.ho_hap || clinicalExam.internal || 'Bình thường, tốt'}</span>
                                        {renderPl('ho_hap')}
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('ho_hap')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblTieuHoa}</span> <span className="text-slate-800">{clinicalExam.tieu_hoa || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('tieu_hoa')}
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('tieu_hoa')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblThanTietNieu}</span> <span className="text-slate-800">{clinicalExam.than_tiet_nieu || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('than_tiet_nieu')}
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('than_tiet_nieu')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblNoiTiet}</span> <span className="text-slate-800">{clinicalExam.noi_tiet || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('noi_tiet')}
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('noi_tiet')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblCoXuongKhop}</span> <span className="text-slate-800">{clinicalExam.co_xuong_khop || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('co_xuong_khop')}
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('co_xuong_khop')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblThanKinh}</span> <span className="text-slate-800">{clinicalExam.than_kinh || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('than_kinh')}
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('than_kinh')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblTamThan}</span> <span className="text-slate-800">{clinicalExam.tam_than || clinicalExam.internal || 'Bình thường'}</span>
                                        {renderPl('tam_than')}
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('tam_than')}</td>
                                </tr>
                                <tr className="font-bold">
                                    <td colSpan={2} className="bg-gray-100/50">{L.lblNgoaiKhoa}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="text-slate-800">{clinicalExam.surgery || clinicalExam.ngoai_khoa || clinicalExam.external || 'Bình thường'}</span>
                                        {renderPl('ngoai_khoa')}
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('ngoai_khoa')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="text-right text-[11px] text-gray-500 font-sans" data-mau3-page-number>Trang 2/3</div>
            </div>

            {/* ==================== PAGE 3 ==================== */}
            <div className="a4-page flex flex-col justify-between" data-mau3-page="3">
                <div data-mau3-page-three-main>
                    <table className="a4-table w-full">
                        <thead>
                            <tr className="font-bold bg-gray-50 text-center">
                                <th className="w-[70%]">{L.colNoidungKham}</th>
                                <th className="w-[30%]">{L.colChuKyBs}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblDaLieu}</span> <span className="text-slate-800">{clinicalExam.dermatology || clinicalExam.kham_da_lieu || clinicalExam.kq_da_lieu || 'Bình thường'}</span>
                                    {renderPl('da_lieu')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{renderDoctorCell('da_lieu')}</td>
                            </tr>
                            {isNu && (
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblSanPhuKhoa}</span> <span className="text-slate-800">{clinicalExam.gynecological || clinicalExam.phu_khoa || clinicalExam.gynecology || 'Bình thường'}</span>
                                        {renderPl('san_phu_khoa')}
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('san_phu_khoa')}</td>
                                </tr>
                            )}
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblMat}</span>
                                    <div className="pl-4 text-[12.5px] space-y-1">
                                        <div>
                                            {L.lblThiLucKhongKinh} <span className="font-bold">{clinicalExam.khong_kinh_mat_phai || '...'}</span>, {L.lblMatMatTrai} <span className="font-bold">{clinicalExam.khong_kinh_mat_trai || '...'}</span>
                                        </div>
                                        <div>
                                            {L.lblThiLucCoKinh} <span className="font-bold">{clinicalExam.co_kinh_mat_phai || '...'}</span>, {L.lblMatMatTrai} <span className="font-bold">{clinicalExam.co_kinh_mat_trai || '...'}</span>
                                        </div>
                                        <div>
                                            {L.lblBenhMat} <span>{clinicalExam.benh_ve_mat || '...'}</span>
                                        </div>
                                    </div>
                                    {renderPl('mat')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{renderDoctorCell('mat')}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblTaiMuiHong}</span>
                                    <div className="pl-4 text-[12.5px] space-y-1">
                                        <div>{L.lblThinhLuc}</div>
                                        <div className="grid grid-cols-2 gap-1 pl-2">
                                            <div>{L.lblTaiTrai} <span className="font-bold">{clinicalExam.tai_trai_noi_thuong || '...'}</span> m, {L.lblNoiTham} <span className="font-bold">{clinicalExam.tai_trai_noi_tham || '...'}</span> m</div>
                                            <div>{L.lblTaiPhai} <span className="font-bold">{clinicalExam.tai_phai_noi_thuong || '...'}</span> m, {L.lblNoiTham} <span className="font-bold">{clinicalExam.tai_phai_noi_tham || '...'}</span> m</div>
                                        </div>
                                        <div>{L.lblBenhTmh} <span>{clinicalExam.benh_tai_mui_hong || '...'}</span></div>
                                    </div>
                                    {renderPl('tai_mui_hong')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{renderDoctorCell('tai_mui_hong')}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblRangHamMat}</span>
                                    <div className="pl-4 text-[12.5px] space-y-0.5">
                                        <div>{L.lblKqHam} <span className="font-semibold">{clinicalExam.ham_tren || 'BT'}</span>, {L.lblHamDuoi} <span className="font-semibold">{clinicalExam.ham_duoi || 'BT'}</span></div>
                                        <div>{L.lblBenhRhm} <span>{clinicalExam.benh_rang_ham_mat || 'ko có'}</span></div>
                                    </div>
                                    {renderPl('rang_ham_mat')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{renderDoctorCell('rang_ham_mat')}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="mt-4">
                        <h2 className="font-bold text-[14px] uppercase tracking-wide mb-1">{L.titleCanLamSang}</h2>
                        <span className="text-[11.5px] italic block mb-2">{L.clsNote}</span>

                        <table className="a4-table w-full">
                            <thead>
                                <tr className="font-bold bg-gray-50 text-center">
                                    <th className="w-[70%]">{L.colNoidungKham}</th>
                                    <th className="w-[30%]">{L.colChuKyBsCns}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblXnMau}</span>
                                        <div className="pl-4 text-[12.5px] grid grid-cols-2 gap-y-1 gap-x-2 mt-1">
                                            <div>{L.lblTongPhanTichMau} <span>...</span></div>
                                            <div>{L.lblDuongMau} <span className="font-semibold">{bloodSugar}</span></div>
                                            <div>{L.lblUre} <span className="font-semibold">{ureaVal}</span></div>
                                            <div>{L.lblCreatinine} <span className="font-semibold">{creatinineVal}</span></div>
                                            <div>{L.lblAsat} <span className="font-semibold">{asatVal}</span></div>
                                            <div>{L.lblAlat} <span className="font-semibold">{alatVal}</span></div>
                                        </div>
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('lab') || renderDoctorCell('tuan_hoan')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblXnNuocTieu}</span>
                                        <div className="pl-4 text-[12.5px] mt-1">
                                            {L.lblXnNuocTieuMay} <span className="font-semibold">{urineTest}</span>
                                        </div>
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('lab') || renderDoctorCell('tuan_hoan')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblXqNguc}</span>
                                        <div className="pl-4 text-[12.5px] mt-1">
                                            {L.lblXqResult} <span className="font-semibold">{xqResult}</span>
                                        </div>
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{renderDoctorCell('imaging') || renderDoctorCell('tuan_hoan')}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-bold">{L.lblClsKhac}</span>
                                        <div className="pl-4 text-[12.5px] mt-1">
                                            {L.lblChiTiet} <span>{extra.cls_khac || 'Không'}</span>
                                        </div>
                                    </td>
                                    <td className="text-center font-bold text-slate-700"></td>
                                </tr>
                                <tr>
                                    <td className="py-2">
                                        <span className="font-bold">{L.lblDanhGia}</span> <span className="font-semibold">{conclusion.danh_gia || 'Bình thường'}</span>
                                    </td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td className="py-2">
                                        <span className="font-bold">{L.lblKetLuan}</span> <span className="font-semibold">{conclusion.diagnosis ? formatIcd10String(conclusion.diagnosis) : 'Bình thường'}</span>
                                    </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="text-right text-[11px] text-gray-500 font-sans" data-mau3-page-number>Trang 3/3</div>
            </div>

            {/* ==================== PAGE 4 ==================== */}
            <div className="a4-page flex flex-col justify-between" data-mau3-page="4">
                <div data-mau3-conclusion-content>
                    <h2 className="font-bold text-[14px] uppercase tracking-wide border-b border-black pb-0.5 mb-3">{L.titleKetLuan}</h2>
                    
                    <div className="text-[13.5px] space-y-3 leading-relaxed mt-2">
                        <div>
                            <span className="font-bold">{L.lblTinhTrangSk}</span> <span className="font-semibold">{conclusion.diagnosis ? formatIcd10String(conclusion.diagnosis) : 'A01'}</span>
                        </div>
                        
                        <div>
                            <span className="font-bold">{L.lblPhanLoaiSk}</span>
                            <div className="flex gap-4 mt-2 pl-4">
                                <span className="flex items-center gap-1.5">{conclusion.fitness_class === '1' ? '☑' : '☐'} {L.lblLoaiI}</span>
                                <span className="flex items-center gap-1.5">{conclusion.fitness_class === '2' ? '☑' : '☐'} {L.lblLoaiII}</span>
                                <span className="flex items-center gap-1.5">{conclusion.fitness_class === '3' ? '☑' : '☐'} {L.lblLoaiIII}</span>
                                <span className="flex items-center gap-1.5">{conclusion.fitness_class === '4' ? '☑' : '☐'} {L.lblLoaiIV}</span>
                                <span className="flex items-center gap-1.5">{conclusion.fitness_class === '5' ? '☑' : '☐'} {L.lblLoaiV}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-12 px-6 text-[13px]">
                        <div className="text-center w-80 flex flex-col items-center">
                            <span className="italic block mb-0.5">Ngày {reportDate.day} tháng {reportDate.month} năm {reportDate.year}</span>
                            <strong className="block font-bold uppercase tracking-wider mb-2">{L.lblNguoiKetLuan}</strong>
                            <span className="italic text-[11px] block mb-4">{L.lblKyGhiRoDongDau}</span>
                            
                            {(() => {
                                const docCode = (conclusion.doctor_code || conclusion.doctor_username || conclusion.conclusion_doctor || conclusion.doctor || '').toString().trim().toUpperCase();
                                const conclusionDoctor = findDoctorByIdentifier(docCode)
                                    || doctors.find(d => (d.name || d.hee_fullname) === getConclusionDoctorName());
                                const sigImg = resolveDoctorSignature(
                                    docCode,
                                    conclusion.doctor_code,
                                    conclusion.doctor_username,
                                    conclusion.conclusion_doctor,
                                    conclusion.doctor,
                                    conclusionDoctor?.code,
                                    conclusionDoctor?.username,
                                    conclusionDoctor?.id,
                                    conclusionDoctor?.hee_employee_id,
                                    conclusionDoctor?.name,
                                    conclusionDoctor?.hee_fullname,
                                    getConclusionDoctorName()
                                );

                                if (docNormalized.signature_status === 'Signed' && !sigImg) {
                                    return (
                                        <div className="my-2 p-2 border border-green-600 rounded bg-green-50/50 text-[11px] font-bold text-green-700 leading-tight text-left w-full shadow-sm max-w-[240px] font-sans">
                                            <div className="flex items-center gap-1 mb-1 text-green-800">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                                <span>SIGNED DIGITALLY</span>
                                            </div>
                                            By: {hospitalNameNormalized || 'Bệnh viện đa khoa tỉnh Ninh Bình'}<br/>
                                            Time: {docNormalized.updated_at ? new Date(docNormalized.updated_at).toLocaleString('vi-VN') : '2026-06-03'}
                                        </div>
                                    );
                                }

                                if (sigImg) {
                                    return <img src={sigImg} alt="Chữ ký bác sĩ" className="h-16 max-w-[180px] object-contain my-1" />;
                                }

                                return <div className="h-16"></div>;
                            })()}
                            
                            <span className="font-bold text-[14px] mt-2 block">{getConclusionDoctorName()}</span>
                        </div>
                    </div>

                    <div className="mt-16 text-[12px] space-y-1 text-gray-700 border-t border-gray-300 pt-4">
                        <div>{L.note1}</div>
                        <div>{L.note2}</div>
                    </div>
                </div>
                <div className="text-right text-[11px] text-gray-500 font-sans">Trang 4/4</div>
            </div>
        </div>
    );
};
