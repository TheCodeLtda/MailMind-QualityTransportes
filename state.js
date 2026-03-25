/**
 * STATE.JS - Estado global e constantes
 */
const state = {
  connected:false, accessToken:null, emails:[], filteredEmails:[],
  selectedEmail:null, currentFilter:'all', currentFolder:null, isClassifying: false,
  currentView:'emails', rules:[], config:{}, chatHistory:[],
  page: { current:1, nextLink:null, prevLinks:[], total:null, pageSize:50 },
  outlookFolders: [],
  notifications: JSON.parse(localStorage.getItem('mm_notifications') || '[]'),
  notifFilter: 'all',
  useOutlookFolders: false,
  folderCache: {},
  customFilters: JSON.parse(localStorage.getItem('mailmind_custom_filters') || '[]'),
  fixedFolders: null,
};

const DEMO_EMAILS = [
  { id:'1', from:'joao.silva@empresa.com', fromName:'João Silva', subject:'Relatório Q1 2026', preview:'Segue o relatório...', bodyText:'Olá...', date:'2026-03-20T09:45:00Z', unread:true, folder:'Trabalho', tag:'tag-work', hasAttachments:true, importance:'high' }
];

const DEFAULT_RULES = [
  { id:'r1', name:'Financeiro', criteria:'fatura, boleto', folder:'Financeiro', priority:'high', active:true, icon:'💰', color:'rgba(29,158,117,0.15)' },
  { id:'r2', name:'Marketing', criteria:'promoção, oferta', folder:'Marketing', priority:'medium', active:true, icon:'📢', color:'rgba(239,159,39,0.15)' }
];

function loadConfig() {
  try { 
    return JSON.parse(localStorage.getItem('mailmind_config')||'{}');
  } catch { return {}; }
}