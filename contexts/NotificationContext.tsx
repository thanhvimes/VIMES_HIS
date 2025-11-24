
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AppNotification, NotificationType } from '../types';

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    addNotification: (title: string, message: string, type?: NotificationType, link?: string, autoClose?: boolean) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const addNotification = useCallback((title: string, message: string, type: NotificationType = 'info', link?: string, autoClose = false) => {
        const newNote: AppNotification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            title,
            message,
            type,
            timestamp: new Date(),
            isRead: false,
            link,
            autoClose
        };

        setNotifications(prev => [newNote, ...prev]);

        // If autoClose (Toast), remove it after 5 seconds
        if (autoClose) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== newNote.id));
            }, 5000);
        }
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead && !n.autoClose).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
