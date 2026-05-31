import { Star } from 'lucide-react';
import { useReviewStats } from '@/hooks/useProductReviews';

interface Props {
  productId: string;
  className?: string;
}

export function ProductRatingSummary({ productId, className }: Props) {
  const stats = useReviewStats(productId);
  if (stats.total === 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className || ''}`}>
        <Star className="w-3 h-3" />
        Sem avaliações
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${className || ''}`}>
      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
      <span className="text-foreground">{stats.average.toFixed(1)}</span>
      <span className="text-muted-foreground">({stats.total})</span>
    </span>
  );
}
