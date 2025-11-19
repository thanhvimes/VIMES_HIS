
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    PresentationChartLineIcon, 
    ClipboardListIcon, 
    BeakerIcon, 
    ScissorsIcon, 
    ArchiveIcon, 
    CreditCardIcon, 
    FolderIcon,
    ChevronLeftIcon,
    CheckIcon,
    FolderIcon as FolderSolidIcon // Using FolderIcon for "Giấy chuyển" as placeholder
} from '../../../components/Icons';
import ChartView from './tabs/ChartView';
import ExamineView from './tabs/ExamineView';

// Mock Data for the specific patient from the image
const mockPatientRecord = {
    id: 'P003',
    name: 'PHÙNG THANH VIỆT',
    age: 39,
    gender: 'Nam',
    dob: '15/05/1984',
    address: 'Chưa có địa chỉ',
    hasInsurance: false,
    diagnosis: '[E11] Bệnh đái tháo đường không phụ thuộc insuline',
    vitalSigns: {
        height: 175,
        weight: 70,
        bmi: 22.9,
        bpSys: 120,
        bpDia: 80,
        heartRate: 72,
        respRate: 16,
        temp: 36.6,
        spO2: 98
    },
    bpHistory: [
        { date: '10:00', systolic: 120, diastolic: 80 },
    ]
};

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
    const [activeTab, setActiveTab] = useState('chart'); // Default to 'chart' as requested content moved there
    
    const activeTabInfo = tabs.find(t => t.id === activeTab);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* 1. TOP BAR - Patient Info & Navigation */}
            <div className="flex-shrink-0 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md z-20">
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <ChevronLeftIcon className="w-6 h-6 text-white" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold uppercase flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                {mockPatientRecord.name} | Tuổi: {mockPatientRecord.age} | Giới tính: {mockPatientRecord.gender}
                            </h1>
                            <p className="text-xs text-cyan-100 opacity-90 flex items-center gap-1">
                                <span className="opacity-70">📍 Địa chỉ:</span> {mockPatientRecord.address}
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end">
                        <div className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                             {mockPatientRecord.diagnosis}
                        </div>
                    </div>
                </div>

                {/* 2. NAVIGATION TABS */}
                <div className="flex items-end px-2 pt-1 space-x-1 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center justify-center py-2 px-6 min-w-[90px] rounded-t-lg transition-all duration-200 border-b-4 ${
                                activeTab === tab.id
                                    ? 'bg-white text-cyan-700 border-amber-500 translate-y-[1px] shadow-inner font-bold'
                                    : 'bg-cyan-700 text-cyan-100 border-transparent hover:bg-cyan-600 hover:text-white opacity-90'
                            }`}
                        >
                            <tab.icon className={`w-5 h-5 mb-1 ${activeTab === tab.id ? 'text-cyan-600' : 'text-cyan-200'}`} />
                            <span className="text-xs uppercase tracking-wide">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Patient Detail Summary Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                            <p className="flex items-center gap-2"><span className="font-bold text-cyan-600 dark:text-cyan-400">👤 {mockPatientRecord.name}</span> - Tuổi: {mockPatientRecord.age}, Giới tính: {mockPatientRecord.gender}, Ngày sinh: {mockPatientRecord.dob}</p>
                            <p>📍 Địa chỉ: {mockPatientRecord.address}</p>
                            <p>💳 Số thẻ BHYT: <span className="italic text-slate-500">Chưa có thông tin</span>, Hạn: - , Mức hưởng: -</p>
                        </div>
                        <div className="flex flex-col gap-2 justify-center">
                            <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded shadow transition-transform active:scale-95 flex items-center justify-center gap-2">
                                <CheckIcon className="w-4 h-4"/> Kiểm tra thẻ
                            </button>
                            <button className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold uppercase rounded shadow transition-transform active:scale-95 flex items-center justify-center gap-2">
                                <FolderSolidIcon className="w-4 h-4"/> Giấy chuyển
                            </button>
                        </div>
                    </div>
                     <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-sm">
                        <p className="font-bold text-blue-700 dark:text-blue-400">🏥 [E11] Bệnh đái tháo đường không phụ thuộc insuline</p>
                    </div>
                </div>

                {/* CONTENT RENDERER BASED ON ACTIVE TAB */}
                {activeTab === 'chart' && (
                    <ChartView initialVitals={mockPatientRecord.vitalSigns} />
                )}

                {activeTab === 'examine' && (
                    <ExamineView />
                )}
                
                {activeTab !== 'chart' && activeTab !== 'examine' && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                             {activeTabInfo && React.createElement(activeTabInfo.icon, { className: "w-8 h-8" })}
                        </div>
                        <p>Tab <strong>{activeTabInfo?.label}</strong> đang được xây dựng.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientRecordView;
