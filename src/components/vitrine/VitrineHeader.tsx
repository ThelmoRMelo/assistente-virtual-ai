import { Link } from 'react-router-dom';
import { MessageCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ThemeConfig } from '@/lib/themes';

interface VitrineHeaderProps {
  businessName: string;
  theme: ThemeConfig;
  chatPath: string;
}

export function VitrineHeader({ businessName, theme, chatPath }: VitrineHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <span 
            className="font-bold text-lg"
            style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}
          >
            {businessName}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to={chatPath}>
            <Button 
              variant="default" 
              size="sm" 
              className="bg-primary/20 hover:bg-primary/30 text-foreground border border-primary/30"
            >
              <span className="hidden sm:inline mr-2">Falar com a</span>
              <span className="font-bold">ANIA</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Globe className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
