
import React, { useState, useMemo, useEffect } from 'react';
import { 
    SearchIcon,
    BeakerIcon,
    PhotographIcon,
    ActivityIcon,
    ChevronLeftIcon,
    PlusIcon,
    TrashIcon,
    PresentationChartLineIcon
} from '../../../../components/Icons';
import LabResultTemplate from './templates/LabResultTemplate';
import ImagingResultTemplate from './templates/ImagingResultTemplate';
import FunctionalExplorationTemplate from './templates/FunctionalExplorationTemplate';
import ServiceCatalogModal from './../../../../components/shared/services/ServiceCatalogModal';
import ServiceTemplateModal from '../../../../components/shared/services/ServiceTemplateModal';
import LabTrendModal from './modals/LabTrendModal';
import { ServiceItem, serviceCategories } from '../../data/catalogs';
import { useTheme } from '../../../../contexts/ThemeContext';

type ServiceType = 'XN' | 'HA' | 'TD';

export interface ServiceRequest {
    id: string;
    name: string;
    type: ServiceType;
    status: 'completed' | 'pending';
    
    // Order Info
    orderingDoctor: string;
    orderingDate: string;
    
    // Result Info
    resultDate?: string;
    readingDoctor?: string;
    approvingDoctor?: string;

    // Specimen Info (Optional, mostly for Lab)
    specimen?: {
        collectionTime: string;
        collector: string;
        type: string;
        condition: string;
    };

    // Specific Data Containers
    labData?: {
        items: Array<{ name: string, result: string, unit: string, normalRange: string, isAbnormal: boolean }>;
        device: string;
    };
    imagingData?: {
        technique: string;
        findings: string;
        conclusion: string;
        imageUrl: string;
    };
    functionalData?: {
        technique: string;
        findings: string;
        conclusion: string;
        metrics: Record<string, string>;
        chartData?: any[];
    };
}

const mockRequests: ServiceRequest[] = [
    { 
        id: 'XN001', 
        name: 'Tổng phân tích tế bào máu', 
        type: 'XN',
        status: 'completed',
        orderingDoctor: 'BS. Nguyễn Văn A',
        orderingDate: '18/11/2023 08:00',
        resultDate: '18/11/2023 09:30',
        readingDoctor: 'KTV. Trần Thị B',
        approvingDoctor: 'BS. Lê Văn C',
        specimen: {
            collectionTime: '18/11/2023 08:15',
            collector: 'ĐD. Phạm Thị D',
            type: 'Máu toàn phần (EDTA)',
            condition: 'Đạt yêu cầu'
        },
        labData: {
            device: 'Sysmex XN-1000',
            items: [
                { name: 'RBC (Số lượng hồng cầu)', result: '4.50', unit: 'T/L', normalRange: '3.8 - 5.3', isAbnormal: false },
                { name: 'HGB (Lượng huyết sắc tố)', result: '135', unit: 'g/L', normalRange: '120 - 160', isAbnormal: false },
                { name: 'HCT (Dung tích hồng cầu)', result: '0.41', unit: 'L/L', normalRange: '0.35 - 0.47', isAbnormal: false },
                { name: 'WBC (Số lượng bạch cầu)', result: '12.5', unit: 'G/L', normalRange: '4.0 - 10.0', isAbnormal: true },
                { name: 'PLT (Số lượng tiểu cầu)', result: '250', unit: 'G/L', normalRange: '150 - 450', isAbnormal: false },
            ]
        }
    },
    { 
        id: 'HA001', 
        name: 'X-Quang Ngực thẳng', 
        type: 'HA',
        status: 'completed',
        orderingDoctor: 'BS. Nguyễn Văn A',
        orderingDate: '18/11/2023 09:00',
        resultDate: '18/11/2023 09:20',
        readingDoctor: 'BS. Chẩn Đoán Hình Ảnh',
        approvingDoctor: 'BS. Trưởng Khoa HA',
        specimen: {
            collectionTime: '18/11/2023 09:10',
            collector: 'KTV. X-Quang',
            type: 'Không áp dụng',
            condition: 'Bệnh nhân đứng thẳng'
        },
        imagingData: {
            technique: 'Chụp X-Quang kỹ thuật số (DR)',
            findings: '- Lồng ngực cân đối, không gù vẹo.\n- Nhu mô phổi sáng đều hai bên.\n- Không thấy hình ảnh tổn thương khu trú.\n- Bóng tim không to.\n- Góc sườn hoành hai bên sáng.',
            conclusion: 'Hình ảnh tim phổi bình thường.',
            imageUrl: 'https://prod-images-static.radiopaedia.org/images/54766339/9d0de6367f802d672324f4a844e2e211f95d83115f67b6f250d472e532402273_gallery.jpeg'
        }
    },
    { 
        id: 'TD001', 
        name: 'Điện tâm đồ (ECG)', 
        type: 'TD',
        status: 'completed',
        orderingDoctor: 'BS. Nguyễn Văn A',
        orderingDate: '18/11/2023 09:15',
        resultDate: '18/11/2023 09:30',
        readingDoctor: 'BS. Tim Mạch',
        approvingDoctor: 'BS. Tim Mạch',
        specimen: {
            collectionTime: '18/11/2023 09:20',
            collector: 'ĐD. Tim Mạch',
            type: 'Ghi tại giường',
            condition: 'Bệnh nhân nằm yên'
        },
        functionalData: {
            technique: 'Ghi điện tim bề mặt 12 chuyển đạo',
            findings: '- Nhịp xoang đều, tần số 80 lần/phút.\n- Trục trung gian.\n- Không thấy dấu hiệu phì đại thất.\n- ST-T bình thường.',
            conclusion: 'Điện tâm đồ trong giới hạn bình thường.',
            metrics: {
                'Nhịp tim': '80 bpm',
                'Khoảng PR': '0.14 s',
                'QRS': '0.08 s',
                'QTc': '0.40 s'
            },
            chartData: [
                { name: 'I', value: 10 }, { name: 'II', value: 15 }, { name: 'III', value: 5 }, 
                { name: 'aVR', value: -10 }, { name: 'aVL', value: 8 }, { name: 'aVF', value: 12 },
                { name: 'V1', value: -5 }, { name: 'V2', value: 8 }, { name: 'V3', value: 18 }, 
                { name: 'V4', value: 20 }, { name: 'V5', value: 15 }, { name: 'V6', value: 12 }
            ]
        }
    }
];


import { useParams } from 'react-router-dom';
import { useNotification } from '../../../../contexts/NotificationContext';
import { consultationService } from '../../../../services/consultationService';

const LabView: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const { addNotification } = useNotification();
    const { fontSettings } = useTheme();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Mock DocNo for now - in real app this comes from the active encounter/visit
    const currentDocNo = 21000001; 

    // Modal States
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isTrendModalOpen, setIsTrendModalOpen] = useState(false);

    const selectedRequest = useMemo(() => requests.find(r => r.id === selectedId), [requests, selectedId]);

    const loadHistory = async () => {
        if (!currentDocNo) return;
        setIsLoading(true);
        try {
            const response = await consultationService.getServiceHistory(currentDocNo);
            if (response.success) {
                // Map backend response to ServiceRequest interface
                const mapped: ServiceRequest[] = response.data.map((order: any) => ({
                    id: order.id.toString(),
                    name: order.items && order.items.length > 0 ? (order.items.length > 1 ? `${order.items[0].name} (+${order.items.length - 1})` : order.items[0].name) : 'Phiếu chỉ định',
                    type: order.type === 'A' ? 'XN' : order.type === 'B' ? 'HA' : 'TD',
                    status: order.status === 'P' ? 'completed' : 'pending',
                    orderingDoctor: order.orderingDoctor,
                    orderingDate: new Date(order.orderingDate).toLocaleString('vi-VN'),
                    labData: order.type === 'A' ? { items: order.items, device: '' } : undefined,
                    imagingData: order.type === 'B' ? { findings: order.items[0]?.result || '', conclusion: '', technique: '', imageUrl: '' } : undefined,
                    functionalData: order.type === 'C' ? { findings: order.items[0]?.result || '', conclusion: '', technique: '', metrics: {} } : undefined
                }));
                setRequests(mapped);
                if (mapped.length > 0 && !selectedId && window.innerWidth >= 1024) {
                    setSelectedId(mapped[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to load service history", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [currentDocNo]);

    const filteredRequests = useMemo(() => {
        if (!searchTerm) return requests;
        return requests.filter(r => 
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            r.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [requests, searchTerm]);

    const handleDelete = () => {
        if (selectedRequest && window.confirm(`Bạn có chắc chắn muốn xóa phiếu ${selectedRequest.name}?`)) {
            // In real app, call API to delete/cancel order
            setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
            setSelectedId(null);
            addNotification("Thông báo", "Đã xóa chỉ định.", "info");
        }
    };

    const handleServiceAdd = async (items: ServiceItem[]) => {
        if (items.length === 0) return;

        try {
            // Group indices to determine the main group (XN, CDHA, TDCN)
            // For simplicity, we use the first item's group category
            const firstItem = items[0];
            const category = serviceCategories.find(c => c.id === firstItem.categoryId);
            const groupId = category?.type === 'CDHA' ? 'B' : category?.type === 'TDCN' ? 'C' : 'A';

            const payload = {
                docNo: currentDocNo,
                groupId: groupId,
                items: items.map(it => ({
                    id: it.id,
                    name: it.name,
                    unit: it.unit,
                    note: ''
                }))
            };

            const result = await consultationService.saveServiceOrder(payload);
            if (result.success) {
                addNotification("Thành công", "Đã lưu chỉ định CLS.", "success");
                loadHistory(); // Reload from DB
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            addNotification("Lỗi", "Không thể lưu chỉ định: " + error.message, "error");
        }
    };

    const getTypeBadge = (type: ServiceType) => {
        switch(type) {
            case 'XN': return <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-700 border border-blue-200">XN</span>;
            case 'HA': return <span className="px-2 py-0.5 text-xs font-bold rounded bg-purple-100 text-purple-700 border border-purple-200">HA</span>;
            case 'TD': return <span className="px-2 py-0.5 text-xs font-bold rounded bg-orange-100 text-orange-700 border border-orange-200">TD</span>;
            default: return null;
        }
    };

    const getTypeIcon = (type: ServiceType) => {
        switch(type) {
            case 'XN': return <BeakerIcon className="w-5 h-5" />;
            case 'HA': return <PhotographIcon className="w-5 h-5" />;
            case 'TD': return <ActivityIcon className="w-5 h-5" />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 relative">
            
            {/* ===== LEFT SIDEBAR: LIST ===== */}
            <div className={`
                flex-col h-full border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 
                lg:w-80 lg:flex flex-shrink-0 
                ${selectedId ? 'hidden' : 'flex w-full'}
            `}>
                {/* Header with Search & Add */}
                <div className="p-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex flex-col gap-2">
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className={`block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out ${fontSettings.controls}`}
                                placeholder="Tìm phiếu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsCatalogModalOpen(true)}
                            className={`flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-bold flex items-center justify-center gap-1 ${fontSettings.controls}`}
                            title="Thêm chỉ định lẻ"
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setIsTemplateModalOpen(true)}
                            className={`flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm font-bold flex items-center justify-center gap-1 ${fontSettings.controls}`}
                            title="Thêm theo gói (Template)"
                        >
                            <span className="text-xs font-extrabold">+G</span>
                        </button>
                        {/* Button to Open Trend Chart Modal */}
                         <button 
                            onClick={() => setIsTrendModalOpen(true)}
                            className={`flex-none px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm font-bold flex items-center justify-center gap-1 ${fontSettings.controls}`}
                            title="Biểu đồ xu hướng (Trend)"
                        >
                            <PresentationChartLineIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* List Content */}
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {filteredRequests.length === 0 ? (
                         <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-base">
                             Không tìm thấy phiếu.
                         </div>
                    ) : (
                        filteredRequests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => setSelectedId(req.id)}
                                className={`p-3 rounded-lg cursor-pointer transition border relative ${
                                    selectedId === req.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                                    : 'bg-white dark:bg-slate-800 border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-gray-200 dark:hover:border-slate-600'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-2">
                                        <div className={`mt-0.5 text-slate-400 ${selectedId === req.id ? 'text-blue-500' : ''}`}>
                                            {getTypeIcon(req.type)}
                                        </div>
                                        <div>
                                            <div className={`font-bold ${fontSettings.listPrimary} ${selectedId === req.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-slate-200'}`}>
                                                {req.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-mono">
                                                #{req.id}
                                            </div>
                                        </div>
                                    </div>
                                    {getTypeBadge(req.type)}
                                </div>
                                <div className="mt-2 flex justify-between items-end">
                                    <span className="text-xs text-gray-600 dark:text-slate-300">
                                        {req.orderingDate.split(' ')[0]}
                                    </span>
                                    <span className={`text-xs font-bold uppercase ${req.status === 'completed' ? 'text-green-600' : 'text-amber-500'}`}>
                                        {req.status === 'completed' ? 'Đã xong' : 'Chờ KQ'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ===== RIGHT CONTENT: RESULT DETAIL ===== */}
            <div className={`
                flex-col h-full overflow-hidden bg-gray-100 dark:bg-slate-900 flex-1 p-4
                ${selectedId ? 'flex w-full fixed inset-0 z-[40] lg:static lg:z-auto' : 'hidden lg:flex'}
            `}>
                {/* Mobile Back Header */}
                <div className="lg:hidden flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedId(null)} className="p-2 -ml-2 text-gray-600 dark:text-slate-300 hover:bg-slate-200 rounded-full">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <h2 className="font-bold text-lg">Chi tiết kết quả</h2>
                    </div>
                    {selectedRequest && (
                        <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Desktop Header Action (Hidden on Mobile) */}
                <div className="hidden lg:flex justify-end mb-2">
                     {selectedRequest && (
                        <button 
                            onClick={handleDelete}
                            className={`flex items-center gap-2 px-3 py-1.5 text-red-600 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition ${fontSettings.controls}`}
                        >
                            <TrashIcon className="w-4 h-4" /> Xóa phiếu
                        </button>
                    )}
                </div>

                {!selectedRequest ? (
                    <div className="flex flex-col h-full items-center justify-center text-gray-400 dark:text-slate-500">
                        <BeakerIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-center text-lg">Vui lòng chọn một phiếu để xem kết quả</p>
                    </div>
                ) : (
                    <>
                        {selectedRequest.status === 'pending' ? (
                            <div className="flex flex-col h-full items-center justify-center bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-500 font-medium text-lg">Kết quả đang chờ xử lý...</p>
                                {/* Show Info even if pending */}
                                <div className="mt-8 w-full max-w-2xl px-6">
                                    <div className="grid grid-cols-2 gap-4 text-base text-slate-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-900 p-4 rounded-lg">
                                        <p><strong>Ngày chỉ định:</strong> {selectedRequest.orderingDate}</p>
                                        <p><strong>BS chỉ định:</strong> {selectedRequest.orderingDoctor}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`h-full flex flex-col ${fontSettings.listSecondary}`}>
                                {selectedRequest.type === 'XN' && <LabResultTemplate data={selectedRequest} />}
                                {selectedRequest.type === 'HA' && <ImagingResultTemplate data={selectedRequest} />}
                                {selectedRequest.type === 'TD' && <FunctionalExplorationTemplate data={selectedRequest} />}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ===== MODALS ===== */}
            <ServiceCatalogModal 
                isOpen={isCatalogModalOpen} 
                onClose={() => setIsCatalogModalOpen(false)} 
                onSelect={handleServiceAdd} 
            />
            <ServiceTemplateModal 
                isOpen={isTemplateModalOpen} 
                onClose={() => setIsTemplateModalOpen(false)} 
                onSelect={handleServiceAdd} 
            />
            <LabTrendModal
                isOpen={isTrendModalOpen}
                onClose={() => setIsTrendModalOpen(false)}
                patientId="P003" // Mock patient ID
                patientName="Lê Hoàng Cường" // Mock patient Name
            />
        </div>
    );
};

export default LabView;
