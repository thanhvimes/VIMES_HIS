
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityIcon, PrinterIcon } from '../../../../../../components/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ServiceRequest } from '../LabView';
import { usePdfPreview } from '../../../../../../contexts/PdfPreviewContext';

const DEMO_PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

interface FunctionalExplorationTemplateProps {
    data: ServiceRequest;
}

const InfoBlock = ({ label, value }: { label: string, value?: string }) => (
    <div className="mb-3">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{label}</span>
        <span className="text-base font-medium text-slate-800 dark:text-slate-200">{value || '---'}</span>
    </div>
);

const FunctionalExplorationTemplate: React.FC<FunctionalExplorationTemplateProps> = ({ data }) => {
    const { openPdf } = usePdfPreview();
    const { functionalData, specimen } = data;

    if (!functionalData) return <div className="text-center text-slate-400 p-10 text-lg">Chưa có dữ liệu kết quả chi tiết.</div>;

    const handlePrint = () => {
        openPdf({
            url: DEMO_PDF_URL,
            fileName: `FuncResult_${data.id}.pdf`,
            isSignable: true
        });
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
                <div>
                    <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400 uppercase flex items-center gap-2">
                        <ActivityIcon className="w-6 h-6"/> {data.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
                         ID: {data.id}
                    </p>
                </div>
                <button 
                    onClick={handlePrint}
                    className="p-2 text-slate-500 hover:text-orange-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors shadow-sm border border-transparent hover:border-slate-200"
                    title="In kết quả"
                >
                    <PrinterIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Detailed Info Section */}
            <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Chỉ định */}
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/30">
                        <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-3 uppercase border-b border-orange-200 dark:border-orange-800 pb-1">Thông tin chỉ định</h4>
                        <InfoBlock label="Ngày chỉ định" value={data.orderingDate} />
                        <InfoBlock label="Bác sĩ chỉ định" value={data.orderingDoctor} />
                    </div>
                    
                    {/* Column 2: Kết quả */}
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/30">
                        <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-3 uppercase border-b border-orange-200 dark:border-orange-800 pb-1">Thông tin kết quả</h4>
                        <InfoBlock label="Ngày thực hiện" value={data.resultDate} />
                        <InfoBlock label="Bác sĩ đọc" value={data.readingDoctor} />
                        <InfoBlock label="Bác sĩ duyệt" value={data.approvingDoctor} />
                    </div>

                     {/* Column 3: Thực hiện */}
                     <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/30">
                        <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-3 uppercase border-b border-orange-200 dark:border-orange-800 pb-1">Thông tin thực hiện</h4>
                        <InfoBlock label="Người thực hiện" value={specimen?.collector} />
                        <InfoBlock label="Điều kiện" value={specimen?.condition} />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Charts / Graphs Area */}
                {functionalData.chartData && (
                    <div className="h-72 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={functionalData.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip />
                                <Bar dataKey="value" fill="#f97316" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(functionalData.metrics).map(([key, value]) => (
                        <div key={key} className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-800/50">
                            <div className="text-sm text-orange-600 dark:text-orange-400 uppercase font-bold mb-2">{key}</div>
                            <div className="text-xl font-bold text-slate-800 dark:text-slate-200">{value}</div>
                        </div>
                    ))}
                </div>

                {/* Text Report */}
                <div className="space-y-4">
                     <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2">Mô tả kết quả</h4>
                        <p className="text-slate-700 dark:text-slate-300 text-base whitespace-pre-line leading-relaxed">
                            {functionalData.findings}
                        </p>
                    </div>

                     <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2">Kết luận</h4>
                        <p className="text-slate-900 dark:text-white font-bold text-lg">
                            {functionalData.conclusion}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FunctionalExplorationTemplate;
