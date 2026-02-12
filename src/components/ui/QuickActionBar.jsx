import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const QuickActionBar = ({ 
  variant = 'floating', // 'floating' | 'header' | 'dashboard'
  userRole = 'user',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const quickActions = [
    {
      label: 'Scan QR Code',
      path: '/qr-scanner',
      icon: 'QrCode',
      roles: ['super_admin', 'administrator', 'manager', 'user'],
      color: 'primary',
      description: 'Quick product scanning'
    },
    {
      label: 'Add Product',
      path: '/products?action=add',
      icon: 'Plus',
      roles: ['super_admin', 'administrator', 'manager'],
      color: 'success',
      description: 'Create new product'
    },
    {
      label: 'Stock Movement',
      path: '/stock-movements?action=add',
      icon: 'ArrowUpDown',
      roles: ['super_admin', 'administrator', 'manager', 'user'],
      color: 'accent',
      description: 'Record stock change'
    },
    {
      label: 'Quick Search',
      action: 'search',
      icon: 'Search',
      roles: ['super_admin', 'administrator', 'manager', 'user'],
      color: 'secondary',
      description: 'Find products quickly'
    }
  ];

  const hasAccess = (roles) => {
    return roles?.includes(userRole);
  };

  const handleAction = (action) => {
    if (action?.path) {
      navigate(action?.path);
    } else if (action?.action === 'search') {
      const quickSearchEvent = new CustomEvent('stockflow:quick-search');
      window.dispatchEvent(quickSearchEvent);

      const searchInput = document.querySelector('[data-search-input]');
      if (searchInput) {
        searchInput?.focus();
      } else {
        navigate('/products?focusSearch=true');
      }
    }
    setIsExpanded(false);
  };

  const accessibleActions = quickActions?.filter(action => hasAccess(action?.roles));

  if (variant === 'floating') {
    return (
      <div className={`fab-position z-40 ${className}`}>
        {/* Enhanced Expanded Actions with better mobile support */}
        {isExpanded && (
          <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3">
            {accessibleActions?.slice(0, -1)?.reverse()?.map((action, index) => (
              <div key={index} className="flex items-center justify-end space-x-2 sm:space-x-3">
                <div className="bg-surface border border-border rounded-lg px-2 py-1 sm:px-3 sm:py-2 modal-shadow">
                  <p className="text-xs sm:text-sm font-medium text-text-primary">{action?.label}</p>
                  <p className="text-xs text-text-muted hidden sm:block">{action?.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleAction(action)}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-full modal-shadow transition-hover touch-target
                    ${action?.color === 'primary' ? 'border-primary text-primary hover:bg-primary hover:text-primary-foreground' :
                      action?.color === 'success' ? 'border-success text-success hover:bg-success hover:text-success-foreground' :
                      action?.color === 'accent' ? 'border-accent text-accent hover:bg-accent hover:text-accent-foreground' :
                      'border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground'
                    }
                  `}
                >
                  <Icon name={action?.icon} size={16} className="sm:size-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Enhanced Main FAB with better responsiveness */}
        <Button
          variant={isExpanded ? "secondary" : "default"}
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full modal-shadow transition-hover bg-primary hover:bg-primary/90 text-primary-foreground touch-target"
        >
          <Icon 
            name={isExpanded ? "X" : "Plus"} 
            size={20} 
            className="sm:size-6 transition-transform duration-200"
          />
        </Button>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center space-x-1 sm:space-x-2 ${className}`}>
        {accessibleActions?.slice(0, 3)?.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => handleAction(action)}
            className="text-text-secondary hover:text-text-primary touch-target text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
            title={action?.description}
          >
            <Icon name={action?.icon} size={14} className="sm:size-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{action?.label}</span>
            <span className="sm:hidden">{action?.label?.split(' ')?.[0]}</span>
          </Button>
        ))}
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
        {accessibleActions?.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={() => handleAction(action)}
            className="h-20 sm:h-24 flex-col space-y-2 transition-hover hover:border-primary hover:bg-primary/5 touch-target p-3 sm:p-4"
          >
            <div className={`
              w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center
              ${action?.color === 'primary' ? 'bg-primary/10 text-primary' :
                action?.color === 'success' ? 'bg-success/10 text-success' :
                action?.color === 'accent'? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'
              }
            `}>
              <Icon name={action?.icon} size={16} className="sm:size-5" />
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-text-primary leading-tight">{action?.label}</p>
              <p className="text-xs text-text-muted hidden sm:block mt-1">{action?.description}</p>
            </div>
          </Button>
        ))}
      </div>
    );
  }

  return null;
};

export default QuickActionBar;