import { useEffect, useMemo, useRef, useState } from 'react';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import aniaAvatar from '@/assets/ania-avatar.png';
import { assetVersionKey, versionAssetUrl } from '@/lib/versioned-assets';

/**
 * Splash oficial (único) da aplicação.
 * - Renderiza IMEDIATAMENTE, antes de qualquer tela.
 * - Só libera a interface após: config carregada + imagem pré-carregada + duração mínima.
 * - Exibe apenas uma vez por sessão.
 */
export function SplashScreen({ children }: { children: React.ReactNode }) {
  const { config, loading } = useBusinessConfig();
  const [visible, setVisible] = useState(true);
  const [hiding, setHiding] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [readyImage, setReadyImage] = useState<string | null>(null);
  const mountedAtRef = useRef<number>(Date.now());
  const finishedRef = useRef(false);

  // Remove o boot splash estático do index.html assim que o React monta o seu splash.
  useEffect(() => {
    const el = document.getElementById('ania-boot-splash');
    if (el) {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }
  }, []);

  const image = useMemo(() => {
    if (loading) return null;
    const configuredImage = config?.splash_image_url || config?.official_icon_url || aniaAvatar;
    return versionAssetUrl(configuredImage, assetVersionKey(config?.updated_at, configuredImage));
  }, [config?.official_icon_url, config?.splash_image_url, config?.updated_at, loading]);

  // Pré-carrega a imagem do splash configurado.
  useEffect(() => {
    if (!visible) return;
    setImgLoaded(false);
    setReadyImage(null);
    if (!image) return;

    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = async () => {
      try { await img.decode?.(); } catch {}
      if (cancelled) return;
      setReadyImage(image);
      setImgLoaded(true);
    };
    img.onerror = () => {
      if (cancelled) return;
      setReadyImage(null);
      setImgLoaded(true);
    };
    img.src = image;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
      img.src = '';
      setReadyImage(null);
    };
  }, [image, visible]);

  // Finaliza o splash quando: config carregada + imagem pronta + duração mínima cumprida.
  useEffect(() => {
    if (!visible || finishedRef.current) return;
    if (loading) return;

    const enabled = (config?.splash_enabled ?? true) !== false;
    if (!enabled) {
      finishedRef.current = true;
      setVisible(false);
      return;
    }
    if (image && !imgLoaded) return;

    finishedRef.current = true;
    const duration = Math.min(5000, Math.max(1000, config?.splash_duration_ms ?? 2000));
    const elapsed = Date.now() - mountedAtRef.current;
    const remaining = Math.max(0, duration - elapsed);
    const t1 = setTimeout(() => setHiding(true), remaining);
    const t2 = setTimeout(() => setVisible(false), remaining + 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible, loading, config, imgLoaded]);

  const bgType = config?.splash_bg_type ?? 'solid';
  const bg =
    bgType === 'gradient'
      ? `linear-gradient(135deg, ${config?.splash_bg_gradient_from || '#7c3aed'} 0%, ${config?.splash_bg_gradient_to || '#06b6d4'} 100%)`
      : config?.splash_bg_color || '#0F172A';
  const animation = config?.splash_animation ?? true;

  // Nada da UI principal aparece até o splash começar a esconder.
  const showChildren = !visible || hiding;

  return (
    <>
      {showChildren && children}
      {visible && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500"
          style={{
            background: bg,
            opacity: hiding ? 0 : 1,
            pointerEvents: hiding ? 'none' : 'auto',
          }}
        >
          <img
            src={readyImage || aniaAvatar}
            alt="Splash"
            className={animation ? 'splash-anim' : ''}
            style={{
              maxWidth: '55%',
              maxHeight: '55%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 10px 40px rgba(0,0,0,.4))',
              opacity: readyImage ? 1 : 0,
              transition: 'opacity .3s ease',
            }}
          />
          <style>{`
            @keyframes ania-splash-in {
              0% { opacity: 0; transform: scale(.85); }
              60% { opacity: 1; transform: scale(1.04); }
              100% { opacity: 1; transform: scale(1); }
            }
            .splash-anim { animation: ania-splash-in .9s ease-out both; }
          `}</style>
        </div>
      )}
    </>
  );
}
