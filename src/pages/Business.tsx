import { useEffect, useRef, useState } from 'react';
import { Building2, MapPin, Phone, FileText, Image as ImageIcon, Type, Save, Eye, Upload, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { useProductImageUpload } from '@/hooks/useProductImageUpload';
import { toast } from 'sonner';

const categories = [
  'Loja de Roupas', 'Restaurante', 'Salão de Beleza', 'Pet Shop',
  'Academia', 'Consultório', 'Loja Virtual', 'Serviços Gerais', 'Outro',
];

export default function Business() {
  const { business, updateBusiness } = useApp();
  const { config, updateConfig } = useBusinessConfig();

  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [footerText, setFooterText] = useState('');
  const [heroBannerUrl, setHeroBannerUrl] = useState('');
  const [assistantImageUrl, setAssistantImageUrl] = useState('');

  useEffect(() => {
    if (config) {
      setHeroTitle((config as any).hero_title || '');
      setHeroSubtitle((config as any).hero_subtitle || '');
      setFooterText((config as any).footer_text || '');
      setHeroBannerUrl((config as any).hero_banner_url || '');
      setAssistantImageUrl((config as any).assistant_image_url || '');
    }
  }, [config]);

  const handleSaveLocal = () => toast.success('Dados locais salvos!');

  const handleSaveLanding = async () => {
    const r = await updateConfig({
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      footer_text: footerText,
      hero_banner_url: heroBannerUrl,
      assistant_image_url: assistantImageUrl,
    } as any);
    if (r?.success) toast.success('Landing Page atualizada!');
    else toast.error('Erro ao salvar');
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Meu Negócio" subtitle="Dados e Landing Page" />

      <main className="px-6 py-4 space-y-4 max-w-lg mx-auto">
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold">{business.nome || 'Seu Negócio'}</h2>
          <p className="text-sm text-muted-foreground">{business.categoria || 'Categoria não definida'}</p>
        </div>

        {/* Dados básicos */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <Label className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Nome do estabelecimento</Label>
            <Input value={business.nome} onChange={(e) => updateBusiness({ nome: e.target.value })} placeholder="Ex: Loja da Maria" />
          </div>

          <div className="glass-card rounded-xl p-4">
            <Label>Categoria</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => updateBusiness({ categoria: cat })}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    business.categoria === cat ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> Telefone / WhatsApp</Label>
            <Input value={business.telefone || ''} onChange={(e) => updateBusiness({ telefone: e.target.value })} placeholder="(00) 00000-0000" type="tel" />
          </div>

          <div className="glass-card rounded-xl p-4">
            <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Endereço</Label>
            <Input value={business.endereco || ''} onChange={(e) => updateBusiness({ endereco: e.target.value })} placeholder="Rua, número, bairro..." />
          </div>

          <div className="glass-card rounded-xl p-4">
            <Label className="flex items-center gap-2"><FileText className="w-4 h-4" /> Descrição do negócio</Label>
            <Textarea value={business.descricao || ''} onChange={(e) => updateBusiness({ descricao: e.target.value })} placeholder="Conte um pouco sobre o seu negócio..." rows={3} />
          </div>

          <Button variant="outline" className="w-full" onClick={handleSaveLocal}>
            <Save className="w-4 h-4" /> Salvar dados básicos
          </Button>
        </div>

        {/* Landing Page */}
        <div className="glass-card rounded-2xl p-5 space-y-4 mt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Type className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Conteúdo da Landing Page</h3>
              <p className="text-xs text-muted-foreground">Aparência pública da vitrine</p>
            </div>
          </div>

          <div>
            <Label>Título principal (hero)</Label>
            <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="Sua vitrine inteligente com atendimento 24h" />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Textarea rows={2} value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Cursos, aplicativos e soluções digitais..." />
          </div>
          <div>
            <Label>Texto do rodapé</Label>
            <Textarea rows={2} value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Atendimento por IA disponível 24h..." />
          </div>

          <div className="border-t border-border/40 pt-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="w-4 h-4" /> Aparência
            </div>
            <div>
              <Label>URL do banner principal</Label>
              <Input value={heroBannerUrl} onChange={(e) => setHeroBannerUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>URL da imagem da assistente</Label>
              <Input value={assistantImageUrl} onChange={(e) => setAssistantImageUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <Button variant="gradient" className="w-full" onClick={handleSaveLanding}>
            <Save className="w-4 h-4" /> Salvar Landing Page
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
