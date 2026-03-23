// ============================================================
// MailMind — app.js (bundle único)
// Seções: UTILS | STATE | API | CONFIG | EMAIL | CHAT | INIT
// ============================================================

// ============================================================
// UTILS
// ============================================================
function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatText(str) {
  return escHtml(str).replace(/\n/g,'<br/>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>');
}
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s{2,}/g,' ').trim();
}
function wrapTextAsHtml(text) {
  if (!text) return '';
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0]+parts[parts.length-1][0]).toUpperCase() : name.substring(0,2).toUpperCase();
}
function getAvatarColor(email) {
  const colors = ['#7C6EFA','#5DCAA5','#EF9F27','#F0997B','#E24B4A','#4AACE2','#B26EFA'];
  let hash = 0;
  for (let i = 0; i < (email||'').length; i++) hash = (hash*31+email.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function formatRelativeDate(iso) {
  if (!iso) return '';
  const now=new Date(), date=new Date(iso), diffMs=now-date;
  const diffMin=Math.floor(diffMs/60000), diffH=Math.floor(diffMs/3600000), diffD=Math.floor(diffMs/86400000);
  if (diffMin<1)  return 'agora';
  if (diffMin<60) return diffMin+'min';
  if (diffH<24)   return diffH+'h';
  if (diffD===1)  return 'ontem';
  if (diffD<7)    return diffD+'d';
  const sameYear = date.getFullYear()===now.getFullYear();
  return date.toLocaleDateString('pt-BR', sameYear ? {day:'2-digit',month:'2-digit'} : {day:'2-digit',month:'2-digit',year:'2-digit'});
}
function getAttachIcon(filename) {
  const ext=(filename||'').split('.').pop().toLowerCase();
  const map={pdf:'📄',doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',ppt:'📊',pptx:'📊',zip:'🗜️',rar:'🗜️',jpg:'🖼️',jpeg:'🖼️',png:'🖼️',gif:'🖼️',webp:'🖼️',mp4:'🎬',mp3:'🎵',txt:'📃'};
  return map[ext]||'📎';
}
function showStatus(text) {
  document.getElementById('statusText').textContent=text;
  document.getElementById('statusBar').classList.add('show');
}
function hideStatus() { document.getElementById('statusBar').classList.remove('show'); }
function showNotif(type,icon,text) {
  const n=document.getElementById('notification');
  document.getElementById('notifIcon').textContent=icon;
  document.getElementById('notifText').textContent=text;
  n.className=`notification ${type} show`;
  setTimeout(()=>n.classList.remove('show'),4000);
}

// ============================================================
// STATE
// ============================================================
const state = {
  connected:false, accessToken:null, emails:[], filteredEmails:[],
  selectedEmail:null, currentFilter:'all', currentFolder:null,
  currentView:'emails', rules:[], config:{}, chatHistory:[],
  page: { current:1, nextLink:null, prevLinks:[], total:null, pageSize:50 },
  outlookFolders: [],
  useOutlookFolders: false,
  folderCache: {}, // Cache de IDs de pastas para performance
  fixedFolders: null,
};

const DEMO_EMAILS = [
  { id:'1', from:'joao.silva@empresa.com', fromName:'João Silva', subject:'Relatório Q1 2026 - Revisão necessária', preview:'Segue em anexo o relatório do primeiro trimestre...', bodyText:'Olá time,\n\nSegue o relatório Q1 2026 para revisão.\n\nPontos:\n- Faturamento abaixo 12%\n- Custo operacional +8%\n- Pipeline Q2 saudável\n\nAbraços, João', bodyHtml:null, date:'2026-03-20T09:45:00Z', dateFormatted:'20/03/2026 09:45', unread:true, folder:'Trabalho', tag:'tag-work', hasAttachments:true, importance:'high', to:['time@empresa.com'], cc:[] },
  { id:'2', from:'noreply@banco.com.br', fromName:'Banco Digital', subject:'Fatura do seu cartão - Vencimento 25/03', preview:'Sua fatura no valor de R$ 1.847,50 vence em 5 dias...', bodyText:'Prezado cliente,\n\nFatura disponível:\nValor: R$ 1.847,50\nVencimento: 25/03/2026\n\nBanco Digital', bodyHtml:null, date:'2026-03-20T08:30:00Z', dateFormatted:'20/03/2026 08:30', unread:true, folder:'Financeiro', tag:'tag-finance', hasAttachments:false, importance:'normal', to:['cliente@email.com'], cc:[] },
  { id:'3', from:'newsletter@techcrunch.com', fromName:'TechCrunch', subject:'As 10 maiores tendências de IA para 2026', preview:'Esta semana no TechCrunch: OpenAI, Google e as apostas...', bodyText:'Esta semana:\n1. OpenAI anuncia modelo multimodal\n2. Google investiu US$50bi em quantum\n3. Startups de IA levantaram US$120bi em Q1', bodyHtml:null, date:'2026-03-19T18:00:00Z', dateFormatted:'19/03/2026 18:00', unread:false, folder:'Marketing', tag:'tag-marketing', hasAttachments:false, importance:'normal', to:['sub@email.com'], cc:[] },
  { id:'4', from:'maria.santos@gmail.com', fromName:'Maria Santos', subject:'Almoço de aniversário - confirmação', preview:'Oi! Confirmando para sábado às 13h no restaurante...', bodyText:'Oi querido!\n\nConfirmando o almoço sábado 22/03 às 13h.\n\nBejo, Maria', bodyHtml:null, date:'2026-03-19T14:20:00Z', dateFormatted:'19/03/2026 14:20', unread:true, folder:'Pessoal', tag:'tag-personal', hasAttachments:false, importance:'normal', to:['voce@email.com'], cc:[] },
  { id:'5', from:'juridico@parceiro.com.br', fromName:'Escritório Jurídico', subject:'Contrato de prestação de serviços - minuta final', preview:'Conforme alinhado na reunião, segue a minuta final...', bodyText:'Prezados,\n\nSegue minuta final do contrato.\nPrazo: 23/03/2026\n\nDr. Carlos Mendes OAB/SP 123.456', bodyHtml:null, date:'2026-03-19T11:00:00Z', dateFormatted:'19/03/2026 11:00', unread:false, folder:'Trabalho', tag:'tag-work', hasAttachments:true, importance:'high', to:['empresa@email.com'], cc:[] },
  { id:'6', from:'promo@amazon.com.br', fromName:'Amazon', subject:'Suas ofertas de hoje - até 70% OFF em eletrônicos', preview:'Aproveite as melhores ofertas em smartphones, notebooks...', bodyText:'Ofertas:\niPhone 16 Pro R$7.499\nMacBook Air M3 R$9.999\nAirPods Pro R$1.299', bodyHtml:null, date:'2026-03-18T10:00:00Z', dateFormatted:'18/03/2026 10:00', unread:false, folder:'Marketing', tag:'tag-marketing', hasAttachments:false, importance:'normal', to:['cliente@email.com'], cc:[] },
  { id:'7', from:'rh@empresa.com', fromName:'RH - Empresa', subject:'Holerite Março 2026 disponível', preview:'Seu holerite de março está disponível no portal...', bodyText:'Prezado colaborador,\n\nHolerite Março/2026 disponível.\nAcesse: portal.empresa.com/holerite\nPagamento: 05/04/2026\n\nRH', bodyHtml:null, date:'2026-03-18T09:00:00Z', dateFormatted:'18/03/2026 09:00', unread:true, folder:'Trabalho', tag:'tag-work', hasAttachments:false, importance:'normal', to:['colaborador@empresa.com'], cc:[] },
];

const DEFAULT_RULES = [
  { id:'r1', name:'E-mails Financeiros',    criteria:'fatura, boleto, pagamento, NF, nota fiscal, cobrança, vencimento, extrato, pix, transferência', folder:'Financeiro', priority:'high',   active:true, icon:'💰', color:'rgba(29,158,117,0.15)' },
  { id:'r2', name:'Newsletters e Marketing',criteria:'newsletter, unsubscribe, promoção, oferta, desconto, campanha, marketing, promo',                folder:'Marketing',  priority:'medium', active:true, icon:'📢', color:'rgba(239,159,39,0.15)'  },
  { id:'r3', name:'E-mails Pessoais',       criteria:'aniversário, festa, almoço, jantar, fim de semana, pessoal, família, amigo',                    folder:'Pessoal',    priority:'low',    active:true, icon:'👤', color:'rgba(240,153,123,0.15)' },
  { id:'r4', name:'E-mails de Trabalho',    criteria:'reunião, projeto, relatório, proposta, cliente, contrato, prazo, entrega, sprint, deadline',    folder:'Trabalho',   priority:'high',   active:true, icon:'💼', color:'rgba(124,110,250,0.15)' },
];

// ============================================================
// CONFIG — localStorage helpers
// ============================================================
function loadConfig() {
  try { 
    const cfg = JSON.parse(localStorage.getItem('mailmind_config')||'{}');
    return cfg || {};
  } catch { return {}; }
}

// ============================================================
// SETUP WIZARD
// ============================================================
function showSetupStep(step) {
  [1,2,3,4].forEach(n => {
    document.getElementById('stepPanel'+n)?.classList.toggle('active', n===step);
    const dot=document.getElementById('dot'+n);
    if (dot) { dot.classList.toggle('active',n<=step); dot.classList.toggle('done',n<step); }
  });
  // Ajuste visual da barra de progresso para 4 passos
  const percentages = {1: '25%', 2: '50%', 3: '75%', 4: '100%'};
  document.getElementById('setupProgressFill').style.width = percentages[step];
}
function setupNext(currentStep) {
  if (currentStep===1) {
    const key=document.getElementById('claudeApiKey').value.trim();
    if (!key) { showNotif('error','❌','Insira uma chave válida'); return; }
    showSetupStep(2);
  } else if (currentStep===2) {
    const clientId=document.getElementById('msClientId').value.trim();
    if (!clientId) { showNotif('error','❌','Insira o Client ID do Azure'); return; }
    showSetupStep(3);
  } else if (currentStep===3) {
    const clientId=document.getElementById('msClientId').value.trim();
    const createNow = document.getElementById('setupCreateFoldersNow').checked;
    const autoClassify = document.getElementById('setupAutoClassify').checked;
    document.getElementById('setupSummary').innerHTML=`
      <div class="summary-row"><span>Chave Gemini</span><span>••••••••••••</span></div>
      <div class="summary-row"><span>Client ID</span><span>${escHtml(clientId.substring(0,8))}...</span></div>
      <div class="summary-row"><span>Auto-Classif.</span><span>${autoClassify ? 'Ativado' : 'Manual'}</span></div>
      <div class="summary-row"><span>Pastas</span><span>${createNow ? 'Criar Agora' : 'Sob Demanda'}</span></div>`;
    showSetupStep(4);
  }
}
function setupBack(currentStep) { showSetupStep(currentStep-1); }
function saveSetup() {
  const key=document.getElementById('claudeApiKey').value.trim();
  const clientId=document.getElementById('msClientId').value.trim();
  const tenantId=document.getElementById('msTenantId').value.trim()||'common';
  const createFoldersNow = document.getElementById('setupCreateFoldersNow').checked;
  const autoClassify = document.getElementById('setupAutoClassify').checked;

  if (!key) { showNotif('error','❌','Insira sua chave da API'); return; }
  
  const cfg={
    claudeApiKey:key,
    clientId,
    tenantId,
    redirectUri:window.location.origin,
    model:'gemini-2.5-flash',
    autoClassify: autoClassify,
    organizeInRoot: true, // Padrão forçado para manter a lógica MailMind > Subpastas
    createFoldersNow: createFoldersNow, // Flag temporária para o primeiro login
    batchSize:5, 
    useOutlookFolders:false
  };
  localStorage.setItem('mailmind_config',JSON.stringify(cfg));
  document.getElementById('setupScreen').classList.add('hidden');
  loadApp(cfg);
  showNotif('success','✅','Configuração salva! Bem-vindo ao MailMind.');
}

// ============================================================
// INIT & LOAD APP
// ============================================================
function init() {
  const cfg=loadConfig();
  if (!cfg.claudeApiKey) {
    showSetupStep(1);
    document.getElementById('setupScreen').classList.remove('hidden');
  } else {
    document.getElementById('setupScreen').classList.add('hidden');
    loadApp(cfg);
  }
}
function loadApp(cfg) {
  state.config = cfg;
  state.rules  = JSON.parse(localStorage.getItem('mailmind_rules')||'null') || DEFAULT_RULES;
  state.emails = DEMO_EMAILS;
  state.filteredEmails = [...state.emails];
  state.useOutlookFolders = cfg.useOutlookFolders === true;
  state.chatHistory = JSON.parse(localStorage.getItem('mailmind_chat_history') || '[]');

  // Renderiza pastas imediatamente (com botões ···)
  renderSidebarFolders();
  renderRules();
  renderEmailList();
  updateFolderCounts();
  updateUnreadBadge();
  renderChatHistory();

  // Restaura token do sessionStorage (sobrevive F5 e fechar/abrir aba)
  if (restoreToken()) {
    if (state.useOutlookFolders) loadOutlookFolders();
    fetchEmails().then(() => startPolling());
  }
}

// ============================================================
// CONFIG PANEL
// ============================================================
function populateConfigPanel() {
  let cfg={};
  try { cfg=JSON.parse(localStorage.getItem('mailmind_config')||'{}'); } catch {}
  if (!cfg.claudeApiKey && state.config?.claudeApiKey) cfg=state.config;
  const fields={configApiKey:cfg.claudeApiKey||'',configClientId:cfg.clientId||'',configTenantId:cfg.tenantId||'',configRedirectUri:cfg.redirectUri||window.location.origin,configBatchSize:cfg.batchSize||5};
  Object.entries(fields).forEach(([id,val])=>{ const el=document.getElementById(id); if(el) el.value=val; });
  const ac=document.getElementById('autoClassify'); if(ac) ac.checked=cfg.autoClassify!==false;
  const of=document.getElementById('useOutlookFolders'); if(of) of.checked=cfg.useOutlookFolders===true;
  const or=document.getElementById('organizeInRoot'); if(or) or.checked=cfg.organizeInRoot!==false;
}
function saveConfig() {
  const cfg={
    claudeApiKey:document.getElementById('configApiKey').value.trim(),
    model:'gemini-2.5-flash', // Modelo fixo
    clientId:document.getElementById('configClientId').value.trim(),
    tenantId:document.getElementById('configTenantId').value.trim()||'common',
    redirectUri:document.getElementById('configRedirectUri').value.trim()||window.location.origin,
    autoClassify:document.getElementById('autoClassify').checked,
    organizeInRoot:document.getElementById('organizeInRoot').checked,
    batchSize:parseInt(document.getElementById('configBatchSize').value)||20,
    useOutlookFolders:document.getElementById('useOutlookFolders')?.checked||false,
  };
  localStorage.setItem('mailmind_config',JSON.stringify(cfg));
  state.config=cfg;
  state.useOutlookFolders=cfg.useOutlookFolders;
  // Atualiza sidebar se conectado
  if (state.connected) {
    if (cfg.useOutlookFolders) loadOutlookFolders();
    else renderSidebarFolders();
  }
  showNotif('success','✅','Configurações salvas!');
}
function toggleVisibility(inputId,btn) {
  const input=document.getElementById(inputId);
  if(input.type==='password'){input.type='text';btn.textContent='🙈';}else{input.type='password';btn.textContent='👁';}
}
function resetConfig() {
  if(!confirm('Apagar todas as configurações e voltar ao setup? Continuar?')) return;
  stopPolling();
  localStorage.removeItem('mailmind_config');
  localStorage.removeItem('mailmind_rules');
  localStorage.removeItem('mm_token');
  localStorage.removeItem('mm_expires_at');
  localStorage.removeItem('mm_fixed_folders');
  sessionStorage.removeItem('mm_token');
  sessionStorage.removeItem('mm_expires_at');
  location.reload();
}

// ============================================================
// OUTLOOK AUTH
// ============================================================
function connectOutlook() {
  const cfg=loadConfig();
  if (!cfg.clientId) { showNotif('error','❌','Configure o Client ID do Azure primeiro'); switchView('config',null); return; }
  const scopes='openid profile email Mail.Read Mail.ReadWrite Mail.Send offline_access';
  const redirectUri=encodeURIComponent(cfg.redirectUri||window.location.origin);
  const tenantId=cfg.tenantId||'common';
  const authUrl=`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${cfg.clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scopes)}&response_mode=fragment`;
  const popup=window.open(authUrl,'outlook-auth','width=500,height=700,scrollbars=yes');
  const interval=setInterval(()=>{
    try {
      if(!popup||popup.closed){clearInterval(interval);return;}
      const hash=popup.location.hash;
      if(hash&&hash.includes('access_token')){
        clearInterval(interval); popup.close();
        const params=new URLSearchParams(hash.substring(1));
        const token=params.get('access_token'), expiry=params.get('expires_in');
        if(token) handleToken(token,expiry);
      }
    } catch {}
  },500);
}
function handleToken(token, expiresIn) {
  state.accessToken = token; state.connected = true;
  const expiresAt = Date.now() + ((parseInt(expiresIn) || 3600) * 1000);
  localStorage.setItem('mm_token', token);
  localStorage.setItem('mm_expires_at', String(expiresAt));
  document.getElementById('connectBtn').innerHTML = '✅ Conectado';
  document.getElementById('connectBtn').classList.add('connected');
  document.getElementById('connectStatus').textContent = 'Outlook conectado';
  showNotif('success','✅','Outlook conectado com sucesso!');
  const cfg = loadConfig();
  state.useOutlookFolders = cfg.useOutlookFolders === true;
  if (state.useOutlookFolders) loadOutlookFolders();
  
  // Verifica se deve criar a estrutura de pastas agora (primeiro acesso)
  if (cfg.createFoldersNow) ensureInitialFolderStructure();
  
  fetchEmails().then(() => startPolling());
  // Agenda renovação silenciosa 5 min antes de expirar
  scheduleTokenRenewal(expiresAt);
}

function scheduleTokenRenewal(expiresAt) {
  const msUntilRenew = (expiresAt - Date.now()) - (5 * 60 * 1000); // 5 min antes
  if (msUntilRenew <= 0) { silentRenewToken(); return; }
  setTimeout(silentRenewToken, msUntilRenew);
}

function silentRenewToken() {
  const cfg = loadConfig();
  if (!cfg.clientId) return;
  const redirectUri  = encodeURIComponent(cfg.redirectUri || window.location.origin);
  const tenantId     = cfg.tenantId || 'common';
  const scopes       = encodeURIComponent('openid profile email Mail.Read Mail.ReadWrite Mail.Send offline_access');
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
    + `?client_id=${cfg.clientId}&response_type=token&redirect_uri=${redirectUri}`
    + `&scope=${scopes}&response_mode=fragment&prompt=none`;

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      const hash = iframe.contentWindow.location.hash;
      const params = new URLSearchParams(hash.replace('#',''));
      const newToken = params.get('access_token');
      const expiresIn = params.get('expires_in');
      if (newToken) {
        state.accessToken = newToken;
        const expiresAt = Date.now() + ((parseInt(expiresIn) || 3600) * 1000);
        localStorage.setItem('mm_token', newToken);
        localStorage.setItem('mm_expires_at', String(expiresAt));
        scheduleTokenRenewal(expiresAt);
        console.log('Token renovado silenciosamente');
      }
    } catch(e) {
      // Sessão expirou — precisa reconectar
      console.warn('Renovação silenciosa falhou, usuário precisará reconectar');
    }
    document.body.removeChild(iframe);
  };

  setTimeout(() => { if (iframe.parentNode) document.body.removeChild(iframe); }, 10000);
}

function restoreToken() {
  const token     = localStorage.getItem('mm_token')     || sessionStorage.getItem('mm_token');
  const expiresAt = parseInt(localStorage.getItem('mm_expires_at') || sessionStorage.getItem('mm_expires_at') || '0');
  if (!token || Date.now() >= expiresAt) return false;
  state.accessToken = token; state.connected = true;
  localStorage.setItem('mm_token', token);
  localStorage.setItem('mm_expires_at', String(expiresAt));
  document.getElementById('connectBtn').innerHTML = '✅ Conectado';
  document.getElementById('connectBtn').classList.add('connected');
  document.getElementById('connectStatus').textContent = 'Outlook conectado';
  // Agenda renovação se necessário
  scheduleTokenRenewal(expiresAt);
  return true;
}

// ============================================================
// PASTAS DO OUTLOOK
// ============================================================
async function loadOutlookFolders() {
  if (!state.accessToken) return;
  try {
    const res = await fetch(
      'https://graph.microsoft.com/v1.0/me/mailFolders?$top=100&$select=id,displayName,unreadItemCount,totalItemCount&$orderby=displayName',
      { headers: { Authorization: `Bearer ${state.accessToken}` } }
    );
    if (!res.ok) return;
    const data = await res.json();
    state.outlookFolders = data.value || [];
    renderSidebarFolders();
  } catch(e) { console.warn('loadOutlookFolders:', e); }
}

function renderSidebarFolders() {
  const list = document.getElementById('folderList');
  if (!list) return;

  if (state.useOutlookFolders && state.outlookFolders.length) {
    // Pastas reais do Outlook com menu de contexto
    const colors = ['#7C6EFA','#5DCAA5','#EF9F27','#F0997B','#E24B4A','#4AACE2','#B26EFA'];
    list.innerHTML = state.outlookFolders.map((f, i) => `
      <div class="folder-item folder-item-outlook" data-folderid="${f.id}">
        <div class="folder-dot" style="background:${colors[i % colors.length]}"></div>
        <span class="folder-name" onclick="fetchEmailsByFolder('${f.id}','${escHtml(f.displayName)}')">${escHtml(f.displayName)}</span>
        <span class="folder-count">${f.unreadItemCount > 0 ? f.unreadItemCount : ''}</span>
        <button class="folder-menu-btn" onclick="event.stopPropagation();openFolderMenu('${f.id}','${escHtml(f.displayName)}',this)" title="Opções">•••</button>
      </div>`).join('') +
      `<div class="folder-new-btn" onclick="openNewFolderModal()">+ Nova pasta</div>`;
  } else {
    // Pastas fixas do MailMind — carrega do localStorage ou usa padrão
    if (!state.fixedFolders) {
      state.fixedFolders = JSON.parse(localStorage.getItem('mm_fixed_folders') || 'null') || [
        { name:'Trabalho',   color:'#7C6EFA' },
        { name:'Financeiro', color:'#5DCAA5' },
        { name:'Marketing',  color:'#EF9F27' },
        { name:'Pessoal',    color:'#F0997B' },
        { name:'Outros',     color:'#888780' },
      ];
    }
    list.innerHTML = state.fixedFolders.map(f => `
      <div class="folder-item folder-item-fixed" data-foldername="${escHtml(f.name)}">
        <div class="folder-dot" style="background:${f.color}"></div>
        <span class="folder-name" onclick="filterByFolder('${escHtml(f.name)}')">${escHtml(f.name)}</span>
        <span class="folder-count" id="cnt-${escHtml(f.name)}"></span>
        <button class="folder-menu-btn" onclick="event.stopPropagation();openFixedFolderMenu(event,'${escHtml(f.name)}')" title="Opções">•••</button>
      </div>`).join('') +
      `<div class="folder-new-btn" onclick="addFixedFolder()">+ Nova pasta</div>`;
    updateFolderCounts();
  }
}

async function fetchEmailsByFolder(folderId, folderName) {
  if (!state.accessToken) return;

  // Garante que estamos na view de emails
  if (state.currentView !== 'emails') switchView('emails', null);

  document.getElementById('panelTitle').textContent = folderName;
  state.currentFolder  = folderName;
  state.page.current   = 1;
  state.page.prevLinks = [];
  state.page.nextLink  = null;

  // Destaca a pasta selecionada
  document.querySelectorAll('.folder-item-outlook').forEach(el =>
    el.classList.toggle('active-folder', el.dataset.folderid === folderId)
  );

  showStatus(`Carregando ${folderName}...`);
  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/messages` +
      `?$top=50&$select=id,subject,from,toRecipients,ccRecipients,bodyPreview,body,receivedDateTime,isRead,hasAttachments,importance` +
      `&$orderby=receivedDateTime desc`,
      { headers: { Authorization: `Bearer ${state.accessToken}`, 'Prefer':'outlook.body-content-type="html"' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Marca todos os e-mails com o nome da pasta
    state.emails = data.value.map(m => ({ ...buildEmailObj(m), folder: folderName, tag: '' }));
    state.filteredEmails = [...state.emails];
    state.page.nextLink  = data['@odata.nextLink'] || null;

    renderEmailList(); updateUnreadBadge(); renderPagination(); hideStatus();
  } catch(e) { hideStatus(); showNotif('error','❌','Erro: '+e.message); }
}

function saveFixedFolders() {
  localStorage.setItem('mm_fixed_folders', JSON.stringify(state.fixedFolders));
}

function openFixedFolderMenu(event, name) {
  document.getElementById('folderCtxMenu')?.remove();
  const menu = document.createElement('div');
  menu.id = 'folderCtxMenu';
  menu.className = 'folder-ctx-menu';
  menu.innerHTML = `
    <div class="ctx-item" onclick="menu_shareFolder('${escHtml(name)}')">→ Compartilhar pasta</div>
    <div class="ctx-item" onclick="menu_renameFixed('${escHtml(name)}')">✏️ Renomear</div>
    <div class="ctx-item ctx-danger" onclick="deleteFixedFolder('${escHtml(name)}')">🗑 Excluir</div>`;
  const rect = event.currentTarget.getBoundingClientRect();
  menu.style.top  = (rect.bottom + 4) + 'px';
  menu.style.left = (rect.right - 160) + 'px';
  document.body.appendChild(menu);
  setTimeout(() => { document.addEventListener('click', () => menu.remove(), { once: true }); }, 50);
}
// Wrappers que fecham o menu antes de abrir modal (evita propagação cancelando o modal)
function menu_shareFolder(name, folderId) { document.getElementById('folderCtxMenu')?.remove(); document.getElementById('emailCtxMenu')?.remove(); setTimeout(() => openShareFolderModal(name, folderId||null), 10); }
function menu_renameFixed(name)  { document.getElementById('folderCtxMenu')?.remove(); setTimeout(() => renameFixedFolder(name), 10); }

function addFixedFolder() {
  const name = prompt('Nome da nova pasta:');
  if (!name?.trim()) return;
  const n = name.trim();
  if (state.fixedFolders.find(f => f.name === n)) { showNotif('error','❌','Já existe uma pasta com esse nome'); return; }
  const colors = ['#7C6EFA','#5DCAA5','#EF9F27','#F0997B','#E24B4A','#4AACE2','#B26EFA'];
  state.fixedFolders.push({ name: n, color: colors[state.fixedFolders.length % colors.length] });
  saveFixedFolders();
  renderSidebarFolders();
  showNotif('success','✅',`Pasta "${n}" criada!`);
}

function renameFixedFolder(oldName) {
  const newName = prompt('Novo nome:', oldName);
  if (!newName?.trim() || newName.trim() === oldName) return;
  const n = newName.trim();
  const f = state.fixedFolders.find(f => f.name === oldName);
  if (!f) return;
  // Atualiza e-mails com a pasta antiga
  state.emails.forEach(e => { if (e.folder === oldName) e.folder = n; });
  f.name = n;
  saveFixedFolders();
  renderSidebarFolders();
  renderEmailList();
  showNotif('success','✅',`Pasta renomeada para "${n}"!`);
}

function deleteFixedFolder(name) {
  if (!confirm(`Excluir a pasta "${name}"? Os e-mails serão movidos para "Outros".`)) return;
  state.fixedFolders = state.fixedFolders.filter(f => f.name !== name);
  // Move e-mails para Outros
  state.emails.forEach(e => { if (e.folder === name) { e.folder = 'Outros'; e.tag = ''; } });
  saveFixedFolders();
  renderSidebarFolders();
  renderEmailList();
  updateFolderCounts();
  showNotif('success','✅',`Pasta "${name}" excluída!`);
}
function openFolderMenu(folderId, folderName, btn) {
  document.getElementById('folderCtxMenu')?.remove();

  const menu = document.createElement('div');
  menu.id = 'folderCtxMenu';
  menu.className = 'folder-ctx-menu';
  menu.innerHTML = `
    <div class="ctx-item" onclick="menu_shareFolder('${escHtml(folderName)}','${folderId}')">→ Compartilhar pasta</div>
    <div class="ctx-item" onclick="menu_renameOutlook('${folderId}','${escHtml(folderName)}')">✏️ Renomear</div>
    <div class="ctx-item ctx-danger" onclick="confirmDeleteFolder('${folderId}','${escHtml(folderName)}')">🗑 Excluir pasta</div>`;

  const rect = btn.getBoundingClientRect();
  menu.style.top  = rect.bottom + 4 + 'px';
  menu.style.left = rect.left   + 'px';
  document.body.appendChild(menu);

  setTimeout(() => {
    document.addEventListener('click', () => menu.remove(), { once: true });
  }, 50);
}
function menu_renameOutlook(id, name) { document.getElementById('folderCtxMenu')?.remove(); setTimeout(() => openRenameFolderModal(id, name), 10); }

function openNewFolderModal() {
  const name = prompt('Nome da nova pasta:');
  if (!name?.trim()) return;
  createOutlookFolder(name.trim());
}

async function createOutlookFolder(name) {
  if (!state.accessToken) return;
  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ displayName: name }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showNotif('success','✅',`Pasta "${name}" criada!`);
    await loadOutlookFolders();
  } catch(e) { showNotif('error','❌','Erro ao criar pasta: '+e.message); }
}

function openRenameFolderModal(folderId, currentName) {
  const name = prompt('Novo nome da pasta:', currentName);
  if (!name?.trim() || name.trim() === currentName) return;
  renameOutlookFolder(folderId, name.trim());
}

async function renameOutlookFolder(folderId, newName) {
  if (!state.accessToken) return;
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ displayName: newName }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showNotif('success','✅',`Pasta renomeada para "${newName}"!`);
    await loadOutlookFolders();
  } catch(e) { showNotif('error','❌','Erro ao renomear: '+e.message); }
}

async function confirmDeleteFolder(folderId, folderName) {
  if (!confirm(`Excluir a pasta "${folderName}" e todos os e-mails dentro dela?`)) return;
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${state.accessToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showNotif('success','✅',`Pasta "${folderName}" excluída!`);
    await loadOutlookFolders();
  } catch(e) { showNotif('error','❌','Erro ao excluir pasta: '+e.message); }
}

function buildFolderOptions() {
  if (state.useOutlookFolders && state.outlookFolders.length) {
    return state.outlookFolders
      .map(f => `<option value="${f.id}" data-name="${escHtml(f.displayName)}">${escHtml(f.displayName)}</option>`)
      .join('');
  }
  // Usa pastas fixas dinâmicas (inclui pastas criadas pelo usuário)
  const folders = state.fixedFolders || [
    {name:'Trabalho'},{name:'Financeiro'},{name:'Marketing'},{name:'Pessoal'},{name:'Outros'}
  ];
  return folders.map(f => `<option value="${escHtml(f.name)}">${escHtml(f.name)}</option>`).join('');
}

async function moveSelectedToFolder(val) {
  if (!val || !state.selectedEmail) return;
  const email = state.selectedEmail;

  if (state.useOutlookFolders) {
    // val é o folderId — pega o nome do option selecionado
    const sel = document.querySelector('.move-select');
    const opt = sel?.querySelector(`option[value="${val}"]`);
    const name = opt?.dataset.name || val;
    email.folder = name;
    if (state.connected && state.accessToken) {
      try {
        await fetch(`https://graph.microsoft.com/v1.0/me/messages/${email.id}/move`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ destinationId: val }),
        });
      } catch(e) { showNotif('error','❌','Erro ao mover: '+e.message); return; }
    }
    showNotif('success','✅',`E-mail movido para ${name}`);
    // Remove da lista atual (estamos dentro de uma pasta específica)
    state.emails = state.emails.filter(e => e.id !== email.id);
    state.filteredEmails = state.filteredEmails.filter(e => e.id !== email.id);
    state.selectedEmail = null;
    renderEmailList();
    document.getElementById('detailTab').innerHTML=`
      <div style="display:flex;align-items:center;justify-content:center;height:200px;flex-direction:column;gap:12px;">
        <div style="font-size:48px;opacity:0.2">📭</div>
        <div style="color:var(--text3);font-size:14px">Selecione um e-mail para visualizar</div>
      </div>`;
  } else {
    moveSelected(val);
  }
}


function toggleRuleActionTarget(val) {
  const grp = document.getElementById('ruleActionTargetGroup');
  if (grp) grp.style.display = val === 'forward' ? 'block' : 'none';
}

// Executa a ação automática configurada na regra após classificar
async function executeRuleAction(email, rule) {
  if (!rule.action || rule.action === 'none') return;
  try {
    if (rule.action === 'forward' && rule.actionTarget) {
      await sendForward(email.id, rule.actionTarget, '');
    } else if (rule.action === 'delete') {
      await deleteEmail(email.id);
      state.emails = state.emails.filter(e => e.id !== email.id);
      state.filteredEmails = state.filteredEmails.filter(e => e.id !== email.id);
    } else if (rule.action === 'markRead') {
      await markAsRead(email.id);
      email.unread = false;
    }
  } catch(e) { console.warn('executeRuleAction:', e); }
}

// ============================================================
// COMPARTILHAR PASTA
// ============================================================
let _shareFolderTarget = null; // { name, emails[] }

function openShareFolderModal(folderName, folderId) {
  // Busca e-mails já carregados no state com essa pasta
  const emails = state.emails.filter(e => e.folder === folderName);

  // Se for pasta do Outlook, também guarda o folderId para buscar via API se necessário
  _shareFolderTarget = { name: folderName, folderId: folderId || null, emails };

  const count = folderId
    ? (emails.length > 0 ? emails.length : '?') // do Outlook: pode ter mais que os carregados
    : emails.length;

  document.getElementById('shareFolderSub').textContent =
    `Encaminhar e-mails da pasta "${folderName}" para um destinatário.`;
  document.getElementById('shareFolderInfo').innerHTML =
    emails.length === 0 && !folderId
      ? '<div class="share-empty">Nenhum e-mail nesta pasta no momento.</div>'
      : emails.length > 0
        ? `<div class="share-preview">${emails.slice(0,3).map(e=>`<div class="share-item">📧 ${escHtml(e.subject)}</div>`).join('')}${emails.length>3?`<div class="share-more">...e mais ${emails.length-3} e-mails</div>`:''}</div>`
        : '<div class="share-empty">Os e-mails serão buscados da pasta ao encaminhar.</div>';

  document.getElementById('shareFolderEmail').value = '';
  document.getElementById('shareFolderMessage').value = '';
  document.getElementById('shareFolderModal').classList.add('open');
}

async function submitShareFolder() {
  const to  = document.getElementById('shareFolderEmail').value.trim();
  const msg = document.getElementById('shareFolderMessage').value.trim();
  if (!to) { showNotif('error','❌','Informe o destinatário'); return; }
  if (!state.accessToken) { showNotif('error','❌','Conecte o Outlook primeiro'); return; }

  const btn = document.getElementById('shareFolderBtn');
  btn.textContent = 'Encaminhando...'; btn.disabled = true;

  // Usa os e-mails já carregados em state (suficiente para pastas fixas)
  // Para pastas do Outlook, usa o folderId se disponível
  let emails = _shareFolderTarget?.emails || [];

  // Se não tiver nenhum e-mail carregado, tenta buscar pelo folderId
  if (emails.length === 0 && _shareFolderTarget?.folderId && state.accessToken) {
    try {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/me/mailFolders/${_shareFolderTarget.folderId}/messages?$top=50&$select=id,subject`,
        { headers: { Authorization: `Bearer ${state.accessToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        emails = data.value || [];
      }
    } catch {}
  }

  if (!emails.length) {
    btn.textContent = 'Encaminhar'; btn.disabled = false;
    showNotif('error','❌','Nenhum e-mail encontrado nesta pasta');
    return;
  }

  // Atualiza preview com total real
  document.getElementById('shareFolderSub').textContent =
    `Encaminhando ${emails.length} e-mail(s) para ${to}...`;

  let ok = 0, fail = 0;
  const comment = msg || `E-mails encaminhados da pasta "${_shareFolderTarget.name}"`;

  for (const email of emails) {
    try {
      await sendForward(email.id, to, comment);
      ok++;
    } catch(e) {
      console.warn('Erro ao encaminhar:', email.id, e);
      fail++;
    }
  }

  btn.textContent = 'Encaminhar'; btn.disabled = false;
  document.getElementById('shareFolderModal').classList.remove('open');

  if (fail === 0) showNotif('success','✅',`${ok} e-mail(s) encaminhado(s) para ${to}!`);
  else showNotif('error','❌',`${ok} enviado(s), ${fail} com erro.`);
}
// ============================================================
async function sendReply(emailId, comment, toAll) {
  const endpoint = toAll ? 'replyAll' : 'reply';
  await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/${endpoint}`, {
    method:'POST',
    headers:{Authorization:`Bearer ${state.accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({ comment }),
  });
}
async function sendForward(emailId, toAddress, bodyHtml) {
  await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/forward`, {
    method:'POST',
    headers:{Authorization:`Bearer ${state.accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({toRecipients:[{emailAddress:{address:toAddress}}],comment:bodyHtml}),
  });
}
async function deleteEmail(emailId) {
  await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`,{
    method:'DELETE', headers:{Authorization:`Bearer ${state.accessToken}`},
  });
}

// ============================================================
// COMPOSER — responder / encaminhar
// ============================================================
function openComposer(mode) {
  const email = state.selectedEmail; if (!email) return;
  document.getElementById('composerPanel')?.remove();

  const toVal      = mode==='forward' ? '' : email.from;
  const subjectVal = (mode==='forward'?'Enc: ':'Re: ') + email.subject;

  const panel = document.createElement('div');
  panel.id='composerPanel'; panel.className='composer-panel';
  panel.innerHTML=`
    <div class="composer-header">
      <span class="composer-title">${mode==='forward'?'Encaminhar':mode==='replyAll'?'Responder a todos':'Responder'}</span>
      <button class="composer-close" onclick="document.getElementById('composerPanel').remove()">✕</button>
    </div>
    <div class="composer-fields">
      <div class="composer-field"><label>Para</label>
        <input id="composerTo" type="text" value="${escHtml(toVal)}" placeholder="destinatario@email.com"/></div>
      <div class="composer-field"><label>Assunto</label>
        <input id="composerSubject" type="text" value="${escHtml(subjectVal)}" readonly/></div>
    </div>
    <textarea class="composer-body" id="composerBody" placeholder="Escreva sua mensagem aqui..."></textarea>
    <div class="composer-footer">
      <button class="action-btn" onclick="document.getElementById('composerPanel').remove()">Cancelar</button>
      <button class="action-btn primary" id="composerSendBtn" onclick="submitComposer('${mode}','${email.id}')">
        ${mode==='forward'?'Encaminhar':'Enviar'}
      </button>
    </div>`;
  document.getElementById('detailTab').appendChild(panel);
  document.getElementById('composerBody').focus();
}

async function submitComposer(mode, id) {
  if(!state.accessToken) return;
  const to   = document.getElementById('composerTo')?.value.trim();
  const text = document.getElementById('composerBody')?.value.trim()||'';
  if(mode==='forward'&&!to){showNotif('error','❌','Informe o destinatário');return;}
  if(!text){showNotif('error','❌','Escreva uma mensagem');return;}

  const btn=document.getElementById('composerSendBtn');
  if(btn){btn.textContent='Enviando...';btn.disabled=true;}
  try {
    if(mode==='forward') await sendForward(id, to, text);
    else await sendReply(id, text, mode==='replyAll');
    document.getElementById('composerPanel')?.remove();
    showNotif('success','✅','Mensagem enviada!');
  } catch(e){
    showNotif('error','❌','Erro ao enviar: '+e.message);
    if(btn){btn.textContent=mode==='forward'?'Encaminhar':'Enviar';btn.disabled=false;}
  }
}

async function deleteSelected() {
  const email=state.selectedEmail; if(!email) return;
  if(!confirm(`Mover "${email.subject}" para a lixeira?`)) return;
  if(state.connected&&state.accessToken){
    try { await deleteEmail(email.id); } catch(e){showNotif('error','❌','Erro: '+e.message);return;}
  }
  state.emails=state.emails.filter(e=>e.id!==email.id);
  state.filteredEmails=state.filteredEmails.filter(e=>e.id!==email.id);
  state.selectedEmail=null;
  document.getElementById('detailTab').innerHTML=`
    <div style="display:flex;align-items:center;justify-content:center;height:200px;flex-direction:column;gap:12px;">
      <div style="font-size:48px;opacity:0.2">🗑</div>
      <div style="color:var(--text3);font-size:14px">E-mail movido para a lixeira</div>
    </div>`;
  renderEmailList(); updateFolderCounts(); updateUnreadBadge();
  showNotif('success','✅','E-mail movido para a lixeira');
}

function buildEmailObj(m) {
  const isHtml=(m.body?.contentType||'').toLowerCase()==='html';
  return {
    id:m.id, from:m.from?.emailAddress?.address||'', fromName:m.from?.emailAddress?.name||'',
    to:(m.toRecipients||[]).map(r=>r.emailAddress?.address).filter(Boolean),
    cc:(m.ccRecipients||[]).map(r=>r.emailAddress?.address).filter(Boolean),
    subject:m.subject||'(sem assunto)', preview:m.bodyPreview||'',
    bodyHtml:isHtml?m.body.content:wrapTextAsHtml(m.body?.content||''),
    bodyText:stripHtml(m.body?.content||''),
    date:m.receivedDateTime, dateFormatted:formatDate(m.receivedDateTime),
    unread:!m.isRead, hasAttachments:m.hasAttachments||false,
    importance:m.importance||'normal', folder:'Outros', tag:'', attachments:null,
  };
}

const PAGE_SIZE = 50;
// Pastas especiais do Outlook: sentitems, deleteditems, inbox
const SPECIAL_FOLDER_NAMES = {
  sentitems:    'Enviados',
  deleteditems: 'Excluídos',
  inbox:        'Caixa de Entrada',
};

async function loadSpecialFolder(folderKey) {
  // null = voltar para caixa de entrada padrão
  if (!folderKey) {
    document.getElementById('panelTitle').textContent = 'Caixa de Entrada';
    state.currentFolder = null; state.currentFilter = 'all';
    state.page.current = 1; state.page.prevLinks = []; state.page.nextLink = null;
    document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('active-folder'));
    if (state.accessToken) fetchEmails();
    return;
  }

  if (!state.accessToken) { showNotif('error','❌','Conecte o Outlook primeiro'); return; }

  const name = SPECIAL_FOLDER_NAMES[folderKey] || folderKey;
  document.getElementById('panelTitle').textContent = name;
  state.currentFolder = name;
  state.page.current = 1; state.page.prevLinks = []; state.page.nextLink = null;
  document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('active-folder'));

  showStatus(`Carregando ${name}...`);
  try {
    const url = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderKey}/messages`
      + `?$top=50&$select=id,subject,from,toRecipients,ccRecipients,bodyPreview,body,receivedDateTime,isRead,hasAttachments,importance`
      + `&$orderby=receivedDateTime desc`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${state.accessToken}`, 'Prefer':'outlook.body-content-type="html"' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.emails = data.value.map(m => ({ ...buildEmailObj(m), folder: name }));
    state.filteredEmails = [...state.emails];
    state.page.nextLink = data['@odata.nextLink'] || null;
    renderEmailList(); updateUnreadBadge(); renderPagination(); hideStatus();
    showNotif('success','✅', `${state.emails.length} e-mails em ${name}`);
  } catch(e) { hideStatus(); showNotif('error','❌','Erro: '+e.message); }
}

const BASE_URL  = 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages'
  + `?$top=${PAGE_SIZE}`
  + '&$select=id,subject,from,toRecipients,ccRecipients,bodyPreview,body,receivedDateTime,isRead,hasAttachments,importance'
  + '&$orderby=receivedDateTime desc';

async function fetchEmails(url) {
  if(!state.accessToken){showNotif('error','❌','Conecte sua conta Outlook primeiro');return;}
  showStatus('Carregando e-mails...');
  try {
    const res=await fetch(url||BASE_URL, {
      headers:{
        Authorization:`Bearer ${state.accessToken}`,
        'Content-Type':'application/json',
        'Prefer':'outlook.body-content-type="html"',
      }
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json();

    state.emails         = data.value.map(buildEmailObj);
    state.filteredEmails = [...state.emails];
    state.page.nextLink  = data['@odata.nextLink'] || null;

    // Busca total de não lidos (apenas na primeira página)
    if (!url) {
      state.page.current   = 1;
      state.page.prevLinks = [];
      fetchUnreadCount();
    }

    renderEmailList();
    updateFolderCounts();
    updateUnreadBadge();
    renderPagination();
    hideStatus();
    showNotif('success','✅',`${state.emails.length} e-mails carregados — página ${state.page.current}`);
    // Classificação automática removida conforme solicitado
  } catch(e) { hideStatus(); showNotif('error','❌','Erro ao carregar e-mails: '+e.message); }
}

async function fetchUnreadCount() {
  try {
    const res=await fetch(
      'https://graph.microsoft.com/v1.0/me/messages/$count?$filter=isRead eq false',
      {headers:{Authorization:`Bearer ${state.accessToken}`, ConsistencyLevel:'eventual'}}
    );
    if(res.ok) {
      state.page.total=parseInt(await res.text())||null;
      renderPagination();
    }
  } catch {}
}

function goNextPage() {
  if(!state.page.nextLink) return;
  // Salva URL atual para poder voltar
  const currentUrl = state.page.current===1
    ? null
    : state.page.prevLinks[state.page.prevLinks.length-1]?._current;

  state.page.prevLinks.push({ url: state.page.nextLink, _current: BASE_URL });
  state.page.current++;
  fetchEmails(state.page.nextLink);
  document.getElementById('emailList').scrollTop=0;
}

function goPrevPage() {
  if(state.page.current<=1) return;
  state.page.prevLinks.pop();
  state.page.current--;
  const prevUrl = state.page.prevLinks.length>0
    ? state.page.prevLinks[state.page.prevLinks.length-1].url
    : null;
  fetchEmails(prevUrl); // null = primeira página
  document.getElementById('emailList').scrollTop=0;
}

function renderPagination() {
  const bar=document.getElementById('paginationBar');
  if(!bar) return;

  const hasPrev = state.page.current > 1;
  const hasNext = !!state.page.nextLink;
  const totalTxt = state.page.total ? ` de ~${state.page.total.toLocaleString('pt-BR')}` : '';

  bar.innerHTML=`
    <div class="pagination-info">Página ${state.page.current}${totalTxt}</div>
    <div class="pagination-btns">
      <button class="page-btn" onclick="goPrevPage()" ${hasPrev?'':'disabled'}>← Anterior</button>
      <button class="page-btn" onclick="goNextPage()" ${hasNext?'':'disabled'}>Próxima →</button>
    </div>`;
}
async function fetchAttachments(emailId) {
  if(!state.accessToken) return [];
  try {
    const res=await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/attachments`,{headers:{Authorization:`Bearer ${state.accessToken}`}});
    if(!res.ok) return [];
    return (await res.json()).value||[];
  } catch { return []; }
}

// ============================================================
// GERENCIAMENTO INTELIGENTE DE PASTAS
// ============================================================
async function ensureInitialFolderStructure() {
  const cfg = loadConfig();
  if (!cfg.createFoldersNow) return;
  
  showStatus('Criando estrutura de pastas no Outlook...');
  const defaultCategories = ['Financeiro', 'Trabalho', 'Marketing', 'Pessoal', 'Outros'];
  
  try {
    // Cria/Busca a raiz e as subpastas
    for (const cat of defaultCategories) {
      await getTargetFolderId(cat);
    }
    showNotif('success', '✅', 'Estrutura "MailMind" criada com sucesso!');
    
    // Remove a flag para não rodar novamente em recargas futuras
    cfg.createFoldersNow = false;
    localStorage.setItem('mailmind_config', JSON.stringify(cfg));
  } catch (e) {
    console.error('Erro ao criar estrutura inicial:', e);
    showNotif('error', '❌', 'Erro ao criar pastas iniciais');
  } finally {
    hideStatus();
  }
}

async function getTargetFolderId(folderName) {
  const cfg = loadConfig();
  // Se a configuração 'organizeInRoot' for true (padrão), usamos a estrutura MailMind > Pasta
  // Se for false, criamos a pasta direto na raiz
  const useHierarchy = cfg.organizeInRoot !== false; 

  // Chave de cache para evitar chamadas repetidas
  const cacheKey = useHierarchy ? `ROOT_SUB_${folderName}` : `FLAT_${folderName}`;
  if (state.folderCache[cacheKey]) return state.folderCache[cacheKey];

  try {
    let parentId = null; // null = raiz do outlook

    // 1. Se usar hierarquia, garante a pasta pai "MailMind"
    if (useHierarchy) {
      let rootId = state.folderCache['ROOT_MAILMIND'];
      if (!rootId) {
        // Busca pasta MailMind
        const resRoot = await fetch("https://graph.microsoft.com/v1.0/me/mailFolders?$filter=displayName eq 'MailMind'", {headers:{Authorization:`Bearer ${state.accessToken}`}});
        const dataRoot = await resRoot.json();
        if (dataRoot.value && dataRoot.value.length > 0) {
          rootId = dataRoot.value[0].id;
        } else {
          // Cria pasta MailMind
          const createRoot = await fetch("https://graph.microsoft.com/v1.0/me/mailFolders", {
            method:'POST', headers:{Authorization:`Bearer ${state.accessToken}`,'Content-Type':'application/json'},
            body:JSON.stringify({displayName:'MailMind'})
          });
          rootId = (await createRoot.json()).id;
        }
        state.folderCache['ROOT_MAILMIND'] = rootId;
      }
      parentId = rootId;
    }

    // 2. Busca ou Cria a pasta de destino (dentro do pai ou na raiz)
    const urlList = parentId 
      ? `https://graph.microsoft.com/v1.0/me/mailFolders/${parentId}/childFolders`
      : `https://graph.microsoft.com/v1.0/me/mailFolders`;
    
    const resList = await fetch(urlList, {headers:{Authorization:`Bearer ${state.accessToken}`}});
    const dataList = await resList.json();
    
    let target = (dataList.value || []).find(f => f.displayName.toLowerCase() === folderName.toLowerCase());
    
    if (!target) {
      const createRes = await fetch(urlList, {
        method:'POST', headers:{Authorization:`Bearer ${state.accessToken}`,'Content-Type':'application/json'},
        body:JSON.stringify({displayName:folderName})
      });
      target = await createRes.json();
    }

    state.folderCache[cacheKey] = target.id;
    return target.id;
  } catch (e) {
    console.error('Erro ao resolver pasta:', e);
    throw e;
  }
}

async function moveEmail(emailId,folderName) {
  if(!state.accessToken) return;
  try {
    const destinationId = await getTargetFolderId(folderName);
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/move`,{method:'POST',headers:{Authorization:`Bearer ${state.accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({destinationId:destinationId})});
  } catch(e){console.error('Erro ao mover:',e);}
}

// ============================================================
// GEMINI API
// ============================================================
async function geminiApi(contents, systemInstruction=null) {
  const cfg = loadConfig();
  const model = cfg.model || 'gemini-2.5-flash';
  
  const apiKey = cfg.claudeApiKey;
  if (!apiKey) throw new Error('API Key não configurada');

  // Monta a URL direta do Google
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const body = { contents };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error?.message || `Erro API Google: ${res.status}`);
  }
  
  return data;
}

// ============================================================
// TESTE DE CONEXÃO GEMINI
// ============================================================
async function testGeminiConnection() {
  showStatus('Testando conexão com a API do Gemini...');
  
  // Pega os valores diretamente dos campos de configuração para o teste
  const apiKey = document.getElementById('configApiKey')?.value.trim();
  const model = document.getElementById('configModel')?.value || 'gemini-2.5-flash';

  if (!apiKey) {
    hideStatus();
    showNotif('error', '❌', 'Insira a chave da API do Gemini no campo acima para testar.');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ role: 'user', parts: [{ text: 'Olá! Responda apenas "OK" se estiver funcionando.' }] }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error?.message || `Erro HTTP: ${response.status}`);

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Resposta vazia';
    hideStatus();
    showNotif('success', '✅', `Conexão OK! Resposta da IA: "${reply.trim()}"`);
  } catch (error) {
    hideStatus();
    showNotif('error', '❌', `Falha na conexão: ${error.message}`);
  }
}
// ============================================================
// AI — CLASSIFY & SUMMARIZE
// ============================================================
async function classifyAllEmails() {
  const cfg=loadConfig();
  if(!cfg.claudeApiKey){showNotif('error','❌','Configure a chave da API');return;}

  const toProcess=state.emails.slice(0,cfg.batchSize||5);
  const tagMap={Financeiro:'tag-finance',Trabalho:'tag-work',Marketing:'tag-marketing',Pessoal:'tag-personal',Outros:''};

  const btn = document.querySelector('.classify-btn');
  const originalText = btn?.textContent;

  for(let i=0;i<toProcess.length;i++){
    const email=toProcess[i];
    try {
        if (btn) btn.textContent = `Classificando ${i+1}/${toProcess.length}...`;
        showStatus(`Classificando e-mail ${i+1}/${toProcess.length}...`);
        const folder=await classifyEmail(email);
        email.folder=folder; email.tag=tagMap[folder]||'';
        if(state.connected&&state.accessToken){
        await moveEmail(email.id, folder);
        // Executa ação automática da regra correspondente
        const rule = state.rules.find(r => r.active && r.folder === folder && r.action && r.action !== 'none');
        if (rule) await executeRuleAction(email, rule);
        }
        // Remove o e-mail da lista local para não reaparecer
        state.emails = state.emails.filter(e => e.id !== email.id);
        state.filteredEmails = state.filteredEmails.filter(e => e.id !== email.id);
        // Delay para respeitar limite da API gratuita (Rate Limit)
        await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
        console.error(`Erro ao classificar email ${i+1}:`, e);
        // Não interrompe o loop, apenas segue para o próximo
    }
    renderEmailList();
  }

  state.filteredEmails=[...state.emails];
  renderEmailList(); updateFolderCounts(); hideStatus();
  if (btn) btn.textContent = originalText;
  showNotif('success','✅',`${toProcess.length} e-mails classificados!`);
}

// Função auxiliar para classificar um lote específico de e-mails (usado no auto-classify)
async function classifyBatch(emailsToProcess) {
  const tagMap={Financeiro:'tag-finance',Trabalho:'tag-work',Marketing:'tag-marketing',Pessoal:'tag-personal',Outros:''};
  showStatus(`Auto-classificando ${emailsToProcess.length} novo(s) e-mail(s)...`);
  
  for(const email of emailsToProcess) {
    try {
      const folder = await classifyEmail(email);
      email.folder = folder; 
      email.tag = tagMap[folder]||'';
      
      if(state.connected && state.accessToken) {
        await moveEmail(email.id, folder);
        // Executa regra associada
        const rule = state.rules.find(r => r.active && r.folder === folder && r.action && r.action !== 'none');
        if (rule) await executeRuleAction(email, rule);
      }

      // Remove da lista visual local pois foi movido para pasta
      state.emails = state.emails.filter(e => e.id !== email.id);
      state.filteredEmails = state.filteredEmails.filter(e => e.id !== email.id);
      
      // Delay API
      await new Promise(r => setTimeout(r, 1500));
    } catch(e) { console.error('Erro auto-classify:', e); }
  }
  renderEmailList();
  hideStatus();
}

async function classifySelected() {
  const email = state.selectedEmail; if (!email) return;
  const cfg = loadConfig();
  if (!cfg.claudeApiKey) { showNotif('error','❌','Configure a chave da API'); return; }
  showStatus('Classificando e-mail...');
  const tagMap={Financeiro:'tag-finance',Trabalho:'tag-work',Marketing:'tag-marketing',Pessoal:'tag-personal',Outros:''};
  const folder = await classifyEmail(email);
  email.folder = folder; email.tag = tagMap[folder]||'';
  if (state.connected && state.accessToken) {
    await moveEmail(email.id, folder);
    const rule = state.rules.find(r => r.active && r.folder === folder && r.action && r.action !== 'none');
    if (rule) await executeRuleAction(email, rule);
    // Remove o e-mail da lista local
    state.emails = state.emails.filter(e => e.id !== email.id);
    state.filteredEmails = state.filteredEmails.filter(e => e.id !== email.id);
  }
  renderEmailList(); updateFolderCounts(); hideStatus();
  showNotif('success','✅',`E-mail classificado como: ${folder}`);
}
async function classifyEmail(email) {
  const cfg=loadConfig();
  if(!cfg.claudeApiKey) return email.folder||'Outros';
  const rulesText=state.rules.filter(r=>r.active).map(r=>`- Pasta "${r.folder}": ${r.criteria}`).join('\n');
  const bodyText=email.bodyText||stripHtml(email.bodyHtml||'')||email.preview||'';
  const prompt=`Classifique este e-mail. Responda APENAS com o nome da pasta.\n\nRegras:\n${rulesText}\n- "Outros": demais casos\n\nRemetente: ${email.from}\nAssunto: ${email.subject}\nCorpo: ${bodyText.substring(0,800)}\n\nPasta:`;
  try {
    const res=await geminiApi([{role:'user', parts:[{text:prompt}]}]);
    const text=res.candidates?.[0]?.content?.parts?.[0]?.text?.trim()||'Outros';
    return ['Financeiro','Trabalho','Marketing','Pessoal','Outros'].find(f=>text.includes(f))||'Outros';
  } catch { return 'Outros'; }
}
async function summarizeSelected() {
  if(!state.selectedEmail) return;
  document.getElementById('aiSummaryBox').style.display='block';
  document.getElementById('aiSummaryText').textContent='Gerando resumo...';
  const cfg=loadConfig();
  if(!cfg.claudeApiKey){document.getElementById('aiSummaryText').textContent='Configure a chave da API.';return;}
  const email=state.selectedEmail;
  const bodyText=email.bodyText||stripHtml(email.bodyHtml||'')||email.preview||'';
  const prompt=`Faça um resumo executivo em português, 2-3 frases. Destaque o ponto principal e ação necessária.\n\nDe: ${email.fromName} <${email.from}>\nAssunto: ${email.subject}\nCorpo:\n${bodyText.substring(0,1500)}`;
  try {
    const res=await geminiApi([{role:'user', parts:[{text:prompt}]}]);
    document.getElementById('aiSummaryText').textContent=res.candidates?.[0]?.content?.parts?.[0]?.text||'Não foi possível gerar o resumo.';
  } catch(e){document.getElementById('aiSummaryText').textContent='Erro: '+e.message;}
}

// ============================================================
// EMAIL LIST RENDER
// ============================================================
function renderEmailList() {
  const list=document.getElementById('emailList');
  const emails=state.filteredEmails;
  if(!emails.length){list.innerHTML='<div style="padding:40px 20px;text-align:center;color:var(--text3);font-size:13px;">Nenhum e-mail encontrado</div>';return;}
  list.innerHTML=emails.map(e=>{
    const initials=getInitials(e.fromName||e.from), color=getAvatarColor(e.from), relDate=formatRelativeDate(e.date), selected=state.selectedEmail?.id===e.id;
    return `<div class="email-item ${e.unread?'unread':''} ${selected?'selected':''}"
      onclick="selectEmail('${e.id}')"
      oncontextmenu="openEmailContextMenu(event,'${e.id}')">
      <div class="email-item-inner">
        <div class="email-avatar-col">
          <div class="list-avatar" style="background:${color}">${initials}</div>
          ${e.unread?'<div class="unread-dot"></div>':''}
        </div>
        <div class="email-content-col">
          <div class="email-meta">
            <div class="email-sender">${escHtml(e.fromName||e.from)}</div>
            <div class="email-date-row">
              ${e.importance==='high'?'<span class="importance-icon" title="Alta importância">🔴</span>':''}
              ${e.hasAttachments?'<span class="attach-icon" title="Tem anexos">📎</span>':''}
              <span class="email-date">${relDate}</span>
            </div>
          </div>
          <div class="email-subject">${escHtml(e.subject)}</div>
          <div class="email-bottom-row">
            <div class="email-preview">${escHtml(e.preview)}</div>
            ${e.folder&&e.tag?`<span class="email-tag ${e.tag}">${e.folder}</span>`:''}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}
function selectEmail(id) {
  state.selectedEmail=state.emails.find(e=>e.id===id);
  if(!state.selectedEmail) return;
  // Marca como lido localmente
  if (state.selectedEmail.unread) {
    state.selectedEmail.unread=false;
    // Marca como lido no Outlook via Graph API (sem await para não bloquear UI)
    if (state.connected && state.accessToken) markAsRead(state.selectedEmail.id);
  }
  renderEmailList(); renderEmailDetail(state.selectedEmail);
  switchTab('detail',document.querySelectorAll('.tab')[0]); updateUnreadBadge();
}

async function markAsRead(emailId) {
  try {
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${state.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isRead: true }),
    });
  } catch(e) { console.warn('markAsRead:', e); }
}

// ============================================================
// EMAIL DETAIL RENDER
// ============================================================
async function renderEmailDetail(email) {
  const detail=document.getElementById('detailTab');
  const initials=getInitials(email.fromName||email.from), color=getAvatarColor(email.from);
  const toList=(email.to||[]).join(', ')||'—';
  const dateStr=email.date?new Date(email.date).toLocaleString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}):email.dateFormatted||'';
  detail.innerHTML=`
    <div class="detail-header">
      <div class="detail-subject">${escHtml(email.subject)}</div>
      <div class="detail-from">
        <div class="avatar" style="background:${color}">${initials}</div>
        <div class="from-info">
          <div class="from-name">${escHtml(email.fromName||email.from)}</div>
          <div class="from-email">${escHtml(email.from)}</div>
        </div>
        ${email.importance==='high'?'<span style="font-size:11px;background:rgba(226,75,74,0.15);color:var(--danger);padding:3px 8px;border-radius:6px;font-weight:500;">Alta prioridade</span>':''}
      </div>
      <div class="detail-recipients">
        <span class="recipient-label">Para:</span> <span class="recipient-value">${escHtml(toList)}</span>
        ${email.cc?.length?`<br/><span class="recipient-label">CC:</span> <span class="recipient-value">${escHtml(email.cc.join(', '))}</span>`:''}
        <br/><span class="recipient-label">Data:</span> <span class="recipient-value">${dateStr}</span>
      </div>
      <div class="detail-actions">
        <button class="action-btn primary" onclick="summarizeSelected()">✨ Resumir com IA</button>
        <button class="action-btn" onclick="classifySelected()">⚡ Classificar</button>
        <button class="action-btn" onclick="openComposer('reply')">↩ Responder</button>
        <button class="action-btn" onclick="openComposer('replyAll')">↩↩ Resp. todos</button>
        <button class="action-btn" onclick="openComposer('forward')">→ Encaminhar</button>
        <button class="action-btn" onclick="deleteSelected()" style="color:var(--danger);border-color:rgba(226,75,74,0.3)">🗑 Excluir</button>
        <select class="move-select" onchange="moveSelectedToFolder(this.value);this.value=''">
          <option value="">Mover para...</option>
          ${buildFolderOptions()}
        </select>
      </div>
    </div>
    <div class="ai-summary-box" id="aiSummaryBox" style="display:none">
      <div class="ai-summary-label">✨ Resumo IA</div>
      <div class="ai-summary-text" id="aiSummaryText">Gerando resumo...</div>
    </div>
    <div class="detail-divider"></div>
    <div id="attachmentsArea"></div>
    <div id="emailBodyArea" class="email-body-area"><div class="body-loading"><div class="spinner"></div> Carregando...</div></div>`;
  renderEmailBody(email);
  if(email.hasAttachments&&state.accessToken) loadAndRenderAttachments(email);
}
async function renderEmailBody(email) {
  const area=document.getElementById('emailBodyArea');
  if(!area) return;
  let html=email.bodyHtml||'';
  if(html) {
    if(state.accessToken&&email.hasAttachments) html=await resolveCidImages(email.id,html);
    // Remove apenas scripts e handlers — preserva estilos e cores originais do e-mail
    html=html
      .replace(/<script[\s\S]*?<\/script>/gi,'')
      // Força HTTPS em imagens para evitar Mixed Content (backup caso meta tag não pegue tudo)
      .replace(/http:\/\/admin.protection.outlook.com/gi, 'https://admin.protection.outlook.com')
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi,'')
      .replace(/javascript:/gi,'');

    area.innerHTML='';
    const iframe=document.createElement('iframe');
    iframe.className='email-iframe';
    iframe.setAttribute('sandbox','allow-same-origin allow-popups');
    iframe.setAttribute('scrolling','no');
    area.appendChild(iframe);

    // Injeta o HTML completo do e-mail com estilos originais intactos
    const doc=iframe.contentDocument||iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        html,body{margin:0;padding:8px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.6;}
        img{max-width:100%!important;height:auto!important;}
        table{max-width:100%!important;}
        a{word-break:break-all;}
        *{box-sizing:border-box;}
      </style>
    </head><body>${html}</body></html>`);
    doc.close();

    // Auto-resize robusto
    const resize=()=>{
      try{
        const h=doc.body.scrollHeight;
        if(h>0) iframe.style.height=(h+24)+'px';
      }catch{}
    };
    iframe.onload=resize;
    setTimeout(resize,200);
    setTimeout(resize,600);
    setTimeout(resize,1500);
  } else {
    area.innerHTML=`<div class="detail-body">${escHtml(email.bodyText||email.preview||'').replace(/\n/g,'<br>')}</div>`;
  }
}
async function resolveCidImages(emailId, html) {
  if (!/src=["']cid:/i.test(html)) return html;
  try {
    const attachments = await fetchAttachments(emailId);
    for (const att of attachments) {
      if (att['@odata.type'] === '#microsoft.graph.fileAttachment' && att.contentId) {
        const cid      = att.contentId.replace(/[<>]/g, '');
        const escaped  = cid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re       = new RegExp('cid:' + escaped, 'gi');
        const dataUrl  = 'data:' + att.contentType + ';base64,' + att.contentBytes;
        html = html.replace(re, dataUrl);
      }
    }
  } catch (e) { console.warn('resolveCidImages:', e); }
  return html;
}
async function loadAndRenderAttachments(email) {
  const area=document.getElementById('attachmentsArea'); if(!area) return;
  const attachments=await fetchAttachments(email.id);
  const real=attachments.filter(a=>a['@odata.type']==='#microsoft.graph.fileAttachment'&&!a.isInline);
  if(!real.length) return;
  const items=real.map(a=>{
    const sizeKb=a.size?Math.round(a.size/1024):0, icon=getAttachIcon(a.name);
    const dataUrl=a.contentBytes?`data:${a.contentType};base64,${a.contentBytes}`:null;
    const isImg=a.contentType?.startsWith('image/');
    return `<div class="attachment-item">
      <div class="attach-preview">${isImg&&dataUrl?`<img src="${dataUrl}" class="attach-thumb" alt="${escHtml(a.name)}">`:`<span class="attach-file-icon">${icon}</span>`}</div>
      <div class="attach-info"><div class="attach-name">${escHtml(a.name)}</div><div class="attach-size">${sizeKb>0?sizeKb+' KB':''}</div></div>
      ${dataUrl?`<a class="attach-download" href="${dataUrl}" download="${escHtml(a.name)}" title="Baixar">⬇</a>`:''}
    </div>`;
  }).join('');
  area.innerHTML=`<div class="attachments-bar"><div class="attachments-label">Anexos (${real.length})</div><div class="attachments-list">${items}</div></div><div class="detail-divider"></div>`;
}
function moveSelected(folder) {
  if(!folder||!state.selectedEmail) return;
  const email=state.selectedEmail;
  const tagMap={Financeiro:'tag-finance',Trabalho:'tag-work',Marketing:'tag-marketing',Pessoal:'tag-personal',Outros:''};
  email.folder=folder; email.tag=tagMap[folder]||'';
  if(state.connected&&state.accessToken) moveEmail(email.id,folder);
  
  // Remove visualmente da lista atual (pois foi movido de verdade)
  state.emails = state.emails.filter(e => e.id !== email.id);
  state.filteredEmails = state.filteredEmails.filter(e => e.id !== email.id);
  state.selectedEmail = null;
  
  renderEmailList(); 
  updateFolderCounts();
  
  document.getElementById('detailTab').innerHTML=`
    <div style="display:flex;align-items:center;justify-content:center;height:200px;flex-direction:column;gap:12px;">
      <div style="font-size:48px;opacity:0.2">📭</div>
      <div style="color:var(--text3);font-size:14px">Selecione um e-mail para visualizar</div>
    </div>`;
  showNotif('success','✅',`E-mail movido para ${folder}`);
}
// ============================================================
// AI CHAT
// ============================================================
async function sendChat() {
  const input=document.getElementById('chatInput');
  const msg=input.value.trim(); if(!msg) return;
  input.value=''; autoResize(input);
  addChatMessage('user',msg);
  const typing=addTyping();
  const cfg=loadConfig();
  if(!cfg.claudeApiKey){removeTyping(typing);addChatMessage('assistant','Configure sua chave da API nas configurações.');return;}
  const emailsContext=state.emails.map(e=>{
    const body=e.bodyText||stripHtml(e.bodyHtml||'')||e.preview||'';
    return `[${e.dateFormatted||e.date}] De: ${e.fromName} <${e.from}> | Pasta: ${e.folder}\nAssunto: ${e.subject}\nCorpo: ${body.substring(0,300)}`;
  }).join('\n\n---\n\n');
  const systemPrompt=`Você é um assistente inteligente de e-mails do Outlook. Responda sempre em português brasileiro de forma clara.\n\nE-mails disponíveis (${state.emails.length}):\n${emailsContext}`;
  
  // Mapeia histórico para formato Gemini (role: 'user' | 'model')
  // Filtra mensagens vazias para evitar erro 400
  const history=state.chatHistory
    .filter(m => m.text && m.text.trim() !== '')
    .map(m=>({ role: m.role==='assistant'?'model':'user', parts:[{text:m.text}] }));
  
  history.push({role:'user', parts:[{text:msg}]});

  try {
    const data=await geminiApi(history,systemPrompt);
    const reply=data.candidates?.[0]?.content?.parts?.[0]?.text||'Desculpe, não consegui processar.';
    removeTyping(typing); addChatMessage('assistant',reply);
    state.chatHistory.push({role:'user',text:msg},{role:'assistant',text:reply});
    // Salva histórico no localStorage
    if(state.chatHistory.length > 20) state.chatHistory = state.chatHistory.slice(-20);
    localStorage.setItem('mailmind_chat_history', JSON.stringify(state.chatHistory));
  } catch(e){removeTyping(typing);addChatMessage('assistant','Erro: '+e.message);}
}
function addChatMessage(role,text) {
  const msgs=document.getElementById('chatMessages');
  const div=document.createElement('div'); div.className=`msg ${role}`;
  const now=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  div.innerHTML=`<div class="msg-bubble">${formatText(text)}</div><div class="msg-time">${now}</div>`;
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight; return div;
}
function renderChatHistory() {
  const chatContainer = document.getElementById('chatMessages');
  if (!chatContainer) return;
  // Se houver histórico, limpa a mensagem de boas-vindas e renderiza as salvas
  if (state.chatHistory.length > 0) {
      chatContainer.innerHTML = '';
      state.chatHistory.forEach(msg => addChatMessage(msg.role, msg.text));
  }
}
function addTyping() {
  const msgs=document.getElementById('chatMessages');
  const div=document.createElement('div'); div.className='msg assistant';
  div.innerHTML='<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight; return div;
}
function removeTyping(el){el?.parentNode?.removeChild(el);}
function handleChatKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat();}}
function useSuggestion(btn){document.getElementById('chatInput').value=btn.textContent;switchTab('chat',document.querySelectorAll('.tab')[1]);sendChat();}
function autoResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,140)+'px';}

function openEmailContextMenu(event, id) {
  event.preventDefault();
  document.getElementById('emailCtxMenu')?.remove();

  const email = state.emails.find(e => e.id === id);
  if (!email) return;

  // Seleciona o email
  selectEmail(id);

  const menu = document.createElement('div');
  menu.id = 'emailCtxMenu';
  menu.className = 'folder-ctx-menu';
  menu.style.top  = event.clientY + 'px';
  menu.style.left = event.clientX + 'px';
  menu.innerHTML = `
    <div class="ctx-item" onclick="classifySelected()">⚡ Classificar com IA</div>
    <div class="ctx-item" onclick="summarizeSelected()">✨ Resumir com IA</div>
    <div class="ctx-item" onclick="openComposer('reply')">↩ Responder</div>
    <div class="ctx-item" onclick="openComposer('replyAll')">↩↩ Responder a todos</div>
    <div class="ctx-item" onclick="openComposer('forward')">→ Encaminhar</div>
    <div class="ctx-item ctx-danger" onclick="deleteSelected()">🗑 Mover para lixeira</div>`;
  document.body.appendChild(menu);

  // Ajusta posição se sair da tela
  const rect = menu.getBoundingClientRect();
  if (rect.right  > window.innerWidth)  menu.style.left = (event.clientX - rect.width)  + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top  = (event.clientY - rect.height) + 'px';

  setTimeout(() => {
    document.addEventListener('click', () => menu.remove(), { once: true });
    document.addEventListener('contextmenu', () => menu.remove(), { once: true });
  }, 50);
}

// ============================================================
// RULES
// ============================================================
function renderRules() {
  const list=document.getElementById('rulesList');
  const pLabel={high:'Alta',medium:'Média',low:'Baixa'};
  const pColor={high:'rgba(226,75,74,0.15)',medium:'rgba(239,159,39,0.15)',low:'rgba(29,158,117,0.15)'};
  const pText={high:'var(--danger)',medium:'var(--warn)',low:'var(--success)'};

  if (!state.rules.length) {
    list.innerHTML='<div style="padding:24px;text-align:center;color:var(--text3);font-size:13px;">Nenhuma regra criada ainda.</div>';
    return;
  }

  list.innerHTML=state.rules.map(r=>`
    <div class="rule-card ${r.active?'active-rule':''}">
      <div class="rule-info">
        <div class="rule-name">${escHtml(r.name)}</div>
        <div class="rule-desc">Mover para: <strong>${escHtml(r.folder)}</strong> — ${escHtml(r.criteria.substring(0,60))}${r.criteria.length>60?'...':''}</div>
        ${r.action && r.action !== 'none' ? `<div class="rule-action-badge">${
          r.action==='forward' ? `→ Encaminhar para ${escHtml(r.actionTarget||'')}` :
          r.action==='delete'  ? '🗑 Mover para lixeira' :
          r.action==='markRead'? '✓ Marcar como lido' : ''
        }</div>` : ''}
        <div class="rule-actions">
          <span class="rule-tag" style="background:${pColor[r.priority]};color:${pText[r.priority]}">${pLabel[r.priority]||'Média'} prioridade</span>
        </div>
      </div>
      <div class="rule-right">
        <button class="rule-menu-btn" onclick="openRuleMenu(event,'${r.id}')" title="Opções">···</button>
        <label class="rule-toggle">
          <input type="checkbox" ${r.active?'checked':''} onchange="toggleRule('${r.id}',this.checked)"/>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>`).join('');
}

function openRuleMenu(event, id) {
  event.stopPropagation();
  document.getElementById('ruleCtxMenu')?.remove();

  const menu = document.createElement('div');
  menu.id = 'ruleCtxMenu';
  menu.className = 'folder-ctx-menu';
  menu.innerHTML = `
    <div class="ctx-menu-section">Regra</div>
    <div class="ctx-item" onclick="openEditRule('${id}')">✏️ Editar regra</div>
    <div class="ctx-item ctx-danger" onclick="deleteRule('${id}')">🗑 Excluir regra</div>`;

  const btn = event.currentTarget;
  const rect = btn.getBoundingClientRect();
  menu.style.top  = (rect.bottom + 4) + 'px';
  menu.style.left = (rect.right - 200) + 'px';
  document.body.appendChild(menu);

  // Ajusta se sair da tela
  const mr = menu.getBoundingClientRect();
  if (mr.right  > window.innerWidth)  menu.style.left = (window.innerWidth - mr.width - 8) + 'px';
  if (mr.bottom > window.innerHeight) menu.style.top  = (rect.top - mr.height - 4) + 'px';

  setTimeout(() => {
    document.addEventListener('click', () => { menu.remove(); switchView('emails', null); }, { once: true });
  }, 50);
}

function openEditRule(id) {
  const r = state.rules.find(r => r.id === id);
  if (!r) return;
  document.getElementById('ruleName').value     = r.name;
  document.getElementById('ruleCriteria').value = r.criteria;
  document.getElementById('rulePriority').value = r.priority;
  document.getElementById('ruleAction').value   = r.action || 'none';
  document.getElementById('ruleActionTarget').value = r.actionTarget || '';
  toggleRuleActionTarget(r.action || 'none');
  populateRuleFolderSelect(r.folder);
  document.querySelector('#ruleModal .modal-title').textContent = 'Editar Regra';
  const btn = document.querySelector('#ruleModal .btn-save');
  btn.textContent = 'Salvar Alterações';
  btn.onclick = () => updateRule(id);
  document.getElementById('ruleModal').classList.add('open');
}

function updateRule(id) {
  const r = state.rules.find(r => r.id === id);
  if (!r) return;
  const name     = document.getElementById('ruleName').value.trim();
  const criteria = document.getElementById('ruleCriteria').value.trim();
  const folder   = document.getElementById('ruleFolder').value;
  const priority = document.getElementById('rulePriority').value;
  const action   = document.getElementById('ruleAction').value;
  const actionTarget = document.getElementById('ruleActionTarget').value.trim();
  if (!name || !criteria) { showNotif('error','❌','Preencha nome e critério'); return; }
  if (action === 'forward' && !actionTarget) { showNotif('error','❌','Informe o e-mail para encaminhar'); return; }
  const icons  = {Financeiro:'💰',Trabalho:'💼',Marketing:'📢',Pessoal:'👤',Outros:'📋'};
  const colors = {Financeiro:'rgba(29,158,117,0.15)',Trabalho:'rgba(124,110,250,0.15)',Marketing:'rgba(239,159,39,0.15)',Pessoal:'rgba(240,153,123,0.15)',Outros:'rgba(136,135,128,0.15)'};
  Object.assign(r, { name, criteria, folder, priority, action, actionTarget, icon: icons[folder]||'📋', color: colors[folder]||'' });
  saveRules(); renderRules(); closeModal();
  showNotif('success','✅','Regra atualizada!');
}

function toggleRule(id,active){const r=state.rules.find(r=>r.id===id);if(r){r.active=active;saveRules();}}
function deleteRule(id){
  if(!confirm('Excluir esta regra?')) return;
  state.rules=state.rules.filter(r=>r.id!==id);saveRules();renderRules();
  showNotif('success','✅','Regra excluída!');
}
function saveRules(){localStorage.setItem('mailmind_rules',JSON.stringify(state.rules));}
function populateRuleFolderSelect(selectedFolder) {
  const sel = document.getElementById('ruleFolder');
  if (!sel) return;
  const folders = state.useOutlookFolders && state.outlookFolders.length
    ? state.outlookFolders.map(f => f.displayName)
    : (state.fixedFolders || [{name:'Trabalho'},{name:'Financeiro'},{name:'Marketing'},{name:'Pessoal'},{name:'Outros'}]).map(f => f.name);
  sel.innerHTML = folders.map(n => `<option value="${escHtml(n)}" ${n===selectedFolder?'selected':''}>${escHtml(n)}</option>`).join('');
}

function openAddRule(){
  document.getElementById('ruleName').value='';
  document.getElementById('ruleCriteria').value='';
  document.getElementById('rulePriority').value='medium';
  document.getElementById('ruleAction').value='none';
  document.getElementById('ruleActionTarget').value='';
  toggleRuleActionTarget('none');
  populateRuleFolderSelect('');
  document.querySelector('#ruleModal .modal-title').textContent='Nova Regra de Classificação';
  const btn=document.querySelector('#ruleModal .btn-save');
  btn.textContent='Salvar Regra';
  btn.onclick=saveRule;
  document.getElementById('ruleModal').classList.add('open');
}
function closeModal(){document.getElementById('ruleModal').classList.remove('open');}
function saveRule(){
  const name=document.getElementById('ruleName').value.trim();
  const criteria=document.getElementById('ruleCriteria').value.trim();
  const folder=document.getElementById('ruleFolder').value;
  const priority=document.getElementById('rulePriority').value;
  const action=document.getElementById('ruleAction').value;
  const actionTarget=document.getElementById('ruleActionTarget').value.trim();
  if(!name||!criteria){showNotif('error','❌','Preencha nome e critério');return;}
  if(action==='forward'&&!actionTarget){showNotif('error','❌','Informe o e-mail para encaminhar');return;}
  const icons={Financeiro:'💰',Trabalho:'💼',Marketing:'📢',Pessoal:'👤',Outros:'📋'};
  const colors={Financeiro:'rgba(29,158,117,0.15)',Trabalho:'rgba(124,110,250,0.15)',Marketing:'rgba(239,159,39,0.15)',Pessoal:'rgba(240,153,123,0.15)',Outros:'rgba(136,135,128,0.15)'};
  state.rules.push({id:'r'+Date.now(),name,criteria,folder,priority,action,actionTarget,active:true,icon:icons[folder]||'📋',color:colors[folder]||''});
  saveRules();renderRules();closeModal();
  showNotif('success','✅','Regra adicionada!');
}

// ============================================================
// FILTERS
// ============================================================
function setFilter(filter,btn){
  state.currentFilter=filter; state.currentFolder=null;
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('panelTitle').textContent='Caixa de Entrada';

  // Remove highlight de pastas
  document.querySelectorAll('.folder-item').forEach(el=>el.classList.remove('active-folder'));

  applyFilters();
}
async function filterByFolder(folder) {
  // Garante que estamos na view de emails
  if (state.currentView !== 'emails') switchView('emails', null);

  // Se conectado, tenta buscar da pasta real no Outlook (Sincronização)
  if (state.connected && state.accessToken) {
    try {
      showStatus(`Sincronizando ${folder}...`);
      const fid = await getTargetFolderId(folder);
      if (fid) {
        await fetchEmailsByFolder(fid, folder);
        return; // Sincronização feita, não usa filtro local
      }
    } catch(e) {
      console.warn('Fallback local para folder:', e);
      hideStatus();
    }
  }

  // Fallback: modo offline ou erro na API -> filtro local
  state.currentFolder=folder; state.currentFilter='all';
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  document.getElementById('panelTitle').textContent=folder;

  // Highlight da pasta selecionada
  document.querySelectorAll('.folder-item').forEach(el => {
    const nameEl = el.querySelector('.folder-name');
    el.classList.toggle('active-folder', nameEl?.textContent.trim() === folder);
  });

  applyFilters();
}
function filterEmails(){applyFilters();}
function applyFilters(){
  const search=document.getElementById('searchInput').value.toLowerCase();
  let emails=[...state.emails];
  if(state.currentFolder)emails=emails.filter(e=>e.folder===state.currentFolder);
  else if(state.currentFilter==='unread')emails=emails.filter(e=>e.unread);
  else if(state.currentFilter==='high_importance')emails=emails.filter(e=>e.importance==='high');
  else if(['Trabalho','Financeiro','Marketing','Pessoal'].includes(state.currentFilter))emails=emails.filter(e=>e.folder===state.currentFilter);
  if(search)emails=emails.filter(e=>e.subject.toLowerCase().includes(search)||e.from.toLowerCase().includes(search)||e.preview.toLowerCase().includes(search));
  state.filteredEmails=emails;renderEmailList();
}
function updateFolderCounts(){
  const folders = state.fixedFolders || [
    {name:'Trabalho'},{name:'Financeiro'},{name:'Marketing'},{name:'Pessoal'},{name:'Outros'}
  ];
  folders.forEach(f=>{
    const el=document.getElementById('cnt-'+f.name);
    if(el) el.textContent=state.emails.filter(e=>e.folder===f.name).length||'';
  });
}
function updateUnreadBadge(){
  const count = state.emails.filter(e=>e.unread).length;
  document.getElementById('unreadBadge').textContent = count;
  updateTabBadge();
}

// ============================================================
// VIEW / TAB SWITCHING
// ============================================================
function switchView(view,btn){
  state.currentView=view;
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(btn)btn.classList.add('active');
  document.getElementById('emailPanel').style.display  =view==='emails'?'flex':'none';
  document.getElementById('contentArea').style.display =view==='emails'?'flex':'none';
  document.getElementById('rulesPanel').style.display  =view==='rules' ?'block':'none';
  document.getElementById('configPanel').style.display =view==='config'?'block':'none';
  if(view==='config') populateConfigPanel();
}
function switchTab(tab,btn){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  if(btn)btn.classList.add('active');
  document.getElementById('detailTab').classList.toggle('active',tab==='detail');
  document.getElementById('chatTab').classList.toggle('active',tab==='chat');
}

// ============================================================
// RESIZE — painéis arrastáveis
// ============================================================
function initResize() {
  // Larguras salvas
  const savedSidebar = parseInt(localStorage.getItem('mm_sidebar_w')) || 260;
  const savedEmail   = parseInt(localStorage.getItem('mm_email_w'))   || 380;

  const sidebar    = document.querySelector('.sidebar');
  const emailPanel = document.getElementById('emailPanel');
  const main       = document.querySelector('.main');
  const rulesPanel = document.getElementById('rulesPanel');
  const configPanel= document.getElementById('configPanel');

  // Aplica larguras salvas
  applySidebarWidth(savedSidebar);
  applyEmailWidth(savedEmail);

  function applySidebarWidth(w) {
    w = Math.max(180, Math.min(400, w));
    sidebar.style.width = w + 'px';
    main.style.marginLeft = w + 'px';
    rulesPanel.style.left  = w + 'px';
    configPanel.style.left = w + 'px';
  }

  function applyEmailWidth(w) {
    w = Math.max(240, Math.min(600, w));
    emailPanel.style.width = w + 'px';
    emailPanel.style.flexShrink = '0';
  }

  // Cria handle entre sidebar e main
  const handleSidebar = document.createElement('div');
  handleSidebar.className = 'resize-handle resize-handle-sidebar';
  document.body.appendChild(handleSidebar);

  // Cria handle entre lista de e-mails e detalhe
  const handleEmail = document.createElement('div');
  handleEmail.className = 'resize-handle resize-handle-email';
  document.body.appendChild(handleEmail);

  function positionHandles() {
    const sw = sidebar.getBoundingClientRect().width;
    const ew = emailPanel.getBoundingClientRect().width;
    handleSidebar.style.left = (sw - 3) + 'px';
    // Handle de email só visível na view de emails
    handleEmail.style.left   = (sw + ew - 3) + 'px';
    handleEmail.style.display = state.currentView === 'emails' ? 'block' : 'none';
  }

  positionHandles();

  // Drag sidebar
  let dragging = null, startX = 0, startW = 0;

  handleSidebar.addEventListener('mousedown', e => {
    dragging = 'sidebar';
    startX = e.clientX;
    startW = sidebar.getBoundingClientRect().width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  handleEmail.addEventListener('mousedown', e => {
    dragging = 'email';
    startX = e.clientX;
    startW = emailPanel.getBoundingClientRect().width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    if (dragging === 'sidebar') {
      const newW = startW + delta;
      applySidebarWidth(newW);
      localStorage.setItem('mm_sidebar_w', Math.max(180, Math.min(400, newW)));
    } else {
      const newW = startW + delta;
      applyEmailWidth(newW);
      localStorage.setItem('mm_email_w', Math.max(240, Math.min(600, newW)));
    }
    positionHandles();
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  // Reposiciona handles ao trocar view
  const origSwitchView = switchView;
  window._switchViewOrig = origSwitchView;
  window.switchView = function(view, btn) {
    origSwitchView(view, btn);
    setTimeout(positionHandles, 10);
  };
}

// ============================================================
// BADGE NA ABA — título e favicon com contador de não lidos
// ============================================================
let _faviconCanvas = null;

function updateTabBadge() {
  const unread = state.emails.filter(e => e.unread).length;

  // Atualiza título
  const base = 'MailMind — Quality Transportes';
  document.title = unread > 0 ? `(${unread}) ${base}` : base;

  // Atualiza favicon com badge numérico
  renderFaviconBadge(unread);
}

function renderFaviconBadge(count) {
  if (!_faviconCanvas) {
    _faviconCanvas = document.createElement('canvas');
    _faviconCanvas.width  = 32;
    _faviconCanvas.height = 32;
  }
  const canvas = _faviconCanvas;
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, 32, 32);

  // Ícone base — círculo roxo com ✦
  ctx.fillStyle = '#7C6EFA';
  ctx.beginPath();
  ctx.roundRect(2, 2, 28, 28, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', 16, 16);

  // Badge vermelho com número
  if (count > 0) {
    const label = count > 99 ? '99+' : String(count);
    const bx = 32, by = 0, br = 10;
    ctx.fillStyle = '#E24B4A';
    ctx.beginPath();
    ctx.arc(bx - br, by + br, br, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx - br, by + br);
  }

  // Atualiza o <link rel="icon">
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = canvas.toDataURL('image/png');
}

// ============================================================
// POLLING — novos e-mails sem recarregar a página
// ============================================================
let _pollingTimer = null;

function startPolling() {
  stopPolling();
  const interval = 60000; // verifica a cada 60 segundos
  _pollingTimer = setInterval(checkNewEmails, interval);
}

function stopPolling() {
  if (_pollingTimer) { clearInterval(_pollingTimer); _pollingTimer = null; }
}

async function checkNewEmails() {
  if (!state.accessToken || !state.connected) return;

  // Evita polling se estiver vendo uma pasta específica que não seja Inbox
  // para não misturar e-mails novos da entrada dentro da pasta "Financeiro", por exemplo.
  if (state.currentFolder && state.currentFolder !== 'Caixa de Entrada') return;

  // Pega o ID do e-mail mais recente que já temos
  const newestDate = state.emails.length > 0 ? state.emails[0].date : null;
  if (!newestDate) return;

  try {
    const filter = encodeURIComponent(`receivedDateTime gt ${newestDate}`);
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$top=20&$filter=${filter}` +
      `&$select=id,subject,from,toRecipients,ccRecipients,bodyPreview,body,receivedDateTime,isRead,hasAttachments,importance` +
      `&$orderby=receivedDateTime desc`,
      { headers: {
          Authorization: `Bearer ${state.accessToken}`,
          'Prefer': 'outlook.body-content-type="html"',
      }}
    );
    if (!res.ok) return;
    const data = await res.json();
    const newEmails = (data.value || []).map(buildEmailObj);

    if (newEmails.length === 0) return;

    // Filtra os que realmente ainda não estão na lista
    const existingIds = new Set(state.emails.map(e => e.id));
    const toAdd = newEmails.filter(e => !existingIds.has(e.id));
    if (toAdd.length === 0) return;

    // Insere no início
    state.emails = [...toAdd, ...state.emails];
    state.filteredEmails = [...toAdd, ...state.filteredEmails];

    renderEmailList();
    updateFolderCounts();
    updateUnreadBadge();
    renderPagination();

    const plural = toAdd.length > 1 ? 's' : '';
    showNotif('success', '📬', `${toAdd.length} novo${plural} e-mail${plural} recebido${plural}!`);
  } catch(e) { console.warn('checkNewEmails:', e); }
}

// ============================================================
// BOOTSTRAP
// ============================================================
init();
document.addEventListener('DOMContentLoaded', initResize);
// Fallback caso DOMContentLoaded já tenha disparado
if (document.readyState !== 'loading') initResize();
