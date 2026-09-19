// useNiches.ts - Nichos de produtos (tabela public.niches)
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Niche {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  display_order: number;
}

export function useNiches() {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNiches = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('niches')
      .select('id, slug, name, icon, color, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[useNiches] Erro ao buscar nichos:', error);
    }
    setNiches((data as Niche[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNiches();
  }, [fetchNiches]);

  return { niches, loading, fetchNiches };
}
