
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
import { FormInput, FormSelect, FormDateInput } from '../../../components/shared/forms';
import Combobox, { ComboboxColumn } from '../../../components/shared/Combobox';
import { Patient } from '../../../types';
import { receptionService } from '../../../services/receptionService';
import { usePdfPreview } from '../../../contexts/PdfPreviewContext';
import { formatDate, formatDateForInput } from '../../../utils/formatters';

// --- MOCK DATA CATALOGS ---
interface CatalogItem {
    code: string;
    name: string;
}

const hospitalOptions: CatalogItem[] = [
    { code: '47001', name: 'Bệnh viện đa khoa Huyện Bù Đăng' },
    { code: '01001', name: 'Bệnh viện Bạch Mai' },
    { code: '79021', name: 'Bệnh viện Chợ Rẫy' },
];

// --- UTILITY FUNCTIONS ---
const decodeHex = (hex: string): string => {
    if (!hex) return '';
    try {
        const cleanHex = hex.replace(/\s+/g, '');
        if (cleanHex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(cleanHex)) {
            return hex;
        }
        const percentEncoded = cleanHex.replace(/(.{2})/g, '%$1');
        return decodeURIComponent(percentEncoded);
    } catch (e) {
        console.error("Hex decode error:", e);
        return hex;
    }
};

const parseScannedData = (rawData: string) => {
    if (!rawData) return null;
    const parts = rawData.split('|');

    // BHYT Pattern
    if (parts.length >= 10 && parts[0].length === 15 && /^[A-Z]{2}\d{13}$/.test(parts[0])) {
        try {
            const insuranceNumber = parts[0];
            const name = decodeHex(parts[1]);
            const dob = parts[2]; 
            const genderCode = parts[3];
            const gender = genderCode === '1' ? 'Nam' : genderCode === '2' ? 'Nữ' : 'Khác';
            const address = decodeHex(parts[4]);
            const placeCode = parts[5]; 
            const validFrom = parts[6];
            const validTo = parts[7];
            const fiveYearDate = parts[12];
            const code = insuranceNumber.substring(0, 2); 
            const benefitCode = insuranceNumber.substring(2, 3);
            
            let benefitRate = '';
            if(benefitCode === '1' || benefitCode === '2') benefitRate = '100';
            else if(benefitCode === '3') benefitRate = '95';
            else benefitRate = '80';
            
            return {
                type: 'BHYT',
                data: {
                    name: name,
                    dob: dob,
                    gender: gender as 'Nam' | 'Nữ' | 'Khác',
                    address: address, 
                    patientType: 'Bảo hiểm',
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

    // CCCD Pattern
    if (parts.length >= 6 && /^\d{12}$/.test(parts[0])) {
        return {
            type: 'CCCD',
            data: {
                identityCard: parts[0],
                name: parts[2],
                dob: parts[3],
                gender: parts[4] as any,
                address: parts[5],
                identityIssueDate: parts[6],
                patientType: 'Dịch vụ'
            }
        };
    }

    return null;
};

// --- COMPONENT ---
interface ExtendedFormData extends Patient {
    identityIssueDate?: string;
    insuranceNumber?: string;
    insuranceRegDate?: string;
    insuranceExp?: string;
    insuranceCode?: string;
    insuranceBenefit?: string;
    insurancePlace?: string;
    insurance5Year?: string;
    regDate?: string;
    regDepartment?: string;
    regRoom?: string;
}

const emptyPatient: ExtendedFormData = {
    id: '', recordNumber: '', name: '', dob: '', age: 0, gender: 'Nam',
    ethnicity: 'Kinh', occupation: '', address: '', phone: '', lastVisit: '',
    patientType: 'Dịch vụ', identityCard: '', relativeInfo: '', history: [],
    regDate: new Date().toLocaleDateString('vi-VN'),
    regDepartment: 'Khoa Khám Bệnh',
    regRoom: '',
};

const RegistrationView: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState<ExtendedFormData>(emptyPatient);
    const [mode, setMode] = useState<'VIEW' | 'EDIT' | 'ADD'>('ADD');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [originalData, setOriginalData] = useState<ExtendedFormData | null>(null);
    
    const [toast, setToast] = useState<{ id: number, type: 'success'|'error'|'info', message: string } | null>(null);
    const showToast = (type: 'success'|'error'|'info', message: string) => {
        setToast({ id: Date.now(), type, message });
    };

    useEffect(() => {
        const loadPatientData = async () => {
            if (patientId) {
                setIsLoading(true);
                try {
                    const found = await receptionService.getPatientByRecordNumber(patientId);
                    if (found) {
                        const loadedData: ExtendedFormData = {
                            ...emptyPatient,
                            ...found,
                            regDate: new Date().toLocaleDateString('vi-VN'),
                        };
                        setFormData(loadedData);
                        setOriginalData(JSON.parse(JSON.stringify(loadedData)));
                        setMode('VIEW');
                    } else {
                        showToast('error', 'Không tìm thấy bệnh nhân');
                        setMode('ADD');
                    }
                } catch (error) {
                    showToast('error', 'Lỗi khi tải dữ liệu');
                } finally {
                    setIsLoading(false);
                }
            } else {
                setMode('ADD');
                setOriginalData(null);
                setFormData({
                    ...emptyPatient,
                    id: `BN${Date.now().toString().slice(-6)}`,
                    recordNumber: `REC${Date.now().toString().slice(-6)}`,
                });
            }
        };
        loadPatientData();
    }, [patientId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const rawString = searchQuery.trim();
            if (!rawString) return;

            const parsed = parseScannedData(rawString);
            if (parsed) {
                setFormData(prev => ({ ...prev, ...parsed.data }));
                setSearchQuery('');
                showToast('success', `Đã quét thành công thẻ ${parsed.type}!`);
                if (mode === 'VIEW') setMode('EDIT'); 
            } else {
                try {
                    setIsLoading(true);
                    const found = await receptionService.getPatientByRecordNumber(rawString);
                    if (found) {
                        navigate(`/reception/register/${found.id}`);
                        setSearchQuery('');
                    } else {
                        setSearchQuery(''); 
                        showToast('error', 'Không tìm thấy dữ liệu!');
                    }
                } catch (error) {
                    showToast('error', 'Lỗi kết nối.');
                } finally {
                    setIsLoading(false);
                }
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name) { showToast('error', "Vui lòng nhập tên bệnh nhân"); return; }
        setIsSaving(true);
        try {
            if (mode === 'ADD') {
                await receptionService.createPatient(formData);
                showToast('success', 'Đã tạo hồ sơ thành công!');
            } else {
                await receptionService.updatePatient(formData.id, formData);
                showToast('success', 'Cập nhật thành công!');
            }
            setMode('VIEW');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancel = () => {
        if (mode === 'ADD') {
            setFormData({...emptyPatient, id: `BN${Date.now().toString().slice(-6)}`, recordNumber: `REC${Date.now().toString().slice(-6)}`});
        } else if (mode === 'EDIT' && originalData) {
            setFormData(originalData);
            setMode('VIEW');
        }
    };
    
    const isEditable = mode !== 'VIEW';

    return (
        <div className="flex flex-col h-full gap-4 pb-10">
            {/* --- TOP ACTION BAR --- */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 px-4 py-4 md:px-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <PlusIcon className="w-7 h-7 text-blue-600"/>
                        <span>{mode === 'ADD' ? 'Đăng ký mới' : 'Hồ sơ bệnh nhân'}</span>
                    </h1>
                </div>

                <div className="flex-1 w-full md:max-w-lg relative order-3 md:order-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <QrcodeIcon className={`h-6 w-6 ${searchQuery ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-2.5 text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 font-bold"
                        placeholder="Quét QR CCCD / BHYT..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleScan}
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto justify-end order-2 md:order-3">
                    {isEditable ? (
                        <>
                            <ActionButton label={isSaving ? "Đang lưu..." : "Lưu hồ sơ"} icon={<SaveIcon className="w-5 h-5"/>} onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white" />
                            <ActionButton label="Hủy" icon={<BanIcon className="w-5 h-5"/>} onClick={handleCancel} className="bg-white border border-slate-300 text-slate-700" />
                        </>
                    ) : (
                        <>
                            <ActionButton label="Sửa" icon={<PencilIcon className="w-5 h-5"/>} onClick={() => setMode('EDIT')} className="bg-amber-500 text-white"/>
                            <ActionButton label="Thêm mới" icon={<PlusIcon className="w-5 h-5"/>} onClick={() => setMode('ADD')} className="bg-green-600 text-white"/>
                        </>
                    )}
                </div>
            </div>

            {/* --- MAIN FORM --- */}
            <div className="flex-1 overflow-y-auto">
                <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8 ${isEditable ? 'ring-2 ring-blue-100' : ''}`}>
                    {/* Hành chính */}
                    <section>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-2 flex items-center gap-2 uppercase tracking-wide">
                            <UserGroupIcon className="w-5 h-5 text-blue-500"/> Thông tin Hành chính
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <FormInput label="Mã BN" name="id" value={formData.id} readOnly className="bg-slate-100 font-mono" containerClassName="md:col-span-1" />
                            <FormInput label="Số Hồ sơ" name="recordNumber" value={formData.recordNumber} readOnly className="bg-slate-100 font-mono text-red-600" containerClassName="md:col-span-1" />
                            <FormInput label="Họ và tên" name="name" value={formData.name} onChange={handleInputChange} readOnly={!isEditable} className="font-bold uppercase text-blue-700" containerClassName="md:col-span-2" />
                            <FormDateInput label="Ngày sinh *" name="dob" value={formData.dob} onChange={handleInputChange} readOnly={!isEditable} containerClassName="md:col-span-1" />
                            <FormSelect label="Giới tính" name="gender" value={formData.gender} onChange={handleInputChange} disabled={!isEditable} containerClassName="md:col-span-1">
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </FormSelect>
                            
                            <FormInput label="Số CCCD" name="identityCard" value={formData.identityCard} onChange={handleInputChange} readOnly={!isEditable} className="font-mono" containerClassName="md:col-span-2" />
                            <FormDateInput label="Ngày cấp CCCD" name="identityIssueDate" value={formData.identityIssueDate} onChange={handleInputChange} readOnly={!isEditable} containerClassName="md:col-span-1" />
                            <FormInput label="Điện thoại" name="phone" value={formData.phone} onChange={handleInputChange} readOnly={!isEditable} containerClassName="md:col-span-1" />
                            <FormInput label="Địa chỉ" name="address" value={formData.address} onChange={handleInputChange} readOnly={!isEditable} containerClassName="md:col-span-2" />
                        </div>
                    </section>

                    {/* Bảo hiểm y tế */}
                    {formData.patientType === 'Bảo hiểm' && (
                        <section className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
                            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2 uppercase text-sm">
                                <CreditCardIcon className="w-5 h-5"/> Thông tin thẻ BHYT
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <FormInput label="Số thẻ BHYT" name="insuranceNumber" value={formData.insuranceNumber} onChange={handleInputChange} readOnly={!isEditable} className="font-mono font-bold" />
                                <FormDateInput label="Từ ngày" name="insuranceRegDate" value={formData.insuranceRegDate} onChange={handleInputChange} readOnly={!isEditable} />
                                <FormDateInput label="Đến ngày (Hết hạn)" name="insuranceExp" value={formData.insuranceExp} onChange={handleInputChange} readOnly={!isEditable} />
                                <FormDateInput label="Ngày đủ 5 năm" name="insurance5Year" value={formData.insurance5Year} onChange={handleInputChange} readOnly={!isEditable} />
                            </div>
                        </section>
                    )}

                    {/* Đăng ký khám */}
                    <section>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-2 flex items-center gap-2 uppercase tracking-wide">
                            <DocumentTextIcon className="w-5 h-5 text-green-500"/> Đăng ký khám
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormSelect label="Đối tượng" name="patientType" value={formData.patientType} onChange={handleInputChange} disabled={!isEditable}>
                                <option value="Dịch vụ">Dịch vụ</option>
                                <option value="Bảo hiểm">Bảo hiểm Y tế</option>
                                <option value="Ưu tiên">Ưu tiên</option>
                            </FormSelect>
                            <FormDateInput label="Ngày đăng ký" name="regDate" value={formData.regDate} onChange={handleInputChange} readOnly={!isEditable} />
                            <FormSelect label="Khoa phòng" name="regDepartment" value={formData.regDepartment} onChange={handleInputChange} disabled={!isEditable} containerClassName="md:col-span-2">
                                <option>Khoa Khám Bệnh - PK Nội 01</option>
                                <option>Khoa Nhi</option>
                                <option>Khoa Sản</option>
                            </FormSelect>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default RegistrationView;
