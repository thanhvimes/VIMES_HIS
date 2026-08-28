import { useState, useEffect, useRef } from 'react';
import { useSession } from '../../../../../contexts/SessionContext';
import { useCatalogs } from '../../../../../contexts/CatalogContext';
import { catalogService, CatalogItem } from '../../../../../services/catalogService';
import { healthCheckService } from '../../../../../services/healthCheckService';
import { validateNewFormAge } from '../../../utils/healthCheckAge';
import { formatDateForInput, parseDateSafe } from '../../../../../utils/formatters';
import { toast } from 'sonner';

const DEFAULT_CHILD_CARE_NOTE = 'Theo dõi và hướng dẫn chăm sóc trẻ định kỳ theo độ tuổi.';

export const useChildFormState = ({
    initialData,
    onSave,
    onPreview,
    onChangeFormType
}: {
    initialData?: any;
    onSave: (formData: any, options?: any) => void | Promise<void>;
    onPreview?: (formData: any) => void;
    onChangeFormType?: (type: string) => void;
}) => {
    const { user } = useSession();
    const { provinces, ethnicities, occupations, nations, getWards } = useCatalogs();

    const [activeTab, setActiveTab] = useState<'admin' | 'history' | 'childDev' | 'exam' | 'lab' | 'conclusion'>('admin');
    
    // State for HIS Sync
    const [hisSearchQuery, setHisSearchQuery] = useState('');
    const [isFetchingHis, setIsFetchingHis] = useState(false);
    const [hisSyncMessage, setHisSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Wards catalog state
    const [wards, setWards] = useState<CatalogItem[]>([]);

    // Specialty exam metadata (specific to Mẫu 1)
    const [specialtyMetadata, setSpecialtyMetadata] = useState<Record<string, { doctorId: string, status: string, updatedAt: string }>>(() => {
        const savedMetadata = initialData?.clinical_data?.specialty_metadata || {};
        const metadata = { ...savedMetadata };
        const keys = [
            'child_general', 'child_head_neck', 'child_eye', 'child_ear', 
            'child_nose_throat', 'child_mouth_dental', 'child_respiratory', 
            'child_cardiovascular', 'child_abdomen_genital', 'child_musculoskeletal_neuro',
            'child_development'
        ];
        keys.forEach(k => {
            if (!metadata[k]) {
                metadata[k] = { doctorId: '', status: 'CHUA_KHAM', updatedAt: '' };
            }
        });
        return metadata;
    });

    const [workplaces, setWorkplaces] = useState<CatalogItem[]>([]);
    const [doctors, setDoctors] = useState<CatalogItem[]>([]);
    useEffect(() => {
        catalogService.getDoctors().then(setDoctors).catch(console.error);
        catalogService.getWorkplaces().then(setWorkplaces).catch(console.error);
        healthCheckService.getSettings().then(settings => {
            if (settings) {
                if (!initialData?.clinical_data?.ma_gtin_cskcb) {
                    setMaGtinCskcb(settings.ma_gtin_cskcb || settings.ma_cskcb || '');
                }
            }
        }).catch(err => console.error("Failed to load settings in ChildForm:", err));
    }, [initialData]);

    useEffect(() => {
        if (!initialData) return;
        setIsLocked(initialData.signature_status === 'Signed' || initialData.is_locked || false);
        const clin = typeof initialData.clinical_data === 'string'
            ? (() => { try { return JSON.parse(initialData.clinical_data); } catch { return {}; } })()
            : (initialData.clinical_data || {});
        if (clin?.specialty_metadata) {
            setSpecialtyMetadata(prev => ({
                ...prev,
                ...clin.specialty_metadata
            }));
        }
    }, [initialData?.signature_status, initialData?.updated_at]);

    // 1. Administrative & Lookup State
    const [patientId, setPatientId] = useState(initialData?.patient_id || `P${Math.floor(1000 + Math.random() * 9000)}`);
    const [patientName, setPatientName] = useState(initialData?.patient_name || initialData?.ho_ten || '');
    const [cccd, setCccd] = useState(initialData?.cccd || initialData?.so_cccd || '');
    const [dob, setDob] = useState(initialData?.dob ? formatDateForInput(initialData.dob) : (initialData?.ngay_sinh ? formatDateForInput(initialData.ngay_sinh) : ''));
    const [gender, setGender] = useState(initialData?.gender || (initialData?.gioi_tinh === '1' || initialData?.gioi_tinh === 1 ? 'Nam' : initialData?.gioi_tinh === '2' || initialData?.gioi_tinh === 2 || initialData?.gioi_tinh === '0' || initialData?.gioi_tinh === 0 ? 'Nữ' : ''));
    const [docNo, setDocNo] = useState(initialData?.doc_no || Date.now().toString());
    const [address, setAddress] = useState(initialData?.clinical_data?.address || initialData?.address || initialData?.clinical_data?.patient_address || '');
    const [phone, setPhone] = useState(initialData?.clinical_data?.phone || initialData?.phone || '');
    const [ethnic, setEthnic] = useState(initialData?.clinical_data?.ethnic || initialData?.ethnic || initialData?.clinical_data?.nation || '01');
    const [cccdDate, setCccdDate] = useState(initialData?.clinical_data?.cccd_date ? formatDateForInput(initialData.clinical_data.cccd_date) : '');
    const [cccdPlace, setCccdPlace] = useState(initialData?.clinical_data?.cccd_place || '');
    const [bloodGroup, setBloodGroup] = useState(initialData?.clinical_data?.blood_group || initialData?.blood_group || '');
    const [targetGroup, setTargetGroup] = useState(initialData?.clinical_data?.target_group || initialData?.target_group || initialData?.clinical_data?.doi_tuong || '10');
    const [fundingSource, setFundingSource] = useState(initialData?.clinical_data?.funding_source || initialData?.funding_source || initialData?.clinical_data?.nguon_chi_tra || initialData?.nguon_chi_tra || '9');
    const [maGtinCskcb, setMaGtinCskcb] = useState(initialData?.clinical_data?.ma_gtin_cskcb || '');
    const [maTinhCuTru, setMaTinhCuTru] = useState(initialData?.clinical_data?.matinh_cu_tru || '');
    const [maXaCuTru, setMaXaCuTru] = useState(initialData?.clinical_data?.maxa_cu_tru || '');
    const [lyDoVv, setLyDoVv] = useState(initialData?.clinical_data?.ly_do_vv || 'Khám sức khỏe định kỳ');
    const [loaiHinhKcb, setLoaiHinhKcb] = useState(initialData?.clinical_data?.loai_hinh_kcb || '01');

    // Child-specific admin extra fields
    const [guardianName, setGuardianName] = useState(
        initialData?.clinical_data?.extra?.nguoi_giam_ho ||
        initialData?.nguoi_giam_ho ||
        initialData?.guardian_name ||
        initialData?.clinical_data?.nguoi_giam_ho ||
        initialData?.clinical_data?.guardian_name ||
        ''
    );
    const [guardianCccd, setGuardianCccd] = useState(
        initialData?.clinical_data?.extra?.so_cccd_ngh ||
        initialData?.so_cccd_ngh ||
        initialData?.guardian_cccd ||
        initialData?.clinical_data?.so_cccd_ngh ||
        initialData?.clinical_data?.guardian_cccd ||
        ''
    );
    const [escortName, setEscortName] = useState(initialData?.clinical_data?.extra?.ho_ten_nguoi_di_cung || initialData?.ho_ten_nguoi_di_cung || '');
    const [escortCccd, setEscortCccd] = useState(initialData?.clinical_data?.extra?.so_cccd_nguoi_di_cung || initialData?.so_cccd_nguoi_di_cung || '');
    const [escortRelation, setEscortRelation] = useState(initialData?.clinical_data?.extra?.moi_quan_he_voi_tre || initialData?.moi_quan_he_voi_tre || 'Bố/Mẹ');
    const [conThuMay, setConThuMay] = useState(initialData?.clinical_data?.extra?.con_thu_may || '1');
    const [tongSoCon, setTongSoCon] = useState(initialData?.clinical_data?.extra?.tong_so_con || '1');
    const [maTinhCuTruNghMe, setMaTinhCuTruNghMe] = useState(initialData?.clinical_data?.extra?.matinh_cu_tru_nghme || '');
    const [maXaCuTruNghMe, setMaXaCuTruNghMe] = useState(initialData?.clinical_data?.extra?.maxa_cu_tru_nghme || '');

    // 2. Vitals & Medical History
    const [height, setHeight] = useState(initialData?.clinical_data?.examination?.height || '');
    const [weight, setWeight] = useState(initialData?.clinical_data?.examination?.weight || '');
    const [pulse, setPulse] = useState(initialData?.clinical_data?.examination?.pulse || '');
    const [bp, setBp] = useState(initialData?.clinical_data?.examination?.blood_pressure || '');
    const [nhietDo, setNhietDo] = useState(initialData?.clinical_data?.nhiet_do || '');
    const [nhipTho, setNhipTho] = useState(initialData?.clinical_data?.nhip_tho || '');
    const [gioKham, setGioKham] = useState(initialData?.clinical_data?.extra?.gio_kham || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    const [dgDhstNhietDo, setDgDhstNhietDo] = useState(initialData?.clinical_data?.extra?.dg_dhst_nhiet_do || '1');
    const [dgDhstMach, setDgDhstMach] = useState(initialData?.clinical_data?.extra?.dg_dhst_mach || '1');
    const [dgDhstNhipTho, setDgDhstNhipTho] = useState(initialData?.clinical_data?.extra?.dg_dhst_nhip_tho || '1');
    const [vongDau, setVongDau] = useState(initialData?.clinical_data?.extra?.vong_ddau || '');
    const [vongNguc, setVongNguc] = useState(initialData?.clinical_data?.extra?.vong_nguc || '');
    
    // Birth details
    const [sinhNon, setSinhNon] = useState(initialData?.clinical_data?.extra?.sinh_non || '');
    const [tuanThai, setTuanThai] = useState(initialData?.clinical_data?.extra?.tuan_thai_khi_sinh || '');
    const [birthWeight, setBirthWeight] = useState(initialData?.clinical_data?.extra?.can_nang_luc_sinh || '');

    // Medical history texts
    const [tsbtMacBenh, setTsbtMacBenh] = useState<string>(initialData?.clinical_data?.extra?.tsbt_mac_benh !== undefined ? String(initialData.clinical_data.extra.tsbt_mac_benh) : (initialData?.clinical_data?.extra?.ts_ban_than || initialData?.clinical_data?.extra?.tsbt_ma_benh ? '1' : '0'));
    const [tsbtMaBenh, setTsbtMaBenh] = useState(initialData?.clinical_data?.extra?.tsbt_ma_benh || '');
    const [tsBanThan, setTsBanThan] = useState(initialData?.clinical_data?.extra?.ts_ban_than || '');
    
    const [tsgdMacBenh, setTsgdMacBenh] = useState<string>(initialData?.clinical_data?.extra?.tsgd_mac_benh !== undefined ? String(initialData.clinical_data.extra.tsgd_mac_benh) : (initialData?.clinical_data?.extra?.ts_gia_dinh || initialData?.clinical_data?.extra?.tsgd_ma_benh ? '1' : '0'));
    const [tsgdMaBenh, setTsgdMaBenh] = useState(initialData?.clinical_data?.extra?.tsgd_ma_benh || '');
    const [tsGiaDinh, setTsGiaDinh] = useState(initialData?.clinical_data?.extra?.ts_gia_dinh || '');
    
    const [tsbtNghienRuou, setTsbtNghienRuou] = useState(initialData?.clinical_data?.extra?.tsbt_nghien_ruou || '');
    const [tsbtMaBenhKhac, setTsbtMaBenhKhac] = useState(initialData?.clinical_data?.extra?.tsbt_ma_benh_khac || '');
    const [tsTiepXucLao, setTsTiepXucLao] = useState(initialData?.clinical_data?.extra?.ts_tiep_xuc_lao || '0');

    // 3. Child Development, Nutrition, Vaccines
    const [chieuDaiTuoiSd, setChieuDaiTuoiSd] = useState(initialData?.clinical_data?.extra?.chieu_dai_tuoi_sd || '1');
    const [canNangTuoiSd, setCanNangTuoiSd] = useState(initialData?.clinical_data?.extra?.can_nang_tuoi_sd || '1');
    const [dgVongDau, setDgVongDau] = useState(initialData?.clinical_data?.extra?.dg_vong_dau || '1');
    const [chuViVongCanhTay, setChuViVongCanhTay] = useState(initialData?.clinical_data?.extra?.chu_vi_vong_canh_tay || '');
    
    // Checkboxes (Pill switches)
    const [phuDinhDuong, setPhuDinhDuong] = useState(initialData?.clinical_data?.extra?.phu_dinh_duong || '0');
    const [thieuMau, setThieuMau] = useState(initialData?.clinical_data?.extra?.thieu_mau || '0');
    const [coiXuong, setCoiXuong] = useState(initialData?.clinical_data?.extra?.coi_xuong || '0');
    const [suyDinhDuong, setSuyDinhDuong] = useState(initialData?.clinical_data?.extra?.suy_dinh_duong || '0');
    const [thuaCanBeoPhi, setThuaCanBeoPhi] = useState(initialData?.clinical_data?.extra?.thua_can_beo_phi || '0');
    
    const [ptTinhThanBinhThuong, setPtTinhThanBinhThuong] = useState(initialData?.clinical_data?.extra?.pt_tinh_than_binh_thuong || '1');
    const [ptVanDongBinhThuong, setPtVanDongBinhThuong] = useState(initialData?.clinical_data?.extra?.pt_van_dong_binh_thuong || '1');
    const [nguyCoTuKy, setNguyCoTuKy] = useState(initialData?.clinical_data?.extra?.nguy_co_tu_ky || '0');
    
    const [tiemChungLao, setTiemChungLao] = useState(initialData?.clinical_data?.extra?.tiem_chung_lao || '1');
    const [tiemChungVgbMui1, setTiemChungVgbMui1] = useState(initialData?.clinical_data?.extra?.tiem_chung_vgb_mui1 || '1');
    const [tiemChungDayDu, setTiemChungDayDu] = useState(initialData?.clinical_data?.extra?.tiem_chung_day_du || '1');

    // 4. Child Clinical Exam fields
    const [lamSangQuanSat, setLamSangQuanSat] = useState(initialData?.clinical_data?.extra?.lam_sang_quan_sat || '');
    const [mauSacDa, setMauSacDa] = useState(initialData?.clinical_data?.extra?.mau_sac_da || '1');
    const [longBanTay, setLongBanTay] = useState(initialData?.clinical_data?.extra?.long_ban_tay || '1');
    const [thop, setThop] = useState(initialData?.clinical_data?.extra?.thop || '1');
    const [kichThuocDau, setKichThuocDau] = useState(initialData?.clinical_data?.extra?.kich_thuoc_dau || '1');
    const [vanDongCo, setVanDongCo] = useState(initialData?.clinical_data?.extra?.van_dong_co || '1');
    const [khoiBatThuongDauCo, setKhoiBatThuongDauCo] = useState(initialData?.clinical_data?.extra?.khoi_bat_thuong_dau_co || '0');
    const [viTri2Mat, setViTri2Mat] = useState(initialData?.clinical_data?.extra?.vi_tri_2_mat || '1');
    const [miMatKetMac, setMiMatKetMac] = useState(initialData?.clinical_data?.extra?.mi_mat_ket_mac || '1');
    const [lacMat, setLacMat] = useState(initialData?.clinical_data?.extra?.lac_mat || '0');
    const [dongTu, setDongTu] = useState(initialData?.clinical_data?.extra?.dong_tu || '1');
    const [taiMangNhi, setTaiMangNhi] = useState(initialData?.clinical_data?.extra?.tai_mang_nhi || '1');
    const [dapUngAmThanh, setDapUngAmThanh] = useState(initialData?.clinical_data?.extra?.dap_ung_am_thanh || '1');
    const [khoiSungSauTai, setKhoiSungSauTai] = useState(initialData?.clinical_data?.extra?.khoi_sung_sau_tai || '0');
    const [chayMuNuocTai, setChayMuNuocTai] = useState(initialData?.clinical_data?.extra?.chay_mu_nuoc_tai || '0');
    const [hinhDangMui, setHinhDangMui] = useState(initialData?.clinical_data?.extra?.hinh_dang_mui || '1');
    const [chayNuocMui, setChayNuocMui] = useState(initialData?.clinical_data?.extra?.chay_nuoc_mui || '0');
    const [nghetMui, setNghetMui] = useState(initialData?.clinical_data?.extra?.nghet_mui || '0');
    const [hong, setHong] = useState(initialData?.clinical_data?.extra?.hong || '1');
    const [hinhDangMieng, setHinhDangMieng] = useState(initialData?.clinical_data?.extra?.hinh_dang_mieng || '1');
    const [rangSuaSoSinh, setRangSuaSoSinh] = useState(initialData?.clinical_data?.extra?.rang_sua_so_sinh || '0');
    const [hinhDangLuoi, setHinhDangLuoi] = useState(initialData?.clinical_data?.extra?.hinh_dang_luoi || '1');
    const [dinhThangLuoi, setDinhThangLuoi] = useState(initialData?.clinical_data?.extra?.dinh_thang_luoi || '0');
    const [namMieng, setNamMieng] = useState(initialData?.clinical_data?.extra?.nam_mieng || '0');
    const [camNhoTutSau, setCamNhoTutSau] = useState(initialData?.clinical_data?.extra?.cam_nho_tut_sau || '0');
    const [vetSauMangBam, setVetSauMangBam] = useState(initialData?.clinical_data?.extra?.vet_sau_mang_bam || '0');
    const [nhipThoKhongDeu, setNhipThoKhongDeu] = useState(initialData?.clinical_data?.extra?.nhip_tho_khong_deu || '0');
    const [thoRutLomLongNguc, setThoRutLomLongNguc] = useState(initialData?.clinical_data?.extra?.tho_rut_lom_long_nguc || '0');
    const [tiengThoBatThuong, setTiengThoBatThuong] = useState(initialData?.clinical_data?.extra?.tieng_tho_bat_thuong || '0');
    const [dhSuyHoHap, setDhSuyHoHap] = useState(initialData?.clinical_data?.extra?.dh_suy_ho_hap || '0');
    const [nghePhoi, setNghePhoi] = useState(initialData?.clinical_data?.extra?.nghe_phoi || '1');
    const [viTriMomTim, setViTriMomTim] = useState(initialData?.clinical_data?.extra?.vi_tri_mom_tim || '1');
    const [machNgoaiVi, setMachNgoaiVi] = useState(initialData?.clinical_data?.extra?.mach_ngoai_vi || '1');
    const [ngheTim, setNgheTim] = useState(initialData?.clinical_data?.extra?.nghe_tim || '1');
    const [hinhDangBungRon, setHinhDangBungRon] = useState(initialData?.clinical_data?.extra?.hinh_dang_bung_ron || '1');
    const [ganLachTo, setGanLachTo] = useState(initialData?.clinical_data?.extra?.gan_lach_to || '0');
    const [khoiBatThuongBung, setKhoiBatThuongBung] = useState(initialData?.clinical_data?.extra?.khoi_bat_thuong_bung || '0');
    const [loHauMon, setLoHauMon] = useState(initialData?.clinical_data?.extra?.lo_hau_mon || '1');
    const [cqSinhDucNgoai, setCqSinhDucNgoai] = useState(initialData?.clinical_data?.extra?.cq_sinh_duc_ngoai || '1');
    const [vanDongKhongDoiXung, setVanDongKhongDoiXung] = useState(initialData?.clinical_data?.extra?.van_dong_khong_doi_xung || '0');
    const [phanXaBu, setPhanXaBu] = useState(initialData?.clinical_data?.extra?.phan_xa_bu || '1');
    const [phanXaNam, setPhanXaNam] = useState(initialData?.clinical_data?.extra?.phan_xa_nam || '1');
    const [phanXaMoro, setphanXaMoro] = useState(initialData?.clinical_data?.extra?.phan_xa_moro || '1');
    const [truongLucCo, setTruongLucCo] = useState(initialData?.clinical_data?.extra?.truong_luc_co || '1');
    const [khopHang, setKhopHang] = useState(initialData?.clinical_data?.extra?.khop_hang || '1');
    const [phanXaCo, setPhanXaCo] = useState(initialData?.clinical_data?.extra?.phan_xa_co || '1');
    const [kiemTraLungCotSong, setKiemTraLungCotSong] = useState(initialData?.clinical_data?.extra?.kiem_tra_lung_cot_song || '1');
    const [khamTuChiKhop, setKhamTuChiKhop] = useState(initialData?.clinical_data?.extra?.kham_tu_chi_khop || '1');
    const [quanSatDangDi, setQuanSatDangDi] = useState(initialData?.clinical_data?.extra?.quan_sat_dang_di || '1');

    // 5. Lab Data
    const [bloodTestEnabled, setBloodTestEnabled] = useState(!!initialData?.clinical_data?.lab?.hemoglobin);
    const [hemoglobin, setHemoglobin] = useState(initialData?.clinical_data?.lab?.hemoglobin || '');
    const [glycemia, setGlycemia] = useState(initialData?.clinical_data?.lab?.glycemia || '');
    const [chiSoHc, setChiSoHc] = useState(initialData?.clinical_data?.lab?.chi_so_hc || '');
    const [chiSoBachCau, setChiSoBachCau] = useState(initialData?.clinical_data?.lab?.chi_so_bach_cau || '');
    const [chiSoTieuCau, setChiSoTieuCau] = useState(initialData?.clinical_data?.lab?.chi_so_tieu_cau || '');
    const [ure, setUre] = useState(initialData?.clinical_data?.lab?.ure || '');
    const [creatinin, setCreatinin] = useState(initialData?.clinical_data?.lab?.creatinin || '');
    const [asatAst, setAsatAst] = useState(initialData?.clinical_data?.lab?.asat_ast || '');
    const [alatAlt, setAlatAlt] = useState(initialData?.clinical_data?.lab?.alat_alt || '');
    const [nuocTieuKhac, setNuocTieuKhac] = useState(initialData?.clinical_data?.lab?.nuoc_tieu_khac || '');

    const [urineTestEnabled, setUrineTestEnabled] = useState(!!initialData?.clinical_data?.lab?.duong_nuoc_tieu);
    const [duongNuocTieu, setDuongNuocTieu] = useState(initialData?.clinical_data?.lab?.duong_nuoc_tieu || '');
    const [proteinNuocTieu, setProteinNuocTieu] = useState(initialData?.clinical_data?.lab?.protein_nuoc_tieu || '');

    const [otherLabTestEnabled, setOtherLabTestEnabled] = useState(!!initialData?.clinical_data?.lab?.other_result);
    const [otherLabResult, setOtherLabResult] = useState(initialData?.clinical_data?.lab?.other_result || '');

    // 6. Conclusion. Khi đổi từ Mẫu 2/3 sang Mẫu 1, dữ liệu kết luận cũ
    // nằm ở conclusion_data thay vì clinical_data.conclusion.
    const initialConclusion = initialData?.clinical_data?.conclusion
        || initialData?.conclusion_data
        || initialData?.conclusionData
        || {};
    const [fitnessClass, setFitnessClass] = useState(initialConclusion.fitness_class || '1');
    const [diagnosis, setDiagnosis] = useState(initialConclusion.diagnosis || '');
    const [cacVanDeLuuY, setCacVanDeLuuY] = useState(initialConclusion.cac_van_de_luu_y || DEFAULT_CHILD_CARE_NOTE);

    // Auto-calculated BMI
    const [bmi, setBmi] = useState('16.0');
    useEffect(() => {
        if (height && weight) {
            const hM = Number(height) / 100;
            const wK = Number(weight);
            if (hM > 0) {
                setBmi((wK / Math.pow(hM, 2)).toFixed(1));
            }
        }
    }, [height, weight]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLocked, setIsLocked] = useState(initialData?.signature_status === 'Signed' || initialData?.is_locked || false);
    const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);

    useEffect(() => {
        if (maTinhCuTru) {
            getWards(maTinhCuTru).then(data => {
                setWards(data.map((w: any) => ({ id: String(w.id || ''), code: String(w.code || w.id || ''), name: w.name })));
            }).catch(console.error);
        } else {
            setWards([]);
        }
    }, [maTinhCuTru, getWards]);

    // Auto-fill mock helper
    const handleAutofillTab = () => {
        if (activeTab === 'admin') {
            setPatientName('LÊ HOÀNG NAM');
            setGender('Nam');
            setDob('2022-05-15');
            setAddress('123 Đường Láng, Hà Nội');
            setPhone('0912345678');
            setGuardianName('LÊ HOÀNG');
            setGuardianCccd('001090123456');
        } else if (activeTab === 'history') {
            setHeight('98');
            setWeight('14.5');
            setPulse('90');
            setBp('90/60');
            setNhipTho('24');
            setNhietDo('36.6');
            setVongDau('48');
            setVongNguc('50');
            setSinhNon('0');
            setTuanThai('40');
            setBirthWeight('3.2');
        } else if (activeTab === 'childDev') {
            setChuViVongCanhTay('145');
        }
    };

    // HIS Data sync
    const handleFetchHisData = async () => {
        if (!hisSearchQuery) {
            toast.error('Vui lòng nhập mã định danh hoặc số hồ sơ bệnh nhân');
            return;
        }
        setIsFetchingHis(true);
        setHisSyncMessage(null);
        try {
            const data = await healthCheckService.getHisPatient(hisSearchQuery);
            if (data) {
                if (data.patient_name || data.patientName) setPatientName((data.patient_name || data.patientName).toUpperCase());
                if (data.cccd) setCccd(data.cccd);
                if (data.dob) setDob(formatDateForInput(data.dob));
                if (data.gender) setGender(data.gender);
                if (data.clinical_data?.phone || data.phone) setPhone(data.clinical_data?.phone || data.phone);
                if (data.clinical_data?.address || data.address) setAddress(data.clinical_data?.address || data.address);
                if (data.clinical_data?.matinh_cu_tru) setMaTinhCuTru(String(data.clinical_data.matinh_cu_tru));
                if (data.clinical_data?.maxa_cu_tru) setMaXaCuTru(String(data.clinical_data.maxa_cu_tru));
                if (data.clinical_data?.examination?.height) setHeight(String(data.clinical_data.examination.height));
                if (data.clinical_data?.examination?.weight) setWeight(String(data.clinical_data.examination.weight));
                if (data.clinical_data?.examination?.pulse) setPulse(String(data.clinical_data.examination.pulse));
                if (data.clinical_data?.examination?.blood_pressure || data.clinical_data?.examination?.bp) {
                    setBp(String(data.clinical_data.examination.blood_pressure || data.clinical_data.examination.bp));
                }
                if (data.clinical_data?.examination?.temperature || data.clinical_data?.nhiet_do || data.clinical_data?.extra?.nhiet_do) {
                    setNhietDo(String(data.clinical_data.examination?.temperature || data.clinical_data?.nhiet_do || data.clinical_data?.extra?.nhiet_do));
                }
                if (data.clinical_data?.examination?.breathing_rate || data.clinical_data?.nhip_tho || data.clinical_data?.extra?.nhip_tho) {
                    setNhipTho(String(data.clinical_data.examination?.breathing_rate || data.clinical_data?.nhip_tho || data.clinical_data?.extra?.nhip_tho));
                }
                if (data.clinical_data?.extra?.gio_kham || data.clinical_data?.gio_kham) {
                    setGioKham(String(data.clinical_data.extra?.gio_kham || data.clinical_data?.gio_kham));
                }

                // Tự động chuyển mẫu biểu nếu độ tuổi không thuộc Mẫu 1
                let targetForm = data.form_type;
                if (!targetForm && data.dob) {
                    const bDate = parseDateSafe(data.dob);
                    if (bDate && !isNaN(bDate.getTime())) {
                        const today = new Date();
                        let age = today.getFullYear() - bDate.getFullYear();
                        if (today.getMonth() < bDate.getMonth() || (today.getMonth() === bDate.getMonth() && today.getDate() < bDate.getDate())) {
                            age--;
                        }
                        if (age < 6) targetForm = '1';
                        else if (age < 18) targetForm = '2';
                        else targetForm = '3';
                    }
                }
                if (targetForm && targetForm !== '1' && onChangeFormType) {
                    onChangeFormType(targetForm);
                }

                setHisSyncMessage({ type: 'success', text: 'Đồng bộ dữ liệu hành chính & sinh hiệu HIS thành công!' });
            } else {
                setHisSyncMessage({ type: 'error', text: 'Không tìm thấy thông tin bệnh nhân trên cổng HIS' });
            }
        } catch (err: any) {
            setHisSyncMessage({ type: 'error', text: err.message || 'Lỗi khi đồng bộ dữ liệu HIS' });
        } finally {
            setIsFetchingHis(false);
        }
    };

    // Synchronize states when initialData changes or refreshes
    useEffect(() => {
        if (!initialData) return;

        if (initialData.patient_id) setPatientId(initialData.patient_id);
        if (initialData.patient_name || initialData.ho_ten) setPatientName(initialData.patient_name || initialData.ho_ten);
        if (initialData.cccd || initialData.so_cccd) setCccd(initialData.cccd || initialData.so_cccd);
        if (initialData.dob || initialData.ngay_sinh) setDob(formatDateForInput(initialData.dob || initialData.ngay_sinh));
        if (initialData.gender || initialData.gioi_tinh) {
            setGender(initialData.gender || (initialData.gioi_tinh === '1' || initialData.gioi_tinh === 1 ? 'Nam' : 'Nữ'));
        }
        if (initialData.doc_no) setDocNo(initialData.doc_no);
        setIsLocked(initialData.signature_status === 'Signed' || initialData.is_locked || false);

        const clinical = typeof initialData.clinical_data === 'string'
            ? JSON.parse(initialData.clinical_data)
            : (initialData.clinical_data || initialData.clinicalData || {});
        const extra = clinical.extra || {};
        const exam = clinical.examination || {};
        const clinExam = clinical.clinical_exam || {};
        const rawLab = typeof initialData.lab_data === 'string'
            ? JSON.parse(initialData.lab_data)
            : (initialData.lab_data || initialData.labData || clinical.lab || {});
        const rawConcl = typeof initialData.conclusion_data === 'string'
            ? JSON.parse(initialData.conclusion_data)
            : (initialData.conclusion_data || initialData.conclusionData || clinical.conclusion || {});

        if (clinical.address || initialData.address) setAddress(clinical.address || initialData.address);
        if (clinical.phone || initialData.phone) setPhone(clinical.phone || initialData.phone);
        if (clinical.ethnic) setEthnic(clinical.ethnic);
        if (clinical.cccd_date) setCccdDate(formatDateForInput(clinical.cccd_date));
        if (clinical.cccd_place) setCccdPlace(clinical.cccd_place);
        if (clinical.blood_group) setBloodGroup(clinical.blood_group);
        if (clinical.target_group) setTargetGroup(clinical.target_group);
        if (clinical.funding_source) setFundingSource(clinical.funding_source);
        if (clinical.ma_gtin_cskcb) setMaGtinCskcb(clinical.ma_gtin_cskcb);
        if (clinical.matinh_cu_tru) setMaTinhCuTru(String(clinical.matinh_cu_tru));
        if (clinical.maxa_cu_tru) setMaXaCuTru(String(clinical.maxa_cu_tru));
        if (clinical.ly_do_vv) setLyDoVv(clinical.ly_do_vv);
        if (clinical.loai_hinh_kcb) setLoaiHinhKcb(clinical.loai_hinh_kcb);

        const loadedSpecMeta = clinical.specialty_metadata || clinExam.specialty_metadata || initialData.specialty_metadata;
        if (loadedSpecMeta) {
            setSpecialtyMetadata(prev => ({
                ...prev,
                ...loadedSpecMeta
            }));
        }

        // Child specific admin
        if (extra.nguoi_giam_ho) setGuardianName(extra.nguoi_giam_ho);
        if (extra.so_cccd_ngh) setGuardianCccd(extra.so_cccd_ngh);
        if (extra.ho_ten_nguoi_di_cung) setEscortName(extra.ho_ten_nguoi_di_cung);
        if (extra.so_cccd_nguoi_di_cung) setEscortCccd(extra.so_cccd_nguoi_di_cung);
        if (extra.moi_quan_he_voi_tre) setEscortRelation(extra.moi_quan_he_voi_tre);
        if (extra.con_thu_may) setConThuMay(String(extra.con_thu_may));
        if (extra.tong_so_con) setTongSoCon(String(extra.tong_so_con));
        if (extra.matinh_cu_tru_nghme) setMaTinhCuTruNghMe(String(extra.matinh_cu_tru_nghme));
        if (extra.maxa_cu_tru_nghme) setMaXaCuTruNghMe(String(extra.maxa_cu_tru_nghme));

        // Vitals
        if (exam.height) setHeight(String(exam.height));
        if (exam.weight) setWeight(String(exam.weight));
        if (exam.pulse) setPulse(String(exam.pulse));
        if (exam.blood_pressure || exam.bp) setBp(String(exam.blood_pressure || exam.bp));
        if (clinical.nhiet_do || exam.temperature || extra.nhiet_do) setNhietDo(String(clinical.nhiet_do || exam.temperature || extra.nhiet_do));
        if (clinical.nhip_tho || exam.breathing_rate || extra.nhip_tho) setNhipTho(String(clinical.nhip_tho || exam.breathing_rate || extra.nhip_tho));
        if (extra.gio_kham) setGioKham(extra.gio_kham);
        if (extra.dg_dhst_nhiet_do) setDgDhstNhietDo(extra.dg_dhst_nhiet_do);
        if (extra.dg_dhst_mach) setDgDhstMach(extra.dg_dhst_mach);
        if (extra.dg_dhst_nhip_tho) setDgDhstNhipTho(extra.dg_dhst_nhip_tho);
        if (extra.vong_ddau || extra.vong_dau) setVongDau(extra.vong_ddau || extra.vong_dau);
        if (extra.vong_nguc) setVongNguc(extra.vong_nguc);
        if (extra.sinh_non) setSinhNon(extra.sinh_non);
        if (extra.tuan_thai_khi_sinh || extra.tuan_thai) setTuanThai(extra.tuan_thai_khi_sinh || extra.tuan_thai);
        if (extra.can_nang_luc_sinh) setBirthWeight(extra.can_nang_luc_sinh);

        // History
        if (extra.tsbt_mac_benh !== undefined) {
            setTsbtMacBenh(String(extra.tsbt_mac_benh));
        } else if (extra.ts_ban_than || extra.tsbt_ma_benh) {
            setTsbtMacBenh('1');
        }
        if (extra.tsbt_ma_benh) setTsbtMaBenh(extra.tsbt_ma_benh);
        if (extra.ts_ban_than) setTsBanThan(extra.ts_ban_than);

        if (extra.tsgd_mac_benh !== undefined) {
            setTsgdMacBenh(String(extra.tsgd_mac_benh));
        } else if (extra.ts_gia_dinh || extra.tsgd_ma_benh) {
            setTsgdMacBenh('1');
        }
        if (extra.tsgd_ma_benh) setTsgdMaBenh(extra.tsgd_ma_benh);
        if (extra.ts_gia_dinh) setTsGiaDinh(extra.ts_gia_dinh);

        if (extra.tsbt_nghien_ruou !== undefined) setTsbtNghienRuou(extra.tsbt_nghien_ruou);
        if (extra.tsbt_ma_benh_khac) setTsbtMaBenhKhac(extra.tsbt_ma_benh_khac);
        if (extra.ts_tiep_xuc_lao !== undefined) setTsTiepXucLao(String(extra.ts_tiep_xuc_lao));

        // Nutrition & development
        if (extra.chieu_dai_tuoi_sd) setChieuDaiTuoiSd(extra.chieu_dai_tuoi_sd);
        if (extra.can_nang_tuoi_sd) setCanNangTuoiSd(extra.can_nang_tuoi_sd);
        if (extra.dg_vong_dau) setDgVongDau(extra.dg_vong_dau);
        if (extra.chu_vi_vong_canh_tay) setChuViVongCanhTay(extra.chu_vi_vong_canh_tay);
        if (extra.phu_dinh_duong !== undefined) setPhuDinhDuong(extra.phu_dinh_duong);
        if (extra.thieu_mau !== undefined) setThieuMau(extra.thieu_mau);
        if (extra.coi_xuong !== undefined) setCoiXuong(extra.coi_xuong);
        if (extra.suy_dinh_duong !== undefined) setSuyDinhDuong(extra.suy_dinh_duong);
        if (extra.thua_can_beo_phi !== undefined) setThuaCanBeoPhi(extra.thua_can_beo_phi);
        if (extra.pt_tinh_than_binh_thuong !== undefined) setPtTinhThanBinhThuong(extra.pt_tinh_than_binh_thuong);
        if (extra.pt_van_dong_binh_thuong !== undefined) setPtVanDongBinhThuong(extra.pt_van_dong_binh_thuong);
        if (extra.nguy_co_tu_ky !== undefined) setNguyCoTuKy(extra.nguy_co_tu_ky);
        if (extra.tiem_chung_lao !== undefined) setTiemChungLao(extra.tiem_chung_lao);
        if (extra.tiem_chung_vgb_mui1 !== undefined) setTiemChungVgbMui1(extra.tiem_chung_vgb_mui1);
        if (extra.tiem_chung_day_du !== undefined) setTiemChungDayDu(extra.tiem_chung_day_du);

        // Khám lâm sàng chuyên khoa chi tiết (Mẫu 1)
        if (clinExam.lam_sang_quan_sat || extra.lam_sang_quan_sat) setLamSangQuanSat(clinExam.lam_sang_quan_sat || extra.lam_sang_quan_sat || '');
        if (clinExam.mau_sac_da || extra.mau_sac_da) setMauSacDa(clinExam.mau_sac_da || extra.mau_sac_da || '1');
        if (clinExam.long_ban_tay || extra.long_ban_tay) setLongBanTay(clinExam.long_ban_tay || extra.long_ban_tay || '1');
        if (clinExam.thop || extra.thop) setThop(clinExam.thop || extra.thop || '1');
        if (clinExam.kich_thuoc_dau || extra.kich_thuoc_dau) setKichThuocDau(clinExam.kich_thuoc_dau || extra.kich_thuoc_dau || '1');
        if (clinExam.van_dong_co || extra.van_dong_co) setVanDongCo(clinExam.van_dong_co || extra.van_dong_co || '1');
        if (clinExam.khoi_bat_thuong_dau_co || extra.khoi_bat_thuong_dau_co) setKhoiBatThuongDauCo(clinExam.khoi_bat_thuong_dau_co || extra.khoi_bat_thuong_dau_co || '0');
        if (clinExam.vi_tri_2_mat || extra.vi_tri_2_mat) setViTri2Mat(clinExam.vi_tri_2_mat || extra.vi_tri_2_mat || '1');
        if (clinExam.mi_mat_ket_mac || extra.mi_mat_ket_mac) setMiMatKetMac(clinExam.mi_mat_ket_mac || extra.mi_mat_ket_mac || '1');
        if (clinExam.lac_mat || extra.lac_mat) setLacMat(clinExam.lac_mat || extra.lac_mat || '0');
        if (clinExam.dong_tu || extra.dong_tu) setDongTu(clinExam.dong_tu || extra.dong_tu || '1');
        if (clinExam.tai_mang_nhi || extra.tai_mang_nhi) setTaiMangNhi(clinExam.tai_mang_nhi || extra.tai_mang_nhi || '1');
        if (clinExam.dap_ung_am_thanh || extra.dap_ung_am_thanh) setDapUngAmThanh(clinExam.dap_ung_am_thanh || extra.dap_ung_am_thanh || '1');
        if (clinExam.khoi_sung_sau_tai || extra.khoi_sung_sau_tai) setKhoiSungSauTai(clinExam.khoi_sung_sau_tai || extra.khoi_sung_sau_tai || '0');
        if (clinExam.chay_mu_nuoc_tai || extra.chay_mu_nuoc_tai) setChayMuNuocTai(clinExam.chay_mu_nuoc_tai || extra.chay_mu_nuoc_tai || '0');
        if (clinExam.hinh_dang_mui || extra.hinh_dang_mui) setHinhDangMui(clinExam.hinh_dang_mui || extra.hinh_dang_mui || '1');
        if (clinExam.chay_nuoc_mui || extra.chay_nuoc_mui) setChayNuocMui(clinExam.chay_nuoc_mui || extra.chay_nuoc_mui || '0');
        if (clinExam.nghet_mui || extra.nghet_mui) setNghetMui(clinExam.nghet_mui || extra.nghet_mui || '0');
        if (clinExam.hong || extra.hong) setHong(clinExam.hong || extra.hong || '1');
        if (clinExam.hinh_dang_mieng || extra.hinh_dang_mieng) setHinhDangMieng(clinExam.hinh_dang_mieng || extra.hinh_dang_mieng || '1');
        if (clinExam.rang_sua_so_sinh || extra.rang_sua_so_sinh) setRangSuaSoSinh(clinExam.rang_sua_so_sinh || extra.rang_sua_so_sinh || '0');
        if (clinExam.hinh_dang_luoi || extra.hinh_dang_luoi) setHinhDangLuoi(clinExam.hinh_dang_luoi || extra.hinh_dang_luoi || '1');
        if (clinExam.dinh_thang_luoi || extra.dinh_thang_luoi) setDinhThangLuoi(clinExam.dinh_thang_luoi || extra.dinh_thang_luoi || '0');
        if (clinExam.nam_mieng || extra.nam_mieng) setNamMieng(clinExam.nam_mieng || extra.nam_mieng || '0');
        if (clinExam.cam_nho_tut_sau || extra.cam_nho_tut_sau) setCamNhoTutSau(clinExam.cam_nho_tut_sau || extra.cam_nho_tut_sau || '0');
        if (clinExam.vet_sau_mang_bam || extra.vet_sau_mang_bam) setVetSauMangBam(clinExam.vet_sau_mang_bam || extra.vet_sau_mang_bam || '0');
        if (clinExam.nhip_tho_khong_deu || extra.nhip_tho_khong_deu) setNhipThoKhongDeu(clinExam.nhip_tho_khong_deu || extra.nhip_tho_khong_deu || '0');
        if (clinExam.tho_rut_lom_long_nguc || extra.tho_rut_lom_long_nguc) setThoRutLomLongNguc(clinExam.tho_rut_lom_long_nguc || extra.tho_rut_lom_long_nguc || '0');
        if (clinExam.tieng_tho_bat_thuong || extra.tieng_tho_bat_thuong) setTiengThoBatThuong(clinExam.tieng_tho_bat_thuong || extra.tieng_tho_bat_thuong || '0');
        if (clinExam.dh_suy_ho_hap || extra.dh_suy_ho_hap) setDhSuyHoHap(clinExam.dh_suy_ho_hap || extra.dh_suy_ho_hap || '0');
        if (clinExam.nghe_phoi || extra.nghe_phoi) setNghePhoi(clinExam.nghe_phoi || extra.nghe_phoi || '1');
        if (clinExam.vi_tri_mom_tim || extra.vi_tri_mom_tim) setViTriMomTim(clinExam.vi_tri_mom_tim || extra.vi_tri_mom_tim || '1');
        if (clinExam.mach_ngoai_vi || extra.mach_ngoai_vi) setMachNgoaiVi(clinExam.mach_ngoai_vi || extra.mach_ngoai_vi || '1');
        if (clinExam.nghe_tim || extra.nghe_tim) setNgheTim(clinExam.nghe_tim || extra.nghe_tim || '1');
        if (clinExam.hinh_dang_bung_ron || extra.hinh_dang_bung_ron) setHinhDangBungRon(clinExam.hinh_dang_bung_ron || extra.hinh_dang_bung_ron || '1');
        if (clinExam.gan_lach_to || extra.gan_lach_to) setGanLachTo(clinExam.gan_lach_to || extra.gan_lach_to || '0');
        if (clinExam.khoi_bat_thuong_bung || extra.khoi_bat_thuong_bung) setKhoiBatThuongBung(clinExam.khoi_bat_thuong_bung || extra.khoi_bat_thuong_bung || '0');
        if (clinExam.lo_hau_mon || extra.lo_hau_mon) setLoHauMon(clinExam.lo_hau_mon || extra.lo_hau_mon || '1');
        if (clinExam.cq_sinh_duc_ngoai || extra.cq_sinh_duc_ngoai) setCqSinhDucNgoai(clinExam.cq_sinh_duc_ngoai || extra.cq_sinh_duc_ngoai || '1');
        if (clinExam.van_dong_khong_doi_xung || extra.van_dong_khong_doi_xung) setVanDongKhongDoiXung(clinExam.van_dong_khong_doi_xung || extra.van_dong_khong_doi_xung || '0');
        if (clinExam.phan_xa_bu || extra.phan_xa_bu) setPhanXaBu(clinExam.phan_xa_bu || extra.phan_xa_bu || '1');
        if (clinExam.phan_xa_nam || extra.phan_xa_nam) setPhanXaNam(clinExam.phan_xa_nam || extra.phan_xa_nam || '1');
        if (clinExam.phan_xa_moro || extra.phan_xa_moro) setphanXaMoro(clinExam.phan_xa_moro || extra.phan_xa_moro || '1');
        if (clinExam.truong_luc_co || extra.truong_luc_co) setTruongLucCo(clinExam.truong_luc_co || extra.truong_luc_co || '1');
        if (clinExam.khopHang || clinExam.khop_hang || extra.khop_hang) setKhopHang(clinExam.khopHang || clinExam.khop_hang || extra.khop_hang || '1');
        if (clinExam.phan_xa_co || extra.phan_xa_co) setPhanXaCo(clinExam.phan_xa_co || extra.phan_xa_co || '1');
        if (clinExam.kiem_tra_lung_cot_song || extra.kiem_tra_lung_cot_song) setKiemTraLungCotSong(clinExam.kiem_tra_lung_cot_song || extra.kiem_tra_lung_cot_song || '1');
        if (clinExam.kham_tu_chi_khop || extra.kham_tu_chi_khop) setKhamTuChiKhop(clinExam.kham_tu_chi_khop || extra.kham_tu_chi_khop || '1');
        if (clinExam.quan_sat_dang_di || extra.quan_sat_dang_di) setQuanSatDangDi(clinExam.quan_sat_dang_di || extra.quan_sat_dang_di || '1');

        // Lab
        const blood = rawLab.blood_test || rawLab.bloodTest || rawLab || {};
        if (blood.hemoglobin) { setHemoglobin(blood.hemoglobin); setBloodTestEnabled(true); }
        if (blood.glycemia) { setGlycemia(blood.glycemia); setBloodTestEnabled(true); }
        if (blood.chi_so_hc) { setChiSoHc(blood.chi_so_hc); setBloodTestEnabled(true); }
        if (blood.chi_so_bach_cau) { setChiSoBachCau(blood.chi_so_bach_cau); setBloodTestEnabled(true); }
        if (blood.chi_so_tieu_cau) { setChiSoTieuCau(blood.chi_so_tieu_cau); setBloodTestEnabled(true); }
        if (blood.ure) { setUre(blood.ure); setBloodTestEnabled(true); }
        if (blood.creatinin) { setCreatinin(blood.creatinin); setBloodTestEnabled(true); }
        if (blood.asat_ast) { setAsatAst(blood.asat_ast); setBloodTestEnabled(true); }
        if (blood.alat_alt) { setAlatAlt(blood.alat_alt); setBloodTestEnabled(true); }
        if (blood.nuoc_tieu_khac) { setNuocTieuKhac(blood.nuoc_tieu_khac); setBloodTestEnabled(true); }

        const urine = rawLab.urine_test || rawLab.urineTest || rawLab || {};
        if (urine.duong_nuoc_tieu || urine.protein_nuoc_tieu) {
            if (urine.duong_nuoc_tieu) setDuongNuocTieu(urine.duong_nuoc_tieu);
            if (urine.protein_nuoc_tieu) setProteinNuocTieu(urine.protein_nuoc_tieu);
            setUrineTestEnabled(true);
        }

        if (rawLab.other_result || rawLab.otherResult) {
            setOtherLabResult(rawLab.other_result || rawLab.otherResult);
            setOtherLabTestEnabled(true);
        }

        // Conclusion
        if (rawConcl.fitness_class) setFitnessClass(rawConcl.fitness_class);
        if (rawConcl.diagnosis) setDiagnosis(rawConcl.diagnosis);
        if (rawConcl.cac_van_de_luu_y) setCacVanDeLuuY(rawConcl.cac_van_de_luu_y);
    }, [initialData]);

    const buildPayload = (overrideMetadata?: any) => {
        const activeMetadata = overrideMetadata || specialtyMetadata;
        return {
            id: initialData?.id || initialData?._id,
            patient_id: patientId,
            patient_name: patientName,
            cccd: cccd,
            dob: dob,
            gender: gender,
            doc_no: docNo,
            form_type: '1',
            is_locked: isLocked,
            clinical_data: {
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
                loai_hinh_kcb: loaiHinhKcb,
                specialty_metadata: activeMetadata,
                examination: {
                    height,
                    weight,
                    pulse,
                    blood_pressure: bp
                },
                nhiet_do: nhietDo,
                nhip_tho: nhipTho,
                extra: {
                    nguoi_giam_ho: guardianName,
                    so_cccd_ngh: guardianCccd,
                    ho_ten_nguoi_di_cung: escortName,
                    so_cccd_nguoi_di_cung: escortCccd,
                    moi_quan_he_voi_tre: escortRelation,
                    con_thu_may: conThuMay,
                    tong_so_con: tongSoCon,
                    matinh_cu_tru_nghme: maTinhCuTruNghMe,
                    maxa_cu_tru_nghme: maXaCuTruNghMe,
                    gio_kham: gioKham,
                    dg_dhst_nhiet_do: dgDhstNhietDo,
                    dg_dhst_mach: dgDhstMach,
                    dg_dhst_nhip_tho: dgDhstNhipTho,
                    vong_ddau: vongDau,
                    vong_nguc: vongNguc,
                    sinh_non: sinhNon,
                    tuan_thai_khi_sinh: tuanThai,
                    can_nang_luc_sinh: birthWeight,
                    tsbt_mac_benh: tsbtMacBenh,
                    tsbt_ma_benh: tsbtMaBenh,
                    ts_ban_than: tsBanThan,
                    tsgd_mac_benh: tsgdMacBenh,
                    tsgd_ma_benh: tsgdMaBenh,
                    ts_gia_dinh: tsGiaDinh,
                    tsbt_nghien_ruou: tsbtNghienRuou,
                    tsbt_ma_benh_khac: tsbtMaBenhKhac,
                    ts_tiep_xuc_lao: tsTiepXucLao,

                    chieu_dai_tuoi_sd: chieuDaiTuoiSd,
                    can_nang_tuoi_sd: canNangTuoiSd,
                    dg_vong_dau: dgVongDau,
                    chu_vi_vong_canh_tay: chuViVongCanhTay,
                    phu_dinh_duong: phuDinhDuong,
                    thieu_mau: thieuMau,
                    coi_xuong: coiXuong,
                    suy_dinh_duong: suyDinhDuong,
                    thua_can_beo_phi: thuaCanBeoPhi,
                    pt_tinh_than_binh_thuong: ptTinhThanBinhThuong,
                    pt_van_dong_binh_thuong: ptVanDongBinhThuong,
                    nguy_co_tu_ky: nguyCoTuKy,
                    tiem_chung_lao: tiemChungLao,
                    tiem_chung_vgb_mui1: tiemChungVgbMui1,
                    tiem_chung_day_du: tiemChungDayDu
                },
                clinical_exam: {
                    lam_sang_quan_sat: lamSangQuanSat,
                    mau_sac_da: mauSacDa,
                    long_ban_tay: longBanTay,
                    thop: thop,
                    kich_thuoc_dau: kichThuocDau,
                    van_dong_co: vanDongCo,
                    khoi_bat_thuong_dau_co: khoiBatThuongDauCo,
                    vi_tri_2_mat: viTri2Mat,
                    mi_mat_ket_mac: miMatKetMac,
                    lac_mat: lacMat,
                    dong_tu: dongTu,
                    tai_mang_nhi: taiMangNhi,
                    dap_ung_am_thanh: dapUngAmThanh,
                    khoi_sung_sau_tai: khoiSungSauTai,
                    chay_mu_nuoc_tai: chayMuNuocTai,
                    hinh_dang_mui: hinhDangMui,
                    chay_nuoc_mui: chayNuocMui,
                    nghet_mui: nghetMui,
                    hong: hong,
                    hinh_dang_mieng: hinhDangMieng,
                    rang_sua_so_sinh: rangSuaSoSinh,
                    hinh_dang_luoi: hinhDangLuoi,
                    dinh_thang_luoi: dinhThangLuoi,
                    nam_mieng: namMieng,
                    cam_nho_tut_sau: camNhoTutSau,
                    vet_sau_mang_bam: vetSauMangBam,
                    nhip_tho_khong_deu: nhipThoKhongDeu,
                    tho_rut_lom_long_nguc: thoRutLomLongNguc,
                    tieng_tho_bat_thuong: tiengThoBatThuong,
                    dh_suy_ho_hap: dhSuyHoHap,
                    nghe_phoi: nghePhoi,
                    vi_tri_mom_tim: viTriMomTim,
                    mach_ngoai_vi: machNgoaiVi,
                    nghe_tim: ngheTim,
                    hinh_dang_bung_ron: hinhDangBungRon,
                    gan_lach_to: ganLachTo,
                    khoi_bat_thuong_bung: khoiBatThuongBung,
                    lo_hau_mon: loHauMon,
                    cq_sinh_duc_ngoai: cqSinhDucNgoai,
                    van_dong_khong_doi_xung: vanDongKhongDoiXung,
                    phan_xa_bu: phanXaBu,
                    phan_xa_nam: phanXaNam,
                    phan_xa_moro: phanXaMoro,
                    truong_luc_co: truongLucCo,
                    khop_hang: khopHang,
                    phan_xa_co: phanXaCo,
                    kiem_tra_lung_cot_song: kiemTraLungCotSong,
                    kham_tu_chi_khop: khamTuChiKhop,
                    quan_sat_dang_di: quanSatDangDi
                }
            },
            lab_data: {
                blood_test: {
                    hemoglobin: bloodTestEnabled ? hemoglobin : '',
                    glycemia: bloodTestEnabled ? glycemia : '',
                    chi_so_hc: bloodTestEnabled ? chiSoHc : '',
                    chi_so_bach_cau: bloodTestEnabled ? chiSoBachCau : '',
                    chi_so_tieu_cau: bloodTestEnabled ? chiSoTieuCau : '',
                    ure: bloodTestEnabled ? ure : '',
                    creatinin: bloodTestEnabled ? creatinin : '',
                    asat_ast: bloodTestEnabled ? asatAst : '',
                    alat_alt: bloodTestEnabled ? alatAlt : '',
                    nuoc_tieu_khac: bloodTestEnabled ? nuocTieuKhac : ''
                },
                urine_test: {
                    duong_nuoc_tieu: urineTestEnabled ? duongNuocTieu : '',
                    protein_nuoc_tieu: urineTestEnabled ? proteinNuocTieu : ''
                },
                other_result: otherLabTestEnabled ? otherLabResult : '',
                paraclinical_items: initialData?.lab_data?.paraclinical_items || []
            },
            conclusion_data: {
                fitness_class: fitnessClass,
                diagnosis: diagnosis,
                cac_van_de_luu_y: cacVanDeLuuY
            }
        };
    };

    const handleSubmit = async (options?: any) => {
        const newErrors: Record<string, string> = {};
        if (!patientName?.trim()) newErrors.patientName = 'Vui lòng nhập họ và tên trẻ';
        if (!dob) newErrors.dob = 'Vui lòng chọn ngày sinh của trẻ';
        if (!gender) newErrors.gender = 'Vui lòng chọn giới tính';
        if (!fundingSource) newErrors.fundingSource = 'Vui lòng chọn nguồn chi trả theo QĐ 2062';
        
        if (!guardianName?.trim()) {
            newErrors.guardianName = 'Trẻ dưới 6 tuổi bắt buộc nhập Họ tên người giám hộ (Mục 16)';
        }
        if (!guardianCccd?.trim()) {
            newErrors.guardianCccd = 'Trẻ dưới 6 tuổi bắt buộc nhập Số định danh/CCCD người giám hộ (Mục 15)';
        } else if (!/^\d{9,12}$/.test(String(guardianCccd).trim())) {
            newErrors.guardianCccd = 'Số định danh/CCCD người giám hộ phải gồm 9 hoặc 12 chữ số';
        }

        const isOverallClassThreeOrBelow = ['3', '4', '5', 'III', 'IV', 'V'].includes(fitnessClass);
        const normalizedNotes = (cacVanDeLuuY || '').trim().toLocaleLowerCase('vi-VN');
        const hasSpecificHealthNotes = !!normalizedNotes
            && normalizedNotes !== DEFAULT_CHILD_CARE_NOTE.toLocaleLowerCase('vi-VN');
        if ((isOverallClassThreeOrBelow || hasSpecificHealthNotes) && !diagnosis.trim()) {
            newErrors.diagnosis = 'Bắt buộc nhập mã bệnh tật/chẩn đoán ICD-10 khi phân loại sức khỏe từ loại III trở xuống hoặc có vấn đề lưu ý';
        }

        if (dob && validateNewFormAge('1', dob)) newErrors.dob = validateNewFormAge('1', dob)!;
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const firstKey = Object.keys(newErrors)[0];
            const firstMsg = newErrors[firstKey];
            toast.error(`Chưa đủ thông tin bắt buộc: ${firstMsg}`);
            if (newErrors.diagnosis) {
                setActiveTab('conclusion');
            } else {
                setActiveTab('admin');
            }
            return;
        }

        const payload = buildPayload(options?.overrideMetadata);
        try {
            await onSave(payload, options);
        } catch (err: any) {
            toast.error(err.message || 'Lỗi khi lưu dữ liệu');
            throw err;
        }
    };

    const handleTabChange = (tabId: 'admin' | 'history' | 'childDev' | 'exam' | 'lab' | 'conclusion') => {
        if (!patientName && tabId !== 'admin') {
            toast.warning('Vui lòng nhập tên trẻ trước khi chuyển sang các tab khác');
            return;
        }
        setActiveTab(tabId);
    };

    return {
        initialData,
        activeTab,
        setActiveTab,
        hisSearchQuery,
        setHisSearchQuery,
        isFetchingHis,
        setIsFetchingHis,
        hisSyncMessage,
        setHisSyncMessage,
        handleFetchHisData,
        specialtyMetadata,
        setSpecialtyMetadata,
        doctors,
        setDoctors,
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
        loaiHinhKcb,
        setLoaiHinhKcb,
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
        conThuMay,
        setConThuMay,
        tongSoCon,
        setTongSoCon,
        maTinhCuTruNghMe,
        setMaTinhCuTruNghMe,
        maXaCuTruNghMe,
        setMaXaCuTruNghMe,
        height,
        setHeight,
        weight,
        setWeight,
        bmi,
        setBmi,
        pulse,
        setPulse,
        bp,
        setBp,
        nhietDo,
        setNhietDo,
        nhipTho,
        setNhipTho,
        gioKham,
        setGioKham,
        dgDhstNhietDo,
        setDgDhstNhietDo,
        dgDhstMach,
        setDgDhstMach,
        dgDhstNhipTho,
        setDgDhstNhipTho,
        tsBanThan,
        setTsBanThan,
        tsbtMacBenh,
        setTsbtMacBenh,
        tsbtMaBenh,
        setTsbtMaBenh,
        tsGiaDinh,
        setTsGiaDinh,
        tsgdMacBenh,
        setTsgdMacBenh,
        tsgdMaBenh,
        setTsgdMaBenh,
        tsbtNghienRuou,
        setTsbtNghienRuou,
        tsbtMaBenhKhac,
        setTsbtMaBenhKhac,
        tsTiepXucLao,
        setTsTiepXucLao,
        sinhNon,
        setSinhNon,
        tuanThai,
        setTuanThai,
        birthWeight,
        setBirthWeight,
        vongDau,
        setVongDau,
        vongNguc,
        setVongNguc,
        chieuDaiTuoiSd,
        setChieuDaiTuoiSd,
        canNangTuoiSd,
        setCanNangTuoiSd,
        dgVongDau,
        setDgVongDau,
        chuViVongCanhTay,
        setChuViVongCanhTay,
        phuDinhDuong,
        setPhuDinhDuong,
        thieuMau,
        setThieuMau,
        coiXuong,
        setCoiXuong,
        suyDinhDuong,
        setSuyDinhDuong,
        thuaCanBeoPhi,
        setThuaCanBeoPhi,
        ptTinhThanBinhThuong,
        setPtTinhThanBinhThuong,
        ptVanDongBinhThuong,
        setPtVanDongBinhThuong,
        nguyCoTuKy,
        setNguyCoTuKy,
        tiemChungLao,
        setTiemChungLao,
        tiemChungVgbMui1,
        setTiemChungVgbMui1,
        tiemChungDayDu,
        setTiemChungDayDu,
        lamSangQuanSat,
        setLamSangQuanSat,
        mauSacDa,
        setMauSacDa,
        longBanTay,
        setLongBanTay,
        thop,
        setThop,
        kichThuocDau,
        setKichThuocDau,
        vanDongCo,
        setVanDongCo,
        khoiBatThuongDauCo,
        setKhoiBatThuongDauCo,
        viTri2Mat,
        setViTri2Mat,
        miMatKetMac,
        setMiMatKetMac,
        lacMat,
        setLacMat,
        dongTu,
        setDongTu,
        taiMangNhi,
        setTaiMangNhi,
        dapUngAmThanh,
        setDapUngAmThanh,
        khoiSungSauTai,
        setKhoiSungSauTai,
        chayMuNuocTai,
        setChayMuNuocTai,
        hinhDangMui,
        setHinhDangMui,
        chayNuocMui,
        setChayNuocMui,
        nghetMui,
        setNghetMui,
        hong,
        setHong,
        hinhDangMieng,
        setHinhDangMieng,
        rangSuaSoSinh,
        setRangSuaSoSinh,
        hinhDangLuoi,
        setHinhDangLuoi,
        dinhThangLuoi,
        setDinhThangLuoi,
        namMieng,
        setNamMieng,
        camNhoTutSau,
        setCamNhoTutSau,
        vetSauMangBam,
        setVetSauMangBam,
        nhipThoKhongDeu,
        setNhipThoKhongDeu,
        thoRutLomLongNguc,
        setThoRutLomLongNguc,
        tiengThoBatThuong,
        setTiengThoBatThuong,
        dhSuyHoHap,
        setDhSuyHoHap,
        nghePhoi,
        setNghePhoi,
        viTriMomTim,
        setViTriMomTim,
        machNgoaiVi,
        setMachNgoaiVi,
        ngheTim,
        setNgheTim,
        hinhDangBungRon,
        setHinhDangBungRon,
        ganLachTo,
        setGanLachTo,
        khoiBatThuongBung,
        setKhoiBatThuongBung,
        loHauMon,
        setLoHauMon,
        cqSinhDucNgoai,
        setCqSinhDucNgoai,
        vanDongKhongDoiXung,
        setVanDongKhongDoiXung,
        phanXaBu,
        setPhanXaBu,
        phanXaNam,
        setPhanXaNam,
        phanXaMoro,
        setphanXaMoro,
        truongLucCo,
        setTruongLucCo,
        khopHang,
        setKhopHang,
        phanXaCo,
        setPhanXaCo,
        kiemTraLungCotSong,
        setKiemTraLungCotSong,
        khamTuChiKhop,
        setKhamTuChiKhop,
        quanSatDangDi,
        setQuanSatDangDi,
        bloodTestEnabled,
        setBloodTestEnabled,
        hemoglobin,
        setHemoglobin,
        glycemia,
        setGlycemia,
        chiSoHc,
        setChiSoHc,
        chiSoBachCau,
        setChiSoBachCau,
        chiSoTieuCau,
        setChiSoTieuCau,
        ure,
        setUre,
        creatinin,
        setCreatinin,
        asatAst,
        setAsatAst,
        alatAlt,
        setAlatAlt,
        nuocTieuKhac,
        setNuocTieuKhac,
        urineTestEnabled,
        setUrineTestEnabled,
        duongNuocTieu,
        setDuongNuocTieu,
        proteinNuocTieu,
        setProteinNuocTieu,
        otherLabTestEnabled,
        setOtherLabTestEnabled,
        otherLabResult,
        setOtherLabResult,
        fitnessClass,
        setFitnessClass,
        diagnosis,
        setDiagnosis,
        cacVanDeLuuY,
        setCacVanDeLuuY,
        provinces,
        ethnicities,
        occupations,
        nations,
        wards,
        workplaces,
        errors,
        setErrors,
        isLocked,
        setIsLocked,
        handleAutofillTab,
        handleSubmit,
        confirmConfig,
        setConfirmConfig,
        handleTabChange,
        buildPayload
    };
};
