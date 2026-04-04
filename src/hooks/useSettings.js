import useCompanySettings from './useCompanySettings';

const useSettings = () => {
  const { settings, loading, reloadSettings } = useCompanySettings();

  const updateSettings = () => {
    console.warn('useSettings.updateSettings is deprecated. Use settings pages/services instead.');
  };

  const getSetting = (key) => settings?.[key];
  const getSettings = () => settings;

  return {
    settings,
    loading,
    reloadSettings,
    updateSettings,
    getSetting,
    getSettings
  };
};

export default useSettings;
