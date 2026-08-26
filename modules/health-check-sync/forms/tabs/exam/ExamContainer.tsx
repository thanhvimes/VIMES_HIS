import React, { useState } from 'react';
import PhysicalExamTab from './PhysicalExamTab';
import InternalMedTab from './InternalMedTab';
import SurgeryTab from './SurgeryTab';
import DermatologyTab from './DermatologyTab';
import EyeExamTab from './EyeExamTab';
import EntExamTab from './EntExamTab';
import DentalExamTab from './DentalExamTab';
import GynecologyTab from './GynecologyTab';
import { useDynamicFormContext } from '../../DynamicFormContext';
import { toast } from 'sonner';
import { 
    Activity, 
    Stethoscope, 
    ShieldAlert, 
    Sparkles, 
    Eye, 
    Volume2, 
    Smile, 
    Heart,
    CheckCircle2,
    CircleDot
} from 'lucide-react';

const ExamContainer: React.FC = () => {
    const { formType, specialtyMetadata } = useDynamicFormContext();
    const showPhysical = formType !== '2';
    const [activeSubTab, setActiveSubTab] = useState(showPhysical ? 'physical' : 'internal');

    const tabs = [
        ...(showPhysical ? [{ id: 'physical', label: 'Thể lực', icon: Activity }] : []),
        { id: 'internal', label: 'Nội khoa', icon: Stethoscope },
        { id: 'surgery', label: 'Ngoại khoa', icon: ShieldAlert },
        { id: 'dermatology', label: 'Da liễu', icon: Sparkles },
        { id: 'eye', label: 'Mắt', icon: Eye },
        { id: 'ent', label: 'Tai Mũi Họng', icon: Volume2 },
        { id: 'dental', label: 'Răng Hàm Mặt', icon: Smile },
        { id: 'gynecology', label: 'Sản phụ khoa', icon: Heart },
    ];

    const handleTabClick = (tabId: string) => {
        if (tabId === activeSubTab) return;
        const currentMeta = specialtyMetadata?.[activeSubTab];
        if (currentMeta?.status === 'ĐANG_KHÁM') {
            const currentTabLabel = tabs.find(t => t.id === activeSubTab)?.label || activeSubTab;
            toast.warning(`Chuyên khoa "${currentTabLabel}" chưa được Duyệt. Vui lòng nhấn "Duyệt" trước khi chuyển sang chuyên khoa khác!`);
            return;
        }
        setActiveSubTab(tabId);
    };

    const renderContent = () => {
        switch (activeSubTab) {
            case 'physical': return <PhysicalExamTab />;
            case 'internal': return <InternalMedTab />;
            case 'surgery': return <SurgeryTab />;
            case 'dermatology': return <DermatologyTab />;
            case 'eye': return <EyeExamTab />;
            case 'ent': return <EntExamTab />;
            case 'dental': return <DentalExamTab />;
            case 'gynecology': return <GynecologyTab />;
            default: return <PhysicalExamTab />;
        }
    };

    return (
        <div className="flex h-full min-h-[600px] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            {/* Sidebar Sub-tabs */}
            <div className="w-64 bg-slate-50/80 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col">
                <div className="p-3.5 font-bold text-slate-700 dark:text-slate-200 uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span>Chuyên khoa khám</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
                        {tabs.length} khoa
                    </span>
                </div>
                <div className="p-2 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
                    {tabs.map(tab => {
                        const meta = specialtyMetadata?.[tab.id];
                        const isApproved = meta?.status === 'ĐÃ_DUYỆT' || meta?.status === 'ĐÃ_KHÁM';
                        const isExamining = meta?.status === 'ĐANG_KHÁM';
                        const isActive = activeSubTab === tab.id;
                        const IconComp = tab.icon;

                        return (
                            <button
                                type="button"
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer border ${
                                    isActive
                                        ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white shadow-sm border-teal-800'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/80 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 truncate pr-2">
                                    <IconComp className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-200' : 'text-slate-500 dark:text-slate-400'}`} />
                                    <span className="truncate">{tab.label}</span>
                                </div>
                                {isApproved ? (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1 ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                    }`}>
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        Đã khám
                                    </span>
                                ) : isExamining ? (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1 ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 animate-pulse'
                                    }`}>
                                        <CircleDot className="w-2.5 h-2.5" />
                                        Đang khám
                                    </span>
                                ) : (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                                        isActive ? 'bg-white/10 text-teal-100' : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        Chưa khám
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default ExamContainer;
