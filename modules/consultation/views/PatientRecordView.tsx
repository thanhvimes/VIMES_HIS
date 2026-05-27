
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    PresentationChartLineIcon,
    ClipboardListIcon,
    BeakerIcon,
    ScissorsIcon,
    ArchiveIcon,
    CreditCardIcon,
    FolderIcon,
    ChevronLeftIcon,
    ClockIcon,
    ExclamationCircleIcon,
    UserCircleIcon
} from '../../../components/Icons';
import ChartView from './tabs/ChartView';
import ExamineView from './tabs/ExamineView';
import LabView from './tabs/LabView';
import OperationView from './tabs/OperationView';
import MedicationView from './tabs/MedicationView';
import FeeView from './tabs/FeeView';
import DocumentsView from './tabs/DocumentsView';
import HistorySidebar from './components/HistorySidebar';
import { consultationService } from '../../../services/consultationService';

const tabs = [
    { id: 'chart', label: 'Tổng quan', icon: PresentationChartLineIcon },
    { id: 'examine', label: 'Khám bệnh', icon: ClipboardListIcon },
    { id: 'lab', label: 'Cận lâm sàng', icon: BeakerIcon },
    { id: 'operation', label: 'Thủ thuật', icon: ScissorsIcon },
    { id: 'medication', label: 'Kê đơn', icon: ArchiveIcon },
    { id: 'fee', label: 'Viện phí', icon: CreditCardIcon },
    { id: 'documents', label: 'Hồ sơ EMR', icon: FolderIcon },
];

const PatientRecordView: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [patientData, setPatientData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const activeTab = searchParams.get('tab') || 'chart';

    useEffect(() => {
        const fetchPatientData = async () => {
            if (!patientId) {
                setIsLoading(false);
                return;
            }
            const docNo = searchParams.get('docNo');
            setIsLoading(true);
            try {
                const responseData = await consultationService.getPatientProfile(patientId, docNo || undefined);
                
                // Cực kỳ cẩn thận: Kiểm tra cả data lồng nhau nếu có
                const finalData = responseData?.data || responseData;

                if (finalData && (finalData.name || finalData.patientName)) {
                    setPatientData({
                        ...finalData,
                        name: finalData.name || finalData.patientName // Đồng bộ tên trường
                    });
                } else {
                    console.log("No valid patient data found, switching to mock...");
                    setPatientData({
                        id: patientId,
                        name: "BỆNH NHÂN MẪU (Hệ thống tự tạo)",
                        age: 35,
                        gender: "Nam",
                        address: "Hà Nội",
                        vitalSigns: { bp: '120/80', hr: '80', temp: '36.5', weight: '65', height: '170' },
                        allergies: "Không có",
                        bloodType: "O+"
                    });
                }
            } catch (error) {
                console.error("API Error - Fallback to mock:", error);
                setPatientData({
                    id: patientId,
                    name: "BỆNH NHÂN MẪU (LỖI KẾT NỐI)",
                    age: 40,
                    gender: "Nữ",
                    address: "Hồ Chí Minh",
                    vitalSigns: { bp: '110/70', hr: '75', temp: '37.0', weight: '55', height: '160' },
                    allergies: "Penicillin",
                    bloodType: "A+"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatientData();
    }, [patientId, searchParams]);

    const setActiveTab = (tabId: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', tabId);
        setSearchParams(newParams, { replace: true });
    };

    const activeTabInfo = tabs.find(t => t.id === activeTab);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400">Đang tải hồ sơ bệnh nhân...</p>
                </div>
            </div>
        );
    }

    if (!patientId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-900 text-center p-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <UserCircleIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">Chưa chọn bệnh nhân</h2>
                <p className="text-slate-500 mb-6">Vui lòng chọn một bệnh nhân từ danh sách chờ khám để xem hồ sơ.</p>
                <button 
                    onClick={() => navigate('/consultation/list')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-500/20"
                >
                    Đến danh sách chờ khám
                </button>
            </div>
        );
    }

    if (!patientData) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-900 text-center p-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <ExclamationCircleIcon className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">Không tìm thấy bệnh nhân</h2>
                <p className="text-slate-500 mb-6">Hồ sơ bệnh nhân với ID <span className="font-bold text-slate-800 dark:text-white">{patientId}</span> không tồn tại hoặc đã bị xóa.</p>
                <button 
                    onClick={() => navigate('/consultation/list')}
                    className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-bold"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-hidden flex flex-col bg-slate-100/50 dark:bg-slate-900/40">
            {/* Patient Header - Fixed height to prevent shaking */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 h-[72px] flex items-center sticky top-0 z-40 shadow-sm shrink-0">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/consultation/list')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                            title="Quay lại danh sách"
                        >
                            <ChevronLeftIcon className="w-5 h-5"/>
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-200">
                                {patientData?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold text-slate-800 dark:text-white uppercase leading-none truncate max-w-[200px] lg:max-w-none">
                                        {patientData?.name || 'KHÔNG RÕ TÊN'}
                                    </h1>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 whitespace-nowrap">
                                        {patientData?.gender || 'N/A'} - {patientData?.age || '??'}T
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                                    <span className="font-mono bg-slate-50 dark:bg-slate-900 px-1.5 rounded text-blue-600 dark:text-blue-400 font-bold">{patientData?.id || patientId}</span>
                                    <span className="truncate max-w-[300px]">{patientData?.address || 'Chưa cập nhật địa chỉ'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Critical Info Tags */}
                    <div className="flex items-center gap-4">
                        {patientData?.allergies && (
                            <div className="hidden sm:flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
                                <ExclamationCircleIcon className="w-4 h-4 text-red-600 animate-pulse"/>
                                <div>
                                    <span className="text-[9px] font-bold text-red-500 uppercase block leading-none">Dị ứng</span>
                                    <span className="text-[10px] font-bold text-red-700 dark:text-red-400">{patientData.allergies}</span>
                                </div>
                            </div>
                        )}
                        <div className="hidden lg:block bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                             <span className="text-[9px] font-bold text-blue-500 uppercase block leading-none">Nhóm máu</span>
                             <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">{patientData?.bloodType || 'Chưa XN'}</span>
                        </div>
                        
                        <button 
                            onClick={() => setIsHistoryOpen(true)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 text-slate-500"
                            title="Lịch sử khám"
                        >
                            <ClockIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Tabs Navigation - Fixed height */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 h-[48px] flex items-center sticky top-[72px] z-30 shadow-sm overflow-x-auto no-scrollbar shrink-0">
                <nav className="flex gap-8 h-full">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all duration-200 text-sm font-medium whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-800'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-900/50">
                {/* Dùng cơ chế show/hide thay vì unmount để giữ trạng thái dữ liệu (State) */}
                <div className={activeTab === 'chart' ? 'block' : 'hidden'}>
                    <ChartView initialVitals={patientData?.vitalSigns} patientRecord={patientData} />
                </div>

                <div className={activeTab === 'examine' ? 'block' : 'hidden'}>
                    <ExamineView age={patientData?.age} gender={patientData?.gender} />
                </div>

                <div className={activeTab === 'lab' ? 'block' : 'hidden'}>
                    <LabView />
                </div>

                <div className={activeTab === 'operation' ? 'block' : 'hidden'}>
                    <OperationView />
                </div>
                
                <div className={activeTab === 'medication' ? 'block' : 'hidden'}>
                    <MedicationView />
                </div>

                <div className={activeTab === 'fee' ? 'block' : 'hidden'}>
                    <FeeView />
                </div>

                <div className={activeTab === 'documents' ? 'block' : 'hidden'}>
                    <DocumentsView />
                </div>
            </div>

            {/* 4. HISTORY SIDEBAR */}
            <HistorySidebar 
                isOpen={isHistoryOpen} 
                onClose={() => setIsHistoryOpen(false)} 
                patientId={patientId || 'UNKNOWN'}
            />
        </div>
    );
};

export default PatientRecordView;
