
ALTER TABLE public.business_config
  ADD COLUMN IF NOT EXISTS hero_title_size integer DEFAULT 36,
  ADD COLUMN IF NOT EXISTS hero_subtitle_size integer DEFAULT 18,
  ADD COLUMN IF NOT EXISTS assistant_position_axis text DEFAULT 'vertical',
  ADD COLUMN IF NOT EXISTS assistant_position_value integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assistant_size integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS show_assistant_bubble boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS assistant_bubble_text text DEFAULT 'Olá! Precisa de ajuda?',
  ADD COLUMN IF NOT EXISTS hero_button_text text DEFAULT 'Falar com a ANIA',
  ADD COLUMN IF NOT EXISTS hero_button_glow integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS hero_button_radius integer DEFAULT 12,
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS title_color text,
  ADD COLUMN IF NOT EXISTS text_color text,
  ADD COLUMN IF NOT EXISTS button_color text,
  ADD COLUMN IF NOT EXISTS accent_color text;
