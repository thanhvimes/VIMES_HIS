import React, { useState, useEffect } from 'react';
import { 
    RefreshCw, 
    Download, 
    CheckCircle2, 
    History, 
    X, 
    Sparkles, 
    Terminal, 
    Cpu
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface SystemUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UpdateCheckResult {
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion?: string;
    releaseDate?: string;
    changelog?: string[];
    downloadUrl?: string;
    sha256?: string;
    requiredDbMigration?: boolean;
    message?: string;
    serverUrl?: string;
}

interface UpdateHistoryItem {
    id: number;
    version: string;
    source_type: string;
    download_url: string;
    backup_dir: string;
    status: string;
    error_message: string;
    changelog: string;
    executed_by: string;
    created_at: string;
}

const SystemUpdateModal: React.FC<SystemUpdateModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'ota' | 'history'>('ota');
    const [isChecking, setIsChecking] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
    const [systemInfo, setSystemInfo] = useState<any>(null);
    const [historyList, setHistoryList] = useState<UpdateHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Progress logs & Countdown
    const [progressLogs, setProgressLogs] = useState<string[]>([]);
    const [countdown, setCountdown] = useState<number | null>(null);

    const API_BASE = '/api/v1/system-update';

    useEffect(() => {
        if (isOpen) {
            fetchSystemInfo();
            checkForUpdates();
        } else {
            setProgressLogs([]);
            setCountdown(null);
            setIsUpdating(false);
        }
    }, [isOpen]);

    useEffect(() => {
        let timer: any;
        if (countdown !== null && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (countdown === 0) {
            window.location.reload();
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const fetchSystemInfo = async () => {
        try {
            const res = await axios.get(`${API_BASE}/info`);
            if (res.data?.success) {
                setSystemInfo(res.data);
            }
        } catch (err) {
            console.warn('Failed to load system info:', err);
        }
    };

    const checkForUpdates = async () => {
        setIsChecking(true);
        try {
            const res = await axios.get(`${API_BASE}/check`);
            setUpdateInfo(res.data);
            if (res.data?.hasUpdate) {
                toast.info(`Đã có phiên bản mới: v${res.data.latestVersion}!`);
            }
        } catch (err: any) {
            toast.error('Lỗi khi kiểm tra cập nhật: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsChecking(false);
        }
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await axios.get(`${API_BASE}/history`);
            if (res.data?.success) {
                setHistoryList(res.data.history || []);
            }
        } catch (err: any) {
            toast.error('Lỗi tải lịch sử cập nhật');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handlePerformOtaUpdate = async () => {
        if (!updateInfo?.downloadUrl) return;

        setIsUpdating(true);
        setProgressLogs([
            `🚀 [${new Date().toLocaleTimeString()}] Bắt đầu quy trình cập nhật OTA...`,
            `📥 [${new Date().toLocaleTimeString()}] Đang tải gói cập nhật từ ${updateInfo.downloadUrl}...`
        ]);

        try {
            const res = await axios.post(`${API_BASE}/perform-ota`, {
                downloadUrl: updateInfo.downloadUrl,
                version: updateInfo.latestVersion,
                sha256: updateInfo.sha256,
                changelog: updateInfo.changelog
            });

            if (res.data?.success) {
                setProgressLogs(prev => [
                    ...prev,
                    `📦 [${new Date().toLocaleTimeString()}] Đã sao lưu bản hiện tại: ${res.data.backupDir}`,
                    `📂 [${new Date().toLocaleTimeString()}] Giải nén mã nguồn mới thành công.`,
                    `🗄️ [${new Date().toLocaleTimeString()}] Đồng bộ Database Migrations hoàn tất.`,
                    `🎉 [${new Date().toLocaleTimeString()}] CẬP NHẬT HOÀN TẤT THÀNH CÔNG! Đang khởi động lại dịch vụ...`
                ]);
                toast.success('Cập nhật hệ thống thành công!');
                setCountdown(5);
            } else {
                throw new Error(res.data?.message || 'Cập nhật thất bại');
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message;
            setProgressLogs(prev => [
                ...prev,
                `❌ [${new Date().toLocaleTimeString()}] LỖI: ${errMsg}`
            ]);
            toast.error(`Cập nhật thất bại: ${errMsg}`);
            setIsUpdating(false);
        }
    };

    if (!isOpen) return null;

    const currentVersion = systemInfo?.currentVersion || updateInfo?.currentVersion || '1.0.0';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Sparkles className="w-5 h-5 text-cyan-200" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg tracking-tight">Trung tâm Cập nhật Hệ thống</h3>
                            <p className="text-xs text-blue-100 font-medium">VIMES HIS Over-The-Air Update Manager</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isUpdating}
                        className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* System Info Bar */}
                <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Phiên bản hiện tại:</span>
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                v{currentVersion}
                            </span>
                        </div>
                        {systemInfo?.os && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <Cpu className="w-3.5 h-3.5" />
                                <span>OS: {systemInfo.os.platform} ({systemInfo.os.arch})</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={checkForUpdates}
                        disabled={isChecking || isUpdating}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold hover:underline disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                        <span>{isChecking ? 'Đang kiểm tra...' : 'Kiểm tra phiên bản mới'}</span>
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
                    <button
                        onClick={() => setActiveTab('ota')}
                        className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'ota'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Download className="w-4 h-4" />
                        Cập nhật Trực tuyến (OTA Online)
                        {updateInfo?.hasUpdate && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab('history');
                            fetchHistory();
                        }}
                        className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'history'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        Lịch sử nâng cấp
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    
                    {/* TAB 1: OTA ONLINE */}
                    {activeTab === 'ota' && (
                        <div className="space-y-4">
                            {updateInfo?.hasUpdate ? (
                                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-extrabold text-base text-emerald-900 dark:text-emerald-100">
                                                    Đã có bản cập nhật mới: v{updateInfo.latestVersion}
                                                </h4>
                                                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                                    Ngày phát hành: {updateInfo.releaseDate ? new Date(updateInfo.releaseDate).toLocaleString('vi-VN') : 'Mới nhất'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full shadow-sm">
                                            Sẵn sàng nâng cấp
                                        </span>
                                    </div>

                                    {/* Changelog */}
                                    <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3.5 border border-emerald-100 dark:border-emerald-900 space-y-1.5">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                            Nội dung cập nhật (Changelog):
                                        </p>
                                        <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                            {updateInfo.changelog?.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Action button */}
                                    {!isUpdating && countdown === null && (
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="text-[11px] text-slate-500">
                                                Quá trình cập nhật tự động mất khoảng 5 - 10 giây.
                                            </div>
                                            <button
                                                onClick={handlePerformOtaUpdate}
                                                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                                            >
                                                <Download className="w-4 h-4" />
                                                Cập nhật ngay lên v{updateInfo.latestVersion}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                                    <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                        Hệ thống đang chạy phiên bản mới nhất!
                                    </h4>
                                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                                        Phiên bản hiện tại là <strong className="text-blue-600">v{currentVersion}</strong>. Không có bản cập nhật nào đang chờ.
                                    </p>
                                    <button
                                        onClick={checkForUpdates}
                                        disabled={isChecking}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all cursor-pointer"
                                    >
                                        Kiểm tra lại
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: UPDATE HISTORY */}
                    {activeTab === 'history' && (
                        <div className="space-y-3">
                            {isLoadingHistory ? (
                                <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải lịch sử nâng cấp...
                                </div>
                            ) : historyList.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-xs">
                                    Chưa có lịch sử cập nhật nào được ghi nhận.
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {historyList.map((item) => (
                                        <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">Phiên bản: v{item.version}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        item.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                    <span className="text-slate-400">({item.source_type})</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">Người thực hiện: {item.executed_by} • Thời gian: {new Date(item.created_at).toLocaleString('vi-VN')}</p>
                                                {item.backup_dir && (
                                                    <p className="text-[10px] font-mono text-slate-400 truncate max-w-lg">Backup: {item.backup_dir}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* REAL-TIME PROGRESS LOG TERMINAL */}
                    {progressLogs.length > 0 && (
                        <div className="rounded-xl bg-slate-950 text-slate-200 p-4 font-mono text-xs space-y-1.5 shadow-inner border border-slate-800">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Nhật ký tiến trình cập nhật (Realtime Log)</span>
                                </div>
                                {countdown !== null && (
                                    <span className="text-emerald-400 font-bold animate-pulse">
                                        Tự động tải lại sau {countdown}s...
                                    </span>
                                )}
                            </div>
                            <div className="space-y-1 max-h-40 overflow-y-auto pt-1">
                                {progressLogs.map((log, index) => (
                                    <p key={index} className="leading-relaxed">{log}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <div>
                        Máy chủ cập nhật: <span className="font-mono text-blue-600 dark:text-blue-400">{systemInfo?.updateServerUrl || 'https://updates.vimes.vn/version.json'}</span>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SystemUpdateModal;
