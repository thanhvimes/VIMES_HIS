import React from 'react';

export interface NavItemType {
  name: string;
  path: string;
  icon: React.ReactElement;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    timestamp: Date;
    isRead: boolean;
    link?: string;
    autoClose?: boolean;
}

export interface ChatUser {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'busy';
    role: string;
    avatar: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
    isMe: boolean;
}

export interface ChatChannel {
    id: string;
    name: string;
    isGroup: boolean;
    participants: string[];
    unreadCount: number;
    lastMessage?: ChatMessage;
}