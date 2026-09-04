// Edge Function: transcribe-audio
// Recebe áudio (multipart/form-data), valida e devolve { text }
// A chave da API nunca sai do servidor.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const MAX_BYTES = 8 * 1024 * 1024; // ~8MB (60s de voz cabe folgado)
const ALLOWED = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/mpga',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/aac',
  'audio/x-m4a',
  'audio/m4a',
  'video/mp4', // alguns navegadores rotulam gravação mp4 assim
  'video/webm',
];

const EXT_BY_MIME: Record<string, string> = {
  'audio/webm': 'webm',
  'video/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'video/mp4': 'mp4',
  'audio/x-m4a': 'm4a',
  'audio/m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/mpeg': 'mp3',
  'audio/mpga': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405);
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    console.error('[transcribe-audio] LOVABLE_API_KEY ausente');
    return json({ error: 'Serviço de transcrição não configurado.' }, 500);
  }

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return json({ error: 'Envie o áudio como multipart/form-data.' }, 400);
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const raw = form.get('file');
    if (raw instanceof File) file = raw;
  } catch (err) {
    console.error('[transcribe-audio] formData error:', err);
    return json({ error: 'Não foi possível ler o áudio enviado.' }, 400);
  }

  if (!file) return json({ error: 'Nenhum áudio recebido.' }, 400);
  if (file.size < 1024) return json({ error: 'Gravação muito curta ou vazia.' }, 400);
  if (file.size > MAX_BYTES) return json({ error: 'Áudio muito grande. Grave até 60 segundos.' }, 400);

  // Não confiar apenas no MIME do cliente: normalizar e validar
  const clientMime = (file.type || '').split(';')[0].toLowerCase();
  if (clientMime && !ALLOWED.includes(clientMime)) {
    return json({ error: 'Formato de áudio não suportado.' }, 400);
  }

  // Sniff básico do conteúdo para checar que é mesmo áudio conhecido
  const bytes = new Uint8Array(await file.arrayBuffer());
  const head = bytes.subarray(0, 16);
  const ascii = (i: number, n: number) =>
    Array.from(head.subarray(i, i + n)).map((b) => String.fromCharCode(b)).join('');
  let sniffed: string | null = null;
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) sniffed = 'webm';
  else if (ascii(0, 4) === 'OggS') sniffed = 'ogg';
  else if (ascii(4, 4) === 'ftyp') sniffed = 'mp4';
  else if (ascii(0, 4) === 'RIFF') sniffed = 'wav';
  else if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) sniffed = 'mp3';
  else if (head[0] === 0xff && (head[1] & 0xe0) === 0xe0) sniffed = 'mp3';

  if (!sniffed) {
    return json({ error: 'Arquivo de áudio inválido ou corrompido.' }, 400);
  }

  const ext = sniffed || EXT_BY_MIME[clientMime] || 'webm';

  try {
    const upstream = new FormData();
    upstream.append('model', 'google/gemini-3.5-transcribe');
    upstream.append('language', 'pt');
    upstream.append(
      'file',
      new Blob([bytes], { type: clientMime || `audio/${ext}` }),
      `recording.${ext}`,
    );

    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });

    const bodyText = await res.text();

    if (!res.ok) {
      console.error('[transcribe-audio] upstream', res.status, bodyText.slice(0, 500));
      if (res.status === 429) {
        return json({ error: 'Muitas gravações em sequência. Aguarde alguns segundos.' }, 429);
      }
      if (res.status === 402 || res.status === 403) {
        return json({ error: 'Transcrição indisponível no momento.' }, res.status);
      }
      return json({ error: 'Não consegui transcrever esse áudio. Tente novamente.' }, 502);
    }

    let text = '';
    try {
      const parsed = JSON.parse(bodyText);
      text = (parsed?.text ?? '').toString().trim();
    } catch {
      text = bodyText.trim();
    }

    if (!text) {
      return json({ error: 'Nenhuma fala foi identificada.' }, 422);
    }

    return json({ text });
  } catch (err) {
    console.error('[transcribe-audio] error:', err);
    return json({ error: 'Não consegui transcrever esse áudio. Tente novamente.' }, 500);
  }
});
