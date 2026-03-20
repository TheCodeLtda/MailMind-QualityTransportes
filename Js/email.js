// ============================================================
// email.js — Renderização de e-mails e IA de classificação
// ============================================================
import { state }                                  from './state.js';
import { claudeApi, fetchAttachments, moveEmail, loadConfig } from './api.js';
import { escHtml, stripHtml, getInitials, getAvatarColor,
         formatRelativeDate, getAttachIcon, showStatus,
         hideStatus, showNotif }                  from './utils.js';

// ── Lista ─────────────────────────────────────────────────────
export function renderEmailList() {
  const list   = document.getElementById('emailList');
  const emails = state.filteredEmails;

  if (!emails.length) {
    list.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--text3);font-size:13px;">Nenhum e-mail encontrado</div>';
    return;
  }

  list.innerHTML = emails.map(e => {
    const initials = getInitials(e.fromName || e.from);
    const color    = getAvatarColor(e.from);
    const relDate  = formatRelativeDate(e.date);
    const selected = state.selectedEmail?.id === e.id;

    return `
    <div class="email-item ${e.unread ? 'unread' : ''} ${selected ? 'selected' : ''}"
         onclick="selectEmail('${e.id}')">
      <div class="email-item-inner">
        <div class="email-avatar-col">
          <div class="list-avatar" style="background:${color}">${initials}</div>
          ${e.unread ? '<div class="unread-dot"></div>' : ''}
        </div>
        <div class="email-content-col">
          <div class="email-meta">
            <div class="email-sender">${escHtml(e.fromName || e.from)}</div>
            <div class="email-date-row">
              ${e.importance === 'high' ? '<span class="importance-icon" title="Alta importância">🔴</span>' : ''}
              ${e.hasAttachments ? '<span class="attach-icon" title="Tem anexos">📎</span>' : ''}
              <span class="email-date">${relDate}</span>
            </div>
          </div>
          <div class="email-subject">${escHtml(e.subject)}</div>
          <div class="email-bottom-row">
            <div class="email-preview">${escHtml(e.preview)}</div>
            ${e.folder && e.tag ? `<span class="email-tag ${e.tag}">${e.folder}</span>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

export function selectEmail(id) {
  state.selectedEmail = state.emails.find(e => e.id === id);
  if (!state.selectedEmail) return;
  state.selectedEmail.unread = false;
  renderEmailList();
  renderEmailDetail(state.selectedEmail);
  window.switchTab('detail', document.querySelectorAll('.tab')[0]);
  updateUnreadBadge();
}

// ── Detalhe ───────────────────────────────────────────────────
export async function renderEmailDetail(email) {
  const detail  = document.getElementById('detailTab');
  const initials = getInitials(email.fromName || email.from);
  const color    = getAvatarColor(email.from);
  const toList   = (email.to || []).join(', ') || '—';
  const dateStr  = email.date ? new Date(email.date).toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : email.dateFormatted || '';

  detail.innerHTML = `
    <div class="detail-header">
      <div class="detail-subject">${escHtml(email.subject)}</div>
      <div class="detail-from">
        <div class="avatar" style="background:${color}">${initials}</div>
        <div class="from-info">
          <div class="from-name">${escHtml(email.fromName || email.from)}</div>
          <div class="from-email">${escHtml(email.from)}</div>
        </div>
        ${email.importance === 'high' ? '<span style="font-size:11px;background:rgba(226,75,74,0.15);color:var(--danger);padding:3px 8px;border-radius:6px;font-weight:500;">Alta prioridade</span>' : ''}
      </div>
      <div class="detail-recipients">
        <span class="recipient-label">Para:</span> <span class="recipient-value">${escHtml(toList)}</span>
        ${email.cc?.length ? `<br/><span class="recipient-label">CC:</span> <span class="recipient-value">${escHtml(email.cc.join(', '))}</span>` : ''}
        <br/><span class="recipient-label">Data:</span> <span class="recipient-value">${dateStr}</span>
      </div>
      <div class="detail-actions">
        <button class="action-btn primary" onclick="summarizeSelected()">✨ Resumir com IA</button>
        <button class="action-btn" onclick="replyEmail()">↩ Responder</button>
        <select class="move-select" onchange="moveSelected(this.value)">
          <option value="">Mover para...</option>
          <option>Trabalho</option><option>Financeiro</option>
          <option>Marketing</option><option>Pessoal</option><option>Outros</option>
        </select>
      </div>
    </div>
    <div class="ai-summary-box" id="aiSummaryBox" style="display:none">
      <div class="ai-summary-label">✨ Resumo IA</div>
      <div class="ai-summary-text" id="aiSummaryText">Gerando resumo...</div>
    </div>
    <div class="detail-divider"></div>
    <div id="attachmentsArea"></div>
    <div id="emailBodyArea" class="email-body-area">
      <div class="body-loading"><div class="spinner"></div> Carregando...</div>
    </div>`;

  renderEmailBody(email);
  if (email.hasAttachments && state.accessToken) loadAndRenderAttachments(email);
}

async function renderEmailBody(email) {
  const area = document.getElementById('emailBodyArea');
  if (!area) return;

  let html = email.bodyHtml || '';
  if (html) {
    if (state.accessToken && email.hasAttachments) html = await resolveCidImages(email.id, html);

    html = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');

    area.innerHTML = '';
    const host   = document.createElement('div');
    host.className = 'email-shadow-host';
    area.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display:block; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
                font-size:14px; line-height:1.7; color:#e8e6f0; word-wrap:break-word; overflow-wrap:break-word; }
        * { max-width:100% !important; box-sizing:border-box; }
        img { height:auto !important; border-radius:4px; }
        a { color:#7C6EFA; }
        table { border-collapse:collapse; width:auto; }
        td,th { padding:4px 8px; vertical-align:top; }
        blockquote { border-left:3px solid rgba(255,255,255,0.15); margin:8px 0; padding:4px 12px; color:#888; }
        pre,code { background:rgba(255,255,255,0.07); border-radius:4px; padding:2px 6px; font-size:13px; white-space:pre-wrap; }
        p { margin:0 0 10px; }
        h1,h2,h3,h4 { color:#e8e6f0; margin:12px 0 6px; }
        [bgcolor] { background-color:transparent !important; }
        [style*="background:#fff"],[style*="background: #fff"],
        [style*="background:white"],[style*="background: white"],
        [style*="background:#ffffff"],[style*="background: #ffffff"] { background:transparent !important; }
        [style*="color:#000"],[style*="color: #000"],
        [style*="color:black"],[style*="color: black"],
        [style*="color:#333"],[style*="color: #333"] { color:#c8c6d8 !important; }
      </style>
      <div>${html}</div>`;
  } else {
    const text = email.bodyText || email.preview || '';
    area.innerHTML = `<div class="detail-body">${escHtml(text).replace(/\n/g, '<br>')}</div>`;
  }
}

async function resolveCidImages(emailId, html) {
  const cidPattern = /src=["']cid:([^"']+)["']/gi;
  if (![...html.matchAll(cidPattern)].length) return html;
  try {
    const attachments = await fetchAttachments(emailId);
    for (const att of attachments) {
      if (att['@odata.type'] === '#microsoft.graph.fileAttachment' && att.contentId) {
        const cid    = att.contentId.replace(/[<>]/g, '');
        const data   = `data:${att.contentType};base64,${att.contentBytes}`;
        html = html.replace(new RegExp(`cid:${cid.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`, 'gi'), data);
      }
    }
  } catch {}
  return html;
}

async function loadAndRenderAttachments(email) {
  const area = document.getElementById('attachmentsArea');
  if (!area) return;
  const attachments = await fetchAttachments(email.id);
  const real = attachments.filter(a =>
    a['@odata.type'] === '#microsoft.graph.fileAttachment' && !a.isInline
  );
  if (!real.length) return;

  const items = real.map(a => {
    const sizeKb  = a.size ? Math.round(a.size / 1024) : 0;
    const icon    = getAttachIcon(a.name);
    const dataUrl = a.contentBytes ? `data:${a.contentType};base64,${a.contentBytes}` : null;
    const isImg   = a.contentType?.startsWith('image/');
    return `
      <div class="attachment-item">
        <div class="attach-preview">
          ${isImg && dataUrl ? `<img src="${dataUrl}" class="attach-thumb" alt="${escHtml(a.name)}"/>` : `<span class="attach-file-icon">${icon}</span>`}
        </div>
        <div class="attach-info">
          <div class="attach-name">${escHtml(a.name)}</div>
          <div class="attach-size">${sizeKb > 0 ? sizeKb + ' KB' : ''}</div>
        </div>
        ${dataUrl ? `<a class="attach-download" href="${dataUrl}" download="${escHtml(a.name)}" title="Baixar">⬇</a>` : ''}
      </div>`;
  }).join('');

  area.innerHTML = `
    <div class="attachments-bar">
      <div class="attachments-label">Anexos (${real.length})</div>
      <div class="attachments-list">${items}</div>
    </div>
    <div class="detail-divider"></div>`;
}

// ── Ações ─────────────────────────────────────────────────────
export async function summarizeSelected() {
  if (!state.selectedEmail) return;
  document.getElementById('aiSummaryBox').style.display = 'block';
  document.getElementById('aiSummaryText').textContent  = 'Gerando resumo...';
  const summary = await summarizeEmail(state.selectedEmail);
  document.getElementById('aiSummaryText').textContent  = summary;
}

async function summarizeEmail(email) {
  const cfg = loadConfig();
  if (!cfg.claudeApiKey) return 'Configure a chave da API do Claude para usar esta função.';
  const bodyText = email.bodyText || stripHtml(email.bodyHtml || '') || email.preview || '';
  const prompt = `Faça um resumo executivo deste e-mail em português, em 2-3 frases. Destaque o ponto principal e qualquer ação necessária.\n\nDe: ${email.fromName} <${email.from}>\nAssunto: ${email.subject}\nCorpo:\n${bodyText.substring(0, 1500)}`;
  try {
    const res = await claudeApi([{ role: 'user', content: prompt }], 200);
    return res.content?.[0]?.text || 'Não foi possível gerar o resumo.';
  } catch (e) { return 'Erro ao gerar resumo: ' + e.message; }
}

export function moveSelected(folder) {
  if (!folder || !state.selectedEmail) return;
  const email  = state.selectedEmail;
  const tagMap = { Financeiro: 'tag-finance', Trabalho: 'tag-work', Marketing: 'tag-marketing', Pessoal: 'tag-personal', Outros: '' };
  email.folder = folder;
  email.tag    = tagMap[folder] || '';
  if (state.connected && state.accessToken) moveEmail(email.id, folder);
  renderEmailList();
  updateFolderCounts();
  showNotif('success', '✅', `E-mail movido para ${folder}`);
}

export function replyEmail() {
  showNotif('success', '📧', 'Funcionalidade disponível via Outlook Web');
}

// ── Classificação IA ──────────────────────────────────────────
export async function classifyAllEmails() {
  const cfg = loadConfig();
  if (!cfg.claudeApiKey) { showNotif('error', '❌', 'Configure a chave da API do Claude'); return; }

  const batchSize = cfg.batchSize || 20;
  const toProcess = state.emails.slice(0, batchSize);
  const tagMap    = { Financeiro: 'tag-finance', Trabalho: 'tag-work', Marketing: 'tag-marketing', Pessoal: 'tag-personal', Outros: '' };

  for (let i = 0; i < toProcess.length; i++) {
    const email  = toProcess[i];
    showStatus(`Classificando e-mail ${i + 1}/${toProcess.length}...`);
    const folder = await classifyEmail(email);
    email.folder = folder;
    email.tag    = tagMap[folder] || '';
    if (state.connected && state.accessToken) await moveEmail(email.id, folder);
  }

  state.filteredEmails = [...state.emails];
  renderEmailList();
  updateFolderCounts();
  hideStatus();
  showNotif('success', '✅', `${toProcess.length} e-mails classificados!`);
}

async function classifyEmail(email) {
  const cfg = loadConfig();
  if (!cfg.claudeApiKey) return email.folder || 'Outros';

  const rulesText = state.rules
    .filter(r => r.active)
    .map(r => `- Pasta "${r.folder}": ${r.criteria}`)
    .join('\n');

  const bodyText = email.bodyText || stripHtml(email.bodyHtml || '') || email.preview || '';
  const prompt = `Classifique este e-mail. Responda APENAS com o nome da pasta.\n\nRegras:\n${rulesText}\n- Pasta "Outros": demais casos\n\nRemetente: ${email.from}\nAssunto: ${email.subject}\nCorpo: ${bodyText.substring(0, 800)}\n\nPasta:`;

  try {
    const res  = await claudeApi([{ role: 'user', content: prompt }], 50);
    const text = res.content?.[0]?.text?.trim() || 'Outros';
    const valid = ['Financeiro', 'Trabalho', 'Marketing', 'Pessoal', 'Outros'];
    return valid.find(f => text.includes(f)) || 'Outros';
  } catch { return 'Outros'; }
}

// ── Filtros ───────────────────────────────────────────────────
export function setFilter(filter, btn) {
  state.currentFilter = filter;
  state.currentFolder = null;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('panelTitle').textContent = 'Caixa de Entrada';
  applyFilters();
}

export function filterByFolder(folder) {
  state.currentFolder = folder;
  state.currentFilter = 'all';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  document.getElementById('panelTitle').textContent = folder;
  applyFilters();
}

export function filterEmails() { applyFilters(); }

function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  let emails   = [...state.emails];

  if (state.currentFolder) {
    emails = emails.filter(e => e.folder === state.currentFolder);
  } else if (state.currentFilter === 'unread') {
    emails = emails.filter(e => e.unread);
  } else if (['Trabalho','Financeiro','Marketing','Pessoal'].includes(state.currentFilter)) {
    emails = emails.filter(e => e.folder === state.currentFilter);
  }

  if (search) {
    emails = emails.filter(e =>
      e.subject.toLowerCase().includes(search) ||
      e.from.toLowerCase().includes(search)    ||
      e.preview.toLowerCase().includes(search)
    );
  }
  state.filteredEmails = emails;
  renderEmailList();
}

export function updateFolderCounts() {
  ['Trabalho','Financeiro','Marketing','Pessoal','Outros'].forEach(f => {
    const el = document.getElementById('cnt-' + f);
    if (el) el.textContent = state.emails.filter(e => e.folder === f).length;
  });
}

export function updateUnreadBadge() {
  document.getElementById('unreadBadge').textContent = state.emails.filter(e => e.unread).length;
}
