
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Star, MessageSquare, TrendingUp, 
  CheckCircle2, AlertCircle, Calendar, RefreshCcw,
  Smile, Frown, Meh, ThumbsUp
} from 'lucide-react';
import { AppSettings } from '../types';

interface FeedbackStatsProps {
  settings: AppSettings;
}

const FeedbackStats: React.FC<FeedbackStatsProps> = ({ settings }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    // Simulating API fetch
    setTimeout(() => {
      setStats({
        avgRating: 4.8,
        totalFeedback: 1250,
        distribution: {
          5: 850,
          4: 250,
          3: 100,
          2: 30,
          1: 20
        },
        topComplaints: [
          'Chờ đợi lâu tại quầy xét nghiệm',
          'Nhà vệ sinh tầng 2 chưa sạch',
          'Wifi thỉnh thoảng chập chờn'
        ],
        topPraise: [
          'Bác sĩ tận tâm, nhiệt tình',
          'Quy trình đăng ký nhanh gọn',
          'Không gian thoáng mát, sạch sẽ'
        ]
      });
      setLoading(false);
    }, 800);
  };

  useEffect(() => { fetchStats(); }, []);

  if (!stats) return <div className="p-12 flex justify-center"><RefreshCcw className="animate-spin text-slate-300" size={48} /></div>;

  return (
    <div className="h-full flex flex-col p-8 gap-8 overflow-y-auto bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Score Card */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100 flex flex-col items-center text-center">
           <h3 className="text-slate-400 font-black uppercase tracking-widest mb-8">Chỉ số hài lòng (CSAT)</h3>
           <div className="relative mb-8">
              <div className="w-48 h-48 rounded-full border-[12px] border-slate-50 flex items-center justify-center">
                 <div className="text-center">
                    <p className="text-6xl font-black text-slate-800 leading-none">{stats.avgRating}</p>
                    <p className="text-slate-400 font-bold uppercase tracking-widest mt-2">Trên 5.0</p>
                 </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full font-black flex items-center gap-2 shadow-lg">
                 <Smile size={20} /> XUẤT SẮC
              </div>
           </div>
           <div className="flex gap-1 mb-8">
              {[1,2,3,4,5].map(s => <Star key={s} size={24} fill={s <= 4 ? '#f59e0b' : '#e2e8f0'} className={s <= 4 ? 'text-amber-500' : 'text-slate-200'} />)}
           </div>
           <p className="text-slate-500 font-medium italic">Dựa trên {stats.totalFeedback} lượt đánh giá trong tháng này</p>
        </div>

        {/* Rating Distribution */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100">
           <h3 className="text-slate-800 font-black uppercase tracking-tight mb-8 flex items-center gap-3">
              <TrendingUp className="text-blue-600" /> Phân bổ mức độ hài lòng
           </h3>
           <div className="space-y-6">
              {[5,4,3,2,1].map(star => {
                const count = stats.distribution[star];
                const percentage = (count / stats.totalFeedback) * 100;
                return (
                  <div key={star} className="flex items-center gap-6">
                    <div className="w-12 font-black text-slate-500 flex items-center gap-1">{star} <Star size={14} fill="#94a3b8" /></div>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-500' : 'bg-red-500'}`} 
                         style={{ width: `${percentage}%` }}
                       ></div>
                    </div>
                    <div className="w-24 text-right font-black text-slate-800">{percentage.toFixed(1)}%</div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Feedback Details */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-emerald-50 rounded-[2.5rem] p-10 border border-emerald-100 shadow-sm">
              <h4 className="text-emerald-800 font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                 <ThumbsUp /> Điểm được đánh giá cao nhất
              </h4>
              <ul className="space-y-4">
                 {stats.topPraise.map((item: string, i: number) => (
                   <li key={i} className="flex items-start gap-3 bg-white/60 p-4 rounded-2xl border border-white">
                      <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-1" />
                      <span className="text-emerald-900 font-bold">{item}</span>
                   </li>
                 ))}
              </ul>
           </div>

           <div className="bg-red-50 rounded-[2.5rem] p-10 border border-red-100 shadow-sm">
              <h4 className="text-red-800 font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                 <AlertCircle /> Cần cải thiện (Góp ý)
              </h4>
              <ul className="space-y-4">
                 {stats.topComplaints.map((item: string, i: number) => (
                   <li key={i} className="flex items-start gap-3 bg-white/60 p-4 rounded-2xl border border-white">
                      <AlertCircle size={20} className="text-red-600 shrink-0 mt-1" />
                      <span className="text-red-900 font-bold">{item}</span>
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackStats;

