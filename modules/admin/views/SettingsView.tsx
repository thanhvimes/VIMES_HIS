
import React from 'react';
import { useTheme, FontSettings } from '../../../contexts/ThemeContext';
import { CogIcon, CheckIcon } from '../../../components/Icons';

const fontOptions = [
    { label: 'Nhỏ (Compact)', value: 'text-xs' },
    { label: 'Bình thường (Standard)', value: 'text-sm' },
    { label: 'Trung bình (Medium)', value: 'text-base' },
    { label: 'Lớn (Large)', value: 'text-lg' },
    { label: 'Rất lớn (Extra)', value: 'text-xl' },
];

const SettingsView: React.FC = () => {
    const { fontSettings, updateFontSettings } = useTheme();

    const handleChange = (key: keyof FontSettings, value: string) => {
        updateFontSettings({ [key]: value });
    };

    const PreviewBox = ({ label, className }: { label: string, className: string }) => (
        <div className={`p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 ${className}`}>
            <p className="font-bold">Tiêu đề mẫu</p>
            <p>Đây là văn bản mẫu để xem trước kích thước chữ hiển thị trên hệ thống.</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                <CogIcon className="h-8 w-8 text-primary dark:text-dark-primary" />
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cấu hình hiển thị</h1>
                    <p className="text-slate-500 dark:text-slate-400">Thiết lập cỡ chữ cho toàn bộ hệ thống.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                
                {/* 1. Worklists Setting */}
                <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Danh sách công việc (Orders/Worklists)</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Áp dụng cho: Danh sách chờ khám, DS Xét nghiệm, DS Thuốc, Lịch hẹn...</p>
                        </div>
                        <div className="w-64">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chọn kích thước</label>
                            <select 
                                value={fontSettings.listPrimary}
                                onChange={(e) => handleChange('listPrimary', e.target.value)}
                                className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"
                            >
                                {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Xem trước</p>
                        <div className="space-y-2">
                            <div className={`flex justify-between p-3 bg-white dark:bg-slate-800 rounded shadow-sm ${fontSettings.listPrimary}`}>
                                <span className="font-bold text-blue-600">Nguyễn Văn A</span>
                                <span>08:30 - Khám tổng quát</span>
                            </div>
                            <div className={`flex justify-between p-3 bg-white dark:bg-slate-800 rounded shadow-sm ${fontSettings.listPrimary}`}>
                                <span className="font-bold text-blue-600">Trần Thị B</span>
                                <span>09:00 - Tái khám</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Details Lists Setting */}
                <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Danh sách chi tiết (Details)</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Áp dụng cho: Bảng chi tiết đơn thuốc, Kết quả xét nghiệm, Bảng viện phí...</p>
                        </div>
                        <div className="w-64">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chọn kích thước</label>
                            <select 
                                value={fontSettings.listSecondary}
                                onChange={(e) => handleChange('listSecondary', e.target.value)}
                                className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"
                            >
                                {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Xem trước (Bảng thuốc)</p>
                        <table className={`w-full text-left ${fontSettings.listSecondary}`}>
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                                <tr><th className="p-2">Tên thuốc</th><th className="p-2 text-right">SL</th><th className="p-2 text-right">Đơn giá</th></tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800">
                                <tr className="border-b dark:border-slate-700"><td className="p-2">Paracetamol 500mg</td><td className="p-2 text-right">10</td><td className="p-2 text-right">500</td></tr>
                                <tr><td className="p-2">Amoxicillin 500mg</td><td className="p-2 text-right">15</td><td className="p-2 text-right">1,200</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Controls Setting */}
                <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Nhập liệu (Controls)</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Áp dụng cho: Ô nhập liệu (Textbox), Combobox, Nút bấm...</p>
                        </div>
                        <div className="w-64">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chọn kích thước</label>
                            <select 
                                value={fontSettings.controls}
                                onChange={(e) => handleChange('controls', e.target.value)}
                                className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"
                            >
                                {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Xem trước</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block font-bold text-slate-700 dark:text-slate-300 mb-1 ${fontSettings.controls}`}>Họ tên</label>
                                <input type="text" value="Nguyễn Văn A" readOnly className={`w-full p-2 border rounded-lg ${fontSettings.controls}`} />
                            </div>
                            <div className="flex items-end">
                                <button className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-bold ${fontSettings.controls}`}>
                                    Lưu lại
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SettingsView;
