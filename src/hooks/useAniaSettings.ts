import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AniaSettings {
  id: string;
  tenant_id: string | null;
  assistant_name: string | null;
  welcome_message: string | null;
  company_description: string | null;
  global_instructions: string | null;
  human_support_whatsapp: string | null;
  human_support_url: string | null;
  support_email: string | null;
  pix_key: string | null;
  pix_receiver_name: string | null;
  pix_bank: string | null;
  sales_rules: string | null;
  fallback_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useAniaSettings() {
  const [settings, setSettings] = useState<AniaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await (supabase as any)
        .from('ania_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        const { data: created, error: insertError } = await (supabase as any)
          .from('ania_settings')
          .insert({ assistant_name: 'ANIA' })
          .select()
          .single();
        if (insertError) throw insertError;
        setSettings(created as AniaSettings);
      } else {
        setSettings(data as AniaSettings);
      }
    } catch (err: any) {
      console.error('[useAniaSettings]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<AniaSettings>) => {
      if (!settings?.id) return { success: false };
      try {
        const { data, error: updateError } = await (supabase as any)
          .from('ania_settings')
          .update(updates)
          .eq('id', settings.id)
          .select()
          .single();
        if (updateError) throw updateError;
        setSettings(data as AniaSettings);
        return { success: true };
      } catch (err: any) {
        console.error('[useAniaSettings] update', err);
        return { success: false, error: err.message };
      }
    },
    [settings?.id]
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, updateSettings, refetch: fetchSettings };
}
