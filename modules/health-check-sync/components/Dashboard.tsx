// ==================== DASHBOARD COMPONENT ====================
// File: modules/health-check-sync/components/Dashboard.tsx

import React from 'react';
import { 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    PaperAirplaneIcon, 
    SignatureIcon,
    ChartBarIcon
} from '../../../components/Icons';

interface DashboardProps {
    documents: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ documents }) => {
    
    // Compute statistics from Master-Detail JSONB records
    const total = documents.length;
    const unsigned = documents.filter(d => d.signature_status === 'Unsigned').length;
    const signed = documents.filter(d => d.signature_status === 'Signed').length;
    const synced = documents.filter(d => d.send_status === 'Success').length;
    const errors = documents.filter(d => d.send_status === 'Error').length;
    const unsent = documents.filter(d => d.send_status === 'Unsent').length;

    const errorList = documents.filter(d => d.send_status === 'Error' && d.error_message);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Tổng số hồ sơ KSK</h3>
                        <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{total}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Đã lưu trong database</p>
                    </div>
                    <div className="p-3 rounded-full bg-[#0f766e] shadow-sm text-white">
                        <PaperAirplaneIcon className="w-5 h-5"/>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Chưa ký số</h3>
                        <p className="text-3xl font-extrabold text-orange-500 mt-1">{unsigned}</p>
                        <p className="text-[10px] text-orange-400 mt-1">Cần cắm USB Token / HSM</p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-500 shadow-sm text-white">
                        <SignatureIcon className="w-5 h-5"/>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Đã đồng bộ VNeID</h3>
                        <p className="text-3xl font-extrabold text-green-500 mt-1">{synced}</p>
                        <p className="text-[10px] text-green-400 mt-1">Tỷ lệ liên thông: {total > 0 ? ((synced/total)*100).toFixed(1) : 0}%</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-500 shadow-sm text-white">
                        <CheckCircleIcon className="w-5 h-5"/>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Gửi cổng lỗi</h3>
                        <p className="text-3xl font-extrabold text-red-500 mt-1">{errors}</p>
                        <p className="text-[10px] text-red-400 mt-1">Cần rà soát và gửi lại</p>
                    </div>
                    <div className="p-3 rounded-full bg-red-500 shadow-sm text-white">
                        <ExclamationCircleIcon className="w-5 h-5"/>
                    </div>
                </div>
            </div>

            {/* Graphs & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Simulated Chart Container */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 lg:col-span-2 flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-[#0f766e]"/> Biểu đồ đồng bộ VNeID theo 17 Mẫu biểu KSK
                    </h3>
                    <div className="flex-1 min-h-[240px] bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 flex flex-col justify-end p-4">
                        {/* Mock Bar Chart */}
                        <div className="flex items-end justify-between h-48 w-full px-4">
                            {Array.from({ length: 17 }, (_, i) => {
                                const count = documents.filter(d => d.form_type === (i+1).toString()).length;
                                const isSelected = count > 0;
                                const heightPercent = isSelected ? Math.min(100, (count / Math.max(1, documents.length)) * 250) : 5;
                                return (
                                    <div key={i+1} className="flex flex-col items-center flex-1 group">
                                        <div className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{count}</div>
                                        <div 
                                            style={{ height: `${heightPercent}px` }} 
                                            className={`w-4 rounded-t transition-all ${isSelected ? 'bg-[#0f766e] group-hover:bg-[#0d645c]' : 'bg-slate-200 dark:bg-slate-800'}`}
                                        ></div>
                                        <span className="text-[9px] text-slate-400 mt-2 font-mono">M{i+1}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Error Log Console */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-500"/> Nhật ký lỗi đồng bộ chi tiết
                    </h3>
                    
                    <div className="flex-1 overflow-auto max-h-[250px] space-y-3 custom-scrollbar pr-1">
                        {errorList.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                                Không có lỗi đồng bộ nào được ghi nhận.
                            </div>
                        ) : (
                            errorList.map((doc, idx) => (
                                <div key={doc.id || idx} className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg text-xs leading-relaxed">
                                    <div className="flex justify-between items-center font-bold text-red-800 dark:text-red-400 mb-1">
                                        <span>HS KSK: {doc.doc_no}</span>
                                        <span className="font-mono">ID: {doc.id}</span>
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-400 font-bold">{doc.patient_name} (Mẫu {doc.form_type})</div>
                                    <div className="text-red-600 dark:text-red-500 font-mono mt-1 mt-0.5 border-t border-red-200/40 pt-1">
                                        Error: {doc.error_message}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
