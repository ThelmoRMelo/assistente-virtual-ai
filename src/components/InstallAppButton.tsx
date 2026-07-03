import { useEffect, useState } from 'react';
import { Download, Check, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
}

function detectPlatform(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export function InstallAppButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [helpOpen, setHelpOpen] = useState(false);
  const platform = detectPlatform();

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleClick = async () => {
    if (installed) return;
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalled(true);
        }
        setDeferred(null);
      } catch {
        setHelpOpen(true);
      }
      return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Instalar Aplicativo</h3>
            <p className="text-sm text-muted-foreground">
              {installed
                ? 'Aplicativo já instalado'
                : 'Adicione a ANIA à tela inicial'}
            </p>
          </div>
        </div>

        <Button
          variant={installed ? 'glass' : 'gradient'}
          className="w-full"
          onClick={handleClick}
          disabled={installed}
        >
          {installed ? (
            <>
              <Check className="w-4 h-4" />
              ✅ Aplicativo já instalado
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              📲 Instalar ANIA
            </>
          )}
        </Button>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como instalar a ANIA</DialogTitle>
            <DialogDescription>
              Seu navegador não abriu a instalação automática. Siga as
              instruções abaixo:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {platform === 'ios' ? (
              <p>
                <strong>iPhone / iPad:</strong> Toque no botão{' '}
                <strong>Compartilhar</strong> e depois em{' '}
                <strong>"Adicionar à Tela de Início"</strong>.
              </p>
            ) : platform === 'android' ? (
              <p>
                <strong>Android:</strong> Abra o menu <strong>⋮</strong> do
                navegador e escolha{' '}
                <strong>"Adicionar à tela inicial"</strong> ou{' '}
                <strong>"Instalar aplicativo"</strong>, se disponível.
              </p>
            ) : (
              <p>
                <strong>Desktop:</strong> Clique no ícone de instalação na
                barra de endereço do navegador (Chrome/Edge) ou use o menu do
                navegador e selecione{' '}
                <strong>"Instalar ANIA"</strong>.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
