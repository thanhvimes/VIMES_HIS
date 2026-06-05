// ==================== DYNAMIC FORM GENERATOR ====================
// File: modules/health-check-sync/forms/DynamicForm.tsx

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { SearchIcon, RefreshIcon } from '../../../components/Icons';
import { healthCheckService } from '../../../services/healthCheckService';

interface DynamicFormProps {
    formType: string;
    initialData?: any;
    onSave: (formData: any) => void;
    onCancel: () => void;
    onChangeFormType?: (type: string) => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ formType, initialData, onSave, onCancel, onChangeFormType }) => {
    const { fontSettings } = useTheme();
    const [activeTab, setActiveTab] = useState<'admin' | 'history' | 'exam' | 'lab'>('admin');
    
    // State for HIS Sync
    const [hisSearchQuery, setHisSearchQuery] = useState('');
    const [isFetchingHis, setIsFetchingHis] = useState(false);
    const [hisSyncMessage, setHisSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleFetchHisData = async () => {
        if (!hisSearchQuery.trim()) {
            setHisSyncMessage({ type: 'error', text: 'Vui lòng nhập Mã bệnh nhân hoặc số CCCD để lấy dữ liệu từ HIS' });
            return;
        }
        setIsFetchingHis(true);
        setHisSyncMessage(null);
        try {
            const data = await healthCheckService.getHisPatient(hisSearchQuery.trim());
            if (data) {
                // Đổ dữ liệu hành chính
                if (data.patient_id) setPatientId(data.patient_id);
                if (data.patient_name) setPatientName(data.patient_name.toUpperCase());
                if (data.cccd) setCccd(data.cccd);
                if (data.dob) setDob(new Date(data.dob).toISOString().split('T')[0]);
                if (data.gender) setGender(data.gender);
                if (data.clinical_data?.address) setAddress(data.clinical_data.address);
                if (data.clinical_data?.phone) setPhone(data.clinical_data.phone);
                if (data.clinical_data?.ethnic) setEthnic(data.clinical_data.ethnic);
                if (data.clinical_data?.blood_group) setBloodGroup(data.clinical_data.blood_group);
                if (data.clinical_data?.target_group) setTargetGroup(data.clinical_data.target_group);
                if (data.clinical_data?.ma_gtin_cskcb) setMaGtinCskcb(data.clinical_data.ma_gtin_cskcb);
                if (data.clinical_data?.matinh_cu_tru) setMaTinhCuTru(data.clinical_data.matinh_cu_tru);
                if (data.clinical_data?.maxa_cu_tru) setMaXaCuTru(data.clinical_data.maxa_cu_tru);
                if (data.clinical_data?.ly_do_vv) setLyDoVv(data.clinical_data.ly_do_vv);
                if (data.clinical_data?.ngay_vao) setNgayVao(new Date(data.clinical_data.ngay_vao).toISOString().split('T')[0]);
                
                // Đổ dữ liệu thể lực
                if (data.clinical_data?.examination?.height) setHeight(data.clinical_data.examination.height);
                if (data.clinical_data?.examination?.weight) setWeight(data.clinical_data.examination.weight);
                if (data.clinical_data?.examination?.blood_pressure) setBp(data.clinical_data.examination.blood_pressure);
                if (data.clinical_data?.examination?.pulse) setPulse(data.clinical_data.examination.pulse);
                
                // Đổ dữ liệu khám lâm sàng chuyên khoa chi tiết
                if (data.clinical_data?.clinical_exam?.internal) setInternalExam(data.clinical_data.clinical_exam.internal);
                if (data.clinical_data?.clinical_exam?.eye) setEyeExam(data.clinical_data.clinical_exam.eye);
                if (data.clinical_data?.clinical_exam?.ent) setEntExam(data.clinical_data.clinical_exam.ent);
                if (data.clinical_data?.clinical_exam?.dental) setDentalExam(data.clinical_data.clinical_exam.dental);
                if (data.clinical_data?.clinical_exam?.external) setExternalExam(data.clinical_data.clinical_exam.external);
                if (data.clinical_data?.clinical_exam?.dermatology) setDermatologyExam(data.clinical_data.clinical_exam.dermatology);
                if (data.clinical_data?.clinical_exam?.gynecology) setGynExam(data.clinical_data.clinical_exam.gynecology);
                
                // Khám mắt & tai mũi họng & RHM chi tiết
                if (data.clinical_data?.clinical_exam?.khong_kinh_mat_phai) setKhongKinhMatPhai(data.clinical_data.clinical_exam.khong_kinh_mat_phai);
                if (data.clinical_data?.clinical_exam?.khong_kinh_mat_trai) setKhongKinhMatTrai(data.clinical_data.clinical_exam.khong_kinh_mat_trai);
                if (data.clinical_data?.clinical_exam?.co_kinh_mat_phai) setCoKinhMatPhai(data.clinical_data.clinical_exam.co_kinh_mat_phai);
                if (data.clinical_data?.clinical_exam?.co_kinh_mat_trai) setCoKinhMatTrai(data.clinical_data.clinical_exam.co_kinh_mat_trai);
                if (data.clinical_data?.clinical_exam?.khong_kinh_hai_mat) setKhongKinhHaiMat(data.clinical_data.clinical_exam.khong_kinh_hai_mat);
                if (data.clinical_data?.clinical_exam?.co_kinh_hai_mat) setCoKinhHaiMat(data.clinical_data.clinical_exam.co_kinh_hai_mat);
                if (data.clinical_data?.clinical_exam?.sac_giac) setSacGiac(data.clinical_data.clinical_exam.sac_giac);
                if (data.clinical_data?.clinical_exam?.thi_truong_ngang_haimat) setThiTruongNgangHaiMat(data.clinical_data.clinical_exam.thi_truong_ngang_haimat);
                if (data.clinical_data?.clinical_exam?.thi_truong_dung_haimat) setThiTruongDungHaiMat(data.clinical_data.clinical_exam.thi_truong_dung_haimat);
                
                if (data.clinical_data?.clinical_exam?.tai_trai_noi_thuong) setTaiTraiNoiThuong(data.clinical_data.clinical_exam.tai_trai_noi_thuong);
                if (data.clinical_data?.clinical_exam?.tai_trai_noi_tham) setTaiTraiNoiTham(data.clinical_data.clinical_exam.tai_trai_noi_tham);
                if (data.clinical_data?.clinical_exam?.tai_phai_noi_thuong) setTaiPhaiNoiThuong(data.clinical_data.clinical_exam.tai_phai_noi_thuong);
                if (data.clinical_data?.clinical_exam?.tai_phai_noi_tham) setTaiPhaiNoiTham(data.clinical_data.clinical_exam.tai_phai_noi_tham);
                
                if (data.clinical_data?.clinical_exam?.ham_tren) setHamTren(data.clinical_data.clinical_exam.ham_tren);
                if (data.clinical_data?.clinical_exam?.ham_duoi) setHamDuoi(data.clinical_data.clinical_exam.ham_duoi);

                // Phân loại chuyên khoa
                if (data.clinical_data?.clinical_exam?.kham_the_luc_pl) setKhamTheLucPl(data.clinical_data.clinical_exam.kham_the_luc_pl);
                if (data.clinical_data?.clinical_exam?.noi_khoa_tuan_hoan_pl) setNoiKhoaTuanHoanPl(data.clinical_data.clinical_exam.noi_khoa_tuan_hoan_pl);
                if (data.clinical_data?.clinical_exam?.noi_khoa_ho_hap_pl) setNoiKhoaHoHapPl(data.clinical_data.clinical_exam.noi_khoa_ho_hap_pl);
                if (data.clinical_data?.clinical_exam?.noi_khoa_tieu_hoa_pl) setNoiKhoaTieuHoaPl(data.clinical_data.clinical_exam.noi_khoa_tieu_hoa_pl);
                if (data.clinical_data?.clinical_exam?.noi_khoa_than_tietnieu_pl) setNoiKhoaThanTietnieuPl(data.clinical_data.clinical_exam.noi_khoa_than_tietnieu_pl);
                if (data.clinical_data?.clinical_exam?.noi_khoa_noi_tiet_pl) setNoiKhoaNoiTietPl(data.clinical_data.clinical_exam.noi_khoa_noi_tiet_pl);
                if (data.clinical_data?.clinical_exam?.noi_khoa_co_xuong_khop_pl) setNoiKhoaCoXuongKhopPl(data.clinical_data.clinical_exam.noi_khoa_co_xuong_khop_pl);
                if (data.clinical_data?.clinical_exam?.noi_khoa_than_kinh_pl) setNoiKhoaThanKinhPl(data.clinical_data.clinical_exam.noi_khoa_than_kinh_pl);
                if (data.clinical_data?.clinical_exam?.noi_khoa_tam_than_pl) setNoiKhoaTamThanPl(data.clinical_data.clinical_exam.noi_khoa_tam_than_pl);
                if (data.clinical_data?.clinical_exam?.kham_ngoai_khoa_pl) setKhamNgoaiKhoaPl(data.clinical_data.clinical_exam.kham_ngoai_khoa_pl);
                if (data.clinical_data?.clinical_exam?.kham_da_lieu_pl) setKhamDaLieuPl(data.clinical_data.clinical_exam.kham_da_lieu_pl);
                if (data.clinical_data?.clinical_exam?.kham_san_phu_khoa_pl) setKhamSanPhuKhoaPl(data.clinical_data.clinical_exam.kham_san_phu_khoa_pl);
                if (data.clinical_data?.clinical_exam?.kham_mat_pl) setKhamMatPl(data.clinical_data.clinical_exam.kham_mat_pl);
                if (data.clinical_data?.clinical_exam?.kham_tai_mui_hong_pl) setKhamTaiMuiHongPl(data.clinical_data.clinical_exam.kham_tai_mui_hong_pl);
                if (data.clinical_data?.clinical_exam?.kham_rang_ham_mat_pl) setKhamRangHamMatPl(data.clinical_data.clinical_exam.kham_rang_ham_mat_pl);

                if (data.clinical_data?.clinical_exam?.nhi_tuan_hoan) setNhiTuanHoan(data.clinical_data.clinical_exam.nhi_tuan_hoan);
                if (data.clinical_data?.clinical_exam?.nhi_ho_hap) setNhiHoHap(data.clinical_data.clinical_exam.nhi_ho_hap);
                if (data.clinical_data?.clinical_exam?.nhi_tieu_hoa) setNhiTieuHoa(data.clinical_data.clinical_exam.nhi_tieu_hoa);
                if (data.clinical_data?.clinical_exam?.nhi_tiet_nieu) setNhiTietNieu(data.clinical_data.clinical_exam.nhi_tiet_nieu);
                if (data.clinical_data?.clinical_exam?.nhi_than_kinh) setNhiThanKinh(data.clinical_data.clinical_exam.nhi_than_kinh);
                if (data.clinical_data?.clinical_exam?.nhi_tam_than) setNhiTamThan(data.clinical_data.clinical_exam.nhi_tam_than);
                if (data.clinical_data?.clinical_exam?.nhi_khac) setNhiKhac(data.clinical_data.clinical_exam.nhi_khac);
                
                // Đổ dữ liệu cận lâm sàng
                if (data.lab_data?.blood_test?.hemoglobin) setHemoglobin(data.lab_data.blood_test.hemoglobin);
                if (data.lab_data?.blood_test?.glycemia) setGlycemia(data.lab_data.blood_test.glycemia);
                if (data.lab_data?.urine_test?.protein) setProtein(data.lab_data.urine_test.protein);
                if (data.lab_data?.kq_xn_ma_tuy) setKqXnMaiTuy(data.lab_data.kq_xn_ma_tuy);
                if (data.lab_data?.kq_xn_nong_do_con) setKqXnNongDoCon(data.lab_data.kq_xn_nong_do_con);
                if (data.lab_data?.kq_xn_khac) setKqXnKhac(data.lab_data.kq_xn_khac);
                
                // Đổ kết luận
                if (data.conclusion_data?.fitness_class) setFitnessClass(data.conclusion_data.fitness_class);
                if (data.conclusion_data?.diagnosis) setDiagnosis(data.conclusion_data.diagnosis);
                if (data.conclusion_data?.cac_van_de_luu_y) setCacVanDeLuuY(data.conclusion_data.cac_van_de_luu_y);

                setHisSyncMessage({ 
                    type: 'success', 
                    text: `Đồng bộ thành công dữ liệu HIS của BN: ${data.patient_name}! Hãy rà soát lại và bổ sung các trường đặc thù của Mẫu ${formType}.` 
                });
            } else {
                setHisSyncMessage({ type: 'error', text: 'Không tìm thấy thông tin bệnh nhân trên hệ thống HIS' });
            }
        } catch (error: any) {
            setHisSyncMessage({ type: 'error', text: 'Lỗi kết nối hệ thống HIS: ' + error.message });
        } finally {
            setIsFetchingHis(false);
        }
    };

    // 1. Administrative & Lookup State
    const [patientId, setPatientId] = useState(initialData?.patient_id || `P${Math.floor(1000 + Math.random() * 9000)}`);
    const [patientName, setPatientName] = useState(initialData?.patient_name || '');
    const [cccd, setCccd] = useState(initialData?.cccd || '');
    const [dob, setDob] = useState(initialData?.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '');
    const [gender, setGender] = useState(initialData?.gender || 'Nam');
    const [docNo, setDocNo] = useState(initialData?.doc_no || `KSK-${Date.now()}`);
    const [address, setAddress] = useState(initialData?.clinical_data?.address || '');
    const [phone, setPhone] = useState(initialData?.clinical_data?.phone || '');
    const [ethnic, setEthnic] = useState(initialData?.clinical_data?.ethnic || '01');
    const [cccdDate, setCccdDate] = useState(initialData?.clinical_data?.cccd_date || '');
    const [cccdPlace, setCccdPlace] = useState(initialData?.clinical_data?.cccd_place || '');
    const [bloodGroup, setBloodGroup] = useState(initialData?.clinical_data?.blood_group || 'O');
    const [targetGroup, setTargetGroup] = useState(initialData?.clinical_data?.target_group || '14');
    const [fundingSource, setFundingSource] = useState(initialData?.clinical_data?.funding_source || '9');
    
    // Hành chính bổ sung QĐ 1551
    const [maGtinCskcb, setMaGtinCskcb] = useState(initialData?.clinical_data?.ma_gtin_cskcb || '');
    const [maTinhCuTru, setMaTinhCuTru] = useState(initialData?.clinical_data?.matinh_cu_tru || '');
    const [maXaCuTru, setMaXaCuTru] = useState(initialData?.clinical_data?.maxa_cu_tru || '');
    const [lyDoVv, setLyDoVv] = useState(initialData?.clinical_data?.ly_do_vv || 'Khám sức khỏe định kỳ');
    const [ngayVao, setNgayVao] = useState(initialData?.clinical_data?.ngay_vao || new Date().toISOString().split('T')[0]);

    // Form-specific extra administrative fields
    const [guardianName, setGuardianName] = useState(initialData?.clinical_data?.extra?.nguoi_giam_ho || '');
    const [guardianCccd, setGuardianCccd] = useState(initialData?.clinical_data?.extra?.so_cccd_ngh || '');
    const [escortName, setEscortName] = useState(initialData?.clinical_data?.extra?.ho_ten_nguoi_di_cung || '');
    const [escortCccd, setEscortCccd] = useState(initialData?.clinical_data?.extra?.so_cccd_nguoi_di_cung || '');
    const [escortRelation, setEscortRelation] = useState(initialData?.clinical_data?.extra?.moi_quan_he_voi_tre || '1');
    const [licenseClass, setLicenseClass] = useState(initialData?.clinical_data?.extra?.hang_lai_xe || 'B2');
    const [chucDanh, setChucDanh] = useState(initialData?.clinical_data?.extra?.chuc_danh || '');
    const [noiCongTac, setNoiCongTac] = useState(initialData?.clinical_data?.extra?.noi_cong_tac || '');
    const [viTriLamViec, setViTriLamViec] = useState(initialData?.clinical_data?.extra?.vi_tri_lam_viec || '');
    const [boPhanLamViec, setBoPhanLamViec] = useState(initialData?.clinical_data?.extra?.bo_phan_lam_viec || '');
    const [offshoreExp, setOffshoreExp] = useState(initialData?.clinical_data?.extra?.offshore_exp || '1');
    const [railwayFit, setRailwayFit] = useState(initialData?.clinical_data?.extra?.railway_fit || '1');

    // 2. Tiền sử bệnh & tiêm chủng
    const [tsgdMacBenh, setTsgdMacBenh] = useState(initialData?.clinical_data?.extra?.tsgd_mac_benh || '0');
    const [tsgdMaBenh, setTsgdMaBenh] = useState(initialData?.clinical_data?.extra?.tsgd_ma_benh || '');
    const [tsbtMaBenh, setTsbtMaBenh] = useState(initialData?.clinical_data?.extra?.tsbt_ma_benh || '');
    const [tsbtNamPhatHienBenh, setTsbtNamPhatHienBenh] = useState(initialData?.clinical_data?.extra?.tsbt_nam_phat_hien_benh || '');
    const [tiemChungBcg, setTiemChungBcg] = useState(initialData?.clinical_data?.extra?.tiem_chung_bcg || '99');
    const [tiemChungBhHgUv, setTiemChungBhHgUv] = useState(initialData?.clinical_data?.extra?.tiem_chung_bh_hg_uv || '99');
    const [tiemChungSoi, setTiemChungSoi] = useState(initialData?.clinical_data?.extra?.tiem_chung_soi || '99');
    const [tiemChungBaiLiet, setTiemChungBaiLiet] = useState(initialData?.clinical_data?.extra?.tiem_chung_bai_liet || '99');
    const [tiemChungVnnbB, setTiemChungVnnbB] = useState(initialData?.clinical_data?.extra?.tiem_chung_vnnb_b || '99');
    const [tiemChungVgb, setTiemChungVgb] = useState(initialData?.clinical_data?.extra?.tiem_chung_vgb || '99');
    const [tiemChungCacLoaiKhac, setTiemChungCacLoaiKhac] = useState(initialData?.clinical_data?.extra?.tiem_chung_cac_loai_khac || '0');
    const [tiemChungVacXinKhac, setTiemChungVacXinKhac] = useState(initialData?.clinical_data?.extra?.tiem_chung_vac_xin_khac || '');

    // Tiền sử sản phụ khoa (nữ)
    const [coKinhNguyetNamBaoNhieuTuoi, setCoKinhNguyetNamBaoNhieuTuoi] = useState(initialData?.clinical_data?.extra?.co_kinh_nguyet_nam_bao_nhieu_tuoi || '');
    const [tinhChatKinhNguyet, setTinhChatKinhNguyet] = useState(initialData?.clinical_data?.extra?.tinh_chat_kinh_nguyet || '1');
    const [chuKyKinh, setChuKyKinh] = useState(initialData?.clinical_data?.extra?.chu_ky_kinh || '');
    const [luongKinh, setLuongKinh] = useState(initialData?.clinical_data?.extra?.luong_kinh || '');
    const [dauBungKinh, setDauBungKinh] = useState(initialData?.clinical_data?.extra?.dau_bung_kinh || '0');
    const [daLapGiaDinh, setDaLapGiaDinh] = useState(initialData?.clinical_data?.extra?.da_lap_gia_dinh || '0');
    const [para, setPara] = useState(initialData?.clinical_data?.extra?.para || '');
    const [daTungMoSanPhuKhoaChua, setDaTungMoSanPhuKhoaChua] = useState(initialData?.clinical_data?.extra?.da_tung_mo_san_phu_khoa_chua || '0');
    const [soLanMoSanPhuKhoa, setSoLanMoSanPhuKhoa] = useState(initialData?.clinical_data?.extra?.so_lan_mo_san_phu_khoa || '');
    const [ghiRoMoSanPhuKhoa, setGhiRoMoSanPhuKhoa] = useState(initialData?.clinical_data?.extra?.ghi_ro_mo_san_phu_khoa || '');
    const [dangApDungBpttKhong, setDangApDungBpttKhong] = useState(initialData?.clinical_data?.extra?.dang_ap_dung_bptt_khong || '0');
    const [bienPhapTranhThai, setBienPhapTranhThai] = useState(initialData?.clinical_data?.extra?.bien_phap_tranh_thai || '1');

    // Checkboxes & Tiền sử Lái xe / Bệnh nghề nghiệp bổ sung
    const [ts5Nam, setTs5Nam] = useState(initialData?.clinical_data?.extra?.ts_benh_thuong_5_nam || 0);
    const [tsThanKinh, setTsThanKinh] = useState(initialData?.clinical_data?.extra?.ts_than_kinh_chan_thuong_dau || 0);
    const [tsMat, setTsMat] = useState(initialData?.clinical_data?.extra?.ts_benh_mat_giam_thi_luc || 0);
    const [tsTai, setTsTai] = useState(initialData?.clinical_data?.extra?.ts_benh_tai_giam_nghe || 0);
    const [tsTimMach, setTsTimMach] = useState(initialData?.clinical_data?.extra?.ts_benh_tim_mach || 0);
    const [tsPhauThuatTim, setTsPhauThuatTim] = useState(initialData?.clinical_data?.extra?.ts_phau_thuat_tim_mach || 0);
    const [tsHuyetAp, setTsHuyetAp] = useState(initialData?.clinical_data?.extra?.ts_tang_huyet_ap || 0);
    const [tsKhoTho, setTsKhoTho] = useState(initialData?.clinical_data?.extra?.ts_kho_tho || 0);
    const [tsPhoiHen, setTsPhoiHen] = useState(initialData?.clinical_data?.extra?.ts_benh_phoi_hen || 0);
    const [tsThan, setTsThan] = useState(initialData?.clinical_data?.extra?.ts_benh_than_loc_mau || 0);
    const [tsTieuDuong, setTsTieuDuong] = useState(initialData?.clinical_data?.extra?.ts_dai_thao_duong || 0);
    const [tsTamThan, setTsTamThan] = useState(initialData?.clinical_data?.extra?.ts_benh_tam_than || 0);
    const [tsYThuc, setTsYThuc] = useState(initialData?.clinical_data?.extra?.ts_mat_roi_loan_y_thuc || 0);
    const [tsChongMat, setTsChongMat] = useState(initialData?.clinical_data?.extra?.ts_ngat_chong_mat || 0);
    const [tsTieuHoa, setTsTieuHoa] = useState(initialData?.clinical_data?.extra?.ts_benh_tieu_hoa || 0);
    const [tsGiacNgu, setTsGiacNgu] = useState(initialData?.clinical_data?.extra?.ts_roi_loan_giac_ngu || 0);
    const [tsTaiBien, setTsTaiBien] = useState(initialData?.clinical_data?.extra?.ts_tai_bien_mach_mau_nao || 0);
    const [tsSuDungRuou, setTsSuDungRuou] = useState(initialData?.clinical_data?.extra?.ts_su_dung_ruou || 0);
    const [tsSuDungMaTuy, setTsSuDungMaTuy] = useState(initialData?.clinical_data?.extra?.ts_su_dung_ma_tuy || 0);
    const [tsBenhCotSong, setTsBenhCotSong] = useState(initialData?.clinical_data?.extra?.ts_benh_cot_song || 0);
    const [tsbtMaBenhNgheNghiep, setTsbtMaBenhNgheNghiep] = useState(initialData?.clinical_data?.extra?.tsbt_ma_benh_nghe_nghiep || '');
    const [tsbtNamPhatHienBenhNgheNghiep, setTsbtNamPhatHienBenhNgheNghiep] = useState(initialData?.clinical_data?.extra?.tsbt_nam_phat_hien_benh_nghe_nghiep || '');

    // 3. Physical Measurements
    const [height, setHeight] = useState(initialData?.clinical_data?.examination?.height || '');
    const [weight, setWeight] = useState(initialData?.clinical_data?.examination?.weight || '');
    const [pulse, setPulse] = useState(initialData?.clinical_data?.examination?.pulse || '');
    const [bp, setBp] = useState(initialData?.clinical_data?.examination?.blood_pressure || '');
    const [vongDau, setVongDau] = useState(initialData?.clinical_data?.extra?.vong_ddau || '');
    const [vongNguc, setVongNguc] = useState(initialData?.clinical_data?.extra?.vong_nguc || '');
    const [sinhNon, setSinhNon] = useState(initialData?.clinical_data?.extra?.sinh_non || '0');
    const [tuanThai, setTuanThai] = useState(initialData?.clinical_data?.extra?.tuan_thai_khi_sinh || '');
    const [birthWeight, setBirthWeight] = useState(initialData?.clinical_data?.extra?.can_nang_luc_sinh || '');
    const [lucBopTayThuan, setLucBopTayThuan] = useState(initialData?.clinical_data?.extra?.luc_bop_tay_thuan || '');
    const [lucBopTayKhongThuan, setLucBopTayKhongThuan] = useState(initialData?.clinical_data?.extra?.luc_bop_tay_khong_thuan || '');
    const [lucKeoLung, setLucKeoLung] = useState(initialData?.clinical_data?.extra?.luc_keo_lung || '');
    
    // Auto calculated BMI
    const [bmi, setBmi] = useState('22.0');
    useEffect(() => {
        if (height && weight) {
            const hM = Number(height) / 100;
            const wK = Number(weight);
            if (hM > 0) {
                setBmi((wK / Math.pow(hM, 2)).toFixed(1));
            }
        }
    }, [height, weight]);

    // 4. Clinical specialty results
    const [internalExam, setInternalExam] = useState(initialData?.clinical_data?.clinical_exam?.internal || 'Bình thường, tim phổi đều rõ');
    const [eyeExam, setEyeExam] = useState(initialData?.clinical_data?.clinical_exam?.eye || 'Mắt phải 10/10, Mắt trái 10/10');
    const [entExam, setEntExam] = useState(initialData?.clinical_data?.clinical_exam?.ent || 'Tai mũi họng bình thường, không viêm cấp');
    const [dentalExam, setDentalExam] = useState(initialData?.clinical_data?.clinical_exam?.dental || 'Răng hàm mặt bình thường, không sâu răng');
    const [externalExam, setExternalExam] = useState(initialData?.clinical_data?.clinical_exam?.external || 'Ngoại khoa bình thường');
    const [dermatologyExam, setDermatologyExam] = useState(initialData?.clinical_data?.clinical_exam?.dermatology || 'Da liễu bình thường');
    const [gynExam, setGynExam] = useState(initialData?.clinical_data?.clinical_exam?.gynecology || 'Không khám (hoặc bình thường)');
    
    // Khám lâm sàng chuyên khoa chi tiết QĐ 1551
    const [khongKinhMatPhai, setKhongKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.khong_kinh_mat_phai || '10/10');
    const [khongKinhMatTrai, setKhongKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.khong_kinh_mat_trai || '10/10');
    const [coKinhMatPhai, setCoKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.co_kinh_mat_phai || '');
    const [coKinhMatTrai, setCoKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.co_kinh_mat_trai || '');
    const [khongKinhHaiMat, setKhongKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.khong_kinh_hai_mat || '10/10');
    const [coKinhHaiMat, setCoKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.co_kinh_hai_mat || '');
    const [sacGiac, setSacGiac] = useState(initialData?.clinical_data?.clinical_exam?.sac_giac || '0');
    const [thiTruongNgangHaiMat, setThiTruongNgangHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.thi_truong_ngang_haimat || 'Bình thường');
    const [thiTruongDungHaiMat, setThiTruongDungHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.thi_truong_dung_haimat || 'Bình thường');

    const [taiTraiNoiThuong, setTaiTraiNoiThuong] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_noi_thuong || '5');
    const [taiTraiNoiTham, setTaiTraiNoiTham] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_noi_tham || '0.5');
    const [taiPhaiNoiThuong, setTaiPhaiNoiThuong] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_noi_thuong || '5');
    const [taiPhaiNoiTham, setTaiPhaiNoiTham] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_noi_tham || '0.5');

    const [hamTren, setHamTren] = useState(initialData?.clinical_data?.clinical_exam?.ham_tren || 'Bình thường');
    const [hamDuoi, setHamDuoi] = useState(initialData?.clinical_data?.clinical_exam?.ham_duoi || 'Bình thường');

    // Phân loại chuyên khoa (Mẫu 2)
    const [khamTheLucPl, setKhamTheLucPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_the_luc_pl || '1');
    const [noiKhoaTuanHoanPl, setNoiKhoaTuanHoanPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_tuan_hoan_pl || '1');
    const [noiKhoaHoHapPl, setNoiKhoaHoHapPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_ho_hap_pl || '1');
    const [noiKhoaTieuHoaPl, setNoiKhoaTieuHoaPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_tieu_hoa_pl || '1');
    const [noiKhoaThanTietnieuPl, setNoiKhoaThanTietnieuPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_than_tietnieu_pl || '1');
    const [noiKhoaNoiTietPl, setNoiKhoaNoiTietPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_noi_tiet_pl || '1');
    const [noiKhoaCoXuongKhopPl, setNoiKhoaCoXuongKhopPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_co_xuong_khop_pl || '1');
    const [noiKhoaThanKinhPl, setNoiKhoaThanKinhPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_than_kinh_pl || '1');
    const [noiKhoaTamThanPl, setNoiKhoaTamThanPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_tam_than_pl || '1');
    const [khamNgoaiKhoaPl, setKhamNgoaiKhoaPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_ngoai_khoa_pl || '1');
    const [khamDaLieuPl, setKhamDaLieuPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_da_lieu_pl || '1');
    const [khamSanPhuKhoaPl, setKhamSanPhuKhoaPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_san_phu_khoa_pl || '1');
    const [khamMatPl, setKhamMatPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_mat_pl || '1');
    const [khamTaiMuiHongPl, setKhamTaiMuiHongPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_tai_mui_hong_pl || '1');
    const [khamRangHamMatPl, setKhamRangHamMatPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_rang_ham_mat_pl || '1');

    // Nhi khoa (Forms 6 - 13)
    const [nhiTuanHoan, setNhiTuanHoan] = useState(initialData?.clinical_data?.clinical_exam?.nhi_tuan_hoan || 'Bình thường');
    const [nhiHoHap, setNhiHoHap] = useState(initialData?.clinical_data?.clinical_exam?.nhi_ho_hap || 'Bình thường');
    const [nhiTieuHoa, setNhiTieuHoa] = useState(initialData?.clinical_data?.clinical_exam?.nhi_tieu_hoa || 'Bình thường');
    const [nhiTietNieu, setNhiTietNieu] = useState(initialData?.clinical_data?.clinical_exam?.nhi_tiet_nieu || 'Bình thường');
    const [nhiThanKinh, setNhiThanKinh] = useState(initialData?.clinical_data?.clinical_exam?.nhi_than_kinh || 'Bình thường');
    const [nhiTamThan, setNhiTamThan] = useState(initialData?.clinical_data?.clinical_exam?.nhi_tam_than || 'Bình thường');
    const [nhiKhac, setNhiKhac] = useState(initialData?.clinical_data?.clinical_exam?.nhi_khac || 'Bình thường');
    const [milestoneCheck, setMilestoneCheck] = useState(initialData?.clinical_data?.extra?.milestone_check || '1');

    // 5. Paraclinical/Labs
    const [hemoglobin, setHemoglobin] = useState(initialData?.lab_data?.blood_test?.hemoglobin || '140');
    const [glycemia, setGlycemia] = useState(initialData?.lab_data?.blood_test?.glycemia || '5.2');
    const [protein, setProtein] = useState(initialData?.lab_data?.urine_test?.protein || 'Âm tính');
    
    // Xét nghiệm bổ sung QĐ 1551 (Lái xe, thuyền viên...)
    const [kqXnMaiTuy, setKqXnMaiTuy] = useState(initialData?.lab_data?.kq_xn_ma_tuy || 'Âm tính');
    const [kqXnNongDoCon, setKqXnNongDoCon] = useState(initialData?.lab_data?.kq_xn_nong_do_con || '0.0 mg/L');
    const [kqXnKhac, setKqXnKhac] = useState(initialData?.lab_data?.kq_xn_khac || '');

    // 6. Conclusion
    const [fitnessClass, setFitnessClass] = useState(initialData?.conclusion_data?.fitness_class || '1');
    const [diagnosis, setDiagnosis] = useState(initialData?.conclusion_data?.diagnosis || 'Đủ sức khỏe học tập và làm việc');
    const [cacVanDeLuuY, setCacVanDeLuuY] = useState(initialData?.conclusion_data?.cac_van_de_luu_y || 'Không');

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!patientName.trim()) newErrors.patientName = 'Họ và tên bắt buộc nhập';
        if (patientName.trim() && patientName !== patientName.toUpperCase()) {
            newErrors.patientName = 'Họ và tên phải viết IN HOA có dấu';
        }
        if (!cccd.trim()) newErrors.cccd = 'Số CCCD/Định danh bắt buộc nhập';
        if (cccd.trim() && !/^\d{12}$/.test(cccd)) {
            newErrors.cccd = 'Định danh/CCCD phải gồm chính xác 12 chữ số';
        }
        if (!dob) newErrors.dob = 'Ngày sinh bắt buộc chọn';
        if (bp && !/^\d{2,3}\/\d{2,3}$/.test(bp)) {
            newErrors.bp = 'Huyết áp phải nhập dạng Tâm thu/Tâm trương (VD: 120/80)';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            // Switch to admin tab if basic details are failing
            setActiveTab('admin');
            return;
        }
        
        const fullPayload = {
            patientId,
            patientName: patientName.toUpperCase(),
            cccd,
            dob,
            gender,
            docNo,
            formType,
            clinicalData: {
                address,
                phone,
                ethnic,
                cccd_date: cccdDate,
                cccd_place: cccdPlace,
                blood_group: bloodGroup,
                target_group: targetGroup,
                funding_source: fundingSource,
                ma_gtin_cskcb: maGtinCskcb,
                matinh_cu_tru: maTinhCuTru,
                maxa_cu_tru: maXaCuTru,
                ly_do_vv: lyDoVv,
                ngay_vao: ngayVao,
                examination: {
                    height,
                    weight,
                    bmi,
                    blood_pressure: bp,
                    pulse,
                },
                clinical_exam: {
                    internal: internalExam,
                    eye: eyeExam,
                    ent: entExam,
                    dental: dentalExam,
                    external: externalExam,
                    dermatology: dermatologyExam,
                    gynecology: gynExam,
                    // Chi tiết chuyên khoa QĐ 1551
                    khong_kinh_mat_phai: khongKinhMatPhai,
                    khong_kinh_mat_trai: khongKinhMatTrai,
                    co_kinh_mat_phai: coKinhMatPhai,
                    co_kinh_mat_trai: coKinhMatTrai,
                    khong_kinh_hai_mat: khongKinhHaiMat,
                    co_kinh_hai_mat: coKinhHaiMat,
                    sac_giac: sacGiac,
                    thi_truong_ngang_haimat: thiTruongNgangHaiMat,
                    thi_truong_dung_haimat: thiTruongDungHaiMat,
                    tai_trai_noi_thuong: taiTraiNoiThuong,
                    tai_trai_noi_tham: taiTraiNoiTham,
                    tai_phai_noi_thuong: taiPhaiNoiThuong,
                    tai_phai_noi_tham: taiPhaiNoiTham,
                    ham_tren: hamTren,
                    ham_duoi: hamDuoi,
                    // Phân loại chuyên khoa
                    kham_the_luc_pl: khamTheLucPl,
                    noi_khoa_tuan_hoan_pl: noiKhoaTuanHoanPl,
                    noi_khoa_ho_hap_pl: noiKhoaHoHapPl,
                    noi_khoa_tieu_hoa_pl: noiKhoaTieuHoaPl,
                    noi_khoa_than_tietnieu_pl: noiKhoaThanTietnieuPl,
                    noi_khoa_noi_tiet_pl: noiKhoaNoiTietPl,
                    noi_khoa_co_xuong_khop_pl: noiKhoaCoXuongKhopPl,
                    noi_khoa_than_kinh_pl: noiKhoaThanKinhPl,
                    noi_khoa_tam_than_pl: noiKhoaTamThanPl,
                    kham_ngoai_khoa_pl: khamNgoaiKhoaPl,
                    kham_da_lieu_pl: khamDaLieuPl,
                    kham_san_phu_khoa_pl: khamSanPhuKhoaPl,
                    kham_mat_pl: khamMatPl,
                    kham_tai_mui_hong_pl: khamTaiMuiHongPl,
                    kham_rang_ham_mat_pl: khamRangHamMatPl,
                    nhi_tuan_hoan: nhiTuanHoan,
                    nhi_ho_hap: nhiHoHap,
                    nhi_tieu_hoa: nhiTieuHoa,
                    nhi_tiet_nieu: nhiTietNieu,
                    nhi_than_kinh: nhiThanKinh,
                    nhi_tam_than: nhiTamThan,
                    nhi_khac: nhiKhac
                },
                extra: {
                    nguoi_giam_ho: guardianName,
                    so_cccd_ngh: guardianCccd,
                    ho_ten_nguoi_di_cung: escortName,
                    so_cccd_nguoi_di_cung: escortCccd,
                    moi_quan_he_voi_tre: escortRelation,
                    hang_lai_xe: licenseClass,
                    chuc_danh: chucDanh,
                    noi_cong_tac: noiCongTac,
                    vi_tri_lam_viec: viTriLamViec,
                    bo_phan_lam_viec: boPhanLamViec,
                    offshore_exp: offshoreExp,
                    railway_fit: railwayFit,
                    tsgd_mac_benh: tsgdMacBenh,
                    tsgd_ma_benh: tsgdMaBenh,
                    tsbt_ma_benh: tsbtMaBenh,
                    tsbt_nam_phat_hien_benh: tsbtNamPhatHienBenh,
                    tiem_chung_bcg: tiemChungBcg,
                    tiem_chung_bh_hg_uv: tiemChungBhHgUv,
                    tiem_chung_soi: tiemChungSoi,
                    tiem_chung_bai_liet: tiemChungBaiLiet,
                    tiem_chung_vnnb_b: tiemChungVnnbB,
                    tiem_chung_vgb: tiemChungVgb,
                    tiem_chung_cac_loai_khac: tiemChungCacLoaiKhac,
                    tiem_chung_vac_xin_khac: tiemChungVacXinKhac,
                    co_kinh_nguyet_nam_bao_nhieu_tuoi: coKinhNguyetNamBaoNhieuTuoi,
                    tinh_chat_kinh_nguyet: tinhChatKinhNguyet,
                    chu_ky_kinh: chuKyKinh,
                    luong_kinh: luongKinh,
                    dau_bung_kinh: dauBungKinh,
                    da_lap_gia_dinh: daLapGiaDinh,
                    para: para,
                    da_tung_mo_san_phu_khoa_chua: daTungMoSanPhuKhoaChua,
                    so_lan_mo_san_phu_khoa: soLanMoSanPhuKhoa,
                    ghi_ro_mo_san_phu_khoa: ghiRoMoSanPhuKhoa,
                    dang_ap_dung_bptt_khong: dangApDungBpttKhong,
                    bien_phap_tranh_thai: bienPhapTranhThai,
                    ts_benh_thuong_5_nam: ts5Nam,
                    ts_than_kinh_chan_thuong_dau: tsThanKinh,
                    ts_benh_mat_giam_thi_luc: tsMat,
                    ts_benh_tai_giam_nghe: tsTai,
                    ts_benh_tim_mach: tsTimMach,
                    ts_phau_thuat_tim_mach: tsPhauThuatTim,
                    ts_tang_huyet_ap: tsHuyetAp,
                    ts_kho_tho: tsKhoTho,
                    ts_benh_phoi_hen: tsPhoiHen,
                    ts_benh_than_loc_mau: tsThan,
                    ts_dai_thao_duong: tsTieuDuong,
                    ts_benh_tam_than: tsTamThan,
                    ts_mat_roi_loan_y_thuc: tsYThuc,
                    ts_ngat_chong_mat: tsChongMat,
                    ts_benh_tieu_hoa: tsTieuHoa,
                    ts_roi_loan_giac_ngu: tsGiacNgu,
                    ts_tai_bien_mach_mau_nao: tsTaiBien,
                    ts_su_dung_ruou: tsSuDungRuou,
                    ts_su_dung_ma_tuy: tsSuDungMaTuy,
                    ts_benh_cot_song: tsBenhCotSong,
                    tsbt_ma_benh_nghe_nghiep: tsbtMaBenhNgheNghiep,
                    tsbt_nam_phat_hien_benh_nghe_nghiep: tsbtNamPhatHienBenhNgheNghiep,
                    vong_ddau: vongDau,
                    vong_nguc: vongNguc,
                    sinh_non: sinhNon,
                    tuan_thai_khi_sinh: tuanThai,
                    can_nang_luc_sinh: birthWeight,
                    luc_bop_tay_thuan: lucBopTayThuan,
                    luc_bop_tay_khong_thuan: lucBopTayKhongThuan,
                    luc_keo_lung: lucKeoLung,
                    milestone_check: milestoneCheck
                }
            },
            labData: {
                blood_test: { hemoglobin, glycemia },
                urine_test: { protein },
                kq_xn_ma_tuy: kqXnMaiTuy,
                kq_xn_nong_do_con: kqXnNongDoCon,
                kq_xn_khac: kqXnKhac
            },
            conclusionData: {
                fitness_class: fitnessClass,
                diagnosis,
                cac_van_de_luu_y: cacVanDeLuuY
            }
        };
        
        onSave(fullPayload);
    };

    const isChild = parseInt(formType, 10) >= 6 && parseInt(formType, 10) <= 13;
    const isStudent = formType === '1' || (parseInt(formType, 10) >= 14 && parseInt(formType, 10) <= 17);

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest bg-blue-500/50 px-2.5 py-1 rounded-full text-blue-100">
                        Quy định 1551/QĐ-BYT
                    </span>
                    <h3 className="text-xl font-bold mt-1 text-white">
                        {initialData ? "Chỉnh sửa hồ sơ Khám sức khỏe" : "Tạo mới hồ sơ Khám sức khỏe"}
                    </h3>
                </div>
                <div className="flex items-center gap-3 self-stretch md:self-auto">
                    {!initialData && onChangeFormType ? (
                        <div className="flex flex-col items-start md:items-end gap-1 w-full md:w-auto">
                            <span className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">Chọn mẫu biểu áp dụng:</span>
                            <select
                                value={formType}
                                onChange={e => onChangeFormType(e.target.value)}
                                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-white focus:outline-none cursor-pointer w-full md:w-[280px]"
                                style={{ colorScheme: 'dark' }}
                            >
                                <optgroup label="Nhóm Phổ Biến" className="text-slate-800 bg-white">
                                    <option value="2" className="text-slate-800 bg-white">Mẫu 2: Người lớn (&gt;= 18T)</option>
                                    <option value="3" className="text-slate-800 bg-white">Mẫu 3: Khám sức khỏe lái xe</option>
                                </optgroup>
                                <optgroup label="Nhóm Học Sinh" className="text-slate-800 bg-white">
                                    <option value="1" className="text-slate-800 bg-white">Mẫu 1: Trẻ em 6T - dưới 18T</option>
                                    <option value="14" className="text-slate-800 bg-white">Mẫu 14: Học sinh 3M - dưới 6T</option>
                                    <option value="15" className="text-slate-800 bg-white">Mẫu 15: Học sinh cấp 1</option>
                                    <option value="16" className="text-slate-800 bg-white">Mẫu 16: Học sinh cấp 2</option>
                                    <option value="17" className="text-slate-800 bg-white">Mẫu 17: Học sinh cấp 3</option>
                                </optgroup>
                                <optgroup label="Nhóm Trẻ Em" className="text-slate-800 bg-white">
                                    <option value="6" className="text-slate-800 bg-white">Mẫu 6: Trẻ em 0 - dưới 2 tháng</option>
                                    <option value="7" className="text-slate-800 bg-white">Mẫu 7: Trẻ em 2 - 3 tháng</option>
                                    <option value="8" className="text-slate-800 bg-white">Mẫu 8: Trẻ em 4 - 6 tháng</option>
                                    <option value="9" className="text-slate-800 bg-white">Mẫu 9: Trẻ em 7 - 9 tháng</option>
                                    <option value="10" className="text-slate-800 bg-white">Mẫu 10: Trẻ em 10 - 12 tháng</option>
                                    <option value="11" className="text-slate-800 bg-white">Mẫu 11: Trẻ em 13 - 18 tháng</option>
                                    <option value="12" className="text-slate-800 bg-white">Mẫu 12: Trẻ em 19 - 24 tháng</option>
                                    <option value="13" className="text-slate-800 bg-white">Mẫu 13: Trẻ em 2 - dưới 6 tuổi</option>
                                </optgroup>
                                <optgroup label="Đặc Thù Ngành" className="text-slate-800 bg-white">
                                    <option value="4" className="text-slate-800 bg-white">Mẫu 4: Nhân viên đường sắt</option>
                                    <option value="5" className="text-slate-800 bg-white">Mẫu 5: Thuyền viên tàu biển</option>
                                </optgroup>
                            </select>
                        </div>
                    ) : (
                        <div className="text-right">
                            <span className="text-sm font-sans font-bold bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/10 uppercase">
                                MẪU BIỂU SỐ {formType}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 overflow-x-auto whitespace-nowrap scrollbar-none flex-nowrap">
                <button type="button" onClick={() => setActiveTab('admin')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${activeTab === 'admin' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    I. Hành chính &amp; Đặc thù
                </button>
                <button type="button" onClick={() => setActiveTab('history')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${activeTab === 'history' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    II. Tiền sử &amp; Vaccine
                </button>
                <button type="button" onClick={() => setActiveTab('exam')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${activeTab === 'exam' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    III. Thể lực &amp; Lâm sàng
                </button>
                <button type="button" onClick={() => setActiveTab('lab')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${activeTab === 'lab' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    IV. Cận lâm sàng &amp; Kết luận
                </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-360px)] md:max-h-[calc(100vh-380px)] custom-scrollbar scroll-smooth">
                
                {/* TAB 1: ADMINISTRATIVE */}
                {activeTab === 'admin' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* HIS Link Toolbar */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/40 dark:to-slate-800/20 p-4 rounded-xl border border-blue-100 dark:border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h5 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    Đồng bộ dữ liệu từ hệ thống HIS
                                </h5>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Tự động điền thông tin hành chính, thể lực và lâm sàng đã có trên HIS sang phiếu KSK.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 lg:w-1/2 justify-end">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                    <input 
                                        type="text" 
                                        placeholder="Nhập Mã BN (VD: P1001), số CCCD..." 
                                        value={hisSearchQuery}
                                        onChange={e => setHisSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleFetchHisData(); } }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleFetchHisData}
                                    disabled={isFetchingHis}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50 transition-all duration-150 active:scale-95"
                                >
                                    {isFetchingHis ? <RefreshIcon className="w-4 h-4 animate-spin"/> : <SearchIcon className="w-4 h-4"/>}
                                    Lấy dữ liệu HIS
                                </button>
                            </div>
                        </div>

                        {hisSyncMessage && (
                            <div className={`p-3.5 rounded-lg text-xs leading-relaxed flex items-start gap-2 border animate-fadeIn ${
                                hisSyncMessage.type === 'success' 
                                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-400' 
                                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-400'
                            }`}>
                                <span className="font-bold">{hisSyncMessage.type === 'success' ? '✓ Thành công:' : '⚠ Lỗi:'}</span>
                                <span>{hisSyncMessage.text}</span>
                            </div>
                        )}

                        <div>
                            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">I.1. Thông tin cơ bản bệnh nhân</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mã bệnh nhân</label>
                                    <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} required className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Họ và tên (Chữ in hoa)</label>
                                    <input type="text" value={patientName} onChange={e => setPatientName(e.target.value.toUpperCase())} required className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white ${errors.patientName ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`} placeholder="NGUYỄN VĂN A" />
                                    {errors.patientName && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.patientName}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Số định danh / CCCD / Hộ chiếu</label>
                                    <input type="text" value={cccd} onChange={e => setCccd(e.target.value)} required className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white ${errors.cccd ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`} placeholder="038090012345" />
                                    {errors.cccd && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.cccd}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Ngày sinh</label>
                                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} required className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white ${errors.dob ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`} />
                                    {errors.dob && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.dob}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Giới tính</label>
                                    <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Số hồ sơ liên thông (MA_LK)</label>
                                    <input type="text" value={docNo} onChange={e => setDocNo(e.target.value)} required className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">I.2. Thông tin cư trú &amp; bổ sung</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Địa chỉ thường trú</label>
                                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Số điện thoại liên hệ</label>
                                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Dân tộc (Mã số)</label>
                                    <input type="text" value={ethnic} onChange={e => setEthnic(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="01 (Kinh)" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nhóm máu</label>
                                    <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="AB">AB</option>
                                        <option value="O">O</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Đối tượng khám</label>
                                    <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                        <option value="11">Học sinh phổ thông</option>
                                        <option value="12">Sinh viên đại học/cao đẳng</option>
                                        <option value="13">Người lao động</option>
                                        <option value="14">Khác (Người lớn lái xe, thuyền viên...)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nguồn kinh phí khám</label>
                                    <select value={fundingSource} onChange={e => setFundingSource(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                        <option value="1">Ngân sách Trung ương</option>
                                        <option value="2">Ngân sách Địa phương</option>
                                        <option value="3">Quỹ Bảo hiểm y tế</option>
                                        <option value="4">Người sử dụng lao động</option>
                                        <option value="5">Xã hội hóa</option>
                                        <option value="9">Khác</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mã cơ sở y tế theo GLN (13 ký tự)</label>
                                    <input type="text" value={maGtinCskcb} onChange={e => setMaGtinCskcb(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Mã GLN 13 số" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mã Tỉnh cư trú</label>
                                    <input type="text" value={maTinhCuTru} onChange={e => setMaTinhCuTru(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Ví dụ: 01" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mã Xã cư trú</label>
                                    <input type="text" value={maXaCuTru} onChange={e => setMaXaCuTru(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Ví dụ: 00001" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Ngày cấp CCCD/Hộ chiếu</label>
                                    <input type="date" value={cccdDate} onChange={e => setCccdDate(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nơi cấp CCCD/Hộ chiếu</label>
                                    <input type="text" value={cccdPlace} onChange={e => setCccdPlace(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Cục Cảnh sát QLHC về TTXH..." />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Lý do khám sức khỏe</label>
                                    <input type="text" value={lyDoVv} onChange={e => setLyDoVv(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Ngày khám sức khỏe</label>
                                    <input type="date" value={ngayVao} onChange={e => setNgayVao(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                            </div>
                        </div>


                        {/* Form-specific Fields */}
                        {(isStudent || isChild || formType === '3' || formType === '4' || formType === '5') && (
                            <div>
                                <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4 flex items-center justify-between">
                                    <span>I.3. Thông tin đặc thù biểu mẫu ({formType})</span>
                                    <span className="text-[10px] normal-case font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200/40">// Dữ liệu đặc thù VNeID (HIS chưa hỗ trợ)</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     {isStudent && (
                                         <>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                     <span>Họ tên bố/mẹ/Người giám hộ</span>
                                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                                 </label>
                                                 <input type="text" value={guardianName} onChange={e => setGuardianName(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                             </div>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                     <span>CCCD người giám hộ</span>
                                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                                 </label>
                                                 <input type="text" value={guardianCccd} onChange={e => setGuardianCccd(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                             </div>
                                         </>
                                     )}
 
                                     {isChild && (
                                         <>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                     <span>Họ tên người đi cùng trẻ</span>
                                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                                 </label>
                                                 <input type="text" value={escortName} onChange={e => setEscortName(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                             </div>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                     <span>CCCD người đi cùng</span>
                                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                                 </label>
                                                 <input type="text" value={escortCccd} onChange={e => setEscortCccd(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                             </div>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                     <span>Quan hệ với trẻ</span>
                                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                                 </label>
                                                 <select value={escortRelation} onChange={e => setEscortRelation(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                                     <option value="1">Cha</option>
                                                     <option value="2">Mẹ</option>
                                                     <option value="3">Ông/Bà</option>
                                                     <option value="4">Anh/Chị</option>
                                                     <option value="9">Khác</option>
                                                 </select>
                                             </div>
                                         </>
                                     )}
 
                                     {formType === '3' && (
                                         <div>
                                             <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                 <span>Hạng GPLX đề nghị</span>
                                                 <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                             </label>
                                             <input type="text" value={licenseClass} onChange={e => setLicenseClass(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="B2, C, D..." />
                                         </div>
                                     )}
 
                                     {formType === '4' && (
                                         <>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                     <span>Chức danh công việc</span>
                                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                                 </label>
                                                 <input type="text" value={chucDanh} onChange={e => setChucDanh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Lái tàu, Điều độ..." />
                                             </div>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                     <span>Đơn vị công tác</span>
                                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                                 </label>
                                                 <input type="text" value={noiCongTac} onChange={e => setNoiCongTac(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                             </div>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                     <span>Đạt chuẩn đường sắt</span>
                                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                                 </label>
                                                 <select value={railwayFit} onChange={e => setRailwayFit(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                                     <option value="1">Đủ tiêu chuẩn nhân viên chạy tàu</option>
                                                     <option value="0">Không đủ tiêu chuẩn</option>
                                                 </select>
                                             </div>
                                         </>
                                     )}
 
                                     {formType === '5' && (
                                         <>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                     <span>Vị trí làm việc</span>
                                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                                 </label>
                                                 <input type="text" value={viTriLamViec} onChange={e => setViTriLamViec(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Thủy thủ..." />
                                             </div>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                     <span>Bộ phận làm việc</span>
                                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                                 </label>
                                                 <input type="text" value={boPhanLamViec} onChange={e => setBoPhanLamViec(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Boong, Máy..." />
                                             </div>
                                             <div>
                                                 <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                                     <span>Khả năng đi biển / Chịu sóng</span>
                                                     <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1 py-0.2 rounded border border-amber-200/30">* Thủ công</span>
                                                 </label>
                                                 <select value={offshoreExp} onChange={e => setOffshoreExp(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                                     <option value="1">Đạt (Sức chịu sóng tốt)</option>
                                                     <option value="2">Khả năng trung bình</option>
                                                     <option value="3">Kém / Say sóng nặng</option>
                                                 </select>
                                             </div>
                                         </>
                                     )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: HISTORY & VACCINE */}
                {activeTab === 'history' && (
                    <div className="space-y-6 animate-fadeIn">
                        {formType === '3' ? (
                            <div>
                                <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">II.1. Tiền sử sức khỏe lái xe (Đánh giá Có/Không)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                                    {[
                                        { label: "Bệnh thần kinh / chấn thương đầu", val: tsThanKinh, set: setTsThanKinh },
                                        { label: "Bệnh mắt / giảm thị lực", val: tsMat, set: setTsMat },
                                        { label: "Bệnh tai / giảm thính lực / thăng bằng", val: tsTai, set: setTsTai },
                                        { label: "Bệnh tim mạch / nhồi máu cơ tim", val: tsTimMach, set: setTsTimMach },
                                        { label: "Phẫu thuật tim mạch can thiệp", val: tsPhauThuatTim, set: setTsPhauThuatTim },
                                        { label: "Tăng huyết áp", val: tsHuyetAp, set: setTsHuyetAp },
                                        { label: "Bệnh phổi / hen / khó thở", val: tsPhoiHen, set: setTsPhoiHen },
                                        { label: "Bệnh thận / suy thận / lọc máu", val: tsThan, set: setTsThan },
                                        { label: "Đái tháo đường", val: tsTieuDuong, set: setTsTieuDuong },
                                        { label: "Bệnh tâm thần", val: tsTamThan, set: setTsTamThan },
                                        { label: "Mất ý thức / co giật", val: tsYThuc, set: setTsYThuc },
                                        { label: "Ngất / chóng mặt / rối loạn thăng bằng", val: tsChongMat, set: setTsChongMat },
                                        { label: "Bệnh đường tiêu hóa nặng", val: tsTieuHoa, set: setTsTieuHoa },
                                        { label: "Rối loạn giấc ngủ / ngưng thở khi ngủ", val: tsGiacNgu, set: setTsGiacNgu },
                                        { label: "Tai biến mạch máu não", val: tsTaiBien, set: setTsTaiBien },
                                        { label: "Tiền sử lạm dụng rượu/bia", val: tsSuDungRuou, set: setTsSuDungRuou },
                                        { label: "Tiền sử sử dụng ma túy", val: tsSuDungMaTuy, set: setTsSuDungMaTuy },
                                        { label: "Bệnh lý/Chấn thương cột sống", val: tsBenhCotSong, set: setTsBenhCotSong },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                                            <input type="checkbox" checked={item.val === 1} onChange={e => item.set(e.target.checked ? 1 : 0)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">II.1. Lịch sử Tiêm chủng / Vaccine</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: "BCG (Lao)", val: tiemChungBcg, set: setTiemChungBcg },
                                        { label: "Bạch hầu, ho gà, uốn ván (DPT)", val: tiemChungBhHgUv, set: setTiemChungBhHgUv },
                                        { label: "Sởi", val: tiemChungSoi, set: setTiemChungSoi },
                                        { label: "Bại liệt (OPV/IPV)", val: tiemChungBaiLiet, set: setTiemChungBaiLiet },
                                        { label: "Viêm não Nhật Bản B", val: tiemChungVnnbB, set: setTiemChungVnnbB },
                                        { label: "Viêm gan B", val: tiemChungVgb, set: setTiemChungVgb },
                                    ].map((v, i) => (
                                        <div key={i}>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">{v.label}</label>
                                            <select value={v.val} onChange={e => v.set(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                                <option value="1">Đã tiêm chủng đầy đủ</option>
                                                <option value="0">Chưa được tiêm chủng</option>
                                                <option value="99">Không nhớ rõ / Chưa có thông tin</option>
                                            </select>
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Các loại vắc xin khác</label>
                                        <select value={tiemChungCacLoaiKhac} onChange={e => setTiemChungCacLoaiKhac(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                            <option value="0">Không tiêm loại khác</option>
                                            <option value="1">Có tiêm loại khác</option>
                                        </select>
                                    </div>
                                    {tiemChungCacLoaiKhac === '1' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Tên vắc xin khác đã tiêm</label>
                                            <input type="text" value={tiemChungVacXinKhac} onChange={e => setTiemChungVacXinKhac(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: Thủy đậu, Phế cầu, HPV..." />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">II.2. Tiền sử bệnh bản thân &amp; Gia đình</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Gia đình có tiền sử bệnh bẩm sinh/truyền nhiễm</label>
                                    <select value={tsgdMacBenh} onChange={e => setTsgdMacBenh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                        <option value="0">Không có</option>
                                        <option value="1">Có mắc bệnh bẩm sinh/mãn tính</option>
                                    </select>
                                </div>
                                {tsgdMacBenh === '1' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Mã bệnh cụ thể (Mã ICD-10 của gia đình)</label>
                                        <input type="text" value={tsgdMaBenh} onChange={e => setTsgdMaBenh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: Q21.0, A15..." />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mã bệnh bản thân đã/đang điều trị (Mã ICD-10)</label>
                                    <input type="text" value={tsbtMaBenh} onChange={e => setTsbtMaBenh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: I10, E11..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Năm phát hiện bệnh</label>
                                    <input type="text" value={tsbtNamPhatHienBenh} onChange={e => setTsbtNamPhatHienBenh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: 2021" />
                                </div>
                            </div>
                            
                            {/* Tiền sử bệnh nghề nghiệp QĐ 1551 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mã bệnh nghề nghiệp (Mã ICD-10)</label>
                                    <input type="text" value={tsbtMaBenhNgheNghiep} onChange={e => setTsbtMaBenhNgheNghiep(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: J60, H83..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Năm phát hiện bệnh nghề nghiệp</label>
                                    <input type="text" value={tsbtNamPhatHienBenhNgheNghiep} onChange={e => setTsbtNamPhatHienBenhNgheNghiep(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: 2023" />
                                </div>
                            </div>
                        </div>

                        {/* Tiền sử Sản phụ khoa (Chỉ hiển thị với Nữ) */}
                        {gender === 'Nữ' && (
                            <div className="animate-fadeIn p-4 bg-pink-50/30 dark:bg-pink-950/10 border border-pink-100/40 dark:border-pink-900/20 rounded-xl space-y-4">
                                <h4 className="text-sm font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider border-b border-pink-100/50 dark:border-pink-900/30 pb-2 flex items-center justify-between">
                                    <span>II.3. Tiền sử Sản phụ khoa (Đối với nữ)</span>
                                    <span className="text-[10px] normal-case text-pink-500 dark:text-pink-400 font-bold">* Chỉ nhập với giới tính Nữ</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Bắt đầu thấy kinh (Tuổi)</label>
                                        <input type="number" value={coKinhNguyetNamBaoNhieuTuoi} onChange={e => setCoKinhNguyetNamBaoNhieuTuoi(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="13" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Tính chất kinh nguyệt</label>
                                        <select value={tinhChatKinhNguyet} onChange={e => setTinhChatKinhNguyet(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                            <option value="1">Đều</option>
                                            <option value="0">Không đều</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Chu kỳ kinh (ngày)</label>
                                        <input type="number" value={chuKyKinh} onChange={e => setChuKyKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="28" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Lượng kinh (ngày)</label>
                                        <input type="number" value={luongKinh} onChange={e => setLuongKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="3-5" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Đau bụng kinh</label>
                                        <select value={dauBungKinh} onChange={e => setDauBungKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                            <option value="0">Không</option>
                                            <option value="1">Có</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Đã lập gia đình</label>
                                        <select value={daLapGiaDinh} onChange={e => setDaLapGiaDinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                            <option value="0">Chưa</option>
                                            <option value="1">Có</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">PARA (Sản khoa)</label>
                                        <input type="text" value={para} onChange={e => setPara(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: 2002" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Có đang dùng BPTT không</label>
                                        <select value={dangApDungBpttKhong} onChange={e => setDangApDungBpttKhong(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                            <option value="0">Không</option>
                                            <option value="1">Có</option>
                                        </select>
                                    </div>
                                    {dangApDungBpttKhong === '1' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Biện pháp tránh thai</label>
                                            <select value={bienPhapTranhThai} onChange={e => setBienPhapTranhThai(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                                <option value="1">Bao cao su</option>
                                                <option value="2">Thuốc uống tránh thai</option>
                                                <option value="3">Đặt dụng cụ tử cung</option>
                                                <option value="4">Triệt sản</option>
                                                <option value="9">Biện pháp khác</option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Từng mổ sản phụ khoa chưa</label>
                                        <select value={daTungMoSanPhuKhoaChua} onChange={e => setDaTungMoSanPhuKhoaChua(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                            <option value="0">Chưa từng mổ</option>
                                            <option value="1">Có từng mổ</option>
                                        </select>
                                    </div>
                                    {daTungMoSanPhuKhoaChua === '1' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Số lần mổ</label>
                                                <input type="number" value={soLanMoSanPhuKhoa} onChange={e => setSoLanMoSanPhuKhoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Ghi rõ nguyên nhân/Vị trí mổ</label>
                                                <input type="text" value={ghiRoMoSanPhuKhoa} onChange={e => setGhiRoMoSanPhuKhoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Mổ đẻ lấy thai, u xơ tử cung..." />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: PHYSICAL & CLINICAL SPECIALTIES */}
                {activeTab === 'exam' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div>
                            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">III.1. Khám Thể lực</h4>
                            <div className={`grid grid-cols-1 ${formType === '2' ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-4`}>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Chiều cao (cm)</label>
                                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Cân nặng (kg)</label>
                                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nhịp tim (mạch/phút)</label>
                                    <input type="number" value={pulse} onChange={e => setPulse(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Huyết áp (mmHg)</label>
                                    <input type="text" value={bp} onChange={e => setBp(e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white ${errors.bp ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`} placeholder="120/80" />
                                    {errors.bp && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.bp}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Chỉ số BMI (Tự động)</label>
                                    <input type="text" value={bmi} disabled className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold" />
                                </div>
                                {formType === '2' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại thể lực</label>
                                        <select value={khamTheLucPl} onChange={e => setKhamTheLucPl(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-blue-600 dark:text-blue-400">
                                            <option value="1">Loại I</option>
                                            <option value="2">Loại II</option>
                                            <option value="3">Loại III</option>
                                            <option value="4">Loại IV</option>
                                            <option value="5">Loại V</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Extra physical fields for child or sailor */}
                            {isChild && (
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Vòng đầu (cm)</label>
                                        <input type="number" value={vongDau} onChange={e => setVongDau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Vòng ngực (cm)</label>
                                        <input type="number" value={vongNguc} onChange={e => setVongNguc(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Trẻ sinh non</label>
                                        <select value={sinhNon} onChange={e => setSinhNon(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                            <option value="0">Không sinh non</option>
                                            <option value="1">Có sinh non</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Tuần thai khi sinh</label>
                                        <input type="number" value={tuanThai} onChange={e => setTuanThai(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="39" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Cân nặng lúc sinh (kg)</label>
                                        <input type="number" step="0.1" value={birthWeight} onChange={e => setBirthWeight(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="3.2" />
                                    </div>
                                </div>
                            )}

                            {formType === '5' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Lực bóp tay thuận (kg)</label>
                                        <input type="number" value={lucBopTayThuan} onChange={e => setLucBopTayThuan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Lực bóp tay không thuận (kg)</label>
                                        <input type="number" value={lucBopTayKhongThuan} onChange={e => setLucBopTayKhongThuan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Lực kéo lưng (kg)</label>
                                        <input type="number" value={lucKeoLung} onChange={e => setLucKeoLung(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">
                                {isChild ? "III.2. Kết quả khám chuyên khoa Nhi" : "III.2. Kết quả khám Lâm sàng Chuyên khoa"}
                            </h4>
                            
                            {isChild ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Khám Tuần hoàn</label>
                                        <textarea value={nhiTuanHoan} onChange={e => setNhiTuanHoan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Khám Hô hấp</label>
                                        <textarea value={nhiHoHap} onChange={e => setNhiHoHap(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Khám Tiêu hóa</label>
                                        <textarea value={nhiTieuHoa} onChange={e => setNhiTieuHoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Khám Thần kinh / Tâm thần</label>
                                        <textarea value={nhiThanKinh} onChange={e => setNhiThanKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Đánh giá Phát triển tinh thần/vận động</label>
                                        <select value={milestoneCheck} onChange={e => setMilestoneCheck(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                            <option value="1">Đạt các mốc phát triển theo tháng tuổi</option>
                                            <option value="0">Cần theo dõi sát / Chậm phát triển</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Nội khoa */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                                        <h5 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                            <span>III.2.1. Nội khoa</span>
                                            {formType === '2' && <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}
                                        </h5>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả/Nhận xét khám Nội khoa chung (Tuần hoàn, Hô hấp, Tiêu hóa...)</label>
                                                <textarea value={internalExam} onChange={e => setInternalExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-blue-500" />
                                            </div>
                                            
                                            {formType === '2' && (
                                                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                                                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 block">Đánh giá phân loại sức khỏe các cơ quan nội khoa chi tiết:</span>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {[
                                                            { label: "Tuần hoàn (Tim mạch)", val: noiKhoaTuanHoanPl, set: setNoiKhoaTuanHoanPl },
                                                            { label: "Hô hấp (Phổi)", val: noiKhoaHoHapPl, set: setNoiKhoaHoHapPl },
                                                            { label: "Tiêu hóa", val: noiKhoaTieuHoaPl, set: setNoiKhoaTieuHoaPl },
                                                            { label: "Thận - Tiết niệu", val: noiKhoaThanTietnieuPl, set: setNoiKhoaThanTietnieuPl },
                                                            { label: "Nội tiết", val: noiKhoaNoiTietPl, set: setNoiKhoaNoiTietPl },
                                                            { label: "Cơ - Xương - Khớp", val: noiKhoaCoXuongKhopPl, set: setNoiKhoaCoXuongKhopPl },
                                                            { label: "Thần kinh", val: noiKhoaThanKinhPl, set: setNoiKhoaThanKinhPl },
                                                            { label: "Tâm thần", val: noiKhoaTamThanPl, set: setNoiKhoaTamThanPl },
                                                        ].map((item, idx) => (
                                                            <div key={idx}>
                                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">{item.label}</label>
                                                                <select value={item.val} onChange={e => item.set(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                                                    <option value="1">Loại I</option>
                                                                    <option value="2">Loại II</option>
                                                                    <option value="3">Loại III</option>
                                                                    <option value="4">Loại IV</option>
                                                                    <option value="5">Loại V</option>
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mắt & Thị lực */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                                        <h5 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                            <span>III.2.2. Chuyên khoa Mắt</span>
                                            {formType === '2' && <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}
                                        </h5>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả khám kết mạc, giác mạc, bệnh khác về mắt</label>
                                                    <textarea value={eyeExam} onChange={e => setEyeExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-blue-500" />
                                                </div>
                                                {formType === '2' && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại chuyên khoa Mắt</label>
                                                        <select value={khamMatPl} onChange={e => setKhamMatPl(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-blue-600 dark:text-blue-400">
                                                            <option value="1">Loại I</option>
                                                            <option value="2">Loại II</option>
                                                            <option value="3">Loại III</option>
                                                            <option value="4">Loại IV</option>
                                                            <option value="5">Loại V</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                                                <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 block">Đo thị lực &amp; Thị trường:</span>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 text-center">Không kính (Phải)</label>
                                                        <input type="text" value={khongKinhMatPhai} onChange={e => setKhongKinhMatPhai(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="10/10" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 text-center">Không kính (Trái)</label>
                                                        <input type="text" value={khongKinhMatTrai} onChange={e => setKhongKinhMatTrai(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="10/10" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 text-center">Không kính (Hai mắt)</label>
                                                        <input type="text" value={khongKinhHaiMat} onChange={e => setKhongKinhHaiMat(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="10/10" />
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 text-center">Có kính (Phải)</label>
                                                        <input type="text" value={coKinhMatPhai} onChange={e => setCoKinhMatPhai(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="Nếu cận..." />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 text-center">Có kính (Trái)</label>
                                                        <input type="text" value={coKinhMatTrai} onChange={e => setCoKinhMatTrai(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="Nếu cận..." />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 text-center">Có kính (Hai mắt)</label>
                                                        <input type="text" value={coKinhHaiMat} onChange={e => setCoKinhHaiMat(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="Nếu cận..." />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-700/50">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Sắc giác</label>
                                                        <select value={sacGiac} onChange={e => setSacGiac(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                                            <option value="0">Bình thường</option>
                                                            <option value="1">Rối loạn màu 1 phần</option>
                                                            <option value="2">Mù màu hoàn toàn</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">T.Trường ngang</label>
                                                        <input type="text" value={thiTruongNgangHaiMat} onChange={e => setThiTruongNgangHaiMat(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="Bình thường" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">T.Trường đứng</label>
                                                        <input type="text" value={thiTruongDungHaiMat} onChange={e => setThiTruongDungHaiMat(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="Bình thường" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tai Mũi Họng */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                                        <h5 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                            <span>III.2.3. Chuyên khoa Tai - Mũi - Họng</span>
                                            {formType === '2' && <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}
                                        </h5>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả/Nhận xét khám tai mũi họng &amp; màng nhĩ</label>
                                                    <textarea value={entExam} onChange={e => setEntExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-blue-500" />
                                                </div>
                                                {formType === '2' && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại Tai - Mũi - Họng</label>
                                                        <select value={khamTaiMuiHongPl} onChange={e => setKhamTaiMuiHongPl(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-blue-600 dark:text-blue-400">
                                                            <option value="1">Loại I</option>
                                                            <option value="2">Loại II</option>
                                                            <option value="3">Loại III</option>
                                                            <option value="4">Loại IV</option>
                                                            <option value="5">Loại V</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                                                <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 block">Thính lực đo khoảng cách (m):</span>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2 border-r border-slate-200 dark:border-slate-700/50 pr-2">
                                                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block text-center uppercase">Tai phải (AD)</span>
                                                        <div>
                                                            <label className="block text-[10px] text-slate-400">Nói thường (m)</label>
                                                            <input type="text" value={taiPhaiNoiThuong} onChange={e => setTaiPhaiNoiThuong(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="5" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] text-slate-400">Nói thầm (m)</label>
                                                            <input type="text" value={taiPhaiNoiTham} onChange={e => setTaiPhaiNoiTham(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="0.5" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 pl-2">
                                                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block text-center uppercase">Tai trái (AS)</span>
                                                        <div>
                                                            <label className="block text-[10px] text-slate-400">Nói thường (m)</label>
                                                            <input type="text" value={taiTraiNoiThuong} onChange={e => setTaiTraiNoiThuong(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="5" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] text-slate-400">Nói thầm (m)</label>
                                                            <input type="text" value={taiTraiNoiTham} onChange={e => setTaiTraiNoiTham(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="0.5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Răng Hàm Mặt */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                                        <h5 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                            <span>III.2.4. Chuyên khoa Răng - Hàm - Mặt</span>
                                            {formType === '2' && <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}
                                        </h5>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả tình trạng răng, niêm mạc miệng, khớp cắn</label>
                                                    <textarea value={dentalExam} onChange={e => setDentalExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-blue-500" />
                                                </div>
                                                {formType === '2' && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại Răng - Hàm - Mặt</label>
                                                        <select value={khamRangHamMatPl} onChange={e => setKhamRangHamMatPl(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-blue-600 dark:text-blue-400">
                                                            <option value="1">Loại I</option>
                                                            <option value="2">Loại II</option>
                                                            <option value="3">Loại III</option>
                                                            <option value="4">Loại IV</option>
                                                            <option value="5">Loại V</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 justify-center flex flex-col">
                                                <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 block">Đặc điểm xương hàm:</span>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Hàm trên</label>
                                                        <input type="text" value={hamTren} onChange={e => setHamTren(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold" placeholder="Bình thường" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Hàm dưới</label>
                                                        <input type="text" value={hamDuoi} onChange={e => setHamDuoi(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold" placeholder="Bình thường" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ngoại khoa & Da liễu */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                                        <h5 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                            <span>III.2.5. Ngoại khoa &amp; Da liễu</span>
                                            {formType === '2' && <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}
                                        </h5>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả/Nhận xét khám Ngoại khoa &amp; Da liễu (Sẹo mổ, u cục, tổn thương da...)</label>
                                                <textarea value={externalExam} onChange={e => setExternalExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-[110px] focus:ring-2 focus:ring-blue-500" />
                                            </div>
                                            
                                            {formType === '2' ? (
                                                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-center gap-3">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại khám Ngoại khoa</label>
                                                        <select value={khamNgoaiKhoaPl} onChange={e => setKhamNgoaiKhoaPl(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-blue-600 dark:text-blue-400">
                                                            <option value="1">Loại I</option>
                                                            <option value="2">Loại II</option>
                                                            <option value="3">Loại III</option>
                                                            <option value="4">Loại IV</option>
                                                            <option value="5">Loại V</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại khám Da liễu</label>
                                                        <select value={khamDaLieuPl} onChange={e => setKhamDaLieuPl(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-blue-600 dark:text-blue-400">
                                                            <option value="1">Loại I</option>
                                                            <option value="2">Loại II</option>
                                                            <option value="3">Loại III</option>
                                                            <option value="4">Loại IV</option>
                                                            <option value="5">Loại V</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                    <p className="text-xs text-slate-400 italic text-center">Không yêu cầu phân loại chuyên khoa ngoại khoa &amp; da liễu cho mẫu biểu này</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sản phụ khoa (chỉ hiển thị cho Nữ) */}
                                    {gender === 'Nữ' && (
                                        <div className="p-4 bg-pink-50/20 dark:bg-pink-950/10 border border-pink-200/40 dark:border-pink-900/20 rounded-xl space-y-4 shadow-sm">
                                            <h5 className="text-sm font-bold text-pink-700 dark:text-pink-400 flex items-center justify-between border-b border-pink-200/40 dark:border-pink-900/30 pb-2">
                                                <span>III.2.6. Khám Sản phụ khoa (Dành riêng cho Nữ)</span>
                                                {formType === '2' && <span className="text-[10px] text-pink-500 font-extrabold uppercase bg-pink-100/50 dark:bg-pink-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}
                                            </h5>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nhận xét khám Sản phụ khoa chi tiết</label>
                                                    <textarea value={gynExam} onChange={e => setGynExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-blue-500" />
                                                </div>
                                                {formType === '2' ? (
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại khám Sản phụ khoa</label>
                                                        <select value={khamSanPhuKhoaPl} onChange={e => setKhamSanPhuKhoaPl(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-pink-600 dark:text-pink-400">
                                                            <option value="1">Loại I</option>
                                                            <option value="2">Loại II</option>
                                                            <option value="3">Loại III</option>
                                                            <option value="4">Loại IV</option>
                                                            <option value="5">Loại V</option>
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                        <p className="text-xs text-slate-400 italic text-center">Không yêu cầu phân loại chuyên khoa sản phụ khoa cho mẫu biểu này</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 4: LABORATORY & CONCLUSION */}
                {activeTab === 'lab' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div>
                            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">IV.1. Kết quả Cận lâm sàng / Xét nghiệm cốt lõi</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Công thức máu: Hemoglobin (g/L)</label>
                                    <input type="text" value={hemoglobin} onChange={e => setHemoglobin(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Sinh hóa máu: Đường huyết (mmol/L)</label>
                                    <input type="text" value={glycemia} onChange={e => setGlycemia(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nước tiểu: Protein niệu</label>
                                    <input type="text" value={protein} onChange={e => setProtein(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                            </div>

                            {/* Cận lâm sàng bổ sung cho Lái xe (Mẫu 3) hoặc các cận lâm sàng khác */}
                            {(formType === '3' || formType === '5') ? (
                                <div className="mt-4 p-4 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/20 rounded-xl space-y-4">
                                    <h5 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-200/30 pb-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                        Xét nghiệm bắt buộc đối với Lái xe/Thuyền viên (Mẫu {formType})
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Xét nghiệm Ma túy (4 chất)</label>
                                            <select value={kqXnMaiTuy} onChange={e => setKqXnMaiTuy(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                                <option value="Âm tính">Âm tính</option>
                                                <option value="Dương tính">Dương tính (Có sử dụng chất kích thích)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Xét nghiệm Nồng độ cồn</label>
                                            <input type="text" value={kqXnNongDoCon} onChange={e => setKqXnNongDoCon(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold" placeholder="VD: 0.0 mg/L hoặc Âm tính" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Xét nghiệm cận lâm sàng khác</label>
                                            <input type="text" value={kqXnKhac} onChange={e => setKqXnKhac(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold" placeholder="X-quang, Siêu âm..." />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Xét nghiệm/Chẩn đoán hình ảnh bổ sung</label>
                                    <input type="text" value={kqXnKhac} onChange={e => setKqXnKhac(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: X-quang phổi thẳng bình thường..." />
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">IV.2. Kết luận sức khỏe chung</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại sức khỏe chung</label>
                                    <select value={fitnessClass} onChange={e => setFitnessClass(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-blue-600 dark:text-blue-400">
                                        <option value="1">Loại I : Rất khoẻ</option>
                                        <option value="2">Loại II : Khoẻ</option>
                                        <option value="3">Loại III : Trung bình</option>
                                        <option value="4">Loại IV : Yếu</option>
                                        <option value="5">Loại V : Rất yếu</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mã bệnh tật/Chẩn đoán (Mã ICD-10 hoặc chuỗi kết luận)</label>
                                    <input type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold" placeholder="Đủ điều kiện sức khỏe..." />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Các vấn đề sức khỏe cần lưu ý</label>
                                <textarea value={cacVanDeLuuY} onChange={e => setCacVanDeLuuY(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20" />
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all">
                    Hủy bỏ
                </button>
                <button type="submit" className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:shadow-indigo-500/30 transition-all duration-200">
                    Lưu hồ sơ KSK
                </button>
            </div>
        </form>
    );
};

export default DynamicForm;
