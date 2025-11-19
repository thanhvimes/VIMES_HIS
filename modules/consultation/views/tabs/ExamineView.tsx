
import React, { useState, useEffect } from 'react';
import { 
    ClipboardListIcon, 
    PencilIcon, 
    SaveIcon, 
    BanIcon, 
    PrinterIcon, 
    CheckIcon,
    DocumentTextIcon,
    PlusIcon
} from '../../../../components/Icons';
import { ClinicalRecord, ICD10 } from '../../../../types';
import { consultationService } from '../../../../services/consultationService';
import { useNavigate } from 'react-router-dom';

// Placeholder data until we integrate real context
const mockPatientInfo = {
    id: 'P003',
    name: 'PHÙNG THANH VIỆT',
    age: 39,
    gender: 'Nam',
    address: 'Chưa có địa chỉ',
};

const ExamineView: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'VIEW' | 'EDIT_CLINICAL' | 'EDIT_CONCLUSION'>('VIEW');
    const [isLoading, setIsLoading] = useState(false);
    const [record, setRecord] = useState<ClinicalRecord | null>(null);
    const [icdQuery, setIcdQuery] = useState('');

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const data = await consultationService.getClinicalRecord(mockPatientInfo.id);
                setRecord(data);
            } catch (error) {
                console.error("Failed to load record", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleUpdate = () => setMode('EDIT_CLINICAL');
    const handleConclude = () => setMode('EDIT_CONCLUSION');
    
    const handleCancel = () => {
        if (window.confirm("Hủy bỏ thay đổi? Dữ liệu chưa lưu sẽ bị mất.")) {
            setMode('VIEW');
            // Reload original data ideally
        }
    };

    const handleSave = async () => {
        if (!record) return;
        setIsLoading(true);
        try {
            await consultationService.saveClinicalRecord(record);
            setMode('VIEW');
            alert("Lưu phiếu khám thành công!");
        } catch (error) {
            alert("Lỗi khi lưu dữ liệu.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        if (!record) return;
        // Navigate to document preview with state
        navigate('/documents/preview/examination', { 
            state: { 
                patient: mockPatientInfo, // Pass patient info
                record: record 
            } 
        });
    };

    const handleInputChange = (field: keyof ClinicalRecord, value: string) => {
        if (record) {
            setRecord({ ...record, [field]: value });
        }
    };

    if (!record) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

    const isEditable = mode !== 'VIEW';
    const isClinicalEditable = mode === 'EDIT_CLINICAL';
    const isConclusionEditable = mode === 'EDIT_CONCLUSION';

    return (
        <div className="flex flex-col h-full gap-4">
            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                
                {/* LEFT COLUMN: INPUT FORM (70%) */}
                <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-2 pb-2">
                    {/* 1. General Info - Always Readonly */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                         <div className="flex items-center gap-2 mb-3 text-primary dark:text-primary-light font-bold uppercase text-sm border-b border-slate-100 pb-2">
                            <ClipboardListIcon className="w-4 h-4"/> Phiếu Khám
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Ngày khám</label>
                                <input type="text" value={new Date(record.examDate).toLocaleString('vi-VN')} readOnly className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 rounded text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Bác sĩ</label>
                                <input type="text" value={record.doctorName} readOnly className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 rounded text-sm"/>
                            </div>
                        </div>
                    </div>

                    {/* 2. Clinical Process & Exam */}
                    <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border transition-colors ${isClinicalEditable ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200 dark:border-slate-700'}`}>
                        <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-200 font-bold text-sm">
                            <DocumentTextIcon className="w-4 h-4"/> Quá trình bệnh lý & Khám lâm sàng
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Quá trình bệnh lý</label>
                                <textarea 
                                    rows={3} 
                                    value={record.history} 
                                    onChange={(e) => handleInputChange('history', e.target.value)}
                                    disabled={!isClinicalEditable}
                                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-primary bg-white dark:bg-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                                    placeholder="Mô tả diễn biến bệnh..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Khám lâm sàng</label>
                                <textarea 
                                    rows={3}
                                    value={record.clinicalExam}
                                    onChange={(e) => handleInputChange('clinicalExam', e.target.value)}
                                    disabled={!isClinicalEditable}
                                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-primary bg-white dark:bg-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                                    placeholder="Mô tả triệu chứng thực thể..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Diagnosis */}
                    <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border transition-colors ${isClinicalEditable ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200 dark:border-slate-700'}`}>
                         <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-200 font-bold text-sm">
                            <PlusIcon className="w-4 h-4"/> Chẩn đoán
                        </div>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Chẩn đoán ban đầu</label>
                                <input 
                                    type="text" 
                                    value={record.initialDiagnosis}
                                    onChange={(e) => handleInputChange('initialDiagnosis', e.target.value)}
                                    disabled={!isClinicalEditable}
                                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-primary bg-white dark:bg-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Bệnh chính (ICD10)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={record.mainDisease ? `[${record.mainDisease.code}] ${record.mainDisease.name}` : ''}
                                        readOnly
                                        placeholder="Chưa chọn bệnh chính"
                                        disabled={!isClinicalEditable}
                                        className="flex-1 p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 disabled:text-slate-500"
                                    />
                                    {/* Placeholder for ICD10 Search Modal trigger */}
                                    <button disabled={!isClinicalEditable} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-xs font-bold disabled:opacity-50">Chọn</button>
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Bệnh kèm theo</label>
                                <div className="p-2 min-h-[40px] border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-sm text-slate-500 italic">
                                    Chưa có bệnh kèm theo
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Conclusion */}
                    <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border transition-colors ${isConclusionEditable ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200 dark:border-slate-700'}`}>
                         <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-200 font-bold text-sm">
                            <CheckIcon className="w-4 h-4"/> Kết luận & Hướng điều trị
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Kết luận</label>
                                <textarea 
                                    rows={2} 
                                    value={record.conclusion}
                                    onChange={(e) => handleInputChange('conclusion', e.target.value)}
                                    disabled={!isConclusionEditable}
                                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-primary bg-white dark:bg-slate-900 disabled:bg-slate-50 disabled:text-slate-500 font-bold text-blue-700"
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Lời dặn / Hướng điều trị</label>
                                <textarea 
                                    rows={3} 
                                    value={record.treatmentPlan}
                                    onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                                    disabled={!isConclusionEditable}
                                    className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-primary bg-white dark:bg-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: SUMMARY & HISTORY (30%) */}
                <div className="space-y-4">
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-red-500 text-sm mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> 
                            Chỉ số sinh tồn (Mới nhất)
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <span className="text-slate-500">Mạch:</span> <span className="font-bold">80 bpm</span>
                            <span className="text-slate-500">Nhiệt độ:</span> <span className="font-bold">36.5 °C</span>
                            <span className="text-slate-500">Huyết áp:</span> <span className="font-bold text-red-600">120/80</span>
                            <span className="text-slate-500">BMI:</span> <span className="font-bold">22.9</span>
                        </div>
                     </div>

                     <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3">Tiền sử bệnh</h4>
                        <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-300">
                            <li>- Tiểu đường type 2 (5 năm)</li>
                            <li>- Tăng huyết áp (Mẹ)</li>
                            <li>- Dị ứng: Penicillin</li>
                        </ul>
                     </div>
                </div>
            </div>

            {/* BOTTOM ACTION BAR */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                {!isEditable ? (
                    <>
                        <button onClick={handleUpdate} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold text-sm transition-all active:scale-95">
                            <PencilIcon className="w-4 h-4"/> Cập nhật
                        </button>
                        <button onClick={handleConclude} className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded font-bold text-sm transition-all active:scale-95">
                            <CheckIcon className="w-4 h-4"/> Kết luận
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-bold text-sm transition-all active:scale-95">
                            <PrinterIcon className="w-4 h-4"/> In
                        </button>
                    </>
                ) : (
                    <>
                         <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2 px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded font-bold text-sm transition-all active:scale-95 disabled:opacity-70">
                            {isLoading ? 'Đang lưu...' : <><SaveIcon className="w-4 h-4"/> Lưu</>}
                        </button>
                        <button onClick={handleCancel} disabled={isLoading} className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-bold text-sm transition-all active:scale-95 disabled:opacity-70">
                            <BanIcon className="w-4 h-4"/> Hủy
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ExamineView;
