## Visão Geral

Implementar um sistema de avaliações por produto inspirado em Shopee/Hotmart, com moderação obrigatória, respostas do administrador e da ANIA, contador de utilidade, fixação e estatísticas por estrelas. Avaliações são **por produto** (não globais) e só aparecem publicamente após aprovação.

---

## 1. Banco de Dados

### Tabela `product_reviews`
Campos:
- `id`, `product_id` (FK products), `tenant_id`
- `customer_name`, `comment`, `stars` (1–5)
- `status` ('pending' | 'approved' | 'rejected')
- `admin_reply`, `admin_reply_at`
- `ania_reply`, `ania_reply_at`
- `helpful_count` (int, default 0)
- `is_pinned` (bool), `is_reported` (bool)
- `created_at`, `updated_at`

### Tabela `review_helpful_votes`
- `id`, `review_id`, `voter_fingerprint` (string baseado em localStorage), `created_at`
- Unique (review_id, voter_fingerprint) — evita voto duplicado

### RLS
- `product_reviews`:
  - Público pode SELECT apenas onde `status = 'approved'`
  - Público pode INSERT com `status = 'pending'` (validado via trigger/check)
  - Tenant (auth.uid() = tenant_id ou tenant_id NULL) pode UPDATE/DELETE/SELECT tudo do próprio produto
- `review_helpful_votes`:
  - Público pode INSERT e SELECT count

### GRANTs completos para anon/authenticated/service_role.

---

## 2. Vitrine Pública

### `ProductCard` (vitrine)
Abaixo do nome/preço: `⭐ 4.9 (127)` — média + total. Clicável → abre detalhe.

### Página de detalhe / Modal de avaliações
Renderizado na rota de chat do produto (`/chat/:id` e `/loja/:slug/chat/:id`) numa seção colapsável "Avaliações", e também acessível via botão "Ver avaliações" no ProductCard.

Conteúdo:
- Nota média grande + total
- Barra de distribuição por estrelas (5★ 92%, 4★ 5%…)
- Botão **✍️ Deixar avaliação** → abre dialog com Nome, Estrelas (clicável), Comentário, Enviar
- Lista de avaliações aprovadas (ordenadas: fixadas primeiro, depois mais recentes)
  - Estrelas, nome, data, comentário
  - Bloco "Resposta do Administrador" (se houver)
  - Bloco "Resposta da ANIA" (se houver, com avatar/ícone diferenciado)
  - Botão **👍 Esta avaliação foi útil (N)** — registra voto e incrementa contador (com fingerprint local p/ evitar duplicata na UI)

Após enviar avaliação: toast "Sua avaliação será publicada após aprovação".

---

## 3. Painel Administrativo

### Home (`src/pages/Home.tsx`)
- **Remover** card "Testar Fluxo de Vendas" (Simular)
- **Adicionar** card "⭐ Avaliações e Depoimentos" → navega para `/avaliacoes`

### Nova página `/avaliacoes` (`src/pages/Reviews.tsx`)
Tabs:
- Pendentes
- Aprovadas
- Rejeitadas
- Reportadas
- Sem resposta

Cada item mostra: produto, nome, estrelas, comentário, data. Ações:
- Aprovar / Rejeitar
- Responder (como Admin)
- Gerar resposta da ANIA (chama edge function que usa Lovable AI)
- Excluir / Fixar / Desfixar

### Produtos (`src/pages/Products.tsx`)
Adicionar ícone ⭐ no card de cada produto → abre dialog com lista de avaliações daquele produto + mesmas ações de moderação.

---

## 4. Resposta da ANIA (IA)

Edge function `generate-review-reply`:
- Input: review_id
- Busca review + produto + business_config
- Chama Lovable AI Gateway (`google/gemini-2.5-flash`) com prompt curto: ANIA respondendo cordialmente ao comentário, em PT-BR, máximo 2 frases, usando emojis se `use_emojis` ativo
- Salva `ania_reply` no banco

Acionado manualmente pelo admin via botão "Resposta da ANIA".

---

## 5. Arquivos

### Criar
- `supabase/migrations/<ts>_reviews.sql`
- `src/hooks/useProductReviews.ts` — fetch público (aprovadas) e admin (todas)
- `src/hooks/useReviewStats.ts` — média, total, distribuição
- `src/components/reviews/ReviewStars.tsx` — display + input de estrelas
- `src/components/reviews/ReviewsSection.tsx` — bloco público completo (lista + form)
- `src/components/reviews/ReviewForm.tsx` — dialog para nova avaliação (com zod validation)
- `src/components/reviews/ReviewItem.tsx` — item público com respostas e botão útil
- `src/components/reviews/AdminReviewItem.tsx` — item com ações de moderação
- `src/components/reviews/ProductReviewsDialog.tsx` — modal para admin gerenciar reviews de um produto
- `src/pages/Reviews.tsx` — página geral de moderação
- `supabase/functions/generate-review-reply/index.ts` — gera resposta da ANIA via Lovable AI

### Editar
- `src/App.tsx` — rota `/avaliacoes`
- `src/pages/Home.tsx` — remover "Testar Fluxo" e adicionar card "Avaliações"
- `src/pages/Products.tsx` — botão ⭐ por produto
- `src/pages/Chat.tsx` — seção `ReviewsSection` colapsável no produto atual
- `src/components/vitrine/ProductCard.tsx` — exibir rating resumido
- `src/integrations/supabase/types.ts` — atualizado automaticamente após migration

---

## 6. Design

Manter identidade neon/gradiente da ANIA:
- Estrelas em tom `--primary` (preenchidas) / `--muted-foreground` (vazias)
- Cards de review usando `glass-card` ou `bg-card` com `border-border/40`
- Resposta da ANIA com gradiente sutil + ícone Sparkles para diferenciar da resposta admin
- Totalmente responsivo (mobile-first: stack vertical; desktop: grid de stats + lista)

---

## 7. Validação

- Zod schema no form: nome 2–60 chars, comentário 5–1000 chars, stars 1–5
- Sanitização básica (trim, sem HTML)
- Rate limit informal: localStorage marca último envio por produto (1 min)

---

## Observações

- Tudo respeita `tenant_id` quando presente
- Avaliações **nunca** aparecem publicamente sem `status='approved'`
- Sistema é independente por produto: stats e listas filtram por `product_id`