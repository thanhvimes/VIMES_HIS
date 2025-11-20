
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotographIcon, PrinterIcon, DownloadIcon } from '../../../../../../components/Icons';
import { ServiceRequest } from '../LabView';
import { usePdfPreview } from '../../../../../../contexts/PdfPreviewContext';

const DEMO_PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

interface ImagingResultTemplateProps {
    data: ServiceRequest;
}

const InfoBlock = ({ label, value }: { label: string, value?: string }) => (
    <div className="mb-3">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{label}</span>
        <span className="text-base font-medium text-slate-800 dark:text-slate-200">{value || '---'}</span>
    </div>
);

const ImagingResultTemplate: React.FC<ImagingResultTemplateProps> = ({ data }) => {
    const { openPdf } = usePdfPreview();
    const { imagingData, specimen } = data;

    if (!imagingData) return <div className="text-center text-slate-400 p-10 text-lg">Chưa có dữ liệu kết quả chi tiết.</div>;

    const handlePrint = () => {
        openPdf({
            url: DEMO_PDF_URL,
            fileName: `ImagingResult_${data.id}.pdf`,
            isSignable: true
        });
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
                <div>
                    <h3 className="text-xl font-bold text-purple-700 dark:text-purple-400 uppercase flex items-center gap-2">
                        <PhotographIcon className="w-6 h-6"/> {data.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        ID: {data.id}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handlePrint}
                        className="p-2 text-slate-500 hover:text-purple-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors shadow-sm border border-transparent hover:border-slate-200"
                        title="Tải xuống"
                    >
                        <DownloadIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="p-2 text-slate-500 hover:text-purple-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors shadow-sm border border-transparent hover:border-slate-200"
                        title="In kết quả"
                    >
                        <PrinterIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

             {/* Detailed Info Section */}
             <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Chỉ định */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30">
                        <h4 className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-3 uppercase border-b border-purple-200 dark:border-purple-800 pb-1">Thông tin chỉ định</h4>
                        <InfoBlock label="Ngày chỉ định" value={data.orderingDate} />
                        <InfoBlock label="Bác sĩ chỉ định" value={data.orderingDoctor} />
                    </div>
                    
                    {/* Column 2: Kết quả */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30">
                        <h4 className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-3 uppercase border-b border-purple-200 dark:border-purple-800 pb-1">Thông tin kết quả</h4>
                        <InfoBlock label="Ngày thực hiện" value={data.resultDate} />
                        <InfoBlock label="Bác sĩ đọc" value={data.readingDoctor} />
                        <InfoBlock label="Bác sĩ duyệt" value={data.approvingDoctor} />
                    </div>

                     {/* Column 3: Kỹ thuật/Chuẩn bị */}
                     <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30">
                        <h4 className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-3 uppercase border-b border-purple-200 dark:border-purple-800 pb-1">Thông tin thực hiện</h4>
                        <InfoBlock label="Kỹ thuật viên" value={specimen?.collector} />
                        <InfoBlock label="Ghi chú kỹ thuật" value={specimen?.condition} />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Image Section */}
                <div className="flex justify-center bg-black rounded-lg overflow-hidden shadow-inner">
                    <img 
                        src={imagingData.imageUrl} 
                        alt="Result" 
                        className="max-h-[450px] object-contain" 
                        loading="lazy"
                    />
                </div>

                {/* Report Section */}
                <div className="space-y-4">
                    <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2">Kỹ thuật thực hiện</h4>
                        <p className="text-slate-700 dark:text-slate-300 text-base">{imagingData.technique}</p>
                    </div>

                    <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2">Mô tả hình ảnh</h4>
                        <p className="text-slate-700 dark:text-slate-300 text-base whitespace-pre-line leading-relaxed">
                            {imagingData.findings}
                        </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                        <h4 className="text-base font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide mb-2">Kết luận</h4>
                        <p className="text-purple-900 dark:text-purple-100 font-bold text-lg">
                            {imagingData.conclusion}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImagingResultTemplate;
