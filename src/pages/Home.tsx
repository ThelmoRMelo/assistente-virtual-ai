import { useState, useEffect } from 'react';
import { Bot, TrendingUp, Package, MessageCircle, Building2, Settings, Check, Pause, Play, Zap, Users, Phone, XCircle, ExternalLink, Store, Star, ShoppingCart, MousePointerClick } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MenuCard } from '@/components/MenuCard';
import { BottomNav } from '@/components/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { useConversationMetrics } from '@/hooks/useConversationMetrics';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { useProductClickMetrics } from '@/hooks/useProductClickMetrics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const navigate = useNavigate();
  const { business, aiSettings, updateAISettings } = useApp();
  const { metrics, loading: metricsLoading } = useConversationMetrics();
  const { metrics: clickMetrics, loading: clickLoading } = useProductClickMetrics();
  const { config } = useBusinessConfig();
  const [storefrontSlug, setStorefrontSlug] = useState<string | null>(null);

  useEffect(() => {
    const fetchStorefront = async () => {
      // Buscar primeira storefront disponível (modo single-tenant/demo)
      const { data } = await supabase
        .from('storefronts')
        .select('slug')
        .limit(1)
        .maybeSingle();
      if (data) setStorefrontSlug(data.slug);
    };
    fetchStorefront();
  }, []);

  const toggleAI = () => {
    updateAISettings({ isActive: !aiSettings.isActive });
    toast.success(aiSettings.isActive ? 'Assistente pausada' : 'Assistente ativada!');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-6 pt-8">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-float shadow-glow">
            <Bot className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="gradient-text">Sistema de Vendas</span>
            </h1>
            <p className="text-sm text-muted-foreground">{config?.business_name || business.nome || 'Seu negócio'}</p>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-4 max-w-lg mx-auto">
        {/* Status Card */}
        <div className="glass-card gradient-border rounded-2xl p-5 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                aiSettings.isActive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {aiSettings.isActive ? <Check className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="font-bold text-lg">Minha IA de Vendas</h2>
                <p className="text-sm text-muted-foreground">
                  {aiSettings.isActive ? 'Vendendo ativamente' : 'Assistente pausada'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleAI}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                aiSettings.isActive ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'
              }`}
            >
              {aiSettings.isActive ? <Check className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="gradient" 
              size="sm" 
              className="flex-1"
              onClick={() => navigate('/simular')}
            >
              <MessageCircle className="w-4 h-4" />
              Testar Fluxo
            </Button>
            {storefrontSlug && (
              <Link to={`/loja/${storefrontSlug}`} target="_blank" className="flex-1">
                <Button variant="gradient-secondary" size="sm" className="w-full">
                  <Store className="w-4 h-4" />
                  Ver Vitrine
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Vitrine Link Card */}
        {storefrontSlug && (
          <div className="glass-card rounded-xl p-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Sua vitrine pública</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                    /loja/{storefrontSlug}
                  </p>
                </div>
              </div>
              <Link to={`/loja/${storefrontSlug}`} target="_blank">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Business Metrics */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Métricas de Negócio
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/conversas?filter=all')}
              className="glass-card rounded-xl p-4 text-center hover:border-primary/50 transition-all"
            >
              {metricsLoading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-3xl font-bold gradient-text">{metrics.totalConversations}</p>
              )}
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                Clientes atendidos
              </div>
            </button>
            <button 
              onClick={() => navigate('/conversas?filter=negotiation')}
              className="glass-card rounded-xl p-4 text-center hover:border-primary/50 transition-all"
            >
              {metricsLoading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-3xl font-bold text-orange-400">{metrics.inNegotiation}</p>
              )}
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3" />
                Em negociação
              </div>
            </button>
            <button 
              onClick={() => navigate('/conversas?filter=transferred')}
              className="glass-card rounded-xl p-4 text-center hover:border-primary/50 transition-all"
            >
              {metricsLoading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-3xl font-bold text-green-400">{metrics.transferred}</p>
              )}
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" />
                Transferidos
              </div>
            </button>
            <button 
              onClick={() => navigate('/conversas?filter=ended')}
              className="glass-card rounded-xl p-4 text-center hover:border-primary/50 transition-all"
            >
              {metricsLoading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-3xl font-bold text-cyan-400">{metrics.ended}</p>
              )}
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <XCircle className="w-3 h-3" />
                Encerradas
              </div>
            </button>
          </div>
        </div>

        {/* Conversão da Landing Page */}
        <div className="animate-slide-up" style={{ animationDelay: '120ms' }}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4" />
            Conversão da Landing Page
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-4 text-center">
              {clickLoading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-3xl font-bold text-blue-400">{clickMetrics.saberMais}</p>
              )}
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3" />
                Quero saber mais
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              {clickLoading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-3xl font-bold gradient-text">{clickMetrics.adquirir}</p>
              )}
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShoppingCart className="w-3 h-3" />
                Adquirir Agora
              </div>
            </div>
          </div>
        </div>

        {/* Products Stats */}
        <div className="glass-card rounded-xl p-4 text-center animate-slide-up" style={{ animationDelay: '150ms' }}>
          {metricsLoading ? (
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
          ) : (
            <p className="text-3xl font-bold gradient-text">{metrics.products}</p>
          )}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Package className="w-3 h-3" />
            Produtos cadastrados
          </div>
        </div>

        {/* Menu Cards */}
        <div className="space-y-3 pt-2">
          <MenuCard
            icon={Package}
            title="Meus Produtos"
            description="Cadastrar produtos à venda"
            path="/produtos"
            iconColor="text-orange-400"
            delay={250}
          />
          <MenuCard
            icon={Star}
            title="Avaliações e Depoimentos"
            description="Modere comentários dos clientes"
            path="/avaliacoes"
            iconColor="text-yellow-400"
            delay={300}
          />
          <MenuCard
            icon={Building2}
            title="Meu Negócio"
            description="Dados e aparência da Landing Page"
            path="/negocio"
            iconColor="text-green-400"
            delay={350}
          />
          <MenuCard
            icon={Bot}
            title="Ajustes"
            description="Configurações da Assistente"
            path="/ania"
            iconColor="text-primary"
            delay={400}
          />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
