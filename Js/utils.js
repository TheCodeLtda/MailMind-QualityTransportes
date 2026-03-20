// ============================================================
// utils.js — Funções utilitárias puras
// ============================================================

export function escHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatText(str) {
  return escHtml(str)
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function wrapTextAsHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

export function getAvatarColor(email) {
  const colors = ['#7C6EFA','#5DCAA5','#EF9F27','#F0997B','#E24B4A','#4AACE2','#B26EFA'];
  let hash = 0;
  for (let i = 0; i < (email || '').length; i++)
    hash = (hash * 31 + email.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatRelativeDate(iso) {
  if (!iso) return '';
  const now     = new Date();
  const date    = new Date(iso);
  const diffMs  = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);

  if (diffMin < 1)   return 'agora';
  if (diffMin < 60)  return `${diffMin}min`;
  if (diffH   < 24)  return `${diffH}h`;
  if (diffD   === 1) return 'ontem';
  if (diffD   < 7)   return `${diffD}d`;

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('pt-BR', sameYear
    ? { day: '2-digit', month: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function getAttachIcon(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  const map = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📊', pptx: '📊', zip: '🗜️', rar: '🗜️',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️',
    mp4: '🎬', mp3: '🎵', txt: '📃',
  };
  return map[ext] || '📎';
}

export function showStatus(text) {
  document.getElementById('statusText').textContent = text;
  document.getElementById('statusBar').classList.add('show');
}

export function hideStatus() {
  document.getElementById('statusBar').classList.remove('show');
}

export function showNotif(type, icon, text) {
  const n = document.getElementById('notification');
  document.getElementById('notifIcon').textContent = icon;
  document.getElementById('notifText').textContent  = text;
  n.className = `notification ${type} show`;
  setTimeout(() => n.classList.remove('show'), 4000);
}
