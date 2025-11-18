import React, { useState } from 'react';
import { LabResult } from '../../../types';

const mockLabResults: LabResult[] = [
  { id: 'LR001', patientName: 'Lê Hoàng Cường', testName: 'Công thức máu', date: '2023-10-26', status: 'Completed', resultUrl: '#' },
  { id: 'LR002', patientName: 'Nguyễn Văn An', testName: 'Xét nghiệm nước tiểu', date: '2023-10-27', status: 'Pending' },
  { id: 'LR003', patientName: 'Trần Thị Bích', testName: 'Đường huyết', date: '2023-10-27', status: 'Completed', resultUrl: '#' },
  { id: 'LR004', patientName: 'Phạm Thị Dung', testName: 'Chức năng gan', date: '2023-10-25', status: 'Completed', resultUrl: '#' },
];

const ResultsListView: React.FC = () => {
  const [results] = useState<LabResult[]>(mockLabResults);

  return (
    <div className="space-y-6">
       <p className="text-slate-500 dark:text-slate-400 -mt-2">Quản lý và tra cứu kết quả xét nghiệm của bệnh nhân.</p>
      
      <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b-2 border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-3">Mã XN</th>
                <th className="p-3">Bệnh nhân</th>
                <th className="p-3">Tên xét nghiệm</th>
                <th className="p-3">Ngày</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {results.map(res => (
                <tr key={res.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono text-primary dark:text-dark-primary">{res.id}</td>
                  <td className="p-3 font-medium text-onSurface dark:text-dark-onSurface">{res.patientName}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{res.testName}</td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{res.date}</td>
                  <td className="p-3 text-center">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${res.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                        {res.status === 'Completed' ? 'Hoàn thành' : 'Đang chờ'}
                     </span>
                  </td>
                  <td className="p-3 text-right">
                    <button disabled={res.status !== 'Completed'} className="text-primary dark:text-dark-primary hover:underline disabled:text-slate-400 disabled:no-underline">
                        Xem kết quả
                    </button>
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
