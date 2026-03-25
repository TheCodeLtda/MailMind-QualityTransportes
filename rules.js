/**
 * RULES.JS - Regras de Classificação IA
 */

function renderRules() {
  const list = document.getElementById('rulesList');
  if (!state.rules.length) {
    list.innerHTML = '<div class="notif-empty">Nenhuma regra criada.</div>';
    return;
  }
  list.innerHTML = state.rules.map(r => `
    <div class="rule-card ${r.active?'active-rule':''}">
      <div class="rule-info">
        <div class="rule-name">${escHtml(r.name)}</div>
        <div class="rule-desc">Mover para: ${escHtml(r.folder)}</div>
      </div>
      <div class="rule-right">
        <label class="rule-toggle">
          <input type="checkbox" ${r.active?'checked':''} onchange="toggleRule('${r.id}', this.checked)"/>
          <span class="toggle-slider"></span>
        </label>
        <button onclick="deleteRule('${r.id}')">🗑</button>
      </div>
    </div>`).join('');
}

function toggleRule(id, active) {
  const r = state.rules.find(r => r.id === id);
  if (r) { r.active = active; saveRules(); }
}

function deleteRule(id) {
  if (!confirm('Excluir regra?')) return;
  state.rules = state.rules.filter(r => r.id !== id);
  saveRules(); renderRules();
}

function saveRules() { localStorage.setItem('mailmind_rules', JSON.stringify(state.rules)); }