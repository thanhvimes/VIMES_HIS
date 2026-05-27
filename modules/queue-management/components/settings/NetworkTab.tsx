
import React, { useState } from 'react';
import { Globe, Router, Server, RefreshCw } from 'lucide-react';
import { AppSettings } from '../../types';

interface NetworkTabProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
}

const NetworkTab: React.FC<NetworkTabProps> = ({ settings, onUpdate }) => {
    const [isGettingIP, setIsGettingIP] = useState(false);

    const simulateGetIP = () => {
        setIsGettingIP(true);
        onUpdate({ ...settings, ipAddress: 'Đang lấy IP...' });

        setTimeout(() => {
            onUpdate({ ...settings, ipAddress: '192.168.1.' + Math.floor(Math.random() * 200 + 10) });
            setIsGettingIP(false);
        }, 800);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <h5 className="font-bold text-gray-800 text-xl mb-4 flex items-center gap-2">
                    <Globe className="text-purple-600" /> Cấu hình Mạng
                </h5>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Router size={16} /> Địa chỉ IP (LAN)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="w-full p-4 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 outline-none font-mono font-bold text-gray-700"
                            value={settings.ipAddress}
                            onChange={e => onUpdate({ ...settings, ipAddress: e.target.value })}
                        />
                        <button
                            onClick={simulateGetIP}
                            disabled={isGettingIP}
                            className="px-6 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors font-bold disabled:opacity-50"
                            title="Tự động lấy IP"
                        >
                            <RefreshCw size={24} className={isGettingIP ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Server size={16} /> API Endpoint (Server URL)
                    </label>
                    <input
                        type="text"
                        className="w-full p-4 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 outline-none font-mono text-blue-600 font-medium"
                        placeholder="https://api.benhvien.vn/v1"
                        value={settings.serverUrl}
                        onChange={e => onUpdate({ ...settings, serverUrl: e.target.value })}
                    />
                    <p className="text-xs text-gray-400 italic">Địa chỉ máy chủ HIS/LIS để đồng bộ dữ liệu.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Server size={16} /> URL API Thanh toán Ngân hàng (VCB/BIDV...)
                    </label>
                    <input
                        type="text"
                        className="w-full p-4 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 outline-none font-mono text-emerald-600 font-medium"
                        placeholder="http://10.1.3.37:8088/api/v1/vcb/genqrpayload"
                        value={settings.bankConfig?.paymentApiUrl || ''}
                        onChange={e => onUpdate({
                            ...settings,
                            bankConfig: {
                                ...settings.bankConfig,
                                paymentApiUrl: e.target.value
                            }
                        })}
                    />
                    <p className="text-xs text-gray-400 italic">Để trống sẽ sử dụng cấu hình mặc định của Server.</p>
                </div>
            </div>
        </div>
    );
};

export default NetworkTab;
