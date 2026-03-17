export const TABLE_TRANSLATIONS: Record<string, string> = {
    hms_patient: 'Thông tin nhân thân',
    hms_doc: 'Thông tin hồ sơ/nghề nghiệp/BHYT',
    hms_exam: 'Lượt khám/Phòng khám',
    hms_card: 'Thẻ Bảo hiểm Y tế'
};

export const FIELD_TRANSLATIONS: Record<string, string> = {
    // hms_patient
    hp_surname: 'Họ và tên đệm',
    hp_firstname: 'Tên',
    hp_sex: 'Giới tính',
    hp_birthdate: 'Ngày sinh',
    hp_dtladdr: 'Địa chỉ chi tiết',
    hp_provid: 'Mã tỉnh',
    hp_distid: 'Mã huyện',
    hp_villid: 'Mã xã',
    hp_occupation: 'Nghề nghiệp',
    hp_sin: 'Số CMND/CCCD',
    hp_tel: 'Số điện thoại',
    hp_midname: 'Tên đệm',
    hp_workplace: 'Nơi công tác',
    hp_workplaceid: 'Mã nơi công tác',
    hp_nationality: 'Quốc tịch',
    hp_updatedby: 'Người cập nhật',
    hp_updateddate: 'Ngày cập nhật',
    
    // hms_doc
    hd_docno: 'Mã hồ sơ (Record No)',
    hd_admitdate: 'Ngày tiếp nhận',
    hd_object: 'Đối tượng',
    hd_insline: 'Tuyến BHYT',
    hd_cardno: 'Số thẻ BHYT',
    hd_status: 'Trạng thái hồ sơ',
    hd_admitdept: 'Khoa tiếp nhận',
    hd_telephone: 'Số điện thoại',
    hd_relative: 'Người thân',
    hd_contacttel: 'SĐT người thân',
    hd_relation: 'Mối quan hệ',
    hd_emergency: 'Cấp cứu',
    hd_disrate: 'Tỉ lệ miễn giảm',
    hd_transplace: 'Nơi chuyển đến',
    hd_reexam: 'Chuyển tuyến',
    hd_ma_doituong_kcb: 'Tuyến KCB',
    hd_updatedby: 'Người cập nhật (Hồ sơ)',
    hd_updateddate: 'Ngày cập nhật (Hồ sơ)',
    
    // hms_exam
    he_roomid: 'Phòng khám',
    he_examdate: 'Ngày khám',
    he_receptno: 'Số thứ tự (STT)',
    he_status: 'Trạng thái khám',
    he_updatedby: 'Người cập nhật (Khám)',
    he_updateddate: 'Ngày cập nhật (Khám)',
    
    // hms_card
    hc_cardno: 'Số thẻ BHYT (Thẻ)',
    hc_regcode: 'Mã ĐK KCB ban đầu',
    hc_regdate: 'Ngày bắt đầu hạn thẻ',
    hc_expdate: 'Ngày hết hạn thẻ',
    hc_active: 'Trạng thái thẻ active',
};

export const ACTION_TRANSLATIONS: Record<string, { label: string, color: string }> = {
    'I': { label: 'TẠO MỚI', color: 'text-green-600 bg-green-50' },
    'U': { label: 'CHỈNH SỬA', color: 'text-blue-600 bg-blue-50' },
    'D': { label: 'XÓA', color: 'text-red-600 bg-red-50' }
};

export const formatValue = (field: string, value: any): string => {
    if (value === null || value === undefined || value === '') return 'Trống';
    
    if (field.includes('date')) {
        try {
            return new Date(value).toLocaleString('vi-VN');
        } catch (e) {
            return String(value);
        }
    }
    
    if (field === 'hp_sex') {
        const v = String(value).toUpperCase();
        if (v === 'M') return 'Nam';
        if (v === 'F') return 'Nữ';
        return value;
    }

    if (field === 'hd_insline') return value === 'Y' ? 'Trái tuyến' : 'Đúng tuyến';
    if (field === 'hd_emergency') return value === 'Y' ? 'Cấp cứu' : 'Thường';
    if (field === 'hd_reexam') return value === 'Y' ? 'Có' : 'Không';
    if (field === 'hd_ma_doituong_kcb') {
        const v = String(value);
        if (v === '1') return 'Đúng tuyến';
        if (v === '2') return 'Cấp cứu';
        if (v === '3') return 'Thông tuyến/Trái tuyến';
        return v;
    }
    if (field === 'hd_object') {
        if (value === 4) return 'Bảo hiểm Xã hội';
        if (value === 7) return 'Dịch vụ';
        return String(value);
    }

    return String(value);
};
