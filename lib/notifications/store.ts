'use client'

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'compliance_alert' | 'document_expiry' | 'sync_status' | 'unusual_activity';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  relatedId?: string; // e.g., CPF for compliance, document ID for expiry
}

interface NotificationsState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

export const useNotificationStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: uuidv4(),
          timestamp: new Date(),
          isRead: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const targetNotification = state.notifications.find((n) => n.id === id);
          if (targetNotification && !targetNotification.isRead) {
            return {
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
              ),
              unreadCount: state.unreadCount - 1,
            };
          }
          return state;
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      },
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => localStorage, {
        // Custom reviver to restore Date objects
        reviver: (key, value) => {
          if (key === 'timestamp' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        },
      }),
    }
  )
);

// Function to update the unread count on initial load
export const hydrateUnreadCount = () => {
  useNotificationStore.setState((state) => ({
    unreadCount: state.notifications.filter((n: Notification) => !n.isRead).length
  }));
};