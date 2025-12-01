
import React from 'react';

export interface NavItemType {
  name: string;
  path: string;
  icon: React.ReactElement;
  /** Group category for dashboard styling */
  group?: 'clinical' | 'admin' | 'support' | 'finance'; 
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

export interface CatalogItem {
    code: string;
    name: string;
    group?: string;
    price?: number;
}

export interface DoctorItem {
    id: string;
    name: string;
    role: string;
    department: string;
}

export interface OrganizationInfo {
    hospitalCode: string;
    hospitalName: string;
    governingUnitCode: string;
    governingUnitName: string;
    address: string;
    hotline: string;
    logoUrl?: string;
}

export interface UserSession {
    userId: string;
    username: string;
    fullName: string;
    title: string;
    departmentId: string;
    departmentName: string;
    role: 'admin' | 'doctor' | 'nurse' | 'technician' | 'receptionist';
    avatarUrl?: string;
}
