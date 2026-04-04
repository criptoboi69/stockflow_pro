import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const NotificationBell = ({ notifications = [], onViewAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}j`;
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

  const unreadCount = notifications?.filter(n => !n?.read)?.length || 0;
  const recentNotifications = notifications?.slice(0, 10) || [];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center"
        aria-label="Notifications"
      >
        <Icon name="Bell" size={20} className="text-text-muted" />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            {onViewAll && (
              <button
                onClick={() => {
                  onViewAll();
                  setIsOpen(false);
                }}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                Voir tout
              </button>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-80">
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
                        if (notification?.onClick) {
                          notification.onClick();
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
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
