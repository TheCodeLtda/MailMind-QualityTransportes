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
    const selected = state.selectedEmail?.id === e.id;
    return `
      <div class="email-item ${e.unread?'unread':''} ${selected?'selected':''}" onclick="selectEmail('${e.id}')">
        <div class="email-item-inner">
          <div class="email-avatar-col">
            <div class="list-avatar" style="background:${getAvatarColor(e.from)}">${getInitials(e.fromName)}</div>
          </div>
          <div class="email-content-col">
            <div class="email-meta">
              <span class="email-sender">${escHtml(e.fromName)}</span>
              <span class="email-date">${formatRelativeDate(e.date)}</span>
            </div>
            <div class="email-subject">${escHtml(e.subject)}</div>
            <div class="email-preview">${escHtml(e.preview)}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function selectEmail(id) {
  state.selectedEmail = state.emails.find(e => e.id === id);
  if (!state.selectedEmail) return;
  if (state.selectedEmail.unread) {
    state.selectedEmail.unread = false;
    markAsRead(id);
  }
  renderEmailList();
  renderEmailDetail(state.selectedEmail);
  switchTab('detail', document.querySelectorAll('.tab')[0]);
}

function renderEmailDetail(email) {
  const detail = document.getElementById('detailTab');
  detail.innerHTML = `
    <div class="detail-header">
      <div class="detail-subject">${escHtml(email.subject)}</div>
      <div class="detail-from">
        <div class="avatar" style="background:${getAvatarColor(email.from)}">${getInitials(email.fromName)}</div>
        <div class="from-info">
          <div class="from-name">${escHtml(email.fromName)}</div>
          <div class="from-email">${escHtml(email.from)}</div>
        </div>
      </div>
      <div class="detail-actions">
        <button class="action-btn primary" onclick="summarizeSelected()">✨ Resumir com IA</button>
        <button class="action-btn" onclick="openComposer('reply')">Responder</button>
        <button class="action-btn" onclick="deleteSelected()">🗑 Excluir</button>
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
  
  let toVal = mode === 'forward' ? '' : email.from;
  let ccVal = mode === 'replyAll' ? (email.cc || []).join(', ') : '';
  const subjectVal = (mode === 'forward' ? 'Enc: ' : 'Re: ') + email.subject;

  const panel = document.createElement('div');
  panel.id = 'composerPanel'; panel.className = 'composer-panel';
  panel.innerHTML = `
    <div class="composer-header">
      <span class="composer-title">${mode}</span>
      <button onclick="this.parentElement.parentElement.remove()">✕</button>
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
  return { id: m.id, from: m.from?.emailAddress?.address || '', fromName: m.from?.emailAddress?.name || '', subject: m.subject || '', preview: m.bodyPreview || '', bodyHtml: isHtml ? m.body.content : '', bodyText: stripHtml(m.body?.content || ''), date: m.receivedDateTime, unread: !m.isRead, hasAttachments: m.hasAttachments, importance: m.importance, conversationId: m.conversationId };
}