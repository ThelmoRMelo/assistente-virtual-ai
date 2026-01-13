import { ChevronRight, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MenuCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  iconColor?: string;
  delay?: number;
}

export function MenuCard({ icon: Icon, title, description, path, iconColor = 'text-primary', delay = 0 }: MenuCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className="w-full glass-card gradient-border rounded-2xl p-4 flex items-center gap-4 text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center ${iconColor}`}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
