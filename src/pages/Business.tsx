import { useEffect, useRef, useState } from 'react';
import {
  Building2, MapPin, Phone, FileText, Image as ImageIcon, Type, Save, Eye, Upload, Loader2,
  Palette, Sparkles, MessageSquare, MousePointer,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { useBusinessConfig } from '@/hooks/useBusinessConfig';
import { useProductImageUpload } from '@/hooks/useProductImageUpload';
import { VitrineHero } from '@/components/vitrine/VitrineHero';
import { themes, getThemeForCategory } from '@/lib/themes';
import { toast } from 'sonner';

const categories = [
  'Loja de Roupas', 'Restaurante', 'Salão de Beleza', 'Pet Shop',
  'Academia', 'Consultório', 'Loja Virtual', 'Serviços Gerais', 'Outro',
];

export default function Business() {
  const { business, updateBusiness } = useApp();
  const { config, updateConfig } = useBusinessConfig();

  // Texts
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [footerText, setFooterText] = useState('');

  // Images
  const [heroBannerUrl, setHeroBannerUrl] = useState('');
  const [assistantImageUrl, setAssistantImageUrl] = useState('');

  // Sizes
  const [heroTitleSize, setHeroTitleSize] = useState(36);
  const [heroSubtitleSize, setHeroSubtitleSize] = useState(18);

  // Assistant
  const [assistantPositionAxis, setAssistantPositionAxis] = useState<'horizontal' | 'vertical'>('vertical');
  const [assistantPositionValue, setAssistantPositionValue] = useState(0);
  const [assistantSize, setAssistantSize] = useState(100);
  const [showAssistantBubble, setShowAssistantBubble] = useState(true);
  const [assistantBubbleText, setAssistantBubbleText] = useState('Olá! Precisa de ajuda?');

  // Button
  const [heroButtonText, setHeroButtonText] = useState('Falar com a ANIA');
  const [heroButtonGlow, setHeroButtonGlow] = useState(50);
  const [heroButtonRadius, setHeroButtonRadius] = useState(12);

  // Colors
  const [primaryColor, setPrimaryColor] = useState('#7c3aed');
  const [titleColor, setTitleColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#cbd5e1');
  const [buttonColor, setButtonColor] = useState('#7c3aed');
  const [accentColor, setAccentColor] = useState('#06b6d4');

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!config) return;
    const c: any = config;
    setHeroTitle(c.hero_title || '');
    setHeroSubtitle(c.hero_subtitle || '');
    setFooterText(c.footer_text || '');
    setHeroBannerUrl(c.hero_banner_url || '');
    setAssistantImageUrl(c.assistant_image_url || '');
    setHeroTitleSize(c.hero_title_size ?? 36);
    setHeroSubtitleSize(c.hero_subtitle_size ?? 18);
    setAssistantPositionAxis((c.assistant_position_axis as any) ?? 'vertical');
    setAssistantPositionValue(c.assistant_position_value ?? 0);
    setAssistantSize(c.assistant_size ?? 100);
    setShowAssistantBubble(c.show_assistant_bubble ?? true);
    setAssistantBubbleText(c.assistant_bubble_text || 'Olá! Precisa de ajuda?');
    setHeroButtonText(c.hero_button_text || 'Falar com a ANIA');
    setHeroButtonGlow(c.hero_button_glow ?? 50);
    setHeroButtonRadius(c.hero_button_radius ?? 12);
    if (c.primary_color) setPrimaryColor(c.primary_color);
    if (c.title_color) setTitleColor(c.title_color);
    if (c.text_color) setTextColor(c.text_color);
    if (c.button_color) setButtonColor(c.button_color);
    if (c.accent_color) setAccentColor(c.accent_color);
  }, [config]);

  const handleSaveLocal = () => toast.success('Dados locais salvos!');

  const handleSaveLanding = async () => {
    const r = await updateConfig({
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      footer_text: footerText,
      hero_banner_url: heroBannerUrl,
      assistant_image_url: assistantImageUrl,
      hero_title_size: heroTitleSize,
      hero_subtitle_size: heroSubtitleSize,
      assistant_position_axis: assistantPositionAxis,
      assistant_position_value: assistantPositionValue,
      assistant_size: assistantSize,
      show_assistant_bubble: showAssistantBubble,
      assistant_bubble_text: assistantBubbleText,
      hero_button_text: heroButtonText,
      hero_button_glow: heroButtonGlow,
      hero_button_radius: heroButtonRadius,
      primary_color: primaryColor,
      title_color: titleColor,
      text_color: textColor,
      button_color: buttonColor,
      accent_color: accentColor,
    } as any);
    if (r?.success) toast.success('Landing Page atualizada!');
    else toast.error('Erro ao salvar');
  };

  const previewTheme = themes[getThemeForCategory(business.categoria || '')] || themes.default;
  const previewBusinessName = business.nome || 'Minha Loja';

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

        {/* HERO PRINCIPAL */}
        <SectionCard icon={<Type className="w-5 h-5 text-primary" />} title="Hero principal" subtitle="Textos do topo da Landing">
          <div>
            <Label>Título principal</Label>
            <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="Sua vitrine inteligente com atendimento 24h" />
          </div>
          <SliderRow
            label="Tamanho do título"
            value={heroTitleSize}
            min={20} max={60} unit="px"
            onChange={setHeroTitleSize}
          />
          <div>
            <Label>Subtítulo</Label>
            <Textarea rows={2} value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Cursos, aplicativos..." />
          </div>
          <SliderRow
            label="Tamanho do subtítulo"
            value={heroSubtitleSize}
            min={12} max={36} unit="px"
            onChange={setHeroSubtitleSize}
          />
          <div>
            <Label>Texto do rodapé</Label>
            <Textarea rows={2} value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Atendimento por IA 24h..." />
          </div>
        </SectionCard>

        {/* IMAGENS */}
        <SectionCard icon={<ImageIcon className="w-5 h-5 text-primary" />} title="Imagens" subtitle="Banner e assistente">
          <ImagePicker label="Banner principal" buttonLabel="Alterar Banner" value={heroBannerUrl} onChange={setHeroBannerUrl} aspect="banner" />
          <ImagePicker label="Imagem da assistente" buttonLabel="Alterar Assistente" value={assistantImageUrl} onChange={setAssistantImageUrl} aspect="avatar" />
        </SectionCard>

        {/* ASSISTENTE VIRTUAL */}
        <SectionCard icon={<Sparkles className="w-5 h-5 text-primary" />} title="Assistente virtual" subtitle="Posição, tamanho e balão">
          <div>
            <Label>Eixo de movimento</Label>
            <div className="flex gap-2 mt-2">
              {(['vertical', 'horizontal'] as const).map((axis) => (
                <button
                  key={axis}
                  onClick={() => setAssistantPositionAxis(axis)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm capitalize transition-all ${
                    assistantPositionAxis === axis ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {axis === 'vertical' ? 'Vertical' : 'Horizontal'}
                </button>
              ))}
            </div>
          </div>
          <SliderRow
            label={`Posição (${assistantPositionAxis})`}
            value={assistantPositionValue}
            min={-50} max={50} unit="%"
            onChange={setAssistantPositionValue}
          />
          <SliderRow
            label="Tamanho da assistente"
            value={assistantSize}
            min={60} max={140} unit="%"
            onChange={setAssistantSize}
          />
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Exibir balão de fala</Label>
            <Switch checked={showAssistantBubble} onCheckedChange={setShowAssistantBubble} />
          </div>
          {showAssistantBubble && (
            <div>
              <Label>Texto do balão</Label>
              <Input value={assistantBubbleText} onChange={(e) => setAssistantBubbleText(e.target.value)} placeholder="Olá! Precisa de ajuda?" />
            </div>
          )}
        </SectionCard>

        {/* BOTÃO */}
        <SectionCard icon={<MousePointer className="w-5 h-5 text-primary" />} title="Botão principal" subtitle="Aparência do CTA">
          <div>
            <Label>Texto do botão</Label>
            <Input value={heroButtonText} onChange={(e) => setHeroButtonText(e.target.value)} placeholder="Falar com a ANIA" />
          </div>
          <SliderRow label="Intensidade do brilho" value={heroButtonGlow} min={0} max={100} unit="" onChange={setHeroButtonGlow} />
          <SliderRow label="Arredondamento dos cantos" value={heroButtonRadius} min={0} max={40} unit="px" onChange={setHeroButtonRadius} />
        </SectionCard>

        {/* CORES */}
        <SectionCard icon={<Palette className="w-5 h-5 text-primary" />} title="Cores" subtitle="Paleta da Landing">
          <ColorRow label="Cor principal" value={primaryColor} onChange={setPrimaryColor} />
          <ColorRow label="Cor dos títulos" value={titleColor} onChange={setTitleColor} />
          <ColorRow label="Cor dos textos" value={textColor} onChange={setTextColor} />
          <ColorRow label="Cor dos botões" value={buttonColor} onChange={setButtonColor} />
          <ColorRow label="Cor dos destaques" value={accentColor} onChange={setAccentColor} />
        </SectionCard>

        {/* AÇÕES */}
        <div className="space-y-2 sticky bottom-20 z-10">
          <Button variant="gradient" className="w-full" onClick={handleSaveLanding}>
            <Save className="w-4 h-4" /> Salvar Landing Page
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setPreviewOpen(true)}>
            <Eye className="w-4 h-4" /> Pré-visualizar Landing Page
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => window.open('/vitrine', '_blank', 'noopener,noreferrer')}>
            <Eye className="w-4 h-4" /> Abrir Vitrine publicada
          </Button>
        </div>
      </main>

      <BottomNav />

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Pré-visualização da Landing Page</DialogTitle>
          </DialogHeader>
          <div className="bg-background">
            <VitrineHero
              previewMode
              businessName={previewBusinessName}
              theme={previewTheme}
              chatPath="#"
              heroTitle={heroTitle}
              heroSubtitle={heroSubtitle}
              bannerUrl={heroBannerUrl}
              assistantImageUrl={assistantImageUrl}
              heroTitleSize={heroTitleSize}
              heroSubtitleSize={heroSubtitleSize}
              assistantPositionAxis={assistantPositionAxis}
              assistantPositionValue={assistantPositionValue}
              assistantSize={assistantSize}
              showAssistantBubble={showAssistantBubble}
              assistantBubbleText={assistantBubbleText}
              heroButtonText={heroButtonText}
              heroButtonGlow={heroButtonGlow}
              heroButtonRadius={heroButtonRadius}
              primaryColor={primaryColor}
              titleColor={titleColor}
              textColor={textColor}
              buttonColor={buttonColor}
              accentColor={accentColor}
            />
            {footerText && (
              <div className="px-6 py-6 text-center text-sm" style={{ color: textColor }}>
                {footerText}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionCard({
  icon, title, subtitle, children,
}: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 mt-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SliderRow({
  label, value, min, max, unit, onChange,
}: { label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground tabular-nums">{value}{unit}</span>
      </div>
      <Slider min={min} max={max} step={1} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="flex-1">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 text-xs font-mono"
        />
      </div>
    </div>
  );
}

interface ImagePickerProps {
  label: string;
  buttonLabel: string;
  value: string;
  onChange: (url: string) => void;
  aspect: 'banner' | 'avatar';
}

function ImagePicker({ label, buttonLabel, value, onChange, aspect }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading } = useProductImageUpload();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      onChange(url);
      toast.success('Imagem enviada com sucesso!');
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-border bg-muted/30 ${
          aspect === 'banner' ? 'aspect-[16/9]' : 'aspect-square max-w-[180px]'
        }`}
      >
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sem imagem</div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {buttonLabel}
      </Button>
    </div>
  );
}
