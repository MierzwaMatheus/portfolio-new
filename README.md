# Portfolio — guia de deploy

Um sistema completo de portfólio profissional pronto para você forkar, personalizar e publicar com domínio próprio.

> **💡 Por que esse projeto existe**
> Esse sistema foi feito para **facilitar a vida de qualquer pessoa** que queira ter um portfólio completo, organizado e fácil de manter. É um projeto **para todo mundo** — para incentivar mais profissionais a se exporem com qualidade e elevar o nível médio dos portfólios na web. Se você é dev iniciante, sênior, designer ou freelancer, a base já está aqui. Você foca no que importa: o seu conteúdo e a sua identidade.

> **🎨 Antes de publicar, leia isto**
> Use a base, mas **personalize o visual**. Cor, tipografia, copy, hero, ícones, animações — coloque a sua personalidade. Se todo mundo subir o portfólio com a paleta padrão, o sistema satura na web e ninguém se destaca. Soluções prontas são pontos de partida, não chegada. **Autenticidade é a chave** — usando bases prontas ou não.

> Procurando a referência técnica detalhada (schema do banco, lista de features, rotas, plugins, design system)? Veja [`docs/features.md`](docs/features.md).

---

## 📦 O que você vai ter no ar

- **Página inicial** com hero, sobre, serviços e depoimentos
- **Portfólio** com filtros por tags, modal detalhado e drag-and-drop de ordenação
- **Blog** com editor rich text (TipTap), tags, busca e RSS automático
- **Currículo** estruturado + export em PDF otimizado para ATS
- **Propostas comerciais** com proteção por senha, aceite eletrônico, assinatura manuscrita e geração de contrato em PDF
- **Painel admin completo** (`/admin`) — CRUD de tudo via interface
- **Sistema de plugins** para ligar/desligar features que você não quer expor
- (Opcional) **IA** para tradução automática e geração de CV otimizado para vagas
- (Opcional) **Pagamentos** via Stripe e Asaas (PIX/boleto)
- (Opcional) **Notificações** no Telegram quando alguém aceita uma proposta ou paga

---

## ✅ Pré-requisitos

- **Node.js 18+** e **pnpm** instalados localmente
- Conta no **GitHub** (para fork e deploy contínuo)
- Conta no **[Convex](https://convex.dev)** (gratuita) — backend, banco e storage
- Conta no **[Vercel](https://vercel.com)** (gratuita) — hospedagem do frontend
- (Opcional) Contas no **[OpenRouter](https://openrouter.ai)**, **[Stripe](https://stripe.com)**, **[Asaas](https://asaas.com)** ou **[Telegram BotFather](https://t.me/BotFather)** se for usar as features opcionais

---

## 🚀 Passo a passo — do clone ao ar

### Passo 1 — Fork e clone

Faça fork do repositório no GitHub e clone localmente:

```bash
gh repo fork mierzwamatheus/portfolio-new --clone
cd portfolio-new
pnpm install
```

### Passo 2 — Provisionar o Convex

O Convex é o backend (banco de dados, storage de imagens, autenticação, funções server-side).

```bash
npx convex dev
```

Na primeira vez, o CLI:

1. Pede login (abre o navegador)
2. Cria um novo projeto Convex na sua conta
3. Gera o arquivo `.env.local` com `VITE_CONVEX_URL` e `CONVEX_DEPLOY_KEY` automaticamente
4. Faz o deploy do schema (todas as tabelas) e das funções
5. Fica em modo watch — deixe rodando enquanto desenvolve

### Passo 3 — Configurar o `.env` local

Copie o template e preencha:

```bash
cp .env.example .env
```

Variáveis mínimas:

| Variável | De onde vem | Para quê |
|---|---|---|
| `VITE_CONVEX_URL` | Convex Dashboard → Settings | URL do backend (frontend) |
| `CONVEX_URL` | Mesma URL acima | Usado pelos scripts de build (RSS, sitemap) |
| `CONVEX_DEPLOY_KEY` | Convex Dashboard → Settings → Deploy Keys | Necessário para `convex deploy` no build |
| `SITE_URL` | URL final do site (ex: `https://seudominio.com`) | URL canônica do RSS e sitemap |

### Passo 4 — Configurar variáveis no servidor Convex

Essas variáveis ficam **no servidor Convex**, não no `.env` local. Setam-se via CLI:

```bash
npx convex env set NOME_DA_VAR valor
```

**Obrigatórias para o sistema rodar:**

- `BOOTSTRAP_ALLOWED=true` — habilita criar o primeiro usuário (você vai remover depois)

**Obrigatórias se for usar o plugin `playground`:**

- `PLAYGROUND_KEY_PEPPER=<32+ caracteres aleatórios>` — pepper para fingerprint de API keys

**Opcionais (apenas se ativar a feature correspondente):**

| Variável | Habilita |
|---|---|
| `OPENROUTER_API_KEY` | Tradução automática + geração de CV com IA |
| `STRIPE_WEBHOOK_SECRET` | Pagamentos via Stripe |
| `ASAAS_WEBHOOK_TOKEN` | Pagamentos via Asaas (PIX/boleto) |
| `TELEGRAM_BOT_TOKEN` | Notificações no Telegram |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat onde as notificações chegam |
| `IMPORT_SECRET` | Endpoint HTTP de importação CSV |
| `VERCEL_WEBHOOK_SECRET` | Webhook de notificação de deploy |

### Passo 5 — Rodar em desenvolvimento

Em outro terminal (deixe o `npx convex dev` rodando):

```bash
pnpm dev
```

Abre em `http://localhost:3000`.

### Passo 6 — Criar seu usuário root

1. Acesse `http://localhost:3000/login` enquanto `BOOTSTRAP_ALLOWED=true` está setado
2. A interface mostra a tela de bootstrap → crie email e senha
3. **Depois de criar, remova o bootstrap imediatamente:**

```bash
npx convex env remove BOOTSTRAP_ALLOWED
```

> ⚠️ Se você esquecer essa etapa, qualquer pessoa que descobrir o link consegue criar usuário root no seu sistema.

### Passo 7 — Preencher o conteúdo no painel admin

Logado em `/admin`, cada rota é onde você coloca o conteúdo. **Tudo é gerenciado por interface — você não precisa mexer no código para alterar texto, imagens ou dados.**

| Rota | O que você configura |
|---|---|
| `/admin/contact` | Nome, email, telefone, avatar, redes sociais |
| `/admin/home` | Texto "sobre", status de disponibilidade, serviços/skills |
| `/admin/projects` | Projetos do portfólio (imagens, tags, links, case study) |
| `/admin/blog` | Posts do blog (editor rich text, tags, destaque) |
| `/admin/resume` | Currículo (experiências, formação, skills, idiomas, certificações) |
| `/admin/about` | Rotina diária + FAQ |
| `/admin/testimonials` | Depoimentos (curados ou recebidos via wizard público) |
| `/admin/plugins` | **Liga/desliga features** (blog, propostas, pagamentos, etc.) |

### Passo 8 — Personalize o visual (não pule!)

Esta é a etapa **mais importante** depois do deploy técnico. Lembre da observação do topo: **identidade visual é o que vai te diferenciar**. Arquivos para mexer:

- `src/index.css` — variáveis de cor, tema dark/light, paleta (default usa neon purple `#a855f7` + neon lime — **mude isso**)
- `src/components/Layout.tsx` — estrutura visual da página
- `src/pages/Home.tsx` — hero, copy, ordem das seções, animações
- `public/favicon.ico` — substitua pelo seu logo
- Fontes (importe do Google Fonts no `index.html` ou via Tailwind)
- Componentes em `src/components/ui/` — todos do shadcn/ui, fáceis de customizar

**Teste rodando `pnpm dev` enquanto altera.** Não suba sem dar a sua cara.

### Passo 9 — Deploy no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório forkado
2. **Framework preset**: Vite
3. **Build command**: já vem definido no `vercel.json` (`pnpm convex deploy && pnpm vite build`) — não mude
4. **Output directory**: `dist`
5. **Adicione as env vars** no Vercel (Settings → Environment Variables):
   - `VITE_CONVEX_URL`
   - `CONVEX_URL`
   - `CONVEX_DEPLOY_KEY` ← sem isso, o build do Vercel falha ao rodar `convex deploy`
   - `SITE_URL`
6. Clique em **Deploy**

A partir daqui, todo `git push` para a branch principal dispara um deploy automático.

### Passo 10 — Configurar domínio próprio

1. **Vercel Dashboard → seu projeto → Settings → Domains → Add Domain**
2. Adicione `seudominio.com` e `www.seudominio.com`
3. **Configure o DNS** no seu registrador (Registro.br, Cloudflare, GoDaddy, etc.):
   - Domínio raiz (`seudominio.com`): registro **A** apontando para `76.76.21.21`
   - Subdomínio `www`: registro **CNAME** apontando para `cname.vercel-dns.com`
4. Aguarde a propagação (alguns minutos a algumas horas)
5. SSL é emitido automaticamente pela Vercel via Let's Encrypt
6. **Atualize a `SITE_URL`** no Vercel para a URL final do seu domínio
7. Force um redeploy para regenerar `sitemap.xml` e `rss.xml` com a URL nova

---

## 🧩 Features opcionais — quando ativar cada uma

| Feature | Plugin (em `/admin/plugins`) | Env vars necessárias | Conta externa |
|---|---|---|---|
| Pagamentos via Stripe | `payments` | `STRIPE_WEBHOOK_SECRET` | Stripe |
| Pagamentos PIX/Boleto | `payments` | `ASAAS_WEBHOOK_TOKEN` | Asaas |
| Geração de CV com IA | `ai-resumes` | `OPENROUTER_API_KEY` | OpenRouter |
| Tradução automática (i18n) | `i18n` | `OPENROUTER_API_KEY` | OpenRouter |
| Notificações Telegram | (built-in) | `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID` | BotFather |

**Dica do plugin manager:** se você só quer um portfólio simples (home + projetos + currículo), desative blog, propostas, pagamentos, IA e playground em `/admin/plugins`. As rotas correspondentes somem da sidebar e do roteador.

---

## 🛠 Scripts úteis

```bash
pnpm dev          # dev local + convex em watch (porta 3000)
pnpm build        # convex deploy + RSS + sitemap + vite build
pnpm preview      # preview do build de produção
pnpm check        # type-check (tsc --noEmit)
pnpm format       # prettier
pnpm test         # vitest
```

---

## 📁 Estrutura mínima do projeto

```
portfolio-new/
├── convex/              # Backend: schema, queries, mutations, actions
├── src/
│   ├── pages/           # Páginas públicas + /admin/*
│   ├── components/      # Componentes (UI, admin, layout)
│   ├── contexts/        # AuthContext, ThemeContext, PluginsContext
│   └── index.css        # ⬅ Personalize cores e tema aqui
├── scripts/             # Build-time: RSS, sitemap, fetch de dados estáticos
├── public/              # Assets estáticos (favicon, dados gerados)
├── docs/features.md     # Referência técnica completa
├── .env.example         # Template de variáveis de ambiente
└── vercel.json          # Build command, rewrites SPA, security headers
```

---

## 🩹 Troubleshooting

- **`convex deploy` falha no Vercel** → falta `CONVEX_DEPLOY_KEY` nas env vars do Vercel
- **Login não funciona / tela de bootstrap não aparece** → `BOOTSTRAP_ALLOWED` foi removido antes de você criar o primeiro usuário; sete de novo, crie e remova
- **Plugin desativado ainda aparece em produção** → falta um redeploy para regenerar `public/data/plugins.json`
- **Notificações Telegram não chegam** → você não enviou `/start` para o seu bot ainda (Telegram só permite o bot mandar mensagem depois)
- **Imagens quebradas após deploy** → os IDs do Convex Storage são por deployment; ao migrar entre dev e prod, reupload é necessário

---

## 🔁 Lembrete final

> Esse sistema é **para todo mundo**. Foi feito para que mais profissionais tenham um portfólio decente sem começar do zero, e para elevar o nível médio do que se vê na web. Se ele te ajudou, considere mandar um PR de melhoria — o objetivo é coletivo.

> Mas portfólio sem cara é portfólio igual. Aproveite a base técnica, **gaste tempo na sua identidade visual e na sua copy**. Autenticidade é o que separa um portfólio "mais um" de um portfólio que marca. Use soluções prontas sem culpa — e use bem.

---

## 📜 Licença

GNU GPL v3.0 — veja o arquivo `LICENSE`.

## 👤 Autor

Feito com ❤️ por **Matheus Mierzwa**.
