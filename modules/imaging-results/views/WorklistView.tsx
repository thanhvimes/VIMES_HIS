import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    SearchIcon, 
    PlayIcon, 
    ClockIcon, 
    ScannerIcon,
    FilterIcon,
    RefreshIcon,
    CheckBadgeIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSession } from '../../../contexts/SessionContext';
import { mockRequests } from '../data';

// Self-contained StarIcon for Favorites
const StarIcon = ({ className, fill = 'none' }: { className?: string, fill?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill={fill} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.195-.39.687-.39.882 0l2.4 4.881a.5.5 0 00.453.329l5.385.783c.437.063.61.6.294.908l-3.896 3.799a.5.5 0 00-.144.444l.92 5.36c.075.438-.387.773-.777.567l-4.81-2.53a.5.5 0 00-.47 0l-4.81 2.53c-.39.206-.852-.13-.777-.567l.92-5.36a.5.5 0 00-.144-.444L2.008 11.3c-.315-.308-.142-.845.294-.908l5.385-.783a.5.5 0 00.453-.329l2.4-4.881z" />
    </svg>
);

const GearIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.552 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.936 6.936 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

interface ImagingRequest {
    id: string;
    orderId: number;
    itemId: number;
    docNo: string;
    patientId: string;
    patientName: string;
    age: number;
    gender: string;
    serviceName: string;
    modality: string;
    requestDate: string;
    priority: 'Normal' | 'Urgent';
    status: 'Scheduled' | 'Processing' | 'Acquired' | 'Reported' | 'Approved';
    imageUrl?: string;
}

interface ColumnConfig {
    id: string;
    label: string;
    visible: boolean;
}

const WorklistView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const { user } = useSession();
    const doctorId = user?.userId || 'BS001';

    // State
    const [requests, setRequests] = useState<ImagingRequest[]>([]);
    const [favorites, setFavorites] = useState<{ order_id: number, item_id: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalityFilter, setModalityFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showConfig, setShowConfig] = useState(false);

    // Column Config State
    const [columns, setColumns] = useState<ColumnConfig[]>(() => {
        const saved = localStorage.getItem('vclinic_pacs_worklist_cols');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [
            { id: 'index', label: 'STT', visible: true },
            { id: 'fav', label: 'Yêu thích', visible: true },
            { id: 'order', label: 'Mã / Ngày chụp', visible: true },
            { id: 'patient', label: 'Bệnh nhân', visible: true },
            { id: 'service', label: 'Chỉ định khảo sát', visible: true },
            { id: 'priority', label: 'Ưu tiên', visible: true },
            { id: 'status', label: 'Trạng thái', visible: true },
            { id: 'action', label: 'Thao tác', visible: true },
        ];
    });

    const configRef = useRef<HTMLDivElement>(null);

    // Load Data
    const loadWorklist = () => {
        setIsLoading(true);
        try {
            let localReqs = localStorage.getItem('vclinic_pacs_requests');
            let parsedReqs: ImagingRequest[] = [];
            
            if (localReqs) {
                try {
                    parsedReqs = JSON.parse(localReqs);
                } catch (e) {
                    parsedReqs = [];
                }
            }
            
            if (parsedReqs.length === 0) {
                parsedReqs = mockRequests.map((r: any) => ({
                    id: r.id,
                    orderId: r.orderId || parseInt(r.id.replace(/\D/g, '')) || 1,
                    itemId: r.itemId || 1001,
                    docNo: r.docNo || 'DOC001',
                    patientId: r.patientId || '',
                    patientName: r.patientName || 'Không rõ',
                    age: Number(r.age) || 0,
                    gender: r.gender || 'Khác',
                    serviceName: r.serviceName || 'Dịch vụ CĐHA',
                    modality: r.modality || 'X-Ray',
                    requestDate: r.requestDate || '',
                    priority: r.priority || 'Normal',
                    status: r.status || 'Scheduled',
                    imageUrl: r.imageUrl || '',
                    report: r.report || ''
                }));
                localStorage.setItem('vclinic_pacs_requests', JSON.stringify(parsedReqs));
            }
            
            setRequests(parsedReqs);

            // Load favorites
            const localFavs = localStorage.getItem('vclinic_pacs_favorites');
            if (localFavs) {
                try {
                    setFavorites(JSON.parse(localFavs));
                } catch (e) {
                    setFavorites([]);
                }
            } else {
                setFavorites([]);
            }
        } catch (e) {
            console.error('Error loading worklist data:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadWorklist();
    }, [modalityFilter]);

    // SSE Event Listener
    useEffect(() => {
        const sseUrl = '/api/queue/events';
        const eventSource = new EventSource(sseUrl);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'QUEUE_UPDATED' || data.type === 'NEW_TICKET') {
                    console.log('SSE update received, reloading worklist...');
                    loadWorklist();
                }
            } catch (e) {
                // Ignore parsing errors
            }
        };

        // Close configuration on click outside
        const handleOutsideClick = (e: MouseEvent) => {
            if (configRef.current && !configRef.current.contains(e.target as Node)) {
                setShowConfig(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            eventSource.close();
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    // Toggle Column Visibility
    const toggleColumn = (colId: string) => {
        const updated = columns.map(c => c.id === colId ? { ...c, visible: !c.visible } : c);
        setColumns(updated);
        localStorage.setItem('vclinic_pacs_worklist_cols', JSON.stringify(updated));
    };

    const handleToggleFavorite = (e: React.MouseEvent, req: ImagingRequest) => {
        e.stopPropagation();
        const isFav = favorites.some(f => f.order_id === req.orderId && f.item_id === req.itemId);
        let updated: { order_id: number, item_id: number }[] = [];
        
        if (isFav) {
            updated = favorites.filter(f => !(f.order_id === req.orderId && f.item_id === req.itemId));
        } else {
            updated = [...favorites, { order_id: req.orderId, item_id: req.itemId }];
        }
        
        setFavorites(updated);
        localStorage.setItem('vclinic_pacs_favorites', JSON.stringify(updated));
    };

    // Filter Logic
    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const isFav = favorites.some(f => f.order_id === req.orderId && f.item_id === req.itemId);
            const patName = req.patientName || '';
            const patId = req.patientId || '';
            const reqId = req.id || '';
            const matchesSearch = patName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  patId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  reqId.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesModality = modalityFilter === 'All' || req.modality === modalityFilter;
            
            let matchesStatus = true;
            if (statusFilter === 'Favorites') {
                matchesStatus = isFav;
            } else if (statusFilter !== 'All') {
                matchesStatus = req.status === statusFilter;
            }
            
            return matchesSearch && matchesModality && matchesStatus;
        }).sort((a, b) => {
            if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
            if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;
            return (b.requestDate || '').localeCompare(a.requestDate || '');
        });
    }, [requests, favorites, searchTerm, modalityFilter, statusFilter]);

    const handleOpenReading = (req: ImagingRequest) => {
        navigate(`/imaging-results/reading/${req.id}`);
    };

    const getModalityColor = (m: string) => {
        switch(m?.toUpperCase()) {
            case 'CT': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'MRI': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'ULTRASOUND': case 'SIÊU ÂM': return 'bg-pink-100 text-pink-700 border-pink-200';
            case 'X-RAY': case 'X-QUANG': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusBadge = (s: string) => {
        switch(s) {
            case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Processing': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Acquired': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const isColVisible = (colId: string) => {
        return columns.find(c => c.id === colId)?.visible ?? true;
    };

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header & Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/20 animate-pulse">
                        <ScannerIcon className="w-6 h-6"/>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Trạm đọc kết quả PACS/RIS</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-ping"></span> PACS Worklist • Live QMS
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    <div className="relative flex-1 md:w-64">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm bệnh nhân, mã chỉ định..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${fontSettings.controls}`}
                        />
                    </div>
                    
                    <select 
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold outline-none cursor-pointer"
                    >
                        <option value="All">Tất cả trạng thái</option>
                        <option value="Scheduled">Chờ chụp</option>
                        <option value="Acquired">Đã có ảnh</option>
                        <option value="Processing">Đang đọc</option>
                        <option value="Approved">Đã duyệt</option>
                        <option value="Favorites">⭐ Danh sách yêu thích</option>
                    </select>

                    <button 
                        onClick={loadWorklist}
                        className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 hover:text-slate-900 rounded-xl transition active:scale-95"
                        title="Tải lại danh sách"
                    >
                        <RefreshIcon className="w-5 h-5"/>
                    </button>

                    {/* Column Config Dropdown */}
                    <div className="relative" ref={configRef}>
                        <button 
                            onClick={() => setShowConfig(!showConfig)}
                            className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 hover:text-slate-900 rounded-xl transition flex items-center gap-1 active:scale-95"
                            title="Tùy biến cột"
                        >
                            <GearIcon className="w-5 h-5"/>
                        </button>

                        {showConfig && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-3 animate-fade-in">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 border-b pb-1 dark:border-slate-700">Ẩn / Hiện các cột</h4>
                                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                    {columns.map(col => (
                                        <label key={col.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                                            <input 
                                                type="checkbox" 
                                                checked={col.visible}
                                                onChange={() => toggleColumn(col.id)}
                                                className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                                            />
                                            {col.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 gap-3">
                            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="font-bold text-sm">Đang tải danh sách chờ...</p>
                        </div>
                    ) : (
                        <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {isColVisible('index') && <th className="p-4 w-12 text-center">STT</th>}
                                    {isColVisible('fav') && <th className="p-4 w-12 text-center">Yêu thích</th>}
                                    {isColVisible('order') && <th className="p-4">Chỉ định / Ngày chụp</th>}
                                    {isColVisible('patient') && <th className="p-4">Bệnh nhân</th>}
                                    {isColVisible('service') && <th className="p-4">Nội dung khảo sát</th>}
                                    {isColVisible('priority') && <th className="p-4 text-center">Mức độ</th>}
                                    {isColVisible('status') && <th className="p-4 text-center">Trạng thái</th>}
                                    {isColVisible('action') && <th className="p-4 text-center">Thao tác</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {filteredRequests.length === 0 ? (
                                    <tr><td colSpan={8} className="p-20 text-center text-slate-400 italic font-bold">Không tìm thấy ca chụp nào phù hợp.</td></tr>
                                ) : (
                                    filteredRequests.map((req, idx) => {
                                        const isFav = favorites.some(f => f.order_id === req.orderId && f.item_id === req.itemId);
                                        return (
                                            <tr 
                                                key={req.id} 
                                                onClick={() => handleOpenReading(req)}
                                                className={`hover:bg-purple-50/40 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer ${req.priority === 'Urgent' ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                                            >
                                                {isColVisible('index') && (
                                                    <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                )}
                                                {isColVisible('fav') && (
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={(e) => handleToggleFavorite(e, req)}
                                                            className={`p-1 rounded-full transition-all active:scale-90 ${isFav ? 'text-amber-500 scale-110' : 'text-slate-300 hover:text-amber-400 dark:text-slate-600'}`}
                                                        >
                                                            <StarIcon className="w-5 h-5" fill={isFav ? '#f59e0b' : 'none'}/>
                                                        </button>
                                                    </td>
                                                )}
                                                {isColVisible('order') && (
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase border ${getModalityColor(req.modality)}`}>
                                                                {req.modality}
                                                            </span>
                                                            <span className="font-bold text-slate-700 dark:text-slate-200">{req.id}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                                                            <ClockIcon className="w-3.5 h-3.5"/> {req.requestDate}
                                                        </div>
                                                    </td>
                                                )}
                                                {isColVisible('patient') && (
                                                    <td className="p-4">
                                                        <div className="font-black text-slate-800 dark:text-white uppercase text-sm">{req.patientName}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">{req.gender}, {req.age}T • ID: {req.patientId}</div>
                                                    </td>
                                                )}
                                                {isColVisible('service') && (
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-700 dark:text-slate-200 text-sm leading-tight">{req.serviceName}</div>
                                                    </td>
                                                )}
                                                {isColVisible('priority') && (
                                                    <td className="p-4 text-center">
                                                        {req.priority === 'Urgent' ? (
                                                            <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded uppercase animate-pulse shadow-sm">Cấp cứu</span>
                                                        ) : (
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Thường</span>
                                                        )}
                                                    </td>
                                                )}
                                                {isColVisible('status') && (
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${getStatusBadge(req.status)}`}>
                                                            {req.status === 'Acquired' ? 'Đã có ảnh' : req.status === 'Approved' ? 'Đã duyệt' : req.status === 'Processing' ? 'Đang đọc' : 'Chờ chụp'}
                                                        </span>
                                                    </td>
                                                )}
                                                {isColVisible('action') && (
                                                    <td className="p-4 text-center">
                                                        <button className="mx-auto px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black text-[9px] uppercase shadow-md flex items-center gap-1 transition transform active:scale-95 group-hover:scale-105">
                                                            <PlayIcon className="w-3 h-3"/> Đọc KQ
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                {/* Footer Stats */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">
                    <div className="flex gap-4">
                        <span>Tổng số: {filteredRequests.length} ca</span>
                        <span className="text-red-500">Cấp cứu: {filteredRequests.filter(r => r.priority === 'Urgent').length}</span>
                        <span className="text-blue-600">Đã chụp: {filteredRequests.filter(r => r.status === 'Acquired').length}</span>
                        <span className="text-amber-500">⭐ Đã lưu: {favorites.length} ca</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorklistView;
