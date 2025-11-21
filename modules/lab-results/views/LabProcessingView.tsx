
import React, { useState, useMemo } from 'react';
import { 
    SearchIcon, 
    DesktopComputerIcon, 
    CheckBadgeIcon, 
    PrinterIcon, 
    ExclamationCircleIcon,
    MicroscopeIcon
} from '../../../components/Icons';

interface TestResult {
    id: string;
    name: string;
    result: string;
    unit: string;
    refRange: string;
    flag: 'normal' | 'high' | 'low';
}

const mockPatients = [
    { id: 'P01', name: 'Nguyễn Văn An', sid: '231030001', age: 35, gender: 'Nam', status: 'processing' },
    { id: 'P02', name: 'Trần Văn X', sid: '231030003', age: 48, gender: 'Nam', status: 'processing' },
];

const LabProcessingView: React.FC = () => {
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
    const [results, setResults] = useState<TestResult[]>([
        { id: 'T01', name: 'RBC', result: '', unit: 'T/L', refRange: '3.8 - 5.3', flag: 'normal' },
        { id: 'T02', name: 'HGB', result: '', unit: 'g/L', refRange: '120 - 160', flag: 'normal' },
        { id: 'T03', name: 'HCT', result: '', unit: 'L/L', refRange: '0.35 - 0.47', flag: 'normal' },
        { id: 'T04', name: 'WBC', result: '', unit: 'G/L', refRange: '4.0 - 10.0', flag: 'normal' },
        { id: 'T05', name: 'PLT', result: '', unit: 'G/L', refRange: '150 - 450', flag: 'normal' },
    ]);
    const [isMachineRunning, setIsMachineRunning] = useState(false);

    const handleRunMachine = () => {
        setIsMachineRunning(true);
        setTimeout(() => {
            const newResults = results.map(r => {
                let val = 0;
                let flag: 'normal' | 'high' | 'low' = 'normal';
                
                if (r.name === 'RBC') val = 4 + Math.random() * 2;
                if (r.name === 'HGB') val = 110 + Math.random() * 60;
                if (r.name === 'WBC') val = 3 + Math.random() * 10;
                
                // Simple Logic Check
                if (r.name === 'WBC' && val > 10) flag = 'high';
                if (r.name === 'HGB' && val < 120) flag = 'low';

                return { ...r, result: val.toFixed(2), flag };
            });
            setResults(newResults);
            setIsMachineRunning(false);
        }, 1500);
    };

    const handleResultChange = (id: string, val: string) => {
        setResults(results.map(r => r.id === id ? { ...r, result: val } : r));
    };

    return (
        <div className="flex h-full gap-4 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
            {/* Left: List of Samples */}
            <div className="w-1/3 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="font-bold text-lg mb-2">Danh sách mẫu (SID)</h2>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input type="text" placeholder="Quét Barcode / Nhập SID..." className="w-full pl-9 p-2 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600 text-sm"/>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {mockPatients.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => { setSelectedPatient(p.id); setResults(results.map(r => ({...r, result: '', flag: 'normal'}))); }}
                            className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700 transition ${selectedPatient === p.id ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-600' : ''}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{p.sid}</span>
                                <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded">Processing</span>
                            </div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.gender} - {p.age} tuổi</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Result Entry */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-800">
                {selectedPatient ? (
                    <>
                        {/* Toolbar */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Nhập kết quả xét nghiệm</h2>
                                <p className="text-sm text-slate-500">SID: 231030001 - Nguyễn Văn An</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleRunMachine}
                                    disabled={isMachineRunning}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow flex items-center gap-2 disabled:opacity-70"
                                >
                                    {isMachineRunning ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <DesktopComputerIcon className="w-5 h-5"/>}
                                    Lấy KQ từ máy
                                </button>
                                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold shadow flex items-center gap-2">
                                    <CheckBadgeIcon className="w-5 h-5"/> Duyệt & Trả
                                </button>
                                <button className="px-4 py-2 border border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700 rounded font-medium flex items-center gap-2">
                                    <PrinterIcon className="w-5 h-5"/> In
                                </button>
                            </div>
                        </div>

                        {/* Result Table */}
                        <div className="p-6 flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-sm text-slate-500">
                                        <th className="py-2">Tên xét nghiệm</th>
                                        <th className="py-2 w-32 text-center">Kết quả</th>
                                        <th className="py-2 w-20">Đơn vị</th>
                                        <th className="py-2 w-32">CS Bình thường</th>
                                        <th className="py-2 w-20 text-center">Cờ (Flag)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map(item => (
                                        <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                            <td className="py-3 font-medium">{item.name}</td>
                                            <td className="py-3 text-center">
                                                <input 
                                                    type="text" 
                                                    value={item.result} 
                                                    onChange={(e) => handleResultChange(item.id, e.target.value)}
                                                    className={`w-full p-1 text-center border rounded font-bold ${
                                                        item.flag === 'high' ? 'text-red-600 border-red-300 bg-red-50' : 
                                                        item.flag === 'low' ? 'text-blue-600 border-blue-300 bg-blue-50' : 
                                                        'border-slate-300 dark:bg-slate-800 dark:border-slate-600'
                                                    }`}
                                                />
                                            </td>
                                            <td className="py-3 text-slate-500">{item.unit}</td>
                                            <td className="py-3 text-slate-500">{item.refRange}</td>
                                            <td className="py-3 text-center">
                                                {item.flag === 'high' && <span className="text-red-600 font-bold flex items-center justify-center gap-1"><ExclamationCircleIcon className="w-4 h-4"/> H</span>}
                                                {item.flag === 'low' && <span className="text-blue-600 font-bold flex items-center justify-center gap-1"><ExclamationCircleIcon className="w-4 h-4"/> L</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <MicroscopeIcon className="w-20 h-20 mb-4 opacity-20"/>
                        <p className="text-lg">Chọn mẫu bệnh phẩm để nhập kết quả</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabProcessingView;
