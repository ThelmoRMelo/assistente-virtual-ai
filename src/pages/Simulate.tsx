// Simulate.tsx - Testar Fluxo de Vendas
// Usa MESMA edge function do chat público com flag isSimulation

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { useApp } from '@/contexts/AppContext';
import { useConversation } from '@/hooks/useConversation';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { supabase } from '@/integrations/supabase/client';

export default function Simulate() {
  const { business, aiSettings } = useApp();
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
    clearConversation,
    setMessages
  } = useConversation(undefined, true); // isSimulation = true
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar produtos do Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('active', true);
      setProducts(data || []);
    };
    fetchProducts();
  }, []);

  // Mensagem de boas-vindas inicial
  useEffect(() => {
    if (!conversationLoading && messages.length === 0) {
      const welcomeMsg = `Oi! 👋 Sou a assistente virtual da ${business.nome || 'sua loja'}. Como posso te ajudar?`;
      addMessage(welcomeMsg, 'bot', 'Boas-vindas');
    }
  }, [conversationLoading, messages.length, business.nome, addMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userInput = input.trim();
    setInput('');
    setIsTyping(true);

    // Adicionar mensagem do usuário
    await addMessage(userInput, 'user');

    try {
      // Preparar lista de produtos para a IA
      const productsList = products.map(p => ({
        id: p.id,
        nome: p.name,
        preco: Number(p.price),
        descricao: p.short_description || p.long_description || '',
        precoMinimo: p.min_price_allowed,
        formasPagamento: p.payment_methods || [],
        infoEntrega: p.delivery_info || ''
      }));

      // Histórico recente (últimas 6 mensagens)
      const recentHistory = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      // Chamar MESMA edge function do chat público
      const { data, error } = await supabase.functions.invoke('ai-fallback', {
        body: {
          message: userInput,
          businessName: config?.business_name || business.nome || 'Loja',
          businessCategory: config?.business_category || business.categoria || 'varejo',
          products: productsList,
          productContext: null,
          productId: null,
          negotiationState: negotiation,
          conversationHistory: recentHistory,
          lastBotResponse,
          closingState: closing,
          paymentLink: config?.payment_link,
          whatsappNumber: config?.whatsapp_number,
          saleMode: config?.sale_mode || 'vendedora',
          isSimulation: true
        }
      });

      if (error) {
        console.error('[Simulate] Edge function error:', error);
        await addMessage('Ops, tive um problema. Pode repetir?', 'bot', 'Erro');
      } else {
        const response = data?.response || 'Como posso ajudar?';
        const categoria = data?.closingUpdate?.isClosing ? 'Fechamento' : 'IA Fallback';
        
        // Adicionar resposta do bot
        await addMessage(response, 'bot', categoria);

        // Atualizar estados
        if (data?.negotiationUpdate) {
          await updateNegotiation(data.negotiationUpdate);
        }
        if (data?.closingUpdate) {
          await updateClosing(data.closingUpdate);
        }
      }
    } catch (err) {
      console.error('[Simulate] Error:', err);
      await addMessage('Desculpe, tive um problema. Pode repetir?', 'bot', 'Erro');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    if (confirm('Limpar conversa e começar novo teste?')) {
      clearConversation();
      window.location.reload();
    }
  };

  if (conversationLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader 
        title="Testar Fluxo de Vendas" 
        subtitle="Simular conversa com a IA" 
      />

      {/* Status da IA */}
      {!aiSettings.isActive && (
        <div className="mx-4 mb-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <span className="text-xs text-yellow-500">Assistente pausada - ative nas configurações</span>
        </div>
      )}

      {/* Estado de negociação/fechamento (debug) */}
      <div className="mx-4 mb-2 p-2 rounded-lg bg-muted/30 flex items-center gap-4 text-xs text-muted-foreground">
        <span>🎯 Modo: {config?.sale_mode || 'vendedora'}</span>
        {closing.isClosing && <span className="text-orange-400">🔥 FECHAMENTO</span>}
        {negotiation.hasOfferedDiscount && <span>💰 Desconto oferecido</span>}
        {closing.hasOfferedWhatsApp && <span>📱 WhatsApp enviado</span>}
      </div>

      {/* Clear button */}
      <div className="px-4 mb-2">
        <Button variant="outline" size="sm" onClick={handleClear} className="w-full">
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar e recomeçar
        </Button>
      </div>

      {/* Chat area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-lg mx-auto w-full pb-40">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-slide-up ${message.sender === 'bot' ? '' : 'flex-row-reverse'}`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'bot'
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                  : 'bg-muted'
              }`}
            >
              {message.sender === 'bot' ? (
                <Bot className="w-5 h-5 text-white" />
              ) : (
                <User className="w-5 h-5 text-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-1 max-w-[80%]">
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.sender === 'bot'
                    ? 'glass-card rounded-tl-sm'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-tr-sm'
                }`}
              >
                <MarkdownMessage content={message.content} />
              </div>
              <div className={`flex items-center gap-2 px-1 ${message.sender === 'bot' ? '' : 'flex-row-reverse'}`}>
                <span className="text-[10px] text-muted-foreground">
                  {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {message.sender === 'bot' && message.categoria && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    message.categoria === 'Fechamento'
                      ? 'bg-orange-500/20 text-orange-400'
                      : message.categoria === 'Erro'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {message.categoria}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-slide-up">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input area */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite uma mensagem..."
            className="flex-1 h-12"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
