import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { review_id } = await req.json();
    if (!review_id || typeof review_id !== 'string') {
      return new Response(JSON.stringify({ error: 'review_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: review, error: rErr } = await supabase
      .from('product_reviews')
      .select('*, products(name, short_description, long_description)')
      .eq('id', review_id)
      .single();

    if (rErr || !review) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: config } = await supabase
      .from('business_config')
      .select('business_name, use_emojis')
      .maybeSingle();

    const useEmojis = config?.use_emojis ?? true;
    const businessName = config?.business_name || 'nossa loja';
    const productName = (review as any).products?.name || 'o produto';

    const systemPrompt = `Você é ANIA, assistente virtual cordial de ${businessName}.
Responda de forma curta (máximo 2 frases), educada e útil ao comentário do cliente sobre "${productName}".
${useEmojis ? 'Use emojis com moderação.' : 'NÃO use emojis.'}
Não invente informações. Se for elogio, agradeça. Se for crítica, demonstre empatia.
Escreva em português do Brasil.`;

    const userPrompt = `Avaliação de ${review.customer_name} (${review.stars}★):
"${review.comment}"

Responda como ANIA:`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      return new Response(JSON.stringify({ error: 'AI gateway error', detail: text }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const reply = aiData?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return new Response(JSON.stringify({ error: 'No reply from AI' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: uErr } = await supabase
      .from('product_reviews')
      .update({ ania_reply: reply, ania_reply_at: new Date().toISOString() })
      .eq('id', review_id);

    if (uErr) {
      return new Response(JSON.stringify({ error: uErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
