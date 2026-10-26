import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AppNotification } from '../types';
import { authApi, notificationApi } from '../services/api';
import { getSocket, joinUserRoom, disconnectSocket } from '../services/socket';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  notifications: AppNotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Non-fatal
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getCurrentUser();
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        joinUserRoom(res.data.user.id || res.data.user._id);
        fetchNotifications();
      }
    } catch {
      setUser(null);
      localStorage.removeItem('carenova_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Listen for live socket notifications
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    const handleNotification = (notif: AppNotification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.info(notif.title, {
        description: notif.message,
        duration: 5000,
      });
    };

    socket.on('new_notification', handleNotification);

    return () => {
      socket.off('new_notification', handleNotification);
    };
  }, [user]);

  const login = (userData: User, token: string) => {
    localStorage.setItem('carenova_token', token);
    setUser(userData);
    joinUserRoom(userData.id || userData._id!);
    fetchNotifications();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Proceed with local logout regardless
    }
    localStorage.removeItem('carenova_token');
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    disconnectSocket();
    toast.success('You have been logged out.');
  };

  const markNotificationRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        notifications,
        unreadCount,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
