
import React, { useState } from 'react';
import { mockTemplates, ReportTemplate } from '../data';
import { PlusIcon, TrashIcon, PencilIcon, DocumentTextIcon } from '../../../components/Icons';

const ConfigurationView: React.FC = () => {
    const [templates, setTemplates] = useState<ReportTemplate[]>(mockTemplates);
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cấu hình RIS</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý mẫu báo cáo và phòng chụp.</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow flex items-center gap-2 hover:bg-blue-700 transition">
                    <PlusIcon className="w-5 h-5"/> Thêm mẫu mới
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h2 className="font-bold text-slate-700 dark:text-slate-200">Danh sách mẫu báo cáo</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {templates.map(tpl => (
                            <div key={tpl.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex justify-between items-start group">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400">
                                        <DocumentTextIcon className="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{tpl.name}</h3>
                                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mt-1">
                                            {tpl.modality}
                                        </span>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded">
                                            {tpl.content}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                        <PencilIcon className="w-4 h-4"/>
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6">
                        <h2 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Thống kê tài nguyên</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded border border-slate-100 dark:border-slate-600">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Tổng số mẫu</span>
                                <span className="font-bold text-blue-600">{templates.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded border border-slate-100 dark:border-slate-600">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Máy X-Quang</span>
                                <span className="font-bold text-green-600">2 (Online)</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded border border-slate-100 dark:border-slate-600">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Máy CT Scan</span>
                                <span className="font-bold text-green-600">1 (Online)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigurationView;
