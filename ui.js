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
  localStorage.setItem('mm_notifications', JSON.stringify(state.notifications.slice(0, 50)));
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
  list.innerHTML = state.notifications.map(n => `
    <div class="notif-item ${n.read ? 'read' : ''}" onclick="markNotifRead(${n.id})">
      <div class="notif-title">${escHtml(n.title)}</div>
      <div class="notif-message">${escHtml(n.message)}</div>
    </div>`).join('');
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