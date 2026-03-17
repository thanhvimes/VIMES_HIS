import React, { useState } from 'react';
import { toast } from 'sonner';
import { portalService } from '../../../services/portalService';
import { DetailedHistoryRecord } from '../../../types/clinical';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon, PillIcon, BeakerIcon, FileMedicalIcon, ActivityIcon, PrinterIcon, ImageIcon } from '../icons';
import PdfPreviewModal from '../../../components/shared/PdfPreviewModal';

const HealthRecordsView: React.FC = () => {
    const navigate = useNavigate();
    const [visits, setVisits] = useState<DetailedHistoryRecord[]>([]);
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fullDetail, setFullDetail] = useState<DetailedHistoryRecord | null>(null);

    // PDF Preview State
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfTitle, setPdfTitle] = useState<string>('');
    const [showPdf, setShowPdf] = useState(false);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await portalService.getHistoryList();
            setVisits(data);
            if (window.innerWidth >= 768 && data.length > 0 && !selectedVisitId) {
                setSelectedVisitId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDetail = async (visitId: string) => {
        try {
            const data = await portalService.getHistoryDetail(visitId);
            setFullDetail(data);
        } catch (error) {
            console.error('Failed to fetch detail:', error);
        }
    };

    React.useEffect(() => {
        fetchHistory();
    }, []);

    React.useEffect(() => {
        if (selectedVisitId) {
            fetchDetail(selectedVisitId);
        } else {
            setFullDetail(null);
        }
    }, [selectedVisitId]);

    const handleReRegistration = (visit: DetailedHistoryRecord) => {
        navigate('/portal/booking', {
            state: {
                reRegister: true,
                dept: visit.dept,
                diagnosis: visit.diagnosis
            }
        });
    };

    const handleViewPrescription = async (visitId: string, doctorName: string, items: any[]) => {
        try {
            // Find orderId from first item (assuming grouped by order implicitly or per doctor)
            // The query groups by hpo_orderid, so items for a doctor might have multiple orderIds if multiple orders?
            // The previous logic grouped by doctor. One doctor might have multiple orders.
            // But let's take the first orderId found.
            const orderId = items[0]?.orderid;

            if (!orderId) {
                toast.warning('Không tìm thấy mã đơn thuốc (Order ID).');
                return;
            }

            // Try to get signed file first
            try {
                // Service Code? We don't have it explicitly yet. Try empty or look for prod code?
                // User example: 'B22000123'. 
                // Let's rely on what we have. If serviceCode is needed, we might need to add it to query.
                // For now, pass empty string as per backend default or derived.
                const type = items[0]?.ordertype || 'P'; // Dynamic type as requested
                const filename = await portalService.getSignedFilename(type, visitId, orderId, '');

                const url = await portalService.downloadHisDocument(filename);
                setPdfUrl(url);
                setPdfTitle(`Đơn thuốc - BS ${doctorName}`);
                setShowPdf(true);
                return;
            } catch (signError) {
                console.warn('Failed to get signed file:', signError);
                toast.warning('Không có dữ liệu đơn thuốc.');
            }
        } catch (error) {
            console.error('Failed to view prescription:', error);
            toast.error('Lỗi hệ thống khi xem đơn thuốc.');
        }
    };

    const handleViewResult = async (visitId: string, item: any) => {
        try {
            const orderId = item.id || item.orderid;
            const type = item.ordertype === 'T' ? 'T' : 'T'; // For now assume 'T' for both or check if Imaging needs other code. User said "phần in kết quả xét nghiệp, cđha".
            // If Imaging uses different code, we might need to change this.
            // Based on user prompt: 'P' or 'T'. Let's use 'T' for Lab.
            // For Imaging, if it is 'C' or 'X', does emr_get_sign_id support it?
            // The signature is `emr_get_sign_id(type, ...)`. Use item.ordertype directly?
            // User example: 'P'.
            // Let's pass item.ordertype directly if it matches 'T'. If it's 'X'/'C', maybe pass that?
            // Let's try passing 'item.ordertype' as the type.

            // Wait, SQL function likely expects specific chars. 'P' and 'T'.
            // Let's assume 'T' covers both results or pass the specific type.
            // Safest: Use item.ordertype.

            try {
                // Pass item.itemid as the serviceCode/itemId parameter
                const filename = await portalService.getSignedFilename(item.ordertype, visitId, orderId, item.itemid || item.servicecode || '');
                const url = await portalService.downloadHisDocument(filename);
                setPdfUrl(url);
                setPdfTitle(`Kết quả - ${item.gname}`);
                setShowPdf(true);
            } catch (error) {
                console.warn('Failed to get signed result file:', error);
                toast.warning('Không có dữ liệu kết quả.');
            }
        } catch (error) {
            console.error('Failed to get result PDF:', error);
            toast.error('Lỗi hệ thống khi xem kết quả.');
        }
    };

    const handleViewImage = async (orderId: string) => {
        try {
            const url = await portalService.getImageUrl(orderId);
            // Open image in new tab for now, or could use a lightbox
            window.open(url, '_blank');
        } catch (error) {
            console.error('Failed to get image URL:', error);
            alert('Không thể tải hình ảnh. Vui lòng thử lại sau.');
        }
    };

    // Helper to group prescriptions by doctor
    const groupPrescriptionsByDoctor = (prescriptions: any[], defaultDoctor: string = 'Bác sĩ') => {
        console.log('💊 Prescription Data:', prescriptions); // Debug data
        const groups: { [key: string]: any[] } = {};
        prescriptions.forEach(p => {
            const doc = p.doctor || defaultDoctor;
            if (!groups[doc]) groups[doc] = [];
            groups[doc].push(p);
        });
        return groups;
    };

    const DetailPanel = ({ visit }: { visit: DetailedHistoryRecord }) => {
        const prescriptionGroups = visit.prescriptions ? groupPrescriptionsByDoctor(visit.prescriptions, visit.doctor) : {};

        return (
            <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0">
                {/* Desktop Fixed Header */}
                <div className="hidden md:block bg-teal-600 text-white p-6 rounded-2xl shadow-lg mb-6 shrink-0 relative">
                    <h3 className="text-2xl font-bold mb-3 leading-snug">{visit.diagnosis}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-sm opacity-95 mb-5">
                        <div className="w-1 h-5 bg-white rounded-full"></div>
                        <span className="font-medium">Số hồ sơ: {visit.id}</span>
                        <span className="opacity-50 text-lg font-light">|</span>
                        <span>{visit.date} • {visit.dept}</span>
                    </div>

                    <div className="pt-4 border-t border-white/20 text-sm flex flex-row justify-between items-end gap-4">
                        <div className="space-y-1.5 flex-1">
                            <p><span className="opacity-70">Bác sĩ:</span> <span className="font-semibold text-base ml-1">{visit.doctor}</span></p>
                            <p><span className="opacity-70">Triệu chứng:</span> <span className="ml-1">{visit.symptoms || 'Không ghi nhận'}</span></p>
                        </div>

                        <button
                            onClick={() => handleReRegistration(visit)}
                            className="px-5 py-2.5 bg-white text-teal-700 rounded-lg text-sm font-bold shadow-lg hover:bg-teal-50 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                        >
                            Đăng ký khám lại
                        </button>
                    </div>
                </div>

                <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-10">
                    {/* Mobile Scrollable Header (Optimized Compact) */}
                    <div className="md:hidden bg-teal-600 text-white p-4 rounded-xl shadow-md mb-4 relative">
                        <div className="flex justify-between items-start gap-2 mb-2">
                            <h3 className="text-lg font-bold leading-tight line-clamp-2">{visit.diagnosis}</h3>
                            <button
                                onClick={() => handleReRegistration(visit)}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded text-xs font-bold whitespace-nowrap shrink-0"
                            >
                                Đăng ký lại
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs opacity-90 mb-3">
                            <span className="bg-white/10 px-2 py-0.5 rounded">HS: {visit.id}</span>
                            <span>{visit.date}</span>
                        </div>

                        <div className="pt-3 border-t border-white/20 text-xs space-y-1">
                            <p><span className="opacity-70">BS:</span> <span className="font-semibold ml-1">{visit.doctor}</span></p>
                            <p className="truncate"><span className="opacity-70">Triệu chứng:</span> <span className="ml-1">{visit.symptoms || '---'}</span></p>
                        </div>
                    </div>

                    {/* Vitals */}
                    {visit.vitals && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                                <ActivityIcon className="w-6 h-6 text-red-500" /> Chỉ số sinh tồn
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div className="p-3 bg-slate-50 rounded">
                                    <span className="text-slate-500 block text-xs">Huyết áp</span>
                                    <span className="font-bold text-lg">{visit.vitals.bp || '--/--'}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded">
                                    <span className="text-slate-500 block text-xs">Mạch</span>
                                    <span className="font-bold text-lg">{visit.vitals.hr || '--'}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded">
                                    <span className="text-slate-500 block text-xs">Nhiệt độ</span>
                                    <span className="font-bold text-lg">{visit.vitals.temp || '--'} °C</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded">
                                    <span className="text-slate-500 block text-xs">Cân nặng</span>
                                    <span className="font-bold text-lg">{visit.vitals.weight || '--'} kg</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prescriptions Grouped by Doctor */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                            <PillIcon className="w-6 h-6 text-blue-500" /> Đơn thuốc
                        </h4>

                        {Object.keys(prescriptionGroups).length > 0 ? (
                            <div className="space-y-6">
                                {Object.entries(prescriptionGroups).map(([doc, items], groupIdx) => (
                                    <div key={groupIdx} className="border border-teal-100 rounded-xl overflow-hidden shadow-sm">
                                        <div className="bg-teal-50/50 px-4 py-3 flex justify-between items-center border-b border-teal-100">
                                            <div className="text-sm">
                                                <span className="font-bold text-slate-700">Bác sĩ: </span>
                                                <span className="text-slate-800">{doc}</span>
                                                <span className="text-slate-400 mx-2 text-xs">|</span>
                                                <span className="text-slate-500 text-xs">{visit.date}</span>
                                            </div>
                                            <button
                                                onClick={() => handleViewPrescription(visit.id, doc, items)}
                                                className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-all"
                                            >
                                                <PrinterIcon className="w-4 h-4" /> Xem đơn
                                            </button>
                                        </div>

                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-teal-50/30 text-teal-900 border-b border-teal-100">
                                                <tr>
                                                    <th className="px-4 py-2 w-12 text-center text-xs font-bold uppercase tracking-wider">STT</th>
                                                    <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider">Tên thuốc</th>
                                                    <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider">Cách dùng</th>
                                                    <th className="px-4 py-2 w-24 text-center text-xs font-bold uppercase tracking-wider">Số lượng</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {items.map((p, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-slate-800">{p.pharma || p.name}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm text-slate-600">{p.usage || '---'}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-slate-600">
                                                            {Number(p.quantity).toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">{p.unit}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        ) : visit.prescriptionSummary ? (
                            <p className="text-sm text-slate-700 leading-relaxed">{visit.prescriptionSummary}</p>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Không có đơn thuốc trong lượt khám này.</p>
                        )}
                    </div>

                    {/* Paraclinical */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                            <BeakerIcon className="w-6 h-6 text-purple-500" /> Cận lâm sàng (XN & CĐHA)
                        </h4>
                        {visit.paraclinical && visit.paraclinical.length > 0 ? (
                            <div className="space-y-3">
                                {visit.paraclinical.map((item, idx) => (
                                    <div key={idx} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors bg-white shadow-sm relative overflow-hidden">
                                        {/* Status Bar */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.performdate ? 'bg-teal-500' : 'bg-orange-400'}`}></div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.ordertype === 'T' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {item.ordertype === 'T' ? 'Xét nghiệm' : 'HÌNH ẢNH'}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{item.orderdate}</span>

                                                    {/* Status Badge */}
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.performdate ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                                        {item.performdate ? 'ĐÃ CÓ KẾT QUẢ' : 'CHỜ THỰC HIỆN'}
                                                    </span>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    {/* STT Box - Only show if waiting or recently done */}
                                                    <div className="flex flex-col items-center justify-center border-2 border-slate-200 rounded-lg w-12 h-12 shrink-0 bg-slate-50">
                                                        <span className="text-[10px] font-bold text-slate-400 leading-none uppercase">STT</span>
                                                        <span className="text-xl font-black text-slate-700 leading-none mt-1">{item.stt || (idx + 1)}</span>
                                                    </div>

                                                    <div>
                                                        <h5 className="font-bold text-slate-800 text-base">{item.gname}</h5>
                                                        <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                                                            <p>BS chỉ định: {item.doctor}</p>
                                                            {item.performdate ? (
                                                                <p className="text-teal-600 font-bold">Thực hiện: {item.performdate} • {item.practitioner}</p>
                                                            ) : (
                                                                <p className="text-orange-500 font-bold flex items-center gap-1">
                                                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                                    Dự kiến: {item.estimatedTime || '30 phút'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-start sm:self-center ml-14 sm:ml-0">


                                                {/* Image viewing button for Imaging types */}
                                                {item.ordertype !== 'T' && (
                                                    <button
                                                        onClick={() => handleViewImage(item.id || item.orderid)}
                                                        className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-1"
                                                    >
                                                        <ImageIcon className="w-4 h-4" /> Xem ảnh
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleViewResult(visit.id, item)}
                                                    className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors flex items-center gap-1"
                                                >
                                                    <FileMedicalIcon className="w-4 h-4" /> Kết quả
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Không có chỉ định cận lâm sàng trong lượt khám này.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Signature State for PDF
    const [signatures, setSignatures] = useState<any[]>([]);

    const handleSign = (dataUrl: string, placement: any) => {
        const newSig = {
            id: Date.now().toString(),
            signerName: 'Nguyễn Văn A', // Mock User
            signerTitle: 'Bệnh nhân',
            signedAt: new Date(),
            dataUrl,
            placement
        };
        setSignatures([...signatures, newSig]);
        toast.success('Đã ký thành công!');
    };

    const handleDeleteSignature = (index: number) => {
        const newSigs = [...signatures];
        newSigs.splice(index, 1);
        setSignatures(newSigs);
    };

    return (
        <div className="p-4 md:p-0 h-full flex flex-col relative">
            {/* ... existing header ... */}
            <h2 className="text-xl font-bold text-slate-800 mb-4 md:hidden">Hồ sơ Sức khỏe</h2>

            {/* ... existing two-pane layout ... */}
            <div className="flex flex-col md:flex-row h-full md:gap-6">
                {/* Left: List */}
                <div className={`md:w-1/3 flex-col space-y-4 flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-0 ${selectedVisitId && window.innerWidth < 768 ? 'hidden' : 'flex'}`}>
                    {isLoading ? (
                        <div className="p-10 text-center text-slate-400">Đang tải hồ sơ...</div>
                    ) : visits.length === 0 ? (
                        <div className="p-10 text-center text-slate-400">Chưa có lịch sử khám bệnh.</div>
                    ) : visits.map((visit, index) => (
                        <div key={visit.id} className="flex gap-4 relative group shrink-0" onClick={() => setSelectedVisitId(visit.id)}>
                            <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ring-4 ring-white z-10 transition-colors ${selectedVisitId === visit.id ? 'bg-teal-500 ring-teal-100' : 'bg-slate-300'}`}></div>
                                {index !== visits.length - 1 && <div className="w-0.5 h-full bg-slate-200 -mt-2 absolute top-4 bottom-0 left-1.5"></div>}
                            </div>
                            <div className="flex-1 pb-2 cursor-pointer">
                                <div className={`p-4 rounded-xl shadow-sm border transition-all ${selectedVisitId === visit.id ? 'bg-teal-50 border-teal-200 ring-1 ring-teal-500' : 'bg-white border-slate-100 hover:border-teal-200'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${selectedVisitId === visit.id ? 'bg-white text-teal-600' : 'bg-slate-100 text-slate-600'}`}>{visit.date}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${selectedVisitId === visit.id ? 'bg-white text-teal-600' : 'bg-slate-100 text-slate-600'}`}>
                                            Số hồ sơ: {visit.id}
                                        </span>
                                        {window.innerWidth < 768 && <ChevronRightIcon className="w-4 h-4 text-slate-400" />}
                                    </div>
                                    <h4 className="font-bold text-slate-800">{visit.diagnosis}</h4>
                                    <p className="text-sm text-slate-500 mt-1">{visit.dept}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right: Details */}
                <div className={`md:w-2/3 h-full md:block md:pl-6 md:border-l border-slate-200 ${selectedVisitId ? 'block' : 'hidden'}`}>
                    {selectedVisitId && (
                        <>
                            <button onClick={() => setSelectedVisitId(null)} className="mb-4 text-sm text-slate-500 flex items-center gap-1 hover:text-teal-600 md:hidden">
                                ← Quay lại danh sách
                            </button>
                            {fullDetail ? (
                                <DetailPanel visit={fullDetail} />
                            ) : (
                                <div className="p-10 text-center text-slate-400">Đang tải chi tiết...</div>
                            )}
                        </>
                    )}
                    {!selectedVisitId && (
                        <div className="hidden md:flex h-full items-center justify-center text-slate-400">
                            <div className="text-center">
                                <FileMedicalIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                <p>Chọn một lần khám để xem chi tiết</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* PDF Preview Modal */}
            <PdfPreviewModal
                isOpen={showPdf}
                onClose={() => { setShowPdf(false); setSignatures([]); }} // Reset signatures on close for demo logic
                pdfUrl={pdfUrl}
                fileName={pdfTitle}
                isSignable={true}
                signatures={signatures}
                onSign={handleSign}
                onDeleteSignature={handleDeleteSignature}
                onSubmit={() => toast.success('Đã gửi trình ký thành công!')}
            />
        </div>
    );
};

export default HealthRecordsView;
