
import React, { useState, useEffect, useMemo } from 'react';
import { 
    CloudUploadIcon, 
    DocumentTextIcon, 
    RefreshIcon,
    PaperAirplaneIcon,
    DownloadIcon
} from '../../../components/Icons';
import { insuranceService, InsuranceClaim } from '../../../services/insuranceService';
import { useTheme } from '../../../contexts/ThemeContext';

const XMLExportView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [claims, setClaims] = useState<InsuranceClaim[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filterStatus, setFilterStatus] = useState('All');

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

    const handleGenerateXML = () => {
        // Mock generation
        if(selectedIds.size === 0) return alert("Vui lòng chọn hồ sơ.");
        
        setClaims(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, xmlStatus: 'Generated' } : c));
        alert(`Đã sinh ${selectedIds.size} file XML thành công!`);
    };

    const handleSendToPortal = async () => {
        if(selectedIds.size === 0) return alert("Vui lòng chọn hồ sơ.");
        
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
                        onClick={handleGenerateXML}
                        disabled={selectedIds.size === 0 || isLoading}
                        className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        <DocumentTextIcon className="w-4 h-4"/> Sinh XML
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
        </div>
    );
};

export default XMLExportView;
