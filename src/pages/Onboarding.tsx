import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';

const categories = [
  'Loja de Roupas',
  'Restaurante',
  'Salão de Beleza',
  'Pet Shop',
  'Academia',
  'Consultório',
  'Loja Virtual',
  'Serviços Gerais',
  'Outro',
];

const aiStyles = [
  { id: 'amigavel_profissional', label: 'Amigável', emoji: '😊', desc: 'Calorosa e acolhedora' },
  { id: 'educada', label: 'Educada', emoji: '🎩', desc: 'Formal e respeitosa' },
  { id: 'vendedora', label: 'Vendedora', emoji: '🎯', desc: 'Persuasiva e proativa' },
  { id: 'direta', label: 'Direta', emoji: '⚡', desc: 'Objetiva e rápida' },
] as const;

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateBusiness, updateAISettings, setOnboarded } = useApp();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [aiStyle, setAiStyle] = useState<typeof aiStyles[number]['id']>('amigavel_profissional');

  const handleComplete = () => {
    updateBusiness({ nome: businessName, categoria: businessCategory });
    updateAISettings({ estilo: aiStyle });
    setOnboarded(true);
    navigate('/app');
  };

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return businessName.trim().length >= 2;
    if (step === 2) return businessCategory !== '';
    if (step === 3) return !!aiStyle;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i <= step ? 'bg-primary shadow-glow' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-slide-up">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-8 animate-float shadow-glow">
              <Bot className="w-14 h-14 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4 gradient-text">
              Assistente Virtual
              <br />Inteligente
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-xs">
              Vamos configurar seu atendimento inteligente em poucos minutos.
            </p>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">Simples e rápido</span>
            </div>
          </div>
        )}

        {/* Step 1: Business Name */}
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <h2 className="text-2xl font-bold mb-2">Como se chama seu negócio?</h2>
            <p className="text-muted-foreground mb-8">
              Este nome será usado pela IA para se apresentar.
            </p>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: Loja da Maria"
              className="text-lg"
              autoFocus
            />
          </div>
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <h2 className="text-2xl font-bold mb-2">Qual é a categoria?</h2>
            <p className="text-muted-foreground mb-6">
              Isso ajuda a IA a entender melhor seu negócio.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setBusinessCategory(cat)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                    businessCategory === cat
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <span className="font-medium">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: AI Style */}
        {step === 3 && (
          <div className="flex-1 flex flex-col animate-slide-up">
            <h2 className="text-2xl font-bold mb-2">Qual será o estilo da IA?</h2>
            <p className="text-muted-foreground mb-6">
              Escolha como sua assistente vai conversar com os clientes.
            </p>
            <div className="space-y-3">
              {aiStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setAiStyle(style.id)}
                  className={`w-full p-4 rounded-xl border flex items-center gap-4 text-left transition-all duration-200 ${
                    aiStyle === style.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <span className="text-3xl">{style.emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{style.label}</div>
                    <div className="text-sm text-muted-foreground">{style.desc}</div>
                  </div>
                  {aiStyle === style.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="pt-6 pb-4">
        <Button
          onClick={() => {
            if (step < 3) setStep(step + 1);
            else handleComplete();
          }}
          disabled={!canProceed()}
          variant="gradient"
          size="lg"
          className="w-full"
        >
          {step === 0 ? 'Começar' : step === 3 ? 'Ativar Assistente' : 'Continuar'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full mt-3 text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Voltar
          </button>
        )}
      </div>
    </div>
  );
}
