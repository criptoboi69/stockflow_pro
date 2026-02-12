import { getLocalStorageJson } from './storage';

export const getStoredLanguage = () => {
  if (typeof window === 'undefined') return 'fr';

  const explicit = localStorage.getItem('currentLanguage') || localStorage.getItem('language');
  if (explicit) return explicit;

  const generalSettings = getLocalStorageJson('generalSettings', {});
  return generalSettings?.defaultLanguage || 'fr';
};

export const persistLanguage = (language) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('currentLanguage', language);
  localStorage.setItem('language', language);
};
