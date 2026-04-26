// ============================================================
// MIDGARD — Cloudflare Worker (proxy para API Anthropic)
// ============================================================
// INSTRUÇÕES:
// 1. Acesse https://workers.cloudflare.com e crie uma conta (grátis)
// 2. Crie um novo Worker e cole este código
// 3. Vá em Settings > Variables > adicione a variável:
//    Nome: ANTHROPIC_API_KEY   Valor: sua chave da API (https://console.anthropic.com)
// 4. Copie a URL do seu Worker (ex: meu-tutor.meuusuario.workers.dev)
// 5. No script.js do Midgard, substitua "https://SEU-WORKER.SEU-USUARIO.workers.dev"
//    pela URL real do seu Worker
// ============================================================

export default {
  async fetch(request, env) {
    // Libera CORS para qualquer origem (ou troque '*' pelo domínio do seu site)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Responde ao preflight do navegador
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Método não permitido', { status: 405 });
    }

    try {
      const body = await request.json();

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
