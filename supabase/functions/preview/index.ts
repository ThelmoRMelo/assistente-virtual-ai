import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const productId = pathParts[pathParts.length - 1];

    if (!productId) {
      return new Response("Product ID required", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: product, error } = await supabase
      .from("products")
      .select("name, short_description, image_url")
      .eq("id", productId)
      .single();

    if (error || !product) {
      return new Response("Product not found", { status: 404 });
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://assistente-virtual-ai.lovable.app";
    const chatUrl = `${siteUrl}/chat/${productId}`;

    // IMPORTANTE:
    // - Preview (bots/crawlers) precisa receber HTML com OG tags para gerar o banner.
    // - Clique humano deve redirecionar via HTTP 302 (sem depender de JS).
    const userAgent = req.headers.get("user-agent") ?? "";
    const secFetchMode = req.headers.get("sec-fetch-mode") ?? "";
    const secFetchDest = req.headers.get("sec-fetch-dest") ?? "";
    const secFetchUser = req.headers.get("sec-fetch-user") ?? "";
    const purpose = (req.headers.get("purpose") ?? req.headers.get("x-purpose") ?? "").toLowerCase();

    const isNavigation =
      secFetchMode.toLowerCase() === "navigate" ||
      secFetchDest.toLowerCase() === "document" ||
      secFetchUser === "?1";

    // WhatsApp/Instagram variam bastante no User-Agent; inclua todos para não perder o preview.
    const isSocialCrawler =
      /facebookexternalhit|Facebot|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Googlebot|Bingbot|WhatsApp|Instagram|MetaInspector/i.test(
        userAgent
      );

    const shouldServeOgHtml =
      !isNavigation &&
      (isSocialCrawler || purpose.includes("preview") || purpose.includes("prefetch"));

    if (!shouldServeOgHtml) {
      return Response.redirect(chatUrl, 302);
    }

    const ogTitle = product.name || "Produto";
    const ogDescription =
      product.short_description || "Confira este produto incrível!";
    const ogImage = product.image_url || `${siteUrl}/icon-512.png`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Redirect sem depender de JavaScript (CSP pode bloquear scripts) -->
  <meta http-equiv="refresh" content="0; url=${escapeHtml(chatUrl)}">
  <link rel="canonical" href="${escapeHtml(chatUrl)}">

  <title>${escapeHtml(ogTitle)}</title>
  <meta name="description" content="${escapeHtml(ogDescription)}">

  <!-- Open Graph Meta Tags (WhatsApp, Facebook, LinkedIn) -->
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(ogTitle)}">
  <meta property="og:url" content="${escapeHtml(chatUrl)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(ogTitle)}">
  <meta property="og:locale" content="pt_BR">

  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <meta name="twitter:image:alt" content="${escapeHtml(ogTitle)}">

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      text-align: center;
      padding: 20px;
      max-width: 500px;
    }
    .product-image {
      width: 100%;
      max-width: 400px;
      height: auto;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      margin-bottom: 24px;
      display: block;
    }
    .product-name {
      color: white;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 12px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .product-description {
      color: rgba(255,255,255,0.9);
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .loading {
      color: rgba(255,255,255,0.8);
      font-size: 14px;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .fallback-link {
      display: inline-block;
      margin-top: 10px;
      color: rgba(255,255,255,0.95);
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    ${ogImage ? `<a href="${escapeHtml(chatUrl)}"><img src="${escapeHtml(ogImage)}" alt="${escapeHtml(ogTitle)}" class="product-image"></a>` : ''}
    <h1 class="product-name">${escapeHtml(ogTitle)}</h1>
    <p class="product-description">${escapeHtml(ogDescription)}</p>
    <div class="loading">
      <div class="spinner"></div>
      Abrindo o chat do produto...
      <div>
        <a class="fallback-link" href="${escapeHtml(chatUrl)}">Clique aqui se não redirecionar</a>
      </div>
    </div>
  </div>
</body>
</html>`;

    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", "text/html; charset=utf-8");
    // WhatsApp não cacheia bem; usar cache curto para permitir atualizações
    headers.set("Cache-Control", "public, max-age=300, s-maxage=60");
    // Permite renderizar HTML/CSS/imagens sem depender de JavaScript.
    headers.set(
      "Content-Security-Policy",
      "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    );

    return new Response(html, { status: 200, headers });
  } catch (error) {
    console.error("Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
