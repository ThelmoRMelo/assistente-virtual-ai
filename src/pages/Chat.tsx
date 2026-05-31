// Chat.tsx - Página PÚBLICA de chat para clientes finais
// Suporta vitrine com slug + tenant_id

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, MessageCircle, Loader2, ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
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
import { ReviewsSection } from '@/components/reviews/ReviewsSection';

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
  const { config } = useBusinessConfig();
  
  const {
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
  const [hasInitialized, setHasInitialized] = useState(false);
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
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

  // Mensagem inicial
  useEffect(() => {
    if (hasInitialized || conversationLoading || loadingProducts) return;
    if (messages.length > 0) {
      setHasInitialized(true);
      return;
    }
    
    addMessage(getWelcomeMessage(false), 'bot', 'Boas-vindas');
    setHasInitialized(true);
  }, [hasInitialized, conversationLoading, loadingProducts, messages.length, getWelcomeMessage, addMessage]);

  // Handler para limpar conversa e iniciar novo atendimento
  const handleClearConversation = async () => {
    if (isClearing) return;
    
    setIsClearing(true);
    try {
      const newConvId = await clearConversation();
      if (newConvId) {
        setHasInitialized(false);
        // Aguardar um tick para o estado atualizar, depois adicionar mensagem de boas-vindas
        setTimeout(async () => {
          await addMessage(getWelcomeMessage(true), 'bot', 'Novo Atendimento');
          setHasInitialized(true);
          toast.success('Novo atendimento iniciado!');
        }, 100);
      }
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
          tenantId: storefront?.tenant_id || null
        }
      });

      if (error) {
        await addMessage('Hmm, tive um problema. Pode repetir?', 'bot', 'Erro');
      } else {
        const response = data?.response || 'Como posso ajudar?';
        await addMessage(response, 'bot', data?.closingUpdate?.isClosing ? 'Fechamento' : 'IA');

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

  if (loadingProducts || conversationLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  const storeName = tenantConfig?.business_name || config?.business_name || business.nome || 'Assistente';
  const vitrineLink = slug ? `/loja/${slug}` : '/vitrine';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(230 30% 12%) 100%)' }}>
      {/* Header - mantido igual, apenas ajuste de cor */}
      <header className="bg-card/95 backdrop-blur-md border-b border-border/30 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        {/* Botão voltar para vitrine */}
        <Link to={vitrineLink} className="p-2 hover:bg-muted/50 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        {contextProduct?.image_url ? (
          <img src={contextProduct.image_url} alt={contextProduct.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">{contextProduct?.name || storeName}</h1>
          <p className="text-xs text-muted-foreground">{isTyping ? 'Digitando...' : 'Online'}</p>
        </div>
        
        {/* Botão limpar conversa */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearConversation}
          disabled={isClearing || isTyping}
          className="hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="Iniciar novo atendimento"
        >
          {isClearing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </Button>
        
        {/* Link para ver produtos */}
        <Link to={vitrineLink} className="p-2 hover:bg-muted/50 rounded-full transition-colors">
          <ShoppingBag className="w-5 h-5 text-muted-foreground" />
        </Link>
      </header>

      {/* Chat area - estilo WhatsApp */}
      <main className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {/* Galeria de imagens do produto - exibida quando há galeria */}
        {contextProduct?.image_url && (contextProduct.has_gallery && galleryImages.length > 0) && (
          <div className="mb-4">
            <ProductGalleryPreview
              coverImage={contextProduct.image_url}
              galleryImages={galleryImages}
              productName={contextProduct.name}
              onOpenGallery={handleOpenGallery}
            />
          </div>
        )}

        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`} 
            style={{ animationDelay: `${index * 20}ms` }}
          >
            <div 
              className={`max-w-[80%] relative px-3 py-2 shadow-sm ${
                message.sender === 'user' 
                  ? 'bg-[#005c4b] text-white rounded-2xl rounded-tr-md' 
                  : 'bg-card text-foreground rounded-2xl rounded-tl-md border border-border/20'
              }`}
            >
              {/* Tail da bolha estilo WhatsApp */}
              <div 
                className={`absolute top-0 w-3 h-3 ${
                  message.sender === 'user' 
                    ? '-right-1.5 bg-[#005c4b]' 
                    : '-left-1.5 bg-card border-l border-t border-border/20'
                }`}
                style={{
                  clipPath: message.sender === 'user' 
                    ? 'polygon(0 0, 100% 0, 0 100%)' 
                    : 'polygon(100% 0, 100% 100%, 0 0)'
                }}
              />
              
              <div className="text-[15px] leading-relaxed">
                <MarkdownMessage content={message.content} />
              </div>
              <span className={`text-[10px] mt-1 block text-right ${
                message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
              }`}>
                {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-slide-up">
            <div className="bg-card border border-border/20 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm relative">
              <div 
                className="absolute top-0 -left-1.5 w-3 h-3 bg-card border-l border-t border-border/20"
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
              />
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {/* Avaliações do produto */}
        {contextProduct && (
          <div className="pt-4">
            <ReviewsSection productId={contextProduct.id} tenantId={contextProduct.tenant_id} />
          </div>
        )}
      </main>

      {/* Footer - input estilo WhatsApp */}
      <footer className="bg-card/95 backdrop-blur-md border-t border-border/30 px-3 py-3 safe-bottom sticky bottom-0">
        <div className="flex gap-2 max-w-3xl mx-auto items-center">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Mensagem"
            disabled={isTyping}
            className="flex-1 h-11 rounded-full bg-muted/30 border-border/30 px-4 text-[15px] placeholder:text-muted-foreground/60"
          />
          <Button 
            onClick={handleSend} 
            disabled={!inputValue.trim() || isTyping} 
            size="icon"
            className="w-11 h-11 rounded-full bg-[#005c4b] hover:bg-[#006d5b] text-white shadow-md transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>

      {/* Modal da galeria de imagens */}
      {contextProduct?.image_url && (
        <ProductGalleryViewer
          coverImage={contextProduct.image_url}
          galleryImages={galleryImages}
          productName={contextProduct.name}
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          initialIndex={galleryInitialIndex}
        />
      )}
    </div>
  );
}
