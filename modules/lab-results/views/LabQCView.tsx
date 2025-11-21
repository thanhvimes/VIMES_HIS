
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const qcData = [
    { run: 1, value: 98 }, { run: 2, value: 102 }, { run: 3, value: 101 }, { run: 4, value: 99 }, 
    { run: 5, value: 103 }, { run: 6, value: 105 }, { run: 7, value: 97 }, { run: 8, value: 100 },
    { run: 9, value: 101 }, { run: 10, value: 102 },
];

const LabQCView: React.FC = () => {
    const mean = 100;
    const sd = 2;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kiểm chuẩn chất lượng (Internal QC)</h1>
                <div className="flex gap-2">
                    <select className="p-2 border rounded bg-white dark:bg-slate-700">
                        <option>Sysmex XN-1000</option>
                        <option>Cobas 6000</option>
                    </select>
                    <select className="p-2 border rounded bg-white dark:bg-slate-700">
                        <option>WBC - Level 1</option>
                        <option>RBC - Level 1</option>
                        <option>PLT - Level 1</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold mb-4 text-center">Biểu đồ Levey-Jennings: WBC (Level 1)</h2>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={qcData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="run" label={{ value: 'Lần chạy', position: 'insideBottom', offset: -5 }} />
                                <YAxis domain={[mean - 4*sd, mean + 4*sd]} />
                                <Tooltip />
                                <ReferenceLine y={mean} stroke="green" label="Mean" />
                                <ReferenceLine y={mean + 2*sd} stroke="orange" strokeDasharray="3 3" label="+2SD" />
                                <ReferenceLine y={mean - 2*sd} stroke="orange" strokeDasharray="3 3" label="-2SD" />
                                <ReferenceLine y={mean + 3*sd} stroke="red" strokeDasharray="3 3" label="+3SD" />
                                <ReferenceLine y={mean - 3*sd} stroke="red" strokeDasharray="3 3" label="-3SD" />
                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold mb-4">Nhập liệu QC mới</h2>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Ngày chạy</label>
                            <input type="date" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Lô QC (Lot)</label>
                            <input type="text" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" value="LOT-2023-A" readOnly />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Kết quả</label>
                            <input type="number" className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" placeholder="Nhập giá trị..." />
                        </div>
                        <div className="pt-2">
                            <button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow">Lưu kết quả</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LabQCView;
