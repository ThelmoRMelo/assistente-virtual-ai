// Chat.tsx - Página PÚBLICA de chat para clientes finais
// Suporta vitrine com slug + tenant_id

import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, MessageCircle, Loader2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { useApp } from '@/contexts/AppContext';
import { useConversation } from '@/hooks/useConversation';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { supabase } from '@/integrations/supabase/client';

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
}

interface StorefrontData {
  tenant_id: string;
  slug: string;
}

export default function Chat() {
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
    updateClosing
  } = useConversation(productId, false);
  
  const [supabaseProducts, setSupabaseProducts] = useState<SupabaseProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [tenantConfig, setTenantConfig] = useState<{ business_name?: string; business_category?: string } | null>(null);

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

  // Mensagem inicial
  useEffect(() => {
    if (hasInitialized || conversationLoading || loadingProducts) return;
    if (messages.length > 0) {
      setHasInitialized(true);
      return;
    }
    
    let welcomeMessage = '';
    if (contextProduct) {
      const price = Number(contextProduct.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      welcomeMessage = `Olá! 👋 Você está interessado no **${contextProduct.name}**! O valor é ${price}. Posso te ajudar?`;
    } else if (supabaseProducts.length > 0) {
      welcomeMessage = `Olá! 👋 Bem-vindo${business.nome ? ` à ${business.nome}` : ''}! Temos ${supabaseProducts.length} produto(s). Como posso ajudar?`;
    } else {
      welcomeMessage = `Olá! 👋 Como posso te ajudar hoje?`;
    }
    
    addMessage(welcomeMessage, 'bot', 'Boas-vindas');
    setHasInitialized(true);
  }, [hasInitialized, conversationLoading, loadingProducts, messages.length, contextProduct, supabaseProducts, business.nome, addMessage]);

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
    <div className="min-h-screen flex flex-col bg-background">
      <header className="glass-card border-b border-border/50 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        {/* Botão voltar para vitrine */}
        <Link to={vitrineLink} className="p-2 hover:bg-muted/50 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        {contextProduct?.image_url ? (
          <img src={contextProduct.image_url} alt={contextProduct.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-semibold">{contextProduct?.name || storeName}</h1>
          <p className="text-xs text-muted-foreground">{isTyping ? 'Digitando...' : 'Online'}</p>
        </div>
        
        {/* Link para ver produtos */}
        <Link to={vitrineLink} className="p-2 hover:bg-muted/50 rounded-full transition-colors">
          <ShoppingBag className="w-5 h-5 text-muted-foreground" />
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`} style={{ animationDelay: `${index * 30}ms` }}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'glass-card rounded-bl-sm'}`}>
              <MarkdownMessage content={message.content} />
              <span className="text-[10px] opacity-60 mt-1 block text-right">
                {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-slide-up">
            <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="glass-card border-t border-border/50 p-4 safe-bottom sticky bottom-0">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua mensagem..."
            disabled={isTyping}
          />
          <Button onClick={handleSend} disabled={!inputValue.trim() || isTyping} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
