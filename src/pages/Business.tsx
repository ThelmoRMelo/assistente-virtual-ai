import { Building2, MapPin, Phone, FileText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

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

export default function Business() {
  const { business, updateBusiness } = useApp();

  const handleSave = () => {
    toast.success('Dados salvos com sucesso!');
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Meu Negócio" subtitle="Dados do seu estabelecimento" />

      <main className="px-6 py-4 space-y-4 max-w-lg mx-auto">
        {/* Business icon */}
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold">{business.nome || 'Seu Negócio'}</h2>
          <p className="text-sm text-muted-foreground">{business.categoria || 'Categoria não definida'}</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Nome do estabelecimento
            </label>
            <Input
              value={business.nome}
              onChange={(e) => updateBusiness({ nome: e.target.value })}
              placeholder="Ex: Loja da Maria"
            />
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="text-sm text-muted-foreground mb-2 block">
              Categoria
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => updateBusiness({ categoria: cat })}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    business.categoria === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone / WhatsApp
            </label>
            <Input
              value={business.telefone || ''}
              onChange={(e) => updateBusiness({ telefone: e.target.value })}
              placeholder="(00) 00000-0000"
              type="tel"
            />
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço
            </label>
            <Input
              value={business.endereco || ''}
              onChange={(e) => updateBusiness({ endereco: e.target.value })}
              placeholder="Rua, número, bairro..."
            />
          </div>

          <div className="glass-card rounded-xl p-4">
            <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Descrição do negócio
            </label>
            <Textarea
              value={business.descricao || ''}
              onChange={(e) => updateBusiness({ descricao: e.target.value })}
              placeholder="Conte um pouco sobre o seu negócio..."
              rows={3}
            />
          </div>
        </div>

        <Button variant="gradient" className="w-full" onClick={handleSave}>
          Salvar alterações
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
