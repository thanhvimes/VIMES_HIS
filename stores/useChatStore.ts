
import { create } from 'zustand';
import { ChatMessage, ChatUser } from '../types';
import { socketService } from '../services/socketService';

interface ChatState {
    activeChatId: string | null;
    messages: Record<string, ChatMessage[]>; // Lưu tin nhắn theo ID người hội thoại
    onlineUsers: string[]; // Danh sách ID người dùng đang online
    unreadCounts: Record<string, number>;
    isTyping: Record<string, boolean>;

    // Actions
    setActiveChat: (userId: string | null) => void;
    sendMessage: (recipientId: string, content: string) => void;
    receiveMessage: (message: ChatMessage) => void;
    setTyping: (userId: string, status: boolean) => void;
    clearUnread: (userId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    activeChatId: null,
    messages: {
        'U1': [
            { id: 'm1', senderId: 'U1', content: 'Chào đồng nghiệp, ca mổ phòng 2 xong chưa?', timestamp: '10:30', isMe: false },
        ]
    },
    onlineUsers: ['U1', 'U3', 'U5'],
    unreadCounts: {},
    isTyping: {},

    setActiveChat: (userId) => {
        set({ activeChatId: userId });
        if (userId) get().clearUnread(userId);
    },

    sendMessage: (recipientId, content) => {
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: 'me',
            content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true
        };

        // 1. Cập nhật UI ngay lập tức (Optimistic UI)
        set(state => ({
            messages: {
                ...state.messages,
                [recipientId]: [...(state.messages[recipientId] || []), newMessage]
            }
        }));

        // 2. Đẩy qua đường ống Socket tới Server
        socketService.emit('send_message', {
            to: recipientId,
            message: content
        });
    },

    receiveMessage: (message) => {
        const { activeChatId } = get();
        const senderId = message.senderId;

        set(state => {
            const newMessages = {
                ...state.messages,
                [senderId]: [...(state.messages[senderId] || []), message]
            };
            
            const newUnread = { ...state.unreadCounts };
            if (activeChatId !== senderId) {
                newUnread[senderId] = (newUnread[senderId] || 0) + 1;
            }

            return {
                messages: newMessages,
                unreadCounts: newUnread
            };
        });
    },

    setTyping: (userId, status) => {
        set(state => ({
            isTyping: { ...state.isTyping, [userId]: status }
        }));
    },

    clearUnread: (userId) => {
        set(state => ({
            unreadCounts: { ...state.unreadCounts, [userId]: 0 }
        }));
    }
}));
