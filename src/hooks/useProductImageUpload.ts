// useProductImageUpload.ts - Upload de imagens para Supabase Storage
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BUCKET_NAME = 'product-images';

export function useProductImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Faz upload de um arquivo para o Supabase Storage
   * @param file Arquivo de imagem
   * @returns URL pública da imagem ou null em caso de erro
   */
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      setProgress(0);

      // Validar tipo de arquivo
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Formato inválido. Use JPG, PNG, GIF ou WebP.');
        return null;
      }

      // Validar tamanho (máx 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Imagem muito grande. Máximo: 5MB');
        return null;
      }

      // Gerar nome único
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomStr}.${fileExt}`;

      setProgress(30);

      // Upload para Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[useProductImageUpload] Erro no upload:', uploadError);
        toast.error('Erro ao fazer upload da imagem');
        return null;
      }

      setProgress(70);

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      setProgress(100);

      console.log('[useProductImageUpload] Upload concluído:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (err) {
      console.error('[useProductImageUpload] Erro inesperado:', err);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  /**
   * Deleta uma imagem do Storage
   * @param imageUrl URL pública da imagem
   */
  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      // Extrair o nome do arquivo da URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      if (!fileName) {
        console.warn('[useProductImageUpload] Nome do arquivo não encontrado');
        return false;
      }

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        console.error('[useProductImageUpload] Erro ao deletar:', error);
        return false;
      }

      console.log('[useProductImageUpload] Imagem deletada:', fileName);
      return true;
    } catch (err) {
      console.error('[useProductImageUpload] Erro inesperado:', err);
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
    progress
  };
}
