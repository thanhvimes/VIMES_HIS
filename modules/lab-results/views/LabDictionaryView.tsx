
import React from 'react';
import { CogIcon } from '../../../components/Icons';

const mockCatalog = [
    { code: 'XN001', name: 'Tổng phân tích tế bào máu', machine: 'Sysmex XN-1000', unit: '-', price: '110,000' },
    { code: 'XN002', name: 'Glucose máu', machine: 'Cobas 6000', unit: 'mmol/L', price: '30,000' },
    { code: 'XN003', name: 'HbA1c', machine: 'Cobas 6000', unit: '%', price: '150,000' },
];

const LabDictionaryView: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Danh mục Xét nghiệm</h1>
                <button className="px-4 py-2 bg-blue-600 text-white rounded font-bold shadow hover:bg-blue-700">Thêm mới</button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                        <tr>
                            <th className="p-4">Mã XN</th>
                            <th className="p-4">Tên xét nghiệm</th>
                            <th className="p-4">Máy thực hiện</th>
                            <th className="p-4">Đơn vị</th>
                            <th className="p-4 text-right">Đơn giá</th>
                            <th className="p-4 text-center">Cấu hình</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {mockCatalog.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="p-4 font-mono text-blue-600">{item.code}</td>
                                <td className="p-4 font-medium">{item.name}</td>
                                <td className="p-4">{item.machine}</td>
                                <td className="p-4">{item.unit}</td>
                                <td className="p-4 text-right">{item.price}</td>
                                <td className="p-4 text-center">
                                    <button className="text-slate-500 hover:text-blue-600"><CogIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LabDictionaryView;
