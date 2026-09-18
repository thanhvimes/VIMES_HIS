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
        chuyen_vien_noi_tru?: number | string;
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
    giuong_thuc_ke?: number | string;
    bn_noi_tru_bhyt: number | string;
    bn_noi_tru_vienphi: number | string;
    bn_ngoai_tru: number | string;
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

export interface SurgeryBriefingItem {
    docno: number | string;
    patient_name: string;
    operation_name: string;
    order_time: string;
    doctor_name: string;
    dept_name: string;
    operation_type: 'EMERGENCY' | 'SCHEDULED';
}

export interface DeathBriefingItem {
    docno: number | string;
    patient_name: string;
    dept_name: string;
    death_time: string;
    death_cause: string;
    death_icd: string;
}

export interface ExecutiveMorningBriefingData {
    briefing_date: string;
    latest_active_date?: string;
    examination: {
        tong_kham: number;
        kham_bhyt: number;
        kham_dichvu: number;
        cap_cuu: number;
        chi_dinh_nhap_vien: number;
        chuyen_vien_ngoai_tru: number;
    };
    inpatient: {
        vao_vien: number;
        ra_vien: number;
        chuyen_tuyen_noi_tru: number;
        tu_vong: number;
        hien_dien_hien_tai: number;
    };
    surgery: {
        tong_ca_pttt: number;
        tong_phau_thuat: number;
        mo_cap_cuu: number;
        mo_phien: number;
        thu_thuat: number;
    };
    bed_status: {
        total_planned_beds: number;
        total_patients: number;
        occupancy_rate: number;
        all_depts?: BedOccupancyItem[];
        overloaded_depts: BedOccupancyItem[];
        near_capacity_depts: BedOccupancyItem[];
        optimal_depts?: BedOccupancyItem[];
        available_depts: BedOccupancyItem[];
    };
    surgeries_list?: SurgeryBriefingItem[];
    deaths_list?: DeathBriefingItem[];
}

export interface DepositDeficitItem {
    docno: number | string;
    patient_name: string;
    dept_name: string;
    object_name: string;
    admit_date: string;
    total_cost: number;
    deposit_amount: number;
    deficit_amount: number;
    risk_level: 'CRITICAL' | 'HIGH' | 'WARNING' | 'SAFE';
}

export interface BhytFinancialRiskData {
    summary: {
        tong_chi_phi: number;
        bhyt_chi_tra: number;
        benh_nhan_cung_chi_tra: number;
        ty_le_bhyt: number;
    };
    cost_breakdown: {
        tien_thuoc: number;
        tien_vtyt: number;
        tien_giuong: number;
        tien_xet_nghiem: number;
        tien_cdha_tdcn: number;
        tien_pttt: number;
        tien_kham: number;
        ty_le_thuoc: number;
        ty_le_vtyt: number;
        ty_le_giuong: number;
        ty_le_cls: number;
    };
    deposit_deficits: DepositDeficitItem[];
}

export interface ExecutiveAlertItem {
    type: 'RED' | 'YELLOW' | 'GREEN';
    category: 'BED_OVERLOAD' | 'DEATH_INCIDENT' | 'FINANCIAL_RISK' | 'ALL_NORMAL';
    title: string;
    message: string;
    action_link?: string;
}

export interface ExecutiveAlertsData {
    overall_status: 'RED' | 'YELLOW' | 'GREEN';
    alerts: ExecutiveAlertItem[];
}

