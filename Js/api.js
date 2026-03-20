// ============================================================
// api.js — Microsoft Graph API + Claude API proxy
// ============================================================
import { state }                      from './state.js';
import { stripHtml, wrapTextAsHtml, formatDate, showNotif, showStatus, hideStatus } from './utils.js';

// ── Claude proxy ─────────────────────────────────────────────
export async function claudeApi(messages, maxTokens = 1000, system = null) {
  const cfg  = loadConfig();
  const body = {
    model:      cfg.model || 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages,
  };
  if (system) body.system = system;

  const res = await fetch('/api/claude', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────
export function connectOutlook() {
  const cfg = loadConfig();
  if (!cfg.clientId) {
    showNotif('error', '❌', 'Configure o Client ID do Azure primeiro');
    window.switchView('config', null);
    return;
  }

  const scopes      = 'openid profile email Mail.Read Mail.ReadWrite Mail.Send offline_access';
  const redirectUri = encodeURIComponent(cfg.redirectUri || window.location.origin);
  const tenantId    = cfg.tenantId || 'common';
  const authUrl     = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize` +
    `?client_id=${cfg.clientId}&response_type=token&redirect_uri=${redirectUri}` +
    `&scope=${encodeURIComponent(scopes)}&response_mode=fragment`;

  const popup = window.open(authUrl, 'outlook-auth', 'width=500,height=700,scrollbars=yes');

  const interval = setInterval(() => {
    try {
      if (!popup || popup.closed) { clearInterval(interval); return; }
      const hash = popup.location.hash;
      if (hash && hash.includes('access_token')) {
        clearInterval(interval);
        popup.close();
        const params = new URLSearchParams(hash.substring(1));
        const token  = params.get('access_token');
        const expiry = params.get('expires_in');
        if (token) handleToken(token, expiry);
      }
    } catch { /* cross-origin polling */ }
  }, 500);
}

export function handleToken(token, expiresIn) {
  state.accessToken = token;
  state.connected   = true;

  // Persiste no sessionStorage para sobreviver a F5
  const expiresAt = Date.now() + ((parseInt(expiresIn) || 3600) * 1000);
  sessionStorage.setItem('mm_token',      token);
  sessionStorage.setItem('mm_expires_at', String(expiresAt));

  document.getElementById('connectBtn').innerHTML = '✅ Conectado';
  document.getElementById('connectBtn').classList.add('connected');
  document.getElementById('connectStatus').textContent = 'Outlook conectado';
  showNotif('success', '✅', 'Outlook conectado com sucesso!');
  fetchEmails();
}

export function restoreToken() {
  const token     = sessionStorage.getItem('mm_token');
  const expiresAt = parseInt(sessionStorage.getItem('mm_expires_at') || '0');
  if (!token || Date.now() >= expiresAt) return false;

  state.accessToken = token;
  state.connected   = true;
  document.getElementById('connectBtn').innerHTML = '✅ Conectado';
  document.getElementById('connectBtn').classList.add('connected');
  document.getElementById('connectStatus').textContent = 'Outlook conectado';
  return true;
}

// ── Fetch emails ─────────────────────────────────────────────
export async function fetchEmails() {
  if (!state.accessToken) { showNotif('error', '❌', 'Conecte sua conta Outlook primeiro'); return; }
  showStatus('Carregando e-mails do Outlook...');
  try {
    const res = await fetch(
      'https://graph.microsoft.com/v1.0/me/messages' +
      '?$top=50&$select=id,subject,from,toRecipients,ccRecipients,bodyPreview,body,receivedDateTime,isRead,hasAttachments,importance' +
      '&$orderby=receivedDateTime desc',
      { headers: {
          Authorization: `Bearer ${state.accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'outlook.body-content-type="html"',
      }}
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    state.emails = data.value.map(m => {
      const contentType = (m.body?.contentType || '').toLowerCase();
      const isHtml = contentType === 'html';
      return {
        id:             m.id,
        from:           m.from?.emailAddress?.address || '',
        fromName:       m.from?.emailAddress?.name    || '',
        to:             (m.toRecipients || []).map(r => r.emailAddress?.address).filter(Boolean),
        cc:             (m.ccRecipients  || []).map(r => r.emailAddress?.address).filter(Boolean),
        subject:        m.subject    || '(sem assunto)',
        preview:        m.bodyPreview || '',
        bodyHtml:       isHtml ? m.body.content : wrapTextAsHtml(m.body?.content || ''),
        bodyText:       stripHtml(m.body?.content || ''),
        date:           m.receivedDateTime,
        dateFormatted:  formatDate(m.receivedDateTime),
        unread:         !m.isRead,
        hasAttachments: m.hasAttachments || false,
        importance:     m.importance    || 'normal',
        folder:         'Outros',
        tag:            '',
        attachments:    null,
      };
    });

    state.filteredEmails = [...state.emails];
    hideStatus();
    showNotif('success', '✅', `${state.emails.length} e-mails carregados`);
    return true;
  } catch (e) {
    hideStatus();
    showNotif('error', '❌', 'Erro ao carregar e-mails: ' + e.message);
    return false;
  }
}

export async function fetchAttachments(emailId) {
  if (!state.accessToken) return [];
  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages/${emailId}/attachments`,
      { headers: { Authorization: `Bearer ${state.accessToken}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.value || [];
  } catch { return []; }
}

export async function moveEmail(emailId, folderName) {
  if (!state.accessToken) return;
  try {
    const foldersRes  = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders',
      { headers: { Authorization: `Bearer ${state.accessToken}` } });
    const foldersData = await foldersRes.json();
    let folder = foldersData.value.find(f =>
      f.displayName.toLowerCase() === folderName.toLowerCase()
    );
    if (!folder) {
      const createRes = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: folderName }),
      });
      folder = await createRes.json();
    }
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/move`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: folder.id }),
    });
  } catch (e) { console.error('Erro ao mover e-mail:', e); }
}

// ── Helpers ───────────────────────────────────────────────────
export function loadConfig() {
  try { return JSON.parse(localStorage.getItem('mailmind_config') || '{}'); }
  catch { return {}; }
}
