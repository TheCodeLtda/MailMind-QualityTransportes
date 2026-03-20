// ============================================================
// config.js — Setup wizard, configurações e regras de IA
// ============================================================
import { state, DEFAULT_RULES } from './state.js';
import { loadConfig }           from './api.js';
import { escHtml, showNotif }   from './utils.js';

// ── Setup wizard ─────────────────────────────────────────────
export function showSetupStep(step) {
  [1,2,3].forEach(n => {
    document.getElementById('stepPanel' + n)?.classList.toggle('active', n === step);
    const dot = document.getElementById('dot' + n);
    if (dot) {
      dot.classList.toggle('active', n <= step);
      dot.classList.toggle('done',   n < step);
    }
  });
  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;
  document.getElementById('setupProgressFill').style.width = pct + '%';
}

export function setupNext(currentStep) {
  if (currentStep === 1) {
    const key = document.getElementById('claudeApiKey').value.trim();
    if (!key || !key.startsWith('sk-')) {
      showNotif('error', '❌', 'Insira uma chave válida (começa com sk-)'); return;
    }
    showSetupStep(2);
  } else if (currentStep === 2) {
    const clientId = document.getElementById('msClientId').value.trim();
    if (!clientId) { showNotif('error', '❌', 'Insira o Client ID do Azure'); return; }
    const tenantId = document.getElementById('msTenantId').value.trim() || 'common';
    document.getElementById('setupSummary').innerHTML = `
      <div class="summary-row"><span>Chave Claude</span><span>sk-ant-••••••••</span></div>
      <div class="summary-row"><span>Client ID</span><span>${escHtml(clientId.substring(0,8))}...</span></div>
      <div class="summary-row"><span>Tenant ID</span><span>${escHtml(tenantId)}</span></div>
      <div class="summary-row"><span>Redirect URI</span><span>${escHtml(window.location.origin)}</span></div>`;
    showSetupStep(3);
  }
}

export function setupBack(currentStep) { showSetupStep(currentStep - 1); }

export function saveSetup() {
  const key      = document.getElementById('claudeApiKey').value.trim();
  const clientId = document.getElementById('msClientId').value.trim();
  const tenantId = document.getElementById('msTenantId').value.trim() || 'common';
  if (!key) { showNotif('error', '❌', 'Insira sua chave da API do Claude'); return; }

  const cfg = { claudeApiKey: key, clientId, tenantId, redirectUri: window.location.origin,
                model: 'claude-sonnet-4-20250514', autoClassify: true, batchSize: 20 };
  localStorage.setItem('mailmind_config', JSON.stringify(cfg));
  document.getElementById('setupScreen').classList.add('hidden');
  window.loadApp(cfg);
  showNotif('success', '✅', 'Configuração salva! Bem-vindo ao MailMind.');
}

// ── Config panel ─────────────────────────────────────────────
export function populateConfigPanel() {
  let cfg = {};
  try { cfg = JSON.parse(localStorage.getItem('mailmind_config') || '{}'); } catch {}
  if (!cfg.claudeApiKey && state.config?.claudeApiKey) cfg = state.config;

  const fields = {
    configApiKey:     cfg.claudeApiKey || '',
    configClientId:   cfg.clientId     || '',
    configTenantId:   cfg.tenantId     || '',
    configRedirectUri: cfg.redirectUri || window.location.origin,
    configModel:      cfg.model        || 'claude-sonnet-4-20250514',
    configBatchSize:  cfg.batchSize    || 20,
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });
  const ac = document.getElementById('autoClassify');
  if (ac) ac.checked = cfg.autoClassify !== false;
}

export function saveConfig() {
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

export function toggleVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') { input.type = 'text';     btn.textContent = '🙈'; }
  else                           { input.type = 'password'; btn.textContent = '👁'; }
}

export function resetConfig() {
  if (!confirm('Isso vai apagar todas as configurações e voltar ao setup inicial. Continuar?')) return;
  localStorage.removeItem('mailmind_config');
  localStorage.removeItem('mailmind_rules');
  sessionStorage.removeItem('mm_token');
  sessionStorage.removeItem('mm_expires_at');
  location.reload();
}

// ── Regras ────────────────────────────────────────────────────
export function renderRules() {
  const list          = document.getElementById('rulesList');
  const priorityLabel = { high: 'Alta', medium: 'Média', low: 'Baixa' };
  const priorityColor = { high: 'rgba(226,75,74,0.15)', medium: 'rgba(239,159,39,0.15)', low: 'rgba(29,158,117,0.15)' };
  const priorityText  = { high: 'var(--danger)', medium: 'var(--warn)', low: 'var(--success)' };

  list.innerHTML = state.rules.map(r => `
    <div class="rule-card ${r.active ? 'active-rule' : ''}">
      <div class="rule-icon" style="background:${r.color || 'var(--surface)'}">${r.icon || '📋'}</div>
      <div class="rule-info">
        <div class="rule-name">${escHtml(r.name)}</div>
        <div class="rule-desc">
          Mover para: <strong>${r.folder}</strong> — ${escHtml(r.criteria.substring(0,60))}${r.criteria.length > 60 ? '...' : ''}
        </div>
        <div class="rule-actions">
          <span class="rule-tag" style="background:${priorityColor[r.priority]};color:${priorityText[r.priority]}">
            ${priorityLabel[r.priority] || 'Média'} prioridade
          </span>
          <button onclick="deleteRule('${r.id}')"
            style="background:none;border:none;color:var(--text3);font-size:12px;cursor:pointer;padding:0 4px;">
            Excluir
          </button>
        </div>
      </div>
      <label class="rule-toggle">
        <input type="checkbox" ${r.active ? 'checked' : ''} onchange="toggleRule('${r.id}', this.checked)"/>
        <span class="toggle-slider"></span>
      </label>
    </div>`).join('');
}

export function toggleRule(id, active) {
  const rule = state.rules.find(r => r.id === id);
  if (rule) { rule.active = active; saveRules(); }
}

export function deleteRule(id) {
  state.rules = state.rules.filter(r => r.id !== id);
  saveRules();
  renderRules();
}

function saveRules() { localStorage.setItem('mailmind_rules', JSON.stringify(state.rules)); }

export function openAddRule()  { document.getElementById('ruleModal').classList.add('open'); }
export function closeModal()   { document.getElementById('ruleModal').classList.remove('open'); }

export function saveRule() {
  const name     = document.getElementById('ruleName').value.trim();
  const criteria = document.getElementById('ruleCriteria').value.trim();
  const folder   = document.getElementById('ruleFolder').value;
  const priority = document.getElementById('rulePriority').value;
  if (!name || !criteria) { showNotif('error', '❌', 'Preencha nome e critério da regra'); return; }

  const icons  = { Financeiro:'💰', Trabalho:'💼', Marketing:'📢', Pessoal:'👤', Outros:'📋' };
  const colors = { Financeiro:'rgba(29,158,117,0.15)', Trabalho:'rgba(124,110,250,0.15)', Marketing:'rgba(239,159,39,0.15)', Pessoal:'rgba(240,153,123,0.15)', Outros:'rgba(136,135,128,0.15)' };

  state.rules.push({ id:'r'+Date.now(), name, criteria, folder, priority,
                     active:true, icon:icons[folder]||'📋', color:colors[folder]||'' });
  saveRules();
  renderRules();
  closeModal();
  document.getElementById('ruleName').value = '';
  document.getElementById('ruleCriteria').value = '';
  showNotif('success', '✅', 'Regra adicionada!');
}
