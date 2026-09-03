import React, { useState, useEffect } from 'react';
import { 
    RefreshCw, 
    Download, 
    CheckCircle2, 
    History, 
    Sparkles, 
    Terminal, 
    Cpu, 
    UploadCloud, 
    Package, 
    AlertCircle,
    Server,
    ShieldCheck,
    FileArchive,
    X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

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

const SystemUpdateTab: React.FC = () => {
    const [subTab, setSubTab] = useState<'ota' | 'offline' | 'history'>('ota');
    const [isChecking, setIsChecking] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
    const [systemInfo, setSystemInfo] = useState<any>(null);
    const [historyList, setHistoryList] = useState<UpdateHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Progress logs & Countdown
    const [progressLogs, setProgressLogs] = useState<string[]>([]);
    const [countdown, setCountdown] = useState<number | null>(null);

    const API_BASE = '/api/v1/system-update';

    const getAuthHeaders = () => {
        try {
            const userSession = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            if (userSession) {
                const parsed = JSON.parse(userSession);
                if (parsed?.token) {
                    return { Authorization: `Bearer ${parsed.token}` };
                }
            }
        } catch {
            // ignore
        }
        return {};
    };

    useEffect(() => {
        fetchSystemInfo();
        checkForUpdates();
        fetchHistory();
    }, []);

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
            const res = await axios.get(`${API_BASE}/info`, { headers: getAuthHeaders() });
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
            const res = await axios.get(`${API_BASE}/check`, { headers: getAuthHeaders() });
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
            const res = await axios.get(`${API_BASE}/history`, { headers: getAuthHeaders() });
            if (res.data?.success) {
                setHistoryList(res.data.history || []);
            }
        } catch (err: any) {
            console.warn('Lỗi tải lịch sử cập nhật:', err);
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
            }, { headers: getAuthHeaders() });

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

    const handleUploadOfflinePackage = async () => {
        if (!selectedFile) {
            toast.warning('Vui lòng chọn tệp tin phát hành (.tar.gz)!');
            return;
        }

        setIsUpdating(true);
        setProgressLogs([
            `📦 [${new Date().toLocaleTimeString()}] Đang tải lên tệp tin: ${selectedFile.name}...`,
            `⏳ [${new Date().toLocaleTimeString()}] Máy chủ đang tiếp nhận và sao lưu phiên bản cũ...`
        ]);

        const formData = new FormData();
        formData.append('package', selectedFile);

        try {
            const res = await axios.post(`${API_BASE}/upload-package`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data?.success) {
                setProgressLogs(prev => [
                    ...prev,
                    `📂 [${new Date().toLocaleTimeString()}] Giải nén mã nguồn mới thành công.`,
                    `🗄️ [${new Date().toLocaleTimeString()}] Đồng bộ Database Migrations hoàn tất.`,
                    `🎉 [${new Date().toLocaleTimeString()}] CẬP NHẬT HOÀN TẤT THÀNH CÔNG! Đang khởi động lại dịch vụ...`
                ]);
                toast.success('Nâng cấp hệ thống thành công!');
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

    const currentVersion = systemInfo?.currentVersion || updateInfo?.currentVersion || '1.1.0';

    return (
        <div className="flex-1 overflow-y-auto space-y-5 pb-8">
            {/* Top Overview Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-full bg-white/5 transform skew-x-12 pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                            <Sparkles className="w-7 h-7 text-cyan-200" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-extrabold tracking-tight">Trung tâm Quản lý Nâng cấp Hệ thống</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-cyan-100 border border-white/20">
                                    Dành cho Quản trị viên
                                </span>
                            </div>
                            <p className="text-xs text-blue-100 mt-1 font-medium">
                                Nâng cấp tự động máy chủ VIMES HIS, đồng bộ Database Migration và áp dụng tức thì cho toàn bộ các máy trạm.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20 text-right">
                            <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Phiên bản đang chạy</p>
                            <p className="text-lg font-black text-white">v{currentVersion}</p>
                        </div>
                    </div>
                </div>

                {/* Sub info */}
                {systemInfo?.os && (
                    <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs text-blue-100/90 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Môi trường: {systemInfo.os.platform} ({systemInfo.os.arch})</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Node.js: {systemInfo.os.nodeVersion}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Trạng thái: Đang hoạt động ổn định</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl p-1.5 shadow-sm">
                <button
                    onClick={() => setSubTab('ota')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        subTab === 'ota'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200/60 dark:border-blue-800'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                    <Download className="w-4 h-4" />
                    <span>Cập nhật Trực tuyến (OTA Online)</span>
                    {updateInfo?.hasUpdate && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                </button>

                <button
                    onClick={() => setSubTab('offline')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        subTab === 'offline'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200/60 dark:border-blue-800'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                    <UploadCloud className="w-4 h-4" />
                    <span>Tải lên gói cập nhật ngoại tuyến (.tar.gz)</span>
                </button>

                <button
                    onClick={() => {
                        setSubTab('history');
                        fetchHistory();
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        subTab === 'history'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200/60 dark:border-blue-800'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                >
                    <History className="w-4 h-4" />
                    <span>Lịch sử nâng cấp hệ thống</span>
                </button>
            </div>

            {/* SUB-TAB 1: OTA ONLINE */}
            {subTab === 'ota' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-500">Máy chủ kiểm tra phiên bản:</span>
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                                {systemInfo?.updateServerUrl || 'https://raw.githubusercontent.com/thanhvimes/VIMES_HIS/main/releases/version.json'}
                            </span>
                        </div>
                        <button
                            onClick={checkForUpdates}
                            disabled={isChecking || isUpdating}
                            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 text-blue-600 font-bold rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                            <span>{isChecking ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}</span>
                        </button>
                    </div>

                    {updateInfo?.hasUpdate ? (
                        <div className="p-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shadow-sm">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-base text-emerald-900 dark:text-emerald-100">
                                            Đã phát hiện bản cập nhật mới: v{updateInfo.latestVersion}
                                        </h4>
                                        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                                            Ngày phát hành: {updateInfo.releaseDate ? new Date(updateInfo.releaseDate).toLocaleString('vi-VN') : 'Mới nhất'}
                                        </p>
                                    </div>
                                </div>
                                <span className="px-3.5 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full shadow-sm">
                                    Sẵn sàng nâng cấp
                                </span>
                            </div>

                            {/* Changelog Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900 space-y-2">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Nội dung cập nhật trong phiên bản này:</span>
                                </p>
                                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-1">
                                    {updateInfo.changelog?.map((item, idx) => (
                                        <li key={idx} className="leading-relaxed">{item}</li>
                                    ))}
                                </ul>
                            </div>

                            {!isUpdating && countdown === null && (
                                <div className="flex items-center justify-between pt-2">
                                    <div className="text-xs text-slate-500">
                                        ⚠️ Quá trình nâng cấp tự động diễn ra trong 5 - 10 giây và dịch vụ sẽ tự reload không làm mất dữ liệu.
                                    </div>
                                    <button
                                        onClick={handlePerformOtaUpdate}
                                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Bắt đầu Cập nhật ngay lên v{updateInfo.latestVersion}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                                Hệ thống đang chạy phiên bản mới nhất!
                            </h4>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                Máy chủ đang vận hành phiên bản <strong className="text-blue-600 font-bold">v{currentVersion}</strong>. Không có bản cập nhật nào đang chờ.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* SUB-TAB 2: OFFLINE PACKAGE UPLOAD */}
            {subTab === 'offline' && (
                <div className="space-y-4">
                    <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center space-y-4 shadow-sm">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                            <Package className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                                Cập nhật Ngoại tuyến từ Tệp tin Đóng gói (.tar.gz)
                            </h4>
                            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 leading-relaxed">
                                Dành cho máy chủ hoạt động trong mạng LAN nội bộ không có kết nối Internet. Chọn tệp tin phát hành đã tải về máy của bạn (ví dụ: <code className="text-blue-600 font-mono font-bold">vimes-his-v1.1.0.tar.gz</code>) để nâng cấp.
                            </p>
                        </div>

                        <input
                            type="file"
                            id="offlinePackageInputTab"
                            accept=".tar.gz,.zip,.tgz"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setSelectedFile(e.target.files[0]);
                                }
                            }}
                        />

                        <div className="flex flex-col items-center gap-3 pt-2">
                            <label
                                htmlFor="offlinePackageInputTab"
                                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all cursor-pointer flex items-center gap-2"
                            >
                                <UploadCloud className="w-4 h-4 text-blue-600" />
                                {selectedFile ? 'Chọn tệp tin khác' : 'Chọn tệp tin phát hành từ máy tính'}
                            </label>

                            {selectedFile && (
                                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs flex items-center gap-3 max-w-md w-full justify-between shadow-sm">
                                    <div className="flex items-center gap-2.5 truncate">
                                        <FileArchive className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{selectedFile.name}</span>
                                        <span className="text-slate-400 text-[11px] shrink-0">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {selectedFile && !isUpdating && countdown === null && (
                                <button
                                    onClick={handleUploadOfflinePackage}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer mt-1"
                                >
                                    <UploadCloud className="w-4 h-4" />
                                    Cài đặt bản nâng cấp này lên máy chủ ngay
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SUB-TAB 3: UPDATE HISTORY */}
            {subTab === 'history' && (
                <div className="space-y-3">
                    {isLoadingHistory ? (
                        <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <RefreshCw className="w-4 h-4 animate-spin" /> Đang tải lịch sử nâng cấp...
                        </div>
                    ) : historyList.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                            Chưa có lịch sử cập nhật nào được ghi nhận trên máy chủ.
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {historyList.map((item) => (
                                <div key={item.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">Phiên bản: v{item.version}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                item.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>
                                                {item.status}
                                            </span>
                                            <span className="text-slate-400 font-mono">({item.source_type})</span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Người thực hiện: <strong className="text-slate-700 dark:text-slate-300">{item.executed_by}</strong> • Thời gian: {new Date(item.created_at).toLocaleString('vi-VN')}
                                        </p>
                                        {item.backup_dir && (
                                            <p className="text-[11px] font-mono text-slate-400 truncate max-w-xl">Thư mục sao lưu: {item.backup_dir}</p>
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
                <div className="rounded-2xl bg-slate-950 text-slate-200 p-5 font-mono text-xs space-y-2 shadow-2xl border border-slate-800 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-emerald-400" />
                            <span className="font-bold text-slate-300">Nhật ký Tiến trình Nâng cấp Máy chủ (Realtime Log)</span>
                        </div>
                        {countdown !== null && (
                            <span className="text-emerald-400 font-bold animate-pulse text-xs">
                                🔄 Tự động tải lại trang sau {countdown} giây...
                            </span>
                        )}
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1 font-mono">
                        {progressLogs.map((log, index) => (
                            <p key={index} className="leading-relaxed">{log}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemUpdateTab;
