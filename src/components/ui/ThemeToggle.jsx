import React, { useState } from 'react';
import Icon from '../AppIcon';
import { useTheme } from '../../hooks/useTheme';

const ThemeToggle = ({ 
  variant = 'button', 
  size = 'md', 
  showLabel = false,
  className = '' 
}) => {
  const { theme, changeTheme, isDark, getCurrentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    {
      value: 'light',
      label: 'Clair',
      icon: 'Sun',
      description: 'Interface claire'
    },
    {
      value: 'dark',
      label: 'Sombre',
      icon: 'Moon',
      description: 'Interface sombre'
    },
    {
      value: 'auto',
      label: 'Auto',
      icon: 'Laptop',
      description: 'Suit le système'
    }
  ];

  const currentTheme = themes?.find(t => t?.value === theme);
  const effectiveTheme = getCurrentTheme();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            ${sizeClasses?.[size]}
            flex items-center justify-center rounded-lg
            bg-muted/50 hover:bg-muted text-text-primary
            border border-border hover:border-primary/50
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-primary/20
            ${showLabel ? 'px-3 w-auto space-x-2' : ''}
          `}
        >
          <Icon 
            name={effectiveTheme === 'dark' ? 'Moon' : 'Sun'} 
            size={iconSizes?.[size]} 
          />
          {showLabel && (
            <>
              <span className="text-sm font-medium">
                {currentTheme?.label}
              </span>
              <Icon name="ChevronDown" size={14} />
            </>
          )}
        </button>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-50 py-1">
              {themes?.map((themeOption) => (
                <button
                  key={themeOption?.value}
                  onClick={() => {
                    changeTheme(themeOption?.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2
                    text-left text-sm transition-colors
                    hover:bg-muted/50
                    ${theme === themeOption?.value ? 'text-primary bg-primary/5' : 'text-text-primary'}
                  `}
                >
                  <Icon name={themeOption?.icon} size={16} />
                  <div className="flex-1">
                    <div className="font-medium">{themeOption?.label}</div>
                    <div className="text-xs text-text-muted">
                      {themeOption?.description}
                    </div>
                  </div>
                  {theme === themeOption?.value && (
                    <Icon name="Check" size={14} className="text-primary" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Simple toggle button (cycles through themes)
  const handleToggle = () => {
    const currentIndex = themes?.findIndex(t => t?.value === theme);
    const nextIndex = (currentIndex + 1) % themes?.length;
    changeTheme(themes?.[nextIndex]?.value);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        ${sizeClasses?.[size]}
        flex items-center justify-center rounded-lg
        bg-muted/50 hover:bg-muted text-text-primary
        border border-border hover:border-primary/50
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-primary/20
        ${showLabel ? 'px-3 w-auto space-x-2' : ''}
        ${className}
      `}
      title={`Thème actuel: ${currentTheme?.label} - Cliquer pour changer`}
    >
      <Icon 
        name={effectiveTheme === 'dark' ? 'Moon' : 'Sun'} 
        size={iconSizes?.[size]} 
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {currentTheme?.label}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;