import React, { useState, useEffect } from 'react';
import { RefreshIcon } from '../../../../components/Icons';
import { FormDateInput } from '../../../../components/ui/forms';
import { CatalogItem } from '../../../../services/catalogService';

interface HisSeedingFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSeed: (filters: { startDate?: string; endDate?: string; workplaceId?: string }) => void;
    isSeeding: boolean;
    workplaces: CatalogItem[];
    fontSettings: any;
}

const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const HisSeedingFilterModal: React.FC<HisSeedingFilterModalProps> = ({ 
    isOpen, 
    onClose, 
    onSeed, 
    isSeeding, 
    workplaces, 
    fontSettings 
}) => {
    const [seedStartDate, setSeedStartDate] = useState(getLocalDateString());
    const [seedEndDate, setSeedEndDate] = useState(getLocalDateString());
    const [seedWorkplaceId, setSeedWorkplaceId] = useState('');

    useEffect(() => {
        if (isOpen) {
            const todayStr = getLocalDateString();
            setSeedStartDate(todayStr);
            setSeedEndDate(todayStr);
            setSeedWorkplaceId('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md flex flex-col border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 rounded-t-xl">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 font-sans">
                            <RefreshIcon className="w-5 h-5 text-emerald-600"/> Đồng bộ dữ liệu khám từ HIS
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-sans">Chọn điều kiện lọc để đồng bộ danh sách khám</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition text-lg font-bold"
                    >
                        ✕
                    </button>
                </div>
                {/* Modal Body */}
                <div className="p-6 space-y-4">
                    {/* Date filters */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 font-sans">Thời gian khám (Từ ngày)</label>
                        <FormDateInput
                            label=""
                            value={seedStartDate}
                            onChange={(e: any) => setSeedStartDate(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="w-full !p-2.5 !h-auto border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 font-sans">Thời gian khám (Đến ngày)</label>
                        <FormDateInput
                            label=""
                            value={seedEndDate}
                            onChange={(e: any) => setSeedEndDate(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="w-full !p-2.5 !h-auto border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                        />
                    </div>

                    {/* Workplace filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 font-sans">Nơi làm việc / Công ty</label>
                        <select
                            value={seedWorkplaceId}
                            onChange={e => setSeedWorkplaceId(e.target.value)}
                            className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer ${fontSettings.controls}`}
                        >
                            <option value="">-- Tất cả công ty --</option>
                            {workplaces.map(w => (
                                <option key={w.id} value={w.code}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-b-xl border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg font-bold text-xs transition font-sans"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        disabled={isSeeding}
                        onClick={() => {
                            onSeed({
                                startDate: seedStartDate,
                                endDate: seedEndDate,
                                workplaceId: seedWorkplaceId
                            });
                        }}
                        className="px-5 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50 font-sans active:scale-95 cursor-pointer"
                    >
                        {isSeeding && <RefreshIcon className="w-3.5 h-3.5 animate-spin"/>}
                        Đồng bộ ngay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HisSeedingFilterModal;
