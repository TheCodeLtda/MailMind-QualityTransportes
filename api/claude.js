module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY não configurada. Acesse as configurações do projeto no Vercel e adicione a variável de ambiente.'
    });
  }

  try {
    // Remove campos que não devem ir para a API
    const { apiKey: _a, claudeApiKey: _b, ...body } = req.body || {};

    // Garante campos obrigatórios
    if (!body.model) body.model = 'claude-sonnet-4-20250514';
    if (!body.max_tokens) body.max_tokens = 1000;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    // Tenta parsear JSON
    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(502).json({ error: 'Resposta inválida da API Anthropic', raw: text.substring(0, 200) }); }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao contatar a API do Claude: ' + error.message });
  }
};
