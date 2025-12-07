
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BillingPatientInfo, { PatientBillingInfo } from './components/BillingPatientInfo';
import BillingItemsTable, { BillingItem } from './components/BillingItemsTable';
import BillingReceiptsTable, { Receipt } from './components/BillingReceiptsTable';
import BillingActionsPanel from './components/BillingActionsPanel';
import PaymentDialog from './components/PaymentDialog';
import DepositDialog from './components/DepositDialog';
import DiscountDialog from './components/DiscountDialog';
import AddFeeDialog from './components/AddFeeDialog'; 
import ElectronicInvoiceModal from './components/ElectronicInvoiceModal';
import { billingService } from '../../../services/billingService'; 
import { 
    ChevronLeftIcon, 
    ListBulletIcon, 
    ReceiptIcon,
    QrcodeIcon,
    HomeIcon
} from '../../../components/Icons';

const BillingRecordView: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<PatientBillingInfo | null>(null);
    const [items, setItems] = useState<BillingItem[]>([]);
    const [activeTab, setActiveTab] = useState<'items' | 'receipts'>('items');
    
    // Quick Search State
    const [nextPatientQuery, setNextPatientQuery] = useState('');

    // Modal States
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);
    
    // E-Invoice Modal
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoiceReceipt, setSelectedInvoiceReceipt] = useState<Receipt | null>(null);

    useEffect(() => {
        // Simulate API Fetch based on patientId
        const loadData = async () => {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 600));

            const isInsurance = patientId === 'P001' || patientId === 'BN-001'; // Mock logic

            // Mock Billing Items
            const initialItems: BillingItem[] = [
                { id: '1', name: 'Khám bệnh (Nội)', category: 'Khám bệnh', unit: 'Lần', quantity: 1, unitPrice: 38700, totalPrice: 38700, insurancePaid: isInsurance ? 30960 : 0, patientPaid: isInsurance ? 7740 : 38700, date: '27/11', status: 'paid' },
                { id: '2', name: 'Tổng phân tích tế bào máu', category: 'Xét nghiệm', unit: 'Lần', quantity: 1, unitPrice: 42100, totalPrice: 42100, insurancePaid: isInsurance ? 33680 : 0, patientPaid: isInsurance ? 8420 : 42100, date: '27/11', status: 'paid' },
                { id: '3', name: 'Định lượng Glucose', category: 'Xét nghiệm', unit: 'Lần', quantity: 1, unitPrice: 22600, totalPrice: 22600, insurancePaid: isInsurance ? 18080 : 0, patientPaid: isInsurance ? 4520 : 22600, date: '27/11', status: 'paid' },
                { id: '4', name: 'Siêu âm ổ bụng tổng quát', category: 'CĐHA', unit: 'Lần', quantity: 1, unitPrice: 43900, totalPrice: 43900, insurancePaid: isInsurance ? 35120 : 0, patientPaid: isInsurance ? 8780 : 43900, date: '27/11', status: 'paid' },
                { id: '5', name: 'Giường nội khoa (Hạng II)', category: 'Ngày giường', unit: 'Ngày', quantity: 3, unitPrice: 212000, totalPrice: 636000, insurancePaid: isInsurance ? 508800 : 0, patientPaid: isInsurance ? 127200 : 636000, date: '27/11', status: 'unpaid' },
                { id: '6', name: 'Paracetamol 500mg', category: 'Thuốc', unit: 'Viên', quantity: 10, unitPrice: 500, totalPrice: 5000, insurancePaid: isInsurance ? 4000 : 0, patientPaid: isInsurance ? 1000 : 5000, date: '28/11', status: 'unpaid' },
                { id: '7', name: 'Natri Clorid 0.9% 500ml', category: 'Thuốc', unit: 'Chai', quantity: 2, unitPrice: 15000, totalPrice: 30000, insurancePaid: isInsurance ? 24000 : 0, patientPaid: isInsurance ? 6000 : 30000, date: '28/11', status: 'unpaid' },
            ];
            setItems(initialItems);

            // Mock Calculation for Patient Summary
            const totalDebtCalc = initialItems.reduce((sum, i) => sum + i.totalPrice, 0);
            const totalInsuranceCalc = initialItems.reduce((sum, i) => sum + i.insurancePaid, 0);

            // Mock Patient Data
            setPatient({
                id: patientId || 'BN-000',
                recordId: 'REC-2023-001',
                name: isInsurance ? 'NGUYỄN VĂN AN' : 'LÊ HOÀNG CƯỜNG',
                dob: '1985-05-20',
                gender: 'Nam',
                address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
                phone: '0912345678',
                admissionDate: '27/11/2023 08:30',
                department: 'Khoa Nội Tổng Quát',
                // Insurance Details
                patientType: isInsurance ? 'BHYT' : 'Dịch vụ',
                insuranceNumber: isInsurance ? 'GD4790215567890' : undefined,
                insuranceRate: isInsurance ? 80 : undefined,
                insuranceRegDate: isInsurance ? '01/01/2023' : undefined,
                insuranceExpDate: isInsurance ? '31/12/2023' : undefined,
                insurancePlace: isInsurance ? '01001 - Bệnh viện Bạch Mai' : undefined,
                
                balance: 2000000,
                totalDebt: totalDebtCalc,
                totalInsurance: totalInsuranceCalc,
                totalDiscount: 0, 
                status: 'open'
            });

            setLoading(false);
        };
        loadData();
    }, [patientId]);

    const handleAction = (action: string) => {
        if (action === 'payment') setIsPaymentModalOpen(true);
        if (action === 'deposit') setIsDepositModalOpen(true);
        if (action === 'discount') setIsDiscountModalOpen(true);
        if (action === 'add_service') setIsAddFeeModalOpen(true); 
        if (action === 'print') alert('In bảng kê chi phí...');
        if (action === 'print_receipt') alert('In biên lai...');
    };

    const handlePaymentConfirm = (data: any) => {
        setItems(prev => prev.map(item => ({ ...item, status: 'paid' })));
        alert("Thanh toán thành công!");
        setActiveTab('receipts');
    };

    const handleDepositConfirm = (data: any) => {
        setPatient(prev => prev ? { ...prev, balance: prev.balance + data.amount } : null);
        alert(`Đã thu tạm ứng: ${data.amount.toLocaleString()}đ`);
        setActiveTab('receipts');
    };

    const handleDiscountConfirm = async (data: any) => {
        if(!patient) return;
        const req = {
            patientId: patient.id,
            recordId: patient.recordId,
            amount: data.amount,
            reason: data.reason,
            authorizer: data.authorizer,
            date: new Date().toISOString(),
            note: ''
        };
        const success = await billingService.createDiscount(req);
        if(success) {
             setPatient(prev => prev ? { ...prev, totalDiscount: prev.totalDiscount + data.amount } : null);
             alert(`Đã lưu phiếu miễn giảm: ${data.amount.toLocaleString()}đ`);
        }
    };

    const handleAddFees = (newItems: Partial<BillingItem>[]) => {
        const currentDate = new Date().toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});
        const insuranceRate = (patient?.patientType === 'BHYT' && patient.insuranceRate) ? patient.insuranceRate / 100 : 0;

        const addedItems: BillingItem[] = newItems.map((item, idx) => {
            const total = (item.unitPrice || 0) * (item.quantity || 1);
            const insPay = Math.round(total * insuranceRate);
            return {
                id: `NEW_${Date.now()}_${idx}`,
                name: item.name || 'Dịch vụ mới',
                category: item.category || 'Khác',
                unit: item.unit || 'Lần',
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                totalPrice: total,
                insurancePaid: insPay,
                patientPaid: total - insPay,
                date: currentDate,
                status: 'unpaid'
            };
        });

        setItems(prev => [...prev, ...addedItems]);
        
        const addedDebt = addedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const addedIns = addedItems.reduce((sum, item) => sum + item.insurancePaid, 0);
        
        setPatient(prev => prev ? { 
            ...prev, 
            totalDebt: prev.totalDebt + addedDebt,
            totalInsurance: prev.totalInsurance + addedIns 
        } : null);
        
        alert(`Đã thêm ${addedItems.length} dịch vụ vào bảng kê.`);
    };

    const handleSwitchPatient = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && nextPatientQuery.trim()) {
            navigate(`/billing/record/${nextPatientQuery.trim()}`);
            setNextPatientQuery('');
        }
    };
    
    const handleOpenInvoiceModal = (receipt: Receipt) => {
        setSelectedInvoiceReceipt(receipt);
        setIsInvoiceModalOpen(true);
    };

    if (loading) {
        return <div className="h-full flex items-center justify-center text-slate-500">Đang tải hồ sơ viện phí...</div>;
    }

    if (!patient) return <div>Không tìm thấy bệnh nhân.</div>;

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
            
            {/* 1. TOP HEADER (Slim & Functional) */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-20 px-4 py-2">
                 <div className="flex justify-between items-center gap-4">
                    {/* Left: Nav & Quick Info */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/billing/invoices')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                             <h1 className="text-lg font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2">
                                <span className="text-blue-600">Thu Ngân</span> / {patient.name}
                            </h1>
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{patient.recordId}</span>
                        </div>
                    </div>

                    {/* Right: Quick Search */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <QrcodeIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
                        </div>
                        <input 
                            type="text" 
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-full focus:ring-2 focus:ring-blue-500 block w-64 pl-9 p-1.5 placeholder-slate-400 outline-none transition-all" 
                            placeholder="Quét mã hồ sơ / BHYT..." 
                            value={nextPatientQuery}
                            onChange={(e) => setNextPatientQuery(e.target.value)}
                            onKeyDown={handleSwitchPatient}
                        />
                    </div>
                 </div>
            </div>

            {/* 2. MAIN CONTENT (3-Pane Layout) */}
            <div className="flex-1 flex overflow-hidden p-3 gap-3">
                
                {/* PANE 1: PATIENT INFO (Fixed Width - 20%) */}
                <div className="w-72 flex-shrink-0 flex flex-col h-full overflow-hidden">
                    <BillingPatientInfo patient={patient} />
                </div>

                {/* PANE 2: ITEMS & RECEIPTS (Flexible - 55%) */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 pt-2 shrink-0">
                        <button 
                            onClick={() => setActiveTab('items')}
                            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-t-lg transition-colors border-t-2 ${activeTab === 'items' ? 'bg-white dark:bg-slate-800 text-blue-600 border-blue-500' : 'text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <ListBulletIcon className="w-4 h-4"/> Bảng kê chi tiết
                        </button>
                        <button 
                            onClick={() => setActiveTab('receipts')}
                            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-t-lg transition-colors border-t-2 ${activeTab === 'receipts' ? 'bg-white dark:bg-slate-800 text-blue-600 border-blue-500' : 'text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <ReceiptIcon className="w-4 h-4"/> Lịch sử Phiếu thu
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden p-0 relative">
                        {activeTab === 'items' ? (
                            <BillingItemsTable items={items} />
                        ) : (
                            <div className="h-full p-4 bg-slate-50 dark:bg-slate-900/30">
                                <BillingReceiptsTable 
                                    onOpenDetail={() => setIsPaymentModalOpen(true)} 
                                    onIssueInvoice={handleOpenInvoiceModal}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* PANE 3: ACTIONS & CHECKOUT (Fixed Width - 25%) */}
                <div className="w-80 flex-shrink-0 flex flex-col h-full overflow-hidden">
                    <BillingActionsPanel patient={patient} onAction={handleAction} />
                </div>
            </div>

            {/* MODALS */}
            <PaymentDialog 
                isOpen={isPaymentModalOpen} 
                onClose={() => setIsPaymentModalOpen(false)}
                patient={patient}
                items={items} 
                onConfirm={handlePaymentConfirm}
            />

            <DepositDialog 
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                patient={patient}
                onConfirm={handleDepositConfirm}
            />

            <DiscountDialog 
                isOpen={isDiscountModalOpen}
                onClose={() => setIsDiscountModalOpen(false)}
                patient={patient}
                onConfirm={handleDiscountConfirm}
            />

            <AddFeeDialog 
                isOpen={isAddFeeModalOpen}
                onClose={() => setIsAddFeeModalOpen(false)}
                onAdd={handleAddFees}
            />
            
            <ElectronicInvoiceModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                receiptData={selectedInvoiceReceipt}
                patientData={patient}
            />
        </div>
    );
};

export default BillingRecordView;
