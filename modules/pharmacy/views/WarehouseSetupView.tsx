
import React, { useState } from 'react';
import { 
    PlusIcon, SearchIcon, TrashIcon, PencilIcon, SaveIcon, 
    XIcon, CubeIcon, GlobeIcon, BuildingOfficeIcon,
    BeakerIcon, ListBulletIcon, ArrowUpTrayIcon,
    UserCircleIcon, ArchiveIcon, DesktopComputerIcon,
    ChevronLeftIcon, CogIcon, StarIcon
} from '../../../components/Icons';
import { mockWarehouses } from '../data';
import { useTheme } from '../../../contexts/ThemeContext';

const SETUP_CATEGORIES = [
    { id: 'warehouse', label: 'Danh mục kho', desc: 'Quản lý kho chẵn, kho lẻ và tủ trực', icon: <CubeIcon />, color: 'bg-blue-600' },
    { id: 'countries', label: 'Nước sản xuất', desc: 'Danh sách các quốc gia sản xuất dược phẩm', icon: <GlobeIcon />, color: 'bg-teal-600' },
    { id: 'manufacturers', label: 'Nhà sản xuất', desc: 'Quản lý các hãng sản xuất thuốc', icon: <BuildingOfficeIcon />, color: 'bg-indigo-600' },
    { id: 'suppliers', label: 'Nhà cung cấp', desc: 'Thông tin các đơn vị cung ứng vật tư', icon: <UserCircleIcon />, color: 'bg-purple-600' },
    { id: 'drug-groups', label: 'Nhóm thuốc', desc: 'Phân loại thuốc theo nhóm điều trị', icon: <ListBulletIcon />, color: 'bg-orange-500' },
    { id: 'active-ingredients', label: 'Hoạt chất', desc: 'Danh mục các hoạt chất dược lý', icon: <BeakerIcon />, color: 'bg-pink-600' },
    { id: 'items', label: 'Danh mục hàng', desc: 'Cấu hình chi tiết mặt hàng và quy cách', icon: <ArchiveIcon />, color: 'bg-sky-600' },
    { id: 'clients', label: 'Client List', desc: 'Quản lý danh sách máy trạm truy cập', icon: <DesktopComputerIcon />, color: 'bg-slate-600' },
];

const WarehouseSetupView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const filteredCategories = SETUP_CATEGORIES.filter(cat => 
        cat.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentCategory = SETUP_CATEGORIES.find(c => c.id === selectedCategoryId);

    const inputClass = "w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 text-sm font-bold";
    const labelClass = "block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1.5 tracking-widest";

    if (!selectedCategoryId) {
        return (
            <div className="h-full flex flex-col p-6 lg:p-10 animate-fade-in bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar">
                <div className="max-w-6xl mx-auto w-full space-y-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <CogIcon className="w-10 h-10 text-blue-600"/>
                                Thiết lập hệ thống Dược
                            </h1>
                            <p className="text-slate-500 mt-2 text-lg">Vui lòng chọn một danh mục cần cấu hình bên dưới</p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <SearchIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder="Tìm nhanh chức năng..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner">
                                <StarIcon className="w-10 h-10 text-yellow-300 fill-yellow-300"/>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight">Hành động nhanh (Quick Tasks)</h2>
                                <p className="opacity-80 font-medium">Lập danh mục kho tổng hoặc đồng bộ dữ liệu dược từ Excel</p>
                            </div>
                        </div>
                        <div className="flex gap-3 relative z-10">
                            <button className="px-6 py-3 bg-white text-blue-600 font-black rounded-xl hover:bg-blue-50 transition active:scale-95 shadow-lg text-sm uppercase">Import Excel</button>
                            <button className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-black transition active:scale-95 shadow-lg text-sm uppercase">HD cấu hình</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
                        {filteredCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className="group bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-slate-100 dark:border-slate-700 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden active:scale-95"
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${cat.color}`}></div>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 group-hover:rotate-6 transition-transform ${cat.color}`}>
                                    {React.cloneElement(cat.icon as React.ReactElement<any>, { className: "w-8 h-8" })}
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">{cat.label}</h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed font-medium">{cat.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-slide-in-up">
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setSelectedCategoryId(null)}
                        className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-600 dark:text-blue-400 rounded-full transition-colors"
                        title="Quay lại Hub"
                    >
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl text-white ${currentCategory?.color} shadow-lg shadow-blue-500/20`}>
                            {currentCategory?.icon && React.cloneElement(currentCategory.icon as React.ReactElement<any>, { className: "w-5 h-5" })}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                                {currentCategory?.label}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Thiết lập dữ liệu nền tảng</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-slate-100 transition shadow-sm">
                        <ArrowUpTrayIcon className="w-4 h-4"/> Import
                    </button>
                    <button 
                        onClick={() => { setSelectedItem(null); setIsEditing(true); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20 flex items-center gap-2 transition transform active:scale-95"
                    >
                        <PlusIcon className="w-4 h-4"/> Thêm mới
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-800">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-[10px] font-black tracking-widest sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-4 w-16 text-center border-r border-slate-100 dark:border-slate-700">Mã</th>
                                    <th className="p-4">Tên nội dung hiển thị</th>
                                    <th className="p-4">Nhóm quản lý</th>
                                    <th className="p-4">Mô tả</th>
                                    <th className="p-4 text-center w-24">Tác vụ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                                {selectedCategoryId === 'warehouse' ? (
                                    mockWarehouses.map(w => (
                                        <tr 
                                            key={w.id} 
                                            onClick={() => { setSelectedItem(w); setIsEditing(true); }}
                                            className={`hover:bg-blue-50/50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${selectedItem?.id === w.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                                        >
                                            <td className="p-4 text-center font-mono font-black text-slate-400 border-r border-slate-100 dark:border-slate-700 text-xs">{w.id}</td>
                                            <td className="p-4 font-black text-slate-800 dark:text-white underline decoration-blue-100 dark:decoration-slate-700 underline-offset-8">{w.name}</td>
                                            <td className="p-4"><span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase border border-indigo-100 dark:border-indigo-900">{w.dept}</span></td>
                                            <td className="p-4 text-slate-500 font-medium italic text-xs">{w.type}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100">
                                                    <button className="text-blue-600 hover:scale-110 transition"><PencilIcon className="w-4 h-4"/></button>
                                                    <button className="text-rose-500 hover:scale-110 transition"><TrashIcon className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic font-bold">Dữ liệu đang được đồng bộ...</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {isEditing && (
                    <div className="w-[450px] border-l border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl flex flex-col animate-slide-in-right z-20">
                        <div className="p-4 border-b bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                            <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs flex items-center gap-2">
                                <PencilIcon className="w-4 h-4 text-blue-600"/> Cập nhật danh mục
                            </h4>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><XIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900 mb-2">
                                <label className={labelClass}>Mã định danh hệ thống</label>
                                <div className="text-lg font-black text-blue-600 font-mono">{selectedItem?.id || 'NEW-ID'}</div>
                            </div>
                            <div>
                                <label className={labelClass}>Tên hiển thị (VN) <span className="text-red-500">*</span></label>
                                <input type="text" className={inputClass} defaultValue={selectedItem?.name || ''} placeholder="Nhập tên..." autoFocus />
                            </div>
                            <div>
                                <label className={labelClass}>Bộ phận quản lý</label>
                                <select className={inputClass} defaultValue={selectedItem?.dept}>
                                    <option>Khoa dược</option>
                                    <option>Khoa Ngoại</option>
                                    <option>Khối hành chính</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Diễn giải chi tiết</label>
                                <textarea className={`${inputClass} h-32 resize-none font-medium`} defaultValue={selectedItem?.type} placeholder="Ghi chú kỹ thuật..."></textarea>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <input type="checkbox" id="activeChk" className="w-5 h-5 text-blue-600 rounded-lg cursor-pointer" defaultChecked />
                                <label htmlFor="activeChk" className="text-sm font-black text-slate-700 dark:text-slate-300 cursor-pointer uppercase tracking-tight">Kích hoạt sử dụng</label>
                            </div>
                        </div>
                        <div className="p-6 border-t bg-slate-50 dark:bg-slate-900 grid grid-cols-2 gap-3">
                            <button onClick={() => setIsEditing(false)} className="py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-100 transition shadow-sm">Hủy bỏ</button>
                            <button className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition transform active:scale-95">
                                <SaveIcon className="w-4 h-4"/> Lưu thay đổi
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s cubic-bezier(0, 0.55, 0.45, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default WarehouseSetupView;
