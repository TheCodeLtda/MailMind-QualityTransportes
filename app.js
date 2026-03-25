/**
 * APP.JS - Coordenação e Inicialização
 */
function init() {
  const cfg = loadConfig();
  if (!cfg.claudeApiKey) {
    if (typeof showSetupStep === 'function') showSetupStep(1);
    document.getElementById('setupScreen').classList.remove('hidden');
  } else {
    document.getElementById('setupScreen').classList.add('hidden');
    loadApp(cfg);
  }
}

function loadApp(cfg) {
  state.config = cfg;
  state.rules = JSON.parse(localStorage.getItem('mailmind_rules') || 'null') || DEFAULT_RULES;
  state.emails = DEMO_EMAILS;
  state.filteredEmails = [...state.emails];
  state.useOutlookFolders = cfg.useOutlookFolders === true;
  state.chatHistory = JSON.parse(localStorage.getItem('mailmind_chat_history') || '[]');
  state.customFilters = JSON.parse(localStorage.getItem('mailmind_custom_filters') || '[]');

  renderSidebarFolders();
  renderRules();
  renderFilterBar();
  renderEmailList();
  if (typeof updateNotifBadge === 'function') updateNotifBadge();
  updateUnreadBadge();
  renderChatHistory();

  if (typeof restoreToken === 'function' && restoreToken()) {
    if (state.useOutlookFolders) loadOutlookFolders();
    fetchEmails().then(() => startPolling());
  }
}

/**
 * CONFIGURAÇÕES GLOBAIS
 */
function populateConfigPanel() {
  const cfg = loadConfig();
  const fields = { configApiKey: cfg.claudeApiKey || '', configClientId: cfg.clientId || '', configTenantId: cfg.tenantId || '', configRedirectUri: cfg.redirectUri || window.location.origin, configBatchSize: cfg.batchSize || 20 };
  Object.entries(fields).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
  document.getElementById('autoClassify').checked = cfg.autoClassify !== false;
  document.getElementById('useOutlookFolders').checked = cfg.useOutlookFolders === true;
  if (typeof renderConfigFilters === 'function') renderConfigFilters();
}

function saveConfig() {
  const cfg = {
    claudeApiKey: document.getElementById('configApiKey').value.trim(),
    model: 'gemini-1.5-flash-latest',
    clientId: document.getElementById('configClientId').value.trim(),
    tenantId: document.getElementById('configTenantId').value.trim() || 'common',
    redirectUri: document.getElementById('configRedirectUri').value.trim() || window.location.origin,
    autoClassify: document.getElementById('autoClassify').checked,
    batchSize: parseInt(document.getElementById('configBatchSize').value) || 20,
    useOutlookFolders: document.getElementById('useOutlookFolders').checked
  };
  localStorage.setItem('mailmind_config', JSON.stringify(cfg));
  state.config = cfg;
  showNotif('success', '✅', 'Configurações salvas!');
}

function resetConfig() {
  if (!confirm('Apagar tudo?')) return;
  localStorage.clear();
  location.reload();
}

init();
document.addEventListener('DOMContentLoaded', initResize);
