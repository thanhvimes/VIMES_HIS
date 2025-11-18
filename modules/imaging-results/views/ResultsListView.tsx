import React, { useState } from 'react';
import { ImagingResult } from '../../../types';

const mockImagingResults: ImagingResult[] = [
  { id: 'IR001', patientName: 'Lê Hoàng Cường', testName: 'X-quang ngực', date: '2023-10-26', status: 'Completed', imageUrl: 'https://picsum.photos/seed/xray1/400/300' },
  { id: 'IR002', patientName: 'Nguyễn Văn An', testName: 'Siêu âm ổ bụng', date: '2023-10-27', status: 'Pending' },
  { id: 'IR003', patientName: 'Trần Thị Bích', testName: 'CT-scan đầu', date: '2023-10-27', status: 'Completed', imageUrl: 'https://picsum.photos/seed/ctscan/400/300' },
];

const ResultsListView: React.FC = () => {
  const [results] = useState<ImagingResult[]>(mockImagingResults);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <p className="text-slate-500 dark:text-slate-400 -mt-2">Lưu trữ và xem lại kết quả chẩn đoán hình ảnh.</p>
      
      <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b-2 border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-3">Mã KQ</th>
                <th className="p-3">Bệnh nhân</th>
                <th className="p-3">Tên CĐHA</th>
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
                    <button onClick={() => setSelectedImage(res.imageUrl || null)} disabled={res.status !== 'Completed'} className="text-primary dark:text-dark-primary hover:underline disabled:text-slate-400 disabled:no-underline">
                        Xem hình ảnh
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
            <div className="bg-surface dark:bg-dark-surface p-4 rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <img src={selectedImage} alt="Kết quả hình ảnh" className="max-w-screen-lg max-h-screen-lg object-contain"/>
            </div>
        </div>
      )}
    </div>
  );
};

export default ResultsListView;
