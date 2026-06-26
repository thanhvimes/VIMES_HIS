// ==================== DYNAMIC FORM GENERATOR ====================
// File: modules/health-check-sync/forms/DynamicForm.tsx

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { SearchIcon, RefreshIcon } from '../../../components/Icons';
import { healthCheckService } from '../../../services/healthCheckService';
import { DynamicFormContext } from './DynamicFormContext';
import { useCatalogs } from '../../../contexts/CatalogContext';
import { catalogService, CatalogItem } from '../../../services/catalogService';
import { useSession } from '../../../contexts/SessionContext';
import AdminTab from './tabs/AdminTab';
import HistoryTab from './tabs/HistoryTab';
import ExamContainer from './tabs/exam/ExamContainer';
import LabTab from './tabs/LabTab';
import ConclusionTab from './tabs/ConclusionTab';

interface DynamicFormProps {
    formType: string;
    initialData?: any;
    onSave: (formData: any) => void;
    onCancel: () => void;
    onChangeFormType?: (type: string) => void;
}

// Local Error Boundary Component to capture Tab rendering errors
class TabErrorBoundary extends React.Component<any, any> {
    state: { hasError: boolean; error: any };
    props: any;
    setState: any;
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("TabErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <h4 className="font-bold text-md mb-2">Đã xảy ra lỗi khi tải tab Khám lâm sàng:</h4>
                    <pre className="text-xs bg-red-100 p-4 rounded overflow-auto max-h-60 font-mono">
                        {this.state.error?.toString()}
                        {"\n\nStack:\n"}
                        {this.state.error?.stack}
                    </pre>
                    <button 
                        type="button" 
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs"
                    >
                        Thử lại
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const DynamicForm: React.FC<DynamicFormProps> = ({ formType, initialData, onSave, onCancel, onChangeFormType }) => {
    const { fontSettings } = useTheme();
    const { user } = useSession();
    const [activeTab, setActiveTab] = useState<'admin' | 'history' | 'exam' | 'lab' | 'conclusion'>('admin');
    
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
                if (data.doc_no) {
                    const currentYear = new Date().getFullYear();
                    setDocNo(`KSK-${currentYear}-${data.doc_no}`);
                }
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
                
                // Đổ dữ liệu khám mắt & tai mũi họng & RHM & chuyên khoa khác bổ sung QĐ 1551
                if (data.clinical_data?.clinical_exam?.xa_khong_kinh_mat_ph) setXaKhongKinhMatPhai(data.clinical_data.clinical_exam.xa_khong_kinh_mat_ph);
                if (data.clinical_data?.clinical_exam?.xa_khong_kinh_mat_tr) setXaKhongKinhMatTrai(data.clinical_data.clinical_exam.xa_khong_kinh_mat_tr);
                if (data.clinical_data?.clinical_exam?.xa_khong_kinh_hai_mat) setXaKhongKinhHaiMat(data.clinical_data.clinical_exam.xa_khong_kinh_hai_mat);
                if (data.clinical_data?.clinical_exam?.xa_co_kinh_mat_phai) setXaCoKinhMatPhai(data.clinical_data.clinical_exam.xa_co_kinh_mat_phai);
                if (data.clinical_data?.clinical_exam?.xa_co_kinh_mat_trai) setXaCoKinhMatTrai(data.clinical_data.clinical_exam.xa_co_kinh_mat_trai);
                if (data.clinical_data?.clinical_exam?.xa_co_kinh_hai_mat) setXaCoKinhHaiMat(data.clinical_data.clinical_exam.xa_co_kinh_hai_mat);
                
                if (data.clinical_data?.clinical_exam?.gan_khong_kinh_mat_ph) setGanKhongKinhMatPhai(data.clinical_data.clinical_exam.gan_khong_kinh_mat_ph);
                if (data.clinical_data?.clinical_exam?.gan_khong_kinh_mat_tr) setGanKhongKinhMatTrai(data.clinical_data.clinical_exam.gan_khong_kinh_mat_tr);
                if (data.clinical_data?.clinical_exam?.gan_khong_kinh_hai_mat) setGanKhongKinhHaiMat(data.clinical_data.clinical_exam.gan_khong_kinh_hai_mat);
                if (data.clinical_data?.clinical_exam?.gan_co_kinh_mat_phai) setGanCoKinhMatPhai(data.clinical_data.clinical_exam.gan_co_kinh_mat_phai);
                if (data.clinical_data?.clinical_exam?.gan_co_kinh_mat_trai) setGanCoKinhMatTrai(data.clinical_data.clinical_exam.gan_co_kinh_mat_trai);
                if (data.clinical_data?.clinical_exam?.gan_co_kinh_hai_mat) setGanCoKinhHaiMat(data.clinical_data.clinical_exam.gan_co_kinh_hai_mat);
                
                if (data.clinical_data?.clinical_exam?.kham_mat_thi_truong_phai) setKhamMatThiTruongPhai(data.clinical_data.clinical_exam.kham_mat_thi_truong_phai);
                if (data.clinical_data?.clinical_exam?.kham_mat_thi_truong_trai) setKhamMatThiTruongTrai(data.clinical_data.clinical_exam.kham_mat_thi_truong_trai);

                if (data.clinical_data?.clinical_exam?.tai_phai_500hz) setTaiPhai500hz(data.clinical_data.clinical_exam.tai_phai_500hz);
                if (data.clinical_data?.clinical_exam?.tai_trai_500hz) setTaiTrai500hz(data.clinical_data.clinical_exam.tai_trai_500hz);
                if (data.clinical_data?.clinical_exam?.tai_phai_2000hz) setTaiPhai2000hz(data.clinical_data.clinical_exam.tai_phai_2000hz);
                if (data.clinical_data?.clinical_exam?.tai_trai_2000hz) setTaiTrai2000hz(data.clinical_data.clinical_exam.tai_trai_2000hz);
                if (data.clinical_data?.clinical_exam?.tai_phai_3000hz) setTaiPhai3000hz(data.clinical_data.clinical_exam.tai_phai_3000hz);
                if (data.clinical_data?.clinical_exam?.tai_trai_3000hz) setTaiTrai3000hz(data.clinical_data.clinical_exam.tai_trai_3000hz);
                if (data.clinical_data?.clinical_exam?.tai_phai_4000hz) setTaiPhai4000hz(data.clinical_data.clinical_exam.tai_phai_4000hz);
                if (data.clinical_data?.clinical_exam?.tai_trai_4000hz) setTaiTrai4000hz(data.clinical_data.clinical_exam.tai_trai_4000hz);
                if (data.clinical_data?.clinical_exam?.tai_phai_6000hz) setTaiPhai6000hz(data.clinical_data.clinical_exam.tai_phai_6000hz);
                if (data.clinical_data?.clinical_exam?.tai_trai_6000hz) setTaiTrai6000hz(data.clinical_data.clinical_exam.tai_trai_6000hz);

                if (data.clinical_data?.clinical_exam?.than_kinh_tam_ly) setThanKinhTamLy(data.clinical_data.clinical_exam.than_kinh_tam_ly);
                if (data.clinical_data?.clinical_exam?.noi_khoa_tam_than) setNoiKhoaTamThan(data.clinical_data.clinical_exam.noi_khoa_tam_than);
                if (data.clinical_data?.clinical_exam?.noi_khoa_than_kinh) setNoiKhoaThanKinh(data.clinical_data.clinical_exam.noi_khoa_than_kinh);
                if (data.clinical_data?.clinical_exam?.kq_tam_than) setKqTamThan(data.clinical_data.clinical_exam.kq_tam_than);
                if (data.clinical_data?.clinical_exam?.kq_than_kinh) setKqThanKinh(data.clinical_data.clinical_exam.kq_than_kinh);
                if (data.clinical_data?.clinical_exam?.kq_tim_mach) setKqTimMach(data.clinical_data.clinical_exam.kq_tim_mach);
                if (data.clinical_data?.clinical_exam?.kq_ho_hap) setKqHoHap(data.clinical_data.clinical_exam.kq_ho_hap);
                if (data.clinical_data?.clinical_exam?.kq_noi_tiet) setKqNoiTiet(data.clinical_data.clinical_exam.kq_noi_tiet);
                if (data.clinical_data?.clinical_exam?.kq_ngoai_khoa) setKqNgoaiKhoa(data.clinical_data.clinical_exam.kq_ngoai_khoa);
                if (data.clinical_data?.clinical_exam?.kq_da_lieu) setKqDaLieu(data.clinical_data.clinical_exam.kq_da_lieu);
                if (data.clinical_data?.clinical_exam?.kq_tiet_nieu) setKqTietNieu(data.clinical_data.clinical_exam.kq_tiet_nieu);
                if (data.clinical_data?.clinical_exam?.kq_sinh_duc) setKqSinhDuc(data.clinical_data.clinical_exam.kq_sinh_duc);
                if (data.clinical_data?.clinical_exam?.kq_tai_mui_hong) setKqTaiMuiHong(data.clinical_data.clinical_exam.kq_tai_mui_hong);
                if (data.clinical_data?.clinical_exam?.kq_co_xuong_khop) setKqCoXuongKhop(data.clinical_data.clinical_exam.kq_co_xuong_khop);
                if (data.clinical_data?.clinical_exam?.kq_noi_tiet_chuyen_hoa) setKqNoiTietChuyenHoa(data.clinical_data.clinical_exam.kq_noi_tiet_chuyen_hoa);

                if (data.clinical_data?.clinical_exam?.tim_mach) setTimMach(data.clinical_data.clinical_exam.tim_mach);
                if (data.clinical_data?.clinical_exam?.ho_hap) setHoHap(data.clinical_data.clinical_exam.ho_hap);
                if (data.clinical_data?.clinical_exam?.tiet_nieu_sinh_duc) setTietNieuSinhDuc(data.clinical_data.clinical_exam.tiet_nieu_sinh_duc);
                if (data.clinical_data?.clinical_exam?.noi_khoa_tieu_hoa) setNoiKhoaTieuHoa(data.clinical_data.clinical_exam.noi_khoa_tieu_hoa);
                if (data.clinical_data?.clinical_exam?.gan_mat) setGanMat(data.clinical_data.clinical_exam.gan_mat);
                if (data.clinical_data?.clinical_exam?.mau_co_quan_tao_mau) setMauCoQuanTaoMau(data.clinical_data.clinical_exam.mau_co_quan_tao_mau);
                if (data.clinical_data?.clinical_exam?.da_to_chuc_duoi_da) setDaToChucDuoiDa(data.clinical_data.clinical_exam.da_to_chuc_duoi_da);
                if (data.clinical_data?.clinical_exam?.kq_co_xuong_khop_m5) setKqCoXuongKhopM5(data.clinical_data.clinical_exam.kq_co_xuong_khop_m5);
                if (data.clinical_data?.clinical_exam?.than_kinh_m5) setThanKinhM5(data.clinical_data.clinical_exam.than_kinh_m5);
                if (data.clinical_data?.clinical_exam?.ma_benh_ngoai_khoa) setMaBenhNgoaiKhoa(data.clinical_data.clinical_exam.ma_benh_ngoai_khoa);
                if (data.clinical_data?.clinical_exam?.kham_tai_mui_hong_m5) setKhamTaiMuiHongM5(data.clinical_data.clinical_exam.kham_tai_mui_hong_m5);
                if (data.clinical_data?.clinical_exam?.kham_mat_m5) setKhamMatM5(data.clinical_data.clinical_exam.kham_mat_m5);
                if (data.clinical_data?.clinical_exam?.benh_khac) setBenhKhac(data.clinical_data.clinical_exam.benh_khac);
                if (data.clinical_data?.clinical_exam?.kham_mat_thi_giac_mau) setKhamMatThiGiacMau(data.clinical_data.clinical_exam.kham_mat_thi_giac_mau);
                if (data.clinical_data?.clinical_exam?.noi_tiet_dinh_duong_chuyen_hoa) setNoiTietDinhDuongChuyenHoa(data.clinical_data.clinical_exam.noi_tiet_dinh_duong_chuyen_hoa);
                if (data.clinical_data?.clinical_exam?.roi_loan_hanh_vi_tam_than) setRoiLoanHanhViTamThan(data.clinical_data.clinical_exam.roi_loan_hanh_vi_tam_than);
                
                // Đổ dữ liệu cận lâm sàng
                if (data.lab_data?.blood_test?.hemoglobin) setHemoglobin(data.lab_data.blood_test.hemoglobin);
                if (data.lab_data?.blood_test?.glycemia) setGlycemia(data.lab_data.blood_test.glycemia);
                if (data.lab_data?.urine_test?.protein) setProtein(data.lab_data.urine_test.protein);
                if (data.lab_data?.kq_xn_ma_tuy) setKqXnMaiTuy(data.lab_data.kq_xn_ma_tuy);
                if (data.lab_data?.kq_xn_nong_do_con) setKqXnNongDoCon(data.lab_data.kq_xn_nong_do_con);
                if (data.lab_data?.kq_xn_khac) setKqXnKhac(data.lab_data.kq_xn_khac);

                if (data.lab_data?.blood_test?.chi_so_hc) setChiSoHc(data.lab_data.blood_test.chi_so_hc);
                if (data.lab_data?.blood_test?.chi_so_bach_cau) setChiSoBachCau(data.lab_data.blood_test.chi_so_bach_cau);
                if (data.lab_data?.blood_test?.chi_so_tieu_cau) setChiSoTieuCau(data.lab_data.blood_test.chi_so_tieu_cau);
                if (data.lab_data?.blood_test?.cong_thuc_bc) setCongThucBc(data.lab_data.blood_test.cong_thuc_bc);
                if (data.lab_data?.blood_test?.thoi_gian_howell) setThoiGianHowell(data.lab_data.blood_test.thoi_gian_howell);
                if (data.lab_data?.blood_test?.cholesterol) setCholesterol(data.lab_data.blood_test.cholesterol);
                if (data.lab_data?.blood_test?.triglycerid) setTriglycerid(data.lab_data.blood_test.triglycerid);
                if (data.lab_data?.blood_test?.hdl) setHdl(data.lab_data.blood_test.hdl);
                if (data.lab_data?.blood_test?.ldl) setLdl(data.lab_data.blood_test.ldl);
                if (data.lab_data?.blood_test?.rpr) setRpr(data.lab_data.blood_test.rpr);
                if (data.lab_data?.blood_test?.tpha) setTpha(data.lab_data.blood_test.tpha);
                if (data.lab_data?.blood_test?.hbsag) setHbsag(data.lab_data.blood_test.hbsag);
                if (data.lab_data?.blood_test?.hbeag) setHbeag(data.lab_data.blood_test.hbeag);
                if (data.lab_data?.blood_test?.hcvab) setHcvab(data.lab_data.blood_test.hcvab);
                if (data.lab_data?.blood_test?.havab) setHavab(data.lab_data.blood_test.havab);
                if (data.lab_data?.blood_test?.hiv) setHiv(data.lab_data.blood_test.hiv);
                
                if (data.lab_data?.xn_khac) setXnKhac(data.lab_data.xn_khac);
                if (data.lab_data?.nong_do_con_mau) setNongDoConMau(data.lab_data.nong_do_con_mau);
                if (data.lab_data?.nuoc_tieu_test_nhanh?.ma_tuy) setNuocTieuMaTuy(data.lab_data.nuoc_tieu_test_nhanh.ma_tuy);
                if (data.lab_data?.nuoc_tieu_test_nhanh?.amphetamine) setNuocTieuAmphetamine(data.lab_data.nuoc_tieu_test_nhanh.amphetamine);
                if (data.lab_data?.nuoc_tieu_test_nhanh?.duong) setNuocTieuDuong(data.lab_data.nuoc_tieu_test_nhanh.duong);
                if (data.lab_data?.nuoc_tieu_test_nhanh?.protein) setNuocTieuProtein(data.lab_data.nuoc_tieu_test_nhanh.protein);
                if (data.lab_data?.nuoc_tieu_test_nhanh?.khac) setNuocTieuKhac(data.lab_data.nuoc_tieu_test_nhanh.khac);
                
                if (data.lab_data?.imaging?.ket_qua) setKetQuaChanDoanHinhAnh(data.lab_data.imaging.ket_qua);
                if (data.lab_data?.ecg?.ket_qua) setKetQuaDienTim(data.lab_data.ecg.ket_qua);
                if (data.lab_data?.spiro?.ket_qua) setChucNangHoHap(data.lab_data.spiro.ket_qua);
                if (data.lab_data?.us?.ket_qua) setKetQuaSieuAmBung(data.lab_data.us.ket_qua);

                if (data.lab_data?.paraclinical_items) setParaclinicalItems(data.lab_data.paraclinical_items);
                
                // Đổ kết luận
                if (data.conclusion_data?.fitness_class) setFitnessClass(data.conclusion_data.fitness_class);
                if (data.conclusion_data?.diagnosis) setDiagnosis(data.conclusion_data.diagnosis);
                if (data.conclusion_data?.cac_van_de_luu_y) setCacVanDeLuuY(data.conclusion_data.cac_van_de_luu_y);
                if (data.conclusion_data?.du_tieu_chuan_dk_ptgt_duong_sat) setDuTieuChuanDkPtgtDuongSat(data.conclusion_data.du_tieu_chuan_dk_ptgt_duong_sat);
                if (data.conclusion_data?.kha_nang_chiu_song) setKhaNangChiuSong(data.conclusion_data.kha_nang_chiu_song);
                if (data.conclusion_data?.han_che) setHanChe(data.conclusion_data.han_che);
                if (data.conclusion_data?.yeu_cau_deo_kinh) setYeuCauDeoKinh(data.conclusion_data.yeu_cau_deo_kinh);
                if (data.conclusion_data?.ket_luan_loai_suc_khoe) setKetLuanLoaiSucKhoe(data.conclusion_data.ket_luan_loai_suc_khoe);

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

    // Catalogs and additional locations
    const { provinces, ethnicities, occupations, nations, getWards } = useCatalogs();
    const [wards, setWards] = useState<CatalogItem[]>([]);
    const [workplaces, setWorkplaces] = useState<CatalogItem[]>([]);

    // Specialized eye vision states (QĐ 1551 & Mẫu 4/5)
    const [xaKhongKinhMatPhai, setXaKhongKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.xa_khong_kinh_mat_phai || '10/10');
    const [xaKhongKinhMatTrai, setXaKhongKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.xa_khong_kinh_mat_trai || '10/10');
    const [xaKhongKinhHaiMat, setXaKhongKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.xa_khong_kinh_hai_mat || '10/10');
    const [xaCoKinhMatPhai, setXaCoKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.xa_co_kinh_mat_phai || '');
    const [xaCoKinhMatTrai, setXaCoKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.xa_co_kinh_mat_trai || '');
    const [xaCoKinhHaiMat, setXaCoKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.xa_co_kinh_hai_mat || '');
    
    const [ganKhongKinhMatPhai, setGanKhongKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.gan_khong_kinh_mat_phai || '10/10');
    const [ganKhongKinhMatTrai, setGanKhongKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.gan_khong_kinh_mat_trai || '10/10');
    const [ganKhongKinhHaiMat, setGanKhongKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.gan_khong_kinh_hai_mat || '10/10');
    const [ganCoKinhMatPhai, setGanCoKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.gan_co_kinh_mat_phai || '');
    const [ganCoKinhMatTrai, setGanCoKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.gan_co_kinh_mat_trai || '');
    const [ganCoKinhHaiMat, setGanCoKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.gan_co_kinh_hai_mat || '');
    
    const [khamMatThiTruongPhai, setKhamMatThiTruongPhai] = useState(initialData?.clinical_data?.clinical_exam?.kham_mat_thi_truong_phai || 'Bình thường');
    const [khamMatThiTruongTrai, setKhamMatThiTruongTrai] = useState(initialData?.clinical_data?.clinical_exam?.kham_mat_thi_truong_trai || 'Bình thường');

    // Specialized hearing/audiometry check states (QĐ 1551 & Mẫu 4/5)
    const [taiPhai500hz, setTaiPhai500hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_500hz || '20');
    const [taiTrai500hz, setTaiTrai500hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_500hz || '20');
    const [taiPhai2000hz, setTaiPhai2000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_2000hz || '20');
    const [taiTrai2000hz, setTaiTrai2000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_2000hz || '20');
    const [taiPhai3000hz, setTaiPhai3000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_3000hz || '20');
    const [taiTrai3000hz, setTaiTrai3000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_3000hz || '20');
    const [taiPhai4000hz, setTaiPhai4000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_4000hz || '20');
    const [taiTrai4000hz, setTaiTrai4000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_4000hz || '20');
    const [taiPhai6000hz, setTaiPhai6000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_6000hz || '20');
    const [taiTrai6000hz, setTaiTrai6000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_6000hz || '20');

    // Occupational & other extra states
    const [maCskcb, setMaCskcb] = useState(initialData?.clinical_data?.extra?.ma_cskcb || '');
    const [quocTich, setQuocTich] = useState(initialData?.clinical_data?.extra?.quoc_tich || 'VNM');
    const [conThuMay, setConThuMay] = useState(initialData?.clinical_data?.extra?.con_thu_may || '');
    const [tongSoCon, setTongSoCon] = useState(initialData?.clinical_data?.extra?.tong_so_con || '');
    const [maTinhCuTruNghMe, setMaTinhCuTruNghMe] = useState(initialData?.clinical_data?.extra?.matinh_cu_tru_nghme || '');
    const [maXaCuTruNghMe, setMaXaCuTruNghMe] = useState(initialData?.clinical_data?.extra?.maxa_cu_tru_nghme || '');
    const [chucDanhTrenTau, setChucDanhTrenTau] = useState(initialData?.clinical_data?.extra?.chuc_danh_tren_tau || '');
    const [tenChuTau, setTenChuTau] = useState(initialData?.clinical_data?.extra?.ten_chu_tau || '');
    const [diaChiChuTau, setDiaChiChuTau] = useState(initialData?.clinical_data?.extra?.dia_chi_chu_tau || '');
    const [khuVucHoatDongTau, setKhuVucHoatDongTau] = useState(initialData?.clinical_data?.extra?.khu_vuc_hoat_dong_tau || '');

    const [maNgheNghiep, setMaNgheNghiep] = useState(initialData?.clinical_data?.extra?.ma_nghe_nghiep || '');
    const [noiCongTacHienTai, setNoiCongTacHienTai] = useState(initialData?.clinical_data?.extra?.noi_cong_tac_hien_tai || '');
    const [ngayBatDauLamViecHienTai, setNgayBatDauLamViecHienTai] = useState(initialData?.clinical_data?.extra?.ngay_bat_dau_lam_viec_hien_tai || '');
    const [ngheCongViecTruocDay, setNgheCongViecTruocDay] = useState(initialData?.clinical_data?.extra?.nghe_cong_viec_truoc_day || '');
    const [thoiGianLamViecTruocDayNam, setThoiGianLamViecTruocDayNam] = useState(initialData?.clinical_data?.extra?.thoi_gian_lam_viec_truoc_day_nam || '');
    const [thoiGianLamViecTruocDayThang, setThoiGianLamViecTruocDayThang] = useState(initialData?.clinical_data?.extra?.thoi_gian_lam_viec_truoc_day_thang || '');
    const [tuNgayLamViecTruocDay, setTuNgayLamViecTruocDay] = useState(initialData?.clinical_data?.extra?.tu_ngay_lam_viec_truoc_day || '');
    const [denNgayLamViecTruocDay, setDenNgayLamViecTruocDay] = useState(initialData?.clinical_data?.extra?.den_ngay_lam_viec_truoc_day || '');

    const [milestones, setMilestones] = useState<Record<string, string>>(initialData?.clinical_data?.extra?.milestones || {});

    // Clinical examinations detail (QĐ 1551 / Mẫu 4/5)
    const [thanKinhTamLy, setThanKinhTamLy] = useState(initialData?.clinical_data?.clinical_exam?.than_kinh_tam_ly || 'Bình thường');
    const [noiKhoaTamThan, setNoiKhoaTamThan] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_tam_than || 'Bình thường');
    const [noiKhoaThanKinh, setNoiKhoaThanKinh] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_than_kinh || 'Bình thường');
    const [tenThuoc, setTenThuoc] = useState(initialData?.clinical_data?.extra?.ten_thuoc || '');

    const [kqTamThan, setKqTamThan] = useState(initialData?.clinical_data?.clinical_exam?.kq_tam_than || 'Bình thường');
    const [kqThanKinh, setKqThanKinh] = useState(initialData?.clinical_data?.clinical_exam?.kq_than_kinh || 'Bình thường');
    const [kqTimMach, setKqTimMach] = useState(initialData?.clinical_data?.clinical_exam?.kq_tim_mach || 'Bình thường');
    const [kqHoHap, setKqHoHap] = useState(initialData?.clinical_data?.clinical_exam?.kq_ho_hap || 'Bình thường');
    const [kqNoiTiet, setKqNoiTiet] = useState(initialData?.clinical_data?.clinical_exam?.kq_noi_tiet || 'Bình thường');
    const [kqNgoaiKhoa, setKqNgoaiKhoa] = useState(initialData?.clinical_data?.clinical_exam?.kq_ngoai_khoa || 'Bình thường');
    const [kqDaLieu, setKqDaLieu] = useState(initialData?.clinical_data?.clinical_exam?.kq_da_lieu || 'Bình thường');
    const [kqTietNieu, setKqTietNieu] = useState(initialData?.clinical_data?.clinical_exam?.kq_tiet_nieu || 'Bình thường');
    const [kqSinhDuc, setKqSinhDuc] = useState(initialData?.clinical_data?.clinical_exam?.kq_sinh_duc || 'Bình thường');
    const [kqTaiMuiHong, setKqTaiMuiHong] = useState(initialData?.clinical_data?.clinical_exam?.kq_tai_mui_hong || 'Bình thường');
    const [kqCoXuongKhop, setKqCoXuongKhop] = useState(initialData?.clinical_data?.clinical_exam?.kq_co_xuong_khop || 'Bình thường');
    const [kqNoiTietChuyenHoa, setKqNoiTietChuyenHoa] = useState(initialData?.clinical_data?.clinical_exam?.kq_noi_tiet_chuyen_hoa || 'Bình thường');
    const [duTieuChuanDkPtgtDuongSat, setDuTieuChuanDkPtgtDuongSat] = useState(initialData?.conclusion_data?.du_tieu_chuan_dk_ptgt_duong_sat || '1');

    const [lucKeoThan, setLucKeoThan] = useState(initialData?.clinical_data?.extra?.luc_keo_than || '');
    const [haTamThu, setHaTamThu] = useState(initialData?.clinical_data?.examination?.ha_tam_thu || '');
    const [haTamTruong, setHaTamTruong] = useState(initialData?.clinical_data?.examination?.ha_tam_truong || '');
    const [nhipTim, setNhipTim] = useState(initialData?.clinical_data?.examination?.nhip_tim || '');
    const [timMach, setTimMach] = useState(initialData?.clinical_data?.clinical_exam?.tim_mach || 'Bình thường');
    const [hoHap, setHoHap] = useState(initialData?.clinical_data?.clinical_exam?.ho_hap || 'Bình thường');
    const [tietNieuSinhDuc, setTietNieuSinhDuc] = useState(initialData?.clinical_data?.clinical_exam?.tiet_nieu_sinh_duc || 'Bình thường');
    const [noiKhoaTieuHoa, setNoiKhoaTieuHoa] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_tieu_hoa || 'Bình thường');
    const [ganMat, setGanMat] = useState(initialData?.clinical_data?.clinical_exam?.gan_mat || 'Bình thường');
    const [mauCoQuanTaoMau, setMauCoQuanTaoMau] = useState(initialData?.clinical_data?.clinical_exam?.mau_co_quan_tao_mau || 'Bình thường');
    const [daToChucDuoiDa, setDaToChucDuoiDa] = useState(initialData?.clinical_data?.clinical_exam?.da_to_chuc_duoi_da || 'Bình thường');
    const [kqCoXuongKhopM5, setKqCoXuongKhopM5] = useState(initialData?.clinical_data?.clinical_exam?.kq_co_xuong_khop_m5 || 'Bình thường');
    const [thanKinhM5, setThanKinhM5] = useState(initialData?.clinical_data?.clinical_exam?.than_kinh_m5 || 'Bình thường');
    const [maBenhNgoaiKhoa, setMaBenhNgoaiKhoa] = useState(initialData?.clinical_data?.clinical_exam?.ma_benh_ngoai_khoa || '');
    const [khamTaiMuiHongM5, setKhamTaiMuiHongM5] = useState(initialData?.clinical_data?.clinical_exam?.kham_tai_mui_hong_m5 || 'Bình thường');
    const [khamMatM5, setKhamMatM5] = useState(initialData?.clinical_data?.clinical_exam?.kham_mat_m5 || 'Bình thường');
    const [benhKhac, setBenhKhac] = useState(initialData?.clinical_data?.clinical_exam?.benh_khac || '');
    const [khamMatThiGiacMau, setKhamMatThiGiacMau] = useState(initialData?.clinical_data?.clinical_exam?.kham_mat_thi_giac_mau || 'Bình thường');

    // Laboratory detail (Mẫu 5)
    const [chiSoHc, setChiSoHc] = useState(initialData?.lab_data?.blood_test?.chi_so_hc || '');
    const [chiSoBachCau, setChiSoBachCau] = useState(initialData?.lab_data?.blood_test?.chi_so_bach_cau || '');
    const [chiSoTieuCau, setChiSoTieuCau] = useState(initialData?.lab_data?.blood_test?.chi_so_tieu_cau || '');
    const [congThucBc, setCongThucBc] = useState(initialData?.lab_data?.blood_test?.cong_thuc_bc || '');
    const [thoiGianHowell, setThoiGianHowell] = useState(initialData?.lab_data?.blood_test?.thoi_gian_howell || '');
    const [cholesterol, setCholesterol] = useState(initialData?.lab_data?.blood_test?.cholesterol || '');
    const [triglycerid, setTriglycerid] = useState(initialData?.lab_data?.blood_test?.triglycerid || '');
    const [hdl, setHdl] = useState(initialData?.lab_data?.blood_test?.hdl || '');
    const [ldl, setLdl] = useState(initialData?.lab_data?.blood_test?.ldl || '');
    const [rpr, setRpr] = useState(initialData?.lab_data?.blood_test?.rpr || '0');
    const [tpha, setTpha] = useState(initialData?.lab_data?.blood_test?.tpha || '0');
    const [hbsag, setHbsag] = useState(initialData?.lab_data?.blood_test?.hbsag || '0');
    const [hbeag, setHbeag] = useState(initialData?.lab_data?.blood_test?.hbeag || '0');
    const [hcvab, setHcvab] = useState(initialData?.lab_data?.blood_test?.hcvab || '0');
    const [havab, setHavab] = useState(initialData?.lab_data?.blood_test?.havab || '0');
    const [hiv, setHiv] = useState(initialData?.lab_data?.blood_test?.hiv || '0');
    const [xnKhac, setXnKhac] = useState(initialData?.lab_data?.xn_khac || '');
    const [nongDoConMau, setNongDoConMau] = useState(initialData?.lab_data?.nong_do_con_mau || '');
    const [nuocTieuMaTuy, setNuocTieuMaTuy] = useState(initialData?.lab_data?.nuoc_tieu_test_nhanh?.ma_tuy || '0');
    const [nuocTieuAmphetamine, setNuocTieuAmphetamine] = useState(initialData?.lab_data?.nuoc_tieu_test_nhanh?.amphetamine || '0');
    const [nuocTieuDuong, setNuocTieuDuong] = useState(initialData?.lab_data?.nuoc_tieu_test_nhanh?.duong || '');
    const [nuocTieuProtein, setNuocTieuProtein] = useState(initialData?.lab_data?.nuoc_tieu_test_nhanh?.protein || '');
    const [nuocTieuKhac, setNuocTieuKhac] = useState(initialData?.lab_data?.nuoc_tieu_test_nhanh?.khac || '');

    // Diagnostics & Imaging
    const [ketQuaChanDoanHinhAnh, setKetQuaChanDoanHinhAnh] = useState(initialData?.lab_data?.imaging?.ket_qua || 'Bình thường');
    const [ketQuaDienTim, setKetQuaDienTim] = useState(initialData?.lab_data?.ecg?.ket_qua || 'Nhịp xoang đều');
    const [chucNangHoHap, setChucNangHoHap] = useState(initialData?.lab_data?.spiro?.ket_qua || 'Bình thường');
    const [ketQuaSieuAmBung, setKetQuaSieuAmBung] = useState(initialData?.lab_data?.us?.ket_qua || 'Bình thường');

    // Conclusion extra
    const [khaNangChiuSong, setKhaNangChiuSong] = useState(initialData?.conclusion_data?.kha_nang_chiu_song || '1');
    const [hanChe, setHanChe] = useState(initialData?.conclusion_data?.han_che || '0');
    const [yeuCauDeoKinh, setYeuCauDeoKinh] = useState(initialData?.conclusion_data?.yeu_cau_deo_kinh || '0');
    const [vongNgucTrungBinh, setVongNgucTrungBinh] = useState(initialData?.clinical_data?.examination?.vong_nguc_tb || '');
    const [noiTietDinhDuongChuyenHoa, setNoiTietDinhDuongChuyenHoa] = useState(initialData?.clinical_data?.clinical_exam?.noi_tiet_dinh_duong_chuyen_hoa || 'Bình thường');
    const [roiLoanHanhViTamThan, setRoiLoanHanhViTamThan] = useState(initialData?.clinical_data?.clinical_exam?.roi_loan_hanh_vi_tam_than || 'Bình thường');
    const [ketLuanLoaiSucKhoe, setKetLuanLoaiSucKhoe] = useState(initialData?.conclusion_data?.ket_luan_loai_suc_khoe || '1');
    const [conclusionDoctorId, setConclusionDoctorId] = useState(initialData?.conclusion_data?.doctor_id || '');

    // Dynamic services state (paraclinical grid)
    const [paraclinicalItems, setParaclinicalItems] = useState<any[]>(initialData?.lab_data?.paraclinical_items || []);
    const [labSubTab, setLabSubTab] = useState<'XN' | 'HA' | 'TD'>('XN');

    // Specialty Exam states
    const [specialtyMetadata, setSpecialtyMetadata] = useState<Record<string, { doctorId: string, status: string, updatedAt: string }>>(
        initialData?.clinical_data?.specialty_metadata || {}
    );
    const [doctors, setDoctors] = useState<CatalogItem[]>([]);

    useEffect(() => {
        catalogService.getWorkplaces().then(data => {
            setWorkplaces(data);
        }).catch(() => setWorkplaces([]));
    }, []);

    useEffect(() => {
        catalogService.getDoctors().then(data => {
            setDoctors(data);
        }).catch(() => setDoctors([]));
    }, []);

    useEffect(() => {
        if (!conclusionDoctorId && user?.userId) {
            setConclusionDoctorId(user.userId);
        }
    }, [user, conclusionDoctorId]);

    useEffect(() => {
        if (maTinhCuTru) {
            getWards(maTinhCuTru).then(data => {
                setWards(data.map((w: any) => ({ id: String(w.id || ''), code: String(w.code || w.id || ''), name: w.name })));
            }).catch(() => setWards([]));
        } else {
            setWards([]);
        }
    }, [maTinhCuTru, getWards]);

    const handleHemoglobinChange = (val: string) => {
        setHemoglobin(val);
        setParaclinicalItems(prev => prev.map(item => {
            const code = String(item.service_code || item.index_code || '').trim().toUpperCase();
            if (code === 'HB' || code === 'HEMOGLOBIN') {
                return { ...item, value: val };
            }
            return item;
        }));
    };

    const handleGlycemiaChange = (val: string) => {
        setGlycemia(val);
        setParaclinicalItems(prev => prev.map(item => {
            const code = String(item.service_code || item.index_code || '').trim().toUpperCase();
            if (code === 'GLU' || code === 'GLUCOSE') {
                return { ...item, value: val };
            }
            return item;
        }));
    };

    const handleProteinChange = (val: string) => {
        setProtein(val);
        setParaclinicalItems(prev => prev.map(item => {
            const code = String(item.service_code || item.index_code || '').trim().toUpperCase();
            if (code === 'PRO' || code === 'PROTEIN') {
                return { ...item, value: val };
            }
            return item;
        }));
    };

    const syncGridToCoreFields = (items: any[]) => {
        items.forEach(item => {
            const code = String(item.service_code || item.index_code || '').trim().toUpperCase();
            if (code === 'GLU' || code === 'GLUCOSE') {
                if (item.value) setGlycemia(item.value);
            } else if (code === 'HB' || code === 'HEMOGLOBIN') {
                if (item.value) setHemoglobin(item.value);
            } else if (code === 'PRO' || code === 'PROTEIN') {
                if (item.value) setProtein(item.value);
            }
        });
    };

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
                    vong_nguc_tb: vongNgucTrungBinh,
                },
                clinical_exam: {
                    specialty_metadata: specialtyMetadata,
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
                    
                    // Specialized fields for occupational certificates
                    xa_khong_kinh_mat_phai: xaKhongKinhMatPhai,
                    xa_khong_kinh_mat_trai: xaKhongKinhMatTrai,
                    xa_khong_kinh_hai_mat: xaKhongKinhHaiMat,
                    xa_co_kinh_mat_phai: xaCoKinhMatPhai,
                    xa_co_kinh_mat_trai: xaCoKinhMatTrai,
                    xa_co_kinh_hai_mat: xaCoKinhHaiMat,
                    
                    gan_khong_kinh_mat_phai: ganKhongKinhMatPhai,
                    gan_khong_kinh_mat_trai: ganKhongKinhMatTrai,
                    gan_khong_kinh_hai_mat: ganKhongKinhHaiMat,
                    gan_co_kinh_mat_phai: ganCoKinhMatPhai,
                    gan_co_kinh_mat_trai: ganCoKinhMatTrai,
                    gan_co_kinh_hai_mat: ganCoKinhHaiMat,
                    
                    kham_mat_thi_truong_phai: khamMatThiTruongPhai,
                    kham_mat_thi_truong_trai: khamMatThiTruongTrai,
                    
                    tai_phai_500hz: taiPhai500hz,
                    tai_trai_500hz: taiTrai500hz,
                    tai_phai_2000hz: taiPhai2000hz,
                    tai_trai_2000hz: taiTrai2000hz,
                    tai_phai_3000hz: taiPhai3000hz,
                    tai_trai_3000hz: taiTrai3000hz,
                    tai_phai_4000hz: taiPhai4000hz,
                    tai_trai_4000hz: taiTrai4000hz,
                    tai_phai_6000hz: taiPhai6000hz,
                    tai_trai_6000hz: taiTrai6000hz,
                    
                    than_kinh_tam_ly: thanKinhTamLy,
                    noi_khoa_tam_than: noiKhoaTamThan,
                    noi_khoa_than_kinh: noiKhoaThanKinh,
                    kq_tam_than: kqTamThan,
                    kq_than_kinh: kqThanKinh,
                    kq_tim_mach: kqTimMach,
                    kq_ho_hap: kqHoHap,
                    kq_noi_tiet: kqNoiTiet,
                    kq_ngoai_khoa: kqNgoaiKhoa,
                    kq_da_lieu: kqDaLieu,
                    kq_tiet_nieu: kqTietNieu,
                    kq_sinh_duc: kqSinhDuc,
                    kq_tai_mui_hong: kqTaiMuiHong,
                    kq_co_xuong_khop: kqCoXuongKhop,
                    kq_noi_tiet_chuyen_hoa: kqNoiTietChuyenHoa,
                    
                    tim_mach: timMach,
                    ho_hap: hoHap,
                    tiet_nieu_sinh_duc: tietNieuSinhDuc,
                    noi_khoa_tieu_hoa: noiKhoaTieuHoa,
                    gan_mat: ganMat,
                    mau_co_quan_tao_mau: mauCoQuanTaoMau,
                    da_to_chuc_duoi_da: daToChucDuoiDa,
                    kq_co_xuong_khop_m5: kqCoXuongKhopM5,
                    than_kinh_m5: thanKinhM5,
                    ma_benh_ngoai_khoa: maBenhNgoaiKhoa,
                    kham_tai_mui_hong_m5: khamTaiMuiHongM5,
                    kham_mat_m5: khamMatM5,
                    benh_khac: benhKhac,
                    kham_mat_thi_giac_mau: khamMatThiGiacMau,
                    noi_tiet_dinh_duong_chuyen_hoa: noiTietDinhDuongChuyenHoa,
                    roi_loan_hanh_vi_tam_than: roiLoanHanhViTamThan,
                    
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
                    tiemChungVacXinKhac,
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
                    milestone_check: milestoneCheck,
                    
                    ma_cskcb: maCskcb,
                    quoc_tich: quocTich,
                    con_thu_may: conThuMay,
                    tong_so_con: tongSoCon,
                    matinh_cu_tru_nghme: maTinhCuTruNghMe,
                    maxa_cu_tru_nghme: maXaCuTruNghMe,
                    chuc_danh_tren_tau: chucDanhTrenTau,
                    ten_chu_tau: tenChuTau,
                    dia_chi_chu_tau: diaChiChuTau,
                    khu_vuc_hoat_dong_tau: khuVucHoatDongTau,
                    ma_nghe_nghiep: maNgheNghiep,
                    noi_cong_tac_hien_tai: noiCongTacHienTai,
                    ngay_bat_dau_lam_viec_hien_tai: ngayBatDauLamViecHienTai,
                    nghe_cong_viec_truoc_day: ngheCongViecTruocDay,
                    thoi_gian_lam_viec_truoc_day_nam: thoiGianLamViecTruocDayNam,
                    thoi_gian_lam_viec_truoc_day_thang: thoiGianLamViecTruocDayThang,
                    tu_ngay_lam_viec_truoc_day: tuNgayLamViecTruocDay,
                    den_ngay_lam_viec_truoc_day: denNgayLamViecTruocDay,
                    milestones: milestones,
                    ten_thuoc: tenThuoc,
                    luc_keo_than: lucKeoThan
                }
            },
            labData: {
                blood_test: { 
                    hemoglobin, 
                    glycemia,
                    chi_so_hc: chiSoHc,
                    chi_so_bach_cau: chiSoBachCau,
                    chi_so_tieu_cau: chiSoTieuCau,
                    cong_thuc_bc: congThucBc,
                    thoi_gian_howell: thoiGianHowell,
                    cholesterol,
                    triglycerid,
                    hdl,
                    ldl,
                    rpr,
                    tpha,
                    hbsag,
                    hbeag,
                    hcvab,
                    havab,
                    hiv
                },
                urine_test: { protein },
                kq_xn_ma_tuy: kqXnMaiTuy,
                kq_xn_nong_do_con: kqXnNongDoCon,
                kq_xn_khac: kqXnKhac,
                paraclinical_items: paraclinicalItems,
                
                xn_khac: xnKhac,
                nong_do_con_mau: nongDoConMau,
                nuoc_tieu_test_nhanh: {
                    ma_tuy: nuocTieuMaTuy,
                    amphetamine: nuocTieuAmphetamine,
                    duong: nuocTieuDuong,
                    protein: nuocTieuProtein,
                    khac: nuocTieuKhac
                },
                imaging: { ket_qua: ketQuaChanDoanHinhAnh },
                ecg: { ket_qua: ketQuaDienTim },
                spiro: { ket_qua: chucNangHoHap },
                us: { ket_qua: ketQuaSieuAmBung }
            },
            conclusionData: {
                fitness_class: fitnessClass,
                diagnosis,
                cac_van_de_luu_y: cacVanDeLuuY,
                du_tieu_chuan_dk_ptgt_duong_sat: duTieuChuanDkPtgtDuongSat,
                kha_nang_chiu_song: khaNangChiuSong,
                han_che: hanChe,
                yeu_cau_deo_kinh: yeuCauDeoKinh,
                ket_luan_loai_suc_khoe: ketLuanLoaiSucKhoe,
                doctor_id: conclusionDoctorId
            }
        };
        
        onSave(fullPayload);
    };

    const isChild = parseInt(formType, 10) >= 6 && parseInt(formType, 10) <= 13;
    const isStudent = formType === '1' || (parseInt(formType, 10) >= 14 && parseInt(formType, 10) <= 17);

    return (
        <DynamicFormContext.Provider value={{
            formType,
            initialData,
            isChild,
            isStudent,
            activeTab,
            setActiveTab,
            hisSearchQuery,
            setHisSearchQuery,
            isFetchingHis,
            setIsFetchingHis,
            hisSyncMessage,
            setHisSyncMessage,
            handleFetchHisData,
            patientId,
            setPatientId,
            patientName,
            setPatientName,
            cccd,
            setCccd,
            dob,
            setDob,
            gender,
            setGender,
            docNo,
            setDocNo,
            address,
            setAddress,
            phone,
            setPhone,
            ethnic,
            setEthnic,
            cccdDate,
            setCccdDate,
            cccdPlace,
            setCccdPlace,
            bloodGroup,
            setBloodGroup,
            targetGroup,
            setTargetGroup,
            fundingSource,
            setFundingSource,
            maGtinCskcb,
            setMaGtinCskcb,
            maTinhCuTru,
            setMaTinhCuTru,
            maXaCuTru,
            setMaXaCuTru,
            lyDoVv,
            setLyDoVv,
            ngayVao,
            setNgayVao,
            maCskcb,
            setMaCskcb,
            quocTich,
            setQuocTich,
            conThuMay,
            setConThuMay,
            tongSoCon,
            setTongSoCon,
            maTinhCuTruNghMe,
            setMaTinhCuTruNghMe,
            maXaCuTruNghMe,
            setMaXaCuTruNghMe,
            chucDanhTrenTau,
            setChucDanhTrenTau,
            tenChuTau,
            setTenChuTau,
            diaChiChuTau,
            setDiaChiChuTau,
            khuVucHoatDongTau,
            setKhuVucHoatDongTau,
            provinces,
            ethnicities,
            occupations,
            nations,
            wards,
            setWards,
            workplaces,
            setWorkplaces,
            guardianName,
            setGuardianName,
            guardianCccd,
            setGuardianCccd,
            escortName,
            setEscortName,
            escortCccd,
            setEscortCccd,
            escortRelation,
            setEscortRelation,
            licenseClass,
            setLicenseClass,
            chucDanh,
            setChucDanh,
            noiCongTac,
            setNoiCongTac,
            viTriLamViec,
            setViTriLamViec,
            boPhanLamViec,
            setBoPhanLamViec,
            offshoreExp,
            setOffshoreExp,
            railwayFit,
            setRailwayFit,
            maNgheNghiep,
            setMaNgheNghiep,
            noiCongTacHienTai,
            setNoiCongTacHienTai,
            ngayBatDauLamViecHienTai,
            setNgayBatDauLamViecHienTai,
            ngheCongViecTruocDay,
            setNgheCongViecTruocDay,
            thoiGianLamViecTruocDayNam,
            setThoiGianLamViecTruocDayNam,
            thoiGianLamViecTruocDayThang,
            setThoiGianLamViecTruocDayThang,
            tuNgayLamViecTruocDay,
            setTuNgayLamViecTruocDay,
            denNgayLamViecTruocDay,
            setDenNgayLamViecTruocDay,
            milestones,
            setMilestones,
            tsgdMacBenh,
            setTsgdMacBenh,
            tsgdMaBenh,
            setTsgdMaBenh,
            tsbtMaBenh,
            setTsbtMaBenh,
            tsbtNamPhatHienBenh,
            setTsbtNamPhatHienBenh,
            tiemChungBcg,
            setTiemChungBcg,
            tiemChungBhHgUv,
            setTiemChungBhHgUv,
            tiemChungSoi,
            setTiemChungSoi,
            tiemChungBaiLiet,
            setTiemChungBaiLiet,
            tiemChungVnnbB,
            setTiemChungVnnbB,
            tiemChungVgb,
            setTiemChungVgb,
            tiemChungCacLoaiKhac,
            setTiemChungCacLoaiKhac,
            tiemChungVacXinKhac,
            setTiemChungVacXinKhac,
            coKinhNguyetNamBaoNhieuTuoi,
            setCoKinhNguyetNamBaoNhieuTuoi,
            tinhChatKinhNguyet,
            setTinhChatKinhNguyet,
            chuKyKinh,
            setChuKyKinh,
            luongKinh,
            setLuongKinh,
            dauBungKinh,
            setDauBungKinh,
            daLapGiaDinh,
            setDaLapGiaDinh,
            para,
            setPara,
            daTungMoSanPhuKhoaChua,
            setDaTungMoSanPhuKhoaChua,
            soLanMoSanPhuKhoa,
            setSoLanMoSanPhuKhoa,
            ghiRoMoSanPhuKhoa,
            setGhiRoMoSanPhuKhoa,
            dangApDungBpttKhong,
            setDangApDungBpttKhong,
            bienPhapTranhThai,
            setBienPhapTranhThai,
            ts5Nam,
            setTs5Nam,
            tsThanKinh,
            setTsThanKinh,
            tsMat,
            setTsMat,
            tsPhauThuatTim,
            setTsPhauThuatTim,
            tsTai,
            setTsTai,
            tsTimMach,
            setTsTimMach,
            tsHuyetAp,
            setTsHuyetAp,
            tsKhoTho,
            setTsKhoTho,
            tsPhoiHen,
            setTsPhoiHen,
            tsThan,
            setTsThan,
            tsTieuDuong,
            setTsTieuDuong,
            tsTamThan,
            setTsTamThan,
            tsYThuc,
            setTsYThuc,
            tsChongMat,
            setTsChongMat,
            tsTieuHoa,
            setTsTieuHoa,
            tsGiacNgu,
            setTsGiacNgu,
            tsTaiBien,
            setTsTaiBien,
            tsSuDungRuou,
            setTsSuDungRuou,
            tsSuDungMaTuy,
            setTsSuDungMaTuy,
            tsBenhCotSong,
            setTsBenhCotSong,
            tsbtMaBenhNgheNghiep,
            setTsbtMaBenhNgheNghiep,
            tsbtNamPhatHienBenhNgheNghiep,
            setTsbtNamPhatHienBenhNgheNghiep,
            height,
            setHeight,
            weight,
            setWeight,
            pulse,
            setPulse,
            bp,
            setBp,
            vongDau,
            setVongDau,
            vongNguc,
            setVongNguc,
            sinhNon,
            setSinhNon,
            tuanThai,
            setTuanThai,
            birthWeight,
            setBirthWeight,
            lucBopTayThuan,
            setLucBopTayThuan,
            lucBopTayKhongThuan,
            setLucBopTayKhongThuan,
            lucKeoLung,
            setLucKeoLung,
            bmi,
            internalExam,
            setInternalExam,
            eyeExam,
            setEyeExam,
            entExam,
            setEntExam,
            dentalExam,
            setDentalExam,
            externalExam,
            setExternalExam,
            dermatologyExam,
            setDermatologyExam,
            gynExam,
            setGynExam,
            khongKinhMatPhai,
            setKhongKinhMatPhai,
            khongKinhMatTrai,
            setKhongKinhMatTrai,
            coKinhMatPhai,
            setCoKinhMatPhai,
            coKinhMatTrai,
            setCoKinhMatTrai,
            khongKinhHaiMat,
            setKhongKinhHaiMat,
            coKinhHaiMat,
            setCoKinhHaiMat,
            sacGiac,
            setSacGiac,
            thiTruongNgangHaiMat,
            setThiTruongNgangHaiMat,
            thiTruongDungHaiMat,
            setThiTruongDungHaiMat,
            taiTraiNoiThuong,
            setTaiTraiNoiThuong,
            taiTraiNoiTham,
            setTaiTraiNoiTham,
            taiPhaiNoiThuong,
            setTaiPhaiNoiThuong,
            taiPhaiNoiTham,
            setTaiPhaiNoiTham,
            hamTren,
            setHamTren,
            hamDuoi,
            setHamDuoi,
            khamTheLucPl,
            setKhamTheLucPl,
            noiKhoaTuanHoanPl,
            setNoiKhoaTuanHoanPl,
            noiKhoaHoHapPl,
            setNoiKhoaHoHapPl,
            noiKhoaTieuHoaPl,
            setNoiKhoaTieuHoaPl,
            noiKhoaThanTietnieuPl,
            setNoiKhoaThanTietnieuPl,
            noiKhoaNoiTietPl,
            setNoiKhoaNoiTietPl,
            noiKhoaCoXuongKhopPl,
            setNoiKhoaCoXuongKhopPl,
            noiKhoaThanKinhPl,
            setNoiKhoaThanKinhPl,
            noiKhoaTamThanPl,
            setNoiKhoaTamThanPl,
            khamNgoaiKhoaPl,
            setKhamNgoaiKhoaPl,
            khamDaLieuPl,
            setKhamDaLieuPl,
            khamSanPhuKhoaPl,
            setKhamSanPhuKhoaPl,
            khamMatPl,
            setKhamMatPl,
            khamTaiMuiHongPl,
            setKhamTaiMuiHongPl,
            khamRangHamMatPl,
            setKhamRangHamMatPl,
            nhiTuanHoan,
            setNhiTuanHoan,
            nhiHoHap,
            setNhiHoHap,
            nhiTieuHoa,
            setNhiTieuHoa,
            nhiTietNieu,
            setNhiTietNieu,
            nhiThanKinh,
            setNhiThanKinh,
            nhiTamThan,
            setNhiTamThan,
            nhiKhac,
            setNhiKhac,
            milestoneCheck,
            setMilestoneCheck,
            hemoglobin,
            setHemoglobin,
            glycemia,
            setGlycemia,
            protein,
            setProtein,
            kqXnMaiTuy,
            setKqXnMaiTuy,
            kqXnNongDoCon,
            setKqXnNongDoCon,
            kqXnKhac,
            setKqXnKhac,
            paraclinicalItems,
            setParaclinicalItems,
            labSubTab,
            setLabSubTab,
            handleHemoglobinChange,
            handleGlycemiaChange,
            handleProteinChange,
            syncGridToCoreFields,
            noiKhoaTamThan,
            setNoiKhoaTamThan,
            noiKhoaThanKinh,
            setNoiKhoaThanKinh,
            tenThuoc,
            setTenThuoc,
            kqTamThan,
            setKqTamThan,
            kqThanKinh,
            setKqThanKinh,
            kqTimMach,
            setKqTimMach,
            kqHoHap,
            setKqHoHap,
            kqNoiTiet,
            setKqNoiTiet,
            kqNgoaiKhoa,
            setKqNgoaiKhoa,
            kqDaLieu,
            setKqDaLieu,
            kqTietNieu,
            setKqTietNieu,
            kqSinhDuc,
            setKqSinhDuc,
            kqTaiMuiHong,
            setKqTaiMuiHong,
            kqCoXuongKhop,
            setKqCoXuongKhop,
            kqNoiTietChuyenHoa,
            setKqNoiTietChuyenHoa,
            duTieuChuanDkPtgtDuongSat,
            setDuTieuChuanDkPtgtDuongSat,
            lucKeoThan,
            setLucKeoThan,
            haTamThu,
            setHaTamThu,
            haTamTruong,
            setHaTamTruong,
            nhipTim,
            setNhipTim,
            timMach,
            setTimMach,
            hoHap,
            setHoHap,
            tietNieuSinhDuc,
            setTietNieuSinhDuc,
            noiKhoaTieuHoa,
            setNoiKhoaTieuHoa,
            ganMat,
            setGanMat,
            mauCoQuanTaoMau,
            setMauCoQuanTaoMau,
            daToChucDuoiDa,
            setDaToChucDuoiDa,
            kqCoXuongKhopM5,
            setKqCoXuongKhopM5,
            thanKinhM5,
            setThanKinhM5,
            maBenhNgoaiKhoa,
            setMaBenhNgoaiKhoa,
            khamTaiMuiHongM5,
            setKhamTaiMuiHongM5,
            khamMatM5,
            setKhamMatM5,
            benhKhac,
            setBenhKhac,
            khamMatThiGiacMau,
            setKhamMatThiGiacMau,
            chiSoHc,
            setChiSoHc,
            chiSoBachCau,
            setChiSoBachCau,
            chiSoTieuCau,
            setChiSoTieuCau,
            congThucBc,
            setCongThucBc,
            thoiGianHowell,
            setThoiGianHowell,
            cholesterol,
            setCholesterol,
            triglycerid,
            setTriglycerid,
            hdl,
            setHdl,
            ldl,
            setLdl,
            rpr,
            setRpr,
            tpha,
            setTpha,
            hbsag,
            setHbsag,
            hbeag,
            setHbeag,
            hcvab,
            setHcvab,
            havab,
            setHavab,
            hiv,
            setHiv,
            xnKhac,
            setXnKhac,
            nongDoConMau,
            setNongDoConMau,
            nuocTieuMaTuy,
            setNuocTieuMaTuy,
            nuocTieuAmphetamine,
            setNuocTieuAmphetamine,
            nuocTieuDuong,
            setNuocTieuDuong,
            nuocTieuProtein,
            setNuocTieuProtein,
            nuocTieuKhac,
            setNuocTieuKhac,
            ketQuaChanDoanHinhAnh,
            setKetQuaChanDoanHinhAnh,
            ketQuaDienTim,
            setKetQuaDienTim,
            chucNangHoHap,
            setChucNangHoHap,
            ketQuaSieuAmBung,
            setKetQuaSieuAmBung,
            khaNangChiuSong,
            setKhaNangChiuSong,
            hanChe,
            setHanChe,
            yeuCauDeoKinh,
            setYeuCauDeoKinh,
            vongNgucTrungBinh,
            setVongNgucTrungBinh,
            noiTietDinhDuongChuyenHoa,
            setNoiTietDinhDuongChuyenHoa,
            roiLoanHanhViTamThan,
            setRoiLoanHanhViTamThan,
            xaKhongKinhMatPhai,
            setXaKhongKinhMatPhai,
            xaKhongKinhMatTrai,
            setXaKhongKinhMatTrai,
            xaKhongKinhHaiMat,
            setXaKhongKinhHaiMat,
            xaCoKinhMatPhai,
            setXaCoKinhMatPhai,
            xaCoKinhMatTrai,
            setXaCoKinhMatTrai,
            xaCoKinhHaiMat,
            setXaCoKinhHaiMat,
            ganKhongKinhMatPhai,
            setGanKhongKinhMatPhai,
            ganKhongKinhMatTrai,
            setGanKhongKinhMatTrai,
            ganKhongKinhHaiMat,
            setGanKhongKinhHaiMat,
            ganCoKinhMatPhai,
            setGanCoKinhMatPhai,
            ganCoKinhMatTrai,
            setGanCoKinhMatTrai,
            ganCoKinhHaiMat,
            setGanCoKinhHaiMat,
            khamMatThiTruongPhai,
            setKhamMatThiTruongPhai,
            khamMatThiTruongTrai,
            setKhamMatThiTruongTrai,
            taiPhai500hz,
            setTaiPhai500hz,
            taiTrai500hz,
            setTaiTrai500hz,
            taiPhai2000hz,
            setTaiPhai2000hz,
            taiTrai2000hz,
            setTaiTrai2000hz,
            taiPhai3000hz,
            setTaiPhai3000hz,
            taiTrai3000hz,
            setTaiTrai3000hz,
            taiPhai4000hz,
            setTaiPhai4000hz,
            taiTrai4000hz,
            setTaiTrai4000hz,
            taiPhai6000hz,
            setTaiPhai6000hz,
            taiTrai6000hz,
            setTaiTrai6000hz,
            thanKinhTamLy,
            setThanKinhTamLy,
            fitnessClass,
            setFitnessClass,
            diagnosis,
            setDiagnosis,
            cacVanDeLuuY,
            setCacVanDeLuuY,
            ketLuanLoaiSucKhoe,
            setKetLuanLoaiSucKhoe,
            conclusionDoctorId,
            setConclusionDoctorId,
            errors,
            setErrors,
            specialtyMetadata,
            setSpecialtyMetadata,
            doctors,
            setDoctors,
        }}>
        <form onSubmit={handleSubmit} autoComplete="off" spellCheck={false} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="bg-[#0f766e] p-6 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-shrink-0">
                    <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full text-teal-100">
                        Quy định 1551/QĐ-BYT
                    </span>
                    <h3 className="text-xl font-bold mt-1 text-white">
                        {initialData ? "Chỉnh sửa hồ sơ Khám sức khỏe" : "Tạo mới hồ sơ Khám sức khỏe"}
                    </h3>
                </div>

                {/* Patient Info Banner */}
                {patientName && (
                    <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2 flex flex-wrap gap-x-6 gap-y-1.5 items-center text-xs text-teal-100 shadow-inner max-w-3xl lg:mx-4 w-full lg:w-auto">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase text-teal-200 tracking-wider">Bệnh nhân:</span>
                            <span className="font-extrabold text-white uppercase text-sm">{patientName}</span>
                        </div>
                        {patientId && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold uppercase text-teal-200 tracking-wider">Mã HS:</span>
                                <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">{patientId}</span>
                            </div>
                        )}
                        {cccd && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold uppercase text-teal-200 tracking-wider">Số CCCD:</span>
                                <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">{cccd}</span>
                            </div>
                        )}
                        {dob && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold uppercase text-teal-200 tracking-wider">Năm sinh:</span>
                                <span className="font-bold text-white">{new Date(dob).getFullYear()}</span>
                            </div>
                        )}
                        {gender && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold uppercase text-teal-200 tracking-wider">Giới tính:</span>
                                <span className="font-bold text-white">{gender}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3 self-stretch lg:self-auto flex-shrink-0">
                    {!initialData && onChangeFormType ? (
                        <div className="flex flex-col items-start lg:items-end gap-1 w-full lg:w-auto">
                            <span className="text-[10px] uppercase tracking-wider text-teal-200 font-bold">Chọn mẫu biểu áp dụng:</span>
                            <select
                                value={formType}
                                onChange={e => onChangeFormType(e.target.value)}
                                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-white focus:outline-none cursor-pointer w-full lg:w-[280px]"
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
                <button type="button" onClick={() => setActiveTab('admin')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${activeTab === 'admin' ? 'border-[#0f766e] text-[#0f766e] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    I. Hành chính &amp; Đặc thù
                </button>
                <button type="button" onClick={() => setActiveTab('history')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${activeTab === 'history' ? 'border-[#0f766e] text-[#0f766e] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    II. Tiền sử &amp; Vaccine
                </button>
                <button type="button" onClick={() => setActiveTab('exam')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${activeTab === 'exam' ? 'border-[#0f766e] text-[#0f766e] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    III. Thể lực &amp; Lâm sàng
                </button>
                <button type="button" onClick={() => setActiveTab('lab')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${activeTab === 'lab' ? 'border-[#0f766e] text-[#0f766e] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    IV. Cận lâm sàng
                </button>
                <button type="button" onClick={() => setActiveTab('conclusion')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${activeTab === 'conclusion' ? 'border-[#0f766e] text-[#0f766e] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    V. Kết luận
                </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-360px)] md:max-h-[calc(100vh-380px)] custom-scrollbar scroll-smooth">
                
                {activeTab === 'admin' && <AdminTab />}
                {activeTab === 'history' && <HistoryTab />}
                {activeTab === 'exam' && (
                    <TabErrorBoundary>
                        <ExamContainer />
                    </TabErrorBoundary>
                )}
                {activeTab === 'lab' && <LabTab />}
                {activeTab === 'conclusion' && <ConclusionTab />}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all">
                    Hủy bỏ
                </button>
                <button type="submit" className="px-8 py-2.5 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all duration-200">
                    Lưu hồ sơ KSK
                </button>
            </div>
        </form>
        </DynamicFormContext.Provider>
    );
};

export default DynamicForm;
