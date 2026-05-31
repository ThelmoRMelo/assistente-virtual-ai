import { Check, Share2, ArrowRight, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ProductRatingSummary } from '@/components/reviews/ProductRatingSummary';
import type { ThemeConfig } from '@/lib/themes';

interface Product {
  id: string;
  name: string;
  price: number;
  short_description: string | null;
  image_url: string | null;
  category: string | null;
  long_description?: string | null;
  has_gallery?: boolean;
}

interface ProductCardProps {
  product: Product;
  theme: ThemeConfig;
  variant?: 'featured' | 'standard' | 'compact';
  onProductClick: (productId: string) => void;
  showBestSeller?: boolean;
}

export function ProductCard({ 
  product, 
  theme, 
  variant = 'standard', 
  onProductClick,
  showBestSeller = false
}: ProductCardProps) {
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/preview/${product.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.short_description || `Confira: ${product.name}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copiado!', {
          description: 'O link do produto foi copiado para a área de transferência.'
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copiado!');
      }
    }
  };

  // Extract benefits from description
  const benefits = product.short_description?.split('\n').filter(line => line.trim()) || [];

  if (variant === 'featured') {
    return (
      <div 
        className="group relative glass-card rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-glow"
        onClick={() => onProductClick(product.id)}
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Content side */}
          <div className="p-6 md:p-8 flex flex-col justify-center order-2 md:order-1">
            {showBestSeller && (
              <span className="inline-flex items-center w-fit bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
                Mais vendido
              </span>
            )}
            
            <h3 
              className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors"
              style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}
            >
              {product.name}
            </h3>

            {/* Benefits grid */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {benefits.slice(0, 6).map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="line-clamp-1">{benefit.replace(/^[-•✓✨]/g, '').trim()}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-auto">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Quero saber mais
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleShare}
                className="text-muted-foreground hover:text-primary"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Image side */}
          <div className="relative h-64 md:h-full min-h-[300px] order-1 md:order-2">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-4xl opacity-50">📦</span>
              </div>
            )}
            
            {/* Price badge */}
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-lg shadow-lg">
              {formatPrice(product.price)}
            </div>

            {/* Gallery indicator */}
            {product.has_gallery && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                <Images className="w-3.5 h-3.5" />
                Ver galeria
              </div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-card/80 via-transparent to-transparent md:block hidden" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div 
        className="group glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
        onClick={() => onProductClick(product.id)}
      >
        <div className="flex gap-4 p-4">
          {/* Small image */}
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-xl opacity-50">📦</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 
              className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1"
              style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}
            >
              {product.name}
            </h4>
            
            {benefits.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {benefits.slice(0, 2).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-primary shrink-0" />
                    <span className="line-clamp-1">{benefit.replace(/^[-•✓✨]/g, '').trim()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end justify-between shrink-0">
            <span className="text-sm font-bold text-primary">{formatPrice(product.price)}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Standard variant
  return (
    <div 
      className="group glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
      onClick={() => onProductClick(product.id)}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <span className="text-4xl opacity-50">📦</span>
          </div>
        )}
        
        {/* Price badge */}
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
          {formatPrice(product.price)}
        </div>

        {/* Gallery indicator */}
        {product.has_gallery && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Images className="w-3 h-3" />
            +fotos
          </div>
        )}

        {/* Share button */}
        <Button 
          variant="secondary" 
          size="icon"
          className="absolute top-3 left-3 w-8 h-8 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-5">
        <h4 
          className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2"
          style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}
        >
          {product.name}
        </h4>
        
        {benefits.length > 0 && (
          <div className="space-y-1 mb-4">
            {benefits.slice(0, 3).map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="line-clamp-1">{benefit.replace(/^[-•✓✨]/g, '').trim()}</span>
              </div>
            ))}
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary"
        >
          Quero conhecer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
