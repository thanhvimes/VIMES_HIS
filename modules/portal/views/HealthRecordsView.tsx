
import React, { useState } from 'react';
import { ChevronRightIcon, PillIcon, BeakerIcon, FileMedicalIcon } from '../icons';

const mockVisits = [
    {
        id: 'V01',
        date: '15/11/2023',
        dept: 'Khoa Nội Tổng Quát',
        doctor: 'BS. Nguyễn Văn A',
        diagnosis: 'Viêm phế quản cấp',
        prescriptions: 3,
        labs: 2,
        images: 1
    },
    {
        id: 'V02',
        date: '20/10/2023',
        dept: 'Tai Mũi Họng',
        doctor: 'BS. Lê Văn C',
        diagnosis: 'Viêm họng hạt',
        prescriptions: 2,
        labs: 0,
        images: 1
    },
    {
        id: 'V03',
        date: '10/05/2023',
        dept: 'Cấp cứu',
        doctor: 'BS. Trực',
        diagnosis: 'Rối loạn tiêu hóa',
        prescriptions: 4,
        labs: 3,
        images: 0
    }
];

const HealthRecordsView: React.FC = () => {
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

    // Desktop: Auto-select first item if none selected
    React.useEffect(() => {
        if (window.innerWidth >= 768 && !selectedVisitId && mockVisits.length > 0) {
            setSelectedVisitId(mockVisits[0].id);
        }
    }, []);

    const selectedVisitData = mockVisits.find(v => v.id === selectedVisitId);

    const DetailPanel = ({ visit }: { visit: typeof mockVisits[0] }) => (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="bg-teal-600 text-white p-6 rounded-2xl shadow-lg mb-6 shrink-0">
                <h3 className="text-2xl font-bold">{visit.diagnosis}</h3>
                <p className="opacity-90 mt-1 text-sm">{visit.date} • {visit.dept}</p>
                <div className="mt-4 pt-4 border-t border-white/20 text-sm">
                    <p><span className="opacity-70">Bác sĩ:</span> {visit.doctor}</p>
                    <p className="mt-1"><span className="opacity-70">Ghi chú:</span> Tái khám sau 5 ngày nếu còn ho.</p>
                </div>
            </div>

            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                        <PillIcon className="w-6 h-6 text-blue-500"/> Đơn thuốc
                    </h4>
                    <ul className="space-y-4 text-sm">
                        <li className="flex justify-between border-b border-slate-100 pb-2">
                            <div>
                                <span className="font-bold block">1. Augmentin 1g</span>
                                <span className="text-slate-500 text-xs">Sáng 1, Chiều 1 (Sau ăn)</span>
                            </div>
                            <span className="font-bold text-slate-700">14 viên</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-100 pb-2">
                            <div>
                                <span className="font-bold block">2. Acetylcystein 200mg</span>
                                <span className="text-slate-500 text-xs">Sáng 1, Tối 1</span>
                            </div>
                            <span className="font-bold text-slate-700">20 gói</span>
                        </li>
                        <li className="flex justify-between">
                            <div>
                                <span className="font-bold block">3. Panadol Extra</span>
                                <span className="text-slate-500 text-xs">Khi đau/sốt</span>
                            </div>
                            <span className="font-bold text-slate-700">10 viên</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                        <BeakerIcon className="w-6 h-6 text-purple-500"/> Kết quả Cận lâm sàng
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button className="text-left p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-colors group">
                            <p className="font-bold text-slate-700 group-hover:text-blue-600">Tổng phân tích tế bào máu</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-slate-500">15/11/2023</span>
                                <span className="text-xs bg-white px-2 py-1 rounded border shadow-sm text-blue-600 font-bold">Xem PDF</span>
                            </div>
                        </button>
                        <button className="text-left p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-colors group">
                            <p className="font-bold text-slate-700 group-hover:text-blue-600">X-Quang Ngực thẳng</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-slate-500">15/11/2023</span>
                                <span className="text-xs bg-white px-2 py-1 rounded border shadow-sm text-blue-600 font-bold">Xem Ảnh</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-0 h-full flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-4 md:hidden">Hồ sơ Sức khỏe</h2>

            <div className="flex flex-col md:flex-row h-full md:gap-6">
                
                {/* Left: List (Always visible on desktop, visible on mobile only if no selection) */}
                <div className={`md:w-1/3 flex-col space-y-4 ${selectedVisitId && window.innerWidth < 768 ? 'hidden' : 'flex'}`}>
                    {mockVisits.map((visit, index) => (
                        <div key={visit.id} className="flex gap-4 relative group" onClick={() => setSelectedVisitId(visit.id)}>
                            <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ring-4 ring-white z-10 transition-colors ${selectedVisitId === visit.id ? 'bg-teal-500 ring-teal-100' : 'bg-slate-300'}`}></div>
                                {index !== mockVisits.length - 1 && <div className="w-0.5 h-full bg-slate-200 -mt-2 absolute top-4 bottom-0 left-1.5"></div>}
                            </div>
                            <div className="flex-1 pb-2 cursor-pointer">
                                <div className={`p-4 rounded-xl shadow-sm border transition-all ${selectedVisitId === visit.id ? 'bg-teal-50 border-teal-200 ring-1 ring-teal-500' : 'bg-white border-slate-100 hover:border-teal-200'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${selectedVisitId === visit.id ? 'bg-white text-teal-600' : 'bg-slate-100 text-slate-600'}`}>{visit.date}</span>
                                        {window.innerWidth < 768 && <ChevronRightIcon className="w-4 h-4 text-slate-400"/>}
                                    </div>
                                    <h4 className="font-bold text-slate-800">{visit.diagnosis}</h4>
                                    <p className="text-sm text-slate-500 mt-1">{visit.dept}</p>
                                    
                                    <div className="flex gap-2 mt-3">
                                        {visit.prescriptions > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Thuốc</span>
                                        )}
                                        {visit.labs > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded">CLS</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right: Details (Visible on desktop, or mobile if selected) */}
                <div className={`md:w-2/3 md:block md:pl-6 md:border-l border-slate-200 ${selectedVisitId ? 'block' : 'hidden'}`}>
                    {selectedVisitId && (
                        <>
                            <button onClick={() => setSelectedVisitId(null)} className="mb-4 text-sm text-slate-500 flex items-center gap-1 hover:text-teal-600 md:hidden">
                                ← Quay lại danh sách
                            </button>
                            {selectedVisitData && <DetailPanel visit={selectedVisitData} />}
                        </>
                    )}
                    {!selectedVisitId && (
                        <div className="hidden md:flex h-full items-center justify-center text-slate-400">
                            <p>Chọn một lần khám để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HealthRecordsView;
