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

// Helper: Sinh XML tự động theo đặc tả 3 nhóm tuổi QĐ 2062/QĐ-BYT
export function generateXmlPayload(formType: string, master: any, clinical: any, lab: any, conclusion: any): string {
    const src = { master, clinical, lab, conclusion };
    const settings = getHealthCheckSettings();
    const maCskcb = settings?.ma_cskcb || findValue('ma_cskcb', src) || '15124';
    const maGtinCskcb = settings?.ma_gtin_cskcb || findValue('ma_gtin_cskcb', src) || '1234567890123';
    
    // Map gender string to code (1=Nam, 2=Nữ)
    let genderCode = '1';
    const rawGender = master.gender || findValue('GIOI_TINH', src);
    if (rawGender === 'Nữ' || rawGender === '2') {
        genderCode = '2';
    }

    const formatXmlDate = (rawDate: string): string => {
        if (!rawDate) return '';
        try {
            return new Date(rawDate).toISOString().split('T')[0];
        } catch {
            return rawDate;
        }
    };

    const dobVal = formatXmlDate(master.dob || findValue('NGAY_SINH', src));
    const maDanTocVal = findValue('ethnic', src) || findValue('MA_DAN_TOC', src) || '01';
    const ngayVaoVal = formatXmlDate(findValue('ngay_vao', src) || master.created_at || findValue('NGAY_VAO', src)) || new Date().toISOString().split('T')[0];
    const patientNameVal = master.patientName || master.patient_name || findValue('HO_TEN', src);
    const cccdVal = master.cccd || findValue('SO_CCCD', src);
    const maLkVal = master.docNo || master.doc_no || findValue('MA_LK', src);

    // Build XML1: THONG_TIN_HANH_CHINH
    let xml1 = `<?xml version="1.0" encoding="utf-8"?>
<THONG_TIN_HANH_CHINH>
    <HO_TEN>${escapeXml(patientNameVal)}</HO_TEN>
    <GIOI_TINH>${genderCode}</GIOI_TINH>
    <NGAY_SINH>${escapeXml(dobVal)}</NGAY_SINH>
    <MA_DAN_TOC>${escapeXml(maDanTocVal)}</MA_DAN_TOC>
    <SO_CCCD>${escapeXml(cccdVal)}</SO_CCCD>
    <DIA_CHI>${escapeXml(findValue('DIA_CHI', src))}</DIA_CHI>
    <MATINH_CU_TRU>${escapeXml(findValue('MATINH_CU_TRU', src))}</MATINH_CU_TRU>
    <MAXA_CU_TRU>${escapeXml(findValue('MAXA_CU_TRU', src))}</MAXA_CU_TRU>`;

    if (formType === '1' || formType === '2') {
        xml1 += `
    <NGUOI_GIAM_HO>${escapeXml(findValue('NGUOI_GIAM_HO', src))}</NGUOI_GIAM_HO>
    <SO_CCCD_NGH>${escapeXml(findValue('SO_CCCD_NGH', src))}</SO_CCCD_NGH>`;
    }
    xml1 += `\n</THONG_TIN_HANH_CHINH>`;

    // Build XML2: THONG_TIN_CHUNG_VE_LAN_KHAM
    const xml2 = `<?xml version="1.0" encoding="utf-8"?>
<THONG_TIN_CHUNG_VE_LAN_KHAM>
    <MA_LK>${escapeXml(maLkVal)}</MA_LK>
    <MA_CSKCB>${escapeXml(maCskcb)}</MA_CSKCB>
    <MA_GTIN_CSKCB>${escapeXml(maGtinCskcb)}</MA_GTIN_CSKCB>
    <DOI_TUONG>${escapeXml(findValue('DOI_TUONG', src) || '14')}</DOI_TUONG>
    <NGUON_CHI_TRA>${escapeXml(findValue('NGUON_CHI_TRA', src) || '9')}</NGUON_CHI_TRA>
    <MA_LOAI_KCB>${escapeXml(findValue('MA_LOAI_KCB', src) || '01')}</MA_LOAI_KCB>
    <NGAY_VAO>${ngayVaoVal.replace(/-/g, '') + '0000'}</NGAY_VAO>
</THONG_TIN_CHUNG_VE_LAN_KHAM>`;

    // Build XML3: DANH_GIA_DAU_HIEU_SINH_TON
    const xml3 = `<?xml version="1.0" encoding="utf-8"?>
<DANH_GIA_DAU_HIEU_SINH_TON>
    <NHIET_DO>${escapeXml(findValue('NHIET_DO', src) || findValue('nhiet_do', src) || '36.5')}</NHIET_DO>
    <MACH>${escapeXml(findValue('MACH', src) || findValue('mach', src) || '80')}</MACH>
    <NHIP_THO>${escapeXml(findValue('NHIP_THO', src) || findValue('nhip_tho', src) || '20')}</NHIP_THO>
    <HUYET_AP>${escapeXml(findValue('HUYET_AP', src) || findValue('huyet_ap', src) || '120/80')}</HUYET_AP>
</DANH_GIA_DAU_HIEU_SINH_TON>`;

    // Build XML10: KHAM_THE_LUC
    const xml10 = `<?xml version="1.0" encoding="utf-8"?>
<KHAM_THE_LUC>
    <CHIEU_CAO>${escapeXml(findValue('CHIEU_CAO', src) || findValue('chieu_cao', src) || '165')}</CHIEU_CAO>
    <CAN_NANG>${escapeXml(findValue('CAN_NANG', src) || findValue('can_nang', src) || '60')}</CAN_NANG>
    <CHI_SO_BMI>${escapeXml(findValue('CHI_SO_BMI', src) || findValue('chi_so_bmi', src) || '22.0')}</CHI_SO_BMI>
    <KHAM_THE_LUC_PL>${escapeXml(findValue('KHAM_THE_LUC_PL', src) || '1')}</KHAM_THE_LUC_PL>
</KHAM_THE_LUC>`;

    // Build XML11: KHAM_CAN_LAM_SANG (Array of items)
    let paraclItems = '';
    if (lab?.paraclinical_items && Array.isArray(lab.paraclinical_items)) {
        for (const item of lab.paraclinical_items) {
            paraclItems += `
    <CHI_TIET_CLS>
        <MA_DICH_VU>${escapeXml(item.service_code)}</MA_DICH_VU>
        <MA_CHI_SO>${escapeXml(item.service_code)}</MA_CHI_SO>
        <GIA_TRI>${escapeXml(item.value)}</GIA_TRI>
        <DON_VI_DO>${escapeXml(item.unit || '')}</DON_VI_DO>
        <MO_TA>${escapeXml(item.description || item.value || '')}</MO_TA>
        <KET_LUAN>${escapeXml(item.conclusion || '')}</KET_LUAN>
    </CHI_TIET_CLS>`;
        }
    }
    const xml11 = `<?xml version="1.0" encoding="utf-8"?>
<KHAM_CAN_LAM_SANG>${paraclItems}
</KHAM_CAN_LAM_SANG>`;

    // Build XML12: KET_LUAN
    const xml12 = `<?xml version="1.0" encoding="utf-8"?>
<KET_LUAN>
    <PHAN_LOAI_SK>${escapeXml(findValue('PHAN_LOAI_SK', src) || '1')}</PHAN_LOAI_SK>
    <KET_LUAN_BENH>${escapeXml(findValue('KET_LUAN_BENH', src) || findValue('diagnosis', src) || 'Bình thường')}</KET_LUAN_BENH>
</KET_LUAN>`;

    // Packaging into Envelope KHAMSUCKHOE
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<KHAMSUCKHOE xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <THONGTINDONVI>
        <MACSKCB>${escapeXml(maCskcb)}</MACSKCB>
    </THONGTINDONVI>
    <THONGTINHOSO>
        <NGAYLAP>${todayStr}</NGAYLAP>
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
                    <LOAIHOSO>XML3</LOAIHOSO>
                    <NOIDUNGFILE>
${xml3}
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
    <CHUKYDONVI />
</KHAMSUCKHOE>`;

    return envelope;
}
