
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CheckBadgeIcon, ExclamationCircleIcon } from '../../../components/Icons';

// Enhanced QC Data
const qcData = [
    { run: 1, value: 99.5, date: '01/11' }, { run: 2, value: 100.2, date: '02/11' }, 
    { run: 3, value: 101.5, date: '03/11' }, { run: 4, value: 98.8, date: '04/11' }, 
    { run: 5, value: 103.0, date: '05/11' }, { run: 6, value: 100.0, date: '06/11' }, 
    { run: 7, value: 97.5, date: '07/11' }, { run: 8, value: 99.0, date: '08/11' },
    { run: 9, value: 101.2, date: '09/11' }, { run: 10, value: 102.5, date: '10/11' },
    { run: 11, value: 104.5, date: '11/11' }, // Warning
    { run: 12, value: 100.8, date: '12/11' },
];

const LabQCView: React.FC = () => {
    const mean = 100;
    const sd = 2; // Standard Deviation

    // Westgard Rules Check (Simplified)
    const checkRules = (val: number) => {
        if (val > mean + 3*sd || val < mean - 3*sd) return { status: 'Error', rule: '1-3s' };
        if (val > mean + 2*sd || val < mean - 2*sd) return { status: 'Warning', rule: '1-2s' };
        return { status: 'OK', rule: '' };
    };

    const currentStatus = checkRules(qcData[qcData.length - 1].value);

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kiểm chuẩn chất lượng (Internal QC)</h1>
                    <p className="text-slate-500 text-sm">Giám sát độ tin cậy của kết quả xét nghiệm.</p>
                </div>
                <div className="flex gap-2">
                    <select className="p-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 text-sm shadow-sm">
                        <option>Sysmex XN-1000</option>
                        <option>Cobas 6000</option>
                    </select>
                    <select className="p-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 text-sm shadow-sm">
                        <option>WBC - Level 1 (Normal)</option>
                        <option>WBC - Level 2 (High)</option>
                        <option>RBC - Level 1</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Chart Area */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">Biểu đồ Levey-Jennings</h2>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 border ${
                            currentStatus.status === 'OK' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                            {currentStatus.status === 'OK' ? <CheckBadgeIcon className="w-4 h-4"/> : <ExclamationCircleIcon className="w-4 h-4"/>}
                            Status: {currentStatus.status} {currentStatus.rule ? `(${currentStatus.rule})` : ''}
                        </div>
                    </div>
                    
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={qcData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                                <XAxis dataKey="date" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false}/>
                                <YAxis domain={[mean - 4*sd, mean + 4*sd]} tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false}/>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    labelStyle={{ color: '#64748b' }}
                                />
                                {/* Reference Lines */}
                                <ReferenceLine y={mean} stroke="#22c55e" strokeWidth={2} label={{ value: 'Mean', fill: '#22c55e', fontSize: 10, position: 'right' }} />
                                <ReferenceLine y={mean + 2*sd} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '+2SD', fill: '#f59e0b', fontSize: 10 }} />
                                <ReferenceLine y={mean - 2*sd} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '-2SD', fill: '#f59e0b', fontSize: 10 }} />
                                <ReferenceLine y={mean + 3*sd} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '+3SD', fill: '#ef4444', fontSize: 10 }} />
                                <ReferenceLine y={mean - 3*sd} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '-3SD', fill: '#ef4444', fontSize: 10 }} />
                                
                                <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Input & Info Area */}
                <div className="space-y-6 flex flex-col">
                    {/* Quick Input */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-bold mb-4 text-slate-700 dark:text-slate-200">Nhập kết quả QC</h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-400">Ngày chạy</label>
                                <input type="date" className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-sm" defaultValue={new Date().toISOString().slice(0, 10)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-400">Lot No.</label>
                                    <input type="text" className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-sm bg-slate-50" value="QC-2311-A" readOnly />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-400">Hạn dùng</label>
                                    <input type="text" className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-sm bg-slate-50" value="31/12/2023" readOnly />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-blue-600 dark:text-blue-400">Kết quả đo được</label>
                                <div className="relative">
                                    <input type="number" className="w-full p-2.5 border border-blue-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 text-lg font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                                    <span className="absolute right-3 top-3 text-slate-400 text-sm">10^9/L</span>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition transform active:scale-95">
                                    Lưu & Phân tích
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Stats */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex-1">
                        <h3 className="text-sm font-bold uppercase text-slate-500 mb-3">Thống kê (Tháng 11)</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Mean (Target):</span>
                                <span className="font-mono font-bold">100.0</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">SD (Target):</span>
                                <span className="font-mono font-bold">2.0</span>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Mean (Calc):</span>
                                <span className="font-mono font-bold text-blue-600">100.4</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">CV%:</span>
                                <span className="font-mono font-bold text-green-600">1.8%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabQCView;
