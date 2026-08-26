import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '../../../contexts/SessionContext';
import { toast } from 'sonner';
import { useCatalogs } from '../../../contexts/CatalogContext';
import { catalogService, CatalogItem } from '../../../services/catalogService';
import { healthCheckService } from '../../../services/healthCheckService';
import { validateNewFormAge } from '../utils/healthCheckAge';
import { formatDateForInput, parseDateSafe } from '../../../utils/formatters';

export const useDynamicFormState = (
    formType: string,
    initialData: any,
    onSave: (formData: any, options?: any) => void,
    onPreview?: (formData: any) => void,
    onChangeFormType?: (type: string) => void
) => {
    const { user } = useSession();
    const { provinces, ethnicities, occupations, nations, getWards } = useCatalogs();

    const [activeTab, setActiveTab] = useState<'admin' | 'history' | 'exam' | 'lab' | 'conclusion'>('admin');
    
    // State for HIS Sync
    const [hisSearchQuery, setHisSearchQuery] = useState('');
    const [isFetchingHis, setIsFetchingHis] = useState(false);
    const [hisSyncMessage, setHisSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // 1. Administrative & Lookup State
    const [patientId, setPatientId] = useState(initialData?.patient_id || `P${Math.floor(1000 + Math.random() * 9000)}`);
    const [patientName, setPatientName] = useState(initialData?.patient_name || '');
    const [cccd, setCccd] = useState(initialData?.cccd || '');
    const [noCccd, setNoCccd] = useState(initialData?.clinical_data?.no_cccd || false);
    const [dob, setDobState] = useState(initialData?.dob ? formatDateForInput(initialData.dob) : '');

    // Tự động chuyển đổi mẫu biểu khi ngày sinh thay đổi
    const setDob: React.Dispatch<React.SetStateAction<string>> = (valOrFn) => {
        setDobState(prev => {
            const nextVal = typeof valOrFn === 'function' ? (valOrFn as any)(prev) : valOrFn;
            if (nextVal && onChangeFormType) {
                const bDate = parseDateSafe(nextVal);
                if (bDate && !isNaN(bDate.getTime())) {
                    const today = new Date();
                    let age = today.getFullYear() - bDate.getFullYear();
                    if (today.getMonth() < bDate.getMonth() || (today.getMonth() === bDate.getMonth() && today.getDate() < bDate.getDate())) {
                        age--;
                    }
                    let targetForm = '3';
                    if (age < 6) targetForm = '1';
                    else if (age < 18) targetForm = '2';
                    else targetForm = '3';

                    if (targetForm !== formType) {
                        console.log(`🔄 [Auto-switch Form] Tự động chuyển sang Mẫu ${targetForm} theo ngày sinh: ${nextVal} (Tuổi: ${age})`);
                        onChangeFormType(targetForm);
                    }
                }
            }
            return nextVal;
        });
    };
    const [gender, setGender] = useState(initialData?.gender || '');
    const [docNo, setDocNo] = useState(initialData?.doc_no || Date.now().toString());
    const [address, setAddress] = useState(initialData?.clinical_data?.address || '');
    const [phone, setPhone] = useState(initialData?.clinical_data?.phone || '');
    const [ethnic, setEthnic] = useState(initialData?.clinical_data?.ethnic || '01');
    const [cccdDate, setCccdDate] = useState(initialData?.clinical_data?.cccd_date ? formatDateForInput(initialData.clinical_data.cccd_date) : '');
    const [cccdPlace, setCccdPlace] = useState(initialData?.clinical_data?.cccd_place || '');
    const [bloodGroup, setBloodGroup] = useState(initialData?.clinical_data?.blood_group || '');
    const [targetGroup, setTargetGroup] = useState(initialData?.clinical_data?.target_group || '');
    const [fundingSource, setFundingSource] = useState(initialData?.clinical_data?.funding_source || '');
    
    // Hành chính bổ sung QĐ 1551
    const [maGtinCskcb, setMaGtinCskcb] = useState(initialData?.clinical_data?.ma_gtin_cskcb || '');
    const [maTinhCuTru, setMaTinhCuTru] = useState(initialData?.clinical_data?.matinh_cu_tru || '');
    const [maXaCuTru, setMaXaCuTru] = useState(initialData?.clinical_data?.maxa_cu_tru || '');
    const [lyDoVv, setLyDoVv] = useState(initialData?.clinical_data?.ly_do_vv || 'Khám sức khỏe định kỳ');
    const [loaiHinhKcb, setLoaiHinhKcb] = useState(initialData?.clinical_data?.loai_hinh_kcb || '01');
    const [ngayVao, setNgayVao] = useState(initialData?.clinical_data?.ngay_vao ? formatDateForInput(initialData.clinical_data.ngay_vao) : formatDateForInput(new Date()));

    // Form-specific extra administrative fields
    const [guardianName, setGuardianName] = useState(initialData?.clinical_data?.extra?.nguoi_giam_ho || '');
    const [guardianCccd, setGuardianCccd] = useState(initialData?.clinical_data?.extra?.so_cccd_ngh || '');
    const [escortName, setEscortName] = useState(initialData?.clinical_data?.extra?.ho_ten_nguoi_di_cung || '');
    const [escortCccd, setEscortCccd] = useState(initialData?.clinical_data?.extra?.so_cccd_nguoi_di_cung || '');
    const [escortRelation, setEscortRelation] = useState(initialData?.clinical_data?.extra?.moi_quan_he_voi_tre || '');
    const [licenseClass, setLicenseClass] = useState(initialData?.clinical_data?.extra?.hang_lai_xe || 'B2');
    const [driverExamPurpose, setDriverExamPurpose] = useState(initialData?.clinical_data?.extra?.driver_exam_purpose || 'Cấp mới');
    const [chucDanh, setChucDanh] = useState(initialData?.clinical_data?.extra?.chuc_danh || '');
    const [noiCongTac, setNoiCongTac] = useState(initialData?.clinical_data?.extra?.noi_cong_tac || '');
    const [viTriLamViec, setViTriLamViec] = useState(initialData?.clinical_data?.extra?.vi_tri_lam_viec || '');
    const [boPhanLamViec, setBoPhanLamViec] = useState(initialData?.clinical_data?.extra?.bo_phan_lam_viec || '');
    const [offshoreExp, setOffshoreExp] = useState(initialData?.clinical_data?.extra?.offshore_exp || '');
    const [railwayFit, setRailwayFit] = useState(initialData?.clinical_data?.extra?.railway_fit || '');

    // 2. Tiền sử bệnh & tiêm chủng
    const [tsgdMacBenh, setTsgdMacBenh] = useState(initialData?.clinical_data?.extra?.tsgd_mac_benh || '');
    const [tsgdMaBenh, setTsgdMaBenh] = useState(initialData?.clinical_data?.extra?.tsgd_ma_benh || '');
    const [tsbtMaBenh, setTsbtMaBenh] = useState(initialData?.clinical_data?.extra?.tsbt_ma_benh || '');
    const [tsbtNghienRuou, setTsbtNghienRuou] = useState(initialData?.clinical_data?.extra?.tsbt_nghien_ruou || '');
    const [tsbtMaBenhKhac, setTsbtMaBenhKhac] = useState(initialData?.clinical_data?.extra?.tsbt_ma_benh_khac || '');
    const [tsbtNamPhatHienBenh, setTsbtNamPhatHienBenh] = useState(initialData?.clinical_data?.extra?.tsbt_nam_phat_hien_benh || '');
    const [tiemChungBcg, setTiemChungBcg] = useState(initialData?.clinical_data?.extra?.tiem_chung_bcg || '');
    const [tiemChungBhHgUv, setTiemChungBhHgUv] = useState(initialData?.clinical_data?.extra?.tiem_chung_bh_hg_uv || '');
    const [tiemChungSoi, setTiemChungSoi] = useState(initialData?.clinical_data?.extra?.tiem_chung_soi || '');
    const [tiemChungBaiLiet, setTiemChungBaiLiet] = useState(initialData?.clinical_data?.extra?.tiem_chung_bai_liet || '');
    const [tiemChungVnnbB, setTiemChungVnnbB] = useState(initialData?.clinical_data?.extra?.tiem_chung_vnnb_b || '');
    const [tiemChungVgb, setTiemChungVgb] = useState(initialData?.clinical_data?.extra?.tiem_chung_vgb || '');
    const [tiemChungCacLoaiKhac, setTiemChungCacLoaiKhac] = useState(initialData?.clinical_data?.extra?.tiem_chung_cac_loai_khac || '');
    const [tiemChungVacXinKhac, setTiemChungVacXinKhac] = useState(initialData?.clinical_data?.extra?.tiem_chung_vac_xin_khac || '');

    // Tiền sử thai sản (QĐ 2062)
    const [tsbtThaiSan, setTsbtThaiSan] = useState(initialData?.clinical_data?.extra?.tsbt_thai_san || '0');
    const [tsbtMaBenhThaiSan, setTsbtMaBenhThaiSan] = useState(initialData?.clinical_data?.extra?.tsbt_ma_benh_thai_san || '');
    const [tsbtTenThuocThaiSan, setTsbtTenThuocThaiSan] = useState(initialData?.clinical_data?.extra?.tsbt_ten_thuoc_thai_san || '');

    // Tiền sử sản phụ khoa (nữ)
    const [coKinhNguyetNamBaoNhieuTuoi, setCoKinhNguyetNamBaoNhieuTuoi] = useState(initialData?.clinical_data?.extra?.co_kinh_nguyet_nam_bao_nhieu_tuoi || '');
    const [tinhChatKinhNguyet, setTinhChatKinhNguyet] = useState(initialData?.clinical_data?.extra?.tinh_chat_kinh_nguyet || '');
    const [chuKyKinh, setChuKyKinh] = useState(initialData?.clinical_data?.extra?.chu_ky_kinh || '');
    const [luongKinh, setLuongKinh] = useState(initialData?.clinical_data?.extra?.luong_kinh || '');
    const [dauBungKinh, setDauBungKinh] = useState(initialData?.clinical_data?.extra?.dau_bung_kinh || '');
    const [daLapGiaDinh, setDaLapGiaDinh] = useState(initialData?.clinical_data?.extra?.da_lap_gia_dinh || '');
    const [para, setPara] = useState(initialData?.clinical_data?.extra?.para || '');
    const [daTungMoSanPhuKhoaChua, setDaTungMoSanPhuKhoaChua] = useState(initialData?.clinical_data?.extra?.da_tung_mo_san_phu_khoa_chua || '');
    const [soLanMoSanPhuKhoa, setSoLanMoSanPhuKhoa] = useState(initialData?.clinical_data?.extra?.so_lan_mo_san_phu_khoa || '');
    const [ghiRoMoSanPhuKhoa, setGhiRoMoSanPhuKhoa] = useState(initialData?.clinical_data?.extra?.ghi_ro_mo_san_phu_khoa || '');
    const [dangApDungBpttKhong, setDangApDungBpttKhong] = useState(initialData?.clinical_data?.extra?.dang_ap_dung_bptt_khong || '');
    const [bienPhapTranhThai, setBienPhapTranhThai] = useState(initialData?.clinical_data?.extra?.bien_phap_tranh_thai || '');

    const [tsTiepXucLao, setTsTiepXucLao] = useState(initialData?.clinical_data?.extra?.ts_tiep_xuc_lao || '0');

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
    const [tsMacBenh, setTsMacBenh] = useState(initialData?.clinical_data?.extra?.ts_mac_benh || 0);
    const [tsbtMaBenhNgheNghiep, setTsbtMaBenhNgheNghiep] = useState(initialData?.clinical_data?.extra?.tsbt_ma_benh_nghe_nghiep || '');
    const [tsbtNamPhatHienBenhNgheNghiep, setTsbtNamPhatHienBenhNgheNghiep] = useState(initialData?.clinical_data?.extra?.tsbt_nam_phat_hien_benh_nghe_nghiep || '');

    // 3. Physical Measurements
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
    const [sinhNon, setSinhNon] = useState(initialData?.clinical_data?.extra?.sinh_non || '');
    const [tuanThai, setTuanThai] = useState(initialData?.clinical_data?.extra?.tuan_thai_khi_sinh || '');
    const [birthWeight, setBirthWeight] = useState(initialData?.clinical_data?.extra?.can_nang_luc_sinh || '');
    
    // Child Nutrition, Development & Immunization
    const [chieuDaiTuoiSd, setChieuDaiTuoiSd] = useState(initialData?.clinical_data?.extra?.chieu_dai_tuoi_sd || '');
    const [canNangTuoiSd, setCanNangTuoiSd] = useState(initialData?.clinical_data?.extra?.can_nang_tuoi_sd || '');
    const [dgVongDau, setDgVongDau] = useState(initialData?.clinical_data?.extra?.dg_vong_dau || '1');
    const [chuViVongCanhTay, setChuViVongCanhTay] = useState(initialData?.clinical_data?.extra?.chu_vi_vong_canh_tay || '');
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

    // Child clinical exam fields
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
    const [internalExam, setInternalExam] = useState(initialData?.clinical_data?.clinical_exam?.internal || '');
    const [eyeExam, setEyeExam] = useState(initialData?.clinical_data?.clinical_exam?.eye || '');
    const [entExam, setEntExam] = useState(initialData?.clinical_data?.clinical_exam?.ent || '');
    const [dentalExam, setDentalExam] = useState(initialData?.clinical_data?.clinical_exam?.dental || '');
    const [externalExam, setExternalExam] = useState(initialData?.clinical_data?.clinical_exam?.external || '');
    const [dermatologyExam, setDermatologyExam] = useState(initialData?.clinical_data?.clinical_exam?.dermatology || '');
    const initialGynVal = initialData?.clinical_data?.clinical_exam?.gynecology || initialData?.clinical_data?.clinical_exam?.kham_san_phu_khoa || initialData?.clinical_data?.clinical_exam?.kq_sinh_duc || initialData?.clinical_data?.clinical_exam?.ket_qua_kham_san_phu_khoa || '';
    const [gynExam, setGynExam] = useState(initialGynVal);
    const [nhiKhoaLamSangKhac, setNhiKhoaLamSangKhac] = useState(initialData?.clinical_data?.extra?.nhi_khoa_lam_sang_khac || '');
    
    // Khám lâm sàng chuyên khoa chi tiết QĐ 1551
    const [khongKinhMatPhai, setKhongKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.khong_kinh_mat_phai || '');
    const [khongKinhMatTrai, setKhongKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.khong_kinh_mat_trai || '');
    const [coKinhMatPhai, setCoKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.co_kinh_mat_phai || '');
    const [coKinhMatTrai, setCoKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.co_kinh_mat_trai || '');
    const [khongKinhHaiMat, setKhongKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.khong_kinh_hai_mat || '');
    const [coKinhHaiMat, setCoKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.co_kinh_hai_mat || '');
    const [sacGiac, setSacGiac] = useState(initialData?.clinical_data?.clinical_exam?.sac_giac || '0');
    const [thiTruongNgangHaiMat, setThiTruongNgangHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.thi_truong_ngang_haimat || '');
    const [thiTruongDungHaiMat, setThiTruongDungHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.thi_truong_dung_haimat || '');

    const [taiTraiNoiThuong, setTaiTraiNoiThuong] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_noi_thuong || '');
    const [taiTraiNoiTham, setTaiTraiNoiTham] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_noi_tham || '');
    const [taiPhaiNoiThuong, setTaiPhaiNoiThuong] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_noi_thuong || '');
    const [taiPhaiNoiTham, setTaiPhaiNoiTham] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_noi_tham || '');

    const [hamTren, setHamTren] = useState(initialData?.clinical_data?.clinical_exam?.ham_tren || '');
    const [hamDuoi, setHamDuoi] = useState(initialData?.clinical_data?.clinical_exam?.ham_duoi || '');

    // Bệnh chuyên khoa nếu có (QĐ 1551 & TT 32)
    const [benhKhacMat, setBenhKhacMat] = useState(initialData?.clinical_data?.clinical_exam?.benh_khac_mat || initialData?.clinical_data?.clinical_exam?.eye || '');
    const [benhKhacTaiMuiHong, setBenhKhacTaiMuiHong] = useState(initialData?.clinical_data?.clinical_exam?.benh_khac_tai_mui_hong || initialData?.clinical_data?.clinical_exam?.benh_tai_mui_hong || initialData?.clinical_data?.clinical_exam?.ent || '');
    const [benhKhacRangHamMat, setBenhKhacRangHamMat] = useState(initialData?.clinical_data?.clinical_exam?.benh_khac_rang_ham_mat || initialData?.clinical_data?.clinical_exam?.benh_rang_ham_mat || initialData?.clinical_data?.clinical_exam?.dental || '');

    // Phân loại chuyên khoa (Mẫu 2)
    const [khamTheLucPl, setKhamTheLucPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_the_luc_pl || '');
    const [noiKhoaTuanHoanPl, setNoiKhoaTuanHoanPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_tuan_hoan_pl || '');
    const [noiKhoaHoHapPl, setNoiKhoaHoHapPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_ho_hap_pl || '');
    const [noiKhoaTieuHoaPl, setNoiKhoaTieuHoaPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_tieu_hoa_pl || '');
    const [noiKhoaThanTietnieuPl, setNoiKhoaThanTietnieuPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_than_tietnieu_pl || '');
    const [noiKhoaNoiTietPl, setNoiKhoaNoiTietPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_noi_tiet_pl || '');
    const [noiKhoaCoXuongKhopPl, setNoiKhoaCoXuongKhopPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_co_xuong_khop_pl || '');
    const [noiKhoaThanKinhPl, setNoiKhoaThanKinhPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_than_kinh_pl || '');
    const [noiKhoaTamThanPl, setNoiKhoaTamThanPl] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_tam_than_pl || '');
    const [khamNgoaiKhoaPl, setKhamNgoaiKhoaPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_ngoai_khoa_pl || '');
    const [khamDaLieuPl, setKhamDaLieuPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_da_lieu_pl || '');
    const [khamSanPhuKhoaPl, setKhamSanPhuKhoaPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_san_phu_khoa_pl || '');
    const [khamMatPl, setKhamMatPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_mat_pl || '');
    const [khamTaiMuiHongPl, setKhamTaiMuiHongPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_tai_mui_hong_pl || '');
    const [khamRangHamMatPl, setKhamRangHamMatPl] = useState(initialData?.clinical_data?.clinical_exam?.kham_rang_ham_mat_pl || '');

    // Nhi khoa (Forms 6 - 13)
    const [nhiTuanHoan, setNhiTuanHoan] = useState(initialData?.clinical_data?.clinical_exam?.nhi_tuan_hoan || '');
    const [nhiHoHap, setNhiHoHap] = useState(initialData?.clinical_data?.clinical_exam?.nhi_ho_hap || '');
    const [nhiTieuHoa, setNhiTieuHoa] = useState(initialData?.clinical_data?.clinical_exam?.nhi_tieu_hoa || '');
    const [nhiTietNieu, setNhiTietNieu] = useState(initialData?.clinical_data?.clinical_exam?.nhi_tiet_nieu || '');
    const [nhiThanKinh, setNhiThanKinh] = useState(initialData?.clinical_data?.clinical_exam?.nhi_than_kinh || '');
    const [nhiTamThan, setNhiTamThan] = useState(initialData?.clinical_data?.clinical_exam?.nhi_tam_than || '');
    const [nhiKhac, setNhiKhac] = useState(initialData?.clinical_data?.clinical_exam?.nhi_khac || '');
    const [milestoneCheck, setMilestoneCheck] = useState(initialData?.clinical_data?.extra?.milestone_check || '1');

    // 5. Paraclinical/Labs
    const [hemoglobin, setHemoglobin] = useState(initialData?.lab_data?.blood_test?.hemoglobin || '');
    const [glycemia, setGlycemia] = useState(initialData?.lab_data?.blood_test?.glycemia || '');
    const [protein, setProtein] = useState(initialData?.lab_data?.urine_test?.protein || '');
    
    // Xét nghiệm bổ sung QĐ 1551 (Lái xe, thuyền viên...)
    const [kqXnMaiTuy, setKqXnMaiTuy] = useState(initialData?.lab_data?.kq_xn_ma_tuy || '');
    const [kqXnNongDoCon, setKqXnNongDoCon] = useState(initialData?.lab_data?.kq_xn_nong_do_con || '');
    const [kqXnKhac, setKqXnKhac] = useState(initialData?.lab_data?.kq_xn_khac || '');

    // 6. Conclusion
    const [fitnessClass, setFitnessClass] = useState(initialData?.conclusion_data?.fitness_class || '');
    const [diagnosis, setDiagnosis] = useState(initialData?.conclusion_data?.diagnosis || '');
    const [cacVanDeLuuY, setCacVanDeLuuY] = useState(initialData?.conclusion_data?.cac_van_de_luu_y || '');
    const [cacBenhTatNeuCo, setCacBenhTatNeuCo] = useState(
        initialData?.conclusion_data?.cac_benh_tat_neu_co || 
        initialData?.conclusion_data?.CAC_BENH_TAT_NEU_CO || 
        initialData?.clinical_data?.extra?.cac_benh_tat_neu_co || ''
    );
    const [benhDangDieuTri, setBenhDangDieuTri] = useState(
        initialData?.clinical_data?.extra?.benh_dang_dieu_tri || 
        initialData?.clinical_data?.extra?.ten_thuoc || ''
    );
    const [tsbtDangDieuTriBenh, setTsbtDangDieuTriBenh] = useState(
        initialData?.clinical_data?.extra?.tsbt_dang_dieu_tri_benh || 
        (initialData?.clinical_data?.extra?.ts_mac_benh === 1 || initialData?.clinical_data?.extra?.ts_mac_benh === '1' ? '1' : '0')
    );
    const [quanLyBenh, setQuanLyBenh] = useState(initialData?.conclusion_data?.quan_ly_benh || '');
    const [theoDoiTai, setTheoDoiTai] = useState(initialData?.conclusion_data?.theo_doi_tai || '');
    const [chuyenTuyen, setChuyenTuyen] = useState(initialData?.conclusion_data?.chuyen_tuyen || '');

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Catalogs and additional locations
    const [wards, setWards] = useState<CatalogItem[]>([]);
    const [workplaces, setWorkplaces] = useState<CatalogItem[]>([]);

    // Specialized eye vision states (QĐ 1551 & Mẫu 4/5)
    const [xaKhongKinhMatPhai, setXaKhongKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.xa_khong_kinh_mat_phai || '');
    const [xaKhongKinhMatTrai, setXaKhongKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.xa_khong_kinh_mat_trai || '');
    const [xaKhongKinhHaiMat, setXaKhongKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.xa_khong_kinh_hai_mat || '');
    const [xaCoKinhMatPhai, setXaCoKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.xa_co_kinh_mat_phai || '');
    const [xaCoKinhMatTrai, setXaCoKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.xa_co_kinh_mat_trai || '');
    const [xaCoKinhHaiMat, setXaCoKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.xa_co_kinh_hai_mat || '');
    
    const [ganKhongKinhMatPhai, setGanKhongKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.gan_khong_kinh_mat_phai || '');
    const [ganKhongKinhMatTrai, setGanKhongKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.gan_khong_kinh_mat_trai || '');
    const [ganKhongKinhHaiMat, setGanKhongKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.gan_khong_kinh_hai_mat || '');
    const [ganCoKinhMatPhai, setGanCoKinhMatPhai] = useState(initialData?.clinical_data?.clinical_exam?.gan_co_kinh_mat_phai || '');
    const [ganCoKinhMatTrai, setGanCoKinhMatTrai] = useState(initialData?.clinical_data?.clinical_exam?.gan_co_kinh_mat_trai || '');
    const [ganCoKinhHaiMat, setGanCoKinhHaiMat] = useState(initialData?.clinical_data?.clinical_exam?.gan_co_kinh_hai_mat || '');
    
    const [khamMatThiTruongPhai, setKhamMatThiTruongPhai] = useState(initialData?.clinical_data?.clinical_exam?.kham_mat_thi_truong_phai || '');
    const [khamMatThiTruongTrai, setKhamMatThiTruongTrai] = useState(initialData?.clinical_data?.clinical_exam?.kham_mat_thi_truong_trai || '');

    // Specialized hearing/audiometry check states (QĐ 1551 & Mẫu 4/5)
    const [taiPhai500hz, setTaiPhai500hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_500hz || '');
    const [taiTrai500hz, setTaiTrai500hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_500hz || '');
    const [taiPhai2000hz, setTaiPhai2000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_2000hz || '');
    const [taiTrai2000hz, setTaiTrai2000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_2000hz || '');
    const [taiPhai3000hz, setTaiPhai3000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_3000hz || '');
    const [taiTrai3000hz, setTaiTrai3000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_3000hz || '');
    const [taiPhai4000hz, setTaiPhai4000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_4000hz || '');
    const [taiTrai4000hz, setTaiTrai4000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_4000hz || '');
    const [taiPhai6000hz, setTaiPhai6000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_phai_6000hz || '');
    const [taiTrai6000hz, setTaiTrai6000hz] = useState(initialData?.clinical_data?.clinical_exam?.tai_trai_6000hz || '');

    // Occupational & other extra states
    const [maCskcb, setMaCskcb] = useState(initialData?.clinical_data?.extra?.ma_cskcb || '');
    const [quocTich, setQuocTich] = useState(
        initialData?.clinical_data?.clinical_exam?.quoc_tich ||
        initialData?.clinical_data?.extra?.quoc_tich ||
        'VNM'
    );
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
    const [wardsNghMe, setWardsNghMe] = useState<CatalogItem[]>([]);

    // Clinical examinations detail (QĐ 1551 / Mẫu 4/5)
    const [thanKinhTamLy, setThanKinhTamLy] = useState(initialData?.clinical_data?.clinical_exam?.than_kinh_tam_ly || '');
    const [noiKhoaTamThan, setNoiKhoaTamThan] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_tam_than || '');
    const [noiKhoaThanKinh, setNoiKhoaThanKinh] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_than_kinh || '');
    const [tenThuoc, setTenThuoc] = useState(initialData?.clinical_data?.extra?.ten_thuoc || '');

    const [kqTamThan, setKqTamThan] = useState(initialData?.clinical_data?.clinical_exam?.kq_tam_than || '');
    const [kqThanKinh, setKqThanKinh] = useState(initialData?.clinical_data?.clinical_exam?.kq_than_kinh || '');
    const [kqTimMach, setKqTimMach] = useState(initialData?.clinical_data?.clinical_exam?.kq_tim_mach || '');
    const [kqHoHap, setKqHoHap] = useState(initialData?.clinical_data?.clinical_exam?.kq_ho_hap || '');
    const [kqNoiTiet, setKqNoiTiet] = useState(initialData?.clinical_data?.clinical_exam?.kq_noi_tiet || '');
    const [kqNgoaiKhoa, setKqNgoaiKhoa] = useState(initialData?.clinical_data?.clinical_exam?.kq_ngoai_khoa || '');
    const [kqDaLieu, setKqDaLieu] = useState(initialData?.clinical_data?.clinical_exam?.kq_da_lieu || '');
    const [kqTietNieu, setKqTietNieu] = useState(initialData?.clinical_data?.clinical_exam?.kq_tiet_nieu || '');
    const [kqSinhDuc, setKqSinhDuc] = useState(initialGynVal);
    const [kqTaiMuiHong, setKqTaiMuiHong] = useState(initialData?.clinical_data?.clinical_exam?.kq_tai_mui_hong || '');
    const [kqCoXuongKhop, setKqCoXuongKhop] = useState(initialData?.clinical_data?.clinical_exam?.kq_co_xuong_khop || '');
    const [kqNoiTietChuyenHoa, setKqNoiTietChuyenHoa] = useState(initialData?.clinical_data?.clinical_exam?.kq_noi_tiet_chuyen_hoa || '');
    const [duTieuChuanDkPtgtDuongSat, setDuTieuChuanDkPtgtDuongSat] = useState(initialData?.conclusion_data?.du_tieu_chuan_dk_ptgt_duong_sat || '');

    const [lucKeoThan, setLucKeoThan] = useState(initialData?.clinical_data?.extra?.luc_keo_than || '');
    const [haTamThu, setHaTamThu] = useState(initialData?.clinical_data?.examination?.ha_tam_thu || '');
    const [haTamTruong, setHaTamTruong] = useState(initialData?.clinical_data?.examination?.ha_tam_truong || '');
    const [nhipTim, setNhipTim] = useState(initialData?.clinical_data?.examination?.nhip_tim || '');
    const [timMach, setTimMach] = useState(initialData?.clinical_data?.clinical_exam?.tim_mach || '');
    const [hoHap, setHoHap] = useState(initialData?.clinical_data?.clinical_exam?.ho_hap || '');
    const [tietNieuSinhDuc, setTietNieuSinhDuc] = useState(initialData?.clinical_data?.clinical_exam?.tiet_nieu_sinh_duc || '');
    const [noiKhoaTieuHoa, setNoiKhoaTieuHoa] = useState(initialData?.clinical_data?.clinical_exam?.noi_khoa_tieu_hoa || '');
    const [ganMat, setGanMat] = useState(initialData?.clinical_data?.clinical_exam?.gan_mat || '');
    const [mauCoQuanTaoMau, setMauCoQuanTaoMau] = useState(initialData?.clinical_data?.clinical_exam?.mau_co_quan_tao_mau || '');
    const [daToChucDuoiDa, setDaToChucDuoiDa] = useState(initialData?.clinical_data?.clinical_exam?.da_to_chuc_duoi_da || '');
    const [kqCoXuongKhopM5, setKqCoXuongKhopM5] = useState(initialData?.clinical_data?.clinical_exam?.kq_co_xuong_khop_m5 || '');
    const [thanKinhM5, setThanKinhM5] = useState(initialData?.clinical_data?.clinical_exam?.than_kinh_m5 || '');
    const [maBenhNgoaiKhoa, setMaBenhNgoaiKhoa] = useState(initialData?.clinical_data?.clinical_exam?.ma_benh_ngoai_khoa || '');
    const [khamTaiMuiHongM5, setKhamTaiMuiHongM5] = useState(initialData?.clinical_data?.clinical_exam?.kham_tai_mui_hong_m5 || '');
    const [khamMatM5, setKhamMatM5] = useState(initialData?.clinical_data?.clinical_exam?.kham_mat_m5 || '');
    const [benhKhac, setBenhKhac] = useState(initialData?.clinical_data?.clinical_exam?.benh_khac || '');
    const [khamMatThiGiacMau, setKhamMatThiGiacMau] = useState(initialData?.clinical_data?.clinical_exam?.kham_mat_thi_giac_mau || '');

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
    const [rpr, setRpr] = useState(initialData?.lab_data?.blood_test?.rpr || '');
    const [tpha, setTpha] = useState(initialData?.lab_data?.blood_test?.tpha || '');
    const [hbsag, setHbsag] = useState(initialData?.lab_data?.blood_test?.hbsag || '');
    const [hbeag, setHbeag] = useState(initialData?.lab_data?.blood_test?.hbeag || '');
    const [hcvab, setHcvab] = useState(initialData?.lab_data?.blood_test?.hcvab || '');
    const [havab, setHavab] = useState(initialData?.lab_data?.blood_test?.havab || '');
    const [hiv, setHiv] = useState(initialData?.lab_data?.blood_test?.hiv || '');
    const [xnKhac, setXnKhac] = useState(initialData?.lab_data?.xn_khac || '');
    const [nongDoConMau, setNongDoConMau] = useState(initialData?.lab_data?.nong_do_con_mau || '');
    const [nuocTieuMaTuy, setNuocTieuMaTuy] = useState(initialData?.lab_data?.nuoc_tieu_test_nhanh?.ma_tuy || '');
    const [nuocTieuAmphetamine, setNuocTieuAmphetamine] = useState(initialData?.lab_data?.nuoc_tieu_test_nhanh?.amphetamine || '');
    const [nuocTieuDuong, setNuocTieuDuong] = useState(initialData?.lab_data?.nuoc_tieu_test_nhanh?.duong || '');
    const [nuocTieuProtein, setNuocTieuProtein] = useState(initialData?.lab_data?.nuoc_tieu_test_nhanh?.protein || '');
    const [nuocTieuKhac, setNuocTieuKhac] = useState(initialData?.lab_data?.nuoc_tieu_test_nhanh?.khac || '');
 
    // Diagnostics & Imaging
    const [ketQuaChanDoanHinhAnh, setKetQuaChanDoanHinhAnh] = useState(initialData?.lab_data?.imaging?.ket_qua || '');
    const [ketQuaDienTim, setKetQuaDienTim] = useState(initialData?.lab_data?.ecg?.ket_qua || '');
    const [chucNangHoHap, setChucNangHoHap] = useState(initialData?.lab_data?.spiro?.ket_qua || '');
    const [ketQuaSieuAmBung, setKetQuaSieuAmBung] = useState(initialData?.lab_data?.us?.ket_qua || '');
 
    // Conclusion extra
    const [khaNangChiuSong, setKhaNangChiuSong] = useState(initialData?.conclusion_data?.kha_nang_chiu_song || '');
    const [hanChe, setHanChe] = useState(initialData?.conclusion_data?.han_che || '');
    const [yeuCauDeoKinh, setYeuCauDeoKinh] = useState(initialData?.conclusion_data?.yeu_cau_deo_kinh || '');
    const [vongNgucTrungBinh, setVongNgucTrungBinh] = useState(initialData?.clinical_data?.examination?.vong_nguc_tb || '');
    const [noiTietDinhDuongChuyenHoa, setNoiTietDinhDuongChuyenHoa] = useState(initialData?.clinical_data?.clinical_exam?.noi_tiet_dinh_duong_chuyen_hoa || '');
    const [roiLoanHanhViTamThan, setRoiLoanHanhViTamThan] = useState(initialData?.clinical_data?.clinical_exam?.roi_loan_hanh_vi_tam_than || '');
    const [ketLuanLoaiSucKhoe, setKetLuanLoaiSucKhoe] = useState(initialData?.conclusion_data?.ket_luan_loai_suc_khoe || '');
    const [conclusionDoctorId, setConclusionDoctorId] = useState(initialData?.conclusion_data?.doctor_id || '');

    // Dynamic services state (paraclinical grid)
    const [paraclinicalItems, setParaclinicalItems] = useState<any[]>(initialData?.lab_data?.paraclinical_items || []);
    const [labSubTab, setLabSubTab] = useState<'XN' | 'HA' | 'TD'>('XN');

    // Workflow optimizations
    const [isLocked, setIsLocked] = useState(initialData?.status === 'ĐÃ_KẾT_LUẬN' || initialData?.signature_status === 'Signed' || initialData?.is_locked || false);
    const [specialtyMetadata, setSpecialtyMetadata] = useState<Record<string, { doctorId: string, status: string, updatedAt: string }>>(initialData?.clinical_data?.clinical_exam?.specialty_metadata || initialData?.specialty_metadata || {});
    const specialtyMetadataRef = useRef(specialtyMetadata);
    useEffect(() => {
        specialtyMetadataRef.current = specialtyMetadata;
    }, [specialtyMetadata]);
    const [doctors, setDoctors] = useState<CatalogItem[]>([]);
    const [hisSource, setHisSource] = useState<'HEALTH_CHECK_MASTER' | 'HIS_DIRECT' | null>(initialData?.id ? 'HEALTH_CHECK_MASTER' : null);

    const handleFetchHisData = async () => {
        if (!hisSearchQuery.trim()) {
            setHisSyncMessage({ type: 'error', text: 'Vui lòng nhập Số CCCD, Mã hồ sơ hoặc Số điện thoại để tìm kiếm từ HIS' });
            return;
        }
        setIsFetchingHis(true);
        setHisSyncMessage(null);
        try {
            const data = await healthCheckService.getHisPatient(hisSearchQuery.trim());
            if (data) {
                if (data.source) {
                    setHisSource(data.source);
                }
                // Đổ dữ liệu hành chính
                if (data.patient_id) setPatientId(data.patient_id);
                if (data.patient_name) setPatientName(data.patient_name.toUpperCase());
                if (data.doc_no) {
                    setDocNo(data.doc_no);
                }
                if (data.cccd) setCccd(data.cccd);
                if (data.dob) setDob(formatDateForInput(data.dob));
                if (data.gender) setGender(data.gender);
                if (data.clinical_data?.address) setAddress(data.clinical_data.address);
                if (data.clinical_data?.phone) setPhone(data.clinical_data.phone);
                if (data.clinical_data?.ethnic) setEthnic(data.clinical_data.ethnic);
                if (data.clinical_data?.cccd_date) setCccdDate(formatDateForInput(data.clinical_data.cccd_date));
                if (data.clinical_data?.blood_group) setBloodGroup(data.clinical_data.blood_group);
                if (data.clinical_data?.target_group) setTargetGroup(data.clinical_data.target_group);
                if (data.clinical_data?.ma_gtin_cskcb) setMaGtinCskcb(data.clinical_data.ma_gtin_cskcb);
                if (data.clinical_data?.matinh_cu_tru) setMaTinhCuTru(data.clinical_data.matinh_cu_tru);
                if (data.clinical_data?.maxa_cu_tru) setMaXaCuTru(data.clinical_data.maxa_cu_tru);
                if (data.clinical_data?.ly_do_vv) setLyDoVv(data.clinical_data.ly_do_vv);
                if (data.clinical_data?.ngay_vao || data.clinical_data?.extra?.ngay_kham) {
                    const rawDate = data.clinical_data.ngay_vao || data.clinical_data.extra?.ngay_kham;
                    setNgayVao(formatDateForInput(rawDate));
                }
                if (data.clinical_data?.extra?.gio_kham || data.clinical_data?.gio_kham) {
                    setGioKham(String(data.clinical_data.extra?.gio_kham || data.clinical_data?.gio_kham));
                }
                
                // Đổ dữ liệu thể lực / sinh hiệu từ HIS
                if (data.clinical_data?.examination?.height) setHeight(String(data.clinical_data.examination.height));
                if (data.clinical_data?.examination?.weight) setWeight(String(data.clinical_data.examination.weight));
                if (data.clinical_data?.examination?.blood_pressure || data.clinical_data?.examination?.bp) {
                    setBp(String(data.clinical_data.examination.blood_pressure || data.clinical_data.examination.bp));
                }
                if (data.clinical_data?.examination?.pulse) setPulse(String(data.clinical_data.examination.pulse));
                if (data.clinical_data?.examination?.temperature || data.clinical_data?.examination?.nhiet_do || data.clinical_data?.extra?.nhiet_do) {
                    setNhietDo(String(data.clinical_data.examination.temperature || data.clinical_data.examination.nhiet_do || data.clinical_data.extra?.nhiet_do));
                }
                if (data.clinical_data?.examination?.breathing_rate || data.clinical_data?.examination?.nhip_tho || data.clinical_data?.extra?.nhip_tho) {
                    setNhipTho(String(data.clinical_data.examination.breathing_rate || data.clinical_data.examination.nhip_tho || data.clinical_data.extra?.nhip_tho));
                }
                if (data.clinical_data?.examination?.bmi || data.clinical_data?.extra?.bmi) {
                    setBmi(String(data.clinical_data.examination.bmi || data.clinical_data.extra?.bmi));
                }
                
                // Đổ dữ liệu khám lâm sàng chuyên khoa chi tiết
                if (data.clinical_data?.clinical_exam?.internal) setInternalExam(data.clinical_data.clinical_exam.internal);
                if (data.clinical_data?.clinical_exam?.eye) setEyeExam(data.clinical_data.clinical_exam.eye);
                if (data.clinical_data?.clinical_exam?.ent) setEntExam(data.clinical_data.clinical_exam.ent);
                if (data.clinical_data?.clinical_exam?.dental) setDentalExam(data.clinical_data.clinical_exam.dental);
                if (data.clinical_data?.clinical_exam?.external) setExternalExam(data.clinical_data.clinical_exam.external);
                if (data.clinical_data?.clinical_exam?.dermatology) setDermatologyExam(data.clinical_data.clinical_exam.dermatology);
                const loadedGyn = data.clinical_data?.clinical_exam?.gynecology || data.clinical_data?.clinical_exam?.kham_san_phu_khoa || data.clinical_data?.clinical_exam?.kq_sinh_duc || data.clinical_data?.clinical_exam?.ket_qua_kham_san_phu_khoa;
                if (loadedGyn) {
                    setGynExam(loadedGyn);
                    setKqSinhDuc(loadedGyn);
                }
                
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
                if (data.clinical_data?.clinical_exam?.benh_khac_mat) setBenhKhacMat(data.clinical_data.clinical_exam.benh_khac_mat);
                if (data.clinical_data?.clinical_exam?.benh_khac_tai_mui_hong) setBenhKhacTaiMuiHong(data.clinical_data.clinical_exam.benh_khac_tai_mui_hong);
                if (data.clinical_data?.clinical_exam?.benh_khac_rang_ham_mat) setBenhKhacRangHamMat(data.clinical_data.clinical_exam.benh_khac_rang_ham_mat);

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
                if (data.clinical_data?.clinical_exam?.kq_sinh_duc) {
                    setKqSinhDuc(data.clinical_data.clinical_exam.kq_sinh_duc);
                    setGynExam(data.clinical_data.clinical_exam.kq_sinh_duc);
                }
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
                if (data.clinical_data?.clinical_exam?.specialty_metadata) setSpecialtyMetadata(data.clinical_data.clinical_exam.specialty_metadata);
                
                // Đổ kết luận
                if (data.conclusion_data?.fitness_class) setFitnessClass(data.conclusion_data.fitness_class);
                if (data.conclusion_data?.diagnosis) setDiagnosis(data.conclusion_data.diagnosis);
                if (data.conclusion_data?.cac_van_de_luu_y) setCacVanDeLuuY(data.conclusion_data.cac_van_de_luu_y);
                if (data.conclusion_data?.cac_benh_tat_neu_co || data.conclusion_data?.CAC_BENH_TAT_NEU_CO) {
                    setCacBenhTatNeuCo(data.conclusion_data.cac_benh_tat_neu_co || data.conclusion_data.CAC_BENH_TAT_NEU_CO);
                }
                if (data.clinical_data?.extra?.tsgd_mac_benh) setTsgdMacBenh(data.clinical_data.extra.tsgd_mac_benh);
                if (data.clinical_data?.extra?.tsgd_ma_benh) setTsgdMaBenh(data.clinical_data.extra.tsgd_ma_benh);
                if (data.clinical_data?.extra?.ts_mac_benh !== undefined && data.clinical_data?.extra?.ts_mac_benh !== null) {
                    setTsMacBenh(Number(data.clinical_data.extra.ts_mac_benh));
                } else if (data.clinical_data?.extra?.tsbt_dang_dieu_tri_benh) {
                    setTsMacBenh(data.clinical_data.extra.tsbt_dang_dieu_tri_benh === '1' ? 1 : 0);
                }
                if (data.clinical_data?.extra?.tsbt_ma_benh) setTsbtMaBenh(data.clinical_data.extra.tsbt_ma_benh);
                if (data.clinical_data?.extra?.tsbt_ma_benh_khac) setTsbtMaBenhKhac(data.clinical_data.extra.tsbt_ma_benh_khac);
                if (data.clinical_data?.extra?.tsbt_thai_san) setTsbtThaiSan(data.clinical_data.extra.tsbt_thai_san);
                if (data.clinical_data?.extra?.tsbt_ma_benh_thai_san) setTsbtMaBenhThaiSan(data.clinical_data.extra.tsbt_ma_benh_thai_san);
                if (data.clinical_data?.extra?.tsbt_ten_thuoc_thai_san) setTsbtTenThuocThaiSan(data.clinical_data.extra.tsbt_ten_thuoc_thai_san);
                if (data.clinical_data?.extra?.benh_dang_dieu_tri) setBenhDangDieuTri(data.clinical_data.extra.benh_dang_dieu_tri);
                if (data.clinical_data?.extra?.tsbt_dang_dieu_tri_benh) setTsbtDangDieuTriBenh(data.clinical_data.extra.tsbt_dang_dieu_tri_benh);
                if (data.clinical_data?.extra?.nhi_khoa_lam_sang_khac) setNhiKhoaLamSangKhac(data.clinical_data.extra.nhi_khoa_lam_sang_khac);
                if (data.conclusion_data?.doctor_id) setConclusionDoctorId(data.conclusion_data.doctor_id);
                if (data.conclusion_data?.du_tieu_chuan_dk_ptgt_duong_sat) setDuTieuChuanDkPtgtDuongSat(data.conclusion_data.du_tieu_chuan_dk_ptgt_duong_sat);
                if (data.conclusion_data?.kha_nang_chiu_song) setKhaNangChiuSong(data.conclusion_data.kha_nang_chiu_song);
                if (data.conclusion_data?.han_che) setHanChe(data.conclusion_data.han_che);
                if (data.conclusion_data?.yeu_cau_deo_kinh) setYeuCauDeoKinh(data.conclusion_data.yeu_cau_deo_kinh);
                if (data.conclusion_data?.ket_luan_loai_suc_khoe) setKetLuanLoaiSucKhoe(data.conclusion_data.ket_luan_loai_suc_khoe);
                if (data.conclusion_data?.quan_ly_benh) setQuanLyBenh(data.conclusion_data.quan_ly_benh);
                if (data.conclusion_data?.theo_doi_tai) setTheoDoiTai(data.conclusion_data.theo_doi_tai);
                if (data.conclusion_data?.chuyen_tuyen) setChuyenTuyen(data.conclusion_data.chuyen_tuyen);

                // Tự động nhận diện và chuyển đổi Mẫu biểu áp dụng theo độ tuổi
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
                if (targetForm && onChangeFormType && targetForm !== formType) {
                    console.log(`🔄 [Auto-switch Form] Đổi từ Mẫu ${formType} sang Mẫu ${targetForm} cho BN: ${data.patient_name}`);
                    onChangeFormType(targetForm);
                }

                if (data.source === 'HIS_DIRECT') {
                    setHisSyncMessage({ 
                        type: 'success', 
                        text: `🔵 Nạp đợt khám trực tiếp từ HIS cho BN: ${data.patient_name} (Mã lượt khám: ${data.doc_no})! Đã tự động áp dụng Mẫu ${targetForm || formType}.` 
                    });
                } else {
                    setHisSyncMessage({ 
                        type: 'success', 
                        text: `🟢 Tải thành công hồ sơ KSK VNeID đã lưu của BN: ${data.patient_name} (Mẫu ${targetForm || formType})!` 
                    });
                }
            } else {
                setHisSyncMessage({ type: 'error', text: 'Không tìm thấy hồ sơ KSK đã tiếp nhận cho bệnh nhân này.' });
            }
        } catch (error: any) {
            setHisSyncMessage({ type: 'error', text: 'Lỗi khi tìm kiếm dữ liệu: ' + (error.response?.data?.error || error.message) });
        } finally {
            setIsFetchingHis(false);
        }
    };

    const [isSyncingParaclinical, setIsSyncingParaclinical] = useState(false);

    const handleSyncParaclinical = async () => {
        const identifier = patientId || cccd || (docNo ? docNo.split('-').pop() : '');
        if (!identifier) {
            setHisSyncMessage({ type: 'error', text: 'Không tìm thấy mã định danh hoặc số hồ sơ bệnh nhân để thực hiện đồng bộ.' });
            return;
        }

        setIsSyncingParaclinical(true);
        setHisSyncMessage(null);
        try {
            const data = await healthCheckService.getHisPatient(identifier);
            if (data && data.lab_data) {
                const lab = data.lab_data;

                // Cập nhật các trường cận lâm sàng cốt lõi
                if (lab.blood_test?.hemoglobin !== undefined) setHemoglobin(lab.blood_test.hemoglobin || '');
                if (lab.blood_test?.glycemia !== undefined) setGlycemia(lab.blood_test.glycemia || '');
                if (lab.urine_test?.protein !== undefined) setProtein(lab.urine_test.protein || '');
                if (lab.kq_xn_ma_tuy !== undefined) setKqXnMaiTuy(lab.kq_xn_ma_tuy || '');
                if (lab.kq_xn_nong_do_con !== undefined) setKqXnNongDoCon(lab.kq_xn_nong_do_con || '');
                if (lab.kq_xn_khac !== undefined) setKqXnKhac(lab.kq_xn_khac || '');

                if (lab.blood_test?.chi_so_hc !== undefined) setChiSoHc(lab.blood_test.chi_so_hc || '');
                if (lab.blood_test?.chi_so_bach_cau !== undefined) setChiSoBachCau(lab.blood_test.chi_so_bach_cau || '');
                if (lab.blood_test?.chi_so_tieu_cau !== undefined) setChiSoTieuCau(lab.blood_test.chi_so_tieu_cau || '');
                if (lab.blood_test?.cong_thuc_bc !== undefined) setCongThucBc(lab.blood_test.cong_thuc_bc || '');
                if (lab.blood_test?.thoi_gian_howell !== undefined) setThoiGianHowell(lab.blood_test.thoi_gian_howell || '');

                if (lab.blood_test?.cholesterol !== undefined) setCholesterol(lab.blood_test.cholesterol || '');
                if (lab.blood_test?.triglycerid !== undefined) setTriglycerid(lab.blood_test.triglycerid || '');
                if (lab.blood_test?.hdl !== undefined) setHdl(lab.blood_test.hdl || '');
                if (lab.blood_test?.ldl !== undefined) setLdl(lab.blood_test.ldl || '');
                if (lab.blood_test?.rpr !== undefined) setRpr(lab.blood_test.rpr || '');
                if (lab.blood_test?.tpha !== undefined) setTpha(lab.blood_test.tpha || '');
                if (lab.blood_test?.hbsag !== undefined) setHbsag(lab.blood_test.hbsag || '');
                if (lab.blood_test?.hbeag !== undefined) setHbeag(lab.blood_test.hbeag || '');
                if (lab.blood_test?.hcvab !== undefined) setHcvab(lab.blood_test.hcvab || '');
                if (lab.blood_test?.havab !== undefined) setHavab(lab.blood_test.havab || '');
                if (lab.blood_test?.hiv !== undefined) setHiv(lab.blood_test.hiv || '');

                if (lab.xn_khac !== undefined) setXnKhac(lab.xn_khac || '');
                if (lab.nong_do_con_mau !== undefined) setNongDoConMau(lab.nong_do_con_mau || '');
                if (lab.nuoc_tieu_test_nhanh?.ma_tuy !== undefined) setNuocTieuMaTuy(lab.nuoc_tieu_test_nhanh.ma_tuy || '');
                if (lab.nuoc_tieu_test_nhanh?.amphetamine !== undefined) setNuocTieuAmphetamine(lab.nuoc_tieu_test_nhanh.amphetamine || '');
                if (lab.nuoc_tieu_test_nhanh?.duong !== undefined) setNuocTieuDuong(lab.nuoc_tieu_test_nhanh.duong || '');
                if (lab.nuoc_tieu_test_nhanh?.protein !== undefined) setNuocTieuProtein(lab.nuoc_tieu_test_nhanh.protein || '');
                if (lab.nuoc_tieu_test_nhanh?.khac !== undefined) setNuocTieuKhac(lab.nuoc_tieu_test_nhanh.khac || '');

                if (lab.imaging?.ket_qua !== undefined) setKetQuaChanDoanHinhAnh(lab.imaging.ket_qua || '');
                if (lab.ecg?.ket_qua !== undefined) setKetQuaDienTim(lab.ecg.ket_qua || '');
                if (lab.spiro?.ket_qua !== undefined) setChucNangHoHap(lab.spiro.ket_qua || '');
                if (lab.us?.ket_qua !== undefined) setKetQuaSieuAmBung(lab.us.ket_qua || '');

                if (Array.isArray(lab.paraclinical_items)) {
                    setParaclinicalItems(lab.paraclinical_items);
                    syncGridToCoreFields(lab.paraclinical_items);
                }

                setHisSyncMessage({ type: 'success', text: "Đồng bộ thành công chỉ định và kết quả cận lâm sàng mới nhất từ HIS!" });
            } else {
                setHisSyncMessage({ type: 'error', text: "Không tìm thấy kết quả cận lâm sàng của bệnh nhân này trên HIS." });
            }
        } catch (error: any) {
            console.error("Failed to sync paraclinical from HIS:", error);
            setHisSyncMessage({ type: 'error', text: "Lỗi khi đồng bộ dữ liệu cận lâm sàng từ HIS: " + (error.response?.data?.error || error.message) });
        } finally {
            setIsSyncingParaclinical(false);
        }
    };

    const handleAutofillTab = (tabKey: string) => {
        if (tabKey === 'admin') {
            if (!gender) setGender('Nam');
            if (!bloodGroup) setBloodGroup('O');
            if (!targetGroup) setTargetGroup('13');
            if (!fundingSource) setFundingSource('4');
        } else if (tabKey === 'history') {
            if (!tsgdMacBenh) setTsgdMacBenh('0');
            if (!tiemChungBcg) setTiemChungBcg('1');
            if (!tiemChungBhHgUv) setTiemChungBhHgUv('1');
            if (!tiemChungSoi) setTiemChungSoi('1');
            if (!tiemChungBaiLiet) setTiemChungBaiLiet('1');
            if (!tiemChungVnnbB) setTiemChungVnnbB('1');
            if (!tiemChungVgb) setTiemChungVgb('1');
            if (!tiemChungCacLoaiKhac) setTiemChungCacLoaiKhac('0');
            if (gender === 'Nữ') {
                if (!tinhChatKinhNguyet) setTinhChatKinhNguyet('1');
                if (!dauBungKinh) setDauBungKinh('0');
                if (!daLapGiaDinh) setDaLapGiaDinh('0');
                if (!dangApDungBpttKhong) setDangApDungBpttKhong('0');
                if (!daTungMoSanPhuKhoaChua) setDaTungMoSanPhuKhoaChua('0');
            }
        } else if (tabKey === 'exam') {
            // Physical defaults
            if (!height) setHeight('168');
            if (!weight) setWeight('60');
            if (!pulse) setPulse('75');
            if (!bp) setBp('120/80');
            if (!khamTheLucPl) setKhamTheLucPl('1');
            if (isChild && !sinhNon) setSinhNon('0');

            // Specialty categories Pl
            if (!noiKhoaTuanHoanPl) setNoiKhoaTuanHoanPl('1');
            if (!noiKhoaHoHapPl) setNoiKhoaHoHapPl('1');
            if (!noiKhoaTieuHoaPl) setNoiKhoaTieuHoaPl('1');
            if (!noiKhoaThanTietnieuPl) setNoiKhoaThanTietnieuPl('1');
            if (!noiKhoaNoiTietPl) setNoiKhoaNoiTietPl('1');
            if (!noiKhoaCoXuongKhopPl) setNoiKhoaCoXuongKhopPl('1');
            if (!noiKhoaThanKinhPl) setNoiKhoaThanKinhPl('1');
            if (!noiKhoaTamThanPl) setNoiKhoaTamThanPl('1');
            if (!khamNgoaiKhoaPl) setKhamNgoaiKhoaPl('1');
            if (!khamDaLieuPl) setKhamDaLieuPl('1');
            if (!khamSanPhuKhoaPl) setKhamSanPhuKhoaPl('1');
            if (!khamMatPl) setKhamMatPl('1');
            if (!khamTaiMuiHongPl) setKhamTaiMuiHongPl('1');
            if (!khamRangHamMatPl) setKhamRangHamMatPl('1');

            // Detail strings
            if (!timMach) setTimMach('Bình thường');
            if (!hoHap) setHoHap('Bình thường');
            if (!noiKhoaTieuHoa) setNoiKhoaTieuHoa('Bình thường');
            if (!ganMat) setGanMat('Bình thường');
            if (!mauCoQuanTaoMau) setMauCoQuanTaoMau('Bình thường');
            if (!daToChucDuoiDa) setDaToChucDuoiDa('Bình thường');
            if (!kqCoXuongKhopM5) setKqCoXuongKhopM5('Bình thường');
            if (!thanKinhM5) setThanKinhM5('Bình thường');
            if (!khamTaiMuiHongM5) setKhamTaiMuiHongM5('Bình thường');
            if (!khamMatM5) setKhamMatM5('Bình thường');
            if (!khamMatThiGiacMau) setKhamMatThiGiacMau('1');
            if (!noiTietDinhDuongChuyenHoa) setNoiTietDinhDuongChuyenHoa('Bình thường');
            if (!roiLoanHanhViTamThan) setRoiLoanHanhViTamThan('Bình thường');

            // Detail texts for forms
            if (!internalExam) setInternalExam('Tim đều, phổi trong, các cơ quan bình thường.');
            if (!externalExam) setExternalExam('Hệ vận động, xương khớp bình thường.');
            if (!eyeExam) setEyeExam('Mắt sáng, không đỏ, kết mạc bình thường.');
            if (!entExam) setEntExam('Tai sạch, màng nhĩ hai bên bình thường.');
            if (!dentalExam) setDentalExam('Răng đều, không sâu, niêm mạc sạch.');
            if (!dermatologyExam) setDermatologyExam('Da sạch, không sẹo lồi, không nấm ngứa.');
            if (!gynExam && !kqSinhDuc) {
                setGynExam('Cơ quan sinh dục ngoài bình thường.');
                setKqSinhDuc('Cơ quan sinh dục ngoài bình thường.');
            }

            // Measurements
            if (!taiPhaiNoiThuong) setTaiPhaiNoiThuong('5');
            if (!taiPhaiNoiTham) setTaiPhaiNoiTham('0.5');
            if (!taiTraiNoiThuong) setTaiTraiNoiThuong('5');
            if (!taiTraiNoiTham) setTaiTraiNoiTham('0.5');
            if (!hamTren) setHamTren('Bình thường');
            if (!hamDuoi) setHamDuoi('Bình thường');

            // Vision
            if (!khongKinhMatPhai) setKhongKinhMatPhai('10/10');
            if (!khongKinhMatTrai) setKhongKinhMatTrai('10/10');
            if (!khongKinhHaiMat) setKhongKinhHaiMat('10/10');
            if (!sacGiac) setSacGiac('0');
            if (!thiTruongNgangHaiMat) setThiTruongNgangHaiMat('Bình thường');
            if (!thiTruongDungHaiMat) setThiTruongDungHaiMat('Bình thường');
        } else if (tabKey === 'lab') {
            if (!rpr) setRpr('0');
            if (!tpha) setTpha('0');
            if (!hbsag) setHbsag('0');
            if (!hbeag) setHbeag('0');
            if (!havab) setHavab('0');
            if (!hcvab) setHcvab('0');
            if (!hiv) setHiv('0');
            if (!nuocTieuMaTuy) setNuocTieuMaTuy('0');
            if (!nuocTieuAmphetamine) setNuocTieuAmphetamine('0');
            if (!nongDoConMau) setNongDoConMau('0');
            if (!kqXnMaiTuy) setKqXnMaiTuy('Âm tính');
            if (!kqXnNongDoCon) setKqXnNongDoCon('0');
            if (!nuocTieuDuong) setNuocTieuDuong('Âm tính (-)');
            if (!nuocTieuProtein) setNuocTieuProtein('Âm tính (-)');
            if (!ketQuaChanDoanHinhAnh) setKetQuaChanDoanHinhAnh('Bình thường');
            if (!ketQuaDienTim) setKetQuaDienTim('Nhịp xoang đều');
            if (!chucNangHoHap) setChucNangHoHap('Bình thường');
            if (!ketQuaSieuAmBung) setKetQuaSieuAmBung('Bình thường');
        } else if (tabKey === 'conclusion') {
            if (!khaNangChiuSong) setKhaNangChiuSong('1');
            if (!hanChe) setHanChe('0');
            if (!yeuCauDeoKinh) setYeuCauDeoKinh('0');
            if (!duTieuChuanDkPtgtDuongSat) setDuTieuChuanDkPtgtDuongSat('1');
        }
    };

    // Auto suggest physical class based on BMI, BP and Pulse
    useEffect(() => {
        if (!height || !weight) return;
        const hMeter = parseFloat(height) / 100;
        const wKg = parseFloat(weight);
        if (hMeter > 0 && wKg > 0) {
            const calculatedBmi = wKg / (hMeter * hMeter);
            setBmi(calculatedBmi.toFixed(1));
            
            // Auto suggest category
            let suggestedPl = '1';
            
            // Check BP
            if (bp) {
                const bpParts = bp.split('/');
                if (bpParts.length === 2) {
                    const sys = parseInt(bpParts[0]);
                    const dia = parseInt(bpParts[1]);
                    if (sys >= 160 || dia >= 100) {
                        suggestedPl = '4';
                    } else if (sys >= 140 || dia >= 90) {
                        suggestedPl = '3';
                    } else if (sys >= 130 || dia >= 85) {
                        suggestedPl = '2';
                    }
                }
            }
            
            // Check BMI
            const bmiVal = calculatedBmi;
            if (bmiVal >= 30.0) {
                suggestedPl = String(Math.max(parseInt(suggestedPl), 3));
            } else if (bmiVal >= 25.0 || bmiVal < 18.5) {
                suggestedPl = String(Math.max(parseInt(suggestedPl), 2));
            }
            
            // Only update if currently blank
            if (khamTheLucPl === '') {
                setKhamTheLucPl(suggestedPl);
            }
        }
    }, [height, weight, bp, khamTheLucPl]);

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
        healthCheckService.getSettings().then(settings => {
            if (settings) {
                if (!initialData?.clinical_data?.extra?.ma_cskcb) {
                    setMaCskcb(settings.ma_cskcb || '');
                }
                if (!initialData?.clinical_data?.ma_gtin_cskcb) {
                    setMaGtinCskcb(settings.ma_gtin_cskcb || '');
                }
            }
        }).catch(err => console.error("Failed to load settings in DynamicForm:", err));
    }, [initialData]);

    const hasCalculatedRef = useRef<string | null>(null);

    // Auto-calculate statuses from initialData on mount if they are not set or 'CHUA_KHAM'
    useEffect(() => {
        if (!initialData) return;
        
        // Only run this auto-calculation once per document ID to prevent overwriting user changes on save
        const docId = initialData.id?.toString() || 'new';
        if (hasCalculatedRef.current === docId) return;
        hasCalculatedRef.current = docId;

        const savedMetadata = initialData?.clinical_data?.clinical_exam?.specialty_metadata || initialData?.specialty_metadata || {};
        setSpecialtyMetadata(() => {
            const updated = { ...savedMetadata };
            const keys = ['admin', 'history', 'internal', 'eye', 'ent', 'dental', 'external', 'dermatology', 'gynecology', 'lab', 'conclusion'];
            
            keys.forEach(key => {
                const current = updated[key];
                if (!current || current.status === 'CHUA_KHAM' || !current.status) {
                    let hasData = false;
                    if (key === 'admin') {
                        hasData = !!(initialData.patient_id || initialData.patient_name);
                    } else if (key === 'history') {
                        const ext = initialData.clinical_data?.extra || {};
                        hasData = !!(ext.tsgd_mac_benh || ext.tsgd_ma_benh || ext.tsbt_ma_benh || ext.ts_benh_thuong_5_nam || initialData.clinical_data?.examination?.height);
                    } else if (key === 'internal') {
                        hasData = !!(initialData.clinical_data?.clinical_exam?.internal || initialData.clinical_data?.clinical_exam?.noi_khoa_tuan_hoan_pl);
                    } else if (key === 'eye') {
                        hasData = !!(initialData.clinical_data?.clinical_exam?.eye || initialData.clinical_data?.clinical_exam?.kham_mat_pl);
                    } else if (key === 'ent') {
                        hasData = !!(initialData.clinical_data?.clinical_exam?.ent || initialData.clinical_data?.clinical_exam?.kham_tai_mui_hong_pl);
                    } else if (key === 'dental') {
                        hasData = !!(initialData.clinical_data?.clinical_exam?.dental || initialData.clinical_data?.clinical_exam?.kham_rang_ham_mat_pl);
                    } else if (key === 'external') {
                        hasData = !!(initialData.clinical_data?.clinical_exam?.external || initialData.clinical_data?.clinical_exam?.kham_ngoai_khoa_pl);
                    } else if (key === 'dermatology') {
                        hasData = !!(initialData.clinical_data?.clinical_exam?.dermatology || initialData.clinical_data?.clinical_exam?.kham_da_lieu_pl);
                    } else if (key === 'gynecology') {
                        hasData = !!(initialData.clinical_data?.clinical_exam?.gynecology || initialData.clinical_data?.clinical_exam?.kham_san_phu_khoa || initialData.clinical_data?.clinical_exam?.kq_sinh_duc || initialData.clinical_data?.clinical_exam?.ket_qua_kham_san_phu_khoa || initialData.clinical_data?.clinical_exam?.kham_san_phu_khoa_pl);
                    } else if (key === 'lab') {
                        const lab = initialData.lab_data || {};
                        hasData = !!(lab.blood_test?.hemoglobin || lab.blood_test?.glycemia || lab.urine_test?.protein || lab.kq_xn_ma_tuy || lab.kq_xn_nong_do_con || lab.kq_xn_khac || (lab.paraclinical_items && lab.paraclinical_items.length > 0));
                    } else if (key === 'conclusion') {
                        hasData = !!(initialData.conclusion_data?.fitness_class || initialData.conclusion_data?.diagnosis || initialData.conclusion_data?.ket_luan_loai_suc_khoe);
                    }
                    
                    if (hasData) {
                        updated[key] = {
                            doctorId: current?.doctorId || '',
                            doctorName: current?.doctorName || '',
                            status: key === 'conclusion' ? 'ĐÃ_KẾT_LUẬN' : 'ĐÃ_KHÁM',
                            updatedAt: current?.updatedAt || new Date().toISOString()
                        };
                    }
                }
            });
            return updated;
        });
    }, [initialData]);

    useEffect(() => {
        if (!conclusionDoctorId && user?.userId) {
            setConclusionDoctorId(user.userId);
        }
    }, [user, conclusionDoctorId]);

    // Auto-select logged-in user as doctor for unexamined specialties
    useEffect(() => {
        if (!user || doctors.length === 0) return;

        // Fallback to previous doctor if patient was already examined
        const prevDocName = initialData?.conclusion_data?.doctor_name || initialData?.conclusion_data?.doctor_id;
        const prevDocMatch = prevDocName 
            ? doctors.find(doc => 
                String(doc.name).toLowerCase() === String(prevDocName).toLowerCase() || 
                String(doc.id).toLowerCase() === String(prevDocName).toLowerCase()
              )
            : null;

        const match = prevDocMatch || doctors.find(doc => 
            String(doc.id).toLowerCase() === String(user.userId || user.username || '').toLowerCase() ||
            String(doc.name).toLowerCase() === String(user.fullname || '').toLowerCase()
        );
        
        const defaultDoctorId = match ? match.id : (user.userId || user.username || '');
        const defaultDoctorName = match ? match.name : (user.fullname || '');

        setSpecialtyMetadata(prev => {
            const updated = { ...prev };
            let hasChanges = false;

            const keys = ['admin', 'history', 'conclusion', 'internal', 'eye', 'ent', 'dental', 'external', 'dermatology', 'gynecology'];
            keys.forEach(key => {
                const current = updated[key];
                // ONLY auto-select doctor if doctorId is completely empty/missing
                if (!current || !current.doctorId) {
                    updated[key] = {
                        doctorId: defaultDoctorId,
                        doctorName: defaultDoctorName,
                        status: current?.status || 'CHUA_KHAM',
                        updatedAt: current?.updatedAt || new Date().toISOString()
                    };
                    hasChanges = true;
                }
            });

            return hasChanges ? updated : prev;
        });
    }, [user, doctors, initialData]);

    useEffect(() => {
        if (maTinhCuTru) {
            getWards(maTinhCuTru).then(data => {
                setWards(data.map((w: any) => ({ id: String(w.id || ''), code: String(w.code || w.id || ''), name: w.name })));
            }).catch(() => setWards([]));
        } else {
            setWards([]);
        }
    }, [maTinhCuTru, getWards]);

    useEffect(() => {
        if (maTinhCuTruNghMe) {
            getWards(maTinhCuTruNghMe).then(data => {
                setWardsNghMe(data.map((w: any) => ({ id: String(w.id || ''), code: String(w.code || w.id || ''), name: w.name })));
            }).catch(() => setWardsNghMe([]));
        } else {
            setWardsNghMe([]);
        }
    }, [maTinhCuTruNghMe, getWards]);

    const handleHemoglobinChange = (val: string) => {
        setHemoglobin(val);
        setParaclinicalItems(prev => prev.map(item => {
            const code = String(item.service_code || item.index_code || '').trim().toUpperCase();
            if (code === 'HB' || code === 'HEMOGLOBIN') {
                return { ...item, value: val, user_edited: true };
            }
            return item;
        }));
    };

    const handleGlycemiaChange = (val: string) => {
        setGlycemia(val);
        setParaclinicalItems(prev => prev.map(item => {
            const code = String(item.service_code || item.index_code || '').trim().toUpperCase();
            if (code === 'GLU' || code === 'GLUCOSE') {
                return { ...item, value: val, user_edited: true };
            }
            return item;
        }));
    };

    const handleProteinChange = (val: string) => {
        setProtein(val);
        setParaclinicalItems(prev => prev.map(item => {
            const code = String(item.service_code || item.index_code || '').trim().toUpperCase();
            if (code === 'PRO' || code === 'PROTEIN') {
                return { ...item, value: val, user_edited: true };
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

    const validateForm = (isSigning: boolean = false) => {
        const newErrors: Record<string, string> = {};
        if (!patientName.trim()) newErrors.patientName = 'Họ và tên bắt buộc nhập';
        if (patientName.trim() && patientName !== patientName.toUpperCase()) {
            newErrors.patientName = 'Họ và tên phải viết IN HOA có dấu';
        }
        if (!noCccd && !cccd.trim()) newErrors.cccd = 'Số CCCD/Định danh bắt buộc nhập';
        if (cccd.trim() && !/^\d{12}$/.test(cccd)) {
            newErrors.cccd = 'Định danh/CCCD phải gồm chính xác 12 chữ số';
        }
        if (phone.trim() && !/^\d{10}$/.test(phone.trim())) {
            newErrors.phone = 'Số điện thoại (nếu có) phải gồm chính xác 10 chữ số';
        }
        if (!dob) newErrors.dob = 'Ngày sinh bắt buộc chọn';
        if (guardianCccd && guardianCccd.trim() && !/^\d{12}$/.test(guardianCccd.trim())) {
            newErrors.guardianCccd = 'Số CCCD người giám hộ phải gồm chính xác 12 chữ số';
        }
        if (escortCccd && escortCccd.trim() && !/^\d{12}$/.test(escortCccd.trim())) {
            newErrors.escortCccd = 'Số CCCD người đi cùng phải gồm chính xác 12 chữ số';
        }
        if (bp && !/^\d{2,3}\/\d{2,3}$/.test(bp)) {
            newErrors.bp = 'Huyết áp phải nhập dạng Tâm thu/Tâm trương (VD: 120/80)';
        }
        if (dob && validateNewFormAge(formType, dob)) newErrors.dob = validateNewFormAge(formType, dob)!;
        
        // Chỉ bắt buộc đầy đủ Kết luận, Phân loại sức khỏe và Nguồn chi trả khi thực hiện Khóa & Ký Số
        if (isSigning) {
            if (!fundingSource) newErrors.fundingSource = 'Nguồn chi trả bắt buộc chọn theo QĐ 2062';
            if (formType !== '1' && !fitnessClass) newErrors.fitnessClass = 'Phân loại sức khỏe chung bắt buộc chọn';
            
            const isOverallClassThreeOrBelow = ['3', '4', '5', 'III', 'IV', 'V'].includes(fitnessClass);
            const hasNotes = !!(cacVanDeLuuY && cacVanDeLuuY.trim());
            if ((isOverallClassThreeOrBelow || hasNotes) && !diagnosis.trim()) {
                newErrors.diagnosis = 'Bắt buộc nhập mã bệnh tật/chẩn đoán ICD-10 khi phân loại sức khỏe từ loại III trở xuống hoặc có vấn đề lưu ý';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e?: React.FormEvent, options?: { shouldSign?: boolean; shouldUnlock?: boolean; signatureType?: 'USB' | 'HSM' }): boolean => {
        if (e) e.preventDefault();
        
        const isSigning = !!options?.shouldSign;
        // Perform validation and determine the appropriate tab to highlight
        const newErrors: Record<string, string> = {};
        if (!patientName.trim()) newErrors.patientName = 'Họ và tên bắt buộc nhập';
        if (patientName.trim() && patientName !== patientName.toUpperCase()) {
            newErrors.patientName = 'Họ và tên phải viết IN HOA có dấu';
        }
        if (!noCccd && !cccd.trim()) newErrors.cccd = 'Số CCCD/Định danh bắt buộc nhập';
        if (cccd.trim() && !/^\d{12}$/.test(cccd)) {
            newErrors.cccd = 'Định danh/CCCD phải gồm chính xác 12 chữ số';
        }
        if (phone.trim() && !/^\d{10}$/.test(phone.trim())) {
            newErrors.phone = 'Số điện thoại (nếu có) phải gồm chính xác 10 chữ số';
        }
        if (!dob) newErrors.dob = 'Ngày sinh bắt buộc chọn';
        if (guardianCccd && guardianCccd.trim() && !/^\d{12}$/.test(guardianCccd.trim())) {
            newErrors.guardianCccd = 'Số CCCD người giám hộ phải gồm chính xác 12 chữ số';
        }
        if (escortCccd && escortCccd.trim() && !/^\d{12}$/.test(escortCccd.trim())) {
            newErrors.escortCccd = 'Số CCCD người đi cùng phải gồm chính xác 12 chữ số';
        }
        if (bp && !/^\d{2,3}\/\d{2,3}$/.test(bp)) {
            newErrors.bp = 'Huyết áp phải nhập dạng Tâm thu/Tâm trương (VD: 120/80)';
        }
        if (dob && validateNewFormAge(formType, dob)) newErrors.dob = validateNewFormAge(formType, dob)!;
        
        // Chỉ bắt buộc đầy đủ Kết luận khi Khóa & Ký Số
        if (isSigning) {
            if (!fundingSource) newErrors.fundingSource = 'Nguồn chi trả bắt buộc chọn theo QĐ 2062';
            if (formType !== '1' && !fitnessClass) newErrors.fitnessClass = 'Phân loại sức khỏe chung bắt buộc chọn';
            
            const isOverallClassThreeOrBelow = ['3', '4', '5', 'III', 'IV', 'V'].includes(fitnessClass);
            const hasNotes = !!(cacVanDeLuuY && cacVanDeLuuY.trim());
            if ((isOverallClassThreeOrBelow || hasNotes) && !diagnosis.trim()) {
                newErrors.diagnosis = 'Bắt buộc nhập mã bệnh tật/chẩn đoán ICD-10 khi phân loại sức khỏe từ loại III trở xuống hoặc có vấn đề lưu ý';
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const firstError = Object.values(newErrors)[0];
            toast.error(isSigning ? `Không thể khóa/ký: ${firstError}` : `Không thể lưu: ${firstError}`);
            if (newErrors.diagnosis || newErrors.fitnessClass) {
                setActiveTab('conclusion');
            } else if (newErrors.bp) {
                setActiveTab('exam');
            } else {
                setActiveTab('admin');
            }
            return false;
        }

        // Khởi tạo các metadata chưa tồn tại
        const calculatedMetadata = { ...specialtyMetadataRef.current };
        const keysToProcess = ['admin', 'history', 'internal', 'eye', 'ent', 'dental', 'external', 'dermatology', 'gynecology', 'lab', 'conclusion'];
        
        keysToProcess.forEach(key => {
            if (!calculatedMetadata[key]) {
                calculatedMetadata[key] = {
                    doctorId: '',
                    doctorName: '',
                    status: 'CHUA_KHAM',
                    updatedAt: new Date().toISOString()
                };
            }
        });

        // Cập nhật lại state để giao diện đồng bộ
        setSpecialtyMetadata(calculatedMetadata);
        
        const currentProv = provinces.find(p => String(p.id) === String(maTinhCuTru) || String(p.code) === String(maTinhCuTru));
        const currentWard = wards.find(w => String(w.id) === String(maXaCuTru) || String(w.code) === String(maXaCuTru));
        const currentProvName = currentProv?.name || '';
        const currentWardName = currentWard?.name || '';

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
                no_cccd: noCccd,
                cccd_date: cccdDate,
                cccd_place: cccdPlace,
                blood_group: bloodGroup,
                target_group: targetGroup,
                funding_source: fundingSource,
                ma_gtin_cskcb: maGtinCskcb,
                matinh_cu_tru: maTinhCuTru,
                maxa_cu_tru: maXaCuTru,
                province: currentProvName,
                province_name: currentProvName,
                ten_tinh: currentProvName,
                ward: currentWardName,
                ward_name: currentWardName,
                ten_xa: currentWardName,
                ly_do_vv: lyDoVv,
                loai_hinh_kcb: loaiHinhKcb,
                ngay_vao: ngayVao,
                nhiet_do: nhietDo,
                nhip_tho: nhipTho,
                examination: {
                    height,
                    weight,
                    bmi,
                    blood_pressure: bp,
                    pulse,
                    vong_nguc_tb: vongNgucTrungBinh,
                },
                clinical_exam: {
                    specialty_metadata: calculatedMetadata,
                    internal: internalExam,
                    eye: eyeExam,
                    kham_mat: eyeExam,
                    benh_khac_mat: benhKhacMat || eyeExam,
                    ent: entExam,
                    benh_tai_mui_hong: entExam,
                    benh_khac_tai_mui_hong: benhKhacTaiMuiHong || entExam,
                    dental: dentalExam,
                    kham_rang_ham_mat: dentalExam,
                    benh_rang_ham_mat: dentalExam,
                    benh_khac_rang_ham_mat: benhKhacRangHamMat || dentalExam,
                    external: externalExam,
                    dermatology: dermatologyExam,
                    gynecology: gynExam || kqSinhDuc,
                    kham_san_phu_khoa: gynExam || kqSinhDuc,
                    ket_qua_kham_san_phu_khoa: gynExam || kqSinhDuc,
                    
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
                    driver_exam_purpose: driverExamPurpose,
                    chuc_danh: chucDanh,
                    noi_cong_tac: noiCongTac,
                    vi_tri_lam_viec: viTriLamViec,
                    bo_phan_lam_viec: boPhanLamViec,
                    offshore_exp: offshoreExp,
                    railway_fit: railwayFit,
                    tsgd_mac_benh: tsgdMacBenh,
                    tsgd_ma_benh: tsgdMaBenh,
                    ts_mac_benh: tsMacBenh,
                    tsbt_ma_benh: tsbtMaBenh,
                    tsbt_nghien_ruou: tsbtNghienRuou,
                    tsbt_dang_dieu_tri_benh: tsMacBenh === 1 ? '1' : (tsbtDangDieuTriBenh || '0'),
                    benh_dang_dieu_tri: benhDangDieuTri || tenThuoc,
                    tsbt_ma_benh_khac: tsbtMaBenhKhac,
                    tsbt_thai_san: tsbtThaiSan,
                    tsbt_ma_benh_thai_san: tsbtMaBenhThaiSan,
                    tsbt_ten_thuoc_thai_san: tsbtTenThuocThaiSan,
                    nhi_khoa_lam_sang_khac: nhiKhoaLamSangKhac || nhiKhac,
                    cac_benh_tat_neu_co: cacBenhTatNeuCo,
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
                    ts_tiep_xuc_lao: tsTiepXucLao,
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
                    luc_keo_than: lucKeoThan,
                    dg_dhst_nhiet_do: dgDhstNhietDo,
                    dg_dhst_mach: dgDhstMach,
                    dg_dhst_nhip_tho: dgDhstNhipTho,
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
                    tiemChungLao: tiemChungLao,
                    tiemChungVgbMui1: tiemChungVgbMui1,
                    tiemChungDayDu: tiemChungDayDu,
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
                cac_benh_tat_neu_co: cacBenhTatNeuCo,
                CAC_BENH_TAT_NEU_CO: cacBenhTatNeuCo,
                du_tieu_chuan_dk_ptgt_duong_sat: duTieuChuanDkPtgtDuongSat,
                kha_nang_chiu_song: khaNangChiuSong,
                han_che: hanChe,
                yeuCauDeoKinh,
                ket_luan_loai_suc_khoe: ketLuanLoaiSucKhoe,
                doctor_id: conclusionDoctorId,
                quan_ly_benh: quanLyBenh,
                theo_doi_tai: theoDoiTai,
                chuyen_tuyen: chuyenTuyen
            }
        };
        
        onSave(fullPayload, options);
        return true;
    };

    const handlePreview = () => {
        const currentProv = provinces.find(p => String(p.id) === String(maTinhCuTru) || String(p.code) === String(maTinhCuTru));
        const currentWard = wards.find(w => String(w.id) === String(maXaCuTru) || String(w.code) === String(maXaCuTru));
        const currentProvName = currentProv?.name || '';
        const currentWardName = currentWard?.name || '';

        const fullPayload = {
            id: initialData?.id,
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
                no_cccd: noCccd,
                cccd_date: cccdDate,
                cccd_place: cccdPlace,
                blood_group: bloodGroup,
                target_group: targetGroup,
                funding_source: fundingSource,
                ma_gtin_cskcb: maGtinCskcb,
                matinh_cu_tru: maTinhCuTru,
                maxa_cu_tru: maXaCuTru,
                province: currentProvName,
                province_name: currentProvName,
                ten_tinh: currentProvName,
                ward: currentWardName,
                ward_name: currentWardName,
                ten_xa: currentWardName,
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
                    kham_mat: eyeExam,
                    benh_khac_mat: benhKhacMat || eyeExam,
                    ent: entExam,
                    benh_tai_mui_hong: entExam,
                    benh_khac_tai_mui_hong: benhKhacTaiMuiHong || entExam,
                    dental: dentalExam,
                    kham_rang_ham_mat: dentalExam,
                    benh_rang_ham_mat: dentalExam,
                    benh_khac_rang_ham_mat: benhKhacRangHamMat || dentalExam,
                    external: externalExam,
                    dermatology: dermatologyExam,
                    gynecology: gynExam || kqSinhDuc,
                    kham_san_phu_khoa: gynExam || kqSinhDuc,
                    ket_qua_kham_san_phu_khoa: gynExam || kqSinhDuc,
                    
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
                    roi_loan_han_vi_tam_than: roiLoanHanhViTamThan,
                    
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
                    nhi_tam_than: nhiThanKinh,
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
                    gio_kham: gioKham,
                    ngay_kham: ngayVao,
                    tsgd_mac_benh: tsgdMacBenh,
                    tsgd_ma_benh: tsgdMaBenh,
                    tsbt_ma_benh: tsbtMaBenh,
                    tsbt_nghien_ruou: tsbtNghienRuou,
                    tsbt_dang_dieu_tri_benh: tsbtDangDieuTriBenh,
                    benh_dang_dieu_tri: benhDangDieuTri || tenThuoc,
                    tsbt_ma_benh_khac: tsbtMaBenhKhac,
                    tsbt_thai_san: tsbtThaiSan,
                    tsbt_ma_benh_thai_san: tsbtMaBenhThaiSan,
                    tsbt_ten_thuoc_thai_san: tsbtTenThuocThaiSan,
                    nhi_khoa_lam_sang_khac: nhiKhoaLamSangKhac || nhiKhac,
                    cac_benh_tat_neu_co: cacBenhTatNeuCo,
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
                    can_nang: weight,
                    chieu_cao: height,
                    mach: pulse,
                    huyet_ap: bp,
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
                    milestones,
                    ten_thuoc: tenThuoc,
                    luc_keo_than: lucKeoThan,
                    dg_dhst_nhiet_do: dgDhstNhietDo,
                    dg_dhst_mach: dgDhstMach,
                    dg_dhst_nhip_tho: dgDhstNhipTho,
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
                    tiemChungLao: tiemChungLao,
                    tiemChungVgbMui1: tiemChungVgbMui1,
                    tiemChungDayDu: tiemChungDayDu,
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
                nuoc_tieu_test_nhanh: { ma_tuy: nuocTieuMaTuy, amphetamine: nuocTieuAmphetamine, duong: nuocTieuDuong, protein: nuocTieuProtein, khac: nuocTieuKhac },
                imaging: { ket_qua: ketQuaChanDoanHinhAnh },
                ecg: { ket_qua: ketQuaDienTim },
                spiro: { ket_qua: chucNangHoHap },
                us: { ket_qua: ketQuaSieuAmBung }
            },
            conclusionData: {
                fitness_class: fitnessClass,
                diagnosis,
                cac_van_de_luu_y: cacVanDeLuuY,
                cac_benh_tat_neu_co: cacBenhTatNeuCo,
                CAC_BENH_TAT_NEU_CO: cacBenhTatNeuCo,
                du_tieu_chuan_dk_ptgt_duong_sat: duTieuChuanDkPtgtDuongSat,
                kha_nang_chiu_song: khaNangChiuSong,
                han_che: hanChe,
                yeu_cau_deo_kinh: yeuCauDeoKinh,
                ket_luan_loai_suc_khoe: ketLuanLoaiSucKhoe,
                doctor_id: conclusionDoctorId,
                quan_ly_benh: quanLyBenh,
                theo_doi_tai: theoDoiTai,
                chuyen_tuyen: chuyenTuyen
            }
        };
        if (onPreview) {
            onPreview(fullPayload);
        }
    };

    const isChild = formType === '1';
    const isStudent = formType === '2';

    return {
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
        hisSource,
        setHisSource,
        handleFetchHisData,
        patientId,
        setPatientId,
        patientName,
        setPatientName,
        cccd,
        setCccd,
        noCccd,
        setNoCccd,
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
        wardsNghMe,
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
        driverExamPurpose,
        setDriverExamPurpose,
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
        tsbtNghienRuou,
        setTsbtNghienRuou,
        tsbtMaBenhKhac,
        setTsbtMaBenhKhac,
        tsbtThaiSan,
        setTsbtThaiSan,
        tsbtMaBenhThaiSan,
        setTsbtMaBenhThaiSan,
        tsbtTenThuocThaiSan,
        setTsbtTenThuocThaiSan,
        nhiKhoaLamSangKhac,
        setNhiKhoaLamSangKhac,
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
        tsMacBenh,
        setTsMacBenh,
        tsbtMaBenhNgheNghiep,
        setTsbtMaBenhNgheNghiep,
        tsTiepXucLao,
        setTsTiepXucLao,
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
        benhKhacMat,
        setBenhKhacMat,
        benhKhacTaiMuiHong,
        setBenhKhacTaiMuiHong,
        benhKhacRangHamMat,
        setBenhKhacRangHamMat,
        fitnessClass,
        setFitnessClass,
        diagnosis,
        setDiagnosis,
        cacVanDeLuuY,
        setCacVanDeLuuY,
        cacBenhTatNeuCo,
        setCacBenhTatNeuCo,
        benhDangDieuTri,
        setBenhDangDieuTri,
        tsbtDangDieuTriBenh,
        setTsbtDangDieuTriBenh,
        ketLuanLoaiSucKhoe,
        setKetLuanLoaiSucKhoe,
        conclusionDoctorId,
        setConclusionDoctorId,
        quanLyBenh,
        setQuanLyBenh,
        theoDoiTai,
        setTheoDoiTai,
        chuyenTuyen,
        setChuyenTuyen,
        errors,
        setErrors,
        specialtyMetadata,
        setSpecialtyMetadata,
        doctors,
        setDoctors,
        isLocked,
        setIsLocked,
        isSyncingParaclinical,
        handleSyncParaclinical,
        handleAutofillTab,
        handleSubmit,
        handlePreview
    };
};
