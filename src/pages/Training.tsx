import { useState } from 'react';
import { Plus, Trash2, Download, RefreshCw, Lightbulb, Target } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const suggestions = [
  { pergunta: 'Vocês estão abertos?', resposta: 'Sim! Estamos funcionando normalmente. Em que posso te ajudar?', categoria: 'Atendimento' },
  { pergunta: 'Aceita cartão?', resposta: 'Aceitamos todas as bandeiras, PIX e dinheiro! Qual produto te interessa?', categoria: 'Pagamentos' },
  { pergunta: 'Qual o endereço?', resposta: 'Nosso endereço é [ENDEREÇO]. Posso te ajudar com algum produto?', categoria: 'Localização' },
  { pergunta: 'Tem delivery?', resposta: 'Temos sim! Qual produto você gostaria de pedir?', categoria: 'Entrega' },
];

export default function Training() {
  const { trainingData, addTraining, deleteTraining, exportBrain } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');
  const [categoria, setCategoria] = useState('');

  const handleSave = () => {
    if (!pergunta.trim() || !resposta.trim()) {
      toast.error('Preencha a pergunta e a resposta');
      return;
    }
    addTraining({ pergunta, resposta, categoria: categoria || 'Geral' });
    setPergunta('');
    setResposta('');
    setCategoria('');
    setIsAdding(false);
    toast.success('Resposta salva!');
  };

  const handleExport = () => {
    exportBrain();
    toast.success('Arquivo brain.js exportado!');
  };

  const useSuggestion = (sug: typeof suggestions[0]) => {
    setPergunta(sug.pergunta);
    setResposta(sug.resposta);
    setCategoria(sug.categoria);
    setIsAdding(true);
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader 
        title="Estratégia de Atendimento" 
        subtitle="Configure respostas personalizadas" 
      />

      <main className="px-6 py-4 space-y-4 max-w-lg mx-auto">
        {/* Info card */}
        <div className="glass-card rounded-2xl p-4 border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Foco em vendas</p>
              <p className="text-xs text-muted-foreground mt-1">
                Configure respostas que direcionem o cliente para a decisão de compra.
                Evite respostas genéricas.
              </p>
            </div>
          </div>
        </div>

        {/* Add new training */}
        {!isAdding ? (
          <Button
            onClick={() => setIsAdding(true)}
            variant="gradient"
            className="w-full"
          >
            <Plus className="w-5 h-5" />
            Adicionar resposta
          </Button>
        ) : (
          <div className="glass-card rounded-2xl p-5 space-y-4 animate-slide-up">
            <h3 className="font-semibold text-lg">Nova resposta</h3>
            
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Quando o cliente perguntar...
              </label>
              <Input
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                placeholder="Ex: Qual o preço?"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                A IA deve responder assim...
              </label>
              <Textarea
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                placeholder="Ex: Qual produto te interessa? Posso te passar o valor!"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Dica: Termine com uma pergunta para manter o cliente engajado
              </p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Categoria (opcional)
              </label>
              <Input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Preços, Pagamento, Entrega..."
              />
            </div>

            <div className="flex gap-3">
              <Button variant="glass" onClick={() => setIsAdding(false)} className="flex-1">
                Cancelar
              </Button>
              <Button variant="gradient" onClick={handleSave} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {!isAdding && (
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Sugestões rápidas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => useSuggestion(sug)}
                  className="px-3 py-1.5 rounded-lg bg-muted/50 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {sug.pergunta}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Existing trainings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Respostas configuradas</h3>
            <span className="text-sm text-muted-foreground">{trainingData.length} itens</span>
          </div>

          {trainingData.length === 0 && (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-muted-foreground">Nenhuma resposta configurada</p>
              <p className="text-sm text-muted-foreground/70 mt-1">A IA usará o modo de vendas padrão</p>
            </div>
          )}

          {trainingData.map((item) => (
            <div key={item.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-primary font-medium">{item.categoria}</span>
                  <p className="font-medium text-sm mt-1 truncate">"{item.pergunta}"</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.resposta}</p>
                </div>
                <button
                  onClick={() => {
                    deleteTraining(item.id);
                    toast.success('Resposta removida');
                  }}
                  className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Export buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="glass" onClick={() => toast.success('IA atualizada!')} className="flex-1">
            <RefreshCw className="w-4 h-4" />
            Atualizar IA
          </Button>
          <Button variant="gradient-secondary" onClick={handleExport} className="flex-1">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
