import { ArrowRight, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { trackProductClick } from '@/hooks/useProductClickMetrics';

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  short_description: string | null;
  payment_link: string | null;
  tenant_id: string | null;
}

interface CatalogCardsProps {
  products: CatalogProduct[];
  slug?: string;
}

export function CatalogCards({ products, slug }: CatalogCardsProps) {
  const navigate = useNavigate();
  const formatPrice = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const goToProduct = (id: string, tenantId: string | null) => {
    trackProductClick(id, 'saber_mais', tenantId);
    const base = slug ? `/loja/${slug}` : '';
    navigate(`${base}/chat/${id}`);
  };

  const adquirir = (e: React.MouseEvent, p: CatalogProduct) => {
    e.stopPropagation();
    if (!p.payment_link) return;
    trackProductClick(p.id, 'adquirir', p.tenant_id);
    window.open(p.payment_link, '_blank', 'noopener,noreferrer');
  };

  if (products.length === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      {products.map((p) => {
        const hasLink = !!p.payment_link && p.payment_link.trim().length > 0;
        return (
          <div
            key={p.id}
            className="bg-background/60 border border-border/40 rounded-2xl overflow-hidden hover:border-primary/40 transition-colors"
          >
            <div className="flex gap-3 p-2.5">
              <button
                onClick={() => goToProduct(p.id, p.tenant_id)}
                className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted"
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-xl opacity-50">📦</span>
                  </div>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <button
                  onClick={() => goToProduct(p.id, p.tenant_id)}
                  className="text-left w-full"
                >
                  <h4 className="font-semibold text-sm text-foreground line-clamp-1 hover:text-primary transition-colors">
                    {p.name}
                  </h4>
                  <div className="text-primary font-bold text-sm mt-0.5">
                    {formatPrice(p.price)}
                  </div>
                </button>
                {p.short_description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {p.short_description.split('\n')[0]}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-1.5 px-2.5 pb-2.5">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs rounded-lg"
                onClick={() => goToProduct(p.id, p.tenant_id)}
              >
                👉 Saber mais
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
              {hasLink && (
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  onClick={(e) => adquirir(e, p)}
                >
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Adquirir agora
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
