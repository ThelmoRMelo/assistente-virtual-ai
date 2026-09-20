// ImportedReviewsPicker.tsx - Revisão das avaliações encontradas na importação por link
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ImportedReview } from '@/hooks/useProductImport';

interface Props {
  reviews: ImportedReview[];
  selected: boolean[];
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export function ImportedReviewsPicker({ reviews, selected, onToggle, onSelectAll, onClearAll }: Props) {
  if (reviews.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nenhuma avaliação pública encontrada para este produto.
      </p>
    );
  }

  const count = selected.filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-semibold flex items-center gap-1">
          <Star className="w-4 h-4 text-primary fill-primary" /> Avaliações encontradas
        </p>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onSelectAll}>
            Selecionar todas
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClearAll}>
            Desmarcar todas
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {reviews.map((r, i) => (
          <label
            key={`${r.customerName}-${i}`}
            className="flex gap-2 items-start rounded-lg bg-muted/40 p-2.5 cursor-pointer"
          >
            <Checkbox checked={selected[i]} onCheckedChange={() => onToggle(i)} className="mt-0.5" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium truncate">{r.customerName}</span>
                <span className="flex">
                  {Array.from({ length: r.stars }).map((_, s) => (
                    <Star key={s} className="w-3 h-3 text-primary fill-primary" />
                  ))}
                </span>
              </div>
              <p className="text-xs text-muted-foreground break-words">"{r.comment}"</p>
              {r.sourcePlatform && (
                <p className="text-[10px] text-muted-foreground">Fonte: {r.sourcePlatform}</p>
              )}
            </div>
          </label>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {count} {count === 1 ? 'avaliação selecionada' : 'avaliações selecionadas'} — serão salvas como pendentes para
        sua aprovação.
      </p>
    </div>
  );
}
