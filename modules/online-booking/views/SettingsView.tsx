import React, { useState, useEffect } from 'react';
import { settingsService, Setting } from '../../../services/settingsService';
import SMSTemplatesTab from '../components/SMSTemplatesTab.tsx';
import BookingRulesTab from '../components/BookingRulesTab.tsx';
import BusinessHoursTab from '../components/BusinessHoursTab.tsx';
import NotificationsTab from '../components/NotificationsTab.tsx';
import GeneralSettingsTab from '../components/GeneralSettingsTab.tsx';

type TabType = 'sms' | 'booking' | 'business_hours' | 'notification' | 'general';

const SettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('sms');
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsService.getAllSettings();
            setSettings(data);
        } catch (error: any) {
            showMessage('error', `Lỗi tải cấu hình: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updates: Array<{ key: string; value: any }>) => {
        try {
            setSaving(true);
            await settingsService.updateMultipleSettings(updates);
            await loadSettings(); // Reload to get updated values
            showMessage('success', 'Lưu cấu hình thành công!');
        } catch (error: any) {
            showMessage('error', `Lỗi lưu cấu hình: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const getSettingsByCategory = (category: string) => {
        return settings.filter(s => s.category === category);
    };

    const tabs = [
        { id: 'sms' as TabType, label: '📱 SMS Templates', icon: '💬' },
        { id: 'booking' as TabType, label: '📅 Booking Rules', icon: '⚙️' },
        { id: 'business_hours' as TabType, label: '🕐 Business Hours', icon: '🏥' },
        { id: 'notification' as TabType, label: '🔔 Notifications', icon: '📧' },
        { id: 'general' as TabType, label: '🏢 General', icon: 'ℹ️' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    <p className="mt-4 text-slate-600">Đang tải cấu hình...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">⚙️ Cấu hình hệ thống</h1>
                <p className="text-slate-600">Quản lý cấu hình cho module Đăng ký Online</p>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{message.type === 'success' ? '✅' : '❌'}</span>
                        <span className="font-medium">{message.text}</span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                {/* Tab Headers */}
                <div className="border-b border-slate-200 px-6">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === tab.id
                                    ? 'text-teal-600 border-b-2 border-teal-600'
                                    : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'sms' && (
                        <SMSTemplatesTab
                            settings={getSettingsByCategory('sms')}
                            onSave={handleSave}
                            saving={saving}
                        />
                    )}
                    {activeTab === 'booking' && (
                        <BookingRulesTab
                            settings={getSettingsByCategory('booking')}
                            onSave={handleSave}
                            saving={saving}
                        />
                    )}
                    {activeTab === 'business_hours' && (
                        <BusinessHoursTab
                            settings={getSettingsByCategory('business_hours')}
                            onSave={handleSave}
                            saving={saving}
                        />
                    )}
                    {activeTab === 'notification' && (
                        <NotificationsTab
                            settings={getSettingsByCategory('notification')}
                            onSave={handleSave}
                            saving={saving}
                        />
                    )}
                    {activeTab === 'general' && (
                        <GeneralSettingsTab
                            settings={getSettingsByCategory('general')}
                            onSave={handleSave}
                            saving={saving}
                        />
                    )}
                </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-1">Lưu ý</h3>
                        <p className="text-sm text-blue-800">
                            Các thay đổi cấu hình sẽ có hiệu lực ngay lập tức.
                            Hãy kiểm tra kỹ trước khi lưu, đặc biệt là các template SMS.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
