
// Chat.tsx - Página PÚBLICA de chat para clientes finais
// Suporta vitrine com slug + tenant_id

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, MessageCircle, Loader2, ArrowLeft, ShoppingBag, Trash2, Mic, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { useApp } from '@/contexts/AppContext';
import { useConversation } from '@/hooks/useConversation';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { supabase } from '@/integrations/supabase/client';
import { usePWABlocker } from '@/hooks/usePWABlocker';
import { toast } from 'sonner';
import { ProductGalleryViewer, ProductGalleryPreview } from '@/components/ProductGalleryViewer';
import { CatalogCards } from '@/components/chat/CatalogCards';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { SpeakButton } from '@/components/chat/SpeakButton';


const CATALOG_MARKER = '__CATALOG__';
const CATALOG_REGEX = /\b(catálogo|catalogo|produtos?|opções|opcoes|cardápio|cardapio|o que (vocês|voces|tu) (vende|tem|oferec|têm|tens)|me mostra|quero ver|mostrar (os )?produtos|lista de produtos|disponíveis|disponiveis|o que tem (para|pra) vender)\b/i;


interface SupabaseProduct {
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
  tenant_id: string | null;
  has_gallery: boolean;
}

interface StorefrontData {
  tenant_id: string;
  slug: string;
}

export default function Chat() {
  // Block PWA install prompts on this public route
  usePWABlocker();
  
  const { productId, slug } = useParams<{ productId?: string; slug?: string }>();
  const { business } = useApp();
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const { config } = useBusinessConfig(storefront?.tenant_id ?? (slug ? null : undefined));
  
  const {
    conversationId,
    messages,
    negotiation,
    closing,
    loading: conversationLoading,
    lastBotResponse,
    addMessage,
    updateNegotiation,
    updateClosing,
    clearConversation
  } = useConversation(productId, false);
  
  const [isClearing, setIsClearing] = useState(false);
  
  const [supabaseProducts, setSupabaseProducts] = useState<SupabaseProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Tracks which conversationId has already been initialized (welcome + catalog inserted).
  // Using a ref + per-conversation key prevents duplicate inserts caused by
  // re-renders, async timing of addMessage, or multiple effect runs after clearing.
  const initializedConvRef = useRef<string | null>(null);
  const isInitializingRef = useRef(false);

  // Gravação de voz -> transcrição preenche o campo de texto (usuário revisa e envia)
  const voice = useVoiceRecorder({
    onTranscript: (text) => {
      setInputValue((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      inputRef.current?.focus();
    },
    onError: (message) => toast.error(message),
  });
  const formatTimer = (total: number) =>
    `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

  const [tenantConfig, setTenantConfig] = useState<{ business_name?: string; business_category?: string } | null>(null);
  
  // Gallery state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  // Buscar produtos do Supabase com suporte a tenant
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let tenantId: string | null = null;

        // Se tem slug, buscar o tenant_id pelo storefront
        if (slug) {
          const { data: sfData } = await supabase
            .from('storefronts')
            .select('tenant_id, slug')
            .eq('slug', slug)
            .eq('is_active', true)
            .single();
          
          if (sfData) {
            setStorefront(sfData);
            tenantId = sfData.tenant_id;

            // Buscar config do tenant
            const { data: configData } = await supabase
              .from('business_config')
              .select('business_name, business_category')
              .eq('tenant_id', tenantId)
              .single();
            
            if (configData) {
              setTenantConfig(configData);
            }
          }
        }

        // Buscar produtos
        let query = supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });
        
        if (tenantId) {
          query = query.eq('tenant_id', tenantId);
        }

        const { data } = await query;
        setSupabaseProducts(data || []);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [slug]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const contextProduct = productId 
    ? supabaseProducts.find(p => p.id === productId)
    : null;

  // Buscar imagens da galeria quando o produto tem galeria
  useEffect(() => {
    const fetchGalleryImages = async () => {
      if (!contextProduct?.has_gallery || !productId) {
        setGalleryImages([]);
        return;
      }

      const { data } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      setGalleryImages(data?.map(img => img.image_url) || []);
    };

    fetchGalleryImages();
  }, [contextProduct?.has_gallery, productId]);

  // Handler para abrir galeria
  const handleOpenGallery = (index: number) => {
    setGalleryInitialIndex(index);
    setGalleryOpen(true);
  };

  // Gerar mensagem de boas-vindas baseada no contexto
  const getWelcomeMessage = useCallback((isNewSession: boolean = false) => {
    if (contextProduct) {
      const price = Number(contextProduct.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      if (isNewSession) {
        return `✨ **Novo atendimento iniciado!**\n\nOlá! 👋 Agora estou focada em te ajudar com o **${contextProduct.name}**! O valor é ${price}. Em que posso ajudar?`;
      }
      return `Olá! 👋 Você está interessado no **${contextProduct.name}**! O valor é ${price}. Posso te ajudar?`;
    } else if (supabaseProducts.length > 0) {
      if (isNewSession) {
        return `✨ **Novo atendimento iniciado!**\n\nOlá! 👋 Bem-vindo${business.nome ? ` à ${business.nome}` : ''}! Temos ${supabaseProducts.length} produto(s) disponíveis. Como posso ajudar?`;
      }
      return `Olá! 👋 Bem-vindo${business.nome ? ` à ${business.nome}` : ''}! Temos ${supabaseProducts.length} produto(s). Como posso ajudar?`;
    }
    return isNewSession 
      ? `✨ **Novo atendimento iniciado!**\n\nOlá! 👋 Como posso te ajudar hoje?`
      : `Olá! 👋 Como posso te ajudar hoje?`;
  }, [contextProduct, supabaseProducts, business.nome]);

  // Mensagem inicial — protegida contra duplicidade via ref por conversationId
  useEffect(() => {
    if (conversationLoading || loadingProducts) return;
    if (!conversationId) return;
    if (initializedConvRef.current === conversationId) return;
    if (isInitializingRef.current) return;

    // Se já existem mensagens nessa conversa, apenas marca como inicializada.
    if (messages.length > 0) {
      initializedConvRef.current = conversationId;
      return;
    }

    isInitializingRef.current = true;
    const convAtStart = conversationId;
    (async () => {
      try {
        await addMessage(getWelcomeMessage(false), 'bot', 'Boas-vindas');
        if (!contextProduct && supabaseProducts.length > 0) {
          await addMessage(CATALOG_MARKER, 'bot', 'Catálogo');
        }
        initializedConvRef.current = convAtStart;
      } finally {
        isInitializingRef.current = false;
      }
    })();
  }, [conversationId, conversationLoading, loadingProducts, messages.length, getWelcomeMessage, addMessage, contextProduct, supabaseProducts.length]);

  // Handler para limpar conversa e iniciar novo atendimento.
  // A inserção da boas-vindas + catálogo é feita pelo useEffect acima
  // assim que o novo conversationId for emitido — evita duplicação.
  const handleClearConversation = async () => {
    if (isClearing) return;

    setIsClearing(true);
    try {
      // Invalida o guard atual para permitir nova inicialização
      initializedConvRef.current = null;
      await clearConversation();
      toast.success('Novo atendimento iniciado!');
    } catch (err) {
      console.error('[Chat] Error clearing conversation:', err);
      toast.error('Erro ao iniciar novo atendimento');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isTyping) return;

    setInputValue('');
    setIsTyping(true);
    await addMessage(trimmedInput, 'user');

    // Vitrine mode: intercept catalog questions and reply with cards (no AI call needed)
    if (!contextProduct && CATALOG_REGEX.test(trimmedInput) && supabaseProducts.length > 0) {
      const intro = supabaseProducts.length === 1
        ? 'Temos atualmente este produto disponível. Toque abaixo para ver os detalhes 👇'
        : `Veja os ${supabaseProducts.length} produtos disponíveis. Toque em "Saber mais" para conversar sobre um deles 👇`;
      await addMessage(intro, 'bot', 'Catálogo');
      await addMessage(CATALOG_MARKER, 'bot', 'Catálogo');
      setIsTyping(false);
      inputRef.current?.focus();
      return;
    }

    try {
      const productsList = supabaseProducts.map(p => ({
        id: p.id,
        nome: p.name,
        preco: Number(p.price),
        descricao: p.short_description || p.long_description || '',
        precoMinimo: p.min_price_allowed,
        formasPagamento: p.payment_methods || [],
        infoEntrega: p.delivery_info || ''
      }));

      const productContext = contextProduct ? {
        id: contextProduct.id,
        nome: contextProduct.name,
        preco: contextProduct.price,
        descricao: contextProduct.long_description || contextProduct.short_description || '',
        categoria: contextProduct.category || '',
        precoMinimo: contextProduct.min_price_allowed,
        formasPagamento: contextProduct.payment_methods || [],
        infoEntrega: contextProduct.delivery_info || '',
        linkPagamento: contextProduct.payment_link || ''
      } : null;

      const recentHistory = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke('ai-fallback', {
        body: {
          message: trimmedInput,
          businessName: tenantConfig?.business_name || config?.business_name || business.nome || 'Loja',
          businessCategory: tenantConfig?.business_category || config?.business_category || business.categoria || 'varejo',
          products: productsList,
          productContext,
          productId: contextProduct?.id || null,
          negotiationState: negotiation,
          conversationHistory: recentHistory,
          lastBotResponse,
          closingState: closing,
          paymentLink: config?.payment_link,
          whatsappNumber: config?.whatsapp_number,
          saleMode: config?.sale_mode || 'vendedora',
          tenantId: storefront?.tenant_id || null,
          mode: contextProduct ? 'product' : 'vitrine'
        }
      });

      if (error) {
        await addMessage('Hmm, tive um problema. Pode repetir?', 'bot', 'Erro');
      } else {
        const response = data?.response || 'Como posso ajudar?';
        await addMessage(response, 'bot', data?.closingUpdate?.isClosing ? 'Fechamento' : 'IA');

        if (data?.showCatalog && supabaseProducts.length > 0) {
          await addMessage(CATALOG_MARKER, 'bot', 'Catálogo');
        }

        if (data?.negotiationUpdate) await updateNegotiation(data.negotiationUpdate);
        if (data?.closingUpdate) await updateClosing(data.closingUpdate);
      }

    } catch (err) {
      await addMessage('Desculpe, tive um problema. Pode repetir?', 'bot', 'Erro');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };
