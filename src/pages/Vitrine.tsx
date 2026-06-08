import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { themes, getThemeForCategory, type ThemeConfig } from '@/lib/themes';
import { usePWABlocker } from '@/hooks/usePWABlocker';

// Vitrine components
import { VitrineHeader } from '@/components/vitrine/VitrineHeader';
import { VitrineHero } from '@/components/vitrine/VitrineHero';
import { ProductSection } from '@/components/vitrine/ProductSection';
import { ThemeShowcase } from '@/components/vitrine/ThemeShowcase';
import { VitrineFooter } from '@/components/vitrine/VitrineFooter';

interface Product {
  id: string;
  name: string;
  price: number;
  short_description: string | null;
  long_description: string | null;
  image_url: string | null;
  category: string | null;
  payment_link: string | null;
  tenant_id: string | null;
  has_gallery: boolean;
}

interface StorefrontData {
  id: string;
  slug: string;
  tenant_id: string;
}

interface BusinessConfig {
  business_name: string | null;
  business_category: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  footer_text?: string | null;
  hero_banner_url?: string | null;
  assistant_image_url?: string | null;
  hero_title_size?: number | null;
  hero_subtitle_size?: number | null;
  assistant_position_axis?: 'horizontal' | 'vertical' | null;
  assistant_position_value?: number | null;
  assistant_size?: number | null;
  show_assistant_bubble?: boolean | null;
  assistant_bubble_text?: string | null;
  hero_button_text?: string | null;
  hero_button_glow?: number | null;
  hero_button_radius?: number | null;
  primary_color?: string | null;
  title_color?: string | null;
  text_color?: string | null;
  button_color?: string | null;
  accent_color?: string | null;
}

export default function Vitrine() {
  // Block PWA install prompts on this public route
  usePWABlocker();
  
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [storefront, setStorefront] = useState<StorefrontData | null>(null);
  const [business, setBusiness] = useState<BusinessConfig | null>(null);
  const [theme, setTheme] = useState<ThemeConfig>(themes.default);

  useEffect(() => {
    loadStorefront();
  }, [slug]);

  const loadStorefront = async () => {
    setLoading(true);
    
    try {
      let currentTenantId: string | null = null;
      
      if (slug) {
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
      }

      // Fetch business config
      if (currentTenantId) {
        const { data: configData } = await supabase
          .from('business_config')
          .select('business_name, business_category, hero_title, hero_subtitle, footer_text, hero_banner_url, assistant_image_url')
          .eq('tenant_id', currentTenantId)
          .single();
        if (configData) {
          setBusiness(configData as BusinessConfig);
          const themeId = getThemeForCategory(configData.business_category || '');
          setTheme(themes[themeId]);
        }
      } else {
        const { data: configData } = await supabase
          .from('business_config')
          .select('business_name, business_category, hero_title, hero_subtitle, footer_text, hero_banner_url, assistant_image_url')
          .limit(1)
          .single();
        if (configData) {
          setBusiness(configData as BusinessConfig);
          const themeId = getThemeForCategory(configData.business_category || '');
          setTheme(themes[themeId]);
        }
      }

      // Fetch active products
      let productsQuery = supabase
        .from('products')
        .select('id, name, price, short_description, long_description, image_url, category, payment_link, tenant_id, has_gallery')
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

  const handleProductClick = (productId: string) => {
    if (slug) {
      navigate(`/loja/${slug}/chat/${productId}`);
    } else {
      navigate(`/chat/${productId}`);
    }
  };

  const chatPath = slug ? `/loja/${slug}/chat` : '/chat';
  const businessName = business?.business_name || 'Minha Loja';

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    
    products.forEach(product => {
      const category = product.category || 'Outros';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    
    return grouped;
  }, [products]);

  // Identify main categories
  const coursesProducts = useMemo(() => 
    products.filter(p => 
      p.category?.toLowerCase().includes('curso') || 
      p.category?.toLowerCase().includes('treinamento') ||
      p.category?.toLowerCase().includes('educação')
    ), [products]
  );

  const appsProducts = useMemo(() => 
    products.filter(p => 
      p.category?.toLowerCase().includes('app') || 
      p.category?.toLowerCase().includes('software') ||
      p.category?.toLowerCase().includes('sistema')
    ), [products]
  );

  const otherProducts = useMemo(() => 
    products.filter(p => 
      !coursesProducts.includes(p) && !appsProducts.includes(p)
    ), [products, coursesProducts, appsProducts]
  );

  // Apply theme dynamically
  useEffect(() => {
    if (theme.fonts.googleImport) {
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

    const root = document.documentElement;
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--card', theme.colors.card);
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--border', theme.colors.border);

    return () => {
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
    <div className="min-h-screen bg-background">
      <VitrineHeader 
        businessName={businessName} 
        theme={theme} 
        chatPath={chatPath} 
      />

      <VitrineHero 
        businessName={businessName} 
        theme={theme} 
        chatPath={chatPath}
        heroTitle={business?.hero_title}
        heroSubtitle={business?.hero_subtitle}
        bannerUrl={business?.hero_banner_url}
        assistantImageUrl={business?.assistant_image_url}
      />

      <main className="max-w-7xl mx-auto px-4">
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <div className="glass-card rounded-3xl p-12 max-w-md mx-auto">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum produto disponível</h3>
              <p className="text-muted-foreground">Em breve teremos novidades!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Featured/Courses section */}
            {coursesProducts.length > 0 ? (
              <ProductSection
                title="Cursos"
                products={coursesProducts}
                theme={theme}
                onProductClick={handleProductClick}
                layout="featured"
              />
            ) : products.length > 0 && (
              <ProductSection
                title="Destaques"
                products={products.slice(0, 3)}
                theme={theme}
                onProductClick={handleProductClick}
                layout="featured"
              />
            )}

            {/* Apps section */}
            {appsProducts.length > 0 && (
              <ProductSection
                title="Aplicativos"
                products={appsProducts}
                theme={theme}
                onProductClick={handleProductClick}
                layout="grid"
              />
            )}

            {/* Other products */}
            {otherProducts.length > 0 && (
              <ProductSection
                title={coursesProducts.length > 0 || appsProducts.length > 0 ? "Outros Produtos" : "Nossos Produtos"}
                products={otherProducts}
                theme={theme}
                onProductClick={handleProductClick}
                layout="grid"
              />
            )}
          </>
        )}

        {/* Theme showcase */}
        <ThemeShowcase theme={theme} />
      </main>

      <VitrineFooter footerText={business?.footer_text} />
    </div>
  );
}
