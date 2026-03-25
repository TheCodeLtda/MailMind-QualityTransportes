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
    if (n.emailId && typeof selectEmail === 'function') {
        // Garante que a visualização de e-mails esteja ativa antes de selecionar o e-mail
        if (state.currentView !== 'emails') {
            switchView('emails', null);
        }
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

function startPolling() {
  setInterval(async () => {
    if (!state.accessToken) return;
    // Lógica simplificada de polling para novos e-mails
    const res = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=1', {
      headers: { Authorization: `Bearer ${state.accessToken}` }
    });
    const data = await res.json();
    if (data.value.length && data.value[0].id !== state.emails[0]?.id) {
      addNotification('mail', 'Novo E-mail', data.value[0].subject, data.value[0].id);
      fetchEmails();
    }
  }, 60000);
}

function initResize() { /* Lógica de redimensionamento dos painéis */ }