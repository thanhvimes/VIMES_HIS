import React, { useState } from 'react';
import { useDynamicFormContext } from '../DynamicFormContext';
import { useSession } from '../../../../contexts/SessionContext';
import { toast } from 'sonner';
import Combobox from '../../../../components/ui/Combobox';

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
        specialtyMetadata,
        setSpecialtyMetadata,
        doctors,
        handleSubmit,
    } = useDynamicFormContext();

    const { user } = useSession();

    // Result Entry Modal State for CDHA/TDCN
    const [resultModal, setResultModal] = useState<{
        isOpen: boolean;
        itemIndex: number;
        serviceName: string;
        value: string;
        description: string;
        conclusion: string;
    }>({
        isOpen: false,
        itemIndex: -1,
        serviceName: '',
        value: '',
        description: '',
        conclusion: ''
    });

    const handleOpenResultModal = (item: any) => {
        setResultModal({
            isOpen: true,
            itemIndex: item.originalIndex,
            serviceName: item.service_name || '',
            value: item.value || '',
            description: item.description || '',
            conclusion: item.conclusion || ''
        });
    };

    const quickTemplates: Record<string, { value: string; description: string; conclusion: string }[]> = {
        general: [
            {
                value: 'Bình thường',
                description: 'Các cấu trúc khảo sát bình thường, không phát hiện hình ảnh bệnh lý.',
                conclusion: 'Hiện tại chưa phát hiện bất thường.'
            }
        ],
        imaging: [
            {
                value: 'Bình thường',
                description: 'Siêu âm ổ bụng tổng quát:\n- Gan: Kích thước bình thường, nhu mô đều, không có khối khu trú.\n- Mật: Túi mật không to, thành mỏng, không có sỏi.\n- Tụy, Lách: Cấu trúc bình thường, không to.\n- Thận hai bên: Vị trí và kích thước bình thường, đài bể thận không giãn, không sỏi.\n- Bàng quang: Thành mỏng, nước tiểu trong.\n- Tiền liệt tuyến (nam) / Tử cung phần phụ (nữ): Không phát hiện bất thường.\n- Không có dịch tự do trong ổ bụng.',
                conclusion: 'Siêu âm ổ bụng tổng quát chưa phát hiện hình ảnh bệnh lý.'
            },
            {
                value: 'Bình thường',
                description: 'X-quang phổi thẳng:\n- Bóng tim không to, chỉ số tim ngực bình thường.\n- Trường phổi hai bên sáng, không thấy tổn thương khu trú.\n- Hai góc sườn hoành nhọn, không có dịch màng phổi.\n- Các xương sườn và mô mềm thành ngực bình thường.',
                conclusion: 'Hình ảnh tim phổi bình thường.'
            }
        ],
        functional: [
            {
                value: 'Bình thường',
                description: 'Điện tâm đồ (ECG):\n- Nhịp xoang đều, tần số: 72 lần/phút.\n- Trục trung gian.\n- Không có rối loạn dẫn truyền hoặc biến đổi ST-T.',
                conclusion: 'Điện tâm đồ bình thường.'
            },
            {
                value: 'Bình thường',
                description: 'Đo chức năng hô hấp (Spiro):\n- Dung tích sống (VC) và dung tích sống gắng sức (FVC) trong giới hạn bình thường.\n- Chỉ số Gaensler (FEV1/FVC) > 75%.\n- Không phát hiện hội chứng hạn chế hay tắc nghẽn.',
                conclusion: 'Chức năng thông khí phổi bình thường.'
            }
        ]
    };

    const safeMetadata = specialtyMetadata || {};
    const labMetadata = { ...(safeMetadata.lab || { doctorId: '', status: 'CHUA_KHAM' }) };
    
    if (!labMetadata.doctorId && user) {
        labMetadata.doctorId = user.userId || '';
        labMetadata.doctorName = user.name || '';
    }
    
    const doctorsList = doctors || [];

    const handleAction = (action: 'MỞ_KHÁM' | 'DUYỆT' | 'MỞ_KHÓA' | 'THOÁT') => {
        const payload = { ...labMetadata, updatedAt: new Date().toISOString() };
        if (action === 'MỞ_KHÁM') {
            payload.status = 'ĐANG_KHÁM';
            payload.doctorId = user?.userId || '';
            payload.doctorName = user?.name || '';
            
            setSpecialtyMetadata(prev => ({
                ...prev,
                lab: payload
            }));
        } else if (action === 'DUYỆT') {
            payload.status = 'ĐÃ_DUYỆT';
            
            setSpecialtyMetadata(prev => {
                const updated = {
                    ...prev,
                    lab: payload
                };
                setTimeout(() => {
                    handleSubmit();
                }, 100);
                return updated;
            });
        } else if (action === 'MỞ_KHÓA') {
            payload.status = 'ĐANG_KHÁM';
            
            setSpecialtyMetadata(prev => ({
                ...prev,
                lab: payload
            }));
        } else if (action === 'THOÁT') {
            payload.status = 'CHUA_KHAM';
            
            setSpecialtyMetadata(prev => ({
                ...prev,
                lab: payload
            }));
        }
    };

    const isTabLocked = isLocked || (labMetadata.status !== 'ĐANG_KHÁM' && labMetadata.status !== 'ĐÃ_KHÁM');

    const doctorColumns = [
        { key: 'id', label: 'Mã người dùng (su_userid)', width: '180px' },
        { key: 'name', label: 'Họ tên bác sĩ' }
    ];

    const renderBadge = () => {
        switch (labMetadata.status) {
            case 'ĐANG_KHÁM': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đang khám</span>;
            case 'ĐÃ_KHÁM': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đã khám</span>;
            case 'ĐÃ_DUYỆT': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Đã duyệt</span>;
            default: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Chưa khám</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Quy trình phê duyệt tab Cận lâm sàng */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl mb-4 gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-[#0f766e] dark:text-teal-400 uppercase tracking-wide">
                        Quy trình phê duyệt Cận lâm sàng
                    </span>
                    {renderBadge()}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500">Người nhập liệu:</label>
                        <Combobox
                            value={labMetadata.doctorId}
                            options={doctorsList}
                            columns={doctorColumns}
                            onChange={(val, item) => {
                                setSpecialtyMetadata(prev => ({
                                    ...prev,
                                    lab: {
                                        ...labMetadata,
                                        doctorId: val,
                                        doctorName: item?.name || '',
                                        updatedAt: new Date().toISOString()
                                    }
                                }));
                            }}
                            disabled={isTabLocked}
                            placeholder="-- Chọn bác sĩ --"
                            className="min-w-[250px]"
                        />
                    </div>
                    
                    {labMetadata.status === 'CHUA_KHAM' || !labMetadata.status ? (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÁM')}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm active:scale-95 transition cursor-pointer"
                        >
                            Khám
                        </button>
                    ) : (labMetadata.status === 'ĐANG_KHÁM' || labMetadata.status === 'ĐÃ_KHÁM') ? (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleAction('DUYỆT')}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm active:scale-95 transition cursor-pointer"
                            >
                                Duyệt
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAction('THOÁT')}
                                className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 shadow-sm active:scale-95 transition cursor-pointer"
                            >
                                Thoát
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÓA')}
                            className="px-4 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 shadow-sm active:scale-95 transition cursor-pointer"
                        >
                            Mở khóa
                        </button>
                    )}
                </div>
            </div>

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
            {!isTabLocked && (
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
            <fieldset disabled={isTabLocked} className="space-y-6 w-full">
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
                                                                                    updated[item.originalIndex].user_edited = true;
                                                                                    setParaclinicalItems(updated);
                                                                                }}
                                                                                className={`w-full px-2 py-1.5 border border-slate-300 dark:border-slate-650 rounded bg-transparent text-slate-800 dark:text-white font-medium ${hasParent ? 'text-[11px] text-slate-600 dark:text-slate-350' : ''}`}
                                                                            />
                                                                            {item.user_edited && (
                                                                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/30 shrink-0">
                                                                                    Đã sửa
                                                                                </span>
                                                                            )}
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
                                                                        updated[item.originalIndex].user_edited = true;
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
                                                                            updated[item.originalIndex].user_edited = true;
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
                                                                            updated[item.originalIndex].user_edited = true;
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
                                                                        updated[item.originalIndex].user_edited = true;
                                                                        setParaclinicalItems(updated);
                                                                        syncGridToCoreFields(updated);
                                                                    }}
                                                                    className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-650 rounded bg-transparent text-slate-800 dark:text-white font-semibold"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-1.5 text-center space-x-1.5">
                                                                {labSubTab !== 'XN' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenResultModal(item)}
                                                                        className="px-2 py-1 bg-teal-605 hover:bg-[#0d645c] text-white rounded text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-0.5 active:scale-95"
                                                                        style={{ backgroundColor: '#0f766e' }}
                                                                    >
                                                                        Nhập KQ
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = paraclinicalItems.filter((_, idx) => idx !== item.originalIndex);
                                                                        setParaclinicalItems(updated);
                                                                        syncGridToCoreFields(updated);
                                                                    }}
                                                                    className="px-2 py-1 bg-red-500 hover:bg-red-650 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
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
                                        type: labSubTab,
                                        user_edited: true
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

                {(formType === 'driver' || formType === 'mau3-driver') ? (
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

            {/* Result Entry Modal for CDHA/TDCN */}
            {resultModal.isOpen && (
                <div 
                    className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-205"
                    style={{ zIndex: 110 }}
                >
                    <div className="bg-white dark:bg-slate-905 rounded-[2rem] max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden transform scale-100 transition-all duration-300 animate-in zoom-in-95 duration-200" style={{ backgroundColor: '#ffffff' }}>
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 font-bold text-lg">
                                    📝
                                </div>
                                <div className="flex flex-col text-left">
                                    <h5 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Nhập kết quả cận lâm sàng
                                    </h5>
                                    <span className="text-[11px] font-bold text-[#0f766e] dark:text-teal-400 text-left">
                                        {resultModal.serviceName}
                                    </span>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 flex flex-col gap-4 text-xs text-left">
                            {/* Quick Templates Selection */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Chọn nhanh mẫu kết quả (HIS Templates)</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const t = quickTemplates.general[0];
                                            setResultModal(prev => ({ ...prev, value: t.value, description: t.description, conclusion: t.conclusion }));
                                        }}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition active:scale-95 cursor-pointer"
                                    >
                                        📄 Mẫu chung
                                    </button>
                                    {resultModal.serviceName.toLowerCase().includes('siêu âm') && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const t = quickTemplates.imaging[0];
                                                setResultModal(prev => ({ ...prev, value: t.value, description: t.description, conclusion: t.conclusion }));
                                            }}
                                            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-350 rounded-lg font-bold transition active:scale-95 cursor-pointer border border-teal-200/50"
                                        >
                                            🔍 Mẫu Siêu âm bụng
                                        </button>
                                    )}
                                    {(resultModal.serviceName.toLowerCase().includes('x-quang') || resultModal.serviceName.toLowerCase().includes('x quang') || resultModal.serviceName.toLowerCase().includes('chụp')) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const t = quickTemplates.imaging[1];
                                                setResultModal(prev => ({ ...prev, value: t.value, description: t.description, conclusion: t.conclusion }));
                                            }}
                                            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-350 rounded-lg font-bold transition active:scale-95 cursor-pointer border border-teal-200/50"
                                        >
                                            🩻 Mẫu X-quang phổi
                                        </button>
                                    )}
                                    {(resultModal.serviceName.toLowerCase().includes('điện tâm đồ') || resultModal.serviceName.toLowerCase().includes('điện tim')) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const t = quickTemplates.functional[0];
                                                setResultModal(prev => ({ ...prev, value: t.value, description: t.description, conclusion: t.conclusion }));
                                            }}
                                            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-350 rounded-lg font-bold transition active:scale-95 cursor-pointer border border-teal-200/50"
                                        >
                                            ⚡ Mẫu Điện tim (ECG)
                                        </button>
                                    )}
                                    {(resultModal.serviceName.toLowerCase().includes('hô hấp') || resultModal.serviceName.toLowerCase().includes('phổi')) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const t = quickTemplates.functional[1];
                                                setResultModal(prev => ({ ...prev, value: t.value, description: t.description, conclusion: t.conclusion }));
                                            }}
                                            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-350 rounded-lg font-bold transition active:scale-95 cursor-pointer border border-teal-200/50"
                                        >
                                            🫁 Mẫu Chức năng hô hấp
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Kết quả (Tóm tắt) *</label>
                                    <input
                                        type="text"
                                        required
                                        value={resultModal.value}
                                        onChange={(e) => setResultModal(prev => ({ ...prev, value: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                        placeholder="Ví dụ: Bình thường"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Kết luận *</label>
                                    <input
                                        type="text"
                                        required
                                        value={resultModal.conclusion}
                                        onChange={(e) => setResultModal(prev => ({ ...prev, conclusion: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700 dark:text-white"
                                        placeholder="Ví dụ: Chưa phát hiện bất thường"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 text-left">
                                <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Mô tả chi tiết kết quả khám (Nội dung chính)</label>
                                <textarea
                                    value={resultModal.description}
                                    onChange={(e) => setResultModal(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-700 dark:text-white font-medium h-48 resize-none leading-relaxed"
                                    placeholder="Gan, Mật, Tụy, Lách, Thận... bình thường."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const updated = [...paraclinicalItems];
                                    const idx = resultModal.itemIndex;
                                    if (idx >= 0 && idx < updated.length) {
                                        updated[idx].value = resultModal.value;
                                        updated[idx].description = resultModal.description;
                                        updated[idx].conclusion = resultModal.conclusion;
                                        updated[idx].user_edited = true;
                                        setParaclinicalItems(updated);
                                        syncGridToCoreFields(updated);
                                        toast.success("Cập nhật kết quả thành công!");
                                    }
                                    setResultModal(prev => ({ ...prev, isOpen: false }));
                                }}
                                className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md shadow-teal-500/10 cursor-pointer active:scale-95"
                            >
                                Lưu kết quả
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabTab;
