
import React, { useState } from 'react';
import { LabResult } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { BeakerIcon, SearchIcon, DocumentTextIcon, PrinterIcon, CheckIcon, ClockIcon } from '../../../components/Icons';

const mockLabResults: LabResult[] = [
  { id: 'LR001', patientName: 'Lê Hoàng Cường', testName: 'Công thức máu', date: '2023-10-26', status: 'Completed', resultUrl: '#' },
  { id: 'LR002', patientName: 'Nguyễn Văn An', testName: 'Xét nghiệm nước tiểu', date: '2023-10-27', status: 'Pending' },
  { id: 'LR003', patientName: 'Trần Thị Bích', testName: 'Đường huyết, HbA1c', date: '2023-10-27', status: 'Completed', resultUrl: '#' },
  { id: 'LR004', patientName: 'Phạm Thị Dung', testName: 'Chức năng gan (AST, ALT)', date: '2023-10-25', status: 'Completed', resultUrl: '#' },
  { id: 'LR005', patientName: 'Hoàng Văn Em', testName: 'Miễn dịch (HBsAg)', date: '2023-10-28', status: 'Pending' },
];

const ResultsListView: React.FC = () => {
  const { fontSettings } = useTheme();
  const [results] = useState<LabResult[]>(mockLabResults);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResults = results.filter(res => 
    res.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    res.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-4">
       <div className="flex justify-between items-center flex-shrink-0">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Danh sách Kết quả Xét nghiệm</h1>
                <p className="text-slate-500 dark:text-slate-400">Quản lý và tra cứu kết quả từ phòng Lab.</p>
            </div>
            <div className="relative w-72">
                <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
                <input 
                    type="text" 
                    placeholder="Tìm bệnh nhân, mã xét nghiệm..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                />
            </div>
       </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className={`w-full text-left ${fontSettings.listPrimary}`}>
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 shadow-sm">
              <tr>
                <th className="p-4">Mã XN</th>
                <th className="p-4">Bệnh nhân</th>
                <th className="p-4">Chỉ định</th>
                <th className="p-4">Thời gian</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredResults.map(res => (
                <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 font-mono text-blue-600 dark:text-blue-400 font-medium">{res.id}</td>
                  <td className="p-4 font-bold text-slate-800 dark:text-white">{res.patientName}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{res.testName}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                      <ClockIcon className="w-4 h-4"/>
                      {new Date(res.date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-4 text-center">
                     {res.status === 'Completed' ? (
                         <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                             <CheckIcon className="w-3 h-3"/> Hoàn thành
                         </span>
                     ) : (
                         <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                             <BeakerIcon className="w-3 h-3"/> Đang thực hiện
                         </span>
                     )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button disabled={res.status !== 'Completed'} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 rounded transition disabled:opacity-50">
                            <DocumentTextIcon className="w-5 h-5"/>
                        </button>
                        <button disabled={res.status !== 'Completed'} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 rounded transition disabled:opacity-50">
                            <PrinterIcon className="w-5 h-5"/>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsListView;
