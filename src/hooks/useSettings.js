import { useState, useEffect } from 'react';
import { getLocalStorageJson } from '../utils/storage';

const useSettings = () => {
  const [settings, setSettings] = useState({
    timezone: 'Europe/Brussels',
    dashboardVisibility: {
      totalProducts: true,
      stockAlerts: true,
      recentMovements: true,
      lowStockItems: true
    },
    digestTiming: '08:00',
    digestFrequency: 'daily',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'european',
    defaultLanguage: 'fr',
    showPrices: true  // New price display setting
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = getLocalStorageJson('generalSettings', null);
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, []);

  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('generalSettings', JSON.stringify(updatedSettings));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('settingsChanged'));
  };

  const getSetting = (key) => {
    return settings?.[key];
  };

  const getSettings = () => settings;

  return {
    settings,
    updateSettings,
    getSetting,
    getSettings
  };
};

export default useSettings;