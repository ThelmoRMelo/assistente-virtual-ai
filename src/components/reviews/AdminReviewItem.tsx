import { useState } from 'react';
import { Check, X, Pin, PinOff, Trash2, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ReviewStars } from './ReviewStars';
import type { ProductReview } from '@/hooks/useProductReviews';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AdminReviewItemProps {
  review: ProductReview;
  productName?: string;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTogglePin: (review: ProductReview) => Promise<void>;
  onSetAdminReply: (id: string, reply: string) => Promise<void>;
  onRefetch: () => Promise<void>;
}

export function AdminReviewItem({
  review,
  productName,
  onApprove,
  onReject,
  onDelete,
  onTogglePin,
  onSetAdminReply,
  onRefetch,
}: AdminReviewItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState(review.admin_reply || '');
  const [savingReply, setSavingReply] = useState(false);
  const [generatingAnia, setGeneratingAnia] = useState(false);

  const handleSaveReply = async () => {
    if (!reply.trim()) return toast.error('Escreva uma resposta.');
    setSavingReply(true);
    try {
      await onSetAdminReply(review.id, reply.trim());
      toast.success('Resposta publicada!');
      setReplyOpen(false);
    } catch (e: any) {
      toast.error('Erro ao salvar', { description: e.message });
    } finally {
      setSavingReply(false);
    }
  };

  const handleGenerateAnia = async () => {
    setGeneratingAnia(true);
    try {
      const { error } = await supabase.functions.invoke('generate-review-reply', {
        body: { review_id: review.id },
      });
      if (error) throw error;
      toast.success('ANIA respondeu!');
      await onRefetch();
    } catch (e: any) {
      toast.error('Erro ao gerar resposta', { description: e.message });
    } finally {
      setGeneratingAnia(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className={cn('glass-card rounded-xl p-4 space-y-3', review.is_pinned && 'border border-primary/40')}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{review.customer_name}</span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded uppercase', statusColors[review.status])}>
              {review.status === 'pending' ? 'Pendente' : review.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
            </span>
            {review.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                <Pin className="w-3 h-3" /> Fixada
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <ReviewStars value={review.stars} size={14} />
            <span className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString('pt-BR')}
            </span>
            {productName && (
              <span className="text-xs text-muted-foreground truncate max-w-[160px]">• {productName}</span>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm whitespace-pre-wrap break-words">{review.comment}</p>

      {review.admin_reply && (
        <div className="ml-2 pl-3 border-l-2 border-primary/40 bg-primary/5 rounded-r-lg p-2 text-xs">
          <p className="font-semibold text-primary mb-1">Admin:</p>
          <p className="whitespace-pre-wrap">{review.admin_reply}</p>
        </div>
      )}

      {review.ania_reply && (
        <div className="ml-2 pl-3 border-l-2 border-secondary/60 bg-secondary/5 rounded-r-lg p-2 text-xs">
          <p className="font-semibold gradient-text mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> ANIA:
          </p>
          <p className="whitespace-pre-wrap">{review.ania_reply}</p>
        </div>
      )}

      {replyOpen && (
        <div className="space-y-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Resposta do administrador..."
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveReply} disabled={savingReply} variant="gradient" className="flex-1">
              {savingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar resposta'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setReplyOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {review.status !== 'approved' && (
          <Button size="sm" variant="outline" onClick={() => onApprove(review.id)} className="gap-1 h-8">
            <Check className="w-3.5 h-3.5" /> Aprovar
          </Button>
        )}
        {review.status !== 'rejected' && (
          <Button size="sm" variant="outline" onClick={() => onReject(review.id)} className="gap-1 h-8">
            <X className="w-3.5 h-3.5" /> Rejeitar
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setReplyOpen((o) => !o)} className="gap-1 h-8">
          <MessageSquare className="w-3.5 h-3.5" /> Responder
        </Button>
        <Button size="sm" variant="outline" onClick={handleGenerateAnia} disabled={generatingAnia} className="gap-1 h-8">
          {generatingAnia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          ANIA responder
        </Button>
        <Button size="sm" variant="outline" onClick={() => onTogglePin(review)} className="gap-1 h-8">
          {review.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          {review.is_pinned ? 'Desfixar' : 'Fixar'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (confirm('Excluir esta avaliação?')) onDelete(review.id);
          }}
          className="gap-1 h-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
