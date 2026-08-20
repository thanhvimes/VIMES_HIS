// ==================== HOSPITAL STATISTICS TYPES ====================
// File: modules/hospital-statistics/types.ts

export interface DateFilterState {
    fromDate: string;
    toDate: string;
}

export interface HospitalActivityData {
    examination: {
        tong_so: number | string;
        so_bhyt: number | string;
        so_dichvu: number | string;
        nhap_vien: number | string;
        chuyen_vien: number | string;
    };
    inpatient: {
        vao_vien: number | string;
        ra_vien: number | string;
        tu_vong: number | string;
        dang_dieu_tri: number | string;
    };
    paraclinical: Array<{
        cls_group: string;
        so_benh_nhan: number | string;
        so_chi_dinh: number | string;
    }>;
    surgery: Array<{
        pttt_type: string;
        so_benh_nhan: number | string;
        tong_so_ca: number | string;
    }>;
}

export interface ClinicStatisticsItem {
    room_id: number | string;
    room_name: string;
    tong_luot_kham: number | string;
    so_bhyt: number | string;
    so_dichvu: number | string;
    nhap_vien: number | string;
    chuyen_vien: number | string;
    cho_ve: number | string;
    dang_kham: number | string;
}

export interface InpatientStatisticsItem {
    dept_id: string;
    dept_name: string;
    dau_ky: number | string;
    vao_vien: number | string;
    chuyen_den: number | string;
    chuyen_di: number | string;
    ra_vien: number | string;
    tu_vong: number | string;
    hien_dien: number | string;
}

export interface ParaclinicalStatisticsItem {
    group_id: string;
    group_name: string;
    tong_so_bn: number | string;
    tong_so_ca: number | string;
    ca_bhyt: number | string;
    ca_dichvu: number | string;
    tong_thanh_tien: number | string;
}

export interface SurgeryStatisticsItem {
    dept_id: string;
    dept_name: string;
    tong_benh_nhan: number | string;
    tong_so_ca: number | string;
    loai_dac_biet: number | string;
    loai_1: number | string;
    loai_2: number | string;
    loai_3: number | string;
    thu_thuat: number | string;
}

export interface DepartmentCostItem {
    dept_id: string;
    dept_name: string;
    tong_luot_bn: number | string;
    tien_kham: number | string;
    tien_giuong: number | string;
    tien_xet_nghiem: number | string;
    tien_cdha: number | string;
    tien_tdcn: number | string;
    tien_pttt: number | string;
    tien_thuoc: number | string;
    tien_mau: number | string;
    tien_vtyt: number | string;
    tien_khac: number | string;
    tong_cong_chi_phi: number | string;
    bhyt_thanh_toan: number | string;
    benh_nhan_tra: number | string;
}

export interface BedOccupancyItem {
    dept_id: string;
    dept_name: string;
    giuong_ke_hoach: number | string;
    giuong_thuc_ke: number | string;
    bn_dang_nam: number | string;
    ty_le_cong_suat: number | string;
}

export interface ChartDayItem {
    exam_date: string;
    label_date: string;
    tong_kham: number | string;
    bhyt: number | string;
    vien_phi: number | string;
}

export interface TopDoctorItem {
    doctor_id: string;
    doctor_name: string;
    total_visits: number | string;
}
