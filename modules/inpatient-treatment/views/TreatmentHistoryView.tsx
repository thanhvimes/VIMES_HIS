
import React, { useState, useEffect } from 'react';
import { 
    SearchIcon, 
    UserGroupIcon, 
    ClockIcon, 
    DocumentTextIcon,
    ActivityIcon,
    ChevronRightIcon,
    PrinterIcon,
    EyeIcon,
    HospitalIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { consultationService, DetailedHistoryRecord } from '../../../services/consultationService';
import { doctorOptions } from '../../consultation/data/catalogs';

const TreatmentHistoryView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [historyList, setHistoryList] = useState<DetailedHistoryRecord[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<DetailedHistoryRecord | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            // Reusing consultation service for mock data to simulate backend
            const data = await consultationService.getHistoryList({
                keyword: searchTerm,
                fromDate,
                toDate,
                doctor: selectedDoctor
            });
            setHistoryList(data);
            
            if (data.length > 0 && window.innerWidth >= 1024 && !selectedRecord) {
                setSelectedRecord(data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHistory();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, fromDate, toDate, selectedDoctor]);

    const handleRefresh = () => {
        fetchHistory();
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header & Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <HospitalIcon className="w-8 h-8 text-indigo-600"/> Lịch sử Điều trị Nội trú
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tra cứu hồ sơ bệnh án nội trú đã lưu trữ.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 min-w-[200px]">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tên BN, Mã Hồ sơ..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm ${fontSettings.controls}`}
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        <input 
                            type="date" 
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm ${fontSettings.controls}`}
                            title="Từ ngày nhập viện"
                        />
                        <input 
                            type="date" 
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm ${fontSettings.controls}`}
                            title="Đến ngày"
                        />
                    </div>

                    <select 
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm ${fontSettings.controls} min-w-[150px]`}
                    >
                        <option value="">Tất cả bác sĩ</option>
                        {doctorOptions.map(doc => (
                            <option key={doc.id} value={doc.name}>{doc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                
                {/* LEFT: LIST */}
                <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-600 dark:text-slate-300 flex justify-between items-center">
                        <span>Kết quả tìm kiếm ({historyList.length})</span>
                        <button onClick={handleRefresh} className="text-indigo-600 hover:text-indigo-800 text-xs">Làm mới</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="p-10 text-center text-slate-400 italic">Đang tải dữ liệu...</div>
                        ) : historyList.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 italic">Không tìm thấy hồ sơ nào.</div>
                        ) : (
                            historyList.map(record => (
                                <div 
                                    key={record.id}
                                    onClick={() => setSelectedRecord(record)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all group relative ${
                                        selectedRecord?.id === record.id 
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600 shadow-sm' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-300'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{record.patientName}</div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                            {record.examDate}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">ID: {record.patientId} | BA: {record.visitId}</div>
                                    <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium truncate" title={record.diagnosis}>{record.diagnosis}</div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <UserGroupIcon className="w-3 h-3"/> {record.doctorName}
                                    </div>
                                    
                                    {selectedRecord?.id === record.id && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500">
                                            <ChevronRightIcon className="w-5 h-5"/>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: DETAIL */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden relative">
                    {!selectedRecord ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <DocumentTextIcon className="w-16 h-16 mb-4 opacity-20"/>
                            <p>Chọn một hồ sơ để xem chi tiết</p>
                        </div>
                    ) : (
                        <>
                            {/* Detail Header */}
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        Chi tiết Bệnh án
                                        <span className="text-sm font-normal bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded ml-2 border border-indigo-200">
                                            {selectedRecord.visitId}
                                        </span>
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Ngày nhập viện: {selectedRecord.examDate} | BS Điều trị: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedRecord.doctorName}</span>
                                    </p>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm">
                                    <PrinterIcon className="w-4 h-4"/> In Bệnh án
                                </button>
                            </div>

                            {/* Content Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
                                
                                {/* 1. Vitals Card */}
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h3 className="text-xs font-bold text-red-500 uppercase mb-3 flex items-center gap-2">
                                        <ActivityIcon className="w-4 h-4"/> Chỉ số sinh tồn (Lúc nhập viện)
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-100 dark:border-slate-600">
                                            <span className="text-xs text-slate-500 uppercase block">Huyết áp</span>
                                            <span className="text-lg font-bold text-slate-800 dark:text-white">{selectedRecord.vitals.bp} <span className="text-xs font-normal text-slate-400">mmHg</span></span>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-100 dark:border-slate-600">
                                            <span className="text-xs text-slate-500 uppercase block">Mạch</span>
                                            <span className="text-lg font-bold text-slate-800 dark:text-white">{selectedRecord.vitals.hr} <span className="text-xs font-normal text-slate-400">l/p</span></span>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-100 dark:border-slate-600">
                                            <span className="text-xs text-slate-500 uppercase block">Nhiệt độ</span>
                                            <span className="text-lg font-bold text-slate-800 dark:text-white">{selectedRecord.vitals.temp} <span className="text-xs font-normal text-slate-400">°C</span></span>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-100 dark:border-slate-600">
                                            <span className="text-xs text-slate-500 uppercase block">Cân nặng</span>
                                            <span className="text-lg font-bold text-slate-800 dark:text-white">{selectedRecord.vitals.weight} <span className="text-xs font-normal text-slate-400">kg</span></span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Clinical Info */}
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                    <div>
                                        <h3 className="text-xs font-bold text-indigo-600 uppercase mb-1">Lý do nhập viện</h3>
                                        <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">{selectedRecord.symptoms}</p>
                                    </div>
                                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                                        <h3 className="text-xs font-bold text-indigo-600 uppercase mb-1">Chẩn đoán ra viện</h3>
                                        <p className="text-lg font-bold text-slate-800 dark:text-white">{selectedRecord.diagnosis}</p>
                                    </div>
                                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                                        <h3 className="text-xs font-bold text-indigo-600 uppercase mb-1">Tóm tắt bệnh án & Hướng điều trị</h3>
                                        <p className="text-slate-700 dark:text-slate-300 text-sm italic leading-relaxed">{selectedRecord.notes}</p>
                                    </div>
                                </div>

                                {/* 3. Treatment Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <h3 className="text-xs font-bold text-purple-600 uppercase mb-3 flex items-center gap-2">
                                            <DocumentTextIcon className="w-4 h-4"/> Tóm tắt CLS
                                        </h3>
                                        <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
                                            {selectedRecord.labSummary.split(', ').map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                        <button className="mt-4 text-xs font-bold text-purple-600 hover:underline flex items-center gap-1">
                                            <EyeIcon className="w-3 h-3"/> Xem kết quả chi tiết
                                        </button>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <h3 className="text-xs font-bold text-teal-600 uppercase mb-3 flex items-center gap-2">
                                            <DocumentTextIcon className="w-4 h-4"/> Thuốc & Dịch truyền
                                        </h3>
                                        <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
                                            {selectedRecord.prescriptionSummary.split(', ').map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                        <button className="mt-4 text-xs font-bold text-teal-600 hover:underline flex items-center gap-1">
                                            <EyeIcon className="w-3 h-3"/> Xem tờ điều trị
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TreatmentHistoryView;
