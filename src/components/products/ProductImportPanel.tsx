// ProductImportPanel.tsx - Área de importação de produto por link de afiliado
import { useState } from 'react';
import { Link2, Search, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IMPORT_PLATFORMS, useProductImport, type ImportedProductData, type ImportedReview } from '@/hooks/useProductImport';
import { ImportedReviewsPicker } from './ImportedReviewsPicker';
import { toast } from 'sonner';

interface Props {
  onImported: (data: ImportedProductData, affiliateUrl: string) => void;
  onViewDuplicate?: (productId: string) => void;
  onReviewsChange?: (reviews: ImportedReview[]) => void;
}

export function ProductImportPanel({ onImported, onViewDuplicate, onReviewsChange }: Props) {
  const { importFromLink, importing, step } = useProductImport();
  const [link, setLink] = useState('');
  const [manualPlatform, setManualPlatform] = useState<string | null>(null);
  const [needsPlatform, setNeedsPlatform] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string[]>([]);
  const [duplicate, setDuplicate] = useState<{ id: string; name: string } | null>(null);
  const [pending, setPending] = useState<ImportedProductData | null>(null);
  const [foundReviews, setFoundReviews] = useState<ImportedReview[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [showReviews, setShowReviews] = useState(false);

  const emitReviews = (reviews: ImportedReview[], flags: boolean[]) => {
    onReviewsChange?.(reviews.filter((_, i) => flags[i]));
  };

  const applyFoundReviews = (reviews: ImportedReview[]) => {
    const list = reviews.slice(0, 5);
    const flags = list.map(() => true);
    setFoundReviews(list);
    setSelected(flags);
    setShowReviews(true);
    emitReviews(list, flags);
  };

  const toggle = (index: number) => {
    const flags = selected.map((v, i) => (i === index ? !v : v));
    setSelected(flags);
    emitReviews(foundReviews, flags);
  };

  const selectAll = () => {
    const flags = foundReviews.map(() => true);
    setSelected(flags);
    emitReviews(foundReviews, flags);
  };

  const clearAll = () => {
    const flags = foundReviews.map(() => false);
    setSelected(flags);
    emitReviews(foundReviews, flags);
  };

  const run = async (platform?: string | null) => {
    const url = link.trim();
    setErrorMsg(null);
    setNotice([]);
    setDuplicate(null);
    setPending(null);
    setShowReviews(false);
    setFoundReviews([]);
    setSelected([]);
    onReviewsChange?.([]);

    if (!/^https?:\/\/\S+\.\S+/i.test(url)) {
      setErrorMsg('Esse link não parece ser válido.');
      return;
    }

    const result = await importFromLink(url, platform ?? manualPlatform);

    if (result.code === 'unknown_platform') {
      setNeedsPlatform(true);
      setErrorMsg('Não conseguimos identificar automaticamente a plataforma.');
      return;
    }

    if (result.error || !result.product) {
      setErrorMsg(result.error ?? 'Não conseguimos localizar o produto através desse link.');
      return;
    }

    setNeedsPlatform(false);

    const messages = [...(result.warnings ?? [])];
    if (result.product.missingFields.length > 0) {
      messages.push('Algumas informações não estavam disponíveis para importação e podem ser preenchidas manualmente.');
    }
    setNotice(messages);

    if (result.duplicate) {
      setDuplicate(result.duplicate);
      setPending(result.product);
      return;
    }

    toast.success('✅ Produto encontrado!');
    onImported(result.product, url);
    applyFoundReviews(result.product.reviews ?? []);
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" />
        <p className="font-semibold text-sm">IMPORTAR PRODUTO</p>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Cole o link do produto ou seu link de afiliado. A ANIA tentará identificar a plataforma e preencher
        automaticamente as informações disponíveis.
      </p>

      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Link do produto / link de afiliado</label>
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Cole aqui seu link..."
          type="url"
          inputMode="url"
          maxLength={2000}
        />
      </div>

      {needsPlatform && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Selecione a plataforma manualmente:</p>
          <div className="flex flex-wrap gap-2">
            {IMPORT_PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setManualPlatform(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  manualPlatform === p.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button variant="gradient" className="w-full" onClick={() => run()} disabled={importing}>
        {importing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {step || 'Importando...'}
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Importar informações
          </>
        )}
      </Button>

      {errorMsg && (
        <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {duplicate && pending && (
  <div className="space-y-3 rounded-lg bg-muted/40 p-3">
    <div>
      <p className="text-xs font-medium">
        Este link já está cadastrado.
      </p>

      <p className="text-xs text-muted-foreground mt-1">
        O produto encontrado é:
        <span className="font-medium ml-1">
          {duplicate.name}
        </span>
      </p>
    </div>

    <div className="flex gap-2">
      {onViewDuplicate && (
        <Button
          variant="glass"
          size="sm"
          className="flex-1"
          onClick={() => onViewDuplicate(duplicate.id)}
        >
          Ver produto
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => {
          onImported(pending, link.trim());
          applyFoundReviews(pending.reviews ?? []);
          setDuplicate(null);
          setPending(null);
        }}
      >
        Usar informações
      </Button>
    </div>
  </div>
)}
      

      {notice.length > 0 && (
        <div className="space-y-1">
          {notice.map((n, i) => (
            <p key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/70" />
              {n}
            </p>
          ))}
        </div>
      )}

      {showReviews && (
        <div className="rounded-lg bg-background/40 p-3">
          <ImportedReviewsPicker
            reviews={foundReviews}
            selected={selected}
            onToggle={toggle}
            onSelectAll={selectAll}
            onClearAll={clearAll}
          />
        </div>
      )}
    </div>
  );
}
