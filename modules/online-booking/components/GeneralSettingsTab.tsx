import React, { useState, useEffect } from 'react';
import { Setting } from '../../../services/settingsService';

interface Props {
    settings: Setting[];
    onSave: (updates: Array<{ key: string; value: any }>) => Promise<void>;
    saving: boolean;
}

const GeneralSettingsTab: React.FC<Props> = ({ settings, onSave, saving }) => {
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

    const fields = [
        { key: 'general_hospital_name', label: 'Tên bệnh viện', icon: '🏥', type: 'text' },
        { key: 'general_hotline', label: 'Hotline', icon: '📞', type: 'text' },
        { key: 'general_email', label: 'Email hỗ trợ', icon: '📧', type: 'email' },
        { key: 'general_address', label: 'Địa chỉ', icon: '📍', type: 'textarea' },
        { key: 'general_website', label: 'Website', icon: '🌐', type: 'url' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">🏢 Thông tin chung</h2>
                <p className="text-slate-600">Cấu hình thông tin bệnh viện hiển thị trong hệ thống</p>
            </div>

            <div className="space-y-4">
                {fields.map(field => (
                    <div key={field.key} className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                        <label className="block">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{field.icon}</span>
                                <span className="font-semibold text-slate-800">{field.label}</span>
                            </div>
                            {field.type === 'textarea' ? (
                                <textarea
                                    value={values[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    rows={3}
                                />
                            ) : (
                                <input
                                    type={field.type}
                                    value={values[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            )}
                        </label>
                    </div>
                ))}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Lưu ý:</strong> Thông tin này sẽ được sử dụng trong SMS, Email và giao diện đặt lịch.
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

export default GeneralSettingsTab;
