import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConversationMetrics {
  totalConversations: number;
  inNegotiation: number;
  transferred: number;
  ended: number;
  products: number;
}

export function useConversationMetrics() {
  const [metrics, setMetrics] = useState<ConversationMetrics>({
    totalConversations: 0,
    inNegotiation: 0,
    transferred: 0,
    ended: 0,
    products: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar todas as conversas (não simulações)
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, closing_state, is_simulation')
        .eq('is_simulation', false);

      if (convError) {
        console.error('[useConversationMetrics] Error:', convError);
        return;
      }

      // Buscar produtos ativos
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      // Calcular métricas
      const total = conversations?.length || 0;
      const inNegotiation = conversations?.filter(c => {
        const state = c.closing_state as any;
        return state?.isClosing === true && !state?.conversationEnded;
      }).length || 0;
      
      const transferred = conversations?.filter(c => {
        const state = c.closing_state as any;
        return state?.hasOfferedWhatsApp === true;
      }).length || 0;
      
      const ended = conversations?.filter(c => {
        const state = c.closing_state as any;
        return state?.conversationEnded === true;
      }).length || 0;

      setMetrics({
        totalConversations: total,
        inNegotiation,
        transferred,
        ended,
        products: productCount || 0
      });
    } catch (err) {
      console.error('[useConversationMetrics] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refetch: fetchMetrics };
}
