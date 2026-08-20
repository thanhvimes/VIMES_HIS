import React, { useState } from 'react';
import { useDynamicFormContext } from '../DynamicFormContext';
import { useSession } from '../../../../contexts/SessionContext';
import { toast } from 'sonner';
import Combobox from '../../../../components/ui/Combobox';
import { healthCheckService } from '../../../../services/healthCheckService';
import { SearchIcon, PlusIcon } from '../../../../components/Icons';

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
        docNo,
        patientId,
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

    // Add Service from Catalog Modal State
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
    const [serviceGroups, setServiceGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [groupFilterType, setGroupFilterType] = useState<'ALL' | 'XN' | 'HA' | 'TD'>('ALL');
    const [groupServices, setGroupServices] = useState<any[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [isLoadingGroupServices, setIsLoadingGroupServices] = useState(false);
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');

    // Helper phân loại nhóm theo tiền tố mã nhóm HIS
    const getGroupCategory = (groupId: string): 'XN' | 'HA' | 'TD' => {
        const id = String(groupId || '').trim().toUpperCase();
        if (id.startsWith('B1') || id.startsWith('A')) return 'XN';
        if (id.startsWith('B2') || id.startsWith('B0') || id.startsWith('C')) return 'HA';
        if (id.startsWith('B3') || id.startsWith('B4') || id.startsWith('B5') || id.startsWith('D')) return 'TD';
        return 'XN';
    };

    // Danh sách nhóm dịch vụ đã qua bộ lọc loại (ALL / XN / HA / TD)
    const filteredServiceGroups = serviceGroups.filter(g => {
        if (groupFilterType === 'ALL') return true;
        return getGroupCategory(g.id) === groupFilterType;
    });

    // Pending selected services (Buffer trước khi nhấn "Áp dụng")
    interface PendingServiceItem {
        item_id: string;
        code: string;
        name: string;
        unit: string;
        price: number;
        qty: number;
        note: string;
        group_id: string;
        group_name: string;
        type: 'XN' | 'HA' | 'TD';
    }
    const [pendingServices, setPendingServices] = useState<PendingServiceItem[]>([]);
    const [isApplyingHis, setIsApplyingHis] = useState(false);

    const handleOpenAddServiceModal = async () => {
        setIsAddServiceModalOpen(true);
        setPendingServices([]); // reset buffer khi mở modal
        setServiceSearchTerm('');
        
        // Tự động chọn tab phân loại tương ứng với sub-tab hiện tại của form
        const initialType: 'ALL' | 'XN' | 'HA' | 'TD' = labSubTab === 'HA' ? 'HA' : labSubTab === 'TD' ? 'TD' : 'XN';
        setGroupFilterType(initialType);

        if (serviceGroups.length === 0) {
            setIsLoadingGroups(true);
            try {
                const groups = await healthCheckService.getServiceGroups();
                setServiceGroups(groups);
                const matchingGroups = groups.filter((g: any) => getGroupCategory(g.id) === initialType);
                const targetGroup = matchingGroups[0] || groups[0];
                if (targetGroup) {
                    setSelectedGroup(targetGroup.id);
                    loadServicesByGroup(targetGroup.id);
                }
            } catch (err) {
                console.error("Failed to load service groups:", err);
            } finally {
                setIsLoadingGroups(false);
            }
        } else {
            const matchingGroups = serviceGroups.filter(g => getGroupCategory(g.id) === initialType);
            const targetGroup = matchingGroups[0] || serviceGroups[0];
            if (targetGroup) {
                setSelectedGroup(targetGroup.id);
                loadServicesByGroup(targetGroup.id);
            }
        }
    };

    const handleSelectFilterType = (type: 'ALL' | 'XN' | 'HA' | 'TD') => {
        setGroupFilterType(type);
        setServiceSearchTerm('');
        const matching = serviceGroups.filter(g => type === 'ALL' || getGroupCategory(g.id) === type);
        if (matching.length > 0) {
            const first = matching[0];
            setSelectedGroup(first.id);
            loadServicesByGroup(first.id);
        }
    };

    const loadServicesByGroup = async (groupId: string) => {
        setIsLoadingGroupServices(true);
        try {
            const svcs = await healthCheckService.getServicesByGroup(groupId);
            setGroupServices(svcs);
        } catch (err) {
            console.error("Failed to load services in group:", err);
        } finally {
            setIsLoadingGroupServices(false);
        }
    };

    // Đưa dịch vụ vào danh sách chờ (Pending List)
    const handleQueueService = (svc: any) => {
        const code = String(svc.item_id || svc.id || '').trim();
        if (!code) return;
        
        if (pendingServices.some(p => p.code === code)) {
            // Nếu đã có thì tăng số lượng lên 1
            handleUpdatePendingQty(code, 1);
            toast.success(`Đã tăng số lượng "${svc.name}" lên +1.`);
            return;
        }

        const selectedGroupName = serviceGroups.find(g => g.id === selectedGroup)?.name || '';
        const itemGroupId = selectedGroup || (labSubTab === 'XN' ? 'B1100' : labSubTab === 'HA' ? 'B2100' : 'B4100');
        const type = svc.type || (itemGroupId.startsWith('B1') || itemGroupId.startsWith('A') ? 'XN' : (itemGroupId.startsWith('B2') || itemGroupId.startsWith('B3') ? 'HA' : 'TD'));

        const newPending: PendingServiceItem = {
            item_id: code,
            code: code,
            name: svc.name || 'Dịch vụ kỹ thuật',
            unit: svc.unit || (type === 'XN' ? 'g/L' : ''),
            price: parseFloat(svc.price || 0),
            qty: 1,
            note: '',
            group_id: itemGroupId,
            group_name: selectedGroupName || (type === 'XN' ? 'Xét nghiệm' : type === 'HA' ? 'Chẩn đoán hình ảnh' : 'Thăm dò chức năng'),
            type: type as 'XN' | 'HA' | 'TD'
        };

        setPendingServices(prev => [...prev, newPending]);
    };

    const handleRemovePending = (code: string) => {
        setPendingServices(prev => prev.filter(p => p.code !== code));
    };

    const handleClearAllPending = () => {
        setPendingServices([]);
    };

    const handleUpdatePendingQty = (code: string, delta: number) => {
        setPendingServices(prev => prev.map(p => {
            if (p.code === code) {
                const newQty = Math.max(1, p.qty + delta);
                return { ...p, qty: newQty };
            }
            return p;
        }));
    };

    // Nhấn "Áp dụng" -> Mới chính thức gọi hàm kê vào HIS Core và cập nhật sang KSK
    const handleApplySelectedServices = async () => {
        if (pendingServices.length === 0) {
            toast.warning('Vui lòng chọn ít nhất 1 dịch vụ kỹ thuật trước khi nhấn "Áp dụng".');
            return;
        }

        setIsApplyingHis(true);
        try {
            if (docNo) {
                const orderRes = await healthCheckService.createHisParaclinicOrder({
                    docNo,
                    patientId,
                    doctorId: labMetadata.doctorId || user?.userId,
                    doctorName: labMetadata.doctorName || user?.name,
                    deptId: 'KKB',
                    roomId: 1,
                    items: pendingServices.map(p => ({
                        service_code: p.code,
                        service_name: p.name,
                        group_id: p.group_id,
                        unit: p.unit,
                        qty: p.qty,
                        note: p.note
                    }))
                });

                if (orderRes.success && orderRes.labData?.paraclinical_items) {
                    setParaclinicalItems(orderRes.labData.paraclinical_items);
                    syncGridToCoreFields(orderRes.labData.paraclinical_items);
                    toast.success(`Đã áp dụng thành công ${pendingServices.length} dịch vụ vào HIS!`);
                    setIsAddServiceModalOpen(false);
                    setPendingServices([]);
                    return;
                }
            }

            // Fallback thêm cục bộ nếu chưa có docNo
            const parentCodes = pendingServices.map(p => p.code);
            const subItems = await healthCheckService.getFeeSubitems(parentCodes);

            const newItems: any[] = [];
            for (const p of pendingServices) {
                newItems.push({
                    service_code: p.code,
                    service_name: p.name,
                    index_code: p.code,
                    index_name: p.name,
                    value: '',
                    unit: p.unit,
                    description: '',
                    conclusion: '',
                    group_id: p.group_id,
                    group_name: p.group_name,
                    type: p.type,
                    subitem: subItems.some(s => s.parent_code === p.code) ? 'Y' : '',
                    user_edited: true
                });

                // Thêm các chỉ số con thuộc dịch vụ này
                const children = subItems.filter(s => s.parent_code === p.code);
                for (const child of children) {
                    newItems.push({
                        service_code: child.service_code,
                        service_name: child.service_name,
                        index_code: child.service_code,
                        index_name: child.service_name,
                        value: '',
                        unit: child.unit || '',
                        description: '',
                        conclusion: '',
                        group_id: child.group_id || p.group_id,
                        group_name: child.group_name || p.group_name,
                        type: 'XN',
                        line_no: child.line_no,
                        subitem: child.subitem,
                        parent_name: p.name,
                        parent_code: p.code,
                        parent_line: child.parent_line,
                        user_edited: true
                    });
                }
            }

            const updated = [...paraclinicalItems, ...newItems];
            setParaclinicalItems(updated);
            syncGridToCoreFields(updated);
            toast.success(`Đã thêm ${pendingServices.length} dịch vụ (kèm các chỉ số chi tiết) vào hồ sơ!`);
            setIsAddServiceModalOpen(false);
            setPendingServices([]);
        } catch (err: any) {
            console.error("Lỗi khi áp dụng chỉ định CLS vào HIS:", err);
            toast.error(`Lỗi áp dụng vào HIS: ${err.message || 'Không thể ghi nhận chỉ định'}`);
        } finally {
            setIsApplyingHis(false);
        }
    };

    const handleRemoveItem = async (item: any) => {
        if (docNo && item.service_code) {
            try {
                const cancelRes = await healthCheckService.cancelHisParaclinicItem({
                    docNo,
                    orderId: item.order_id,
                    serviceCode: item.service_code
                });
                if (cancelRes.success && cancelRes.labData?.paraclinical_items) {
                    setParaclinicalItems(cancelRes.labData.paraclinical_items);
                    syncGridToCoreFields(cancelRes.labData.paraclinical_items);
                    toast.success(`Đã hủy dịch vụ ${item.service_name} trên HIS`);
                    return;
                }
            } catch (err: any) {
                console.error("Lỗi hủy dịch vụ trên HIS:", err);
            }
        }

        const updated = paraclinicalItems.filter((_, idx) => idx !== item.originalIndex);
        setParaclinicalItems(updated);
        syncGridToCoreFields(updated);
        toast.success(`Đã xóa dịch vụ: ${item.service_name}`);
    };

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
            case 'ĐANG_KHÁM': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Trạng thái: Đang khám</span>;
            case 'ĐÃ_KHÁM': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">Trạng thái: Đã khám</span>;
            case 'ĐÃ_DUYỆT': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Trạng thái: Đã duyệt</span>;
            default: return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Trạng thái: Chưa khám</span>;
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

            {/* Action Row: Autofill & HIS Sync & Add Service */}
            {!isTabLocked && (
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleOpenAddServiceModal}
                        className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95"
                    >
                        <PlusIcon className="w-4 h-4" />
                        + Thêm dịch vụ từ danh mục
                    </button>

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
                                    <th className={`py-2.5 px-3 ${labSubTab === 'XN' ? 'w-[35%]' : 'w-[30%]'}`}>Tên dịch vụ/chỉ số</th>
                                    <th className={`py-2.5 px-3 ${labSubTab === 'XN' ? 'w-[25%]' : 'w-[20%]'}`}>Kết quả</th>
                                    {labSubTab === 'XN' && <th className="py-2.5 px-3 w-[15%]">Đơn vị</th>}
                                    {labSubTab !== 'XN' && <th className="py-2.5 px-3 w-[25%]">Mô tả chi tiết</th>}
                                    <th className={`py-2.5 px-3 ${labSubTab === 'XN' ? 'w-[25%]' : 'w-[15%]'}`}>Kết luận</th>
                                    {labSubTab !== 'XN' && <th className="py-2.5 px-3 w-[10%] text-center">Thao tác</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/40">
                                {paraclinicalItems.filter(item => item.type === labSubTab).length === 0 ? (
                                    <tr>
                                        <td colSpan={labSubTab === 'XN' ? 4 : 5} className="py-6 text-center text-slate-400 dark:text-slate-500 italic">
                                            Chưa có dịch vụ nào được chỉ định cho nhóm này.
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
                                                    <td colSpan={labSubTab === 'XN' ? 4 : 5} className="py-2.5 px-3 font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px]">
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
                                                                <td colSpan={labSubTab === 'XN' ? 4 : 5} className="py-2 px-3 text-[11px] font-bold">
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
                                                                {labSubTab !== 'XN' && <td className="py-2.5 px-3 text-center"></td>}
                                                            </tr>
                                                        );
                                                        return elements;
                                                    }

                                                    elements.push(
                                                        <tr key={item.originalIndex} className="hover:bg-slate-50/50 dark:hover:bg-slate-855/40">
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
                                                            {labSubTab !== 'XN' && (
                                                                <td className="py-2 px-1.5 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenResultModal(item)}
                                                                        className="px-2.5 py-1 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-0.5 active:scale-95 shadow-xs"
                                                                    >
                                                                        Nhập KQ
                                                                    </button>
                                                                </td>
                                                            )}
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

            {/* Modal Chọn Dịch Vụ từ Danh Mục (Chuẩn HIS Core 3 Cột: Nhóm -> Danh sách -> Đã chọn -> Áp dụng) */}
            {isAddServiceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-[1520px] w-[98vw] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[92vh] max-h-[850px] animate-in zoom-in-95 duration-200">
                        {/* Modal Header với Tab Lọc Phân Loại Nhanh */}
                        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-[#0f766e] dark:text-teal-400 font-black shadow-xs shrink-0">
                                    <PlusIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            Chỉ định dịch vụ Cận lâm sàng từ Danh mục HIS
                                        </h5>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300">
                                            HIS CORE
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Chọn nhóm, nhấp <span className="font-bold text-[#0f766e] dark:text-teal-400">"+ Chọn"</span> hoặc kích đúp để đưa vào danh sách chờ. Nhấn <span className="font-bold text-[#0f766e] dark:text-teal-400">"Áp dụng"</span> để kê chính thức.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Phân loại Tab nhanh trong Header */}
                                <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl gap-1 text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectFilterType('ALL')}
                                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                                            groupFilterType === 'ALL'
                                                ? 'bg-white dark:bg-slate-700 text-[#0f766e] dark:text-teal-300 font-extrabold shadow-xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                        }`}
                                    >
                                        Tất cả
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectFilterType('XN')}
                                        className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                                            groupFilterType === 'XN'
                                                ? 'bg-[#0f766e] text-white font-extrabold shadow-xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>🧪</span> Xét nghiệm
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectFilterType('HA')}
                                        className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                                            groupFilterType === 'HA'
                                                ? 'bg-[#0f766e] text-white font-extrabold shadow-xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>🖼️</span> CĐHA
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectFilterType('TD')}
                                        className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                                            groupFilterType === 'TD'
                                                ? 'bg-[#0f766e] text-white font-extrabold shadow-xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>📈</span> Thăm dò CN
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsAddServiceModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                                    title="Đóng cửa sổ"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Body 3 Cột Cân Đối: Cột 1 (Nhóm - 240px) | Cột 2 (Danh sách - flex-1 min-w-[500px]) | Cột 3 (Đã chọn - 290px) */}
                        <div className="flex-1 flex overflow-hidden min-h-0">
                            {/* Panel 1: Nhóm Dịch Vụ (w-[240px] shrink-0) */}
                            <div 
                                style={{ width: '240px', minWidth: '240px', maxWidth: '240px' }}
                                className="w-[240px] shrink-0 border-r border-slate-200 dark:border-slate-800 p-3 overflow-y-auto bg-slate-50/60 dark:bg-slate-900/40 flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <h6 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Nhóm dịch vụ ({filteredServiceGroups.length})
                                    </h6>
                                </div>
                                {isLoadingGroups ? (
                                    <div className="py-12 text-center text-xs text-slate-400 font-semibold">Đang tải nhóm...</div>
                                ) : filteredServiceGroups.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-slate-400 font-semibold">Không có nhóm phù hợp</div>
                                ) : (
                                    <div className="space-y-1 overflow-y-auto flex-1 pr-0.5">
                                        {filteredServiceGroups.map(g => {
                                            const isSelected = selectedGroup === g.id && !serviceSearchTerm;
                                            return (
                                                <button
                                                    key={g.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedGroup(g.id);
                                                        setServiceSearchTerm('');
                                                        loadServicesByGroup(g.id);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-between gap-1.5 relative group ${
                                                        isSelected
                                                            ? 'bg-teal-50 dark:bg-teal-950/40 text-[#0f766e] dark:text-teal-300 font-extrabold border border-teal-200 dark:border-teal-900/40 shadow-xs'
                                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#0f766e] rounded-r-full" />
                                                    )}
                                                    <span className="flex-1 min-w-0 pr-1 text-xs leading-snug break-words whitespace-normal">{g.name}</span>
                                                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-500 group-hover:text-slate-700 shrink-0 font-bold">
                                                        {g.id}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Panel 2: Danh Sách Dịch Vụ Kỹ Thuật (flex-1 min-w-[500px] - Không gian rộng rãi) */}
                            <div className="flex-1 min-w-0 border-r border-slate-200 dark:border-slate-800 p-3.5 overflow-y-auto flex flex-col bg-white dark:bg-slate-900">
                                {/* Thanh tìm kiếm & Trạng thái lọc */}
                                <div className="mb-3 flex items-center gap-2.5">
                                    <div className="relative flex-1 min-w-0">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                            <SearchIcon className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Tìm theo mã hoặc tên dịch vụ..."
                                            value={serviceSearchTerm}
                                            onChange={async (e) => {
                                                const val = e.target.value;
                                                setServiceSearchTerm(val);
                                                if (!val.trim()) {
                                                    if (selectedGroup) loadServicesByGroup(selectedGroup);
                                                    return;
                                                }
                                                setIsLoadingGroupServices(true);
                                                try {
                                                    const data = await healthCheckService.searchAvailableServices(val);
                                                    setGroupServices(data);
                                                } catch (err: any) {
                                                    console.error("Failed to search services:", err);
                                                } finally {
                                                    setIsLoadingGroupServices(false);
                                                }
                                            }}
                                            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e] font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 shadow-xs"
                                        />
                                        {serviceSearchTerm && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setServiceSearchTerm('');
                                                    if (selectedGroup) loadServicesByGroup(selectedGroup);
                                                }}
                                                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    <div className="shrink-0 text-xs font-bold text-slate-500">
                                        {serviceSearchTerm ? (
                                            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 rounded-lg whitespace-nowrap">
                                                Tìm thấy: <strong>{groupServices.length}</strong>
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg whitespace-nowrap">
                                                Tổng: <strong>{groupServices.length}</strong> dịch vụ
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Danh sách dịch vụ: Sử dụng Flexbox chuẩn xác 1:1 giữa Header và Rows */}
                                <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-y-auto bg-white dark:bg-slate-800 shadow-xs flex flex-col">
                                    {isLoadingGroupServices ? (
                                        <div className="py-20 text-center text-xs text-slate-500 font-semibold flex flex-col items-center justify-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#0f766e] border-t-transparent rounded-full animate-spin"></div>
                                            <span>Đang tải danh sách dịch vụ...</span>
                                        </div>
                                    ) : groupServices.length === 0 ? (
                                        <div className="py-20 text-center text-xs text-slate-400 font-semibold flex flex-col items-center justify-center gap-1">
                                            <span className="text-lg">🔍</span>
                                            <span>Không tìm thấy dịch vụ nào phù hợp</span>
                                        </div>
                                    ) : (
                                        <div className="w-full flex flex-col min-w-[500px]">
                                            {/* Header chuẩn hóa từng cột theo Flex */}
                                            <div className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-10 shadow-2xs flex items-center px-3 py-2.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                                                <div className="w-[40px] shrink-0 text-center">#</div>
                                                <div className="flex-1 min-w-[200px] px-3 text-left">Tên dịch vụ kỹ thuật</div>
                                                <div className="w-[60px] shrink-0 text-center">ĐVT</div>
                                                <div className="w-[105px] shrink-0 text-right pr-2">Đơn giá</div>
                                                <div className="w-[95px] shrink-0 text-center">Thao tác</div>
                                            </div>

                                            {/* Body Rows chuẩn hóa từng cột theo Flex */}
                                            <div className="divide-y divide-slate-100 dark:divide-slate-700 flex flex-col">
                                                {groupServices.map((gs, idx) => {
                                                    const code = String(gs.item_id || gs.id || '').trim();
                                                    const isQueued = pendingServices.some(p => p.code === code);
                                                    const queuedItem = pendingServices.find(p => p.code === code);
                                                    return (
                                                        <div 
                                                            key={code || idx} 
                                                            className={`w-full flex items-center px-3 py-2.5 transition-colors cursor-pointer ${
                                                                isQueued 
                                                                    ? 'bg-teal-50/60 dark:bg-teal-950/30' 
                                                                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-750'
                                                            }`}
                                                            onDoubleClick={() => handleQueueService(gs)}
                                                        >
                                                            <div className="w-[40px] shrink-0 text-center text-slate-400 font-mono text-[10.5px]">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-[200px] px-3">
                                                                <div className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-snug break-words">
                                                                    {gs.name}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded font-semibold">
                                                                        {code}
                                                                    </span>
                                                                    {gs.group_name && (
                                                                        <span className="text-[9.5px] px-1.5 py-0.2 bg-teal-50 dark:bg-teal-950/40 text-[#0f766e] dark:text-teal-300 font-medium rounded">
                                                                            {gs.group_name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="w-[60px] shrink-0 text-center text-slate-600 dark:text-slate-400 text-xs font-semibold whitespace-nowrap">
                                                                {gs.unit || 'Lần'}
                                                            </div>
                                                            <div className="w-[105px] shrink-0 text-right pr-2 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap">
                                                                {new Intl.NumberFormat('vi-VN').format(parseFloat(gs.price || 0))} đ
                                                            </div>
                                                            <div className="w-[95px] shrink-0 text-center whitespace-nowrap">
                                                                {isQueued ? (
                                                                    <div className="inline-flex items-center justify-center gap-1">
                                                                        <span className="inline-block px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                                                                            ✓ {queuedItem && queuedItem.qty > 1 ? `x${queuedItem.qty}` : 'Đã chọn'}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleUpdatePendingQty(code, 1);
                                                                            }}
                                                                            className="w-6 h-6 inline-flex items-center justify-center bg-teal-100 hover:bg-teal-200 text-[#0f766e] rounded-md text-xs font-black cursor-pointer shadow-xs"
                                                                            title="Thêm +1 số lượng"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleQueueService(gs);
                                                                        }}
                                                                        className="px-2.5 py-1.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg text-[11px] font-bold cursor-pointer active:scale-95 shadow-xs transition inline-flex items-center gap-1"
                                                                    >
                                                                        <span>+</span> Chọn
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Panel 3: Danh Sách Đã Chọn (Selected Services Buffer - w-[290px] shrink-0) */}
                            <div 
                                style={{ width: '290px', minWidth: '290px', maxWidth: '290px' }}
                                className="w-[290px] shrink-0 p-3 overflow-y-auto flex flex-col bg-slate-50/70 dark:bg-slate-900/50"
                            >
                                <div className="flex justify-between items-center mb-2.5 px-1">
                                    <h6 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <span>Dịch vụ đã chọn</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-[#0f766e] text-white">
                                            {pendingServices.length}
                                        </span>
                                    </h6>
                                    {pendingServices.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleClearAllPending}
                                            className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                                        >
                                            Xóa tất cả
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl overflow-y-auto bg-white dark:bg-slate-800 shadow-xs flex flex-col p-2">
                                    {pendingServices.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-slate-700 flex items-center justify-center text-[#0f766e] dark:text-teal-400 mb-3 shadow-xs">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                                Chưa có dịch vụ trong hàng chờ
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                                                Nhấp nút <span className="font-bold text-[#0f766e]">"+ Chọn"</span> hoặc kích đúp vào dịch vụ ở bảng giữa để đưa vào đây.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                                            {pendingServices.map((p) => {
                                                const lineTotal = p.price * p.qty;
                                                return (
                                                    <div 
                                                        key={p.code} 
                                                        className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750/50 hover:border-teal-300 dark:hover:border-teal-700 transition"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                                                                    {p.name}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <span className="text-[9.5px] font-mono text-slate-400">{p.code}</span>
                                                                    <span className="text-[9.5px] px-1.5 py-0.2 bg-teal-50 dark:bg-teal-950/40 text-[#0f766e] dark:text-teal-300 rounded font-bold">
                                                                        {p.type}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemovePending(p.code)}
                                                                className="w-5 h-5 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer font-bold shrink-0"
                                                                title="Xóa khỏi danh sách"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                                            {/* Số lượng Stepper */}
                                                            <div className="inline-flex items-center border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdatePendingQty(p.code, -1)}
                                                                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-black text-xs cursor-pointer"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="w-8 text-center font-bold font-mono text-xs text-slate-800 dark:text-slate-200">
                                                                    {p.qty}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdatePendingQty(p.code, 1)}
                                                                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-black text-xs cursor-pointer"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>

                                                            {/* Thành tiền */}
                                                            <div className="text-right">
                                                                <div className="font-mono text-xs font-black text-slate-900 dark:text-white">
                                                                    {new Intl.NumberFormat('vi-VN').format(lineTotal)} đ
                                                                </div>
                                                                {p.qty > 1 && (
                                                                    <div className="text-[9.5px] text-slate-400 font-mono">
                                                                        ({new Intl.NumberFormat('vi-VN').format(p.price)} đ/{p.unit || 'lần'})
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer: Hiển thị Tổng Tiền & Nút Áp Dụng */}
                        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                    Đã chọn: <span className="font-black text-slate-900 dark:text-white px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-md">{pendingServices.length}</span> dịch vụ
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                    Tổng chi phí: <span className="font-black text-[#0f766e] dark:text-teal-400 font-mono text-base ml-1">
                                        {new Intl.NumberFormat('vi-VN').format(pendingServices.reduce((sum, p) => sum + (p.price * p.qty), 0))} đ
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddServiceModalOpen(false)}
                                    className="px-5 py-2.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApplySelectedServices}
                                    disabled={isApplyingHis || pendingServices.length === 0}
                                    className="px-7 py-2.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-teal-700/25 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isApplyingHis ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang kê vào HIS...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Áp dụng vào hồ sơ ({pendingServices.length})
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabTab;
