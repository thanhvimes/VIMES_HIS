
import React from 'react';
import { 
    XIcon, 
    RefreshIcon, 
    CheckIcon, 
    CalendarDaysIcon, 
    TvIcon, 
    ChartBarIcon,
    CurrencyDollarIcon,
    CpuChipIcon,
    HeartIcon,      
    ScissorsIcon,   
    BeakerIcon,
    EyeIcon,
    StethoscopeIcon // Icon cho Khám bệnh
} from '../../../components/Icons';

interface ConfigPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentLayout: string;
    onChangeLayout: (layout: string) => void;
    currentRange: string;
    onChangeRange: (range: string) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
    isOpen, 
    onClose, 
    currentLayout, 
    onChangeLayout,
    currentRange,
    onChangeRange
}) => {
    
    // Danh sách các mẫu báo cáo (Layouts)
    const layouts = [
        { 
            id: 'general', 
            name: 'Tổng quan Bệnh viện', 
            desc: 'Lưu lượng, KPI chung, Cảnh báo', 
            icon: <ChartBarIcon className="w-5 h-5"/> 
        },
        { 
            id: 'outpatient', 
            name: 'Hoạt động Khám bệnh', 
            desc: 'Khoa khám & Khám yêu cầu', 
            icon: <StethoscopeIcon className="w-5 h-5"/> 
        },
        { 
            id: 'clinical', 
            name: 'Cấp cứu & Hồi sức (ICU)', 
            desc: 'Tình trạng Code Blue, Thở máy', 
            icon: <TvIcon className="w-5 h-5"/> 
        },
        { 
            id: 'internal', 
            name: 'Hoạt động Khối Nội', 
            desc: 'Công suất giường, Luân chuyển bệnh', 
            icon: <HeartIcon className="w-5 h-5"/> 
        },
        { 
            id: 'surgical', 
            name: 'Hoạt động Khối Ngoại', 
            desc: 'Lịch mổ, Hậu phẫu, Hồi tỉnh', 
            icon: <ScissorsIcon className="w-5 h-5"/> 
        },
        { 
            id: 'paraclinical', 
            name: 'Khối Cận Lâm Sàng', 
            desc: 'Xét nghiệm, CĐHA, TDCN (TAT)', 
            icon: <EyeIcon className="w-5 h-5"/> 
        },
        { 
            id: 'oncology', 
            name: 'Hoạt động Khối Xạ/Ung bướu', 
            desc: 'Máy xạ trị, Ghế hóa chất', 
            icon: <BeakerIcon className="w-5 h-5"/> 
        },
        { 
            id: 'finance', 
            name: 'Tài chính & Doanh thu', 
            desc: 'Dòng tiền, Tỷ lệ BHYT/DV', 
            icon: <CurrencyDollarIcon className="w-5 h-5"/> 
        },
        { 
            id: 'resource', 
            name: 'Tài nguyên & Thiết bị', 
            desc: 'Trạng thái máy móc, Bảo trì', 
            icon: <CpuChipIcon className="w-5 h-5"/> 
        },
    ];

    // Danh sách mốc thời gian
    const ranges = [
        { id: 'today', name: 'Hôm nay' },
        { id: 'yesterday', name: 'Hôm qua' },
        { id: 'week', name: 'Tuần này' },
        { id: 'month', name: 'Tháng này' },
    ];

    return (
        <>
            {/* Backdrop làm mờ */}
            <div 
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Panel chính */}
            <div className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-2xl transform transition-transform duration-300 z-[120] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* Header của Panel */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                    <h2 className="font-bold text-lg text-slate-800 dark:text-white uppercase flex items-center gap-2">
                        <RefreshIcon className="w-5 h-5 text-blue-600"/> Thiết lập View
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6 text-slate-500"/>
                    </button>
                </div>

                <div className="p-4 space-y-8 overflow-y-auto h-full pb-20 custom-scrollbar">
                    
                    {/* Section 1: Chọn Mẫu giao diện */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Chọn Góc nhìn Quản trị</h3>
                        <div className="space-y-3">
                            {layouts.map(layout => (
                                <button
                                    key={layout.id}
                                    onClick={() => { onChangeLayout(layout.id); }}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-start gap-3 relative ${
                                        currentLayout === layout.id 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'border-transparent bg-slate-100 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <div className={`p-2 rounded-lg ${currentLayout === layout.id ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-500'}`}>
                                        {layout.icon}
                                    </div>
                                    <div>
                                        <div className={`font-bold text-sm ${currentLayout === layout.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {layout.name}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                            {layout.desc}
                                        </div>
                                    </div>
                                    {currentLayout === layout.id && (
                                        <div className="absolute top-2 right-2 text-blue-500">
                                            <CheckIcon className="w-5 h-5"/>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Chọn Mốc thời gian */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider flex items-center gap-2">
                             <CalendarDaysIcon className="w-4 h-4"/> Dữ liệu thời gian
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {ranges.map(range => (
                                <button
                                    key={range.id}
                                    onClick={() => onChangeRange(range.id)}
                                    className={`px-3 py-2 text-sm font-bold rounded-lg border transition-all ${
                                        currentRange === range.id 
                                        ? 'bg-blue-600 text-white border-blue-600' 
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {range.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ConfigPanel;
