ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS source_platform text,
  ADD COLUMN IF NOT EXISTS external_product_id text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS affiliate_url text,
  ADD COLUMN IF NOT EXISTS imported_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_products_source_external
  ON public.products (source_platform, external_product_id)
  WHERE external_product_id IS NOT NULL;