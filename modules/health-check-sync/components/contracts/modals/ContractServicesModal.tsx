import React from 'react';
import { PlusIcon, SearchIcon } from '../../../../../components/Icons';
import { toast } from 'sonner';

interface ContractServicesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: () => void;
    serviceGroups: any[];
    selectedGroup: string | null;
    setSelectedGroup: (id: string) => void;
    isLoadingGroups: boolean;
    groupServices: any[];
    isLoadingGroupServices: boolean;
    selectedServices: any[];
    onAddServiceToSelection: (service: any) => void;
    onRemoveServiceFromSelection: (itemId: string) => void;
    onUpdateSelectionQuantity: (itemId: string, qty: number) => void;
    onUpdateSelectionGender: (itemId: string, gender: string) => void;
    onUpdateSelectionMinAge: (itemId: string, minAge: number | undefined) => void;
    onUpdateSelectionMaxAge: (itemId: string, maxAge: number | undefined) => void;
    serviceSearchTerm: string;
    onSearchServices: (term: string) => void;
    formatPrice: (p: number) => string;
}

export const ContractServicesModal: React.FC<ContractServicesModalProps> = ({
    isOpen,
    onClose,
    onApply,
    serviceGroups,
    selectedGroup,
    setSelectedGroup,
    isLoadingGroups,
    groupServices,
    isLoadingGroupServices,
    selectedServices,
    onAddServiceToSelection,
    onRemoveServiceFromSelection,
    onUpdateSelectionQuantity,
    onUpdateSelectionGender,
    onUpdateSelectionMinAge,
    onUpdateSelectionMaxAge,
    serviceSearchTerm,
    onSearchServices,
    formatPrice
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-6xl w-full h-[85vh] shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
                            <PlusIcon className="w-5 h-5" />
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Thêm chỉ định cận lâm sàng vào gói
                        </h5>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 text-lg font-bold cursor-pointer"
                    >
                        &times;
                    </button>
                </div>

                {/* Three-Column Layout */}
                <div className="flex-1 flex min-h-0 overflow-hidden divide-x divide-slate-100 dark:divide-slate-800">
                    {/* Col 1: Service Groups (Categories) */}
                    <div className="w-3/12 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/20 p-4">
                        <h6 className="text-[11px] font-extrabold text-[#9f1239] dark:text-rose-400 uppercase tracking-wider mb-3">Nhóm dịch vụ</h6>
                        {isLoadingGroups ? (
                            <div className="py-4 text-center text-xs text-slate-500">Đang tải...</div>
                        ) : (
                            <div className="space-y-1">
                                {serviceGroups.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setSelectedGroup(g.id)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                                            selectedGroup === g.id
                                                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold border border-rose-100 dark:border-rose-900/30'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Col 2: Services in Group */}
                    <div className="w-5/12 overflow-y-auto p-4 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <h6 className="text-[11px] font-extrabold text-[#9f1239] dark:text-rose-400 uppercase tracking-wider">Danh sách dịch vụ kỹ thuật</h6>
                        </div>
                        <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-y-auto bg-white dark:bg-slate-800">
                            {isLoadingGroupServices ? (
                                <div className="py-10 text-center text-xs text-slate-500">Đang tải dịch vụ...</div>
                            ) : groupServices.length === 0 ? (
                                <div className="py-10 text-center text-xs text-slate-400">Không có dịch vụ nào</div>
                            ) : (
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                                            <th className="p-2 w-12 text-center">STT</th>
                                            <th className="p-2">Tên dịch vụ</th>
                                            <th className="p-2 w-24 text-right">Đơn giá</th>
                                            <th className="p-2 w-12 text-center">Chọn</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {groupServices.map((gs, idx) => (
                                            <tr 
                                                key={gs.item_id} 
                                                className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                                                onDoubleClick={() => onAddServiceToSelection(gs)}
                                            >
                                                <td className="p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                                                <td className="p-2 font-semibold text-slate-800 dark:text-slate-200">{gs.name}</td>
                                                <td className="p-2 text-right font-mono text-slate-600 dark:text-slate-400">{formatPrice(parseFloat(gs.price))}</td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => onAddServiceToSelection(gs)}
                                                        className="px-2 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 text-teal-600 rounded text-[10px] font-bold cursor-pointer"
                                                    >
                                                        Chọn
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Col 3: Selected Services for Package */}
                    <div className="w-4/12 overflow-y-auto p-4 flex flex-col">
                        <h6 className="text-[11px] font-extrabold text-[#9f1239] dark:text-rose-400 uppercase tracking-wider mb-3">Dịch vụ đã chọn cho gói</h6>
                        <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-y-auto bg-white dark:bg-slate-800 mb-3">
                            {selectedServices.length === 0 ? (
                                <div className="h-full flex flex-col justify-center items-center text-slate-400 text-xs py-10">
                                    <span>Chưa chọn dịch vụ nào</span>
                                    <span className="text-[10px] text-slate-500 italic mt-1">(Kích đúp dịch vụ ở giữa để chọn nhanh)</span>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse text-[11px]">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                                            <th className="p-2">Tên</th>
                                            <th className="p-2 w-12 text-center">SL</th>
                                            <th className="p-2 w-16 text-center">Giới</th>
                                            <th className="p-2 w-12 text-center">Từ</th>
                                            <th className="p-2 w-12 text-center">Đến</th>
                                            <th className="p-2 w-10 text-center">Xóa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {selectedServices.map(ss => (
                                            <tr key={ss.item_id}>
                                                <td className="p-2 font-medium text-slate-800 dark:text-slate-200">{ss.name}</td>
                                                <td className="p-2 text-center">
                                                    <input
                                                        type="number"
                                                        value={ss.quantity}
                                                        onChange={(e) => onUpdateSelectionQuantity(ss.item_id, parseInt(e.target.value, 10))}
                                                        className="w-8 text-center border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-900 dark:text-white font-mono text-[10px] p-0.5"
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <select
                                                        value={ss.gender}
                                                        onChange={(e) => onUpdateSelectionGender(ss.item_id, e.target.value)}
                                                        className="text-[10px] border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-900 dark:text-white p-0.5 w-14"
                                                    >
                                                        <option value="A">Cả hai</option>
                                                        <option value="M">Nam</option>
                                                        <option value="F">Nữ</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <input
                                                        type="number"
                                                        placeholder=">="
                                                        value={ss.min_age !== undefined && ss.min_age !== null ? ss.min_age : ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            onUpdateSelectionMinAge(ss.item_id, val === '' ? undefined : parseInt(val, 10));
                                                        }}
                                                        className="w-10 text-center border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-900 dark:text-white font-mono text-[10px] p-0.5"
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <input
                                                        type="number"
                                                        placeholder="<="
                                                        value={ss.max_age !== undefined && ss.max_age !== null ? ss.max_age : ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            onUpdateSelectionMaxAge(ss.item_id, val === '' ? undefined : parseInt(val, 10));
                                                        }}
                                                        className="w-10 text-center border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-900 dark:text-white font-mono text-[10px] p-0.5"
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => onRemoveServiceFromSelection(ss.item_id)}
                                                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-0.5 rounded transition cursor-pointer"
                                                    >
                                                        &times;
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 flex justify-between items-center">
                            <span>Tổng số lượng dịch vụ:</span>
                            <span className="font-extrabold text-rose-600 dark:text-rose-400">{selectedServices.length}</span>
                        </div>
                    </div>
                </div>

                {/* Footer (Search input, action buttons) */}
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 max-w-sm w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-600 transition">
                        <SearchIcon className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm nhanh theo mã hoặc tên dịch vụ..."
                            value={serviceSearchTerm}
                            onChange={(e) => onSearchServices(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && groupServices.length > 0) {
                                    e.preventDefault();
                                    onAddServiceToSelection(groupServices[0]);
                                    onSearchServices('');
                                    toast.success(`Đã chọn: ${groupServices[0].name}`);
                                }
                            }}
                            className="border-none bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none w-full p-0"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
                        >
                            Đóng
                        </button>
                        <button
                            onClick={onApply}
                            disabled={selectedServices.length === 0}
                            className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md cursor-pointer ${
                                selectedServices.length === 0
                                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                                    : 'bg-[#0f766e] hover:bg-[#0d645c] text-white shadow-teal-500/10'
                            }`}
                        >
                            Áp dụng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
