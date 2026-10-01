import React from 'react';
import Combobox from '../../../../../components/ui/Combobox';
import { CatalogItem } from '../../../../../services/catalogService';

interface ReceptionEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editForm: {
        fullName: string;
        surname: string;
        midname: string;
        firstname: string;
        dob: string;
        gender: string;
        cardId: string;
        phone: string;
        address: string;
        ethnic: string;
        provId: string;
        distId: string;
        villId: string;
        cardIdDate: string;
        cardIdPlace: string;
        guardianName: string;
        guardianCccd: string;
    };
    setEditForm: React.Dispatch<React.SetStateAction<any>>;
    handleEditFullNameChange: (val: string) => void;
    handleEditPhoneChange: (val: string) => void;
    handleEditCccdChange: (val: string) => void;
    handleEditCardIdDateChange: (val: string) => void;
    ethnicities: CatalogItem[];
    provinces: CatalogItem[];
    editWards: CatalogItem[];
    commonColumns: Array<{ key: string; label: string; width?: string }>;
}

export const ReceptionEditModal: React.FC<ReceptionEditModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editForm,
    setEditForm,
    handleEditFullNameChange,
    handleEditPhoneChange,
    handleEditCccdChange,
    handleEditCardIdDateChange,
    ethnicities,
    provinces,
    editWards,
    commonColumns,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 overflow-hidden animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Chỉnh sửa thông tin hành chính bệnh nhân
                    </h5>
                </div>

                {/* Form Body */}
                <div className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar text-xs flex-1">
                    {/* Hàng 1: Họ và tên (2/3) + Giới tính (1/3) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Họ và tên *
                                </label>
                                {editForm.fullName && (
                                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold font-mono">
                                        {editForm.surname && `Họ: ${editForm.surname}`} {editForm.firstname && `| Tên: ${editForm.firstname}`}
                                    </span>
                                )}
                            </div>
                            <input
                                type="text"
                                required
                                autoFocus
                                value={editForm.fullName}
                                onChange={e => handleEditFullNameChange(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-800 dark:text-white uppercase placeholder:normal-case placeholder:font-normal"
                                placeholder="Ví dụ: NGUYỄN VĂN AN..."
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Giới tính *
                            </label>
                            <select
                                required
                                value={editForm.gender}
                                onChange={e => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white cursor-pointer"
                            >
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="M">Nam (Code M)</option>
                                <option value="F">Nữ (Code F)</option>
                            </select>
                        </div>
                    </div>

                    {/* Hàng 2: Ngày sinh (1/2) + Số điện thoại (1/2) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Ngày sinh *
                            </label>
                            <input
                                type="date"
                                required
                                value={editForm.dob}
                                onChange={e => setEditForm(prev => ({ ...prev, dob: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Số điện thoại liên hệ
                                </label>
                                <span className={`text-[10px] font-mono font-bold ${
                                    !editForm.phone ? 'text-slate-400' :
                                    editForm.phone.length === 10 && editForm.phone.startsWith('0') ? 'text-emerald-600 dark:text-emerald-400' :
                                    'text-amber-500'
                                }`}>
                                    {editForm.phone ? `${editForm.phone.length}/10 số` : '10 số'}
                                </span>
                            </div>
                            <input
                                type="tel"
                                maxLength={10}
                                value={editForm.phone}
                                onChange={e => handleEditPhoneChange(e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:outline-none font-bold text-slate-700 dark:text-white font-mono ${
                                    !editForm.phone
                                        ? 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                                        : editForm.phone.length === 10 && editForm.phone.startsWith('0')
                                        ? 'border-emerald-500 ring-1 ring-emerald-500/20 focus:ring-emerald-500'
                                        : 'border-amber-400 ring-1 ring-amber-400/20 focus:ring-amber-500'
                                }`}
                                placeholder="Ví dụ: 0912345678..."
                            />
                        </div>
                    </div>

                    {/* Hàng 3: CCCD (12 số) + Ngày cấp + Nơi cấp (Layout 12 cột) */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-6 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Số CCCD (12 số)
                                </label>
                                <span className={`text-[10px] font-mono font-bold ${
                                    !editForm.cardId ? 'text-slate-400' :
                                    editForm.cardId.length === 12 ? 'text-emerald-600 dark:text-emerald-400' :
                                    'text-amber-500'
                                }`}>
                                    {editForm.cardId ? `${editForm.cardId.length}/12 số` : '12 số'}
                                </span>
                            </div>
                            <input
                                type="text"
                                maxLength={12}
                                value={editForm.cardId}
                                onChange={e => handleEditCccdChange(e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:outline-none font-bold text-slate-700 dark:text-white font-mono ${
                                    !editForm.cardId
                                        ? 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                                        : editForm.cardId.length === 12
                                        ? 'border-emerald-500 ring-1 ring-emerald-500/20 focus:ring-emerald-500'
                                        : 'border-amber-400 ring-1 ring-amber-400/20 focus:ring-amber-500'
                                }`}
                                placeholder="Nhập 12 số CCCD..."
                            />
                        </div>

                        <div className="sm:col-span-3 flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Ngày cấp CCCD
                            </label>
                            <input
                                type="date"
                                value={editForm.cardIdDate}
                                onChange={e => handleEditCardIdDateChange(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white cursor-pointer"
                            />
                        </div>

                        <div className="sm:col-span-3 flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Nơi cấp CCCD
                            </label>
                            <input
                                type="text"
                                placeholder="Cục C06 hoặc Tỉnh/TP..."
                                value={editForm.cardIdPlace}
                                onChange={e => setEditForm(prev => ({ ...prev, cardIdPlace: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 relative z-30">
                        <Combobox<CatalogItem>
                            label="Dân tộc"
                            value={editForm.ethnic}
                            displayValue={item => item?.name || ''}
                            onChange={val => setEditForm(prev => ({ ...prev, ethnic: val }))}
                            options={ethnicities}
                            columns={commonColumns}
                            placeholder="Chọn dân tộc..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5 relative z-20">
                            <Combobox<CatalogItem>
                                label="Tỉnh / Thành phố"
                                value={editForm.provId}
                                displayValue={item => item?.name || ''}
                                onChange={val => setEditForm(prev => ({ ...prev, provId: val, villId: '' }))}
                                options={provinces}
                                columns={commonColumns}
                                placeholder="Chọn tỉnh/thành..."
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 relative z-10">
                            <Combobox<CatalogItem>
                                label="Phường / Xã"
                                value={editForm.villId}
                                displayValue={item => item?.name || ''}
                                onChange={val => setEditForm(prev => ({ ...prev, villId: val }))}
                                options={editWards}
                                columns={commonColumns}
                                placeholder="Chọn phường/xã..."
                                disabled={!editForm.provId}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Địa chỉ thường trú</label>
                        <input
                            type="text"
                            value={editForm.address}
                            onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                            placeholder="Nhập số nhà, tên đường, thôn/xóm..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Họ tên người giám hộ</label>
                            <input
                                type="text"
                                value={editForm.guardianName}
                                onChange={e => setEditForm(prev => ({ ...prev, guardianName: e.target.value.toUpperCase() }))}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Số CCCD người giám hộ</label>
                            <input
                                type="text"
                                value={editForm.guardianCccd}
                                onChange={e => setEditForm(prev => ({ ...prev, guardianCccd: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="bg-slate-50 dark:bg-slate-900/60 px-6 py-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={onSave}
                        className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition cursor-pointer flex items-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Lưu thông tin
                    </button>
                </div>
            </div>
        </div>
    );
};
