
import React, { useState } from 'react';
import { 
    NewspaperIcon, 
    RssIcon, 
    PlusIcon, 
    RefreshIcon, 
    CheckCircleIcon, 
    TrashIcon, 
    PencilIcon, 
    SparklesIcon,
    EyeIcon,
    ExternalLinkIcon
} from '../../../components/Icons';

// Mock Data for crawled news
const mockNews = [
    {
        id: 'N001',
        title: 'Bộ Y tế ban hành hướng dẫn mới về khám chữa bệnh từ xa',
        source: 'Cổng TTĐT Bộ Y tế',
        url: 'https://moh.gov.vn/tin-tuc',
        summary: 'Hướng dẫn mới tập trung vào quy trình kỹ thuật, bảo mật thông tin và thanh toán BHYT cho các dịch vụ Telehealth.',
        tags: ['Chính sách', 'Telehealth'],
        status: 'Published',
        date: '2023-11-20 08:30'
    },
    {
        id: 'N002',
        title: 'Cảnh báo gia tăng ca mắc cúm mùa tại các tỉnh phía Bắc',
        source: 'VnExpress Sức khỏe',
        url: 'https://vnexpress.net/suc-khoe',
        summary: 'Số lượng bệnh nhân nhập viện do cúm A tăng đột biến. Các chuyên gia khuyến cáo người dân tiêm phòng và giữ vệ sinh.',
        tags: ['Dịch bệnh', 'Cúm mùa'],
        status: 'Draft',
        date: '2023-11-19 14:00'
    },
    {
        id: 'N003',
        title: 'Bệnh viện K triển khai kỹ thuật phẫu thuật Robot mới',
        source: 'Website Bệnh viện K',
        url: 'https://benhvienk.vn',
        summary: 'Hệ thống Robot Da Vinci Xi thế hệ mới giúp phẫu thuật chính xác hơn, giảm đau và rút ngắn thời gian hồi phục cho bệnh nhân ung thư.',
        tags: ['Công nghệ', 'Ung bướu'],
        status: 'Pending',
        date: '2023-11-18 10:15'
    }
];

const NewsManagerView: React.FC = () => {
    const [newsList, setNewsList] = useState(mockNews);
    const [isCrawling, setIsCrawling] = useState(false);
    const [selectedNews, setSelectedNews] = useState<any>(null);

    const handleCrawl = () => {
        setIsCrawling(true);
        // Simulate API call
        setTimeout(() => {
            setIsCrawling(false);
            alert("Đã quét xong! Tìm thấy 3 tin mới từ Bộ Y tế.");
            // In real app, this would add new items to the list
        }, 2000);
    };

    const handleAISummarize = (id: string) => {
        // Simulate AI processing
        alert("AI đang tóm tắt nội dung...");
        setTimeout(() => {
            setNewsList(prev => prev.map(n => n.id === id ? { ...n, summary: n.summary + ' (Đã được AI tối ưu lại)' } : n));
        }, 1000);
    };

    const handlePublish = (id: string) => {
        setNewsList(prev => prev.map(n => n.id === id ? { ...n, status: 'Published' } : n));
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Xóa tin này?")) {
            setNewsList(prev => prev.filter(n => n.id !== id));
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <NewspaperIcon className="w-8 h-8 text-indigo-600"/> Quản lý Tin tức & Crawler
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tự động thu thập, tóm tắt và xuất bản tin tức y tế.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleCrawl}
                        disabled={isCrawling}
                        className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white rounded-lg font-bold shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 transition disabled:opacity-70"
                    >
                        <RssIcon className={`w-5 h-5 ${isCrawling ? 'animate-ping text-orange-500' : 'text-orange-500'}`}/>
                        {isCrawling ? 'Đang quét...' : 'Quét nguồn tin'}
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow flex items-center gap-2 transition transform active:scale-95">
                        <PlusIcon className="w-5 h-5"/> Viết tin mới
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* News List */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-700 dark:text-slate-200">
                        Danh sách tin bài ({newsList.length})
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {newsList.map(news => (
                            <div key={news.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow group relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                news.status === 'Published' ? 'bg-green-100 text-green-700 border-green-200' : 
                                                news.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                                                'bg-yellow-100 text-yellow-700 border-yellow-200'
                                            }`}>
                                                {news.status === 'Published' ? 'Đã đăng' : news.status === 'Draft' ? 'Bản nháp' : 'Chờ duyệt'}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <GlobeIcon className="w-3 h-3"/> {news.source}
                                            </span>
                                            <span className="text-xs text-slate-400">• {news.date}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white hover:text-indigo-600 cursor-pointer transition-colors">
                                            {news.title}
                                        </h3>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 mb-3 italic">
                                    "{news.summary}"
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {news.tags.map(tag => (
                                            <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800">#{tag}</span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleAISummarize(news.id)}
                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition"
                                            title="AI Tóm tắt lại"
                                        >
                                            <SparklesIcon className="w-4 h-4"/>
                                        </button>
                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition" title="Chỉnh sửa">
                                            <PencilIcon className="w-4 h-4"/>
                                        </button>
                                        {news.status !== 'Published' && (
                                            <button 
                                                onClick={() => handlePublish(news.id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-full transition"
                                                title="Xuất bản"
                                            >
                                                <CheckCircleIcon className="w-4 h-4"/>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDelete(news.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                            title="Xóa"
                                        >
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                        <a href={news.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition" title="Xem nguồn">
                                            <ExternalLinkIcon className="w-4 h-4"/>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="w-80 flex flex-col gap-6">
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <RssIcon className="w-6 h-6"/> Nguồn tin tự động
                        </h3>
                        <p className="text-orange-100 text-sm mb-4">Hệ thống đang theo dõi 5 nguồn tin chính thống.</p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between items-center border-b border-white/20 pb-1">
                                <span>Bộ Y tế</span>
                                <span className="bg-white/20 px-2 rounded text-xs">Active</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-white/20 pb-1">
                                <span>VnExpress Sức khỏe</span>
                                <span className="bg-white/20 px-2 rounded text-xs">Active</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-white/20 pb-1">
                                <span>WHO Việt Nam</span>
                                <span className="bg-white/20 px-2 rounded text-xs">Active</span>
                            </li>
                        </ul>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Từ khóa xu hướng (AI)</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Cúm A', 'Sốt xuất huyết', 'Vắc xin mới', 'BHYT 2024', 'Khám từ xa'].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium hover:bg-indigo-100 hover:text-indigo-600 cursor-pointer transition-colors">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Icon for this file
const GlobeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default NewsManagerView;
