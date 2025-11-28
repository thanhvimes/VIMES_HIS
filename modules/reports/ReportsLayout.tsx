
import React, { useState, useMemo } from 'react';
import { ChartBarIcon, SearchIcon, DocumentTextIcon } from '../../components/Icons';
import { getGroupedReports, getReportById } from './registry';
import { FilterValues } from './types';
import ReportsDashboard from './views/ReportsDashboard';

interface ReportsLayoutProps {
    moduleFilter?: string; // Optional: If provided, only show reports for this module
}

const ReportsLayout: React.FC<ReportsLayoutProps> = ({ moduleFilter }) => {
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State to store filter results (when Run is clicked)
    const [activeFilters, setActiveFilters] = useState<FilterValues | null>(null);

    const groupedReports = useMemo(() => getGroupedReports(), []);

    // Filter report list
    const displayGroups = useMemo(() => {
        let groups = groupedReports;

        // 1. Filter by Module (if prop provided)
        if (moduleFilter) {
            groups = groups.filter(g => g.id === moduleFilter);
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            groups = groups.map(group => ({
                ...group,
                reports: group.reports.filter(r => 
                    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.id.toLowerCase().includes(searchTerm.toLowerCase())
                )
            })).filter(g => g.reports.length > 0);
        }
        
        return groups;
    }, [groupedReports, searchTerm, moduleFilter]);

    const handleSelectReport = (id: string) => {
        setSelectedReportId(id);
        setActiveFilters(null); // Reset previous results when changing report
    };

    const handleRunReport = (filters: FilterValues) => {
        setActiveFilters(filters);
    };

    const selectedReportDef = selectedReportId ? getReportById(selectedReportId) : null;

    return (
        <div className="flex h-full bg-slate-100 dark:bg-slate-900 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            
            {/* --- LEFT SIDEBAR: REPORT LIST --- */}
            <div className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10">
                <div className={`p-4 shrink-0 ${moduleFilter ? 'bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700' : 'bg-teal-600 text-white'}`}>
                    <h2 className={`text-lg font-bold flex items-center gap-2 uppercase ${moduleFilter ? 'text-slate-700 dark:text-slate-200' : ''}`}>
                        <ChartBarIcon className="w-6 h-6"/> 
                        {moduleFilter ? 'Danh sách báo cáo' : 'Hệ thống báo cáo'}
                    </h2>
                </div>
                
                {/* Search Box */}
                <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm tên báo cáo..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    </div>
                </div>

                {/* Tree List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {displayGroups.map(group => (
                        <div key={group.id}>
                            {/* Only show group header if NOT filtered by a specific module */}
                            {!moduleFilter && (
                                <div className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase sticky top-0 z-10 border-b border-slate-300 dark:border-slate-600">
                                    {group.label}
                                </div>
                            )}
                            <ul>
                                {group.reports.map(report => (
                                    <li key={report.id}>
                                        <button
                                            onClick={() => handleSelectReport(report.id)}
                                            className={`w-full text-left px-4 py-3 text-sm border-b border-slate-100 dark:border-slate-700/50 transition-colors flex items-start gap-2 hover:bg-teal-50 dark:hover:bg-slate-700 ${
                                                selectedReportId === report.id 
                                                ? 'bg-teal-100 text-teal-800 font-bold border-l-4 border-l-teal-600 dark:bg-teal-900/30 dark:text-teal-300' 
                                                : 'text-slate-700 dark:text-slate-300 border-l-4 border-l-transparent'
                                            }`}
                                        >
                                            <DocumentTextIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedReportId === report.id ? 'text-teal-600' : 'text-slate-400'}`}/>
                                            <span className="line-clamp-2 leading-snug">{report.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {displayGroups.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm italic">Không tìm thấy báo cáo nào.</div>
                    )}
                </div>
            </div>

            {/* --- RIGHT CONTENT: FILTER & PREVIEW --- */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                {selectedReportDef ? (
                    <div className="flex flex-col h-full p-4 gap-4">
                        
                        {/* Header Bar */}
                        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white text-shadow-sm">
                                {selectedReportDef.title}
                            </h1>
                            <div className="text-xs text-slate-500">ID: <span className="font-mono">{selectedReportDef.id}</span></div>
                        </div>

                        {/* Filter Area (Dynamic Component) */}
                        <div className="shrink-0 animate-fade-in-up">
                            <selectedReportDef.FilterComponent onRun={handleRunReport} />
                        </div>

                        {/* Content Area (Dynamic Component) */}
                        <div className="flex-1 min-h-0 animate-fade-in">
                            <selectedReportDef.ContentComponent filters={activeFilters} />
                        </div>

                    </div>
                ) : (
                    <ReportsDashboard onSelectReport={handleSelectReport} moduleFilter={moduleFilter} />
                )}
            </div>
        </div>
    );
};

export default ReportsLayout;
