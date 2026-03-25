/**
 * UTILS.JS - Funções auxiliares puras e formatação
 */
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
  if (diffMin<1) return 'agora';
  if (diffMin<60) return diffMin+'min';
  if (diffH<24) return diffH+'h';
  if (diffD===1) return 'ontem';
  if (diffD<7) return diffD+'d';
  return date.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'});
}
function getAttachIcon(filename) {
  const ext=(filename||'').split('.').pop().toLowerCase();
  const map={pdf:'📄',doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',zip:'🗜️',jpg:'🖼️',png:'🖼️',mp4:'🎬',txt:'📃'};
  return map[ext]||'📎';
}