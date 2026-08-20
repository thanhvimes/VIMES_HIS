import React from 'react';
import { VitalSignRecord } from '../types';
import { Activity, Heart, Thermometer, Wind, Droplets } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface EMRVitalSignsWidgetProps {
  vitalSigns: VitalSignRecord[];
}

export const EMRVitalSignsWidget: React.FC<EMRVitalSignsWidgetProps> = ({ vitalSigns }) => {
  if (!vitalSigns || vitalSigns.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
        Chưa có dữ liệu theo dõi sinh hiệu trong đợt điều trị này.
      </div>
    );
  }

  const latest = vitalSigns[vitalSigns.length - 1];

  // Format data for chart
  const chartData = vitalSigns.map(vs => ({
    time: vs.timestamp.substring(5, 16), // "08-12 09:00"
    pulse: vs.pulse,
    bpSystolic: vs.bloodPressureSystolic,
    bpDiastolic: vs.bloodPressureDiastolic,
    temp: vs.temperature,
    spo2: vs.spo2,
  }));

  return (
    <div className="space-y-4">
      {/* Latest Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-lg">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
            <span className="text-[11px] font-medium">Mạch</span>
            <Heart className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-rose-700 dark:text-rose-300">{latest.pulse}</span>
            <span className="text-[10px] text-slate-500">l/p</span>
          </div>
        </div>

        <div className="p-2.5 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 rounded-lg">
          <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 mb-1">
            <span className="text-[11px] font-medium">Huyết áp</span>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-sky-700 dark:text-sky-300">
              {latest.bloodPressureSystolic}/{latest.bloodPressureDiastolic}
            </span>
            <span className="text-[10px] text-slate-500">mmHg</span>
          </div>
        </div>

        <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-lg">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-medium">Nhiệt độ</span>
            <Thermometer className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{latest.temperature}</span>
            <span className="text-[10px] text-slate-500">°C</span>
          </div>
        </div>

        <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-lg">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-medium">SpO2 / Thở</span>
            <Droplets className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{latest.spo2}%</span>
            <span className="text-[10px] text-slate-500">({latest.respiratoryRate} l/p)</span>
          </div>
        </div>
      </div>

      {/* Biểu đồ diễn biến Mạch & Huyết áp */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
        <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Biểu đồ Diễn biến Mạch & Huyết áp
        </h5>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis domain={[40, 180]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '11px' 
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              <Line type="monotone" dataKey="bpSystolic" name="HA Tâm thu" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="bpDiastolic" name="HA Tâm trương" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="pulse" name="Mạch (l/p)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
