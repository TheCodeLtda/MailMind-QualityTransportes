export default async function handler(req, res) {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Chave da API vem do corpo da requisição
  const { apiKey, ...body } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key não fornecida' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Repassa o status e o corpo da resposta da Anthropic
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao contatar a API do Claude: ' + error.message });
  }
}
