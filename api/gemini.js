module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Chave fornecida no prompt ou via ENV.
  // Verifica se a chave vinda do frontend é antiga (sk-...) e força a nova se necessário
  let apiKey = req.body.apiKey;
  if (!apiKey || apiKey.startsWith('sk-')) {
    apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDKBvEJMYN1QrldN_2QhdESN1CHtyttme4';
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key do Gemini não configurada.' });
  }

  try {
    let { contents, systemInstruction, model } = req.body;

    // CORREÇÃO: Mapeia nomes de modelos curtos/antigos para versões específicas suportadas
    if (!model || model === 'gemini-1.5-flash') model = 'gemini-1.5-flash-latest';
    if (model === 'gemini-1.5-pro') model = 'gemini-1.5-pro-latest';

    // Garante que o nome do modelo não tenha o prefixo 'models/' duplicado
    const cleanModel = model.replace(/^models\//, '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

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