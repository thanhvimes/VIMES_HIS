
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BeakerIcon, PrinterIcon } from '../../../../../../components/Icons';
import { ServiceRequest } from '../LabView';

interface LabResultTemplateProps {
    data: ServiceRequest;
}

const InfoBlock = ({ label, value }: { label: string, value?: string }) => (
    <div className="mb-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{label}</span>
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{value || '---'}</span>
    </div>
);

const LabResultTemplate: React.FC<LabResultTemplateProps> = ({ data }) => {
    const navigate = useNavigate();
    const { labData, specimen } = data;

    if (!labData) return <div className="text-center text-slate-400 p-10">Chưa có dữ liệu kết quả chi tiết.</div>;

    const handlePrint = () => {
        // Navigate to the document viewer with a demo PDF URL for this lab result
        navigate(`/documents/view/lab-result-${data.id}`);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
                <div>
                    <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 uppercase flex items-center gap-2">
                        <BeakerIcon className="w-5 h-5"/> {data.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        ID: {data.id} | Máy XN: {labData.device}
                    </p>
                </div>
                <button 
                    onClick={handlePrint}
                    className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors shadow-sm border border-transparent hover:border-slate-200"
                    title="In kết quả"
                >
                    <PrinterIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Detailed Info Section */}
            <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Chỉ định */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-700/50">
                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">Thông tin chỉ định</h4>
                        <InfoBlock label="Ngày chỉ định" value={data.orderingDate} />
                        <InfoBlock label="Bác sĩ chỉ định" value={data.orderingDoctor} />
                    </div>
                    
                    {/* Column 2: Kết quả */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-700/50">
                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">Thông tin kết quả</h4>
                        <InfoBlock label="Ngày kết quả" value={data.resultDate} />
                        <InfoBlock label="Người đọc" value={data.readingDoctor} />
                        <InfoBlock label="Người duyệt" value={data.approvingDoctor} />
                    </div>

                    {/* Column 3: Bệnh phẩm */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-100 dark:border-slate-700/50">
                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">Thông tin bệnh phẩm</h4>
                        <InfoBlock label="Thời gian lấy" value={specimen?.collectionTime} />
                        <InfoBlock label="Người lấy mẫu" value={specimen?.collector} />
                        <div className="grid grid-cols-2 gap-2">
                            <InfoBlock label="Loại mẫu" value={specimen?.type} />
                            <InfoBlock label="Tình trạng" value={specimen?.condition} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Result Table */}
            <div className="flex-1 overflow-auto p-0">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-semibold uppercase text-xs sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3">Tên chỉ số</th>
                            <th className="px-6 py-3 text-right">Kết quả</th>
                            <th className="px-6 py-3">Đơn vị</th>
                            <th className="px-6 py-3">Trị số bình thường</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {labData.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">
                                    {item.name}
                                </td>
                                <td className={`px-6 py-3 text-right font-bold ${item.isAbnormal ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {item.result}
                                </td>
                                <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                                    {item.unit}
                                </td>
                                <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                                    {item.normalRange}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LabResultTemplate;
