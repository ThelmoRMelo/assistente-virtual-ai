-- Tabela para imagens adicionais de galeria do produto
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para buscas por produto
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

-- Habilitar RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (mesmas regras que products)
CREATE POLICY "Public can view product images"
ON public.product_images
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert product images"
ON public.product_images
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update product images"
ON public.product_images
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete product images"
ON public.product_images
FOR DELETE
USING (true);

-- Adicionar coluna has_gallery ao produto para ANIA saber
ALTER TABLE public.products ADD COLUMN has_gallery BOOLEAN NOT NULL DEFAULT false;

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_images;