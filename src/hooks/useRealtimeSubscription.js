import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Custom hook for Supabase real-time subscriptions
 * @param {string} table - Table name to subscribe to
 * @param {Function} onInsert - Callback for INSERT events
 * @param {Function} onUpdate - Callback for UPDATE events
 * @param {Function} onDelete - Callback for DELETE events
 * @param {Object} filter - Optional filter for subscription (e.g., { column: 'company_id', value: companyId })
 * @param {boolean} enabled - Whether subscription is enabled (default: true)
 */
export const useRealtimeSubscription = ({
  table,
  onInsert,
  onUpdate,
  onDelete,
  filter = null,
  enabled = true
}) => {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!enabled || !table) {
      return;
    }

    // Create unique channel name
    const channelName = `realtime:${table}${filter ? `:${filter?.column}=${filter?.value}` : ''}`;

    // Create subscription channel
    let channel = supabase?.channel(channelName);

    // Build subscription query
    let subscription = channel?.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        ...(filter && { filter: `${filter?.column}=eq.${filter?.value}` })
      },
      (payload) => {

        switch (payload?.eventType) {
          case 'INSERT':
            if (onInsert) {
              onInsert(payload?.new);
            }
            break;
          case 'UPDATE':
            if (onUpdate) {
              onUpdate(payload?.new, payload?.old);
            }
            break;
          case 'DELETE':
            if (onDelete) {
              onDelete(payload?.old);
            }
            break;
          default:
            break;
        }
      }
    );

    // Subscribe to changes
    subscription?.subscribe((status) => {
    });

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      if (channelRef?.current) {
        supabase?.removeChannel(channelRef?.current);
        channelRef.current = null;
      }
    };
  }, [table, filter?.column, filter?.value, enabled, onInsert, onUpdate, onDelete]);

  return channelRef;
};