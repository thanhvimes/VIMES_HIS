
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Activity, 
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  BarChart
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { apiFetch } from '../services/apiService';

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, trendData] = await Promise.all([
          apiFetch('/api/public/stats/detailed'),
          apiFetch('/api/public/stats/hourly')
        ]);
        setStats(statsData);
        setHourlyData(trendData);
      } catch (e) {
        console.error('Fetch dashboard error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) return (
    <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[2rem]"></div>)}
        </div>
        <div className="h-[400px] bg-slate-100 rounded-[2.5rem]"></div>
    </div>
  );

  const { summary, areas } = stats;

  const metrics = [
    {
      label: 'Tổng bệnh nhân',
      value: summary.total_today || 0,
      icon: <Users className="text-blue-600" size={24} />,
      color: 'bg-blue-50',
      trend: '+12%',
      trendUp: true
    },
    {
      label: 'Đang chờ',
      value: summary.total_waiting || 0,
      icon: <Clock className="text-orange-500" size={24} />,
      color: 'bg-orange-50',
      trend: 'Ổn định',
      trendUp: null
    },
    {
      label: 'Đã hoàn tất',
      value: summary.total_served || 0,
      icon: <CheckCircle2 className="text-emerald-500" size={24} />,
      color: 'bg-emerald-50',
      trend: '+5%',
      trendUp: true
    },
    {
      label: 'TG Chờ TB',
      value: Math.round(summary.global_avg_wait || 0) + ' phút',
      icon: <Activity className="text-purple-500" size={24} />,
      color: 'bg-purple-50',
      trend: '-2m',
      trendUp: false
    }
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${m.color} group-hover:scale-110 transition-transform`}>
                {m.icon}
              </div>
              <div className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${
                m.trendUp === true ? 'bg-emerald-50 text-emerald-600' : 
                m.trendUp === false ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
              }`}>
                {m.trend} {m.trendUp !== null && (m.trendUp ? <ArrowUpRight size={10} /> : <TrendingUp size={10} className="rotate-180" />)}
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">{m.value}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Lưu lượng Bệnh nhân (Giờ)</h3>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div> Hàng chờ
                 </div>
              </div>
           </div>
           
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="hour" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    cursor={{ stroke: '#2563eb', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between">
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                 <BarChart className="text-blue-400" />
                 <h3 className="text-lg font-black uppercase tracking-tight">Phân phối Trạng thái</h3>
              </div>
              
              <div className="space-y-6">
                 {[
                   { label: 'Hoàn tất', val: summary?.total_served || 0, total: summary?.total_today || 1, color: 'bg-emerald-500' },
                   { label: 'Đang chờ', val: summary?.total_waiting || 0, total: summary?.total_today || 1, color: 'bg-orange-500' },
                   { label: 'Đang gọi', val: summary?.total_calling || 0, total: summary?.total_today || 1, color: 'bg-blue-500' },
                 ].map((s, idx) => (
                    <div key={idx}>
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
                          <span className="text-sm font-black">{s.val}</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${s.color} rounded-full`} 
                            style={{ width: `${(s.val / s.total) * 100}%` }}
                          ></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
           
           <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
              <AlertCircle size={20} className="text-blue-400" />
              <p className="text-[10px] font-medium leading-relaxed text-slate-300">
                Hiệu suất phục vụ trung bình hiện tại đạt <span className="text-white font-black">92%</span> so với mục tiêu.
              </p>
           </div>
        </div>
      </div>

      {/* Area Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Chi tiết theo Khu vực</h3>
            </div>
            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Xem báo cáo đầy đủ</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50">
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khu vực</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Đang chờ</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Đang gọi</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Đã xong</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Hiệu suất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {areas.map((area: any) => (
                <tr key={area.area_id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-bold text-slate-700">{area.area_name}</td>
                  <td className="py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      parseInt(area.waiting_count) > 10 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {area.waiting_count}
                    </span>
                  </td>
                  <td className="py-4 text-center text-blue-600 font-black">{area.calling_count}</td>
                  <td className="py-4 text-center text-emerald-600 font-black">{area.served_count}</td>
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${Math.min(100, (parseInt(area.served_count) / (parseInt(area.waiting_count) + parseInt(area.served_count) || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 w-8">
                        {Math.round((parseInt(area.served_count) / (parseInt(area.waiting_count) + parseInt(area.served_count) || 1)) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;

