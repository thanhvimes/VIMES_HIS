
import React, { useState } from 'react';
import { ImagingResult } from '../../../types';
import { PhotographIcon, SearchIcon, XIcon, EyeIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

const mockImagingResults: ImagingResult[] = [
  { id: 'IR001', patientName: 'Lê Hoàng Cường', testName: 'X-quang ngực thẳng', date: '2023-10-26', status: 'Completed', imageUrl: 'https://prod-images-static.radiopaedia.org/images/54766339/9d0de6367f802d672324f4a844e2e211f95d83115f67b6f250d472e532402273_gallery.jpeg' },
  { id: 'IR002', patientName: 'Nguyễn Văn An', testName: 'Siêu âm ổ bụng', date: '2023-10-27', status: 'Pending' },
  { id: 'IR003', patientName: 'Trần Thị Bích', testName: 'CT-scan sọ não', date: '2023-10-27', status: 'Completed', imageUrl: 'https://prod-images-static.radiopaedia.org/images/29533634/689467c9c8e563d796306e34564f96_gallery.jpeg' },
  { id: 'IR004', patientName: 'Phạm Thị Dung', testName: 'MRI Cột sống thắt lưng', date: '2023-10-25', status: 'Completed', imageUrl: 'https://prod-images-static.radiopaedia.org/images/2879732/b230f2b07926765723060337056929_gallery.jpeg' },
];

const ResultsListView: React.FC = () => {
  const { fontSettings } = useTheme();
  const [results] = useState<ImagingResult[]>(mockImagingResults);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredResults = results.filter(res => 
    res.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    res.testName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center flex-shrink-0">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Chẩn đoán Hình ảnh</h1>
                <p className="text-slate-500 dark:text-slate-400">Kho lưu trữ kết quả X-Quang, CT, MRI, Siêu âm.</p>
            </div>
            <div className="relative w-72">
                <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
                <input 
                    type="text" 
                    placeholder="Tìm kiếm..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 ${fontSettings.controls}`}
                />
            </div>
       </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className={`w-full text-left ${fontSettings.listPrimary}`}>
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 shadow-sm">
              <tr>
                <th className="p-4 w-20">Preview</th>
                <th className="p-4">Mã KQ</th>
                <th className="p-4">Bệnh nhân</th>
                <th className="p-4">Chỉ định</th>
                <th className="p-4">Ngày chụp</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredResults.map(res => (
                <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                      {res.imageUrl ? (
                          <div 
                            className="w-12 h-12 bg-black rounded overflow-hidden cursor-pointer relative group"
                            onClick={() => setSelectedImage(res.imageUrl || null)}
                          >
                              <img src={res.imageUrl} className="w-full h-full object-cover" alt="thumb" />
                              <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center">
                                  <EyeIcon className="w-4 h-4 text-white"/>
                              </div>
                          </div>
                      ) : (
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center text-slate-400">
                              <PhotographIcon className="w-6 h-6"/>
                          </div>
                      )}
                  </td>
                  <td className="p-4 font-mono text-purple-600 dark:text-purple-400 font-medium">{res.id}</td>
                  <td className="p-4 font-bold text-slate-800 dark:text-white">{res.patientName}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{res.testName}</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{new Date(res.date).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4 text-center">
                     {res.status === 'Completed' ? (
                         <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                             Hoàn thành
                         </span>
                     ) : (
                         <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                             Chờ kết quả
                         </span>
                     )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                        onClick={() => setSelectedImage(res.imageUrl || null)} 
                        disabled={!res.imageUrl} 
                        className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:underline disabled:text-slate-400 disabled:no-underline text-sm font-semibold"
                    >
                        Xem hình ảnh
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={() => setSelectedImage(null)}>
            <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition">
                <XIcon className="w-8 h-8"/>
            </button>
            <div className="max-w-[90vw] max-h-[90vh] p-2 bg-black rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <img src={selectedImage} alt="Kết quả hình ảnh" className="max-w-full max-h-[85vh] object-contain"/>
            </div>
        </div>
      )}
    </div>
  );
};

export default ResultsListView;
