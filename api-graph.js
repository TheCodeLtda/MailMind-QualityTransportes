/**
 * API-GRAPH.JS - Conectividade com Microsoft Graph (Outlook)
 */

function connectOutlook() {
  const cfg = loadConfig();
  if (!cfg.clientId) { showNotif('error','❌','Configure o Client ID do Azure primeiro'); switchView('config',null); return; }
  const scopes = 'openid profile email Mail.Read Mail.ReadWrite Mail.Send offline_access';
  const redirectUri = encodeURIComponent(cfg.redirectUri || window.location.origin);
  const tenantId = cfg.tenantId || 'common';
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${cfg.clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scopes)}&response_mode=fragment`;
  
  const popup = window.open(authUrl, 'outlook-auth', 'width=500,height=700,scrollbars=yes');
  const interval = setInterval(() => {
    try {
      if (!popup || popup.closed) { clearInterval(interval); return; }
      const hash = popup.location.hash;
      if (hash && hash.includes('access_token')) {
        clearInterval(interval); popup.close();
        const params = new URLSearchParams(hash.substring(1));
        handleToken(params.get('access_token'), params.get('expires_in'));
      }
    } catch {}
  }, 500);
}

function handleToken(token, expiresIn) {
  state.accessToken = token; state.connected = true;
  const expiresAt = Date.now() + ((parseInt(expiresIn) || 3600) * 1000);
  localStorage.setItem('mm_token', token);
  localStorage.setItem('mm_expires_at', String(expiresAt));
  
  const btn = document.getElementById('connectBtn');
  if (btn) { btn.innerHTML = '✅ Conectado'; btn.classList.add('connected'); }
  document.getElementById('connectStatus').textContent = 'Outlook conectado';
  
  showNotif('success','✅','Outlook conectado com sucesso!');
  loadOutlookFolders();
  fetchEmails().then(() => startPolling());
  scheduleTokenRenewal(expiresAt);
}

function restoreToken() {
  const token = localStorage.getItem('mm_token');
  const expiresAt = parseInt(localStorage.getItem('mm_expires_at') || '0');
  if (!token || Date.now() >= expiresAt) return false;
  
  state.accessToken = token; state.connected = true;
  const btn = document.getElementById('connectBtn');
  if (btn) { btn.innerHTML = '✅ Conectado'; btn.classList.add('connected'); }
  document.getElementById('connectStatus').textContent = 'Outlook conectado';
  scheduleTokenRenewal(expiresAt);
  return true;
}

async function fetchEmails(url) {
  if (!state.accessToken) return;
  const PAGE_SIZE = 50;
  const defaultUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${PAGE_SIZE}&$select=id,subject,from,toRecipients,ccRecipients,bodyPreview,body,receivedDateTime,isRead,hasAttachments,importance,conversationId&$orderby=receivedDateTime desc`;
  
  showStatus('Carregando e-mails...');
  try {
    const res = await fetch(url || defaultUrl, {
      headers: { Authorization: `Bearer ${state.accessToken}`, 'Prefer': 'outlook.body-content-type="html"' }
    });
    const data = await res.json();
    state.emails = data.value.map(buildEmailObj);
    state.filteredEmails = [...state.emails];
    state.page.nextLink = data['@odata.nextLink'] || null;
    
    if (!url) { state.page.current = 1; state.page.prevLinks = []; fetchUnreadCount(); }
    
    renderEmailList();
    updateUnreadBadge();
    renderPagination();
  } catch (e) { showNotif('error','❌','Erro ao carregar e-mails'); }
  finally { hideStatus(); }
}

async function moveEmail(emailId, folderName) {
  if (!state.accessToken) return;
  try {
    const destinationId = await getTargetFolderId(folderName);
    await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/move`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId })
    });
  } catch (e) { console.error('Erro ao mover e-mail:', e); }
}

async function markAsRead(emailId) {
  if (!state.accessToken) return;
  fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ isRead: true })
  }).catch(console.warn);
}

async function deleteEmail(emailId) {
  if (!state.accessToken) return;
  await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${state.accessToken}` }
  });
}

async function sendForward(emailId, toAddress, ccAddress, bodyHtml) {
  const toRecips = toAddress.split(',').map(a => ({ emailAddress: { address: a.trim() } })).filter(a => a.emailAddress.address);
  const ccRecips = ccAddress.split(',').map(a => ({ emailAddress: { address: a.trim() } })).filter(a => a.emailAddress.address);

  await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/forward`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ toRecipients: toRecips, ccRecipients: ccRecips, comment: bodyHtml })
  });
}

async function sendReply(emailId, comment, toAddress, ccAddress, toAll) {
  const endpoint = toAll ? 'createReplyAll' : 'createReply';
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type': 'application/json' }
  });
  const draft = await res.json();
  
  const toRecips = toAddress.split(',').map(a => ({ emailAddress: { address: a.trim() } })).filter(a => a.emailAddress.address);
  const ccRecips = ccAddress.split(',').map(a => ({ emailAddress: { address: a.trim() } })).filter(a => a.emailAddress.address);

  await fetch(`https://graph.microsoft.com/v1.0/me/messages/${draft.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body: { contentType: 'html', content: comment.replace(/\n/g, '<br>') + '<br><br>' + draft.body.content },
      toRecipients: toRecips,
      ccRecipients: ccRecips
    })
  });

  await fetch(`https://graph.microsoft.com/v1.0/me/messages/${draft.id}/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${state.accessToken}` }
  });
}

async function fetchAttachments(emailId) {
  if (!state.accessToken) return [];
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${emailId}/attachments`, {
      headers: { Authorization: `Bearer ${state.accessToken}` }
    });
    const data = await res.json();
    return data.value || [];
  } catch { return []; }
}