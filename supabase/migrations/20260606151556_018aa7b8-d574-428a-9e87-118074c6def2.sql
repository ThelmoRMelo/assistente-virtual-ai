
-- 1) Novos campos na business_config (Landing Page)
ALTER TABLE public.business_config
  ADD COLUMN IF NOT EXISTS hero_title text,
  ADD COLUMN IF NOT EXISTS hero_subtitle text,
  ADD COLUMN IF NOT EXISTS footer_text text,
  ADD COLUMN IF NOT EXISTS section_texts jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_banner_url text,
  ADD COLUMN IF NOT EXISTS assistant_image_url text;

-- 2) Tabela ania_settings
CREATE TABLE IF NOT EXISTS public.ania_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  assistant_name text DEFAULT 'ANIA',
  welcome_message text,
  company_description text,
  global_instructions text,
  human_support_whatsapp text,
  human_support_url text,
  support_email text,
  pix_key text,
  pix_receiver_name text,
  pix_bank text,
  sales_rules text,
  fallback_message text DEFAULT 'Essa informação não está cadastrada no sistema no momento.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ania_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ania_settings TO anon;
GRANT ALL ON public.ania_settings TO service_role;

ALTER TABLE public.ania_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view ania_settings"
  ON public.ania_settings FOR SELECT
  USING (true);

CREATE POLICY "Tenants can manage own ania_settings"
  ON public.ania_settings FOR ALL
  USING ((tenant_id = auth.uid()) OR (tenant_id IS NULL))
  WITH CHECK ((tenant_id = auth.uid()) OR (tenant_id IS NULL));

CREATE TRIGGER update_ania_settings_updated_at
  BEFORE UPDATE ON public.ania_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Linha padrão (modo demo)
INSERT INTO public.ania_settings (assistant_name, welcome_message, company_description)
SELECT 'ANIA',
       'Olá! 👋 Eu sou a ANIA, sua assistente virtual. Como posso te ajudar?',
       'A ANIA é uma assistente virtual especializada em apresentar produtos digitais e físicos cadastrados na Vitrine Digital.'
WHERE NOT EXISTS (SELECT 1 FROM public.ania_settings);
