
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    UserPlusIcon, 
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
    ShieldCheckIcon,
    CreditCardIcon,
    RefreshIcon,
    CheckIcon
} from '../../../components/Icons';
import ActionButton from '../../../components/shared/ActionButton';
import { FormInput, FormSelect } from '../../../components/shared/forms';
import Combobox, { ComboboxColumn } from '../../../components/shared/Combobox';
import { Patient } from '../../../types';
import { mockPatients } from '../data';
import { usePdfPreview } from '../../../contexts/PdfPreviewContext';

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

// --- MOCK DATA: HOSPITALS (For Insurance) ---
interface HospitalItem {
    code: string;
    name: string;
}
const hospitalOptions: HospitalItem[] = [
    { code: '01001', name: 'Bệnh viện Bạch Mai' },
    { code: '01002', name: 'Bệnh viện Hữu Nghị' },
    { code: '01003', name: 'Bệnh viện E' },
    { code: '01004', name: 'Bệnh viện Đa khoa Xanh Pôn' },
    { code: '79024', name: 'Bệnh viện Chợ Rẫy' },
    { code: '79035', name: 'Bệnh viện Nhân Dân 115' },
    { code: '47001', name: 'Bệnh viện Đa khoa Huyện Bù Đăng' }, 
    { code: '47002', name: 'Trung tâm Y tế Thị xã Phước Long' },
    { code: '01-816', name: 'Phòng khám Đa khoa (Mẫu)' },
    { code: '816', name: 'Phòng khám Đa khoa (Mã tắt)' },
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

// --- UTILITY: HEX DECODER (For BHYT Name/Address) ---
const hexToUtf8 = (hex: string): string => {
    try {
        const cleanHex = hex.replace(/\s+/g, '');
        const percentEncoded = cleanHex.replace(/[0-9a-fA-F]{2}/g, '%$&');
        return decodeURIComponent(percentEncoded);
    } catch (e) {
        console.error("Error decoding Hex:", e);
        return hex; 
    }
};

const convertDate = (dateStr: string): string => {
    if (!dateStr || dateStr === '-') return '';
    
    // Input: DD/MM/YYYY -> Output: YYYY-MM-DD
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    
    // Input: DDMMYYYY (CCCD style)
    if (dateStr.length === 8 && !isNaN(Number(dateStr))) {
        return `${dateStr.slice(4, 8)}-${dateStr.slice(2, 4)}-${dateStr.slice(0, 2)}`;
    }
    return '';
};

// --- UTILITY: QR CODE PARSER ---
const parseScannedData = (rawData: string) => {
    if (!rawData) return null;
    const parts = rawData.split('|');

    // 1. BHYT Pattern (VssID / QR Code)
    // Sample: CH4010253700019|486FC3...|24/01/1989|1|42C3...|01 - 816|01/09/2015|31/12/2015|...
    if (parts.length >= 10) {
         const isHexName = /^[0-9A-Fa-f]+$/.test(parts[1].replace(/\s/g, ''));
         
         if (isHexName) {
             const fullCardNo = parts[0]; 
             const name = hexToUtf8(parts[1]); 
             const dob = convertDate(parts[2]);
             const genderCode = parts[3]; // 1 (Nam)
             const address = hexToUtf8(parts[4]); 
             let clinicCode = parts[5]; 
             const validFrom = convertDate(parts[6]);
             const validTo = convertDate(parts[7]);
             const fiveYearDate = (parts[12] && parts[12] !== '-') ? convertDate(parts[12]) : '';

             const insuranceCode = fullCardNo.substring(0, 2); 
             const insuranceBenefit = fullCardNo.substring(2, 3); 
             const insuranceRegion = fullCardNo.substring(3, 5); 

             return {
                 type: 'BHYT',
                 data: {
                     insuranceNumber: fullCardNo,
                     insuranceCode: insuranceCode,
                     insuranceBenefit: parseBenefitRate(insuranceBenefit),
                     insurancePlaceCode: clinicCode,
                     insuranceRegDate: validFrom,
                     insuranceExp: validTo,
                     insurance5Year: fiveYearDate,
                     insuranceArea: insuranceRegion,
                     
                     name: name,
                     dob: dob,
                     gender: (genderCode === '1' ? 'Nam' : 'Nữ') as 'Nam' | 'Nữ' | 'Khác',
                     address: address,
                     patientType: 'Bảo hiểm' as 'Bảo hiểm',
                     age: new Date().getFullYear() - parseInt(dob.split('-')[0] || '0'),
                     workplace: address 
                 }
             };
         }
    }

    // 2. CCCD Pattern (Chip ID)
    // Format: ID|OLD_ID|Name|DOB(ddmmyyyy)|Gender|Address|IssueDate
    if (parts.length >= 5 && !rawData.startsWith('DN') && !rawData.startsWith('GD') && !rawData.startsWith('CH')) {
        const dobRaw = parts[3]; 
        const dobDate = convertDate(dobRaw);
        
        // Index 6 is Issue Date (Ngày cấp)
        const issueDateRaw = parts[6];
        const issueDate = issueDateRaw ? convertDate(issueDateRaw) : '';
        
        return {
            type: 'CCCD',
            data: {
                identityCard: parts[0],
                name: parts[2],
                dob: dobDate,
                gender: (parts[4] === 'Nam' || parts[4] === '1' ? 'Nam' : 'Nữ') as 'Nam' | 'Nữ' | 'Khác',
                address: parts[5],
                identityIssueDate: issueDate, // New Field
                age: new Date().getFullYear() - parseInt(dobDate.split('-')[0] || '0')
            }
        };
    }
    
    return null;
};

const parseBenefitRate = (code: string): string => {
    if (['1', '2'].includes(code)) return '100';
    if (['3'].includes(code)) return '95';
    if (['4'].includes(code)) return '80';
    return '';
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

const mockCheckInsuranceAPI = async (cardNo: string): Promise<any> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                isValid: true,
                status: "Đang tham gia",
                benefit: "80",
                placeCode: "01-816",
                placeName: "Phòng khám Đa khoa (Mẫu)",
                expDate: "2026-09-30",
                regDate: "2025-10-01",
                fiveYear: "2025-01-01",
                area: "01"
            });
        }, 1500);
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
    insuranceRegDate?: string; 
    insuranceExp?: string; 
    insuranceCode?: string; 
    insuranceBenefit?: string; 
    insurancePlace?: string; 
    insurancePlaceCode?: string; 
    insuranceArea?: string; 
    insurance5Year?: string; 
    insuranceExempt?: string; 
    insuranceRoute?: string; 

    // Registration Session Data
    regDate?: string;
    regDepartment?: string;
    regRoom?: string;
    regReason?: string;
    regPriority?: boolean;
}

const RegistrationView: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { openPdf } = usePdfPreview();
    
    const initialFormState: ExtendedFormData = {
        ...emptyPatient,
        regDate: new Date().toISOString().slice(0, 10),
        regDepartment: 'Khoa Khám Bệnh',
        regRoom: '',
        regReason: '',
        regPriority: false,
        id: `BN${Date.now().toString().slice(-6)}`,
        recordNumber: `REC${Date.now().toString().slice(-6)}`,
        identityIssueDate: ''
    };

    const [formData, setFormData] = useState<ExtendedFormData>(initialFormState);
    const [originalData, setOriginalData] = useState<ExtendedFormData | null>(null);
    
    const [mode, setMode] = useState<'VIEW' | 'EDIT' | 'ADD'>('ADD');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isCheckingCard, setIsCheckingCard] = useState(false);
    
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const showToast = (type: 'success'|'error'|'info', message: string) => {
        setToast({ id: Date.now(), type, message });
    };

    useEffect(() => {
        if (patientId) {
            const found = mockPatients.find(p => p.id === patientId);
            if (found) {
                const [d, m, y] = found.dob.split('/');
                const loadedData: ExtendedFormData = {
                    ...found,
                    dob: `${y}-${m}-${d}`,
                    email: 'example@email.com',
                    nationality: 'Việt Nam',
                    province: 'Thành phố Hà Nội',
                    ward: 'Phường Đồng Tâm',
                    identityIssueDate: '2021-05-01', // Mock data
                    workplace: found.occupation === 'Văn phòng' ? 'Công ty ABC' : '',
                    
                    insuranceNumber: found.patientType === 'Bảo hiểm' ? 'GD475702196755770003' : '',
                    insuranceCode: found.patientType === 'Bảo hiểm' ? 'GD' : '',
                    insuranceBenefit: found.patientType === 'Bảo hiểm' ? '80' : '',
                    insuranceRegDate: found.patientType === 'Bảo hiểm' ? '2025-10-01' : '',
                    insuranceExp: found.patientType === 'Bảo hiểm' ? '2026-09-30' : '',
                    insurancePlace: found.patientType === 'Bảo hiểm' ? 'Bệnh viện Đa khoa Huyện Bù Đăng' : '',
                    insurancePlaceCode: found.patientType === 'Bảo hiểm' ? '47001' : '',
                    insuranceArea: found.patientType === 'Bảo hiểm' ? 'K2' : '',
                    insuranceRoute: found.patientType === 'Bảo hiểm' ? 'Đúng tuyến' : '',
                    insurance5Year: found.patientType === 'Bảo hiểm' ? '01/01/2025' : '',
                    
                    regDate: new Date().toISOString().slice(0, 10),
                    regReason: '',
                    regDepartment: 'Khoa Khám Bệnh'
                };
                setFormData(loadedData);
                setOriginalData(JSON.parse(JSON.stringify(loadedData))); 
                setMode('VIEW');
            }
        } else {
            setFormData(initialFormState);
            setOriginalData(null);
            setMode('ADD');
        }
    }, [patientId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

    const handleOccupationChange = (val: string) => {
        setFormData(prev => ({ ...prev, occupation: val }));
    };

    const handleProvinceChange = (val: string) => {
        setFormData(prev => ({ ...prev, province: val }));
    };

    const handleWardChange = (val: string) => {
        setFormData(prev => ({ ...prev, ward: val }));
    };

    const handleHospitalChange = (val: string, item?: HospitalItem) => {
        setFormData(prev => ({ 
            ...prev, 
            insurancePlace: val,
            insurancePlaceCode: item?.code || prev.insurancePlaceCode 
        }));
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

    const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const rawString = searchQuery.trim();
            if (!rawString) return;

            const parsed = parseScannedData(rawString);
            
            if (parsed) {
                const { insuranceNumber, workplace, identityIssueDate, ...pData } = parsed.data as any;
                
                const mergedData = {
                    ...formData,
                    ...pData,
                    workplace: workplace || formData.workplace,
                    identityIssueDate: identityIssueDate || formData.identityIssueDate,
                    id: mode === 'ADD' ? formData.id : formData.id, 
                    recordNumber: mode === 'ADD' ? formData.recordNumber : formData.recordNumber,
                    insuranceNumber: insuranceNumber || formData.insuranceNumber
                };

                setFormData(mergedData);
                
                setSearchQuery('');
                showToast('success', `Đã quét thành công thẻ ${parsed.type}!`);
                
                if (mode === 'VIEW') {
                    setMode('EDIT'); 
                }
            } else {
                const found = mockPatients.find(p => 
                    p.id.toLowerCase() === rawString.toLowerCase() || 
                    p.phone === rawString ||
                    p.identityCard === rawString
                );
                
                if (found) {
                    navigate(`/reception/register/${found.id}`);
                    setSearchQuery('');
                    showToast('success', 'Đã tìm thấy bệnh nhân.');
                } else {
                    setSearchQuery(''); 
                    showToast('error', 'Không tìm thấy dữ liệu hoặc sai định dạng!');
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
            setFormData(initialFormState);
            showToast('info', 'Đã hủy thêm mới.');
        } else {
            if (originalData) {
                setFormData(JSON.parse(JSON.stringify(originalData)));
                showToast('info', 'Đã hủy bỏ thay đổi.');
            }
        }
        setMode('VIEW');
    };

    const handleCheckInsurance = async () => {
        if (!formData.insuranceNumber) {
            showToast('error', 'Vui lòng nhập số thẻ BHYT');
            return;
        }
        setIsCheckingCard(true);
        try {
            const data = await mockCheckInsuranceAPI(formData.insuranceNumber);
            setFormData(prev => ({
                ...prev,
                insuranceBenefit: data.benefit,
                insurancePlaceCode: data.placeCode,
                insurancePlace: data.placeName,
                insuranceExp: data.expDate,
                insuranceRegDate: data.regDate,
                insurance5Year: data.fiveYear,
                insuranceArea: data.area,
                insuranceCode: formData.insuranceNumber?.substring(0, 2)
            }));
            showToast('success', `Đã kiểm tra: ${data.status}`);
        } catch (e) {
            showToast('error', 'Lỗi kết nối cổng BHXH');
        } finally {
            setIsCheckingCard(false);
        }
    };

    const handleUpdateInsurance = () => {
        showToast('success', 'Đã cập nhật thông tin thẻ BHYT');
    };

    const commonColumns: ComboboxColumn<CatalogItem>[] = [
        { key: 'code', label: 'Mã', width: '30%', className: 'font-mono text-xs text-slate-500' },
        { key: 'name', label: 'Tên', width: '70%', className: 'font-medium' },
    ];

    const hospitalColumns: ComboboxColumn<HospitalItem>[] = [
        { key: 'code', label: 'Mã', width: '25%', className: 'font-mono text-xs font-bold text-blue-600' },
        { key: 'name', label: 'Tên cơ sở KCB', width: '75%' },
    ];

    const isEditable = mode !== 'VIEW';

    return (
        <div className="flex flex-col h-full gap-4">
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* --- TOP ACTION BAR --- */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 px-6 py-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <UserPlusIcon className="w-7 h-7 text-blue-600"/>
                        {mode === 'ADD' ? 'Đăng ký mới' : 'Hồ sơ bệnh nhân'}
                    </h1>
                    {formData.patientType && (
                        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${formData.patientType === 'Bảo hiểm' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                            {formData.patientType}
                        </span>
                    )}
                </div>

                <div className="flex-1 max-w-lg relative group">
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

                <div className="flex gap-3">
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
                            <ActionButton label="Thêm mới" icon={<UserPlusIcon className="w-5 h-5"/>} onClick={() => {navigate('/reception/register'); setMode('ADD'); setFormData(initialFormState);}} className="bg-green-600 hover:bg-green-700 text-white py-2"/>
                            <ActionButton label="Sửa" icon={<PencilIcon className="w-5 h-5"/>} onClick={() => setMode('EDIT')} className="bg-amber-500 hover:bg-amber-600 text-white py-2"/>
                            <ActionButton label="In" icon={<PrinterIcon className="w-5 h-5"/>} onClick={() => {}} className="bg-slate-600 hover:bg-slate-700 text-white py-2"/>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                    
                    {/* --- LEFT COLUMN: INFO FORM (75%) --- */}
                    <div className="lg:col-span-3 flex flex-col h-full overflow-y-auto pr-2 pb-20 custom-scrollbar">
                        
                        <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative space-y-6 ${isEditable ? 'ring-2 ring-blue-100 dark:ring-blue-900' : ''}`}>
                            
                            {/* SECTION 1: PERSONAL INFO */}
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-2 flex items-center gap-2 text-base uppercase tracking-wide">
                                    <UserGroupIcon className="w-5 h-5 text-blue-500"/> Thông tin Hành chính
                                </h3>
                                <div className="grid grid-cols-6 gap-x-6 gap-y-4">
                                    {/* Row 1 */}
                                    <div className="col-span-1">
                                        <FormInput label="Mã Bệnh nhân" name="id" value={formData.id} readOnly className="bg-slate-100 font-mono font-bold text-slate-600 text-sm h-10"/>
                                    </div>
                                    <div className="col-span-1">
                                        <FormInput label="Mã Hồ sơ" name="recordNumber" value={formData.recordNumber} readOnly className="bg-slate-100 font-mono font-bold text-red-600 text-sm h-10"/>
                                    </div>
                                    <div className="col-span-2">
                                        <FormInput label="Họ và tên" name="name" value={formData.name} onChange={handleInputChange} readOnly={!isEditable} className="font-bold uppercase text-blue-700 h-10"/>
                                    </div>
                                    <div className="col-span-1">
                                        <FormInput label="Ngày sinh" name="dob" type="date" value={formData.dob} onChange={handleDobChange} readOnly={!isEditable} className="h-10"/>
                                    </div>
                                    <div className="col-span-1 flex gap-2">
                                        <div className="w-20">
                                            <FormInput label="Tuổi" name="age" value={formData.age} readOnly className="bg-slate-100 font-bold text-center h-10"/>
                                        </div>
                                        <div className="flex-1">
                                            <FormSelect label="Giới tính" name="gender" value={formData.gender} onChange={handleInputChange} disabled={!isEditable} className="h-10">
                                                <option value="Nam">Nam</option>
                                                <option value="Nữ">Nữ</option>
                                            </FormSelect>
                                        </div>
                                    </div>

                                    {/* Row 2: CCCD + Issue Date */}
                                    <div className="col-span-2">
                                        <FormInput 
                                            label="CCCD/CMND" 
                                            name="identityCard" 
                                            value={formData.identityCard} 
                                            onChange={handleInputChange} 
                                            onBlur={handleIdentityBlur}
                                            readOnly={!isEditable} 
                                            className="font-mono h-10 font-bold text-blue-700"
                                            maxLength={12}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <FormInput label="Ngày cấp" name="identityIssueDate" type="date" value={formData.identityIssueDate} onChange={handleInputChange} readOnly={!isEditable} className="h-10"/>
                                    </div>
                                    <div className="col-span-1">
                                        <FormSelect label="Dân tộc" name="ethnicity" value={formData.ethnicity} onChange={handleInputChange} disabled={!isEditable} className="h-10">
                                            <option value="Kinh">Kinh</option>
                                            <option value="Khác">Khác</option>
                                        </FormSelect>
                                    </div>
                                    <div className="col-span-2 relative z-20">
                                        <Combobox<CatalogItem>
                                            label="Nghề nghiệp"
                                            value={formData.occupation}
                                            onChange={handleOccupationChange}
                                            options={occupationOptions}
                                            columns={commonColumns}
                                            disabled={!isEditable}
                                            placeholder="Chọn nghề..."
                                            className="h-10"
                                            displayValue={item => item.name}
                                        />
                                    </div>

                                    {/* Row 3: Address (Comboboxes) */}
                                    <div className="col-span-1">
                                        <FormInput label="Điện thoại" name="phone" value={formData.phone} onChange={handleInputChange} readOnly={!isEditable} className="h-10"/>
                                    </div>
                                    <div className="col-span-2 relative z-10">
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
                                    <div className="col-span-2 relative z-10">
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
                                    {/* Removed District col */}
                                    
                                    {/* Row 4: Detail Address & Relative */}
                                    <div className="col-span-3">
                                        <FormInput label="Địa chỉ chi tiết" name="address" value={formData.address} onChange={handleInputChange} readOnly={!isEditable} className="h-10"/>
                                    </div>
                                    <div className="col-span-3">
                                        <FormInput label="Người thân (Tên - SĐT)" name="relativeInfo" value={formData.relativeInfo} onChange={handleInputChange} readOnly={!isEditable} placeholder="Người liên hệ khi cần" className="h-10"/>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: REGISTRATION INFO */}
                            <div className="pt-4 border-t border-dashed border-slate-300 dark:border-slate-600">
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 text-base uppercase tracking-wide">
                                    <DocumentTextIcon className="w-5 h-5 text-green-500"/> Thông tin Đăng ký khám
                                </h3>
                                <div className="grid grid-cols-6 gap-x-6 gap-y-4">
                                    <div className="col-span-2">
                                        <FormSelect label="Đối tượng" name="patientType" value={formData.patientType} onChange={handleInputChange} disabled={!isEditable} className="h-10 font-bold text-blue-700">
                                            <option value="Dịch vụ">Dịch vụ</option>
                                            <option value="Bảo hiểm">Bảo hiểm Y tế</option>
                                            <option value="Ưu tiên">Ưu tiên (Người già, TE)</option>
                                        </FormSelect>
                                    </div>
                                    <div className="col-span-1">
                                        <FormInput label="Ngày đăng ký" name="regDate" type="date" value={formData.regDate} onChange={handleInputChange} readOnly={!isEditable} className="h-10"/>
                                    </div>
                                    <div className="col-span-3">
                                        <FormSelect label="Khoa / Phòng khám" name="regDepartment" value={formData.regDepartment} onChange={handleInputChange} disabled={!isEditable} className="h-10">
                                            <option>Khoa Khám Bệnh - PK Nội TQ</option>
                                            <option>Khoa Khám Bệnh - PK Ngoại</option>
                                            <option>Khoa Nhi</option>
                                            <option>Sản Phụ Khoa</option>
                                            <option>Tai Mũi Họng</option>
                                            <option>Răng Hàm Mặt</option>
                                        </FormSelect>
                                    </div>

                                    <div className="col-span-6 mt-2">
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
                                                className="w-full font-mono font-bold text-lg text-blue-700 bg-white border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                                value={formData.insuranceNumber} 
                                                readOnly={!isEditable}
                                                onChange={e => handleInputChange({...e, target: {...e.target, name: 'insuranceNumber'}})}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-600 block">Mã</label>
                                            <input className="w-full border border-slate-300 bg-white rounded px-2 py-1 font-bold text-slate-800" value={formData.insuranceCode} readOnly={!isEditable} name="insuranceCode" onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 block">Mức hưởng</label>
                                            <div className="relative">
                                                <input className="w-full border border-slate-300 bg-white rounded px-2 py-1 font-bold text-right pr-4 text-slate-800" value={formData.insuranceBenefit} readOnly={!isEditable} name="insuranceBenefit" onChange={handleInputChange} />
                                                <span className="absolute right-1 top-1 text-xs text-slate-500">%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 block">Khu vực</label>
                                            <input className="w-full border border-slate-300 bg-white rounded px-2 py-1 font-bold text-center text-slate-800" value={formData.insuranceArea} readOnly={!isEditable} name="insuranceArea" onChange={handleInputChange} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-600 block">Ngày đăng ký</label>
                                            <input type="date" className="w-full border border-slate-300 bg-white rounded px-1 py-1 text-xs text-slate-800" value={formData.insuranceRegDate} readOnly={!isEditable} name="insuranceRegDate" onChange={handleInputChange} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-600 block">Ngày hết hạn</label>
                                            <input type="date" className="w-full border border-slate-300 bg-white rounded px-1 py-1 text-xs text-slate-800" value={formData.insuranceExp} readOnly={!isEditable} name="insuranceExp" onChange={handleInputChange} />
                                        </div>
                                    </div>

                                    <div className="relative z-20">
                                        <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Nơi đăng ký KCB Ban đầu</label>
                                        <div className="flex gap-2">
                                            <input className="w-16 border border-slate-300 bg-white rounded px-2 py-1 font-bold text-blue-700 text-center" value={formData.insurancePlaceCode} readOnly={!isEditable} name="insurancePlaceCode" onChange={handleInputChange} placeholder="Mã"/>
                                            <Combobox<HospitalItem>
                                                options={hospitalOptions}
                                                columns={hospitalColumns}
                                                value={formData.insurancePlace}
                                                onChange={handleHospitalChange}
                                                displayValue={item => item.name}
                                                placeholder="Tìm bệnh viện..."
                                                disabled={!isEditable}
                                                className="bg-white rounded flex-1"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-600 block">Nơi làm việc</label>
                                        <input className="w-full border border-slate-300 bg-white rounded px-2 py-1 text-slate-800" value={formData.workplace} readOnly={!isEditable} name="workplace" onChange={handleInputChange} placeholder="Tên cơ quan/đơn vị..." />
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-blue-200">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-slate-600 w-24">Tuyến:</label>
                                            <div className="flex-1 flex gap-2">
                                                {['Đúng tuyến', 'Trái tuyến', 'Cấp cứu'].map(opt => (
                                                    <label key={opt} className="flex items-center gap-1 text-xs cursor-pointer">
                                                        <input 
                                                            type="radio" 
                                                            name="insuranceRoute" 
                                                            value={opt} 
                                                            checked={formData.insuranceRoute === opt} 
                                                            onChange={handleInputChange}
                                                            disabled={!isEditable}
                                                        />
                                                        {opt}
                                                    </label>
                                                ))}
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
                                                    <input type="date" className="w-full border border-slate-300 bg-white rounded px-1 py-0.5 text-[10px] text-slate-800" value={formData.insurance5Year} readOnly={!isEditable} name="insurance5Year" onChange={handleInputChange} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <input type="checkbox" checked={!!formData.insuranceExempt} readOnly={!isEditable} />
                                                <div className="flex flex-col w-full">
                                                    <span className="text-[10px] leading-tight text-slate-600">Miễn CTT</span>
                                                    <input type="text" className="w-full border border-slate-300 bg-white rounded px-1 py-0.5 text-[10px] text-slate-800" placeholder="dd/mm/yyyy" value={formData.insuranceExempt} readOnly={!isEditable} name="insuranceExempt" onChange={handleInputChange} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* ACTION BUTTONS FOR INSURANCE */}
                                    {isEditable && (
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200 mt-2">
                                            <button 
                                                onClick={handleCheckInsurance}
                                                disabled={isCheckingCard}
                                                className="px-3 py-2 bg-teal-600 text-white text-xs font-bold rounded shadow hover:bg-teal-700 flex items-center justify-center gap-1"
                                            >
                                                {isCheckingCard ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckIcon className="w-3 h-3"/>}
                                                Check In (Cổng BH)
                                            </button>
                                            <button 
                                                onClick={handleUpdateInsurance}
                                                className="px-3 py-2 bg-white border border-blue-600 text-blue-600 text-xs font-bold rounded shadow-sm hover:bg-blue-50 flex items-center justify-center gap-1"
                                            >
                                                <RefreshIcon className="w-3 h-3"/> Cập nhật
                                            </button>
                                        </div>
                                    )}
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

export default RegistrationView;
