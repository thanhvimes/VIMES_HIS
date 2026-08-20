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

const ExamContainer: React.FC = () => {
    const { formType, specialtyMetadata } = useDynamicFormContext();
    const showPhysical = formType !== '2';
    const [activeSubTab, setActiveSubTab] = useState(showPhysical ? 'physical' : 'internal');

    const tabs = [
        ...(showPhysical ? [{ id: 'physical', label: 'Thể lực' }] : []),
        { id: 'internal', label: 'Nội khoa' },
        { id: 'surgery', label: 'Ngoại khoa' },
        { id: 'dermatology', label: 'Da liễu' },
        { id: 'eye', label: 'Mắt' },
        { id: 'ent', label: 'Tai Mũi Họng' },
        { id: 'dental', label: 'Răng Hàm Mặt' },
        { id: 'gynecology', label: 'Sản phụ khoa' },
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
        <div className="flex h-full min-h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* Sidebar Sub-tabs */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0">
                <div className="p-4 font-semibold text-gray-700 uppercase text-xs border-b border-gray-200">
                    Chuyên khoa khám
                </div>
                <div className="p-2 space-y-1">
                    {tabs.map(tab => {
                        const meta = specialtyMetadata?.[tab.id];
                        const isApproved = meta?.status === 'ĐÃ_DUYỆT' || meta?.status === 'ĐÃ_KHÁM';
                        const isExamining = meta?.status === 'ĐANG_KHÁM';

                        return (
                            <button
                                type="button"
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    activeSubTab === tab.id
                                        ? 'bg-[#0f766e] text-white shadow-sm'
                                        : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <span className="truncate pr-2">{tab.label}</span>
                                {isApproved ? (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                                        activeSubTab === tab.id ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                        Đã khám
                                    </span>
                                ) : isExamining ? (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                                        activeSubTab === tab.id ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        Đang khám
                                    </span>
                                ) : (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                                        activeSubTab === tab.id ? 'bg-white/10 text-teal-100' : 'bg-slate-200 text-slate-600'
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
