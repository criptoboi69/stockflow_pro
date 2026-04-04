/**
 * Safe LocalStorage wrapper avec try/catch et fallback
 * 
 * Usage:
 *   import { safeStorage } from '@/utils/safeStorage';
 *   
 *   safeStorage.set('key', { data: 'value' });
 *   const value = safeStorage.get('key', { default: 'fallback' });
 *   safeStorage.remove('key');
 *   safeStorage.clear();
 */

const safeStorage = {
  /**
   * Lire une valeur depuis localStorage
   * @param {string} key - Clé de stockage
   * @param {*} fallback - Valeur de retour si erreur/clé absente
   * @returns {*} La valeur parsée ou fallback
   */
  get: (key, fallback = null) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined) {
        return fallback;
      }
      // Tenter de parser comme JSON
      try {
        return JSON.parse(item);
      } catch {
        // Si pas du JSON, retourner la chaîne brute
        return item;
      }
    } catch (error) {
      console.warn('[safeStorage.get] Error reading key:', key, error);
      return fallback;
    }
  },

  /**
   * Écrire une valeur dans localStorage
   * @param {string} key - Clé de stockage
   * @param {*} value - Valeur à stocker (sera stringifiée)
   * @returns {boolean} true si succès, false si erreur
   */
  set: (key, value) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error('[safeStorage.set] Error writing key:', key, error);
      return false;
    }
  },

  /**
   * Supprimer une clé du localStorage
   * @param {string} key - Clé à supprimer
   * @returns {boolean} true si succès, false si erreur
   */
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('[safeStorage.remove] Error removing key:', key, error);
      return false;
    }
  },

  /**
   * Vider le localStorage
   * @returns {boolean} true si succès, false si erreur
   */
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('[safeStorage.clear] Error clearing storage', error);
      return false;
    }
  },

  /**
   * Vérifier si une clé existe
   * @param {string} key - Clé à vérifier
   * @returns {boolean} true si la clé existe
   */
  has: (key) => {
    try {
      return localStorage.hasOwnProperty(key);
    } catch {
      return false;
    }
  },

  /**
   * Obtenir toutes les clés
   * @returns {string[]} Tableau des clés
   */
  keys: () => {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  },
};

export default safeStorage;
export { safeStorage };
