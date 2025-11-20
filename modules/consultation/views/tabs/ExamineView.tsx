
import React, { useState, useEffect, useRef } from 'react';
import { 
    ClipboardListIcon, 
    PencilIcon, 
    SaveIcon, 
    BanIcon, 
    PrinterIcon, 
    CheckIcon,
    PlusIcon,
    ListBulletIcon,
    ClockIcon,
    ActivityIcon
} from '../../../../components/Icons';
import { ClinicalRecord, ICD10 } from '../../../../types';
import { consultationService } from '../../../../services/consultationService';
import { usePdfPreview } from '../../../../contexts/PdfPreviewContext';
import Combobox, { ComboboxColumn } from '../../../../components/shared/Combobox';
import { doctorOptions, diagnosisOptions, DoctorItem, CatalogItem } from '../../data/catalogs';
import SubDiagnosisModal from './modals/SubDiagnosisModal';

// Placeholder data
const mockPatientInfo = {
    id: 'P003',
    name: 'PHÙNG THANH VIỆT',
    age: 39,
    gender: 'Nam',
    address: 'Chưa có địa chỉ',
};

const DEMO_PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

const ExamineView: React.FC = () => {
    const { openPdf } = usePdfPreview();
    const [mode, setMode] = useState<'VIEW' | 'EDIT_CLINICAL' | 'EDIT_CONCLUSION'>('VIEW');
    const [isLoading, setIsLoading] = useState(false);
    const [record, setRecord] = useState<ClinicalRecord | null>(null);
    const [originalRecord, setOriginalRecord] = useState<ClinicalRecord | null>(null); // Backup for Cancel
    
    // Modal State for Sub Diseases
    const [isSubDiagModalOpen, setIsSubDiagModalOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const data = await consultationService.getClinicalRecord(mockPatientInfo.id);
                // Ensure endTime is set, default to current time if empty
                if (!data.endTime) {
                    const now = new Date();
                    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                    data.endTime = timeString;
                }
                setRecord(data);
                setOriginalRecord(JSON.parse(JSON.stringify(data))); // Deep copy for backup
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
        if (isEditable && originalRecord) {
            if (window.confirm("Hủy bỏ thay đổi? Dữ liệu chưa lưu sẽ quay về trạng thái cũ.")) {
                setRecord(JSON.parse(JSON.stringify(originalRecord))); // Restore backup
                setMode('VIEW');
            }
        } else {
            setMode('VIEW');
        }
    };

    const validateRecord = (): boolean => {
        if (!record) return false;
        if (!record.doctorName) {
            alert("Vui lòng chọn Bác sĩ khám.");
            return false;
        }
        if (!record.examDate) {
            alert("Vui lòng nhập Ngày khám.");
            return false;
        }
        if (!record.endTime) {
            alert("Vui lòng nhập Giờ kết thúc.");
            return false;
        }
        if (!record.mainDisease) {
            alert("Vui lòng chọn Bệnh chính (Chẩn đoán ICD10).");
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!record) return;
        
        if (!validateRecord()) return;

        setIsLoading(true);
        try {
            const savedRecord = await consultationService.saveClinicalRecord(record);
            setRecord(savedRecord);
            setOriginalRecord(JSON.parse(JSON.stringify(savedRecord))); // Update backup
            setMode('VIEW'); // Close edit mode
        } catch (error) {
            alert("Lỗi khi lưu dữ liệu.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        if (!record) return;
        openPdf({
            url: DEMO_PDF_URL,
            fileName: `Exam_${record.id}.pdf`,
            isSignable: true
        });
    };

    const handleInputChange = (field: keyof ClinicalRecord, value: any) => {
        if (record) {
            setRecord({ ...record, [field]: value });
        }
    };
    
    // Combobox Handlers
    const handleDoctorChange = (value: string, item?: DoctorItem) => {
        if (item) handleInputChange('doctorName', item.name);
        else handleInputChange('doctorName', value);
    };

    const handleMainDiseaseChange = (value: string, item?: CatalogItem) => {
        if (item) {
            handleInputChange('mainDisease', { code: item.code, name: item.name });
            // Auto-fill diagnosis text if empty
            if (!record?.initialDiagnosis) {
                handleInputChange('initialDiagnosis', item.name);
            }
        } else {
             // Handle free text input if needed
        }
    };

    const handleSaveSubDiseases = (diseases: ICD10[]) => {
        handleInputChange('subDiseases', diseases);
    };

    // Columns Configuration for Comboboxes
    const doctorColumns: ComboboxColumn<DoctorItem>[] = [
        { key: 'name', label: 'Họ tên', width: '50%', className: 'font-bold' },
        { key: 'department', label: 'Khoa', width: '30%' },
        { key: 'role', label: 'Chức vụ', width: '20%', className: 'text-xs italic text-slate-500' },
    ];

    const icdColumns: ComboboxColumn<CatalogItem>[] = [
        { key: 'code', label: 'Mã ICD', width: '20%', className: 'font-mono font-bold text-blue-600' },
        { key: 'name', label: 'Tên bệnh', width: '80%' },
    ];

    if (!record) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

    const isEditable = mode !== 'VIEW';

    return (
        <div className="flex flex-col h-full gap-3 relative">
            
            {/* MAIN LAYOUT: Flex container taking full height */}
            <div className="flex flex-col lg:grid lg:grid-cols-4 gap-3 flex-1 min-h-0 overflow-hidden">
                
                {/* LEFT COLUMN: CLINICAL INPUTS (75%) */}
                <div className="lg:col-span-3 flex flex-col gap-3 h-full overflow-y-auto order-1 pr-1">
                    
                    {/* 1. GROUP: LÂM SÀNG (CLINICAL) */}
                    <div className={`flex-shrink-0 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border transition-all duration-300 ${isEditable ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200 dark:border-slate-700'}`}>
                         <div className="flex items-center gap-2 mb-3 text-primary dark:text-primary-light font-bold uppercase text-sm border-b border-slate-100 dark:border-slate-700 pb-1.5">
                            <ClipboardListIcon className="w-4 h-4"/> Lâm Sàng
                        </div>

                         {/* Row 1: Admin Info */}
                         <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
                                <div className="md:col-span-3">
                                    <Combobox<DoctorItem>
                                        label="Bác sĩ khám"
                                        value={record.doctorName}
                                        onChange={handleDoctorChange}
                                        options={doctorOptions}
                                        columns={doctorColumns}
                                        disabled={!isEditable}
                                        required
                                        placeholder="Chọn bác sĩ..."
                                        displayValue={(item) => item.name}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Ngày khám <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="datetime-local" 
                                        value={record.examDate.substring(0, 16)} 
                                        onChange={(e) => handleInputChange('examDate', e.target.value)}
                                        readOnly={!isEditable} 
                                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-base focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Giờ kết thúc <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="time" 
                                            value={record.endTime} 
                                            onChange={(e) => handleInputChange('endTime', e.target.value)}
                                            readOnly={!isEditable} 
                                            className="w-full p-2.5 pl-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-base focus:ring-2 focus:ring-primary"
                                        />
                                        <ClockIcon className="w-4 h-4 absolute left-2.5 top-3.5 text-slate-400 pointer-events-none"/>
                                    </div>
                                </div>
                         </div>

                         {/* Row 2: Clinical Textareas */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col">
                                <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-1">Quá trình bệnh lý</label>
                                <textarea 
                                    value={record.history} 
                                    onChange={(e) => handleInputChange('history', e.target.value)}
                                    disabled={!isEditable}
                                    rows={4}
                                    className="flex-1 w-full p-2.5 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-900 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-600 resize-y"
                                    placeholder="Mô tả diễn biến bệnh..."
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-1">Khám lâm sàng</label>
                                <textarea 
                                    value={record.clinicalExam}
                                    onChange={(e) => handleInputChange('clinicalExam', e.target.value)}
                                    disabled={!isEditable}
                                    rows={4}
                                    className="flex-1 w-full p-2.5 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-900 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-600 resize-y"
                                    placeholder="Mô tả các dấu hiệu khám thấy..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. GROUP: CHẨN ĐOÁN (DIAGNOSIS) */}
                    <div className={`flex-shrink-0 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border transition-all duration-300 ${isEditable ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200 dark:border-slate-700'}`}>
                         <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400 font-bold uppercase text-sm border-b border-slate-100 dark:border-slate-700 pb-1.5">
                            <ActivityIcon className="w-4 h-4"/> Chẩn Đoán
                        </div>
                         <div className="grid grid-cols-1 gap-3">
                                <Combobox<CatalogItem>
                                    label="Bệnh chính (ICD10)"
                                    value={record.mainDisease ? `${record.mainDisease.code} - ${record.mainDisease.name}` : ''}
                                    onChange={handleMainDiseaseChange}
                                    options={diagnosisOptions}
                                    columns={icdColumns}
                                    disabled={!isEditable}
                                    required
                                    placeholder="Nhập mã hoặc tên bệnh..."
                                    displayValue={(item) => `${item.code} - ${item.name}`}
                                    className="w-full"
                                />
                                
                                <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-1.5">Bệnh kèm theo</label>
                                        <div className="min-h-[42px] p-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-1.5 items-center">
                                            {record.subDiseases && record.subDiseases.length > 0 ? (
                                                record.subDiseases.map((d, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                                                        <span className="font-bold mr-1">{d.code}</span> {d.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic pl-1 text-sm">Chưa có bệnh kèm theo</span>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsSubDiagModalOpen(true)}
                                        disabled={!isEditable}
                                        className="mt-8 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                                        title="Thêm bệnh kèm theo"
                                    >
                                        <ListBulletIcon className="w-5 h-5" />
                                    </button>
                                </div>
                         </div>
                    </div>

                    {/* 3. GROUP: KẾT LUẬN & ĐIỀU TRỊ (CONCLUSION) */}
                    <div className={`flex-shrink-0 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border transition-all duration-300 flex flex-col ${isEditable ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200 dark:border-slate-700'}`}>
                         <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400 font-bold text-sm flex-shrink-0 border-b border-slate-100 dark:border-slate-700 pb-1.5">
                            <CheckIcon className="w-4 h-4"/> Kết Luận & Điều Trị
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 h-full">
                            <div className="flex flex-col h-full">
                                <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-1">Kết luận</label>
                                <textarea 
                                    value={record.conclusion}
                                    onChange={(e) => handleInputChange('conclusion', e.target.value)}
                                    disabled={!isEditable}
                                    rows={3}
                                    className="flex-1 w-full p-2.5 text-base font-semibold text-blue-800 dark:text-blue-300 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-900 disabled:bg-slate-50 disabled:text-slate-700 resize-none"
                                    placeholder="Kết luận bệnh..."
                                />
                            </div>
                             <div className="flex flex-col h-full">
                                <label className="block text-base font-bold text-slate-700 dark:text-slate-300 mb-1">Lời dặn / Hướng điều trị</label>
                                <textarea 
                                    value={record.treatmentPlan}
                                    onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                                    disabled={!isEditable}
                                    rows={3}
                                    className="flex-1 w-full p-2.5 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary bg-white dark:bg-slate-900 disabled:bg-slate-50 disabled:text-slate-600 resize-none"
                                    placeholder="Dặn dò bệnh nhân..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: VITAL SIGNS & SUMMARY (25%) */}
                <div className="lg:col-span-1 space-y-3 overflow-y-auto h-full order-2">
                     {/* Compact Vital Signs Card */}
                     <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2 border-b border-red-100 dark:border-red-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> 
                            <h4 className="font-bold text-red-600 dark:text-red-400 text-sm uppercase tracking-wide">Sinh tồn (Mới nhất)</h4>
                        </div>
                        <div className="p-3 grid grid-cols-2 gap-y-3 gap-x-2">
                            <div className="flex flex-col bg-slate-50 dark:bg-slate-700/30 p-1.5 rounded border border-slate-100 dark:border-slate-600">
                                <span className="text-[10px] text-slate-500 uppercase">Mạch</span>
                                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">80 <span className="text-[10px] font-normal text-slate-400">bpm</span></span>
                            </div>
                            <div className="flex flex-col bg-slate-50 dark:bg-slate-700/30 p-1.5 rounded border border-slate-100 dark:border-slate-600">
                                <span className="text-[10px] text-slate-500 uppercase">Nhiệt độ</span>
                                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">36.5 <span className="text-[10px] font-normal text-slate-400">°C</span></span>
                            </div>
                            <div className="flex flex-col col-span-2 bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/30">
                                <span className="text-[10px] text-red-500 uppercase font-bold">Huyết áp</span>
                                <span className="text-2xl font-extrabold text-red-600 dark:text-red-400">120/80 <span className="text-xs font-medium text-red-400">mmHg</span></span>
                            </div>
                            <div className="flex flex-col bg-slate-50 dark:bg-slate-700/30 p-1.5 rounded border border-slate-100 dark:border-slate-600">
                                <span className="text-[10px] text-slate-500 uppercase">BMI</span>
                                <span className="text-base font-bold text-slate-800 dark:text-slate-100">22.9</span>
                            </div>
                            <div className="flex flex-col bg-slate-50 dark:bg-slate-700/30 p-1.5 rounded border border-slate-100 dark:border-slate-600">
                                <span className="text-[10px] text-slate-500 uppercase">SpO2</span>
                                <span className="text-base font-bold text-slate-800 dark:text-slate-100">98%</span>
                            </div>
                        </div>
                     </div>

                     {/* History Summary */}
                     <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs mb-2 uppercase tracking-wide border-b border-slate-100 pb-1">Tiền sử bệnh</h4>
                        <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                            <li className="flex items-start gap-2"><span className="text-blue-500">•</span> Tiểu đường type 2 (5 năm)</li>
                            <li className="flex items-start gap-2"><span className="text-blue-500">•</span> Tăng huyết áp (Mẹ)</li>
                            <li className="flex items-start gap-2"><span className="text-red-500 font-bold">•</span> Dị ứng: Penicillin</li>
                        </ul>
                     </div>
                </div>
            </div>

            {/* BOTTOM ACTION BAR */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 z-20">
                {!isEditable ? (
                    <>
                        <button onClick={handleUpdate} className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-base shadow transition-transform active:scale-95">
                            <PencilIcon className="w-5 h-5"/> Khám
                        </button>
                        <button onClick={handleConclude} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-base shadow transition-transform active:scale-95">
                            <CheckIcon className="w-5 h-5"/> Kết luận
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-base shadow transition-transform active:scale-95">
                            <PrinterIcon className="w-5 h-5"/> In
                        </button>
                    </>
                ) : (
                    <>
                         <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-base shadow-lg transition-transform active:scale-95 disabled:opacity-70">
                            {isLoading ? 'Đang lưu...' : <><SaveIcon className="w-5 h-5"/> Lưu Lại</>}
                        </button>
                        <button onClick={handleCancel} disabled={isLoading} className="flex items-center gap-2 px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg font-bold text-base transition-transform active:scale-95 disabled:opacity-70">
                            <BanIcon className="w-5 h-5"/> Hủy
                        </button>
                    </>
                )}
            </div>

            {/* MODALS */}
            <SubDiagnosisModal 
                isOpen={isSubDiagModalOpen}
                onClose={() => setIsSubDiagModalOpen(false)}
                initialDiseases={record.subDiseases || []}
                onSave={handleSaveSubDiseases}
            />
        </div>
    );
};

export default ExamineView;
