CREATE TABLE public.niches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid,
  slug text NOT NULL,
  name text NOT NULL,
  icon text,
  color text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX niches_slug_tenant_idx ON public.niches (slug, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid));

GRANT SELECT ON public.niches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.niches TO authenticated;
GRANT ALL ON public.niches TO service_role;

ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active niches" ON public.niches FOR SELECT USING (is_active = true);
CREATE POLICY "Tenants can manage own niches" ON public.niches FOR ALL USING ((tenant_id = auth.uid()) OR (tenant_id IS NULL)) WITH CHECK ((tenant_id = auth.uid()) OR (tenant_id IS NULL));

CREATE TRIGGER update_niches_updated_at BEFORE UPDATE ON public.niches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.niches (slug, name, icon, color, display_order) VALUES
  ('saude', 'Saúde', 'Stethoscope', 'hsl(180, 60%, 45%)', 1),
  ('beleza', 'Beleza', 'Heart', 'hsl(340, 80%, 65%)', 2),
  ('financas', 'Finanças', 'Briefcase', 'hsl(210, 90%, 55%)', 3),
  ('tecnologia', 'Tecnologia', 'Smartphone', 'hsl(260, 80%, 60%)', 4),
  ('educacao', 'Educação', 'GraduationCap', 'hsl(45, 100%, 55%)', 5),
  ('atendimento', 'Atendimento', 'MessageCircle', 'hsl(190, 100%, 50%)', 6);

ALTER TABLE public.products ADD COLUMN niche_id uuid REFERENCES public.niches(id) ON DELETE SET NULL;
CREATE INDEX products_niche_id_idx ON public.products (niche_id);