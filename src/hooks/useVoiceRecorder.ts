import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MAX_SECONDS = 60;

const CANDIDATE_MIMES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  for (const mime of CANDIDATE_MIMES) {
    try {
      if (MediaRecorder.isTypeSupported?.(mime)) return mime;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

export type RecorderStatus = 'idle' | 'recording' | 'transcribing';

interface Options {
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
}

export function useVoiceRecorder({ onTranscript, onError }: Options) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  const releaseMic = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setSeconds(0);
  }, []);

  useEffect(() => () => releaseMic(), [releaseMic]);

  const transcribe = useCallback(
    async (blob: Blob) => {
      if (blob.size < 1024) {
        setStatus('idle');
        onError('Nenhuma fala foi identificada.');
        return;
      }
      setStatus('transcribing');
      try {
        const ext = (blob.type.split(';')[0].split('/')[1] || 'webm').replace('x-', '');
        const form = new FormData();
        form.append('file', blob, `recording.${ext}`);

        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: form,
        });

        if (error) {
          let message = 'Não consegui transcrever esse áudio. Tente novamente.';
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === 'function') {
            try {
              const payload = await ctx.json();
              if (payload?.error) message = payload.error;
            } catch {
              /* ignore */
            }
          }
          throw new Error(message);
        }

        const text = (data as { text?: string } | null)?.text?.trim();
        if (!text) {
          onError('Nenhuma fala foi identificada.');
          return;
        }
        onTranscript(text);
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Não consegui transcrever esse áudio. Tente novamente.');
      } finally {
        setStatus('idle');
      }
    },
    [onError, onTranscript],
  );

  const startRecording = useCallback(async () => {
    if (status !== 'idle') return;
    if (!isSupported) {
      onError('Seu navegador não suporta gravação de voz.');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        onError('Permissão para o microfone foi negada.');
      } else {
        onError('Não foi possível acessar o microfone.');
      }
      return;
    }

    try {
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      cancelledRef.current = false;
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const chunks = chunksRef.current;
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const wasCancelled = cancelledRef.current;
        releaseMic();
        if (wasCancelled) {
          setStatus('idle');
          return;
        }
        void transcribe(new Blob(chunks, { type }));
      };

      recorder.onerror = () => {
        releaseMic();
        setStatus('idle');
        onError('Não foi possível acessar o microfone.');
      };

      recorder.start();
      setStatus('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_SECONDS) {
            try {
              recorderRef.current?.state === 'recording' && recorderRef.current.stop();
            } catch {
              /* ignore */
            }
          }
          return next;
        });
      }, 1000);
    } catch {
      releaseMic();
      setStatus('idle');
      onError('Não foi possível iniciar a gravação.');
    }
  }, [isSupported, onError, releaseMic, status, transcribe]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      cancelledRef.current = false;
      try {
        recorderRef.current.stop();
      } catch {
        releaseMic();
        setStatus('idle');
      }
    }
  }, [releaseMic]);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    if (recorderRef.current?.state === 'recording') {
      try {
        recorderRef.current.stop();
        return;
      } catch {
        /* fallthrough */
      }
    }
    releaseMic();
    setStatus('idle');
  }, [releaseMic]);

  return {
    status,
    seconds,
    isSupported,
    maxSeconds: MAX_SECONDS,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
