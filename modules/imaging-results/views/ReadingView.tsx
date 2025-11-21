
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockRequests, mockTemplates, ImagingRequest, ReportTemplate } from '../data';
import MockDicomViewer from './components/MockDicomViewer';
import Combobox from '../../../components/shared/Combobox';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
    ChevronLeftIcon, 
    SaveIcon, 
    CheckBadgeIcon, 
    PrinterIcon,
    DocumentTextIcon,
    UserGroupIcon
} from '../../../components/Icons';

const ReadingView: React.FC = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    
    const [request, setRequest] = useState<ImagingRequest | null>(null);
    const [reportContent, setReportContent] = useState('');
    const [conclusion, setConclusion] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        // In real app, fetch from API
        const found = mockRequests.find(r => r.id === requestId);
        if (found) {
            setRequest(found);
            setReportContent(found.report || '');
            // Extract conclusion if possible or separate field
        } else if (mockRequests.length > 0 && !requestId) {
            // Default to first ready request if none selected
            const firstReady = mockRequests.find(r => r.status === 'Acquired') || mockRequests[0];
            navigate(`/imaging-results/reading/${firstReady.id}`);
        }
    }, [requestId, navigate]);

    const handleTemplateChange = (val: string, item?: ReportTemplate) => {
        if (item) {
            setSelectedTemplateId(item.id);
            setReportContent(item.content);
            // Simple logic to extract conclusion from template if structured
            const parts = item.content.split('KẾT LUẬN:');
            if (parts.length > 1) {
                setConclusion(parts[1].trim());
            }
        }
    };

    const handleSave = () => {
        if (request) {
            // Simulate API save
            alert('Đã lưu nháp báo cáo.');
            setRequest({ ...request, status: 'Reported', report: reportContent });
        }
    };

    const handleApprove = () => {
        if (request) {
            if(window.confirm('Xác nhận duyệt kết quả này? Sau khi duyệt sẽ không thể chỉnh sửa.')) {
                setRequest({ ...request, status: 'Approved', report: reportContent });
                // Simulate sending to HIS/Patient App
            }
        }
    };

    const filteredTemplates = request ? mockTemplates.filter(t => t.modality === request.modality) : [];

    if (!request) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

    return (
        <div className="flex flex-col h-screen bg-black text-slate-300 overflow-hidden fixed inset-0 z-50">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 h-14 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/imaging-results/worklist')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            {request.patientName} 
                            <span className="text-xs font-normal bg-blue-900 text-blue-200 px-2 py-0.5 rounded border border-blue-700">{request.gender}, {request.age}T</span>
                        </h1>
                        <p className="text-xs text-slate-400">{request.serviceName} | {request.requestDate}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${request.status === 'Approved' ? 'bg-green-900 text-green-400 border border-green-700' : 'bg-yellow-900 text-yellow-400 border border-yellow-700'}`}>
                        {request.status === 'Approved' ? 'Đã duyệt' : 'Đang đọc'}
                    </span>
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2 rounded transition ${isSidebarOpen ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                        title="Toggle Report Sidebar"
                    >
                        <DocumentTextIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Image Viewer */}
                <div className="flex-1 bg-black relative flex flex-col border-r border-slate-800">
                    {request.imageUrl ? (
                        <MockDicomViewer 
                            imageUrl={request.imageUrl} 
                            patientName={request.patientName}
                            modality={request.modality}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-600">
                            <div className="text-center">
                                <p className="text-2xl font-bold mb-2">Chưa có hình ảnh</p>
                                <p>Bệnh nhân chưa chụp hoặc hình ảnh chưa được đẩy lên PACS.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Report Editor */}
                {isSidebarOpen && (
                    <div className="w-[450px] bg-slate-900 flex flex-col border-l border-slate-700 shrink-0 transition-all duration-300">
                        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Mẫu báo cáo (Template)</label>
                                <Combobox<ReportTemplate>
                                    options={filteredTemplates}
                                    displayValue={item => item.name}
                                    onChange={handleTemplateChange}
                                    placeholder="Chọn mẫu kết quả..."
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Mô tả hình ảnh</label>
                                <textarea 
                                    value={reportContent}
                                    onChange={e => setReportContent(e.target.value)}
                                    className={`w-full h-64 p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y ${fontSettings.controls}`}
                                    placeholder="Nhập mô tả chi tiết..."
                                    readOnly={request.status === 'Approved'}
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Kết luận</label>
                                <textarea 
                                    value={conclusion}
                                    onChange={e => setConclusion(e.target.value)}
                                    className={`w-full h-24 p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-bold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y ${fontSettings.controls}`}
                                    placeholder="Nhập kết luận..."
                                    readOnly={request.status === 'Approved'}
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-between items-center">
                            {request.status === 'Approved' ? (
                                <button className="w-full py-2 bg-slate-700 text-slate-400 rounded font-bold cursor-not-allowed flex items-center justify-center gap-2">
                                    <CheckBadgeIcon className="w-5 h-5"/> Đã ký duyệt
                                </button>
                            ) : (
                                <>
                                    <button onClick={handleSave} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold flex items-center gap-2 transition">
                                        <SaveIcon className="w-4 h-4"/> Lưu nháp
                                    </button>
                                    <button onClick={handleApprove} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition">
                                        <CheckBadgeIcon className="w-4 h-4"/> Duyệt & Ký
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReadingView;
