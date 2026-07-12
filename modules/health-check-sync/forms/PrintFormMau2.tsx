import React from 'react';

interface PrintFormMau2Props {
    document: any;
    hospitalName: string;
    getReportDate: () => { day: number; month: number; year: number };
    getConclusionDoctorName: () => string;
    doctors: any[];
    icd10Names: Record<string, string>;
    COMMON_ICD10: { code: string; name: string }[];
    maCskcb?: string;
}

const STATIC_LABELS = {
    hospitalTitle: "BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH",
    nationalTitle: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
    nationalSubtitle: "Độc lập - Tự do - Hạnh phúc",
    formTitle: "GIẤY KHÁM SỨC KHỎE",
    photoLabel: "Ảnh (4 x 6 cm)",
    photoSub: "(đóng dấu giáp lai hoặc scan ảnh)",
    lblHoTen: "1. Họ và tên (viết chữ in hoa):",
    lblGioiTinh: "2. Giới tính:",
    lblNgaySinh: "3. Sinh Ngày",
    lblThang: "tháng",
    lblNam: "năm",
    lblTuoi: "Tuổi:",
    lblTuoiSuffix: "tuổi",
    lblDanToc: "4. Dân tộc:",
    lblDoiTuongUuTien: "5. Đối tượng ưu tiên:",
    lblNguonChiTra: "6. Nguồn chi trả:",
    lblNhomMau: "7. Nhóm máu:",
    lblCccd: "8. Số CMND/CCCD/Hộ chiếu/Định danh CD:",
    lblCapNgay: "9. Cấp ngày",
    lblNoiCap: "Tại",
    lblLoaiHinhKcb: "Loại hình khám bệnh, chữa bệnh:",
    lblHoTenGiamHo: "10. Họ và tên Bố/Mẹ hoặc người giám hộ:",
    lblCccdGiamHo: "Số định danh của Bố/Mẹ hoặc người giám hộ:",
    lblChỏO: "11. Chỗ ở hiện tại:",
    lblSdt: "Số điện thoại liên hệ:",
    cccdNote: "* Lưu ý: Trường hợp đối tượng KSK có CCCD gắn chip hoặc có số định danh công dân đã thực hiện kết nối với với CSDLQG về dân cư, phần HÀNH CHÍNH nêu trên chỉ cần ghi các mục (1) Họ và tên, (3) Ngày tháng Số định danh công dân.",
    lblMaCskcb: "Mã CSKCB:",
    lblNgayKham: "Ngày khám:",
    lblGioKham: "Giờ khám:",
    lblLyDo: "Lý do khám sức khỏe",
    titleTienSu: "TIỀN SỬ BỆNH TẬT",
    lblTsgiaDinh: "1. Tiền sử gia đình",
    tsgdDetail: "Có ai trong gia đình mắc các bệnh bẩm sinh hoặc bệnh truyền nhiễm không:",
    lblKhong: "Không",
    lblCo: "Có",
    lblTsgdGhiRo: "Nếu \"có\", đề nghị ghi cụ thể tên bệnh:",
    lblTsBanThan: "2. Tiền sử bản thân",
    lblSanKhoa: "a) Sản khoa:",
    lblBinhThuong: "Bình thường.",
    lblKhongBinhThuong: "Không bình thường:",
    lblThieuThang: "Đẻ thiếu tháng",
    lblThuaCan: "Đẻ thừa cân",
    lblCanThiep: "Đẻ có can thiệp",
    lblNgat: "Đẻ ngạt",
    lblMeBenh: "Mẹ bị bệnh trong thời kỳ mang thai",
    lblSanKhoaGhiRo: "(Nếu có cần ghi rõ tên bệnh):",
    lblTiemChung: "b) Tiêm chủng:",
    colSTT: "STT",
    colLoaiVacXin: "Loại vắc xin",
    colCo: "Có",
    colKhong: "Không",
    colKhongNho: "Không nhớ rõ",
    lblTsBenhTat: "c) Tiền sử bệnh/tật: (Các bệnh bẩm sinh và mãn tính)",
    lblTsBenhTatGhiRo: "Nếu \"có\": ghi cụ thể tên bệnh:",
    lblDangDieuTri: "d) Hiện tại có đang điều trị bệnh gì không?",
    lblDangDieuTriGhiRo: "Nếu có, ghi rõ tên bệnh và liệt kê các thuốc đang dùng:",
    lblCamDoan: "Tôi xin cam đoan những điều khai trên đây hoàn toàn đúng với sự thật theo sự hiểu biết của tôi.",
    lblNguoiDeNghi: "NGƯỜI ĐỀ NGHỊ KHÁM SỨC KHỎE",
    lblNguoiDeNghiSub: "(Hoặc cha/mẹ hoặc người giám hộ)",
    lblKyGhiRo: "(Ký và ghi rõ họ, tên)",
    titleTheLuc: "I. KHÁM THỂ LỰC",
    lblChieuCao: "- Chiều cao:",
    lblCanNang: "- Cân nặng:",
    lblBmi: "- Chỉ số BMI:",
    lblMach: "- Mạch:",
    lblHuyetAp: "- Huyết áp:",
    lblPhanLoaiTheLuc: "Phân loại thể lực:",
    lblLoaiI: "Loại I (Rất khỏe)",
    lblLoaiII: "Loại II (Khỏe)",
    lblLoaiIII: "Loại III (Trung bình)",
    lblLoaiIV: "Loại IV (Yếu)",
    lblLoaiV: "Loại V (Rất yếu)",
    titleLamSang: "II. KHÁM LÂM SÀNG",
    colNoidungKham: "Nội dung khám",
    colChuKyBs: "Họ tên và chữ ký của Bác sỹ chuyên khoa",
    colChuKyBsCns: "Họ tên, chữ ký của Bác sỹ",
    lblNhiKhoa: "1. Nhi khoa",
    lblTuanHoan: "a) Tuần hoàn",
    lblHoHap: "b) Hô hấp",
    lblTieuHoa: "c) Tiêu hóa",
    lblThanTietNieu: "d) Thận-Tiết niệu, Sinh dục",
    lblThanKinh: "đ) Thần kinh:",
    lblTamThan: "e) Tâm thần",
    lblLamSangKhac: "g) Khám lâm sàng khác",
    lblMat: "2. Mắt:",
    lblThiLucKhongKinh: "Không kính: Mắt phải:",
    lblThiLucCoKinh: "Có kính: Mắt phải:",
    lblMatMatTrai: "Mắt trái:",
    lblBenhMat: "Các bệnh về mắt (nếu có):",
    lblTaiMuiHong: "3. Tai - Mũi - Họng",
    lblThinhLuc: "Kết quả khám thính lực:",
    lblTaiTrai: "Tai trái: Nói thường:",
    lblTaiPhai: "Tai phải: Nói thường:",
    lblNoiTham: "Nói thầm:",
    lblBenhTmh: "Các bệnh về tai mũi họng (nếu có):",
    lblRangHamMat: "4. Răng - Hàm - Mặt",
    lblKqKham: "Kết quả khám:",
    lblHamTren: "Hàm trên:",
    lblHamDưới: "Hàm dưới:",
    lblBenhRhm: "Các bệnh về răng hàm mặt (nếu có):",
    titleCanLamSang: "III. KHÁM CẬN LÂM SÀNG",
    lblXnMau: "Xét nghiệm máu:",
    lblTongPhanTichMau: "Tổng phân tích tế bào máu ngoại vi:",
    lblDuongMau: "Đường máu:",
    lblUre: "Urê:",
    lblCreatinine: "Creatinin:",
    lblAsat: "ASAT:",
    lblAlat: "ALAT:",
    lblXnNuocTieu: "Xét nghiệm nước tiểu:",
    lblTongPhanTichNuocTieu: "Tổng phân tích nước tiểu:",
    lblKhac: "Khác:",
    lblCda: "Chẩn đoán hình ảnh:",
    lblXqNguc: "XQ tim phổi thẳng:",
    lblClsKhac: "Cận lâm sàng khác:",
    lblKetQua: "Kết quả:",
    lblChiTiet: "Chi tiết:",
    lblDanhGia: "Đánh giá:",
    lblKetLuan: "Kết luận:",
    titleKetLuan: "IV. KẾT LUẬN CHUNG:",
    lblSkNormal: "Sức khỏe bình thường",
    lblSkLuuY: "Hoặc các vấn đề sức khỏe cần lưu ý:",
    lblNguoiKetLuan: "NGƯỜI KẾT LUẬN",
    lblKyGhiRoDongDau: "(Ký, ghi rõ họ tên và đóng dấu)"
};

export const PrintFormMau2: React.FC<PrintFormMau2Props> = ({
    document,
    hospitalName,
    getReportDate,
    getConclusionDoctorName,
    doctors,
    icd10Names,
    COMMON_ICD10,
    maCskcb
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
        if (specialty === 'tuan_hoan') return !!(clinicalExam.nhi_tuan_hoan || clinicalExam.internal || clinicalExam.tuan_hoan);
        if (specialty === 'ho_hap') return !!(clinicalExam.nhi_ho_hap || clinicalExam.internal || clinicalExam.ho_hap);
        if (specialty === 'tieu_hoa') return !!(clinicalExam.nhi_tieu_hoa || clinicalExam.internal || clinicalExam.tieu_hoa);
        if (specialty === 'than_tiet_nieu') return !!(clinicalExam.nhi_tiet_nieu || clinicalExam.internal || clinicalExam.than_tiet_nieu);
        if (specialty === 'than_kinh') return !!(clinicalExam.nhi_than_kinh || clinicalExam.internal || clinicalExam.than_kinh);
        if (specialty === 'tam_than') return !!(clinicalExam.nhi_tam_than || clinicalExam.internal || clinicalExam.tam_than);
        if (specialty === 'lam_sang_khac') return !!(clinicalExam.nhi_khac || clinicalExam.internal || clinicalExam.ngoai_khoa);
        if (specialty === 'mat') return !!(clinicalExam.eye || clinicalExam.kham_mat_pl || clinicalExam.khong_kinh_mat_phai || clinicalExam.khong_kinh_mat_trai);
        if (specialty === 'tai_mui_hong') return !!(clinicalExam.ent || clinicalExam.kham_tai_mui_hong_pl || clinicalExam.tai_trai_noi_thuong || clinicalExam.tai_phai_noi_thuong);
        if (specialty === 'rang_ham_mat') return !!(clinicalExam.dental || clinicalExam.kham_rang_ham_mat_pl || clinicalExam.ham_tren || clinicalExam.ham_duoi);
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
            lam_sang_khac: 'internal',
            mat: 'eye',
            tai_mui_hong: 'ent',
            rang_ham_mat: 'dental'
        };
        
        const metaKey = metadataMap[specialty];
        const docMeta = clinical.specialty_metadata?.[metaKey] || clinicalExam.specialty_metadata?.[metaKey];
        if (docMeta?.doctorId) {
            const found = doctors.find(d => String(d.id || d.hee_employee_id) === String(docMeta.doctorId));
            if (found) return found.name || found.hee_fullname;
        }

        if (metaKey && clinicalExam.specialty_metadata?.[metaKey]?.doctorName) {
            return clinicalExam.specialty_metadata[metaKey].doctorName;
        }
        return '';
    };

    const getPl = (specialty: string) => {
        if (specialty === 'tuan_hoan') return clinicalExam.nhi_tuan_hoan_pl || clinicalExam.tuanHoanPl || clinical.tuan_hoan_pl || '';
        if (specialty === 'ho_hap') return clinicalExam.nhi_ho_hap_pl || clinicalExam.hoHapPl || clinical.ho_hap_pl || '';
        if (specialty === 'tieu_hoa') return clinicalExam.nhi_tieu_hoa_pl || clinicalExam.tieuHoaPl || clinical.tieu_hoa_pl || '';
        if (specialty === 'than_tiet_nieu') return clinicalExam.nhi_tiet_nieu_pl || clinicalExam.thanTietNieuPl || clinical.than_tiet_nieu_pl || '';
        if (specialty === 'than_kinh') return clinicalExam.nhi_than_kinh_pl || clinicalExam.thanKinhPl || clinical.than_kinh_pl || '';
        if (specialty === 'tam_than') return clinicalExam.nhi_tam_than_pl || clinicalExam.tamThanPl || clinical.tam_than_pl || '';
        if (specialty === 'lam_sang_khac') return clinicalExam.nhi_khac_pl || clinicalExam.surgeryPl || clinical.ngoai_khoa_pl || '';
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

    // Checkboxes for obstetrics
    const sanKhoaNormal = extra.san_khoa === '1' || extra.san_khoa === 1;
    const sanKhoaAbnormal = extra.san_khoa === '0' || extra.san_khoa === 0 || extra.san_khoa_khong_bt;
    const sk1 = extra.san_khoa_khong_bt === '1' || extra.san_khoa_khong_bt === 1;
    const sk2 = extra.san_khoa_khong_bt === '2' || extra.san_khoa_khong_bt === 2;
    const sk3 = extra.san_khoa_khong_bt === '3' || extra.san_khoa_khong_bt === 3;
    const sk4 = extra.san_khoa_khong_bt === '4' || extra.san_khoa_khong_bt === 4;
    const sk5 = extra.san_khoa_khong_bt === '5' || extra.san_khoa_khong_bt === 5;

    // Checkboxes for vaccinations
    const getVaccineStatus = (val: any) => {
        const strVal = String(val || '');
        return {
            co: strVal === '1',
            khong: strVal === '0',
            khongNho: strVal === '2'
        };
    };

    const vacBcg = getVaccineStatus(extra.tiem_chung_bcg);
    const vacBhHgUv = getVaccineStatus(extra.tiem_chung_bh_hg_uv);
    const vacSoi = getVaccineStatus(extra.tiem_chung_soi);
    const vacBaiLiet = getVaccineStatus(extra.tiem_chung_bai_liet);
    const vacVnnbB = getVaccineStatus(extra.tiem_chung_vnnb_b);
    const vacVgb = getVaccineStatus(extra.tiem_chung_vgb);

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
                        <div className="text-center w-[45%]">
                            <strong className="text-[12px] uppercase block">{L.hospitalTitle}</strong>
                            <span className="text-[11px] block mt-1">Số: ....../GKSK-.........</span>
                        </div>
                        <div className="text-center w-[50%]">
                            <strong className="text-[12px] uppercase block">{L.nationalTitle}</strong>
                            <strong className="text-[11px] block mt-0.5">{L.nationalSubtitle}</strong>
                            <div className="border-t border-black w-24 mx-auto mt-1"></div>
                        </div>
                    </div>

                    <div className="text-center my-4">
                        <h2 className="text-[18px] font-bold uppercase tracking-wide">{L.formTitle}</h2>
                    </div>

                    <div className="flex gap-4 mt-2">
                        <div className="w-[120px] h-[160px] border border-black flex flex-col justify-center items-center text-center p-2 text-[11px] shrink-0">
                            <div>{L.photoLabel}</div>
                            <div className="text-[9px] mt-2 italic text-gray-500">{L.photoSub}</div>
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
                                <span className="font-bold">{L.lblNgaySinh}</span> <span>{dobDetails.day}</span> {L.lblThang} <span>{dobDetails.month}</span> {L.lblNam} <span>{dobDetails.year}</span> <span className="ml-4 font-bold">({L.lblTuoi} {getAge(docNormalized.dob)} {L.lblTuoiSuffix})</span>
                            </div>
                            <div>
                                <span className="font-bold">{L.lblDanToc}</span> <span>{clinical.nation || 'Kinh'}</span>
                            </div>
                            <div>
                                <span className="font-bold">{L.lblDoiTuongUuTien}</span> <span>{clinical.priority_group || '...'}</span>
                            </div>
                            <div>
                                <span className="font-bold">{L.lblNguonChiTra}</span> <span>{clinical.payment_source || 'Ngân sách địa phương'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-[13px]">
                        <div>
                            <span className="font-bold">{L.lblNhomMau}</span> <span>{clinical.blood_group || '...'}</span>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblCccd}</span> <span>{docNormalized.cccd || '................................'}</span>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblCapNgay}</span> <span>{cccdDate ? new Date(cccdDate).toLocaleDateString('vi-VN') : '.../.../....'}</span> <span className="ml-4 font-bold">{L.lblNoiCap}</span> <span>{cccdPlace || '................................'}</span>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblLoaiHinhKcb}</span> <span>{clinical.exam_type || '...'}</span>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblHoTenGiamHo}</span> <span>{extra.nguoi_giam_ho || '...'}</span>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblCccdGiamHo}</span> <span>{extra.so_cccd_ngh || '...'}</span>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblChỏO}</span> <span className="font-semibold">{clinical.province || 'Hoa Lư'}, {clinical.ward || 'Tỉnh Ninh Bình'}</span>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblSdt}</span> <span>{clinical.phone || '...'}</span>
                        </div>
                        <div className="text-[11px] italic leading-snug">
                            {L.cccdNote}
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-1">
                            <div><span className="font-bold">{L.lblMaCskcb}</span> <span className="font-semibold">{maCskcb || docNormalized.ma_cskcb || '8934285008135'}</span></div>
                            <div><span className="font-bold">{L.lblNgayKham}</span> <span>{docNormalized.ngay_vao ? new Date(docNormalized.ngay_vao).toLocaleDateString('vi-VN') : '11/07/2026'}</span> <span className="font-bold ml-2">{L.lblGioKham}</span> <span>...</span></div>
                        </div>
                        <div>
                            <span className="font-bold">{L.lblLyDo}:</span> <span className="font-semibold">{clinical.ly_do_vv || 'Khám sức khỏe định kỳ'}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right text-[11px] text-gray-500 font-sans">Trang 1/4</div>
            </div>

            {/* ==================== PAGE 2 ==================== */}
            <div className="a4-page flex flex-col justify-between">
                <div>
                    <h2 className="font-bold text-[14px] uppercase tracking-wide border-b border-black pb-0.5 mb-2">{L.titleTienSu}</h2>
                    
                    <div className="text-[13px] space-y-3">
                        <div>
                            <span className="font-bold">{L.lblTiemSuGiaDinh}</span>
                            <div className="pl-4 leading-normal mt-0.5">
                                {L.tsgdDetail}
                                <div className="flex gap-8 mt-1">
                                    <span className="flex items-center gap-1">{extra.tsgd_mac_benh !== '1' ? '☑' : '☐'} a) {L.lblKhong}</span>
                                    <span className="flex items-center gap-1">{extra.tsgd_mac_benh === '1' ? '☑' : '☐'} b) {L.lblCo}; {L.lblTsgdGhiRo} <span className="font-bold">{extra.tsgd_ma_benh || '...'}</span></span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="font-bold">{L.lblTsBanThan}</span>
                            <div className="pl-4 mt-1 space-y-2">
                                <div>
                                    <span className="font-bold">{L.lblSanKhoa}</span>
                                    <div className="flex gap-8 mt-0.5">
                                        <span className="flex items-center gap-1">{sanKhoaNormal ? '☑' : '☐'} {L.lblBinhThuong}</span>
                                        <span className="flex items-center gap-1">{sanKhoaAbnormal ? '☑' : '☐'} {L.lblKhongBinhThuong}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-1 pl-4 text-[12.5px] text-gray-700">
                                        <span className="flex items-center gap-1">{sk1 ? '☑' : '☐'} {L.lblThieuThang}</span>
                                        <span className="flex items-center gap-1">{sk2 ? '☑' : '☐'} {L.lblThuaCan}</span>
                                        <span className="flex items-center gap-1">{sk3 ? '☑' : '☐'} {L.lblCanThiep}</span>
                                        <span className="flex items-center gap-1">{sk4 ? '☑' : '☐'} {L.lblNgat}</span>
                                        <span className="flex items-center gap-1 col-span-2">{sk5 ? '☑' : '☐'} {L.lblMeBenh}</span>
                                    </div>
                                    <div className="pl-4 mt-1 text-[12.5px]">
                                        {L.lblSanKhoaGhiRo} <span className="font-semibold">{extra.ma_benh_san_khoa_khong_bt || '...'}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="font-bold">{L.lblTiemChung}</span>
                                    <table className="a4-table w-full mt-1">
                                        <thead>
                                            <tr className="font-bold text-center bg-gray-50">
                                                <th className="w-[10%]">{L.colSTT}</th>
                                                <th className="w-[45%]">{L.colLoaiVacXin}</th>
                                                <th className="w-[15%]">{L.colCo}</th>
                                                <th className="w-[15%]">{L.colKhong}</th>
                                                <th className="w-[15%]">{L.colKhongNho}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="text-center">1</td>
                                                <td>BCG</td>
                                                <td className="text-center font-bold">{vacBcg.co ? 'x' : ''}</td>
                                                <td className="text-center font-bold">{vacBcg.khong ? 'x' : ''}</td>
                                                <td className="text-center font-bold">{vacBcg.khongNho ? 'x' : ''}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-center">2</td>
                                                <td>Bạch hầu-Ho gà-Uốn ván</td>
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
                                                <td>Bại liệt</td>
                                                <td className="text-center font-bold">{vacBaiLiet.co ? 'x' : ''}</td>
                                                <td className="text-center font-bold">{vacBaiLiet.khong ? 'x' : ''}</td>
                                                <td className="text-center font-bold">{vacBaiLiet.khongNho ? 'x' : ''}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-center">5</td>
                                                <td>Viêm não NB</td>
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
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <span className="font-bold">{L.lblTsBenhTat}</span>
                                    <div className="flex gap-8 mt-0.5">
                                        <span className="flex items-center gap-1">{extra.ts_benh_tat !== '1' ? '☑' : '☐'} {L.lblKhong}</span>
                                        <span className="flex items-center gap-1">{extra.ts_benh_tat === '1' ? '☑' : '☐'} {L.lblCo}</span>
                                    </div>
                                    <div className="mt-1">
                                        {L.lblTsBenhTatGhiRo} <span className="font-bold">{extra.ts_benh_tat_chi_tiet || extra.ts_benh_tat_ma_benh || '...'}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="font-bold">{L.lblDangDieuTri}</span>
                                    <div className="flex gap-8 mt-0.5">
                                        <span className="flex items-center gap-1">{extra.dang_dieu_tri !== '1' ? '☑' : '☐'} {L.lblKhong}</span>
                                        <span className="flex items-center gap-1">{extra.dang_dieu_tri === '1' ? '☑' : '☐'} {L.lblCo}</span>
                                    </div>
                                    <div className="mt-1">
                                        {L.lblDangDieuTriGhiRo} <span className="font-bold">{extra.chi_tiet_dieu_tri || '...'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-[13px] mt-4 italic pl-4">
                        {L.lblCamDoan}
                    </div>

                    <div className="flex justify-end mt-4 px-6 text-[13px]">
                        <div className="text-center w-72">
                            <span className="italic block mb-0.5">Ngày {getReportDate().day} tháng {getReportDate().month} năm {getReportDate().year}</span>
                            <strong className="block font-bold uppercase">{L.lblNguoiDeNghi}</strong>
                            <span className="italic text-[11px] block">{L.lblNguoiDeNghiSub}</span>
                            <span className="italic text-[10px] block">{L.lblKyGhiRo}</span>
                            <div className="h-14"></div>
                            <span className="font-bold text-[14px] mt-1 block">{docNormalized.patient_name}</span>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-black pt-2">
                        <h2 className="font-bold text-[14px] uppercase tracking-wide mb-2">{L.titleTheLuc}</h2>
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[13.5px]">
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
                                <span className="font-bold">{L.lblPhanLoaiTheLuc}</span>
                                <div className="flex gap-4 mt-1 pl-4">
                                    <span className="flex items-center gap-1">{physicalPl === '1' ? '☑' : '☐'} {L.lblLoaiI}</span>
                                    <span className="flex items-center gap-1">{physicalPl === '2' ? '☑' : '☐'} {L.lblLoaiII}</span>
                                    <span className="flex items-center gap-1">{physicalPl === '3' ? '☑' : '☐'} {L.lblLoaiIII}</span>
                                    <span className="flex items-center gap-1">{physicalPl === '4' ? '☑' : '☐'} {L.lblLoaiIV}</span>
                                    <span className="flex items-center gap-1">{physicalPl === '5' ? '☑' : '☐'} {L.lblLoaiV}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-right text-[11px] text-gray-500 font-sans">Trang 2/4</div>
            </div>

            {/* ==================== PAGE 3 ==================== */}
            <div className="a4-page flex flex-col justify-between">
                <div>
                    <h2 className="font-bold text-[14px] uppercase tracking-wide border-b border-black pb-0.5 mb-2">{L.titleLamSang}</h2>
                    <table className="a4-table w-full">
                        <thead>
                            <tr className="font-bold bg-gray-50 text-center">
                                <th className="w-[70%]">{L.colNoidungKham}</th>
                                <th className="w-[30%]">{L.colChuKyBs}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="font-bold">
                                <td colSpan={2} className="bg-gray-100/50">{L.lblNhiKhoa}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblTuanHoan}</span> <span className="text-slate-800">{clinicalExam.nhi_tuan_hoan || clinicalExam.tuan_hoan || clinicalExam.internal || 'Bình thường'}</span>
                                    {renderPl('tuan_hoan')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{getDoctor('tuan_hoan')}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblHoHap}</span> <span className="text-slate-800">{clinicalExam.nhi_ho_hap || clinicalExam.ho_hap || clinicalExam.internal || 'Bình thường'}</span>
                                    {renderPl('ho_hap')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{getDoctor('ho_hap')}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblTieuHoa}</span> <span className="text-slate-800">{clinicalExam.nhi_tieu_hoa || clinicalExam.tieu_hoa || clinicalExam.internal || 'Bình thường'}</span>
                                    {renderPl('tieu_hoa')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{getDoctor('tieu_hoa')}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblThanTietNieu}</span> <span className="text-slate-800">{clinicalExam.nhi_tiet_nieu || clinicalExam.nhi_sinh_duc || clinicalExam.than_tiet_nieu || clinicalExam.internal || 'Bình thường'}</span>
                                    {renderPl('than_tiet_nieu')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{getDoctor('than_tiet_nieu')}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblThanKinh}</span> <span className="text-slate-800">{clinicalExam.nhi_than_kinh || clinicalExam.than_kinh || clinicalExam.internal || 'Bình thường'}</span>
                                    {renderPl('than_kinh')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{getDoctor('than_kinh')}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblTamThan}</span> <span className="text-slate-800">{clinicalExam.nhi_tam_than || clinicalExam.tam_than || clinicalExam.internal || 'Bình thường'}</span>
                                    {renderPl('tam_than')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{getDoctor('tam_than')}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblLamSangKhac}</span> <span className="text-slate-800">{clinicalExam.nhi_khac || 'Bình thường'}</span>
                                    {renderPl('lam_sang_khac')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{getDoctor('lam_sang_khac')}</td>
                            </tr>
                            <tr className="font-bold">
                                <td colSpan={2} className="bg-gray-100/50">{L.lblMat}</td>
                            </tr>
                            <tr>
                                <td>
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
                                <td className="text-center font-bold text-slate-700">{getDoctor('mat')}</td>
                            </tr>
                            <tr className="font-bold">
                                <td colSpan={2} className="bg-gray-100/50">{L.lblTaiMuiHong}</td>
                            </tr>
                            <tr>
                                <td>
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
                                <td className="text-center font-bold text-slate-700">{getDoctor('tai_mui_hong')}</td>
                            </tr>
                            <tr className="font-bold">
                                <td colSpan={2} className="bg-gray-100/50">{L.lblRangHamMat}</td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="pl-4 text-[12.5px] space-y-0.5">
                                        <div>{L.lblKqKham} {L.lblHamTren} <span className="font-semibold">{clinicalExam.ham_tren || 'BT'}</span>, {L.lblHamDưới} <span className="font-semibold">{clinicalExam.ham_duoi || 'BT'}</span></div>
                                        <div>{L.lblBenhRhm} <span>{clinicalExam.benh_rang_ham_mat || 'ko có'}</span></div>
                                    </div>
                                    {renderPl('rang_ham_mat')}
                                </td>
                                <td className="text-center font-bold text-slate-700">{getDoctor('rang_ham_mat')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="text-right text-[11px] text-gray-500 font-sans">Trang 3/4</div>
            </div>

            {/* ==================== PAGE 4 ==================== */}
            <div className="a4-page flex flex-col justify-between">
                <div>
                    <h2 className="font-bold text-[14px] uppercase tracking-wide border-b border-black pb-0.5 mb-2">{L.titleCanLamSang}</h2>
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
                                        <div>{L.lblDuongMau} <span className="font-semibold">{bloodSugar} mmol/L</span></div>
                                        <div>{L.lblUre} <span className="font-semibold">{ureaVal} mmol/L</span></div>
                                        <div>{L.lblCreatinine} <span className="font-semibold">{creatinineVal} µmol/L</span></div>
                                        <div>{L.lblAsat} <span className="font-semibold">{asatVal} U/L</span></div>
                                        <div>{L.lblAlat} <span className="font-semibold">{alatVal} U/L</span></div>
                                    </div>
                                </td>
                                <td className="text-center font-bold text-slate-700">{getDoctor('lab') || getDoctor('tuan_hoan')}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblXnNuocTieu}</span>
                                    <div className="pl-4 text-[12.5px] mt-1">
                                        {L.lblTongPhanTichNuocTieu} <span className="font-semibold">{urineTest}</span>
                                    </div>
                                </td>
                                <td className="text-center font-bold text-slate-700">{getDoctor('lab') || getDoctor('tuan_hoan')}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-bold">{L.lblCda}</span>
                                    <div className="pl-4 text-[12.5px] mt-1">
                                        {L.lblXqNguc} <span className="font-semibold">{xqResult}</span>
                                    </div>
                                </td>
                                <td className="text-center font-bold text-slate-700">{getDoctor('imaging') || getDoctor('tuan_hoan')}</td>
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

                    <div className="mt-6 border-t border-black pt-2">
                        <h2 className="font-bold text-[14px] uppercase tracking-wide mb-3">{L.titleKetLuan}</h2>
                        
                        <div className="text-[13.5px] space-y-3 leading-relaxed">
                            <div className="flex gap-4 items-center">
                                <span className="flex items-center gap-1.5">{(conclusion.is_normal === '1' || conclusion.is_normal === 1 || !conclusion.diagnosis) ? '☑' : '☐'} {L.lblSkNormal}</span>
                                <span className="flex items-center gap-1.5">{(conclusion.is_normal === '0' || conclusion.is_normal === 0 || conclusion.diagnosis) ? '☑' : '☐'} {L.lblSkLuuY}</span>
                            </div>
                            
                            {(conclusion.is_normal === '0' || conclusion.is_normal === 0 || conclusion.diagnosis) && (
                                <div className="pl-6 font-bold text-slate-800">
                                    {conclusion.diagnosis ? formatIcd10String(conclusion.diagnosis) : '...'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end mt-8 px-6 text-[13px]">
                        <div className="text-center w-80 flex flex-col items-center">
                            <span className="italic block mb-0.5">Ngày {reportDate.day} tháng {reportDate.month} năm {reportDate.year}</span>
                            <strong className="block font-bold uppercase tracking-wider mb-2">{L.lblNguoiKetLuan}</strong>
                            <span className="italic text-[11px] block mb-4">{L.lblKyGhiRoDongDau}</span>
                            
                            {docNormalized.signature_status === 'Signed' ? (
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
                            ) : (
                                <div className="h-16"></div>
                            )}
                            
                            <span className="font-bold text-[14px] mt-2 block">{getConclusionDoctorName()}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right text-[11px] text-gray-500 font-sans">Trang 4/4</div>
            </div>
        </div>
    );
};
