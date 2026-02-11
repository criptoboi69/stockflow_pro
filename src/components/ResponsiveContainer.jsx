import React from 'react';
import { cn } from '../utils/cn';

const ResponsiveContainer = ({ 
  children, 
  className = '', 
  variant = 'default', // 'default' | 'wide' | 'narrow' | 'full'
  padding = 'default', // 'none' | 'sm' | 'default' | 'lg'
  ...props 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'wide':
        return 'max-w-screen-2xl';
      case 'narrow':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-none';
      default:
        return 'max-w-screen-xl';
    }
  };

  const getPaddingClasses = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'px-2 sm:px-4 lg:px-6';
      case 'lg':
        return 'px-6 sm:px-8 lg:px-12';
      default:
        return 'px-4 sm:px-6 lg:px-8';
    }
  };

  return (
    <div 
      className={cn(
        'mx-auto w-full',
        getVariantClasses(),
        getPaddingClasses(),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;