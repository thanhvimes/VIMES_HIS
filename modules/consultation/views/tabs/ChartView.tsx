
import React, { useState } from 'react';
import { 
    PencilIcon,
    CheckIcon
} from '../../../../components/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartViewProps {
    initialVitals: any;
    patientRecord: any;
}

const ChartView: React.FC<ChartViewProps> = ({ initialVitals, patientRecord }) => {
    const [vitals, setVitals] = useState(initialVitals);
    const [isEditingVitals, setIsEditingVitals] = useState(false);

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
                                                className="w-16 p-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:border-slate-600"
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
                                                <input type="number" value={vitals.bpSys} onChange={(e) => handleVitalChange('bpSys', e.target.value)} className="w-12 p-1 text-sm border rounded dark:bg-slate-700 dark:border-slate-600"/>
                                                <span>/</span>
                                                <input type="number" value={vitals.bpDia} onChange={(e) => handleVitalChange('bpDia', e.target.value)} className="w-12 p-1 text-sm border rounded dark:bg-slate-700 dark:border-slate-600"/>
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
                                data={chartData}
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
        </div>
    );
};

export default ChartView;
