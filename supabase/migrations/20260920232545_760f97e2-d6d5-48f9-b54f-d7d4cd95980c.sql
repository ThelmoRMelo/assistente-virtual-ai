ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS is_imported BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_platform TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_product_reviews_imported
  ON public.product_reviews (product_id, source_platform)
  WHERE is_imported = true;