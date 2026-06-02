import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ClickType = 'saber_mais' | 'adquirir';

export async function trackProductClick(
  productId: string,
  clickType: ClickType,
  tenantId?: string | null
) {
  try {
    await supabase.from('product_click_events').insert({
      product_id: productId,
      click_type: clickType,
      tenant_id: tenantId ?? null,
    });
  } catch (err) {
    console.warn('[trackProductClick] failed:', err);
  }
}

export interface ClickMetrics {
  saberMais: number;
  adquirir: number;
  total: number;
}

export function useProductClickMetrics(productId?: string) {
  const [metrics, setMetrics] = useState<ClickMetrics>({ saberMais: 0, adquirir: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('product_click_events').select('click_type');
    if (productId) q = q.eq('product_id', productId);
    const { data } = await q;
    if (data) {
      const saberMais = data.filter((r: any) => r.click_type === 'saber_mais').length;
      const adquirir = data.filter((r: any) => r.click_type === 'adquirir').length;
      setMetrics({ saberMais, adquirir, total: saberMais + adquirir });
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { metrics, loading, refetch: fetch };
}
