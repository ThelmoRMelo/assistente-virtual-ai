import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductInfo {
  id: string;
  nome: string;
  preco: number;
  descricao?: string;
  precoMinimo?: number | null;
  formasPagamento?: string[];
  infoEntrega?: string;
  linkPagamento?: string;
}

interface ProductContext extends ProductInfo {
  categoria?: string;
  linkPagamento?: string;
}

interface NegotiationState {
  hasOfferedDiscount: boolean;
  lastDiscountOffered: number | null;
  discountAttempts: number;
  maxDiscountReached: boolean;
}

interface ClosingState {
  isClosing: boolean;
  closingReason: 'discount_max' | 'purchase_intent' | 'price_accepted' | 'contact_request' | null;
  closingAttempts: number;
  hasOfferedWhatsApp: boolean;
  hasOfferedPaymentLink: boolean;
  conversationEnded: boolean;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * ai-fallback - ANIA: Assistente de Vendas Virtual
 * 
 * REGRAS ABSOLUTAS:
 * 1. ANIA é a assistente da LOJA ATUAL (nunca citar T&V Sistemas ou desenvolvedores)
 * 2. Identidade dinâmica baseada nos dados da loja
 * 3. Produtos listados em Markdown estruturado
 * 4. Fechamento via link de pagamento OU página externa
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      businessName, 
      businessCategory, 
      products,
      productContext,
      productId,
      negotiationState,
      conversationHistory,
      lastBotResponse,
      closingState,
      mode
    } = await req.json();

    const chatMode: 'vitrine' | 'product' = mode === 'vitrine' || !productContext ? 'vitrine' : 'product';

    // Load global ANIA settings (best-effort)
    let aniaSettings: any = null;
    try {
      const supaUrl = Deno.env.get("SUPABASE_URL");
      const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
      if (supaUrl && supaKey) {
        const supa = createClient(supaUrl, supaKey);
        const { data } = await supa.from("ania_settings").select("*").limit(1).maybeSingle();
        aniaSettings = data || null;
      }
    } catch (e) {
      console.warn("[ai-fallback] ania_settings load failed:", e);
    }

    const assistantName = aniaSettings?.assistant_name || "ANIA";
    const fallbackMessage =
      aniaSettings?.fallback_message ||
      "Essa informação não está cadastrada no sistema no momento.";

    // 🛡️ BLOQUEIO ABSOLUTO: modo vitrine (sem produto selecionado)
    if (chatMode === 'vitrine') {
      const msgLowerEarly = String(message || '').toLowerCase();
      const negotiationRegex = /\b(desconto|descontos|menor|menos|baix(ar|a)|abaix(ar|a)|promo[cç][aã]o|barato|negoci(ar|ação|acao)|pix|cart[aã]o|parcel|parcelamento|à vista|a vista|boleto|pagar|pagamento|comprar|compro|fechar|finalizar|valor|preço|preco|quanto custa|quanto é|quanto e|prazo|acesso|certificado|benef[ií]cio|garantia|cupom|frete|entrega)\b/i;
      if (negotiationRegex.test(msgLowerEarly)) {
        return new Response(
          JSON.stringify({
            response: `Para que eu possa te ajudar corretamente, **escolha primeiro um produto do catálogo** disponível 👇\n\nToque em **"Saber mais"** no produto desejado para que eu possa te dar valores, condições e formas de pagamento específicas.`,
            showCatalog: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }




    const storeName = businessName || "nossa loja";
    const storeCategory = businessCategory || "produtos";
    const productList = products as ProductInfo[] || [];
    const hasProducts = productList.length > 0;
    const negotiation = negotiationState as NegotiationState || {
      hasOfferedDiscount: false,
      lastDiscountOffered: null,
      discountAttempts: 0,
      maxDiscountReached: false
    };
    const closing = closingState as ClosingState || {
      isClosing: false,
      closingReason: null,
      closingAttempts: 0,
      hasOfferedWhatsApp: false,
      hasOfferedPaymentLink: false,
      conversationEnded: false
    };
    const history = conversationHistory as ConversationMessage[] || [];

    // Se não há produtos, responder diretamente
    if (!hasProducts) {
      return new Response(
        JSON.stringify({ response: `Ainda não temos produtos cadastrados na **${storeName}**. Em breve teremos novidades! 😊` }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se a conversa já foi encerrada
    if (closing.conversationEnded) {
      return new Response(
        JSON.stringify({ 
          response: "Quando quiser finalizar, é só me chamar! 👍",
          closingUpdate: { conversationEnded: true }
        }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se já houve mensagens (não é primeira interação)
    const isFirstMessage = history.length === 0;

    // Formatar catálogo em MARKDOWN ESTRUTURADO para a IA
    const catalogMarkdown = productList.map((p: ProductInfo) => {
      const price = Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return `### 🔹 ${p.nome}
**Preço:** ${price}
${p.descricao ? `📝 ${p.descricao.substring(0, 100)}` : ''}
👉 Clique para ver detalhes`;
    }).join('\n\n');

    // Formatar catálogo simples para contexto interno
    const catalogText = productList.map((p: ProductInfo) => {
      const price = Number(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const minPrice = p.precoMinimo 
        ? Number(p.precoMinimo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : null;
      let line = `• ${p.nome}: ${price}`;
      if (minPrice) line += ` (mínimo: ${minPrice})`;
      if (p.descricao) line += ` - ${p.descricao.substring(0, 80)}`;
      return line;
    }).join('\n');

    // Contexto de produto específico
    let focusedProductText = "";
    let focusedProduct: ProductContext | null = null;
    
    if (productContext) {
      focusedProduct = productContext as ProductContext;
      const price = Number(focusedProduct.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const minPrice = focusedProduct.precoMinimo 
        ? Number(focusedProduct.precoMinimo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : null;
      const maxDiscount = focusedProduct.precoMinimo 
        ? ((focusedProduct.preco - focusedProduct.precoMinimo) / focusedProduct.preco * 100).toFixed(0)
        : null;
      
      const hasPaymentLink = focusedProduct.linkPagamento && focusedProduct.linkPagamento.trim() !== '';
      
      focusedProductText = `
═══════════════════════════════════════════
🎯 PRODUTO EM FOCO (cliente já escolheu):
• Nome: ${focusedProduct.nome}
• Preço: ${price}${minPrice ? `\n• Preço mínimo: ${minPrice} (desconto máximo: ${maxDiscount}%)` : '\n• SEM margem para desconto'}${focusedProduct.descricao ? `\n• Descrição: ${focusedProduct.descricao}` : ''}${focusedProduct.formasPagamento?.length ? `\n• Pagamento: ${focusedProduct.formasPagamento.join(', ')}` : ''}${focusedProduct.infoEntrega ? `\n• Entrega: ${focusedProduct.infoEntrega}` : ''}
${hasPaymentLink ? `\n💳 LINK DISPONÍVEL: ${focusedProduct.linkPagamento}` : '\n⚠️ SEM link cadastrado - orientar via WhatsApp'}
═══════════════════════════════════════════

IMPORTANTE: O cliente JÁ ESCOLHEU este produto. Foque apenas nele. NÃO liste outros produtos.`;
    }

    // Detectar gatilhos
    const msgLower = message.toLowerCase();
    
    // Detectar se cliente está perguntando sobre identidade
    const isAskingIdentity = /\b(quem (é|e) você|quem (és|es) tu|você (é|e) quem|qual (é|e) seu nome|me apresent|se apresent)\b/.test(msgLower);
    
    // Detectar se cliente quer ver catálogo/produtos
    const isAskingCatalog = /\b(catálogo|catalogo|produtos|opções|opcoes|o que (vocês|voces) (vende|tem|oferecem)|me mostra|quero ver|lista|cardápio|cardapio)\b/.test(msgLower);
    
    // Detectar se cliente está pedindo link de pagamento
    const isAskingPaymentLink = /\b(pix|link|pagar|pagamento|como (eu )?(pago|faco|faço)|me (manda|passa|envia) o link|quero (pagar|comprar)|finalizar|fechar pedido)\b/.test(msgLower);
    
    const closingTriggers = {
      priceAccepted: /\b(ok|tá|ta|beleza|fechado|pode ser|aceito|quero|sim|vou levar|levo|comprar|compro|esse mesmo)\b/.test(msgLower),
      purchaseIntent: /\b(como (eu )?(faco|faço|compro|pago)|quero (comprar|fechar|pagar)|vou (comprar|pegar|levar)|me (passa|manda|envia))\b/.test(msgLower),
      contactRequest: /\b(whatsapp|zap|whats|telefone|ligar|contato|humano|atendente|pessoa)\b/.test(msgLower),
      paymentRequest: isAskingPaymentLink,
      discountMax: negotiation.maxDiscountReached
    };

    const shouldActivateClosing = !closing.isClosing && (
      closingTriggers.priceAccepted ||
      closingTriggers.purchaseIntent ||
      closingTriggers.contactRequest ||
      closingTriggers.discountMax
    );

    const isInClosingMode = closing.isClosing || shouldActivateClosing;
    
    let closingReason = closing.closingReason;
    if (shouldActivateClosing) {
      if (closingTriggers.priceAccepted) closingReason = 'price_accepted';
      else if (closingTriggers.purchaseIntent) closingReason = 'purchase_intent';
      else if (closingTriggers.contactRequest) closingReason = 'contact_request';
      else if (closingTriggers.discountMax) closingReason = 'discount_max';
    }

    // Verificar se mensagem pede desconto
    const discountKeywords = ['desconto', 'menor', 'baixar', 'abaixar', 'menos', 'promocao', 'promoção', 'melhor preço', 'negociar', 'barato'];
    const isAskingDiscount = discountKeywords.some(kw => msgLower.includes(kw));

    // Verificar se o cliente está respondendo a uma pergunta binária
    const isRespondingToChoice = /^(pix|cartão|cartao|credito|crédito|débito|debito|entrega|retirada|ok|sim|não|nao)$/i.test(msgLower.trim());
    
    // Verificar se o cliente está fazendo pergunta objetiva
    const isAskingObjectiveQuestion = /\?$/.test(message.trim()) || /\b(quanto|qual|como|quando|onde|tem|pode)\b/.test(msgLower);

    const shouldIncrementClosingAttempts = isInClosingMode && !isRespondingToChoice && !isAskingObjectiveQuestion;

    // Estado de negociação formatado
    const negotiationInfo = `
ESTADO DA NEGOCIAÇÃO:
- Já ofereceu desconto? ${negotiation.hasOfferedDiscount ? 'SIM' : 'NÃO'}
- Último desconto oferecido: ${negotiation.lastDiscountOffered ? `R$ ${negotiation.lastDiscountOffered}` : 'Nenhum'}
- Tentativas de desconto: ${negotiation.discountAttempts}/3
- Limite máximo atingido? ${negotiation.maxDiscountReached ? 'SIM' : 'NÃO'}`;

    // Detectar se produto tem link de pagamento
    const productHasPaymentLink = focusedProduct?.linkPagamento && focusedProduct.linkPagamento.trim() !== '';
    
    // Estado de fechamento formatado
    const closingInfo = `
═══════════════════════════════════════════
🔥 ESTADO DE FECHAMENTO:
- Modo fechamento ativo? ${isInClosingMode ? 'SIM' : 'NÃO'}
- Motivo: ${closingReason || 'nenhum'}
- Tentativas de fechamento: ${closing.closingAttempts}/3
- WhatsApp oferecido? ${closing.hasOfferedWhatsApp ? 'SIM' : 'NÃO'}
- Link de pagamento oferecido? ${closing.hasOfferedPaymentLink ? 'SIM' : 'NÃO'}
- Produto tem link? ${productHasPaymentLink ? 'SIM' : 'NÃO'}
═══════════════════════════════════════════`;

    // Lógica de desconto progressivo
    let discountGuidance = "";
    if (isAskingDiscount && focusedProduct && !isInClosingMode) {
      const originalPrice = Number(focusedProduct.preco);
      const minPrice = focusedProduct.precoMinimo ? Number(focusedProduct.precoMinimo) : originalPrice;
      const maxDiscountAmount = originalPrice - minPrice;
      
      if (maxDiscountAmount <= 0) {
        discountGuidance = `
⚠️ DESCONTO SOLICITADO - SEM MARGEM:
Seja educado e FIRME. Diga que o preço já é o melhor possível.
Exemplo: "Esse já é o melhor preço que consigo fazer. Vamos fechar?"`;
      } else if (negotiation.maxDiscountReached) {
        discountGuidance = `
⚠️ CLIENTE INSISTINDO - LIMITE JÁ ATINGIDO:
AVISE CLARAMENTE que é o máximo e entre em MODO FECHAMENTO.`;
      } else {
        const discountStep = maxDiscountAmount / 3;
        const currentStep = Math.min(negotiation.discountAttempts + 1, 3);
        const suggestedDiscount = discountStep * currentStep;
        const suggestedPrice = originalPrice - suggestedDiscount;
        const isMaxReached = currentStep >= 3 || suggestedPrice <= minPrice;
        
        discountGuidance = `
💰 DESCONTO PROGRESSIVO (tentativa ${currentStep}/3):
- Preço original: R$ ${originalPrice.toFixed(2)}
- Novo preço a oferecer: R$ ${Math.max(suggestedPrice, minPrice).toFixed(2)}
- É o máximo? ${isMaxReached ? 'SIM - AVISE O CLIENTE!' : 'NÃO'}`;
      }
          }
    
