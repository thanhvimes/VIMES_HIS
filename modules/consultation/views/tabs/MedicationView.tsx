import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
    ArchiveIcon, 
    PlusIcon, 
    TrashIcon, 
    PrinterIcon, 
    SaveIcon, 
    BanIcon, 
    CheckIcon, 
    ClockIcon,
    ShoppingCartIcon,
    ExclamationCircleIcon,
    ArrowPathIcon,
    SparklesIcon,
    ListBulletIcon,
    BeakerIcon
} from '../../../../components/Icons';
import { DataTable } from '../../../../components/ui/DataTable';
import Combobox, { ComboboxColumn } from '../../../../components/ui/Combobox';
import { Prescription, PrescriptionItem, DrugItem, PrescriptionTemplate } from '../../../../types';
import { consultationService } from '../../../../services/consultationService';
import { useNotification } from '../../../../contexts/NotificationContext';
import { socketService } from '../../../../services/socketService';
import { useTheme } from '../../../../contexts/ThemeContext';

const MedicationView: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const [searchParams] = useSearchParams();
    const docNo = searchParams.get('docNo');
    const { addNotification } = useNotification();
    const { fontSettings } = useTheme();
    
    const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
    const [history, setHistory] = useState<Prescription[]>([]);
    const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [drugOptions, setDrugOptions] = useState<DrugItem[]>([]);
    const [isLoadingDrugs, setIsLoadingDrugs] = useState(false);
    const [activeTab, setActiveTab] = useState<'HISTORY' | 'TEMPLATES'>('HISTORY');

    useEffect(() => {
        const loadInitialData = async () => {
            if (!docNo) return;
            try {
                const histRes = await consultationService.getPrescriptionHistory(parseInt(docNo));
                if (histRes.success) setHistory(histRes.data);
                
                // Mock templates for demo
                setTemplates([
                    {
                        id: 'T1',
                        name: 'Đơn thuốc Viêm phế quản cấp',
                        description: 'Phác đồ 7 ngày cho người lớn',
                        items: []
                    },
                    {
                        id: 'T2',
                        name: 'Đơn thuốc Dạ dày (HP+)',
                        description: 'Phác đồ diệt HP 14 ngày',
                        items: []
                    }
                ]);
            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        };
        loadInitialData();
    }, [docNo]);

    const handleSearchDrugs = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setDrugOptions([]);
            return;
        }
        setIsLoadingDrugs(true);
        try {
            const response = await consultationService.searchDrugs(query);
            if (response.success) {
                setDrugOptions(response.data);
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsLoadingDrugs(false);
        }
    };

    const addDrugToPrescription = (drug: DrugItem) => {
        if (prescription.some(item => item.drug.id === drug.id)) {
            addNotification("Thông báo", "Thuốc này đã có trong đơn", "info");
            return;
        }

        const newItem: PrescriptionItem = {
            id: `item-${Date.now()}`,
            drug: drug,
            quantity: 7,
            morning: '1',
            noon: '0',
            afternoon: '0',
            night: '1',
            days: 7,
            usageNote: 'Sau ăn 30 phút',
            totalPrice: (drug.price || 0) * 7
        };
        setPrescription([...prescription, newItem]);
        setSearchQuery('');
    };

    const updateItem = (id: string, field: keyof PrescriptionItem, value: any) => {
        setPrescription(prev => prev.map(item => {
            if (item.id !== id) return item;
            
            const updated = { ...item, [field]: value };
            
            if (['morning', 'noon', 'afternoon', 'night', 'days'].includes(field)) {
                const m = parseFloat(updated.morning) || 0;
                const n = parseFloat(updated.noon) || 0;
                const a = parseFloat(updated.afternoon) || 0;
                const ni = parseFloat(updated.night) || 0;
                const d = parseInt(updated.days as any) || 0;
                updated.quantity = Math.ceil((m + n + a + ni) * d);
                updated.totalPrice = updated.quantity * (updated.drug.price || 0);
            }
            
            return updated;
        }));
    };

    const removeItem = (id: string) => {
        setPrescription(prev => prev.filter(item => item.id !== id));
    };

    const handleSave = async () => {
        if (!docNo || prescription.length === 0) return;
        setIsSaving(true);
        try {
            const payload = {
                docNo: parseInt(docNo),
                items: prescription.map(it => ({
                    drugId: it.drug.id,
                    name: it.drug.name,
                    quantity: it.quantity,
                    unit: it.drug.unit,
                    usage: `${it.usageNote} (Sáng ${it.morning}, Trưa ${it.noon}, Chiều ${it.afternoon}, Tối ${it.night}) trong ${it.days} ngày`,
                    price: it.drug.price
                }))
            };

            const result = await consultationService.savePrescription(payload);
            if (result.success) {
                addNotification("Thành công", "Đã lưu đơn thuốc", "success");
                socketService.emit('new_prescription', { id: docNo });
            }
        } catch (error) {
            addNotification("Lỗi", "Không thể lưu", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const drugColumns: ComboboxColumn<DrugItem>[] = [
        { key: 'name', label: 'Tên thuốc', width: '60%' },
        { key: 'stock', label: 'Tồn', width: '20%', className: 'text-center font-bold text-emerald-600' },
        { key: 'unit', label: 'ĐVT', width: '20%', className: 'text-slate-400 italic' }
    ];

    const columns: any[] = [
        {
            header: 'Tên thuốc & Hoạt chất',
            accessorKey: 'drug.name',
            cell: ({ row }: any) => (
                <div className="py-1">
                    <div className="font-black text-slate-800 dark:text-white uppercase text-[11px] tracking-tight">{row.original.drug.name}</div>
                    <div className="text-[10px] text-blue-500 font-medium italic mt-0.5">{row.original.drug.activeIngredient || 'Chưa rõ thành phần'}</div>
                </div>
            )
        },
        {
            header: 'Liều dùng (S-T-C-T)',
            cell: ({ row }: any) => (
                <div className="flex gap-1.5 items-center">
                    <div className="group relative">
                        <input className="w-9 h-8 text-center border-2 border-amber-100 rounded-lg focus:border-amber-500 focus:ring-0 text-xs font-black bg-amber-50/30 transition-all" value={row.original.morning} onChange={e => updateItem(row.original.id, 'morning', e.target.value)} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Sáng</span>
                    </div>
                    <div className="group relative">
                        <input className="w-9 h-8 text-center border-2 border-orange-100 rounded-lg focus:border-orange-500 focus:ring-0 text-xs font-black bg-orange-50/30 transition-all" value={row.original.noon} onChange={e => updateItem(row.original.id, 'noon', e.target.value)} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Trưa</span>
                    </div>
                    <div className="group relative">
                        <input className="w-9 h-8 text-center border-2 border-blue-100 rounded-lg focus:border-blue-500 focus:ring-0 text-xs font-black bg-blue-50/30 transition-all" value={row.original.afternoon} onChange={e => updateItem(row.original.id, 'afternoon', e.target.value)} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Chiều</span>
                    </div>
                    <div className="group relative">
                        <input className="w-9 h-8 text-center border-2 border-indigo-100 rounded-lg focus:border-indigo-500 focus:ring-0 text-xs font-black bg-indigo-50/30 transition-all" value={row.original.night} onChange={e => updateItem(row.original.id, 'night', e.target.value)} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Tối</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Số ngày',
            cell: ({ row }: any) => (
                <div className="flex items-center gap-1.5">
                    <input className="w-12 h-8 text-center border-2 border-slate-100 rounded-lg font-black text-blue-600 text-xs focus:border-blue-500 focus:ring-0 transition-all" value={row.original.days} onChange={e => updateItem(row.original.id, 'days', e.target.value)} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Ngày</span>
                </div>
            )
        },
        {
            header: 'Số lượng',
            cell: ({ row }: any) => (
                <div className="flex flex-col">
                    <div className="font-black text-blue-800 dark:text-blue-400 text-sm">{row.original.quantity} <span className="text-[10px] text-slate-500 font-normal uppercase">{row.original.drug.unit}</span></div>
                    {row.original.drug.stock < row.original.quantity && (
                        <div className="text-[8px] text-red-500 font-bold flex items-center gap-0.5 mt-0.5">
                             <ExclamationCircleIcon className="w-2.5 h-2.5"/> Thiếu tồn
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Cách dùng & Dặn dò',
            cell: ({ row }: any) => (
                <div className="relative group">
                    <input 
                        className="w-full h-8 px-3 border-2 border-slate-50 rounded-lg text-xs bg-slate-50 focus:bg-white focus:border-blue-300 transition-all outline-none italic" 
                        value={row.original.usageNote} 
                        onChange={e => updateItem(row.original.id, 'usageNote', e.target.value)} 
                        placeholder="VD: Sau ăn 30 phút..."
                    />
                </div>
            )
        },
        {
            header: '',
            id: 'actions',
            cell: ({ row }: any) => (
                <button 
                    onClick={() => removeItem(row.original.id)} 
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    title="Xóa thuốc"
                >
                    <TrashIcon className="w-4 h-4"/>
                </button>
            )
        }
    ];

    const totalAmount = useMemo(() => prescription.reduce((sum, item) => sum + (item.totalPrice || 0), 0), [prescription]);

    return (
        <div className="flex flex-col h-full gap-4 animate-fade-in relative pb-4">
            
            {/* TOP ACTIONS ROW */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                        <ShoppingCartIcon className="w-5 h-5"/>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">Kê đơn thuốc ngoại trú</h3>
                        <p className="text-[11px] text-slate-500 font-medium italic">Chọn thuốc, thiết lập liều dùng và in đơn</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-all border border-indigo-100">
                        <SparklesIcon className="w-4 h-4"/> Đơn AI gợi ý
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-200">
                        <PrinterIcon className="w-4 h-4"/> In đơn thuốc
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                {/* LEFT: SEARCH & HISTORY/TEMPLATES */}
                <div className="w-80 flex flex-col gap-4">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 shadow-lg ring-1 ring-slate-200/50">
                        <Combobox<DrugItem>
                            label="Tìm thuốc trong kho"
                            placeholder="Nhập tên thuốc hoặc hoạt chất..."
                            value={searchQuery}
                            onChange={(val, item) => item && addDrugToPrescription(item)}
                            onInputChange={handleSearchDrugs}
                            options={drugOptions}
                            columns={drugColumns}
                            isLoading={isLoadingDrugs}
                            displayValue={it => it.name}
                        />
                    </div>

                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="flex border-b border-slate-100">
                            <button 
                                onClick={() => setActiveTab('HISTORY')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <div className="flex items-center justify-center gap-2"><ClockIcon className="w-3 h-3"/> Đơn cũ</div>
                            </button>
                            <button 
                                onClick={() => setActiveTab('TEMPLATES')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'TEMPLATES' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/30' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <div className="flex items-center justify-center gap-2"><ListBulletIcon className="w-3 h-3"/> Đơn mẫu</div>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                            {activeTab === 'HISTORY' ? (
                                history.length > 0 ? history.map(h => (
                                    <div key={h.id} className="p-3 border border-slate-100 rounded-xl mb-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-black text-slate-700 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">{h.date}</span>
                                            <ArrowPathIcon className="w-3 h-3 text-slate-300 group-hover:text-blue-500"/>
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight">{h.diagnosis}</div>
                                        <div className="mt-2 text-[9px] text-slate-400 italic">BS. {h.doctorName}</div>
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-4">
                                        <ClockIcon className="w-12 h-12 mb-2"/>
                                        <p className="text-[10px] font-bold">Chưa có lịch sử kê đơn</p>
                                    </div>
                                )
                            ) : (
                                templates.map(t => (
                                    <div key={t.id} className="p-3 border border-slate-100 rounded-xl mb-3 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-black text-purple-700 text-[9px] uppercase tracking-tighter">Mẫu phác đồ</span>
                                            <PlusIcon className="w-3 h-3 text-slate-300 group-hover:text-purple-500"/>
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-800 leading-tight">{t.name}</div>
                                        <div className="mt-1 text-[9px] text-slate-400 line-clamp-1">{t.description}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: PRESCRIPTION TABLE */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 shadow-xl overflow-hidden flex flex-col ring-1 ring-slate-200/50">
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <BeakerIcon className="w-5 h-5"/>
                            </div>
                            <div>
                                <h3 className="font-black uppercase text-sm tracking-widest">Danh sách thuốc chỉ định</h3>
                                <div className="text-[10px] text-blue-100 opacity-80 flex items-center gap-2">
                                    <span>{prescription.length} loại thuốc</span>
                                    <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                                    <span>Mã HS: #{docNo}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] font-bold text-blue-200 uppercase tracking-tighter">Ước tính tổng cộng</div>
                            <div className="text-2xl font-black text-white leading-none tabular-nums">{totalAmount.toLocaleString()} <span className="text-xs font-medium">VNĐ</span></div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                        {prescription.length > 0 ? (
                            <DataTable 
                                columns={columns} 
                                data={prescription}
                                className="border-none shadow-none"
                                hidePagination
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-20">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border-4 border-slate-100 dark:border-slate-800 border-dashed animate-pulse">
                                    <ShoppingCartIcon className="w-10 h-10 text-slate-200"/>
                                </div>
                                <h4 className="font-black text-slate-300 uppercase tracking-widest text-sm">Đơn thuốc đang trống</h4>
                                <p className="text-xs text-slate-400 mt-2 text-center max-w-xs">Sử dụng ô tìm kiếm bên trái hoặc chọn từ đơn mẫu để thêm thuốc vào chỉ định.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                         <div className="flex gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Làm mới">
                                <ArrowPathIcon className="w-5 h-5"/>
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Xóa tất cả">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                         </div>
                         <div className="flex gap-3">
                            <button onClick={handleSave} disabled={isSaving || prescription.length === 0} className="px-12 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all transform active:scale-95 uppercase text-xs tracking-widest flex items-center gap-2">
                                {isSaving ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <><SaveIcon className="w-4 h-4"/> Lưu & Gửi Quầy Thuốc</>}
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicationView;
