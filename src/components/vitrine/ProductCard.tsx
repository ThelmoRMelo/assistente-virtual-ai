import { useState } from 'react';
import { ShoppingCart, Eye, Star, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Product } from '@/types/product';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  variant?: 'standard' | 'featured' | 'hero';
  imageFit?: 'cover' | 'contain';
  onProductClick?: (product: Product) => void;
}

export function ProductCard({
  product,
  theme,
  variant = 'standard',
  imageFit = 'cover',
  onProductClick,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const primaryColor = theme?.primaryColor || '#000000';

  const hasImages =
    product.images &&
    Array.isArray(product.images) &&
    product.images.length > 0;

  const mainImage =
    product.imageUrl ||
    (hasImages ? product.images?.[0] : undefined);

  /*
   * ============================================================
   * HERO
   * ============================================================
   */
  if (variant === 'hero') {
    return (
      <Card
        className="group relative overflow-hidden border-0 shadow-xl cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          {mainImage && !imageError ? (
            <img
              src={mainImage}
              alt={product.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {product.price && (
            <Badge
              className="absolute top-4 right-4 text-lg px-4 py-2"
              style={{ backgroundColor: primaryColor }}
            >
              R$ {Number(product.price).toFixed(2).replace('.', ',')}
            </Badge>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <h3 className="text-xl sm:text-2xl font-bold line-clamp-2">
              {product.name}
            </h3>

            {product.description && (
              <p className="mt-2 text-sm text-white/80 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  /*
   * ============================================================
   * FEATURED
   * ============================================================
   */
  if (variant === 'featured') {
    return (
      <Card
        className="group relative overflow-hidden border-0 shadow-lg cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {mainImage && !imageError ? (
            <img
              src={mainImage}
              alt={product.name}
              onError={() => setImageError(true)}
              className={cn(
                'w-full h-full transition-transform duration-500',
                imageFit === 'contain'
                  ? 'object-contain object-center p-2'
                  : 'object-cover group-hover:scale-105'
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {product.price && (
            <Badge
              className="absolute top-3 right-3 px-3 py-1.5 text-base"
              style={{ backgroundColor: primaryColor }}
            >
              R$ {Number(product.price).toFixed(2).replace('.', ',')}
            </Badge>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-lg sm:text-xl font-bold line-clamp-2">
              {product.name}
            </h3>

            {product.description && (
              <p className="mt-1 text-sm text-white/80 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  /*
   * ============================================================
   * STANDARD — NOSSOS PRODUTOS
   * ============================================================
   */
  return (
    <Card
      className="group overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
      onClick={handleCardClick}
    >
      {/* IMAGEM MAIOR E PROPORCIONAL */}
      <div
        className={cn(
          'relative aspect-[4/3] w-full overflow-hidden cursor-pointer',
          imageFit === 'contain' ? 'bg-muted/40' : ''
        )}
      >
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={product.name}
            onError={() => setImageError(true)}
            className={cn(
              'w-full h-full transition-transform duration-500',
              imageFit === 'contain'
                ? 'object-contain object-center p-1 scale-[1.03] group-hover:scale-[1.08]'
                : 'object-cover group-hover:scale-110'
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
          </div>
        )}

        {/* Quantidade de fotos */}
        {hasImages && product.images && product.images.length > 1 && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-2 text-xs bg-black/60 text-white border-0"
          >
            +{product.images.length - 1} fotos
          </Badge>
        )}

        {/* Preço */}
        {product.price && (
          <Badge
            className="absolute top-2 right-2 text-sm px-2.5 py-1"
            style={{ backgroundColor: primaryColor }}
          >
            R$ {Number(product.price).toFixed(2).replace('.', ',')}
          </Badge>
        )}
      </div>

      {/* INFORMAÇÕES */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-sm sm:text-base line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-3 flex gap-2">
          <Button
            size="sm"
            className="flex-1 text-xs sm:text-sm"
            style={{ backgroundColor: primaryColor }}
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver produto
          </Button>
        </div>
      </div>
    </Card>
  );
}
