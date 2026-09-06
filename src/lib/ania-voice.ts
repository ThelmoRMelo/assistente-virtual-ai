// Configuração de voz da ANIA — fonte única de verdade (frontend).
// As vozes abaixo são as suportadas pelo modelo TTS usado no projeto
// (openai/gpt-4o-mini-tts via gateway de IA).

export const ANIA_VOICES = [
  { value: 'coral', label: 'Coral (feminina, calorosa)' },
  { value: 'nova', label: 'Nova (feminina, suave)' },
  { value: 'shimmer', label: 'Shimmer (feminina, clara)' },
  { value: 'sage', label: 'Sage (feminina, serena)' },
  { value: 'alloy', label: 'Alloy (neutra)' },
  { value: 'ash', label: 'Ash (masculina, firme)' },
  { value: 'ballad', label: 'Ballad (expressiva)' },
  { value: 'echo', label: 'Echo (masculina, direta)' },
  { value: 'fable', label: 'Fable (narrativa)' },
  { value: 'onyx', label: 'Onyx (masculina, grave)' },
  { value: 'verse', label: 'Verse (versátil)' },
] as const;

export const DEFAULT_ANIA_VOICE = 'coral';
export const DEFAULT_ANIA_SPEED = 1;

export const VOICE_SPEED_MIN = 0.5;
export const VOICE_SPEED_MAX = 2;

const BASE = 'Fale em português do Brasil.';

export const DEFAULT_ANIA_VOICE_STYLE =
  'Fale em português do Brasil com uma voz feminina, suave, calorosa e acolhedora. Tom jovem-adulto, sereno e expressivo. Fale de forma natural, conversacional, com ritmo calmo e agradável, como uma assistente amigável conversando de verdade. Use entonação leve, pausas naturais e variação de tom. Não soe robótica, nem muito rápida, nem infantil. Seja clara, simpática e atenciosa em cada frase.';

export const VOICE_STYLE_PRESETS = [
  {
    key: 'natural',
    label: 'Natural',
    instructions: DEFAULT_ANIA_VOICE_STYLE,
  },
  {
    key: 'amigavel',
    label: 'Amigável',
    instructions: `${BASE} Tom leve, animado e simpático, como uma amiga conversando. Ritmo natural, entonação variada e sorriso na voz. Sem exageros e sem soar infantil.`,
  },
  {
    key: 'profissional',
    label: 'Profissional',
    instructions: `${BASE} Tom claro, seguro e objetivo, como uma atendente experiente. Boa dicção, ritmo estável e entonação discreta. Cordial, sem informalidade excessiva.`,
  },
  {
    key: 'acolhedora',
    label: 'Acolhedora',
    instructions: `${BASE} Tom calmo, gentil e empático, com pausas suaves e voz macia. Transmita paciência e atenção, como quem cuida de quem está do outro lado.`,
  },
  {
    key: 'vendedora',
    label: 'Vendedora',
    instructions: `${BASE} Tom entusiasmado e persuasivo, com energia e confiança. Destaque benefícios com entonação marcante e ritmo um pouco mais dinâmico, sem pressionar nem soar artificial.`,
  },
] as const;

export const VOICE_SAMPLE_TEXT =
  'Olá! Eu sou a ANIA, sua assistente virtual. Posso te ajudar a escolher o produto ideal agora mesmo.';

export function styleKeyFromInstructions(instructions?: string | null): string {
  if (!instructions) return 'natural';
  const found = VOICE_STYLE_PRESETS.find((p) => p.instructions === instructions);
  return found ? found.key : 'personalizado';
}

export function clampSpeed(value: number | null | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_ANIA_SPEED;
  return Math.min(VOICE_SPEED_MAX, Math.max(VOICE_SPEED_MIN, n));
}
