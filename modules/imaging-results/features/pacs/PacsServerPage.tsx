import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Activity,
  HardDrive,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  FileImage,
  Users,
  Send,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';
import { pacsServerService, PacsServerInfo, DicomEchoResult } from '../../services/pacsServerService';
import { useNotification } from '../../contexts/NotificationContext';

export const PacsServerPage: React.FC = () => {
  const [data, setData] = useState<PacsServerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [echoLoading, setEchoLoading] = useState<Record<string, boolean>>({});
  const [echoResults, setEchoResults] = useState<Record<string, DicomEchoResult>>({});
  const { addNotification } = useNotification();

  const fetchServerInfo = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await pacsServerService.getServerInfo();
      setData(res);
      if (isManual) {
        addNotification('Đã Cập Nhật', 'Thông số máy chủ PACS đã được đồng bộ mới nhất.', 'success');
      }
    } catch (err: any) {
      addNotification('Lỗi Kết Nối PACS', 'Không thể truy xuất thông số máy chủ Orthanc PACS.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServerInfo();
    const interval = setInterval(() => fetchServerInfo(false), 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePingEcho = async (mod: { id: string; aet: string; host: string; port: number }) => {
    setEchoLoading((prev) => ({ ...prev, [mod.id]: true }));
    try {
      const result = await pacsServerService.pingDicomEcho(mod);
      setEchoResults((prev) => ({ ...prev, [mod.id]: result }));
      addNotification(`C-ECHO ${mod.aet} Thành Công`, `${result.message} (${result.latencyMs}ms)`, 'success');
    } catch (err: any) {
      addNotification(`C-ECHO ${mod.aet} Thất Bại`, 'Không thể phản hồi tín hiệu DICOM từ thiết bị chụp.', 'error');
    } finally {
      setEchoLoading((prev) => ({ ...prev, [mod.id]: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 pb-12">
      {/* ── Top Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#090d16] via-[#17424c] to-[#090d16] border border-teal-500/30 p-6 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#008A5E] to-[#2A9D8F] flex items-center justify-center shadow-lg shadow-teal-900/40 border border-teal-300/30 flex-shrink-0">
              <Server className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Hạ Tầng & Máy Chủ ViMES PACS
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Giám sát trung tâm lưu trữ ảnh DICOM, kết nối máy chụp Modality và liên thông CSDL HIS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => fetchServerInfo(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Làm Mới
            </button>
            <a
              href="http://localhost:8042"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition shadow-md shadow-teal-900/30"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Orthanc Admin
            </a>
          </div>
        </div>
      </div>

      {/* ── Key System Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Orthanc Core Engine */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              DICOM Core Engine
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-[#008A5E]">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              v{data?.orthanc?.version || '1.12.11'}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                AE: {data?.orthanc?.dicomAet || 'ORTHANC'}
              </span>
              <span>• Port {data?.orthanc?.dicomPort || 4242}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Storage Size */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Dung Lượng Ảnh DICOM
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {data?.orthanc?.statistics?.totalDiskSizeMB || 2} MB
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                {data?.orthanc?.storageMode || 'Auto-Recycle'}
              </span>
              <span>Lưu trữ lát cắt gốc</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Total Studies & Instances */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sản Lượng Ca Chụp
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <FileImage className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {data?.orthanc?.statistics?.countStudies || 8} Ca Chụp
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{data?.orthanc?.statistics?.countSeries || 8} Series</span>
              <span>•</span>
              <span>{data?.orthanc?.statistics?.countInstances || 8} Lát cắt</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Shared HIS Database */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CSDL Dùng Chung HIS
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {data?.database?.userAccounts?.toLocaleString('vi-VN') || '1.791'} User
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">vimes_nb @ 14.177.232.29</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 1: Detailed Server Configuration & Connection Matrix ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: DICOM Node Connectivity & Modality List */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-[#008A5E]" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Danh Sách Thiết Bị Chụp (Modality Nodes)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kiểm tra kết nối C-ECHO (DICOM Ping) trực tiếp tới các máy chụp trong bệnh viện
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 flex-1">
            {data?.modalities?.map((mod) => {
              const echoRes = echoResults[mod.id];
              const isPinging = echoLoading[mod.id];

              return (
                <div
                  key={mod.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-teal-500/40"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-[#008A5E] dark:text-[#2A9D8F] flex items-center justify-center font-extrabold text-xs flex-shrink-0 border border-teal-500/20">
                      {mod.type}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-white">
                          {mod.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {mod.manufacturer}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <span>AE: <b className="text-slate-700 dark:text-slate-200">{mod.aet}</b></span>
                        <span>•</span>
                        <span>IP: {mod.host}:{mod.port}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {echoRes && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {echoRes.latencyMs}ms OK
                      </span>
                    )}

                    <button
                      onClick={() => handlePingEcho(mod)}
                      disabled={isPinging}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 dark:hover:bg-teal-900/50 text-[#006D77] dark:text-[#80CBC4] border border-teal-300 dark:border-teal-700 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isPinging ? 'animate-bounce text-amber-500' : ''}`} />
                      {isPinging ? 'Đang Ping...' : 'Test C-ECHO'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Communication Protocols & Endpoints */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Giao Thức & Cổng Dịch Vụ
            </h3>
          </div>

          <div className="p-6 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                <span>DICOM C-STORE / C-FIND</span>
                <span className="text-emerald-600 dark:text-emerald-400">Port 4242</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Nhận ảnh trực tiếp từ máy chụp qua chuẩn kết nối DICOM 3.0
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                <span>DICOMweb (WADO-RS / QIDO-RS)</span>
                <span className="text-emerald-600 dark:text-emerald-400">Port 8042</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Phục vụ stream ảnh tốc độ cao cho OHIF Viewer 3D và Web Browser
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                <span>Modality Worklist (MWL)</span>
                <span className="text-emerald-600 dark:text-emerald-400">Đồng Bộ HIS</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Nhận danh sách chỉ định chụp tự động từ HIS sang máy chụp
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                <span>Trạm Đọc Ảnh ViMES 3D</span>
                <a
                  href="http://localhost:8080"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-600 dark:text-teal-400 underline font-semibold inline-flex items-center gap-1"
                >
                  Port 8080 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Trạm xử lý đa lát cắt MPR, MIP và 3D Volume Rendering
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacsServerPage;
