
import React from 'react';
import { getGroupedReports } from '../registry';
import { ChartBarIcon, DocumentTextIcon, UserGroupIcon, CurrencyDollarIcon, ArchiveIcon } from '../../../components/Icons';

interface ReportsDashboardProps {
    onSelectReport: (id: string) => void;
    moduleFilter?: string;
}

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ onSelectReport, moduleFilter }) => {
    const groups = getGroupedReports();
    
    // Filter groups if moduleFilter is present
    const displayGroups = moduleFilter 
        ? groups.filter(g => g.id === moduleFilter)
        : groups;

    const getGroupIcon = (id: string) => {
        switch(id) {
            case 'reception': return <UserGroupIcon className="w-6 h-6 text-blue-500"/>;
            case 'billing': return <CurrencyDollarIcon className="w-6 h-6 text-green-500"/>;
            case 'pharmacy': return <ArchiveIcon className="w-6 h-6 text-orange-500"/>;
            default: return <ChartBarIcon className="w-6 h-6 text-purple-500"/>;
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                {moduleFilter ? 'Báo cáo phân hệ' : 'Tổng quan Báo cáo'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Chọn một báo cáo để xem chi tiết số liệu.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayGroups.map(group => (
                    <div key={group.id} className="space-y-3">
                        <div className="flex items-center gap-2 mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                            {getGroupIcon(group.id)}
                            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">{group.label}</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {group.reports.map(report => (
                                <div 
                                    key={report.id}
                                    onClick={() => onSelectReport(report.id)}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                                                <DocumentTextIcon className="w-5 h-5"/>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{report.title}</h4>
                                                {report.description && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{report.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {displayGroups.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-500 italic">
                        Không có báo cáo nào cho phân hệ này.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsDashboard;
