//chat.tsx - Página PÚBLICA de chat para clientes finais
// Suporta vitrine com slug + tenant_id

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, MessageCircle, Loader2, ArrowLeft, ShoppingBag, Trash2, Mic, Square, X, Volume2, VolumeX } from 'lucide-react';
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
//import { SpeakButton, playMessageSpeech, stopMessageSpeech, cleanTextForSpeech } from '@/components/chat/SpeakButton';
import {
  SpeakButton,
  playMessageSpeech,
  playPreparedMessageSpeech,
  prepareMessageSpeech,
  stopMessageSpeech,
  cleanTextForSpeech
} from '@/components/chat/SpeakButton';

// Chave estável da preferência de áudio automático (padrão: ativado)
const AUTO_SPEAK_KEY = 'ania_auto_speak_enabled';


//const CATALOG_MARKER = '__CATALOG__';
//const CATALOG_REGEX = /\b(catálogo|catalogo|produtos?|opções|opcoes|cardápio|cardapio|o que (vocês|voces|tu) (vende|tem|oferec|têm|tens)|me mostra|quero ver|mostrar (os )?produtos|lista de produtos|disponíveis|disponiveis|o que tem (para|pra) vender)\b/i;
const CATALOG_MARKER = '__CATALOG__';
const FILTERED_CATALOG_PREFIX = '__CATALOG_FILTERED__:';

const FULL_CATALOG_REGEX = /\b(catálogo completo|catalogo completo|catálogo inteiro|catalogo inteiro|quero ver o catálogo|quero ver o catalogo|me mostra o catálogo|me mostra o catalogo|me mostre o catálogo|me mostre o catalogo|todos os produtos|toda a loja|ver tudo|quero ver tudo|quero ver todos|mostrar todos|mostre todos|lista completa|todos vocês produtos|todos os produtos que vocês têm|todos os produtos que voces tem)\b/i;
const FILTERED_CATALOG_REQUEST_REGEX = /\b(?:o\s+)?(catálogo|catalogo)\s+(desses|dos)\s+produtos\b|\b(quero ver|me mostra|me mostre)\s+(esses|os)\s+produtos\b/i;

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

  // Áudio automático da última resposta da ANIA (padrão: ativado; preferência persistida)
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SPEAK_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  // ID da última mensagem de bot que já recebeu reprodução automática (anti-duplicidade)
  const lastAutoSpokenMessageIdRef = useRef<string | null>(null);

  const handleToggleAutoSpeak = () => {
    setAutoSpeakEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(AUTO_SPEAK_KEY, String(next));
      } catch {
        // localStorage indisponível — mantém apenas em memória
      }
      if (!next) stopMessageSpeech();
      return next;
    });
  };

  // Reproduz automaticamente APENAS a última mensagem válida do bot,
  // uma única vez por mensagem. Ignora catálogo e textos vazios após limpeza.
  useEffect(() => {
    if (!autoSpeakEnabled) return;

    const lastBotMessage = [...messages]
  .reverse()
  .find(
    (m) =>
      m.sender === 'bot' &&
      m.content !== CATALOG_MARKER &&
      !m.content.startsWith(FILTERED_CATALOG_PREFIX)
  );
    
    if (!lastBotMessage) return;
    if (lastAutoSpokenMessageIdRef.current === lastBotMessage.id) return;
    if (!cleanTextForSpeech(lastBotMessage.content)) return;

    // Marca ANTES de falar para que re-renderizações não disparem de novo
    lastAutoSpokenMessageIdRef.current = lastBotMessage.id;
    void playMessageSpeech(lastBotMessage.id, lastBotMessage.content, {
      voice: config?.assistant_voice,
      instructions: config?.assistant_voice_style,
      speed: config?.assistant_voice_speed,
    });
  }, [messages, autoSpeakEnabled, config?.assistant_voice, config?.assistant_voice_style, config?.assistant_voice_speed]);

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
    // A abertura do atendimento mostra somente a saudação.
    // O catálogo nunca é exibido automaticamente.
    await addMessage(getWelcomeMessage(false), 'bot', 'Boas-vindas');

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
      // Interrompe qualquer áudio em reprodução e reseta o controle de auto-fala,
      // permitindo que a nova mensagem de boas-vindas seja tratada como nova resposta
      stopMessageSpeech();
      lastAutoSpokenMessageIdRef.current = null;
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

// Pedido explícito do catálogo completo.
// Não mostramos todos os produtos dentro do chat.
// Levamos o cliente para a vitrine, onde o catálogo completo já existe.
if (!contextProduct && FULL_CATALOG_REGEX.test(trimmedInput)) {
  const catalogLink = vitrineLink;

  await addMessage(
    `Claro! 🛍️ Você pode ver todos os nossos produtos diretamente na vitrine.\n\n👉 [Ver todos os produtos](${catalogLink})`,
    'bot',
    'Catálogo'
  );

  setIsTyping(false);
  inputRef.current?.focus();
  return;
}
