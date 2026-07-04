import { useEffect } from 'react';
import { useBusinessConfig } from './useBusinessConfig';
import { assetVersionKey, versionAssetUrl } from '@/lib/versioned-assets';

/**
 * Injeta dinamicamente o Ícone Oficial da ANIA em:
 * - favicon (aba do navegador)
 * - apple-touch-icon (tela inicial iOS)
 * - manifest do PWA (ícone instalado)
 *
 * Um único ícone é a fonte da verdade. Se não houver ícone cadastrado,
 * mantém o ícone padrão do index.html.
 */
export function useOfficialIcon() {
  const { config } = useBusinessConfig();
  const iconUrl = config?.official_icon_url || null;
  const iconVersion = assetVersionKey(config?.updated_at, iconUrl);

  useEffect(() => {
    if (!iconUrl) return;
    const urlWithBuster = versionAssetUrl(iconUrl, iconVersion);

    // Remove links antigos de icon / apple-touch-icon
    document
      .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      .forEach((el) => el.parentNode?.removeChild(el));

    const addLink = (rel: string, sizes?: string) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = urlWithBuster;
      if (sizes) link.setAttribute('sizes', sizes);
      document.head.appendChild(link);
    };

    addLink('icon');
    addLink('shortcut icon');
    addLink('apple-touch-icon', '180x180');
    addLink('apple-touch-icon', '192x192');
    addLink('apple-touch-icon', '512x512');

    // Manifest dinâmico via blob URL
    // IMPORTANTE: como o manifest é servido via blob: URL, URLs relativas
    // (ex.: "/") seriam resolvidas contra a blob URL e o navegador usaria
    // a página atual como start_url — fazendo o PWA abrir na tela onde foi
    // instalado (ex.: /ajustes). Usamos URLs absolutas para garantir "/".
    const origin = window.location.origin;
    const manifest = {
      id: `${origin}/`,
      name: 'ANIA',
      short_name: 'ANIA',
      start_url: `${origin}/`,
      scope: `${origin}/`,
      display: 'standalone',
      background_color: '#0F172A',
      theme_color: '#0F172A',
      icons: [
        { src: urlWithBuster, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: urlWithBuster, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    const manifestUrl = URL.createObjectURL(blob);

    document
      .querySelectorAll('link[rel="manifest"]')
      .forEach((el) => el.parentNode?.removeChild(el));
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = manifestUrl;
    document.head.appendChild(manifestLink);

    return () => URL.revokeObjectURL(manifestUrl);
  }, [iconUrl, iconVersion]);
}
