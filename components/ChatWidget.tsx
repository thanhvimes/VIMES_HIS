import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    SmsIcon, 
    XIcon, 
    SearchIcon, 
    UserGroupIcon, 
    PaperAirplaneIcon, 
    FilterIcon,
    ClockIcon,
    CheckCircleIcon
} from './Icons';
import { useChatStore } from '../stores/useChatStore';
import { socketService } from '../services/socketService';
import { useSession } from '../contexts/SessionContext';

// Mock danh sách người dùng trong hệ thống
const hospitalStaff = [
    { id: 'U1', name: 'BS. Nguyễn Văn A', role: 'Trưởng khoa', department: 'Khoa Nội', avatar: 'A' },
    { id: 'U2', name: 'BS. Trần Thị B', role: 'Bác sĩ', department: 'Khoa Ngoại', avatar: 'B' },
    { id: 'U3', name: 'ĐD. Lê Thị C', role: 'Điều dưỡng', department: 'Khoa Nội', avatar: 'C' },
    { id: 'U4', name: 'KTV. Phạm Văn Hùng', role: 'Kỹ thuật viên', department: 'CĐHA', avatar: 'H' },
    { id: 'U5', name: 'DS. Lê Văn Thuốc', role: 'Dược sĩ', department: 'Khoa Dược', avatar: 'T' },
    { id: 'G1', name: 'Nhóm Giao Ban Sáng', role: 'Phòng mổ', department: 'Hệ thống', avatar: '#' },
];

const ChatWidget: React.FC = () => {
    const { user: currentUser } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Kết nối dữ liệu từ Zustand Store
    const { 
        activeChatId, 
        messages, 
        setActiveChat, 
        sendMessage, 
        receiveMessage,
        unreadCounts,
        isTyping,
        onlineUsers
    } = useChatStore();

    // Khởi tạo kết nối Socket khi component mount
    useEffect(() => {
        if (currentUser) {
            socketService.connect(currentUser.userId);
            
            // Đăng ký lắng nghe sự kiện tin nhắn mới
            socketService.on('message_received', (data) => {
                receiveMessage(data);
            });
        }
        return () => socketService.off('message_received');
    }, [currentUser]);

    // Cuộn xuống cuối khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChatId, isTyping]);

    const activeChatUser = hospitalStaff.find(u => u.id === activeChatId);
    const currentChatMessages = activeChatId ? (messages[activeChatId] || []) : [];
    // FIX: Added explicit type cast to number[] for Object.values(unreadCounts) to resolve 'unknown' type errors during reduction.
    const totalUnread = (Object.values(unreadCounts) as number[]).reduce((a, b) => a + b, 0);

    const filteredUsers = useMemo(() => {
        return hospitalStaff.filter(u => 
            u.id !== currentUser?.userId &&
            (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             u.department.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, currentUser]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || !activeChatId) return;
        sendMessage(activeChatId, inputValue);
        setInputValue('');
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all hover:scale-110 active:scale-95 group"
            >
                <SmsIcon className="w-7 h-7" />
                {/* FIX: Comparison here is now valid as totalUnread is correctly typed as a number. */}
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                        {totalUnread}
                    </span>
                )}
                {/* Tooltip nhỏ */}
                <span className="absolute right-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Chat nội bộ
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[550px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 animate-fade-in-up">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    {activeChatId ? (
                        <>
                            <button onClick={() => setActiveChat(null)} className="hover:bg-white/20 p-1 rounded-lg transition">
                                <ChevronLeftIcon className="w-5 h-5"/>
                            </button>
                            <div className="relative">
                                <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center font-bold text-sm border border-blue-400">
                                    {activeChatUser?.avatar}
                                </div>
                                {onlineUsers.includes(activeChatId) && (
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-blue-600 rounded-full"></span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-tight">{activeChatUser?.name}</h3>
                                <p className="text-[10px] text-blue-100 opacity-80">{activeChatUser?.role}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <UserGroupIcon className="w-5 h-5"/>
                            </div>
                            <h3 className="font-bold">Hệ thống liên lạc nội bộ</h3>
                        </>
                    )}
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-full transition">
                    <XIcon className="w-5 h-5"/>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900">
                {!activeChatId ? (
                    // --- MÀN HÌNH DANH SÁCH NGƯỜI DÙNG ---
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                                <input 
                                    type="text" 
                                    placeholder="Tìm bác sĩ, điều dưỡng..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {filteredUsers.map(u => (
                                <div 
                                    key={u.id}
                                    onClick={() => setActiveChat(u.id)}
                                    className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group"
                                >
                                    <div className="relative">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${u.id.startsWith('G') ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                            {u.avatar}
                                        </div>
                                        {onlineUsers.includes(u.id) && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-50 dark:border-slate-900 rounded-full"></span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{u.name}</h4>
                                            {unreadCounts[u.id] > 0 && (
                                                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                    {unreadCounts[u.id]}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className="text-xs text-slate-500 truncate">{u.role}</p>
                                            <span className="text-[10px] text-slate-400 font-medium">{u.department}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // --- MÀN HÌNH CỬA SỔ CHAT CHI TIẾT ---
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {currentChatMessages.length === 0 && (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircleIcon className="w-8 h-8 text-slate-300"/>
                                    </div>
                                    <p className="text-sm text-slate-400">Bắt đầu cuộc hội thoại an toàn.</p>
                                </div>
                            )}

                            {currentChatMessages.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                                        msg.isMe 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                    }`}>
                                        {msg.content}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 px-1">
                                        <span className="text-[9px] text-slate-400 uppercase font-medium">{msg.timestamp}</span>
                                        {msg.isMe && <CheckCircleIcon className="w-3 h-3 text-blue-400"/>}
                                    </div>
                                </div>
                            ))}
                            
                            {/* Typing Indicator */}
                            {isTyping[activeChatId] && (
                                <div className="flex items-center gap-2 text-slate-400 text-xs animate-pulse">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                    <span>{activeChatUser?.name} đang nhập...</span>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shrink-0">
                            <form onSubmit={handleSend} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                <input 
                                    type="text" 
                                    value={inputValue}
                                    onChange={e => setInputValue(e.target.value)}
                                    placeholder="Nhập nội dung tin nhắn..." 
                                    className="flex-1 bg-transparent border-none text-sm p-2 outline-none dark:text-white"
                                    autoFocus
                                />
                                <button 
                                    type="submit" 
                                    disabled={!inputValue.trim()}
                                    className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                                >
                                    <PaperAirplaneIcon className="w-5 h-5 transform rotate-90"/>
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Re-use Icons from internal context
const ChevronLeftIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

export default ChatWidget;