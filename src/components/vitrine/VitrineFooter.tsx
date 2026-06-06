import { MessageCircle } from 'lucide-react';

interface VitrineFooterProps {
  footerText?: string | null;
}

export function VitrineFooter({ footerText }: VitrineFooterProps) {
  const text =
    footerText?.trim() ||
    'Atendimento por IA disponível 24h. Tire dúvidas sobre qualquer produto e finalize a compra direto no WhatsApp.';

  return (
    <footer className="border-t border-border/40 py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm text-center">
          <MessageCircle className="w-4 h-4 text-primary shrink-0" />
          <p>{text}</p>
        </div>
      </div>
    </footer>
  );
}
