import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, Sparkles, ShoppingBag, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">VendaBot</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Entrar
          </Button>
          <Button variant="gradient" onClick={() => navigate('/signup')}>
            Começar
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-8 animate-float shadow-glow">
          <Bot className="w-14 h-14 text-primary-foreground" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
          Venda mais com IA
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          Crie seu assistente de vendas inteligente em minutos. 
          Atenda clientes 24/7 e aumente suas conversões.
        </p>

        <Button 
          variant="gradient" 
          size="lg" 
          onClick={() => navigate('/signup')}
          className="text-lg px-8 py-6"
        >
          Criar minha loja grátis
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 w-full">
          <div className="glass-card p-6 rounded-2xl text-left">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">IA que Vende</h3>
            <p className="text-sm text-muted-foreground">
              Assistente treinado para negociar e fechar vendas automaticamente.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-left">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Catálogo Digital</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre seus produtos e compartilhe com clientes facilmente.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl text-left">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Atendimento 24/7</h3>
            <p className="text-sm text-muted-foreground">
              Seu chatbot nunca dorme. Atenda clientes a qualquer hora.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        © 2025 VendaBot. Todos os direitos reservados.
      </footer>
    </div>
  );
}
