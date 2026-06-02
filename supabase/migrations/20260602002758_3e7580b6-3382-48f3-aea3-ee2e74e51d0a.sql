
CREATE TABLE public.product_click_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  tenant_id UUID,
  click_type TEXT NOT NULL CHECK (click_type IN ('saber_mais', 'adquirir')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_click_events_product ON public.product_click_events(product_id);
CREATE INDEX idx_product_click_events_type ON public.product_click_events(click_type);

GRANT SELECT, INSERT ON public.product_click_events TO anon;
GRANT SELECT, INSERT ON public.product_click_events TO authenticated;
GRANT ALL ON public.product_click_events TO service_role;

ALTER TABLE public.product_click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can register clicks"
ON public.product_click_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can view clicks"
ON public.product_click_events FOR SELECT
USING (true);
