import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { BottomNav } from '@/components/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductReviews } from '@/hooks/useProductReviews';
import { AdminReviewItem } from '@/components/reviews/AdminReviewItem';
import { Loader2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Reviews() {
  const {
    reviews,
    loading,
    refetch,
    approveReview,
    rejectReview,
    deleteReview,
    togglePin,
    setAdminReply,
  } = useProductReviews({});

  const [productNames, setProductNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = Array.from(new Set(reviews.map((r) => r.product_id)));
    if (ids.length === 0) return;
    supabase
      .from('products')
      .select('id,name')
      .in('id', ids)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((p: any) => (map[p.id] = p.name));
          setProductNames(map);
        }
      });
  }, [reviews]);

  const buckets = useMemo(
    () => ({
      pending: reviews.filter((r) => r.status === 'pending'),
      approved: reviews.filter((r) => r.status === 'approved'),
      rejected: reviews.filter((r) => r.status === 'rejected'),
      reported: reviews.filter((r) => r.is_reported),
      unanswered: reviews.filter((r) => r.status === 'approved' && !r.admin_reply && !r.ania_reply),
    }),
    [reviews]
  );

  const renderList = (list: typeof reviews, emptyMsg: string) => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      );
    }
    if (list.length === 0) {
      return <p className="text-center text-muted-foreground py-8 text-sm">{emptyMsg}</p>;
    }
    return (
      <div className="space-y-3">
        {list.map((r) => (
          <AdminReviewItem
            key={r.id}
            review={r}
            productName={productNames[r.product_id]}
            onApprove={approveReview}
            onReject={rejectReview}
            onDelete={deleteReview}
            onTogglePin={togglePin}
            onSetAdminReply={setAdminReply}
            onRefetch={refetch}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Avaliações" subtitle="Modere comentários e depoimentos" />
      <main className="px-4 py-4 max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Star className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold">Total de avaliações: {reviews.length}</p>
            <p className="text-xs text-muted-foreground">
              {buckets.pending.length} pendentes • {buckets.approved.length} aprovadas
            </p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto">
            <TabsTrigger value="pending" className="text-xs">Pendentes ({buckets.pending.length})</TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">Aprovadas ({buckets.approved.length})</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs">Rejeitadas ({buckets.rejected.length})</TabsTrigger>
            <TabsTrigger value="reported" className="text-xs">Reportadas ({buckets.reported.length})</TabsTrigger>
            <TabsTrigger value="unanswered" className="text-xs">Sem resposta ({buckets.unanswered.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">{renderList(buckets.pending, 'Nenhuma avaliação pendente.')}</TabsContent>
          <TabsContent value="approved" className="mt-4">{renderList(buckets.approved, 'Nenhuma avaliação aprovada ainda.')}</TabsContent>
          <TabsContent value="rejected" className="mt-4">{renderList(buckets.rejected, 'Nenhuma avaliação rejeitada.')}</TabsContent>
          <TabsContent value="reported" className="mt-4">{renderList(buckets.reported, 'Nenhuma avaliação reportada.')}</TabsContent>
          <TabsContent value="unanswered" className="mt-4">{renderList(buckets.unanswered, 'Tudo respondido! 🎉')}</TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
}
