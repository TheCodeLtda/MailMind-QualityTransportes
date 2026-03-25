/**
 * UI.JS - Interface, Notificações e Polling
 */

function showStatus(text) {
  document.getElementById('statusText').textContent = text;
  document.getElementById('statusBar').classList.add('show');
}

function hideStatus() { document.getElementById('statusBar').classList.remove('show'); }

function showNotif(type, icon, text) {
  const n = document.getElementById('notification');
  document.getElementById('notifIcon').textContent = icon;
  document.getElementById('notifText').textContent = text;
  n.className = `notification ${type} show`;
  setTimeout(() => n.classList.remove('show'), 4000);
}

function toggleNotificationCenter() {
  const center = document.getElementById('notifCenter');
  const overlay = document.getElementById('notifOverlay');
  const isOpen = center.classList.toggle('open');
  overlay.classList.toggle('open', isOpen);
  if (isOpen) renderNotifications();
}

function addNotification(type, title, message, emailId = null) {
  const notif = { id: Date.now(), type, title, message, emailId, time: new Date(), read: false };
  state.notifications.unshift(notif);
  saveNotifications();
  updateNotifBadge();
  if (document.getElementById('notifCenter').classList.contains('open')) renderNotifications();
}

function updateNotifBadge() {
  const unread = state.notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notifBadge');
  badge.style.display = unread > 0 ? 'flex' : 'none';
  badge.textContent = unread;
}

function renderNotifications() {
  const list = document.getElementById('notifList');
  if (!list) return;

  const filtered = state.notifications.filter(n => {
    if (state.notifFilter === 'unread') return !n.read;
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="notif-empty">Nenhuma notificação ${state.notifFilter === 'unread' ? 'não lida ' : ''}encontrada.</div>`;
    return;
  }

  list.innerHTML = filtered.map(n => {
    const icon = n.type === 'mail' ? '📧' : n.type === 'ai' ? '🤖' : '🔔';
    const time = formatRelativeDate(n.time);
    return `
      <div class="notif-item ${n.read ? 'read' : ''}" onclick="markNotifRead(${n.id})">
        <div class="notif-icon">${icon}</div>
        <div class="notif-content">
          <div class="notif-title">${escHtml(n.title)}</div>
          <div class="notif-message">${escHtml(n.message)}</div>
          <div class="notif-time">${time}</div>
        </div>
        ${!n.read ? '<div class="notif-unread-dot"></div>' : ''}
      </div>`;
  }).join('');
}

function markNotifRead(id) {
  const n = state.notifications.find(notif => notif.id === id);
  if (n) {
    n.read = true;
    saveNotifications();
    updateNotifBadge();
    renderNotifications();
    if (n.emailId && state.currentView === 'emails' && typeof selectEmail === 'function') {
        selectEmail(n.emailId);
        toggleNotificationCenter();
    }
  }
}

function markAllNotifsRead() {
  state.notifications.forEach(n => n.read = true);
  saveNotifications();
  updateNotifBadge();
  renderNotifications();
}

function clearNotifications() {
  state.notifications = [];
  saveNotifications();
  updateNotifBadge();
  renderNotifications();
}

function setNotifFilter(filter) {
  state.notifFilter = filter;
  document.querySelectorAll('.notif-filter').forEach(btn => {
    btn.classList.toggle('active', btn.id === (filter === 'all' ? 'filterNotifAll' : 'filterNotifUnread'));
  });
  renderNotifications();
}

function saveNotifications() {
  localStorage.setItem('mm_notifications', JSON.stringify(state.notifications.slice(0, 50)));
}

function switchView(view, btn) {
  state.currentView = view;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('emailPanel').style.display = view === 'emails' ? 'flex' : 'none';
  document.getElementById('rulesPanel').style.display = view === 'rules' ? 'block' : 'none';
  document.getElementById('configPanel').style.display = view === 'config' ? 'block' : 'none';
}

function switchTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('detailTab').classList.toggle('active', tab === 'detail');
  document.getElementById('chatTab').classList.toggle('active', tab === 'chat');
}


/**
 * SETUP WIZARD
 */
let _currentSetupStep = 1;
function showSetupStep(step) {
  _currentSetupStep = step;
  const fill = document.getElementById('setupProgressFill');
  if (fill) fill.style.width = (step === 1 ? '0%' : step === 2 ? '50%' : '100%');
  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i + 1 === step);
    dot.classList.toggle('done', i + 1 < step);
  });
  document.querySelectorAll('.setup-step-panel').forEach((panel, i) => {
    panel.classList.toggle('active', i + 1 === step);
  });
  if (step === 3) {
    const key = document.getElementById('setupApiKey')?.value || '';
    const cid = document.getElementById('setupClientId')?.value || '';
    document.getElementById('sumApiKey').textContent = key.length > 10 ? key.substring(0, 10) + '...' : key;
    document.getElementById('sumClientId').textContent = cid || 'Modo Demo';
  }
}
function setupNext() {
  if (_currentSetupStep === 1) {
    if (!document.getElementById('setupApiKey').value.trim()) { showNotif('error','⚠️','Chave API obrigatória'); return; }
    showSetupStep(2);
  } else if (_currentSetupStep === 2) { showSetupStep(3); }
  else { finishSetup(); }
}
function setupBack() { if (_currentSetupStep > 1) showSetupStep(_currentSetupStep - 1); }
function finishSetup() {
  const cfg = {
    claudeApiKey: document.getElementById('setupApiKey').value.trim(),
    clientId: document.getElementById('setupClientId').value.trim(),
    tenantId: document.getElementById('setupTenantId').value.trim() || 'common',
    redirectUri: document.getElementById('setupRedirectUri').value.trim() || window.location.origin,
    autoClassify: true, useOutlookFolders: true, batchSize: 20
  };
  localStorage.setItem('mailmind_config', JSON.stringify(cfg));
  document.getElementById('setupScreen').classList.add('hidden');
  loadApp(cfg);
  showNotif('success', '🚀', 'Configuração concluída!');
}

let _pollingTimer = null;
function startPolling() {
  stopPolling();
  _pollingTimer = setInterval(async () => {
    if (!state.accessToken || !state.connected) return;
    if (state.currentFolder && state.currentFolder !== 'Caixa de Entrada') return;
    checkNewEmails();
  }, 60000);
}
function stopPolling() { if (_pollingTimer) { clearInterval(_pollingTimer); _pollingTimer = null; } }

function initResize() { /* Lógica de redimensionamento implementada em app.js ou ui.js */ }

function initResize() { /* Lógica de redimensionamento dos painéis */ }