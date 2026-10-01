import React from 'react';
import { UserGroupIcon } from '../../../../../components/Icons';
import Combobox from '../../../../../components/ui/Combobox';
import { CatalogItem } from '../../../../../services/catalogService';

interface EmployeeEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    employeeFormMode: 'ADD' | 'EDIT';
    employeeFormData: {
        fullName: string;
        surname?: string;
        midname?: string;
        firstname?: string;
        birth_date: string;
        sex: string;
        cccd: string;
        cardIdDate: string;
        cardIdPlace: string;
        phone: string;
        ethnic: string;
        provId: string;
        villId: string | null;
        address: string;
        note: string;
    };
    setEmployeeFormData: React.Dispatch<React.SetStateAction<any>>;
    handleFullNameChange: (val: string) => void;
    handlePhoneChange: (val: string) => void;
    handleCccdChange: (val: string) => void;
    handleCardIdDateChange: (val: string) => void;
    ethnicities: CatalogItem[];
    provinces: CatalogItem[];
    editWards: CatalogItem[];
    commonColumns: Array<{ key: string; label: string; width?: string }>;
}

export const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    employeeFormMode,
    employeeFormData,
    setEmployeeFormData,
    handleFullNameChange,
    handlePhoneChange,
    handleCccdChange,
    handleCardIdDateChange,
    ethnicities,
    provinces,
    editWards,
    commonColumns
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 overflow-hidden animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
                            <UserGroupIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                {employeeFormMode === 'ADD' ? 'Thêm mới nhân viên' : 'Sửa thông tin nhân viên'}
                            </h5>
                            <p className="text-[11px] text-slate-500">Nhập thông tin nhân viên khám sức khỏe</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar text-xs flex-1">
                        {/* Hàng 1: Họ và tên (2/3) + Giới tính (1/3) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                        Họ và tên *
                                    </label>
                                    {employeeFormData.fullName && (
                                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold font-mono">
                                            {employeeFormData.surname && `Họ: ${employeeFormData.surname}`} {employeeFormData.firstname && `| Tên: ${employeeFormData.firstname}`}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={employeeFormData.fullName}
                                    onChange={(e) => handleFullNameChange(e.target.value)}
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
                                    value={employeeFormData.sex}
                                    onChange={(e) => setEmployeeFormData((prev: any) => ({ ...prev, sex: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white cursor-pointer"
                                >
                                    <option value="M">Nam</option>
                                    <option value="F">Nữ</option>
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
                                    value={employeeFormData.birth_date}
                                    onChange={(e) => setEmployeeFormData((prev: any) => ({ ...prev, birth_date: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                        Số điện thoại liên hệ
                                    </label>
                                    <span className={`text-[10px] font-mono font-bold ${
                                        !employeeFormData.phone ? 'text-slate-400' :
                                        employeeFormData.phone.length === 10 && employeeFormData.phone.startsWith('0') ? 'text-emerald-600 dark:text-emerald-400' :
                                        'text-amber-500'
                                    }`}>
                                        {employeeFormData.phone ? `${employeeFormData.phone.length}/10 số` : '10 số'}
                                    </span>
                                </div>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    value={employeeFormData.phone}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:outline-none font-bold text-slate-700 dark:text-white font-mono ${
                                        !employeeFormData.phone
                                            ? 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                                            : employeeFormData.phone.length === 10 && employeeFormData.phone.startsWith('0')
                                            ? 'border-emerald-500 ring-1 ring-emerald-500/20 focus:ring-emerald-500'
                                            : 'border-amber-400 ring-1 ring-amber-400/20 focus:ring-amber-500'
                                    }`}
                                    placeholder="Ví dụ: 0912345678..."
                                />
                            </div>
                        </div>

                        {/* Hàng 3: CCCD (12 số) + Ngày cấp + Nơi cấp (Layout 12 cột thoáng đãng) */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-6 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                        Số CCCD (12 số)
                                    </label>
                                    <span className={`text-[10px] font-mono font-bold ${
                                        !employeeFormData.cccd ? 'text-slate-400' :
                                        employeeFormData.cccd.length === 12 ? 'text-emerald-600 dark:text-emerald-400' :
                                        'text-amber-500'
                                    }`}>
                                        {employeeFormData.cccd ? `${employeeFormData.cccd.length}/12 số` : '12 số'}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    maxLength={12}
                                    value={employeeFormData.cccd}
                                    onChange={(e) => handleCccdChange(e.target.value)}
                                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:outline-none font-bold text-slate-700 dark:text-white font-mono ${
                                        !employeeFormData.cccd
                                            ? 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                                            : employeeFormData.cccd.length === 12
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
                                    value={employeeFormData.cardIdDate}
                                    onChange={(e) => handleCardIdDateChange(e.target.value)}
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
                                    value={employeeFormData.cardIdPlace}
                                    onChange={(e) => setEmployeeFormData((prev: any) => ({ ...prev, cardIdPlace: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 relative z-30">
                            <Combobox<CatalogItem>
                                label="Dân tộc"
                                value={employeeFormData.ethnic}
                                displayValue={item => item?.name || ''}
                                onChange={val => setEmployeeFormData((prev: any) => ({ ...prev, ethnic: val }))}
                                options={ethnicities}
                                columns={commonColumns}
                                placeholder="Chọn dân tộc..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5 relative z-20">
                                <Combobox<CatalogItem>
                                    label="Tỉnh / Thành phố"
                                    value={employeeFormData.provId}
                                    displayValue={item => item?.name || ''}
                                    onChange={val => setEmployeeFormData((prev: any) => ({ ...prev, provId: val, villId: null }))}
                                    options={provinces}
                                    columns={commonColumns}
                                    placeholder="Chọn tỉnh/thành..."
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 relative z-10">
                                <Combobox<CatalogItem>
                                    label="Phường / Xã"
                                    value={employeeFormData.villId}
                                    displayValue={item => item?.name || ''}
                                    onChange={val => setEmployeeFormData((prev: any) => ({ ...prev, villId: val }))}
                                    options={editWards}
                                    columns={commonColumns}
                                    placeholder="Chọn phường/xã..."
                                    disabled={!employeeFormData.provId}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Địa chỉ thường trú</label>
                            <input
                                type="text"
                                value={employeeFormData.address}
                                onChange={(e) => setEmployeeFormData((prev: any) => ({ ...prev, address: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                placeholder="Nhập số nhà, tên đường, thôn/xóm..."
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ghi chú</label>
                            <textarea
                                value={employeeFormData.note}
                                onChange={(e) => setEmployeeFormData((prev: any) => ({ ...prev, note: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white h-16 resize-none"
                                placeholder="Gói dịch vụ bổ sung, ghi chú sức khỏe..."
                            />
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
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
