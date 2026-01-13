import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, User, Package, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Json } from '@/integrations/supabase/types';

interface Message {
  id: string;
  content: string;
  sender: string;
  created_at: string;
  categoria: string | null;
}

interface ClosingState {
  isClosing?: boolean;
  closingReason?: string | null;
  closingAttempts?: number;
  conversationEnded?: boolean;
  hasOfferedWhatsApp?: boolean;
  hasOfferedPaymentLink?: boolean;
}

interface ConversationData {
  id: string;
  created_at: string;
  updated_at: string;
  session_id: string;
  product_id: string | null;
  closing_state: Json;
  negotiation_state: Json;
  product?: {
    name: string;
  } | null;
}

const parseClosingState = (state: Json): ClosingState | null => {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
  return state as unknown as ClosingState;
};

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchConversation();
    }
  }, [id]);

  useEffect(() => {
    // Scroll to bottom when messages load
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversation = async () => {
    setLoading(true);
    try {
      // Fetch conversation data
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          product:products(name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (convError) throw convError;
      if (!convData) {
        navigate('/app/conversas');
        return;
      }

      setConversation(convData);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!conversation) return null;
    const closingState = parseClosingState(conversation.closing_state);
    
    if (closingState?.conversationEnded) {
      return <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Encerrada</Badge>;
    }
    if (closingState?.hasOfferedWhatsApp) {
      return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Transferida</Badge>;
    }
    if (closingState?.isClosing) {
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">Em negociação</Badge>;
    }
    return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Ativa</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="p-4 border-b border-border/50">
          <div className="max-w-lg mx-auto">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </header>
        <div className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'} rounded-2xl`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate('/app/conversas')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {getStatusBadge()}
                {conversation.product?.name && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {conversation.product.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(conversation.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(conversation.created_at), "HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma mensagem nesta conversa</p>
            </div>
          ) : (
            messages.map((message) => {
              const isBot = message.sender === 'bot';
              
              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {isBot && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isBot
                        ? 'bg-muted/50 rounded-bl-md'
                        : 'bg-primary text-primary-foreground rounded-br-md'
                    }`}
                  >
                    {isBot ? (
                      <MarkdownMessage content={message.content} className="text-sm" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p className={`text-[10px] mt-1 ${isBot ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                      {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  
                  {!isBot && (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Read-only footer */}
      <div className="p-4 border-t border-border/50 bg-muted/30">
        <div className="max-w-lg mx-auto text-center text-sm text-muted-foreground">
          Modo somente leitura • {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}