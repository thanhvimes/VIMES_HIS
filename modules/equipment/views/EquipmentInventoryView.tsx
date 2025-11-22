
import React, { useState, useMemo } from 'react';
import { mockEquipment } from '../data';
import { MedicalEquipment } from '../../types';
import { 
    SearchIcon, 
    FilterIcon, 
    TagIcon, 
    WrenchIcon,
    DocumentTextIcon,
    SwitchHorizontalIcon,
    TrashIcon,
    PencilIcon,
    XIcon,
    CheckBadgeIcon,
    CubeIcon
} from '../../../components/Icons';

// --- Detail Modal Component ---
const EquipmentDetailModal = ({ item, onClose }: { item: MedicalEquipment, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'history' | 'docs' | 'parts'>('general');

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${item.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            <TagIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{item.name}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                                ID: {item.id} <span className="w-1 h-1 bg-slate-400 rounded-full"></span> Model: {item.model}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <button onClick={() => setActiveTab('general')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'general' ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-slate-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <TagIcon className="w-4 h-4"/> Thông tin chung
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-slate-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <WrenchIcon className="w-4 h-4"/> Lịch sử & Bảo trì
                    </button>
                    <button onClick={() => setActiveTab('docs')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'docs' ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-slate-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <DocumentTextIcon className="w-4 h-4"/> Hồ sơ & Hợp đồng
                    </button>
                    <button onClick={() => setActiveTab('parts')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'parts' ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-slate-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <CubeIcon className="w-4 h-4"/> Phụ tùng (Spare Parts)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 border-slate-100 dark:border-slate-700">Thông tin cơ bản</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-slate-500 block text-xs uppercase">Số Serial</span> <span className="font-medium">{item.serialNumber}</span></div>
                                        <div><span className="text-slate-500 block text-xs uppercase">Hãng sản xuất</span> <span className="font-medium">{item.manufacturer}</span></div>
                                        <div><span className="text-slate-500 block text-xs uppercase">Nhà cung cấp</span> <span className="font-medium">{item.supplier}</span></div>
                                        <div><span className="text-slate-500 block text-xs uppercase">Năm sản xuất</span> <span className="font-medium">2019</span></div>
                                        <div><span className="text-slate-500 block text-xs uppercase">Khoa/Phòng</span> <span className="font-medium text-blue-600">{item.department}</span></div>
                                        <div><span className="text-slate-500 block text-xs uppercase">Vị trí cụ thể</span> <span className="font-medium">P.301 - Tầng 3</span></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 border-b pb-2 border-slate-100 dark:border-slate-700">Tình trạng khấu hao & Tài chính</h3>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div><span className="text-slate-500 block text-xs uppercase">Ngày mua</span> <span className="font-medium">{item.purchaseDate}</span></div>
                                        <div><span className="text-slate-500 block text-xs uppercase">Nguyên giá</span> <span className="font-medium">850,000,000 đ</span></div>
                                        <div><span className="text-slate-500 block text-xs uppercase">Khấu hao/năm</span> <span className="font-medium">10%</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-48 object-contain bg-white"/>
                                    ) : (
                                        <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400">No Image</div>
                                    )}
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Trạng thái hiện tại</h3>
                                    <div className={`p-3 rounded-lg text-center mb-3 font-bold uppercase ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.status === 'active' ? 'Đang hoạt động' : 'Đang hỏng / Bảo trì'}
                                    </div>
                                    <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-medium text-sm flex items-center justify-center gap-2">
                                        <SwitchHorizontalIcon className="w-4 h-4"/> Điều chuyển
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg">Nhật ký thiết bị</h3>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">+ Báo hỏng / Bảo trì</button>
                            </div>
                            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-8 pb-4">
                                <div className="ml-6 relative">
                                    <div className="absolute -left-[31px] top-0 w-4 h-4 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-800 dark:text-white">Bảo dưỡng định kỳ (PM)</span>
                                            <span className="text-xs text-slate-500">20/11/2023 (Dự kiến)</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">Kế hoạch: Vệ sinh bộ lọc khí, kiểm tra cảm biến áp lực.</p>
                                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">Upcoming</span>
                                    </div>
                                </div>
                                <div className="ml-6 relative">
                                    <div className="absolute -left-[31px] top-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm opacity-75">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-800 dark:text-white">Kiểm định an toàn</span>
                                            <span className="text-xs text-slate-500">15/05/2023</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">Thực hiện bởi: Trung tâm 3. Kết quả: Đạt yêu cầu.</p>
                                    </div>
                                </div>
                                <div className="ml-6 relative">
                                    <div className="absolute -left-[31px] top-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm opacity-75">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-800 dark:text-white">Bàn giao / Lắp đặt mới</span>
                                            <span className="text-xs text-slate-500">15/05/2021</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">Nhà cung cấp VietMedical bàn giao và hướng dẫn sử dụng.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'docs' && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="p-4 font-bold text-slate-600">Tên tài liệu</th>
                                        <th className="p-4 font-bold text-slate-600">Loại</th>
                                        <th className="p-4 font-bold text-slate-600">Ngày tải lên</th>
                                        <th className="p-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    <tr>
                                        <td className="p-4 font-medium">Hợp đồng bảo trì 2023 (AMC)</td>
                                        <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Hợp đồng</span></td>
                                        <td className="p-4 text-slate-500">01/01/2023</td>
                                        <td className="p-4 text-right"><button className="text-blue-600 hover:underline">Xem</button></td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium">Hướng dẫn sử dụng (User Manual)</td>
                                        <td className="p-4"><span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">Tài liệu</span></td>
                                        <td className="p-4 text-slate-500">15/05/2021</td>
                                        <td className="p-4 text-right"><button className="text-blue-600 hover:underline">Xem</button></td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium">Biên bản bàn giao nghiệm thu</td>
                                        <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Biên bản</span></td>
                                        <td className="p-4 text-slate-500">15/05/2021</td>
                                        <td className="p-4 text-right"><button className="text-blue-600 hover:underline">Xem</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'parts' && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                                <h3 className="font-bold">Danh mục phụ tùng thay thế (Spare Parts)</h3>
                                <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">+ Thêm</button>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="p-4 font-bold text-slate-600">Mã PT</th>
                                        <th className="p-4 font-bold text-slate-600">Tên phụ tùng</th>
                                        <th className="p-4 font-bold text-slate-600">Tuổi thọ (Giờ/Tháng)</th>
                                        <th className="p-4 text-right">Tồn kho</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    <tr>
                                        <td className="p-4 font-mono">FLT-001</td>
                                        <td className="p-4 font-medium">Bộ lọc khí thở ra (Expiratory Filter)</td>
                                        <td className="p-4">1000 giờ</td>
                                        <td className="p-4 text-right font-bold text-green-600">5</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-mono">O2-CELL</td>
                                        <td className="p-4 font-medium">Cảm biến Oxy (O2 Cell)</td>
                                        <td className="p-4">12 tháng</td>
                                        <td className="p-4 text-right font-bold text-red-500">0</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const EquipmentInventoryView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedItem, setSelectedItem] = useState<MedicalEquipment | null>(null);

    const filteredEquipment = useMemo(() => {
        return mockEquipment.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, filterStatus]);

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'active': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Hoạt động</span>;
            case 'maintenance': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Bảo trì</span>;
            case 'broken': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Hỏng</span>;
            case 'disposed': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Thanh lý</span>;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm tên thiết bị, model, ID..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select 
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="All">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="maintenance">Đang bảo trì</option>
                        <option value="broken">Đang hỏng</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-20 text-center">Ảnh</th>
                                <th className="p-4">Mã Tài sản</th>
                                <th className="p-4">Tên thiết bị</th>
                                <th className="p-4">Khoa / Phòng</th>
                                <th className="p-4">Bảo hành</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredEquipment.map(item => (
                                <tr 
                                    key={item.id} 
                                    onClick={() => setSelectedItem(item)}
                                    className="hover:bg-blue-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                                >
                                    <td className="p-4">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                                            {item.image ? <img src={item.image} alt="" className="w-full h-full object-contain"/> : <TagIcon className="w-5 h-5 text-slate-300"/>}
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-blue-600 text-sm">{item.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{item.name}</div>
                                        <div className="text-xs text-slate-500">{item.manufacturer} - {item.model}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{item.department}</td>
                                    <td className="p-4 text-sm text-slate-500">{new Date(item.warrantyExpiry).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-4 text-center">{getStatusBadge(item.status)}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600"><PencilIcon className="w-4 h-4"/></button>
                                            <button className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedItem && <EquipmentDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </div>
    );
};

export default EquipmentInventoryView;
