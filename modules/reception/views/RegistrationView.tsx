
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    PlusIcon, 
    PencilIcon, 
    SaveIcon, 
    BanIcon, 
    PrinterIcon, 
    QrcodeIcon,
    UserGroupIcon,
    ClockIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    XIcon,
    CreditCardIcon
} from '../../../components/Icons';
import ActionButton from '../../../components/shared/ActionButton';
import { FormInput, FormSelect } from '../../../components/shared/forms';
import Combobox, { ComboboxColumn } from '../../../components/shared/Combobox';
import { Patient } from '../../../types';
import { mockPatients } from '../data';
import { usePdfPreview } from '../../../contexts/PdfPreviewContext';
import { receptionService } from '../../../services/receptionService';

// --- MOCK DATA: OCCUPATIONS ---
interface CatalogItem {
    code: string;
    name: string;
}

const occupationOptions: CatalogItem[] = [
    { code: 'OC01', name: 'Cán bộ / Công chức' },
    { code: 'OC02', name: 'Công nhân' },
    { code: 'OC03', name: 'Nông dân' },
    { code: 'OC04', name: 'Học sinh / Sinh viên' },
    { code: 'OC05', name: 'Kỹ sư' },
    { code: 'OC06', name: 'Giáo viên' },
    { code: 'OC07', name: 'Hưu trí' },
    { code: 'OC08', name: 'Kinh doanh tự do' },
    { code: 'OC09', name: 'Nội trợ' },
    { code: 'OC99', name: 'Khác' },
];

// --- MOCK DATA: PROVINCES ---
const provinceOptions: CatalogItem[] = [
    { code: '01', name: 'Thành phố Hà Nội' },
    { code: '79', name: 'Thành phố Hồ Chí Minh' },
    { code: '48', name: 'Thành phố Đà Nẵng' },
    { code: '31', name: 'Thành phố Hải Phòng' },
    { code: '92', name: 'Thành phố Cần Thơ' },
    { code: '70', name: 'Tỉnh Bình Phước' },
    { code: '74', name: 'Tỉnh Bình Dương' },
    { code: '60', name: 'Tỉnh Đồng Nai' },
];

// --- MOCK DATA: WARDS (Communes) ---
const wardOptions: CatalogItem[] = [
    { code: '00001', name: 'Phường Phúc Xá' },
    { code: '00004', name: 'Phường Trúc Bạch' },
    { code: '00006', name: 'Phường Vĩnh Phúc' },
    { code: '00007', name: 'Phường Cống Vị' },
    { code: '00008', name: 'Phường Liễu Giai' },
    { code: '00010', name: 'Phường Nguyễn Trung Trực' },
    { code: '00013', name: 'Phường Quán Thánh' },
    { code: '20201', name: 'Thị trấn Đức Phong' },
    { code: '20202', name: 'Xã Đoàn Kết' },
];

// --- UTILITY: TOAST NOTIFICATION ---
interface ToastMessage {
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
}

const Toast: React.FC<{ toast: ToastMessage | null, onClose: () => void }> = ({ toast, onClose }) => {
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast, onClose]);

    if (!toast) return null;

    const bgClass = toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = toast.type === 'success' ? <CheckCircleIcon className="w-6 h-6 text-white"/> : <ExclamationCircleIcon className="w-6 h-6 text-white"/>;

    return (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white animate-fade-in-up ${bgClass}`}>
            {icon}
            <div>
                <h4 className="font-bold text-sm uppercase">{toast.type === 'success' ? 'Thành công' : 'Thông báo'}</h4>
                <p className="text-sm">{toast.message}</p>
            </div>
            <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-1">
                <XIcon className="w-4 h-4"/>
            </button>
        </div>
    );
};

// --- UTILITY: ROBUST HEX DECODER (UTF-8) ---
const decodeHex = (hex: string): string => {
    if (!hex) return '';
    
    try {
        // 1. Clean the string: remove whitespace
        const cleanHex = hex.replace(/\s+/g, '');
        
        // 2. Validate: Must be even length and only hex chars
        if (cleanHex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(cleanHex)) {
            // Return as is if it doesn't look like hex (sometimes QR sends plain text in these fields if systems vary)
            return hex;
        }

        // 3. Encode for URI component: Insert % before every 2 chars
        // e.g., "C3A0" -> "%C3%A0"
        const percentEncoded = cleanHex.replace(/(.{2})/g, '%$1');
        
        // 4. Decode UTF-8
        return decodeURIComponent(percentEncoded);
    } catch (e) {
        console.error("Hex decode error:", e);
        return hex; // Fail gracefuly by returning original string
    }
};

// --- UTILITY: DATE FORMATTER (DD/MM/YYYY or DDMMYYYY -> YYYY-MM-DD) ---
const formatDateForInput = (dateStr: string) => {
    if (!dateStr || dateStr === '-' || dateStr.trim() === '') return '';
    
    // Handle DD/MM/YYYY
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            // Ensure parts are padded (e.g. 1/1/2023 -> 01/01/2023)
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
    } 
    // Handle DDMMYYYY (often found in CCCD raw data)
    else if (dateStr.length === 8 && !isNaN(Number(dateStr))) {
        const day = dateStr.slice(0, 2);
        const month = dateStr.slice(2, 4);
        const year = dateStr.slice(4, 8);
        return `${year}-${month}-${day}`;
    }
    
    return '';
};

// --- UTILITY: BENEFIT RATE ---
const getBenefitRate = (benefitCode: string) => {
    switch (benefitCode) {
        case '1': return '100';
        case '2': return '100';
        case '3': return '95';
        case '4': return '80';
        case '5': return '100';
        default: return '';
    }
};

// --- UTILITY: QR CODE PARSER ---
const parseScannedData = (rawData: string) => {
    if (!rawData) return null;
    const parts = rawData.split('|');

    // 1. BHYT Pattern (VssID/QRCode)
    // Min length check. Standard has ~15 fields.
    // Format: SoThe|HoTen(Hex)|NgaySinh|GioiTinh|DiaChi(Hex)|MaKCB|TuNgay|DenNgay|...
    if (parts.length >= 10 && parts[0].length === 15 && /^[A-Z]{2}\d{13}$/.test(parts[0])) {
        try {
            const insuranceNumber = parts[0];
            const name = decodeHex(parts[1]);
            const dob = formatDateForInput(parts[2]);
            
            // Gender: 1=Nam, 2=Nữ (BHXH standard)
            const genderCode = parts[3];
            const gender = genderCode === '1' ? 'Nam' : genderCode === '2' ? 'Nữ' : 'Khác';
            
            const address = decodeHex(parts[4]);
            const placeCode = parts[5].replace(' - ', ' - '); // Sometimes spaces vary
            const validFrom = formatDateForInput(parts[6]);
            const validTo = formatDateForInput(parts[7]);
            const fiveYearDate = formatDateForInput(parts[12]);

            // Breakdown Insurance Number
            const code = insuranceNumber.substring(0, 2); // e.g., CH
            const benefitCode = insuranceNumber.substring(2, 3); // e.g., 4
            const benefitRate = getBenefitRate(benefitCode);
            
            // Area code isn't explicitly in the new string usually, but we can infer or leave blank.
            // Some cards format it inside placeCode or elsewhere. We'll leave it for manual or lookup.
            
            const currentYear = new Date().getFullYear();
            const birthYear = parseInt(dob.split('-')[0] || '0');
            const age = birthYear > 0 ? currentYear - birthYear : 0;

            return {
                type: 'BHYT',
                data: {
                    name: name,
                    dob: dob,
                    gender: gender as 'Nam' | 'Nữ' | 'Khác',
                    workplace: address, // BHYT Address is often workplace/agency
                    address: address, 
                    age: age,
                    patientType: 'Bảo hiểm',
                    
                    // Insurance Fields
                    insuranceNumber: insuranceNumber,
                    insuranceCode: code,
                    insuranceBenefit: benefitRate,
                    insurancePlace: placeCode,
                    insuranceRegDate: validFrom,
                    insuranceExp: validTo,
                    insurance5Year: fiveYearDate
                }
            };
        } catch (e) {
            console.error("BHYT Parse Error", e);
            return null;
        }
    }

    // 2. CCCD Pattern (Old & New Chip ID)
    // Format: ID|OLD_ID|Name|DOB|Gender|Address|IssueDate
    // New Chip ID usually starts with ID number (12 digits)
    if (parts.length >= 6) {
        // Check first part: Should be 12 digits for CCCD
        if (/^\d{12}$/.test(parts[0])) {
            const dobDate = formatDateForInput(parts[3]);
            const issueDate = formatDateForInput(parts[6]);
            const genderStr = parts[4];
            
            let gender: 'Nam' | 'Nữ' | 'Khác' = 'Khác';
            if (genderStr.toLowerCase() === 'nam') gender = 'Nam';
            else if (genderStr.toLowerCase() === 'nữ') gender = 'Nữ';

            return {
                type: 'CCCD',
                data: {
                    identityCard: parts[0],
                    name: parts[2],
                    dob: dobDate,
                    gender: gender,
                    address: parts[5],
                    identityIssueDate: issueDate,
                    age: new Date().getFullYear() - parseInt(dobDate.split('-')[0] || '0'),
                    patientType: 'Dịch vụ' // Default to service unless BHYT scanned later
                }
            };
        }
    }

    return null;
};

// --- API SIMULATION ---
const mockSavePatientAPI = async (data: any): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.9) {
                reject("Lỗi kết nối máy chủ (Giả lập).");
            } else {
                resolve(true);
            }
        }, 800);
    });
};

const emptyPatient: Patient = {
  id: '', recordNumber: '', name: '', dob: '', age: 0, gender: 'Nam',
  ethnicity: 'Kinh', occupation: '', address: '', phone: '', lastVisit: '',
  patientType: 'Dịch vụ', identityCard: '', relativeInfo: '', 
  history: [],
};

interface ExtendedFormData extends Patient {
    email?: string;
    nationality?: string;
    province?: string;
    // district?: string; // Removed per user request
    ward?: string;
    relativePhone?: string;
    workplace?: string;
    identityIssueDate?: string; // New field: Ngày cấp CCCD
    
    // Insurance Details
    insuranceNumber?: string;
    insuranceRegDate?: string; // Ngày đăng ký
    insuranceExp?: string; // Ngày hết hạn
    insuranceCode?: string; // Mã (GD, DN...)
    insuranceBenefit?: string; // Mức hưởng (80%, 95%, 100%)
    insurancePlace?: string; // Nơi đăng ký KCB
    insuranceArea?: string; // Khu vực (K1, K2...)
    insurance5Year?: string; // Thời điểm đủ 5 năm
    insuranceExempt?: string; // Miễn cùng chi trả

    // Registration Session Data
    regDate?: string;
    regDepartment?: string;
    regRoom?: string;
    regReason?: string;
    regPriority?: boolean;
    
    // Transfer Info
    isTransfer?: boolean;
    transferHospital?: string;
    transferDiagnosis?: string;
    transferFile?: string;
}

const RegistrationView: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { openPdf } = usePdfPreview();
    
    const [formData, setFormData] = useState<ExtendedFormData>({
        ...emptyPatient,
        regDate: new Date().toISOString().slice(0, 10),
        regDepartment: 'Khoa Khám Bệnh',
        regRoom: '',
        regReason: '',
        regPriority: false,
        id: `BN${Date.now().toString().slice(-6)}`,
        recordNumber: `REC${Date.now().toString().slice(-6)}`,
        identityIssueDate: '',
        isTransfer: false
    });
    
    const [mode, setMode] = useState<'VIEW' | 'EDIT' | 'ADD'>('ADD');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [originalData, setOriginalData] = useState<ExtendedFormData | null>(null);
    
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const showToast = (type: 'success'|'error'|'info', message: string) => {
        setToast({ id: Date.now(), type, message });
    };

    // Load Patient Data
    useEffect(() => {
        const loadPatientData = async () => {
            if (patientId) {
                setIsLoading(true);
                try {
                    // Fetch patient using receptionService (real API wrapper)
                    const found = await receptionService.getPatientByRecordNumber(patientId);
                    
                    if (found) {
                        // Calculate a rough DOB if missing but Age exists (Common in API responses)
                        let dobStr = found.dob;
                        if (!dobStr && found.age) {
                            const estimatedYear = new Date().getFullYear() - found.age;
                            dobStr = `${estimatedYear}-01-01`;
                        } else if (dobStr && dobStr.includes('/')) {
                             // Ensure YYYY-MM-DD
                             const [d, m, y] = dobStr.split('/');
                             dobStr = `${y}-${m}-${d}`;
                        }

                        const loadedData: ExtendedFormData = {
                            ...found,
                            dob: dobStr,
                            email: 'example@email.com', // Placeholder
                            nationality: 'Việt Nam',
                            province: found.address ? 'Tỉnh/TP (Auto)' : '', // Placeholder logic
                            ward: '',
                            identityIssueDate: '', 
                            
                            // Mock Insurance Data if type is Insurance (since API might not return it yet)
                            insuranceNumber: found.patientType === 'Bảo hiểm' ? 'GD475702196755770003' : '',
                            insuranceCode: found.patientType === 'Bảo hiểm' ? 'GD' : '',
                            insuranceBenefit: found.patientType === 'Bảo hiểm' ? '80' : '',
                            
                            regDate: new Date().toISOString().slice(0, 10),
                            regReason: '',
                            regDepartment: 'Khoa Khám Bệnh',
                            isTransfer: false
                        };
                        setFormData(loadedData);
                        setOriginalData(JSON.parse(JSON.stringify(loadedData)));
                        setMode('VIEW');
                    } else {
                        showToast('error', 'Không tìm thấy bệnh nhân');
                        setMode('ADD');
                    }
                } catch (error) {
                    console.error("Error fetching patient:", error);
                    showToast('error', 'Lỗi khi tải dữ liệu bệnh nhân');
                } finally {
                    setIsLoading(false);
                }
            } else {
                setMode('ADD');
                setOriginalData(null);
                setFormData({
                    ...emptyPatient,
                    regDate: new Date().toISOString().slice(0, 10),
                    regDepartment: 'Khoa Khám Bệnh',
                    id: `BN${Date.now().toString().slice(-6)}`,
                    recordNumber: `REC${Date.now().toString().slice(-6)}`,
                });
            }
        };

        loadPatientData();
    }, [patientId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    // Validate CCCD on Blur
    const handleIdentityBlur = () => {
        const val = formData.identityCard;
        if (val && val.trim() !== '') {
            if (!/^\d{12}$/.test(val)) {
                showToast('error', 'CCCD phải đúng 12 chữ số');
            }
        }
    };

    const handleIdentityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, ''); // Only numbers
        if (val.length <= 12) {
            setFormData(prev => ({ ...prev, identityCard: val }));
        }
    };

    const handleOccupationChange = (val: string) => {
        setFormData(prev => ({ ...prev, occupation: val }));
    };

    const handleProvinceChange = (val: string) => {
        setFormData(prev => ({ ...prev, province: val }));
    };

    const handleWardChange = (val: string) => {
        setFormData(prev => ({ ...prev, ward: val }));
    };
    
    const handleInsurancePlaceChange = (val: string) => {
        setFormData(prev => ({ ...prev, insurancePlace: val }));
    };
    
    const handleInsuranceAreaChange = (val: string) => {
        setFormData(prev => ({ ...prev, insuranceArea: val }));
    };
    
    const handleTransferHospitalChange = (val: string) => {
        setFormData(prev => ({ ...prev, transferHospital: val }));
    };

    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        let age = 0;
        if (val) {
            const year = parseInt(val.split('-')[0]);
            if (!isNaN(year)) age = new Date().getFullYear() - year;
        }
        setFormData(prev => ({ ...prev, dob: val, age }));
    };

    const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const rawString = searchQuery.trim();
            if (!rawString) return;

            const parsed = parseScannedData(rawString);
            
            if (parsed) {
                // Use type assertion carefully here.
                // We're telling TS that parsed.data matches parts of ExtendedFormData
                const { insuranceNumber, identityIssueDate, ...pData } = parsed.data as any;
                
                setFormData(prev => ({
                    ...prev,
                    ...pData,
                    identityIssueDate: identityIssueDate || prev.identityIssueDate,
                    insuranceNumber: insuranceNumber || prev.insuranceNumber
                }));
                
                setSearchQuery('');
                showToast('success', `Đã quét thành công thẻ ${parsed.type}!`);
                
                if (mode === 'VIEW') {
                    setOriginalData(JSON.parse(JSON.stringify(formData))); // Backup current before edit
                    setMode('EDIT'); // Switch to edit if we scanned new data
                }
            } else {
                // Fallback: Search in real DB via Service
                try {
                    setIsLoading(true);
                    const found = await receptionService.getPatientByRecordNumber(rawString);
                    
                    if (found) {
                        navigate(`/reception/register/${found.id}`); // Will trigger useEffect
                        setSearchQuery('');
                        showToast('success', 'Đã tìm thấy bệnh nhân.');
                    } else {
                        setSearchQuery(''); 
                        showToast('error', 'Không tìm thấy dữ liệu hoặc sai định dạng!');
                    }
                } catch (error) {
                    showToast('error', 'Lỗi kết nối khi tìm kiếm.');
                } finally {
                    setIsLoading(false);
                }
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name) { showToast('error', "Vui lòng nhập tên bệnh nhân"); return; }
        if (formData.identityCard && !/^\d{12}$/.test(formData.identityCard)) {
            showToast('error', 'CCCD không hợp lệ (Phải 12 số)');
            return;
        }
        
        setIsSaving(true);
        try {
            await mockSavePatientAPI(formData);
            showToast('success', 'Đã lưu thông tin và tạo phiếu khám thành công!');
            setOriginalData(JSON.parse(JSON.stringify(formData)));
            setMode('VIEW');
        } catch (error: any) {
            showToast('error', error.toString() || "Lỗi khi lưu dữ liệu.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancel = () => {
        if (mode === 'ADD') {
            // Clear form
            setFormData({
                ...emptyPatient,
                regDate: new Date().toISOString().slice(0, 10),
                regDepartment: 'Khoa Khám Bệnh',
                regRoom: '',
                regReason: '',
                regPriority: false,
                id: `BN${Date.now().toString().slice(-6)}`,
                recordNumber: `REC${Date.now().toString().slice(-6)}`,
                identityIssueDate: '',
                isTransfer: false
            });
        } else if (mode === 'EDIT' && originalData) {
            // Restore original
            setFormData(originalData);
            setMode('VIEW');
        }
    };
    
    const handleCheckIn = () => {
        if (!formData.insuranceNumber) {
            showToast('error', 'Vui lòng nhập số thẻ BHYT để kiểm tra.');
            return;
        }
        
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            showToast('success', 'Thẻ hợp lệ. Đang tham gia BHYT.');
            // Simulate updating some info from portal
            setFormData(prev => ({
                ...prev,
                insuranceRegDate: '2023-01-01',
                insuranceExp: '2023-12-31',
                insurance5Year: '2020-05-01'
            }));
        }, 1000);
    };

    const commonColumns: ComboboxColumn<CatalogItem>[] = [
        { key: 'code', label: 'Mã', width: '30%', className: 'font-mono text-xs text-slate-500' },
        { key: 'name', label: 'Tên', width: '70%', className: 'font-medium' },
    ];
    
    const hospitalColumns: ComboboxColumn<CatalogItem>[] = [
        { key: 'code', label: 'Mã', width: '20%', className: 'font-mono text-xs text-slate-500' },
        { key: 'name', label: 'Tên bệnh viện', width: '80%', className: 'font-medium' },
    ];
    
    const hospitalOptions: CatalogItem[] = [
        { code: '47001', name: 'Bệnh viện đa khoa Huyện Bù Đăng' },
        { code: '01001', name: 'Bệnh viện Bạch Mai' },
        { code: '79021', name: 'Bệnh viện Chợ Rẫy' },
    ];
    
    const areaOptions: CatalogItem[] = [
        { code: 'K1', name: 'K1 - Khu vực đặc biệt khó khăn' },
        { code: 'K2', name: 'K2 - Khu vực đặc biệt khó khăn' },
        { code: 'K3', name: 'K3 - Khu vực sinh sống' },
    ];

    const isEditable = mode !== 'VIEW';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-slate-500">Đang tải hồ sơ...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-4 pb-10">
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* --- TOP ACTION BAR --- */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 px-4 py-4 md:px-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <PlusIcon className="w-7 h-7 text-blue-600"/>
                        <span className="hidden sm:inline">{mode === 'ADD' ? 'Đăng ký mới' : 'Hồ sơ bệnh nhân'}</span>
                    </h1>
                    {formData.patientType && (
                        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${formData.patientType === 'Bảo hiểm' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                            {formData.patientType}
                        </span>
                    )}
                </div>

                <div className="flex-1 w-full md:max-w-lg relative group order-3 md:order-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <QrcodeIcon className={`h-6 w-6 ${searchQuery ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-16 py-2.5 text-base border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-slate-50 dark:bg-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out shadow-sm"
                        placeholder="Quét QR CCCD / BHYT hoặc nhập Mã BN..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleScan}
                        autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-xs font-bold text-slate-400 border border-slate-300 rounded px-1.5 py-0.5 bg-white">Enter</span>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto justify-end order-2 md:order-3">
                    {isEditable ? (
                        <>
                            <ActionButton 
                                label={isSaving ? "Đang lưu..." : "Lưu phiếu"} 
                                icon={isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <SaveIcon className="w-5 h-5"/>} 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2"
                            />
                            <ActionButton 
                                label="Hủy" 
                                icon={<BanIcon className="w-5 h-5"/>} 
                                onClick={handleCancel} 
                                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-red-600 py-2 transition-colors shadow-sm"
                            />
                        </>
                    ) : (
                        <>
                            <ActionButton label="Thêm mới" icon={<PlusIcon className="w-5 h-5"/>} onClick={() => {navigate('/reception/register'); setMode('ADD');}} className="bg-green-600 hover:bg-green-700 text-white py-2"/>
                            <ActionButton label="Sửa" icon={<PencilIcon className="w-5 h-5"/>} onClick={() => setMode('EDIT')} className="bg-amber-500 hover:bg-amber-600 text-white py-2"/>
                            <ActionButton label="In" icon={<PrinterIcon className="w-5 h-5"/>} onClick={() => {}} className="bg-slate-600 hover:bg-slate-700 text-white py-2 hidden sm:flex"/>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
                    
                    {/* --- LEFT COLUMN: INFO FORM (75%) --- */}
                    <div className="lg:col-span-3 flex flex-col h-full overflow-y-auto pr-1 pb-40 custom-scrollbar">
                        
                        <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative space-y-6 ${isEditable ? 'ring-2 ring-blue-100 dark:ring-blue-900' : ''}`}>
                            
                            {/* SECTION 1: PERSONAL INFO */}
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-2 flex items-center gap-2 text-base uppercase tracking-wide">
                                    <UserGroupIcon className="w-5 h-5 text-blue-500"/> Thông tin Hành chính
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                    {/* Row 1 */}
                                    <div className="col-span-1 md:col-span-1">
                                        <FormInput label="Mã Bệnh nhân" name="id" value={formData.id} readOnly className="bg-slate-100 font-mono font-bold text-slate-600 text-sm h-10"/>
                                    </div>
                                    <div className="col-span-1 md:col-span-1">
                                        <FormInput label="Mã Hồ sơ" name="recordNumber" value={formData.recordNumber} readOnly className="bg-slate-100 font-mono font-bold text-red-600 text-sm h-10"/>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <FormInput label="Họ và tên" name="name" value={formData.name} onChange={handleInputChange} readOnly={!isEditable} className="font-bold uppercase text-blue-700 h-10"/>
                                    </div>
                                    <div className="col-span-1 md:col-span-1">
                                        <FormInput label="Ngày sinh" name="dob" type="date" value={formData.dob} onChange={handleDobChange} readOnly={!isEditable} className="h-10"/>
                                    </div>
                                    <div className="col-span-1 md:col-span-1 flex gap-2">
                                        <div className="w-16 md:w-20">
                                            <FormInput label="Tuổi" name="age" value={formData.age} readOnly className="bg-slate-100 font-bold text-center h-10"/>
                                        </div>
                                        <div className="flex-1">
                                            <FormSelect label="Giới tính" name="gender" value={formData.gender} onChange={handleInputChange} disabled={!isEditable} className="h-10">
                                                <option value="Nam">Nam</option>
                                                <option value="Nữ">Nữ</option>
                                                <option value="Khác">Khác</option>
                                            </FormSelect>
                                        </div>
                                    </div>

                                    {/* Row 2: CCCD + Issue Date */}
                                    <div className="col-span-1 md:col-span-2">
                                        <FormInput 
                                            label="CCCD/CMND" 
                                            name="identityCard" 
                                            value={formData.identityCard} 
                                            onChange={handleIdentityInput} 
                                            onBlur={handleIdentityBlur}
                                            readOnly={!isEditable} 
                                            className="font-mono h-10 font-bold text-lg text-blue-700 uppercase"
                                            maxLength={12}
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-1">
                                        <FormInput label="Ngày cấp" name="identityIssueDate" type="date" value={formData.identityIssueDate} onChange={handleInputChange} readOnly={!isEditable} className="h-10"/>
                                    </div>
                                    <div className="col-span-1 md:col-span-1">
                                        <FormSelect label="Dân tộc" name="ethnicity" value={formData.ethnicity} onChange={handleInputChange} disabled={!isEditable} className="h-10">
                                            <option value="Kinh">Kinh</option>
                                            <option value="Khác">Khác</option>
                                        </FormSelect>
                                    </div>
                                    
                                    <div className="col-span-1 md:col-span-1 relative z-20">
                                        <Combobox<CatalogItem>
                                            label="Nghề nghiệp"
                                            value={formData.occupation}
                                            onChange={handleOccupationChange}
                                            options={occupationOptions}
                                            columns={commonColumns}
                                            disabled={!isEditable}
                                            placeholder="Chọn..."
                                            className="h-10"
                                            displayValue={item => item.name}
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-1">
                                        <FormInput label="Điện thoại" name="phone" value={formData.phone} onChange={handleInputChange} readOnly={!isEditable} className="h-10"/>
                                    </div>

                                    {/* Row 3: Address (Comboboxes) */}
                                    <div className="col-span-1 md:col-span-2 relative z-10">
                                        <Combobox<CatalogItem>
                                            label="Tỉnh / TP"
                                            value={formData.province}
                                            onChange={handleProvinceChange}
                                            options={provinceOptions}
                                            columns={commonColumns}
                                            disabled={!isEditable}
                                            placeholder="Chọn Tỉnh/TP..."
                                            className="h-10"
                                            displayValue={item => item.name}
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 relative z-10">
                                        <Combobox<CatalogItem>
                                            label="Phường / Xã"
                                            value={formData.ward}
                                            onChange={handleWardChange}
                                            options={wardOptions}
                                            columns={commonColumns}
                                            disabled={!isEditable}
                                            placeholder="Chọn Phường/Xã..."
                                            className="h-10"
                                            displayValue={item => item.name}
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <FormInput label="Địa chỉ chi tiết" name="address" value={formData.address} onChange={handleInputChange} readOnly={!isEditable} className="h-10"/>
                                    </div>
                                    
                                    {/* Row 4: Relative */}
                                    <div className="col-span-1 md:col-span-4">
                                        <FormInput label="Họ tên người thân" name="relativeInfo" value={formData.relativeInfo} onChange={handleInputChange} readOnly={!isEditable} placeholder="Người liên hệ khi cần" className="h-10"/>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <FormInput label="SĐT người thân" name="relativePhone" value={formData.relativePhone} onChange={handleInputChange} readOnly={!isEditable} placeholder="09..." className="h-10"/>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: REGISTRATION INFO */}
                            <div className="pt-4 border-t border-dashed border-slate-300 dark:border-slate-600">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 text-base uppercase tracking-wide">
                                    <DocumentTextIcon className="w-5 h-5 text-green-500"/> Thông tin Đăng ký khám
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <FormSelect label="Đối tượng" name="patientType" value={formData.patientType} onChange={handleInputChange} disabled={!isEditable} className="h-10 font-bold text-blue-700">
                                            <option value="Dịch vụ">Dịch vụ</option>
                                            <option value="Bảo hiểm">Bảo hiểm Y tế</option>
                                            <option value="Ưu tiên">Ưu tiên (Người già, TE)</option>
                                        </FormSelect>
                                    </div>
                                    <div className="col-span-1 md:col-span-1">
                                        <FormInput label="Ngày đăng ký" name="regDate" type="date" value={formData.regDate} onChange={handleInputChange} readOnly={!isEditable} className="h-10"/>
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                        <FormSelect label="Khoa / Phòng khám" name="regDepartment" value={formData.regDepartment} onChange={handleInputChange} disabled={!isEditable} className="h-10">
                                            <option>Khoa Khám Bệnh - PK Nội TQ</option>
                                            <option>Khoa Khám Bệnh - PK Ngoại</option>
                                            <option>Khoa Nhi</option>
                                            <option>Sản Phụ Khoa</option>
                                            <option>Tai Mũi Họng</option>
                                            <option>Răng Hàm Mặt</option>
                                        </FormSelect>
                                    </div>

                                    <div className="col-span-1 md:col-span-6 mt-2">
                                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 text-sm">Lý do khám / Triệu chứng ban đầu</label>
                                        <textarea 
                                            name="regReason"
                                            value={formData.regReason}
                                            onChange={handleInputChange}
                                            readOnly={!isEditable}
                                            rows={3}
                                            className="w-full p-3 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                            placeholder="Mô tả triệu chứng..."
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* SECTION 3: TRANSFER INFO (Conditional) */}
                            {formData.patientType === 'Bảo hiểm' && (
                                <div className={`pt-4 border-t border-dashed border-slate-300 dark:border-slate-600 transition-all ${formData.isTransfer ? 'bg-blue-50 dark:bg-slate-900/50 p-4 rounded-lg mt-4 border border-blue-200 dark:border-blue-900' : ''}`}>
                                    <div 
                                        className="flex items-center gap-2 mb-4 cursor-pointer"
                                        onClick={() => isEditable && setFormData(prev => ({ ...prev, isTransfer: !prev.isTransfer }))}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isTransfer ? 'bg-blue-600 border-blue-600' : 'border-slate-400 bg-white'}`}>
                                            {formData.isTransfer && <CheckCircleIcon className="w-4 h-4 text-white"/>}
                                        </div>
                                        <h3 className={`font-bold text-base uppercase tracking-wide select-none ${formData.isTransfer ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}>
                                            Thông tin chuyển tuyến (Nếu có giấy)
                                        </h3>
                                    </div>
                                    
                                    {formData.isTransfer && (
                                        <div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-4 animate-fade-in">
                                            <div className="col-span-1 md:col-span-3">
                                                <Combobox<CatalogItem>
                                                    label="Bệnh viện chuyển đến"
                                                    value={formData.transferHospital}
                                                    onChange={handleTransferHospitalChange}
                                                    options={hospitalOptions}
                                                    columns={hospitalColumns}
                                                    disabled={!isEditable}
                                                    placeholder="Chọn bệnh viện..."
                                                    displayValue={item => item.name}
                                                    className="h-10"
                                                />
                                            </div>
                                            <div className="col-span-1 md:col-span-3">
                                                <FormInput label="Chẩn đoán nơi chuyển" name="transferDiagnosis" value={formData.transferDiagnosis} onChange={handleInputChange} readOnly={!isEditable} className="h-10"/>
                                            </div>
                                            <div className="col-span-1 md:col-span-6">
                                                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-sm">Giấy chuyển viện (Đính kèm)</label>
                                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer">
                                                    <CloudUploadIcon className="w-8 h-8 mb-2 text-blue-400"/>
                                                    <span className="text-sm">Kéo thả hoặc click để tải lên (Ảnh/PDF)</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: INSURANCE DETAILS & HISTORY (25%) --- */}
                    <div className="lg:col-span-1 flex flex-col h-full gap-4 overflow-y-auto">
                        
                        {/* INSURANCE CARD VISUAL */}
                        {formData.patientType === 'Bảo hiểm' && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 flex flex-col shrink-0 overflow-hidden relative transition-all animate-fade-in">
                                <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
                                    <h3 className="font-bold text-sm uppercase flex items-center gap-2">
                                        <CreditCardIcon className="w-5 h-5"/> Thông tin thẻ BHYT
                                    </h3>
                                    <span className="text-xs bg-blue-500 px-2 py-0.5 rounded">Còn hiệu lực</span>
                                </div>
                                
                                <div className="p-4 space-y-3 text-sm">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Số thẻ</label>
                                        <div className="flex gap-2">
                                            <input 
                                                className="w-full font-mono font-bold text-base text-blue-700 bg-white border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                                value={formData.insuranceNumber} 
                                                readOnly={!isEditable}
                                                onChange={e => handleInputChange({...e, target: {...e.target, name: 'insuranceNumber'}})}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-2">
                                        <div className="col-span-1">
                                            <label className="text-xs text-slate-600 block font-bold">Mã</label>
                                            <input className="w-full text-sm border border-slate-300 bg-white rounded px-1 py-1 font-bold text-slate-800" value={formData.insuranceCode} readOnly={!isEditable} name="insuranceCode" onChange={handleInputChange} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-xs text-slate-600 block font-bold">Hưởng</label>
                                            <div className="relative">
                                                <input className="w-full text-sm border border-slate-300 bg-white rounded px-1 py-1 font-bold text-center text-slate-800" value={formData.insuranceBenefit} readOnly={!isEditable} name="insuranceBenefit" onChange={handleInputChange} />
                                                <span className="absolute right-0.5 top-1 text-[8px] text-slate-500">%</span>
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <label className="text-xs text-slate-600 block font-bold">Khu vực</label>
                                            <div className="relative">
                                                <Combobox<CatalogItem>
                                                    value={formData.insuranceArea}
                                                    onChange={handleInsuranceAreaChange}
                                                    options={areaOptions}
                                                    disabled={!isEditable}
                                                    placeholder="K1/K2/K3"
                                                    className="h-[30px]" // Compact
                                                    displayValue={item => item.code}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-600 block">Ngày đăng ký</label>
                                            <input className="w-full text-sm border border-slate-300 bg-white rounded px-1 py-1 text-slate-800" value={formData.insuranceRegDate} readOnly={!isEditable} name="insuranceRegDate" onChange={handleInputChange} placeholder="yyyy-mm-dd" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 block">Ngày hết hạn</label>
                                            <input className="w-full text-sm border border-slate-300 bg-white rounded px-1 py-1 text-slate-800" value={formData.insuranceExp} readOnly={!isEditable} name="insuranceExp" onChange={handleInputChange} placeholder="yyyy-mm-dd" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-600 block">Nơi đăng ký KCB Ban đầu</label>
                                        <div className="flex gap-2">
                                            <input className="w-16 text-sm border border-slate-300 bg-white rounded px-1 py-1 font-bold text-blue-700 text-center" value="47001" readOnly/>
                                            <div className="flex-1 relative">
                                                <Combobox<CatalogItem>
                                                    value={formData.insurancePlace}
                                                    onChange={handleInsurancePlaceChange}
                                                    options={hospitalOptions}
                                                    columns={hospitalColumns}
                                                    disabled={!isEditable}
                                                    placeholder="Tên bệnh viện..."
                                                    displayValue={item => item.name}
                                                    className="h-[30px]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-600 block">Nơi làm việc (Nếu có)</label>
                                        <input className="w-full text-sm border border-slate-300 bg-white rounded px-2 py-1 text-slate-800" value={formData.workplace} readOnly={!isEditable} name="workplace" onChange={handleInputChange} placeholder="Tên cơ quan/đơn vị..." />
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-blue-200">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-slate-600 w-24">Tuyến:</label>
                                            <div className="flex-1 flex gap-2">
                                                <label className="flex items-center gap-1 text-xs"><input type="radio" name="route" checked readOnly/> Đúng tuyến</label>
                                                <label className="flex items-center gap-1 text-xs"><input type="radio" name="route" disabled/> Trái tuyến</label>
                                                <label className="flex items-center gap-1 text-xs"><input type="radio" name="route" disabled/> Cấp cứu</label>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-slate-600 w-24">Đối tượng KCB:</label>
                                            <select className="flex-1 border border-slate-300 bg-white rounded px-1 py-1 text-xs text-slate-800" disabled={!isEditable}>
                                                <option>KCB tại CS ban đầu</option>
                                                <option>Chuyển tuyến</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center gap-1">
                                                <input type="checkbox" checked={!!formData.insurance5Year} readOnly={!isEditable} />
                                                <div className="flex flex-col w-full">
                                                    <span className="text-[10px] leading-tight text-slate-600">Đủ 5 năm</span>
                                                    <input type="text" className="w-full border border-slate-300 bg-white rounded px-1 py-0.5 text-[10px] text-slate-800" placeholder="yyyy-mm-dd" value={formData.insurance5Year} readOnly={!isEditable} name="insurance5Year" onChange={handleInputChange} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <input type="checkbox" checked={!!formData.insuranceExempt} readOnly={!isEditable} />
                                                <div className="flex flex-col w-full">
                                                    <span className="text-[10px] leading-tight text-slate-600">Miễn CTT</span>
                                                    <input type="text" className="w-full border border-slate-300 bg-white rounded px-1 py-0.5 text-[10px] text-slate-800" placeholder="yyyy-mm-dd" value={formData.insuranceExempt} readOnly={!isEditable} name="insuranceExempt" onChange={handleInputChange} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <button onClick={handleCheckIn} disabled={!isEditable || isSaving} className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-bold shadow transition">
                                            Check-In (BHXH)
                                        </button>
                                        <button disabled={!isEditable} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-1.5 rounded text-xs font-bold shadow-sm transition">
                                            Cập nhật
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* HISTORY */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col flex-1 min-h-0">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                                    <ClockIcon className="w-5 h-5 text-slate-500"/> Lịch sử khám
                                </h3>
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{formData.history?.length || 0}</span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                                {formData.history && formData.history.length > 0 ? (
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 shadow-sm text-slate-500">
                                            <tr>
                                                <th className="p-3 font-semibold">Ngày</th>
                                                <th className="p-3 font-semibold">Dịch vụ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {formData.history.map(h => (
                                                <tr key={h.id} className="hover:bg-blue-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group">
                                                    <td className="p-3 align-top w-24">
                                                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{h.examDate.split('/')[0]}/{h.examDate.split('/')[1]}</div>
                                                        <div className="text-xs text-slate-400">{h.examDate.split('/')[2]}</div>
                                                    </td>
                                                    <td className="p-3 align-top">
                                                        <div className="font-medium text-blue-600 dark:text-blue-400 text-sm">{h.examType}</div>
                                                        <div className="text-xs text-slate-500">{h.doctor}</div>
                                                        <div className="text-xs text-slate-400 italic truncate max-w-[150px] group-hover:whitespace-normal mt-1">{h.diagnosis}</div>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded border mt-1 inline-block ${
                                                            h.status === 'Đã kết thúc' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                        }`}>
                                                            {h.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 p-6 text-center">
                                        <DocumentTextIcon className="w-10 h-10 mb-2 opacity-20"/>
                                        <p className="text-sm">Chưa có lịch sử khám.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Icon for Upload (Helper)
const CloudUploadIcon = ({className}: {className?: string}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

export default RegistrationView;
