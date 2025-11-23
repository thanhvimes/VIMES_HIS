
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    UserPlusIcon, 
    PencilIcon, 
    SaveIcon, 
    BanIcon, 
    PrinterIcon,
    SearchIcon,
    QrcodeIcon,
    CreditCardIcon,
    UserGroupIcon,
    ClockIcon,
    DocumentTextIcon,
    CheckIcon
} from '../../../components/Icons';
import ActionButton from '../../../components/shared/ActionButton';
import { FormInput, FormSelect } from '../../../components/shared/forms';
import { Patient, ExaminationRecord } from '../../../types';
import { mockPatients } from '../data';
import { usePdfPreview } from '../../../contexts/PdfPreviewContext';
import jsPDF from 'jspdf';

// --- UTILITY: QR CODE PARSER ---
const parseScannedData = (rawData: string) => {
    // CCCD Pattern: ID|OldID|Name|DOB|Gender|Address|IssueDate
    if (rawData.includes('|') && rawData.split('|').length >= 5) {
        const parts = rawData.split('|');
        const dobRaw = parts[3]; 
        const dobDate = `${dobRaw.slice(4,8)}-${dobRaw.slice(2,4)}-${dobRaw.slice(0,2)}`;
        return {
            type: 'CCCD',
            data: {
                identityCard: parts[0],
                name: parts[2],
                dob: dobDate,
                gender: (parts[4] === 'Nam' ? 'Nam' : 'Nữ') as 'Nam' | 'Nữ' | 'Khác',
                address: parts[5],
                age: new Date().getFullYear() - parseInt(dobRaw.slice(4,8))
            }
        };
    }
    // BHYT Pattern Simulation
    if (rawData.startsWith('DN') || rawData.startsWith('GD') || rawData.startsWith('HS')) {
         const parts = rawData.split('|');
         if (parts.length >= 4) {
             const [d, m, y] = parts[2].split('/');
             return {
                 type: 'BHYT',
                 data: {
                     insuranceNumber: parts[0],
                     name: parts[1],
                     dob: `${y}-${m}-${d}`,
                     gender: (parts[3] === '1' ? 'Nam' : 'Nữ') as 'Nam' | 'Nữ' | 'Khác',
                     address: parts[4] || '',
                     patientType: 'Bảo hiểm' as 'Bảo hiểm',
                     age: new Date().getFullYear() - parseInt(y)
                 }
             };
         }
    }
    return null;
};

const emptyPatient: Patient = {
  id: '', recordNumber: '', name: '', dob: '', age: 0, gender: 'Nam',
  ethnicity: 'Kinh', occupation: '', address: '', phone: '', lastVisit: '',
  patientType: 'Dịch vụ', identityCard: '', relativeInfo: '', 
  history: [],
};

// Extended state for full form fields
interface ExtendedFormData extends Patient {
    email?: string;
    nationality?: string;
    province?: string;
    district?: string;
    ward?: string;
    relativePhone?: string;
    insuranceNumber?: string;
    insuranceExp?: string;
    insurancePlace?: string;
    
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
    
    const [formData, setFormData] = useState<ExtendedFormData>({
        ...emptyPatient,
        regDate: new Date().toISOString().slice(0, 10),
        regDepartment: 'Khoa Khám Bệnh',
        regRoom: '',
        regReason: '',
        regPriority: false
    });
    
    const [mode, setMode] = useState<'VIEW' | 'EDIT' | 'ADD'>('VIEW');
    const [searchQuery, setSearchQuery] = useState('');

    // Load Patient
    useEffect(() => {
        if (patientId) {
            const found = mockPatients.find(p => p.id === patientId);
            if (found) {
                const [d, m, y] = found.dob.split('/');
                setFormData({
                    ...found,
                    dob: `${y}-${m}-${d}`,
                    email: 'example@email.com', // Mock extra fields
                    nationality: 'Việt Nam',
                    province: 'Hà Nội',
                    district: 'Hai Bà Trưng',
                    ward: 'Đồng Tâm',
                    insuranceNumber: found.patientType === 'Bảo hiểm' ? 'DN4010123456789' : '',
                    insuranceExp: found.patientType === 'Bảo hiểm' ? '2024-12-31' : '',
                    regDate: new Date().toISOString().slice(0, 10),
                    regReason: '',
                    regDepartment: 'Khoa Khám Bệnh'
                });
                setMode('VIEW');
            }
        } else {
            setFormData({ ...emptyPatient, regDate: new Date().toISOString().slice(0, 10) });
            setMode('ADD');
        }
    }, [patientId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                const { insuranceNumber, ...pData } = parsed.data as any;
                setFormData(prev => ({
                    ...prev,
                    ...pData,
                    insuranceNumber: insuranceNumber || prev.insuranceNumber,
                    id: mode === 'ADD' ? prev.id : prev.id
                }));
                setSearchQuery('');
                if (mode === 'VIEW') setMode('EDIT');
            } else {
                // Search logic
                const found = mockPatients.find(p => 
                    p.id.toLowerCase() === rawString.toLowerCase() || p.phone === rawString
                );
                if (found) navigate(`/reception/register/${found.id}`);
                else alert('Không tìm thấy bệnh nhân!');
            }
        }
    };

    const handleSave = () => {
        alert('Đã lưu thông tin bệnh nhân và tạo phiếu khám thành công!');
        setMode('VIEW');
    };

    const isEditable = mode !== 'VIEW';

    return (
        <div className="flex flex-col h-full gap-4">
            {/* --- TOP ACTION BAR --- */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <UserPlusIcon className="w-6 h-6 text-blue-600"/>
                        {mode === 'ADD' ? 'Tiếp nhận Bệnh nhân mới' : 'Hồ sơ Bệnh nhân'}
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${formData.patientType === 'Bảo hiểm' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                        {formData.patientType}
                    </span>
                </div>

                {/* Search/Scan Box */}
                <div className="flex-1 max-w-lg relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <QrcodeIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-lg leading-5 bg-blue-50 dark:bg-slate-900 dark:border-slate-600 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                        placeholder="Quét thẻ CCCD / BHYT hoặc nhập Mã BN/SĐT..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleScan}
                    />
                </div>

                <div className="flex gap-2">
                    {isEditable ? (
                        <>
                            <ActionButton label="Lưu phiếu" icon={<SaveIcon className="w-4 h-4"/>} onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white"/>
                            <ActionButton label="Hủy" icon={<BanIcon className="w-4 h-4"/>} onClick={() => { patientId ? setMode('VIEW') : window.location.reload(); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700"/>
                        </>
                    ) : (
                        <>
                            <ActionButton label="Thêm mới" icon={<UserPlusIcon className="w-4 h-4"/>} onClick={() => navigate('/reception/register')} className="bg-green-600 hover:bg-green-700 text-white"/>
                            <ActionButton label="Sửa thông tin" icon={<PencilIcon className="w-4 h-4"/>} onClick={() => setMode('EDIT')} className="bg-amber-500 hover:bg-amber-600 text-white"/>
                            <ActionButton label="In phiếu" icon={<PrinterIcon className="w-4 h-4"/>} onClick={() => {}} className="bg-slate-600 hover:bg-slate-700 text-white"/>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    
                    {/* --- LEFT COLUMN: ADMINISTRATIVE INFO (2/3 Width) --- */}
                    <div className="lg:col-span-2 space-y-4">
                        
                        {/* 1. Thông tin Hành chính */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 border-b pb-2 flex items-center gap-2">
                                <UserGroupIcon className="w-5 h-5"/> I. THÔNG TIN HÀNH CHÍNH
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <FormInput label="Mã Bệnh nhân" name="id" value={formData.id} readOnly className="bg-slate-100 font-mono font-bold"/>
                                <FormInput label="Họ và tên" name="name" value={formData.name} onChange={handleInputChange} readOnly={!isEditable} containerClassName="md:col-span-2" className="font-bold uppercase text-blue-700"/>
                                <FormSelect label="Giới tính" name="gender" value={formData.gender} onChange={handleInputChange} disabled={!isEditable}>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                </FormSelect>

                                <FormInput label="Ngày sinh" name="dob" type="date" value={formData.dob} onChange={handleDobChange} readOnly={!isEditable}/>
                                <FormInput label="Tuổi" name="age" value={formData.age} readOnly className="bg-slate-100"/>
                                <FormInput label="Số điện thoại" name="phone" value={formData.phone} onChange={handleInputChange} readOnly={!isEditable}/>
                                <FormInput label="Email" name="email" value={formData.email} onChange={handleInputChange} readOnly={!isEditable}/>

                                <FormInput label="Nghề nghiệp" name="occupation" value={formData.occupation} onChange={handleInputChange} readOnly={!isEditable}/>
                                <FormSelect label="Dân tộc" name="ethnicity" value={formData.ethnicity} onChange={handleInputChange} disabled={!isEditable}>
                                    <option value="Kinh">Kinh</option>
                                    <option value="Khác">Khác</option>
                                </FormSelect>
                                <FormSelect label="Quốc tịch" name="nationality" value={formData.nationality} onChange={handleInputChange} disabled={!isEditable}>
                                    <option value="Việt Nam">Việt Nam</option>
                                    <option value="Khác">Khác</option>
                                </FormSelect>
                                <FormInput label="Số CCCD/CMND" name="identityCard" value={formData.identityCard} onChange={handleInputChange} readOnly={!isEditable}/>

                                <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2">
                                    <FormInput label="Tỉnh / Thành phố" name="province" value={formData.province} onChange={handleInputChange} readOnly={!isEditable}/>
                                    <FormInput label="Quận / Huyện" name="district" value={formData.district} onChange={handleInputChange} readOnly={!isEditable}/>
                                    <FormInput label="Phường / Xã" name="ward" value={formData.ward} onChange={handleInputChange} readOnly={!isEditable}/>
                                    <FormInput label="Số nhà, Đường phố (Chi tiết)" name="address" value={formData.address} onChange={handleInputChange} readOnly={!isEditable} containerClassName="md:col-span-3"/>
                                </div>

                                <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-2">
                                    <FormInput label="Họ tên người thân" name="relativeInfo" value={formData.relativeInfo} onChange={handleInputChange} readOnly={!isEditable} placeholder="Người liên hệ khi cần"/>
                                    <FormInput label="SĐT người thân" name="relativePhone" value={formData.relativePhone} onChange={handleInputChange} readOnly={!isEditable}/>
                                </div>
                            </div>
                        </div>

                        {/* 2. Thông tin Đăng ký khám */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 border-b pb-2 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5"/> II. THÔNG TIN ĐĂNG KÝ KHÁM
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <FormSelect label="Đối tượng" name="patientType" value={formData.patientType} onChange={handleInputChange} disabled={!isEditable}>
                                    <option value="Dịch vụ">Dịch vụ</option>
                                    <option value="Bảo hiểm">Bảo hiểm Y tế</option>
                                    <option value="Ưu tiên">Ưu tiên (Người già, TE)</option>
                                </FormSelect>
                                <FormInput label="Ngày đăng ký" name="regDate" type="date" value={formData.regDate} onChange={handleInputChange} readOnly={!isEditable}/>
                                <FormSelect label="Khoa / Phòng khám" name="regDepartment" value={formData.regDepartment} onChange={handleInputChange} disabled={!isEditable} containerClassName="md:col-span-2">
                                    <option>Khoa Khám Bệnh - PK Nội TQ</option>
                                    <option>Khoa Khám Bệnh - PK Ngoại</option>
                                    <option>Khoa Nhi</option>
                                    <option>Sản Phụ Khoa</option>
                                    <option>Tai Mũi Họng</option>
                                    <option>Răng Hàm Mặt</option>
                                </FormSelect>

                                {formData.patientType === 'Bảo hiểm' && (
                                    <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <FormInput label="Số thẻ BHYT" name="insuranceNumber" value={formData.insuranceNumber} onChange={handleInputChange} readOnly={!isEditable} className="font-bold"/>
                                        <FormInput label="Hạn sử dụng" name="insuranceExp" type="date" value={formData.insuranceExp} onChange={handleInputChange} readOnly={!isEditable}/>
                                        <FormInput label="Nơi ĐKKCB Ban đầu" name="insurancePlace" value={formData.insurancePlace} onChange={handleInputChange} readOnly={!isEditable} placeholder="Mã bệnh viện..."/>
                                    </div>
                                )}

                                <div className="md:col-span-4">
                                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-sm">Lý do khám / Triệu chứng ban đầu</label>
                                    <textarea 
                                        name="regReason"
                                        value={formData.regReason}
                                        onChange={handleInputChange}
                                        readOnly={!isEditable}
                                        rows={2}
                                        className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Mô tả triệu chứng..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: HISTORY LIST (1/3 Width) --- */}
                    <div className="lg:col-span-1 flex flex-col h-full overflow-hidden">
                        <div className="bg-white dark:bg-slate-800 p-0 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5 text-slate-500"/> Danh sách phiếu khám
                                </h3>
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{formData.history?.length || 0}</span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-0">
                                {formData.history && formData.history.length > 0 ? (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 shadow-sm">
                                            <tr>
                                                <th className="p-3 font-semibold text-slate-600">Ngày</th>
                                                <th className="p-3 font-semibold text-slate-600">Dịch vụ</th>
                                                <th className="p-3 font-semibold text-slate-600 text-right">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {formData.history.map(h => (
                                                <tr key={h.id} className="hover:bg-blue-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                                                    <td className="p-3 align-top">
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">{h.examDate}</div>
                                                        <div className="text-xs text-slate-500">{h.ticketNumber ? `Số: ${h.ticketNumber}` : ''}</div>
                                                    </td>
                                                    <td className="p-3 align-top">
                                                        <div className="font-medium text-blue-600 dark:text-blue-400">{h.examType}</div>
                                                        <div className="text-xs text-slate-500">{h.clinic} - {h.doctor}</div>
                                                        <div className="text-xs text-slate-400 italic truncate max-w-[150px]">{h.diagnosis}</div>
                                                    </td>
                                                    <td className="p-3 text-right align-top">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                            h.status === 'Đã kết thúc' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                                                        }`}>
                                                            {h.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6 text-center">
                                        <DocumentTextIcon className="w-12 h-12 mb-2 opacity-20"/>
                                        <p>Chưa có lịch sử khám bệnh nào.</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Summary Footer */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/10">
                                <h4 className="font-bold text-xs text-yellow-700 dark:text-yellow-500 uppercase mb-1">Ghi chú nhanh</h4>
                                <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc pl-4 space-y-1">
                                    <li>Bệnh nhân có tiền sử dị ứng thuốc.</li>
                                    <li>Ưu tiên khám nhanh (Người cao tuổi).</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrationView;
