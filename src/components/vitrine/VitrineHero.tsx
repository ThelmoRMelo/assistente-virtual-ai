import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { ThemeConfig } from '@/lib/themes';
import aniaAvatar from '@/assets/ania-avatar.png';

export interface HeroCustomization {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  bannerUrl?: string | null;
  assistantImageUrl?: string | null;
  heroTitleSize?: number | null;
  heroSubtitleSize?: number | null;
  assistantPositionAxis?: 'horizontal' | 'vertical' | null;
  assistantPositionValue?: number | null;
  assistantSize?: number | null;
  showAssistantBubble?: boolean | null;
  assistantBubbleText?: string | null;
  heroButtonText?: string | null;
  heroButtonGlow?: number | null;
  heroButtonRadius?: number | null;
  primaryColor?: string | null;
  titleColor?: string | null;
  textColor?: string | null;
  buttonColor?: string | null;
  accentColor?: string | null;
}

interface VitrineHeroProps extends HeroCustomization {
  businessName: string;
  theme: ThemeConfig;
  chatPath: string;
  /** If true, render the CTA without router Link (for preview). */
  previewMode?: boolean;
}

export function VitrineHero({
  businessName,
  theme,
  chatPath,
  heroTitle,
  heroSubtitle,
  bannerUrl,
  assistantImageUrl,
  heroTitleSize,
  heroSubtitleSize,
  assistantPositionAxis,
  assistantPositionValue,
  assistantSize,
  showAssistantBubble,
  assistantBubbleText,
  heroButtonText,
  heroButtonGlow,
  heroButtonRadius,
  primaryColor,
  titleColor,
  textColor,
  buttonColor,
  accentColor,
  previewMode,
}: VitrineHeroProps) {
  const title = heroTitle?.trim() || 'Sua vitrine inteligente com atendimento 24h';
  const subtitle =
    heroSubtitle?.trim() ||
    'Cursos, aplicativos e soluções digitais que vendem por você com a ajuda da ANIA, sua assistente virtual.';
  const avatarSrc = assistantImageUrl?.trim() || aniaAvatar;

  const titleSize = heroTitleSize ?? 36;
  const subtitleSize = heroSubtitleSize ?? 18;
  const sizePct = (assistantSize ?? 100) / 100;
  const axis = assistantPositionAxis ?? 'vertical';
  const posVal = assistantPositionValue ?? 0;
  const showBubble = showAssistantBubble ?? true;
  const bubbleText = assistantBubbleText?.trim() || 'Olá! Precisa de ajuda?';
  const buttonText = heroButtonText?.trim() || 'Falar com a ANIA';
  const glow = heroButtonGlow ?? 50;
  const radius = heroButtonRadius ?? 12;

  const assistantTransform =
    axis === 'horizontal' ? `translateX(${posVal}%)` : `translateY(${posVal}%)`;

  const buttonStyle: React.CSSProperties = {
    backgroundColor: buttonColor || undefined,
    color: buttonColor ? '#fff' : undefined,
    borderRadius: `${radius}px`,
    boxShadow: glow > 0
      ? `0 0 ${glow * 0.6}px ${glow * 0.15}px ${buttonColor || 'hsl(var(--primary))'}`
      : 'none',
  };

  const ButtonInner = (
    <Button
      size="lg"
      className="text-lg px-8 h-14 font-semibold"
      style={buttonStyle}
    >
      {buttonText}
      <ArrowRight className="w-5 h-5 ml-2" />
    </Button>
  );

  return (
    <section
      className="relative overflow-hidden"
      style={{
        ...(primaryColor ? { ['--primary' as any]: primaryColor } : {}),
        ...(accentColor ? { ['--accent' as any]: accentColor } : {}),
      }}
    >
      {bannerUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        />
      ) : (
        <>
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"
            style={primaryColor ? { background: `linear-gradient(135deg, ${primaryColor}1a, transparent, ${accentColor || primaryColor}1a)` } : undefined}
          />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        </>
      )}

      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 text-center md:text-left">
            <h1
              className="font-bold leading-tight"
              style={{
                fontFamily: `'${theme.fonts.heading}', sans-serif`,
                fontSize: `${titleSize}px`,
                color: titleColor || undefined,
              }}
            >
              {title}
            </h1>
            <p
              className="max-w-xl"
              style={{
                fontSize: `${subtitleSize}px`,
                color: textColor || 'hsl(var(--muted-foreground))',
              }}
            >
              {subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {previewMode ? (
                ButtonInner
              ) : (
                <Link to={chatPath}>{ButtonInner}</Link>
              )}
            </div>
          </div>

          <div className="relative flex justify-center md:justify-end">
            {showBubble && (
              <div className="absolute top-0 right-1/4 md:right-1/3 z-10 bg-card border border-border rounded-2xl px-4 py-2 shadow-lg animate-float">
                <p className="text-sm font-medium">{bubbleText}</p>
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-card border-l border-b border-border transform rotate-[-45deg]" />
              </div>
            )}
            <div
              className="relative transition-transform"
              style={{ transform: `${assistantTransform} scale(${sizePct})` }}
            >
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-primary/30 shadow-glow-lg">
                <img src={avatarSrc} alt={`Assistente virtual da ${businessName}`} className="w-full h-full object-cover object-top" />
              </div>
              <div className="absolute -right-2 bottom-12 w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-glow animate-pulse-glow">
                <svg className="w-7 h-7 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
