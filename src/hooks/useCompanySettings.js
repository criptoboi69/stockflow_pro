import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import settingsService from '../services/settingsService';

const defaultSettings = {
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
  showPrices: true
};

export const useCompanySettings = () => {
  const { currentCompany } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      if (currentCompany?.id) {
        const { data } = await settingsService.getCompanySettings(currentCompany.id);
        if (data?.general) {
          const merged = { ...defaultSettings, ...data.general };
          setSettings(merged);
          localStorage.setItem('generalSettings', JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('settingsChanged', { detail: merged }));
          return;
        }
      }
      const saved = localStorage.getItem('generalSettings');
      if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      else setSettings(defaultSettings);
    } catch (error) {
      console.error('Error loading company settings:', error);
      const saved = localStorage.getItem('generalSettings');
      if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      else setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [currentCompany?.id]);

  useEffect(() => {
    const onChanged = (e) => {
      if (e?.detail) setSettings((prev) => ({ ...prev, ...e.detail }));
      else loadSettings();
    };
    window.addEventListener('settingsChanged', onChanged);
    return () => window.removeEventListener('settingsChanged', onChanged);
  }, [currentCompany?.id]);

  return { settings, loading, reloadSettings: loadSettings };
};

export default useCompanySettings;
