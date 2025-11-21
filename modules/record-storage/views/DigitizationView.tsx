
import React, { useState } from 'react';
import { ScannerIcon, DocumentTextIcon, CheckIcon, ArrowUpTrayIcon } from '../../../components/Icons';

const DigitizationView: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);

    const handleScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            alert("Scan hoàn tất (Mô phỏng)");
        }, 2000);
    };

    return (
        <div className="space-y-6 h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Số hóa Hồ sơ bệnh án</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Scan tài liệu giấy và lưu trữ dưới dạng PDF có thể tìm kiếm.</p>
            </div>

            <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-6">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isScanning ? 'bg-blue-100 animate-pulse shadow-[0_0_0_20px_rgba(59,130,246,0.1)]' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    <ScannerIcon className={`w-16 h-16 ${isScanning ? 'text-blue-600' : 'text-slate-400'}`}/>
                </div>

                {isScanning ? (
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-blue-600">Đang quét tài liệu...</h3>
                        <p className="text-sm text-slate-500">Vui lòng không ngắt kết nối máy scan.</p>
                    </div>
                ) : (
                    <div className="flex flex-col w-full gap-3">
                        <button onClick={handleScan} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2 transition">
                            <ScannerIcon className="w-5 h-5"/> Bắt đầu Scan
                        </button>
                        <button className="w-full py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center gap-2 transition">
                            <ArrowUpTrayIcon className="w-5 h-5"/> Tải lên file PDF có sẵn
                        </button>
                    </div>
                )}
            </div>

            <div className="w-full">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Tài liệu vừa số hóa</h3>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <DocumentTextIcon className="w-8 h-8 text-red-500"/>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">HS_21024061.pdf</p>
                                <p className="text-xs text-slate-500">3.5 MB - Vừa xong</p>
                            </div>
                        </div>
                        <span className="text-green-500"><CheckIcon className="w-5 h-5"/></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DigitizationView;
