
import React, { useState, useMemo } from 'react';
import { mockRequests, ImagingRequest } from '../data';
import { 
    SearchIcon, 
    CheckIcon, 
    PlayIcon, 
    ClockIcon, 
    UserGroupIcon, 
    PhotographIcon, 
    ActivityIcon,
    ScannerIcon,
    ExclamationCircleIcon,
    FilterIcon,
    RefreshIcon,
    ChevronRightIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const WorklistView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const [requests, setRequests] = useState<ImagingRequest[]>(mockRequests);
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [modalityFilter, setModalityFilter] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');

    // --- Actions ---
    const handleStatusChange = (e: React.MouseEvent, id: string, newStatus: ImagingRequest['status']) => {
        e.stopPropagation();
        setRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: newStatus } : req
        ));
    };

    const handleOpenExam = (req: ImagingRequest) => {
        if (req.modality === 'Endoscopy' || req.modality === 'Ultrasound') {
            navigate(`/imaging-results/capture/${req.id}`);
        } else {
            navigate(`/imaging-results/reading/${req.id}`);
        }
    };

    // --- Filtering ---
    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const matchesStatus = statusFilter === 'All' || 
                                  (statusFilter === 'Scheduled' && req.status === 'Scheduled') ||
                                  (statusFilter === 'Processing' && req.status === 'Processing') ||
                                  (statusFilter === 'Completed' && (req.status === 'Acquired' || req.status === 'Reported' || req.status === 'Approved'));
            
            const matchesModality = modalityFilter === 'All' || req.modality === modalityFilter;
            
            const matchesSearch = req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  req.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesStatus && matchesModality && matchesSearch;
        });
    }, [requests, statusFilter, modalityFilter, searchTerm]);

    // --- Helper Functions ---
    const getModalityIcon = (modality: string) => {
        switch (modality) {
            case 'CT': return <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">CT</div>;
            case 'MRI': return <div className="w-8 h-8 rounded bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">MR</div>;
            case 'Ultrasound': return <div className="w-8 h-8 rounded bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs"><ActivityIcon className="w-5 h-5"/></div>;
            case 'Endoscopy': return <div className="w-8 h-8 rounded bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs"><ScannerIcon className="w-5 h-5"/></div>;
            default: return <div className="w-8 h-8 rounded bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs"><PhotographIcon className="w-5 h-5"/></div>;
        }
    };

    const getStatusStep = (status: string) => {
        const steps = ['Scheduled', 'Processing', 'Acquired', 'Reported', 'Approved'];
        const index = steps.indexOf(status);
        const width = Math.max(5, ((index + 1) / steps.length) * 100);
        
        let color = 'bg-gray-300';
        if (status === 'Processing') color = 'bg-blue-500';
        if (status === 'Acquired') color = 'bg-indigo-500';
        if (status === 'Reported') color = 'bg-orange-500';
        if (status === 'Approved') color = 'bg-green-500';

        return (
            <div className="w-24">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">{status}</div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${width}%` }}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Toolbar & Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white whitespace-nowrap mr-2 flex items-center gap-2">
                        <UserGroupIcon className="w-6 h-6 text-blue-600"/>
                        Worklist
                    </h1>
                    <div className="hidden md:block h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
                    
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        {['All', 'X-Ray', 'CT', 'MRI', 'Ultrasound', 'Endoscopy'].map(m => (
                            <button
                                key={m}
                                onClick={() => setModalityFilter(m)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                    modalityFilter === m 
                                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative w-full sm:w-64">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Search Patient, ID, Acc..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 text-sm ${fontSettings.controls}`}
                    />
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-20 text-center">Type</th>
                                <th className="p-4 w-32">Accession</th>
                                <th className="p-4">Patient Information</th>
                                <th className="p-4">Procedure</th>
                                <th className="p-4 w-32">Room</th>
                                <th className="p-4 text-center w-32">Workflow</th>
                                <th className="p-4 text-right w-40">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map(req => (
                                    <tr 
                                        key={req.id} 
                                        onClick={() => handleOpenExam(req)}
                                        className={`group hover:bg-blue-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${req.priority === 'Urgent' ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                                    >
                                        <td className="p-4 flex justify-center">
                                            {getModalityIcon(req.modality)}
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold text-sm">{req.id}</span>
                                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                <ClockIcon className="w-3 h-3"/> {req.requestDate.split(' ')[1]}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-slate-800 dark:text-white">{req.patientName}</div>
                                                {req.priority === 'Urgent' && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">URGENT</span>}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                <span className="font-mono">{req.patientId}</span> • {req.gender}, {req.age}Y
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-800 dark:text-slate-200 font-semibold">{req.serviceName}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                                {req.bodyPart}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                                            {req.room || '--'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center">
                                                {getStatusStep(req.status)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                                            {req.status === 'Scheduled' && (
                                                <button 
                                                    onClick={(e) => handleStatusChange(e, req.id, 'Processing')}
                                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition-transform active:scale-95"
                                                >
                                                    <PlayIcon className="w-3 h-3 mr-1.5"/> Start
                                                </button>
                                            )}
                                            {req.status === 'Processing' && (
                                                <button 
                                                    onClick={(e) => handleStatusChange(e, req.id, 'Acquired')}
                                                    className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm transition-transform active:scale-95"
                                                >
                                                    <CheckIcon className="w-3 h-3 mr-1.5"/> Finish
                                                </button>
                                            )}
                                            {['Acquired', 'Reported', 'Approved'].includes(req.status) && (
                                                <button 
                                                    onClick={() => handleOpenExam(req)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded transition-colors"
                                                >
                                                    Open <ChevronRightIcon className="w-3 h-3 ml-1"/>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorklistView;
