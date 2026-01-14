
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { XIcon, CogIcon, SaveIcon, BellIcon, GlobeIcon, MegaphoneIcon, PlusIcon, TrashIcon, PlayIcon } from '../Icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useSystemStore, SlideItem } from '../../stores/useSystemStore';

interface SystemSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({ isOpen, onClose }) => {
    const { theme, toggleTheme, fontSettings, updateFontSettings } = useTheme();
    // Using Zustand
    const { slides, addSlide, removeSlide, toggleSlideActive } = useSystemStore();
    
    const [activeTab, setActiveTab] = useState<'general' | 'slides'>('general');
    
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sms: false
    });
    const [language, setLanguage] = useState('vi');

    // Slide Form State
    const [newSlide, setNewSlide] = useState<Partial<SlideItem>>({
        type: 'image',
        url: '',
        title: '',
        desc: '',
        active: true
    });

    // Determine current font scale level based on listPrimary
    const getCurrentFontLevel = () => {
        if (fontSettings.listPrimary === 'text-sm') return 'small';
        if (fontSettings.listPrimary === 'text-lg') return 'large';
        return 'medium'; // Default (text-base)
    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const level = e.target.value;
        if (level === 'small') {
            updateFontSettings({ 
                listPrimary: 'text-sm', 
                listSecondary: 'text-xs', 
                controls: 'text-xs' 
            });
        } else if (level === 'large') {
            updateFontSettings({ 
                listPrimary: 'text-lg', 
                listSecondary: 'text-base', 
                controls: 'text-base' 
            });
        } else {
            // Medium (Default)
            updateFontSettings({ 
                listPrimary: 'text-base', 
                listSecondary: 'text-sm', 
                controls: 'text-sm' 
            });
        }
    };

    if (!isOpen) return null;

    const handleSave = () => {
        // In a real app, you might save to backend here
        // For now, Context updates are immediate, so we just close
        onClose();
    };

    const handleAddSlide = () => {
        if (!newSlide.url || !newSlide.title) {
            alert("Vui lòng nhập URL và Tiêu đề");
            return;
        }
        addSlide(newSlide as Omit<SlideItem, 'id'>);
        setNewSlide({ type: 'image', url: '', title: '', desc: '', active: true });
    };

    // Common input style
    const inputClass = "w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-700 dark:border-slate-600 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white";
    const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1";

    return createPortal(
        <div 
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <CogIcon className="w-6 h-6 text-blue-600"/> Cài đặt Hệ thống
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-slate-700' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Chung & Giao diện
                    </button>
                    <button 
                        onClick={() => setActiveTab('slides')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'slides' ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-slate-700' : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        Quản lý Slide & Quảng cáo
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50 dark:bg-slate-900/50">
                    
                    {activeTab === 'general' && (
                        <div className="space-y-8 max-w-2xl mx-auto">
                            {/* Appearance Section */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">Giao diện & Hiển thị</h3>
                                <div className="space-y-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-slate-700 dark:text-slate-200">Chế độ tối (Dark Mode)</div>
                                            <div className="text-xs text-slate-500">Chuyển đổi giữa giao diện sáng và tối.</div>
                                        </div>
                                        <button 
                                            onClick={toggleTheme}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}/>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold text-slate-700 dark:text-slate-200">Kích thước chữ (Toàn hệ thống)</div>
                                            <div className="text-xs text-slate-500">Điều chỉnh đồng bộ cỡ chữ danh sách, bảng biểu và nút bấm.</div>
                                        </div>
                                        <div className="w-40">
                                            <select 
                                                value={getCurrentFontLevel()}
                                                onChange={handleFontSizeChange}
                                                className={inputClass}
                                            >
                                                <option value="small">Nhỏ (Compact)</option>
                                                <option value="medium">Vừa (Tiêu chuẩn)</option>
                                                <option value="large">Lớn (Dễ đọc)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Font Preview Box */}
                                    <div className="mt-4 p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900">
                                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Xem trước hiển thị:</p>
                                        <div className="space-y-2 bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <div className={`flex justify-between items-center ${fontSettings.listPrimary}`}>
                                                <span className="font-bold text-slate-800 dark:text-white">Nguyễn Văn An</span>
                                                <span className="text-blue-600">Đang chờ khám</span>
                                            </div>
                                            <div className={`flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-2 ${fontSettings.listSecondary}`}>
                                                <span className="text-slate-500">Mã HS: 21024061</span>
                                                <button className={`px-3 py-1 bg-blue-600 text-white rounded ${fontSettings.controls}`}>Chi tiết</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Localization */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">Ngôn ngữ & Khu vực</h3>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Ngôn ngữ hệ thống</label>
                                        <div className="relative">
                                            <GlobeIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                                            <select 
                                                value={language} 
                                                onChange={e => setLanguage(e.target.value)}
                                                className={`${inputClass} pl-9`}
                                            >
                                                <option value="vi">Tiếng Việt</option>
                                                <option value="en">English</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Múi giờ</label>
                                        <input type="text" value="(GMT+07:00) Bangkok, Hanoi, Jakarta" disabled className={`${inputClass} bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed`} />
                                    </div>
                                </div>
                            </section>

                            {/* Notifications */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">Thông báo</h3>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition">
                                        <input 
                                            type="checkbox" 
                                            checked={notifications.push} 
                                            onChange={() => setNotifications(p => ({...p, push: !p.push}))}
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700 dark:text-slate-200 text-sm group-hover:text-blue-600 transition-colors">Thông báo đẩy trên trình duyệt</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition">
                                        <input 
                                            type="checkbox" 
                                            checked={notifications.email} 
                                            onChange={() => setNotifications(p => ({...p, email: !p.email}))}
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700 dark:text-slate-200 text-sm group-hover:text-blue-600 transition-colors">Nhận báo cáo ngày qua Email</span>
                                    </label>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'slides' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                                <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full text-blue-600 dark:text-blue-300">
                                    <MegaphoneIcon className="w-6 h-6"/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">Quản lý thông báo trên Header</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Thêm hình ảnh hoặc video để hiển thị trên thanh thông báo chính. Video sẽ tự động phát (tắt tiếng) và lặp lại.</p>
                                </div>
                            </div>

                            {/* Add New Form */}
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase">Thêm Slide mới</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Tiêu đề</label>
                                        <input type="text" className={inputClass} placeholder="Nhập tiêu đề..." value={newSlide.title} onChange={e => setNewSlide({...newSlide, title: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Loại</label>
                                        <select className={inputClass} value={newSlide.type} onChange={e => setNewSlide({...newSlide, type: e.target.value as any})}>
                                            <option value="image">Hình ảnh</option>
                                            <option value="video">Video (MP4/WebM)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Mô tả ngắn</label>
                                        <input type="text" className={inputClass} placeholder="Mô tả..." value={newSlide.desc} onChange={e => setNewSlide({...newSlide, desc: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className={labelClass}>URL (Link ảnh hoặc video)</label>
                                        <input type="text" className={inputClass} placeholder="https://..." value={newSlide.url} onChange={e => setNewSlide({...newSlide, url: e.target.value})} />
                                    </div>
                                    <button onClick={handleAddSlide} className="h-[38px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition">
                                        <PlusIcon className="w-5 h-5"/> Thêm ngay
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200">
                                    Danh sách đang hiển thị ({slides.length})
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {slides.map(slide => (
                                        <div key={slide.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                            <div className="w-24 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0 relative border border-slate-200 dark:border-slate-600">
                                                {slide.type === 'video' ? (
                                                    <>
                                                        <video src={slide.url} className="w-full h-full object-cover opacity-80" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <PlayIcon className="w-6 h-6 text-white drop-shadow-md"/>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <img src={slide.url} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${slide.type === 'video' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{slide.type}</span>
                                                    <h4 className="font-bold text-slate-800 dark:text-white truncate">{slide.title}</h4>
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">{slide.desc}</p>
                                                <a href={slide.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate block mt-1 opacity-70">{slide.url}</a>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => toggleSlideActive(slide.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${slide.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    {slide.active ? 'Đang hiện' : 'Đã ẩn'}
                                                </button>
                                                <button onClick={() => removeSlide(slide.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition">
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {slides.length === 0 && (
                                        <div className="p-8 text-center text-slate-400 italic">Chưa có slide nào. Hãy thêm mới!</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition">
                        Đóng
                    </button>
                    <button onClick={handleSave} className="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg flex items-center gap-2 transition">
                        <SaveIcon className="w-4 h-4"/> Đã xong
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SystemSettingsModal;
