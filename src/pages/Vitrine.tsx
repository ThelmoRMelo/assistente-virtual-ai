import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { themes, getThemeForCategory, generateThemeCSS, type ThemeConfig } from '@/lib/themes';

interface Product {
  id: string;
  name: string;
  price: number;
  short_description: string | null;
  image_url: string | null;
  category: string | null;
}

interface StorefrontData {
  id: string;
  slug: string;
  tenant_id: string;
}

interface BusinessConfig {
  business_name: string | null;
  business_category: string | null;
}

export default function Vitrine() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [business, setBusiness] = useState<BusinessConfig | null>(null);
  const [theme, setTheme] = useState<ThemeConfig>(themes.default);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    loadStorefront();
  }, [slug]);

  const loadStorefront = async () => {
    setLoading(true);
    
    try {
      let currentTenantId: string | null = null;
      
      if (slug) {
        // Buscar vitrine pelo slug
        const { data: storefrontData, error: sfError } = await supabase
          .from('storefronts')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();
        
        if (sfError || !storefrontData) {
          console.error('Vitrine não encontrada');
          setLoading(false);
          return;
        }
        
        setStorefront(storefrontData);
        currentTenantId = storefrontData.tenant_id;
      } else {
        // Sem slug = vitrine global (todos os produtos ativos)
        // Ou pode ser do primeiro tenant disponível para demo
      }
      
      setTenantId(currentTenantId);

      // Buscar configurações do negócio
      if (currentTenantId) {
        const { data: configData } = await supabase
          .from('business_config')
          .select('business_name, business_category')
          .eq('tenant_id', currentTenantId)
          .single();
        
        if (configData) {
          setBusiness(configData);
          // Aplicar tema baseado na categoria
          const themeId = getThemeForCategory(configData.business_category || '');
          setTheme(themes[themeId]);
        }
      } else {
        // Buscar primeira config disponível para demo
        const { data: configData } = await supabase
          .from('business_config')
          .select('business_name, business_category')
          .limit(1)
          .single();
        
        if (configData) {
          setBusiness(configData);
          const themeId = getThemeForCategory(configData.business_category || '');
          setTheme(themes[themeId]);
        }
      }

      // Buscar produtos ativos
      let productsQuery = supabase
        .from('products')
        .select('id, name, price, short_description, image_url, category')
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (currentTenantId) {
        productsQuery = productsQuery.eq('tenant_id', currentTenantId);
      }

      const { data: productsData } = await productsQuery;
      setProducts(productsData || []);
      
    } catch (error) {
      console.error('Erro ao carregar vitrine:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleProductClick = (productId: string) => {
    // Navegar para o chat com contexto do produto e tenant
    if (slug) {
      navigate(`/loja/${slug}/chat/${productId}`);
    } else {
      navigate(`/chat/${productId}`);
    }
  };

  // Aplicar tema dinamicamente
  useEffect(() => {
    if (theme.fonts.googleImport) {
      // Adicionar fonte do Google
      const link = document.createElement('link');
      link.href = theme.fonts.googleImport;
      link.rel = 'stylesheet';
      link.id = 'theme-font';
      
      const existingLink = document.getElementById('theme-font');
      if (existingLink) {
        existingLink.remove();
      }
      document.head.appendChild(link);
    }

    // Aplicar CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--card', theme.colors.card);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--border', theme.colors.border);

    return () => {
      // Resetar para tema padrão ao sair
      const defaultTheme = themes.default;
      root.style.setProperty('--primary', defaultTheme.colors.primary);
      root.style.setProperty('--secondary', defaultTheme.colors.secondary);
      root.style.setProperty('--accent', defaultTheme.colors.accent);
      root.style.setProperty('--background', defaultTheme.colors.background);
      root.style.setProperty('--card', defaultTheme.colors.card);
      root.style.setProperty('--muted', defaultTheme.colors.muted);
      root.style.setProperty('--border', defaultTheme.colors.border);
    };
  }, [theme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `var(--gradient-primary)` }}>
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: `var(--gradient-primary)` }}>
      {/* Header */}
      <header className="glass-card border-b border-border/50 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 
                className="font-bold text-lg"
                style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}
              >
                {business?.business_name || 'Nossa Loja'}
              </h1>
              {business?.business_category && (
                <p className="text-xs text-muted-foreground">{business.business_category}</p>
              )}
            </div>
          </div>
          
          <Link to={slug ? `/loja/${slug}/chat` : '/chat'}>
            <Button variant="glass" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-8 text-center max-w-4xl mx-auto">
        <h2 
          className="text-3xl md:text-4xl font-bold mb-3 gradient-text"
          style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}
        >
          Bem-vindo à {business?.business_name || 'Nossa Loja'}
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Explore nossos produtos e converse com nossa assistente virtual para tirar dúvidas e fazer seu pedido.
        </p>
      </section>

      {/* Products Grid - Banner Style */}
      <main className="px-4 pb-8 max-w-4xl mx-auto">
        {products.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum produto disponível</h3>
            <p className="text-muted-foreground">Em breve teremos novidades!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {products.map((product, index) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="group glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-glow animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Banner Image */}
                <div className="relative h-48 md:h-64 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  
                  {/* Price badge */}
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-lg shadow-glow">
                    {formatPrice(product.price)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 
                        className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors"
                        style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}
                      >
                        {product.name}
                      </h3>
                      {product.short_description && (
                        <p className="text-muted-foreground line-clamp-2">
                          {product.short_description}
                        </p>
                      )}
                      {product.category && (
                        <span className="inline-block mt-3 text-xs bg-muted/50 text-muted-foreground px-3 py-1 rounded-full">
                          {product.category}
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      variant="gradient" 
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Quero este
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-muted-foreground text-sm">
        <p>Atendimento por IA disponível 24h</p>
      </footer>
    </div>
  );
}
