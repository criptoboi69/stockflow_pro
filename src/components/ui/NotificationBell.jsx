import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const NotificationBell = ({ 
  notifications = [], 
  unreadCount: propUnreadCount, 
  onViewAll, 
  onMarkAsRead, 
  onMarkAllAsRead,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  const buttonSize = sizeClasses[size] || sizeClasses.md;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const time = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(time.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return '';
    }
    
    const diffInSeconds = Math.floor((now - time) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    // Recent (less than 1 hour): show actual time (e.g., "14:22")
    if (diffInHours < 1) {
      return time.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Today: show time (e.g., "14:22")
    if (diffInDays < 1 && time.getDate() === now.getDate()) {
      return time.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // This week: show day name (e.g., "Lun.")
    if (diffInDays < 7) {
      return time.toLocaleDateString('fr-FR', {
        weekday: 'short'
      });
    }
    
    // Older: show full date (e.g., "05/04/2026")
    return time.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'stock_in':
        return { name: 'ArrowUp', color: 'text-success', bg: 'bg-success/10' };
      case 'stock_out':
        return { name: 'ArrowDown', color: 'text-error', bg: 'bg-error/10' };
      case 'adjustment':
        return { name: 'Edit', color: 'text-warning', bg: 'bg-warning/10' };
      case 'low_stock':
        return { name: 'AlertTriangle', color: 'text-warning', bg: 'bg-warning/10' };
      case 'out_of_stock':
        return { name: 'AlertCircle', color: 'text-error', bg: 'bg-error/10' };
      default:
        return { name: 'Bell', color: 'text-primary', bg: 'bg-primary/10' };
    }
  };

  const unreadCount = propUnreadCount ?? (notifications?.filter(n => !n?.read)?.length || 0);
  const recentNotifications = notifications?.slice(0, 10) || [];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative ${buttonSize} rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center`}
        aria-label="Notifications"
      >
        <Icon name="Bell" size={size === 'sm' ? 18 : 20} className="text-text-muted" />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown Panel */}
          {/* Desktop: fixed position to the right of sidebar (bell is in sidebar header) */}
          {/* Mobile: centered, near top */}
          <div className="fixed left-[4.5rem] top-14 lg:left-[5.5rem] lg:w-[420px] w-[calc(100vw-5rem)] bg-surface border border-border rounded-xl shadow-2xl z-50 max-h-[70vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface flex-shrink-0">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && onMarkAllAsRead && (
                <button
                  onClick={() => {
                    onMarkAllAsRead();
                  }}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Tout marquer comme lu
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
                aria-label="Fermer"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
            {recentNotifications?.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="Bell" size={32} className="text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentNotifications.map((notification) => {
                  const iconConfig = getNotificationIcon(notification?.type);
                  
                  return (
                    <div
                      key={notification?.id}
                      className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${!notification?.read ? 'bg-primary/5' : ''}`}
                      onClick={() => {
                        if (onMarkAsRead && !notification?.read) {
                          onMarkAsRead(notification?.id);
                        }
                        if (notification?.onClick) {
                          notification.onClick();
                        }
                        if (notification?.navigateTo) {
                          // Use window.location for full page navigation
                          window.location.href = notification.navigateTo;
                        }
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconConfig?.bg}`}>
                          <Icon name={iconConfig?.name} size={16} className={iconConfig?.color} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {notification?.title}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                            {notification?.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-muted">
                              {formatTimeAgo(notification?.timestamp)}
                            </span>
                            {!notification?.read && (
                              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>

            {/* Footer */}
            {recentNotifications?.length > 0 && onViewAll && (
              <div className="p-3 border-t border-border bg-surface flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onViewAll();
                    setIsOpen(false);
                  }}
                  className="w-full justify-center"
                >
                  Voir toutes les notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
