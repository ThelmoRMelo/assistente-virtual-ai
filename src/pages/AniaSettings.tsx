import { useState, useEffect } from 'react';
import { Bot, MessageSquare, Phone, Mail, CreditCard, FileText, Sparkles, Save } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAniaSettings, type AniaSettings } from '@/hooks/useAniaSettings';
import { toast } from 'sonner';

export default function AniaSettingsPage() {
  const { settings, loading, updateSettings } = useAniaSettings();
  const [form, setForm] = useState<Partial<AniaSettings>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const set = (k: keyof AniaSettings, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const r = await updateSettings(form);
    setSaving(false);
    if (r?.success) toast.success('Configurações da ANIA salvas!');
    else toast.error('Erro ao salvar');
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24">
        <PageHeader title="Configurações da Assistente" subtitle="Carregando..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Configurações da ANIA" subtitle="Memória global da assistente" />

      <main className="px-6 py-4 space-y-4 max-w-lg mx-auto">
        {/* Identidade */}
        <section className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Identidade da Assistente</h3>
              <p className="text-xs text-muted-foreground">Nome, boas-vindas e descrição</p>
            </div>
          </div>

          <div>
            <Label>Nome da assistente</Label>
            <Input value={form.assistant_name || ''} onChange={(e) => set('assistant_name', e.target.value)} placeholder="ANIA" />
          </div>
          <div>
            <Label>Mensagem inicial</Label>
            <Textarea
              rows={3}
              value={form.welcome_message || ''}
              onChange={(e) => set('welcome_message', e.target.value)}
              placeholder="Olá! 👋 Eu sou a ANIA..."
            />
          </div>
          <div>
            <Label>Descrição da empresa / vitrine</Label>
            <Textarea
              rows={3}
              value={form.company_description || ''}
              onChange={(e) => set('company_description', e.target.value)}
              placeholder="A ANIA é uma assistente virtual especializada em..."
            />
          </div>
        </section>

        {/* Prompt mestre */}
        <section className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold">Prompt Mestre (instruções globais)</h3>
              <p className="text-xs text-muted-foreground">
                Usado quando não há produto selecionado. Define personalidade, regras e limites.
              </p>
            </div>
          </div>
          <Textarea
            rows={8}
            value={form.global_instructions || ''}
            onChange={(e) => set('global_instructions', e.target.value)}
            placeholder="Ex: Aja com tom profissional e acolhedor. Sempre direcione o cliente para escolher um produto antes de negociar. Não invente informações..."
          />
          <div>
            <Label>Regras de venda</Label>
            <Textarea
              rows={4}
              value={form.sales_rules || ''}
              onChange={(e) => set('sales_rules', e.target.value)}
              placeholder="Ex: Descontos só após produto selecionado. Sempre confirmar forma de pagamento."
            />
          </div>
        </section>

        {/* Contatos oficiais */}
        <section className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold">Atendimento humano</h3>
              <p className="text-xs text-muted-foreground">Contatos oficiais — a ANIA nunca inventará.</p>
            </div>
          </div>
          <div>
            <Label>WhatsApp (somente números, com DDI)</Label>
            <Input value={form.human_support_whatsapp || ''} onChange={(e) => set('human_support_whatsapp', e.target.value)} placeholder="5511999999999" />
          </div>
          <div>
            <Label>URL de atendimento (opcional)</Label>
            <Input value={form.human_support_url || ''} onChange={(e) => set('human_support_url', e.target.value)} placeholder="https://wa.me/..." />
          </div>
          <div>
            <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> E-mail de suporte</Label>
            <Input value={form.support_email || ''} onChange={(e) => set('support_email', e.target.value)} placeholder="suporte@empresa.com" />
          </div>
        </section>

        {/* PIX */}
        <section className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold">Dados de PIX</h3>
              <p className="text-xs text-muted-foreground">A ANIA nunca inventará chaves PIX.</p>
            </div>
          </div>
          <div>
            <Label>Chave PIX</Label>
            <Input value={form.pix_key || ''} onChange={(e) => set('pix_key', e.target.value)} placeholder="email@empresa.com / CPF / chave aleatória" />
          </div>
          <div>
            <Label>Nome do recebedor</Label>
            <Input value={form.pix_receiver_name || ''} onChange={(e) => set('pix_receiver_name', e.target.value)} />
          </div>
          <div>
            <Label>Banco</Label>
            <Input value={form.pix_bank || ''} onChange={(e) => set('pix_bank', e.target.value)} />
          </div>
        </section>

        {/* Fallback */}
        <section className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold">Mensagem padrão de fallback</h3>
              <p className="text-xs text-muted-foreground">
                Usada quando a ANIA não encontrar a informação.
              </p>
            </div>
          </div>
          <Textarea
            rows={3}
            value={form.fallback_message || ''}
            onChange={(e) => set('fallback_message', e.target.value)}
            placeholder="Essa informação não está cadastrada no sistema no momento."
          />
        </section>

        <Button variant="gradient" className="w-full h-12" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
