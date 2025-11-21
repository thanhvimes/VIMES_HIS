
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockRequests } from '../data';
import { 
    ChevronLeftIcon, 
    PrinterIcon, 
    PhotographIcon, 
    UserGroupIcon, 
    CalendarIcon, 
    DocumentTextIcon,
    CheckBadgeIcon
} from '../../../components/Icons';

const ResultDetailView: React.FC = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();
    const request = mockRequests.find(r => r.id === requestId);

    if (!request) {
        return <div className="p-8 text-center text-slate-500">Không tìm thấy kết quả.</div>;
    }

    return (
        <div className="flex flex-col h-full space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                        title="Quay lại"
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300"/>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Chi tiết Kết quả CĐHA</h1>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{request.id}</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${request.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                {request.status === 'Approved' ? 'Đã duyệt' : request.status}
                            </span>
                        </div>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-bold transition">
                    <PrinterIcon className="w-5 h-5"/> In kết quả
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Info */}
                <div className="space-y-6">
                    {/* Patient Info */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                            <UserGroupIcon className="w-5 h-5 text-blue-500"/> Thông tin Bệnh nhân
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="block text-slate-500 text-xs uppercase font-bold">Họ tên</span>
                                <span className="font-bold text-base text-slate-800 dark:text-slate-200">{request.patientName}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-slate-500 text-xs uppercase font-bold">Mã BN</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">{request.patientId}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 text-xs uppercase font-bold">Tuổi / Giới</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{request.age} / {request.gender}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Study Info */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                            <CalendarIcon className="w-5 h-5 text-orange-500"/> Thông tin Chỉ định
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="block text-slate-500 text-xs uppercase font-bold">Dịch vụ</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{request.serviceName}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-slate-500 text-xs uppercase font-bold">Thiết bị</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{request.modality}</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 text-xs uppercase font-bold">Phòng chụp</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{request.room}</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-slate-500 text-xs uppercase font-bold">Ngày chỉ định</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{request.requestDate}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500 text-xs uppercase font-bold">Bác sĩ đọc</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{request.radiologist || 'Chưa phân công'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Report & Images */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Images */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <PhotographIcon className="w-5 h-5 text-purple-500"/> Hình ảnh khảo sát
                        </h3>
                        {request.imageUrl ? (
                            <div className="relative group rounded-lg overflow-hidden bg-black border border-slate-700 flex justify-center h-80 w-full">
                                <img 
                                    src={request.imageUrl} 
                                    alt="Study" 
                                    className="h-full w-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button className="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-full shadow-lg hover:scale-105 transition transform flex items-center gap-2">
                                        <PhotographIcon className="w-5 h-5"/> Mở trình xem DICOM
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-10 bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                                <PhotographIcon className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                                Chưa có hình ảnh được tải lên.
                            </div>
                        )}
                    </div>

                    {/* Report Content */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full min-h-[300px]">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                            <DocumentTextIcon className="w-5 h-5 text-green-500"/> Kết quả Chẩn đoán
                        </h3>
                        
                        {request.report ? (
                            <div className="prose dark:prose-invert max-w-none p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700 flex-1">
                                <div className="whitespace-pre-wrap font-serif text-base leading-relaxed text-slate-800 dark:text-slate-200">
                                    {request.report}
                                </div>
                                <div className="mt-8 pt-4 border-t border-dashed border-slate-300 dark:border-slate-600 flex justify-end">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-1">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-8">Bác sĩ chuyên khoa</p>
                                        {request.status === 'Approved' && (
                                            <div className="inline-block border-2 border-green-600 text-green-600 px-3 py-1 rounded-lg text-xs font-bold uppercase opacity-70 rotate-[-5deg]">
                                                Đã ký số
                                            </div>
                                        )}
                                        <p className="text-sm font-bold text-slate-800 dark:text-white mt-2">{request.radiologist}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic p-10 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-lg">
                                <DocumentTextIcon className="w-10 h-10 mb-2 opacity-30"/>
                                Chưa có kết quả báo cáo.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultDetailView;
