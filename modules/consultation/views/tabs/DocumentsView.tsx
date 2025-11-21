
import React, { useState } from 'react';
import { 
    FolderIcon, 
    DocumentPlusIcon
} from '../../../../components/Icons';
import TemplatesTab from './documents/TemplatesTab';
import EMRTab from './documents/EMRTab';

const DocumentsView: React.FC = () => {
    const [viewMode, setViewMode] = useState<'templates' | 'emr'>('templates');

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] min-h-[600px] bg-slate-100 dark:bg-slate-900/50 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            
            {/* 1. Top Tabs Switcher */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-2 flex items-center justify-between flex-shrink-0">
                <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('templates')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
                            viewMode === 'templates' 
                            ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <DocumentPlusIcon className="w-4 h-4"/>
                        Mẫu biểu
                    </button>
                    <button
                        onClick={() => setViewMode('emr')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
                            viewMode === 'emr' 
                            ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-300 shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <FolderIcon className="w-4 h-4"/>
                        Hồ sơ EMR
                    </button>
                </div>
                
                <div className="text-sm text-slate-500 dark:text-slate-400 italic px-2">
                    {viewMode === 'templates' ? 'Soạn thảo và in ấn các biểu mẫu' : 'Tra cứu lịch sử hồ sơ bệnh án'}
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'templates' ? <TemplatesTab /> : <EMRTab />}
            </div>
        </div>
    );
};

export default DocumentsView;
