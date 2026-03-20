// ============================================================
// state.js — Estado global da aplicação e dados demo
// ============================================================

export const state = {
  connected:      false,
  accessToken:    null,
  emails:         [],
  filteredEmails: [],
  selectedEmail:  null,
  currentFilter:  'all',
  currentFolder:  null,
  currentView:    'emails',
  rules:          [],
  config:         {},
  chatHistory:    [],
};

export const DEMO_EMAILS = [
  {
    id: '1', from: 'joao.silva@empresa.com', fromName: 'João Silva',
    subject: 'Relatório Q1 2026 - Revisão necessária',
    preview: 'Segue em anexo o relatório do primeiro trimestre...',
    bodyText: 'Olá time,\n\nSegue em anexo o relatório do primeiro trimestre de 2026 para revisão. Precisamos finalizar até sexta-feira.\n\nPontos de atenção:\n- Faturamento abaixo do previsto em 12%\n- Custo operacional cresceu 8%\n- Pipeline para Q2 está saudável\n\nPor favor revisem e me mandem feedback até quinta.\n\nAbraços,\nJoão',
    bodyHtml: null, date: '2026-03-20T09:45:00Z', dateFormatted: '20/03/2026 09:45',
    unread: true, folder: 'Trabalho', tag: 'tag-work',
    hasAttachments: true, importance: 'high', to: ['time@empresa.com'], cc: [],
  },
  {
    id: '2', from: 'noreply@banco.com.br', fromName: 'Banco Digital',
    subject: 'Fatura do seu cartão - Vencimento 25/03',
    preview: 'Sua fatura no valor de R$ 1.847,50 vence em 5 dias...',
    bodyText: 'Prezado cliente,\n\nSua fatura está disponível:\n\nValor: R$ 1.847,50\nVencimento: 25/03/2026\nMínimo: R$ 92,38\n\nAtenciosamente,\nBanco Digital',
    bodyHtml: null, date: '2026-03-20T08:30:00Z', dateFormatted: '20/03/2026 08:30',
    unread: true, folder: 'Financeiro', tag: 'tag-finance',
    hasAttachments: false, importance: 'normal', to: ['cliente@email.com'], cc: [],
  },
  {
    id: '3', from: 'newsletter@techcrunch.com', fromName: 'TechCrunch',
    subject: 'As 10 maiores tendências de IA para 2026',
    preview: 'Esta semana no TechCrunch: OpenAI, Google e as apostas...',
    bodyText: 'Esta semana no TechCrunch:\n\n1. OpenAI anuncia novo modelo multimodal\n2. Google investiu US$ 50bi em computação quântica\n3. Startups de IA levantaram recorde de US$ 120bi em Q1',
    bodyHtml: null, date: '2026-03-19T18:00:00Z', dateFormatted: '19/03/2026 18:00',
    unread: false, folder: 'Marketing', tag: 'tag-marketing',
    hasAttachments: false, importance: 'normal', to: ['subscriber@email.com'], cc: [],
  },
  {
    id: '4', from: 'maria.santos@gmail.com', fromName: 'Maria Santos',
    subject: 'Almoço de aniversário - confirmação',
    preview: 'Oi! Confirmando para sábado às 13h no restaurante...',
    bodyText: 'Oi querido!\n\nConfirmando o almoço de aniversário para sábado, dia 22/03, às 13h no Restaurante Japonês.\n\nNão precisa trazer nada! 🎂\n\nBejo, Maria',
    bodyHtml: null, date: '2026-03-19T14:20:00Z', dateFormatted: '19/03/2026 14:20',
    unread: true, folder: 'Pessoal', tag: 'tag-personal',
    hasAttachments: false, importance: 'normal', to: ['voce@email.com'], cc: [],
  },
  {
    id: '5', from: 'juridico@parceiro.com.br', fromName: 'Escritório Jurídico',
    subject: 'Contrato de prestação de serviços - minuta final',
    preview: 'Conforme alinhado na reunião, segue a minuta final do...',
    bodyText: 'Prezados,\n\nSegue a minuta final do contrato para análise.\n\nPrazo: 23/03/2026\n\nDr. Carlos Mendes — OAB/SP 123.456',
    bodyHtml: null, date: '2026-03-19T11:00:00Z', dateFormatted: '19/03/2026 11:00',
    unread: false, folder: 'Trabalho', tag: 'tag-work',
    hasAttachments: true, importance: 'high', to: ['empresa@email.com'], cc: [],
  },
  {
    id: '6', from: 'promo@amazon.com.br', fromName: 'Amazon',
    subject: 'Suas ofertas de hoje - até 70% OFF em eletrônicos',
    preview: 'Aproveite as melhores ofertas em smartphones, notebooks...',
    bodyText: 'Ofertas especiais:\n\niPhone 16 Pro - R$ 7.499\nMacBook Air M3 - R$ 9.999\nAirPods Pro - R$ 1.299\n\nVálidas por 24h.',
    bodyHtml: null, date: '2026-03-18T10:00:00Z', dateFormatted: '18/03/2026 10:00',
    unread: false, folder: 'Marketing', tag: 'tag-marketing',
    hasAttachments: false, importance: 'normal', to: ['cliente@email.com'], cc: [],
  },
  {
    id: '7', from: 'rh@empresa.com', fromName: 'RH - Empresa',
    subject: 'Holerite Março 2026 disponível',
    preview: 'Seu holerite de março está disponível no portal...',
    bodyText: 'Prezado colaborador,\n\nSeu holerite de Março/2026 está disponível.\n\nAcesse: portal.empresa.com/holerite\n\nPagamento: 05/04/2026\n\nRH',
    bodyHtml: null, date: '2026-03-18T09:00:00Z', dateFormatted: '18/03/2026 09:00',
    unread: true, folder: 'Trabalho', tag: 'tag-work',
    hasAttachments: false, importance: 'normal', to: ['colaborador@empresa.com'], cc: [],
  },
];

export const DEFAULT_RULES = [
  { id: 'r1', name: 'E-mails Financeiros',      criteria: 'fatura, boleto, pagamento, NF, nota fiscal, cobrança, vencimento, extrato, pix, transferência', folder: 'Financeiro', priority: 'high',   active: true, icon: '💰', color: 'rgba(29,158,117,0.15)' },
  { id: 'r2', name: 'Newsletters e Marketing',   criteria: 'newsletter, unsubscribe, promoção, oferta, desconto, campanha, marketing, promo',                folder: 'Marketing',  priority: 'medium', active: true, icon: '📢', color: 'rgba(239,159,39,0.15)'  },
  { id: 'r3', name: 'E-mails Pessoais',          criteria: 'aniversário, festa, almoço, jantar, fim de semana, pessoal, família, amigo',                     folder: 'Pessoal',    priority: 'low',    active: true, icon: '👤', color: 'rgba(240,153,123,0.15)' },
  { id: 'r4', name: 'E-mails de Trabalho',       criteria: 'reunião, projeto, relatório, proposta, cliente, contrato, prazo, entrega, sprint, deadline',     folder: 'Trabalho',   priority: 'high',   active: true, icon: '💼', color: 'rgba(124,110,250,0.15)' },
];
