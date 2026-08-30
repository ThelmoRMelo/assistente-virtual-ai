// Conectores modulares por plataforma.
// Cada conector: detecta o link, resolve o produto e normaliza os dados.

export interface NormalizedProduct {
  platform: string;
  platformLabel: string;
  externalId: string | null;
  sourceUrl: string;
  title: string | null;
  price: number | null;
  category: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  coverImage: string | null;
  galleryImages: string[];
  missingFields: string[];
}

export interface Connector {
  id: string;
  label: string;
  matches: (url: URL) => boolean;
  fetchProduct: (finalUrl: string, html: string | null) => Promise<NormalizedProduct>;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export async function resolveUrl(rawUrl: string): Promise<{ finalUrl: string; html: string | null }> {
  try {
    const res = await fetch(rawUrl, {
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    const finalUrl = res.url || rawUrl;
    if (!res.ok) return { finalUrl, html: null };
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html")) return { finalUrl, html: null };
    const html = await res.text();
    return { finalUrl, html: html.slice(0, 800_000) };
  } catch (_e) {
    return { finalUrl: rawUrl, html: null };
  }
}

// ---------- Extração de metadados públicos (OG tags / JSON-LD) ----------

function metaContent(html: string, patterns: string[]): string | null {
  for (const p of patterns) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${p}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${p}["']`,
      "i",
    );
    const m2 = html.match(re2);
    if (m2) return decodeEntities(m2[1]);
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function allMetaImages(html: string): string[] {
  const out: string[] = [];
  const re = /<meta[^>]+(?:property|name)=["']og:image(?::secure_url|:url)?["'][^>]*content=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(decodeEntities(m[1]));
  return out;
}

interface JsonLdProduct {
  name?: string;
  description?: string;
  image?: string | string[];
  category?: string;
  offers?: { price?: string | number; lowPrice?: string | number } | Array<{ price?: string | number }>;
}

function jsonLdProduct(html: string): JsonLdProduct | null {
  const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const candidates = Array.isArray(parsed) ? parsed : [parsed, ...(parsed["@graph"] ?? [])];
      for (const c of candidates) {
        if (!c || typeof c !== "object") continue;
        const type = c["@type"];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes("Product")) return c as JsonLdProduct;
      }
    } catch (_e) {
      // ignora blocos inválidos
    }
  }
  return null;
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function uniq(list: string[]): string[] {
  return [...new Set(list.filter((u) => /^https?:\/\//i.test(u)))];
}

/** Normalização genérica baseada em metadados públicos da página. */
export function fromPublicMetadata(
  platform: string,
  platformLabel: string,
  finalUrl: string,
  html: string | null,
  externalId: string | null,
): NormalizedProduct {
  const base: NormalizedProduct = {
    platform,
    platformLabel,
    externalId,
    sourceUrl: finalUrl,
    title: null,
    price: null,
    category: null,
    shortDescription: null,
    longDescription: null,
    coverImage: null,
    galleryImages: [],
    missingFields: [],
  };

  if (html) {
    const ld = jsonLdProduct(html);
    const offers = Array.isArray(ld?.offers) ? ld?.offers?.[0] : ld?.offers;

    base.title = ld?.name ?? metaContent(html, ["og:title", "twitter:title"]) ?? titleTag(html);
    base.price =
      toNumber(offers?.price) ??
      toNumber((offers as { lowPrice?: string | number } | undefined)?.lowPrice) ??
      toNumber(metaContent(html, ["product:price:amount", "og:price:amount"]));
    base.category = ld?.category ?? null;

    const desc = ld?.description ?? metaContent(html, ["og:description", "description", "twitter:description"]);
    if (desc) {
      base.shortDescription = desc.length > 180 ? desc.slice(0, 177) + "..." : desc;
      base.longDescription = desc;
    }

    const ldImages = ld?.image ? (Array.isArray(ld.image) ? ld.image : [ld.image]) : [];
    const images = uniq([...ldImages, ...allMetaImages(html)]);
    base.coverImage = images[0] ?? null;
    base.galleryImages = images.slice(1, 6);
  }

  return withMissing(base);
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]{1,300}?)<\/title>/i);
  return m ? decodeEntities(m[1]) : null;
}

export function withMissing(p: NormalizedProduct): NormalizedProduct {
  const missing: string[] = [];
  if (!p.title) missing.push("nome");
  if (!p.price) missing.push("preço");
  if (!p.category) missing.push("categoria");
  if (!p.shortDescription) missing.push("descrição");
  if (!p.coverImage) missing.push("imagem principal");
  p.missingFields = missing;
  return p;
}

// ---------------------- Mercado Livre ----------------------

const mercadoLivre: Connector = {
  id: "mercado_livre",
  label: "Mercado Livre",
  matches: (u) => /(^|\.)mercadolivre\.com|(^|\.)mercadolibre\.com|(^|\.)mercadolivre\.com\.br|mlb\.la/i.test(u.hostname),
  fetchProduct: async (finalUrl, html) => {
    const idMatch = finalUrl.match(/(ML[A-Z])-?(\d{6,})/i) ?? html?.match(/(ML[A-Z])-?(\d{6,})/i) ?? null;
    const itemId = idMatch ? `${idMatch[1].toUpperCase()}${idMatch[2]}` : null;

    if (itemId) {
      try {
        const res = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const item = await res.json();
          let category: string | null = null;
          if (item.category_id) {
            try {
              const catRes = await fetch(`https://api.mercadolibre.com/categories/${item.category_id}`);
              if (catRes.ok) category = (await catRes.json())?.name ?? null;
            } catch (_e) { /* opcional */ }
          }
          let description: string | null = null;
          try {
            const dRes = await fetch(`https://api.mercadolibre.com/items/${itemId}/description`);
            if (dRes.ok) description = (await dRes.json())?.plain_text ?? null;
          } catch (_e) { /* opcional */ }

          const pics: string[] = uniq(
            (item.pictures ?? []).map((p: { secure_url?: string; url?: string }) => p.secure_url || p.url || ""),
          );
          const attrs = (item.attributes ?? [])
            .filter((a: { name?: string; value_name?: string }) => a?.name && a?.value_name)
            .slice(0, 12)
            .map((a: { name: string; value_name: string }) => `${a.name}: ${a.value_name}`)
            .join("\n");

          return withMissing({
            platform: "mercado_livre",
            platformLabel: "Mercado Livre",
            externalId: itemId,
            sourceUrl: item.permalink || finalUrl,
            title: item.title ?? null,
            price: toNumber(item.price),
            category,
            shortDescription: item.title ?? null,
            longDescription: [description, attrs].filter(Boolean).join("\n\n") || null,
            coverImage: pics[0] ?? item.thumbnail ?? null,
            galleryImages: pics.slice(1, 6),
            missingFields: [],
          });
        }
      } catch (_e) { /* cai no fallback de metadados */ }
    }

    return fromPublicMetadata("mercado_livre", "Mercado Livre", finalUrl, html, itemId);
  },
};

// ---------------------- Shopee ----------------------

const shopee: Connector = {
  id: "shopee",
  label: "Shopee",
  matches: (u) => /(^|\.)shopee\.|(^|\.)shp\.ee/i.test(u.hostname),
  fetchProduct: async (finalUrl, html) => {
    const m = finalUrl.match(/i\.(\d+)\.(\d+)/) ?? finalUrl.match(/-i\.(\d+)\.(\d+)/);
    const externalId = m ? `${m[1]}_${m[2]}` : null;
    return fromPublicMetadata("shopee", "Shopee", finalUrl, html, externalId);
  },
};

// ---------------------- Hotmart ----------------------

const hotmart: Connector = {
  id: "hotmart",
  label: "Hotmart",
  matches: (u) => /(^|\.)hotmart\.com|(^|\.)hotm\.art/i.test(u.hostname),
  fetchProduct: async (finalUrl, html) => {
    const off = finalUrl.match(/[?&]off=([A-Za-z0-9]+)/);
    const slug = finalUrl.match(/hotmart\.com\/[^/]+\/([A-Za-z0-9-]+)/);
    const externalId = off?.[1] ?? slug?.[1] ?? null;
    return fromPublicMetadata("hotmart", "Hotmart", finalUrl, html, externalId);
  },
};

// ---------------------- Genérico (outras plataformas) ----------------------

const genericConnector: Connector = {
  id: "outro",
  label: "Outra plataforma",
  matches: () => false,
  fetchProduct: (finalUrl, html) => Promise.resolve(fromPublicMetadata("outro", "Outra plataforma", finalUrl, html, null)),
};

export const connectors: Connector[] = [mercadoLivre, shopee, hotmart];

export function detectConnector(url: string, forced?: string | null): Connector | null {
  if (forced) {
    if (forced === "outro") return genericConnector;
    return connectors.find((c) => c.id === forced) ?? null;
  }
  try {
    const u = new URL(url);
    return connectors.find((c) => c.matches(u)) ?? null;
  } catch (_e) {
    return null;
  }
}

export { genericConnector };
