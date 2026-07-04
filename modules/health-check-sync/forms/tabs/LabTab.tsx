import React from 'react';
import { useDynamicFormContext } from '../DynamicFormContext';

const LabTab: React.FC = () => {
    const {
        formType,
        labSubTab,
        setLabSubTab,
        paraclinicalItems,
        setParaclinicalItems,
        syncGridToCoreFields,
        kqXnMaiTuy,
        setKqXnMaiTuy,
        kqXnNongDoCon,
        setKqXnNongDoCon,
        kqXnKhac,
        setKqXnKhac,
        chiSoHc,
        setChiSoHc,
        chiSoBachCau,
        setChiSoBachCau,
        chiSoTieuCau,
        setChiSoTieuCau,
        congThucBc,
        setCongThucBc,
        thoiGianHowell,
        setThoiGianHowell,
        cholesterol,
        setCholesterol,
        triglycerid,
        setTriglycerid,
        hdl,
        setHdl,
        ldl,
        setLdl,
        rpr,
        setRpr,
        tpha,
        setTpha,
        hbsag,
        setHbsag,
        hbeag,
        setHbeag,
        hcvab,
        setHcvab,
        havab,
        setHavab,
        hiv,
        setHiv,
        nongDoConMau,
        setNongDoConMau,
        nuocTieuMaTuy,
        setNuocTieuMaTuy,
        nuocTieuAmphetamine,
        setNuocTieuAmphetamine,
        nuocTieuDuong,
        setNuocTieuDuong,
        nuocTieuProtein,
        setNuocTieuProtein,
        nuocTieuKhac,
        setNuocTieuKhac,
        ketQuaChanDoanHinhAnh,
        setKetQuaChanDoanHinhAnh,
        ketQuaDienTim,
        setKetQuaDienTim,
        chucNangHoHap,
        setChucNangHoHap,
        ketQuaSieuAmBung,
        setKetQuaSieuAmBung,
        xnKhac,
        setXnKhac,
        isLocked,
        handleAutofillTab,
        isSyncingParaclinical,
        handleSyncParaclinical,
        hisSyncMessage,
    } = useDynamicFormContext();

    return (
        <div className="space-y-6 animate-fadeIn">
            {hisSyncMessage && (
                <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm border ${
                    hisSyncMessage.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30' 
                        : 'bg-rose-50 text-rose-800 border-rose-250 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/30'
                }`}>
                    <span className="font-extrabold">{hisSyncMessage.type === 'success' ? '✓ Thành công:' : '⚠ Lỗi:'}</span>
                    <span>{hisSyncMessage.text}</span>
                </div>
            )}

            {/* Action Row: Autofill & HIS Sync */}
            {!isLocked && (
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleSyncParaclinical}
                        disabled={isSyncingParaclinical}
                        className="px-4 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-[#0f766e] dark:text-emerald-400 border border-teal-200 dark:border-teal-900/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${isSyncingParaclinical ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67"/>
                        </svg>
                        {isSyncingParaclinical ? 'Đang đồng bộ...' : 'Đồng bộ kết quả từ HIS'}
                    </button>

                    <button
                        type="button"
                        onClick={() => handleAutofillTab('lab')}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-[#0f766e] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Điền nhanh kết quả mặc định (Cận lâm sàng)
                    </button>
                </div>
            )}
            <fieldset disabled={isLocked} className="space-y-6 w-full">
            <div>
                <h4 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">IV.1. Kết quả Cận lâm sàng / Chỉ định dịch vụ từ HIS</h4>
                
                <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                        <button 
                            type="button" 
                            onClick={() => setLabSubTab('XN')}
                            className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider transition-all duration-200 border-r border-slate-200 dark:border-slate-700 ${labSubTab === 'XN' ? 'bg-[#0f766e] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'}`}
                        >
                            🧪 Xét nghiệm (XN)
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setLabSubTab('HA')}
                            className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider transition-all duration-200 border-r border-slate-200 dark:border-slate-700 ${labSubTab === 'HA' ? 'bg-[#0f766e] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'}`}
                        >
                            🖼 Chẩn đoán hình ảnh (HA)
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setLabSubTab('TD')}
                            className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${labSubTab === 'TD' ? 'bg-[#0f766e] text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'}`}
                        >
                            📈 Thăm dò chức năng (TD)
                        </button>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-250 dark:border-slate-750 text-[10px] font-extrabold text-slate-500 uppercase">
                                    <th className="py-2.5 px-3 w-[30%]">Tên dịch vụ/chỉ số</th>
                                    <th className="py-2.5 px-3 w-[20%]">Kết quả</th>
                                    {labSubTab === 'XN' && <th className="py-2.5 px-3 w-[15%]">Đơn vị</th>}
                                    {labSubTab !== 'XN' && <th className="py-2.5 px-3 w-[25%]">Mô tả chi tiết</th>}
                                    <th className="py-2.5 px-3 w-[25%]">Kết luận</th>
                                    <th className="py-2.5 px-3 w-[10%] text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/40">
                                {paraclinicalItems.filter(item => item.type === labSubTab).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-slate-500 italic">
                                            Chưa có dịch vụ nào được nhập cho nhóm này. Nhấp nút thêm bên dưới.
                                        </td>
                                    </tr>
                                ) : (() => {
                                    const cleanSubitem = (sub: any) => (sub || '').trim().toUpperCase();
                                    const filteredAndSorted = paraclinicalItems
                                        .map((item, idx) => ({ ...item, originalIndex: idx }))
                                        .filter(item => item.type === labSubTab)
                                        .sort((a, b) => {
                                            const groupA = a.group_id || '';
                                            const groupB = b.group_id || '';
                                            const compareGroup = groupA.localeCompare(groupB, undefined, { numeric: true, sensitivity: 'base' });
                                            if (compareGroup !== 0) return compareGroup;

                                            if (labSubTab === 'XN') {
                                                const orderA = a.order_id || '';
                                                const orderB = b.order_id || '';
                                                const compareOrder = orderA.localeCompare(orderB, undefined, { numeric: true, sensitivity: 'base' });
                                                if (compareOrder !== 0) return compareOrder;

                                                const pLineA = Number(a.parent_line !== undefined && a.parent_line !== null ? a.parent_line : (a.line_no || 999999));
                                                const pLineB = Number(b.parent_line !== undefined && b.parent_line !== null ? b.parent_line : (b.line_no || 999999));
                                                if (pLineA !== pLineB) return pLineA - pLineB;

                                                const isAsubParent = cleanSubitem(a.subitem) === 'Y';
                                                const isBsubParent = cleanSubitem(b.subitem) === 'Y';
                                                const pCodeA = (isAsubParent ? (a.service_code || '') : (a.parent_code || a.service_code || '')).trim();
                                                const pCodeB = (isBsubParent ? (b.service_code || '') : (b.parent_code || b.service_code || '')).trim();
                                                const comparePCode = pCodeA.localeCompare(pCodeB, undefined, { numeric: true, sensitivity: 'base' });
                                                if (comparePCode !== 0) return comparePCode;

                                                const isParentA = isAsubParent ? 0 : 1;
                                                const isParentB = isBsubParent ? 0 : 1;
                                                if (isParentA !== isParentB) return isParentA - isParentB;

                                                const lineA = Number(a.line_no || 999999);
                                                const lineB = Number(b.line_no || 999999);
                                                if (lineA !== lineB) return lineA - lineB;
                                            } else {
                                                const orderA = a.order_id || '';
                                                const orderB = b.order_id || '';
                                                const compareOrder = orderA.localeCompare(orderB, undefined, { numeric: true, sensitivity: 'base' });
                                                if (compareOrder !== 0) return compareOrder;
                                            }

                                            const nameA = a.service_name || '';
                                            const nameB = b.service_name || '';
                                            return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                                        });

                                    const groups: { name: string, items: typeof filteredAndSorted }[] = [];
                                    filteredAndSorted.forEach(item => {
                                        const name = item.group_name || 'Chưa phân nhóm';
                                        let g = groups.find(x => x.name === name);
                                        if (!g) {
                                            g = { name, items: [] };
                                            groups.push(g);
                                        }
                                        g.items.push(item);
                                    });

                                    return groups.map((g) => {
                                        let lastParentCode = '';
                                        return (
                                            <React.Fragment key={g.name}>
                                                {/* Nhóm Xét Nghiệm Header Row */}
                                                <tr className="bg-slate-100 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700">
                                                    <td colSpan={5} className="py-2.5 px-3 font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                                                        {g.name === 'Chưa phân nhóm' ? 'Chưa phân nhóm (Dịch vụ tự thêm)' : g.name}
                                                    </td>
                                                </tr>
                                                {g.items.flatMap((item) => {
                                                    const elements = [];
                                                    const isXN = labSubTab === 'XN';
                                                    const cleanItemSubitem = (item.subitem || '').trim().toUpperCase();
                                                    const isParent = isXN && cleanItemSubitem === 'Y';
                                                    const hasParent = isXN && item.parent_name && !isParent;
                                                    const currentParentCode = (isParent ? (item.service_code || '') : (hasParent ? (item.parent_code || '') : '')).trim();
                                                    const currentParentName = isParent ? item.service_name : (hasParent ? item.parent_name : '');

                                                    // Render parent group row if it's the first time we see this parent
                                                    if (!isParent && currentParentCode && currentParentCode !== lastParentCode) {
                                                        lastParentCode = currentParentCode;
                                                        elements.push(
                                                            <tr key={`parent-${currentParentCode}`} className="bg-teal-50/40 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 font-bold border-y border-teal-100/30 dark:border-teal-900/20">
                                                                <td colSpan={5} className="py-2 px-3 text-[11px] font-bold">
                                                                    <span className="mr-1.5 text-teal-600 dark:text-teal-400">📂</span> {currentParentName}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    // If this item itself is a parent indicator, we render it as a row with only name, and no inputs/actions for other columns.
                                                    if (isParent) {
                                                        lastParentCode = currentParentCode; // Ensure child items don't trigger header
                                                        elements.push(
                                                            <tr key={item.originalIndex} className="bg-teal-50/20 dark:bg-teal-950/15 font-bold border-y border-teal-100/20 dark:border-teal-900/10 hover:bg-teal-50/40">
                                                                <td className="py-2.5 px-3">
                                                                    <div className="flex items-center text-teal-900 dark:text-teal-300 font-extrabold text-[12px]">
                                                                        <span className="mr-1.5 text-teal-600 dark:text-teal-400">📂</span> {item.service_name}
                                                                    </div>
                                                                </td>
                                                                <td className="py-2.5 px-3"></td>
                                                                {labSubTab === 'XN' && <td className="py-2.5 px-3"></td>}
                                                                {labSubTab !== 'XN' && <td className="py-2.5 px-3"></td>}
                                                                <td className="py-2.5 px-3"></td>
                                                                <td className="py-2.5 px-3 text-center"></td>
                                                            </tr>
                                                        );
                                                        return elements;
                                                    }

                                                    elements.push(
                                                        <tr key={item.originalIndex} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                                                            <td className="py-2 px-1.5">
                                                                <div className="flex items-center">
                                                                    {hasParent && (
                                                                        <span className="text-slate-400 font-mono text-[11px] mr-2 pl-4">↳</span>
                                                                    )}
                                                                    <div className="flex-1 flex flex-col gap-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <input 
                                                                                type="text" 
                                                                                value={item.service_name}
                                                                                onChange={e => {
                                                                                    const updated = [...paraclinicalItems];
                                                                                    updated[item.originalIndex].service_name = e.target.value;
                                                                                    updated[item.originalIndex].index_name = e.target.value;
                                                                                    setParaclinicalItems(updated);
                                                                                }}
                                                                                className={`w-full px-2 py-1.5 border border-slate-300 dark:border-slate-650 rounded bg-transparent text-slate-800 dark:text-white font-medium ${hasParent ? 'text-[11px] text-slate-600 dark:text-slate-350' : ''}`}
                                                                            />
                                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide shrink-0 ${
                                                                                item.is_his_value 
                                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                                                                    : item.order_id 
                                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' 
                                                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                                            }`}>
                                                                                {item.is_his_value 
                                                                                    ? 'Có KQ HIS' 
                                                                                    : item.order_id 
                                                                                    ? 'Chờ KQ' 
                                                                                    : 'Nhập tay'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-2 px-1.5">
                                                                <input 
                                                                    type="text" 
                                                                    value={item.value}
                                                                    onChange={e => {
                                                                        const updated = [...paraclinicalItems];
                                                                        updated[item.originalIndex].value = e.target.value;
                                                                        setParaclinicalItems(updated);
                                                                        syncGridToCoreFields(updated);
                                                                    }}
                                                                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-650 rounded bg-transparent text-slate-800 dark:text-white font-bold"
                                                                />
                                                            </td>
                                                            {labSubTab === 'XN' && (
                                                                <td className="py-2 px-1.5">
                                                                    <input 
                                                                        type="text" 
                                                                        value={item.unit}
                                                                        onChange={e => {
                                                                            const updated = [...paraclinicalItems];
                                                                            updated[item.originalIndex].unit = e.target.value;
                                                                            setParaclinicalItems(updated);
                                                                            syncGridToCoreFields(updated);
                                                                        }}
                                                                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-650 rounded bg-transparent text-slate-800 dark:text-white font-medium"
                                                                    />
                                                                </td>
                                                            )}
                                                            {labSubTab !== 'XN' && (
                                                                <td className="py-2 px-1.5">
                                                                    <input 
                                                                        type="text" 
                                                                        value={item.description || ''}
                                                                        onChange={e => {
                                                                            const updated = [...paraclinicalItems];
                                                                            updated[item.originalIndex].description = e.target.value;
                                                                            setParaclinicalItems(updated);
                                                                            syncGridToCoreFields(updated);
                                                                        }}
                                                                        className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-650 rounded bg-transparent text-slate-800 dark:text-white"
                                                                    />
                                                                </td>
                                                            )}
                                                            <td className="py-2 px-1.5">
                                                                <input 
                                                                    type="text" 
                                                                    value={item.conclusion}
                                                                    onChange={e => {
                                                                        const updated = [...paraclinicalItems];
                                                                        updated[item.originalIndex].conclusion = e.target.value;
                                                                        setParaclinicalItems(updated);
                                                                        syncGridToCoreFields(updated);
                                                                    }}
                                                                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-650 rounded bg-transparent text-slate-800 dark:text-white font-semibold"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-1.5 text-center">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = paraclinicalItems.filter((_, idx) => idx !== item.originalIndex);
                                                                        setParaclinicalItems(updated);
                                                                        syncGridToCoreFields(updated);
                                                                    }}
                                                                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold transition-colors"
                                                                >
                                                                    Xóa
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                    return elements;
                                                })}
                                            </React.Fragment>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>

                        <div className="mt-4 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Tổng số dịch vụ đã nhập:</span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#0f766e]/10 text-[#0f766e] dark:bg-teal-950/40 dark:text-teal-300 border border-[#0f766e]/20">
                                    {paraclinicalItems.filter(item => item.type === labSubTab).length}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const defaultNames: Record<string, string> = {
                                        XN: 'Xét nghiệm máu / Nước tiểu mới',
                                        HA: 'Chẩn đoán hình ảnh mới',
                                        TD: 'Thăm dò chức năng mới'
                                    };
                                    const defaultGroups: Record<string, string> = {
                                        XN: 'A01',
                                        HA: 'B01',
                                        TD: 'C01'
                                    };
                                    const defaultGroupNames: Record<string, string> = {
                                        XN: 'Xét nghiệm',
                                        HA: 'Chẩn đoán hình ảnh',
                                        TD: 'Thăm dò chức năng'
                                    };
                                    const updated = [...paraclinicalItems, {
                                        service_code: `${labSubTab}-${Date.now()}`,
                                        service_name: defaultNames[labSubTab],
                                        index_code: `${labSubTab}-${Date.now()}`,
                                        index_name: defaultNames[labSubTab],
                                        value: '',
                                        unit: labSubTab === 'XN' ? 'g/L' : '',
                                        description: '',
                                        conclusion: 'Bình thường',
                                        group_id: defaultGroups[labSubTab],
                                        group_name: defaultGroupNames[labSubTab],
                                        type: labSubTab
                                    }];
                                    setParaclinicalItems(updated);
                                    syncGridToCoreFields(updated);
                                }}
                                className="px-3.5 py-1.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                            >
                                + Thêm dịch vụ
                            </button>
                        </div>
                    </div>
                </div>

                {formType === '3' ? (
                    <div className="mt-4 p-4 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/20 rounded-xl space-y-4">
                        <h5 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-200/30 pb-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            Xét nghiệm bắt buộc đối với Lái xe (Mẫu 3)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Xét nghiệm Ma túy (4 chất)</label>
                                <select value={kqXnMaiTuy} onChange={e => setKqXnMaiTuy(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                    <option value="">-- Chọn kết quả --</option>
                                    <option value="Âm tính">Âm tính</option>
                                    <option value="Dương tính">Dương tính (Có sử dụng chất kích thích)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Xét nghiệm Nồng độ cồn</label>
                                <input type="text" value={kqXnNongDoCon} onChange={e => setKqXnNongDoCon(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold" placeholder="VD: 0.0 mg/L hoặc Âm tính" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Xét nghiệm cận lâm sàng khác</label>
                                <input type="text" value={kqXnKhac} onChange={e => setKqXnKhac(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold" placeholder="X-quang, Siêu âm..." />
                            </div>
                        </div>
                    </div>
                ) : formType === '5' ? (
                    <div className="mt-4 p-4 bg-teal-50/10 dark:bg-slate-800/60 border border-teal-200/30 dark:border-slate-700/80 rounded-xl space-y-4">
                        <h5 className="text-xs font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-teal-200/20 pb-2">
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                            Xét nghiệm đặc thù Thuyền viên Tàu biển (Mẫu 5)
                        </h5>
                        
                        {/* Sinh hóa máu & Công thức máu bổ sung */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Chỉ số Hồng cầu (RBC)</label>
                                <input type="text" value={chiSoHc} onChange={e => setChiSoHc(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: 4.5 T/L" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Chỉ số Bạch cầu (WBC)</label>
                                <input type="text" value={chiSoBachCau} onChange={e => setChiSoBachCau(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: 7.2 G/L" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Chỉ số Tiểu cầu (PLT)</label>
                                <input type="text" value={chiSoTieuCau} onChange={e => setChiSoTieuCau(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: 250 G/L" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Công thức bạch cầu / T.gian Howell</label>
                                <div className="flex gap-2">
                                    <input type="text" value={congThucBc} onChange={e => setCongThucBc(e.target.value)} className="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Neu 60%..." />
                                    <input type="text" value={thoiGianHowell} onChange={e => setThoiGianHowell(e.target.value)} className="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Howell..." />
                                </div>
                            </div>
                        </div>

                        {/* Mỡ máu (Lipid) */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Cholesterol toàn phần (mmol/L)</label>
                                <input type="text" value={cholesterol} onChange={e => setCholesterol(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Triglycerid (mmol/L)</label>
                                <input type="text" value={triglycerid} onChange={e => setTriglycerid(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">HDL-Cholesterol (mmol/L)</label>
                                <input type="text" value={hdl} onChange={e => setHdl(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">LDL-Cholesterol (mmol/L)</label>
                                <input type="text" value={ldl} onChange={e => setLdl(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                        </div>

                        {/* Huyết thanh / Viêm gan / HIV */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phản ứng giang mai (RPR / TPHA)</label>
                                <div className="flex gap-2">
                                    <select value={rpr} onChange={e => setRpr(e.target.value)} className="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                        <option value="">RPR</option>
                                        <option value="0">RPR (-)</option>
                                        <option value="1">RPR (+)</option>
                                    </select>
                                    <select value={tpha} onChange={e => setTpha(e.target.value)} className="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                        <option value="">TPHA</option>
                                        <option value="0">TPHA (-)</option>
                                        <option value="1">TPHA (+)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Viêm gan B (HBsAg / HBeAg)</label>
                                <div className="flex gap-2">
                                    <select value={hbsag} onChange={e => setHbsag(e.target.value)} className="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                        <option value="">HBsAg</option>
                                        <option value="0">HBsAg (-)</option>
                                        <option value="1">HBsAg (+)</option>
                                    </select>
                                    <select value={hbeag} onChange={e => setHbeag(e.target.value)} className="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                        <option value="">HBeAg</option>
                                        <option value="0">HBeAg (-)</option>
                                        <option value="1">HBeAg (+)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Viêm gan A, C (HAV Ab / HCV Ab)</label>
                                <div className="flex gap-2">
                                    <select value={havab} onChange={e => setHavab(e.target.value)} className="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                        <option value="">HAV</option>
                                        <option value="0">HAV (-)</option>
                                        <option value="1">HAV (+)</option>
                                    </select>
                                    <select value={hcvab} onChange={e => setHcvab(e.target.value)} className="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                        <option value="">HCV</option>
                                        <option value="0">HCV (-)</option>
                                        <option value="1">HCV (+)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">HIV</label>
                                <select value={hiv} onChange={e => setHiv(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                    <option value="">-- Chọn kết quả --</option>
                                    <option value="0">HIV Âm tính (-)</option>
                                    <option value="1">HIV Dương tính (+)</option>
                                </select>
                            </div>
                        </div>

                        {/* Alcohol and urine drugs */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nồng độ cồn trong máu</label>
                                <input type="text" value={nongDoConMau} onChange={e => setNongDoConMau(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: 0" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nước tiểu - Ma túy (4 chất)</label>
                                <select value={nuocTieuMaTuy} onChange={e => setNuocTieuMaTuy(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                    <option value="">-- Chọn kết quả --</option>
                                    <option value="0">Âm tính (-)</option>
                                    <option value="1">Dương tính (+)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nước tiểu - Amphetamine</label>
                                <select value={nuocTieuAmphetamine} onChange={e => setNuocTieuAmphetamine(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                    <option value="">-- Chọn kết quả --</option>
                                    <option value="0">Âm tính (-)</option>
                                    <option value="1">Dương tính (+)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nước tiểu - Đường &amp; Protein</label>
                                <div className="flex gap-2">
                                    <input type="text" value={nuocTieuDuong} onChange={e => setNuocTieuDuong(e.target.value)} className="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Đường..." />
                                    <input type="text" value={nuocTieuProtein} onChange={e => setNuocTieuProtein(e.target.value)} className="w-1/2 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Protein..." />
                                </div>
                            </div>
                        </div>

                        {/* Diagnostics & Imaging */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">X-quang ngực / Chẩn đoán hình ảnh</label>
                                <input type="text" value={ketQuaChanDoanHinhAnh} onChange={e => setKetQuaChanDoanHinhAnh(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Điện tâm đồ (ECG)</label>
                                <input type="text" value={ketQuaDienTim} onChange={e => setKetQuaDienTim(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Thăm dò chức năng hô hấp (Spirometry)</label>
                                <input type="text" value={chucNangHoHap} onChange={e => setChucNangHoHap(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Siêu âm ổ bụng</label>
                                <input type="text" value={ketQuaSieuAmBung} onChange={e => setKetQuaSieuAmBung(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Xét nghiệm nước tiểu khác</label>
                                <input type="text" value={nuocTieuKhac} onChange={e => setNuocTieuKhac(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Xét nghiệm khác</label>
                                <input type="text" value={xnKhac} onChange={e => setXnKhac(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Xét nghiệm/Chẩn đoán hình ảnh bổ sung</label>
                        <input type="text" value={kqXnKhac} onChange={e => setKqXnKhac(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: X-quang phổi thẳng bình thường..." />
                    </div>
                )}
            </div>
            </fieldset>
        </div>
    );
};

export default LabTab;
