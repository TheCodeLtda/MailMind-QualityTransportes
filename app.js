// ============================================================
// STATE
// ============================================================
let state = {
  connected: false,
  accessToken: null,
  emails: [],
  filteredEmails: [],
  selectedEmail: null,
  currentFilter: 'all',
  currentFolder: null,
  currentView: 'emails',
  rules: [],
  config: {},
  chatHistory: [],
};

const DEMO_EMAILS = [
  {
    id: '1', from: 'joao.silva@empresa.com', fromName: 'João Silva',
    subject: 'Relatório Q1 2026 - Revisão necessária',
    preview: 'Segue em anexo o relatório do primeiro trimestre...',
    bodyText: 'Olá time,\n\nSegue em anexo o relatório do primeiro trimestre de 2026 para revisão. Precisamos finalizar até sexta-feira.\n\nPontos de atenção:\n- Faturamento abaixo do previsto em 12%\n- Custo operacional cresceu 8%\n- Pipeline para Q2 está saudável\n\nPor favor revisem e me mandem feedback até quinta.\n\nAbraços,\nJoão',
    bodyHtml: null,
    date: '2026-03-20T09:45:00Z', dateFormatted: '20/03/2026 09:45',
    unread: true, folder: 'Trabalho', tag: 'tag-work',
    hasAttachments: true, importance: 'high', to: ['time@empresa.com'], cc: [],
  },
  {
    id: '2', from: 'noreply@banco.com.br', fromName: 'Banco Digital',
    subject: 'Fatura do seu cartão - Vencimento 25/03',
    preview: 'Sua fatura no valor de R$ 1.847,50 vence em 5 dias...',
    bodyText: 'Prezado cliente,\n\nSua fatura do cartão de crédito está disponível:\n\nValor total: R$ 1.847,50\nVencimento: 25/03/2026\nPagamento mínimo: R$ 92,38\n\nPague via PIX, boleto ou débito automático.\n\nAtenciosamente,\nBanco Digital',
    bodyHtml: null,
    date: '2026-03-20T08:30:00Z', dateFormatted: '20/03/2026 08:30',
    unread: true, folder: 'Financeiro', tag: 'tag-finance',
    hasAttachments: false, importance: 'normal', to: ['cliente@email.com'], cc: [],
  },
  {
    id: '3', from: 'newsletter@techcrunch.com', fromName: 'TechCrunch',
    subject: '🚀 As 10 maiores tendências de IA para 2026',
    preview: 'Esta semana no TechCrunch: OpenAI, Google e as apostas...',
    bodyText: 'Esta semana no TechCrunch:\n\n1. OpenAI anuncia novo modelo multimodal\n2. Google investiu US$ 50bi em computação quântica\n3. Startups de IA levantaram recorde de US$ 120bi em Q1\n4. Meta lança assistente open-source para empresas\n5. Anthropic expande presença na Europa\n\nLeia mais em techcrunch.com',
    bodyHtml: null,
    date: '2026-03-19T18:00:00Z', dateFormatted: '19/03/2026 18:00',
    unread: false, folder: 'Marketing', tag: 'tag-marketing',
    hasAttachments: false, importance: 'normal', to: ['subscriber@email.com'], cc: [],
  },
  {
    id: '4', from: 'maria.santos@gmail.com', fromName: 'Maria Santos',
    subject: 'Almoço de aniversário - confirmação',
    preview: 'Oi! Confirmando para sábado às 13h no restaurante...',
    bodyText: 'Oi querido!\n\nConfirmando o almoço de aniversário para sábado, dia 22/03, às 13h no Restaurante Japonês.\n\nVão estar presentes: família e amigos próximos, umas 15 pessoas.\n\nNão precisa trazer nada, apenas você! 🎂\n\nBejo,\nMaria',
    bodyHtml: null,
    date: '2026-03-19T14:20:00Z', dateFormatted: '19/03/2026 14:20',
    unread: true, folder: 'Pessoal', tag: 'tag-personal',
    hasAttachments: false, importance: 'normal', to: ['voce@email.com'], cc: [],
  },
  {
    id: '5', from: 'juridico@parceiro.com.br', fromName: 'Escritório Jurídico',
    subject: 'Contrato de prestação de serviços - minuta final',
    preview: 'Conforme alinhado na reunião, segue a minuta final do...',
    bodyText: 'Prezados,\n\nConforme alinhado em reunião do dia 15/03, segue a minuta final do contrato de prestação de serviços para análise e assinatura.\n\nPrazo para retorno: 23/03/2026\n\nQualquer dúvida, estou à disposição.\n\nAtenciosamente,\nDr. Carlos Mendes\nAdvogado OAB/SP 123.456',
    bodyHtml: null,
    date: '2026-03-19T11:00:00Z', dateFormatted: '19/03/2026 11:00',
    unread: false, folder: 'Trabalho', tag: 'tag-work',
    hasAttachments: true, importance: 'high', to: ['empresa@email.com'], cc: [],
  },
  {
    id: '6', from: 'promo@amazon.com.br', fromName: 'Amazon',
    subject: 'Suas ofertas de hoje - até 70% OFF em eletrônicos',
    preview: 'Aproveite as melhores ofertas em smartphones, notebooks...',
    bodyText: 'Ofertas especiais para você:\n\n📱 iPhone 16 Pro - R$ 7.499 (era R$ 9.999)\n💻 MacBook Air M3 - R$ 9.999 (era R$ 12.999)\n🎧 AirPods Pro - R$ 1.299 (era R$ 1.999)\n\nOfertas válidas por 24h. Frete grátis acima de R$ 299.',
    bodyHtml: null,
    date: '2026-03-18T10:00:00Z', dateFormatted: '18/03/2026 10:00',
    unread: false, folder: 'Marketing', tag: 'tag-marketing',
    hasAttachments: false, importance: 'normal', to: ['cliente@email.com'], cc: [],
  },
  {
    id: '7', from: 'rh@empresa.com', fromName: 'RH - Empresa',
    subject: 'Holerite Março 2026 disponível',
    preview: 'Seu holerite de março está disponível no portal...',
    bodyText: 'Prezado colaborador,\n\nSeu holerite referente ao mês de Março/2026 está disponível no portal do colaborador.\n\nAcesse: portal.empresa.com/holerite\n\nData de pagamento: 05/04/2026\n\nEm caso de dúvidas, entre em contato com o RH.\n\nAtenciosamente,\nDepartamento de RH',
    bodyHtml: null,
    date: '2026-03-18T09:00:00Z', dateFormatted: '18/03/2026 09:00',
    unread: true, folder: 'Trabalho', tag: 'tag-work',
    hasAttachments: false, importance: 'normal', to: ['colaborador@empresa.com'], cc: [],
  },
];

const DEFAULT_RULES = [
  { id: 'r1', name: 'E-mails Financeiros', criteria: 'fatura, boleto, pagamento, NF, nota fiscal, cobrança, vencimento, extrato, pix, transferência', folder: 'Financeiro', priority: 'high', active: true, icon: '💰', color: 'rgba(29,158,117,0.15)' },
  { id: 'r2', name: 'Newsletters e Marketing', criteria: 'newsletter, unsubscribe, promoção, oferta, desconto, campanha, marketing, promo', folder: 'Marketing', priority: 'medium', active: true, icon: '📢', color: 'rgba(239,159,39,0.15)' },
  { id: 'r3', name: 'E-mails Pessoais', criteria: 'aniversário, festa, almoço, jantar, fim de semana, pessoal, família, amigo', folder: 'Pessoal', priority: 'low', active: true, icon: '👤', color: 'rgba(240,153,123,0.15)' },
  { id: 'r4', name: 'E-mails de Trabalho', criteria: 'reunião, projeto, relatório, proposta, cliente, contrato, prazo, entrega, sprint, deadline', folder: 'Trabalho', priority: 'high', active: true, icon: '💼', color: 'rgba(124,110,250,0.15)' },
];

// ============================================================
// INIT
// ============================================================
function init() {
  const cfg = loadConfig();
  if (!cfg.claudeApiKey) {
    document.getElementById('setupScreen').classList.remove('hidden');
  } else {
    document.getElementById('setupScreen').classList.add('hidden');
    loadApp(cfg);
  }
}

function loadConfig() {
  try { return JSON.parse(localStorage.getItem('mailmind_config') || '{}'); }
  catch { return {}; }
}

function loadApp(cfg) {
  state.config = cfg;
  state.rules = JSON.parse(localStorage.getItem('mailmind_rules') || 'null') || DEFAULT_RULES;
  state.emails = DEMO_EMAILS;
  state.filteredEmails = [...state.emails];

  document.getElementById('configApiKey').value    = cfg.claudeApiKey || '';
  document.getElementById('configClientId').value  = cfg.clientId || '';
  document.getElementById('configTenantId').value  = cfg.tenantId || '';
  document.getElementById('configRedirectUri').value = cfg.redirectUri || window.location.origin;
  document.getElementById('msClientId').value      = cfg.clientId || '';
  document.getElementById('msTenantId').value      = cfg.tenantId || 'common';

  renderEmailList();
  renderRules();
  updateFolderCounts();
  updateUnreadBadge();
}

function saveSetup() {
  const key      = document.getElementById('claudeApiKey').value.trim();
  const clientId = document.getElementById('msClientId').value.trim();
  const tenantId = document.getElementById('msTenantId').value.trim() || 'common';

  if (!key) { showNotif('error', '❌', 'Insira sua chave da API do Claude'); return; }

  const cfg = { claudeApiKey: key, clientId, tenantId, redirectUri: window.location.origin, model: 'claude-sonnet-4-20250514' };
  localStorage.setItem('mailmind_config', JSON.stringify(cfg));
  document.getElementById('setupScreen').classList.add('hidden');
  loadApp(cfg);
  showNotif('success', '✅', 'Configuração salva! Bem-vindo ao MailMind.');
}

// ============================================================
// OUTLOOK CONNECT  (Microsoft Graph — OAuth implicit flow)
// ============================================================
function connectOutlook() {
  const cfg = loadConfig();
  if (!cfg.clientId) {
    showNotif('error', '❌', 'Configure o Client ID do Azure primeiro');
    switchView('config', null);
    return;
  }

  const scopes      = 'openid profile email Mail.Read Mail.ReadWrite Mail.Send offline_access';
  const redirectUri = encodeURIComponent(cfg.redirectUri || window.location.origin);
  const tenantId    = cfg.tenantId || 'common';
  const authUrl     = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize` +
    `?client_id=${cfg.clientId}&response_type=token&redirect_uri=${redirectUri}` +
    `&scope=${encodeURIComponent(scopes)}&response_mode=fragment`;

  const popup = window.open(authUrl, 'outlook-auth', 'width=500,height=700,scrollbars=yes');

  const interval = setInterval(() => {
    try {
      if (!popup || popup.closed) { clearInterval(interval); return; }
      const hash = popup.location.hash;
      if (hash && hash.includes('access_token')) {
        clearInterval(interval);
        popup.close();
        const params = new URLSearchParams(hash.substring(1));
        const token  = params.get('access_token');
        if (token) handleToken(token);
      }
    } catch (e) { /* cross-origin — keep polling */ }
  }, 500);
}

function handleToken(token) {
  state.accessToken = token;
  state.connected   = true;
  document.getElementById('connectBtn').textContent = '✅ Conectado';
  document.getElementById('connectBtn').classList.add('connected');
  document.getElementById('connectStatus').textContent = 'Outlook conectado';
  showNotif('success', '✅', 'Outlook conectado com sucesso!');
  fetchEmails();
}

// ============================================================
// GRAPH API — FETCH EMAILS
// ============================================================
async function fetchEmails() {
  if (!state.accessToken) { showNotif('error', '❌', 'Conecte sua conta Outlook primeiro'); return; }
  showStatus('Carregando e-mails do Outlook...');
  try {
    const res = await fetch(
      'https://graph.microsoft.com/v1.0/me/messages' +
      '?$top=50&$select=id,subject,from,toRecipients,ccRecipients,bodyPreview,body,receivedDateTime,isRead,hasAttachments,importance' +
      '&$orderby=receivedDateTime desc',
      { headers: {
          Authorization: `Bearer ${state.accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'outlook.body-content-type="html"'   // força retorno em HTML
      }}
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    state.emails = data.value.map(m => {
      const contentType = (m.body?.contentType || '').toLowerCase();
      const isHtml = contentType === 'html';
      return {
        id:             m.id,
        from:           m.from?.emailAddress?.address || '',
        fromName:       m.from?.emailAddress?.name || '',
        to:             (m.toRecipients || []).map(r => r.emailAddress?.address).filter(Boolean),
        cc:             (m.ccRecipients  || []).map(r => r.emailAddress?.address).filter(Boolean),
        subject:        m.subject || '(sem assunto)',
        preview:        m.bodyPreview || '',
        bodyHtml:       isHtml ? m.body.content : wrapTextAsHtml(m.body?.content || ''),
        bodyText:       stripHtml(m.body?.content || ''),
        date:           m.receivedDateTime,
        dateFormatted:  formatDate(m.receivedDateTime),
        unread:         !m.isRead,
        hasAttachments: m.hasAttachments || false,
        importance:     m.importance || 'normal',
        folder:         'Outros',
        tag:            '',
        attachments:    null,
      };
    });
    state.filteredEmails = [...state.emails];
    renderEmailList();
    updateFolderCounts();
    updateUnreadBadge();
    hideStatus();
    showNotif('success', '✅', `${state.emails.length} e-mails carregados`);
    if (loadConfig().autoClassify !== false) classifyAllEmails();
  } catch (e) {
    hideStatus();
    showNotif('error', '❌', 'Erro ao carregar e-mails: ' + e.message);
  }
}

// Busca anexos de um e-mail (incluindo imagens inline CID)
async function fetchAttachments(emailId) {
  if (!state.accessToken) return [];
  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages/${emailId}/attachments`,
      { headers: { Authorization: `Bearer ${state.accessToken}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.value || [];
  } catch { return []; }
}

// ============================================================
// GRAPH API — MOVE EMAIL
// ============================================================
async function moveEmail(emailId, folderName) {
  if (!state.accessToken) return;
  try {
    const foldersRes  = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders',
      { headers: { Authorization: `Bearer ${state.accessToken}` } });
    const foldersData = await foldersRes.json();
    let folder = foldersData.value.find(f => f.displayName.toLowerCase() === folderName.toLowerCase());

    if (!folder) {
      const createRes = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: folderName }),
      });
      folder = await createRes.json();
    }

    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/move`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: folder.id }),
    });
  } catch (e) { console.error('Erro ao mover e-mail:', e); }
}

// ============================================================
// AI — CLASSIFY EMAIL
// ============================================================
async function classifyEmail(email) {
  const cfg = loadConfig();
  if (!cfg.claudeApiKey) return email.folder || 'Outros';

  const rulesText = state.rules
    .filter(r => r.active)
    .map(r => `- Pasta "${r.folder}": se o conteúdo contém palavras como "${r.criteria}"`)
    .join('\n');

  const bodyText = email.bodyText || stripHtml(email.bodyHtml || '') || email.preview || '';
  const prompt =
    `Você é um assistente que classifica e-mails em pastas. Analise o e-mail abaixo e responda APENAS com o nome da pasta (sem explicação).\n\n` +
    `Regras de classificação:\n${rulesText}\n- Pasta "Outros": se não se encaixar em nenhuma categoria acima\n\n` +
    `E-mail:\nRemetente: ${email.from}\nAssunto: ${email.subject}\nCorpo: ${bodyText.substring(0, 800)}\n\n` +
    `Responda APENAS com o nome da pasta: Financeiro, Trabalho, Marketing, Pessoal ou Outros.`;

  try {
    const res  = await claudeApi([{ role: 'user', content: prompt }], 50);
    const text = res.content?.[0]?.text?.trim() || 'Outros';
    const valid = ['Financeiro', 'Trabalho', 'Marketing', 'Pessoal', 'Outros'];
    return valid.find(f => text.includes(f)) || 'Outros';
  } catch (e) { return 'Outros'; }
}

async function classifyAllEmails() {
  const cfg = loadConfig();
  if (!cfg.claudeApiKey) { showNotif('error', '❌', 'Configure a chave da API do Claude'); return; }

  const batchSize = cfg.batchSize || 20;
  const toProcess = state.emails.slice(0, batchSize);
  showStatus(`Classificando ${toProcess.length} e-mails com IA...`);

  const tagMap = { Financeiro: 'tag-finance', Trabalho: 'tag-work', Marketing: 'tag-marketing', Pessoal: 'tag-personal', Outros: '' };

  for (let i = 0; i < toProcess.length; i++) {
    const email  = toProcess[i];
    showStatus(`Classificando e-mail ${i + 1}/${toProcess.length}...`);
    const folder = await classifyEmail(email);
    email.folder = folder;
    email.tag    = tagMap[folder] || '';
    if (state.connected && state.accessToken) await moveEmail(email.id, folder);
  }

  state.filteredEmails = [...state.emails];
  renderEmailList();
  updateFolderCounts();
  hideStatus();
  showNotif('success', '✅', `${toProcess.length} e-mails classificados!`);
}

// ============================================================
// AI — SUMMARIZE EMAIL
// ============================================================
async function summarizeEmail(email) {
  const cfg = loadConfig();
  if (!cfg.claudeApiKey) return 'Configure a chave da API do Claude para usar esta função.';

  const bodyText = email.bodyText || stripHtml(email.bodyHtml || '') || email.preview || '';
  const prompt =
    `Faça um resumo executivo deste e-mail em português, em 2-3 frases. Destaque o ponto principal e qualquer ação necessária.\n\n` +
    `De: ${email.fromName} <${email.from}>\nAssunto: ${email.subject}\nData: ${email.dateFormatted || email.date}\nCorpo:\n${bodyText.substring(0, 1500)}`;

  try {
    const res = await claudeApi([{ role: 'user', content: prompt }], 200);
    return res.content?.[0]?.text || 'Não foi possível gerar o resumo.';
  } catch (e) { return 'Erro ao gerar resumo: ' + e.message; }
}

// ============================================================
// AI — CLAUDE API HELPER
// ============================================================
async function claudeApi(messages, maxTokens = 1000, system = null) {
  const cfg  = loadConfig();
  const body = {
    apiKey:     cfg.claudeApiKey,          // repassado pelo proxy, nunca exposto no header
    model:      cfg.model || 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages,
  };
  if (system) body.system = system;

  const res = await fetch('/api/claude', {  // chama a função serverless do Vercel
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return res.json();
}

// ============================================================
// AI CHAT
// ============================================================
async function sendChat() {
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
    addChatMessage('assistant', '⚠️ Configure sua chave da API do Claude nas configurações para usar o assistente.');
    return;
  }

  const emailsContext = state.emails
    .map(e => {
      const body = e.bodyText || stripHtml(e.bodyHtml || '') || e.preview || '';
      return `[${e.dateFormatted || e.date}] De: ${e.fromName} <${e.from}> | Pasta: ${e.folder}\nAssunto: ${e.subject}\nCorpo: ${body.substring(0, 300)}`;
    })
    .join('\n\n---\n\n');

  const systemPrompt =
    `Você é um assistente inteligente de e-mails. O usuário tem acesso a uma caixa de e-mails do Outlook. Responda sempre em português brasileiro de forma clara e organizada.\n\n` +
    `E-mails disponíveis (${state.emails.length} no total):\n${emailsContext}\n\n` +
    `Você pode:\n- Resumir e-mails por período, remetente ou assunto\n- Identificar ações pendentes\n- Fazer análises e relatórios\n- Sugerir classificações\n- Buscar informações específicas nos e-mails`;

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
    addChatMessage('assistant', '❌ Erro ao contatar a API: ' + e.message);
  }
}

function addChatMessage(role, text) {
  const msgs = document.getElementById('chatMessages');
  const div  = document.createElement('div');
  div.className = `msg ${role}`;
  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  div.innerHTML =
    `<div class="msg-bubble">${formatText(text)}</div><div class="msg-time">${now}</div>`;
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

function removeTyping(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
}

function useSuggestion(btn) {
  document.getElementById('chatInput').value = btn.textContent;
  switchTab('chat', document.querySelectorAll('.tab')[1]);
  sendChat();
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}

// ============================================================
// EMAIL LIST RENDER
// ============================================================
function renderEmailList() {
  const list   = document.getElementById('emailList');
  const emails = state.filteredEmails;

  if (!emails.length) {
    list.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--text3);font-size:13px;">Nenhum e-mail encontrado</div>';
    return;
  }

  list.innerHTML = emails.map(e => {
    const initials = getInitials(e.fromName || e.from);
    const color    = getAvatarColor(e.from);
    const relDate  = formatRelativeDate(e.date);
    const selected = state.selectedEmail?.id === e.id;

    return `
    <div class="email-item ${e.unread ? 'unread' : ''} ${selected ? 'selected' : ''}"
         onclick="selectEmail('${e.id}')">
      <div class="email-item-inner">
        <div class="email-avatar-col">
          <div class="list-avatar" style="background:${color}">${initials}</div>
          ${e.unread ? '<div class="unread-dot"></div>' : ''}
        </div>
        <div class="email-content-col">
          <div class="email-meta">
            <div class="email-sender">${escHtml(e.fromName || e.from)}</div>
            <div class="email-date-row">
              ${e.importance === 'high' ? '<span class="importance-icon" title="Alta importância">🔴</span>' : ''}
              ${e.hasAttachments ? '<span class="attach-icon" title="Tem anexos">📎</span>' : ''}
              <span class="email-date">${relDate}</span>
            </div>
          </div>
          <div class="email-subject">${escHtml(e.subject)}</div>
          <div class="email-bottom-row">
            <div class="email-preview">${escHtml(e.preview)}</div>
            ${e.folder && e.tag ? `<span class="email-tag ${e.tag}">${e.folder}</span>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function selectEmail(id) {
  state.selectedEmail = state.emails.find(e => e.id === id);
  if (!state.selectedEmail) return;
  state.selectedEmail.unread = false;
  renderEmailList();
  renderEmailDetail(state.selectedEmail);
  switchTab('detail', document.querySelectorAll('.tab')[0]);
  updateUnreadBadge();
}

async function renderEmailDetail(email) {
  const detail   = document.getElementById('detailTab');
  const initials = getInitials(email.fromName || email.from);
  const color    = getAvatarColor(email.from);
  const toList   = (email.to || []).join(', ') || '—';
  const dateStr  = email.date ? new Date(email.date).toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : email.dateFormatted || '';

  // Monta header (sem o body ainda)
  detail.innerHTML = `
    <div class="detail-header">
      <div class="detail-subject">${escHtml(email.subject)}</div>
      <div class="detail-from">
        <div class="avatar" style="background:${color}">${initials}</div>
        <div class="from-info">
          <div class="from-name">${escHtml(email.fromName || email.from)}</div>
          <div class="from-email">${escHtml(email.from)}</div>
        </div>
        ${email.importance === 'high' ? '<span style="font-size:11px;background:rgba(226,75,74,0.15);color:var(--danger);padding:3px 8px;border-radius:6px;font-weight:500;">⚡ Alta prioridade</span>' : ''}
      </div>
      <div class="detail-recipients">
        <span class="recipient-label">Para:</span> <span class="recipient-value">${escHtml(toList)}</span>
        ${email.cc?.length ? `<br/><span class="recipient-label">CC:</span> <span class="recipient-value">${escHtml(email.cc.join(', '))}</span>` : ''}
        <br/><span class="recipient-label">Data:</span> <span class="recipient-value">${dateStr}</span>
      </div>
      <div class="detail-actions">
        <button class="action-btn primary" onclick="summarizeSelected()">✨ Resumir com IA</button>
        <button class="action-btn" onclick="replyEmail()">↩️ Responder</button>
        <select class="move-select" onchange="moveSelected(this.value)">
          <option value="">Mover para...</option>
          <option>Trabalho</option><option>Financeiro</option>
          <option>Marketing</option><option>Pessoal</option><option>Outros</option>
        </select>
      </div>
    </div>
    <div class="ai-summary-box" id="aiSummaryBox" style="display:none">
      <div class="ai-summary-label">✨ Resumo IA</div>
      <div class="ai-summary-text" id="aiSummaryText">Gerando resumo...</div>
    </div>
    <div class="detail-divider"></div>
    <div id="attachmentsArea"></div>
    <div id="emailBodyArea" class="email-body-area"><div class="body-loading"><div class="spinner"></div> Carregando...</div></div>
  `;

  // Carrega corpo + anexos em paralelo
  renderEmailBody(email);
  if (email.hasAttachments && state.accessToken) loadAndRenderAttachments(email);
}

async function renderEmailBody(email) {
  const area = document.getElementById('emailBodyArea');
  if (!area) return;

  let html = email.bodyHtml || '';

  if (html) {
    // Resolve imagens inline CID → base64
    if (state.accessToken && email.hasAttachments) {
      html = await resolveCidImages(email.id, html);
    }

    // Sanitiza: remove scripts e on* mas preserva imagens e layout
    html = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, (match) => {
        // Preserva estilos mas remove referências a fontes externas problemáticas
        return match.replace(/@import[^;]+;/gi, '');
      })
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')  // remove event handlers
      .replace(/javascript:/gi, '');                    // remove js: em hrefs

    // Usa Shadow DOM para isolamento real — funciona em qualquer host
    area.innerHTML = '';
    const host = document.createElement('div');
    host.className = 'email-shadow-host';
    area.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.7;
          color: #e8e6f0;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        * { max-width: 100% !important; box-sizing: border-box; }
        img { height: auto !important; border-radius: 4px; }
        a { color: #7C6EFA; }
        table { border-collapse: collapse; width: auto; }
        td, th { padding: 4px 8px; vertical-align: top; }
        blockquote {
          border-left: 3px solid rgba(255,255,255,0.15);
          margin: 8px 0; padding: 4px 12px; color: #888;
        }
        pre, code {
          background: rgba(255,255,255,0.07); border-radius: 4px;
          padding: 2px 6px; font-size: 13px; white-space: pre-wrap;
        }
        p { margin: 0 0 10px; }
        h1,h2,h3,h4 { color: #e8e6f0; margin: 12px 0 6px; }
        /* E-mails com fundo branco forçado — torna transparente */
        [bgcolor] { background-color: transparent !important; }
        [style*="background:#fff"], [style*="background: #fff"],
        [style*="background:white"], [style*="background: white"],
        [style*="background:#ffffff"], [style*="background: #ffffff"] {
          background: transparent !important;
        }
        /* Força cor de texto para legibilidade no tema escuro */
        [style*="color:#000"], [style*="color: #000"],
        [style*="color:black"], [style*="color: black"],
        [style*="color:#333"], [style*="color: #333"],
        [style*="color:#1"], [style*="color:#2"], [style*="color:#3"], [style*="color:#4"] {
          color: #c8c6d8 !important;
        }
        /* &nbsp; excessivos — normaliza espaçamento */
        br + br { display: none; }
      </style>
      <div class="email-body-content">${html}</div>
    `;

  } else if (email.bodyText) {
    // Texto puro
    area.innerHTML = `<div class="detail-body">${formatText(email.bodyText)}</div>`;
  } else {
    area.innerHTML = `<div class="detail-body" style="color:var(--text3);font-style:italic">Sem conteúdo</div>`;
  }
}

async function resolveCidImages(emailId, html) {
  // Encontra todos os cid: em src
  const cidPattern = /src=["']cid:([^"']+)["']/gi;
  const cids = [...html.matchAll(cidPattern)].map(m => m[1]);
  if (!cids.length) return html;

  try {
    const attachments = await fetchAttachments(emailId);
    for (const att of attachments) {
      if (att['@odata.type'] === '#microsoft.graph.fileAttachment' && att.contentId) {
        const cidClean = att.contentId.replace(/[<>]/g, '');
        const dataUrl  = `data:${att.contentType};base64,${att.contentBytes}`;
        html = html.replace(new RegExp(`cid:${cidClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'), dataUrl);
      }
    }
  } catch {}
  return html;
}

async function loadAndRenderAttachments(email) {
  const area = document.getElementById('attachmentsArea');
  if (!area) return;

  const attachments = await fetchAttachments(email.id);
  if (!attachments.length) return;

  // Filtra só os reais (não inline CID)
  const realAttachments = attachments.filter(a =>
    a['@odata.type'] === '#microsoft.graph.fileAttachment' &&
    !a.isInline
  );
  if (!realAttachments.length) return;

  const items = realAttachments.map(a => {
    const sizeKb = a.size ? Math.round(a.size / 1024) : 0;
    const icon   = getAttachIcon(a.name);
    const dataUrl = a.contentBytes ? `data:${a.contentType};base64,${a.contentBytes}` : null;
    const isImg   = a.contentType?.startsWith('image/');

    return `
      <div class="attachment-item">
        <div class="attach-preview">
          ${isImg && dataUrl
            ? `<img src="${dataUrl}" class="attach-thumb" alt="${escHtml(a.name)}"/>`
            : `<span class="attach-file-icon">${icon}</span>`}
        </div>
        <div class="attach-info">
          <div class="attach-name">${escHtml(a.name)}</div>
          <div class="attach-size">${sizeKb > 0 ? sizeKb + ' KB' : ''}</div>
        </div>
        ${dataUrl ? `<a class="attach-download" href="${dataUrl}" download="${escHtml(a.name)}" title="Baixar">⬇</a>` : ''}
      </div>`;
  }).join('');

  area.innerHTML = `
    <div class="attachments-bar">
      <div class="attachments-label">📎 ${realAttachments.length} anexo${realAttachments.length > 1 ? 's' : ''}</div>
      <div class="attachments-list">${items}</div>
    </div>
    <div class="detail-divider"></div>
  `;
}

async function summarizeSelected() {
  if (!state.selectedEmail) return;
  document.getElementById('aiSummaryBox').style.display = 'block';
  document.getElementById('aiSummaryText').textContent  = 'Gerando resumo...';
  const summary = await summarizeEmail(state.selectedEmail);
  document.getElementById('aiSummaryText').textContent  = summary;
}

function moveSelected(folder) {
  if (!folder || !state.selectedEmail) return;
  const email   = state.selectedEmail;
  const tagMap  = { Financeiro: 'tag-finance', Trabalho: 'tag-work', Marketing: 'tag-marketing', Pessoal: 'tag-personal', Outros: '' };
  email.folder  = folder;
  email.tag     = tagMap[folder] || '';
  if (state.connected && state.accessToken) moveEmail(email.id, folder);
  renderEmailList();
  updateFolderCounts();
  showNotif('success', '✅', `E-mail movido para ${folder}`);
}

function replyEmail() {
  showNotif('success', '📧', 'Funcionalidade de resposta disponível via Outlook Web');
}

// ============================================================
// FILTERS
// ============================================================
function setFilter(filter, btn) {
  state.currentFilter = filter;
  state.currentFolder = null;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('panelTitle').textContent = 'Caixa de Entrada';
  applyFilters();
}

function filterByFolder(folder) {
  state.currentFolder = folder;
  state.currentFilter = 'all';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  document.getElementById('panelTitle').textContent = folder;
  applyFilters();
}

function filterEmails() { applyFilters(); }

function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  let emails   = [...state.emails];

  if (state.currentFolder) {
    emails = emails.filter(e => e.folder === state.currentFolder);
  } else if (state.currentFilter === 'unread') {
    emails = emails.filter(e => e.unread);
  } else if (['Trabalho', 'Financeiro', 'Marketing', 'Pessoal'].includes(state.currentFilter)) {
    emails = emails.filter(e => e.folder === state.currentFilter);
  }

  if (search) {
    emails = emails.filter(e =>
      e.subject.toLowerCase().includes(search) ||
      e.from.toLowerCase().includes(search)    ||
      e.preview.toLowerCase().includes(search) ||
      e.body.toLowerCase().includes(search)
    );
  }

  state.filteredEmails = emails;
  renderEmailList();
}

function updateFolderCounts() {
  ['Trabalho', 'Financeiro', 'Marketing', 'Pessoal', 'Outros'].forEach(f => {
    const el = document.getElementById('cnt-' + f);
    if (el) el.textContent = state.emails.filter(e => e.folder === f).length;
  });
}

function updateUnreadBadge() {
  document.getElementById('unreadBadge').textContent = state.emails.filter(e => e.unread).length;
}

// ============================================================
// RULES
// ============================================================
function renderRules() {
  const list         = document.getElementById('rulesList');
  const priorityLabel= { high: 'Alta', medium: 'Média', low: 'Baixa' };
  const priorityColor= { high: 'rgba(226,75,74,0.15)', medium: 'rgba(239,159,39,0.15)', low: 'rgba(29,158,117,0.15)' };
  const priorityText = { high: 'var(--danger)', medium: 'var(--warn)', low: 'var(--success)' };

  list.innerHTML = state.rules.map(r => `
    <div class="rule-card ${r.active ? 'active-rule' : ''}">
      <div class="rule-icon" style="background:${r.color || 'var(--surface)'}">${r.icon || '📋'}</div>
      <div class="rule-info">
        <div class="rule-name">${escHtml(r.name)}</div>
        <div class="rule-desc">
          Mover para: <strong>${r.folder}</strong> — Palavras: ${escHtml(r.criteria.substring(0, 60))}${r.criteria.length > 60 ? '...' : ''}
        </div>
        <div class="rule-actions">
          <span class="rule-tag" style="background:${priorityColor[r.priority]};color:${priorityText[r.priority]}">
            ${priorityLabel[r.priority] || 'Média'} prioridade
          </span>
          <button onclick="deleteRule('${r.id}')"
            style="background:none;border:none;color:var(--text3);font-size:12px;cursor:pointer;padding:0 4px;">
            🗑 Excluir
          </button>
        </div>
      </div>
      <label class="rule-toggle">
        <input type="checkbox" ${r.active ? 'checked' : ''} onchange="toggleRule('${r.id}', this.checked)"/>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `).join('');
}

function toggleRule(id, active) {
  const rule = state.rules.find(r => r.id === id);
  if (rule) { rule.active = active; saveRules(); }
}

function deleteRule(id) {
  state.rules = state.rules.filter(r => r.id !== id);
  saveRules();
  renderRules();
}

function saveRules() { localStorage.setItem('mailmind_rules', JSON.stringify(state.rules)); }

function openAddRule() { document.getElementById('ruleModal').classList.add('open'); }
function closeModal()  { document.getElementById('ruleModal').classList.remove('open'); }

function saveRule() {
  const name     = document.getElementById('ruleName').value.trim();
  const criteria = document.getElementById('ruleCriteria').value.trim();
  const folder   = document.getElementById('ruleFolder').value;
  const priority = document.getElementById('rulePriority').value;

  if (!name || !criteria) { showNotif('error', '❌', 'Preencha nome e critério da regra'); return; }

  const icons  = { Financeiro: '💰', Trabalho: '💼', Marketing: '📢', Pessoal: '👤', Outros: '📋' };
  const colors = { Financeiro: 'rgba(29,158,117,0.15)', Trabalho: 'rgba(124,110,250,0.15)', Marketing: 'rgba(239,159,39,0.15)', Pessoal: 'rgba(240,153,123,0.15)', Outros: 'rgba(136,135,128,0.15)' };

  state.rules.push({
    id: 'r' + Date.now(), name, criteria, folder, priority,
    active: true, icon: icons[folder] || '📋', color: colors[folder] || '',
  });
  saveRules();
  renderRules();
  closeModal();
  document.getElementById('ruleName').value     = '';
  document.getElementById('ruleCriteria').value = '';
  showNotif('success', '✅', 'Regra adicionada com sucesso!');
}

// ============================================================
// CONFIG
// ============================================================
function saveConfig() {
  const cfg = {
    claudeApiKey: document.getElementById('configApiKey').value.trim(),
    model:        document.getElementById('configModel').value,
    clientId:     document.getElementById('configClientId').value.trim(),
    tenantId:     document.getElementById('configTenantId').value.trim() || 'common',
    redirectUri:  document.getElementById('configRedirectUri').value.trim() || window.location.origin,
    autoClassify: document.getElementById('autoClassify').checked,
    batchSize:    parseInt(document.getElementById('configBatchSize').value) || 20,
  };
  localStorage.setItem('mailmind_config', JSON.stringify(cfg));
  state.config = cfg;
  showNotif('success', '✅', 'Configurações salvas!');
}

// ============================================================
// VIEW / TAB SWITCHING
// ============================================================
function switchView(view, btn) {
  state.currentView = view;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const emailPanel  = document.getElementById('emailPanel');
  const contentArea = document.getElementById('contentArea');
  const rulesPanel  = document.getElementById('rulesPanel');
  const configPanel = document.getElementById('configPanel');

  if (view === 'rules') {
    emailPanel.style.display  = 'none';
    contentArea.style.display = 'none';
    rulesPanel.style.display  = 'block';
    configPanel.style.display = 'none';
  } else if (view === 'config') {
    emailPanel.style.display  = 'none';
    contentArea.style.display = 'none';
    rulesPanel.style.display  = 'none';
    configPanel.style.display = 'block';
  } else {
    emailPanel.style.display  = 'flex';
    contentArea.style.display = 'flex';
    rulesPanel.style.display  = 'none';
    configPanel.style.display = 'none';
  }
}

function switchTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('detailTab').classList.toggle('active', tab === 'detail');
  document.getElementById('chatTab').classList.toggle('active', tab === 'chat');
}

// ============================================================
// STATUS BAR & NOTIFICATIONS
// ============================================================
function showStatus(text) {
  document.getElementById('statusText').textContent = text;
  document.getElementById('statusBar').classList.add('show');
}
function hideStatus() { document.getElementById('statusBar').classList.remove('show'); }

function showNotif(type, icon, text) {
  const n = document.getElementById('notification');
  document.getElementById('notifIcon').textContent = icon;
  document.getElementById('notifText').textContent  = text;
  n.className = `notification ${type} show`;
  setTimeout(() => n.classList.remove('show'), 4000);
}

// ============================================================
// UTILS
// ============================================================
function escHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatText(str) {
  return escHtml(str)
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Converte texto puro em HTML simples para o iframe
function wrapTextAsHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\n/g,'<br>');
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

function getAvatarColor(email) {
  const colors = ['#7C6EFA','#5DCAA5','#EF9F27','#F0997B','#E24B4A','#4AACE2','#B26EFA'];
  let hash = 0;
  for (let i = 0; i < (email || '').length; i++) hash = (hash * 31 + email.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatRelativeDate(iso) {
  if (!iso) return '';
  const now   = new Date();
  const date  = new Date(iso);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);

  if (diffMin < 1)  return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffH   < 24) return `${diffH}h`;
  if (diffD   === 1) return 'ontem';
  if (diffD   < 7)  return `${diffD}d`;

  // Mesma ano: dia/mês; caso contrário: dd/mm/aa
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('pt-BR', sameYear
    ? { day: '2-digit', month: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function getAttachIcon(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  const map  = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📊', pptx: '📊', zip: '🗜️', rar: '🗜️',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️',
    mp4: '🎬', mp3: '🎵', txt: '📃',
  };
  return map[ext] || '📎';
}

// ============================================================
// BOOTSTRAP
// ============================================================
init();
