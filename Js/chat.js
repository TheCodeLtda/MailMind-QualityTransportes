// ============================================================
// chat.js — Assistente IA de e-mails
// ============================================================
import { state }          from './state.js';
import { claudeApi, loadConfig } from './api.js';
import { stripHtml, formatText, showNotif } from './utils.js';

export async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg   = input.value.trim();
  if (!msg) return;
  input.value = '';
  autoResize(input);

  addChatMessage('user', msg);
  const typing = addTyping();

  const cfg = loadConfig();
  if (!cfg.claudeApiKey) {
    removeTyping(typing);
    addChatMessage('assistant', 'Configure sua chave da API do Claude nas configurações para usar o assistente.');
    return;
  }

  const emailsContext = state.emails
    .map(e => {
      const body = e.bodyText || stripHtml(e.bodyHtml || '') || e.preview || '';
      return `[${e.dateFormatted || e.date}] De: ${e.fromName} <${e.from}> | Pasta: ${e.folder}\nAssunto: ${e.subject}\nCorpo: ${body.substring(0, 300)}`;
    })
    .join('\n\n---\n\n');

  const systemPrompt =
    `Você é um assistente inteligente de e-mails do Outlook. Responda sempre em português brasileiro de forma clara e organizada.\n\n` +
    `E-mails disponíveis (${state.emails.length} no total):\n${emailsContext}\n\n` +
    `Você pode resumir e-mails, identificar ações pendentes, fazer análises e relatórios, sugerir classificações e buscar informações específicas.`;

  const history = state.chatHistory.map(m => ({ role: m.role, content: m.text }));
  history.push({ role: 'user', content: msg });

  try {
    const data  = await claudeApi(history, 1000, systemPrompt);
    const reply = data.content?.[0]?.text || 'Desculpe, não consegui processar sua solicitação.';
    removeTyping(typing);
    addChatMessage('assistant', reply);
    state.chatHistory.push({ role: 'user', text: msg }, { role: 'assistant', text: reply });
    if (state.chatHistory.length > 20) state.chatHistory = state.chatHistory.slice(-20);
  } catch (e) {
    removeTyping(typing);
    addChatMessage('assistant', 'Erro ao contatar a API: ' + e.message);
  }
}

function addChatMessage(role, text) {
  const msgs = document.getElementById('chatMessages');
  const div  = document.createElement('div');
  div.className = `msg ${role}`;
  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  div.innerHTML = `<div class="msg-bubble">${formatText(text)}</div><div class="msg-time">${now}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addTyping() {
  const msgs = document.getElementById('chatMessages');
  const div  = document.createElement('div');
  div.className = 'msg assistant';
  div.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function removeTyping(el) { el?.parentNode?.removeChild(el); }

export function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
}

export function useSuggestion(btn) {
  document.getElementById('chatInput').value = btn.textContent;
  window.switchTab('chat', document.querySelectorAll('.tab')[1]);
  sendChat();
}

export function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}
