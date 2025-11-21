
import React, { useState } from 'react';
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

// Reuse components from Consultation module to ensure feature parity and consistency
// In a real-world scenario with divergent logic, these would be duplicated or refactored into shared components.
import ChartView from '../../consultation/views/tabs/ChartView';
import ExamineView from '../../consultation/views/tabs/ExamineView';
import LabView from '../../consultation/views/tabs/LabView';
import OperationView from '../../consultation/views/tabs/OperationView';
import MedicationView from '../../consultation/views/tabs/MedicationView';
import FeeView from '../../consultation/views/tabs/FeeView';
import DocumentsView from '../../consultation/views/tabs/DocumentsView';
import HistorySidebar from '../../consultation/views/components/HistorySidebar';

// Mock Data for Inpatient
const mockInpatientRecord = {
    id: 'P003',
    name: 'LÊ HOÀNG CƯỜNG',
    age: 45,
    gender: 'Nam',
    dob: '10/02/1978',
    address: '456 Minh Khai',
    hasInsurance: true,
    diagnosis: '[J18] Viêm phổi, tác nhân không xác định',
    room: '301',
    bed: '02',
    admissionDate: '15/11/2023 08:30',
    vitalSigns: {
        height: 170,
        weight: 68,
        bmi: 23.5,
        bpSys: 130,
        bpDia: 85,
        heartRate: 88,
        respRate: 20,
        temp: 38.5,
        spO2: 96
    },
    bpHistory: [
        { date: '15/11 08:00', systolic: 135, diastolic: 85 },
        { date: '15/11 14:00', systolic: 130, diastolic: 80 },
        { date: '16/11 08:00', systolic: 125, diastolic: 80 },
    ]
};

const tabs = [
    { id: 'chart', label: 'Chart', icon: PresentationChartLineIcon },
    { id: 'examine', label: 'Diễn biến', icon: ClipboardListIcon }, // Renamed for Inpatient context
    { id: 'lab', label: 'CLS', icon: BeakerIcon },
    { id: 'operation', label: 'PT/TT', icon: ScissorsIcon },
    { id: 'medication', label: 'Y Lệnh', icon: ArchiveIcon }, // Renamed
    { id: 'fee', label: 'Viện phí', icon: CreditCardIcon },
    { id: 'documents', label: 'Hồ sơ', icon: FolderIcon },
];

const InpatientRecordView: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const activeTab = searchParams.get('tab') || 'chart';

    const setActiveTab = (tabId: string) => {
        setSearchParams({ tab: tabId }, { replace: true });
    };

    const activeTabInfo = tabs.find(t => t.id === activeTab);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
            {/* 1. TOP BAR - Patient Info & Navigation (Different Color for Inpatient: Indigo) */}
            <div className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md z-20">
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/inpatient-treatment/list')} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <ChevronLeftIcon className="w-6 h-6 text-white" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold uppercase flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                                {mockInpatientRecord.name} | {mockInpatientRecord.age}T | {mockInpatientRecord.gender}
                            </h1>
                            <p className="text-xs text-indigo-100 opacity-90 flex items-center gap-3">
                                <span className="font-bold bg-white/20 px-1.5 rounded">P.{mockInpatientRecord.room} - G.{mockInpatientRecord.bed}</span>
                                <span>Nhập viện: {mockInpatientRecord.admissionDate}</span>
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <button 
                            onClick={() => setIsHistoryOpen(true)}
                            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full backdrop-blur-sm transition-colors text-sm font-semibold"
                        >
                            <ClockIcon className="w-4 h-4" />
                            Lịch sử
                        </button>
                        <div className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm max-w-xs truncate">
                            {mockInpatientRecord.diagnosis}
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
                                    ? 'bg-white text-indigo-700 border-orange-400 translate-y-[1px] shadow-inner font-bold'
                                    : 'bg-indigo-800/50 text-indigo-100 border-transparent hover:bg-indigo-700 hover:text-white opacity-90'
                                }`}
                        >
                            <tab.icon className={`w-5 h-5 mb-1 ${activeTab === tab.id ? 'text-indigo-600' : 'text-indigo-200'}`} />
                            <span className="text-xs uppercase tracking-wide">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* REUSING COMPONENTS FROM CONSULTATION MODULE */}
                {activeTab === 'chart' && (
                    <ChartView initialVitals={mockInpatientRecord.vitalSigns} patientRecord={mockInpatientRecord} />
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

export default InpatientRecordView;
