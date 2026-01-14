
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
    ActivityIcon
} from '../../../components/Icons';
import { consultationService } from '../../../services/consultationService';
import { useSession } from '../../../contexts/SessionContext';

// Import Views
import ChartView from '../../consultation/views/tabs/ChartView';
import LabView from '../../consultation/views/tabs/LabView';
import OperationView from '../../consultation/views/tabs/OperationView';
import FeeView from '../../consultation/views/tabs/FeeView';
import DocumentsView from '../../consultation/views/tabs/DocumentsView';
import HistorySidebar from '../../consultation/views/components/HistorySidebar';

// NEW ROLE-SPECIFIC VIEWS
import DoctorTreatmentView from './tabs/DoctorTreatmentView';
import NurseCareView from './tabs/NurseCareView';

// Mock Data for Inpatient Fallback
const mockInpatientRecord = {
    id: 'P003',
    name: 'LÊ HOÀNG CƯỜNG',
    age: 45,
    gender: 'Nam',
    dob: '10/02/1978',
    address: '456 Minh Khai',
    hasInsurance: true,
    insuranceNumber: 'GD4790215567890',
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

const InpatientRecordView: React.FC = () => {
    const { user } = useSession();
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [patientData, setPatientData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Determine Tabs based on Role
    const isNurse = user?.role === 'nurse';
    
    const tabs = isNurse ? [
        { id: 'chart', label: 'Tổng quan', icon: PresentationChartLineIcon },
        { id: 'care', label: 'Chăm sóc & Thực hiện', icon: ActivityIcon }, // Nurse Main View
        { id: 'lab', label: 'Xem CLS', icon: BeakerIcon },
        { id: 'fee', label: 'Dự trù & Phí', icon: CreditCardIcon },
    ] : [
        { id: 'chart', label: 'Chart', icon: PresentationChartLineIcon },
        { id: 'treatment', label: 'Tờ điều trị', icon: ClipboardListIcon }, // Doctor Main View
        { id: 'lab', label: 'CLS', icon: BeakerIcon },
        { id: 'operation', label: 'PT/TT', icon: ScissorsIcon },
        { id: 'fee', label: 'Viện phí', icon: CreditCardIcon },
        { id: 'documents', label: 'Hồ sơ', icon: FolderIcon },
    ];

    // Default tab logic
    const defaultTab = isNurse ? 'care' : 'treatment';
    const activeTab = searchParams.get('tab') || defaultTab;

    useEffect(() => {
        const fetchPatientData = async () => {
            setIsLoading(true);
            try {
                if (patientId) {
                    const data = await consultationService.getPatientProfile(patientId);
                    if (data) {
                        setPatientData({
                            ...data,
                            room: '301',
                            bed: '02',
                            admissionDate: '15/11/2023 08:30'
                        });
                    } else {
                        setPatientData(mockInpatientRecord);
                    }
                } else {
                    setPatientData(mockInpatientRecord);
                }
            } catch (error) {
                setPatientData(mockInpatientRecord);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatientData();
    }, [patientId]);

    const setActiveTab = (tabId: string) => {
        setSearchParams({ tab: tabId }, { replace: true });
    };

    if (isLoading || !patientData) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
            {/* 1. TOP BAR - Patient Info */}
            <div className={`flex-shrink-0 text-white shadow-md z-20 border-b dark:border-slate-700 ${isNurse ? 'bg-gradient-to-r from-teal-600 to-emerald-600' : 'bg-gradient-to-r from-blue-700 to-blue-600'}`}>
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/inpatient-treatment/list')} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <ChevronLeftIcon className="w-6 h-6 text-white" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold uppercase flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                                {patientData.name} | {patientData.age}T | {patientData.gender}
                            </h1>
                            <p className="text-xs text-blue-100 dark:text-slate-400 opacity-90 flex items-center gap-3">
                                <span className="font-bold bg-white/20 px-1.5 rounded">P.{patientData.room} - G.{patientData.bed}</span>
                                <span>Nhập viện: {patientData.admissionDate}</span>
                                {patientData.hasInsurance && <span className="text-green-300 font-bold">BHYT</span>}
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="text-xs font-bold bg-black/20 px-3 py-1 rounded-full uppercase">
                            {isNurse ? 'Giao diện Điều dưỡng' : 'Giao diện Bác sĩ'}
                        </div>
                        <button 
                            onClick={() => setIsHistoryOpen(true)}
                            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full backdrop-blur-sm transition-colors text-sm font-semibold"
                        >
                            <ClockIcon className="w-4 h-4" />
                            Lịch sử
                        </button>
                    </div>
                </div>

                {/* 2. NAVIGATION TABS */}
                <div className="flex items-end px-2 pt-1 space-x-1 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center justify-center py-2 px-6 min-w-[90px] rounded-t-lg transition-all duration-200 border-b-4 ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-800 text-blue-800 dark:text-sky-400 border-orange-500 translate-y-[1px] shadow-inner font-bold'
                                    : 'bg-white/10 text-blue-100 border-transparent hover:bg-white/20 hover:text-white'
                                }`}
                        >
                            <tab.icon className={`w-5 h-5 mb-1 ${activeTab === tab.id ? 'text-blue-600 dark:text-sky-400' : 'text-blue-200'}`} />
                            <span className="text-xs uppercase tracking-wide">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* SHARED VIEWS */}
                {activeTab === 'chart' && (
                    <ChartView initialVitals={patientData.vitalSigns} patientRecord={patientData} />
                )}
                {activeTab === 'lab' && (
                    <LabView />
                )}
                {activeTab === 'fee' && (
                    <FeeView />
                )}
                
                {/* DOCTOR SPECIFIC VIEWS */}
                {activeTab === 'treatment' && !isNurse && (
                    <DoctorTreatmentView />
                )}
                {activeTab === 'operation' && !isNurse && (
                    <OperationView />
                )}
                 {activeTab === 'documents' && !isNurse && (
                    <DocumentsView />
                )}

                {/* NURSE SPECIFIC VIEWS */}
                {activeTab === 'care' && isNurse && (
                    <NurseCareView />
                )}

                {/* FALLBACK */}
                {!['chart', 'treatment', 'care', 'lab', 'operation', 'fee', 'documents'].includes(activeTab) && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <p>Chức năng đang được xây dựng.</p>
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
