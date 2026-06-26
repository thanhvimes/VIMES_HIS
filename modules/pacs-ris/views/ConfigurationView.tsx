import React, { useState } from 'react';
import { CogIcon, SaveIcon } from '../../../components/Icons';

const ConfigurationView: React.FC = () => {
  const [aeTitle, setAeTitle] = useState('VCLINIC_PACS');
  const [port, setPort] = useState('11112');
  const [storagePath, setStoragePath] = useState('d:/AI/vClinic/backend/storage/dicom');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <CogIcon className="w-7 h-7 text-indigo-500" />
          Cấu hình Hệ thống PACS-RIS
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Thiết lập thông số kỹ thuật kết nối DICOM Node và vị trí lưu trữ cục bộ.
        </p>
      </div>

      <div className="bg-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md border border-slate-200/50 dark:border-slate-700 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">PACS AE Title</label>
            <input
              type="text"
              value={aeTitle}
              onChange={(e) => setAeTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Port lắng nghe (DICOM listener)</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Local Storage Path (Đường dẫn lưu tệp DICOM)</label>
            <input
              type="text"
              value={storagePath}
              onChange={(e) => setStoragePath(e.target.value)}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-slate-600 dark:text-slate-300"
              required
            />
            <p className="text-xs text-slate-400 mt-1.5">Hình ảnh DICOM từ các thiết bị chụp chiếu sẽ được lưu trữ cục bộ trực tiếp tại thư mục này.</p>
          </div>

          <div className="pt-2 flex justify-between items-center">
            {isSaved && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm animate-pulse">
                ✓ Đã lưu cấu hình thành công!
              </span>
            )}
            <button
              type="submit"
              className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-colors cursor-pointer"
            >
              <SaveIcon className="w-4 h-4" />
              Lưu Cấu Hình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigurationView;
