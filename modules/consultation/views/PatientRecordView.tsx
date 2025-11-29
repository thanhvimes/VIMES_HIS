
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
    ClockIcon
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
    { id: 'chart', label: 'Chart', icon: PresentationChartLineIcon },
    { id: 'examine', label: 'Examine', icon: ClipboardListIcon },
    { id: 'lab', label: 'Lab', icon: BeakerIcon },
    { id: 'operation', label: 'Operation', icon: ScissorsIcon },
    { id: 'medication', label: 'Medication', icon: ArchiveIcon },
    { id: 'fee', label: 'Fee', icon: CreditCardIcon },
    { id: 'documents', label: 'Documents', icon: FolderIcon },
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
            if (!patientId) return;
            setIsLoading(true);
            try {
                const data = await consultationService.getPatientProfile(patientId);
                setPatientData(data);
            } catch (error) {
                console.error("Failed to fetch patient data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatientData();
    }, [patientId]);

    const setActiveTab = (tabId: string) => {
        setSearchParams({ tab: tabId }, { replace: true });
    };

    const activeTabInfo = tabs.find(t => t.id === activeTab);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400">Đang tải hồ sơ bệnh nhân...</p>
                </div>
            </div>
        );
    }

    if (!patientData) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-900 text-center p-6">
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">Không tìm thấy bệnh nhân</h2>
                <p className="text-slate-500 mb-6">Hồ sơ bệnh nhân với ID {patientId} không tồn tại hoặc đã bị xóa.</p>
                <button 
                    onClick={() => navigate('/consultation/list')}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
            {/* 1. TOP BAR - Patient Info & Navigation */}
            {/* ADAPTIVE HEADER: Teal in Light Mode (Matches Portal), Deep Slate in Dark Mode (Professional) */}
            <div className="flex-shrink-0 bg-gradient-to-r from-teal-700 to-teal-600 dark:from-slate-900 dark:to-slate-800 text-white shadow-md z-20 border-b dark:border-slate-700">
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <ChevronLeftIcon className="w-6 h-6 text-white" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold uppercase flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                {patientData.name} | Tuổi: {patientData.age} | Giới tính: {patientData.gender}
                            </h1>
                            <p className="text-xs text-teal-100 dark:text-slate-400 opacity-90 flex items-center gap-1">
                                <span className="opacity-70">📍 Địa chỉ:</span> {patientData.address}
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <button 
                            onClick={() => setIsHistoryOpen(true)}
                            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full backdrop-blur-sm transition-colors text-sm font-semibold"
                        >
                            <ClockIcon className="w-4 h-4" />
                            Lịch sử khám
                        </button>
                        <div className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm max-w-xs truncate border border-white/10">
                            {patientData.diagnosis}
                        </div>
                    </div>
                </div>

                {/* 2. NAVIGATION TABS */}
                <div className="flex items-end px-2 pt-1 space-x-1 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center justify-center py-2 px-6 min-w-[90px] rounded-t-lg transition-all duration-200 border-b-4 ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-sky-400 border-orange-500 translate-y-[1px] shadow-inner font-bold'
                                    : 'bg-teal-800/40 dark:bg-slate-800/50 text-teal-100 dark:text-slate-400 border-transparent hover:bg-teal-700 dark:hover:bg-slate-700 hover:text-white opacity-90'
                                }`}
                        >
                            <tab.icon className={`w-5 h-5 mb-1 ${activeTab === tab.id ? 'text-teal-600 dark:text-sky-400' : 'text-teal-200 dark:text-slate-400'}`} />
                            <span className="text-xs uppercase tracking-wide">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* CONTENT RENDERER BASED ON ACTIVE TAB */}
                {activeTab === 'chart' && (
                    <ChartView initialVitals={patientData.vitalSigns} patientRecord={patientData} />
                )}

                {activeTab === 'examine' && (
                    <ExamineView />
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

                {activeTab !== 'chart' && activeTab !== 'examine' && activeTab !== 'lab' && activeTab !== 'operation' && activeTab !== 'medication' && activeTab !== 'fee' && activeTab !== 'documents' && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                            {activeTabInfo && React.createElement(activeTabInfo.icon, { className: "w-8 h-8" })}
                        </div>
                        <p>Tab <strong>{activeTabInfo?.label}</strong> đang được xây dựng.</p>
                    </div>
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
