/**
 * API-AI.JS - Lógica de Inteligência Artificial (Gemini)
 */

async function geminiApi(contents, systemInstruction = null) {
  const cfg = loadConfig();
  const model = cfg.model || 'gemini-1.5-flash-latest';
  const apiKey = cfg.claudeApiKey;
  if (!apiKey) throw new Error('API Key não configurada');

  // Usando o proxy do Vercel para evitar problemas de CORS
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, systemInstruction, model, apiKey })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na API Gemini');
  return data;
}

async function getAiPartsForEmail(email, textPrompt) {
  const parts = [{ text: textPrompt }];
  if (!state.accessToken || !email.hasAttachments) return parts;
  
  const attachments = await fetchAttachments(email.id);
  for (const att of attachments) {
    if (att['@odata.type'] === '#microsoft.graph.fileAttachment' && att.contentBytes) {
      const mime = att.contentType;
      if (mime === 'application/pdf' || mime.startsWith('image/')) {
        parts.push({ inlineData: { mimeType: mime, data: att.contentBytes } });
      }
    }
  }
  return parts;
}

async function summarizeSelected() {
  if (!state.selectedEmail) return;
  const email = state.selectedEmail;
  const summaryBox = document.getElementById('aiSummaryBox');
  const summaryText = document.getElementById('aiSummaryText');

  summaryBox.style.display = 'block';
  summaryText.textContent = 'Analisando histórico da conversa...';

  try {
    let contextText = `De: ${email.fromName}\nAssunto: ${email.subject}\nCorpo: ${email.bodyText}`;
    
    if (state.accessToken && email.conversationId) {
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$filter=conversationId eq '${email.conversationId}'&$select=from,receivedDateTime,bodyPreview,body&$orderby=receivedDateTime asc`, {
        headers: { Authorization: `Bearer ${state.accessToken}`, 'Prefer': 'outlook.body-content-type="text"' }
      });
      if (res.ok) {
        const data = await res.json();
        contextText = data.value.map(m => `--- ${m.from.emailAddress.name} (${new Date(m.receivedDateTime).toLocaleString()}) ---\n${m.body.content}`).join('\n\n');
      }
    }

    const prompt = `Analise este e-mail/conversa e faça um resumo executivo em português (2-3 frases). Destaque decisões e status.\n\nCONVERSA:\n${contextText.substring(0, 10000)}`;
    const parts = await getAiPartsForEmail(email, prompt);
    const data = await geminiApi([{ role: 'user', parts }]);
    summaryText.textContent = data.candidates[0].content.parts[0].text;
  } catch (e) { summaryText.textContent = 'Erro ao gerar resumo: ' + e.message; }
}

async function classifyEmail(email) {
  const activeRules = state.rules.filter(r => r.active);
  if (!activeRules.length) return 'Outros';

  const rulesText = activeRules.map(r => `- Pasta "${r.folder}": ${r.criteria}`).join('\n');
  const prompt = `Classifique este e-mail. Responda APENAS com o nome da pasta.\n\nRegras:\n${rulesText}\n- "Outros": demais casos\n\nAssunto: ${email.subject}\nCorpo: ${email.bodyText.substring(0, 1000)}`;
  
  try {
    const parts = await getAiPartsForEmail(email, prompt);
    const data = await geminiApi([{ role: 'user', parts }]);
    const folder = data.candidates[0].content.parts[0].text.trim();
    return activeRules.find(r => folder.includes(r.folder))?.folder || 'Outros';
  } catch { return 'Outros'; }
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  
  input.value = '';
  addChatMessage('user', msg);
  const typing = addTyping();

  const context = state.emails.slice(0, 10).map(e => `Assunto: ${e.subject} | De: ${e.fromName}`).join('\n');
  const systemPrompt = `Você é um assistente da Quality Transportes. Responda em português.\nE-mails recentes:\n${context}`;
  
  const history = state.chatHistory.map(m => ({ 
    role: m.role === 'assistant' ? 'model' : 'user', 
    parts: [{ text: m.text }] 
  }));
  history.push({ role: 'user', parts: [{ text: msg }] });

  try {
    const data = await geminiApi(history, systemPrompt);
    const reply = data.candidates[0].content.parts[0].text;
    removeTyping(typing);
    addChatMessage('assistant', reply);
    state.chatHistory.push({ role: 'user', text: msg }, { role: 'assistant', text: reply });
    localStorage.setItem('mailmind_chat_history', JSON.stringify(state.chatHistory.slice(-20)));
  } catch (e) { removeTyping(typing); addChatMessage('assistant', 'Erro: ' + e.message); }
}

async function testGeminiConnection() {
  showStatus('Testando conexão Gemini...');
  try {
    const data = await geminiApi([{ role: 'user', parts: [{ text: 'Diga OK' }] }]);
    showNotif('success', '✅', 'Conexão Gemini OK: ' + data.candidates[0].content.parts[0].text);
  } catch (e) { showNotif('error', '❌', 'Erro: ' + e.message); }
  finally { hideStatus(); }
}