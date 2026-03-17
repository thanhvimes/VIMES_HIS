
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    PresentationChartLineIcon,
    ClipboardListIcon,
    BeakerIcon,
    ScissorsIcon,
    ArchiveIcon,
    CreditCardIcon,
    FolderIcon,
    ChevronLeftIcon,
    ClockIcon,
    ExclamationCircleIcon,
    UserCircleIcon
} from '../../../components/Icons';
import ChartView from './tabs/ChartView';
import ExamineView from './tabs/ExamineView';
import LabView from './tabs/LabView';
import OperationView from './tabs/OperationView';
import MedicationView from './tabs/MedicationView';
import FeeView from './tabs/FeeView';
import DocumentsView from './tabs/DocumentsView';
import HistorySidebar from './components/HistorySidebar';
import { consultationService } from '../../../services/consultationService';

const tabs = [
    { id: 'chart', label: 'Tổng quan', icon: PresentationChartLineIcon },
    { id: 'examine', label: 'Khám bệnh', icon: ClipboardListIcon },
    { id: 'lab', label: 'Cận lâm sàng', icon: BeakerIcon },
    { id: 'operation', label: 'Thủ thuật', icon: ScissorsIcon },
    { id: 'medication', label: 'Kê đơn', icon: ArchiveIcon },
    { id: 'fee', label: 'Viện phí', icon: CreditCardIcon },
    { id: 'documents', label: 'Hồ sơ EMR', icon: FolderIcon },
];

const PatientRecordView: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [patientData, setPatientData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const activeTab = searchParams.get('tab') || 'chart';

    useEffect(() => {
        const fetchPatientData = async () => {
            if (!patientId) {
                setIsLoading(false);
                return;
            }
            const docNo = searchParams.get('docNo');
            setIsLoading(true);
            try {
                const data = await consultationService.getPatientProfile(patientId, docNo || undefined);
                setPatientData(data);
            } catch (error) {
                console.error("Failed to fetch patient data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatientData();
    }, [patientId, searchParams]);

    const setActiveTab = (tabId: string) => {
        setSearchParams({ tab: tabId }, { replace: true });
    };

    const activeTabInfo = tabs.find(t => t.id === activeTab);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400">Đang tải hồ sơ bệnh nhân...</p>
                </div>
            </div>
        );
    }

    if (!patientId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-900 text-center p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <UserCircleIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">Chưa chọn bệnh nhân</h2>
                <p className="text-slate-500 mb-6">Vui lòng chọn một bệnh nhân từ danh sách chờ khám để xem hồ sơ.</p>
                <button 
                    onClick={() => navigate('/consultation/list')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-500/20"
                >
                    Đến danh sách chờ khám
                </button>
            </div>
        );
    }

    if (!patientData) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-900 text-center p-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <ExclamationCircleIcon className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">Không tìm thấy bệnh nhân</h2>
                <p className="text-slate-500 mb-6">Hồ sơ bệnh nhân với ID <span className="font-bold text-slate-800 dark:text-white">{patientId}</span> không tồn tại hoặc đã bị xóa.</p>
                <button 
                    onClick={() => navigate('/consultation/list')}
                    className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-bold"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
            {/* 1. TOP BAR - Enhanced Patient Info */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-md z-20 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/consultation/dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-200">
                                {patientData.name.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold text-slate-800 dark:text-white uppercase leading-none">
                                        {patientData.name}
                                    </h1>
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                        {patientData.gender} - {patientData.age}T
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                                    <span className="font-mono bg-slate-50 dark:bg-slate-900 px-1.5 rounded text-blue-600 dark:text-blue-400 font-bold">{patientData.id}</span>
                                    <span>{patientData.address}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Critical Info Tags */}
                    <div className="flex items-center gap-4">
                        {patientData.allergies && (
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 animate-pulse">
                                <ExclamationCircleIcon className="w-5 h-5 text-red-600"/>
                                <div>
                                    <span className="text-[10px] font-bold text-red-500 uppercase block leading-none">Cảnh báo Dị ứng</span>
                                    <span className="text-xs font-bold text-red-700 dark:text-red-400">{patientData.allergies}</span>
                                </div>
                            </div>
                        )}
                        <div className="hidden lg:block bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                             <span className="text-[10px] font-bold text-blue-500 uppercase block leading-none">Nhóm máu</span>
                             <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{patientData.bloodType || 'Chưa XN'}</span>
                        </div>
                        
                        <button 
                            onClick={() => setIsHistoryOpen(true)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex flex-col items-center"
                            title="Lịch sử khám"
                        >
                            <ClockIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 2. NAVIGATION TABS */}
                <div className="flex items-end px-4 space-x-1 overflow-x-auto border-t border-slate-100 dark:border-slate-700">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all duration-200 text-sm font-medium whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-800'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100 dark:bg-slate-900/50">
                {/* CONTENT RENDERER BASED ON ACTIVE TAB */}
                {activeTab === 'chart' && (
                    <ChartView initialVitals={patientData.vitalSigns} patientRecord={patientData} />
                )}

                {activeTab === 'examine' && (
                    <ExamineView age={patientData.age} gender={patientData.gender} />
                )}

                {activeTab === 'lab' && (
                    <LabView />
                )}

                {activeTab === 'operation' && (
                    <OperationView />
                )}
                
                {activeTab === 'medication' && (
                    <MedicationView />
                )}

                {activeTab === 'fee' && (
                    <FeeView />
                )}

                {activeTab === 'documents' && (
                    <DocumentsView />
                )}
            </div>

            {/* 4. HISTORY SIDEBAR */}
            <HistorySidebar 
                isOpen={isHistoryOpen} 
                onClose={() => setIsHistoryOpen(false)} 
                patientId={patientId || 'UNKNOWN'}
            />
        </div>
    );
};

export default PatientRecordView;
