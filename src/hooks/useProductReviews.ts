import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ProductReview {
  id: string;
  product_id: string;
  tenant_id: string | null;
  customer_name: string;
  comment: string;
  stars: number;
  status: ReviewStatus;
  admin_reply: string | null;
  admin_reply_at: string | null;
  ania_reply: string | null;
  ania_reply_at: string | null;
  helpful_count: number;
  is_pinned: boolean;
  is_reported: boolean;
  created_at: string;
  updated_at: string;
}

interface UseReviewsOptions {
  productId?: string;
  status?: ReviewStatus | 'all';
  onlyApproved?: boolean;
  enabled?: boolean;
}

export function useProductReviews(opts: UseReviewsOptions = {}) {
  const { productId, status = 'all', onlyApproved = false, enabled = true } = opts;
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(enabled);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('product_reviews')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('helpful_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (productId) q = q.eq('product_id', productId);
    if (onlyApproved) q = q.eq('status', 'approved');
    else if (status !== 'all') q = q.eq('status', status);

    const { data, error } = await q;
    if (!error && data) setReviews(data as ProductReview[]);
    setLoading(false);
  }, [productId, status, onlyApproved]);

  useEffect(() => {
    if (enabled) fetchReviews();
  }, [fetchReviews, enabled]);

  const submitReview = useCallback(
    async (input: { product_id: string; customer_name: string; comment: string; stars: number; tenant_id?: string | null }) => {
      const { error } = await supabase.from('product_reviews').insert({
        product_id: input.product_id,
        customer_name: input.customer_name.trim().slice(0, 80),
        comment: input.comment.trim().slice(0, 1000),
        stars: Math.max(1, Math.min(5, input.stars)),
        status: 'pending',
        tenant_id: input.tenant_id ?? null,
      });
      if (error) throw error;
    },
    []
  );

  const updateReview = useCallback(async (id: string, patch: Partial<ProductReview>) => {
    const { error } = await supabase.from('product_reviews').update(patch).eq('id', id);
    if (error) throw error;
    await fetchReviews();
  }, [fetchReviews]);

  const approveReview = (id: string) => updateReview(id, { status: 'approved' });
  const rejectReview = (id: string) => updateReview(id, { status: 'rejected' });
  const togglePin = (review: ProductReview) => updateReview(review.id, { is_pinned: !review.is_pinned });
  const setAdminReply = (id: string, admin_reply: string) =>
    updateReview(id, { admin_reply, admin_reply_at: new Date().toISOString() });

  const deleteReview = useCallback(async (id: string) => {
    const { error } = await supabase.from('product_reviews').delete().eq('id', id);
    if (error) throw error;
    await fetchReviews();
  }, [fetchReviews]);

  const markHelpful = useCallback(async (reviewId: string) => {
    let fp = localStorage.getItem('review_fp');
    if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem('review_fp', fp);
    }
    const { data, error } = await supabase.rpc('register_review_helpful', {
      _review_id: reviewId,
      _fingerprint: fp,
    });
    if (error) throw error;
    if (data) {
      setReviews(prev => prev.map(r => (r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r)));
    }
    return Boolean(data);
  }, []);

  return {
    reviews,
    loading,
    refetch: fetchReviews,
    submitReview,
    approveReview,
    rejectReview,
    togglePin,
    setAdminReply,
    deleteReview,
    markHelpful,
  };
}

export function useReviewStats(productId?: string) {
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
  });

  useEffect(() => {
    const fetch = async () => {
      let q = supabase.from('product_reviews').select('stars').eq('status', 'approved');
      if (productId) q = q.eq('product_id', productId);
      const { data } = await q;
      if (!data) return;
      const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;
      data.forEach((r: any) => {
        dist[r.stars] = (dist[r.stars] || 0) + 1;
        sum += r.stars;
      });
      setStats({
        total: data.length,
        average: data.length > 0 ? sum / data.length : 0,
        distribution: dist,
      });
    };
    fetch();
  }, [productId]);

  return stats;
}
