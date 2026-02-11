import React from 'react';
import { cn } from '../utils/cn';

const ResponsiveGrid = ({ 
  children, 
  className = '', 
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }, // Default responsive columns
  gap = 'default', // 'sm' | 'default' | 'lg'
  ...props 
}) => {
  const getGapClasses = () => {
    switch (gap) {
      case 'sm':
        return 'gap-2 sm:gap-3 lg:gap-4';
      case 'lg':
        return 'gap-6 sm:gap-8 lg:gap-10';
      default:
        return 'gap-4 sm:gap-6';
    }
  };

  const getColumnClasses = () => {
    const { xs = 1, sm = 2, md = 3, lg = 4, xl = 4 } = cols;
    return `grid-cols-${xs} sm:grid-cols-${sm} md:grid-cols-${md} lg:grid-cols-${lg} xl:grid-cols-${xl}`;
  };

  return (
    <div 
      className={cn(
        'grid',
        getColumnClasses(),
        getGapClasses(),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;