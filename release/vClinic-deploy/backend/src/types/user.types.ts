// ==================== USER TYPES ====================
// File: backend/src/types/user.types.ts

export interface UserInfo {
    // Thông tin cơ bản
    userId: string;              // su_userid
    name: string;                // su_name
    groupId: string;             // su_groupid (D=Doctor, P=Pharmacist, N=Nurse, F=Finance, M=Manager)

    // Khoa phòng làm việc
    deptId: string;              // su_deptid - Khoa làm việc chính
    roomId: number;              // su_roomid - Phòng khám chính
    xDept: string[];             // su_hms_xdept - Các khoa phụ được làm việc
    xRoom: string;               // su_hms_xroom - Các phòng phụ

    // Thông tin liên hệ
    phone?: string;              // su_tel
    certificate?: string;        // su_certificate - Chứng chỉ hành nghề
    position?: string;           // su_position - Chức vụ
    title?: string;              // su_title - Học hàm học vị

    // Module permissions (HMS modules)
    modules: ModulePermissions;

    // Metadata
    isActive: boolean;           // su_isactive
}

export interface ModulePermissions {
    // HMS Modules
    rm: boolean;                 // su_hms_rmmodule - Reception Management
    em: boolean;                 // su_hms_emmodule - Emergency
    tm: boolean;                 // su_hms_tmmodule - Treatment Management
    us: boolean;                 // su_hms_usmodule - Ultrasound
    pa: boolean;                 // su_hms_pamodule - Patient Administration
    es: boolean;                 // su_hms_esmodule - Examination Schedule
    hf: boolean;                 // su_hms_hfmodule - Health File
    pm: boolean;                 // su_hms_pmmodule - Pharmacy Management
    op: boolean;                 // su_hms_opmodule - Outpatient
    cr: boolean;                 // su_hms_crmodule - Clinical Records
    sys: boolean;                // su_hms_sysmodule - System Admin
    lab: boolean;                // su_hms_labmodule - Laboratory
    mm: boolean;                 // su_hms_mmmodule - Material Management
    sm: boolean;                 // su_hms_smmodule - Stock Management
    ar: boolean;                 // su_hms_armodule - Accounting Receivable
    ma: boolean;                 // su_hms_mamodule - Medical Archive
    bb: boolean;                 // su_hms_bbmodule - Blood Bank
    pr: boolean;                 // su_hms_prmodule - Prescription
    fam: boolean;                // su_hms_fammodule - Family Medicine
    sip: boolean;                // su_hms_sipmodule - Surgical Inpatient
    st: boolean;                 // su_hms_stmodule - Statistics
    srm: boolean;                // su_hms_srmmodule - Surgery Room Management
    mra: boolean;                // su_hms_mramodule - Medical Record Archive
    cm: boolean;                 // su_hms_cmmodule - Case Management
    emr: boolean;                // su_hms_emrmodule - Electronic Medical Record
    hm: boolean;                 // su_hms_hmmodule - Hospital Management
    tra: boolean;                // su_hms_tramodule - Training
    in: boolean;                 // su_hms_inmodule - Insurance
    nm: boolean;                 // su_hms_nmmodule - Nursing Management
    tmv: boolean;                // su_hms_tmvmodule - Telemedicine
    dsm: boolean;                // su_hms_dsmmodule - Disease Management
    its: boolean;                // su_hms_itsmodule - IT Support
    hcc: boolean;                // su_hms_hccmodule - TT Điều hành (HCC)
    rol: boolean;                // su_hms_rolmodule - Đăng ký Online (ROL)
    qms: boolean;                // su_hms_qmsmodule - QMS – Gọi số (QMS)
    ksk: boolean;                // su_hms_kskmodule - Liên thông KSK VNeID (KSK)

    // ERP Modules
    fa: boolean;                 // su_erp_famodule - Fixed Assets
    hr: boolean;                 // su_erp_hrmodule - Human Resources
    ap: boolean;                 // su_erp_apmodule - Accounts Payable
    erp_ar: boolean;             // su_erp_armodule - Accounts Receivable
    gl: boolean;                 // su_erp_glmodule - General Ledger
    po: boolean;                 // su_erp_pomodule - Purchase Order
    so: boolean;                 // su_erp_somodule - Sales Order
    si: boolean;                 // su_erp_simodule - Sales Invoice
    bil: boolean;                // su_erp_bilmodule - Billing
}

export interface LoginRequest {
    userId: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    token?: string;
    user?: UserInfo;
    message?: string;
}

export interface AuthToken {
    userId: string;
    groupId: string;
    deptId: string;
    iat: number;      // Issued at
    exp: number;      // Expiration
}
