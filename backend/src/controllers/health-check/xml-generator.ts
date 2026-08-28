import { getHealthCheckSettings } from '../../config/health-check-settings';
import { resolveProvinceBhCode, resolveVillageBhCode } from '../../services/administrative-catalog.service';

// Helper: Tìm kiếm giá trị trường linh hoạt từ nhiều nguồn (case-insensitive & snake/camel-case)
export function findValue(tag: string, ...sources: any[]): string {
    const tagLower = tag.toLowerCase().trim();
    const tagSnake = tagLower.replace(/_/g, '').replace(/-/g, '').replace(/\s+/g, '');
    
    const tagMap: Record<string, string[]> = {
        // Thông tin hành chính & định danh
        'ho_ten': ['patientname', 'patient_name', 'name', 'hoten', 'ho_ten', 'full_name', 'fullname'],
        'so_cccd': ['cccd', 'socccd', 'so_cccd', 'card_id', 'cardid', 'hp_sin', 'hp_patientid', 'cmnd', 'so_dinh_danh'],
        'ngay_sinh': ['dob', 'ngaysinh', 'ngay_sinh', 'birth', 'birthdate', 'birth_date', 'hp_birthdate'],
        'gioi_tinh': ['gender', 'gioitinh', 'gioi_tinh', 'sex', 'hp_sex', 'hee_sex'],
        'ma_lk': ['docno', 'doc_no', 'malk', 'ma_lk', 'hd_docno', 'document_no'],
        'tuan_thai': ['tuan_thai', 'tuanthai', 'tuan_thai_khi_sinh', 'tuanthaikhisinh'],
        'sinh_non': ['sinh_non', 'sinhnon'],
        'ma_dan_toc': ['ethnic', 'madantoc', 'ma_dan_toc', 'hp_ethnic', 'dantoc', 'dan_toc'],
        'ngaycap_cccd': ['cccd_date', 'cccddate', 'ngaycapcccd', 'ngaycap_cccd', 'card_id_date', 'cardiddate', 'card_date'],
        'noicap_cccd': ['cccd_place', 'cccdplace', 'noicapcccd', 'noicap_cccd', 'card_id_place', 'cardidplace', 'card_place'],
        'nhom_mau': ['blood_group', 'bloodgroup', 'nhommau', 'nhom_mau', 'blood_type'],
        'dia_chi': ['address', 'diachi', 'dia_chi', 'hp_dtladdr', 'detail_address', 'hp_address'],
        'matinh_cu_tru': ['matinh_cu_tru', 'matinhcutru', 'province_id', 'sp_id', 'hp_provid', 'prov_id', 'provid', 'hee_prov_code', 'hee_provid', 'sp_id_bh', 'matinh', 'ma_tinh'],
        'maxa_cu_tru': ['maxa_cu_tru', 'maxacutru', 'ward_id', 'sv_id', 'hp_villid', 'vill_id', 'villid', 'hee_vill_code', 'hee_villid', 'sv_id_bh', 'maxa', 'ma_xa'],
        'dien_thoai': ['phone', 'dienthoai', 'dien_thoai', 'telephone', 'hd_telephone', 'hp_phone', 'hee_phone'],
        'nguoi_giam_ho': ['nguoi_giam_ho', 'nguoigiamho', 'guardian_name', 'guardianname', 'hee_guardian_name'],
        'so_cccd_ngh': ['so_cccd_ngh', 'socccdngh', 'guardian_cccd', 'guardiancccd', 'hee_guardian_cccd', 'cccd_nguoi_giam_ho'],
        'dien_thoai_ngh': ['dien_thoai_ngh', 'dienthoaingh', 'guardian_phone', 'guardianphone', 'phone_ngh'],
        'ho_ten_nguoi_di_cung': ['ho_ten_nguoi_di_cung', 'hotennguoidicung', 'escort_name', 'escortname'],
        'so_cccd_nguoi_di_cung': ['so_cccd_nguoi_di_cung', 'socccdnguoidicung', 'escort_cccd', 'escortcccd'],
        'moi_quan_he_voi_tre': ['moi_quan_he_voi_tre', 'moiquanhevoitre', 'escort_relation', 'escortrelation'],
        'dien_thoai_nguoi_di_cung': ['dien_thoai_nguoi_di_cung', 'dienthoainguoidicung', 'escort_phone', 'escortphone'],
        'ma_nghe_nghiep': ['ma_nghe_nghiep', 'manghenghiep', 'job_code', 'jobcode', 'occupation', 'hee_jobcode'],
        'noi_lam_viec_hoc_tap': ['noi_lam_viec_hoc_tap', 'noilamviechoctap', 'noi_cong_tac', 'noicongtac', 'workplace', 'company_name', 'work_place', 'noi_lam_viec', 'noi_cong_tac_hien_tai'],
        'ly_do_vv': ['ly_do_vv', 'lydovv', 'ly_do_ksk', 'lydoksk', 'reason', 'exam_reason'],
        'doi_tuong': ['target_group', 'targetgroup', 'doituong', 'doi_tuong', 'hd_object'],
        'nguon_kinh_phi': ['funding_source', 'fundingsource', 'nguonkinhphi', 'nguon_kinh_phi'],
        'nguon_chi_tra': ['funding_source', 'fundingsource', 'nguonkinhphi', 'nguon_kinh_phi', 'nguon_chi_tra', 'nguonchitra'],
        'ma_loai_kcb': ['ma_loai_kcb', 'maloaikcb', 'loai_hinh_kcb', 'loaihinhkcb'],
        'ngay_vao': ['ngay_vao', 'ngayvao', 'ngay_kham', 'ngaykham', 'created_at', 'admitdate', 'hd_admitdate'],
        
        // Dấu hiệu sinh tồn XML3
        'nhiet_do': ['temperature', 'nhietdo', 'nhiet_do', 'he_temperature', 'temp'],
        'nhip_tho': ['respiration', 'nhiptho', 'nhip_tho', 'he_respiration', 'breath', 'respiratory_rate'],
        'spo2': ['spo2', 'he_spo2'],

        // Khám thể lực XML10
        'chieu_cao': ['height', 'chieucao', 'chieu_cao', 'he_height'],
        'can_nang': ['weight', 'cannang', 'can_nang', 'he_weight'],
        'chi_so_bmi': ['bmi', 'chisobmi', 'chi_so_bmi', 'he_bmi'],
        'mach': ['pulse', 'mach', 'he_pulse'],
        'huyet_ap': ['blood_pressure', 'bloodpressure', 'bp', 'huyetap', 'huyet_ap', 'he_bloodpressure'],
        'kham_the_luc_pl': ['kham_the_luc_pl', 'khamthelucpl', 'the_luc_pl', 'thelucpl'],

        // Kết luận XML12
        'phan_loai_sk': ['fitness_class', 'fitnessclass', 'phan_loai_sk', 'phanloaisk', 'phan_loai', 'phanloai', 'ket_luan_loai_suc_khoe', 'ketluanloaisuckhoe', 'fitness_class_val'],
        'ket_luan_benh': ['diagnosis', 'chandoan', 'chan_doan', 'ket_luan_benh', 'ketluanbenh', 'ma_benh', 'he_diagnostic', 'ket_luan'],
        'cac_van_de_suc_khoe': ['cac_van_de_luu_y', 'cacvandeluuy', 'cac_van_de_suc_khoe', 'cacvandesuckhoe', 'cac_van_de_khac', 'luu_y'],
        'cac_benh_tat_neu_co': ['cac_benh_tat_neu_co', 'cacbenhtatneuco', 'cac_benh_tat', 'cacbenhtat', 'tinh_trang_suc_khoe_benh_tat'],

        // Tiền sử & Vaccine XML9
        'tsgd_mac_benh': ['tsgd_mac_benh', 'tsgdmacbenh', 'ts_gia_dinh_mac_benh', 'ts_gia_dinh'],
        'tsgd_ma_benh': ['tsgd_ma_benh', 'tsgdmabenh', 'tsgd_icd10'],
        'ts_tiep_xuc_lao': ['ts_tiep_xuc_lao', 'tstiepxuclao', 'tiep_xuc_lao'],
        'san_khoa': ['san_khoa', 'sankhoa', 'ts_san_khoa'],
        'san_khoa_khong_bt': ['san_khoa_khong_bt', 'sankhoakhongbt', 'san_khoa_bat_thuong'],
        'ma_benh_san_khoa_khong_bt': ['ma_benh_san_khoa_khong_bt', 'mabenhsankhoakhongbt', 'tsbt_ma_benh_thai_san'],
        'tiem_chung_bcg': ['tiem_chung_bcg', 'tiemchungbcg', 'tiemchunglao', 'tiem_chung_lao'],
        'tiem_chung_bh_hg_uv': ['tiem_chung_bh_hg_uv', 'tiemchungbhhguv'],
        'tiem_chung_soi': ['tiem_chung_soi', 'tiemchungsoi'],
        'tiem_chung_bai_liet': ['tiem_chung_bai_liet', 'tiemchungbailiet'],
        'tiem_chung_vnnb_b': ['tiem_chung_vnnb_b', 'tiemchungvnnbb'],
        'tiem_chung_vgb': ['tiem_chung_vgb', 'tiemchungvgb', 'tiem_chung_vgb_mui1', 'tiemchungvgbmui1'],
        'tiem_chung_cac_loai_khac': ['tiem_chung_cac_loai_khac', 'tiemchungcacloaikhac'],
        'tiem_chung_vac_xin_khac': ['tiem_chung_vac_xin_khac', 'tiemchungvacxinkhac', 'tiemChungVacXinKhac', 'tiem_chung_vac_xin_khac_da_tiem'],
        'tsbt_mac_benh': ['tsbt_mac_benh', 'tsbtmacbenh', 'ts_mac_benh', 'tsmacbenh', 'ts_ban_than'],
        'tsbt_ma_benh': ['tsbt_ma_benh', 'tsbtmabenh', 'tsbt_icd10'],
        'tsbt_dang_dieu_tri_benh': ['tsbt_dang_dieu_tri_benh', 'tsbtdangdieutribenh', 'co_dang_dieu_tri_benh'],
        'tsbt_benh_trong_5_nam_qua': ['tsbt_benh_trong_5_nam_qua', 'tsbtbenhtrong5namqua', 'ts_benh_thuong_5_nam', 'ts_5_nam', 'ts5nam'],
        'tsbt_benh_than_kinh': ['tsbt_benh_than_kinh', 'tsbtbenhthankinh', 'ts_than_kinh_chan_thuong_dau', 'ts_than_kinh', 'tsthankinh'],
        'tsbt_benh_mat': ['tsbt_benh_mat', 'tsbtbenhmat', 'ts_benh_mat_giam_thi_luc', 'ts_mat', 'tsmat'],
        'tsbt_benh_tai': ['tsbt_benh_tai', 'tsbtbenhtai', 'ts_benh_tai_giam_nghe', 'ts_tai', 'tstai'],
        'tsbt_benh_tim': ['tsbt_benh_tim', 'tsbtbenhtim', 'ts_benh_tim_mach', 'ts_tim_mach', 'tstimmach'],
        'tsbt_phau_thuat_tim': ['tsbt_phau_thuat_tim', 'tsbtphauthuattim', 'ts_phau_thuat_tim_mach', 'ts_phau_thuat_tim'],
        'tsbt_tang_huyet_ap': ['tsbt_tang_huyet_ap', 'tsbttanghuyetap', 'ts_tang_huyet_ap', 'tstanghuyetap', 'ts_huyet_ap'],
        'tsbt_kho_tho': ['tsbt_kho_tho', 'tsbtkhotho', 'ts_kho_tho', 'tskhotho'],
        'tsbt_benh_phoi': ['tsbt_benh_phoi', 'tsbtbenhphoi', 'ts_benh_phoi_hen', 'ts_phoi_hen', 'tsphoihen'],
        'tsbt_benh_than': ['tsbt_benh_than', 'tsbtbenhthan', 'ts_benh_than_loc_mau', 'ts_than', 'tsthan'],
        'tsbt_nghien_ruou': ['tsbt_nghien_ruou', 'tsbtnghienruou', 'ts_su_dung_ruou', 'ts_ruou'],
        'tsbt_dai_thao_duong': ['tsbt_dai_thao_duong', 'tsbtdaithaoduong', 'ts_dai_thao_duong', 'tstieuduong', 'ts_tieu_duong'],
        'tsbt_benh_tam_than': ['tsbt_benh_tam_than', 'tsbtbenhtamthan', 'ts_benh_tam_than', 'ts_tam_than', 'tstamthan'],
        'tsbt_mat_y_thuc': ['tsbt_mat_y_thuc', 'tsbtmatythuc', 'ts_mat_roi_loan_y_thuc', 'ts_y_thuc', 'tsythuc'],
        'tsbt_ngat': ['tsbt_ngat', 'tsbtngat', 'ts_ngat_chong_mat', 'ts_chong_mat', 'tschongmat'],
        'tsbt_benh_tieu_hoa': ['tsbt_benh_tieu_hoa', 'tsbtbenhtieuhoa', 'ts_benh_tieu_hoa', 'ts_tieu_hoa', 'tstieuhoa'],
        'tsbt_roi_loan_giac_ngu': ['tsbt_roi_loan_giac_ngu', 'tsbtroiloangiacngu', 'ts_roi_loan_giac_ngu', 'ts_giac_ngu', 'tsgiacngu'],
        'tsbt_tai_bien': ['tsbt_tai_bien', 'tsbttaibien', 'ts_tai_bien_mach_mau_nao', 'ts_tai_bien', 'tstaibien'],
        'tsbt_benh_cot_song': ['tsbt_benh_cot_song', 'tsbtbenhcotsong', 'ts_benh_cot_song', 'ts_cot_song', 'tscotsong'],
        'tsbt_ruou_thuong_xuyen': ['tsbt_ruou_thuong_xuyen', 'tsbtruouthuongxuyen', 'ts_su_dung_ruou'],
        'tsbt_ma_tuy': ['tsbt_ma_tuy', 'tsbtmatuy', 'ts_su_dung_ma_tuy', 'ts_ma_tuy', 'tsmatuy'],
        'tsbt_benh_khac': ['tsbt_benh_khac', 'tsbtbenhkhac', 'ts_benh_khac'],
        'tsbt_ma_benh_khac': ['tsbt_ma_benh_khac', 'tsbtmabenhkhac'],
        'tsbt_thai_san': ['tsbt_thai_san', 'tsbtthaisan', 'thai_san'],
        'tsbt_ma_benh_thai_san': ['tsbt_ma_benh_thai_san', 'tsbtmabenhthaisan'],
        'tsbt_ten_thuoc_thai_san': ['tsbt_ten_thuoc_thai_san', 'tsbttenthuocthaisan'],
        'tsbt_ten_thuoc_lieu_luong': ['tsbt_ten_thuoc_lieu_luong', 'tsbttenthuoclieuluong', 'ten_thuoc', 'tenthuoc', 'benh_dang_dieu_tri', 'benhdangdieutri'],
        'benh_dang_dieu_tri': ['benh_dang_dieu_tri', 'benhdangdieutri', 'ten_thuoc', 'tenthuoc', 'tsbt_ten_thuoc_lieu_luong'],
        'hang_lai_xe': ['hang_lai_xe', 'hanglaixe', 'license_class', 'licenseclass'],

        // Khám chuyên khoa lâm sàng người lớn & nhi khoa (XML7)
        'noi_khoa': ['internal', 'noikhoa', 'internalexam', 'internal_exam'],
        'noi_khoa_tuan_hoan': ['kq_tim_mach', 'kq_timmach', 'tim_mach', 'timmach', 'noi_khoa_tuan_hoan', 'noikhoatuanhoan', 'nhi_tuan_hoan', 'nhituanhoan', 'circulatory'],
        'noi_khoa_tuan_hoan_pl': ['noi_khoa_tuan_hoan_pl', 'noikhoatuanhoanpl', 'tuan_hoan_pl', 'tuanhoanpl', 'tim_mach_pl'],
        'ckdt_noi_khoa_tuan_hoan': ['ckdt_noi_khoa_tuan_hoan', 'ckdtnoikhoatuanhoan', 'bs_tuan_hoan', 'doctor_tuan_hoan'],
        
        'noi_khoa_ho_hap': ['kq_ho_hap', 'kq_hohap', 'ho_hap', 'hohap', 'noi_khoa_ho_hap', 'noikhoahohap', 'nhi_ho_hap', 'nhihohap', 'respiratory'],
        'noi_khoa_ho_hap_pl': ['noi_khoa_ho_hap_pl', 'noikhoahohappl', 'ho_hap_pl', 'hohappl'],
        'ckdt_noi_khoa_ho_hap': ['ckdt_noi_khoa_ho_hap', 'ckdtnoikhoahohap', 'bs_ho_hap', 'doctor_ho_hap'],

        'noi_khoa_tieu_hoa': ['noi_khoa_tieu_hoa', 'noikhoatieuhoa', 'kq_tieu_hoa', 'tieu_hoa', 'tieuhoa', 'nhi_tieu_hoa', 'nhitieuhoa', 'digestive'],
        'noi_khoa_tieu_hoa_pl': ['noi_khoa_tieu_hoa_pl', 'noikhoatieuhoapl', 'tieu_hoa_pl', 'tieuhoapl'],
        'ckdt_noi_khoa_tieu_hoa': ['ckdt_noi_khoa_tieu_hoa', 'ckdtnoikhoatieuhoa', 'bs_tieu_hoa', 'doctor_tieu_hoa'],

        'noi_khoa_than_tn_sd': ['kq_tiet_nieu', 'kq_tietnieu', 'tiet_nieu_sinh_duc', 'tietnieusinhduc', 'noi_khoa_than_tn_sd', 'noikhoathantnsd', 'nhi_tiet_nieu', 'nhitietnieu', 'kq_sinh_duc', 'urinary'],
        'noi_khoa_than_tn_sd_pl': ['noi_khoa_than_tn_sd_pl', 'noikhoathantnsdpl', 'noi_khoa_than_tietnieu_pl', 'than_tn_sd_pl', 'than_tiet_nieu_pl'],
        'ckdt_noi_khoa_than_tn_sd': ['ckdt_noi_khoa_than_tn_sd', 'ckdtnoikhoathantnsd', 'bs_than_tn_sd', 'doctor_than_tn_sd'],

        'noi_khoa_noi_tiet': ['kq_noi_tiet', 'kq_noitiet', 'kq_noi_tiet_chuyen_hoa', 'noi_tiet_dinh_duong_chuyen_hoa', 'noi_tiet', 'noitiet', 'noi_khoa_noi_tiet', 'noikhoanoitiet', 'endocrine'],
        'noi_khoa_noi_tiet_pl': ['noi_khoa_noi_tiet_pl', 'noikhoanoitietpl', 'noi_tiet_pl', 'noitietpl'],
        'ckdt_noi_khoa_noi_tiet': ['ckdt_noi_khoa_noi_tiet', 'ckdtnoikhoanoitiet', 'bs_noi_tiet', 'doctor_noi_tiet'],

        'noi_khoa_co_xuong_khop': ['kq_co_xuong_khop', 'kq_coxuongkhop', 'noi_khoa_co_xuong_khop', 'noikhoacoxuongkhop', 'kq_co_xuong_khop_m5', 'musculoskeletal'],
        'noi_khoa_co_xuong_khop_pl': ['noi_khoa_co_xuong_khop_pl', 'noikhoacoxuongkhoppl', 'co_xuong_khop_pl', 'coxuongkhoppl'],
        'ckdt_noi_khoa_co_xuong_khop': ['ckdt_noi_khoa_co_xuong_khop', 'ckdtnoikhoacoxuongkhop', 'bs_co_xuong_khop', 'doctor_co_xuong_khop'],

        'noi_khoa_than_kinh': ['kq_than_kinh', 'kq_thankinh', 'noi_khoa_than_kinh', 'noikhoathankinh', 'nhi_than_kinh', 'nhithankinh', 'than_kinh_m5', 'than_kinh_tam_ly', 'than_kinh', 'thankinh', 'neurology'],
        'noi_khoa_than_kinh_pl': ['noi_khoa_than_kinh_pl', 'noikhoathankinhpl', 'than_kinh_pl', 'thankinhpl'],
        'ckdt_noi_khoa_than_kinh': ['ckdt_noi_khoa_than_kinh', 'ckdtnoikhoathankinh', 'bs_than_kinh', 'doctor_than_kinh'],

        'noi_khoa_tam_than': ['kq_tam_than', 'kq_tamthan', 'noi_khoa_tam_than', 'noikhoatamthan', 'nhi_tam_than', 'nhitamthan', 'roi_loan_han_vi_tam_than', 'tam_than', 'tamthan', 'psychiatry'],
        'noi_khoa_tam_than_pl': ['noi_khoa_tam_than_pl', 'noikhoatamthanpl', 'tam_than_pl', 'tamthanpl'],
        'ckdt_noi_khoa_tam_than': ['ckdt_noi_khoa_tam_than', 'ckdtnoikhoatamthan', 'bs_tam_than', 'doctor_tam_than'],

        'ket_qua_kham_ngoai_khoa': ['kq_ngoai_khoa', 'kq_ngoaikhoa', 'external', 'ngoai_khoa', 'ngoaikhoa', 'kham_ngoai_khoa', 'ma_benh_ngoai_khoa', 'ket_qua_kham_ngoai_khoa', 'surgery'],
        'kham_ngoai_khoa_pl': ['kham_ngoai_khoa_pl', 'khamngoaikhoapl', 'ngoai_khoa_pl', 'ngoaikhoapl'],
        'ckdt_kham_ngoai_khoa': ['ckdt_kham_ngoai_khoa', 'ckdtkhamngoaikhoa', 'bs_ngoai_khoa', 'doctor_ngoai_khoa'],

        'ket_qua_kham_da_lieu': ['kq_da_lieu', 'kq_dalieu', 'dermatology', 'da_lieu', 'dalieu', 'ket_qua_kham_da_lieu', 'da_to_chuc_duoi_da'],
        'kham_da_lieu_pl': ['kham_da_lieu_pl', 'khamdalieupl', 'da_lieu_pl', 'dalieupl'],
        'ckdt_kham_da_lieu': ['ckdt_kham_da_lieu', 'ckdtkhamdalieu', 'bs_da_lieu', 'doctor_da_lieu'],

        'ket_qua_kham_san_phu_khoa': ['gynecology', 'kham_san_phu_khoa', 'san_phu_khoa', 'ket_qua_kham_san_phu_khoa', 'kq_san_phu_khoa', 'kq_sinh_duc'],
        'kham_san_phu_khoa_pl': ['kham_san_phu_khoa_pl', 'khamsanphukhoapl', 'san_phu_khoa_pl', 'sanphukhoapl'],
        'ckdt_kham_san_phu_khoa': ['ckdt_kham_san_phu_khoa', 'ckdtkhamsanphukhoa', 'bs_san_phu_khoa', 'doctor_san_phu_khoa'],

        'nhi_khoa_lam_sang_khac': ['nhi_khoa_lam_sang_khac', 'nhikhoalamsangkhac', 'nhi_khac', 'nhikhac', 'ckdt_nhi_khoa_lam_sang_khac'],
        'ckdt_nhi_khoa_lam_sang_khac': ['ckdt_nhi_khoa_lam_sang_khac', 'nhi_khac', 'nhikhac'],

        // Mắt
        'mat': ['eye', 'mat', 'eyeexam', 'eye_exam'],
        'khong_kinh_mat_phai': ['khong_kinh_mat_phai', 'khongkinhmatphai', 'xa_khong_kinh_mat_phai', 'xakhongkinhmatphai'],
        'khong_kinh_mat_trai': ['khong_kinh_mat_trai', 'khongkinhmattrai', 'xa_khong_kinh_mat_trai', 'xakhongkinhmattrai'],
        'co_kinh_mat_phai': ['co_kinh_mat_phai', 'cokinhmatphai', 'xa_co_kinh_mat_phai', 'xacokinhmatphai'],
        'co_kinh_mat_trai': ['co_kinh_mat_trai', 'cokinhmattrai', 'xa_co_kinh_mat_trai', 'xacokinhmattrai'],
        'khong_kinh_hai_mat': ['khong_kinh_hai_mat', 'khongkinhhaimat', 'xa_khong_kinh_hai_mat'],
        'co_kinh_hai_mat': ['co_kinh_hai_mat', 'cokinhhaimat', 'xa_co_kinh_hai_mat'],
        'thi_truong_ngang_haimat': ['thi_truong_ngang_haimat', 'thitruongnganghaimat', 'thi_truong_ngang_hai_mat', 'thitruongnganghaimat'],
        'thi_truong_dung_haimat': ['thi_truong_dung_haimat', 'thitruongdunghaimat', 'thi_truong_dung_hai_mat', 'thitruongdunghaimat'],
        'sac_giac': ['sac_giac', 'sacgiac', 'kham_mat_thi_giac_mau'],
        'benh_khac_mat': ['benh_khac_mat', 'benhkhacmat', 'eye_exam', 'eyeexam', 'kham_mat', 'khammat', 'eye', 'kq_mat', 'kham_mat_m5'],
        'kham_mat_pl': ['kham_mat_pl', 'khammatpl', 'mat_pl', 'matpl'],
        'ckdt_kham_mat': ['ckdt_kham_mat', 'ckdtkhammat', 'bs_mat', 'doctor_mat'],

        // Tai Mũi Họng
        'tai_mui_hong': ['ent', 'taimuihong', 'entexam', 'ent_exam'],
        'tai_trai_noi_thuong': ['tai_trai_noi_thuong', 'taitrainoithuong'],
        'tai_trai_noi_tham': ['tai_trai_noi_tham', 'taitrainoitham'],
        'tai_phai_noi_thuong': ['tai_phai_noi_thuong', 'taiphainoithuong'],
        'tai_phai_noi_tham': ['tai_phai_noi_tham', 'taiphainoitham'],
        'benh_tai_mui_hong': ['benh_tai_mui_hong', 'benhtaimuihong', 'ent_exam', 'entexam', 'kq_tai_mui_hong', 'kqtaimuihong', 'kham_tai_mui_hong', 'khamtaimuihong', 'ent', 'kham_tai_mui_hong_m5'],
        'benh_khac_tai_mui_hong': ['benh_khac_tai_mui_hong', 'benhkhactaimuihong', 'benh_tai_mui_hong_khac', 'ent'],
        'kham_tai_mui_hong_pl': ['kham_tai_mui_hong_pl', 'khamtaimuihongpl', 'tai_mui_hong_pl', 'taimuihongpl'],
        'ckdt_kham_tai_mui_hong': ['ckdt_kham_tai_mui_hong', 'ckdtkhamtaimuihong', 'bs_tai_mui_hong', 'doctor_tai_mui_hong'],

        // Răng Hàm Mặt
        'rang_ham_mat': ['dental', 'ranghammat', 'dentalexam', 'dental_exam'],
        'ham_tren': ['ham_tren', 'hamtren'],
        'ham_duoi': ['ham_duoi', 'hamduoi'],
        'benh_rang_ham_mat': ['benh_rang_ham_mat', 'benhranghammat', 'dental_exam', 'dentalexam', 'kham_rang_ham_mat', 'khamranghammat', 'dental', 'kq_rang_ham_mat'],
        'benh_khac_rang_ham_mat': ['benh_khac_rang_ham_mat', 'benhkhacranghammat', 'benh_rang_ham_mat_khac', 'dental'],
        'kham_rang_ham_mat_pl': ['kham_rang_ham_mat_pl', 'khamranghammatpl', 'rang_ham_mat_pl', 'ranghammatpl'],
        'ckdt_kham_rang_ham_mat': ['ckdt_kham_rang_ham_mat', 'ckdtkhamranghammat', 'bs_rang_ham_mat', 'doctor_rang_ham_mat'],

        // Minor (Mẫu 2) specific
        'nhi_khoa_tuan_hoan': ['nhi_khoa_tuan_hoan', 'nhikhoatuanhoan', 'nhi_tuan_hoan', 'kq_tim_mach', 'tim_mach'],
        'ckdt_nhi_khoa_tuan_hoan': ['ckdt_nhi_khoa_tuan_hoan', 'ckdtnhikhoatuanhoan'],
        'nhi_khoa_ho_hap': ['nhi_khoa_ho_hap', 'nhikhoahohap', 'nhi_ho_hap', 'kq_ho_hap', 'ho_hap'],
        'ckdt_nhi_khoa_ho_hap': ['ckdt_nhi_khoa_ho_hap', 'ckdtnhikhoahohap'],
        'nhi_khoa_tieu_hoa': ['nhi_khoa_tieu_hoa', 'nhikhoatieuhoa', 'nhi_tieu_hoa', 'kq_tieu_hoa', 'tieu_hoa'],
        'ckdt_nhi_khoa_tieu_hoa': ['ckdt_nhi_khoa_tieu_hoa', 'ckdtnhikhoatieuhoa'],
        'nhi_khoa_than_tn_sd': ['nhi_khoa_than_tn_sd', 'nhikhoathantnsd', 'nhi_tiet_nieu', 'kq_tiet_nieu'],
        'ckdt_nhi_khoa_than_tn_sd': ['ckdt_nhi_khoa_than_tn_sd', 'ckdtnhikhoathantnsd'],
        'nhi_khoa_than_kinh': ['nhi_khoa_than_kinh', 'nhikhoathankinh', 'nhi_than_kinh', 'kq_than_kinh'],
        'ckdt_nhi_khoa_than_kinh': ['ckdt_nhi_khoa_than_kinh', 'ckdtnhikhoathankinh'],
        'nhi_khoa_tam_than': ['nhi_khoa_tam_than', 'nhikhoatamthan', 'nhi_tam_than', 'kq_tam_than'],
        'ckdt_nhi_khoa_tam_than': ['ckdt_nhi_khoa_tam_than', 'ckdtnhikhoatamthan'],

        // Child Under 6 (Mẫu 1) XML7 specific tags & synonyms
        'mau_sac_da': ['mau_sac_da', 'mausacda'],
        'long_ban_tay': ['long_ban_tay', 'longbantay'],
        'thop': ['thop'],
        'hinh_dang_dau': ['hinh_dang_dau', 'hinhdangdau', 'kich_thuoc_dau', 'kichthuocdau'],
        'van_dong_co': ['van_dong_co', 'vandongco'],
        'khoi_bat_thuong_dau_co': ['khoi_bat_thuong_dau_co', 'khoibatthuongdauco'],
        'vi_tri_hai_mat': ['vi_tri_hai_mat', 'vitrihaimat', 'vi_tri_2_mat', 'vitri2mat'],
        'mi_mat_ket_mac': ['mi_mat_ket_mac', 'mimatketmac'],
        'lac_mat': ['lac_mat', 'lacmat'],
        'dong_tu': ['dong_tu', 'dongtu'],
        'tai_mang_nhi': ['tai_mang_nhi', 'taimangnhi'],
        'dap_ung_am_thanh': ['dap_ung_am_thanh', 'dapungamthanh'],
        'khoi_sung_sau_tai': ['khoi_sung_sau_tai', 'khoisungsautai'],
        'chay_mu_nuoc_tai': ['chay_mu_nuoc_tai', 'chaymunuoctai'],
        'hinh_dang_mui': ['hinh_dang_mui', 'hinhdangmui'],
        'chay_nuoc_mui': ['chay_nuoc_mui', 'chaynuocmui'],
        'nghet_mui': ['nghet_mui', 'nghetmui'],
        'hong': ['hong'],
        'hinh_dang_mieng': ['hinh_dang_mieng', 'hinhdangmieng'],
        'rang_sua_so_sinh': ['rang_sua_so_sinh', 'rangsuasosinh'],
        'hinh_dang_luoi': ['hinh_dang_luoi', 'hinhdangluoi'],
        'dinh_thang_luoi': ['dinh_thang_luoi', 'dinhthangluoi'],
        'nam_mieng': ['nam_mieng', 'nammieng'],
        'cam_nho_tut_ve_sau': ['cam_nho_tut_ve_sau', 'camnhotutvesau', 'cam_nho_tut_sau', 'camnhotutsau'],
        'sau_mang_bam_lo': ['sau_mang_bam_lo', 'saumangbamlo', 'vet_sau_mang_bam', 'vetsaumangbam'],
        'nhip_tho_khong_deu': ['nhip_tho_khong_deu', 'nhipthokhongdeu'],
        'tho_rut_lom_long_nguc': ['tho_rut_lom_long_nguc', 'thorutlomlongnguc'],
        'tieng_tho_bat_thuong': ['tieng_tho_bat_thuong', 'tiengthobatthuong'],
        'suy_ho_hap': ['suy_ho_hap', 'suyhohap', 'dh_suy_ho_hap', 'dhsuyhohap'],
        'nghe_phoi': ['nghe_phoi', 'nghephoi'],
        'vi_tri_mom_tim': ['vi_tri_mom_tim', 'vitrimomtim'],
        'mach_ngoai_vi': ['mach_ngoai_vi', 'machngoaivi'],
        'tieng_tim': ['tieng_tim', 'tiengtim', 'nghe_tim', 'nghetim'],
        'hinh_dang_bung_ron': ['hinh_dang_bung_ron', 'hinhdangbungron'],
        'gan_lach_to': ['gan_lach_to', 'ganlachto'],
        'khoi_bat_thuong': ['khoi_bat_thuong', 'khoibatthuong', 'khoi_bat_thuong_bung', 'khoibatthuongbung'],
        'lo_hau_mon': ['lo_hau_mon', 'lohaumon'],
        'co_quan_sinh_duc_ngoai': ['co_quan_sinh_duc_ngoai', 'coquansinhducngoai', 'cq_sinh_duc_ngoai', 'cqsinhducngoai'],
        'van_dong_khong_doi_xung': ['van_dong_khong_doi_xung', 'vandongkhongdoixung'],
        'phan_xa_bu': ['phan_xa_bu', 'phanxabu'],
        'phan_xa_nam': ['phan_xa_nam', 'phanxanam'],
        'phan_xa_moro': ['phan_xa_moro', 'phanxamoro'],
        'truong_luc_co': ['truong_luc_co', 'truonglucco'],
        'khop_hang': ['khop_hang', 'khophang'],
        'phan_xa_co': ['phan_xa_co', 'phanxaco'],
        'kiem_tra_lung_cot_song': ['kiem_tra_lung_cot_song', 'kiemtralungcotsong'],
        'tu_chi_khop': ['tu_chi_khop', 'tuchikhop', 'kham_tu_chi_khop', 'khamtuchikhop'],
        'quan_sat_dang_di': ['quan_sat_dang_di', 'quansatdangdi'],

        // Driver exam fields & Lab
        'kq_lam_sang_ho_hap': ['kq_lam_sang_ho_hap', 'kqlamsanghohap', 'ho_hap', 'kq_ho_hap'],
        'kq_co_xuong_khop': ['kq_co_xuong_khop', 'kqcoxuongkhop'],
        'noi_tiet': ['noi_tiet', 'noitiet', 'kq_noi_tiet', 'noi_khoa_noi_tiet'],
        'kq_xn_ma_tuy': ['kq_xn_ma_tuy', 'kqxnmauy', 'kq_xn_mai_tuy', 'kqxnmaituy'],
        'ket_qua_xn_nong_do_con': ['ket_qua_xn_nong_do_con', 'ketquaxnnongdocon', 'kq_xn_nong_do_con', 'nong_do_con_mau'],
        'ket_qua_xn_khac': ['ket_qua_xn_khac', 'ketquaxnkhac', 'kq_xn_khac', 'xn_khac'],
        'ket_luan_xn_khac': ['ket_luan_xn_khac', 'ketluanxnkhac']
    };

    const targetKeys = [tagLower, tagSnake];
    if (tagMap[tagLower]) {
        targetKeys.push(...tagMap[tagLower]);
    }
    
    const search = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        
        // Priority 1: Check direct keys of current object level
        for (const key of Object.keys(obj)) {
            const keyLower = key.toLowerCase().trim();
            const keySnake = keyLower.replace(/_/g, '').replace(/-/g, '').replace(/\s+/g, '');
            
            if (targetKeys.includes(keyLower) || targetKeys.includes(keySnake)) {
                if (obj[key] !== null && obj[key] !== undefined && String(obj[key]).trim() !== '') {
                    return String(obj[key]).trim();
                }
            }
        }
        
        // Priority 2: Recurse into nested child objects
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                const result = search(obj[key]);
                if (result !== null) return result;
            }
        }
        return null;
    };
    
    for (const source of sources) {
        const result = search(source);
        if (result !== null) return result;
    }
    return '';
}

// Helper: Escape XML các ký tự đặc biệt
export function escapeXml(unsafe: string | number | null | undefined): string {
    if (unsafe === null || unsafe === undefined) return '';
    const str = String(unsafe);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export type HealthCheckAgeGroup = 'UNDER_6' | 'AGE_6_TO_UNDER_18' | 'ADULT_18_PLUS';

/** Resolve the QĐ 2062 age group from the examination date, preserving legacy form intent when DOB is absent. */
export function resolveHealthCheckAgeGroup(formType: string, dob?: string | Date, examDate: string | Date = new Date()): HealthCheckAgeGroup {
    if (dob) {
        let birthYear = 0, birthMonth = 0, birthDay = 0;
        if (typeof dob === 'string') {
            const matchYmd = dob.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (matchYmd) {
                birthYear = parseInt(matchYmd[1], 10);
                birthMonth = parseInt(matchYmd[2], 10) - 1;
                birthDay = parseInt(matchYmd[3], 10);
            }
        }
        if (!birthYear) {
            const birth = new Date(dob);
            if (!Number.isNaN(birth.getTime())) {
                birthYear = birth.getFullYear();
                birthMonth = birth.getMonth();
                birthDay = birth.getDate();
            }
        }
        if (birthYear) {
            const exam = new Date(examDate);
            if (!Number.isNaN(exam.getTime())) {
                let age = exam.getFullYear() - birthYear;
                const beforeBirthday = exam.getMonth() < birthMonth || (exam.getMonth() === birthMonth && exam.getDate() < birthDay);
                if (beforeBirthday) age -= 1;
                if (age < 6) return 'UNDER_6';
                if (age < 18) return 'AGE_6_TO_UNDER_18';
                return 'ADULT_18_PLUS';
            }
        }
    }
    if (formType === '1' || formType === 'mau1-child' || formType === 'child') return 'UNDER_6';
    if (formType === '2' || formType === 'mau2-minor' || formType === 'minor') return 'AGE_6_TO_UNDER_18';
    return 'ADULT_18_PLUS';
}

export function generateXmlPayload(formType: string, master: any, clinical: any, lab: any, conclusion: any): string {
    // Merge potential nested sub-objects to ensure full extraction
    const clinicalObj = clinical || {};
    const labObj = lab || clinicalObj.lab || {};
    const conclusionObj = conclusion || clinicalObj.conclusion || {};
    const historyObj = master?.history_data || clinicalObj.history || clinicalObj.history_data || master?.history || {};

    const src = { master, clinical: clinicalObj, lab: labObj, conclusion: conclusionObj, history: historyObj };
    const settings = getHealthCheckSettings();
    const maCskcb = settings?.ma_cskcb || findValue('ma_cskcb', src) || '8934285008135';      // 13-digit GLN for THONGTINDONVI MACSKCB
    const maCskcbByt = settings?.ma_cskcb_byt || maCskcb.substring(0, 5) || '37101';  // 5-digit BYT code for MA_CSKCB in XML2
    const maGtinCskcb = settings?.ma_gtin_cskcb || findValue('ma_gtin_cskcb', src) || maCskcb;

    // Map gender string to code (1=Nam, 2=Nữ)
    let genderCode = '1';
    const rawGender = String(master.gender || findValue('GIOI_TINH', src) || '').toLowerCase().trim();
    if (rawGender === 'nữ' || rawGender === 'nu' || rawGender === '2' || rawGender === 'female' || rawGender === 'f') {
        genderCode = '2';
    }

    const formatYmd = (rawDate: any): string => {
        if (!rawDate) return '';
        if (typeof rawDate === 'string') {
            const trimmed = rawDate.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                return trimmed.replace(/-/g, '');
            }
            if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(trimmed)) {
                const parts = trimmed.split(/[/-]/);
                return `${parts[2]}${parts[1].padStart(2, '0')}${parts[0].padStart(2, '0')}`;
            }
        }
        try {
            const d = new Date(rawDate);
            if (isNaN(d.getTime())) return String(rawDate).replace(/[-/:\s]/g, '').slice(0, 8);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}${mm}${dd}`;
        } catch {
            return String(rawDate).replace(/[-/:\s]/g, '').slice(0, 8);
        }
    };

    const formatYmdHm = (rawDate: any): string => {
        if (!rawDate) return '';
        try {
            const d = new Date(rawDate);
            if (isNaN(d.getTime())) return String(rawDate).replace(/[-/:\s]/g, '').slice(0, 12);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const mi = String(d.getMinutes()).padStart(2, '0');
            return `${yyyy}${mm}${dd}${hh}${mi}`;
        } catch {
            return String(rawDate).replace(/[-/:\s]/g, '').slice(0, 12);
        }
    };

    const dobVal = formatYmd(master.dob || findValue('NGAY_SINH', src));
    let maDanTocVal = String(findValue('ethnic', src) || findValue('MA_DAN_TOC', src) || '01').trim();
    if (maDanTocVal.length === 1) maDanTocVal = '0' + maDanTocVal;
    if (!maDanTocVal || maDanTocVal === '00' || maDanTocVal === '0') maDanTocVal = '01';

    const ngayVaoVal = formatYmdHm(findValue('ngay_vao', src) || master.created_at || findValue('NGAY_VAO', src)) || formatYmdHm(new Date());
    const patientNameVal = master.patientName || master.patient_name || findValue('HO_TEN', src) || '';
    const cccdVal = master.cccd || findValue('SO_CCCD', src) || '';
    const maLkVal = master.docNo || master.doc_no || findValue('MA_LK', src) || '';

    const diaChiVal = findValue('DIA_CHI', src) || findValue('hp_address', src) || findValue('address', src) || '';
    const rawProv = findValue('MATINH_CU_TRU', src) || findValue('hp_provid', src) || findValue('hee_provid', src) || '01';
    const maTinhVal = resolveProvinceBhCode(rawProv);
    
    const rawXa = findValue('MAXA_CU_TRU', src) || findValue('hp_villid', src) || findValue('hee_villid', src) || '';
    const maXaVal = resolveVillageBhCode(rawXa, maTinhVal);

    const ngayCapCccd = formatYmd(findValue('NGAYCAP_CCCD', src)) || '';
    const noiCapCccd = findValue('NOICAP_CCCD', src) || '';
    const nhomMau = findValue('NHOM_MAU', src) || '';
    const dienThoai = findValue('DIEN_THOAI', src);
    const nguoiGiamHo = findValue('NGUOI_GIAM_HO', src);
    let soCccdNgh = String(findValue('SO_CCCD_NGH', src) || '').trim();
    if (soCccdNgh.length !== 12) soCccdNgh = '';

    const dienThoaiNgh = findValue('DIEN_THOAI_NGH', src);
    const hoTenNguoiDiCung = findValue('HO_TEN_NGUOI_DI_CUNG', src);

    let soCccdNguoiDiCung = String(findValue('SO_CCCD_NGUOI_DI_CUNG', src) || '').trim();
    if (soCccdNguoiDiCung.length !== 12) soCccdNguoiDiCung = '';
    const moiQuanHeVoiTre = findValue('MOI_QUAN_HE_VOI_TRE', src) || '0';
    const dienThoaiNguoiDiCung = findValue('DIEN_THOAI_NGUOI_DI_CUNG', src);
    const maNgheNghiep = findValue('MA_NGHE_NGHIEP', src) || '04';
    const noiLamViec = findValue('NOI_LAM_VIEC_HOC_TAP', src) || findValue('noi_cong_tac', src);
    const lyDoVv = findValue('LY_DO_VV', src) || 'Khám sức khỏe định kỳ';

    // Build XML1: THONG_TIN_HANH_CHINH
    const xml1 = `<THONG_TIN_HANH_CHINH>
							<HO_TEN>${escapeXml(patientNameVal)}</HO_TEN>
							<GIOI_TINH>${genderCode}</GIOI_TINH>
							<NGAY_SINH>${escapeXml(dobVal)}</NGAY_SINH>
							<TUAN_THAI>${escapeXml(findValue('TUAN_THAI', src) || '0')}</TUAN_THAI>
							<SINH_NON>${escapeXml(findValue('SINH_NON', src) || '0')}</SINH_NON>
							<MA_DAN_TOC>${escapeXml(maDanTocVal)}</MA_DAN_TOC>
							<SO_CCCD>${escapeXml(cccdVal)}</SO_CCCD>
							<NGAYCAP_CCCD>${escapeXml(ngayCapCccd)}</NGAYCAP_CCCD>
							<NOICAP_CCCD>${escapeXml(noiCapCccd)}</NOICAP_CCCD>
							<NHOM_MAU>${escapeXml(nhomMau)}</NHOM_MAU>
							<DIA_CHI>${escapeXml(diaChiVal)}</DIA_CHI>
							<MATINH_CU_TRU>${escapeXml(maTinhVal)}</MATINH_CU_TRU>
							<MAXA_CU_TRU>${escapeXml(maXaVal)}</MAXA_CU_TRU>
							<DIEN_THOAI>${escapeXml(dienThoai)}</DIEN_THOAI>
							<NGUOI_GIAM_HO>${escapeXml(nguoiGiamHo)}</NGUOI_GIAM_HO>
							<SO_CCCD_NGH>${escapeXml(soCccdNgh)}</SO_CCCD_NGH>
							<DIEN_THOAI_NGH>${escapeXml(dienThoaiNgh)}</DIEN_THOAI_NGH>
							<HO_TEN_NGUOI_DI_CUNG>${escapeXml(hoTenNguoiDiCung)}</HO_TEN_NGUOI_DI_CUNG>
							<SO_CCCD_NGUOI_DI_CUNG>${escapeXml(soCccdNguoiDiCung)}</SO_CCCD_NGUOI_DI_CUNG>
							<MOI_QUAN_HE_VOI_TRE>${escapeXml(moiQuanHeVoiTre)}</MOI_QUAN_HE_VOI_TRE>
							<DIEN_THOAI_NGUOI_DI_CUNG>${escapeXml(dienThoaiNguoiDiCung)}</DIEN_THOAI_NGUOI_DI_CUNG>
							<MA_NGHE_NGHIEP>${escapeXml(maNgheNghiep)}</MA_NGHE_NGHIEP>
							<NOI_LAM_VIEC_HOC_TAP>${escapeXml(noiLamViec)}</NOI_LAM_VIEC_HOC_TAP>
							<LY_DO_VV>${escapeXml(lyDoVv)}</LY_DO_VV>
						</THONG_TIN_HANH_CHINH>`;

    // Build XML2: THONG_TIN_CHUNG_VE_LAN_KHAM
    let typeVal = 'Adult';
    if (formType === 'driver' || formType === 'mau3-driver') {
        typeVal = 'Driver';
    } else {
        const ageGroup = resolveHealthCheckAgeGroup(formType, master.dob || findValue('NGAY_SINH', src), master.created_at || findValue('NGAY_VAO', src));
        typeVal = ageGroup === 'UNDER_6' ? 'ChildUnder' : ageGroup === 'AGE_6_TO_UNDER_18' ? 'Minor' : 'Adult';
    }

    const xml2 = `<THONG_TIN_CHUNG_VE_LAN_KHAM>
							<MA_LK>${escapeXml(maLkVal)}</MA_LK>
							<MA_CSKCB>${escapeXml(maCskcbByt)}</MA_CSKCB>
							<TYPE>${typeVal}</TYPE>
							<MA_GTIN_CSKCB>${escapeXml(maGtinCskcb)}</MA_GTIN_CSKCB>
							<DOI_TUONG>${escapeXml(findValue('DOI_TUONG', src) || '14')}</DOI_TUONG>
							<NGUON_CHI_TRA>${escapeXml(findValue('NGUON_CHI_TRA', src) || '9')}</NGUON_CHI_TRA>
							<MA_LOAI_KCB>${escapeXml(findValue('MA_LOAI_KCB', src) || '01')}</MA_LOAI_KCB>
							<NGAY_VAO>${escapeXml(ngayVaoVal)}</NGAY_VAO>
						</THONG_TIN_CHUNG_VE_LAN_KHAM>`;

    // Build XML3: DANH_GIA_DAU_HIEU_SINH_TON (Dấu hiệu sinh tồn / Sinh hiệu)
    const nhietDoVal = findValue('NHIET_DO', src) || '36.5';
    const machVal = findValue('MACH', src) || '80';
    const nhipThoVal = findValue('NHIP_THO', src) || '20';
    const huyetApVal = findValue('HUYET_AP', src) || '120/80';
    const spo2Val = findValue('SPO2', src) || '';

    const xml3 = `<DANH_GIA_DAU_HIEU_SINH_TON>
							<NHIET_DO>${escapeXml(nhietDoVal)}</NHIET_DO>
							<MACH>${escapeXml(machVal)}</MACH>
							<NHIP_THO>${escapeXml(nhipThoVal)}</NHIP_THO>
							<HUYET_AP>${escapeXml(huyetApVal)}</HUYET_AP>${spo2Val ? `\n							<SPO2>${escapeXml(spo2Val)}</SPO2>` : ''}
						</DANH_GIA_DAU_HIEU_SINH_TON>`;

    // Build XML7: KHAM_LAM_SANG (Branched by typeVal / formType)
    let xml7Content = '';
    if (typeVal === 'ChildUnder') {
        // Mẫu 1: Trẻ em dưới 6 tuổi
        xml7Content = `
							<MAU_SAC_DA>${escapeXml(findValue('MAU_SAC_DA', src) || '0')}</MAU_SAC_DA>
							<LONG_BAN_TAY>${escapeXml(findValue('LONG_BAN_TAY', src) || '0')}</LONG_BAN_TAY>
							<THOP>${escapeXml(findValue('THOP', src) || '0')}</THOP>
							<HINH_DANG_DAU>${escapeXml(findValue('HINH_DANG_DAU', src) || '0')}</HINH_DANG_DAU>
							<VAN_DONG_CO>${escapeXml(findValue('VAN_DONG_CO', src) || '0')}</VAN_DONG_CO>
							<KHOI_BAT_THUONG_DAU_CO>${escapeXml(findValue('KHOI_BAT_THUONG_DAU_CO', src) || '0')}</KHOI_BAT_THUONG_DAU_CO>
							<VI_TRI_HAI_MAT>${escapeXml(findValue('VI_TRI_HAI_MAT', src) || '0')}</VI_TRI_HAI_MAT>
							<MI_MAT_KET_MAC>${escapeXml(findValue('MI_MAT_KET_MAC', src) || '0')}</MI_MAT_KET_MAC>
							<LAC_MAT>${escapeXml(findValue('LAC_MAT', src) || '0')}</LAC_MAT>
							<DONG_TU>${escapeXml(findValue('DONG_TU', src) || '0')}</DONG_TU>
							<TAI_MANG_NHI>${escapeXml(findValue('TAI_MANG_NHI', src) || '0')}</TAI_MANG_NHI>
							<DAP_UNG_AM_THANH>${escapeXml(findValue('DAP_UNG_AM_THANH', src) || '0')}</DAP_UNG_AM_THANH>
							<KHOI_SUNG_SAU_TAI>${escapeXml(findValue('KHOI_SUNG_SAU_TAI', src) || '0')}</KHOI_SUNG_SAU_TAI>
							<CHAY_MU_NUOC_TAI>${escapeXml(findValue('CHAY_MU_NUOC_TAI', src) || '0')}</CHAY_MU_NUOC_TAI>
							<HINH_DANG_MUI>${escapeXml(findValue('HINH_DANG_MUI', src) || '0')}</HINH_DANG_MUI>
							<CHAY_NUOC_MUI>${escapeXml(findValue('CHAY_NUOC_MUI', src) || '0')}</CHAY_NUOC_MUI>
							<NGHET_MUI>${escapeXml(findValue('NGHET_MUI', src) || '0')}</NGHET_MUI>
							<HONG>${escapeXml(findValue('HONG', src) || '0')}</HONG>
							<HINH_DANG_MIENG>${escapeXml(findValue('HINH_DANG_MIENG', src) || '0')}</HINH_DANG_MIENG>
							<RANG_SUA_SO_SINH>${escapeXml(findValue('RANG_SUA_SO_SINH', src) || '0')}</RANG_SUA_SO_SINH>
							<HINH_DANG_LUOI>${escapeXml(findValue('HINH_DANG_LUOI', src) || '0')}</HINH_DANG_LUOI>
							<DINH_THANG_LUOI>${escapeXml(findValue('DINH_THANG_LUOI', src) || '0')}</DINH_THANG_LUOI>
							<NAM_MIENG>${escapeXml(findValue('NAM_MIENG', src) || '0')}</NAM_MIENG>
							<CAM_NHO_TUT_VE_SAU>${escapeXml(findValue('CAM_NHO_TUT_VE_SAU', src) || '0')}</CAM_NHO_TUT_VE_SAU>
							<SAU_MANG_BAM_LO>${escapeXml(findValue('SAU_MANG_BAM_LO', src) || '0')}</SAU_MANG_BAM_LO>
							<NHIP_THO_KHONG_DEU>${escapeXml(findValue('NHIP_THO_KHONG_DEU', src) || '0')}</NHIP_THO_KHONG_DEU>
							<THO_RUT_LOM_LONG_NGUC>${escapeXml(findValue('THO_RUT_LOM_LONG_NGUC', src) || '0')}</THO_RUT_LOM_LONG_NGUC>
							<TIENG_THO_BAT_THUONG>${escapeXml(findValue('TIENG_THO_BAT_THUONG', src) || '0')}</TIENG_THO_BAT_THUONG>
							<SUY_HO_HAP>${escapeXml(findValue('SUY_HO_HAP', src) || '0')}</SUY_HO_HAP>
							<NGHE_PHOI>${escapeXml(findValue('NGHE_PHOI', src) || '0')}</NGHE_PHOI>
							<VI_TRI_MOM_TIM>${escapeXml(findValue('VI_TRI_MOM_TIM', src) || '0')}</VI_TRI_MOM_TIM>
							<MACH_NGOAI_VI>${escapeXml(findValue('MACH_NGOAI_VI', src) || '0')}</MACH_NGOAI_VI>
							<TIENG_TIM>${escapeXml(findValue('TIENG_TIM', src) || '0')}</TIENG_TIM>
							<HINH_DANG_BUNG_RON>${escapeXml(findValue('HINH_DANG_BUNG_RON', src) || '0')}</HINH_DANG_BUNG_RON>
							<GAN_LACH_TO>${escapeXml(findValue('GAN_LACH_TO', src) || '0')}</GAN_LACH_TO>
							<KHOI_BAT_THUONG>${escapeXml(findValue('KHOI_BAT_THUONG', src) || '0')}</KHOI_BAT_THUONG>
							<LO_HAU_MON>${escapeXml(findValue('LO_HAU_MON', src) || '0')}</LO_HAU_MON>
							<CO_QUAN_SINH_DUC_NGOAI>${escapeXml(findValue('CO_QUAN_SINH_DUC_NGOAI', src) || '0')}</CO_QUAN_SINH_DUC_NGOAI>
							<VAN_DONG_KHONG_DOI_XUNG>${escapeXml(findValue('VAN_DONG_KHONG_DOI_XUNG', src) || '0')}</VAN_DONG_KHONG_DOI_XUNG>
							<PHAN_XA_BU>${escapeXml(findValue('PHAN_XA_BU', src) || '0')}</PHAN_XA_BU>
							<PHAN_XA_NAM>${escapeXml(findValue('PHAN_XA_NAM', src) || '0')}</PHAN_XA_NAM>
							<PHAN_XA_MORO>${escapeXml(findValue('PHAN_XA_MORO', src) || '0')}</PHAN_XA_MORO>
							<TRUONG_LUC_CO>${escapeXml(findValue('TRUONG_LUC_CO', src) || '0')}</TRUONG_LUC_CO>
							<KHOP_HANG>${escapeXml(findValue('KHOP_HANG', src) || '0')}</KHOP_HANG>
							<PHAN_XA_CO>${escapeXml(findValue('PHAN_XA_CO', src) || '0')}</PHAN_XA_CO>
							<KIEM_TRA_LUNG_COT_SONG>${escapeXml(findValue('KIEM_TRA_LUNG_COT_SONG', src) || '0')}</KIEM_TRA_LUNG_COT_SONG>
							<TU_CHI_KHOP>${escapeXml(findValue('TU_CHI_KHOP', src) || '0')}</TU_CHI_KHOP>
							<QUAN_SAT_DANG_DI>${escapeXml(findValue('QUAN_SAT_DANG_DI', src) || '0')}</QUAN_SAT_DANG_DI>`;
    } else if (typeVal === 'Minor') {
        // Mẫu 2: Người từ đủ 06 tuổi đến dưới 18 tuổi
        xml7Content = `
							<NHI_KHOA_TUAN_HOAN>${escapeXml(findValue('NHI_KHOA_TUAN_HOAN', src))}</NHI_KHOA_TUAN_HOAN>
							<CKDT_NHI_KHOA_TUAN_HOAN>${escapeXml(findValue('CKDT_NHI_KHOA_TUAN_HOAN', src))}</CKDT_NHI_KHOA_TUAN_HOAN>
							<NHI_KHOA_HO_HAP>${escapeXml(findValue('NHI_KHOA_HO_HAP', src))}</NHI_KHOA_HO_HAP>
							<CKDT_NHI_KHOA_HO_HAP>${escapeXml(findValue('CKDT_NHI_KHOA_HO_HAP', src))}</CKDT_NHI_KHOA_HO_HAP>
							<NHI_KHOA_TIEU_HOA>${escapeXml(findValue('NHI_KHOA_TIEU_HOA', src))}</NHI_KHOA_TIEU_HOA>
							<CKDT_NHI_KHOA_TIEU_HOA>${escapeXml(findValue('CKDT_NHI_KHOA_TIEU_HOA', src))}</CKDT_NHI_KHOA_TIEU_HOA>
							<NHI_KHOA_THAN_TN_SD>${escapeXml(findValue('NHI_KHOA_THAN_TN_SD', src))}</NHI_KHOA_THAN_TN_SD>
							<CKDT_NHI_KHOA_THAN_TN_SD>${escapeXml(findValue('CKDT_NHI_KHOA_THAN_TN_SD', src))}</CKDT_NHI_KHOA_THAN_TN_SD>
							<NHI_KHOA_THAN_KINH>${escapeXml(findValue('NHI_KHOA_THAN_KINH', src))}</NHI_KHOA_THAN_KINH>
							<CKDT_NHI_KHOA_THAN_KINH>${escapeXml(findValue('CKDT_NHI_KHOA_THAN_KINH', src))}</CKDT_NHI_KHOA_THAN_KINH>
							<NHI_KHOA_TAM_THAN>${escapeXml(findValue('NHI_KHOA_TAM_THAN', src))}</NHI_KHOA_TAM_THAN>
							<CKDT_NHI_KHOA_TAM_THAN>${escapeXml(findValue('CKDT_NHI_KHOA_TAM_THAN', src))}</CKDT_NHI_KHOA_TAM_THAN>
							<NHI_KHOA_LAM_SANG_KHAC>${escapeXml(findValue('NHI_KHOA_LAM_SANG_KHAC', src))}</NHI_KHOA_LAM_SANG_KHAC>
							<CKDT_NHI_KHOA_LAM_SANG_KHAC>${escapeXml(findValue('CKDT_NHI_KHOA_LAM_SANG_KHAC', src))}</CKDT_NHI_KHOA_LAM_SANG_KHAC>
							<KHONG_KINH_MAT_PHAI>${escapeXml(findValue('KHONG_KINH_MAT_PHAI', src))}</KHONG_KINH_MAT_PHAI>
							<KHONG_KINH_MAT_TRAI>${escapeXml(findValue('KHONG_KINH_MAT_TRAI', src))}</KHONG_KINH_MAT_TRAI>
							<CO_KINH_MAT_PHAI>${escapeXml(findValue('CO_KINH_MAT_PHAI', src))}</CO_KINH_MAT_PHAI>
							<CO_KINH_MAT_TRAI>${escapeXml(findValue('CO_KINH_MAT_TRAI', src))}</CO_KINH_MAT_TRAI>
							<BENH_KHAC_MAT>${escapeXml(findValue('BENH_KHAC_MAT', src))}</BENH_KHAC_MAT>
							<CKDT_KHAM_MAT>${escapeXml(findValue('CKDT_KHAM_MAT', src))}</CKDT_KHAM_MAT>
							<KHAM_MAT_PL>${escapeXml(findValue('KHAM_MAT_PL', src))}</KHAM_MAT_PL>
							<TAI_TRAI_NOI_THUONG>${escapeXml(findValue('TAI_TRAI_NOI_THUONG', src))}</TAI_TRAI_NOI_THUONG>
							<TAI_TRAI_NOI_THAM>${escapeXml(findValue('TAI_TRAI_NOI_THAM', src))}</TAI_TRAI_NOI_THAM>
							<TAI_PHAI_NOI_THUONG>${escapeXml(findValue('TAI_PHAI_NOI_THUONG', src))}</TAI_PHAI_NOI_THUONG>
							<TAI_PHAI_NOI_THAM>${escapeXml(findValue('TAI_PHAI_NOI_THAM', src))}</TAI_PHAI_NOI_THAM>
							<BENH_TAI_MUI_HONG>${escapeXml(findValue('BENH_TAI_MUI_HONG', src))}</BENH_TAI_MUI_HONG>
							<BENH_KHAC_TAI_MUI_HONG>${escapeXml(findValue('BENH_KHAC_TAI_MUI_HONG', src))}</BENH_KHAC_TAI_MUI_HONG>
							<KHAM_TAI_MUI_HONG_PL>${escapeXml(findValue('KHAM_TAI_MUI_HONG_PL', src))}</KHAM_TAI_MUI_HONG_PL>
							<CKDT_KHAM_TAI_MUI_HONG>${escapeXml(findValue('CKDT_KHAM_TAI_MUI_HONG', src))}</CKDT_KHAM_TAI_MUI_HONG>
							<HAM_TREN>${escapeXml(findValue('HAM_TREN', src))}</HAM_TREN>
							<HAM_DUOI>${escapeXml(findValue('HAM_DUOI', src))}</HAM_DUOI>
							<BENH_RANG_HAM_MAT>${escapeXml(findValue('BENH_RANG_HAM_MAT', src))}</BENH_RANG_HAM_MAT>
							<BENH_KHAC_RANG_HAM_MAT>${escapeXml(findValue('BENH_KHAC_RANG_HAM_MAT', src))}</BENH_KHAC_RANG_HAM_MAT>
							<KHAM_RANG_HAM_MAT_PL>${escapeXml(findValue('KHAM_RANG_HAM_MAT_PL', src))}</KHAM_RANG_HAM_MAT_PL>
							<CKDT_KHAM_RANG_HAM_MAT>${escapeXml(findValue('CKDT_KHAM_RANG_HAM_MAT', src))}</CKDT_KHAM_RANG_HAM_MAT>`;
    } else if (typeVal === 'Driver') {
        // Mẫu 3: Khám sức khỏe định kỳ cho người lái xe (QĐ 1551/QĐ-BYT & QĐ 2062)
        xml7Content = `
							<NOI_KHOA_TAM_THAN>${escapeXml(findValue('NOI_KHOA_TAM_THAN', src) || findValue('tam_than', src))}</NOI_KHOA_TAM_THAN>
							<NOI_KHOA_THAN_KINH>${escapeXml(findValue('NOI_KHOA_THAN_KINH', src) || findValue('than_kinh', src))}</NOI_KHOA_THAN_KINH>
							<KHONG_KINH_MAT_PHAI>${escapeXml(findValue('KHONG_KINH_MAT_PHAI', src) || findValue('khong_kinh_mat_phai', src))}</KHONG_KINH_MAT_PHAI>
							<KHONG_KINH_MAT_TRAI>${escapeXml(findValue('KHONG_KINH_MAT_TRAI', src) || findValue('khong_kinh_mat_trai', src))}</KHONG_KINH_MAT_TRAI>
							<CO_KINH_MAT_PHAI>${escapeXml(findValue('CO_KINH_MAT_PHAI', src) || findValue('co_kinh_mat_phai', src))}</CO_KINH_MAT_PHAI>
							<CO_KINH_MAT_TRAI>${escapeXml(findValue('CO_KINH_MAT_TRAI', src) || findValue('co_kinh_mat_trai', src))}</CO_KINH_MAT_TRAI>
							<KHONG_KINH_HAI_MAT>${escapeXml(findValue('KHONG_KINH_HAI_MAT', src) || findValue('khong_kinh_hai_mat', src))}</KHONG_KINH_HAI_MAT>
							<CO_KINH_HAI_MAT>${escapeXml(findValue('CO_KINH_HAI_MAT', src) || findValue('co_kinh_hai_mat', src))}</CO_KINH_HAI_MAT>
							<THI_TRUONG_NGANG_HAIMAT>${escapeXml(findValue('THI_TRUONG_NGANG_HAIMAT', src) || findValue('thi_truong_ngang_hai_mat', src))}</THI_TRUONG_NGANG_HAIMAT>
							<THI_TRUONG_DUNG_HAIMAT>${escapeXml(findValue('THI_TRUONG_DUNG_HAIMAT', src) || findValue('thi_truong_dung_hai_mat', src))}</THI_TRUONG_DUNG_HAIMAT>
							<SAC_GIAC>${escapeXml(findValue('SAC_GIAC', src) || findValue('sac_giac', src))}</SAC_GIAC>
							<BENH_KHAC_MAT>${escapeXml(findValue('BENH_KHAC_MAT', src) || findValue('benh_khac_mat', src))}</BENH_KHAC_MAT>
							<TAI_TRAI_NOI_THUONG>${escapeXml(findValue('TAI_TRAI_NOI_THUONG', src) || findValue('tai_trai_noi_thuong', src))}</TAI_TRAI_NOI_THUONG>
							<TAI_TRAI_NOI_THAM>${escapeXml(findValue('TAI_TRAI_NOI_THAM', src) || findValue('tai_trai_noi_tham', src))}</TAI_TRAI_NOI_THAM>
							<TAI_PHAI_NOI_THUONG>${escapeXml(findValue('TAI_PHAI_NOI_THUONG', src) || findValue('tai_phai_noi_thuong', src))}</TAI_PHAI_NOI_THUONG>
							<TAI_PHAI_NOI_THAM>${escapeXml(findValue('TAI_PHAI_NOI_THAM', src) || findValue('tai_phai_noi_tham', src))}</TAI_PHAI_NOI_THAM>
							<BENH_KHAC_TAI_MUI_HONG>${escapeXml(findValue('BENH_KHAC_TAI_MUI_HONG', src) || findValue('benh_khac_tai_mui_hong', src))}</BENH_KHAC_TAI_MUI_HONG>
							<KQ_LAM_SANG_HO_HAP>${escapeXml(findValue('KQ_LAM_SANG_HO_HAP', src) || findValue('ho_hap', src))}</KQ_LAM_SANG_HO_HAP>
							<KQ_CO_XUONG_KHOP>${escapeXml(findValue('KQ_CO_XUONG_KHOP', src) || findValue('kq_co_xuong_khop', src))}</KQ_CO_XUONG_KHOP>
							<NOI_TIET>${escapeXml(findValue('NOI_TIET', src) || findValue('noi_tiet', src))}</NOI_TIET>
							<KET_QUA_KHAM_SAN_PHU_KHOA>${escapeXml(findValue('KET_QUA_KHAM_SAN_PHU_KHOA', src) || findValue('kham_san_phu_khoa', src))}</KET_QUA_KHAM_SAN_PHU_KHOA>
							<KHAM_SAN_PHU_KHOA_PL>${escapeXml(findValue('KHAM_SAN_PHU_KHOA_PL', src) || findValue('kham_san_phu_khoa_pl', src))}</KHAM_SAN_PHU_KHOA_PL>
							<KQ_XN_MA_TUY>${escapeXml(findValue('KQ_XN_MA_TUY', src) || findValue('kq_xn_mai_tuy', src) || findValue('kq_xn_ma_tuy', src))}</KQ_XN_MA_TUY>
							<KET_QUA_XN_NONG_DO_CON>${escapeXml(findValue('KET_QUA_XN_NONG_DO_CON', src) || findValue('kq_xn_nong_do_con', src))}</KET_QUA_XN_NONG_DO_CON>
							<KET_QUA_XN_KHAC>${escapeXml(findValue('KET_QUA_XN_KHAC', src) || findValue('kq_xn_khac', src))}</KET_QUA_XN_KHAC>
							<KET_LUAN_XN_KHAC>${escapeXml(findValue('KET_LUAN_XN_KHAC', src) || findValue('ket_luan_xn_khac', src))}</KET_LUAN_XN_KHAC>`;
    } else {
        // Mẫu 3 / Khác: Người từ đủ 18 tuổi trở lên (Adult)
        const specMeta = clinicalObj?.clinical_exam?.specialty_metadata || clinicalObj?.specialty_metadata || {};
        const isSpecExamined = (key: string, ...valKeys: string[]) => {
            const meta = specMeta[key];
            if (meta && typeof meta === 'object') {
                const normStatus = String(meta.status || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D');
                if (normStatus === 'DA_KHAM' || normStatus === 'DA_DUYET' || normStatus === 'DA_KET_LUAN') return true;
                if (normStatus === 'CHUA_KHAM') return false;
            }
            for (const vk of valKeys) {
                const v = findValue(vk, src);
                if (v && v.trim() !== '') return true;
            }
            return false;
        };

        const isTuanHoan = isSpecExamined('circulatory', 'internal', 'noi_khoa_tuan_hoan', 'kq_tim_mach', 'tim_mach');
        const isHoHap = isSpecExamined('respiratory', 'internal', 'noi_khoa_ho_hap', 'kq_ho_hap', 'ho_hap');
        const isTieuHoa = isSpecExamined('digestive', 'internal', 'noi_khoa_tieu_hoa', 'kq_tieu_hoa', 'tieu_hoa');
        const isThan = isSpecExamined('urinary', 'internal', 'noi_khoa_than_tn_sd', 'kq_tiet_nieu', 'tiet_nieu_sinh_duc');
        const isNoiTiet = isSpecExamined('endocrine', 'internal', 'noi_khoa_noi_tiet', 'kq_noi_tiet', 'noi_tiet');
        const isCoXuongKhop = isSpecExamined('musculoskeletal', 'internal', 'noi_khoa_co_xuong_khop', 'kq_co_xuong_khop');
        const isThanKinh = isSpecExamined('neurology', 'internal', 'noi_khoa_than_kinh', 'kq_than_kinh', 'than_kinh');
        const isTamThan = isSpecExamined('psychiatry', 'internal', 'noi_khoa_tam_than', 'kq_tam_than', 'tam_than');
        const isSurgery = isSpecExamined('surgery', 'kq_ngoai_khoa', 'external', 'kham_ngoai_khoa', 'ngoai_khoa');
        const isDermatology = isSpecExamined('dermatology', 'kq_da_lieu', 'dermatology', 'da_lieu');
        const isGynecology = isSpecExamined('gynecology', 'kham_san_phu_khoa', 'gynecology', 'san_phu_khoa', 'kq_sinh_duc');
        const isEye = isSpecExamined('eye', 'khong_kinh_mat_phai', 'khong_kinh_mat_trai', 'benh_khac_mat', 'kham_mat', 'eye');
        const isEnt = isSpecExamined('ent', 'tai_trai_noi_thuong', 'tai_phai_noi_thuong', 'benh_tai_mui_hong', 'benh_khac_tai_mui_hong', 'ent');
        const isDental = isSpecExamined('dental', 'ham_tren', 'ham_duoi', 'benh_rang_ham_mat', 'benh_khac_rang_ham_mat', 'dental');

        xml7Content = `
							<NOI_KHOA_TUAN_HOAN>${escapeXml(isTuanHoan ? findValue('NOI_KHOA_TUAN_HOAN', src) : '')}</NOI_KHOA_TUAN_HOAN>
							<NOI_KHOA_TUAN_HOAN_PL>${escapeXml(isTuanHoan ? findValue('NOI_KHOA_TUAN_HOAN_PL', src) : '')}</NOI_KHOA_TUAN_HOAN_PL>
							<CKDT_NOI_KHOA_TUAN_HOAN>${escapeXml(isTuanHoan ? (findValue('CKDT_NOI_KHOA_TUAN_HOAN', src) || specMeta?.circulatory?.doctor_name || specMeta?.circulatory?.doctor || '') : '')}</CKDT_NOI_KHOA_TUAN_HOAN>
							<NOI_KHOA_HO_HAP>${escapeXml(isHoHap ? findValue('NOI_KHOA_HO_HAP', src) : '')}</NOI_KHOA_HO_HAP>
							<NOI_KHOA_HO_HAP_PL>${escapeXml(isHoHap ? findValue('NOI_KHOA_HO_HAP_PL', src) : '')}</NOI_KHOA_HO_HAP_PL>
							<CKDT_NOI_KHOA_HO_HAP>${escapeXml(isHoHap ? (findValue('CKDT_NOI_KHOA_HO_HAP', src) || specMeta?.respiratory?.doctor_name || specMeta?.respiratory?.doctor || '') : '')}</CKDT_NOI_KHOA_HO_HAP>
							<NOI_KHOA_TIEU_HOA>${escapeXml(isTieuHoa ? findValue('NOI_KHOA_TIEU_HOA', src) : '')}</NOI_KHOA_TIEU_HOA>
							<NOI_KHOA_TIEU_HOA_PL>${escapeXml(isTieuHoa ? findValue('NOI_KHOA_TIEU_HOA_PL', src) : '')}</NOI_KHOA_TIEU_HOA_PL>
							<CKDT_NOI_KHOA_TIEU_HOA>${escapeXml(isTieuHoa ? (findValue('CKDT_NOI_KHOA_TIEU_HOA', src) || specMeta?.digestive?.doctor_name || specMeta?.digestive?.doctor || '') : '')}</CKDT_NOI_KHOA_TIEU_HOA>
							<NOI_KHOA_THAN_TN_SD>${escapeXml(isThan ? findValue('NOI_KHOA_THAN_TN_SD', src) : '')}</NOI_KHOA_THAN_TN_SD>
							<NOI_KHOA_THAN_TN_SD_PL>${escapeXml(isThan ? findValue('NOI_KHOA_THAN_TN_SD_PL', src) : '')}</NOI_KHOA_THAN_TN_SD_PL>
							<CKDT_NOI_KHOA_THAN_TN_SD>${escapeXml(isThan ? (findValue('CKDT_NOI_KHOA_THAN_TN_SD', src) || specMeta?.urinary?.doctor_name || specMeta?.urinary?.doctor || '') : '')}</CKDT_NOI_KHOA_THAN_TN_SD>
							<NOI_KHOA_NOI_TIET>${escapeXml(isNoiTiet ? findValue('NOI_KHOA_NOI_TIET', src) : '')}</NOI_KHOA_NOI_TIET>
							<NOI_KHOA_NOI_TIET_PL>${escapeXml(isNoiTiet ? findValue('NOI_KHOA_NOI_TIET_PL', src) : '')}</NOI_KHOA_NOI_TIET_PL>
							<CKDT_NOI_KHOA_NOI_TIET>${escapeXml(isNoiTiet ? (findValue('CKDT_NOI_KHOA_NOI_TIET', src) || specMeta?.endocrine?.doctor_name || specMeta?.endocrine?.doctor || '') : '')}</CKDT_NOI_KHOA_NOI_TIET>
							<NOI_KHOA_CO_XUONG_KHOP>${escapeXml(isCoXuongKhop ? findValue('NOI_KHOA_CO_XUONG_KHOP', src) : '')}</NOI_KHOA_CO_XUONG_KHOP>
							<NOI_KHOA_CO_XUONG_KHOP_PL>${escapeXml(isCoXuongKhop ? findValue('NOI_KHOA_CO_XUONG_KHOP_PL', src) : '')}</NOI_KHOA_CO_XUONG_KHOP_PL>
							<CKDT_NOI_KHOA_CO_XUONG_KHOP>${escapeXml(isCoXuongKhop ? (findValue('CKDT_NOI_KHOA_CO_XUONG_KHOP', src) || specMeta?.musculoskeletal?.doctor_name || specMeta?.musculoskeletal?.doctor || '') : '')}</CKDT_NOI_KHOA_CO_XUONG_KHOP>
							<NOI_KHOA_THAN_KINH>${escapeXml(isThanKinh ? findValue('NOI_KHOA_THAN_KINH', src) : '')}</NOI_KHOA_THAN_KINH>
							<NOI_KHOA_THAN_KINH_PL>${escapeXml(isThanKinh ? findValue('NOI_KHOA_THAN_KINH_PL', src) : '')}</NOI_KHOA_THAN_KINH_PL>
							<CKDT_NOI_KHOA_THAN_KINH>${escapeXml(isThanKinh ? (findValue('CKDT_NOI_KHOA_THAN_KINH', src) || specMeta?.neurology?.doctor_name || specMeta?.neurology?.doctor || '') : '')}</CKDT_NOI_KHOA_THAN_KINH>
							<NOI_KHOA_TAM_THAN>${escapeXml(isTamThan ? findValue('NOI_KHOA_TAM_THAN', src) : '')}</NOI_KHOA_TAM_THAN>
							<NOI_KHOA_TAM_THAN_PL>${escapeXml(isTamThan ? findValue('NOI_KHOA_TAM_THAN_PL', src) : '')}</NOI_KHOA_TAM_THAN_PL>
							<CKDT_NOI_KHOA_TAM_THAN>${escapeXml(isTamThan ? (findValue('CKDT_NOI_KHOA_TAM_THAN', src) || specMeta?.psychiatry?.doctor_name || specMeta?.psychiatry?.doctor || '') : '')}</CKDT_NOI_KHOA_TAM_THAN>
							<KET_QUA_KHAM_NGOAI_KHOA>${escapeXml(isSurgery ? (findValue('kq_ngoai_khoa', src) || findValue('external', src) || findValue('kham_ngoai_khoa', src)) : '')}</KET_QUA_KHAM_NGOAI_KHOA>
							<KHAM_NGOAI_KHOA_PL>${escapeXml(isSurgery ? findValue('KHAM_NGOAI_KHOA_PL', src) : '')}</KHAM_NGOAI_KHOA_PL>
							<CKDT_KHAM_NGOAI_KHOA>${escapeXml(isSurgery ? (findValue('CKDT_KHAM_NGOAI_KHOA', src) || specMeta?.surgery?.doctor_name || specMeta?.surgery?.doctor || '') : '')}</CKDT_KHAM_NGOAI_KHOA>
							<KET_QUA_KHAM_DA_LIEU>${escapeXml(isDermatology ? findValue('KET_QUA_KHAM_DA_LIEU', src) : '')}</KET_QUA_KHAM_DA_LIEU>
							<KHAM_DA_LIEU_PL>${escapeXml(isDermatology ? findValue('KHAM_DA_LIEU_PL', src) : '')}</KHAM_DA_LIEU_PL>
							<CKDT_KHAM_DA_LIEU>${escapeXml(isDermatology ? (findValue('CKDT_KHAM_DA_LIEU', src) || specMeta?.dermatology?.doctor_name || specMeta?.dermatology?.doctor || '') : '')}</CKDT_KHAM_DA_LIEU>
							<KET_QUA_KHAM_SAN_PHU_KHOA>${escapeXml(isGynecology ? findValue('KET_QUA_KHAM_SAN_PHU_KHOA', src) : '')}</KET_QUA_KHAM_SAN_PHU_KHOA>
							<KHAM_SAN_PHU_KHOA_PL>${escapeXml(isGynecology ? findValue('KHAM_SAN_PHU_KHOA_PL', src) : '')}</KHAM_SAN_PHU_KHOA_PL>
							<CKDT_KHAM_SAN_PHU_KHOA>${escapeXml(isGynecology ? (findValue('CKDT_KHAM_SAN_PHU_KHOA', src) || specMeta?.gynecology?.doctor_name || specMeta?.gynecology?.doctor || '') : '')}</CKDT_KHAM_SAN_PHU_KHOA>
							<KHONG_KINH_MAT_PHAI>${escapeXml(isEye ? findValue('KHONG_KINH_MAT_PHAI', src) : '')}</KHONG_KINH_MAT_PHAI>
							<KHONG_KINH_MAT_TRAI>${escapeXml(isEye ? findValue('KHONG_KINH_MAT_TRAI', src) : '')}</KHONG_KINH_MAT_TRAI>
							<CO_KINH_MAT_PHAI>${escapeXml(isEye ? findValue('CO_KINH_MAT_PHAI', src) : '')}</CO_KINH_MAT_PHAI>
							<CO_KINH_MAT_TRAI>${escapeXml(isEye ? findValue('CO_KINH_MAT_TRAI', src) : '')}</CO_KINH_MAT_TRAI>
							<BENH_KHAC_MAT>${escapeXml(isEye ? findValue('BENH_KHAC_MAT', src) : '')}</BENH_KHAC_MAT>
							<CKDT_KHAM_MAT>${escapeXml(isEye ? (findValue('CKDT_KHAM_MAT', src) || specMeta?.eye?.doctor_name || specMeta?.eye?.doctor || '') : '')}</CKDT_KHAM_MAT>
							<KHAM_MAT_PL>${escapeXml(isEye ? findValue('KHAM_MAT_PL', src) : '')}</KHAM_MAT_PL>
							<TAI_TRAI_NOI_THUONG>${escapeXml(isEnt ? findValue('TAI_TRAI_NOI_THUONG', src) : '')}</TAI_TRAI_NOI_THUONG>
							<TAI_TRAI_NOI_THAM>${escapeXml(isEnt ? findValue('TAI_TRAI_NOI_THAM', src) : '')}</TAI_TRAI_NOI_THAM>
							<TAI_PHAI_NOI_THUONG>${escapeXml(isEnt ? findValue('TAI_PHAI_NOI_THUONG', src) : '')}</TAI_PHAI_NOI_THUONG>
							<TAI_PHAI_NOI_THAM>${escapeXml(isEnt ? findValue('TAI_PHAI_NOI_THAM', src) : '')}</TAI_PHAI_NOI_THAM>
							<BENH_TAI_MUI_HONG>${escapeXml(isEnt ? findValue('BENH_TAI_MUI_HONG', src) : '')}</BENH_TAI_MUI_HONG>
							<BENH_KHAC_TAI_MUI_HONG>${escapeXml(isEnt ? findValue('BENH_KHAC_TAI_MUI_HONG', src) : '')}</BENH_KHAC_TAI_MUI_HONG>
							<KHAM_TAI_MUI_HONG_PL>${escapeXml(isEnt ? findValue('KHAM_TAI_MUI_HONG_PL', src) : '')}</KHAM_TAI_MUI_HONG_PL>
							<CKDT_KHAM_TAI_MUI_HONG>${escapeXml(isEnt ? (findValue('CKDT_KHAM_TAI_MUI_HONG', src) || specMeta?.ent?.doctor_name || specMeta?.ent?.doctor || '') : '')}</CKDT_KHAM_TAI_MUI_HONG>
							<HAM_TREN>${escapeXml(isDental ? findValue('HAM_TREN', src) : '')}</HAM_TREN>
							<HAM_DUOI>${escapeXml(isDental ? findValue('HAM_DUOI', src) : '')}</HAM_DUOI>
							<BENH_RANG_HAM_MAT>${escapeXml(isDental ? findValue('BENH_RANG_HAM_MAT', src) : '')}</BENH_RANG_HAM_MAT>
							<BENH_KHAC_RANG_HAM_MAT>${escapeXml(isDental ? findValue('BENH_KHAC_RANG_HAM_MAT', src) : '')}</BENH_KHAC_RANG_HAM_MAT>
							<KHAM_RANG_HAM_MAT_PL>${escapeXml(isDental ? findValue('KHAM_RANG_HAM_MAT_PL', src) : '')}</KHAM_RANG_HAM_MAT_PL>
							<CKDT_KHAM_RANG_HAM_MAT>${escapeXml(isDental ? (findValue('CKDT_KHAM_RANG_HAM_MAT', src) || specMeta?.dental?.doctor_name || specMeta?.dental?.doctor || '') : '')}</CKDT_KHAM_RANG_HAM_MAT>`;
    }

    const xml7 = `<KHAM_LAM_SANG>${xml7Content}
						</KHAM_LAM_SANG>`;

    // Build XML9: TIEN_SU_BENH_TAT (Tiền sử bệnh tật & tiêm chủng)
    const xml9 = `<TIEN_SU_BENH_TAT>
							<TSGD_MAC_BENH>${escapeXml(findValue('TSGD_MAC_BENH', src) || '0')}</TSGD_MAC_BENH>
							<TSGD_MA_BENH>${escapeXml(findValue('TSGD_MA_BENH', src) || '')}</TSGD_MA_BENH>
							<TS_TIEP_XUC_LAO>${escapeXml(findValue('TS_TIEP_XUC_LAO', src) || '0')}</TS_TIEP_XUC_LAO>
							<SAN_KHOA>${escapeXml(findValue('SAN_KHOA', src) || '0')}</SAN_KHOA>
							<SAN_KHOA_KHONG_BT>${escapeXml(findValue('SAN_KHOA_KHONG_BT', src) || '0')}</SAN_KHOA_KHONG_BT>
							<MA_BENH_SAN_KHOA_KHONG_BT>${escapeXml(findValue('MA_BENH_SAN_KHOA_KHONG_BT', src) || '')}</MA_BENH_SAN_KHOA_KHONG_BT>
							<TIEM_CHUNG_BCG>${escapeXml(findValue('TIEM_CHUNG_BCG', src) || '0')}</TIEM_CHUNG_BCG>
							<TIEM_CHUNG_BH_HG_UV>${escapeXml(findValue('TIEM_CHUNG_BH_HG_UV', src) || '0')}</TIEM_CHUNG_BH_HG_UV>
							<TIEM_CHUNG_SOI>${escapeXml(findValue('TIEM_CHUNG_SOI', src) || '0')}</TIEM_CHUNG_SOI>
							<TIEM_CHUNG_BAI_LIET>${escapeXml(findValue('TIEM_CHUNG_BAI_LIET', src) || '0')}</TIEM_CHUNG_BAI_LIET>
							<TIEM_CHUNG_VNNB_B>${escapeXml(findValue('TIEM_CHUNG_VNNB_B', src) || '0')}</TIEM_CHUNG_VNNB_B>
							<TIEM_CHUNG_VGB>${escapeXml(findValue('TIEM_CHUNG_VGB', src) || '0')}</TIEM_CHUNG_VGB>
							<TIEM_CHUNG_CAC_LOAI_KHAC>${escapeXml(findValue('TIEM_CHUNG_CAC_LOAI_KHAC', src) || '0')}</TIEM_CHUNG_CAC_LOAI_KHAC>
							<TIEM_CHUNG_VAC_XIN_KHAC>${escapeXml(findValue('TIEM_CHUNG_VAC_XIN_KHAC', src) || '')}</TIEM_CHUNG_VAC_XIN_KHAC>
							<TSBT_MAC_BENH>${escapeXml(findValue('TSBT_MAC_BENH', src) || (findValue('TSBT_MA_BENH', src) ? '1' : '0'))}</TSBT_MAC_BENH>
							<TSBT_MA_BENH>${escapeXml(findValue('TSBT_MA_BENH', src) || '')}</TSBT_MA_BENH>
							<TSBT_DANG_DIEU_TRI_BENH>${escapeXml(findValue('TSBT_DANG_DIEU_TRI_BENH', src) || '0')}</TSBT_DANG_DIEU_TRI_BENH>
							<BENH_DANG_DIEU_TRI>${escapeXml(findValue('BENH_DANG_DIEU_TRI', src) || findValue('TSBT_TEN_THUOC_LIEU_LUONG', src) || '')}</BENH_DANG_DIEU_TRI>
							<TSBT_BENH_TRONG_5_NAM_QUA>${escapeXml(findValue('TSBT_BENH_TRONG_5_NAM_QUA', src) || '0')}</TSBT_BENH_TRONG_5_NAM_QUA>
							<TSBT_BENH_THAN_KINH>${escapeXml(findValue('TSBT_BENH_THAN_KINH', src) || '0')}</TSBT_BENH_THAN_KINH>
							<TSBT_BENH_MAT>${escapeXml(findValue('TSBT_BENH_MAT', src) || '0')}</TSBT_BENH_MAT>
							<TSBT_BENH_TAI>${escapeXml(findValue('TSBT_BENH_TAI', src) || '0')}</TSBT_BENH_TAI>
							<TSBT_BENH_TIM>${escapeXml(findValue('TSBT_BENH_TIM', src) || '0')}</TSBT_BENH_TIM>
							<TSBT_PHAU_THUAT_TIM>${escapeXml(findValue('TSBT_PHAU_THUAT_TIM', src) || '0')}</TSBT_PHAU_THUAT_TIM>
							<TSBT_TANG_HUYET_AP>${escapeXml(findValue('TSBT_TANG_HUYET_AP', src) || '0')}</TSBT_TANG_HUYET_AP>
							<TSBT_KHO_THO>${escapeXml(findValue('TSBT_KHO_THO', src) || '0')}</TSBT_KHO_THO>
							<TSBT_BENH_PHOI>${escapeXml(findValue('TSBT_BENH_PHOI', src) || '0')}</TSBT_BENH_PHOI>
							<TSBT_BENH_THAN>${escapeXml(findValue('TSBT_BENH_THAN', src) || '0')}</TSBT_BENH_THAN>
							<TSBT_NGHIEN_RUOU>${escapeXml(findValue('TSBT_NGHIEN_RUOU', src) || '0')}</TSBT_NGHIEN_RUOU>
							<TSBT_DAI_THAO_DUONG>${escapeXml(findValue('TSBT_DAI_THAO_DUONG', src) || '0')}</TSBT_DAI_THAO_DUONG>
							<TSBT_BENH_TAM_THAN>${escapeXml(findValue('TSBT_BENH_TAM_THAN', src) || '0')}</TSBT_BENH_TAM_THAN>
							<TSBT_MAT_Y_THUC>${escapeXml(findValue('TSBT_MAT_Y_THUC', src) || '0')}</TSBT_MAT_Y_THUC>
							<TSBT_NGAT>${escapeXml(findValue('TSBT_NGAT', src) || '0')}</TSBT_NGAT>
							<TSBT_BENH_TIEU_HOA>${escapeXml(findValue('TSBT_BENH_TIEU_HOA', src) || '0')}</TSBT_BENH_TIEU_HOA>
							<TSBT_ROI_LOAN_GIAC_NGU>${escapeXml(findValue('TSBT_ROI_LOAN_GIAC_NGU', src) || '0')}</TSBT_ROI_LOAN_GIAC_NGU>
							<TSBT_TAI_BIEN>${escapeXml(findValue('TSBT_TAI_BIEN', src) || '0')}</TSBT_TAI_BIEN>
							<TSBT_BENH_COT_SONG>${escapeXml(findValue('TSBT_BENH_COT_SONG', src) || '0')}</TSBT_BENH_COT_SONG>
							<TSBT_RUOU_THUONG_XUYEN>${escapeXml(findValue('TSBT_RUOU_THUONG_XUYEN', src) || '0')}</TSBT_RUOU_THUONG_XUYEN>
							<TSBT_MA_TUY>${escapeXml(findValue('TSBT_MA_TUY', src) || '0')}</TSBT_MA_TUY>
							<TSBT_BENH_KHAC>${escapeXml(findValue('TSBT_BENH_KHAC', src) || '0')}</TSBT_BENH_KHAC>
							<TSBT_MA_BENH_KHAC>${escapeXml(findValue('TSBT_MA_BENH_KHAC', src) || '')}</TSBT_MA_BENH_KHAC>
							<TSBT_TEN_THUOC_LIEU_LUONG>${escapeXml(findValue('TSBT_TEN_THUOC_LIEU_LUONG', src) || findValue('BENH_DANG_DIEU_TRI', src) || '')}</TSBT_TEN_THUOC_LIEU_LUONG>
							<TSBT_THAI_SAN>${escapeXml(findValue('TSBT_THAI_SAN', src) || findValue('tsbt_thai_san', src) || '0')}</TSBT_THAI_SAN>
							<TSBT_MA_BENH_THAI_SAN>${escapeXml(findValue('TSBT_MA_BENH_THAI_SAN', src) || findValue('tsbt_ma_benh_thai_san', src) || '')}</TSBT_MA_BENH_THAI_SAN>
							<TSBT_TEN_THUOC_THAI_SAN>${escapeXml(findValue('TSBT_TEN_THUOC_THAI_SAN', src) || findValue('tsbt_ten_thuoc_thai_san', src) || '')}</TSBT_TEN_THUOC_THAI_SAN>
						</TIEN_SU_BENH_TAT>`;

    // Build XML10: KHAM_THE_LUC
    const chieuCaoVal = findValue('CHIEU_CAO', src) || '165';
    const canNangVal = findValue('CAN_NANG', src) || '60';
    const bmiVal = findValue('CHI_SO_BMI', src) || '22.0';
    const khamTheLucPlVal = findValue('KHAM_THE_LUC_PL', src) || '1';

    const xml10 = `<KHAM_THE_LUC>
							<CHIEU_CAO>${escapeXml(chieuCaoVal)}</CHIEU_CAO>
							<CAN_NANG>${escapeXml(canNangVal)}</CAN_NANG>
							<CHI_SO_BMI>${escapeXml(bmiVal)}</CHI_SO_BMI>
							<MACH>${escapeXml(machVal)}</MACH>
							<HUYET_AP>${escapeXml(huyetApVal)}</HUYET_AP>
							<KHAM_THE_LUC_PL>${escapeXml(khamTheLucPlVal)}</KHAM_THE_LUC_PL>
						</KHAM_THE_LUC>`;

    // Build XML11: KHAM_CAN_LAM_SANG (Array of CHI_TIET_CLS matching sample xml.txt exactly)
    let paraclItems = '';
    const itemsList: any[] = [];

    if (labObj?.paraclinical_items && Array.isArray(labObj.paraclinical_items) && labObj.paraclinical_items.length > 0) {
        itemsList.push(...labObj.paraclinical_items);
    } else {
        // Fallback: If paraclinical_items is not an array, convert discrete lab fields
        const blood = labObj?.blood_test || clinicalObj?.lab || {};
        const urine = labObj?.urine_test || labObj?.nuoc_tieu_test_nhanh || {};
        
        if (blood.hemoglobin) itemsList.push({ service_code: '03C3.1.89', index_code: 'H02', name: 'Huyết sắc tố (Hemoglobin)', value: blood.hemoglobin, unit: 'g/L', description: 'Chỉ số Hemoglobin', conclusion: 'Bình thường' });
        if (blood.glycemia) itemsList.push({ service_code: '03C3.1.90', index_code: 'G01', name: 'Đường huyết (Glycemia)', value: blood.glycemia, unit: 'mmol/L', description: 'Định lượng Glucose máu', conclusion: 'Bình thường' });
        if (blood.chi_so_hc) itemsList.push({ service_code: '03C3.1.91', index_code: 'HC', name: 'Hồng cầu', value: blood.chi_so_hc, unit: 'T/L', description: 'Số lượng hồng cầu', conclusion: 'Bình thường' });
        if (blood.chi_so_bach_cau) itemsList.push({ service_code: '03C3.1.92', index_code: 'BC', name: 'Bạch cầu', value: blood.chi_so_bach_cau, unit: 'G/L', description: 'Số lượng bạch cầu', conclusion: 'Bình thường' });
        if (blood.chi_so_tieu_cau) itemsList.push({ service_code: '03C3.1.93', index_code: 'TC', name: 'Tiểu cầu', value: blood.chi_so_tieu_cau, unit: 'G/L', description: 'Số lượng tiểu cầu', conclusion: 'Bình thường' });
        if (blood.ure) itemsList.push({ service_code: '03C3.1.94', index_code: 'URE', name: 'Ure máu', value: blood.ure, unit: 'mmol/L', description: 'Định lượng Ure', conclusion: 'Bình thường' });
        if (blood.creatinin) itemsList.push({ service_code: '03C3.1.95', index_code: 'CRE', name: 'Creatinin máu', value: blood.creatinin, unit: 'umol/L', description: 'Định lượng Creatinin', conclusion: 'Bình thường' });
        if (urine.protein || urine.protein_nuoc_tieu) itemsList.push({ service_code: '03C3.1.96', index_code: 'PRO_U', name: 'Protein nước tiểu', value: urine.protein || urine.protein_nuoc_tieu, unit: 'mg/dL', description: 'Protein niệu', conclusion: 'Bình thường' });
        if (urine.duong || urine.duong_nuoc_tieu) itemsList.push({ service_code: '03C3.1.97', index_code: 'GLU_U', name: 'Đường nước tiểu', value: urine.duong || urine.duong_nuoc_tieu, unit: 'mmol/L', description: 'Glucose niệu', conclusion: 'Bình thường' });
        if (labObj?.imaging?.ket_qua) itemsList.push({ service_code: '18.0068.0013', index_code: 'X01', name: 'Chẩn đoán hình ảnh', value: labObj.imaging.ket_qua, unit: 'Lần', description: labObj.imaging.ket_qua, conclusion: 'Bình thường' });
    }

    for (const item of itemsList) {
        const svcCode = item.hfl_ma_chi_so || item.ma_chi_so || item.reg_code || item.hfl_regcode || item.service_code || 'B1100467';
        const idxCode = item.index_code || item.service_code || svcCode;

        let rawVal = item.value !== null && item.value !== undefined ? String(item.value).trim() : '';
        let itemUnit = item.unit ? String(item.unit).trim() : '';

        // Tách số và đơn vị đo nếu rawVal có dạng "4.1 mmol/L", "140 g/L"
        const valUnitMatch = rawVal.match(/^([\d.,><=+-]+)\s+([a-zA-Z%µ/^\d*]+.*)$/);
        if (valUnitMatch) {
            rawVal = valUnitMatch[1].trim();
            if (!itemUnit || itemUnit.toLowerCase() === 'lần' || itemUnit.toLowerCase() === 'gói') {
                itemUnit = valUnitMatch[2].trim();
            }
        }

        if (!itemUnit) itemUnit = 'Lần';

        const itemDesc = item.description !== null && item.description !== undefined ? String(item.description).trim() : '';
        const itemConc = item.conclusion !== null && item.conclusion !== undefined ? String(item.conclusion).trim() : '';

        paraclItems += `
							<CHI_TIET_CLS>
								<MA_DICH_VU>${escapeXml(svcCode)}</MA_DICH_VU>
								<MA_CHI_SO>${escapeXml(idxCode)}</MA_CHI_SO>
								<GIA_TRI>${escapeXml(rawVal)}</GIA_TRI>
								<DON_VI_DO>${escapeXml(itemUnit)}</DON_VI_DO>
								<MO_TA>${escapeXml(itemDesc)}</MO_TA>
								<KET_LUAN>${escapeXml(itemConc)}</KET_LUAN>
							</CHI_TIET_CLS>`;
    }

    const xml11 = `<KHAM_CAN_LAM_SANG>
							<DANH_SACH_CLS>${paraclItems ? paraclItems + '\n							' : ''}</DANH_SACH_CLS>
						</KHAM_CAN_LAM_SANG>`;

    // Build XML12: KET_LUAN
    let phanLoaiSkVal = findValue('PHAN_LOAI_SK', src);
    const romanMap: Record<string, string> = { 'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5' };
    if (phanLoaiSkVal && romanMap[phanLoaiSkVal.toUpperCase()]) {
        phanLoaiSkVal = romanMap[phanLoaiSkVal.toUpperCase()];
    }
    if (!phanLoaiSkVal) phanLoaiSkVal = '1';

    const ketLuanBenhVal = findValue('KET_LUAN_BENH', src) || findValue('diagnosis', src) || 'Bình thường';
    const cacVanDeVal = findValue('CAC_VAN_DE_SUC_KHOE', src) || '';
    const cacBenhTatVal = findValue('CAC_BENH_TAT_NEU_CO', src) || '';

    const xml12 = `<KET_LUAN>
							<PHAN_LOAI_SK>${escapeXml(phanLoaiSkVal)}</PHAN_LOAI_SK>
							<KET_LUAN_BENH>${escapeXml(ketLuanBenhVal)}</KET_LUAN_BENH>
							<CAC_VAN_DE_SUC_KHOE>${escapeXml(cacVanDeVal)}</CAC_VAN_DE_SUC_KHOE>
							<CAC_BENH_TAT_NEU_CO>${escapeXml(cacBenhTatVal)}</CAC_BENH_TAT_NEU_CO>
						</KET_LUAN>`;

    // Packaging into Envelope KHAMSUCKHOE matching sample xml.txt / data.xml exactly
    const todayYmd = formatYmd(new Date());
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<KHAMSUCKHOE
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:xsd="http://www.w3.org/2001/XMLSchema">
	<THONGTINDONVI>
		<MACSKCB>${escapeXml(maCskcb)}</MACSKCB>
	</THONGTINDONVI>
	<THONGTINHOSO>
		<NGAYLAP>${todayYmd}</NGAYLAP>
		<SOLUONGHOSO>1</SOLUONGHOSO>
		<DANHSACHHOSO>
			<HOSO>
				<FILEHOSO>
					<LOAIHOSO>XML1</LOAIHOSO>
					<NOIDUNGFILE>
${xml1}
					</NOIDUNGFILE>
				</FILEHOSO>
				<FILEHOSO>
					<LOAIHOSO>XML2</LOAIHOSO>
					<NOIDUNGFILE>
${xml2}
					</NOIDUNGFILE>
				</FILEHOSO>
				<FILEHOSO>
					<LOAIHOSO>XML7</LOAIHOSO>
					<NOIDUNGFILE>
${xml7}
					</NOIDUNGFILE>
				</FILEHOSO>
				<FILEHOSO>
					<LOAIHOSO>XML9</LOAIHOSO>
					<NOIDUNGFILE>
${xml9}
					</NOIDUNGFILE>
				</FILEHOSO>
				<FILEHOSO>
					<LOAIHOSO>XML10</LOAIHOSO>
					<NOIDUNGFILE>
${xml10}
					</NOIDUNGFILE>
				</FILEHOSO>
				<FILEHOSO>
					<LOAIHOSO>XML11</LOAIHOSO>
					<NOIDUNGFILE>
${xml11}
					</NOIDUNGFILE>
				</FILEHOSO>
				<FILEHOSO>
					<LOAIHOSO>XML12</LOAIHOSO>
					<NOIDUNGFILE>
${xml12}
					</NOIDUNGFILE>
				</FILEHOSO>
			</HOSO>
		</DANHSACHHOSO>
	</THONGTINHOSO>
	<CHUKYDONVI>
		<CKS_NGUOI_KET_LUAN></CKS_NGUOI_KET_LUAN>
		<CKS_BENH_VIEN></CKS_BENH_VIEN>
	</CHUKYDONVI>
</KHAMSUCKHOE>`;

    return envelope;
}
