import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './ProductCard';
import type { ThemeConfig } from '@/lib/themes';

interface Product {
  id: string;
  name: string;
  price: number;
  short_description: string | null;
  long_description?: string | null;
  image_url: string | null;
  category: string | null;
  payment_link?: string | null;
  tenant_id?: string | null;
  has_gallery?: boolean;
}

interface ProductSectionProps {
  title: string;
  products: Product[];
  theme: ThemeConfig;
  onProductClick: (productId: string) => void;
  layout?: 'grid' | 'featured' | 'list';
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export function ProductSection({ 
  title, 
  products, 
  theme, 
  onProductClick,
  layout = 'grid',
  showViewAll = true,
  onViewAll
}: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 
          className="text-2xl md:text-3xl font-bold"
          style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}
        >
          {title}
        </h2>
        
        {showViewAll && products.length > 2 && (
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-primary"
            onClick={onViewAll}
          >
            Ver todos
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Products */}
      {layout === 'featured' ? (
        <div className="space-y-6">
          {products.slice(0, 1).map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              theme={theme}
              variant="featured"
              onProductClick={onProductClick}
              showBestSeller={index === 0}
            />
          ))}
          
          {products.length > 1 && (
            <div className="grid md:grid-cols-2 gap-4">
              {products.slice(1, 3).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  theme={theme}
                  variant="standard"
                  onProductClick={onProductClick}
                />
              ))}
            </div>
          )}
        </div>
      ) : layout === 'list' ? (
        <div className="space-y-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              theme={theme}
              variant="compact"
              onProductClick={onProductClick}
            />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              theme={theme}
              variant="standard"
              onProductClick={onProductClick}
            />
          ))}
        </div>
      )}
    </section>
  );
}
