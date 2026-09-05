// Botão "Ouvir" — camada adicional de TTS sobre a resposta em texto da ANIA.
// Gera o áudio somente ao toque do usuário e reutiliza o áudio na sessão.
import { useEffect, useRef, useState } from 'react';
import { Volume2, Loader2, Pause, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type State = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

// Somente uma reprodução ativa por vez em toda a página
let currentAudio: HTMLAudioElement | null = null;

// Cache do áudio por mensagem, válido durante a sessão
const audioCache = new Map<string, string>();

// Versão limpa do texto apenas para leitura em voz alta
export function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
    .replace(/https?:\/\/\S+/g, 'link disponível na conversa')
    .replace(/[*_~#>|]/g, ' ')
    .replace(/^\s*[-•]\s*/gm, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

interface SpeakButtonProps {
  messageId: string;
  text: string;
}

export function SpeakButton({ messageId, text }: SpeakButtonProps) {
  const [state, setState] = useState<State>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (currentAudio === audioRef.current) currentAudio = null;
      }
    };
  }, []);

  const attach = (audio: HTMLAudioElement) => {
    audio.onended = () => setState('ended');
    audio.onpause = () => setState((s) => (s === 'playing' ? 'paused' : s));
    audio.onplay = () => setState('playing');
    audio.onerror = () => setState('error');
  };

  const play = async (audio: HTMLAudioElement) => {
    if (currentAudio && currentAudio !== audio) currentAudio.pause();
    currentAudio = audio;
    try {
      await audio.play();
      setState('playing');
    } catch {
      setState('error');
    }
  };

  const handleClick = async () => {
    const existing = audioRef.current;

    if (state === 'playing' && existing) {
      existing.pause();
      setState('paused');
      return;
    }

    if (existing && (state === 'paused' || state === 'ended')) {
      if (state === 'ended') existing.currentTime = 0;
      await play(existing);
      return;
    }

    const cached = audioCache.get(messageId);
    if (cached) {
      const audio = new Audio(cached);
      audioRef.current = audio;
      attach(audio);
      await play(audio);
      return;
    }

    const spoken = cleanTextForSpeech(text);
    if (!spoken) return;

    setState('loading');
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: spoken },
      });
      if (error) throw error;
      const base64 = (data as { audio?: string })?.audio;
      if (!base64) throw new Error('sem áudio');

      const src = `data:audio/mpeg;base64,${base64}`;
      audioCache.set(messageId, src);
      const audio = new Audio(src);
      audioRef.current = audio;
      attach(audio);
      await play(audio);
    } catch (err) {
      console.error('[SpeakButton] TTS error:', err);
      setState('error');
    }
  };

  const label =
    state === 'loading'
      ? 'Gerando áudio...'
      : state === 'playing'
        ? 'Pausar'
        : state === 'paused'
          ? 'Continuar'
          : state === 'ended'
            ? 'Ouvir novamente'
            : state === 'error'
              ? 'Tentar novamente'
              : 'Ouvir';

  const Icon =
    state === 'loading' ? Loader2 : state === 'playing' ? Pause : state === 'paused' ? Play : Volume2;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === 'loading'}
      aria-label={label}
      className="mt-1.5 inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-full text-[12px] font-medium text-muted-foreground bg-foreground/5 hover:bg-foreground/10 active:scale-[0.97] transition disabled:opacity-70"
    >
      <Icon className={`w-3.5 h-3.5 ${state === 'loading' ? 'animate-spin' : ''}`} />
      {label}
    </button>
  );
}
