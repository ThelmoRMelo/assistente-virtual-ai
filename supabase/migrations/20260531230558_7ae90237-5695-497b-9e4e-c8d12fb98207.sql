-- Reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tenant_id UUID,
  customer_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_reply TEXT,
  admin_reply_at TIMESTAMPTZ,
  ania_reply TEXT,
  ania_reply_at TIMESTAMPTZ,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_reported BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_status ON public.product_reviews(status);
CREATE INDEX idx_product_reviews_tenant ON public.product_reviews(tenant_id);

GRANT SELECT, INSERT ON public.product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can view only approved reviews
CREATE POLICY "Public can view approved reviews"
ON public.product_reviews FOR SELECT
USING (status = 'approved');

-- Tenants can see all reviews on own products (or untenanted)
CREATE POLICY "Tenants can view own reviews"
ON public.product_reviews FOR SELECT
USING (tenant_id = auth.uid() OR tenant_id IS NULL);

-- Public can insert pending reviews only
CREATE POLICY "Public can submit pending reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (status = 'pending');

-- Tenants can update/delete their own
CREATE POLICY "Tenants can update own reviews"
ON public.product_reviews FOR UPDATE
USING (tenant_id = auth.uid() OR tenant_id IS NULL)
WITH CHECK (tenant_id = auth.uid() OR tenant_id IS NULL);

CREATE POLICY "Tenants can delete own reviews"
ON public.product_reviews FOR DELETE
USING (tenant_id = auth.uid() OR tenant_id IS NULL);

-- updated_at trigger
CREATE TRIGGER trg_product_reviews_updated
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful votes table
CREATE TABLE public.review_helpful_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (review_id, voter_fingerprint)
);

CREATE INDEX idx_helpful_votes_review ON public.review_helpful_votes(review_id);

GRANT SELECT, INSERT ON public.review_helpful_votes TO anon;
GRANT SELECT, INSERT, DELETE ON public.review_helpful_votes TO authenticated;
GRANT ALL ON public.review_helpful_votes TO service_role;

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view helpful votes"
ON public.review_helpful_votes FOR SELECT USING (true);

CREATE POLICY "Public can register helpful votes"
ON public.review_helpful_votes FOR INSERT WITH CHECK (true);

-- Function to increment helpful_count atomically
CREATE OR REPLACE FUNCTION public.register_review_helpful(_review_id UUID, _fingerprint TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted BOOLEAN := false;
BEGIN
  INSERT INTO public.review_helpful_votes (review_id, voter_fingerprint)
  VALUES (_review_id, _fingerprint)
  ON CONFLICT (review_id, voter_fingerprint) DO NOTHING;

  IF FOUND THEN
    UPDATE public.product_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = _review_id;
    v_inserted := true;
  END IF;

  RETURN v_inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_review_helpful(UUID, TEXT) TO anon, authenticated;