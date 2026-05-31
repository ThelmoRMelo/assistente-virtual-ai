import { useState } from 'react';
import { ThumbsUp, Pin, Sparkles, Shield } from 'lucide-react';
import { ReviewStars } from './ReviewStars';
import type { ProductReview } from '@/hooks/useProductReviews';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReviewItemProps {
  review: ProductReview;
  onHelpful?: (id: string) => Promise<boolean>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ReviewItem({ review, onHelpful }: ReviewItemProps) {
  const [voted, setVoted] = useState(() => {
    try { return localStorage.getItem(`review_voted_${review.id}`) === '1'; } catch { return false; }
  });
  const [busy, setBusy] = useState(false);

  const handleVote = async () => {
    if (voted || !onHelpful || busy) return;
    setBusy(true);
    try {
      const ok = await onHelpful(review.id);
      if (ok) {
        localStorage.setItem(`review_voted_${review.id}`, '1');
        setVoted(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn(
      'glass-card rounded-xl p-4 space-y-3',
      review.is_pinned && 'border border-primary/40 shadow-glow'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{review.customer_name}</span>
            {review.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                <Pin className="w-3 h-3" /> Em destaque
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <ReviewStars value={review.stars} size={14} />
            <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{review.comment}</p>

      {review.admin_reply && (
        <div className="ml-2 pl-3 border-l-2 border-primary/40 bg-primary/5 rounded-r-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Shield className="w-3.5 h-3.5" />
            Resposta do Administrador
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.admin_reply}</p>
        </div>
      )}

      {review.ania_reply && (
        <div className="ml-2 pl-3 border-l-2 border-secondary/60 bg-gradient-to-r from-secondary/10 to-primary/5 rounded-r-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold gradient-text">
            <Sparkles className="w-3.5 h-3.5" />
            ANIA respondeu
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.ania_reply}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleVote}
          disabled={voted || busy}
          className={cn('gap-2 h-8 px-2', voted && 'text-primary')}
        >
          <ThumbsUp className={cn('w-3.5 h-3.5', voted && 'fill-primary')} />
          <span className="text-xs">Útil ({review.helpful_count})</span>
        </Button>
      </div>
    </div>
  );
}
