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
    const [activeSubTab, setActiveSubTab] = useState('physical');
    const { formType, specialtyMetadata } = useDynamicFormContext();

    const tabs = [
        { id: 'physical', label: 'Thể lực' },
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
                    {tabs.map(tab => (
                        <button
                            type="button"
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                activeSubTab === tab.id
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
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
