
import React, { useState, useEffect } from 'react';
import { MegaphoneIcon, ArrowUpTrayIcon, TrashIcon, PencilIcon, CheckCircleIcon, BanIcon, RefreshIcon, PlayIcon, PlusIcon, XIcon } from '../../../components/Icons';
import { useSystem, SlideItem } from '../../../contexts/SystemContext';

// --- LIVE PREVIEW COMPONENT ---
const SlidePreview = ({ slides }: { slides: SlideItem[] }) => {
    const activeSlides = slides.filter(s => s.active);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (activeSlides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
        }, 3000); // Fast preview 3s
        return () => clearInterval(interval);
    }, [activeSlides.length]);

    if (activeSlides.length === 0) {
        return (
            <div className="h-40 bg-slate-100 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
                Chưa có slide nào được kích hoạt
            </div>
        );
    }

    return (
        <div className="relative w-full h-48 overflow-hidden rounded-xl shadow-md bg-black group">
             {activeSlides.map((item, index) => (
                <div 
                    key={item.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover opacity-80" autoPlay muted loop playsInline />
                    ) : (
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover opacity-80" />
                    )}
                    <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/90 to-transparent text-white">
                         <span className="text-[10px] font-bold bg-blue-600 px-1.5 py-0.5 rounded uppercase mb-1 inline-block">Preview</span>
                        <h4 className="font-bold text-sm truncate">{item.title}</h4>
                        <p className="text-xs opacity-90 truncate">{item.desc}</p>
                    </div>
                </div>
            ))}
            <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white z-20">
                {currentIndex + 1} / {activeSlides.length}
            </div>
        </div>
    );
};

const AdvertisementManagerView: React.FC = () => {
  const { slides, addSlide, updateSlide, removeSlide, toggleSlideActive } = useSystem();
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
      title: string;
      desc: string;
      type: 'image' | 'video';
      url: string;
      active: boolean;
  }>({
      title: '',
      desc: '',
      type: 'image',
      url: '',
      active: true
  });

  // Populate form when editing
  const handleEditClick = (slide: SlideItem) => {
      setIsEditing(true);
      setEditId(slide.id);
      setFormData({
          title: slide.title,
          desc: slide.desc,
          type: slide.type,
          url: slide.url,
          active: slide.active
      });
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setEditId(null);
      setFormData({ title: '', desc: '', type: 'image', url: '', active: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title || !formData.url) {
          alert("Vui lòng nhập Tiêu đề và URL.");
          return;
      }

      if (isEditing && editId) {
          updateSlide(editId, formData);
          alert("Cập nhật thành công!");
      } else {
          addSlide(formData);
          alert("Thêm mới thành công!");
      }
      handleCancelEdit();
  };

  const handleDelete = (id: string) => {
      if (window.confirm("Bạn có chắc chắn muốn xóa slide này?")) {
          removeSlide(id);
          if (id === editId) handleCancelEdit();
      }
  };

  const handleToggleActive = (id: string) => {
      toggleSlideActive(id);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
                <MegaphoneIcon className="h-8 w-8 text-primary dark:text-dark-primary"/>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Quản lý Quảng cáo & Thông báo</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Thiết lập các slide hiển thị trên màn hình chính.</p>
                </div>
            </div>
            <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center">
                    Tổng: {slides.length}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center">
                    Đang chạy: {slides.filter(s => s.active).length}
                </span>
            </div>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* LEFT: LIST */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 flex justify-between items-center">
                    <span>Danh sách Slides</span>
                    <button onClick={() => {}} className="text-slate-400 hover:text-blue-600"><RefreshIcon className="w-4 h-4"/></button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
                    {slides.map(slide => (
                        <div key={slide.id} className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${isEditing && editId === slide.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md'}`}>
                            {/* Thumbnail */}
                            <div className="w-32 h-20 rounded-lg overflow-hidden bg-black flex-shrink-0 relative border border-slate-200 dark:border-slate-600">
                                {slide.type === 'video' ? (
                                    <>
                                        <video src={slide.url} className="w-full h-full object-cover opacity-80" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <PlayIcon className="w-8 h-8 text-white drop-shadow-md"/>
                                        </div>
                                    </>
                                ) : (
                                    <img src={slide.url} alt={slide.title} className="w-full h-full object-cover" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white text-base truncate">{slide.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{slide.desc}</p>
                                    </div>
                                    {/* Active Toggle */}
                                    <button 
                                        onClick={() => handleToggleActive(slide.id)}
                                        className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${slide.active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                        title={slide.active ? "Đang hiển thị (Click để tắt)" : "Đang ẩn (Click để bật)"}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${slide.active ? 'translate-x-6' : 'translate-x-1'}`}/>
                                    </button>
                                </div>
                                
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${slide.type === 'video' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                            {slide.type}
                                        </span>
                                        {slide.active ? (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 font-bold flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Active</span>
                                        ) : (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 font-bold flex items-center gap-1"><BanIcon className="w-3 h-3"/> Inactive</span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleEditClick(slide)} 
                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition"
                                            title="Chỉnh sửa"
                                        >
                                            <PencilIcon className="w-4 h-4"/>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(slide.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded transition"
                                            title="Xóa"
                                        >
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {slides.length === 0 && (
                        <div className="text-center py-10 text-slate-400 italic">
                            Chưa có slide nào. Hãy thêm mới ở khung bên phải.
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: FORM & PREVIEW */}
            <div className="flex flex-col gap-6">
                {/* Live Preview */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm uppercase">Xem trước (Live Preview)</h3>
                    <SlidePreview slides={slides} />
                    <p className="text-xs text-slate-400 mt-2 italic text-center">
                        Hiển thị thực tế trên Header (Thời gian chuyển: 6s)
                    </p>
                </div>

                {/* Editor Form */}
                <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border transition-all ${isEditing ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
                     <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-lg font-bold ${isEditing ? 'text-blue-600' : 'text-slate-700 dark:text-slate-200'}`}>
                            {isEditing ? 'Cập nhật Slide' : 'Thêm Slide Mới'}
                        </h2>
                        {isEditing && (
                            <button onClick={handleCancelEdit} className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">
                                <XIcon className="w-3 h-3"/> Hủy sửa
                            </button>
                        )}
                     </div>
                     
                     <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                placeholder="VD: Thông báo bảo trì..."
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Mô tả ngắn</label>
                            <textarea 
                                rows={3} 
                                value={formData.desc}
                                onChange={e => setFormData({...formData, desc: e.target.value})}
                                className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                                placeholder="Nội dung chi tiết..."
                            ></textarea>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Loại Media</label>
                                <select 
                                    value={formData.type}
                                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                >
                                    <option value="image">Hình ảnh</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 w-full border border-transparent hover:border-slate-200">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.active}
                                        onChange={e => setFormData({...formData, active: e.target.checked})}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Kích hoạt ngay</span>
                                </label>
                            </div>
                        </div>

                         <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">URL (Link ảnh/video) <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={formData.url}
                                    onChange={e => setFormData({...formData, url: e.target.value})}
                                    className="flex-1 p-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="https://..."
                                />
                                <button type="button" className="p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-200 text-slate-600 dark:text-slate-300">
                                    <ArrowUpTrayIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                        
                        <div className="pt-2">
                            <button type="submit" className={`w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform active:scale-95 flex items-center justify-center gap-2 ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {isEditing ? <><CheckCircleIcon className="w-5 h-5"/> Cập nhật Thay đổi</> : <><PlusIcon className="w-5 h-5"/> Thêm Slide Mới</>}
                            </button>
                        </div>
                     </form>
                </div>
            </div>
       </div>
    </div>
  );
};

export default AdvertisementManagerView;
