/**
 * Notification System Component
 * Displays toast notifications for JobPrep events
 */

'use client';

import React, { useEffect, useState } from 'react';
import styles from './NotificationSystem.module.css';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<{
  notification: Notification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = notification.duration || 5000;
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [notification]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`${styles.notification} ${styles[notification.type]} ${
        isExiting ? styles.exiting : ''
      }`}
      role="alert"
    >
      <div className={styles.iconContainer}>{getIcon()}</div>
      <div className={styles.content}>
        <div className={styles.title}>{notification.title}</div>
        <div className={styles.message}>{notification.message}</div>
        {notification.action && (
          <button
            className={styles.actionButton}
            onClick={notification.action.onClick}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        className={styles.closeButton}
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onDismiss,
}) => {
  return (
    <div className={styles.notificationContainer} aria-live="polite">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

/**
 * Hook for using notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    notification: Omit<Notification, 'id'>
  ): string => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = { id, ...notification };
    setNotifications((prev) => [...prev, newNotification]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const success = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration });
  };

  const error = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration: duration || 7000 });
  };

  const warning = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration });
  };

  const info = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration });
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };
};

export default NotificationSystem;
