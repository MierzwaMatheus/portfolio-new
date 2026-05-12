# Referência técnica — Portfolio

> Este arquivo é a **referência técnica completa** do sistema: schema do banco, lista exaustiva de features, rotas, plugins, design system e histórico de mudanças.
>
> Se você caiu aqui procurando como **publicar seu próprio portfólio**, volte para o [README.md](../README.md) na raiz do repositório — ele tem o passo-a-passo de deploy.

Portfólio pessoal profissional desenvolvido com React, TypeScript e Convex. Uma plataforma completa para exibir projetos, blog, currículo e propostas comerciais com painel administrativo integrado, geração de PDF com IA e tradução automática.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Páginas e Rotas](#páginas-e-rotas)
- [Sistema de Autenticação](#sistema-de-autenticação)
- [Componentes Principais](#componentes-principais)

## 🎯 Sobre o Projeto

Este é um portfólio profissional full-stack que combina uma interface pública elegante com um painel administrativo robusto. O projeto permite gerenciar projetos, posts de blog, informações de currículo, propostas comerciais e conteúdo do site através de uma interface administrativa intuitiva, com recursos avançados de IA para geração e reescrita de currículos e tradução automática de conteúdo.

### Características Principais

- **Design Moderno**: Interface com tema dark, animações suaves e design responsivo
- **CMS Integrado**: Sistema completo de gerenciamento de conteúdo
- **Multi-role**: Sistema de autenticação com diferentes níveis de permissão
- **SEO Friendly**: Estrutura otimizada para mecanismos de busca
- **Performance**: Construído com Vite para build rápido e otimizado
- **IA Integrada**: Tradução automática, geração de currículo com ATS scoring e reescrita via OpenRouter
- **Auditoria Completa**: Log de todas as mutações administrativas
- **Notificações Telegram**: Alertas em tempo real para o admin via bot Telegram

## 🛠 Tecnologias

### Frontend

- **React 19.2.1** - Biblioteca JavaScript para construção de interfaces
- **TypeScript 5.6.3** - Superset do JavaScript com tipagem estática
- **Vite 7.1.7** - Build tool e dev server
- **Wouter 3.3.5** - Roteamento leve para React
- **Framer Motion 12.23.22** - Biblioteca de animações

### Estilização

- **Tailwind CSS 4.1.14** - Framework CSS utility-first
- **Radix UI** - Componentes acessíveis e sem estilo
- **Lucide React** - Ícones modernos
- **next-themes** - Gerenciamento de temas

### Backend e Banco de Dados

- **Convex** - Backend as a Service reativo
  - Autenticação customizada
  - Banco de dados de documentos em tempo real
  - Storage para imagens e arquivos (incluindo assinaturas)
  - Actions para lógica server-side
  - Queries e mutations tipadas

### Inteligência Artificial

- **OpenRouter** - Gateway para múltiplos modelos de IA
  - **Tradução automática**: Tradução de conteúdo administrativo para múltiplos idiomas
  - **Geração de currículo (pipeline 3 etapas)**:
    - Gemini: Análise da descrição da vaga
    - GPT-5.4: Scoring de fit (ATS score) com forças e fraquezas
    - Claude Sonnet: Reescrita do CV para compatibilidade ATS
- **date-fns** - Manipulação de datas

### Pagamentos

- **Stripe** - Plataforma de pagamentos
  - Payment Links API
  - Produtos e Preços
  - Suporte a parcelamento
  - Integração via Edge Function (legada)

### Formulários e Validação

- **React Hook Form 7.64.0** - Gerenciamento de formulários
- **Zod 4.1.12** - Validação de schemas
- **@hookform/resolvers 5.2.2** - Resolvers para React Hook Form

### Editor de Texto Rico

- **TipTap 3.13.0** - Editor de texto rico extensível
- **@tiptap/starter-kit** - Kit inicial do TipTap

### Utilitários

- **Axios 1.12.0** - Cliente HTTP
- **Recharts 2.15.2** - Gráficos e visualizações
- **Sonner 2.0.7** - Sistema de notificações toast
- **nanoid 5.1.5** - Geração de IDs únicos
- **@dnd-kit** - Drag and drop para ordenação de itens
- **jsPDF** - Geração de PDFs no cliente (CV ATS, contratos)
- **react-markdown** - Renderização de conteúdo markdown
- **signature_pad** - Captura de assinatura manuscrita via canvas

## ✨ Funcionalidades

### Área Pública

#### 🏠 Página Inicial (`/`)
- Seção hero com apresentação pessoal
- Sobre mim (conteúdo gerenciável)
- Grid de serviços/habilidades
- Depoimentos de clientes
- Design responsivo e animações

#### 💼 Portfólio (`/portfolio`)
- Grid de projetos com filtros por tags
- Modal detalhado para cada projeto
- Carrossel de imagens por projeto
- Visualizador de imagens em tela cheia
- Links para demo e código-fonte
- Ordenação customizável via drag and drop

#### 📄 Currículo (`/curriculo`)
- Exibição estruturada de:
  - Resumo profissional
  - Experiências profissionais
  - Formação acadêmica
  - Habilidades técnicas
  - Idiomas
  - Certificações
  - Interesses pessoais
- Ordenação configurável via admin

#### 📝 Blog (`/blog`)
- Lista de posts publicados
- Posts em destaque
- Sistema de busca
- Filtros por tags
- Paginação
- Visualização individual de posts (`/blog/:slug`)
- Renderização de conteúdo markdown/HTML

#### 💼 Propostas (`/proposta/:id`)
- Visualização de propostas comerciais
- Sistema de validação de expiração (10 dias)
- **Sistema de proteção por senha** (opcional)
- **Aceite eletrônico de propostas** (`/proposta/:id/aceitar`)
- **Captura de assinatura manuscrita** via canvas (mouse ou touch)
- **Armazenamento de assinatura** no Convex Storage
- **Geração de PDF do contrato** com assinatura digital
- Status visual (aprovada, pendente, expirada)
- **Banner de aceite** quando proposta foi aceita
- **Política de rescisão** expansível com renderização markdown
- Informações detalhadas do projeto
- **Sistema de sessões** para acesso seguro

#### 💻 Terminal (`/terminal`)
- Interface de navegação estilo terminal
- Acesso ao conteúdo do portfólio via comandos

### Área Administrativa

#### 🔐 Autenticação
- Login via Convex (queries customizadas)
- Sistema de roles e permissões:
  - `root` - Acesso completo
  - `admin` - Acesso administrativo geral
  - `proposal-editor` - Editor de propostas
- Proteção de rotas baseada em roles

#### 📊 Dashboard (`/admin/dashboard`)
- Estatísticas gerais (projetos, artigos, propostas)
- Atalhos rápidos para criação de conteúdo
- Acesso rápido à galeria de imagens

#### 📁 Gerenciamento de Projetos (`/admin/projects`)
- CRUD completo de projetos
- Upload múltiplo de imagens (armazenadas por ID no Convex Storage)
- Sistema de tags
- Ordenação via drag and drop
- Preview de projetos
- Campos: título, descrição, descrição longa, tags, imagens, links
- **Tradução automática** via OpenRouter (apenas campos alterados)

#### ✍️ Gerenciamento de Blog (`/admin/blog`)
- CRUD de posts
- Editor de texto rico (TipTap)
- Sistema de tags
- Posts em destaque
- Status (rascunho/publicado)
- Slug automático
- **Tradução automática** via OpenRouter

#### 👤 Gerenciamento de Currículo (`/admin/resume`)
- CRUD de itens do currículo por categoria
- Tipos: experiência, educação, habilidades, idiomas, certificações, interesses
- Ordenação customizável
- **Tradução automática** via OpenRouter

#### 📋 Gerenciamento de Propostas (`/admin/proposals`)
- CRUD de propostas comerciais
- **Sistema de abas**: Todas / Aceitas
- **Proteção de propostas aceitas**: Não podem ser editadas ou excluídas
- **Download de contrato** para propostas aceitas (regenera PDF com assinatura)
- Geração automática de slugs
- Validação de expiração
- Status de aprovação
- **Sistema de senha opcional** para acesso às propostas
- **Geração de senha aleatória** (8 caracteres A-Z, a-z, 0-9)
- **Botão de copiar senha** para área de transferência
- **Política de rescisão** editável com valor padrão
- **Versionamento automático**: Cria versão ao editar proposta não aceita
- Campos detalhados do projeto

#### 🤖 Currículos com IA (`/admin/ai-resumes`)
- **Pipeline de 3 modelos via OpenRouter**:
  1. Gemini analisa a descrição da vaga
  2. GPT-5.4 pontua o fit do CV (ATS score) com forças e fraquezas
  3. Claude Sonnet reescreve o CV para compatibilidade ATS
- Input de descrição de vaga e seleção de locale
- Exibição do ATS score com badge visual
- Breakdown de forças e fraquezas do candidato
- Export do CV reescrito em PDF (via utilitário cvPDF)
- Saída sempre em português brasileiro
- Regras rígidas: sem pronomes pessoais, sem travessões, sem jargões de IA

#### 📄 Gerador de CV PDF (`/curriculo` com export)
- Geração de CV em PDF otimizado para ATS
- Resumo profissional como primeira seção
- Ordem ATS recomendada: Resumo, Habilidades, Soft Skills, Experiência, Educação, Cursos, Projetos, Idiomas, Voluntariado
- Cargo antes da empresa nas entradas de experiência/educação
- Tipografia ATS: margens 25mm, headings maiúsculos, texto 10.5pt, bullets disc
- Margem e espaçamento otimizados para leitura por sistemas ATS

#### 🏡 Gerenciamento de Home (`/admin/home`)
- Edição de conteúdo da página inicial
- Gerenciamento de serviços
- Gerenciamento de depoimentos
- **Tradução automática** via OpenRouter

#### 📧 Gerenciamento de Contato (`/admin/contact`)
- Edição de informações de contato
- Links de redes sociais
- Configuração de visibilidade de dados

#### 💳 Links de Pagamento (`/admin/payment-links`)
- **Gerenciamento completo de pagamentos via Stripe**
- CRUD de produtos no Stripe
- CRUD de preços (únicos e recorrentes)
- Criação de links de pagamento compartilháveis
- **Suporte a parcelamento** (com ou sem juros)
- Exclusão de produtos, preços e links
- Visualização de valores formatados
- Cópia rápida de links para área de transferência

#### 👥 Usuários (`/admin/users/new`)
- Criação de novos usuários (apenas root)
- Atribuição de roles

#### 📝 Logs de Auditoria (`/admin/audit`)
- Log completo de todas as mutações administrativas
- Labels descritivos para cada tipo de ação
- Rastreabilidade por usuário, data e operação

### Componentes Administrativos

- **ProjectDialog**: Modal para criar/editar projetos
- **ProposalDialog**: Modal para criar/editar propostas
- **ResumeExperienceDialog**: Modal para experiências do currículo
- **ImagePicker**: Seletor de imagens com upload para Convex Storage (por ID)
- **RichTextEditor**: Editor de texto rico baseado em TipTap
- **ProjectTagsInput**: Input para gerenciamento de tags
- **DownloadContractButton**: Download de contrato PDF para propostas aceitas

## 📁 Estrutura do Projeto

```
portfolio/
├── public/
│   ├── archives/          # Arquivos estáticos (CV, etc)
│   └── favicon.ico
├── convex/
│   ├── schema.ts          # Schema do banco de dados Convex
│   ├── auth.ts            # Autenticação Convex
│   ├── auditLogs.ts       # Mutations/queries de auditoria
│   ├── aiResumes.ts       # Action de geração de CV com IA
│   ├── proposals.ts       # Proposals + assinaturas no storage
│   └── ...                # Demais queries e mutations
├── src/
│   ├── components/
│   │   ├── admin/         # Componentes administrativos
│   │   │   ├── ImagePicker.tsx
│   │   │   ├── ProjectDialog.tsx
│   │   │   ├── ProjectTagsInput.tsx
│   │   │   ├── ProposalDialog.tsx
│   │   │   ├── ResumeExperienceDialog.tsx
│   │   │   ├── RichTextEditor.tsx
│   │   │   └── DownloadContractButton.tsx
│   │   ├── ui/            # Componentes UI do shadcn/ui
│   │   ├── ErrorBoundary.tsx
│   │   ├── Layout.tsx
│   │   ├── ManusDialog.tsx
│   │   ├── Map.tsx
│   │   ├── PageSkeleton.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── Sidebar.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Contexto de autenticação
│   │   └── ThemeContext.tsx   # Contexto de tema
│   ├── hooks/
│   │   ├── useComposition.ts
│   │   ├── useMobile.tsx
│   │   └── usePersistFn.ts
│   ├── lib/
│   │   ├── convex.ts          # Cliente Convex
│   │   └── utils.ts           # Funções utilitárias
│   ├── pages/
│   │   ├── admin/             # Páginas administrativas
│   │   │   ├── Blog.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── CreateUser.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Proposals.tsx
│   │   │   ├── PaymentLinks.tsx
│   │   │   ├── Resume.tsx
│   │   │   ├── AiResumes.tsx
│   │   │   └── AuditLogs.tsx
│   │   ├── Blog.tsx
│   │   ├── BlogPost.tsx
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Proposal.tsx
│   │   ├── ProposalAccept.tsx
│   │   ├── Resume.tsx
│   │   └── Terminal.tsx
│   ├── utils/
│   │   ├── contractPDF.ts     # Geração de PDF de contratos
│   │   └── cvPDF.ts           # Geração de CV PDF otimizado para ATS
│   ├── App.tsx                # Componente raiz e rotas
│   ├── main.tsx               # Entry point
│   ├── constants/
│   │   └── rescisionPolicy.ts  # Política de rescisão padrão
│   ├── const.ts               # Constantes
│   └── index.css              # Estilos globais
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json                # Configuração Vercel
└── README.md
```

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ e npm/pnpm
- Conta no Convex
- Conta no OpenRouter (para IA)
- Variáveis de ambiente configuradas

### Passos

1. Clone o repositório:
```bash
git clone <repository-url>
cd portfolio
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente (crie um arquivo `.env`):
```env
VITE_CONVEX_URL=sua_url_do_convex
VITE_APP_ID=id_do_app
```

4. Configure as variáveis de ambiente no Convex Dashboard:
```
OPENROUTER_API_KEY=sua_chave_openrouter
TELEGRAM_BOT_TOKEN=token_do_bot
TELEGRAM_ADMIN_CHAT_ID=seu_chat_id
```

5. Execute o Convex em modo desenvolvimento:
```bash
pnpm convex dev
```

6. Execute o servidor de desenvolvimento:
```bash
pnpm dev
```

## ⚙️ Configuração

### Convex

O projeto utiliza Convex como backend reativo. Certifique-se de configurar:

1. **Deploy do schema** com as collections:
   - `projects` - Projetos do portfólio
   - `posts` - Posts do blog
   - `resumeItems` - Itens do currículo (por categoria)
   - `proposals` - Propostas comerciais
   - `proposalVersions` - Versões históricas das propostas
   - `proposalSessions` - Sessões temporárias de acesso via senha
   - `proposalAcceptances` - Registros de aceites eletrônicos (com `signatureStorageId`)
   - `services` - Serviços/habilidades da página inicial
   - `testimonials` - Depoimentos curados pelo admin
   - `testimonialSubmissions` - Depoimentos enviados por clientes via wizard (pendentes de aprovação)
   - `homeContent` - Conteúdo chave-valor (inclui estado dos plugins)
   - `contactInfo` - Informações de contato e redes sociais
   - `contactRequests` - Solicitações de contato recebidas via wizard
   - `userRoles` - Roles dos usuários (root, admin, content-editor, blog-editor, proposal-editor)
   - `aiGeneratedResumes` - CVs gerados por IA
   - `auditLogs` - Logs de auditoria administrativa
   - `checkouts` - Sessões de checkout (Asaas/Stripe)
   - `rateLimits` - Controle de rate limiting por IP/fingerprint
   - `imageFolders` - Pastas do gerenciador de mídia
   - `images` - Metadados de imagens do Convex Storage
   - `playgroundLogs` - Eventos de uso da área de demonstrações (expiram em 24h)
   - `aboutDailyRoutines` - Itens da rotina diária (seção Sobre)
   - `aboutFaqs` - FAQ da seção Sobre

2. **Convex Storage** para upload de imagens e assinaturas

3. **Autenticação** configurada via Convex Auth

### OpenRouter (IA)

Para utilizar as funcionalidades de IA:

1. **Criar conta no OpenRouter**: Acesse [openrouter.ai](https://openrouter.ai) e crie sua conta

2. **Obter a chave de API**

3. **Configurar no Convex Dashboard**:
   - Acesse **Settings** → **Environment Variables**
   - Adicione: `OPENROUTER_API_KEY=sua_chave`

#### Modelos utilizados

| Funcionalidade | Modelo |
|---|---|
| Tradução de conteúdo | Configurável via OpenRouter |
| Análise de vaga (CV IA) | Gemini |
| ATS Scoring | GPT-5.4 |
| Reescrita ATS do CV | Claude Sonnet |

### Telegram (Notificações)

O sistema envia notificações automáticas via bot Telegram para o admin nos seguintes eventos:

| Evento | Gatilho | Conteúdo da mensagem |
|--------|---------|----------------------|
| ✅ Proposta aceita | Cliente aceita eletronicamente uma proposta | Nome, email, slug da proposta e valor do investimento |
| 💰 Pagamento confirmado | Webhook Stripe (`checkout.session.completed`) ou Asaas (`PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED`) confirma o pagamento | Nome do cliente, email, valor e link único do checkout |

As notificações são disparadas via `internalAction` (`convex/telegram.ts`) de forma assíncrona (fire-and-forget via `ctx.scheduler.runAfter`), portanto uma falha na entrega não afeta o fluxo principal.

#### Configuração

1. **Criar o bot**: Fale com [@BotFather](https://t.me/BotFather) no Telegram e use `/newbot` para obter o `TELEGRAM_BOT_TOKEN`

2. **Obter o chat ID**: Envie qualquer mensagem para o bot e acesse:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
   O campo `message.chat.id` é o seu `TELEGRAM_ADMIN_CHAT_ID`

3. **Ativar o bot**: Envie `/start` para o bot antes do primeiro uso (obrigatório para o Telegram permitir o envio)

4. **Configurar no Convex Dashboard** (Settings → Environment Variables):
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_ADMIN_CHAT_ID`

> As variáveis são opcionais: se não configuradas, as notificações são silenciosamente ignoradas.

### Stripe (Links de Pagamento)

Para utilizar a funcionalidade de Links de Pagamento, você precisa:

1. **Criar uma conta no Stripe**

2. **Obter a chave secreta** (começa com `sk_`)

3. **Configurar variável de ambiente no Supabase** (Edge Function legada):
   - Nome: `STRIPE_SECRET_KEY`

4. **Deploy da Edge Function**:
```bash
supabase functions deploy stripe-api
```

### Vercel (Deploy)

O projeto está configurado para deploy na Vercel com:
- Rewrites para SPA (Single Page Application)
- Build automático via Vite
- `convex deploy` executado antes do `vite build`

```json
// vercel.json - build command
"buildCommand": "pnpm convex deploy && pnpm vite build"
```

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev             # Inicia servidor de desenvolvimento na porta 3000
pnpm convex dev      # Inicia Convex em modo desenvolvimento

# Build
pnpm build           # Deploy Convex + build de produção

# Preview
pnpm preview         # Preview do build de produção

# Verificação
pnpm check           # Verifica tipos TypeScript

# Formatação
pnpm format          # Formata código com Prettier
```

## 🗺 Páginas e Rotas

### Rotas Públicas

- `/` - Página inicial
- `/portfolio` - Portfólio de projetos
- `/curriculo` - Currículo
- `/blog` - Lista de posts
- `/blog/:slug` - Post individual
- `/proposta/:id` - Visualização de proposta
- `/proposta/:id/aceitar` - Página de aceite eletrônico da proposta
- `/terminal` - Interface de navegação estilo terminal

### Rotas Administrativas

Todas as rotas administrativas são protegidas e requerem autenticação:

- `/login` - Página de login
- `/admin` ou `/admin/dashboard` - Dashboard (root, admin)
- `/admin/projects` - Gerenciamento de projetos (root, admin)
- `/admin/blog` - Gerenciamento de blog (root, admin)
- `/admin/resume` - Gerenciamento de currículo (root, admin)
- `/admin/proposals` - Gerenciamento de propostas (root, admin, proposal-editor)
- `/admin/home` - Gerenciamento da home (root, admin)
- `/admin/contact` - Gerenciamento de contato (root, admin)
- `/admin/payment-links` - Links de pagamento Stripe (root, admin)
- `/admin/ai-resumes` - Gerador de currículo com IA (root, admin)
- `/admin/logs` - Logs de auditoria (root)
- `/admin/lgpd` - Gestão de titulares LGPD — exportação e anonimização (apenas root)
- `/admin/users/new` - Criar usuário (apenas root)

## 🔒 Sistema de Autenticação

O sistema utiliza Convex Auth com um sistema customizado de roles:

### Roles Disponíveis

- **root**: Acesso total ao sistema
- **admin**: Acesso administrativo geral (exceto criação de usuários)
- **proposal-editor**: Acesso apenas ao gerenciamento de propostas

### Permissões

As permissões são verificadas através da collection `userAppRoles` no Convex, que armazena as relações entre usuários e roles. O contexto `AuthContext` gerencia o estado de autenticação via queries Convex e verifica permissões através do método `checkRole()`.

## 🎨 Componentes Principais

### Layout Components

- **Layout**: Layout principal com sidebar para páginas públicas
- **AdminLayout**: Layout com sidebar administrativa
- **Sidebar**: Sidebar pública com navegação e informações de contato
- **PageSkeleton**: Skeleton loader para estados de carregamento

### UI Components (shadcn/ui)

O projeto utiliza componentes do shadcn/ui, uma coleção de componentes React reutilizáveis baseados em Radix UI:

- Button, Card, Dialog, Input, Select, Textarea
- Badge, Avatar, Tabs, Accordion
- Carousel, Chart, Calendar
- E muitos outros componentes de UI

### Feature Components

- **ProtectedRoute**: Componente de rota protegida que verifica autenticação e roles
- **ErrorBoundary**: Tratamento de erros React
- **ImagePicker**: Upload e seleção de imagens do Convex Storage (por ID)
- **RichTextEditor**: Editor de texto rico para conteúdo
- **DownloadContractButton**: Download de PDF do contrato para propostas aceitas

## 🎨 Design System

### Cores Principais

- **Neon Purple**: Cor primária (#a855f7)
- **Neon Lime**: Cor secundária para destaques
- **Dark Background**: Fundo escuro (#0f0f0f, #121212)
- **Card Background**: Fundo de cards (#1e1e1e)

### Tipografia

- Fontes do sistema (system-ui)
- Fontes mono para elementos de código

### Animações

- Transições suaves com Framer Motion
- Hover effects nos elementos interativos
- Animações de entrada/saída nas páginas

## 📝 Notas de Desenvolvimento

- O projeto utiliza TypeScript em modo strict
- Path aliases configurados (`@/` para `src/`)
- Vite para build rápido e HMR
- Tailwind CSS com configuração customizada
- Sistema de temas preparado (dark mode implementado)
- Imagens armazenadas por ID no Convex Storage (não por URL)

## 🧩 Sistema de Plugins

O projeto possui um sistema de plugins que permite ativar ou desativar funcionalidades independentemente, sem afetar o restante do sistema. Ideal para quem faz fork do projeto e não precisa de tudo.

### Como funciona

Cada plugin controla:
- **Backend**: funções Convex retornam vazio (queries) ou lançam erro (mutations) quando desativado — mesmo acesso direto via SDK é bloqueado
- **Frontend público**: links somem da sidebar automaticamente, rotas retornam 404
- **Frontend admin**: itens da sidebar admin desaparecem, rotas retornam 404

O estado dos plugins é armazenado na tabela `homeContent` com chaves `plugin:<id>:enabled`. Em produção, o estado é buscado uma única vez via `fetch('/data/plugins.json')` (gerado no build) e cacheado pelo browser — sem requests em tempo real ao Convex.

### Plugins disponíveis

| Plugin | Rotas admin | Rotas públicas | minRole | Sub-plugin de |
|--------|-------------|----------------|---------|---------------|
| `contact-wizard` | `/admin/contatos`, `/admin/contact` | — | admin | — |
| `proposals` | `/admin/proposals` | `/proposta/:id`, `/proposta/:slug/aceitar` | admin | — |
| `payments` | `/admin/payment-links` | `/checkout/:link`, `/payment-success/:link` | admin | — |
| `blog` | `/admin/blog` | `/blog`, `/blog/:slug` | admin | — |
| `portfolio` | `/admin/projects` | `/portfolio`, `/portfolio/:slug` | admin | — |
| `resume` | `/admin/resume` | `/curriculo` | admin | — |
| `about` | `/admin/about` | `/sobre` | admin | — |
| `ai-resumes` | `/admin/ai-resumes` | — | root | — |
| `audit-log` | `/admin/logs` | — | root | — |
| `media-manager` | — | — | root | — |
| `i18n` | — | — | root | — |
| `playground` | — | `/playground` | root | — |
| `testimonials` | `/admin/depoimentos` | `/depoimentos` | admin | — |
| `testimonials-intake` | — | — | admin | `testimonials` |

### Sub-plugins

Alguns plugins têm funcionalidades opcionais que podem ser controladas de forma independente. Esses são chamados de **sub-plugins** — eles ficam aninhados abaixo do plugin pai na interface de gerenciamento e só fazem sentido quando o pai está ativo.

O sub-plugin `testimonials-intake` é o exemplo atual: controla exclusivamente o **formulário público de envio de depoimentos** (wizard de submissão, upload de vídeo, fila de moderação). Ele pode ser desativado enquanto o plugin `testimonials` permanece ativo, o que mantém a exibição pública de depoimentos mas remove o canal de envio por visitantes. Útil quando o admin quer pausar novos envios sem tirar os depoimentos já publicados do ar.

Para criar um sub-plugin, basta adicionar `parentId: 'id-do-pai'` na definição do plugin em `convex/pluginRegistry.ts`.

### Gerenciamento

Acesse `/admin/plugins` para ativar ou desativar plugins via interface. A mudança só entra em vigor para visitantes públicos após um novo deploy (que regenera `plugins.json`). No admin, a mudança é imediata.

### Adicionando um novo plugin

1. Adicionar entrada em `convex/pluginRegistry.ts`
2. Adicionar `await requirePlugin(ctx, 'meu-plugin')` nas mutations e `if (!(await isPluginEnabled(ctx, 'meu-plugin'))) return []` nas queries públicas
3. Adicionar `pluginId: 'meu-plugin'` no navItem do `Dashboard.tsx`
4. Envolver a rota em `<PluginRoute pluginId="meu-plugin">` no `App.tsx`

---

## 🆕 Funcionalidades Recentes

### Migração Supabase → Convex

O backend foi migrado completamente de Supabase para **Convex**:

- Banco de dados de documentos reativo em tempo real
- Storage de arquivos unificado (imagens e assinaturas)
- Actions server-side para lógica de IA e integrações
- Autenticação convertida para queries Convex
- Imagens migradas para referência por ID em vez de URL

### Interface Terminal

- Nova rota `/terminal` com interface estilo terminal
- Navegação pelo portfólio via comandos de texto

### Logs de Auditoria

- Todas as mutações administrativas geram registros de auditoria
- Labels descritivos para cada tipo de operação
- Página `/admin/logs` para visualização e rastreabilidade
- Retenção de 2 anos com anonimização de IP após 90 dias

### Notificações Telegram

- Bot Telegram envia alertas em tempo real para o admin
- **Proposta aceita**: disparado na mutation `proposals:accept`
- **Pagamento confirmado**: disparado na mutation interna `checkouts:markPaidByLink`, chamada pelos webhooks do Stripe e Asaas
- Implementado como `internalAction` fire-and-forget (`convex/telegram.ts`)

### Tradução Automática com IA

O sistema implementa **tradução automática** de conteúdo via OpenRouter:

- Integrada em todas as páginas administrativas (projetos, blog, currículo, home)
- Envia **apenas os campos modificados** para tradução (otimização de tokens)
- Suporte a múltiplos locales/idiomas
- Função `getChangedTranslatableFields` identifica quais campos foram alterados

### Gerador de Currículo com IA (Pipeline 3 Etapas)

Pipeline completo de reescrita de CV para ATS via OpenRouter:

1. **Gemini** — analisa a descrição da vaga e extrai requisitos
2. **GPT-5.4** — pontua o fit do CV (0–100), identifica forças e fraquezas
3. **Claude Sonnet** — reescreve o CV completo para compatibilidade ATS

Regras rígidas de saída: sem pronomes pessoais, sem travessões, sem jargões de IA ("leveraged", "spearheaded", etc.), sempre em português brasileiro.

CVs gerados são armazenados na collection `aiGeneratedResumes` com score, análise e dados completos para regeneração de PDF.

### Gerador de CV PDF Otimizado para ATS

- Ordem de seções otimizada para sistemas ATS
- Resumo profissional como primeira seção (após contato)
- Cargo exibido antes da empresa em experiências/educação
- Tipografia configurada: margens 25mm, headings 12pt maiúsculos, corpo 10.5pt

### Assinatura Manuscrita em Propostas

- Canvas interativo para captura de assinatura com mouse ou touch
- Assinatura armazenada como PNG no **Convex Storage** (`signatureStorageId`)
- Botão "Download Contrato" na área admin regenera o PDF com a assinatura armazenada
- `sessionId` agora opcional em `proposalAcceptances` para suportar aceites diretos

### Sistema de Links de Pagamento com Stripe

Integração completa com Stripe para gerenciamento de pagamentos via links compartilháveis (ver configuração Stripe acima).

### Sistema de Aceite Eletrônico de Propostas

Sistema completo de aceite com validade jurídica:

- **Captura de assinatura manuscrita** via canvas
- **Evidências técnicas**: Hash SHA-256, IP, User-Agent, versão da proposta
- **PDF do contrato** com assinatura, cláusulas obrigatórias e foro
- **Imutabilidade**: Propostas aceitas são bloqueadas para edição/exclusão
- **Versionamento automático** ao editar propostas não aceitas

### Gerenciamento de Usuários

O sistema de usuários vai além da criação básica. Na primeira vez que o projeto é acessado sem nenhum usuário root cadastrado, o sistema exibe automaticamente uma tela de setup inicial para criar a conta root — não é possível acessar o admin sem isso. A partir daí, apenas o root pode criar novos usuários (`/admin/users/new`), que são criados com email e senha e um role pré-definido. Todo usuário criado pelo admin recebe uma flag de **troca de senha obrigatória no primeiro login**: o sistema bloqueia o acesso até que a troca seja realizada, evitando que credenciais temporárias fiquem ativas.

Os roles disponíveis são: `root` (acesso total), `admin` (acesso geral), `content-editor`, `blog-editor` e `proposal-editor`.

---

### Wizard de Contato

O portfólio tem um fluxo de contato adaptativo acessível pela sidebar pública. Em vez de um formulário simples, é um wizard em etapas que coleta nome, objetivo, orçamento e prazo antes de enviar. O envio tem **rate limiting por IP** para evitar spam. Cada solicitação recebida aparece no painel admin em `/admin/contatos`, onde o admin pode marcar como lida, atualizar o status (pendente / em andamento / concluída) e adicionar notas internas. Uma notificação Telegram é disparada automaticamente ao receber uma nova solicitação.

---

### Wizard de Depoimentos

Clientes podem enviar depoimentos de forma autônoma via wizard público, sem precisar de login. O wizard aceita depoimento em texto ou em vídeo (upload direto para o Convex Storage). Há uma cota diária de uploads de vídeo para evitar abuso. Cada envio vai para uma fila de aprovação em `/admin/testimonials` (aba "Submissões"), onde o admin pode aprovar, rejeitar ou aprovar e publicar diretamente. Quando publicado, o depoimento passa a aparecer na área pública. Uma notificação Telegram é disparada a cada nova submissão.

---

### Seção Sobre (`/sobre`)

A seção Sobre é completamente gerenciável via admin (`/admin/about`). Além do texto de apresentação, o admin pode gerenciar dois blocos de conteúdo adicionais:
- **Rotina diária**: lista de atividades e hábitos do dia a dia, exibida na página pública
- **FAQ**: perguntas e respostas frequentes sobre o trabalho, também exibidas publicamente

---

### Gerenciador de Mídia

Todas as imagens usadas no sistema ficam centralizadas no Convex Storage. O gerenciador de mídia permite organizar as imagens em **pastas com hierarquia**, fazer upload via interface e reutilizar imagens já enviadas em qualquer parte do sistema (projetos, depoimentos, etc.) pelo seletor `ImagePicker`. As imagens são referenciadas por ID — nunca por URL direta — o que garante que o Storage Convex permaneça como fonte única de verdade.

---

### Checkout com Asaas (Boleto/PIX)

Além do Stripe, o sistema tem integração com o **Asaas** para geração de cobranças via boleto bancário e PIX. O fluxo funciona assim: o admin cria um checkout com valor e dados do cliente; o sistema cria o cliente no Asaas (ou reutiliza se já existir) e gera a cobrança. O cliente acessa o link de checkout em `/checkout/:link`, vê os dados da cobrança e acompanha o status. Quando o pagamento é confirmado pelo webhook do Asaas, o sistema marca o checkout como pago automaticamente e dispara uma notificação Telegram ao admin.

---

### Área de Playground (`/playground`)

O Playground é uma área pública de demonstração onde visitantes podem experimentar funcionalidades do sistema sem precisar criar conta. Cada demo é isolada e usa dados fictícios. O uso de IA no playground é controlado por rate limiting por IP para limitar custos. Os eventos de uso são registrados anonimamente e expiram em 24h.

---

### Soft Delete em Todo o Sistema

Nenhum dado é apagado permanentemente por padrão. Todas as entidades gerenciáveis (projetos, posts, propostas, depoimentos, itens de currículo, serviços, imagens, checkouts, etc.) usam **soft delete**: ao excluir, o registro é marcado como deletado e some das listagens, mas permanece no banco. O admin pode visualizar os itens deletados na página de auditoria e restaurá-los se necessário. A exclusão permanente é uma ação separada, explícita, com confirmação.

---

### Tarefas Automáticas de Manutenção

O sistema executa rotinas automáticas via cron jobs do Convex para manter o banco limpo:
- Sessões expiradas de propostas são removidas diariamente
- Entradas de rate limiting expiradas são limpas diariamente
- Logs de auditoria com mais de 2 anos são removidos semanalmente
- IPs nos logs de auditoria com mais de 90 dias são anonimizados diariamente (conformidade com LGPD)
- Checkouts pendentes há mais de 24h são expirados a cada hora
- Logs de uso do playground são limpos diariamente

---

### Gestão de Titulares LGPD (`/admin/lgpd`)

Painel exclusivo para `root` que centraliza o cumprimento dos direitos dos titulares previstos na Lei 13.709/18.

#### Busca
O titular é identificado por **e-mail** e/ou **CPF/CNPJ** — qualquer um dos dois é suficiente para localizar registros. A busca retorna um resumo de quantos registros com dados pessoais existem em cada tabela.

#### Exportação de dados (Art. 18, II — direito de acesso)
O botão **Exportar JSON** gera um arquivo com todos os dados do titular encontrados nas seguintes tabelas:

| Tabela | Dados exportados |
|--------|-----------------|
| `proposalAcceptances` | nome, CPF/CNPJ, e-mail, cargo, declaração, assinatura, hash SHA-256 |
| `contactRequests` | nome, e-mail, telefone, LinkedIn, empresa, respostas do wizard |
| `testimonialSubmissions` | nome, e-mail, empresa, texto do depoimento |
| `checkouts` | nome, e-mail, CPF/CNPJ, valor pago, status |

#### Anonimização (Art. 18, VI — direito de eliminação)
O botão **Anonimizar tudo** exibe um diálogo de confirmação e, após aprovação, substitui todos os dados pessoais do titular por `[ANONIMIZADO]` nas mesmas tabelas acima, além de anonimizar referências ao e-mail nos logs de auditoria. A operação:

- **Preserva a integridade contratual**: o `contentHash` SHA-256 original da proposta é mantido intacto como prova criptográfica de que o contrato existiu; apenas os campos de identificação dentro do `contentSnapshot` são substituídos
- **Abrange CPF/CNPJ**: o `clientDocument` e o CPF dentro do snapshot JSON do contrato são anonimizados
- **Marca o registro**: adiciona `anonymizedAt` (timestamp) e `_anonymizedAt` no snapshot para rastreabilidade
- **É irreversível**: registros em si são preservados para integridade, mas sem identificação pessoal
- **Gera auditoria**: toda execução é registrada no log com o identificador usado (e-mail ou CPF) e a contagem de registros afetados

---

### Setup Inicial com Seed

Ao criar um novo ambiente, o admin pode executar o seed para popular o banco com dados iniciais de exemplo (informações de contato, serviços e conteúdo da home), acelerando a configuração inicial do portfólio.

---

## 🔄 Próximas Melhorias

- [ ] Internacionalização (i18n)
- [ ] Modo claro/alto contraste
- [ ] Analytics integrado
- [ ] Otimizações de SEO adicionais
- [ ] Testes automatizados
- [ ] PWA (Progressive Web App)
- [ ] Notificações por e-mail ao aceitar proposta (Telegram já implementado)
- [ ] Dashboard de estatísticas de aceites

## 📄 Licença

GNU General Public License v3.0

---

Desenvolvido com ❤️ por Matheus Mierzwa
