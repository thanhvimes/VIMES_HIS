
import React from 'react';
import { Volume2, MessageSquare, Info, RotateCcw } from 'lucide-react';
import { AppSettings } from '../../types';

interface VoiceTabProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
}

const DEFAULT_TEMPLATE = 'Mời bệnh nhân {name}, số thứ tự {ticket}, đến {counter}';

const VoiceTab: React.FC<VoiceTabProps> = ({ settings, onUpdate }) => {
    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h5 className="font-bold text-gray-800 text-xl mb-4 flex items-center gap-2">
                    <Volume2 className="text-orange-600" /> Cấu hình Âm thanh gọi số
                </h5>
                <p className="text-sm text-gray-500 mb-6">Tùy chỉnh nội dung câu mời khi gọi bệnh nhân đến quầy.</p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <MessageSquare size={16} /> Nội dung mẫu (Template)
                        </label>
                        <button 
                            onClick={() => onUpdate({ ...settings, callingTemplate: DEFAULT_TEMPLATE })}
                            className="text-xs text-orange-600 font-bold flex items-center gap-1 hover:underline"
                        >
                            <RotateCcw size={12} /> Reset mặc định
                        </button>
                    </div>
                    
                    <textarea
                        className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all font-medium text-gray-800 leading-relaxed"
                        placeholder="VD: Mời bệnh nhân {name}, số thứ tự {ticket}, đến {counter}"
                        value={settings.callingTemplate || DEFAULT_TEMPLATE}
                        onChange={e => onUpdate({ ...settings, callingTemplate: e.target.value })}
                    />

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                            <Info size={18} />
                            <span>Hướng dẫn thiết lập:</span>
                        </div>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Sử dụng các từ khóa sau để hệ thống tự động điền thông tin:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white p-2 rounded-lg border border-blue-100">
                                <code className="text-orange-600 font-bold">{'{name}'}</code>
                                <span className="text-[10px] text-gray-500 ml-2">Tên bệnh nhân</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-blue-100">
                                <code className="text-orange-600 font-bold">{'{ticket}'}</code>
                                <span className="text-[10px] text-gray-500 ml-2">Số thứ tự</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-blue-100">
                                <code className="text-orange-600 font-bold">{'{number}'}</code>
                                <span className="text-[10px] text-gray-500 ml-2">Giống {'{ticket}'}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-blue-100">
                                <code className="text-orange-600 font-bold">{'{counter}'}</code>
                                <span className="text-[10px] text-gray-500 ml-2">Tên quầy/phòng</span>
                            </div>
                        </div>
                        <div className="mt-2 p-3 bg-white/50 rounded-lg border border-dashed border-blue-200">
                            <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Ví dụ kết quả:</p>
                            <p className="text-[11px] text-blue-600 italic">
                                "Xin mời ông bà <span className="font-bold">NGUYỄN VĂN A</span> có số <span className="font-bold">1001</span> vui lòng di chuyển đến <span className="font-bold">QUẦY SỐ 1</span> để được phục vụ."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceTab;
