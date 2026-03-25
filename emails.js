/**
 * EMAILS.JS - Renderização de E-mails e Detalhes
 */

function renderEmailList() {
  const list = document.getElementById('emailList');
  if (!state.filteredEmails.length) {
    list.innerHTML = '<div class="notif-empty">Nenhum e-mail encontrado.</div>';
    return;
  }
  list.innerHTML = state.filteredEmails.map(e => {
    const initials = getInitials(e.fromName || e.from), 
          color = getAvatarColor(e.from), 
          relDate = formatRelativeDate(e.date), 
          selected = state.selectedEmail?.id === e.id;
    return `
      <div class="email-item ${e.unread?'unread':''} ${selected?'selected':''}" 
           onclick="selectEmail('${e.id}')" 
           oncontextmenu="openEmailContextMenu(event,'${e.id}')"
           draggable="true" ondragstart="handleEmailDragStart(event, '${e.id}')">
        <div class="email-item-inner">
          <div class="email-avatar-col">
            <div class="list-avatar" style="background:${color}">${initials}</div>
            ${e.unread ? '<div class="unread-dot"></div>' : ''}
          </div>
          <div class="email-content-col">
            <div class="email-meta">
              <span class="email-sender">${escHtml(e.fromName || e.from)}</span>
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

async function selectEmail(id) {
  let email = state.emails.find(e => e.id === id);

  if (!email && state.accessToken) {
    // Email not in current list, try fetching directly from API
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${id}`, {
        headers: { Authorization: `Bearer ${state.accessToken}`, 'Prefer': 'outlook.body-content-type="html"' }
      });
      if (res.ok) {
        const data = await res.json();
        email = buildEmailObj(data); // Use buildEmailObj to format the fetched email
      } else {
        console.error('Failed to fetch email from API:', res.status, await res.text());
        showNotif('error', '❌', 'Não foi possível carregar o e-mail. Ele pode ter sido movido ou excluído.');
        return;
      }
    } catch (e) {
      console.error('Error fetching email by ID:', e);
      showNotif('error', '❌', 'Erro ao carregar o e-mail.');
      return;
    }
  }

  state.selectedEmail = email;
  if (!state.selectedEmail) return;
  if (state.selectedEmail.unread) {
    state.selectedEmail.unread = false;
    markAsRead(id);
  }
  renderEmailList();
  renderEmailDetail(state.selectedEmail);
  switchTab('detail', document.querySelectorAll('.tab')[0]);
  if (typeof updateUnreadBadge === 'function') updateUnreadBadge();
}

function renderEmailDetail(email) {
  const detail = document.getElementById('detailTab');
  const initials = getInitials(email.fromName || email.from), color = getAvatarColor(email.from);
  const toList = (email.to || []).join(', ') || '—';
  const dateStr = email.date ? new Date(email.date).toLocaleString('pt-BR') : '';

  detail.innerHTML = `
    <div class="detail-header">
      <div class="detail-subject">${escHtml(email.subject)}</div>
      <div class="detail-from">
        <div class="avatar" style="background:${color}">${initials}</div>
        <div class="from-info">
          <div class="from-name">${escHtml(email.fromName || email.from)}</div>
          <div class="from-email">${escHtml(email.from)}</div>
        </div>
        ${email.importance === 'high' ? '<span class="importance-badge">Alta prioridade</span>' : ''}
      </div>
      <div class="detail-recipients">
        <span class="recipient-label">Para:</span> <span class="recipient-value">${escHtml(toList)}</span>
        ${email.cc?.length ? `<br/><span class="recipient-label">CC:</span> <span class="recipient-value">${escHtml(email.cc.join(', '))}</span>` : ''}
        <br/><span class="recipient-label">Data:</span> <span class="recipient-value">${dateStr}</span>
      </div>
      <div class="detail-actions">
        <button class="action-btn primary" onclick="summarizeSelected()">✨ Resumir com IA</button>
        <button class="action-btn" onclick="openComposer('reply')">↩ Responder</button>
        <button class="action-btn" onclick="openComposer('replyAll')">↩↩ Resp. todos</button>
        <button class="action-btn" onclick="openComposer('forward')">→ Encaminhar</button>
        <button class="action-btn" onclick="deleteSelected()" style="color:var(--danger)">🗑 Excluir</button>
        <select class="move-select" onchange="moveSelectedToFolder(this.value);this.value=''">
          <option value="">Mover para...</option>
          ${typeof buildFolderOptions === 'function' ? buildFolderOptions() : ''}
        </select>
      </div>
    </div>
    <div class="ai-summary-box" id="aiSummaryBox" style="display:none">
      <div class="ai-summary-label">✨ Resumo IA</div>
      <div class="ai-summary-text" id="aiSummaryText">Gerando...</div>
    </div>
    <div id="emailBodyArea" class="email-body-area">${email.bodyHtml || email.bodyText}</div>`;
}

function openComposer(mode) {
  const email = state.selectedEmail;
  document.getElementById('composerPanel')?.remove();
  
  let toVal = "";
  let ccVal = "";

  if (mode === 'reply' || mode === 'replyAll') {
    toVal = email.from;
    if (mode === 'replyAll') {
      const otherTo = (email.to || []).filter(addr => addr.toLowerCase() !== email.from.toLowerCase());
      if (otherTo.length > 0) toVal += ', ' + otherTo.join(', ');
      ccVal = (email.cc || []).join(', ');
    }
  }
  const subjectVal = (mode === 'forward' ? 'Enc: ' : 'Re: ') + email.subject;

  const panel = document.createElement('div');
  panel.id = 'composerPanel'; panel.className = 'composer-panel';
  panel.innerHTML = `
    <div class="composer-header">
      <span class="composer-title">${mode === 'forward' ? 'Encaminhar' : mode === 'replyAll' ? 'Responder a todos' : 'Responder'}</span>
      <button class="composer-close" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
    <div class="composer-fields">
      <div class="composer-field"><label>Para</label><input id="composerTo" value="${escHtml(toVal)}"/></div>
      <div class="composer-field"><label>CC</label><input id="composerCc" value="${escHtml(ccVal)}"/></div>
      <div class="composer-field"><label>Assunto</label><input id="composerSubject" value="${escHtml(subjectVal)}"/></div>
    </div>
    <textarea class="composer-body" id="composerBody"></textarea>
    <div class="composer-footer">
      <button class="action-btn primary" id="composerSendBtn" onclick="submitComposer('${mode}','${email.id}')">Enviar</button>
    </div>`;
  document.getElementById('detailTab').appendChild(panel);
}

async function submitComposer(mode, id) {
  const to = document.getElementById('composerTo').value;
  const cc = document.getElementById('composerCc').value;
  const text = document.getElementById('composerBody').value;
  const btn = document.getElementById('composerSendBtn');
  
  btn.textContent = 'Enviando...'; btn.disabled = true;
  try {
    if (mode === 'forward') await sendForward(id, to, cc, text);
    else await sendReply(id, text, to, cc, mode === 'replyAll');
    document.getElementById('composerPanel').remove();
    showNotif('success', '✅', 'Mensagem enviada!');
  } catch (e) { showNotif('error', '❌', e.message); btn.disabled = false; btn.textContent = 'Enviar'; }
}

function buildEmailObj(m) {
  const isHtml = (m.body?.contentType || '').toLowerCase() === 'html';
  return { 
    id: m.id, 
    from: m.from?.emailAddress?.address || '', 
    fromName: m.from?.emailAddress?.name || '', 
    to: (m.toRecipients || []).map(r => r.emailAddress?.address).filter(Boolean),
    cc: (m.ccRecipients || []).map(r => r.emailAddress?.address).filter(Boolean),
    subject: m.subject || '', 
    preview: m.bodyPreview || '', 
    bodyHtml: isHtml ? m.body.content : '', 
    bodyText: stripHtml(m.body?.content || ''), 
    date: m.receivedDateTime, 
    unread: !m.isRead, 
    hasAttachments: m.hasAttachments, 
    importance: m.importance, 
    conversationId: m.conversationId 
  };
}

function handleEmailDragStart(event, emailId) {
  event.dataTransfer.setData('text/plain', emailId);
  event.dataTransfer.dropEffect = 'move';
}