/**
 * FOLDERS.JS - Gestão de Pastas e Hierarquia
 */

async function loadOutlookFolders() {
  if (!state.accessToken) return;
  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders?$top=100', {
      headers: { Authorization: `Bearer ${state.accessToken}` }
    });
    const data = await res.json();
    state.outlookFolders = data.value;
    renderSidebarFolders();
  } catch (e) { console.warn('Erro ao carregar pastas:', e); }
}

function renderSidebarFolders() {
  const list = document.getElementById('folderList');
  if (!list) return;

  const folders = state.useOutlookFolders ? state.outlookFolders : (state.fixedFolders || [
    { name: 'Trabalho', color: '#7C6EFA' },
    { name: 'Financeiro', color: '#5DCAA5' },
    { name: 'Marketing', color: '#EF9F27' },
    { name: 'Pessoal', color: '#F0997B' },
    { name: 'Outros', color: '#888780' }
  ]);

  list.innerHTML = folders.map(f => {
    const name = f.displayName || f.name;
    const color = f.color || getAvatarColor(name);
    return `
      <div class="folder-item" onclick="filterByFolder('${escHtml(name)}')">
        <div class="folder-dot" style="background:${color}"></div>
        <span class="folder-name">${escHtml(name)}</span>
        <button class="folder-menu-btn" onclick="event.stopPropagation();openFolderMenu(event, '${escHtml(name)}')">•••</button>
      </div>`;
  }).join('') + `<div class="folder-new-btn" onclick="addFixedFolder()">+ Nova pasta</div>`;
}

async function getTargetFolderId(folderName) {
  const cacheKey = `ROOT_SUB_${folderName}`;
  if (state.folderCache[cacheKey]) return state.folderCache[cacheKey];

  try {
    // Garante que a pasta "MailMind" existe
    let rootId = state.folderCache['ROOT_MAILMIND'];
    if (!rootId) {
      const res = await fetch("https://graph.microsoft.com/v1.0/me/mailFolders?$filter=displayName eq 'MailMind'", {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      const data = await res.json();
      if (data.value.length) rootId = data.value[0].id;
      else {
        const create = await fetch("https://graph.microsoft.com/v1.0/me/mailFolders", {
          method: 'POST',
          headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: 'MailMind' })
        });
        rootId = (await create.json()).id;
      }
      state.folderCache['ROOT_MAILMIND'] = rootId;
    }

    // Busca/Cria a subpasta
    const resSub = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${rootId}/childFolders`, {
      headers: { Authorization: `Bearer ${state.accessToken}` }
    });
    const dataSub = await resSub.json();
    let target = dataSub.value.find(f => f.displayName.toLowerCase() === folderName.toLowerCase());
    
    if (!target) {
      const createSub = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${rootId}/childFolders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: folderName })
      });
      target = await createSub.json();
    }

    state.folderCache[cacheKey] = target.id;
    return target.id;
  } catch (e) { throw e; }
}