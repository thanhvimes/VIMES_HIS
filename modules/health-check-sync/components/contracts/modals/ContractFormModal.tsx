import React from 'react';
import { CalendarIcon } from '../../../../../components/Icons';
import { CatalogItem } from '../../../../../services/catalogService';

interface ContractFormModalProps {
    isOpen: boolean;
    formMode: 'ADD' | 'EDIT';
    formData: {
        code: string;
        company_id: string;
        description: string;
        contract_date: string;
        exam_date: string;
        type: string;
        object: string;
        def_roomid: string | number;
        def_examtype: string;
        form_type: string;
    };
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    workplaces: CatalogItem[];
    patientObjects: CatalogItem[];
    rooms: any[];
    examFees: any[];
}

export const ContractFormModal: React.FC<ContractFormModalProps> = ({
    isOpen,
    formMode,
    formData,
    setFormData,
    onSubmit,
    onClose,
    workplaces,
    patientObjects,
    rooms,
    examFees,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {formMode === 'ADD' ? 'Thêm hợp đồng khám' : 'Sửa hợp đồng khám'}
                    </h5>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit}>
                    <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã hợp đồng *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, code: e.target.value }))}
                                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-sm"
                                    placeholder="Ví dụ: HD01/2026"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Công ty/Đối tác</label>
                                <select
                                    value={formData.company_id}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, company_id: e.target.value }))}
                                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-bold text-sm"
                                >
                                    {workplaces.map((w) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diễn giải/Mô tả *</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                                className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-medium text-sm h-20 resize-none"
                                placeholder="Tên hoặc nội dung gói khám sức khỏe..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày hợp đồng</label>
                                <input
                                    type="date"
                                    value={formData.contract_date}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, contract_date: e.target.value }))}
                                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-sm"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày khám</label>
                                <input
                                    type="date"
                                    value={formData.exam_date}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, exam_date: e.target.value }))}
                                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phòng tiếp đón mặc định</label>
                                <select
                                    value={formData.def_roomid}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, def_roomid: e.target.value }))}
                                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-sm"
                                >
                                    {rooms.map((r: any) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Công khám mặc định</label>
                                <select
                                    value={formData.def_examtype}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, def_examtype: e.target.value }))}
                                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-sm"
                                >
                                    {examFees.map((f: any) => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đối tượng bệnh nhân</label>
                                <select
                                    value={formData.object}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, object: e.target.value }))}
                                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-sm"
                                >
                                    {patientObjects.map((obj) => (
                                        <option key={obj.id} value={obj.id}>{obj.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mẫu biểu áp dụng</label>
                                <select
                                    value={formData.form_type}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, form_type: e.target.value }))}
                                    className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-sm"
                                >
                                    <option value="1">Mẫu 1 - Trẻ em dưới 6 tuổi</option>
                                    <option value="2">Mẫu 2 - Học sinh từ 6 - 18 tuổi</option>
                                    <option value="3">Mẫu 3 - Người lớn từ 18 tuổi</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
                        >
                            Đóng
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md shadow-teal-500/10 cursor-pointer"
                        >
                            Lưu lại
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
