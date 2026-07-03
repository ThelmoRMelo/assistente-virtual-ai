import { useEffect } from 'react';
import { useBusinessConfig } from './useBusinessConfig';

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

  useEffect(() => {
    if (!iconUrl) return;
    // Cache-buster para evitar que o navegador continue exibindo o ícone antigo.
    const urlWithBuster = iconUrl.includes('?')
      ? `${iconUrl}&v=${Date.now()}`
      : `${iconUrl}?v=${Date.now()}`;

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
    const manifest = {
      name: 'ANIA',
      short_name: 'ANIA',
      start_url: '/',
      // display: 'browser' evita o splash nativo do Android; o único splash
      // exibido passa a ser o configurável no painel "Meu Negócio".
      display: 'browser',
      background_color: '#0F172A',
      theme_color: '#0F172A',
      prefer_related_applications: true,
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
  }, [iconUrl]);
}
