import { Heart, Briefcase, Smartphone, GraduationCap, MessageCircle, Stethoscope } from 'lucide-react';
import type { ThemeConfig } from '@/lib/themes';

interface ThemeShowcaseProps {
  theme: ThemeConfig;
}

const niches = [
  { name: 'Saúde', icon: Stethoscope, color: 'hsl(180, 60%, 45%)' },
  { name: 'Beleza', icon: Heart, color: 'hsl(340, 80%, 65%)' },
  { name: 'Finanças', icon: Briefcase, color: 'hsl(210, 90%, 55%)' },
  { name: 'Tecnologia', icon: Smartphone, color: 'hsl(260, 80%, 60%)' },
  { name: 'Educação', icon: GraduationCap, color: 'hsl(45, 100%, 55%)' },
  { name: 'Atendimento', icon: MessageCircle, color: 'hsl(190, 100%, 50%)' },
];

export function ThemeShowcase({ theme }: ThemeShowcaseProps) {
  return (
    <section className="py-12 md:py-16">
      <div className="text-center mb-10">
        <h2 
          className="text-2xl md:text-3xl font-bold mb-3"
          style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}
        >
          Plataforma 100% Personalizável
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Escolha temas de vitrine para cada nicho:{' '}
          <span className="text-primary">saúde</span>,{' '}
          <span className="text-secondary">beleza</span>,{' '}
          <span className="text-foreground">finanças</span>,{' '}
          <span className="text-accent">tecnologia</span>{' '}
          e muito mais
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 md:gap-10">
        {niches.map((niche) => (
          <div 
            key={niche.name}
            className="flex flex-col items-center gap-3 group cursor-pointer"
          >
            <div 
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow"
              style={{ backgroundColor: `${niche.color}20` }}
            >
              <niche.icon 
                className="w-8 h-8 md:w-10 md:h-10 transition-colors" 
                style={{ color: niche.color }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {niche.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
