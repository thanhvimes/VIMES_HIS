
import React from 'react';
import { ClipboardListIcon } from '../../../../components/Icons';

const ExamineView: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-3">
                 <ClipboardListIcon className="w-8 h-8 text-slate-500 dark:text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Phiếu Khám Bệnh</p>
            <p className="text-sm mt-2">Chức năng ghi nhận khám lâm sàng đang được phát triển tại đây.</p>
        </div>
    );
};

export default ExamineView;
