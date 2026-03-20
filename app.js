// ============================================================
// app.js — Entry point (módulo ES)
// Importa todos os módulos e expõe funções ao HTML via window.*
// ============================================================
import { state, DEMO_EMAILS, DEFAULT_RULES } from './js/state.js';
import { loadConfig, connectOutlook, restoreToken, fetchEmails } from './js/api.js';
import { renderEmailList, selectEmail, summarizeSelected, moveSelected,
         replyEmail, classifyAllEmails, setFilter, filterByFolder,
         filterEmails, updateFolderCounts, updateUnreadBadge } from './js/email.js';
import { sendChat, handleChatKey, useSuggestion, autoResize } from './js/chat.js';
import { showSetupStep, setupNext, setupBack, saveSetup,
         populateConfigPanel, saveConfig, toggleVisibility, resetConfig,
         renderRules, toggleRule, deleteRule, openAddRule, closeModal, saveRule } from './js/config.js';

// ── Init ─────────────────────────────────────────────────────
function init() {
  const cfg = loadConfig();
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
  state.rules  = JSON.parse(localStorage.getItem('mailmind_rules') || 'null') || DEFAULT_RULES;
  state.emails = DEMO_EMAILS;
  state.filteredEmails = [...state.emails];

  // Restaura token do sessionStorage se ainda válido (sobrevive a F5)
  if (restoreToken()) {
    fetchEmails().then(() => {
      renderEmailList();
      updateFolderCounts();
      updateUnreadBadge();
    });
  } else {
    renderEmailList();
    updateFolderCounts();
    updateUnreadBadge();
  }
  renderRules();
}

// ── View / Tab switching ──────────────────────────────────────
function switchView(view, btn) {
  state.currentView = view;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (btn) btn.classList.add('active');

  document.getElementById('emailPanel').style.display  = view === 'emails' ? 'flex'  : 'none';
  document.getElementById('contentArea').style.display = view === 'emails' ? 'flex'  : 'none';
  document.getElementById('rulesPanel').style.display  = view === 'rules'  ? 'block' : 'none';
  document.getElementById('configPanel').style.display = view === 'config' ? 'block' : 'none';

  if (view === 'config') populateConfigPanel();
}

function switchTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('detailTab').classList.toggle('active', tab === 'detail');
  document.getElementById('chatTab').classList.toggle('active', tab === 'chat');
}

// ── Expõe ao HTML (necessário com type="module") ──────────────
Object.assign(window, {
  setupNext, setupBack, saveSetup,
  saveConfig, toggleVisibility, resetConfig,
  connectOutlook,
  selectEmail, summarizeSelected, moveSelected, replyEmail,
  classifyAllEmails, setFilter, filterByFolder, filterEmails,
  toggleRule, deleteRule, openAddRule, closeModal, saveRule,
  sendChat, handleChatKey, useSuggestion, autoResize,
  switchView, switchTab, loadApp,
});

init();
