import React from 'react';
import { UserGroupIcon, PlusIcon } from '../../../../../components/Icons';
import Combobox from '../../../../../components/ui/Combobox';
import { CatalogItem } from '../../../../../services/catalogService';

interface ReceptionAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    contracts: any[];
    addEmployeeContractId: string;
    setAddEmployeeContractId: (val: string) => void;
    addEmployeeFormData: {
        fullName: string;
        surname: string;
        midname: string;
        firstname: string;
        birth_date: string;
        sex: string;
        cccd: string;
        cardIdDate: string;
        cardIdPlace: string;
        phone: string;
        ethnic: string;
        provId: string;
        distId: string;
        villId: string;
        address: string;
        note: string;
        guardianName: string;
        guardianCccd: string;
    };
    setAddEmployeeFormData: React.Dispatch<React.SetStateAction<any>>;
    handleAddFullNameChange: (val: string) => void;
    handleAddPhoneChange: (val: string) => void;
    handleAddCccdChange: (val: string) => void;
    handleAddCardIdDateChange: (val: string) => void;
    ethnicities: CatalogItem[];
    provinces: CatalogItem[];
    addEmployeeWards: CatalogItem[];
    commonColumns: Array<{ key: string; label: string; width?: string }>;
}

export const ReceptionAddModal: React.FC<ReceptionAddModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    contracts,
    addEmployeeContractId,
    setAddEmployeeContractId,
    addEmployeeFormData,
    setAddEmployeeFormData,
    handleAddFullNameChange,
    handleAddPhoneChange,
    handleAddCccdChange,
    handleAddCardIdDateChange,
    ethnicities,
    provinces,
    addEmployeeWards,
    commonColumns,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 overflow-hidden animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[90vh] animate-zoom-in">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
                            <UserGroupIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                Thêm mới nhân viên vào gói khám
                            </h5>
                            <p className="text-[11px] text-slate-500">Nhập thông tin nhân viên để tiếp đón ngay</p>
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
                        {/* Chọn gói khám / Hợp đồng */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Gói khám đoàn / Hợp đồng *</label>
                            <select
                                required
                                value={addEmployeeContractId}
                                onChange={(e) => setAddEmployeeContractId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white cursor-pointer"
                            >
                                <option value="">-- Chọn gói khám / hợp đồng tiếp nhận --</option>
                                {contracts.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Hàng 1: Họ và tên (2/3) + Giới tính (1/3) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                        Họ và tên *
                                    </label>
                                    {addEmployeeFormData.fullName && (
                                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold font-mono">
                                            {addEmployeeFormData.surname && `Họ: ${addEmployeeFormData.surname}`} {addEmployeeFormData.firstname && `| Tên: ${addEmployeeFormData.firstname}`}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={addEmployeeFormData.fullName}
                                    onChange={(e) => handleAddFullNameChange(e.target.value)}
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
                                    value={addEmployeeFormData.sex}
                                    onChange={(e) => setAddEmployeeFormData(prev => ({ ...prev, sex: e.target.value }))}
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
                                    value={addEmployeeFormData.birth_date}
                                    onChange={(e) => setAddEmployeeFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                        Số điện thoại liên hệ
                                    </label>
                                    <span className={`text-[10px] font-mono font-bold ${
                                        !addEmployeeFormData.phone ? 'text-slate-400' :
                                        addEmployeeFormData.phone.length === 10 && addEmployeeFormData.phone.startsWith('0') ? 'text-emerald-600 dark:text-emerald-400' :
                                        'text-amber-500'
                                    }`}>
                                        {addEmployeeFormData.phone ? `${addEmployeeFormData.phone.length}/10 số` : '10 số'}
                                    </span>
                                </div>
                                <input
                                    type="tel"
                                    maxLength={10}
                                    value={addEmployeeFormData.phone}
                                    onChange={(e) => handleAddPhoneChange(e.target.value)}
                                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:outline-none font-bold text-slate-700 dark:text-white font-mono ${
                                        !addEmployeeFormData.phone
                                            ? 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                                            : addEmployeeFormData.phone.length === 10 && addEmployeeFormData.phone.startsWith('0')
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
                                        !addEmployeeFormData.cccd ? 'text-slate-400' :
                                        addEmployeeFormData.cccd.length === 12 ? 'text-emerald-600 dark:text-emerald-400' :
                                        'text-amber-500'
                                    }`}>
                                        {addEmployeeFormData.cccd ? `${addEmployeeFormData.cccd.length}/12 số` : '12 số'}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    maxLength={12}
                                    value={addEmployeeFormData.cccd}
                                    onChange={(e) => handleAddCccdChange(e.target.value)}
                                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:outline-none font-bold text-slate-700 dark:text-white font-mono ${
                                        !addEmployeeFormData.cccd
                                            ? 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                                            : addEmployeeFormData.cccd.length === 12
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
                                    value={addEmployeeFormData.cardIdDate}
                                    onChange={e => handleAddCardIdDateChange(e.target.value)}
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
                                    value={addEmployeeFormData.cardIdPlace}
                                    onChange={e => setAddEmployeeFormData(prev => ({ ...prev, cardIdPlace: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 relative z-30">
                            <Combobox<CatalogItem>
                                label="Dân tộc"
                                value={addEmployeeFormData.ethnic}
                                displayValue={item => item?.name || ''}
                                onChange={val => setAddEmployeeFormData(prev => ({ ...prev, ethnic: val }))}
                                options={ethnicities}
                                columns={commonColumns}
                                placeholder="Chọn dân tộc..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5 relative z-20">
                                <Combobox<CatalogItem>
                                    label="Tỉnh / Thành phố"
                                    value={addEmployeeFormData.provId}
                                    displayValue={item => item?.name || ''}
                                    onChange={val => setAddEmployeeFormData(prev => ({ ...prev, provId: val, villId: '' }))}
                                    options={provinces}
                                    columns={commonColumns}
                                    placeholder="Chọn tỉnh/thành..."
                                />
                            </div>
                            <div className="flex flex-col gap-1.5 relative z-10">
                                <Combobox<CatalogItem>
                                    label="Phường / Xã"
                                    value={addEmployeeFormData.villId}
                                    displayValue={item => item?.name || ''}
                                    onChange={val => setAddEmployeeFormData(prev => ({ ...prev, villId: val }))}
                                    options={addEmployeeWards}
                                    columns={commonColumns}
                                    placeholder="Chọn phường/xã..."
                                    disabled={!addEmployeeFormData.provId}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Địa chỉ thường trú</label>
                            <input
                                type="text"
                                value={addEmployeeFormData.address}
                                onChange={e => setAddEmployeeFormData(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                placeholder="Nhập số nhà, tên đường, thôn/xóm..."
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ghi chú</label>
                            <textarea
                                value={addEmployeeFormData.note}
                                onChange={e => setAddEmployeeFormData(prev => ({ ...prev, note: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white h-16 resize-none"
                                placeholder="Ghi chú sức khỏe, gói bổ sung..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Họ tên người giám hộ</label>
                                <input
                                    type="text"
                                    value={addEmployeeFormData.guardianName}
                                    onChange={e => setAddEmployeeFormData(prev => ({ ...prev, guardianName: e.target.value.toUpperCase() }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Số CCCD người giám hộ</label>
                                <input
                                    type="text"
                                    value={addEmployeeFormData.guardianCccd}
                                    onChange={e => setAddEmployeeFormData(prev => ({ ...prev, guardianCccd: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 px-6 py-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/60">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/10 transition cursor-pointer flex items-center gap-1.5"
                        >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Lưu & Thêm vào gói
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
