import React, { useState, useEffect } from 'react';
import { Setting } from '../../../services/settingsService';

interface Props {
    settings: Setting[];
    onSave: (updates: Array<{ key: string; value: any }>) => Promise<void>;
    saving: boolean;
}

const NotificationsTab: React.FC<Props> = ({ settings, onSave, saving }) => {
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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">🔔 Cấu hình thông báo</h2>
                <p className="text-slate-600">Quản lý cách thức gửi thông báo cho bệnh nhân</p>
            </div>

            <div className="space-y-4">
                {/* SMS/Email Toggle */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4">Kênh thông báo</h3>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📱</span>
                                <div>
                                    <div className="font-medium">SMS</div>
                                    <div className="text-sm text-slate-500">Gửi thông báo qua tin nhắn</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={values.notification_sms_enabled || false}
                                onChange={(e) => handleChange('notification_sms_enabled', e.target.checked)}
                                className="w-5 h-5 text-teal-600 rounded"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📧</span>
                                <div>
                                    <div className="font-medium">Email</div>
                                    <div className="text-sm text-slate-500">Gửi thông báo qua email</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={values.notification_email_enabled || false}
                                onChange={(e) => handleChange('notification_email_enabled', e.target.checked)}
                                className="w-5 h-5 text-teal-600 rounded"
                            />
                        </label>
                    </div>
                </div>

                {/* Reminder Settings */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4">Nhắc lịch tự động</h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={values.notification_reminder_enabled || false}
                                onChange={(e) => handleChange('notification_reminder_enabled', e.target.checked)}
                                className="w-5 h-5 text-teal-600 rounded"
                            />
                            <span className="font-medium">Bật nhắc lịch tự động</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <label className="text-slate-700">Gửi trước:</label>
                            <input
                                type="number"
                                value={values.notification_reminder_hours || 24}
                                onChange={(e) => handleChange('notification_reminder_hours', parseInt(e.target.value))}
                                className="w-24 px-3 py-2 border border-slate-300 rounded-lg"
                                min="1"
                                disabled={!values.notification_reminder_enabled}
                            />
                            <span className="text-slate-600">giờ</span>
                        </div>
                    </div>
                </div>

                {/* Event Notifications */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4">Gửi thông báo khi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { key: 'notification_send_on_create', label: 'Tạo lịch mới', icon: '➕' },
                            { key: 'notification_send_on_approve', label: 'Duyệt lịch', icon: '✅' },
                            { key: 'notification_send_on_cancel', label: 'Hủy lịch', icon: '❌' },
                            { key: 'notification_send_on_reschedule', label: 'Đổi lịch', icon: '🔄' },
                        ].map(item => (
                            <label key={item.key} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                                <input
                                    type="checkbox"
                                    checked={values[item.key] || false}
                                    onChange={(e) => handleChange(item.key, e.target.checked)}
                                    className="w-5 h-5 text-teal-600 rounded"
                                />
                                <span className="text-xl">{item.icon}</span>
                                <span>{item.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
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

export default NotificationsTab;
