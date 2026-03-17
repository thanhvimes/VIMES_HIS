
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockCrmCustomers } from '../data';
import { 
    ChevronLeftIcon, 
    UserCircleIcon, 
    PhoneIcon, 
    HomeIcon, 
    StarIcon, 
    ClockIcon, 
    ChatBubbleIcon,
    SparklesIcon,
    CheckCircleIcon,
    GiftIcon,
    PlusIcon
} from '../../../components/Icons';
import { ChartBarIcon } from '../../../components/Icons'; // Reusing icons

const CustomerDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const customer = mockCrmCustomers.find(c => c.id === id);

    // --- LOGIC: PERSONALIZED SUGGESTIONS ---
    const suggestions = useMemo(() => {
        if (!customer) return [];
        const items = [];
        const today = new Date();
        const lastVisit = new Date(customer.lastVisitDate);
        const daysSinceLastVisit = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 3600 * 24));

        // Rule 1: At Risk Churn
        if (daysSinceLastVisit > 180) {
            items.push({
                type: 'warning',
                title: 'Cảnh báo Rời bỏ',
                desc: `Khách hàng chưa quay lại trong ${daysSinceLastVisit} ngày. Cần liên hệ hỏi thăm sức khỏe.`,
                action: 'Tạo Ticket CSKH'
            });
        }

        // Rule 2: Specific Medical Conditions (Tags)
        if (customer.tags.includes('Tiểu đường')) {
            items.push({
                type: 'care',
                title: 'Gói Theo dõi Tiểu đường',
                desc: 'Gợi ý đăng ký gói theo dõi đường huyết tại nhà và tư vấn dinh dưỡng online.',
                action: 'Gửi Zalo Ưu đãi'
            });
        }

        // Rule 3: Age Based
        if (customer.age > 40) {
            items.push({
                type: 'upsell',
                title: 'Tầm soát Ung thư',
                desc: 'Khách hàng trong độ tuổi nguy cơ. Gợi ý gói tầm soát ung thư cơ bản.',
                action: 'Tư vấn ngay'
            });
        }

        // Rule 4: VIP Care
        if (customer.segment === 'VIP') {
            items.push({
                type: 'reward',
                title: 'Quà tặng Sinh nhật VIP',
                desc: 'Chuẩn bị quà tặng đặc biệt cho dịp sinh nhật sắp tới.',
                action: 'Lên lịch tặng'
            });
        }

        return items;
    }, [customer]);

    if (!customer) return <div className="p-8 text-center">Không tìm thấy khách hàng.</div>;

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">
                    <ChevronLeftIcon className="w-5 h-5 text-slate-500"/>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {customer.name}
                        <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase border ${customer.segment === 'VIP' ? 'bg-purple-100 text-purple-700 border-purple-200' : customer.segment === 'AtRisk' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                            {customer.segment}
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500">Mã KH: {customer.id} • {customer.phone}</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-bold">Điểm tương tác</div>
                    <div className="text-2xl font-bold text-teal-600">{customer.interactionScore}/100</div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                
                {/* LEFT: INFO & HISTORY */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    
                    {/* Personal Info */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <UserCircleIcon className="w-5 h-5 text-blue-500"/> Thông tin cá nhân
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-slate-500 block">Tuổi / Giới tính:</span> {customer.age} / {customer.gender}</div>
                            <div><span className="text-slate-500 block">Email:</span> {customer.email}</div>
                            <div><span className="text-slate-500 block">Địa chỉ:</span> {customer.address}</div>
                            <div><span className="text-slate-500 block">Tổng chi tiêu:</span> <span className="font-bold text-green-600">{customer.lifetimeValue.toLocaleString()} đ</span></div>
                        </div>
                        <div className="mt-4">
                            <span className="text-slate-500 block text-xs uppercase font-bold mb-2">Thẻ (Tags):</span>
                            <div className="flex flex-wrap gap-2">
                                {customer.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-medium border border-slate-200 dark:border-slate-600">#{tag}</span>
                                ))}
                                <button className="px-2 py-1 border border-dashed border-slate-300 text-slate-400 rounded text-xs hover:border-blue-500 hover:text-blue-500 transition">+ Thêm</button>
                            </div>
                        </div>
                    </div>

                    {/* Interaction History */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-orange-500"/> Lịch sử tương tác
                            </h3>
                            <button className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 transition">Xem tất cả</button>
                        </div>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {customer.history.map((item, index) => (
                                <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        {item.type === 'Visit' && <CheckCircleIcon className="w-5 h-5 text-green-500"/>}
                                        {item.type === 'Call' && <PhoneIcon className="w-5 h-5 text-blue-500"/>}
                                        {item.type === 'SMS' && <ChatBubbleIcon className="w-5 h-5 text-orange-500"/>}
                                        {item.type === 'Zalo' && <ChatBubbleIcon className="w-5 h-5 text-blue-400"/>}
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{item.type === 'Visit' ? 'Đến khám' : item.type}</span>
                                            <time className="font-mono text-xs text-slate-500">{item.date}</time>
                                        </div>
                                        <div className="text-slate-600 dark:text-slate-300 text-sm">{item.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: SMART ACTIONS & SUGGESTIONS */}
                <div className="w-full lg:w-96 flex flex-col gap-4">
                    
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase">Thao tác nhanh</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition">
                                <PhoneIcon className="w-4 h-4"/> Gọi điện
                            </button>
                            <button className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition">
                                <ChatBubbleIcon className="w-4 h-4"/> Gửi Zalo
                            </button>
                            <button className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition">
                                <PlusIcon className="w-4 h-4"/> Tạo Ticket
                            </button>
                            <button className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition">
                                <GiftIcon className="w-4 h-4"/> Tặng Voucher
                            </button>
                        </div>
                    </div>

                    {/* AI SUGGESTIONS */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 p-5 rounded-xl shadow-lg border border-indigo-100 dark:border-slate-600 flex flex-col gap-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full opacity-20 blur-2xl"></div>
                        
                        <h3 className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 relative z-10">
                            <SparklesIcon className="w-5 h-5 text-yellow-500 animate-pulse"/> Gợi ý Cá nhân hóa (AI)
                        </h3>
                        
                        <div className="space-y-3 relative z-10">
                            {suggestions.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                                            item.type === 'warning' ? 'bg-red-100 text-red-700' : 
                                            item.type === 'upsell' ? 'bg-blue-100 text-blue-700' : 
                                            item.type === 'reward' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                            {item.type === 'warning' ? 'Cảnh báo' : item.type === 'upsell' ? 'Cơ hội' : 'Chăm sóc'}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{item.title}</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{item.desc}</p>
                                    <button className="w-full py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded text-xs font-bold transition-colors">
                                        {item.action}
                                    </button>
                                </div>
                            ))}
                            {suggestions.length === 0 && (
                                <p className="text-sm text-slate-500 italic text-center py-4">Chưa có gợi ý nào cho khách hàng này.</p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                         <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase">Thống kê nhanh</h3>
                         <div className="space-y-3">
                             <div>
                                 <div className="flex justify-between text-xs mb-1">
                                     <span className="text-slate-500">Tỷ lệ hủy hẹn</span>
                                     <span className="font-bold text-green-600">5% (Thấp)</span>
                                 </div>
                                 <div className="w-full bg-slate-100 rounded-full h-1.5">
                                     <div className="bg-green-500 h-1.5 rounded-full" style={{width: '5%'}}></div>
                                 </div>
                             </div>
                             <div>
                                 <div className="flex justify-between text-xs mb-1">
                                     <span className="text-slate-500">Mức độ hài lòng</span>
                                     <span className="font-bold text-blue-600">4.8/5</span>
                                 </div>
                                 <div className="w-full bg-slate-100 rounded-full h-1.5">
                                     <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '96%'}}></div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailView;
