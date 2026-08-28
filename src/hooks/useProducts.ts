// useProducts.ts - Hook para CRUD de produtos no Supabase
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tipo do produto no Supabase (snake_case)
export interface SupabaseProduct {
  id: string;
  name: string;
  price: number;
  category: string | null;
  short_description: string | null;
  long_description: string | null;
  min_price_allowed: number | null;
  payment_methods: string[] | null;
  delivery_info: string | null;
  image_url: string | null;
  payment_link: string | null;
  active: boolean;
  has_gallery: boolean;
  is_featured: boolean;
  is_hero: boolean;
  show_on_products: boolean;
  created_at: string;
  updated_at: string;
}

// Tipo do produto na UI (camelCase - mantém compatibilidade)
export interface Product {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  descricaoCurta: string;
  descricaoDetalhada: string;
  precoMinimoPermitido: number | null;
  formasPagamento: string[];
  infoEntrega: string;
  imagemUrl: string;
  linkPagamento: string;
  ativo: boolean;
  hasGallery: boolean;
  isFeatured: boolean;
  isHero: boolean;
  showOnProducts: boolean;
  createdAt: string;
  updatedAt: string;
  // Legado (compatibilidade)
  palavrasChave?: string[];
  descricao?: string;
}

// Converter de Supabase para UI
function toUIProduct(p: SupabaseProduct): Product {
  return {
    id: p.id,
    nome: p.name,
    preco: Number(p.price),
    categoria: p.category || 'Produtos',
    descricaoCurta: p.short_description || '',
    descricaoDetalhada: p.long_description || '',
    precoMinimoPermitido: p.min_price_allowed,
    formasPagamento: p.payment_methods || [],
    infoEntrega: p.delivery_info || '',
    imagemUrl: p.image_url || '',
    linkPagamento: p.payment_link || '',
    ativo: p.active,
    hasGallery: p.has_gallery || false,
    isFeatured: p.is_featured ?? false,
    isHero: p.is_hero ?? false,
    showOnProducts: p.show_on_products ?? true,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    // Legado
    palavrasChave: [],
    descricao: p.short_description || '',
  };
}

// Converter de UI para Supabase (insert/update)
function toSupabaseProduct(p: Partial<Product>): Partial<SupabaseProduct> {
  const result: Partial<SupabaseProduct> = {};
  
  if (p.nome !== undefined) result.name = p.nome;
  if (p.preco !== undefined) result.price = Number(p.preco);
  if (p.categoria !== undefined) result.category = p.categoria;
  if (p.descricaoCurta !== undefined) result.short_description = p.descricaoCurta;
  if (p.descricaoDetalhada !== undefined) result.long_description = p.descricaoDetalhada;
  if (p.precoMinimoPermitido !== undefined) result.min_price_allowed = p.precoMinimoPermitido;
  if (p.formasPagamento !== undefined) result.payment_methods = p.formasPagamento;
  if (p.infoEntrega !== undefined) result.delivery_info = p.infoEntrega;
  if (p.imagemUrl !== undefined) result.image_url = p.imagemUrl;
  if (p.linkPagamento !== undefined) result.payment_link = p.linkPagamento;
  if (p.ativo !== undefined) result.active = p.ativo;
  if (p.hasGallery !== undefined) result.has_gallery = p.hasGallery;
  if (p.isFeatured !== undefined) result.is_featured = p.isFeatured;
  if (p.isHero !== undefined) result.is_hero = p.isHero;
  if (p.showOnProducts !== undefined) result.show_on_products = p.showOnProducts;

  return result;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar todos os produtos
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[useProducts] Erro ao buscar:', fetchError);
        setError(fetchError.message);
        return;
      }

      const uiProducts = (data || []).map(toUIProduct);
      setProducts(uiProducts);
    } catch (err) {
      console.error('[useProducts] Erro inesperado:', err);
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar ao montar
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('[useProducts] Realtime:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const newProduct = toUIProduct(payload.new as SupabaseProduct);
            setProducts(prev => [newProduct, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = toUIProduct(payload.new as SupabaseProduct);
            setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setProducts(prev => prev.filter(p => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Adicionar produto
  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const insertData = {
        name: product.nome,
        price: Number(product.preco),
        category: product.categoria || null,
        short_description: product.descricaoCurta || null,
        long_description: product.descricaoDetalhada || null,
        min_price_allowed: product.precoMinimoPermitido || null,
        payment_methods: product.formasPagamento || null,
        delivery_info: product.infoEntrega || null,
        image_url: product.imagemUrl || null,
        payment_link: product.linkPagamento || null,
        active: product.ativo ?? true,
        is_featured: product.isFeatured ?? false,
        is_hero: product.isHero ?? false,
        show_on_products: product.showOnProducts ?? true,
      };
      
      const { data, error: insertError } = await supabase
        .from('products')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        console.error('[useProducts] Erro ao adicionar:', insertError);
        toast.error('Erro ao salvar produto');
        return null;
      }

      console.log('[useProducts] Produto adicionado:', data);
      return toUIProduct(data);
    } catch (err) {
      console.error('[useProducts] Erro inesperado:', err);
      toast.error('Erro ao salvar produto');
      return null;
    }
  };

  // Atualizar produto
  const updateProduct = async (id: string, product: Partial<Product>) => {
    try {
      const supabaseData = toSupabaseProduct(product);
      
      const { data, error: updateError } = await supabase
        .from('products')
        .update(supabaseData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('[useProducts] Erro ao atualizar:', updateError);
        toast.error('Erro ao atualizar produto');
        return null;
      }

      console.log('[useProducts] Produto atualizado:', data);
      return toUIProduct(data);
    } catch (err) {
      console.error('[useProducts] Erro inesperado:', err);
      toast.error('Erro ao atualizar produto');
      return null;
    }
  };

  // Deletar produto
  const deleteProduct = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('[useProducts] Erro ao deletar:', deleteError);
        toast.error('Erro ao remover produto');
        return false;
      }

      console.log('[useProducts] Produto removido:', id);
      return true;
    } catch (err) {
      console.error('[useProducts] Erro inesperado:', err);
      toast.error('Erro ao remover produto');
      return false;
    }
  };

  // Fila por produto para evitar race conditions em cliques rápidos
  const queuesRef = useRef<Map<string, Promise<unknown>>>(new Map());
  const enqueue = useCallback((key: string, task: () => Promise<unknown>) => {
    const prev = queuesRef.current.get(key) ?? Promise.resolve();
    const next = prev.catch(() => {}).then(task);
    queuesRef.current.set(key, next);
    return next;
  }, []);

  // Toggle otimista de flags (destaque / nossos produtos)
  const toggleProductFlags = useCallback(
    (id: string, patch: Partial<Product>) => {
      let snapshot: Product | undefined;
      setProducts((prev) => {
        snapshot = prev.find((p) => p.id === id);
        return prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      });

      return enqueue(id, async () => {
        const supabaseData = toSupabaseProduct(patch);
        const { error: updateError } = await supabase
          .from('products')
          .update(supabaseData)
          .eq('id', id);

        if (updateError) {
          console.error('[useProducts] Erro ao atualizar flag:', updateError);
          if (snapshot) {
            const restore = snapshot;
            setProducts((prev) => prev.map((p) => (p.id === id ? restore : p)));
          }
          toast.error('Não foi possível salvar a alteração');
        }
      });
    },
    [enqueue],
  );

  // Definir produto Hero (apenas um por vez, marca também como destaque)
  const setHeroProduct = async (id: string) => {
    let snapshot: Product[] = [];
    setProducts((prev) => {
      snapshot = prev;
      return prev.map((p) =>
        p.id === id ? { ...p, isHero: true, isFeatured: true } : p.isHero ? { ...p, isHero: false } : p,
      );
    });

    return enqueue('hero', async () => {
      const { error: clearError } = await supabase
        .from('products')
        .update({ is_hero: false })
        .neq('id', id);
      const { error: updateError } = await supabase
        .from('products')
        .update({ is_hero: true, is_featured: true })
        .eq('id', id);
      if (clearError || updateError) {
        console.error('[useProducts] Erro ao definir hero:', clearError || updateError);
        setProducts(snapshot);
        toast.error('Não foi possível salvar a alteração');
        return false;
      }
      return true;
    });
  };

  const unsetHeroProduct = async (id: string) => {
    return await toggleProductFlags(id, { isHero: false });
  };


  // Apenas produtos ativos
  const activeProducts = products.filter(p => p.ativo);
  const inactiveProducts = products.filter(p => !p.ativo);

  return {
    products,
    activeProducts,
    inactiveProducts,
    loading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    setHeroProduct,
    unsetHeroProduct,
  };
}
