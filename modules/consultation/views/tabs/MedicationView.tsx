
import React, { useState, useMemo } from 'react';
import { 
    ListBulletIcon, 
    ArchiveIcon, 
    PlusIcon, 
    TrashIcon, 
    PrinterIcon, 
    SaveIcon, 
    BanIcon, 
    ExclamationCircleIcon, 
    SearchIcon, 
    CheckIcon, 
    DocumentPlusIcon,
    XIcon,
    InfoIcon
} from '../../../../components/Icons';
import Combobox, { ComboboxColumn } from '../../../../components/shared/Combobox';
import { drugList } from '../../data/catalogs';
import { mockInteractions } from '../../../pharmacy/data';
import { Prescription, PrescriptionItem, DrugItem, DrugInteraction } from '../../../../types';
import { usePdfPreview } from '../../../../contexts/PdfPreviewContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import { socketService } from '../../../../services/socketService';

const mockPrescriptionHistory: Prescription[] = [
    { id: 'XN001', date: '01/11/2023', doctorName: 'BS. Minh', diagnosis: 'Viêm họng', status: 'confirmed', warehouse: 'Kho BHYT', items: [], totalAmount: 150000 }
];

const emptyPrescription: Prescription = {
    id: 'NEW-' + Date.now(),
    date: new Date().toLocaleDateString('vi-VN'),
    doctorName: 'BS. Trần Văn Minh',
    diagnosis: 'Viêm phổi cộng đồng',
    status: 'draft',
    warehouse: 'Kho Dược',
    items: [],
    totalAmount: 0
};


import { useParams } from 'react-router-dom';
import { useNotification } from '../../../../contexts/NotificationContext';
import { consultationService } from '../../../../services/consultationService';

const MedicationView: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const { addNotification } = useNotification();
    const { openPdf } = usePdfPreview();
    const { fontSettings } = useTheme();
    const [currentPrescription, setCurrentPrescription] = useState<Prescription>(emptyPrescription);
    const [searchDrug, setSearchDrug] = useState('');
    const [drugOptions, setDrugOptions] = useState<DrugItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingDrugs, setIsLoadingDrugs] = useState(false);

    const currentDocNo = 21000001; // Mock

    const handleSearchDrugs = async (query: string) => {
        setSearchDrug(query);
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
            console.error("Failed to search drugs", error);
        } finally {
            setIsLoadingDrugs(false);
        }
    };

    const handleAddDrug = (drugName: string, drug?: DrugItem) => {
        if (!drug) return;
        const newItem: PrescriptionItem = {
            id: `ITEM-${Date.now()}`,
            drug: drug,
            quantity: 10,
            morning: '1', noon: '0', afternoon: '0', night: '1',
            usageNote: 'Sau ăn',
            totalPrice: (drug.price || 0) * 10
        };
        const newItems = [...currentPrescription.items, newItem];
        setCurrentPrescription({ 
            ...currentPrescription, 
            items: newItems, 
            totalAmount: newItems.reduce((s, i) => s + i.totalPrice, 0) 
        });
        setSearchDrug('');
    };

    const handleSave = async () => {
        if (currentPrescription.items.length === 0) { 
            addNotification("Cảnh báo", "Đơn thuốc trống!", "warning");
            return; 
        }
        
        setIsSaving(true);
        try {
            const payload = {
                docNo: currentDocNo,
                items: currentPrescription.items.map(it => ({
                    id: it.drug.code, // Use code from drug
                    name: it.drug.name,
                    quantity: it.quantity,
                    unit: it.drug.unit,
                    usage: it.usageNote
                }))
            };

            const result = await consultationService.savePrescription(payload);
            if (result.success) {
                // Emit real-time signal
                socketService.emit('new_prescription', {
                    id: result.orderId,
                    patientName: 'LÊ HOÀNG CƯỜNG',
                    doctorName: (currentPrescription as any).doctorName || 'BS. Admin',
                    itemCount: currentPrescription.items.length,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });

                addNotification("Thành công", "Đã lưu và gửi đơn thuốc sang quầy dược!", "success");
                setCurrentPrescription(emptyPrescription);
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            addNotification("Lỗi", "Không thể lưu đơn thuốc: " + error.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full gap-4 min-h-[500px]">
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-blue-700 uppercase">Kê đơn thuốc</h2>
                </div>
                <div className="p-4 border-b">
                    <Combobox<DrugItem>
                        placeholder="Tìm thuốc nhanh..."
                        value={searchDrug}
                        onChange={(val, item) => { 
                            if (item) handleAddDrug(val, item);
                            else handleSearchDrugs(val);
                        }}
                        options={drugOptions}
                        isLoading={isLoadingDrugs}
                        displayValue={(item) => item.name}
                        className="w-full"
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {currentPrescription.items.map((item, idx) => (
                        <div key={item.id} className="p-3 border-b flex justify-between items-center group hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400">
                                    <ArchiveIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="font-bold text-slate-800 dark:text-white">{item.drug.name}</span>
                                    <p className="text-xs text-slate-500 font-medium">{item.usageNote}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-black text-blue-600 text-lg">x{item.quantity} {item.drug.unit}</span>
                                <button 
                                    onClick={() => {
                                        const newItems = currentPrescription.items.filter(i => i.id !== item.id);
                                        setCurrentPrescription({...currentPrescription, items: newItems});
                                    }}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {currentPrescription.items.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 select-none pointer-events-none">
                            <ArchiveIcon className="w-16 h-16 mb-2"/>
                            <p className="font-bold">Đơn thuốc chưa có thuốc nào</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t flex justify-end gap-3">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving || currentPrescription.items.length === 0}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <SaveIcon className="w-5 h-5"/>
                        )}
                        {isSaving ? 'Đang gửi...' : 'Lưu & Gửi Quầy thuốc'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedicationView;
