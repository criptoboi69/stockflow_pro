import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import stockMovementService from '../services/stockMovementService';
import productService from '../services/productService';
import safeStorage from '../utils/safeStorage';
import { mapMovementToNotification, mapProductToNotification } from '../utils/uiMappers';

const STORAGE_KEY = 'notification_read_ids';
const MAX_NOTIFICATIONS = 20;

/**
 * Hook pour gérer les notifications de l'application
 * @returns {Object} notifications, unreadCount, markAsRead, markAllAsRead, refresh
 */
export const useNotifications = () => {
  const { currentCompany } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get read notification IDs from localStorage
  const getReadIds = useCallback(() => {
    return new Set(safeStorage.get(STORAGE_KEY, []));
  }, []);

  // Save read notification IDs to localStorage
  const saveReadIds = useCallback((ids) => {
    safeStorage.set(STORAGE_KEY, Array.from(ids));
  }, []);

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    if (!currentCompany?.id) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const readIds = getReadIds();
      const allNotifications = [];

      // Fetch recent stock movements
      try {
        const movements = await stockMovementService.getStockMovements(currentCompany.id);

        const movementNotifications = (movements || []).slice(0, 10).map((movement) => ({
          ...mapMovementToNotification(movement),
          read: readIds.has(`movement_${movement?.id}`),
          onClick: () => {
            localStorage.setItem('openMovementModal', movement?.id);
            window.location.href = `/stock-movements`;
          }
        }));

        allNotifications.push(...movementNotifications);
      } catch (err) {
        // Keep notifications resilient: movements failure should not block stock alerts.
      }

      // Fetch low stock alerts
      try {
        const products = await productService.getProducts(currentCompany.id);
        
        const lowStockProducts = (products || [])
          .filter((product) => (
            product?.status === 'low_stock' ||
            product?.status === 'out_of_stock' ||
            Number(product?.quantity || 0) <= Number(product?.minStock || 0)
          ))
          .slice(0, 10)
          .map((product) => ({
            ...mapProductToNotification(product),
            read: readIds.has(`alert_${product?.id}`),
            onClick: () => {
              localStorage.setItem('openProductModal', product?.id);
              window.location.href = `/products`;
            }
          }));

        allNotifications.push(...lowStockProducts);
      } catch (err) {
        // Keep notifications resilient: product alerts failure should not block movement notifications.
      }

      // Sort by timestamp (newest first)
      allNotifications.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      // Limit to MAX_NOTIFICATIONS
      setNotifications(allNotifications.slice(0, MAX_NOTIFICATIONS));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id, getReadIds]);

  // Mark a notification as read
  const markAsRead = useCallback((notificationId) => {
    const readIds = getReadIds();
    readIds.add(notificationId);
    saveReadIds(readIds);
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, [getReadIds, saveReadIds]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    const readIds = getReadIds();
    notifications.forEach(n => readIds.add(n.id));
    saveReadIds(readIds);
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [notifications, getReadIds, saveReadIds]);

  // Clear read notifications (optional cleanup)
  const clearReadNotifications = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    clearReadNotifications,
    refresh: fetchNotifications
  };
};

export default useNotifications;
