// useProductGallery.ts - Hook para gerenciar galeria de imagens do produto
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  displayOrder: number;
  createdAt: string;
}

interface SupabaseProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

function toUIImage(img: SupabaseProductImage): ProductImage {
  return {
    id: img.id,
    productId: img.product_id,
    imageUrl: img.image_url,
    displayOrder: img.display_order,
    createdAt: img.created_at,
  };
}

export function useProductGallery(productId: string | null) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar imagens da galeria
  const fetchImages = useCallback(async () => {
    if (!productId) {
      setImages([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('[useProductGallery] Erro ao buscar:', error);
        return;
      }

      setImages((data || []).map(toUIImage));
    } catch (err) {
      console.error('[useProductGallery] Erro inesperado:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Adicionar imagem à galeria
  const addImage = async (imageUrl: string, displayOrder?: number) => {
    if (!productId) return null;

    try {
      const order = displayOrder ?? images.length;
      
      const { data, error } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: imageUrl,
          display_order: order,
        })
        .select()
        .single();

      if (error) {
        console.error('[useProductGallery] Erro ao adicionar:', error);
        toast.error('Erro ao adicionar imagem');
        return null;
      }

      const newImage = toUIImage(data);
      setImages(prev => [...prev, newImage].sort((a, b) => a.displayOrder - b.displayOrder));
      
      // Atualizar flag has_gallery no produto
      await updateHasGalleryFlag(true);
      
      return newImage;
    } catch (err) {
      console.error('[useProductGallery] Erro inesperado:', err);
      toast.error('Erro ao adicionar imagem');
      return null;
    }
  };

  // Remover imagem da galeria
  const removeImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('[useProductGallery] Erro ao remover:', error);
        toast.error('Erro ao remover imagem');
        return false;
      }

      setImages(prev => {
        const newImages = prev.filter(img => img.id !== imageId);
        // Atualizar flag se não houver mais imagens
        if (newImages.length === 0) {
          updateHasGalleryFlag(false);
        }
        return newImages;
      });

      return true;
    } catch (err) {
      console.error('[useProductGallery] Erro inesperado:', err);
      toast.error('Erro ao remover imagem');
      return false;
    }
  };

  // Reordenar imagens
  const reorderImages = async (newOrder: ProductImage[]) => {
    try {
      const updates = newOrder.map((img, index) => ({
        id: img.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('product_images')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      setImages(newOrder.map((img, index) => ({ ...img, displayOrder: index })));
      return true;
    } catch (err) {
      console.error('[useProductGallery] Erro ao reordenar:', err);
      return false;
    }
  };

  // Atualizar flag has_gallery no produto
  const updateHasGalleryFlag = async (hasGallery: boolean) => {
    if (!productId) return;
    
    await supabase
      .from('products')
      .update({ has_gallery: hasGallery })
      .eq('id', productId);
  };

  // Salvar múltiplas imagens de uma vez (para formulário)
  const saveGallery = async (imageUrls: string[]) => {
    if (!productId) return false;

    try {
      // Deletar imagens existentes
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      // Inserir novas
      if (imageUrls.length > 0) {
        const inserts = imageUrls.map((url, index) => ({
          product_id: productId,
          image_url: url,
          display_order: index,
        }));

        const { error } = await supabase
          .from('product_images')
          .insert(inserts);

        if (error) {
          console.error('[useProductGallery] Erro ao salvar galeria:', error);
          toast.error('Erro ao salvar galeria');
          return false;
        }
      }

      // Atualizar flag
      await updateHasGalleryFlag(imageUrls.length > 0);

      // Recarregar
      await fetchImages();
      return true;
    } catch (err) {
      console.error('[useProductGallery] Erro inesperado:', err);
      return false;
    }
  };

  return {
    images,
    loading,
    addImage,
    removeImage,
    reorderImages,
    saveGallery,
    fetchImages,
  };
}
