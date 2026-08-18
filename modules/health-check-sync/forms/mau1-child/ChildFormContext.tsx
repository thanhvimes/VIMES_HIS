import React, { createContext, useContext } from 'react';
import { CatalogItem } from '../../../../services/catalogService';

export interface ChildFormContextType {
    initialData: any;
    activeTab: 'admin' | 'history' | 'childDev' | 'exam' | 'lab' | 'conclusion';
    setActiveTab: React.Dispatch<React.SetStateAction<'admin' | 'history' | 'childDev' | 'exam' | 'lab' | 'conclusion'>>;

    // State for HIS Sync
    hisSearchQuery: string;
    setHisSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    isFetchingHis: boolean;
    setIsFetchingHis: React.Dispatch<React.SetStateAction<boolean>>;
    hisSyncMessage: { type: 'success' | 'error', text: string } | null;
    setHisSyncMessage: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error', text: string } | null>>;
    handleFetchHisData: () => Promise<void>;

    // State for Specialty Exam tabs
    specialtyMetadata: Record<string, { doctorId: string, status: string, updatedAt: string }>;
    setSpecialtyMetadata: React.Dispatch<React.SetStateAction<Record<string, { doctorId: string, status: string, updatedAt: string }>>>;
    doctors: CatalogItem[];
    setDoctors: React.Dispatch<React.SetStateAction<CatalogItem[]>>;

    // 1. Administrative & Lookup State
    patientId: string;
    setPatientId: React.Dispatch<React.SetStateAction<string>>;
    patientName: string;
    setPatientName: React.Dispatch<React.SetStateAction<string>>;
    cccd: string;
    setCccd: React.Dispatch<React.SetStateAction<string>>;
    dob: string;
    setDob: React.Dispatch<React.SetStateAction<string>>;
    gender: string;
    setGender: React.Dispatch<React.SetStateAction<string>>;
    docNo: string;
    setDocNo: React.Dispatch<React.SetStateAction<string>>;
    address: string;
    setAddress: React.Dispatch<React.SetStateAction<string>>;
    phone: string;
    setPhone: React.Dispatch<React.SetStateAction<string>>;
    ethnic: string;
    setEthnic: React.Dispatch<React.SetStateAction<string>>;
    cccdDate: string;
    setCccdDate: React.Dispatch<React.SetStateAction<string>>;
    cccdPlace: string;
    setCccdPlace: React.Dispatch<React.SetStateAction<string>>;
    bloodGroup: string;
    setBloodGroup: React.Dispatch<React.SetStateAction<string>>;
    targetGroup: string;
    setTargetGroup: React.Dispatch<React.SetStateAction<string>>;
    fundingSource: string;
    setFundingSource: React.Dispatch<React.SetStateAction<string>>;
    maGtinCskcb: string;
    setMaGtinCskcb: React.Dispatch<React.SetStateAction<string>>;
    maTinhCuTru: string;
    setMaTinhCuTru: React.Dispatch<React.SetStateAction<string>>;
    maXaCuTru: string;
    setMaXaCuTru: React.Dispatch<React.SetStateAction<string>>;
    lyDoVv: string;
    setLyDoVv: React.Dispatch<React.SetStateAction<string>>;
    loaiHinhKcb: string;
    setLoaiHinhKcb: React.Dispatch<React.SetStateAction<string>>;

    // Child-specific admin fields
    guardianName: string;
    setGuardianName: React.Dispatch<React.SetStateAction<string>>;
    guardianCccd: string;
    setGuardianCccd: React.Dispatch<React.SetStateAction<string>>;
    escortName: string;
    setEscortName: React.Dispatch<React.SetStateAction<string>>;
    escortCccd: string;
    setEscortCccd: React.Dispatch<React.SetStateAction<string>>;
    escortRelation: string;
    setEscortRelation: React.Dispatch<React.SetStateAction<string>>;
    conThuMay: string;
    setConThuMay: React.Dispatch<React.SetStateAction<string>>;
    tongSoCon: string;
    setTongSoCon: React.Dispatch<React.SetStateAction<string>>;
    maTinhCuTruNghMe: string;
    setMaTinhCuTruNghMe: React.Dispatch<React.SetStateAction<string>>;
    maXaCuTruNghMe: string;
    setMaXaCuTruNghMe: React.Dispatch<React.SetStateAction<string>>;

    // 2. Vitals & Medical History
    height: string;
    setHeight: React.Dispatch<React.SetStateAction<string>>;
    weight: string;
    setWeight: React.Dispatch<React.SetStateAction<string>>;
    bmi: string;
    setBmi: React.Dispatch<React.SetStateAction<string>>;
    pulse: string;
    setPulse: React.Dispatch<React.SetStateAction<string>>;
    bp: string;
    setBp: React.Dispatch<React.SetStateAction<string>>;
    nhietDo: string;
    setNhietDo: React.Dispatch<React.SetStateAction<string>>;
    nhipTho: string;
    setNhipTho: React.Dispatch<React.SetStateAction<string>>;
    gioKham: string;
    setGioKham: React.Dispatch<React.SetStateAction<string>>;

    dgDhstNhietDo: string;
    setDgDhstNhietDo: React.Dispatch<React.SetStateAction<string>>;
    dgDhstMach: string;
    setDgDhstMach: React.Dispatch<React.SetStateAction<string>>;
    dgDhstNhipTho: string;
    setDgDhstNhipTho: React.Dispatch<React.SetStateAction<string>>;

    tsBanThan: string;
    setTsBanThan: React.Dispatch<React.SetStateAction<string>>;
    tsGiaDinh: string;
    setTsGiaDinh: React.Dispatch<React.SetStateAction<string>>;
    tsbtNghienRuou: string;
    setTsbtNghienRuou: React.Dispatch<React.SetStateAction<string>>;
    tsbtMaBenhKhac: string;
    setTsbtMaBenhKhac: React.Dispatch<React.SetStateAction<string>>;
    tsTiepXucLao: string;
    setTsTiepXucLao: React.Dispatch<React.SetStateAction<string>>;

    // Child history parameters
    sinhNon: string;
    setSinhNon: React.Dispatch<React.SetStateAction<string>>;
    tuanThai: string;
    setTuanThai: React.Dispatch<React.SetStateAction<string>>;
    birthWeight: string;
    setBirthWeight: React.Dispatch<React.SetStateAction<string>>;
    vongDau: string;
    setVongDau: React.Dispatch<React.SetStateAction<string>>;
    vongNguc: string;
    setVongNguc: React.Dispatch<React.SetStateAction<string>>;

    // 3. Child Development, Nutrition, Vaccines
    chieuDaiTuoiSd: string;
    setChieuDaiTuoiSd: React.Dispatch<React.SetStateAction<string>>;
    canNangTuoiSd: string;
    setCanNangTuoiSd: React.Dispatch<React.SetStateAction<string>>;
    dgVongDau: string;
    setDgVongDau: React.Dispatch<React.SetStateAction<string>>;
    chuViVongCanhTay: string;
    setChuViVongCanhTay: React.Dispatch<React.SetStateAction<string>>;
    phuDinhDuong: string;
    setPhuDinhDuong: React.Dispatch<React.SetStateAction<string>>;
    thieuMau: string;
    setThieuMau: React.Dispatch<React.SetStateAction<string>>;
    coiXuong: string;
    setCoiXuong: React.Dispatch<React.SetStateAction<string>>;
    suyDinhDuong: string;
    setSuyDinhDuong: React.Dispatch<React.SetStateAction<string>>;
    thuaCanBeoPhi: string;
    setThuaCanBeoPhi: React.Dispatch<React.SetStateAction<string>>;
    ptTinhThanBinhThuong: string;
    setPtTinhThanBinhThuong: React.Dispatch<React.SetStateAction<string>>;
    ptVanDongBinhThuong: string;
    setPtVanDongBinhThuong: React.Dispatch<React.SetStateAction<string>>;
    nguyCoTuKy: string;
    setNguyCoTuKy: React.Dispatch<React.SetStateAction<string>>;
    tiemChungLao: string;
    setTiemChungLao: React.Dispatch<React.SetStateAction<string>>;
    tiemChungVgbMui1: string;
    setTiemChungVgbMui1: React.Dispatch<React.SetStateAction<string>>;
    tiemChungDayDu: string;
    setTiemChungDayDu: React.Dispatch<React.SetStateAction<string>>;

    // 4. Child Clinical Exam fields
    lamSangQuanSat: string;
    setLamSangQuanSat: React.Dispatch<React.SetStateAction<string>>;
    mauSacDa: string;
    setMauSacDa: React.Dispatch<React.SetStateAction<string>>;
    longBanTay: string;
    setLongBanTay: React.Dispatch<React.SetStateAction<string>>;
    thop: string;
    setThop: React.Dispatch<React.SetStateAction<string>>;
    kichThuocDau: string;
    setKichThuocDau: React.Dispatch<React.SetStateAction<string>>;
    vanDongCo: string;
    setVanDongCo: React.Dispatch<React.SetStateAction<string>>;
    khoiBatThuongDauCo: string;
    setKhoiBatThuongDauCo: React.Dispatch<React.SetStateAction<string>>;
    viTri2Mat: string;
    setViTri2Mat: React.Dispatch<React.SetStateAction<string>>;
    miMatKetMac: string;
    setMiMatKetMac: React.Dispatch<React.SetStateAction<string>>;
    lacMat: string;
    setLacMat: React.Dispatch<React.SetStateAction<string>>;
    dongTu: string;
    setDongTu: React.Dispatch<React.SetStateAction<string>>;
    taiMangNhi: string;
    setTaiMangNhi: React.Dispatch<React.SetStateAction<string>>;
    dapUngAmThanh: string;
    setDapUngAmThanh: React.Dispatch<React.SetStateAction<string>>;
    khoiSungSauTai: string;
    setKhoiSungSauTai: React.Dispatch<React.SetStateAction<string>>;
    chayMuNuocTai: string;
    setChayMuNuocTai: React.Dispatch<React.SetStateAction<string>>;
    hinhDangMui: string;
    setHinhDangMui: React.Dispatch<React.SetStateAction<string>>;
    chayNuocMui: string;
    setChayNuocMui: React.Dispatch<React.SetStateAction<string>>;
    nghetMui: string;
    setNghetMui: React.Dispatch<React.SetStateAction<string>>;
    hong: string;
    setHong: React.Dispatch<React.SetStateAction<string>>;
    hinhDangMieng: string;
    setHinhDangMieng: React.Dispatch<React.SetStateAction<string>>;
    rangSuaSoSinh: string;
    setRangSuaSoSinh: React.Dispatch<React.SetStateAction<string>>;
    hinhDangLuoi: string;
    setHinhDangLuoi: React.Dispatch<React.SetStateAction<string>>;
    dinhThangLuoi: string;
    setDinhThangLuoi: React.Dispatch<React.SetStateAction<string>>;
    namMieng: string;
    setNamMieng: React.Dispatch<React.SetStateAction<string>>;
    camNhoTutSau: string;
    setCamNhoTutSau: React.Dispatch<React.SetStateAction<string>>;
    vetSauMangBam: string;
    setVetSauMangBam: React.Dispatch<React.SetStateAction<string>>;
    nhipThoKhongDeu: string;
    setNhipThoKhongDeu: React.Dispatch<React.SetStateAction<string>>;
    thoRutLomLongNguc: string;
    setThoRutLomLongNguc: React.Dispatch<React.SetStateAction<string>>;
    tiengThoBatThuong: string;
    setTiengThoBatThuong: React.Dispatch<React.SetStateAction<string>>;
    dhSuyHoHap: string;
    setDhSuyHoHap: React.Dispatch<React.SetStateAction<string>>;
    nghePhoi: string;
    setNghePhoi: React.Dispatch<React.SetStateAction<string>>;
    viTriMomTim: string;
    setViTriMomTim: React.Dispatch<React.SetStateAction<string>>;
    machNgoaiVi: string;
    setMachNgoaiVi: React.Dispatch<React.SetStateAction<string>>;
    ngheTim: string;
    setNgheTim: React.Dispatch<React.SetStateAction<string>>;
    hinhDangBungRon: string;
    setHinhDangBungRon: React.Dispatch<React.SetStateAction<string>>;
    ganLachTo: string;
    setGanLachTo: React.Dispatch<React.SetStateAction<string>>;
    khoiBatThuongBung: string;
    setKhoiBatThuongBung: React.Dispatch<React.SetStateAction<string>>;
    loHauMon: string;
    setLoHauMon: React.Dispatch<React.SetStateAction<string>>;
    cqSinhDucNgoai: string;
    setCqSinhDucNgoai: React.Dispatch<React.SetStateAction<string>>;
    vanDongKhongDoiXung: string;
    setVanDongKhongDoiXung: React.Dispatch<React.SetStateAction<string>>;
    phanXaBu: string;
    setPhanXaBu: React.Dispatch<React.SetStateAction<string>>;
    phanXaNam: string;
    setPhanXaNam: React.Dispatch<React.SetStateAction<string>>;
    phanXaMoro: string;
    setphanXaMoro: React.Dispatch<React.SetStateAction<string>>;
    truongLucCo: string;
    setTruongLucCo: React.Dispatch<React.SetStateAction<string>>;
    khopHang: string;
    setKhopHang: React.Dispatch<React.SetStateAction<string>>;
    phanXaCo: string;
    setPhanXaCo: React.Dispatch<React.SetStateAction<string>>;
    kiemTraLungCotSong: string;
    setKiemTraLungCotSong: React.Dispatch<React.SetStateAction<string>>;
    khamTuChiKhop: string;
    setKhamTuChiKhop: React.Dispatch<React.SetStateAction<string>>;
    quanSatDangDi: string;
    setQuanSatDangDi: React.Dispatch<React.SetStateAction<string>>;

    // 5. Lab Data
    bloodTestEnabled: boolean;
    setBloodTestEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    hemoglobin: string;
    setHemoglobin: React.Dispatch<React.SetStateAction<string>>;
    glycemia: string;
    setGlycemia: React.Dispatch<React.SetStateAction<string>>;
    chiSoHc: string;
    setChiSoHc: React.Dispatch<React.SetStateAction<string>>;
    chiSoBachCau: string;
    setChiSoBachCau: React.Dispatch<React.SetStateAction<string>>;
    chiSoTieuCau: string;
    setChiSoTieuCau: React.Dispatch<React.SetStateAction<string>>;
    ure: string;
    setUre: React.Dispatch<React.SetStateAction<string>>;
    creatinin: string;
    setCreatinin: React.Dispatch<React.SetStateAction<string>>;
    asatAst: string;
    setAsatAst: React.Dispatch<React.SetStateAction<string>>;
    alatAlt: string;
    setAlatAlt: React.Dispatch<React.SetStateAction<string>>;
    nuocTieuKhac: string;
    setNuocTieuKhac: React.Dispatch<React.SetStateAction<string>>;

    urineTestEnabled: boolean;
    setUrineTestEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    duongNuocTieu: string;
    setDuongNuocTieu: React.Dispatch<React.SetStateAction<string>>;
    proteinNuocTieu: string;
    setProteinNuocTieu: React.Dispatch<React.SetStateAction<string>>;

    otherLabTestEnabled: boolean;
    setOtherLabTestEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    otherLabResult: string;
    setOtherLabResult: React.Dispatch<React.SetStateAction<string>>;

    // 6. Conclusion
    fitnessClass: string;
    setFitnessClass: React.Dispatch<React.SetStateAction<string>>;
    diagnosis: string;
    setDiagnosis: React.Dispatch<React.SetStateAction<string>>;
    cacVanDeLuuY: string;
    setCacVanDeLuuY: React.Dispatch<React.SetStateAction<string>>;

    // Lists of options
    provinces: CatalogItem[];
    ethnicities: CatalogItem[];
    occupations: CatalogItem[];
    nations: CatalogItem[];
    wards: CatalogItem[];
    workplaces: CatalogItem[];

    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    isLocked: boolean;
    setIsLocked: React.Dispatch<React.SetStateAction<boolean>>;
    handleAutofillTab: () => void;

    // Actions
    handleSubmit: () => Promise<void>;
    confirmConfig: { isOpen: boolean, title: string, message: string, onConfirm: () => void } | null;
    setConfirmConfig: React.Dispatch<React.SetStateAction<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>>;
    handleTabChange: (tabId: 'admin' | 'history' | 'childDev' | 'exam' | 'lab' | 'conclusion') => void;
    buildPayload?: () => any;
}

export const ChildFormContext = createContext<ChildFormContextType | undefined>(undefined);

export const useChildFormContext = () => {
    const context = useContext(ChildFormContext);
    if (!context) {
        throw new Error('useChildFormContext must be used within a ChildFormProvider');
    }
    return context;
};
