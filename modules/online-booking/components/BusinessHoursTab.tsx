import React, { useState, useEffect } from 'react';
import { Setting } from '../../../services/settingsService';

interface Props {
    settings: Setting[];
    onSave: (updates: Array<{ key: string; value: any }>) => Promise<void>;
    saving: boolean;
}

const BusinessHoursTab: React.FC<Props> = ({ settings, onSave, saving }) => {
    const [businessHours, setBusinessHours] = useState<any>(null);

    useEffect(() => {
        const hoursSetting = settings.find(s => s.key === 'business_hours');
        if (hoursSetting) {
            setBusinessHours(hoursSetting.value);
        }
    }, [settings]);

    const handleToggleDay = (day: string) => {
        setBusinessHours((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], enabled: !prev[day].enabled }
        }));
    };

    const handleTimeChange = (day: string, session: 'morning' | 'afternoon', value: string) => {
        setBusinessHours((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], [session]: value }
        }));
    };

    const handleSave = async () => {
        await onSave([{ key: 'business_hours', value: businessHours }]);
    };

    const days = [
        { key: 'monday', label: 'Thứ 2' },
        { key: 'tuesday', label: 'Thứ 3' },
        { key: 'wednesday', label: 'Thứ 4' },
        { key: 'thursday', label: 'Thứ 5' },
        { key: 'friday', label: 'Thứ 6' },
        { key: 'saturday', label: 'Thứ 7' },
        { key: 'sunday', label: 'Chủ nhật' },
    ];

    if (!businessHours) {
        return <div>Đang tải...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">🕐 Giờ làm việc</h2>
                <p className="text-slate-600">Cấu hình lịch làm việc trong tuần</p>
            </div>

            <div className="space-y-3">
                {days.map(day => (
                    <div key={day.key} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-3 w-32">
                                <input
                                    type="checkbox"
                                    checked={businessHours[day.key]?.enabled || false}
                                    onChange={() => handleToggleDay(day.key)}
                                    className="w-5 h-5 text-teal-600 rounded"
                                />
                                <span className="font-semibold">{day.label}</span>
                            </label>

                            {businessHours[day.key]?.enabled && (
                                <div className="flex-1 flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-slate-600">Sáng:</label>
                                        <input
                                            type="text"
                                            value={businessHours[day.key]?.morning || ''}
                                            onChange={(e) => handleTimeChange(day.key, 'morning', e.target.value)}
                                            placeholder="07:30-11:30"
                                            className="w-32 px-3 py-1.5 border border-slate-300 rounded text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-slate-600">Chiều:</label>
                                        <input
                                            type="text"
                                            value={businessHours[day.key]?.afternoon || ''}
                                            onChange={(e) => handleTimeChange(day.key, 'afternoon', e.target.value)}
                                            placeholder="13:30-17:00"
                                            className="w-32 px-3 py-1.5 border border-slate-300 rounded text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    💡 <strong>Định dạng:</strong> HH:MM-HH:MM (ví dụ: 07:30-11:30). Để trống nếu không làm việc buổi đó.
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-semibold rounded-lg"
                >
                    {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                </button>
            </div>
        </div>
    );
};

export default BusinessHoursTab;
