/**
 * Logger utilitaire avec niveaux et toggle dev/prod
 * 
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.debug('Debug info');    // Masqué en prod
 *   logger.info('Info message');   // Toujours visible
 *   logger.warn('Warning');        // Toujours visible
 *   logger.error('Error');         // Toujours visible
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Niveau de log : 'debug' en dev, 'info' en prod
const currentLevel = import.meta.env.DEV ? 'debug' : 'info';
const currentLevelNum = LOG_LEVELS[currentLevel] ?? LOG_LEVELS.info;

// Préfixe optionnel avec timestamp
const formatMessage = (level, messages) => {
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return [prefix, ...messages];
};

export const logger = {
  debug: (...args) => {
    if (LOG_LEVELS.debug >= currentLevelNum) {
      console.log(...formatMessage('debug', args));
    }
  },

  info: (...args) => {
    if (LOG_LEVELS.info >= currentLevelNum) {
      console.info(...formatMessage('info', args));
    }
  },

  warn: (...args) => {
    if (LOG_LEVELS.warn >= currentLevelNum) {
      console.warn(...formatMessage('warn', args));
    }
  },

  error: (...args) => {
    if (LOG_LEVELS.error >= currentLevelNum) {
      console.error(...formatMessage('error', args));
    }
  },

  // Group logging
  group: (label, fn) => {
    if (LOG_LEVELS.debug >= currentLevelNum) {
      console.group(`[${label}]`);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  },
};

// Export unique pour import simple
export default logger;
