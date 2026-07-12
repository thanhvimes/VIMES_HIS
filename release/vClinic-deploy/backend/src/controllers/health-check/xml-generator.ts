import { getHealthCheckSettings } from '../../config/health-check-settings';

// Helper: Tìm kiếm giá trị trường linh hoạt từ nhiều nguồn (case-insensitive & snake/camel-case)
export function findValue(tag: string, ...sources: any[]): string {
    const tagLower = tag.toLowerCase();
    const tagSnake = tagLower.replace(/_/g, '').replace(/-/g, '');
    
    const tagMap: Record<string, string[]> = {
        'ho_ten': ['patientname', 'patient_name', 'name'],
        'so_cccd': ['cccd', 'socccd'],
        'ngay_sinh': ['dob', 'ngaysinh', 'birth'],
        'gioi_tinh': ['gender', 'gioitinh'],
        'ma_lk': ['docno', 'doc_no', 'malk'],
        'chieu_cao': ['height', 'chieucao'],
        'can_nang': ['weight', 'cannang'],
        'chi_so_bmi': ['bmi', 'chisobmi'],
        'mach': ['pulse', 'mach'],
        'huyet_ap': ['blood_pressure', 'bloodpressure', 'bp', 'huyetap'],
        'noi_khoa': ['internal', 'noikhoa', 'internalexam', 'internal_exam'],
        'mat': ['eye', 'mat', 'eyeexam', 'eye_exam'],
        'tai_mui_hong': ['ent', 'taimuihong', 'entexam', 'ent_exam'],
        'rang_ham_mat': ['dental', 'ranghammat', 'dentalexam', 'dental_exam'],
        'ngoai_khoa': ['external', 'ngoaikhoa', 'externalexam', 'external_exam'],
        
        // Thông tin hành chính cư trú & bổ sung QĐ 1551
        'dia_chi': ['address', 'diachi', 'dia_chi', 'hp_dtladdr'],
        'dien_thoai': ['phone', 'dienthoai', 'dien_thoai', 'telephone', 'hd_telephone'],
        'nhom_mau': ['blood_group', 'bloodgroup', 'nhommau', 'nhom_mau'],
        'doi_tuong': ['target_group', 'targetgroup', 'doituong', 'doi_tuong', 'hd_object'],
        'nguon_kinh_phi': ['funding_source', 'fundingsource', 'nguonkinhphi', 'nguon_kinh_phi'],
        'ma_dan_toc': ['ethnic', 'madantoc', 'ma_dan_toc', 'hp_ethnic'],
        'ngaycap_cccd': ['cccd_date', 'cccddate', 'ngaycapcccd', 'ngaycap_cccd'],
        'noicap_cccd': ['cccd_place', 'cccdplace', 'noicapcccd', 'noicap_cccd'],
        'ly_do_vv': ['ly_do_vv', 'lydovv', 'ly_do_ksk', 'lydoksk'],
        'matinh_cu_tru': ['matinh_cu_tru', 'matinhcutru'],
        'maxa_cu_tru': ['maxa_cu_tru', 'maxacutru'],
        
        // Đặc thù các biểu mẫu
        'nguoi_giam_ho': ['nguoi_giam_ho', 'nguoigiamho'],
        'so_cccd_ngh': ['so_cccd_ngh', 'socccdngh'],
        'ho_ten_nguoi_di_cung': ['ho_ten_nguoi_di_cung', 'hotennguoidicung'],
        'so_cccd_nguoi_di_cung': ['so_cccd_nguoi_di_cung', 'socccdnguoidicung'],
        'moi_quan_he_voi_tre': ['moi_quan_he_voi_tre', 'moiquanhevoitre'],
        'hang_lai_xe': ['hang_lai_xe', 'hanglaixe'],
        'chuc_danh': ['chuc_danh', 'chucdanh'],
        'noi_cong_tac': ['noi_cong_tac', 'noicongtac'],
        'vi_tri_lam_viec': ['vi_tri_lam_viec', 'vitrilamviec'],
        'bo_phan_lam_viec': ['bo_phan_lam_viec', 'bophanlamviec'],
        'ma_cskcb': ['ma_cskcb', 'macskcb'],
        'quoc_tich': ['quoc_tich', 'quoctich'],
        'con_thu_may': ['con_thu_may', 'conthumay'],
        'tong_so_con': ['tong_so_con', 'tongsocon'],
        'matinh_cu_tru_ngh_me': ['matinh_cu_tru_ngh_me', 'matinhcutrunghme'],
        'maxa_cu_tru_ngh_me': ['maxa_cu_tru_ngh_me', 'maxacutrunghme'],
        'chuc_danh_tren_tau': ['chuc_danh_tren_tau', 'chucdanhtrentau'],
        'ten_chu_tau': ['ten_chu_tau', 'tenchutau'],
        'dia_chi_chu_tau': ['dia_chi_chu_tau', 'diachichutau'],
        'khu_vuc_hoat_dong_tau': ['khu_vuc_hoat_dong_tau', 'khuvuchoatdongtau']
    };

    const targetKeys = [tagLower, tagSnake];
    if (tagMap[tagLower]) {
        targetKeys.push(...tagMap[tagLower]);
    }
    
    const search = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        
        for (const key of Object.keys(obj)) {
            const keyLower = key.toLowerCase();
            const keySnake = keyLower.replace(/_/g, '').replace(/-/g, '');
            
            if (targetKeys.includes(keyLower) || targetKeys.includes(keySnake)) {
                if (obj[key] !== null && obj[key] !== undefined) {
                    return String(obj[key]);
                }
            }
        }
        
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

// Helper: Sinh XML tự động theo đặc tả 17 mẫu biểu KSK của Bộ Y tế
export function generateXmlPayload(formType: string, master: any, clinical: any, lab: any, conclusion: any): string {
    const src = { master, clinical, lab, conclusion };
    const settings = getHealthCheckSettings();
    const maGtinCskcb = settings?.ma_gtin_cskcb || findValue('ma_gtin_cskcb', src) || '1234567890123';
    const maCskcb = settings?.ma_cskcb || findValue('ma_cskcb', src) || '15124';
    
    // Map gender string to code (1=Nam, 2=Nữ)
    let genderCode = '1';
    const rawGender = master.gender || findValue('GIOI_TINH', src) || findValue('GIOI_TINH_CO_SAN', src);
    if (rawGender === 'Nữ' || rawGender === '2') {
        genderCode = '2';
    }

    // Format dates consistently (YYYY-MM-DD)
    const formatXmlDate = (rawDate: string): string => {
        if (!rawDate) return '';
        try {
            return new Date(rawDate).toISOString().split('T')[0];
        } catch {
            return rawDate;
        }
    };

    const dobVal = formatXmlDate(master.dob || findValue('NGAY_SINH', src));
    let tuoiVal = '';
    if (dobVal) {
        const birthYear = new Date(dobVal).getFullYear();
        const currentYear = new Date().getFullYear();
        tuoiVal = String(currentYear - birthYear);
    }
    const maDanTocVal = findValue('ethnic', src) || findValue('MA_DAN_TOC', src) || '01';

    const ngayVaoVal = formatXmlDate(findValue('ngay_vao', src) || master.created_at || findValue('NGAY_VAO', src)) || new Date().toISOString().split('T')[0];
    
    const patientNameVal = master.patientName || master.patient_name || findValue('HO_TEN', src);
    const cccdVal = master.cccd || findValue('SO_CCCD', src);
    const maLkVal = master.docNo || master.doc_no || findValue('MA_LK', src);

    // 1. Phân nhóm XML
    let adminXml = `
    <HO_TEN>${escapeXml(patientNameVal)}</HO_TEN>
    <SO_CCCD>${escapeXml(cccdVal)}</SO_CCCD>
    <NGAY_SINH>${escapeXml(dobVal)}</NGAY_SINH>
    <TUOI>${escapeXml(tuoiVal)}</TUOI>
    <MA_DAN_TOC>${escapeXml(maDanTocVal)}</MA_DAN_TOC>
    <QUOC_TICH>${escapeXml(findValue('quoc_tich', src) || 'VN')}</QUOC_TICH>
    <GIOI_TINH>${genderCode}</GIOI_TINH>
    <DIA_CHI>${escapeXml(findValue('DIA_CHI', src))}</DIA_CHI>
    <DIEN_THOAI>${escapeXml(findValue('DIEN_THOAI', src))}</DIEN_THOAI>
    <MATINH_CU_TRU>${escapeXml(findValue('MATINH_CU_TRU', src))}</MATINH_CU_TRU>
    <MAXA_CU_TRU>${escapeXml(findValue('MAXA_CU_TRU', src))}</MAXA_CU_TRU>
    <NHOM_MAU>${escapeXml(findValue('NHOM_MAU', src))}</NHOM_MAU>
    <DOI_TUONG>${escapeXml(findValue('DOI_TUONG', src) || '14')}</DOI_TUONG>
    <NGUON_KINH_PHI>${escapeXml(findValue('NGUON_KINH_PHI', src) || '9')}</NGUON_KINH_PHI>
    <MA_GTIN_CSKCB>${escapeXml(maGtinCskcb)}</MA_GTIN_CSKCB>
    <NGAYCAP_CCCD>${escapeXml(findValue('cccd_date', src) || findValue('ngaycap_cccd', src))}</NGAYCAP_CCCD>
    <NOICAP_CCCD>${escapeXml(findValue('cccd_place', src) || findValue('noicap_cccd', src))}</NOICAP_CCCD>
    <LY_DO_VV>${escapeXml(findValue('ly_do_vv', src) || findValue('ly_do_ksk', src))}</LY_DO_VV>
    <MA_NGHE_NGHIEP>${escapeXml(findValue('ma_nghe_nghiep', src) || '01')}</MA_NGHE_NGHIEP>
    <NOI_CONG_TAC_HIEN_TAI>${escapeXml(findValue('noi_cong_tac_hien_tai', src))}</NOI_CONG_TAC_HIEN_TAI>`;

    // Add parent or guardian if student or child (QĐ 2062: Mẫu 2 is student)
    if (formType === '2') {
        adminXml += `
    <NGUOI_GIAM_HO>${escapeXml(findValue('NGUOI_GIAM_HO', src))}</NGUOI_GIAM_HO>
    <SO_CCCD_NGH>${escapeXml(findValue('SO_CCCD_NGH', src))}</SO_CCCD_NGH>`;
    } else if (formType === '1') {
        adminXml += `
    <HO_TEN_NGUOI_DI_CUNG>${escapeXml(findValue('HO_TEN_NGUOI_DI_CUNG', src))}</HO_TEN_NGUOI_DI_CUNG>
    <SO_CCCD_NGUOI_DI_CUNG>${escapeXml(findValue('SO_CCCD_NGUOI_DI_CUNG', src))}</SO_CCCD_NGUOI_DI_CUNG>
    <MOI_QUAN_HE_VOI_TRE>${escapeXml(findValue('MOI_QUAN_HE_VOI_TRE', src))}</MOI_QUAN_HE_VOI_TRE>
    <CON_THU_MAY>${escapeXml(findValue('con_thu_may', src))}</CON_THU_MAY>
    <TONG_SO_CON>${escapeXml(findValue('tong_so_con', src))}</TONG_SO_CON>
    <MATINH_CU_TRU_NGH_ME>${escapeXml(findValue('matinh_cu_tru_ngh_me', src))}</MATINH_CU_TRU_NGH_ME>
    <MAXA_CU_TRU_NGH_ME>${escapeXml(findValue('maxa_cu_tru_ngh_me', src))}</MAXA_CU_TRU_NGH_ME>`;
    }

    // Add driver license class
    if (formType === '3') {
        adminXml += `
    <HANG_LAI_XE>${escapeXml(findValue('HANG_LAI_XE', src))}</HANG_LAI_XE>`;
    }
    // Add railway details
    if (formType === '4') {
        adminXml += `
    <CHUC_DANH>${escapeXml(findValue('CHUC_DANH', src))}</CHUC_DANH>
    <NOI_CONG_TAC>${escapeXml(findValue('NOI_CONG_TAC', src))}</NOI_CONG_TAC>`;
    }
    // Add sailor details
    if (formType === '5') {
        adminXml += `
    <VI_TRI_LAM_VIEC>${escapeXml(findValue('VI_TRI_LAM_VIEC', src))}</VI_TRI_LAM_VIEC>
    <BO_PHAN_LAM_VIEC>${escapeXml(findValue('BO_PHAN_LAM_VIEC', src))}</BO_PHAN_LAM_VIEC>
    <CHUC_DANH_TREN_TAU>${escapeXml(findValue('chuc_danh_tren_tau', src))}</CHUC_DANH_TREN_TAU>
    <TEN_CHU_TAU>${escapeXml(findValue('ten_chu_tau', src))}</TEN_CHU_TAU>
    <DIA_CHI_CHU_TAU>${escapeXml(findValue('dia_chi_chu_tau', src))}</DIA_CHI_CHU_TAU>
    <KHU_VUC_HOAT_DONG_TAU>${escapeXml(findValue('khu_vuc_hoat_dong_tau', src))}</KHU_VUC_HOAT_DONG_TAU>`;
    }

    // Add work history for Mẫu 3 (QĐ 2062: Mẫu 3 is adult)
    if (formType === '3') {
        adminXml += `
    <NGAY_BAT_DAU_LAM_VIEC_HIEN_TAI>${escapeXml(findValue('ngay_bat_dau_lam_viec_hien_tai', src))}</NGAY_BAT_DAU_LAM_VIEC_HIEN_TAI>
    <NGHE_CONG_VIEC_TRUOC_DAY>${escapeXml(findValue('nghe_cong_viec_truoc_day', src))}</NGHE_CONG_VIEC_TRUOC_DAY>
    <THOI_GIAN_LAM_VIEC_TRUOC_DAY_NAM>${escapeXml(findValue('thoi_gian_lam_viec_truoc_day_nam', src))}</THOI_GIAN_LAM_VIEC_TRUOC_DAY_NAM>
    <THOI_GIAN_LAM_VIEC_TRUOC_DAY_THANG>${escapeXml(findValue('thoi_gian_lam_viec_truoc_day_thang', src))}</THOI_GIAN_LAM_VIEC_TRUOC_DAY_THANG>
    <TU_NGAY_LAM_VIEC_TRUOC_DAY>${escapeXml(findValue('tu_ngay_lam_viec_truoc_day', src))}</TU_NGAY_LAM_VIEC_TRUOC_DAY>
    <DEN_NGAY_LAM_VIEC_TRUOC_DAY>${escapeXml(findValue('den_ngay_lam_viec_truoc_day', src))}</DEN_NGAY_LAM_VIEC_TRUOC_DAY>`;
    }

    // 2. Tiền sử bệnh
    let historyXml = '';
    if (formType === 'driver') {
        // Lái xe has comprehensive list of checkboxes
        historyXml = `
    <TSGD_MAC_BENH>${escapeXml(findValue('TSGD_MAC_BENH', src) || '0')}</TSGD_MAC_BENH>
    <TSGD_MA_BENH>${escapeXml(findValue('TSGD_MA_BENH', src))}</TSGD_MA_BENH>
    <TS_BENH_THUONG_5_NAM>${escapeXml(findValue('TS_BENH_THUONG_5_NAM', src) || '0')}</TS_BENH_THUONG_5_NAM>
    <TS_THAN_KINH_CHAN_THUONG_DAU>${escapeXml(findValue('TS_THAN_KINH_CHAN_THUONG_DAU', src) || '0')}</TS_THAN_KINH_CHAN_THUONG_DAU>
    <TS_BENH_MAT_GIAM_THI_LUC>${escapeXml(findValue('TS_BENH_MAT_GIAM_THI_LUC', src) || '0')}</TS_BENH_MAT_GIAM_THI_LUC>
    <TS_BENH_TAI_GIAM_NGHE>${escapeXml(findValue('TS_BENH_TAI_GIAM_NGHE', src) || '0')}</TS_BENH_TAI_GIAM_NGHE>
    <TS_BENH_TIM_MACH>${escapeXml(findValue('TS_BENH_TIM_MACH', src) || '0')}</TS_BENH_TIM_MACH>
    <TS_PHAU_THUAT_TIM_MACH>${escapeXml(findValue('TS_PHAU_THUAT_TIM_MACH', src) || '0')}</TS_PHAU_THUAT_TIM_MACH>
    <TS_TANG_HUYET_AP>${escapeXml(findValue('TS_TANG_HUYET_AP', src) || '0')}</TS_TANG_HUYET_AP>
    <TS_KHO_THO>${escapeXml(findValue('TS_KHO_THO', src) || '0')}</TS_KHO_THO>
    <TS_BENH_PHOI_HEN>${escapeXml(findValue('TS_BENH_PHOI_HEN', src) || '0')}</TS_BENH_PHOI_HEN>
    <TS_BENH_THAN_LOC_MAU>${escapeXml(findValue('TS_BENH_THAN_LOC_MAU', src) || '0')}</TS_BENH_THAN_LOC_MAU>
    <TS_DAI_THAO_DUONG>${escapeXml(findValue('TS_DAI_THAO_DUONG', src) || '0')}</TS_DAI_THAO_DUONG>
    <TS_BENH_TAM_THAN>${escapeXml(findValue('TS_BENH_TAM_THAN', src) || '0')}</TS_BENH_TAM_THAN>
    <TS_MAT_ROI_LOAN_Y_THUC>${escapeXml(findValue('TS_MAT_ROI_LOAN_Y_THUC', src) || '0')}</TS_MAT_ROI_LOAN_Y_THUC>
    <TS_NGAT_CHONG_MAT>${escapeXml(findValue('TS_NGAT_CHONG_MAT', src) || '0')}</TS_NGAT_CHONG_MAT>
    <TS_BENH_TIEU_HOA>${escapeXml(findValue('TS_BENH_TIEU_HOA', src) || '0')}</TS_BENH_TIEU_HOA>
    <TS_ROI_LOAN_GIAC_NGU>${escapeXml(findValue('TS_ROI_LOAN_GIAC_NGU', src) || '0')}</TS_ROI_LOAN_GIAC_NGU>
    <TS_TAI_BIEN_MACH_NAO>${escapeXml(findValue('TS_TAI_BIEN_MACH_NAO', src) || findValue('TS_TAI_BIEN_MACH_MAU_NAO', src) || '0')}</TS_TAI_BIEN_MACH_NAO>
    <TS_SU_DUNG_RUOU>${escapeXml(findValue('ts_su_dung_ruou', src) || '0')}</TS_SU_DUNG_RUOU>
    <TS_SU_DUNG_MA_TUY>${escapeXml(findValue('ts_su_dung_ma_tuy', src) || '0')}</TS_SU_DUNG_MA_TUY>
    <TS_BENH_COT_SONG>${escapeXml(findValue('ts_benh_cot_song', src) || '0')}</TS_BENH_COT_SONG>
    <TS_MA_BENH_BAN_THAN>${escapeXml(findValue('TS_MA_BENH_BAN_THAN', src) || findValue('tsbt_ma_benh', src))}</TS_MA_BENH_BAN_THAN>
    <TS_MAC_BENH>${escapeXml(findValue('TS_MAC_BENH', src) || findValue('co_dang_dieu_tri_benh', src) || '0')}</TS_MAC_BENH>
    <TEN_THUOC>${escapeXml(findValue('TEN_THUOC', src) || findValue('ten_thuoc', src))}</TEN_THUOC>
    <TSBT_MA_BENH_NGHE_NGHIEP>${escapeXml(findValue('tsbt_ma_benh_nghe_nghiep', src))}</TSBT_MA_BENH_NGHE_NGHIEP>
    <TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP>${escapeXml(findValue('tsbt_nam_phat_hien_benh_nghe_nghiep', src))}</TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP`;
    } else if (formType === '3') {
        // Người lớn (Mẫu 3 QĐ 2062): Tiền sử gia đình, bản thân, bệnh nghề nghiệp & sản phụ khoa
        historyXml = `
    <TSGD_MA_BENH>${escapeXml(findValue('TSGD_MA_BENH', src))}</TSGD_MA_BENH>
    <TSBT_MA_BENH>${escapeXml(findValue('TSBT_MA_BENH', src))}</TSBT_MA_BENH>
    <TSBT_NAM_PHAT_HIEN_BENH>${escapeXml(findValue('TSBT_NAM_PHAT_HIEN_BENH', src))}</TSBT_NAM_PHAT_HIEN_BENH>
    <TSBT_MA_BENH_NGHE_NGHIEP>${escapeXml(findValue('tsbt_ma_benh_nghe_nghiep', src))}</TSBT_MA_BENH_NGHE_NGHIEP>
    <TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP>${escapeXml(findValue('tsbt_nam_phat_hien_benh_nghe_nghiep', src))}</TSBT_NAM_PHAT_HIEN_BENH_NGHE_NGHIEP`;
        
        if (genderCode === '2') {
            historyXml += `
    <CO_KINH_NGUYET_NAM_BAO_NHIEU_TUOI>${escapeXml(findValue('co_kinh_nguyet_nam_bao_nhieu_tuoi', src))}</CO_KINH_NGUYET_NAM_BAO_NHIEU_TUOI>
    <TINH_CHAT_KINH_NGUYET>${escapeXml(findValue('tinh_chat_kinh_nguyet', src) || '1')}</TINH_CHAT_KINH_NGUYET>
    <CHU_KY_KINH>${escapeXml(findValue('chu_ky_kinh', src))}</CHU_KY_KINH>
    <LUONG_KINH>${escapeXml(findValue('luong_kinh', src))}</LUONG_KINH>
    <DAU_BUNG_KINH>${escapeXml(findValue('dau_bung_kinh', src) || '0')}</DAU_BUNG_KINH>
    <DA_LAP_GIA_DINH>${escapeXml(findValue('da_lap_gia_dinh', src) || '0')}</DA_LAP_GIA_DINH>
    <PARA>${escapeXml(findValue('para', src))}</PARA>
    <DA_TUNG_MO_SAN_PHU_KHOA_CHUA>${escapeXml(findValue('da_tung_mo_san_phu_khoa_chua', src) || '0')}</DA_TUNG_MO_SAN_PHU_KHOA_CHUA>
    <SO_LAN_MO_SAN_PHU_KHOA>${escapeXml(findValue('so_lan_mo_san_phu_khoa', src))}</SO_LAN_MO_SAN_PHU_KHOA>
    <GHI_RO_MO_SAN_PHU_KHOA>${escapeXml(findValue('ghi_ro_mo_san_phu_khoa', src))}</GHI_RO_MO_SAN_PHU_KHOA>
    <DANG_AP_DUNG_BPTT_KHONG>${escapeXml(findValue('dang_ap_dung_bptt_khong', src) || '0')}</DANG_AP_DUNG_BPTT_KHONG>
    <BIEN_PHAP_TRANH_THAI>${escapeXml(findValue('bien_phap_tranh_thai', src) || '1')}</BIEN_PHAP_TRANH_THAI`;
        }
    } else if (formType === '1' || formType === '2') {
        // Trẻ em & Học sinh (Mẫu 1 & Mẫu 2 QĐ 2062): Vaccine & Tiền sử tiêm chủng
        historyXml = `
    <TIEM_CHUNG_BCG>${escapeXml(findValue('TIEM_CHUNG_BCG', src) || '99')}</TIEM_CHUNG_BCG>
    <TIEM_CHUNG_BH_HG_UV>${escapeXml(findValue('TIEM_CHUNG_BH_HG_UV', src) || '99')}</TIEM_CHUNG_BH_HG_UV>
    <TIEM_CHUNG_SOI>${escapeXml(findValue('TIEM_CHUNG_SOI', src) || '99')}</TIEM_CHUNG_SOI>
    <TIEM_CHUNG_BAI_LIET>${escapeXml(findValue('TIEM_CHUNG_BAI_LIET', src) || '99')}</TIEM_CHUNG_BAI_LIET>
    <TIEM_CHUNG_VNNB_B>${escapeXml(findValue('TIEM_CHUNG_VNNB_B', src) || '99')}</TIEM_CHUNG_VNNB_B>
    <TIEM_CHUNG_VGB>${escapeXml(findValue('TIEM_CHUNG_VGB', src) || '99')}</TIEM_CHUNG_VGB>`;
    }

    // 3. Khám thể lực
    let physicalXml = `
    <CHIEU_CAO>${escapeXml(findValue('CHIEU_CAO', src))}</CHIEU_CAO>
    <CAN_NANG>${escapeXml(findValue('CAN_NANG', src))}</CAN_NANG>
    <CHI_SO_BMI>${escapeXml(findValue('CHI_SO_BMI', src))}</CHI_SO_BMI>
    <MACH>${escapeXml(findValue('MACH', src))}</MACH>
    <HUYET_AP>${escapeXml(findValue('HUYET_AP', src))}</HUYET_AP>`;

    if (formType === '3') {
        physicalXml += `
    <KHAM_THE_LUC_PL>${escapeXml(findValue('kham_the_luc_pl', src) || '1')}</KHAM_THE_LUC_PL>`;
    } else if (formType === '5') {
        physicalXml += `
    <LUC_BOP_TAY_THUAN>${escapeXml(findValue('LUC_BOP_TAY_THUAN', src))}</LUC_BOP_TAY_THUAN>
    <LUC_BOP_TAY_KHONG_THUAN>${escapeXml(findValue('LUC_BOP_TAY_KHONG_THUAN', src))}</LUC_BOP_TAY_KHONG_THUAN>
    <LUC_KEO_LUNG>${escapeXml(findValue('LUC_KEO_LUNG', src))}</LUC_KEO_LUNG>
    <LUC_KEO_THAN>${escapeXml(findValue('LUC_KEO_THAN', src))}</LUC_KEO_THAN>
    <HA_TAM_THU>${escapeXml(findValue('HA_TAM_THU', src))}</HA_TAM_THU>
    <HA_TAM_TRUONG>${escapeXml(findValue('HA_TAM_TRUONG', src))}</HA_TAM_TRUONG>
    <NHIP_TIM>${escapeXml(findValue('NHIP_TIM', src))}</NHIP_TIM>
    <VONG_NGUC_TRUNG_BINH>${escapeXml(findValue('VONG_NGUC_TRUNG_BINH', src))}</VONG_NGUC_TRUNG_BINH>`;
    } else if (formType === '1') {
        physicalXml += `
    <VONG_DDAU>${escapeXml(findValue('VONG_DDAU', src))}</VONG_DDAU>
    <VONG_NGUC>${escapeXml(findValue('VONG_NGUC', src))}</VONG_NGUC>
    <SINH_NON>${escapeXml(findValue('SINH_NON', src) || '0')}</SINH_NON>
    <TUAN_THAI_KHI_SINH>${escapeXml(findValue('TUAN_THAI_KHI_SINH', src))}</TUAN_THAI_KHI_SINH>
    <CAN_NANG_LUC_SINH>${escapeXml(findValue('CAN_NANG_LUC_SINH', src))}</CAN_NANG_LUC_SINH>`;
    }

    // 4. Khám lâm sàng
    let clinicalXml = '';
    if (formType === '1') {
        // Nhi khoa
        clinicalXml = `
    <NHI_KHOA_TUAN_HOAN>${escapeXml(findValue('NHI_KHOA_TUAN_HOAN', src) || 'Bình thường')}</NHI_KHOA_TUAN_HOAN>
    <NHI_KHOA_HO_HAP>${escapeXml(findValue('NHI_KHOA_HO_HAP', src) || 'Bình thường')}</NHI_KHOA_HO_HAP>
    <NHI_KHOA_TIEU_HOA>${escapeXml(findValue('NHI_KHOA_TIEU_HOA', src) || 'Bình thường')}</NHI_KHOA_TIEU_HOA>
    <NHI_KHOA_THAN_TIETNIEU>${escapeXml(findValue('NHI_KHOA_THAN_TIETNIEU', src) || 'Bình thường')}</NHI_KHOA_THAN_TIETNIEU>
    <NHI_KHOA_THAN_KINH>${escapeXml(findValue('NHI_KHOA_THAN_KINH', src) || 'Bình thường')}</NHI_KHOA_THAN_KINH>
    <NHI_KHOA_TAM_THAN>${escapeXml(findValue('NHI_KHOA_TAM_THAN', src) || 'Bình thường')}</NHI_KHOA_TAM_THAN>
    <NHI_KHOA_LAM_SANG_KHAC>${escapeXml(findValue('NHI_KHOA_LAM_SANG_KHAC', src) || 'Bình thường')}</NHI_KHOA_LAM_SANG_KHAC>
    <MO_TA_VAN_DONG_TINH_THAN>${escapeXml(findValue('milestone_check', src) === '1' ? 'Đạt' : 'Cần theo dõi')}</MO_TA_VAN_DONG_TINH_THAN`;

        // Check if milestones are present and append them as XML tags
        const milestoneList: { key: string; forms: string[] }[] = [
            { key: 'quay_dau_huong_am_thanh', forms: ['6'] },
            { key: 'nhin_theo_khuon_mat_30cm', forms: ['6'] },
            { key: 'phat_ra_tieng_khan_gu', forms: ['7'] },
            { key: 'ngoi_khong_ho_tro', forms: ['9'] },
            { key: 'dung_ngon_cai_tum_do_vat', forms: ['9'] },
            { key: 'dap_ung_goi_ten', forms: ['10'] },
            { key: 'bap_be_tu_nguyen_phu_am', forms: ['10'] },
            { key: 'dung_vin_dung_len', forms: ['10'] },
            { key: 'di_chuyen_let_bang_mong', forms: ['10'] },
            { key: 'noi_duoc_co_chu_dich', forms: ['11'] },
            { key: 'di_co_hoac_khong_tro_giup', forms: ['11'] },
            { key: 'chi_bo_phan_co_the', forms: ['12'] },
            { key: 'noi_tu_ghep_2_tu', forms: ['12'] },
            { key: 'lam_theo_yeu_cau_1_2_buoc', forms: ['12'] },
            { key: 'lam_theo_yeu_cau_2_3_buoc', forms: ['13'] },
            { key: 'vin_cau_thang_va_nhay_bat', forms: ['13'] },
            { key: 'lam_3_yeu_cau_khong_lien_quan', forms: ['13'] },
            { key: 'noi_cau_dai_ke_chuyen', forms: ['13'] },
            { key: 'hoi_va_tra_loi_cau_hoi', forms: ['13'] },
            { key: 'dung_1_chan_5_giay_nhay_lo_co', forms: ['13'] },
            { key: 'noi_thong_tin_ca_nhan', forms: ['13'] },
            { key: 'dem_to_hoac_dem_ngon_tay', forms: ['13'] },
        ];
        
        milestoneList.forEach(item => {
            const val = findValue(item.key, src);
            if (val) {
                clinicalXml += `
    <${item.key.toUpperCase()}>${escapeXml(val)}</${item.key.toUpperCase()}>`;
            }
        });
    } else if (formType === '4') {
        // Mẫu 4: 12 Railway Specialties
        clinicalXml = `
    <KQ_TAM_THAN>${escapeXml(findValue('KQ_TAM_THAN', src) || 'Bình thường')}</KQ_TAM_THAN>
    <KQ_THAN_KINH>${escapeXml(findValue('KQ_THAN_KINH', src) || 'Bình thường')}</KQ_THAN_KINH>
    <KQ_TIM_MACH>${escapeXml(findValue('KQ_TIM_MACH', src) || 'Bình thường')}</KQ_TIM_MACH>
    <KQ_HO_HAP>${escapeXml(findValue('KQ_HO_HAP', src) || 'Bình thường')}</KQ_HO_HAP>
    <KQ_NOI_TIET>${escapeXml(findValue('KQ_NOI_TIET', src) || 'Bình thường')}</KQ_NOI_TIET>
    <KQ_NGOAI_KHOA>${escapeXml(findValue('KQ_NGOAI_KHOA', src) || 'Bình thường')}</KQ_NGOAI_KHOA>
    <KQ_DA_LIEU>${escapeXml(findValue('KQ_DA_LIEU', src) || 'Bình thường')}</KQ_DA_LIEU>
    <KQ_TIET_NIEU>${escapeXml(findValue('KQ_TIET_NIEU', src) || 'Bình thường')}</KQ_TIET_NIEU>
    <KQ_SINH_DUC>${escapeXml(findValue('KQ_SINH_DUC', src) || 'Bình thường')}</KQ_SINH_DUC>
    <KQ_TAI_MUI_HONG>${escapeXml(findValue('KQ_TAI_MUI_HONG', src) || 'Bình thường')}</KQ_TAI_MUI_HONG>
    <KQ_CO_XUONG_KHOP>${escapeXml(findValue('KQ_CO_XUONG_KHOP', src) || 'Bình thường')}</KQ_CO_XUONG_KHOP>
    <KQ_NOI_TIET_CHUYEN_HOA>${escapeXml(findValue('KQ_NOI_TIET_CHUYEN_HOA', src) || 'Bình thường')}</KQ_NOI_TIET_CHUYEN_HOA>`;
    } else if (formType === '5') {
        // Mẫu 5: 15 Sailor Specialties + grids
        clinicalXml = `
    <TIM_MACH>${escapeXml(findValue('TIM_MACH', src) || 'Bình thường')}</TIM_MACH>
    <HO_HAP>${escapeXml(findValue('HO_HAP', src) || 'Bình thường')}</HO_HAP>
    <TIET_NIEU_SINH_DUC>${escapeXml(findValue('TIET_NIEU_SINH_DUC', src) || 'Bình thường')}</TIET_NIEU_SINH_DUC>
    <NOI_KHOA_TIEU_HOA>${escapeXml(findValue('NOI_KHOA_TIEU_HOA', src) || 'Bình thường')}</NOI_KHOA_TIEU_HOA>
    <GAN_MAT>${escapeXml(findValue('GAN_MAT', src) || 'Bình thường')}</GAN_MAT>
    <MAU_CO_QUAN_TAO_MAU>${escapeXml(findValue('MAU_CO_QUAN_TAO_MAU', src) || 'Bình thường')}</MAU_CO_QUAN_TAO_MAU>
    <DA_TO_CHUC_DUOI_DA>${escapeXml(findValue('DA_TO_CHUC_DUOI_DA', src) || 'Bình thường')}</DA_TO_CHUC_DUOI_DA>
    <KQ_CO_XUONG_KHOP_M5>${escapeXml(findValue('kq_co_xuong_khop_m5', src) || 'Bình thường')}</KQ_CO_XUONG_KHOP_M5>
    <THAN_KINH_M5>${escapeXml(findValue('than_kinh_m5', src) || 'Bình thường')}</THAN_KINH_M5>
    <MA_BENH_NGOAI_KHOA>${escapeXml(findValue('MA_BENH_NGOAI_KHOA', src) || 'Bình thường')}</MA_BENH_NGOAI_KHOA>
    <KHAM_TAI_MUI_HONG_M5>${escapeXml(findValue('kham_tai_mui_hong_m5', src) || 'Bình thường')}</KHAM_TAI_MUI_HONG_M5>
    <KHAM_MAT_M5>${escapeXml(findValue('kham_mat_m5', src) || 'Bình thường')}</KHAM_MAT_M5>
    <BENH_KHAC>${escapeXml(findValue('BENH_KHAC', src) || 'Không')}</BENH_KHAC>
    <NOI_TIET_DINH_DUONG_CHUYEN_HOA>${escapeXml(findValue('NOI_TIET_DINH_DUONG_CHUYEN_HOA', src) || 'Bình thường')}</NOI_TIET_DINH_DUONG_CHUYEN_HOA>
    <ROI_LOAN_HANH_VI_TAM_THAN>${escapeXml(findValue('ROI_LOAN_HANH_VI_TAM_THAN', src) || 'Không')}</ROI_LOAN_HANH_VI_TAM_THAN>
    <THAN_KINH_TAM_LY>${escapeXml(findValue('THAN_KINH_TAM_LY', src) || 'Bình thường')}</THAN_KINH_TAM_LY>
    <KHAM_MAT_THI_GIAC_MAU>${escapeXml(findValue('KHAM_MAT_THI_GIAC_MAU', src) || '1')}</KHAM_MAT_THI_GIAC_MAU>
    <XA_KHONG_KINH_MAT_PHAI>${escapeXml(findValue('XA_KHONG_KINH_MAT_PHAI', src) || '10/10')}</XA_KHONG_KINH_MAT_PHAI>
    <XA_KHONG_KINH_MAT_TRAI>${escapeXml(findValue('XA_KHONG_KINH_MAT_TRAI', src) || '10/10')}</XA_KHONG_KINH_MAT_TRAI>
    <XA_KHONG_KINH_HAI_MAT>${escapeXml(findValue('XA_KHONG_KINH_HAI_MAT', src) || '10/10')}</XA_KHONG_KINH_HAI_MAT>
    <XA_CO_KINH_MAT_PHAI>${escapeXml(findValue('XA_CO_KINH_MAT_PHAI', src))}</XA_CO_KINH_MAT_PHAI>
    <XA_CO_KINH_MAT_TRAI>${escapeXml(findValue('XA_CO_KINH_MAT_TRAI', src))}</XA_CO_KINH_MAT_TRAI>
    <XA_CO_KINH_HAI_MAT>${escapeXml(findValue('XA_CO_KINH_HAI_MAT', src))}</XA_CO_KINH_HAI_MAT>
    <GAN_KHONG_KINH_MAT_PHAI>${escapeXml(findValue('GAN_KHONG_KINH_MAT_PHAI', src) || '10/10')}</GAN_KHONG_KINH_MAT_PHAI>
    <GAN_KHONG_KINH_MAT_TRAI>${escapeXml(findValue('GAN_KHONG_KINH_MAT_TRAI', src) || '10/10')}</GAN_KHONG_KINH_MAT_TRAI>
    <GAN_KHONG_KINH_HAI_MAT>${escapeXml(findValue('GAN_KHONG_KINH_HAI_MAT', src) || '10/10')}</GAN_KHONG_KINH_HAI_MAT>
    <GAN_CO_KINH_MAT_PHAI>${escapeXml(findValue('GAN_CO_KINH_MAT_PHAI', src))}</GAN_CO_KINH_MAT_PHAI>
    <GAN_CO_KINH_MAT_TRAI>${escapeXml(findValue('GAN_CO_KINH_MAT_TRAI', src))}</GAN_CO_KINH_MAT_TRAI>
    <GAN_CO_KINH_HAI_MAT>${escapeXml(findValue('GAN_CO_KINH_HAI_MAT', src))}</GAN_CO_KINH_HAI_MAT>
    <KHAM_MAT_THI_TRUONG_PHAI>${escapeXml(findValue('KHAM_MAT_THI_TRUONG_PHAI', src) || 'Bình thường')}</KHAM_MAT_THI_TRUONG_PHAI>
    <KHAM_MAT_THI_TRUONG_TRAI>${escapeXml(findValue('KHAM_MAT_THI_TRUONG_TRAI', src) || 'Bình thường')}</KHAM_MAT_THI_TRUONG_TRAI>
    <TAI_PHAI_500HZ>${escapeXml(findValue('TAI_PHAI_500HZ', src) || '20')}</TAI_PHAI_500HZ>
    <TAI_TRAI_500HZ>${escapeXml(findValue('TAI_TRAI_500HZ', src) || '20')}</TAI_TRAI_500HZ>
    <TAI_PHAI_2000HZ>${escapeXml(findValue('TAI_PHAI_2000HZ', src) || '20')}</TAI_PHAI_2000HZ>
    <TAI_TRAI_2000HZ>${escapeXml(findValue('TAI_TRAI_2000HZ', src) || '20')}</TAI_TRAI_2000HZ>
    <TAI_PHAI_3000HZ>${escapeXml(findValue('TAI_PHAI_3000HZ', src) || '20')}</TAI_PHAI_3000HZ>
    <TAI_TRAI_3000HZ>${escapeXml(findValue('TAI_TRAI_3000HZ', src) || '20')}</TAI_TRAI_3000HZ>
    <TAI_PHAI_4000HZ>${escapeXml(findValue('TAI_PHAI_4000HZ', src) || '20')}</TAI_PHAI_4000HZ>
    <TAI_TRAI_4000HZ>${escapeXml(findValue('TAI_TRAI_4000HZ', src) || '20')}</TAI_TRAI_4000HZ>
    <TAI_PHAI_6000HZ>${escapeXml(findValue('TAI_PHAI_6000HZ', src) || '20')}</TAI_PHAI_6000HZ>
    <TAI_TRAI_6000HZ>${escapeXml(findValue('TAI_TRAI_6000HZ', src) || '20')}</TAI_TRAI_6000HZ>`;
    } else if (formType === '3') {
        // Người lớn (Mẫu 3 QĐ 2062): Lâm sàng & Phân loại đầy đủ
        clinicalXml = `
    <NOI_KHOA_TUAN_HOAN>${escapeXml(findValue('kq_tim_mach', src) || 'Bình thường')}</NOI_KHOA_TUAN_HOAN>
    <NOI_KHOA_TUAN_HOAN_PL>${escapeXml(findValue('noi_khoa_tuan_hoan_pl', src) || '1')}</NOI_KHOA_TUAN_HOAN_PL>
    <NOI_KHOA_HO_HAP>${escapeXml(findValue('kq_ho_hap', src) || 'Bình thường')}</NOI_KHOA_HO_HAP>
    <NOI_KHOA_HO_HAP_PL>${escapeXml(findValue('noi_khoa_ho_hap_pl', src) || '1')}</NOI_KHOA_HO_HAP_PL>
    <NOI_KHOA_TIEU_HOA>${escapeXml(findValue('noi_khoa_tieu_hoa', src) || 'Bình thường')}</NOI_KHOA_TIEU_HOA>
    <NOI_KHOA_TIEU_HOA_PL>${escapeXml(findValue('noi_khoa_tieu_hoa_pl', src) || '1')}</NOI_KHOA_TIEU_HOA_PL>
    <NOI_KHOA_THAN_TIETNIEU>${escapeXml(findValue('kq_tiet_nieu', src) || findValue('tiet_nieu_sinh_duc', src) || 'Bình thường')}</NOI_KHOA_THAN_TIETNIEU>
    <NOI_KHOA_THAN_TIETNIEU_PL>${escapeXml(findValue('noi_khoa_than_tietnieu_pl', src) || '1')}</NOI_KHOA_THAN_TIETNIEU_PL>
    <NOI_KHOA_NOI_TIET>${escapeXml(findValue('kq_noi_tiet', src) || 'Bình thường')}</NOI_KHOA_NOI_TIET>
    <NOI_KHOA_NOI_TIET_PL>${escapeXml(findValue('noi_khoa_noi_tiet_pl', src) || '1')}</NOI_KHOA_NOI_TIET_PL>
    <NOI_KHOA_CO_XUONG_KHOP>${escapeXml(findValue('kq_co_xuong_khop', src) || 'Bình thường')}</NOI_KHOA_CO_XUONG_KHOP>
    <NOI_KHOA_CO_XUONG_KHOP_PL>${escapeXml(findValue('noi_khoa_co_xuong_khop_pl', src) || '1')}</NOI_KHOA_CO_XUONG_KHOP_PL>
    <NOI_KHOA_THAN_KINH>${escapeXml(findValue('kq_than_kinh', src) || 'Bình thường')}</NOI_KHOA_THAN_KINH>
    <NOI_KHOA_THAN_KINH_PL>${escapeXml(findValue('noi_khoa_than_kinh_pl', src) || '1')}</NOI_KHOA_THAN_KINH_PL>
    <NOI_KHOA_TAM_THAN>${escapeXml(findValue('kq_tam_than', src) || 'Bình thường')}</NOI_KHOA_TAM_THAN>
    <NOI_KHOA_TAM_THAN_PL>${escapeXml(findValue('noi_khoa_tam_than_pl', src) || '1')}</NOI_KHOA_TAM_THAN_PL>
    <KET_QUA_KHAM_NGOAI_KHOA>${escapeXml(findValue('kq_ngoai_khoa', src) || findValue('external', src) || 'Bình thường')}</KET_QUA_KHAM_NGOAI_KHOA>
    <KHAM_NGOAI_KHOA_PL>${escapeXml(findValue('kham_ngoai_khoa_pl', src) || '1')}</KHAM_NGOAI_KHOA_PL>
    <KET_QUA_KHAM_DA_LIEU>${escapeXml(findValue('kq_da_lieu', src) || findValue('external', src) || 'Bình thường')}</KET_QUA_KHAM_DA_LIEU>
    <KHAM_DA_LIEU_PL>${escapeXml(findValue('kham_da_lieu_pl', src) || '1')}</KHAM_DA_LIEU_PL>
    <KET_QUA_KHAM_SAN_PHU_KHOA>${escapeXml(findValue('gynecology', src) || 'Không khám (hoặc bình thường)')}</KET_QUA_KHAM_SAN_PHU_KHOA>
    <KHAM_SAN_PHU_KHOA_PL>${escapeXml(findValue('kham_san_phu_khoa_pl', src) || '1')}</KHAM_SAN_PHU_KHOA_PL>
    <KHONG_KINH_MAT_PHAI>${escapeXml(findValue('khong_kinh_mat_phai', src) || '10/10')}</KHONG_KINH_MAT_PHAI>
    <KHONG_KINH_MAT_TRAI>${escapeXml(findValue('khong_kinh_mat_trai', src) || '10/10')}</KHONG_KINH_MAT_TRAI>
    <CO_KINH_MAT_PHAI>${escapeXml(findValue('co_kinh_mat_phai', src))}</CO_KINH_MAT_PHAI>
    <CO_KINH_MAT_TRAI>${escapeXml(findValue('co_kinh_mat_trai', src))}</CO_KINH_MAT_TRAI>
    <BENH_KHAC_MAT>${escapeXml(findValue('eye', src) || 'Bình thường')}</BENH_KHAC_MAT>
    <KHAM_MAT_PL>${escapeXml(findValue('kham_mat_pl', src) || '1')}</KHAM_MAT_PL>
    <TAI_TRAI_NOI_THUONG>${escapeXml(findValue('tai_trai_noi_thuong', src) || '5')}</TAI_TRAI_NOI_THUONG>
    <TAI_TRAI_NOI_THAM>${escapeXml(findValue('tai_trai_noi_tham', src) || '0.5')}</TAI_TRAI_NOI_THAM>
    <TAI_PHAI_NOI_THUONG>${escapeXml(findValue('tai_phai_noi_thuong', src) || '5')}</TAI_PHAI_NOI_THUONG>
    <TAI_PHAI_NOI_THAM>${escapeXml(findValue('tai_phai_noi_tham', src) || '0.5')}</TAI_PHAI_NOI_THAM>
    <BENH_KHAC_TAI_MUI_HONG>${escapeXml(findValue('ent', src) || 'Bình thường')}</BENH_KHAC_TAI_MUI_HONG>
    <KHAM_TAI_MUI_HONG_PL>${escapeXml(findValue('kham_tai_mui_hong_pl', src) || '1')}</KHAM_TAI_MUI_HONG_PL>
    <HAM_TREN>${escapeXml(findValue('ham_tren', src) || 'Bình thường')}</HAM_TREN>
    <HAM_DUOI>${escapeXml(findValue('ham_duoi', src) || 'Bình thường')}</HAM_DUOI>
    <BENH_KHAC_RANG_HAM_MAT>${escapeXml(findValue('dental', src) || 'Bình thường')}</BENH_KHAC_RANG_HAM_MAT>
    <KHAM_RANG_HAM_MAT_PL>${escapeXml(findValue('kham_rang_ham_mat_pl', src) || '1')}</KHAM_RANG_HAM_MAT_PL>`;
    } else if (formType === '2') {
        // Mẫu 2: Nhi khoa Học sinh (6 – dưới 18 tuổi) – dùng thẻ NHI_KHOA_*
        clinicalXml = `
    <NHI_KHOA_TUAN_HOAN>${escapeXml(findValue('nhi_tuan_hoan', src) || 'Bình thường')}</NHI_KHOA_TUAN_HOAN>
    <NHI_KHOA_HO_HAP>${escapeXml(findValue('nhi_ho_hap', src) || 'Bình thường')}</NHI_KHOA_HO_HAP>
    <NHI_KHOA_TIEU_HOA>${escapeXml(findValue('nhi_tieu_hoa', src) || 'Bình thường')}</NHI_KHOA_TIEU_HOA>
    <NHI_KHOA_THAN_TIETNIEU>${escapeXml(findValue('nhi_tiet_nieu', src) || 'Bình thường')}</NHI_KHOA_THAN_TIETNIEU>
    <NHI_KHOA_THAN_KINH>${escapeXml(findValue('nhi_than_kinh', src) || 'Bình thường')}</NHI_KHOA_THAN_KINH>
    <NHI_KHOA_TAM_THAN>${escapeXml(findValue('nhi_tam_than', src) || 'Bình thường')}</NHI_KHOA_TAM_THAN>
    <NHI_KHOA_LAM_SANG_KHAC>${escapeXml(findValue('nhi_khac', src) || 'Bình thường')}</NHI_KHOA_LAM_SANG_KHAC>
    <KHONG_KINH_MAT_PHAI>${escapeXml(findValue('khong_kinh_mat_phai', src) || '10/10')}</KHONG_KINH_MAT_PHAI>
    <KHONG_KINH_MAT_TRAI>${escapeXml(findValue('khong_kinh_mat_trai', src) || '10/10')}</KHONG_KINH_MAT_TRAI>
    <CO_KINH_MAT_PHAI>${escapeXml(findValue('co_kinh_mat_phai', src))}</CO_KINH_MAT_PHAI>
    <CO_KINH_MAT_TRAI>${escapeXml(findValue('co_kinh_mat_trai', src))}</CO_KINH_MAT_TRAI>
    <BENH_KHAC_MAT>${escapeXml(findValue('eye', src) || 'Bình thường')}</BENH_KHAC_MAT>
    <BENH_TAI_MUI_HONG>${escapeXml(findValue('ent', src) || 'Bình thường')}</BENH_TAI_MUI_HONG>
    <BENH_RANG_HAM_MAT>${escapeXml(findValue('dental', src) || 'Bình thường')}</BENH_RANG_HAM_MAT>`;
    } else {
        // Mẫu 3 và các mẫu còn lại
        clinicalXml = `
    <NOI_KHOA>${escapeXml(findValue('internal', src) || 'Bình thường')}</NOI_KHOA>
    <KHONG_KINH_MAT_PHAI>${escapeXml(findValue('khong_kinh_mat_phai', src) || '10/10')}</KHONG_KINH_MAT_PHAI>
    <KHONG_KINH_MAT_TRAI>${escapeXml(findValue('khong_kinh_mat_trai', src) || '10/10')}</KHONG_KINH_MAT_TRAI>
    <CO_KINH_MAT_PHAI>${escapeXml(findValue('co_kinh_mat_phai', src))}</CO_KINH_MAT_PHAI>
    <CO_KINH_MAT_TRAI>${escapeXml(findValue('co_kinh_mat_trai', src))}</CO_KINH_MAT_TRAI>
    <BENH_KHAC_MAT>${escapeXml(findValue('eye', src) || 'Bình thường')}</BENH_KHAC_MAT>
    <TAI_TRAI_NOI_THUONG>${escapeXml(findValue('tai_trai_noi_thuong', src) || '5')}</TAI_TRAI_NOI_THUONG>
    <TAI_TRAI_NOI_THAM>${escapeXml(findValue('tai_trai_noi_tham', src) || '0.5')}</TAI_TRAI_NOI_THAM>
    <TAI_PHAI_NOI_THUONG>${escapeXml(findValue('tai_phai_noi_thuong', src) || '5')}</TAI_PHAI_NOI_THUONG>
    <TAI_PHAI_NOI_THAM>${escapeXml(findValue('tai_phai_noi_tham', src) || '0.5')}</TAI_PHAI_NOI_THAM>
    <BENH_KHAC_TAI_MUI_HONG>${escapeXml(findValue('ent', src) || 'Bình thường')}</BENH_KHAC_TAI_MUI_HONG>
    <HAM_TREN>${escapeXml(findValue('ham_tren', src) || 'Bình thường')}</HAM_TREN>
    <HAM_DUOI>${escapeXml(findValue('ham_duoi', src) || 'Bình thường')}</HAM_DUOI>
    <BENH_KHAC_RANG_HAM_MAT>${escapeXml(findValue('dental', src) || 'Bình thường')}</BENH_KHAC_RANG_HAM_MAT>
    <NGOAI_KHOA>${escapeXml(findValue('external', src) || 'Bình thường')}</NGOAI_KHOA>`;

        if (formType === '3') {
            clinicalXml += `
    <SAC_GIAC>${escapeXml(findValue('sac_giac', src) || '0')}</SAC_GIAC>
    <THI_TRUONG_NGANG_HAIMAT>${escapeXml(findValue('thi_truong_ngang_haimat', src) || 'Bình thường')}</THI_TRUONG_NGANG_HAIMAT>
    <THI_TRUONG_DUNG_HAIMAT>${escapeXml(findValue('thi_truong_dung_haimat', src) || 'Bình thường')}</THI_TRUONG_DUNG_HAIMAT>
    <NOI_KHOA_TAM_THAN>${escapeXml(findValue('NOI_KHOA_TAM_THAN', src) || 'Bình thường')}</NOI_KHOA_TAM_THAN>
    <NOI_KHOA_THAN_KINH>${escapeXml(findValue('NOI_KHOA_THAN_KINH', src) || 'Bình thường')}</NOI_KHOA_THAN_KINH>`;
        }
    }

    // 5. Cận lâm sàng
    let labXml = '';
    if (formType === '5') {
        labXml = `
    <XET_NGHIEM_MAU>
        <HEMOGLOBIN>${escapeXml(findValue('HEMOGLOBIN', src) || '140')}</HEMOGLOBIN>
        <GLYCEMIA>${escapeXml(findValue('GLYCEMIA', src) || '5.2')}</GLYCEMIA>
        <CHI_SO_HC>${escapeXml(findValue('CHI_SO_HC', src))}</CHI_SO_HC>
        <CHI_SO_BACH_CAU>${escapeXml(findValue('CHI_SO_BACH_CAU', src))}</CHI_SO_BACH_CAU>
        <CHI_SO_TIEU_CAU>${escapeXml(findValue('CHI_SO_TIEU_CAU', src))}</CHI_SO_TIEU_CAU>
        <CONG_THUC_BC>${escapeXml(findValue('CONG_THUC_BC', src))}</CONG_THUC_BC>
        <THOI_GIAN_HOWELL>${escapeXml(findValue('THOI_GIAN_HOWELL', src))}</THOI_GIAN_HOWELL>
    </XET_NGHIEM_MAU>
    <XET_NGHIEM_MO_MAU>
        <CHOLESTEROL>${escapeXml(findValue('CHOLESTEROL', src))}</CHOLESTEROL>
        <TRIGLYCERID>${escapeXml(findValue('TRIGLYCERID', src))}</TRIGLYCERID>
        <HDL>${escapeXml(findValue('HDL', src))}</HDL>
        <LDL>${escapeXml(findValue('LDL', src))}</LDL>
    </XET_NGHIEM_MO_MAU>
    <HUYET_THANH_HOC>
        <RPR>${escapeXml(findValue('RPR', src) || '0')}</RPR>
        <TPHA>${escapeXml(findValue('TPHA', src) || '0')}</TPHA>
        <HBSAG>${escapeXml(findValue('HBSAG', src) || '0')}</HBSAG>
        <HBEAG>${escapeXml(findValue('HBEAG', src) || '0')}</HBEAG>
        <HCVAB>${escapeXml(findValue('HCVAB', src) || '0')}</HCVAB>
        <HAVAB>${escapeXml(findValue('HAVAB', src) || '0')}</HAVAB>
        <HIV>${escapeXml(findValue('HIV', src) || '0')}</HIV>
    </HUYET_THANH_HOC>
    <XET_NGHIEM_CHAT_KICH_THICH>
        <NONG_DO_CON_MAU>${escapeXml(findValue('NONG_DO_CON_MAU', src))}</NONG_DO_CON_MAU>
        <NUOC_TIEU_MA_TUY>${escapeXml(findValue('NUOC_TIEU_MA_TUY', src) || '0')}</NUOC_TIEU_MA_TUY>
        <NUOC_TIEU_AMPHETAMINE>${escapeXml(findValue('NUOC_TIEU_AMPHETAMINE', src) || '0')}</NUOC_TIEU_AMPHETAMINE>
    </XET_NGHIEM_CHAT_KICH_THICH>
    <XET_NGHIEM_NUOC_TIEU>
        <PROTEIN>${escapeXml(findValue('PROTEIN', src) || 'Âm tính')}</PROTEIN>
        <NUOC_TIEU_DUONG>${escapeXml(findValue('NUOC_TIEU_DUONG', src) || 'Âm tính')}</NUOC_TIEU_DUONG>
        <NUOC_TIEU_PROTEIN>${escapeXml(findValue('NUOC_TIEU_PROTEIN', src) || 'Âm tính')}</NUOC_TIEU_PROTEIN>
        <NUOC_TIEU_KHAC>${escapeXml(findValue('NUOC_TIEU_KHAC', src))}</NUOC_TIEU_KHAC>
    </XET_NGHIEM_NUOC_TIEU>
    <CHAN_DOAN_HINH_ANH_THAM_DO>
        <KET_QUA_CHAN_DOAN_HINH_ANH>${escapeXml(findValue('KET_QUA_CHAN_DOAN_HINH_ANH', src) || 'Bình thường')}</KET_QUA_CHAN_DOAN_HINH_ANH>
        <KET_QUA_DIEN_TIM>${escapeXml(findValue('KET_QUA_DIEN_TIM', src) || 'Bình thường')}</KET_QUA_DIEN_TIM>
        <CHUC_NANG_HO_HAP>${escapeXml(findValue('CHUC_NANG_HO_HAP', src) || 'Bình thường')}</CHUC_NANG_HO_HAP>
        <KET_QUA_SIEU_AM_BUNG>${escapeXml(findValue('KET_QUA_SIEU_AM_BUNG', src) || 'Bình thường')}</KET_QUA_SIEU_AM_BUNG>
    </CHAN_DOAN_HINH_ANH_THAM_DO>
    <XN_KHAC>${escapeXml(findValue('XN_KHAC', src) || findValue('kq_xn_khac', src))}</XN_KHAC>`;
    } else {
        labXml = `
    <XET_NGHIEM_MAU>
        <HEMOGLOBIN>${escapeXml(findValue('HEMOGLOBIN', src) || '140')}</HEMOGLOBIN>
        <GLYCEMIA>${escapeXml(findValue('GLYCEMIA', src) || '5.2')}</GLYCEMIA>
    </XET_NGHIEM_MAU>
    <XET_NGHIEM_NUOC_TIEU>
        <PROTEIN>${escapeXml(findValue('PROTEIN', src) || 'Âm tính')}</PROTEIN>
    </XET_NGHIEM_NUOC_TIEU>`;

        if (formType === '3') {
            labXml += `
    <KQ_XN_MA_TUY>${escapeXml(findValue('kq_xn_ma_tuy', src) || 'Âm tính')}</KQ_XN_MA_TUY>
    <KQ_XN_NONG_DO_CON>${escapeXml(findValue('kq_xn_nong_do_con', src) || '0.0 mg/L')}</KQ_XN_NONG_DO_CON>
    <KQ_XN_KHAC>${escapeXml(findValue('kq_xn_khac', src))}</KQ_XN_KHAC>`;
        }
    }

    // 6. Kết luận
    let conclusionXml = `
    <PHAN_LOAI_SK>${escapeXml(findValue('PHAN_LOAI_SK', src) || '1')}</PHAN_LOAI_SK>
    <KET_LUAN_BENH>${escapeXml(findValue('KET_LUAN_BENH', src) || findValue('diagnosis', src) || 'Sức khỏe bình thường')}</KET_LUAN_BENH>
    <CAC_VAN_DE_SUC_KHOE>${escapeXml(findValue('CAC_VAN_DE_SUC_KHOE', src) || 'Không')}</CAC_VAN_DE_SUC_KHOE>`;

    if (formType === '4') {
        conclusionXml += `
    <DU_TIEU_CHUAN_DK_PTGT_DUONG_SAT>${escapeXml(findValue('du_tieu_chuan_dk_ptgt_duong_sat', src) || '1')}</DU_TIEU_CHUAN_DK_PTGT_DUONG_SAT>`;
    } else if (formType === '5') {
        conclusionXml += `
    <KHA_NANG_CHIU_SONG>${escapeXml(findValue('KHA_NANG_CHIU_SONG', src) || '1')}</KHA_NANG_CHIU_SONG>
    <HAN_CHE>${escapeXml(findValue('HAN_CHE', src) || '0')}</HAN_CHE>
    <YEU_CAU_DEO_KINH>${escapeXml(findValue('YEU_CAU_DEO_KINH', src) || '0')}</YEU_CAU_DEO_KINH>
    <KET_LUAN_LOAI_SUC_KHOE>${escapeXml(findValue('KET_LUAN_LOAI_SUC_KHOE', src) || '1')}</KET_LUAN_LOAI_SUC_KHOE>`;
    }

    return `<?xml version="1.0" encoding="utf-8"?>
<MAU_${formType}_KSK>
    <THONG_TIN_HANH_CHINH>${adminXml}
    </THONG_TIN_HANH_CHINH>
    <THONG_TIN_CHUNG_VE_LAN_KHAM>
        <MA_LK>${escapeXml(maLkVal)}</MA_LK>
        <NGAY_KHAM>${ngayVaoVal}</NGAY_KHAM>
        <MA_CSKCB>${escapeXml(maCskcb)}</MA_CSKCB>
    </THONG_TIN_CHUNG_VE_LAN_KHAM>
    ${historyXml ? `<TIEN_SU_BENH>${historyXml}\n    </TIEN_SU_BENH>` : ''}
    <KHAM_THE_LUC>${physicalXml}
    </KHAM_THE_LUC>
    <KHAM_LAM_SANG>${clinicalXml}
    </KHAM_LAM_SANG>
    <KHAM_CAN_LAM_SANG>${labXml}
    </KHAM_CAN_LAM_SANG>
    <KET_LUAN>${conclusionXml}
    </KET_LUAN>
</MAU_${formType}_KSK>`;
}
