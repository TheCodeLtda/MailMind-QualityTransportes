# MailMind — Contexto do Projeto

## O que é
Aplicativo web de automação de e-mails do Outlook com IA (Claude). Permite ler, classificar e mover e-mails para pastas automaticamente, além de um assistente de chat em linguagem natural para interagir com a caixa de entrada.

---

## Stack
- **Frontend:** HTML + CSS + JS puro (sem framework)
- **IA:** Claude API (Anthropic) via proxy serverless
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
| `ANTHROPIC_API_KEY` | `sk-ant-...` (já configurada) |

---

## Funcionalidades implementadas
- [x] Tela de setup inicial (chave Claude + credenciais Azure)
- [x] Sidebar com navegação, pastas e botão de conexão
- [x] Lista de e-mails com busca e filtros por pasta
- [x] Visualização de e-mail com resumo por IA
- [x] Classificação automática de e-mails com Claude
- [x] Movimentação de e-mails via Graph API
- [x] Chat com assistente IA sobre a caixa de entrada
- [x] Regras de classificação configuráveis
- [x] Painel de configurações

---

## Problema pendente — Proxy Claude (CORS)
A chamada para a API do Claude estava sendo bloqueada pelo navegador (CORS). A solução foi criar `api/claude.js` como função serverless no Vercel.

**Status atual:** o proxy está sendo chamado corretamente (`POST /api/claude` aparece no console), mas retorna erro `JSON.parse: unexpected character at line 1 column 1` — indicando que o Vercel está retornando HTML de erro (provavelmente 404 ou 500) em vez de JSON.

**Possíveis causas a investigar:**
1. Vercel não está reconhecendo `api/claude.js` como função serverless (pode precisar de `package.json` na raiz)
2. Sintaxe `export default` pode não ser suportada sem configuração de módulo ES — tentar converter para `module.exports`
3. O `vercel.json` atual pode estar com configuração incorreta de runtime

**Próximo passo sugerido:** converter `api/claude.js` para CommonJS e adicionar `package.json` na raiz.

---

## Melhorias desejadas (a definir no próximo chat)
- [ ] Resolver o proxy do Claude definitivamente
- [ ] Outras melhorias a combinar

---

## Como usar o contexto
Cole este documento no início de um novo chat com o Claude e diga o que quer melhorar. O Claude terá todo o contexto necessário para continuar o projeto de onde paramos.
