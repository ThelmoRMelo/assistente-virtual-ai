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
    
    const ogTitle = product.name || "Produto";
    const ogDescription = product.short_description || "Confira este produto incrível!";
    const ogImage = product.image_url || "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(ogTitle)}</title>
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:url" content="${escapeHtml(chatUrl)}">
  <meta property="og:type" content="website">
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  
  <!-- WhatsApp specific -->
  <meta property="og:site_name" content="${escapeHtml(ogTitle)}">
  
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
  </style>
</head>
<body>
  <div class="container">
    ${ogImage ? `<img src="${escapeHtml(ogImage)}" alt="${escapeHtml(ogTitle)}" class="product-image">` : ''}
    <h1 class="product-name">${escapeHtml(ogTitle)}</h1>
    <p class="product-description">${escapeHtml(ogDescription)}</p>
    <div class="loading">
      <div class="spinner"></div>
      Redirecionando...
    </div>
  </div>
  
  <script>
    setTimeout(function() {
      window.location.href = "${chatUrl}";
    }, 1500);
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
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
