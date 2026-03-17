import React from 'react';
import { ClockIcon, DocumentTextIcon } from '../../../components/Icons';
import { ExtendedFormData } from '../utils/registrationUtils';

interface HistorySectionProps {
    formData: ExtendedFormData;
    onSelect?: (docNo: string) => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({ formData, onSelect }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col flex-1 min-h-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                    <ClockIcon className="w-5 h-5 text-slate-500" /> Tiền sử khám (Lịch sử)
                </h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{formData.history?.length || 0}</span>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto p-0 custom-scrollbar">
                {formData.history && formData.history.length > 0 ? (
                    <table className="w-full text-left text-xs min-w-[900px]">
                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 shadow-sm text-slate-500 z-10">
                            <tr className="uppercase text-[10px] tracking-wider">
                                <th className="p-3 font-bold border-r border-slate-200/50"># Hồ sơ</th>
                                <th className="p-3 font-bold border-r border-slate-200/50">Thời gian</th>
                                <th className="p-3 font-bold border-r border-slate-200/50">Hạng mục</th>
                                <th className="p-3 font-bold border-r border-slate-200/50">Phòng khám</th>
                                <th className="p-3 font-bold border-r border-slate-200/50 text-center">Số phiếu</th>
                                <th className="p-3 font-bold border-r border-slate-200/50">Bác sĩ</th>
                                <th className="p-3 font-bold">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {formData.history.map(h => (
                                <tr 
                                    key={h.id} 
                                    onClick={() => onSelect?.(h.docNo)}
                                    className="hover:bg-blue-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group whitespace-nowrap"
                                >
                                    <td className="p-3 font-mono font-bold text-blue-600">
                                        #{h.docNo}
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">
                                        {h.examDateTime}
                                    </td>
                                    <td className="p-3">
                                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                                            {h.examType}
                                        </span>
                                    </td>
                                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={h.roomName}>
                                        {h.roomName || 'N/A'}
                                    </td>
                                    <td className="p-3 text-center font-black text-slate-900 dark:text-white text-sm bg-slate-50/50">
                                        {h.receptNo || '-'}
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[150px] truncate" title={h.doctor}>
                                        {h.doctor}
                                    </td>
                                    <td className="p-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                            h.status === 'Đã kết thúc' 
                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {h.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 p-6 text-center">
                        <DocumentTextIcon className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-sm">Chưa có lịch sử khám.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistorySection;
