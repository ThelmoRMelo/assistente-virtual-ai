import { MessageCircle } from 'lucide-react';

export function VitrineFooter() {
  return (
    <footer className="border-t border-border/40 py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <MessageCircle className="w-4 h-4 text-primary" />
          <p>
            <span className="font-semibold text-primary">Atendimento por IA</span> Disponível 24h.
            {' '}Tire dúvidas sobre qualquer produto e finalize a compra direto no WhatsApp
          </p>
        </div>
      </div>
    </footer>
  );
}
