
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    UserPlusIcon, 
    PencilIcon, 
    TrashIcon, 
    SaveIcon, 
    BanIcon, 
    PrinterIcon,
    SearchIcon,
    QrcodeIcon,
    ShieldCheckIcon,
    XIcon
} from '../../../components/Icons';
import ActionButton from '../../../components/shared/ActionButton';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import { FormInput, FormSelect } from '../../../components/shared/forms';
import { Patient, ExaminationRecord, ExamInfo } from '../../../types';
import { mockPatients } from '../data';

const emptyPatient: Patient = {
  id: '', recordNumber: '', name: '', dob: '', age: 0, gender: 'Nam',
  ethnicity: 'Kinh', occupation: '', address: '', phone: '', lastVisit: new Date().toLocaleDateString('vi-VN'),
  patientType: 'Dịch vụ',
  history: [],
};

const emptyExamInfo: ExamInfo = {
    patientStatus: 'Không khỏe',
    examDate: new Date().toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'}),
    ticketNumber: '',
    examType: 'Khám Phụ sản',
    examRoom: 'Phòng Khám Sản - Phụ Khoa',
    symptoms: '',
    patientType: 'Dịch vụ',
    insuranceNumber: '',
};

type ToastType = { message: string; type: 'success' | 'error' | 'info' };

const Toast: React.FC<{ toast: ToastType; onClose: () => void }> = ({ toast, onClose }) => (
    <div className="fixed top-20 right-5 z-50">
        <div className={`flex items-center p-4 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-500' : 
            toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
            <span className="flex-grow">{toast.message}</span>
            <button onClick={onClose} className="ml-4">
                <XIcon className="w-5 h-5"/>
            </button>
        </div>
    </div>
);


const RegistrationView: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState<Patient>(emptyPatient);
    const [initialFormData, setInitialFormData] = useState<Patient>(emptyPatient);
    const [examInfo, setExamInfo] = useState<ExamInfo>(emptyExamInfo);
    const [initialExamInfo, setInitialExamInfo] = useState<ExamInfo>(emptyExamInfo);
    const [mode, setMode] = useState<'VIEW' | 'EDIT' | 'ADD'>('VIEW');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastType | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    
    useEffect(() => {
        if (patientId) {
            const foundPatient = mockPatients.find(p => p.id === patientId);
            if (foundPatient) {
                setPatient(foundPatient);
                setFormData(foundPatient);
                setInitialFormData(foundPatient);
                
                if (foundPatient.history && foundPatient.history.length > 0) {
                    handleHistoryRowClick(foundPatient.history[0], foundPatient);
                } else {
                    const defaultExam = {...emptyExamInfo, patientType: foundPatient.patientType || 'Dịch vụ'};
                    setExamInfo(defaultExam); 
                    setInitialExamInfo(defaultExam);
                    setSelectedExamId(null);
                }
                setMode('VIEW');
            } else {
                setToast({ message: 'Không tìm thấy bệnh nhân.', type: 'error' });
                navigate('/reception/list');
            }
        } else {
            setPatient(null);
            setFormData(emptyPatient);
            setInitialFormData(emptyPatient);
            setExamInfo(emptyExamInfo);
            setInitialExamInfo(emptyExamInfo);
            setMode('ADD');
            setSelectedExamId(null);
        }
    }, [patientId, navigate]);

    const calculateAge = useCallback((dob: string) => {
        if (!dob || !/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) return 0;
        const [day, month, year] = dob.split('/').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age > 0 ? age : 0;
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        if (name === 'dob') {
            const age = calculateAge(value);
            newFormData.age = age;
        }

        setFormData(newFormData);
    };

    const handleExamInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setExamInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleHistoryRowClick = (record: ExaminationRecord, currentPatient: Patient) => {
        setSelectedExamId(record.id);
        const selectedExamInfo: ExamInfo = {
            patientStatus: record.patientStatus,
            examDate: record.examDate,
            ticketNumber: record.ticketNumber,
            examType: record.examType,
            examRoom: record.clinic,
            symptoms: record.symptoms,
            patientType: currentPatient.patientType || 'Dịch vụ',
            insuranceNumber: '',
        };
        setExamInfo(selectedExamInfo);
        setInitialExamInfo(selectedExamInfo);
        setMode('VIEW');
    };

    const handleSearch = () => {
        if (!searchQuery) return;
        const foundPatient = mockPatients.find(p => p.id.toLowerCase() === searchQuery.toLowerCase() || p.phone === searchQuery || p.recordNumber === searchQuery);
        if (foundPatient) {
            setToast({ message: `Đã tìm thấy bệnh nhân: ${foundPatient.name}`, type: 'success'});
            navigate(`/reception/register/${foundPatient.id}`);
        } else {
            setToast({ message: 'Không tìm thấy bệnh nhân.', type: 'error' });
        }
    };
    
    const handleAdd = () => {
        setSelectedExamId(null);
        navigate('/reception/register');
    };

    const handleEdit = () => {
        if (patient) {
            setSelectedExamId(null);
            const defaultExam = {...emptyExamInfo, patientType: formData.patientType || 'Dịch vụ'};
            setExamInfo(defaultExam);
            setInitialExamInfo(defaultExam);
            setMode('EDIT');
        }
    };

    const handleDelete = () => {
        if (patient) {
            setIsDeleteModalOpen(true);
        }
    };

    const confirmDelete = () => {
        if (patient) {
            console.log(`API Call: Deleting patient with ID ${patient.id}...`);
            setTimeout(() => {
                const index = mockPatients.findIndex(p => p.id === patient.id);
                if (index !== -1) mockPatients.splice(index, 1);

                setToast({ message: 'Xóa bệnh nhân thành công!', type: 'success' });
                setIsDeleteModalOpen(false);
                navigate('/reception/list');
            }, 500);
        }
    };

    const handleSave = () => {
        if (!formData.name || !formData.dob) {
            setToast({ message: 'Vui lòng nhập Tên bệnh nhân và Năm sinh.', type: 'error' });
            return;
        }

        if (mode === 'ADD') {
            console.log('API Call: Creating new patient...', { patientData: formData, examData: examInfo });
            setTimeout(() => {
                const newPatientId = `P${Date.now()}`;
                const newRecordNumber = `${new Date().getFullYear().toString().slice(-2)}${Math.floor(100000 + Math.random() * 900000)}`;
                const newPatient = { ...formData, id: newPatientId, recordNumber: newRecordNumber, patientType: examInfo.patientType };
                
                mockPatients.push(newPatient);
                setToast({ message: 'Thêm mới bệnh nhân thành công!', type: 'success' });
                navigate(`/reception/register/${newPatientId}`, { replace: true });
            }, 500);
        } else if (mode === 'EDIT' && patient) {
            console.log(`API Call: Updating patient with ID ${patient.id}...`, { patientData: formData, examData: examInfo });
            setTimeout(() => {
                const updatedPatientData = {...formData, patientType: examInfo.patientType};
                setToast({ message: 'Cập nhật thông tin thành công!', type: 'success' });
                setMode('VIEW');
                setFormData(updatedPatientData);
                setInitialFormData(updatedPatientData);
                setInitialExamInfo(examInfo);
                const index = mockPatients.findIndex(p => p.id === patient.id);
                if (index !== -1) mockPatients[index] = updatedPatientData;
            }, 500);
        }
    };

    const handleCancel = () => {
        setFormData(initialFormData);
        setExamInfo(initialExamInfo);
        setMode('VIEW');
    };

    const handlePrint = () => {
       if (patient) {
         navigate('/documents/preview/registration', { state: { patient: formData, exam: examInfo } });
       } else {
         setToast({ message: 'Vui lòng chọn hoặc lưu bệnh nhân trước khi in.', type: 'error' });
       }
    };

    const handleCheckInBHYT = () => {
        if (examInfo.patientType === 'Bảo hiểm') {
            setToast({ message: 'Đang kiểm tra thông tin BHYT...', type: 'info' });
            setTimeout(() => {
                const isSuccess = Math.random() > 0.2;
                if (isSuccess) {
                    setToast({ message: 'CheckIn BHYT thành công! Thẻ hợp lệ.', type: 'success' });
                } else {
                    setToast({ message: 'CheckIn BHYT thất bại! Thẻ không hợp lệ.', type: 'error' });
                }
            }, 1500);
        }
    };
    
    const isEditing = mode === 'EDIT' || mode === 'ADD';
    const isReadOnly = mode === 'VIEW';
    const formGroupClass = isEditing ? 'ring-2 ring-blue-400 dark:ring-blue-500' : 'border-slate-200/50 dark:border-slate-700';

    return (
        <div className="flex flex-col h-full">
            {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

            {/* --- MAIN INTERACTIVE VIEW (Hidden on Print) --- */}
            <div className="flex flex-col h-full">
                {/* Action Toolbar */}
                <div className="flex-shrink-0 bg-surface dark:bg-dark-surface p-3 rounded-lg shadow-md border border-slate-200/50 dark:border-slate-700 mb-4">
                    <div className="flex items-center flex-wrap gap-3">
                        <ActionButton label="Thêm" icon={<UserPlusIcon className="w-4 h-4"/>} onClick={handleAdd} className="bg-blue-500 hover:bg-blue-600 text-white" disabled={isEditing}/>
                        <ActionButton label="Sửa" icon={<PencilIcon className="w-4 h-4"/>} onClick={handleEdit} className="bg-yellow-500 hover:bg-yellow-600 text-white" disabled={isEditing || !patient}/>
                        <ActionButton label="Xóa" icon={<TrashIcon className="w-4 h-4"/>} onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white" disabled={isEditing || !patient}/>
                        <ActionButton label="Lưu" icon={<SaveIcon className="w-4 h-4"/>} onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white" disabled={!isEditing}/>
                        <ActionButton label="Hủy" icon={<BanIcon className="w-4 h-4"/>} onClick={handleCancel} className="bg-slate-500 hover:bg-slate-600 text-white" disabled={!isEditing}/>
                        <ActionButton label="In" icon={<PrinterIcon className="w-4 h-4"/>} onClick={handlePrint} className="bg-gray-500 hover:bg-gray-600 text-white" disabled={!patient}/>
                        <ActionButton label="CheckIn BHYT" icon={<ShieldCheckIcon className="w-4 h-4"/>} onClick={handleCheckInBHYT} className="bg-cyan-600 hover:bg-cyan-700 text-white" disabled={!patient || examInfo.patientType !== 'Bảo hiểm'}/>
                    </div>
                </div>

                <div className="flex-grow space-y-4 overflow-y-auto pr-2 pb-2">
                    {/* Scan/Search Section */}
                    <div className="bg-surface dark:bg-dark-surface p-3 rounded-lg shadow border border-slate-200/50 dark:border-slate-700">
                        <div className="flex items-end gap-2">
                            <div className="flex-grow">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                                    <QrcodeIcon className="w-4 h-4 inline-block mr-1"/>
                                    Quét thẻ CCCD/BHYT hoặc tìm kiếm (Thử P001 hoặc P004)
                                </label>
                                <input
                                    name="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Nhập mã bệnh nhân, SĐT..."
                                    className="w-full text-sm p-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <button onClick={handleSearch} className="px-4 py-1.5 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark h-[35px] flex items-center">
                                <SearchIcon className="w-4 h-4 mr-2"/>
                                Tìm
                            </button>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className={`bg-surface dark:bg-dark-surface p-4 rounded-lg shadow border transition-all duration-300 ${formGroupClass}`}>
                        <p className="font-semibold text-primary dark:text-dark-primary mb-3">Thông tin bệnh nhân</p>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-3">
                            <FormInput label="Mã BN" name="id" value={formData.id} readOnly className="!text-lg !font-bold !text-primary dark:!text-dark-primary" />
                            <FormInput label="Số hồ sơ" name="recordNumber" value={formData.recordNumber} readOnly className="!text-lg !font-bold !text-primary dark:!text-dark-primary" />
                            <FormInput label="Tên bệnh nhân" name="name" value={formData.name} onChange={handleChange} readOnly={isReadOnly} required containerClassName="md:col-span-2" className="!text-lg !font-bold !text-primary dark:!text-dark-primary"/>
                            <FormInput label="Năm sinh" name="dob" value={formData.dob} onChange={handleChange} readOnly={isReadOnly} placeholder="dd/mm/yyyy" required />
                            <FormInput label="Tuổi" name="age" value={formData.age ? `${formData.age} Tuổi` : ''} readOnly />
                            
                            <FormSelect label="Giới" name="gender" value={formData.gender} onChange={handleChange} disabled={isReadOnly}>
                                <option>Nam</option> <option>Nữ</option> <option>Khác</option>
                            </FormSelect>
                            <FormSelect label="Dân tộc" name="ethnicity" value={formData.ethnicity} onChange={handleChange} disabled={isReadOnly}><option>Kinh</option><option>Khác</option></FormSelect>
                            <FormSelect label="Nghề nghiệp" name="occupation" value={formData.occupation} onChange={handleChange} disabled={isReadOnly} containerClassName="md:col-span-2">
                                <option></option><option>Văn phòng</option><option>Giáo viên</option><option>Kỹ sư</option><option>Sinh viên</option><option>Khác</option>
                            </FormSelect>
                            <FormInput label="Số điện thoại" name="phone" value={formData.phone} onChange={handleChange} readOnly={isReadOnly} containerClassName="md:col-span-2" />
                            
                            <FormInput label="Thẻ căn cước" name="identityCard" value={formData.identityCard || ''} onChange={handleChange} readOnly={isReadOnly} containerClassName="md:col-span-2" />
                            <FormInput label="Người thân" name="relativeInfo" value={formData.relativeInfo || ''} onChange={handleChange} readOnly={isReadOnly} containerClassName="md:col-span-2" />
                            <FormSelect label="Tỉnh/TP" name="province" value={formData.province || ''} onChange={handleChange} disabled={isReadOnly} containerClassName="md:col-span-2"><option>...</option></FormSelect>
                            
                            <FormSelect label="Phường/Xã" name="ward" value={formData.ward || ''} onChange={handleChange} disabled={isReadOnly} containerClassName="md:col-span-2"><option>...</option></FormSelect>
                            <FormInput label="Địa chỉ chi tiết" name="address" value={formData.address} onChange={handleChange} readOnly={isReadOnly} containerClassName="md:col-span-4"/>
                        </div>
                    </div>

                    {/* Examination Info */}
                    <div className={`bg-surface dark:bg-dark-surface p-4 rounded-lg shadow border transition-all duration-300 ${formGroupClass}`}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-semibold text-primary dark:text-dark-primary">Thông tin khám</p>
                            <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center">
                                    <input id="nationality" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" disabled={isReadOnly}/>
                                    <label htmlFor="nationality" className="ml-2 text-slate-600 dark:text-slate-300">Quốc tịch</label>
                                </div>
                                <div className="flex items-center">
                                    <input id="reexam" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" disabled={isReadOnly}/>
                                    <label htmlFor="reexam" className="ml-2 text-slate-600 dark:text-slate-300">Hẹn khám lại</label>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3">
                            <FormSelect label="Đối tượng" name="patientType" value={examInfo.patientType} onChange={handleExamInfoChange} disabled={isReadOnly}>
                                <option>Dịch vụ</option><option>Bảo hiểm</option>
                            </FormSelect>
                            <FormInput label="Số thẻ" name="insuranceNumber" value={examInfo.insuranceNumber || ''} onChange={handleExamInfoChange} readOnly={isReadOnly || examInfo.patientType !== 'Bảo hiểm'} />
                            <FormSelect label="T/trạng BN" name="patientStatus" value={examInfo.patientStatus} onChange={handleExamInfoChange} disabled={isReadOnly}>
                                <option>Không khỏe</option><option>Bình thường</option>
                            </FormSelect>
                            <FormInput label="Ngày" name="examDate" value={examInfo.examDate} onChange={handleExamInfoChange} readOnly={isReadOnly} />
                            
                            <FormInput label="Số phiếu" name="ticketNumber" value={examInfo.ticketNumber} onChange={handleExamInfoChange} readOnly={isReadOnly} />
                            <FormSelect label="Kiểu khám" name="examType" value={examInfo.examType} onChange={handleExamInfoChange} disabled={isReadOnly}>
                                <option>Khám Phụ sản</option><option>Khám Nội</option><option>Khám Nhi</option><option>Khám thai</option>
                            </FormSelect>
                            <FormSelect label="Phòng" name="examRoom" value={examInfo.examRoom} onChange={handleExamInfoChange} disabled={isReadOnly} containerClassName="md:col-span-2">
                                <option>Phòng Khám Sản - Phụ Khoa</option><option>PK Nội</option><option>PK Nhi</option>
                            </FormSelect>
                            
                            <FormInput label="Triệu chứng" name="symptoms" value={examInfo.symptoms} onChange={handleExamInfoChange} readOnly={isReadOnly} containerClassName="md:col-span-4"/>
                        </div>
                    </div>
                    
                    {/* Examination History List */}
                    {patient && (
                        <div className="bg-surface dark:bg-dark-surface p-4 rounded-lg shadow border border-slate-200/50 dark:border-slate-700">
                            <p className="font-semibold text-primary dark:text-dark-primary mb-3">Danh sách phiếu khám</p>
                            {patient.history && patient.history.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm whitespace-nowrap">
                                        <thead className="bg-slate-100 dark:bg-slate-800">
                                            <tr>
                                                {['Số HS', 'Ngày khám', 'Phòng khám', 'Số phiếu', 'Bác sĩ', 'Trạng thái', 'Chẩn đoán', 'Hành động'].map(h =>
                                                    <th key={h} className="p-2 font-semibold text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {patient.history.map((exam) => (
                                                <tr 
                                                key={exam.id} 
                                                onClick={() => handleHistoryRowClick(exam, patient)} 
                                                className={`hover:bg-primary/5 dark:hover:bg-dark-primary/10 transition-colors duration-150 cursor-pointer ${selectedExamId === exam.id ? 'bg-primary/10 dark:bg-dark-primary/20' : ''}`}>
                                                    <td className="p-2">{exam.recordNumber}</td>
                                                    <td className="p-2">{exam.examDate}</td>
                                                    <td className="p-2">{exam.clinic}</td>
                                                    <td className="p-2">{exam.ticketNumber}</td>
                                                    <td className="p-2">{exam.doctor}</td>
                                                    <td className="p-2">{exam.status}</td>
                                                    <td className="p-2 truncate max-w-xs">{exam.diagnosis}</td>
                                                    <td className="p-2 text-center">
                                                        <Link to={`/documents/view/${exam.id}`} className="text-primary dark:text-dark-primary hover:underline text-xs font-semibold">
                                                            Xem PDF
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                                    Bệnh nhân chưa có lịch sử khám.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Xóa bệnh nhân"
                message={`Bạn có chắc chắn muốn xóa bệnh nhân ${patient?.name}? Hành động này không thể hoàn tác.`}
            />
        </div>
    );
};

export default RegistrationView;
    