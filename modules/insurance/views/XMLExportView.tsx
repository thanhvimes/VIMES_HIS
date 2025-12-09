
import React, { useState, useEffect, useMemo } from 'react';
import { 
    CloudUploadIcon, 
    DocumentTextIcon, 
    RefreshIcon,
    PaperAirplaneIcon,
    DownloadIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    XIcon
} from '../../../components/Icons';
import { insuranceService, InsuranceClaim } from '../../../services/insuranceService';
import { useTheme } from '../../../contexts/ThemeContext';

// --- VALIDATION MODAL ---
const ValidationModal = ({ isOpen, onClose, claims, onConfirm }: { isOpen: boolean, onClose: () => void, claims: InsuranceClaim[], onConfirm: () => void }) => {
    const [results, setResults] = useState<{id: string, name: string, status: 'pass'|'fail', errors: string[]}[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        if(isOpen && claims.length > 0) {
            runChecks();
        }
    }, [isOpen]);

    const runChecks = () => {
        setIsChecking(true);
        setTimeout(() => {
            const checkResults = claims.map(c => {
                const errors = [];
                // Mock Rules
                if(c.totalAmount > 5000000 && !c.patientName.includes('A')) errors.push("Tổng chi phí cao cần hội chẩn (Quy tắc 42)");
                if(!c.cardNumber.startsWith('GD') && !c.cardNumber.startsWith('DN')) errors.push("Mã thẻ không hợp lệ (Quy tắc 01)");
                // Random error for demo
                if(Math.random() > 0.8) errors.push("Sai ngày giường (Quy tắc 15)");
                
                return {
                    id: c.id,
                    name: c.patientName,
                    status: errors.length === 0 ? 'pass' as const : 'fail' as const,
                    errors
                };
            });
            setResults(checkResults);
            setIsChecking(false);
        }, 1500);
    };

    const passedCount = results.filter(r => r.status === 'pass').length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up max-h-[80vh]">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ShieldCheckIcon className="w-6 h-6 text-green-600"/> Giám định Quy tắc tự động
                    </h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5 text-slate-400"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                    {isChecking ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <RefreshIcon className="w-10 h-10 text-green-600 animate-spin mb-3"/>
                            <p className="text-slate-600 font-medium">Đang kiểm tra {claims.length} hồ sơ theo 45 quy tắc giám định...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">{passedCount}</div>
                                    <div className="text-xs text-green-700 uppercase font-bold">Hợp lệ</div>
                                </div>
                                <div className="flex-1 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-red-600">{results.length - passedCount}</div>
                                    <div className="text-xs text-red-700 uppercase font-bold">Có lỗi</div>
                                </div>
                            </div>
                            
                            {results.map(res => (
                                <div key={res.id} className={`p-3 rounded-lg border flex items-start gap-3 ${res.status === 'pass' ? 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'}`}>
                                    <div className="mt-0.5">
                                        {res.status === 'pass' ? <CheckCircleIcon className="w-5 h-5 text-green-500"/> : <ExclamationCircleIcon className="w-5 h-5 text-red-500"/>}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-800 dark:text-white">{res.name} <span className="font-normal text-slate-500">({res.id})</span></div>
                                        {res.errors.length > 0 ? (
                                            <ul className="mt-1 space-y-1">
                                                {res.errors.map((err, i) => (
                                                    <li key={i} className="text-xs text-red-600 font-medium">• {err}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="text-xs text-green-600">Đủ điều kiện xuất XML</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded">Hủy bỏ</button>
                    <button 
                        onClick={onConfirm}
                        disabled={isChecking || passedCount === 0}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        Tiếp tục xuất XML ({passedCount})
                    </button>
                </div>
            </div>
        </div>
    );
};

const XMLExportView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [claims, setClaims] = useState<InsuranceClaim[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filterStatus, setFilterStatus] = useState('All');
    
    // Validation Modal
    const [isValidationOpen, setIsValidationOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const data = await insuranceService.getClaimsList();
        setClaims(data);
        setIsLoading(false);
    };

    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === claims.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(claims.map(c => c.id)));
        }
    };

    const handlePreCheck = () => {
        if(selectedIds.size === 0) return alert("Vui lòng chọn hồ sơ.");
        setIsValidationOpen(true);
    };

    const handleGenerateXML = () => {
        // Mock generation
        setIsValidationOpen(false); // Close modal
        setClaims(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, xmlStatus: 'Generated' } : c));
        alert(`Đã sinh ${selectedIds.size} file XML thành công! Sẵn sàng gửi cổng.`);
    };

    const handleSendToPortal = async () => {
        if(selectedIds.size === 0) return alert("Vui lòng chọn hồ sơ.");
        
        // Check if XML is generated
        const notGenerated = claims.filter(c => selectedIds.has(c.id) && c.xmlStatus !== 'Generated');
        if (notGenerated.length > 0) {
            alert(`Có ${notGenerated.length} hồ sơ chưa sinh XML. Vui lòng sinh XML trước.`);
            return;
        }

        setIsLoading(true);
        await insuranceService.sendToPortal(Array.from(selectedIds));
        
        setClaims(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, status: 'Sent' } : c));
        setIsLoading(false);
        alert("Đã gửi dữ liệu lên cổng giám định!");
        setSelectedIds(new Set());
    };

    const handleDownloadXML = (claim: InsuranceClaim) => {
        const xmlContent = insuranceService.generateXML4210(claim.id);
        const blob = new Blob([xmlContent], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `HS_4210_${claim.id}.xml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredClaims = useMemo(() => {
        if (filterStatus === 'All') return claims;
        return claims.filter(c => c.status === filterStatus);
    }, [claims, filterStatus]);

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'Accepted': return <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">Đã giám định</span>;
            case 'Sent': return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">Đã gửi</span>;
            case 'Error': return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">Lỗi</span>;
            default: return <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700">Chờ gửi</span>;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header & Actions */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CloudUploadIcon className="w-8 h-8 text-green-600"/> Cổng đẩy dữ liệu BHYT
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý xuất XML 130/4210 và gửi hồ sơ giám định.</p>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={handlePreCheck}
                        disabled={selectedIds.size === 0 || isLoading}
                        className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        <ShieldCheckIcon className="w-4 h-4 text-green-600"/> Giám định & Sinh XML
                    </button>
                    <button 
                        onClick={handleSendToPortal}
                        disabled={selectedIds.size === 0 || isLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md flex items-center gap-2 disabled:opacity-50 transition-transform active:scale-95"
                    >
                        {isLoading ? <RefreshIcon className="w-4 h-4 animate-spin"/> : <PaperAirplaneIcon className="w-4 h-4 -rotate-45"/>}
                        Gửi Cổng Giám định
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex justify-between items-center p-2">
                <div className="flex gap-2">
                     <button onClick={() => setFilterStatus('All')} className={`px-3 py-1 rounded text-sm font-medium ${filterStatus === 'All' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>Tất cả</button>
                     <button onClick={() => setFilterStatus('Ready')} className={`px-3 py-1 rounded text-sm font-medium ${filterStatus === 'Ready' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>Chờ gửi</button>
                     <button onClick={() => setFilterStatus('Error')} className={`px-3 py-1 rounded text-sm font-medium ${filterStatus === 'Error' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>Lỗi</button>
                </div>
                <div className="text-sm text-slate-500">Đã chọn: <strong>{selectedIds.size}</strong> hồ sơ</div>
            </div>

            {/* Data Table */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === claims.length} className="rounded text-green-600 focus:ring-green-500"/>
                                </th>
                                <th className="p-4">Mã HS / Tên BN</th>
                                <th className="p-4">Số thẻ BHYT</th>
                                <th className="p-4">Ngày KCB</th>
                                <th className="p-4 text-right">Tổng chi phí</th>
                                <th className="p-4 text-right">BHYT Chi trả</th>
                                <th className="p-4 text-center">Trạng thái XML</th>
                                <th className="p-4 text-center">Trạng thái Cổng</th>
                                <th className="p-4 text-right">Tác vụ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredClaims.map(claim => (
                                <tr key={claim.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(claim.id)} 
                                            onChange={() => handleToggleSelect(claim.id)}
                                            className="rounded text-green-600 focus:ring-green-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{claim.patientName}</div>
                                        <div className="text-xs font-mono text-slate-500">{claim.id}</div>
                                        {claim.errorMessage && <div className="text-xs text-red-500 mt-1">{claim.errorMessage}</div>}
                                    </td>
                                    <td className="p-4 font-mono text-blue-600">{claim.cardNumber}</td>
                                    <td className="p-4 text-slate-600">{claim.visitDate}</td>
                                    <td className="p-4 text-right font-bold">{claim.totalAmount.toLocaleString()}</td>
                                    <td className="p-4 text-right text-blue-600 font-bold">{claim.insuranceAmount.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        {claim.xmlStatus === 'Generated' ? <span className="text-green-600 font-bold text-xs">✓ Sẵn sàng</span> : <span className="text-slate-400 text-xs">Chưa có</span>}
                                    </td>
                                    <td className="p-4 text-center">{getStatusBadge(claim.status)}</td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleDownloadXML(claim)}
                                            className="p-2 text-slate-400 hover:text-green-600 rounded-full hover:bg-green-50 transition"
                                            title="Tải XML"
                                        >
                                            <DownloadIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Validation Modal */}
            <ValidationModal 
                isOpen={isValidationOpen}
                onClose={() => setIsValidationOpen(false)}
                claims={claims.filter(c => selectedIds.has(c.id))}
                onConfirm={handleGenerateXML}
            />
        </div>
    );
};

export default XMLExportView;
