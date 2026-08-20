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
        'dia_chi': ['address', 'diachi', 'dia_chi', 'hp_dtladdr', 'detail_address'],
        'dien_thoai': ['phone', 'dienthoai', 'dien_thoai', 'telephone', 'hd_telephone'],
        'nhom_mau': ['blood_group', 'bloodgroup', 'nhommau', 'nhom_mau'],
        'doi_tuong': ['target_group', 'targetgroup', 'doituong', 'doi_tuong', 'hd_object'],
        'nguon_kinh_phi': ['funding_source', 'fundingsource', 'nguonkinhphi', 'nguon_kinh_phi'],
        'nguon_chi_tra': ['funding_source', 'fundingsource', 'nguonkinhphi', 'nguon_kinh_phi', 'nguon_chi_tra', 'nguonchitra'],
        'ma_dan_toc': ['ethnic', 'madantoc', 'ma_dan_toc', 'hp_ethnic'],
        'ngaycap_cccd': ['cccd_date', 'cccddate', 'ngaycapcccd', 'ngaycap_cccd'],
        'noicap_cccd': ['cccd_place', 'cccdplace', 'noicapcccd', 'noicap_cccd'],
        'ly_do_vv': ['ly_do_vv', 'lydovv', 'ly_do_ksk', 'lydoksk'],
        'matinh_cu_tru': ['matinh_cu_tru', 'matinhcutru', 'province_id', 'sp_id'],
        'maxa_cu_tru': ['maxa_cu_tru', 'maxacutru', 'ward_id', 'sv_id'],
        
        // Khám chuyên khoa lâm sàng người lớn & nhi khoa (khớp useDynamicFormState)
        'noi_khoa_tuan_hoan': ['kq_tim_mach', 'kq_timmach', 'tim_mach', 'timmach', 'noi_khoa_tuan_hoan', 'noikhoatuanhoan', 'nhi_tuan_hoan', 'nhituanhoan'],
        'noi_khoa_ho_hap': ['kq_ho_hap', 'kq_hohap', 'ho_hap', 'hohap', 'noi_khoa_ho_hap', 'noikhoahohap', 'nhi_ho_hap', 'nhihohap'],
        'noi_khoa_tieu_hoa': ['noi_khoa_tieu_hoa', 'noikhoatieuhoa', 'kq_tieu_hoa', 'tieu_hoa', 'nhi_tieu_hoa', 'nhitieuhoa'],
        'noi_khoa_than_tn_sd': ['kq_tiet_nieu', 'kq_tietnieu', 'tiet_nieu_sinh_duc', 'tietnieusinhduc', 'noi_khoa_than_tn_sd', 'noikhoathantnsd', 'nhi_tiet_nieu', 'nhitietnieu'],
        'noi_khoa_noi_tiet': ['kq_noi_tiet', 'kq_noitiet', 'kq_noi_tiet_chuyen_hoa', 'noi_khoa_noi_tiet', 'noikhoanoitiet'],
        'noi_khoa_co_xuong_khop': ['kq_co_xuong_khop', 'kq_coxuongkhop', 'noi_khoa_co_xuong_khop', 'noikhoacoxuongkhop', 'kq_co_xuong_khop_m5'],
        'noi_khoa_than_kinh': ['kq_than_kinh', 'kq_thankinh', 'noi_khoa_than_kinh', 'noikhoathankinh', 'nhi_than_kinh', 'nhithankinh'],
        'noi_khoa_tam_than': ['kq_tam_than', 'kq_tamthan', 'noi_khoa_tam_than', 'noikhoatamthan', 'nhi_tam_than', 'nhitamthan'],
        'ket_qua_kham_ngoai_khoa': ['kq_ngoai_khoa', 'kq_ngoaikhoa', 'external', 'ngoai_khoa', 'ngoaikhoa', 'ket_qua_kham_ngoai_khoa'],
        'ket_qua_kham_da_lieu': ['kq_da_lieu', 'kq_dalieu', 'dermatology', 'da_lieu', 'dalieu', 'ket_qua_kham_da_lieu'],
        'ket_qua_kham_san_phu_khoa': ['gynecology', 'kham_san_phu_khoa', 'san_phu_khoa', 'ket_qua_kham_san_phu_khoa'],
        'nhi_khoa_lam_sang_khac': ['nhi_khoa_lam_sang_khac', 'nhikhoalamsangkhac', 'nhi_khac', 'nhikhac', 'ckdt_nhi_khoa_lam_sang_khac'],
        'ckdt_nhi_khoa_lam_sang_khac': ['ckdt_nhi_khoa_lam_sang_khac', 'nhi_khac', 'nhikhac'],

        // Bệnh chuyên khoa nếu có (QĐ 1551 & TT 32)
        'benh_khac_mat': ['benh_khac_mat', 'benhkhacmat', 'eye_exam', 'eyeexam', 'kham_mat', 'khammat', 'eye'],
        'benh_tai_mui_hong': ['benh_tai_mui_hong', 'benhtaimuihong', 'ent_exam', 'entexam', 'kq_tai_mui_hong', 'kqtaimuihong', 'kham_tai_mui_hong', 'khamtaimuihong', 'ent'],
        'benh_khac_tai_mui_hong': ['benh_khac_tai_mui_hong', 'benhkhactaimuihong', 'benh_tai_mui_hong_khac', 'ent_exam', 'entexam', 'kq_tai_mui_hong', 'kqtaimuihong'],
        'benh_rang_ham_mat': ['benh_rang_ham_mat', 'benhranghammat', 'dental_exam', 'dentalexam', 'kham_rang_ham_mat', 'khamranghammat', 'dental'],
        'benh_khac_rang_ham_mat': ['benh_khac_rang_ham_mat', 'benhkhacranghammat', 'benh_rang_ham_mat_khac', 'dental_exam', 'dentalexam'],

        // Tiền sử & kết luận bổ sung
        'cac_benh_tat_neu_co': ['cac_benh_tat_neu_co', 'cacbenhtatneuco', 'cac_benh_tat', 'cacbenhtat'],
        'benh_dang_dieu_tri': ['benh_dang_dieu_tri', 'benhdangdieutri', 'ten_thuoc', 'tenthuoc', 'tsbt_ten_thuoc_lieu_luong'],
        'tsbt_dang_dieu_tri_benh': ['tsbt_dang_dieu_tri_benh', 'tsbtdangdieutribenh', 'ts_mac_benh', 'tsmacbenh'],
        'san_khoa_khong_bt': ['san_khoa_khong_bt', 'sankhoakhongbt', 'san_khoa_bat_thuong'],
        'ma_benh_san_khoa_khong_bt': ['ma_benh_san_khoa_khong_bt', 'mabenhsankhoakhongbt', 'tsbt_ma_benh_thai_san'],
        
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

export type HealthCheckAgeGroup = 'UNDER_6' | 'AGE_6_TO_UNDER_18' | 'ADULT_18_PLUS';

/** Resolve the QĐ 2062 age group from the examination date, preserving legacy form intent when DOB is absent. */
export function resolveHealthCheckAgeGroup(formType: string, dob?: string | Date, examDate: string | Date = new Date()): HealthCheckAgeGroup {
    if (dob) {
        const birth = new Date(dob);
        const exam = new Date(examDate);
        if (!Number.isNaN(birth.getTime()) && !Number.isNaN(exam.getTime())) {
            let age = exam.getFullYear() - birth.getFullYear();
            const beforeBirthday = exam.getMonth() < birth.getMonth() || (exam.getMonth() === birth.getMonth() && exam.getDate() < birth.getDate());
            if (beforeBirthday) age -= 1;
            if (age < 6) return 'UNDER_6';
            if (age < 18) return 'AGE_6_TO_UNDER_18';
            return 'ADULT_18_PLUS';
        }
    }
    if (formType === '1' || formType === 'mau1-child' || formType === 'child') return 'UNDER_6';
    if (formType === '2' || formType === 'mau2-minor' || formType === 'minor') return 'AGE_6_TO_UNDER_18';
    return 'ADULT_18_PLUS';
}

// Helper: Sinh XML tự động theo đặc tả mẫu data.xml (QĐ 2062/QĐ-BYT & QĐ 1551/QĐ-BYT)
export function generateXmlPayload(formType: string, master: any, clinical: any, lab: any, conclusion: any): string {
    const src = { master, clinical, lab, conclusion };
    const settings = getHealthCheckSettings();
    const maCskcb = settings?.ma_cskcb || findValue('ma_cskcb', src) || '8934285008135';      // 13-digit GLN for THONGTINDONVI MACSKCB
    const maCskcbByt = settings?.ma_cskcb_byt || maCskcb.substring(0, 5) || '37101';  // 5-digit BYT code for MA_CSKCB in XML2
    const maGtinCskcb = settings?.ma_gtin_cskcb || findValue('ma_gtin_cskcb', src) || maCskcb;

    // Map gender string to code (1=Nam, 2=Nữ)
    let genderCode = '1';
    const rawGender = master.gender || findValue('GIOI_TINH', src);
    if (rawGender === 'Nữ' || rawGender === '2') {
        genderCode = '2';
    }

    const formatYmd = (rawDate: any): string => {
        if (!rawDate) return '';
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

    const diaChiVal = findValue('DIA_CHI', src) || findValue('hp_address', src) || findValue('address', src) || 'Số 1, Phường Hàng Bông, Hà Nội';
    let maTinhVal = findValue('MATINH_CU_TRU', src) || findValue('hp_provid', src) || '01';
    if (maTinhVal.length > 3 || maTinhVal.length < 2) maTinhVal = '01';
    
    let maXaVal = findValue('MAXA_CU_TRU', src) || findValue('hp_villid', src) || '00001';
    if (maXaVal.length > 5 || maXaVal.length < 5) maXaVal = '00001';

    const ngayCapCccd = formatYmd(findValue('NGAYCAP_CCCD', src)) || '20210101';
    const noiCapCccd = findValue('NOICAP_CCCD', src) || 'Cục Cảnh sát QLHC về trật tự xã hội';
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
							<TSGD_MAC_BENH>${escapeXml(findValue('TSGD_MAC_BENH', src) || '0')}</TSGD_MAC_BENH>
							<TSGD_MA_BENH>${escapeXml(findValue('TSGD_MA_BENH', src) || '')}</TSGD_MA_BENH>
							<TS_TIEP_XUC_LAO>${escapeXml(findValue('TS_TIEP_XUC_LAO', src) || '0')}</TS_TIEP_XUC_LAO>
							<SAN_KHOA>${escapeXml(findValue('SAN_KHOA', src) || '0')}</SAN_KHOA>
							<SAN_KHOA_KHONG_BT>${escapeXml(findValue('SAN_KHOA_KHONG_BT', src) || '0')}</SAN_KHOA_KHONG_BT>
							<TIEM_CHUNG_BCG>${escapeXml(findValue('TIEM_CHUNG_BCG', src) || '0')}</TIEM_CHUNG_BCG>
							<TIEM_CHUNG_BH_HG_UV>${escapeXml(findValue('TIEM_CHUNG_BH_HG_UV', src) || '0')}</TIEM_CHUNG_BH_HG_UV>
							<TIEM_CHUNG_SOI>${escapeXml(findValue('TIEM_CHUNG_SOI', src) || '0')}</TIEM_CHUNG_SOI>
							<TIEM_CHUNG_BAI_LIET>${escapeXml(findValue('TIEM_CHUNG_BAI_LIET', src) || '0')}</TIEM_CHUNG_BAI_LIET>
							<TIEM_CHUNG_VNNB_B>${escapeXml(findValue('TIEM_CHUNG_VNNB_B', src) || '0')}</TIEM_CHUNG_VNNB_B>
							<TIEM_CHUNG_VGB>${escapeXml(findValue('TIEM_CHUNG_VGB', src) || '0')}</TIEM_CHUNG_VGB>
							<TIEM_CHUNG_CAC_LOAI_KHAC>${escapeXml(findValue('TIEM_CHUNG_CAC_LOAI_KHAC', src) || '0')}</TIEM_CHUNG_CAC_LOAI_KHAC>
							<TSBT_MAC_BENH>${escapeXml(findValue('TSBT_MAC_BENH', src) || (findValue('TSBT_MA_BENH', src) ? '1' : '0'))}</TSBT_MAC_BENH>
							<TSBT_MA_BENH>${escapeXml(findValue('TSBT_MA_BENH', src) || '')}</TSBT_MA_BENH>
							<TSBT_DANG_DIEU_TRI_BENH>${escapeXml(findValue('TSBT_DANG_DIEU_TRI_BENH', src) || '0')}</TSBT_DANG_DIEU_TRI_BENH>
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
							<TSBT_THAI_SAN>${escapeXml(findValue('TSBT_THAI_SAN', src) || findValue('tsbt_thai_san', src) || '0')}</TSBT_THAI_SAN>
							<TSBT_MA_BENH_THAI_SAN>${escapeXml(findValue('TSBT_MA_BENH_THAI_SAN', src) || findValue('tsbt_ma_benh_thai_san', src) || '')}</TSBT_MA_BENH_THAI_SAN>
							<TSBT_TEN_THUOC_THAI_SAN>${escapeXml(findValue('TSBT_TEN_THUOC_THAI_SAN', src) || findValue('tsbt_ten_thuoc_thai_san', src) || '')}</TSBT_TEN_THUOC_THAI_SAN>
							<TSBT_TEN_THUOC_LIEU_LUONG>${escapeXml(findValue('TSBT_TEN_THUOC_LIEU_LUONG', src) || findValue('BENH_DANG_DIEU_TRI', src) || '')}</TSBT_TEN_THUOC_LIEU_LUONG>
							<BENH_DANG_DIEU_TRI>${escapeXml(findValue('BENH_DANG_DIEU_TRI', src) || findValue('TSBT_TEN_THUOC_LIEU_LUONG', src) || '')}</BENH_DANG_DIEU_TRI>
							<HANG_LAI_XE>${escapeXml(findValue('HANG_LAI_XE', src) || findValue('hang_lai_xe', src) || 'B2')}</HANG_LAI_XE>
						</THONG_TIN_HANH_CHINH>`;

    // Build XML2: THONG_TIN_CHUNG_VE_LAN_KHAM
    let typeVal = 'Adult';
    // QĐ 2062 mẫu số 3 là nhóm người từ đủ 18 tuổi; chỉ các alias driver
    // chuyên biệt mới giữ TYPE=Driver.
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
							<DOI_TUONG>${escapeXml(findValue('DOI_TUONG', src) || '1;2')}</DOI_TUONG>
							<NGUON_CHI_TRA>${escapeXml(findValue('NGUON_CHI_TRA', src) || '2')}</NGUON_CHI_TRA>
							<MA_LOAI_KCB>${escapeXml(findValue('MA_LOAI_KCB', src) || '01')}</MA_LOAI_KCB>
							<NGAY_VAO>${escapeXml(ngayVaoVal)}</NGAY_VAO>
						</THONG_TIN_CHUNG_VE_LAN_KHAM>`;

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
        // Mẫu 2/Khác: Người từ đủ 18 tuổi trở lên (Adult)
        const specMeta = clinical?.clinical_exam?.specialty_metadata || {};
        const isSpecExamined = (key: string, ...valKeys: string[]) => {
            const meta = specMeta[key];
            if (meta && typeof meta === 'object') {
                if (meta.status === 'DA_KHAM' || meta.status === 'DA_DUYET') return true;
                if (meta.status === 'CHUA_KHAM') return false;
            }
            for (const vk of valKeys) {
                const v = findValue(vk, src);
                if (v && v.trim() !== '') return true;
            }
            return false;
        };

        const isTuanHoan = isSpecExamined('circulatory', 'noi_khoa_tuan_hoan', 'kq_tim_mach');
        const isHoHap = isSpecExamined('respiratory', 'noi_khoa_ho_hap', 'kq_ho_hap');
        const isTieuHoa = isSpecExamined('digestive', 'noi_khoa_tieu_hoa');
        const isThan = isSpecExamined('urinary', 'noi_khoa_than_tn_sd', 'kq_tiet_nieu');
        const isNoiTiet = isSpecExamined('endocrine', 'noi_khoa_noi_tiet', 'kq_noi_tiet');
        const isCoXuongKhop = isSpecExamined('musculoskeletal', 'noi_khoa_co_xuong_khop', 'kq_co_xuong_khop');
        const isThanKinh = isSpecExamined('neurology', 'noi_khoa_than_kinh', 'kq_than_kinh');
        const isTamThan = isSpecExamined('psychiatry', 'noi_khoa_tam_than', 'kq_tam_than');
        const isSurgery = isSpecExamined('surgery', 'kq_ngoai_khoa', 'external', 'kham_ngoai_khoa');
        const isDermatology = isSpecExamined('dermatology', 'kq_da_lieu', 'dermatology');
        const isGynecology = isSpecExamined('gynecology', 'kham_san_phu_khoa', 'gynecology');
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

    // Build XML10: KHAM_THE_LUC
    const chieuCaoVal = findValue('CHIEU_CAO', src) || '165';
    const canNangVal = findValue('CAN_NANG', src) || '60';
    const bmiVal = findValue('CHI_SO_BMI', src) || '22.0';
    const machVal = findValue('MACH', src) || '80';
    const huyetApVal = findValue('HUYET_AP', src) || '120/80';
    const khamTheLucPlVal = findValue('KHAM_THE_LUC_PL', src) || '1';

    const xml10 = `<KHAM_THE_LUC>
							<CHIEU_CAO>${escapeXml(chieuCaoVal)}</CHIEU_CAO>
							<CAN_NANG>${escapeXml(canNangVal)}</CAN_NANG>
							<CHI_SO_BMI>${escapeXml(bmiVal)}</CHI_SO_BMI>
							<MACH>${escapeXml(machVal)}</MACH>
							<HUYET_AP>${escapeXml(huyetApVal)}</HUYET_AP>
							<KHAM_THE_LUC_PL>${escapeXml(khamTheLucPlVal)}</KHAM_THE_LUC_PL>
						</KHAM_THE_LUC>`;

    // Build XML11: KHAM_CAN_LAM_SANG (Array of items with CDATA)
    let paraclItems = '';
    if (lab?.paraclinical_items && Array.isArray(lab.paraclinical_items) && lab.paraclinical_items.length > 0) {
        for (const item of lab.paraclinical_items) {
            const svcCode = item.service_code || 'CLS01';
            const idxCode = item.index_code || svcCode;
            const itemVal = item.value || 'Bình thường';
            const itemUnit = item.unit || 'Lần';
            const itemDesc = item.description || itemVal;
            const itemConc = item.conclusion || 'Bình thường';
            const itemName = item.name || svcCode;

            paraclItems += `
								<CHI_TIET_CLS>
									<MA_DICH_VU>${escapeXml(svcCode)}</MA_DICH_VU>
									<MA_CHI_SO>${escapeXml(idxCode)}</MA_CHI_SO>
									<TEN_CHI_SO>
										<![CDATA[${itemName}]]>
									</TEN_CHI_SO>
									<GIA_TRI>
										<![CDATA[${itemVal}]]>
									</GIA_TRI>
									<DON_VI_DO>
										<![CDATA[${itemUnit}]]>
									</DON_VI_DO>
									<MO_TA>
										<![CDATA[${itemDesc}]]>
									</MO_TA>
									<KET_LUAN>
										<![CDATA[${itemConc}]]>
									</KET_LUAN>
								</CHI_TIET_CLS>`;
        }
    }
    const xml11 = `<KHAM_CAN_LAM_SANG>
							<DANH_SACH_CLS>${paraclItems ? paraclItems + '\n							' : ''}</DANH_SACH_CLS>
						</KHAM_CAN_LAM_SANG>`;

    // Build XML12: KET_LUAN
    const phanLoaiSkVal = findValue('PHAN_LOAI_SK', src) || '1';
    const ketLuanBenhVal = findValue('KET_LUAN_BENH', src) || findValue('diagnosis', src) || 'Z00.0';
    const cacVanDeVal = findValue('CAC_VAN_DE_SUC_KHOE', src) || 'Đủ sức khỏe làm việc';
    const cacBenhTatVal = findValue('CAC_BENH_TAT_NEU_CO', src) || '';

    const xml12 = `<KET_LUAN>
							<PHAN_LOAI_SK>${escapeXml(phanLoaiSkVal)}</PHAN_LOAI_SK>
							<KET_LUAN_BENH>${escapeXml(ketLuanBenhVal)}</KET_LUAN_BENH>
							<CAC_VAN_DE_SUC_KHOE>${escapeXml(cacVanDeVal)}</CAC_VAN_DE_SUC_KHOE>
							<CAC_BENH_TAT_NEU_CO>${escapeXml(cacBenhTatVal)}</CAC_BENH_TAT_NEU_CO>
						</KET_LUAN>`;

    // Packaging into Envelope KHAMSUCKHOE matching sample data.xml exactly
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
		<SOLUONGHOSO>__FILE_COUNT__</SOLUONGHOSO>
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

    const envelopeFileCount = (envelope.match(/<FILEHOSO>/g) || []).length;
    return envelope.replace('__FILE_COUNT__', String(envelopeFileCount));
}
