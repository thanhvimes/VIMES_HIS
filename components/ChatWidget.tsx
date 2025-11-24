
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SmsIcon, XIcon, SearchIcon, UserGroupIcon, PaperAirplaneIcon, FilterIcon } from './Icons';
import { ChatUser, ChatMessage } from '../types';

// Extended interface for local use
interface ExtendedChatUser extends ChatUser {
    department: string;
}

const mockUsers: ExtendedChatUser[] = [
    { id: 'U1', name: 'BS. Nguyễn Văn A', status: 'online', role: 'Trưởng khoa', department: 'Khoa Nội', avatar: 'A' },
    { id: 'U2', name: 'BS. Trần Thị B', status: 'busy', role: 'Bác sĩ', department: 'Khoa Ngoại', avatar: 'B' },
    { id: 'U3', name: 'ĐD. Lê Thị C', status: 'online', role: 'Điều dưỡng', department: 'Khoa Nội', avatar: 'C' },
    { id: 'U4', name: 'KTV. Phạm Văn D', status: 'offline', role: 'Kỹ thuật viên', department: 'CĐHA', avatar: 'D' },
    { id: 'U5', name: 'DS. Lê Văn Thuốc', status: 'online', role: 'Dược sĩ', department: 'Khoa Dược', avatar: 'T' },
    { id: 'G1', name: 'Khoa Nội Tổng Hợp', status: 'online', role: 'Group', department: 'Khoa Nội', avatar: '#' },
    { id: 'G2', name: 'Hội chẩn Cấp cứu', status: 'online', role: 'Group', department: 'Cấp cứu', avatar: '!' },
];

const initialMessages: Record<string, ChatMessage[]> = {
    'U1': [
        { id: 'm1', senderId: 'U1', content: 'Chào bác sĩ Minh, ca bệnh ở phòng 301 thế nào rồi?', timestamp: '10:30', isMe: false },
        { id: 'm2', senderId: 'me', content: 'Chào anh, bệnh nhân đã ổn định, đang chờ kết quả xét nghiệm.', timestamp: '10:32', isMe: true },
    ],
    'G1': [
        { id: 'gm1', senderId: 'U3', content: 'Thông báo: Chiều nay họp giao ban lúc 14h nhé mọi người.', timestamp: '09:00', isMe: false },
    ]
};

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Filtering State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');

    const activeChatUser = mockUsers.find(u => u.id === activeChatId);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChatId, isOpen]);

    // Get unique departments
    const departments = useMemo(() => {
        const depts = new Set(mockUsers.map(u => u.department));
        return ['All', ...Array.from(depts)];
    }, []);

    // Filter logic
    const filteredUsers = useMemo(() => {
        return mockUsers.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  user.role.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = selectedDept === 'All' || user.department === selectedDept;
            return matchesSearch && matchesDept;
        });
    }, [searchTerm, selectedDept]);

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || !activeChatId) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: 'me',
            content: inputValue,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true
        };

        setMessages(prev => ({
            ...prev,
            [activeChatId]: [...(prev[activeChatId] || []), newMessage]
        }));
        setInputValue('');
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center z-50 transition-transform hover:scale-110 animate-fade-in-up"
                title="Tin nhắn nội bộ"
            >
                <SmsIcon className="w-7 h-7" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 animate-fade-in-up">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    {activeChatId ? (
                        <>
                            <button onClick={() => setActiveChatId(null)} className="hover:bg-blue-700 p-1 rounded mr-1">←</button>
                            <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center font-bold text-sm">
                                {activeChatUser?.avatar}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">{activeChatUser?.name}</h3>
                                <p className="text-xs text-blue-200 flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${activeChatUser?.status === 'online' ? 'bg-green-400' : activeChatUser?.status === 'busy' ? 'bg-red-400' : 'bg-gray-400'}`}></span>
                                    {activeChatUser?.status}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <UserGroupIcon className="w-6 h-6"/>
                            <h3 className="font-bold">Clinic Chat</h3>
                        </>
                    )}
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-blue-700 rounded transition">
                    <XIcon className="w-5 h-5"/>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900">
                {!activeChatId ? (
                    // User List
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Filters */}
                        <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2 shrink-0">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm đồng nghiệp..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <FilterIcon className="w-4 h-4 text-slate-400"/>
                                <select 
                                    value={selectedDept} 
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-slate-600 dark:text-slate-300"
                                >
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept === 'All' ? 'Tất cả Khoa/Phòng' : dept}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredUsers.length === 0 ? (
                                <div className="text-center p-4 text-slate-500 text-sm">Không tìm thấy người dùng.</div>
                            ) : (
                                filteredUsers.map(user => (
                                    <div 
                                        key={user.id}
                                        onClick={() => setActiveChatId(user.id)}
                                        className="flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                    >
                                        <div className="relative">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${user.role === 'Group' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                                {user.avatar}
                                            </div>
                                            {user.role !== 'Group' && (
                                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${user.status === 'online' ? 'bg-green-500' : user.status === 'busy' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between">
                                                <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{user.name}</h4>
                                            </div>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <p className="text-xs text-slate-500 truncate">{user.role}</p>
                                                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 rounded">{user.department}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    // Chat Window
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {(messages[activeChatId] || []).map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-lg text-sm shadow-sm ${msg.isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'}`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2 shrink-0">
                            <input 
                                type="text" 
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder="Nhập tin nhắn..." 
                                className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                                autoFocus
                            />
                            <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                                <PaperAirplaneIcon className="w-5 h-5 transform rotate-90"/>
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatWidget;
