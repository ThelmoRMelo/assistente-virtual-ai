// Edge Function: text-to-speech
// Recebe { text } e devolve diretamente o áudio MP3.
// A chave da API nunca sai do servidor.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// ---- 🎙️ CONFIGURAÇÃO DE VOZ PADRÃO DA ANIA ----
const TTS_MODEL = 'openai/gpt-4o-mini-tts';

const DEFAULT_VOICE = 'coral';

const DEFAULT_INSTRUCTIONS =
  'Fale em português do Brasil com uma voz feminina, suave, calorosa e acolhedora. Tom jovem-adulto, sereno e expressivo. Fale de forma natural, conversacional, com ritmo calmo e agradável, como uma assistente amigável conversando de verdade. Use entonação leve, pausas naturais e variação de tom. Não soe robótica, nem muito rápida, nem infantil. Seja clara, simpática e atenciosa em cada frase.';

const DEFAULT_SPEED = 1;

const TTS_FORMAT = 'mp3';

const ALLOWED_VOICES = new Set([
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'nova',
  'onyx',
  'sage',
  'shimmer',
  'verse',
]);

const SPEED_MIN = 0.5;
const SPEED_MAX = 2;
const MAX_INSTRUCTIONS_CHARS = 1500;
const MAX_CHARS = 1200;

// ------------------------------------------------

function jsonError(message: string, status = 500) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonError('Método não permitido', 405);
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!apiKey) {
    console.error('[text-to-speech] LOVABLE_API_KEY ausente');

    return jsonError(
      'Serviço de voz não configurado.',
      500,
    );
  }

  let text = '';
  let voice = DEFAULT_VOICE;
  let instructions = DEFAULT_INSTRUCTIONS;
  let speed = DEFAULT_SPEED;

  try {
    const body = await req.json();

    text =
      typeof body?.text === 'string'
        ? body.text.trim()
        : '';

    if (typeof body?.voice === 'string') {
      const v = body.voice.trim().toLowerCase();

      if (!ALLOWED_VOICES.has(v)) {
        return jsonError(
          'Voz não suportada.',
          400,
        );
      }

      voice = v;
    }

    if (
      typeof body?.instructions === 'string' &&
      body.instructions.trim()
    ) {
      instructions = body.instructions
        .trim()
        .slice(0, MAX_INSTRUCTIONS_CHARS);
    }

    if (
      body?.speed !== undefined &&
      body?.speed !== null
    ) {
      const s = Number(body.speed);

      if (!Number.isFinite(s)) {
        return jsonError(
          'Velocidade inválida.',
          400,
        );
      }

      speed = Math.min(
        SPEED_MAX,
        Math.max(SPEED_MIN, s),
      );
    }
  } catch {
    return jsonError(
      'Corpo da requisição inválido.',
      400,
    );
  }

  if (!text) {
    return jsonError(
      'Nenhum texto para falar.',
      400,
    );
  }

  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
  }

  try {
    const res = await fetch(
      'https://ai.gateway.lovable.dev/v1/audio/speech',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          model: TTS_MODEL,
          input: text,
          voice,
          instructions,
          speed,
          response_format: TTS_FORMAT,
          stream_format: 'audio',
        }),
      },
    );

    if (!res.ok) {
      const detail = await res
        .text()
        .catch(() => '');

      console.error(
        '[text-to-speech] upstream',
        res.status,
        detail.slice(0, 400),
      );

      if (res.status === 429) {
        return jsonError(
          'Muitos áudios em sequência. Aguarde alguns segundos.',
          429,
        );
      }

      if (
        res.status === 402 ||
        res.status === 403
      ) {
        return jsonError(
          'Áudio indisponível no momento.',
          res.status,
        );
      }

      return jsonError(
        'Não consegui gerar o áudio. Tente novamente.',
        502,
      );
    }

    if (!res.body) {
      return jsonError(
        'Não consegui gerar o áudio. Tente novamente.',
        502,
      );
    }

    return new Response(res.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error(
      '[text-to-speech] error:',
      err,
    );

    return jsonError(
      'Não consegui gerar o áudio. Tente novamente.',
      500,
    );
  }
});
