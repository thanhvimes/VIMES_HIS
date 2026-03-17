import React, { useState, useEffect } from 'react';
import { Setting } from '../../../services/settingsService';

interface Props {
    settings: Setting[];
    onSave: (updates: Array<{ key: string; value: any }>) => Promise<void>;
    saving: boolean;
}

const BookingRulesTab: React.FC<Props> = ({ settings, onSave, saving }) => {
    const [values, setValues] = useState<Record<string, any>>({});

    useEffect(() => {
        const valueMap: Record<string, any> = {};
        settings.forEach(setting => {
            valueMap[setting.key] = setting.value;
        });
        setValues(valueMap);
    }, [settings]);

    const handleChange = (key: string, value: any) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        const updates = Object.entries(values).map(([key, value]) => ({ key, value }));
        await onSave(updates);
    };

    const rules = [
        { key: 'booking_max_per_slot', label: 'Số lượng tối đa mỗi khung giờ', type: 'number', icon: '👥', unit: 'bệnh nhân' },
        { key: 'booking_advance_days_min', label: 'Số ngày tối thiểu đặt trước', type: 'number', icon: '📅', unit: 'ngày' },
        { key: 'booking_advance_days_max', label: 'Số ngày tối đa đặt trước', type: 'number', icon: '📆', unit: 'ngày' },
        { key: 'booking_cancellation_hours', label: 'Thời gian cho phép hủy trước', type: 'number', icon: '⏰', unit: 'giờ' },
        { key: 'booking_auto_approve', label: 'Tự động duyệt lịch', type: 'boolean', icon: '✅' },
        { key: 'booking_require_phone', label: 'Bắt buộc số điện thoại', type: 'boolean', icon: '📱' },
        { key: 'booking_require_email', label: 'Bắt buộc email', type: 'boolean', icon: '📧' },
        { key: 'booking_allow_same_day', label: 'Cho phép đặt trong ngày', type: 'boolean', icon: '🕐' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">📅 Quy tắc đặt lịch</h2>
                <p className="text-slate-600">Cấu hình các giới hạn và quy tắc cho việc đặt lịch khám</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rules.map(rule => (
                    <div key={rule.key} className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                        <div className="flex items-start gap-3">
                            <span className="text-3xl">{rule.icon}</span>
                            <div className="flex-1">
                                <label className="block font-semibold text-slate-800 mb-2">
                                    {rule.label}
                                </label>
                                {rule.type === 'number' ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={values[rule.key] || 0}
                                            onChange={(e) => handleChange(rule.key, parseInt(e.target.value))}
                                            className="w-32 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                            min="0"
                                        />
                                        {rule.unit && <span className="text-slate-600">{rule.unit}</span>}
                                    </div>
                                ) : (
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={values[rule.key] || false}
                                            onChange={(e) => handleChange(rule.key, e.target.checked)}
                                            className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                                        />
                                        <span className="text-slate-700">
                                            {values[rule.key] ? 'Bật' : 'Tắt'}
                                        </span>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
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

export default BookingRulesTab;
