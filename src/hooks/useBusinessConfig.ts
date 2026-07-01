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
  hero_title_size: number | null;
  hero_subtitle_size: number | null;
  assistant_position_axis: 'horizontal' | 'vertical' | null;
  assistant_position_value: number | null;
  assistant_size: number | null;
  show_assistant_bubble: boolean | null;
  assistant_bubble_text: string | null;
  hero_button_text: string | null;
  hero_button_glow: number | null;
  hero_button_radius: number | null;
  primary_color: string | null;
  title_color: string | null;
  text_color: string | null;
  button_color: string | null;
  accent_color: string | null;
  // Splash screen
  splash_enabled?: boolean | null;
  splash_image_url?: string | null;
  splash_bg_type?: 'solid' | 'gradient' | null;
  splash_bg_color?: string | null;
  splash_bg_gradient_from?: string | null;
  splash_bg_gradient_to?: string | null;
  splash_duration_ms?: number | null;
  splash_animation?: boolean | null;
  // Chat appearance
  assistant_position?: 'left' | 'center' | 'right' | null;
  chat_wallpaper_url?: string | null;
  chat_wallpaper_opacity?: number | null;
  chat_wallpaper_blur?: 'none' | 'light' | 'medium' | 'strong' | null;
  chat_wallpaper_dim?: boolean | null;
  chat_wallpaper_fit?: 'cover' | 'contain' | 'center' | 'repeat' | null;
  chat_header_color?: string | null;
  chat_input_bg_color?: string | null;
  chat_send_button_color?: string | null;
  chat_ania_bubble_color?: string | null;
  chat_user_bubble_color?: string | null;
  chat_link_color?: string | null;
  chat_icon_color?: string | null;
  chat_catalog_card_color?: string | null;
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
