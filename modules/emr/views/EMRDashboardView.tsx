import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EMRStatistics, EMRAuditLog } from '../types';
import { emrService } from '../services/emrService';
import {
  FileText,
  CheckCircle2,
  Clock,
  Archive,
  ShieldAlert,
  Share2,
  TrendingUp,
  Activity,
  Award,
  ArrowRight,
  ShieldCheck,
  Building2,
  Layers,
  Sparkles,
  Users
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#0284c7', '#0d9488', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

export const EMRDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<EMRStatistics | null>(null);
  const [recentLogs, setRecentLogs] = useState<EMRAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, logs] = await Promise.all([
        emrService.getStatistics(),
        emrService.getAuditLogs(),
      ]);
      setStats(s);
      setRecentLogs(logs.slice(0, 6));
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dashboard EMR', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-sky-200 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Hệ thống Bệnh án Điện tử Thông minh • Thông tư 54 & 46/2018/TT-BYT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Trung tâm Giám sát & Điều hành Bệnh án Điện tử (EMR)
          </h1>
          <p className="text-sky-100/90 text-sm leading-relaxed">
            Quản lý vòng đời hồ sơ bệnh án tập trung, số hóa toàn diện quy trình ký số y khoa và liên thông dữ liệu HL7 CDA / FHIR hướng tới bệnh viện không giấy tờ.
          </p>

          <div className="pt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/emr/records')}
              className="px-4 py-2 bg-white text-sky-900 hover:bg-sky-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-sky-700" />
              <span>Tra cứu Hồ sơ Toàn viện</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/emr/handover')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-slate-900" />
              <span>Tiếp nhận & Giao nhận HS ({stats.pendingHandoverCount || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/emr/signatures')}
              className="px-4 py-2 bg-sky-600/60 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Phê duyệt & Ký số hàng loạt</span>
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng hồ sơ */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng HSBA lưu trữ</span>
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 rounded-xl">
              <Archive className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-50">{stats.totalRecords.toLocaleString()}</span>
            <span className="text-xs text-emerald-600 ml-2 font-semibold">↑ +8.4%</span>
          </div>
          <p className="text-[11px] text-slate-500">Đã số hóa vào kho lưu trữ EMR</p>
        </div>

        {/* Card 2: Đang điều trị */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hồ sơ Đang điều trị</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-50">{stats.activeInpatients}</span>
            <span className="text-xs text-slate-500 ml-2 font-medium">Bệnh nhân nội trú</span>
          </div>
          <p className="text-[11px] text-slate-500">Ghi nhận diễn biến & y lệnh liên tục</p>
        </div>

        {/* Card 3: Chờ ký số / Phê duyệt */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Chờ ký số & Khóa BA</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.closedAwaitingSign}</span>
            {stats.overdueSigningCount > 0 && (
              <span className="text-xs text-rose-600 ml-2 font-bold px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 rounded">
                {stats.overdueSigningCount} quá hạn 24h
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Chờ BS điều trị & Trưởng khoa duyệt</p>
        </div>

        {/* Card 4: Tỷ lệ không giấy tờ */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tỷ lệ Không giấy tờ</span>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.paperlessRatePercentage}%</span>
            <span className="text-xs text-slate-500 ml-2 font-medium">Mức 6 - TT54</span>
          </div>
          <p className="text-[11px] text-slate-500">Đạt chuẩn Bệnh án Điện tử Nâng cao</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Xu hướng Tạo & Ký số Hồ sơ Bệnh án (6 Tháng gần nhất)
              </h3>
              <p className="text-xs text-slate-500">Theo dõi tiến độ số hóa hồ sơ theo từng tháng</p>
            </div>
            <span className="px-2 py-1 bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 rounded text-xs font-semibold">
              Toàn viện
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="newRecords" name="Hồ sơ mới tạo" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="signedRecords" name="Hồ sơ đã ký số hoàn tất" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Specialty Distribution Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Phân bố HSBA theo Chuyên khoa
            </h3>
            <p className="text-xs text-slate-500">Tỷ trọng hồ sơ các khối lâm sàng</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.specialtyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="specialty"
                >
                  {stats.specialtyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Logs & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Logs */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-sky-600" />
                <span>Nhật ký Truy vết & An ninh EMR (Audit Logs)</span>
              </h3>
              <p className="text-xs text-slate-500">Ghi vết hành động của người dùng theo thời gian thực</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/emr/access-requests')}
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentLogs.map(log => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">{log.userName}</strong>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                      {log.userRole}
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">({log.ipAddress})</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 truncate">
                    {log.details} - <span className="font-bold text-sky-700 dark:text-sky-400">{log.recordNumber}</span> ({log.patientName})
                  </p>
                </div>
                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Module Shortcuts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Tiện ích Khai thác & Liên thông
            </h3>
            <p className="text-xs text-slate-500">Các nghiệp vụ theo tiêu chuẩn Bộ Y Tế</p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate('/emr/handover')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Giao nhận & Tiếp nhận HSBA</h4>
                  <p className="text-[11px] text-slate-500">Rà soát đủ ĐK & Duyệt nhận hồ sơ</p>
                </div>
              </div>
              <span className="text-xs text-amber-700 font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950 rounded-full">
                {stats.pendingHandoverCount || 0} chờ duyệt
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/emr/unlock-requests')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Mở khóa & Sửa đổi HSBA</h4>
                  <p className="text-[11px] text-slate-500">Bổ sung KQ GPB/Vi sinh sau lưu trữ</p>
                </div>
              </div>
              <span className="text-xs text-amber-600 font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950 rounded-full">
                {stats.pendingUnlockRequestsCount || 0} chờ duyệt
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/emr/copies')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Trích sao & Cấp bản sao QR</h4>
                  <p className="text-[11px] text-slate-500">Cấp giấy tờ điện tử có mã QR xác thực</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/emr/consultations')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Hội chẩn & Kiểm thảo TV</h4>
                  <p className="text-[11px] text-slate-500">Ký số tập thể biên bản hội đồng</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/emr/quality-audit')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Giám định Chất lượng EMR</h4>
                  <p className="text-[11px] text-slate-500">Chấm điểm theo QĐ 6858/QĐ-BYT</p>
                </div>
              </div>
              <span className="text-xs text-emerald-600 font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 rounded-full">
                {stats.averageQualityScore || 88}% Điểm TB
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/emr/access-requests')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Phiếu Khai thác Hồ sơ</h4>
                  <p className="text-[11px] text-slate-500">Yêu cầu mượn HSBA cho NCKH/Giám định</p>
                </div>
              </div>
              <span className="text-xs text-amber-600 font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950 rounded-full">
                {stats.pendingAccessRequests} chờ duyệt
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/emr/interop')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Liên thông HL7 & XML</h4>
                  <p className="text-[11px] text-slate-500">Gói tin XML 4210, QĐ 130 & Sổ Sức Khỏe</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/emr/settings')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Danh mục Mẫu biểu BYT</h4>
                  <p className="text-[11px] text-slate-500">Cấu hình mẫu biểu chuyên khoa</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
