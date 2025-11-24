import React, { useState } from 'react';
import { MegaphoneIcon, ArrowUpTrayIcon, TrashIcon, PencilIcon } from '../../../components/Icons';

const mockSlidesData = [
    { id: 1, title: "Chương trình bảo trì hệ thống", imageUrl: "https://picsum.photos/seed/healthtech/200/100", description: "Hệ thống sẽ được bảo trì vào lúc 23:00 tối Chủ Nhật." },
    { id: 2, title: "Gói khám sức khỏe tổng quát", imageUrl: "https://picsum.photos/seed/checkup/200/100", description: "Ưu đãi 20% cho gói khám sức khỏe toàn diện. Đăng ký ngay!" },
];

const AdvertisementManagerView: React.FC = () => {
  const [slides, setSlides] = useState(mockSlidesData);

  const handleDeleteSlide = (id: number) => {
      if (window.confirm("Bạn có chắc chắn muốn xóa quảng cáo này?")) {
          setSlides(slides.filter(s => s.id !== id));
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center space-x-3">
            <MegaphoneIcon className="h-8 w-8 text-primary dark:text-dark-primary"/>
            <div>
                 <h1 className="text-2xl font-bold">Quản lý Quảng cáo & Thông báo</h1>
                 <p className="text-slate-500 dark:text-slate-400">Thêm, sửa, xóa các slide hiển thị trên màn hình tổng quan.</p>
            </div>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Danh sách Slides hiện tại</h2>
                <div className="space-y-4">
                    {slides.map(slide => (
                        <div key={slide.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <img src={slide.imageUrl} alt={slide.title} className="w-24 h-14 object-cover rounded-md" />
                                <div>
                                    <p className="font-semibold text-onSurface dark:text-dark-onSurface">{slide.title}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{slide.description}</p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"><PencilIcon className="w-5 h-5"/></button>
                                <button 
                                    onClick={() => handleDeleteSlide(slide.id)}
                                    className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400"
                                >
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    ))}
                    {slides.length === 0 && (
                        <p className="text-slate-500 text-center py-4">Chưa có slide nào.</p>
                    )}
                </div>
            </div>
            <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                 <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Thêm Slide mới</h2>
                 <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Tiêu đề</label>
                        <input type="text" className="w-full p-2 bg-inherit border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Mô tả ngắn</label>
                        <textarea rows={3} className="w-full p-2 bg-inherit border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Ảnh nền</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-slate-400"/>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Kéo thả file hoặc click để tải lên</p>
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={() => alert("Chức năng thêm đang được phát triển")} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        Lưu Slide
                    </button>
                 </form>
            </div>
       </div>

    </div>
  );
};

export default AdvertisementManagerView;