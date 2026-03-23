module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Chave fornecida no prompt ou via ENV.
  // Prioridade: Body da requisição > Variável de Ambiente > Chave Hardcoded (fallback do prompt)
  const apiKey = req.body.apiKey || process.env.GEMINI_API_KEY || 'AIzaSyDKBvEJMYN1QrldN_2QhdESN1CHtyttme4';

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key do Gemini não configurada.' });
  }

  try {
    const { contents, systemInstruction, model = 'gemini-1.5-flash' } = req.body;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = { contents };
    if (systemInstruction) {
      payload.systemInstruction = systemInstruction;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erro na API Gemini' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro no servidor proxy: ' + error.message });
  }
};