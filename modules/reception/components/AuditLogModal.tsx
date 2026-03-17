
import React, { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, UserIcon, ComputerDesktopIcon, AdjustmentsHorizontalIcon } from '../../../components/Icons';
import { FIELD_TRANSLATIONS, ACTION_TRANSLATIONS, formatValue, TABLE_TRANSLATIONS } from '../utils/auditTranslation';

interface AuditLog {
    id: string;
    table_name: string;
    record_id: string;
    action: 'I' | 'U' | 'D';
    changed_fields: Record<string, any>;
    old_data: Record<string, any>;
    new_data: Record<string, any>;
    user_id: string;
    user_name?: string;
    client_ip: string;
    context_module: string;
    created_at: string;
}

interface AuditTarget {
    tableName: string;
    recordId: string | number;
}

interface AuditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    targets: AuditTarget[];
    title?: string;
}

const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, targets, title }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && targets.length > 0) {
            fetchLogs();
        }
    }, [isOpen, JSON.stringify(targets)]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/audit/common', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targets })
            });
            const data = await response.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                            <ClockIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Lịch sử thay đổi hệ thống</h2>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title || 'Nhật ký thay đổi tổng hợp'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <XMarkIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-800/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-slate-500 font-medium">Đang tải lịch sử...</p>
                        </div>
                    ) : logs.length > 0 ? (
                        <div className="space-y-6">
                            {logs.map((log, index) => (
                                <div key={log.id} className="relative pl-10">
                                    {/* Timeline line */}
                                    {index !== logs.length - 1 && (
                                        <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                                    )}
                                    
                                    {/* Timeline dot */}
                                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-blue-500 flex items-center justify-center shadow-sm z-10">
                                        <ClockIcon className="w-4 h-4 text-white" />
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                        {/* Action Header */}
                                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACTION_TRANSLATIONS[log.action]?.color || 'bg-slate-100'}`}>
                                                    {ACTION_TRANSLATIONS[log.action]?.label || log.action}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                                    {TABLE_TRANSLATIONS[log.table_name] || log.table_name}
                                                </span>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                                    {new Date(log.created_at).toLocaleString('vi-VN')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <UserIcon className="w-3.5 h-3.5" />
                                                    <span className="font-semibold">{log.user_name || log.user_id || 'Hệ thống'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <ComputerDesktopIcon className="w-3.5 h-3.5" />
                                                    <span>{log.client_ip}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Change Details */}
                                        <div className="p-4 space-y-3">
                                            {log.action === 'U' ? (
                                                <div className="grid grid-cols-1 gap-2">
                                                    {Object.entries(log.changed_fields || {}).map(([field, newValue]) => (
                                                        <div key={field} className="flex flex-col gap-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                            <div className="flex items-center gap-2">
                                                                <AdjustmentsHorizontalIcon className="w-3.5 h-3.5 text-blue-500" />
                                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                    {FIELD_TRANSLATIONS[field] || field}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4 mt-1">
                                                                <div>
                                                                    <p className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">Cũ</p>
                                                                    <p className="text-xs text-slate-500 line-through truncate">{formatValue(field, log.old_data[field])}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] uppercase text-blue-400 font-bold mb-0.5">Mới</p>
                                                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold truncate">{formatValue(field, newValue)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : log.action === 'I' ? (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                                    Bản ghi được tạo mới bởi <span className="font-bold text-slate-800 dark:text-slate-200">{log.user_name || log.user_id || 'Hệ thống'}</span>.
                                                </p>
                                            ) : (
                                                <p className="text-sm text-red-600/70 italic">
                                                    Bản ghi đã bị xóa khỏi hệ thống.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 grayscale">
                            <p className="text-slate-400">Không tìm thấy lịch sử thay đổi.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl transition-all shadow-sm">
                        Đóng lại
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogModal;
