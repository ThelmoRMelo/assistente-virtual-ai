import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare, Package, ArrowLeft, ChevronRight, Users, Phone, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Json } from '@/integrations/supabase/types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ClosingState {
  isClosing?: boolean;
  closingReason?: string | null;
  closingAttempts?: number;
  conversationEnded?: boolean;
  hasOfferedWhatsApp?: boolean;
  hasOfferedPaymentLink?: boolean;
}

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  session_id: string;
  product_id: string | null;
  closing_state: Json;
  negotiation_state: Json;
  is_simulation: boolean;
  product?: {
    name: string;
  } | null;
  last_message?: string;
}

type FilterType = 'all' | 'negotiation' | 'transferred' | 'ended';

const parseClosingState = (state: Json): ClosingState | null => {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
  return state as unknown as ClosingState;
};

const ITEMS_PER_PAGE = 10;

export default function Conversations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const filter = (searchParams.get('filter') as FilterType) || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    fetchConversations();
  }, [filter, page]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      // Fetch all non-simulation conversations
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          product:products(name)
        `)
        .eq('is_simulation', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Filter on client side based on filter type
      let filteredData = (data || []).filter(conv => {
        const closingState = parseClosingState(conv.closing_state);
        
        if (filter === 'negotiation') {
          return closingState?.isClosing === true && closingState?.conversationEnded !== true;
        } else if (filter === 'transferred') {
          return closingState?.hasOfferedWhatsApp === true;
        } else if (filter === 'ended') {
          return closingState?.conversationEnded === true;
        }
        return true; // 'all' filter
      });

      setTotalCount(filteredData.length);

      // Paginate on client side
      const paginatedData = filteredData.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
      );

      // Fetch last message for each conversation
      const conversationsWithMessages = await Promise.all(
        paginatedData.map(async (conv) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...conv,
            last_message: messages?.[0]?.content || 'Sem mensagens',
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (conv: Conversation) => {
    const closingState = parseClosingState(conv.closing_state);
    
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

  const setFilter = (newFilter: FilterType) => {
    setSearchParams({ filter: newFilter, page: '1' });
  };

  const setPage = (newPage: number) => {
    setSearchParams({ filter, page: newPage.toString() });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const filterOptions: { key: FilterType; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'Todas', icon: Users },
    { key: 'negotiation', label: 'Negociação', icon: MessageSquare },
    { key: 'transferred', label: 'Transferidas', icon: Phone },
    { key: 'ended', label: 'Encerradas', icon: XCircle },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-6 pt-8">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold gradient-text">Histórico de Conversas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} conversa{totalCount !== 1 ? 's' : ''} encontrada{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <main className="px-6 space-y-4 max-w-lg mx-auto">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {filterOptions.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={filter === key ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setFilter(key)}
              className="shrink-0"
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {label}
            </Button>
          ))}
        </div>

        {/* Conversations List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">Nenhuma conversa encontrada</h3>
              <p className="text-sm text-muted-foreground">
                {filter !== 'all' 
                  ? 'Tente mudar o filtro para ver outras conversas'
                  : 'As conversas com clientes aparecerão aqui'}
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/conversas/${conv.id}`)}
                className="w-full glass-card rounded-xl p-4 text-left hover:border-primary/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(conv)}
                    {conv.product?.name && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {conv.product.name}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
                
                <p className="text-sm text-foreground line-clamp-2 mb-2">
                  {conv.last_message}
                </p>
                
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {format(new Date(conv.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => { e.preventDefault(); setPage(page - 1); }}
                  />
                </PaginationItem>
              )}
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      isActive={page === pageNum}
                      onClick={(e) => { e.preventDefault(); setPage(pageNum); }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {page < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); setPage(page + 1); }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </main>

      <BottomNav />
    </div>
  );
}