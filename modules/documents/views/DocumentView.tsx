import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    ArrowDownTrayIcon, 
    PrinterIcon,
    PencilSquareIcon,
    ChevronDoubleLeftIcon
} from '../../../components/Icons';
import RegistrationPrintLayout from './templates/RegistrationPrintLayout';

const DocumentView: React.FC = () => {
    const { documentId, template } = useParams<{ documentId: string; template: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    
    const isPreview = !!template;
    const previewData = location.state;

    const handleSign = () => {
        alert(`(API Call Simulated) Gửi yêu cầu ký số cho tài liệu ${documentId}...`);
    };

    const handleDownload = () => {
        alert(`(API Call Simulated) Bắt đầu tải xuống tài liệu ${documentId}...`);
    };

    const handlePrint = () => {
        window.print();
    };

    const renderContent = () => {
        if (isPreview && template === 'registration' && previewData) {
            return <RegistrationPrintLayout patient={previewData.patient} exam={previewData.exam} />;
        }
        
        if (documentId) {
             return (
                <div className="text-center text-slate-400 dark:text-slate-500">
                    <p className="text-lg font-semibold">Khu vực hiển thị PDF</p>
                    <p className="text-sm">(Nội dung file PDF cho tài liệu <strong>{documentId}</strong> sẽ được hiển thị ở đây)</p>
                </div>
            );
        }
        
        return <div className="text-center text-slate-400 dark:text-slate-500">Tài liệu không hợp lệ.</div>
    };
    
    const getTitle = () => {
        if (isPreview && template === 'registration') {
            return "Xem trước: Phiếu Thông tin Hành chính";
        }
        if (documentId) {
            return `Xem tài liệu: ${documentId}`;
        }
        return "Xem tài liệu";
    };

    return (
        <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg shadow">
            {/* Header / Toolbar */}
            <div className="flex-shrink-0 flex items-center justify-between mb-4 pb-3 border-b border-slate-300 dark:border-slate-600 no-print">
                <div className="flex items-center gap-4">
                     <button onClick={() => navigate(-1)} className="flex items-center text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-dark-primary">
                        <ChevronDoubleLeftIcon className="w-5 h-5 mr-1" />
                        Quay lại
                    </button>
                    <h1 className="text-xl font-bold text-onSurface dark:text-dark-onSurface">{getTitle()}</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handleDownload} className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold rounded-md shadow-sm bg-slate-500 hover:bg-slate-600 text-white" disabled={isPreview}>
                        <ArrowDownTrayIcon className="w-4 h-4"/>
                        <span>Tải xuống</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold rounded-md shadow-sm bg-blue-500 hover:bg-blue-600 text-white">
                        <PrinterIcon className="w-4 h-4"/>
                        <span>In</span>
                    </button>
                    <button onClick={handleSign} className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold rounded-md shadow-sm bg-primary hover:bg-primary-dark text-white" disabled={isPreview}>
                        <PencilSquareIcon className="w-4 h-4"/>
                        <span>Ký số</span>
                    </button>
                </div>
            </div>

            {/* Viewer Area */}
            <div className="flex-grow bg-surface dark:bg-dark-surface rounded shadow-inner flex items-center justify-center overflow-auto printable-area">
                {renderContent()}
            </div>
        </div>
    );
};

export default DocumentView;