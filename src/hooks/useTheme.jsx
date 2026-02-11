import { useState, useEffect, createContext, useContext } from 'react';

// Create Theme Context
const ThemeContext = createContext();

// Theme Provider Hook
export const useThemeProvider = () => {
  const [theme, setTheme] = useState('light');
  const [systemPreference, setSystemPreference] = useState('light');

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPreference(mediaQuery?.matches ? 'dark' : 'light');

    // Listen for system preference changes
    const handleChange = (e) => {
      setSystemPreference(e?.matches ? 'dark' : 'light');
    };
    
    mediaQuery?.addEventListener('change', handleChange);

    // Load saved theme from localStorage or user preferences
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        const savedTheme = preferences?.interface?.theme || 'light';
        setTheme(savedTheme);
        applyTheme(savedTheme, mediaQuery?.matches ? 'dark' : 'light');
      } catch (error) {
        console.error('Error loading theme preference:', error);
        setTheme('light');
        applyTheme('light', 'light');
      }
    } else {
      // Default to light theme if no preferences saved
      setTheme('light');
      applyTheme('light', 'light');
    }

    return () => mediaQuery?.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Apply theme when theme or system preference changes
    applyTheme(theme, systemPreference);
  }, [theme, systemPreference]);

  const applyTheme = (currentTheme, systemPref) => {
    const html = document.documentElement;
    
    // Remove all theme classes
    html?.classList?.remove('light', 'dark');
    
    // Apply appropriate theme
    let effectiveTheme = currentTheme;
    if (currentTheme === 'auto') {
      effectiveTheme = systemPref;
    }
    
    html?.classList?.add(effectiveTheme);
    
    // Set data attribute for additional styling hooks
    html?.setAttribute('data-theme', effectiveTheme);
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    
    // Update localStorage with new theme preference
    try {
      const savedPreferences = localStorage.getItem('userPreferences');
      const preferences = savedPreferences ? JSON.parse(savedPreferences) : {};
      
      const updatedPreferences = {
        ...preferences,
        interface: {
          ...preferences?.interface,
          theme: newTheme
        }
      };
      
      localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const getCurrentTheme = () => {
    if (theme === 'auto') {
      return systemPreference;
    }
    return theme;
  };

  const isDark = () => {
    return getCurrentTheme() === 'dark';
  };

  const isLight = () => {
    return getCurrentTheme() === 'light';
  };

  return {
    theme,
    systemPreference,
    changeTheme,
    getCurrentTheme,
    isDark,
    isLight,
    effectiveTheme: getCurrentTheme()
  };
};

// Hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const themeValue = useThemeProvider();
  
  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };