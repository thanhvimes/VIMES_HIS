
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagingResult } from '../../../types';
import { mockRequests, ImagingRequest } from '../data'; // Reuse the richer data source
import { 
    PhotographIcon, 
    SearchIcon, 
    XIcon, 
    EyeIcon,
    CheckBadgeIcon,
    PencilIcon,
    PrinterIcon,
    DocumentTextIcon,
    CalendarIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

const ResultsListView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const [requests] = useState<ImagingRequest[]>(mockRequests);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Draft' | 'Approved'>('All');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // --- Filter Logic ---
    const filteredResults = useMemo(() => {
        return requests.filter(req => {
            // Only show items that have images (Acquired or later)
            if (!['Acquired', 'Reported', 'Approved'].includes(req.status)) return false;

            const matchesSearch = req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  req.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  req.id.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === 'All' || 
                                  (filterStatus === 'Approved' && req.status === 'Approved') ||
                                  (filterStatus === 'Draft' && req.status !== 'Approved');

            return matchesSearch && matchesStatus;
        });
    }, [requests, searchTerm, filterStatus]);

    const handleViewDetail = (requestId: string) => {
        navigate(`/imaging-results/detail/${requestId}`);
    };

    const getStatusBadge = (status: string) => {
        if (status === 'Approved') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                    <CheckBadgeIcon className="w-3 h-3"/> Đã duyệt
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                <PencilIcon className="w-3 h-3"/> Đang đọc
            </span>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            
            {/* 1. Header & Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <DocumentTextIcon className="w-6 h-6 text-purple-600"/>
                        Tra cứu Kết quả (PACS/RIS)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Danh sách kết quả hình ảnh đã thực hiện.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {/* Status Filter */}
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 self-start sm:self-auto">
                        {['All', 'Draft', 'Approved'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilterStatus(tab as any)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                    filterStatus === tab 
                                    ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-300 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {tab === 'All' ? 'Tất cả' : tab === 'Approved' ? 'Đã duyệt' : 'Chưa duyệt'}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm BN, Tên dịch vụ..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 text-sm ${fontSettings.controls}`}
                        />
                    </div>
                </div>
            </div>
      
            {/* 2. Result List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-16 text-center">Ảnh</th>
                                <th className="p-4">Accession No.</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Dịch vụ</th>
                                <th className="p-4">Ngày thực hiện</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredResults.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-slate-400 dark:text-slate-500 italic">
                                        Không tìm thấy kết quả phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredResults.map(res => (
                                    <tr key={res.id} className="hover:bg-purple-50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => handleViewDetail(res.id)}>
                                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            {res.imageUrl ? (
                                                <div 
                                                    className="w-10 h-10 bg-black rounded overflow-hidden cursor-pointer relative mx-auto border border-slate-300 dark:border-slate-600 hover:ring-2 hover:ring-purple-500 transition-all"
                                                    onClick={() => setSelectedImage(res.imageUrl || null)}
                                                >
                                                    <img src={res.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" alt="thumb" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center text-slate-400 mx-auto">
                                                    <PhotographIcon className="w-5 h-5"/>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono text-purple-700 dark:text-purple-400 font-bold text-sm bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                                                {res.id}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">{res.patientName}</div>
                                            <div className="text-xs text-slate-500">{res.gender}, {res.age} tuổi</div>
                                        </td>
                                        <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                                            {res.serviceName}
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                                            <div className="flex items-center gap-1">
                                                <CalendarIcon className="w-3.5 h-3.5"/>
                                                {new Date(res.requestDate).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(res.status)}
                                        </td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleViewDetail(res.id)}
                                                    className="p-1.5 text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-purple-50 dark:hover:bg-slate-600 transition shadow-sm"
                                                    title="Xem chi tiết / Đọc KQ"
                                                >
                                                    <DocumentTextIcon className="w-4 h-4"/>
                                                </button>
                                                <button 
                                                    className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-blue-50 dark:hover:bg-slate-600 transition shadow-sm"
                                                    title="In kết quả"
                                                >
                                                    <PrinterIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Lightbox */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setSelectedImage(null)}>
                    <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition">
                        <XIcon className="w-8 h-8"/>
                    </button>
                    <div className="max-w-[90vw] max-h-[90vh] p-1 bg-gray-800 rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <img src={selectedImage} alt="Kết quả hình ảnh" className="max-w-full max-h-[85vh] object-contain"/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsListView;
