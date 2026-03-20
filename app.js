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
  outlookFolders: [],      // pastas reais do Outlook
  useOutlookFolders: false, // toggle da configuração
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
  try { return JSON.parse(localStorage.getItem('mailmind_config')||'{}'); } catch { return {}; }
}

// ============================================================
// SETUP WIZARD
// ============================================================
function showSetupStep(step) {
  [1,2,3].forEach(n => {
    document.getElementById('stepPanel'+n)?.classList.toggle('active', n===step);
    const dot=document.getElementById('dot'+n);
    if (dot) { dot.classList.toggle('active',n<=step); dot.classList.toggle('done',n<step); }
  });
  document.getElementById('setupProgressFill').style.width = (step===1?33:step===2?66:100)+'%';
}
function setupNext(currentStep) {
  if (currentStep===1) {
    const key=document.getElementById('claudeApiKey').value.trim();
    if (!key||!key.startsWith('sk-')) { showNotif('error','❌','Insira uma chave válida (começa com sk-)'); return; }
    showSetupStep(2);
  } else if (currentStep===2) {
    const clientId=document.getElementById('msClientId').value.trim();
    if (!clientId) { showNotif('error','❌','Insira o Client ID do Azure'); return; }
    const tenantId=document.getElementById('msTenantId').value.trim()||'common';
    document.getElementById('setupSummary').innerHTML=`
      <div class="summary-row"><span>Chave Claude</span><span>sk-ant-••••••••</span></div>
      <div class="summary-row"><span>Client ID</span><span>${escHtml(clientId.substring(0,8))}...</span></div>
      <div class="summary-row"><span>Tenant ID</span><span>${escHtml(tenantId)}</span></div>
      <div class="summary-row"><span>Redirect URI</span><span>${escHtml(window.location.origin)}</span></div>`;
    showSetupStep(3);
  }
}
function setupBack(currentStep) { showSetupStep(currentStep-1); }
function saveSetup() {
  const key=document.getElementById('claudeApiKey').value.trim();
  const clientId=document.getElementById('msClientId').value.trim();
  const tenantId=document.getElementById('msTenantId').value.trim()||'common';
  if (!key) { showNotif('error','❌','Insira sua chave da API do Claude'); return; }
  const cfg={claudeApiKey:key,clientId,tenantId,redirectUri:window.location.origin,model:'claude-sonnet-4-20250514',autoClassify:true,batchSize:20};
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
  state.config=cfg;
  state.rules=JSON.parse(localStorage.getItem('mailmind_rules')||'null')||DEFAULT_RULES;
  state.emails=DEMO_EMAILS;
  state.filteredEmails=[...state.emails];
  // Restaura token do sessionStorage (sobrevive F5)
  if (restoreToken()) {
    fetchEmails().then(()=>{ renderEmailList(); updateFolderCounts(); updateUnreadBadge(); });
  } else {
    renderEmailList(); updateFolderCounts(); updateUnreadBadge();
  }
  renderRules();
}

// ============================================================
// CONFIG PANEL
// ============================================================
function populateConfigPanel() {
  let cfg={};
  try { cfg=JSON.parse(localStorage.getItem('mailmind_config')||'{}'); } catch {}
  if (!cfg.claudeApiKey && state.config?.claudeApiKey) cfg=state.config;
  const fields={configApiKey:cfg.claudeApiKey||'',configClientId:cfg.clientId||'',configTenantId:cfg.tenantId||'',configRedirectUri:cfg.redirectUri||window.location.origin,configModel:cfg.model||'claude-sonnet-4-20250514',configBatchSize:cfg.batchSize||20};
  Object.entries(fields).forEach(([id,val])=>{ const el=document.getElementById(id); if(el) el.value=val; });
  const ac=document.getElementById('autoClassify'); if(ac) ac.checked=cfg.autoClassify!==false;
  const of=document.getElementById('useOutlookFolders'); if(of) of.checked=cfg.useOutlookFolders===true;
}
function saveConfig() {
  const cfg={
    claudeApiKey:document.getElementById('configApiKey').value.trim(),
    model:document.getElementById('configModel').value,
    clientId:document.getElementById('configClientId').value.trim(),
    tenantId:document.getElementById('configTenantId').value.trim()||'common',
    redirectUri:document.getElementById('configRedirectUri').value.trim()||window.location.origin,
    autoClassify:document.getElementById('autoClassify').checked,
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
  localStorage.removeItem('mailmind_config'); localStorage.removeItem('mailmind_rules');
  sessionStorage.removeItem('mm_token'); sessionStorage.removeItem('mm_expires_at');
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
function handleToken(token,expiresIn) {
  state.accessToken=token; state.connected=true;
  const expiresAt=Date.now()+((parseInt(expiresIn)||3600)*1000);
  sessionStorage.setItem('mm_token',token);
  sessionStorage.setItem('mm_expires_at',String(expiresAt));
  document.getElementById('connectBtn').innerHTML='✅ Conectado';
  document.getElementById('connectBtn').classList.add('connected');
  document.getElementById('connectStatus').textContent='Outlook conectado';
  showNotif('success','✅','Outlook conectado com sucesso!');
  // Carrega pastas do Outlook se habilitado
  const cfg=loadConfig();
  state.useOutlookFolders=cfg.useOutlookFolders===true;
  if(state.useOutlookFolders) loadOutlookFolders();
  fetchEmails();
}
function restoreToken() {
  const token=sessionStorage.getItem('mm_token');
  const expiresAt=parseInt(sessionStorage.getItem('mm_expires_at')||'0');
  if(!token||Date.now()>=expiresAt) return false;
  state.accessToken=token; state.connected=true;
  document.getElementById('connectBtn').innerHTML='✅ Conectado';
  document.getElementById('connectBtn').classList.add('connected');
  document.getElementById('connectStatus').textContent='Outlook conectado';
  return true;
}

// ============================================================
// PASTAS DO OUTLOOK
// ============================================================
async function loadOutlookFolders() {
  if (!state.accessToken) return;
  try {
    const res = await fetch(
      'https://graph.microsoft.com/v1.0/me/mailFolders?$top=50&$select=id,displayName,unreadItemCount,totalItemCount',
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
    // Pastas reais do Outlook
    const colors = ['#7C6EFA','#5DCAA5','#EF9F27','#F0997B','#E24B4A','#4AACE2','#B26EFA'];
    list.innerHTML = state.outlookFolders.map((f, i) => `
      <div class="folder-item" onclick="fetchEmailsByFolder('${f.id}','${escHtml(f.displayName)}')">
        <div class="folder-dot" style="background:${colors[i % colors.length]}"></div>
        <span class="folder-name">${escHtml(f.displayName)}</span>
        <span class="folder-count">${f.unreadItemCount > 0 ? f.unreadItemCount : ''}</span>
      </div>`).join('');
  } else {
    // Pastas fixas do MailMind
    list.innerHTML = `
      <div class="folder-item" onclick="filterByFolder('Trabalho')">
        <div class="folder-dot" style="background:#7C6EFA"></div>
        Trabalho <span class="folder-count" id="cnt-Trabalho">0</span>
      </div>
      <div class="folder-item" onclick="filterByFolder('Financeiro')">
        <div class="folder-dot" style="background:#5DCAA5"></div>
        Financeiro <span class="folder-count" id="cnt-Financeiro">0</span>
      </div>
      <div class="folder-item" onclick="filterByFolder('Marketing')">
        <div class="folder-dot" style="background:#EF9F27"></div>
        Marketing <span class="folder-count" id="cnt-Marketing">0</span>
      </div>
      <div class="folder-item" onclick="filterByFolder('Pessoal')">
        <div class="folder-dot" style="background:#F0997B"></div>
        Pessoal <span class="folder-count" id="cnt-Pessoal">0</span>
      </div>
      <div class="folder-item" onclick="filterByFolder('Outros')">
        <div class="folder-dot" style="background:#888780"></div>
        Outros <span class="folder-count" id="cnt-Outros">0</span>
      </div>`;
    updateFolderCounts();
  }
}

async function fetchEmailsByFolder(folderId, folderName) {
  if (!state.accessToken) return;
  document.getElementById('panelTitle').textContent = folderName;
  state.page.current = 1; state.page.prevLinks = [];
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
    state.emails = data.value.map(buildEmailObj);
    state.filteredEmails = [...state.emails];
    state.page.nextLink = data['@odata.nextLink'] || null;
    renderEmailList(); renderPagination(); hideStatus();
  } catch(e) { hideStatus(); showNotif('error','❌','Erro: '+e.message); }
}


// ============================================================
// GRAPH API — REPLY / FORWARD / DELETE
// ============================================================
async function sendReply(emailId, bodyHtml, toAll) {
  const endpoint = toAll ? 'replyAll' : 'reply';
  await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/${endpoint}`, {
    method:'POST',
    headers:{Authorization:`Bearer ${state.accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({message:{body:{contentType:'html',content:bodyHtml}}}),
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
  const quoteHtml  = `<br><br><blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#666;margin:0">
    <p><b>De:</b> ${escHtml(email.fromName)} &lt;${escHtml(email.from)}&gt;<br>
    <b>Data:</b> ${escHtml(email.dateFormatted||'')}<br>
    <b>Assunto:</b> ${escHtml(email.subject)}</p>
    ${email.bodyHtml||escHtml(email.bodyText||'').replace(/\n/g,'<br>')}
  </blockquote>`;

  const panel = document.createElement('div');
  panel.id='composerPanel'; panel.className='composer-panel';
  panel.innerHTML=`
    <div class="composer-header">
      <span class="composer-title">${mode==='forward'?'Encaminhar':'Responder'}</span>
      <button class="composer-close" onclick="document.getElementById('composerPanel').remove()">✕</button>
    </div>
    <div class="composer-fields">
      <div class="composer-field"><label>Para</label>
        <input id="composerTo" type="email" value="${escHtml(toVal)}" placeholder="destinatario@email.com"/></div>
      <div class="composer-field"><label>Assunto</label>
        <input id="composerSubject" type="text" value="${escHtml(subjectVal)}" readonly/></div>
    </div>
    <div class="composer-body" id="composerBody" contenteditable="true">${quoteHtml}</div>
    <div class="composer-footer">
      <button class="action-btn" onclick="document.getElementById('composerPanel').remove()">Cancelar</button>
      <button class="action-btn primary" id="composerSendBtn" onclick="submitComposer('${mode}','${email.id}')">
        ${mode==='forward'?'Encaminhar':'Enviar'}
      </button>
    </div>`;
  document.getElementById('detailTab').appendChild(panel);
  // Foco no início (antes da citação)
  const body=document.getElementById('composerBody');
  body.focus();
  const range=document.createRange(); range.setStart(body,0); range.collapse(true);
  const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
}

async function submitComposer(mode, id) {
  if(!state.accessToken) return;
  const to=document.getElementById('composerTo')?.value.trim();
  const bodyHtml=document.getElementById('composerBody')?.innerHTML||'';
  if(mode==='forward'&&!to){showNotif('error','❌','Informe o destinatário');return;}
  const btn=document.getElementById('composerSendBtn');
  if(btn){btn.textContent='Enviando...';btn.disabled=true;}
  try {
    if(mode==='forward') await sendForward(id,to,bodyHtml);
    else await sendReply(id,bodyHtml,mode==='replyAll');
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
const BASE_URL  = 'https://graph.microsoft.com/v1.0/me/messages'
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
    if(!url && loadConfig().autoClassify!==false) classifyAllEmails();
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
async function moveEmail(emailId,folderName) {
  if(!state.accessToken) return;
  try {
    const foldersRes=await fetch('https://graph.microsoft.com/v1.0/me/mailFolders',{headers:{Authorization:`Bearer ${state.accessToken}`}});
    const foldersData=await foldersRes.json();
    let folder=foldersData.value.find(f=>f.displayName.toLowerCase()===folderName.toLowerCase());
    if(!folder){
      const cr=await fetch('https://graph.microsoft.com/v1.0/me/mailFolders',{method:'POST',headers:{Authorization:`Bearer ${state.accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({displayName:folderName})});
      folder=await cr.json();
    }
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/move`,{method:'POST',headers:{Authorization:`Bearer ${state.accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({destinationId:folder.id})});
  } catch(e){console.error('Erro ao mover:',e);}
}

// ============================================================
// CLAUDE API
// ============================================================
async function claudeApi(messages,maxTokens=1000,system=null) {
  const cfg=loadConfig();
  const body={model:cfg.model||'claude-sonnet-4-20250514',max_tokens:maxTokens,messages};
  if(system) body.system=system;
  const res=await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  return res.json();
}

// ============================================================
// AI — CLASSIFY & SUMMARIZE
// ============================================================
async function classifyAllEmails() {
  const cfg=loadConfig();
  if(!cfg.claudeApiKey){showNotif('error','❌','Configure a chave da API do Claude');return;}
  const toProcess=state.emails.slice(0,cfg.batchSize||20);
  const tagMap={Financeiro:'tag-finance',Trabalho:'tag-work',Marketing:'tag-marketing',Pessoal:'tag-personal',Outros:''};
  for(let i=0;i<toProcess.length;i++){
    const email=toProcess[i];
    showStatus(`Classificando ${i+1}/${toProcess.length}...`);
    const folder=await classifyEmail(email);
    email.folder=folder; email.tag=tagMap[folder]||'';
    if(state.connected&&state.accessToken) await moveEmail(email.id,folder);
  }
  state.filteredEmails=[...state.emails];
  renderEmailList(); updateFolderCounts(); hideStatus();
  showNotif('success','✅',`${toProcess.length} e-mails classificados!`);
}
async function classifyEmail(email) {
  const cfg=loadConfig();
  if(!cfg.claudeApiKey) return email.folder||'Outros';
  const rulesText=state.rules.filter(r=>r.active).map(r=>`- Pasta "${r.folder}": ${r.criteria}`).join('\n');
  const bodyText=email.bodyText||stripHtml(email.bodyHtml||'')||email.preview||'';
  const prompt=`Classifique este e-mail. Responda APENAS com o nome da pasta.\n\nRegras:\n${rulesText}\n- "Outros": demais casos\n\nRemetente: ${email.from}\nAssunto: ${email.subject}\nCorpo: ${bodyText.substring(0,800)}\n\nPasta:`;
  try {
    const res=await claudeApi([{role:'user',content:prompt}],50);
    const text=res.content?.[0]?.text?.trim()||'Outros';
    return ['Financeiro','Trabalho','Marketing','Pessoal','Outros'].find(f=>text.includes(f))||'Outros';
  } catch { return 'Outros'; }
}
async function summarizeSelected() {
  if(!state.selectedEmail) return;
  document.getElementById('aiSummaryBox').style.display='block';
  document.getElementById('aiSummaryText').textContent='Gerando resumo...';
  const cfg=loadConfig();
  if(!cfg.claudeApiKey){document.getElementById('aiSummaryText').textContent='Configure a chave da API do Claude.';return;}
  const email=state.selectedEmail;
  const bodyText=email.bodyText||stripHtml(email.bodyHtml||'')||email.preview||'';
  const prompt=`Faça um resumo executivo em português, 2-3 frases. Destaque o ponto principal e ação necessária.\n\nDe: ${email.fromName} <${email.from}>\nAssunto: ${email.subject}\nCorpo:\n${bodyText.substring(0,1500)}`;
  try {
    const res=await claudeApi([{role:'user',content:prompt}],200);
    document.getElementById('aiSummaryText').textContent=res.content?.[0]?.text||'Não foi possível gerar o resumo.';
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
      onclick="selectEmail('${e.id}')">
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
        <button class="action-btn" onclick="openComposer('reply')">↩ Responder</button>
        <button class="action-btn" onclick="openComposer('replyAll')">↩↩ Resp. todos</button>
        <button class="action-btn" onclick="openComposer('forward')">→ Encaminhar</button>
        <button class="action-btn" onclick="deleteSelected()" style="color:var(--danger);border-color:rgba(226,75,74,0.3)">🗑 Excluir</button>
        <select class="move-select" onchange="moveSelected(this.value)">
          <option value="">Mover para...</option>
          <option>Trabalho</option><option>Financeiro</option><option>Marketing</option><option>Pessoal</option><option>Outros</option>
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
  renderEmailList(); updateFolderCounts();
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
  if(!cfg.claudeApiKey){removeTyping(typing);addChatMessage('assistant','Configure sua chave da API do Claude nas configurações.');return;}
  const emailsContext=state.emails.map(e=>{
    const body=e.bodyText||stripHtml(e.bodyHtml||'')||e.preview||'';
    return `[${e.dateFormatted||e.date}] De: ${e.fromName} <${e.from}> | Pasta: ${e.folder}\nAssunto: ${e.subject}\nCorpo: ${body.substring(0,300)}`;
  }).join('\n\n---\n\n');
  const systemPrompt=`Você é um assistente inteligente de e-mails do Outlook. Responda sempre em português brasileiro de forma clara.\n\nE-mails disponíveis (${state.emails.length}):\n${emailsContext}`;
  const history=state.chatHistory.map(m=>({role:m.role,content:m.text}));
  history.push({role:'user',content:msg});
  try {
    const data=await claudeApi(history,1000,systemPrompt);
    const reply=data.content?.[0]?.text||'Desculpe, não consegui processar.';
    removeTyping(typing); addChatMessage('assistant',reply);
    state.chatHistory.push({role:'user',text:msg},{role:'assistant',text:reply});
    if(state.chatHistory.length>20) state.chatHistory=state.chatHistory.slice(-20);
  } catch(e){removeTyping(typing);addChatMessage('assistant','Erro: '+e.message);}
}
function addChatMessage(role,text) {
  const msgs=document.getElementById('chatMessages');
  const div=document.createElement('div'); div.className=`msg ${role}`;
  const now=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  div.innerHTML=`<div class="msg-bubble">${formatText(text)}</div><div class="msg-time">${now}</div>`;
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight; return div;
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

// ============================================================
// RULES
// ============================================================
function renderRules() {
  const list=document.getElementById('rulesList');
  const pLabel={high:'Alta',medium:'Média',low:'Baixa'}, pColor={high:'rgba(226,75,74,0.15)',medium:'rgba(239,159,39,0.15)',low:'rgba(29,158,117,0.15)'}, pText={high:'var(--danger)',medium:'var(--warn)',low:'var(--success)'};
  list.innerHTML=state.rules.map(r=>`
    <div class="rule-card ${r.active?'active-rule':''}">
      <div class="rule-icon" style="background:${r.color||'var(--surface)'}">${r.icon||'📋'}</div>
      <div class="rule-info">
        <div class="rule-name">${escHtml(r.name)}</div>
        <div class="rule-desc">Mover para: <strong>${r.folder}</strong> — ${escHtml(r.criteria.substring(0,60))}${r.criteria.length>60?'...':''}</div>
        <div class="rule-actions">
          <span class="rule-tag" style="background:${pColor[r.priority]};color:${pText[r.priority]}">${pLabel[r.priority]||'Média'} prioridade</span>
          <button onclick="deleteRule('${r.id}')" style="background:none;border:none;color:var(--text3);font-size:12px;cursor:pointer;padding:0 4px;">Excluir</button>
        </div>
      </div>
      <label class="rule-toggle"><input type="checkbox" ${r.active?'checked':''} onchange="toggleRule('${r.id}',this.checked)"/><span class="toggle-slider"></span></label>
    </div>`).join('');
}
function toggleRule(id,active){const r=state.rules.find(r=>r.id===id);if(r){r.active=active;saveRules();}}
function deleteRule(id){state.rules=state.rules.filter(r=>r.id!==id);saveRules();renderRules();}
function saveRules(){localStorage.setItem('mailmind_rules',JSON.stringify(state.rules));}
function openAddRule(){document.getElementById('ruleModal').classList.add('open');}
function closeModal(){document.getElementById('ruleModal').classList.remove('open');}
function saveRule(){
  const name=document.getElementById('ruleName').value.trim(), criteria=document.getElementById('ruleCriteria').value.trim(), folder=document.getElementById('ruleFolder').value, priority=document.getElementById('rulePriority').value;
  if(!name||!criteria){showNotif('error','❌','Preencha nome e critério');return;}
  const icons={Financeiro:'💰',Trabalho:'💼',Marketing:'📢',Pessoal:'👤',Outros:'📋'};
  const colors={Financeiro:'rgba(29,158,117,0.15)',Trabalho:'rgba(124,110,250,0.15)',Marketing:'rgba(239,159,39,0.15)',Pessoal:'rgba(240,153,123,0.15)',Outros:'rgba(136,135,128,0.15)'};
  state.rules.push({id:'r'+Date.now(),name,criteria,folder,priority,active:true,icon:icons[folder]||'📋',color:colors[folder]||''});
  saveRules();renderRules();closeModal();
  document.getElementById('ruleName').value='';document.getElementById('ruleCriteria').value='';
  showNotif('success','✅','Regra adicionada!');
}

// ============================================================
// FILTERS
// ============================================================
function setFilter(filter,btn){
  state.currentFilter=filter;state.currentFolder=null;
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  if(btn)btn.classList.add('active');
  document.getElementById('panelTitle').textContent='Caixa de Entrada';
  applyFilters();
}
function filterByFolder(folder){
  state.currentFolder=folder;state.currentFilter='all';
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  document.getElementById('panelTitle').textContent=folder;applyFilters();
}
function filterEmails(){applyFilters();}
function applyFilters(){
  const search=document.getElementById('searchInput').value.toLowerCase();
  let emails=[...state.emails];
  if(state.currentFolder)emails=emails.filter(e=>e.folder===state.currentFolder);
  else if(state.currentFilter==='unread')emails=emails.filter(e=>e.unread);
  else if(['Trabalho','Financeiro','Marketing','Pessoal'].includes(state.currentFilter))emails=emails.filter(e=>e.folder===state.currentFilter);
  if(search)emails=emails.filter(e=>e.subject.toLowerCase().includes(search)||e.from.toLowerCase().includes(search)||e.preview.toLowerCase().includes(search));
  state.filteredEmails=emails;renderEmailList();
}
function updateFolderCounts(){['Trabalho','Financeiro','Marketing','Pessoal','Outros'].forEach(f=>{const el=document.getElementById('cnt-'+f);if(el)el.textContent=state.emails.filter(e=>e.folder===f).length;});}
function updateUnreadBadge(){document.getElementById('unreadBadge').textContent=state.emails.filter(e=>e.unread).length;}

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
// BOOTSTRAP
// ============================================================
init();
document.addEventListener('DOMContentLoaded', initResize);
// Fallback caso DOMContentLoaded já tenha disparado
if (document.readyState !== 'loading') initResize();
