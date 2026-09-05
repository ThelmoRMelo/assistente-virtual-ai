// Edge Function: text-to-speech
// Recebe { text } e devolve { audio: base64 mp3, mimeType }
// A chave da API nunca sai do servidor.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// ---- Configuração de voz (fácil de alterar) ----
const TTS_MODEL = 'openai/gpt-4o-mini-tts';
const TTS_VOICE = 'shimmer'; // voz feminina, calorosa
const TTS_INSTRUCTIONS =
  'Fale em português do Brasil, com voz feminina jovem, natural, clara, amigável e acolhedora, como uma assistente virtual de vendas. Ritmo natural, sem pressa.';
const TTS_FORMAT = 'mp3';
// ------------------------------------------------

const MAX_CHARS = 1200;

function base64Encode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

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
    console.error('[text-to-speech] LOVABLE_API_KEY ausente');
    return json({ error: 'Serviço de voz não configurado.' }, 500);
  }

  let text = '';
  try {
    const body = await req.json();
    text = typeof body?.text === 'string' ? body.text.trim() : '';
  } catch {
    return json({ error: 'Corpo da requisição inválido.' }, 400);
  }

  if (!text) return json({ error: 'Nenhum texto para falar.' }, 400);
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: text,
        voice: TTS_VOICE,
        instructions: TTS_INSTRUCTIONS,
        response_format: TTS_FORMAT,
        stream_format: 'audio',
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[text-to-speech] upstream', res.status, detail.slice(0, 400));
      if (res.status === 429) {
        return json({ error: 'Muitos áudios em sequência. Aguarde alguns segundos.' }, 429);
      }
      if (res.status === 402 || res.status === 403) {
        return json({ error: 'Áudio indisponível no momento.' }, res.status);
      }
      return json({ error: 'Não consegui gerar o áudio. Tente novamente.' }, 502);
    }

    const buffer = await res.arrayBuffer();
    if (!buffer.byteLength) {
      return json({ error: 'Não consegui gerar o áudio. Tente novamente.' }, 502);
    }

    return json({ audio: base64Encode(buffer), mimeType: 'audio/mpeg' });
  } catch (err) {
    console.error('[text-to-speech] error:', err);
    return json({ error: 'Não consegui gerar o áudio. Tente novamente.' }, 500);
  }
});
