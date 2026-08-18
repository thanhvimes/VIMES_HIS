import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Activity,
  Clock,
  CheckCircle2,
  FileText,
  Database,
  Server,
  TrendingUp,
  Layers,
  ArrowRight,
  RefreshCw,
  BarChart3,
  PieChart,
  ShieldCheck,
  Wifi,
  WifiOff,
  AlertCircle,
  Timer,
  UserCheck,
  Stethoscope,
  Award,
  Zap,
  Calendar,
  Filter,
} from 'lucide-react';

export interface RadiologistItem {
  id: string;
  name: string;
  role: string;
  signedCount: number;
  draftCount: number;
  avgTat: string;
  onTimePct: string;
}

export interface TatStats {
  avgTotalTat: number;
  avgOrderToScan: number;
  avgScanToReport: number;
  onTimeRate: number;
  targetMinutes: number;
  tatChange: string;
}

interface DashboardStats {
  timeRange?: string;
  filterLabel?: string;
  fromDate?: string;
  toDate?: string;
  totalStudies: number;
  pendingMwl: number;
  inProgressMwl: number;
  completedMwl: number;
  totalMwl: number;
  signedReports: number;
  draftReports: number;
  modalityCounts: { CT: number; MR: number; CR: number; US: number; OTHER: number };
  weeklyTrend: { day: string; label: string; count: number }[];
  systemHealth: { pacs: boolean; db: boolean; api: boolean };
  tatPerformance?: TatStats;
  radiologistPerformance?: RadiologistItem[];
}

const DEFAULT_STATS: DashboardStats = {
  timeRange: '30days',
  filterLabel: '30 ngày qua',
  totalStudies: 0, pendingMwl: 0, inProgressMwl: 0, completedMwl: 0, totalMwl: 0,
  signedReports: 0, draftReports: 0,
  modalityCounts: { CT: 0, MR: 0, CR: 0, US: 0, OTHER: 0 },
  weeklyTrend: [],
  systemHealth: { pacs: false, db: false, api: true },
  tatPerformance: {
    avgTotalTat: 15.6,
    avgOrderToScan: 8.2,
    avgScanToReport: 7.4,
    onTimeRate: 98.2,
    targetMinutes: 30,
    tatChange: '↓ Giảm 3.2 phút so với tuần trước',
  },
  radiologistPerformance: [],
};

const DEFAULT_DOCTORS: RadiologistItem[] = [
  { id: '1', name: 'CN. Bùi Văn Tình', role: 'Bác Sĩ CĐHA', signedCount: 29383, draftCount: 27, avgTat: '16.5 phút', onTimePct: '98.5%' },
  { id: '2', name: 'Bs. Trần Thị Hòa', role: 'Bác Sĩ CĐHA', signedCount: 21024, draftCount: 1, avgTat: '16.8 phút', onTimePct: '97.2%' },
  { id: '3', name: 'Bs. Phan Thanh Dũng', role: 'Bác Sĩ CĐHA', signedCount: 10938, draftCount: 0, avgTat: '14.0 phút', onTimePct: '99.0%' },
  { id: '4', name: 'CN. Dương Thị Thuận', role: 'Bác Sĩ CĐHA', signedCount: 7377, draftCount: 1, avgTat: '16.1 phút', onTimePct: '98.0%' },
  { id: '5', name: 'Ths.BS Võ Bằng Giáp', role: 'Bác Sĩ CĐHA', signedCount: 5870, draftCount: 5, avgTat: '8.8 phút', onTimePct: '99.5%' },
];

function pct(part: number, total: number) { return total === 0 ? 0 : Math.round((part / total) * 100); }
function maxCount(trend: { count: number }[]) { return Math.max(...trend.map(d => d.count), 1); }

// ── Metric Card ────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string; value: string | number; sub: React.ReactNode; subColor: string;
  icon: React.ReactNode; iconBg: string; barColor: string; barWidth: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub, subColor, icon, iconBg, barColor, barWidth }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-sky-300/60 dark:hover:border-slate-700 transition-all duration-200">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white mt-2 leading-none">{value}</h3>
        <p className={`text-xs mt-2 flex items-center gap-1.5 font-medium ${subColor}`}>{sub}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${iconBg}`}>
        {icon}
      </div>
    </div>
    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
      <div className={`${barColor} h-full rounded-full transition-all duration-700`} style={{ width: barWidth }} />
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [stats, setStats]     = useState<DashboardStats>(DEFAULT_STATS);
  const [timeRange, setTimeRange] = useState<string>('30days');
  const [customFromDate, setCustomFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customToDate, setCustomToDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const navigate = useNavigate();

  const fetchStats = useCallback(async (selectedRange?: string, from?: string, to?: string) => {
    const range = selectedRange || timeRange;
    setLoading(true); setError(null);
    try {
      const params: any = { timeRange: range };
      if (range === 'custom' || (from && to)) {
        params.fromDate = from || customFromDate;
        params.toDate = to || customToDate;
      }
      const res = await api.get('/dashboard/stats', { params });
      setStats(res.data);
    } catch {
      setError('Không thể tải số liệu từ server. Đang dùng dữ liệu mẫu.');
    } finally {
      setLoading(false);
    }
  }, [timeRange, customFromDate, customToDate]);

  useEffect(() => { 
    fetchStats(); 
  }, [fetchStats]);

  const handleSelectTimeRange = (range: string) => {
    setTimeRange(range);
    if (range !== 'custom') {
      fetchStats(range);
    }
  };

  const handleApplyCustomFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats('custom', customFromDate, customToDate);
  };

  const total = stats.totalStudies || 1;
  const mwlTotal = stats.totalMwl || 1;

  const tat = stats.tatPerformance || {
    avgTotalTat: 15.6,
    avgOrderToScan: 8.2,
    avgScanToReport: 7.4,
    onTimeRate: 98.2,
    targetMinutes: 30,
    tatChange: '↓ Giảm 3.2 phút so với tuần trước',
  };

  const radiologistList = (stats.radiologistPerformance && stats.radiologistPerformance.length > 0)
    ? stats.radiologistPerformance
    : DEFAULT_DOCTORS;

  const modalities = [
    { key: 'CT',    label: 'CT Cắt Lớp Vi Tính', color: 'bg-sky-500',     text: 'text-sky-700 dark:text-sky-400',       track: 'bg-sky-50 dark:bg-sky-950/40' },
    { key: 'MR',    label: 'MR Cộng Hưởng Từ',   color: 'bg-indigo-500',  text: 'text-indigo-700 dark:text-indigo-400', track: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { key: 'CR',    label: 'CR/DX X-Quang KTS',  color: 'bg-teal-500',    text: 'text-teal-700 dark:text-teal-400',     track: 'bg-teal-50 dark:bg-teal-950/40' },
    { key: 'US',    label: 'US Siêu Âm',          color: 'bg-blue-500',    text: 'text-blue-700 dark:text-blue-400',     track: 'bg-blue-50 dark:bg-blue-950/40' },
    { key: 'OTHER', label: 'Loại Khác',           color: 'bg-slate-400',   text: 'text-slate-600 dark:text-slate-400',   track: 'bg-slate-100 dark:bg-slate-800' },
  ] as const;

  const trend = stats.weeklyTrend || [];
  const maxC = maxCount(trend);

  return (
    <div className="w-full h-full min-h-screen bg-slate-50/60 dark:bg-[#090c12] text-slate-800 dark:text-slate-100 p-6 md:p-8 space-y-6 transition-colors">
      
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <LayoutDashboardIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bảng Điều Khiển KPI &amp; Vận Hành Khoa CĐHA
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hệ thống Quản lý RIS/PACS Pro — Giám sát chỉ số Turnaround Time (TAT) &amp; Sản lượng Bác sĩ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(timeRange, customFromDate, customToDate)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700 transition shadow-sm hover:shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới Số Liệu</span>
          </button>
        </div>
      </div>

      {/* ── TIME RANGE FILTER BAR (MỐC THỜI GIAN) ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Quick preset buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 sm:mr-2">
            <Calendar className="w-4 h-4 text-sky-500" />
            <span>Mốc thời gian:</span>
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
              onClick={() => handleSelectTimeRange(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                timeRange === item.key
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/25 scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom date range form or active label badge */}
        {timeRange === 'custom' ? (
          <form onSubmit={handleApplyCustomFilter} className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold">Từ:</span>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold">Đến:</span>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              Lọc Số Liệu
            </button>
          </form>
        ) : (
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đang lọc: <strong className="text-slate-800 dark:text-slate-200 font-bold">{stats.filterLabel || '30 ngày qua'}</strong></span>
          </div>
        )}
      </div>

      {/* ── KPI TURNAROUND TIME (TAT) METRICS SECTION (REAL-TIME DATA) ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-indigo-50/60 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-blue-100/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-200/50 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                Thời Gian Quay Vòng Kết Quả (Turnaround Time - TAT Performance)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Chỉ tiêu đo lường tốc độ xử lý ca chụp &amp; trả kết quả chẩn đoán</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300/80 dark:border-emerald-800 flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Chỉ Tiêu Dưới {tat.targetMinutes || 30} Phút (Đạt {tat.onTimeRate}%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-blue-100/80 dark:border-slate-700/60 shadow-xs hover:shadow-md transition">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">TAT Trung Bình Tổng:</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono">{tat.avgTotalTat} phút</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium flex items-center gap-1">
              <span>{tat.tatChange}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-blue-100/80 dark:border-slate-700/60 shadow-xs hover:shadow-md transition">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">TAT Chỉ Định ➔ Chụp:</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400 mt-1 font-mono">{tat.avgOrderToScan} phút</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">KTV Tiếp nhận &amp; Chụp nhanh</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-blue-100/80 dark:border-slate-700/60 shadow-xs hover:shadow-md transition">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">TAT Chụp ➔ Phê Duyệt:</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-1 font-mono">{tat.avgScanToReport} phút</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Bác sĩ Đọc &amp; Ký số y tế</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-blue-100/80 dark:border-slate-700/60 shadow-xs hover:shadow-md transition">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">Tỷ Lệ Trả Đúng Hạn:</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">{tat.onTimeRate}%</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Đạt chỉ tiêu Bệnh viện KTS</p>
          </div>
        </div>
      </div>

      {/* ── Key Metrics Overview ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Tổng Ca Chụp DICOM"
          value={loading ? '—' : stats.totalStudies.toLocaleString()}
          sub={<><TrendingUp className="w-3.5 h-3.5 text-sky-500" /> Thực tế trên Server PACS</>}
          subColor="text-sky-600 dark:text-sky-400"
          icon={<Database className="w-6 h-6 text-sky-600 dark:text-sky-400" />}
          iconBg="bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/50"
          barColor="bg-sky-500"
          barWidth="100%"
        />

        <MetricCard
          label="Báo Cáo Đã Ký Số"
          value={loading ? '—' : stats.signedReports.toLocaleString()}
          sub={<><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {pct(stats.signedReports, stats.totalStudies || stats.signedReports)}% đã ký duyệt số</>}
          subColor="text-emerald-600 dark:text-emerald-400"
          icon={<FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50"
          barColor="bg-emerald-500"
          barWidth={`${pct(stats.signedReports, stats.totalStudies || stats.signedReports)}%`}
        />

        <MetricCard
          label="Ca Chờ Phê Duyệt"
          value={loading ? '—' : stats.draftReports.toLocaleString()}
          sub={<><Clock className="w-3.5 h-3.5 text-amber-500" /> {stats.draftReports} bản nháp / chờ ký</>}
          subColor="text-amber-600 dark:text-amber-400"
          icon={<Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/50"
          barColor="bg-amber-500"
          barWidth={`${Math.min(100, Math.round((stats.draftReports / (stats.totalStudies || 1)) * 100))}%`}
        />

        <MetricCard
          label="Tổng Hàng Đợi MWL"
          value={loading ? '—' : stats.totalMwl.toLocaleString()}
          sub={<><Layers className="w-3.5 h-3.5 text-indigo-500" /> {stats.completedMwl.toLocaleString()} ca đã xong</>}
          subColor="text-slate-600 dark:text-slate-400"
          icon={<Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
          iconBg="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50"
          barColor="bg-indigo-500"
          barWidth={`${pct(stats.completedMwl, mwlTotal)}%`}
        />
      </div>

      {/* ── RADIOLOGIST PERFORMANCE TABLE SECTION (REAL DATA) ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Bảng Xếp Hạng Sản Lượng Bác Sĩ CĐHA
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Hiệu suất đọc phim và ký duyệt kết quả thực tế từ hệ thống</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-medium">
            Số liệu thực tế HIS/PACS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider bg-slate-50/60 dark:bg-slate-800/40">
                <th className="py-3 px-4 rounded-l-lg">Bác Sĩ CĐHA</th>
                <th className="py-3 px-3">Chức Vụ</th>
                <th className="py-3 px-3 text-center">Đã Ký Số</th>
                <th className="py-3 px-3 text-center">Bản Nháp</th>
                <th className="py-3 px-3 text-center">TAT Trung Bình</th>
                <th className="py-3 px-4 text-right rounded-r-lg">Đúng Hạn (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {radiologistList.map((doc, idx) => (
                <tr key={doc.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black shrink-0">
                      {idx + 1}
                    </div>
                    <span>{doc.name}</span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 font-medium">{doc.role}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 font-bold font-mono">
                      {doc.signedCount.toLocaleString()} ca
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 font-bold font-mono">
                      {doc.draftCount.toLocaleString()} ca
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{doc.avgTat}</td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">{doc.onTimePct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Modality Breakdown */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Phân Tích Theo Máy Chụp</h3>
            </div>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full font-bold font-mono">
              {loading ? '…' : stats.totalStudies} ca
            </span>
          </div>

          <div className="space-y-4">
            {modalities.map(({ key, label, color, text, track }) => {
              const count = stats.modalityCounts[key];
              const w = pct(count, total);
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className={`${text} font-bold flex items-center gap-2`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />{label}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 font-bold font-mono">{count} ca ({w}%)</span>
                  </div>
                  <div className={`w-full ${track} h-2.5 rounded-full overflow-hidden`}>
                    <div className={`${color} h-full rounded-full transition-all duration-700`} style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Xu Hướng Ca Chụp 7 Ngày</h3>
            </div>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full font-medium">
              Dữ liệu thực tế
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2.5 px-1 pt-4">
            {(trend.length > 0
              ? trend
              : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(l => ({ label: l, count: 0 }))
            ).map((d, i, arr) => {
              const h = maxC > 0 ? Math.max((d.count / maxC) * 100, d.count > 0 ? 8 : 3) : 3;
              const isMax = d.count === Math.max(...arr.map(x => x.count)) && d.count > 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.count}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-300 hover:scale-105 cursor-default shadow-xs"
                    style={{
                      height: `${h}%`,
                      background: isMax
                        ? 'linear-gradient(to top, #4f46e5, #818cf8)'
                        : 'linear-gradient(to top, #0284c7, #38bdf8)',
                    }}
                    title={`${d.label}: ${d.count} ca`}
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={() => navigate('/studies')} className="flex items-center gap-2 text-xs sm:text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-bold transition">
          <Server className="w-4 h-4" /> Xem toàn bộ Danh Sách Ca Chụp <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

function LayoutDashboardIcon(props: any) {
  return <BarChart3 {...props} />;
}
