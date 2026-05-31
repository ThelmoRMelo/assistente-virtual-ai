import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { ThemeConfig } from '@/lib/themes';
import aniaAvatar from '@/assets/ania-avatar.png';

interface VitrineHeroProps {
  businessName: string;
  theme: ThemeConfig;
  chatPath: string;
}

export function VitrineHero({ businessName, theme, chatPath }: VitrineHeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      
      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left content */}
          <div className="space-y-6 text-center md:text-left">
            <h1 
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
              style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}
            >
              Sua vitrine inteligente{' '}
              <span className="gradient-text">
                com atendimento 24h
              </span>
            </h1>
            
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl">
              Cursos, aplicativos e soluções digitais que vendem 
              por você com a ajuda da <span className="text-primary font-semibold">ANIA</span>, 
              sua assistente virtual.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to={chatPath}>
                <Button size="lg" className="text-lg px-8 h-14 font-semibold bg-primary hover:bg-primary/90 shadow-glow">
                  Conversar com ANIA agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Right content - ANIA avatar */}
          <div className="relative flex justify-center md:justify-end">
            {/* Speech bubble */}
            <div className="absolute top-0 right-1/4 md:right-1/3 z-10 bg-card border border-border rounded-2xl px-4 py-2 shadow-lg animate-float">
              <p className="text-sm font-medium">Olá! Precisa de ajuda?</p>
              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-card border-l border-b border-border transform rotate-[-45deg]" />
            </div>
            
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-primary/30 shadow-glow-lg">
                <img 
                  src={aniaAvatar} 
                  alt="ANIA - Assistente Virtual" 
                  className="w-full h-full object-cover object-top"
                />
              </div>
              
              {/* Chat icon floating */}
              <div className="absolute -right-2 bottom-12 w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-glow animate-pulse-glow">
                <svg className="w-7 h-7 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
