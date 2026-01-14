
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

const MedicationView: React.FC = () => {
    const { openPdf } = usePdfPreview();
    const { fontSettings } = useTheme();
    const [currentPrescription, setCurrentPrescription] = useState<Prescription>(emptyPrescription);
    const [searchDrug, setSearchDrug] = useState('');

    const handleAddDrug = (drugName: string, drug?: DrugItem) => {
        if (!drug) return;
        const newItem: PrescriptionItem = {
            id: `ITEM-${Date.now()}`,
            drug: drug,
            quantity: 10,
            morning: '1', noon: '0', afternoon: '0', night: '1',
            usageNote: 'Sau ăn',
            totalPrice: drug.price * 10
        };
        const newItems = [...currentPrescription.items, newItem];
        setCurrentPrescription({ ...currentPrescription, items: newItems, totalAmount: newItems.reduce((s, i) => s + i.totalPrice, 0) });
        setSearchDrug('');
    };

    const handleSave = () => {
        if (currentPrescription.items.length === 0) { alert('Đơn thuốc trống!'); return; }
        
        // --- PHÁT TÍN HIỆU REAL-TIME CHO QUẦY DƯỢC ---
        socketService.emit('new_prescription', {
            id: currentPrescription.id,
            patientName: 'LÊ HOÀNG CƯỜNG',
            doctorName: currentPrescription.doctorName,
            itemCount: currentPrescription.items.length,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        alert('Đã gửi đơn thuốc sang quầy dược!');
        setCurrentPrescription(emptyPrescription);
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
                        onChange={(val, item) => { setSearchDrug(val); if (item) handleAddDrug(val, item); }}
                        options={drugList}
                        displayValue={(item) => item.name}
                        className="w-full"
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {currentPrescription.items.map((item, idx) => (
                        <div key={item.id} className="p-3 border-b flex justify-between items-center">
                            <div><span className="font-bold">{item.drug.name}</span><p className="text-xs text-slate-500">{item.usageNote}</p></div>
                            <span className="font-bold text-blue-600">x{item.quantity}</span>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={handleSave} className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg flex items-center gap-2">
                        <SaveIcon className="w-4 h-4"/> Lưu & Gửi Quầy thuốc
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedicationView;
