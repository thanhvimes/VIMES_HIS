
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BillingPatientInfo, { PatientBillingInfo } from './components/BillingPatientInfo';
import BillingItemsTable, { BillingItem } from './components/BillingItemsTable';
import BillingReceiptsTable, { Receipt } from './components/BillingReceiptsTable';
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
    UserCircleIcon,
    PhoneIcon,
    HomeIcon,
    ShieldCheckIcon,
    ClockIcon,
    QrcodeIcon
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
                address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội - Thành phố Hà Nội',
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
    
    const calculateAge = (dob: string) => {
        const year = new Date(dob).getFullYear();
        return new Date().getFullYear() - year;
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
            
            {/* 1. TOP HEADER (Gradient & Patient Info) */}
            <div className="flex-shrink-0 bg-gradient-to-r from-teal-600 to-blue-700 text-white shadow-md z-20 border-b border-white/10">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 gap-4">
                    {/* Left: Back & Name */}
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={() => navigate('/billing/invoices')} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black uppercase tracking-tight text-white">
                                    {patient.name}
                                </h1>
                                {patient.patientType === 'BHYT' ? (
                                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded border border-orange-400 flex items-center gap-1 shadow-sm">
                                        <ShieldCheckIcon className="w-3 h-3"/> BHYT
                                    </span>
                                ) : (
                                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded border border-blue-400 shadow-sm">
                                        DỊCH VỤ
                                    </span>
                                )}
                            </div>
                            
                            {/* Patient Demographics & Record ID */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-blue-100 mt-1 font-medium">
                                <span className="flex items-center gap-1">
                                    <UserCircleIcon className="w-4 h-4 opacity-80"/> 
                                    {calculateAge(patient.dob)}T ({patient.gender})
                                </span>
                                <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                                <span className="bg-white/10 px-2 rounded text-xs py-0.5 border border-white/10" title="Số hồ sơ bệnh án">
                                    HS: <span className="font-mono font-bold text-white">{patient.recordId}</span>
                                </span>
                                <span className="w-1 h-1 bg-blue-300 rounded-full hidden lg:block"></span>
                                <span className="hidden lg:flex items-center gap-1 opacity-90 text-xs">
                                    <HomeIcon className="w-3.5 h-3.5"/> {patient.address}
                                </span>
                            </div>

                            {/* Insurance Details Row */}
                            {patient.patientType === 'BHYT' && (
                                <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-1 text-xs text-blue-50 animate-fade-in">
                                    <span className="flex gap-1 items-center">
                                        <span className="opacity-60 uppercase font-semibold">Số thẻ:</span>
                                        <span className="font-mono font-bold text-yellow-300 tracking-wide text-sm">{patient.insuranceNumber}</span>
                                    </span>
                                    <span className="flex gap-1 items-center">
                                        <span className="opacity-60 uppercase font-semibold">Mức hưởng:</span>
                                        <span className="font-bold text-white bg-blue-800/50 px-1.5 rounded">{patient.insuranceRate}%</span>
                                    </span>
                                    <span className="flex gap-1 items-center">
                                        <span className="opacity-60 uppercase font-semibold">Hạn dùng:</span>
                                        <span className="font-mono">{patient.insuranceRegDate} - {patient.insuranceExpDate}</span>
                                    </span>
                                    <span className="flex gap-1 items-center hidden xl:flex">
                                        <span className="opacity-60 uppercase font-semibold">ĐKBD:</span>
                                        <span className="truncate max-w-[150px]" title={patient.insurancePlace}>{patient.insurancePlace}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Quick Search & Context Info */}
                    <div className="flex items-center gap-4">
                        {/* QUICK PATIENT SWITCHER */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <QrcodeIcon className="h-5 w-5 text-blue-200 group-focus-within:text-white" />
                            </div>
                            <input 
                                type="text" 
                                className="bg-white/10 border border-white/20 text-white text-sm rounded-lg focus:ring-2 focus:ring-white focus:bg-white/20 block w-64 pl-10 p-2.5 placeholder-blue-200 outline-none transition-all" 
                                placeholder="Quét hồ sơ tiếp theo..." 
                                value={nextPatientQuery}
                                onChange={(e) => setNextPatientQuery(e.target.value)}
                                onKeyDown={handleSwitchPatient}
                            />
                        </div>

                         <div className="text-right hidden xl:block">
                            <p className="text-xs text-blue-200 font-bold uppercase">Khoa điều trị</p>
                            <p className="font-bold">{patient.department}</p>
                         </div>
                         <div className="text-right hidden xl:block">
                            <p className="text-xs text-blue-200 font-bold uppercase">Ngày vào viện</p>
                            <p className="font-bold font-mono flex items-center justify-end gap-1"><ClockIcon className="w-3.5 h-3.5"/> {patient.admissionDate.split(' ')[0]}</p>
                         </div>
                    </div>
                 </div>
            </div>

            {/* 2. MAIN CONTENT (Split Layout) */}
            <div className="flex-1 flex overflow-hidden p-4 gap-4">
                
                {/* LEFT: Financial Summary & Actions (Fixed Width) */}
                <div className="w-80 flex-shrink-0 h-full overflow-hidden">
                    <BillingPatientInfo patient={patient} onAction={handleAction} />
                </div>

                {/* RIGHT: Items Table (Flexible) */}
                <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 pt-2">
                        <button 
                            onClick={() => setActiveTab('items')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'items' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-t border-x border-slate-200 dark:border-slate-700 -mb-px' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <ListBulletIcon className="w-4 h-4"/> Bảng kê Chi tiết
                        </button>
                        <button 
                            onClick={() => setActiveTab('receipts')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'receipts' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-t border-x border-slate-200 dark:border-slate-700 -mb-px' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <ReceiptIcon className="w-4 h-4"/> Lịch sử Phiếu thu
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'items' ? (
                            <div className="h-full p-0">
                                <BillingItemsTable items={items} />
                            </div>
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
