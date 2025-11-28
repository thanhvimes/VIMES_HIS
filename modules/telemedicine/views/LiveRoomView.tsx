
import React, { useState } from 'react';
import { 
    MicrophoneIcon, 
    VideoCameraIcon, 
    PhoneMissedCallIcon, 
    MicrophoneOffIcon, 
    ChatBubbleIcon,
    DocumentTextIcon,
    PhotographIcon,
    XIcon,
    PaperAirplaneIcon,
    UserGroupIcon
} from '../../../components/Icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock participants
const participants = [
    { id: 1, name: 'GS. Nguyễn Văn B (Chủ tọa)', role: 'Host', img: 'https://ui-avatars.com/api/?name=Nguyen+Van+B&background=0D8ABC&color=fff' },
    { id: 2, name: 'BS. Trần Văn A (Báo cáo)', role: 'Guest', img: 'https://ui-avatars.com/api/?name=Tran+Van+A&background=6366f1&color=fff' },
    { id: 3, name: 'BS. CĐHA Phạm Văn C', role: 'Viewer', img: 'https://ui-avatars.com/api/?name=Pham+Van+C&background=10b981&color=fff' },
];

const LiveRoomView: React.FC = () => {
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [activeTab, setActiveTab] = useState<'records' | 'pacs' | 'chat'>('pacs');
    const [chatMessage, setChatMessage] = useState('');

    const handleEndCall = () => {
        if (window.confirm("Kết thúc phiên hội chẩn?")) {
            navigate('/telemedicine/dashboard');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900 text-white flex flex-col">
            {/* Header */}
            <div className="h-14 bg-slate-800 border-b border-slate-700 flex justify-between items-center px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="font-bold text-red-400 text-sm uppercase tracking-wider">Live</span>
                    </div>
                    <h1 className="font-bold text-lg truncate">Hội chẩn: BN Lê Hoàng Cường (TC-001)</h1>
                </div>
                <div className="text-sm font-mono text-slate-400">00:15:23</div>
            </div>

            {/* Main Body */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* LEFT: Video Grid (70%) */}
                <div className="flex-1 bg-black relative flex flex-col">
                    <div className="flex-1 p-4 grid grid-cols-2 gap-4 overflow-y-auto">
                        {participants.map(p => (
                            <div key={p.id} className="relative bg-slate-800 rounded-lg overflow-hidden border border-slate-700 group">
                                {/* Mock Video Placeholder */}
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
                                    <img src={p.img} alt={p.name} className="w-20 h-20 rounded-full opacity-50"/>
                                </div>
                                {/* Overlay Info */}
                                <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="font-bold text-sm">{p.name}</p>
                                    <p className="text-xs text-slate-300">{p.role}</p>
                                </div>
                                <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full">
                                    <MicrophoneIcon className="w-4 h-4 text-green-400"/>
                                </div>
                            </div>
                        ))}
                        {/* Self View (Simulated) */}
                        <div className="relative bg-slate-800 rounded-lg overflow-hidden border border-slate-700 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                <p className="text-slate-500">Camera của bạn</p>
                            </div>
                            {!isVideoOff ? (
                                <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-500 rounded-full"></div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                                    <div className="text-slate-500 flex flex-col items-center">
                                        <VideoCameraIcon className="w-10 h-10 mb-2"/>
                                        <span>Video Off</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Control Bar */}
                    <div className="h-20 bg-slate-900 flex justify-center items-center gap-4 shrink-0 border-t border-slate-800">
                        <button 
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                        >
                            {isMuted ? <MicrophoneOffIcon className="w-6 h-6"/> : <MicrophoneIcon className="w-6 h-6"/>}
                        </button>
                        <button 
                            onClick={() => setIsVideoOff(!isVideoOff)}
                            className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                        >
                            <VideoCameraIcon className="w-6 h-6"/>
                        </button>
                        <button 
                            onClick={handleEndCall}
                            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all px-8 flex items-center gap-2 font-bold"
                        >
                            <PhoneMissedCallIcon className="w-6 h-6"/> Kết thúc
                        </button>
                    </div>
                </div>

                {/* RIGHT: Clinical Data & Chat (30%) */}
                <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-700">
                        <button 
                            onClick={() => setActiveTab('pacs')}
                            className={`flex-1 py-3 text-sm font-bold flex justify-center gap-2 ${activeTab === 'pacs' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <PhotographIcon className="w-4 h-4"/> PACS
                        </button>
                        <button 
                            onClick={() => setActiveTab('records')}
                            className={`flex-1 py-3 text-sm font-bold flex justify-center gap-2 ${activeTab === 'records' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <DocumentTextIcon className="w-4 h-4"/> Hồ sơ
                        </button>
                        <button 
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 py-3 text-sm font-bold flex justify-center gap-2 ${activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <ChatBubbleIcon className="w-4 h-4"/> Chat
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-slate-900 p-4">
                        {activeTab === 'pacs' && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Hình ảnh đã chọn</h3>
                                <div className="aspect-square bg-black rounded border border-slate-700 overflow-hidden relative group">
                                    <img src="https://prod-images-static.radiopaedia.org/images/54524293/d977529652c824095f654f7c352761_jumbo.jpg" className="w-full h-full object-contain" alt="CT"/>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px]">CT Ngực - Slice 45</div>
                                </div>
                                <div className="aspect-square bg-black rounded border border-slate-700 overflow-hidden relative group">
                                    <img src="https://prod-images-static.radiopaedia.org/images/31521/0a8d37d7996342775b761094577303_jumbo.jpeg" className="w-full h-full object-contain" alt="XRay"/>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px]">X-Quang Ngực Thẳng</div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'records' && (
                            <div className="space-y-4 text-sm">
                                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                                    <h4 className="font-bold text-indigo-400 mb-1">Thông tin hành chính</h4>
                                    <p>BN: Lê Hoàng Cường (45T - Nam)</p>
                                    <p>Mã: P003</p>
                                </div>
                                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                                    <h4 className="font-bold text-indigo-400 mb-1">Lý do hội chẩn</h4>
                                    <p className="text-slate-300">Khối u phổi thùy trên kích thước lớn, xâm lấn trung thất.</p>
                                </div>
                                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                                    <h4 className="font-bold text-indigo-400 mb-1">Tiền sử</h4>
                                    <ul className="list-disc list-inside text-slate-300">
                                        <li>Hút thuốc lào 20 năm</li>
                                        <li>COPD (2019)</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 space-y-3 mb-4">
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">A</div>
                                        <div className="bg-slate-800 p-2 rounded-lg text-sm text-slate-200 max-w-[80%]">
                                            <p className="text-xs font-bold text-blue-400 mb-0.5">BS. Trần Văn A</p>
                                            Xin chào các thầy, hình ảnh CT đã được đẩy lên.
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-row-reverse">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">Me</div>
                                        <div className="bg-indigo-900 p-2 rounded-lg text-sm text-slate-200 max-w-[80%]">
                                            Đã nhận, hình ảnh rõ nét.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Input (Only visible in Chat tab) */}
                    {activeTab === 'chat' && (
                        <div className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
                            <input 
                                type="text" 
                                value={chatMessage}
                                onChange={e => setChatMessage(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                placeholder="Nhập tin nhắn..."
                            />
                            <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                                <PaperAirplaneIcon className="w-4 h-4 rotate-90"/>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveRoomView;
