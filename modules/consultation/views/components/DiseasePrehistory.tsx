
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { consultationService } from '../../../../services/consultationService';
import { useNotification } from '../../../../contexts/NotificationContext';
import { ClipboardListIcon, ExclamationCircleIcon, ActivityIcon } from '../../../../components/Icons';

interface DiseasePrehistoryProps {
    patientId: string;
}

const DiseasePrehistory: React.FC<DiseasePrehistoryProps> = ({ patientId }) => {
    const { fontSettings } = useTheme();
    const { addNotification } = useNotification();
    const [history, setHistory] = useState({
        owner: '',
        family: '',
        drugallergy: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const res = await consultationService.getDiseasePrehistory(patientId);
                if (res.success && res.data) {
                    setHistory(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch prehistory:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (patientId) fetchHistory();
    }, [patientId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await consultationService.saveDiseasePrehistory(patientId, history);
            if (res.success) {
                addNotification("Thành công", "Đã cập nhật tiền sử bệnh.", "success", undefined, true);
            } else {
                addNotification("Lỗi", "Không thể lưu tiền sử bệnh.", "error");
            }
        } catch (error) {
            addNotification("Lỗi", "Lỗi kết nối máy chủ.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <div className="flex items-center justify-between border-b dark:border-slate-600 pb-3 mb-4">
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <ClipboardListIcon className="w-6 h-6 text-primary" />
                    Tiền sử bệnh & Dị ứng
                </h3>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-1.5 px-4 rounded-lg shadow transition-all disabled:opacity-50 text-sm"
                >
                    {isSaving ? 'Đang lưu...' : 'Cập nhật tiền sử'}
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tiền sử bản thân */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 text-sm">
                            <ActivityIcon className="w-4 h-4 text-blue-500" />
                            Tiền sử bản thân
                        </label>
                        <textarea
                            value={history.owner}
                            onChange={(e) => setHistory({ ...history, owner: e.target.value })}
                            className={`w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 ${fontSettings.controls}`}
                            rows={4}
                            placeholder="Nhập bệnh lý mạn tính, phẫu thuật cũ..."
                        />
                    </div>

                    {/* Tiền sử gia đình */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 text-sm">
                            <ActivityIcon className="w-4 h-4 text-emerald-500" />
                            Tiền sử gia đình
                        </label>
                        <textarea
                            value={history.family}
                            onChange={(e) => setHistory({ ...history, family: e.target.value })}
                            className={`w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 ${fontSettings.controls}`}
                            rows={4}
                            placeholder="Các bệnh di truyền, tim mạch, tiểu đường..."
                        />
                    </div>

                    {/* Dị ứng thuốc */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 font-bold text-red-600 dark:text-red-400 text-sm">
                            <ExclamationCircleIcon className="w-4 h-4" />
                            Dị ứng thuốc & Khác
                        </label>
                        <textarea
                            value={history.drugallergy}
                            onChange={(e) => setHistory({ ...history, drugallergy: e.target.value })}
                            className={`w-full p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10 focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-400 ${fontSettings.controls}`}
                            rows={4}
                            placeholder="Dị ứng kháng sinh, thực phẩm, hóa chất..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiseasePrehistory;
