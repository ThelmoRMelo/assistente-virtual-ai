import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessConfig {
  id: string;
  business_name: string | null;
  business_category: string | null;
  whatsapp_number: string | null;
  payment_link: string | null;
  sale_mode: 'consultiva' | 'vendedora' | 'fechamento_rapido';
  use_emojis: boolean;
  transfer_enabled: boolean;
  hero_title: string | null;
  hero_subtitle: string | null;
  footer_text: string | null;
  section_texts: Record<string, string> | null;
  hero_banner_url: string | null;
  assistant_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useBusinessConfig() {
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('business_config')
        .select('*')
        .limit(1)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          const { data: newConfig, error: insertError } = await supabase
            .from('business_config')
            .insert({ business_name: 'Minha Loja', sale_mode: 'vendedora' })
            .select()
            .single();
          if (insertError) throw insertError;
          setConfig(newConfig as BusinessConfig);
          return;
        }
        throw fetchError;
      }
      setConfig(data as BusinessConfig);
    } catch (err: any) {
      console.error('[useBusinessConfig] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (updates: Partial<BusinessConfig>) => {
    if (!config?.id) return;
    try {
      const { data, error: updateError } = await supabase
        .from('business_config')
        .update(updates as any)
        .eq('id', config.id)
        .select()
        .single();
      if (updateError) throw updateError;
      setConfig(data as BusinessConfig);
      return { success: true };
    } catch (err: any) {
      console.error('[useBusinessConfig] Update error:', err);
      return { success: false, error: err.message };
    }
  }, [config?.id]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  return { config, loading, error, updateConfig, refetch: fetchConfig };
}
