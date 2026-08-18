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
    const [notifications, setNotifications] = useState<AppNotification[]>([
        {
            id: 'init-1',
            title: 'Hệ thống PACS đã sẵn sàng',
            message: 'Đã kết nối thành công tới Orthanc PACS Server và kho lưu trữ DICOM.',
            type: 'success',
            timestamp: new Date(),
            isRead: false,
            autoClose: false,
        }
    ]);

    const addNotification = useCallback((title: string, message: string, type: NotificationType = 'info', link?: string, autoClose = true) => {
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

        if (autoClose) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== newNote.id));
            }, 4000);
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

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        return {
            notifications: [],
            unreadCount: 0,
            addNotification: (title: string, message: string, type: NotificationType = 'info') => {
                console.log(`[Notification ${type}]: ${title} - ${message}`);
            },
            markAsRead: () => {},
            markAllAsRead: () => {},
            removeNotification: () => {},
            clearAll: () => {},
        };
    }
    return context;
};
