import { useState, useEffect } from 'react';

const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const [breakpoint, setBreakpoint] = useState('sm');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });

      // Tailwind breakpoints
      if (width >= 1536) {
        setBreakpoint('2xl');
      } else if (width >= 1280) {
        setBreakpoint('xl');
      } else if (width >= 1024) {
        setBreakpoint('lg');
      } else if (width >= 768) {
        setBreakpoint('md');
      } else if (width >= 640) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    // Initial call
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return {
    screenSize,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    // Utility functions
    isBreakpoint: (bp) => breakpoint === bp,
    isMinBreakpoint: (bp) => {
      const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = breakpoints?.indexOf(breakpoint);
      const targetIndex = breakpoints?.indexOf(bp);
      return currentIndex >= targetIndex;
    },
    isMaxBreakpoint: (bp) => {
      const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = breakpoints?.indexOf(breakpoint);
      const targetIndex = breakpoints?.indexOf(bp);
      return currentIndex <= targetIndex;
    }
  };
};

export default useResponsive;