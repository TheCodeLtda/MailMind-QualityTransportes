# MailMind — Contexto do Projeto

## O que é
Aplicativo web de automação de e-mails do Outlook com IA (Google Gemini). Permite ler, classificar e mover e-mails para pastas automaticamente, além de um assistente de chat em linguagem natural para interagir com a caixa de entrada.

---

## Stack
- **Frontend:** HTML + CSS + JS puro (sem framework)
- **IA:** Google Gemini API via proxy serverless
- **E-mails:** Microsoft Graph API (OAuth 2.0 — fluxo implícito SPA)
- **Hospedagem:** Vercel — https://mail-mind-quality-transportes.vercel.app

---

## Estrutura de arquivos
```
/
├── index.html        — estrutura e markup
├── styles.css        — todo o visual e design tokens
├── app.js            — toda a lógica (estado, API calls, render, filtros)
├── vercel.json       — configuração do Vercel
└── api/
    └── claude.js     — proxy serverless para a API do Claude (resolve CORS)
```

---

## Configuração Azure AD (Microsoft Entra)
- **App:** MailMind
- **Client ID:** `3252a8c6-491f-4a57-93d3-5e451158f6bb`
- **Tenant ID:** `c3c04205-e721-41cb-b9e0-c6550be6aee7`
- **Tipo de conta:** Qualquer Locatário de ID de Entra + Contas Pessoais da Microsoft
- **Redirect URI:** `https://mail-mind-quality-transportes.vercel.app` (SPA)
- **Permissões:** Mail.Read, Mail.ReadWrite, Mail.Send
- **Tokens ativados:** Access token + ID token (concessão implícita)

---

## Variáveis de ambiente no Vercel
| Nome | Valor |
|------|-------|
| `GEMINI_API_KEY` | `AIzaSy...` (configurada no Vercel) |

---

## Funcionalidades implementadas
- [x] Tela de setup inicial (chave Claude + credenciais Azure)
- [x] Sidebar com navegação, árvore de pastas real do Outlook e botão de conexão
- [x] Lista de e-mails com busca e filtros por pasta
- [x] Visualização de e-mail com resumo por IA
- [x] Classificação automática de e-mails com Claude
- [x] Movimentação de e-mails via Graph API
- [x] Chat com assistente IA sobre a caixa de entrada
- [x] Regras de classificação configuráveis
- [x] Painel de configurações

---

## Arquitetura de IA (Proxy Serverless)
Para evitar erros de CORS e exposição de chaves no frontend, todas as chamadas de IA passam por funções serverless no Vercel (`/api/gemini`). O frontend envia apenas o conteúdo, e o proxy injeta a chave de API segura armazenada nas variáveis de ambiente.

---

## Melhorias desejadas (a definir no próximo chat)
- [ ] Finalizar refatoração do CSS para arquivos modulares.
- [ ] Implementar sistema de cache offline para e-mails.

---

## Como usar o contexto
Cole este documento no início de um novo chat com o Claude e diga o que quer melhorar. O Claude terá todo o contexto necessário para continuar o projeto de onde paramos.

## Novas estruturas de arquivos 
utils.js — helpers puros (escHtml, format*, getInitials, etc.)
state.js — estado global, constantes, config
api-graph.js — todas as chamadas ao Microsoft Graph
api-ai.js — Gemini, classificação, resumo, chat
folders.js — pastas (CRUD, render, filtros)
emails.js — lista, detalhe, render, composer
rules.js — regras de classificação
ui.js — notificações, setup, views, resize, polling, favicon
app.js — apenas inicialização (init, loadApp) + imports
