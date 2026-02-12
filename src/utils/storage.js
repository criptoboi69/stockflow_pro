export const safeJsonParse = (value, fallback = null) => {
  if (!value || typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
};

export const getLocalStorageJson = (key, fallback = null) => {
  if (typeof window === 'undefined') return fallback;
  return safeJsonParse(window.localStorage.getItem(key), fallback);
};
