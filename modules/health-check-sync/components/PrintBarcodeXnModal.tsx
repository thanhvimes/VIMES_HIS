// ==================== PRINT BARCODE XN MODAL ====================
// File: modules/health-check-sync/components/PrintBarcodeXnModal.tsx
// Modal 2 cột: Bên trái - danh sách bệnh nhân chưa in barcode XN
//              Bên phải - danh sách phiếu XN của bệnh nhân được chọn

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Code128Barcode } from '../forms/PrintBarcodeForm';
import { catalogService } from '../../../services/catalogService';
import Combobox from '../../../components/ui/Combobox';
import { useSession } from '../../../contexts/SessionContext';

// ========== TYPES ==========

export interface LabOrder {
    id: string;
    orderNo: string;       // Số phiếu XN - dùng làm barcode value
    testName: string;      // Tên loại xét nghiệm
    sampleType: string;    // Loại mẫu: Máu, Nước tiểu, v.v.
    sampleTypeShort?: string; // Tên viết tắt nhóm XN (SH, HH, NT, VS, MD...)
    sampleDate: string;    // Ngày lấy mẫu (ISO string)
    status: 'pending' | 'completed';
    barcodePrinted: boolean;
}

export interface PatientWithOrders {
    id: string;
    patientName: string;
    dob: string;
    age?: string | number; // Tuổi (VD: 46)
    gender: string;        // Giới tính (Nam / Nữ / M / F)
    docNo: string;         // Số hồ sơ KSK / Mã BN
    deptCode?: string;     // Mã khoa / Đối tượng (KB, KSK...)
    labOrders: LabOrder[];
    contractId: string;
    hisDocNo?: string;
}

interface PrintBarcodeXnModalProps {
    patients: any[];       // Danh sách bệnh nhân (từ health-check-sync)
    contracts: any[];      // Danh sách hợp đồng
    onClose: () => void;
    onPrint: (selectedOrders: { patient: PatientWithOrders; orders: LabOrder[] }[]) => void;
}

// ========== HELPER FUNCTIONS FOR BARCODE STICKER FORMATTING ==========

export function calculateAge(dob?: string, ageInput?: any): string {
    if (ageInput !== undefined && ageInput !== null && ageInput !== '') {
        return String(ageInput);
    }
    if (!dob) return '';
    const birthYear = parseInt(String(dob).substring(0, 4), 10);
    if (!isNaN(birthYear) && birthYear > 1900 && birthYear <= new Date().getFullYear()) {
        return String(new Date().getFullYear() - birthYear);
    }
    const parts = String(dob).split('/');
    if (parts.length === 3) {
        const y = parseInt(parts[2], 10);
        if (!isNaN(y) && y > 1900) return String(new Date().getFullYear() - y);
    }
    return '';
}

export function getGenderShort(gender?: string): string {
    if (!gender) return 'M';
    const g = String(gender).trim().toLowerCase();
    if (g === 'nam' || g === 'male' || g === 'm' || g === '1') return 'M';
    if (g === 'nữ' || g === 'nu' || g === 'female' || g === 'f' || g === '2' || g === 'w') return 'F';
    return gender.toUpperCase();
}

export function getSampleTypeShort(testName?: string, sampleType?: string): string {
    const text = `${testName || ''} ${sampleType || ''}`.toLowerCase();
    if (text.includes('huyết học') || text.includes('cbc') || text.includes('máu')) return 'HH';
    if (text.includes('nước tiểu') || text.includes('urinalysis')) return 'NT';
    if (text.includes('vi sinh') || text.includes('soi tươi')) return 'VS';
    if (text.includes('miễn dịch') || text.includes('hormone') || text.includes('tsh')) return 'MD';
    if (text.includes('đông máu')) return 'ĐM';
    return 'SH';
}

export function formatDateTime(dateStr?: string): string {
    if (!dateStr) {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        return `${d}/${m}/${y} ${hh}:${mm}`;
    }
    try {
        const dt = new Date(dateStr);
        if (isNaN(dt.getTime())) return dateStr;
        const d = String(dt.getDate()).padStart(2, '0');
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const y = dt.getFullYear();
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        return `${d}/${m}/${y} ${hh}:${mm}`;
    } catch {
        return dateStr;
    }
}

// Chuyển đổi dữ liệu bệnh nhân từ health-check-sync sang PatientWithOrders
function mapToPatientWithOrders(doc: any): PatientWithOrders {
    const patientId = doc.id?.toString() || '';
    
    // Trích xuất các phiếu xét nghiệm thực tế nếu có
    const items = doc.lab_data?.paraclinical_items || doc.labData?.paraclinical_items || doc.paraclinical_items || [];
    const testItems = items.filter((item: any) => {
        const groupId = String(item.group_id || '').toUpperCase();
        const type = String(item.type || '').toUpperCase();
        return groupId.startsWith('A') || type === 'XN' || String(item.service_name || '').toLowerCase().includes('máu') || String(item.service_name || '').toLowerCase().includes('nước tiểu');
    });

    let labOrders: LabOrder[] = [];

    if (testItems.length > 0) {
        const ordersMap = new Map<string, LabOrder>();
        
        testItems.forEach((item: any) => {
            const orderId = item.order_id ? String(item.order_id).trim() : (doc.doc_no ? String(doc.doc_no) : 'XN1');
            
            if (!ordersMap.has(orderId)) {
                const groupName = item.group_name || item.service_name || 'Xét nghiệm tổng hợp';
                const sType = item.sample_type || (String(item.service_name || '').toLowerCase().includes('nước tiểu') ? 'Nước tiểu' : 'Máu tĩnh mạch');
                ordersMap.set(orderId, {
                    id: `${patientId}-order-${orderId}`,
                    orderNo: orderId, // Giá trị Barcode là hpc_orderid hoặc doc_no
                    testName: groupName,
                    sampleType: sType,
                    sampleTypeShort: item.group_code || getSampleTypeShort(groupName, sType),
                    sampleDate: doc.created_at || new Date().toISOString(),
                    status: 'pending' as const,
                    barcodePrinted: doc.barcode_printed === 'Y',
                });
            }
        });
        
        labOrders = Array.from(ordersMap.values());
    } else if (doc.doc_no) {
        labOrders = [{
            id: `${patientId}-order-${doc.doc_no}`,
            orderNo: String(doc.doc_no),
            testName: 'Xét nghiệm khám sức khỏe',
            sampleType: 'Máu tĩnh mạch',
            sampleTypeShort: 'HH',
            sampleDate: doc.created_at || new Date().toISOString(),
            status: 'pending' as const,
            barcodePrinted: doc.barcode_printed === 'Y',
        }];
    }

    const dob = doc.dob || '';
    const age = calculateAge(dob, doc.age || doc.patient_age);

    return {
        id: patientId,
        patientName: doc.patient_name || doc.fullname || 'Chưa có tên',
        dob,
        age,
        gender: doc.gender || doc.sex || 'Nam',
        docNo: doc.doc_no || doc.his_doc_no || '',
        deptCode: doc.dept_code || doc.department_code || doc.object_type || 'KB',
        labOrders: labOrders,
        contractId: doc.his_contract_id ? String(doc.his_contract_id) : '',
        hisDocNo: doc.his_doc_no || '',
    };
}

// ========== ICONS ==========

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const PrinterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
);

const BeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v11.382a1 1 0 00.553.894l2 1a1 1 0 00.894 0l2-1A1 1 0 0015 14.382V3M9 3h6M9 3H7m8 0h2" />
    </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const doctorColumns = [
    { key: 'id', label: 'Mã người dùng (su_userid)', width: '180px' },
    { key: 'name', label: 'Họ tên nhân viên' }
];

// ========== MAIN COMPONENT ==========

const PrintBarcodeXnModal: React.FC<PrintBarcodeXnModalProps> = ({
    patients,
    contracts,
    onClose,
    onPrint,
}) => {
    const { user } = useSession();
    const [searchPatient, setSearchPatient] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    const [selectedContractId, setSelectedContractId] = useState<string>('All');

    // Sampling Config States
    const [sampleAreas, setSampleAreas] = useState<any[]>([]);
    const [sampleGates, setSampleGates] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);

    const [selectedArea, setSelectedArea] = useState('');
    const [selectedGate, setSelectedGate] = useState('');
    const [selectedCollectorId, setSelectedCollectorId] = useState('');

    useEffect(() => {
        catalogService.getSysSelItems('hms_sample_area').then(data => {
            setSampleAreas(data || []);
            if (data && data.length > 0) setSelectedArea(data[0].code);
        }).catch(err => console.error("Error loading hms_sample_area", err));

        catalogService.getSysSelItems('hms_sample_gate').then(data => {
            setSampleGates(data || []);
            if (data && data.length > 0) setSelectedGate(data[0].code);
        }).catch(err => console.error("Error loading hms_sample_gate", err));

        catalogService.getDoctors().then(data => {
            setDoctors(data || []);
        }).catch(err => console.error("Error loading doctors", err));
        
        if (user) {
            setSelectedCollectorId(user.userId || '');
        }
    }, [user]);

    // Portal container
    const [portalContainer] = React.useState(() => {
        const div = window.document.createElement('div');
        div.style.zIndex = '9999';
        return div;
    });

    React.useEffect(() => {
        window.document.body.appendChild(portalContainer);
        return () => {
            if (window.document.body.contains(portalContainer)) {
                window.document.body.removeChild(portalContainer);
            }
        };
    }, [portalContainer]);

    // Chỉ lấy bệnh nhân chưa in barcode (barcode_printed = 'N' hoặc undefined)
    const eligiblePatients = useMemo(() =>
        patients
            .filter(doc => (doc.barcode_printed || 'N') === 'N')
            .map(mapToPatientWithOrders)
            .filter(patient => patient.labOrders.length > 0),
        [patients]
    );

    // Filter bệnh nhân theo tìm kiếm và gói khám
    const filteredPatients = useMemo(() =>
        eligiblePatients.filter(p => {
            const matchesSearch = p.patientName.toLowerCase().includes(searchPatient.toLowerCase()) ||
                                  p.docNo.toLowerCase().includes(searchPatient.toLowerCase());
            const matchesContract = selectedContractId === 'All' || p.contractId === selectedContractId;
            return matchesSearch && matchesContract;
        }),
        [eligiblePatients, searchPatient, selectedContractId]
    );

    // Bệnh nhân đang được chọn
    const selectedPatient = useMemo(() =>
        eligiblePatients.find(p => p.id === selectedPatientId) || null,
        [eligiblePatients, selectedPatientId]
    );

    // Khi chọn bệnh nhân mới → tự động tích chọn tất cả phiếu XN
    const handleSelectPatient = (patient: PatientWithOrders) => {
        setSelectedPatientId(patient.id);
        setSelectedOrderIds(new Set(patient.labOrders.map(o => o.id)));
    };

    // Toggle chọn từng phiếu XN
    const handleToggleOrder = (orderId: string) => {
        const next = new Set(selectedOrderIds);
        if (next.has(orderId)) next.delete(orderId);
        else next.add(orderId);
        setSelectedOrderIds(next);
    };

    // Toggle chọn tất cả phiếu XN
    const handleSelectAllOrders = (checked: boolean) => {
        if (!selectedPatient) return;
        if (checked) {
            setSelectedOrderIds(new Set(selectedPatient.labOrders.map(o => o.id)));
        } else {
            setSelectedOrderIds(new Set());
        }
    };

    // Tổng số phiếu đã chọn
    const totalSelectedOrders = selectedOrderIds.size;

    const handlePrint = () => {
        if (!selectedPatient || selectedOrderIds.size === 0) return;
        
        const selectedCollectorName = doctors.find(d => d.id === selectedCollectorId)?.name || '';
        const ordersToprint = selectedPatient.labOrders
            .map(o => ({
                ...o,
                sampleAreaCode: selectedArea,
                sampleAreaName: sampleAreas.find(a => a.code === selectedArea)?.name || '',
                sampleGateCode: selectedGate,
                sampleGateName: sampleGates.find(g => g.code === selectedGate)?.name || '',
                collectorId: selectedCollectorId,
                collectorName: selectedCollectorName,
                hisDocNo: selectedPatient.hisDocNo || ''
            }))
            .filter(o => selectedOrderIds.has(o.id));

        onPrint([{ patient: selectedPatient, orders: ordersToprint as any }]);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
                style={{ minHeight: 520 }}
            >
                {/* ===== HEADER ===== */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-orange-600 to-orange-500 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <PrinterIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-white tracking-tight">In Barcode Phiếu Xét Nghiệm</h2>
                            <p className="text-orange-100/80 text-xs mt-0.5">
                                Chọn bệnh nhân → chọn phiếu XN → in tem barcode nhiệt
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* ===== BODY: 2 COLUMNS ===== */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ===== LEFT COLUMN: Danh sách bệnh nhân ===== */}
                    <div className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-800/50">
                        {/* Search & Filter */}
                        <div className="p-3 border-b border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Gói hợp đồng</label>
                                <select 
                                    value={selectedContractId}
                                    onChange={e => setSelectedContractId(e.target.value)}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-750 text-slate-800 dark:text-white font-bold cursor-pointer focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                >
                                    <option value="All">Tất cả gói khám</option>
                                    {contracts.map(c => (
                                        <option key={c.id} value={String(c.id)}>{c.code} - {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                                    <UserIcon className="w-3.5 h-3.5" />
                                    Bệnh nhân chưa in ({filteredPatients.length}/{eligiblePatients.length})
                                </div>
                                <div className="relative">
                                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Tên BN, số hồ sơ..."
                                        value={searchPatient}
                                        onChange={e => setSearchPatient(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-orange-400 focus:outline-none placeholder:text-slate-400 font-semibold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Patient list */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredPatients.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-xs">
                                    <BeakerIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                    <div>Không có bệnh nhân chưa in</div>
                                </div>
                            ) : (
                                filteredPatients.map(patient => {
                                    const isSelected = selectedPatientId === patient.id;
                                    return (
                                        <button
                                            key={patient.id}
                                            onClick={() => handleSelectPatient(patient)}
                                            className={`w-full text-left px-3 py-3 border-b border-slate-100 dark:border-slate-700/50 transition-all group ${
                                                isSelected
                                                    ? 'bg-orange-50 dark:bg-orange-950/30 border-l-2 border-l-orange-500'
                                                    : 'hover:bg-white dark:hover:bg-slate-700/50 border-l-2 border-l-transparent'
                                            }`}
                                        >
                                            <div className={`font-bold text-[13px] leading-tight truncate ${isSelected ? 'text-orange-700 dark:text-orange-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {patient.patientName}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-500 font-mono">{patient.docNo}</span>
                                                <span className="text-slate-300 dark:text-slate-600">·</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                    isSelected
                                                        ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                                }`}>
                                                    {patient.labOrders.length} phiếu XN
                                                </span>
                                            </div>
                                            {patient.dob && (
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    NS: {new Date(patient.dob).toLocaleDateString('vi-VN')} · {patient.gender}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ===== RIGHT COLUMN: Danh sách phiếu XN ===== */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {selectedPatient ? (
                            <>
                                {/* Patient info header */}
                                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                                    <div>
                                        <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                                            {selectedPatient.patientName}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                            Hồ sơ: {selectedPatient.docNo}
                                            {selectedPatient.dob && ` · NS: ${new Date(selectedPatient.dob).toLocaleDateString('vi-VN')}`}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-slate-500">Chọn tất cả</span>
                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedPatient.labOrders.length > 0 &&
                                                selectedOrderIds.size === selectedPatient.labOrders.length
                                            }
                                            onChange={e => handleSelectAllOrders(e.target.checked)}
                                            className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                
                                {/* Cấu hình lấy mẫu */}
                                <div className="px-5 py-3 bg-orange-50/40 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-fadeIn">
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Khu vực lấy mẫu</label>
                                        <select 
                                            value={selectedArea} 
                                            onChange={e => setSelectedArea(e.target.value)} 
                                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-750 text-slate-800 dark:text-white font-bold cursor-pointer focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                        >
                                            {sampleAreas.map(item => (
                                                <option key={item.code} value={String(item.code)}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cửa lấy mẫu</label>
                                        <select 
                                            value={selectedGate} 
                                            onChange={e => setSelectedGate(e.target.value)} 
                                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-750 text-slate-800 dark:text-white font-bold cursor-pointer focus:ring-1 focus:ring-orange-500 focus:outline-none"
                                        >
                                            {sampleGates.map(item => (
                                                <option key={item.code} value={String(item.code)}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Người lấy mẫu</label>
                                        <Combobox
                                            value={selectedCollectorId}
                                            options={doctors}
                                            columns={doctorColumns}
                                            onChange={(val) => setSelectedCollectorId(val)}
                                            placeholder="-- Chọn người lấy mẫu --"
                                            className="w-full text-xs font-bold"
                                        />
                                    </div>
                                </div>

                                {/* Lab orders list */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50 dark:bg-slate-800/30">
                                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                        <BeakerIcon className="w-3.5 h-3.5" />
                                        Danh sách phiếu XN ({selectedPatient.labOrders.length} phiếu)
                                    </div>

                                    {selectedPatient.labOrders.map(order => {
                                        const isChecked = selectedOrderIds.has(order.id);
                                        return (
                                            <div
                                                key={order.id}
                                                onClick={() => handleToggleOrder(order.id)}
                                                className={`cursor-pointer rounded-xl border p-4 transition-all select-none ${
                                                    isChecked
                                                        ? 'bg-white dark:bg-slate-800 border-orange-300 dark:border-orange-700 shadow-md shadow-orange-100 dark:shadow-orange-900/20'
                                                        : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="pt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => handleToggleOrder(order.id)}
                                                            onClick={e => e.stopPropagation()}
                                                            className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-black text-[13px] text-slate-900 dark:text-white">
                                                                {order.testName}
                                                            </span>
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                                                                order.status === 'completed'
                                                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                                                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                                                            }`}>
                                                                {order.status === 'completed' ? 'Đã có KQ' : 'Chờ lấy mẫu'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                            <span className="text-[11px] text-slate-500">
                                                                Mẫu: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.sampleType}</span>
                                                            </span>
                                                            <span className="text-slate-300 dark:text-slate-600">·</span>
                                                            <span className="text-[11px] text-slate-500">
                                                                Ngày: <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                                    {new Date(order.sampleDate).toLocaleDateString('vi-VN')}
                                                                </span>
                                                            </span>
                                                        </div>
                                                        {/* Barcode preview */}
                                                        <div className={`mt-3 flex items-center gap-3 transition-opacity ${isChecked ? 'opacity-100' : 'opacity-40'}`}>
                                                            <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 inline-flex flex-col items-center shadow-sm">
                                                                <Code128Barcode value={order.orderNo} height={20} />
                                                                <span className="text-[8px] font-mono text-slate-600 mt-0.5 font-bold">{order.orderNo}</span>
                                                            </div>
                                                            {isChecked && (
                                                                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1 animate-in fade-in duration-200">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span>
                                                                    Đã chọn in
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            /* Empty state - chưa chọn bệnh nhân */
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8">
                                <div className="w-20 h-20 rounded-2xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center mb-4">
                                    <BeakerIcon className="w-10 h-10 text-orange-300 dark:text-orange-700" />
                                </div>
                                <div className="text-base font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Chưa chọn bệnh nhân
                                </div>
                                <div className="text-sm text-slate-400 text-center max-w-xs">
                                    Chọn một bệnh nhân từ danh sách bên trái để xem danh sách phiếu xét nghiệm cần in barcode.
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 font-medium">
                                        {eligiblePatients.length} bệnh nhân chưa in
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== FOOTER ===== */}
                <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between rounded-b-2xl">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        {totalSelectedOrders > 0 ? (
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block"></span>
                                Đã chọn{' '}
                                <strong className="text-orange-600 dark:text-orange-400">
                                    {totalSelectedOrders} phiếu XN
                                </strong>{' '}
                                {selectedPatient && `của BN ${selectedPatient.patientName}`}
                            </span>
                        ) : (
                            <span className="text-slate-400">Chưa có phiếu XN nào được chọn</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm font-bold transition"
                        >
                            Đóng
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={totalSelectedOrders === 0}
                            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-black shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                        >
                            <PrinterIcon className="w-4 h-4" />
                            In {totalSelectedOrders > 0 ? `${totalSelectedOrders} tem barcode` : 'tem barcode'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        portalContainer
    );
};

export default PrintBarcodeXnModal;
