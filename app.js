/**
 * APP.JS - Entrada Principal
 */
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
  state.customFilters = JSON.parse(localStorage.getItem('mailmind_custom_filters') || '[]');

  // Renderiza pastas imediatamente (com botões ···)
  renderSidebarFolders();
  renderRules();
  renderFilterBar(); // Renderiza filtros personalizados
  renderEmailList();
  if (typeof updateNotifBadge === 'function') updateNotifBadge();
  updateUnreadBadge();
  renderChatHistory();

  // Restaura token do sessionStorage (sobrevive F5 e fechar/abrir aba)
  if (typeof restoreToken === 'function' && restoreToken()) {
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
  renderConfigFilters();
}
function saveConfig() {
  const cfg={
    claudeApiKey:document.getElementById('configApiKey').value.trim(),
    model:'gemini-2.5-flash', // Modelo fixo
    clientId:document.getElementById('configClientId').value.trim(),
    tenantId:document.getElementById('configTenantId').value.trim()||'common',
    redirectUri:document.getElementById('configRedirectUri').value.trim()||window.location.origin,
    autoClassify:document.getElementById('autoClassify').checked,
    organizeInRoot:true, // Padrão: sempre organizar em subpastas de "MailMind"
    batchSize:parseInt(document.getElementById('configBatchSize').value)||20,
    useOutlookFolders:document.getElementById('useOutlookFolders')?.checked||false,
  };
  localStorage.setItem('mailmind_config',JSON.stringify(cfg));
  state.config=cfg;
  state.useOutlookFolders=cfg.useOutlookFolders;
  // Atualiza sidebar se conectado
  if (state.connected) {
    if (cfg.useOutlookFolders) loadOutlookFolders();
  }
  showNotif('success','✅','Configurações salvas e aplicadas com sucesso!');
}
function toggleVisibility(inputId,btn) {
  const input=document.getElementById(inputId);
  if(input.type==='password'){input.type='text';btn.textContent='🙈';}else{input.type='password';btn.textContent='👁';}
}
function resetConfig() {
  if(!confirm('Apagar todas as configurações e voltar ao setup? Continuar?')) return;
  if (typeof stopPolling === 'function') stopPolling();
  localStorage.removeItem('mailmind_config');
  localStorage.removeItem('mailmind_rules');
  localStorage.removeItem('mm_token');
  localStorage.removeItem('mm_expires_at');
  localStorage.removeItem('mm_fixed_folders');
  sessionStorage.removeItem('mm_token');
  sessionStorage.removeItem('mm_expires_at');
  location.reload();
}
