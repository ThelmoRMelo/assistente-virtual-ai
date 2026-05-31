import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProductReviews } from '@/hooks/useProductReviews';
import { AdminReviewItem } from './AdminReviewItem';
import { Loader2 } from 'lucide-react';

interface ProductReviewsDialogProps {
  productId: string | null;
  productName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductReviewsDialog({ productId, productName, open, onOpenChange }: ProductReviewsDialogProps) {
  const {
    reviews,
    loading,
    refetch,
    approveReview,
    rejectReview,
    deleteReview,
    togglePin,
    setAdminReply,
  } = useProductReviews({ productId: productId || undefined });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliações — {productName}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma avaliação para este produto.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <AdminReviewItem
                key={r.id}
                review={r}
                onApprove={approveReview}
                onReject={rejectReview}
                onDelete={deleteReview}
                onTogglePin={togglePin}
                onSetAdminReply={setAdminReply}
                onRefetch={refetch}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
