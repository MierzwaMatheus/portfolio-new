<div align="center">

<img src="https://i.postimg.cc/tJ8B9H6B/rubrica-cover-post.png" alt="Rubrica" width="100%" />

<br />
<br />

# Rubrica

### _Assine com a sua cara._

Um sistema completo de portfólio profissional, pronto para você forkar, personalizar e publicar com domínio próprio.

<br />

[![License](https://img.shields.io/badge/license-GPL--3.0-4D7C5F?style=flat-square)](./LICENSE)
[![Stack](https://img.shields.io/badge/React%20%2B%20Convex-1A1A18?style=flat-square)](https://convex.dev)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-C4664A?style=flat-square)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-99%25-4D7C5F?style=flat-square)](https://www.typescriptlang.org)

</div>

<br />

## O que é o Rubrica

A maioria das pessoas trava na mesma encruzilhada: começar um portfólio do zero dá trabalho demais, e os construtores prontos deixam todo mundo com a mesma cara.

Rubrica é a base que faltava no meio do caminho. É a estrutura técnica completa (home, portfólio, blog, currículo, propostas comerciais, painel admin, pagamentos) já resolvida. Você não monta o sistema. Você forka, personaliza a identidade e publica.

A base técnica é coletiva. A identidade é sua.

> **Por que isso existe**
>
> Rubrica foi feito para qualquer profissional criativo que leva o próprio trabalho a sério e quer que isso apareça. Dev iniciante ou sênior, designer, freelancer: a fundação já está pronta. Você foca no que importa: o seu conteúdo e a sua marca.
>
> Presença profissional não é luxo. É o mínimo que o seu trabalho merece.

<br />

## O que você coloca no ar

| | Módulo | O que entrega |
|---|---|---|
| 🏠 | **Home** | Hero, sobre, serviços e depoimentos |
| 💼 | **Portfólio** | Filtros por tags, modal detalhado, ordenação por drag-and-drop |
| ✍️ | **Blog** | Editor rich text (TipTap), tags, busca e RSS automático |
| 📄 | **Currículo** | Estruturado, com export em PDF otimizado para ATS |
| 🤝 | **Propostas** | Proteção por senha, aceite eletrônico, assinatura manuscrita e contrato em PDF |
| ⚙️ | **Admin** | CRUD de tudo via interface, sem tocar no código |
| 🧩 | **Plugins** | Liga e desliga features que você não quer expor |
| 🤖 | **IA** _(opcional)_ | Tradução automática e geração de CV otimizado para vagas |
| 💳 | **Pagamentos** _(opcional)_ | Stripe e Asaas (PIX/boleto) |
| 🔔 | **Notificações** _(opcional)_ | Telegram quando alguém aceita uma proposta ou paga |

<br />

## Como funciona

Rubrica tem três camadas: o frontend que o mundo vê, o backend que guarda tudo, e os serviços externos que você liga só se precisar.

```mermaid
flowchart TB
    subgraph cliente["🌐 Frontend: React + Vite"]
        pub["Páginas públicas<br/>home · portfólio · blog · currículo"]
        prop["Propostas<br/>aceite + assinatura + PDF"]
        admin["Painel admin<br/>CRUD via interface"]
    end

    subgraph backend["⚡ Backend: Convex"]
        db[("Banco de dados<br/>+ storage de imagens")]
        fn["Queries · Mutations<br/>Actions · Auth"]
        plugins["Sistema de plugins<br/>liga/desliga features"]
    end

    subgraph externos["🔌 Serviços externos (opcionais)"]
        ia["OpenRouter<br/>IA · tradução"]
        pay["Stripe · Asaas<br/>pagamentos"]
        tg["Telegram<br/>notificações"]
    end

    pub --> fn
    prop --> fn
    admin --> fn
    fn --> db
    plugins --> fn
    fn -.-> ia
    fn -.-> pay
    fn -.-> tg

    classDef front fill:#F5F2EA,stroke:#4D7C5F,stroke-width:2px,color:#1A1A18
    classDef back fill:#4D7C5F,stroke:#1A1A18,stroke-width:2px,color:#F5F2EA
    classDef ext fill:#C4664A,stroke:#1A1A18,stroke-width:2px,color:#F5F2EA
    class pub,prop,admin front
    class db,fn,plugins back
    class ia,pay,tg ext
```

<br />

## Pré-requisitos

Antes de começar, você vai precisar de:

- **Node.js 18+** e **pnpm** instalados
- Conta no **[GitHub](https://github.com)** (fork e deploy contínuo)
- Conta no **[Convex](https://convex.dev)** _(gratuita)_ (backend, banco e storage)
- Conta no **[Vercel](https://vercel.com)** _(gratuita)_ (hospedagem do frontend)
- _(Opcional)_ Contas no **[OpenRouter](https://openrouter.ai)**, **[Stripe](https://stripe.com)**, **[Asaas](https://asaas.com)** ou **[Telegram BotFather](https://t.me/BotFather)**: só se for usar as features opcionais

<br />

## Do zero ao ar

O caminho completo, da criação até o domínio próprio funcionando:

```mermaid
flowchart LR
    A["1 · create rubrica<br/>scaffolding interativo"] --> B["2 · convex dev<br/>provisiona backend"]
    B --> C["3 · rubrica setup<br/>JWT + vars + root"]
    C --> D["4 · Preenche<br/>no /admin"]
    D --> E["5 · Deploy<br/>no Vercel"]
    E --> F["6 · Domínio<br/>próprio"]

    classDef step fill:#F5F2EA,stroke:#4D7C5F,stroke-width:2px,color:#1A1A18
    class A,B,C,D,E,F step
```

### 1 · Criar o projeto

Nenhuma instalação prévia necessária: o npm/pnpm baixa o `create-rubrica` automaticamente:

```bash
pnpm create rubrica meu-portfolio
# ou: npm create rubrica meu-portfolio

cd meu-portfolio
```

O CLI faz tudo de forma interativa: escolha de layout, tema, fontes, plugins e identidade visual. Ao final, o projeto já está pronto para rodar.

### 2 · Provisionar o Convex

O Convex é o backend completo: banco, storage de imagens, autenticação e funções server-side.

```bash
npx convex dev
```

Na primeira vez, o CLI faz tudo sozinho: pede login no navegador, cria o projeto na sua conta, gera o `.env.local` com `VITE_CONVEX_URL` e `CONVEX_DEPLOY_KEY`, sobe o schema e as funções, e fica em modo watch. **Deixe rodando** enquanto desenvolve.

### 3 · Finalizar o setup

Em outro terminal, com o `npx convex dev` ainda rodando:

```bash
npx rubrica setup
```

Gera as chaves JWT, configura as variáveis no servidor Convex e **cria o usuário root** (pede email e senha interativamente). Ao final, o projeto está pronto em `http://localhost:3000`.

As variáveis de ambiente ficam descritas no `.env.local` gerado pelo Convex e no `.env.example` do projeto.

**Opcionais (só se ativar a feature correspondente):**

| Variável | Habilita |
|---|---|
| `OPENROUTER_API_KEY` | Tradução automática + geração de CV com IA |
| `STRIPE_WEBHOOK_SECRET` | Pagamentos via Stripe |
| `ASAAS_WEBHOOK_TOKEN` | Pagamentos via Asaas (PIX/boleto) |
| `TELEGRAM_BOT_TOKEN` | Notificações no Telegram |
| `TELEGRAM_ADMIN_CHAT_ID` | Chat onde as notificações chegam |
| `PLAYGROUND_KEY_PEPPER` | Fingerprint de API keys _(plugin playground)_ |
| `IMPORT_SECRET` | Endpoint HTTP de importação CSV |
| `VERCEL_WEBHOOK_SECRET` | Webhook de notificação de deploy |

### 4 · Preencher o conteúdo no admin

Logado em `/admin`, tudo é gerenciado por interface. Você não toca no código para mudar texto, imagem ou dado.

| Rota | O que você configura |
|---|---|
| `/admin/contact` | Nome, email, telefone, avatar, redes sociais |
| `/admin/home` | Texto "sobre", disponibilidade, serviços/skills |
| `/admin/projects` | Projetos do portfólio (imagens, tags, links, case study) |
| `/admin/blog` | Posts (editor rich text, tags, destaque) |
| `/admin/resume` | Currículo (experiências, formação, skills, idiomas, certificações) |
| `/admin/about` | Rotina diária + FAQ |
| `/admin/testimonials` | Depoimentos (curados ou recebidos via wizard público) |
| `/admin/plugins` | **Liga/desliga features** (blog, propostas, pagamentos, etc.) |

### 5 · Deploy no Vercel

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório no GitHub
2. **Framework preset:** Vite
3. **Build command:** já vem no `vercel.json` (`pnpm convex deploy && pnpm vite build`), não altere
4. **Output directory:** `dist`
5. **Adicione as env vars** (Settings → Environment Variables): `VITE_CONVEX_URL`, `CONVEX_URL`, `CONVEX_DEPLOY_KEY` _(sem essa, o build falha)_ e `SITE_URL`
6. Clique em **Deploy**

A partir daqui, todo `git push` na branch principal dispara um deploy automático.

### 6 · Domínio próprio

1. **Vercel → seu projeto → Settings → Domains → Add Domain**
2. Adicione `seudominio.com` e `www.seudominio.com`
3. **Configure o DNS** no seu registrador (Registro.br, Cloudflare, GoDaddy…):
   - Raiz (`seudominio.com`): registro **A** → `76.76.21.21`
   - `www`: registro **CNAME** → `cname.vercel-dns.com`
4. Aguarde a propagação (minutos a horas)
5. O SSL é emitido automaticamente pela Vercel via Let's Encrypt
6. **Atualize a `SITE_URL`** no Vercel para a URL final
7. Force um redeploy para regenerar `sitemap.xml` e `rss.xml`

<br />

## O fluxo de propostas

É aqui que o Rubrica vira ferramenta de fechar negócio, não só de mostrar trabalho. Da criação ao contrato assinado:

```mermaid
sequenceDiagram
    participant V as Você
    participant R as Rubrica
    participant C as Cliente
    participant T as Telegram

    V->>R: Cria proposta no /admin
    R->>R: Protege com senha
    V->>C: Envia o link
    C->>R: Abre e digita a senha
    R->>C: Mostra a proposta
    C->>R: Aceita + assina (manuscrita)
    R->>R: Gera contrato em PDF
    R-->>T: Notifica você 🔔
    Note over R,C: Aceite eletrônico registrado
```

<br />

## Quando ativar cada feature opcional

| Feature | Plugin (`/admin/plugins`) | Env vars | Conta externa |
|---|---|---|---|
| Pagamentos via Stripe | `payments` | `STRIPE_WEBHOOK_SECRET` | Stripe |
| Pagamentos PIX/Boleto | `payments` | `ASAAS_WEBHOOK_TOKEN` | Asaas |
| Geração de CV com IA | `ai-resumes` | `OPENROUTER_API_KEY` | OpenRouter |
| Tradução automática (i18n) | `i18n` | `OPENROUTER_API_KEY` | OpenRouter |
| Notificações Telegram | _(built-in)_ | `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_CHAT_ID` | BotFather |

> **Quer só o básico?** Se você quer apenas home + projetos + currículo, desative blog, propostas, pagamentos, IA e playground em `/admin/plugins`. As rotas somem da sidebar e do roteador.

<br />

## Atualizando o Rubrica

Quando uma nova versão do template for lançada, você pode puxar as melhorias sem sobrescrever suas customizações:

```bash
npx rubrica update
```

Para reconfigurar layout, tema ou plugins após a criação:

```bash
npx rubrica config
```

<br />

## Scripts úteis

```bash
# Projeto
pnpm dev          # dev local + convex em watch (porta 3000)
pnpm build        # convex deploy + RSS + sitemap + vite build
pnpm preview      # preview do build de produção
pnpm check        # type-check (tsc --noEmit)
pnpm format       # prettier
pnpm test         # vitest

# CLI Rubrica
npx rubrica setup    # pós-convex dev: JWT + validação
npx rubrica update   # atualiza template para nova versão
npx rubrica config   # reconfigura layout, tema ou plugins
```

<br />

## Estrutura do projeto

```
rubrica/
├── convex/              # Backend: schema, queries, mutations, actions
├── src/
│   ├── pages/           # Páginas públicas + /admin/*
│   ├── components/      # Componentes (UI, admin, layout)
│   ├── contexts/        # AuthContext, ThemeContext, PluginsContext
│   └── index.css        # ← Personalize cores e tema aqui
├── scripts/             # Build-time: RSS, sitemap, fetch de dados estáticos
├── public/              # Assets estáticos (favicon, dados gerados)
├── docs/features.md     # Referência técnica completa
├── .env.example         # Template de variáveis de ambiente
└── vercel.json          # Build command, rewrites SPA, security headers
```

> Procurando a referência técnica detalhada (schema do banco, lista de features, rotas, plugins, design system)? Veja [`docs/features.md`](./docs/features.md).

<br />

## Troubleshooting

| Sintoma | Causa provável |
|---|---|
| `convex deploy` falha no Vercel | Falta `CONVEX_DEPLOY_KEY` nas env vars do Vercel |
| Login não funciona após o setup | `rubrica setup` pode não ter concluído. Rode novamente; se o admin já existe, ele avisa e não sobrescreve |
| Plugin desativado ainda aparece em produção | Falta um redeploy para regenerar `public/data/plugins.json` |
| Notificações Telegram não chegam | Você ainda não enviou `/start` para o seu bot |
| Imagens quebradas após deploy | IDs do Convex Storage são por deployment; ao migrar dev → prod, reupload é necessário |

<br />

## Uma palavra antes de você publicar

Rubrica não é produto de empresa. É infraestrutura de comunidade. Quanto mais gente usa, melhora e distribui, mais sobe o nível médio de como profissionais se apresentam na web.

Mas portfólio sem cara é portfólio igual. Use a base sem culpa, e use bem. Gaste o tempo que economizou na sua identidade visual e na sua copy. É ali que mora a diferença entre "mais um" e um portfólio que marca.

Se o Rubrica te ajudou, considere mandar um PR. O objetivo é coletivo.

<br />

## Licença

GNU GPL v3.0. Veja [`LICENSE`](./LICENSE).

<br />

<div align="center">

Feito com ❤️ por **[Matheus Mierzwa](https://github.com/MierzwaMatheus)**

_Assine com a sua cara._

</div>