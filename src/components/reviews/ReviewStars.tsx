import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewStarsProps {
  value: number;
  size?: number;
  onChange?: (value: number) => void;
  className?: string;
}

export function ReviewStars({ value, size = 16, onChange, className }: ReviewStarsProps) {
  const interactive = Boolean(onChange);
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i)}
            className={cn(
              'transition-transform',
              interactive && 'hover:scale-110 cursor-pointer',
              !interactive && 'cursor-default'
            )}
            aria-label={`${i} estrela${i > 1 ? 's' : ''}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                filled ? 'fill-primary text-primary' : 'text-muted-foreground/40'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
