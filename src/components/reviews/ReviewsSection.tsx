import { useProductReviews, useReviewStats } from '@/hooks/useProductReviews';
import { ReviewItem } from './ReviewItem';
import { ReviewStars } from './ReviewStars';
import { ReviewForm } from './ReviewForm';
import { Star } from 'lucide-react';

interface ReviewsSectionProps {
  productId: string;
  tenantId?: string | null;
}

export function ReviewsSection({ productId, tenantId }: ReviewsSectionProps) {
  const { reviews, markHelpful, refetch } = useProductReviews({ productId, onlyApproved: true });
  const stats = useReviewStats(productId);

  return (
    <section className="space-y-4">
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-primary fill-primary" />
              Avaliações
            </h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold gradient-text">{stats.average.toFixed(1)}</span>
              <div className="flex flex-col">
                <ReviewStars value={stats.average} size={18} />
                <span className="text-xs text-muted-foreground">
                  {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'}
                </span>
              </div>
            </div>
          </div>
          <ReviewForm productId={productId} tenantId={tenantId} onSubmitted={refetch} />
        </div>

        {stats.total > 0 && (
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = stats.distribution[s] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted-foreground">{s}</span>
                  <Star className="w-3 h-3 fill-primary text-primary shrink-0" />
                  <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-muted-foreground">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Ainda não há avaliações. Seja o primeiro a avaliar!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} onHelpful={markHelpful} />
          ))}
        </div>
      )}
    </section>
  );
}
