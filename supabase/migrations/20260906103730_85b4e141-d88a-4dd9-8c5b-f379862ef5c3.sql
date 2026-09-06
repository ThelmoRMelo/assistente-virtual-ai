ALTER TABLE public.business_config
  ADD COLUMN IF NOT EXISTS assistant_voice TEXT DEFAULT 'coral',
  ADD COLUMN IF NOT EXISTS assistant_voice_style TEXT DEFAULT 'Fale em português do Brasil com uma voz feminina, suave, calorosa e acolhedora. Tom jovem-adulto, sereno e expressivo. Fale de forma natural, conversacional, com ritmo calmo e agradável, como uma assistente amigável conversando de verdade. Use entonação leve, pausas naturais e variação de tom. Não soe robótica, nem muito rápida, nem infantil. Seja clara, simpática e atenciosa em cada frase.',
  ADD COLUMN IF NOT EXISTS assistant_voice_speed NUMERIC DEFAULT 1;

UPDATE public.business_config
SET assistant_voice = COALESCE(assistant_voice, 'coral'),
    assistant_voice_speed = COALESCE(assistant_voice_speed, 1);