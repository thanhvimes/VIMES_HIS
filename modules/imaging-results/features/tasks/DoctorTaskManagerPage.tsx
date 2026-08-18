import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ClipboardCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileEdit,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  FileText,
  Sparkles,
  ChevronRight,
  Activity,
  Layers,
  X,
} from 'lucide-react';
import { QuickViewerDialog } from '../viewer/components/QuickViewerDialog';

interface TaskItem {
  id: string;
  orderId: number | string;
  docNo: number | string;
  patientId: string;
  patientName: string;
  gender: string;
  age: number;
  modality: string;
  itemName: string;
  orderDate: string;
  performDate?: string;
  status: 'SCHEDULED' | 'PENDING_READ' | 'REPORT_DRAFT' | 'REPORT_SIGNED';
  urgency: 'URGENT' | 'HIGH' | 'NORMAL';
  tatStatusText: string;
  elapsedMins: number;
  readingDoctor: string;
  impression?: string;
  studyInstanceUid: string;
}

interface TaskSummary {
  totalTasks: number;
  urgentCount: number;
  pendingReadCount: number;
  pendingSignCount: number;
  completedCount: number;
}

export const DoctorTaskManagerPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [summary, setSummary] = useState<TaskSummary>({
    totalTasks: 0,
    urgentCount: 0,
    pendingReadCount: 0,
    pendingSignCount: 0,
    completedCount: 0,
  });

  // Filters
  const [timeRange, setTimeRange] = useState<string>('30days');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalityFilter, setModalityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterLabel, setFilterLabel] = useState<string>('30 ngày qua');

  // Custom date
  const [customFromDate, setCustomFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customToDate, setCustomToDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Quick Viewer modal
  const [quickViewerStudy, setQuickViewerStudy] = useState<any | null>(null);

  // Auto-refresh timer
  const [autoRefresh, setAutoRefresh] = useState(true);
  const navigate = useNavigate();

  const fetchTasks = useCallback(async (
    rangeOverride?: string,
    statusOverride?: string,
    modalityOverride?: string,
    searchOverride?: string
  ) => {
    const r = rangeOverride !== undefined ? rangeOverride : timeRange;
    const s = statusOverride !== undefined ? statusOverride : statusFilter;
    const m = modalityOverride !== undefined ? modalityOverride : modalityFilter;
    const q = searchOverride !== undefined ? searchOverride : searchTerm;

    setLoading(true);
    try {
      const params: any = {
        timeRange: r,
        statusFilter: s,
        modality: m,
        search: q,
      };
      if (r === 'custom') {
        params.fromDate = customFromDate;
        params.toDate = customToDate;
      }
      const res = await api.get('/tasks/doctor-worklist', { params });
      setTasks(res.data?.tasks || []);
      if (res.data?.summary) setSummary(res.data.summary);
      if (res.data?.filterLabel) setFilterLabel(res.data.filterLabel);
    } catch (err) {
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, statusFilter, modalityFilter, searchTerm, customFromDate, customToDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Periodic refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTasks();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTasks]);

  const handleRangeChange = (r: string) => {
    setTimeRange(r);
    if (r !== 'custom') {
      fetchTasks(r);
    }
  };

  const handleStatusFilterChange = (st: string) => {
    setStatusFilter(st);
    fetchTasks(undefined, st);
  };

  const handleModalityFilterChange = (m: string) => {
    setModalityFilter(m);
    fetchTasks(undefined, undefined, m);
  };

  const handleOpenViewer = (task: TaskItem) => {
    setQuickViewerStudy({
      id: task.studyInstanceUid || String(task.orderId),
      studyInstanceUid: task.studyInstanceUid || String(task.orderId),
      patientName: task.patientName,
      patientId: task.patientId,
      modality: task.modality,
      accessionNumber: String(task.orderId),
      studyDate: task.orderDate,
    });
  };

  const handleOpenReportEditor = (task: TaskItem) => {
    navigate(`/studies?patientId=${encodeURIComponent(task.patientId)}&autoOpenReport=true`);
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-50/60 dark:bg-[#090c12] text-slate-800 dark:text-slate-100 p-6 md:p-8 space-y-6 transition-colors">
      
      {/* ── Page Title & Context ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Bàn Làm Việc &amp; Quản Lý Tiến Độ
              {summary.urgentCount > 0 && (
                <span className="text-xs bg-rose-500 text-white font-bold px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                  {summary.urgentCount} ca cần xử lý gấp
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Không gian làm việc tập trung — Theo dõi tiến độ duyệt kết quả, ký số điện tử và kiểm soát thời gian quay vòng (TAT).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title="Tự động cập nhật số liệu mỗi 30 giây"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{autoRefresh ? 'Tự động tải lại: Bật' : 'Tự động tải lại: Tắt'}</span>
          </button>

          <button
            onClick={() => fetchTasks()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700 transition shadow-sm hover:shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Status Alert Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Urgent / Overdue TAT */}
        <div
          onClick={() => handleStatusFilterChange('URGENT')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'URGENT'
              ? 'ring-2 ring-rose-500 bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Cần Xử Lý Gấp (Quá Hạn)
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 leading-none">
                {summary.urgentCount}
                <span className="text-xs font-normal text-slate-400 ml-1.5">ca</span>
              </h3>
              <p className="text-[11px] text-rose-500 mt-2 font-medium">
                {summary.urgentCount > 0 ? '⚠️ Vượt quá chỉ tiêu 30 phút TAT' : '✓ Không có ca quá hạn'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: summary.urgentCount > 0 ? '100%' : '0%' }} />
          </div>
        </div>

        {/* Card 2: Pending Reading */}
        <div
          onClick={() => handleStatusFilterChange('PENDING_READ')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'PENDING_READ'
              ? 'ring-2 ring-sky-500 bg-sky-50/80 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-sky-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Chờ Đọc Kết Quả
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 leading-none">
                {summary.pendingReadCount}
                <span className="text-xs font-normal text-slate-400 ml-1.5">ca</span>
              </h3>
              <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-2 font-medium">
                Đã chụp xong ➔ Chờ bác sĩ đọc
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50 shadow-xs">
              <Eye className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((summary.pendingReadCount / (summary.totalTasks || 1)) * 100))}%` }} />
          </div>
        </div>

        {/* Card 3: Pending Digital Signature */}
        <div
          onClick={() => handleStatusFilterChange('PENDING_SIGN')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'PENDING_SIGN'
              ? 'ring-2 ring-amber-500 bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5" /> Bản Nháp Chờ Ký Số
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 leading-none">
                {summary.pendingSignCount}
                <span className="text-xs font-normal text-slate-400 ml-1.5">ca</span>
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                Đã có mô tả ➔ Chờ ký số &amp; duyệt
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50 shadow-xs">
              <FileEdit className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((summary.pendingSignCount / (summary.totalTasks || 1)) * 100))}%` }} />
          </div>
        </div>

        {/* Card 4: Completed & Signed */}
        <div
          onClick={() => handleStatusFilterChange('COMPLETED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'COMPLETED'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã Hoàn Tất &amp; Ký Số
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 leading-none">
                {summary.completedCount}
                <span className="text-xs font-normal text-slate-400 ml-1.5">ca</span>
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                ✓ Báo cáo điện tử đã truyền về HIS
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((summary.completedCount / (summary.totalTasks || 1)) * 100))}%` }} />
          </div>
        </div>
      </div>

      {/* ── Time Range & Filtering Bar ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Phạm vi:</span>
            </div>
            {[
              { key: 'today', label: 'Hôm nay' },
              { key: '7days', label: '7 ngày qua' },
              { key: '30days', label: '30 ngày qua' },
              { key: 'month', label: 'Tháng này' },
              { key: 'all', label: 'Toàn bộ' },
              { key: 'custom', label: 'Tùy chọn' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => handleRangeChange(item.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  timeRange === item.key
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[240px]">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên BN, mã BN, mã phiếu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTasks()}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              onClick={() => fetchTasks()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0"
            >
              Tìm
            </button>
          </div>
        </div>

        {/* Status Tabs & Modality Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'ALL', label: 'Tất cả công việc', count: summary.totalTasks },
              { key: 'URGENT', label: '🚨 Cần xử lý gấp', count: summary.urgentCount },
              { key: 'PENDING_READ', label: '🩺 Chờ đọc kết quả', count: summary.pendingReadCount },
              { key: 'PENDING_SIGN', label: '✍️ Chờ ký số', count: summary.pendingSignCount },
              { key: 'COMPLETED', label: '✅ Đã hoàn tất', count: summary.completedCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleStatusFilterChange(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === tab.key
                    ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Modality Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold">Loại phim:</span>
            <select
              value={modalityFilter}
              onChange={(e) => handleModalityFilterChange(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Tất cả loại máy</option>
              <option value="CT">CT Cắt Lớp Vi Tính</option>
              <option value="MR">MR Cộng Hưởng Từ</option>
              <option value="CR">CR/DX X-Quang KTS</option>
              <option value="US">US Siêu Âm</option>
              <option value="ES">ES Nội Soi</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Task Worklist Table ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Hàng Đợi Ca Trực &amp; Tiến Độ Xử Lý
            </h3>
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full font-mono">
              {tasks.length} ca
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Mốc lọc: {filterLabel}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto" />
            <p className="text-xs font-semibold">Đang cập nhật danh sách công việc...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-60" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Không có công việc nào trong danh mục này</p>
            <p className="text-xs">Bác sĩ đã hoàn thành tốt các chỉ định hoặc không có ca tồn đọng.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="py-3 px-4">Cảnh Báo TAT</th>
                  <th className="py-3 px-3">Bệnh Nhân</th>
                  <th className="py-3 px-3">Modality &amp; Dịch Vụ</th>
                  <th className="py-3 px-3">Thời Gian Chỉ Định</th>
                  <th className="py-3 px-3">Bác Sĩ Đọc / Duyệt</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác Nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {tasks.map((task) => {
                  const isUrgent = task.urgency === 'URGENT';
                  const isHigh = task.urgency === 'HIGH';
                  const isSigned = task.status === 'REPORT_SIGNED';
                  const isDraft = task.status === 'REPORT_DRAFT';

                  return (
                    <tr
                      key={task.id}
                      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                        isUrgent ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      {/* TAT Countdown Badge */}
                      <td className="py-3.5 px-4">
                        {isSigned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Đã xong
                          </span>
                        ) : isUrgent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold text-[11px] border border-rose-300 dark:border-rose-700 animate-pulse shadow-xs">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> {task.tatStatusText}
                          </span>
                        ) : isHigh ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-500" /> {task.tatStatusText}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-bold text-[11px] border border-sky-200 dark:border-sky-800">
                            <Clock className="w-3 h-3 text-sky-500" /> {task.tatStatusText}
                          </span>
                        )}
                      </td>

                      {/* Patient Info */}
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {task.patientName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{task.patientId}</span>
                          <span>•</span>
                          <span>{task.gender}</span>
                          <span>•</span>
                          <span>{task.age} tuổi</span>
                        </div>
                      </td>

                      {/* Modality & Service */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                            task.modality === 'CT' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300' :
                            task.modality === 'MR' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' :
                            task.modality === 'US' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' :
                            'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300'
                          }`}>
                            {task.modality}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[200px]" title={task.itemName}>
                            {task.itemName}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Phiếu #{task.orderId}</p>
                      </td>

                      {/* Order Date */}
                      <td className="py-3.5 px-3 font-mono text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(task.orderDate).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>

                      {/* Doctor */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{task.readingDoctor || 'Chưa phân công'}</span>
                        </div>
                      </td>

                      {/* Status Stage */}
                      <td className="py-3.5 px-3">
                        {isSigned ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                            Đã Ký Số
                          </span>
                        ) : isDraft ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800">
                            Bản Nháp Chờ Ký
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-bold text-[11px] border border-sky-200 dark:border-sky-800">
                            Chờ Đọc Kết Quả
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenViewer(task)}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 font-bold text-xs transition inline-flex items-center gap-1"
                          title="Mở xem hình ảnh chuẩn DICOM"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem Phim</span>
                        </button>

                        <button
                          onClick={() => handleOpenReportEditor(task)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition inline-flex items-center gap-1"
                          title="Mở trình soạn thảo & ký số y tế"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>{isSigned ? 'Xem KQ' : 'Đọc & Ký'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick DICOM Viewer Dialog */}
      <QuickViewerDialog
        isOpen={!!quickViewerStudy}
        onClose={() => setQuickViewerStudy(null)}
        studyId={quickViewerStudy?.id || quickViewerStudy?.studyInstanceUid}
        patientName={quickViewerStudy?.patientName}
        patientId={quickViewerStudy?.patientId}
        modality={quickViewerStudy?.modality}
        accessionNumber={quickViewerStudy?.accessionNumber}
        studyDate={quickViewerStudy?.studyDate}
      />
    </div>
  );
};

export default DoctorTaskManagerPage;
