
import React, { useState, useRef } from 'react';
import { 
    PencilIcon,
    CheckIcon,
    UserGroupIcon,
    PhoneIcon,
    CreditCardIcon,
    HomeIcon,
    IdentificationIcon,
    BriefcaseIcon,
    CameraIcon,
    CheckBadgeIcon,
    ExclamationCircleIcon,
    CalendarIcon,
    ActivityIcon,
    StethoscopeIcon
} from '../../../../components/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartViewProps {
    initialVitals: any;
    patientRecord: any;
}

const ChartView: React.FC<ChartViewProps> = ({ initialVitals, patientRecord }) => {
    // Khởi tạo giá trị mặc định để tránh crash khi dữ liệu null
    const defaultVitals = {
        heartRate: 0,
        temp: 0,
        bpSys: 0,
        bpDia: 0,
        respRate: 0,
        spO2: 0,
        weight: 0,
        height: 0,
        bmi: 0
    };

    const [vitals, setVitals] = useState({ ...defaultVitals, ...(initialVitals || {}) });
    const [isEditingVitals, setIsEditingVitals] = useState(false);
    const [patientImage, setPatientImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPatientImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Combine history and current vitals for the chart
    const historyData = patientRecord?.bpHistory 
        ? patientRecord.bpHistory.map((entry: any) => ({
            name: entry.date,
            Systolic: entry.systolic,
            Diastolic: entry.diastolic
          }))
        : [];

    const currentData = { 
        name: 'Current', 
        Systolic: vitals.bpSys, 
        Diastolic: vitals.bpDia 
    };

    const chartData = [...historyData, currentData];

    return (
        <div className="space-y-4">
            {/* --- COMPACT PATIENT HEADER --- */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                    
                    {/* 1. PHOTO (Small & Standard) */}
                    <div className="flex-shrink-0 group relative self-start">
                        <div 
                            className="w-24 h-32 bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 overflow-hidden cursor-pointer flex items-center justify-center"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {patientImage ? (
                                <img src={patientImage} alt="Patient" className="w-full h-full object-cover" />
                            ) : (
                                <UserGroupIcon className="w-10 h-10 text-slate-300" />
                            )}
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded px-1.5 py-0.5 text-[10px] font-bold shadow-sm whitespace-nowrap">
                            {patientRecord.id}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>

                    {/* 2. INFO GRID */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                        {/* Column 1: Identity */}
                        <div className="space-y-2">
                            <div>
                                <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400 uppercase leading-tight">
                                    {patientRecord.name}
                                </h2>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mt-1">
                                    <span className="font-semibold">{patientRecord.gender}</span>
                                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                    <span>{patientRecord.age} Tuổi</span>
                                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                    <span>{patientRecord.dob}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700">
                                <IdentificationIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0"/>
                                <div>
                                    <span className="text-slate-700 dark:text-slate-300 font-bold block">
                                        001088000xxx
                                    </span>
                                    <span className="text-[10px] text-slate-500 block">
                                        Ngày cấp: 15/05/2021
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Contact */}
                        <div className="space-y-2 pt-1 border-t md:border-t-0 border-slate-100 dark:border-slate-700 md:pl-4 md:border-l">
                            <div className="flex items-start gap-2">
                                <PhoneIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0"/>
                                <span className="text-slate-700 dark:text-slate-300">{patientRecord.phone || '---'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <BriefcaseIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0"/>
                                <span className="text-slate-700 dark:text-slate-300 truncate">{patientRecord.occupation || '---'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <HomeIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0"/>
                                <span className="text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
                                    {patientRecord.address}
                                </span>
                            </div>
                        </div>

                        {/* Column 3: Treatment & Insurance */}
                        <div className="pt-1 border-t md:border-t-0 border-slate-100 dark:border-slate-700 md:pl-4 md:border-l flex flex-col h-full">
                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Bảo hiểm</span>
                                    {patientRecord.hasInsurance ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                            <CheckBadgeIcon className="w-3 h-3"/> BHYT (80%)
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Dịch vụ</span>
                                    )}
                                </div>
                                {patientRecord.hasInsurance && (
                                    <div className="text-xs text-slate-600 dark:text-slate-400 truncate" title={patientRecord.insuranceNumber}>
                                        Số thẻ: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{patientRecord.insuranceNumber}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <StethoscopeIcon className="w-3.5 h-3.5 text-slate-400"/>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Thông tin điều trị</span>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">BS Phụ trách:</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">Dr. Minh</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Hướng xử lý:</span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                                            Nhập viện
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* VITAL SIGNS SECTION (Keep Compact) */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wide flex items-center gap-2">
                        <ActivityIcon className="w-4 h-4 text-red-500"/> Chỉ số sinh tồn
                    </h3>
                    <button 
                        onClick={() => setIsEditingVitals(!isEditingVitals)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                        {isEditingVitals ? <CheckIcon className="w-3 h-3"/> : <PencilIcon className="w-3 h-3"/>}
                        {isEditingVitals ? 'Lưu' : 'Sửa'}
                    </button>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {[
                            { label: 'Mạch', key: 'heartRate', unit: 'l/p', color: 'text-slate-900' },
                            { label: 'Nhiệt độ', key: 'temp', unit: '°C', color: 'text-slate-900' },
                            { label: 'Huyết áp', key: 'bpSys', unit: 'mmHg', color: 'text-slate-900', isBP: true },
                            { label: 'Nhịp thở', key: 'respRate', unit: 'l/p', color: 'text-slate-900' },
                            { label: 'SpO2', key: 'spO2', unit: '%', color: 'text-slate-900' },
                            { label: 'Cân nặng', key: 'weight', unit: 'kg', color: 'text-slate-900' },
                            { label: 'Chiều cao', key: 'height', unit: 'cm', color: 'text-slate-900' },
                            { label: 'BMI', key: 'bmi', unit: '', color: 'text-slate-900', readonly: true },
                        ].map((item) => (
                            <div key={item.label} className="flex flex-col items-start border-l pl-3 first:border-l-0 border-slate-100 dark:border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</span>
                                <div className="flex items-baseline gap-1 w-full">
                                    {isEditingVitals && !item.readonly ? (
                                        item.isBP ? (
                                            <div className="flex items-center gap-0.5">
                                                <input className="w-7 p-0 text-sm font-bold bg-transparent border-b border-slate-300 text-center focus:outline-none" defaultValue={vitals.bpSys} onChange={(e) => handleVitalChange('bpSys', e.target.value)} />
                                                <span>/</span>
                                                <input className="w-7 p-0 text-sm font-bold bg-transparent border-b border-slate-300 text-center focus:outline-none" defaultValue={vitals.bpDia} onChange={(e) => handleVitalChange('bpDia', e.target.value)} />
                                            </div>
                                        ) : (
                                            <input 
                                                type="number" 
                                                className="w-full p-0 text-base font-bold bg-transparent border-b border-slate-300 focus:border-blue-500 focus:outline-none"
                                                defaultValue={vitals[item.key as keyof typeof vitals]}
                                                onChange={(e) => handleVitalChange(item.key, e.target.value)}
                                            />
                                        )
                                    ) : (
                                        <span className={`text-lg font-bold ${item.isBP && (vitals.bpSys > 140 || vitals.bpDia > 90) ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
                                            {item.isBP ? `${vitals.bpSys}/${vitals.bpDia}` : vitals[item.key as keyof typeof vitals]}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-slate-400">{item.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-xs uppercase flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4"/> Diễn biến Huyết áp
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 200]} tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}} 
                                    contentStyle={{borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px'}}
                                />
                                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}}/>
                                <Bar dataKey="Systolic" name="Tâm thu" fill="#ef4444" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="Diastolic" name="Tâm trương" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartView;
