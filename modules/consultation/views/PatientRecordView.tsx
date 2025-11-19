import React, { useState, useMemo } from 'react';
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
    ActivityIcon,
    PencilIcon,
    CheckIcon
} from '../../../components/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../../../components/shared/Card';

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
    const [activeTab, setActiveTab] = useState('examine');
    const [vitals, setVitals] = useState(mockPatientRecord.vitalSigns);
    const [isEditingVitals, setIsEditingVitals] = useState(false);
    
    const activeTabInfo = tabs.find(t => t.id === activeTab);

    const calculateBMI = (h: number, w: number) => {
        if (h > 0 && w > 0) {
            const heightInMeters = h / 100;
            return (w / (heightInMeters * heightInMeters)).toFixed(1);
        }
        return '0.0';
    };

    const handleVitalChange = (field: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        const newVitals = { ...vitals, [field]: numValue };
        
        if (field === 'height' || field === 'weight') {
            newVitals.bmi = parseFloat(calculateBMI(newVitals.height, newVitals.weight));
        }
        setVitals(newVitals);
    };

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
                                <FolderIcon className="w-4 h-4"/> Giấy chuyển
                            </button>
                        </div>
                    </div>
                     <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-sm">
                        <p className="font-bold text-blue-700 dark:text-blue-400">🏥 [E11] Bệnh đái tháo đường không phụ thuộc insuline</p>
                    </div>
                </div>

                {activeTab === 'examine' && (
                    <>
                        {/* VITAL SIGNS SECTION */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Vital Signs</h3>
                                <button 
                                    onClick={() => setIsEditingVitals(!isEditingVitals)}
                                    className="text-xs bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded shadow-sm flex items-center gap-1"
                                >
                                   {isEditingVitals ? <CheckIcon className="w-3 h-3"/> : <PencilIcon className="w-3 h-3"/>}
                                   {isEditingVitals ? 'Lưu chỉ số' : 'Cập nhật'}
                                </button>
                            </div>
                            <div className="p-6 bg-slate-50/50 dark:bg-slate-800">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                    {[
                                        { label: 'Height', key: 'height', unit: 'cm', color: 'text-blue-600' },
                                        { label: 'Weight', key: 'weight', unit: 'kg', color: 'text-green-600' },
                                        { label: 'BMI', key: 'bmi', unit: '', color: 'text-orange-600', readonly: true },
                                        { label: 'Blood Pressure', key: 'bpSys', unit: 'mmHg', color: 'text-red-600', sub: '120/80' },
                                        { label: 'Heart Rate', key: 'heartRate', unit: 'bpm', color: 'text-purple-600' },
                                        { label: 'Resp. Rate', key: 'respRate', unit: 'lần/phút', color: 'text-teal-600' },
                                        { label: 'Temp', key: 'temp', unit: '°C', color: 'text-red-500' },
                                        { label: 'SpO2', key: 'spO2', unit: '%', color: 'text-cyan-500' },
                                    ].map((item) => (
                                        item.key !== 'bpSys' ? (
                                            <div key={item.label} className="flex flex-col">
                                                <span className={`text-xs font-bold uppercase ${item.color}`}>{item.label}</span>
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    {isEditingVitals && !item.readonly ? (
                                                        <input 
                                                            type="number" 
                                                            value={vitals[item.key as keyof typeof vitals]}
                                                            onChange={(e) => handleVitalChange(item.key, e.target.value)}
                                                            className="w-16 p-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
                                                        />
                                                    ) : (
                                                        <span className="text-lg font-medium text-slate-700 dark:text-slate-200">
                                                            {vitals[item.key as keyof typeof vitals]}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-500">{item.unit}</span>
                                                </div>
                                            </div>
                                        ) : (
                                             <div key={item.label} className="flex flex-col col-span-2 md:col-span-1">
                                                <span className={`text-xs font-bold uppercase ${item.color}`}>{item.label}</span>
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    {isEditingVitals ? (
                                                        <div className="flex items-center gap-1">
                                                            <input type="number" value={vitals.bpSys} onChange={(e) => handleVitalChange('bpSys', e.target.value)} className="w-12 p-1 text-sm border rounded"/>
                                                            <span>/</span>
                                                            <input type="number" value={vitals.bpDia} onChange={(e) => handleVitalChange('bpDia', e.target.value)} className="w-12 p-1 text-sm border rounded"/>
                                                        </div>
                                                    ) : (
                                                        <span className="text-lg font-medium text-slate-700 dark:text-slate-200">
                                                            {vitals.bpSys}/{vitals.bpDia}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-500">{item.unit}</span>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* CHARTS & DIAGNOSIS SECTION */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                             {/* Left: Charts */}
                            <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Blood Pressure Chart</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={[{ name: 'Current', Systolic: vitals.bpSys, Diastolic: vitals.bpDia }]}
                                            barSize={20}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 200]} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{fill: 'transparent'}} />
                                            <Legend />
                                            <Bar dataKey="Systolic" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Diastolic" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                
                {activeTab !== 'examine' && (
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