import { useEffect, useState } from 'react';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import aniaAvatar from '@/assets/ania-avatar.png';

const SESSION_KEY = 'ania_splash_shown_v1';

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const { config, loading } = useBusinessConfig();
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [hiding, setHiding] = useState(false);

  const enabled = (config?.splash_enabled ?? true) !== false;
  const duration = Math.min(5000, Math.max(1000, config?.splash_duration_ms ?? 2000));
  const animation = config?.splash_animation ?? true;
  const bgType = config?.splash_bg_type ?? 'solid';
  const bg =
    bgType === 'gradient'
      ? `linear-gradient(135deg, ${config?.splash_bg_gradient_from || '#7c3aed'} 0%, ${config?.splash_bg_gradient_to || '#06b6d4'} 100%)`
      : config?.splash_bg_color || '#0F172A';
  const image = config?.splash_image_url || aniaAvatar;

  useEffect(() => {
    if (!visible) return;
    if (loading) return;
    if (!enabled) {
      setVisible(false);
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
      return;
    }
    const t1 = setTimeout(() => setHiding(true), duration);
    const t2 = setTimeout(() => {
      setVisible(false);
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
    }, duration + 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible, loading, enabled, duration]);

  return (
    <>
      {children}
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
            src={image}
            alt="Splash"
            className={animation ? 'splash-anim' : ''}
            style={{
              maxWidth: '55%',
              maxHeight: '55%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 10px 40px rgba(0,0,0,.4))',
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
