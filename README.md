# Portfolio

Portfólio pessoal profissional desenvolvido com React, TypeScript e Supabase. Uma plataforma completa para exibir projetos, blog, currículo e propostas comerciais com painel administrativo integrado.

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

Este é um portfólio profissional full-stack que combina uma interface pública elegante com um painel administrativo robusto. O projeto permite gerenciar projetos, posts de blog, informações de currículo, propostas comerciais e conteúdo do site através de uma interface administrativa intuitiva.

### Características Principais

- **Design Moderno**: Interface com tema dark, animações suaves e design responsivo
- **CMS Integrado**: Sistema completo de gerenciamento de conteúdo
- **Multi-role**: Sistema de autenticação com diferentes níveis de permissão
- **SEO Friendly**: Estrutura otimizada para mecanismos de busca
- **Performance**: Construído com Vite para build rápido e otimizado

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

- **Supabase 2.87.1** - Backend as a Service (BaaS)
  - Autenticação
  - Banco de dados PostgreSQL
  - Storage para imagens

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
- Download de proposta em PDF
- Status visual (aprovada, pendente, expirada)
- Informações detalhadas do projeto

### Área Administrativa

#### 🔐 Autenticação
- Login via Supabase Auth
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
- Upload múltiplo de imagens
- Sistema de tags
- Ordenação via drag and drop
- Preview de projetos
- Campos: título, descrição, descrição longa, tags, imagens, links

#### ✍️ Gerenciamento de Blog (`/admin/blog`)
- CRUD de posts
- Editor de texto rico (TipTap)
- Sistema de tags
- Posts em destaque
- Status (rascunho/publicado)
- Slug automático

#### 👤 Gerenciamento de Currículo (`/admin/resume`)
- CRUD de itens do currículo por categoria
- Tipos: experiência, educação, habilidades, idiomas, certificações, interesses
- Ordenação customizável

#### 📋 Gerenciamento de Propostas (`/admin/proposals`)
- CRUD de propostas comerciais
- Geração automática de slugs
- Validação de expiração
- Status de aprovação
- Campos detalhados do projeto

#### 🏡 Gerenciamento de Home (`/admin/home`)
- Edição de conteúdo da página inicial
- Gerenciamento de serviços
- Gerenciamento de depoimentos

#### 📧 Gerenciamento de Contato (`/admin/contact`)
- Edição de informações de contato
- Links de redes sociais
- Configuração de visibilidade de dados

#### 👥 Usuários (`/admin/users/new`)
- Criação de novos usuários (apenas root)
- Atribuição de roles

### Componentes Administrativos

- **ProjectDialog**: Modal para criar/editar projetos
- **ProposalDialog**: Modal para criar/editar propostas
- **ResumeExperienceDialog**: Modal para experiências do currículo
- **ImagePicker**: Seletor de imagens com upload para Supabase Storage
- **RichTextEditor**: Editor de texto rico baseado em TipTap
- **ProjectTagsInput**: Input para gerenciamento de tags

## 📁 Estrutura do Projeto

```
portfolio/
├── public/
│   ├── archives/          # Arquivos estáticos (CV, etc)
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── admin/         # Componentes administrativos
│   │   │   ├── ImagePicker.tsx
│   │   │   ├── ProjectDialog.tsx
│   │   │   ├── ProjectTagsInput.tsx
│   │   │   ├── ProposalDialog.tsx
│   │   │   ├── ResumeExperienceDialog.tsx
│   │   │   └── RichTextEditor.tsx
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
│   │   ├── supabase.ts        # Cliente Supabase
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
│   │   │   └── Resume.tsx
│   │   ├── Blog.tsx
│   │   ├── BlogPost.tsx
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Proposal.tsx
│   │   └── Resume.tsx
│   ├── App.tsx                # Componente raiz e rotas
│   ├── main.tsx               # Entry point
│   ├── const.ts               # Constantes
│   └── index.css              # Estilos globais
├── supabase/
│   └── functions/             # Edge Functions
│       └── create-user/
│           └── index.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json                # Configuração Vercel
└── README.md
```

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ e npm/pnpm
- Conta no Supabase
- Variáveis de ambiente configuradas

### Passos

1. Clone o repositório:
```bash
git clone <repository-url>
cd portfolio
```

2. Instale as dependências:
```bash
npm install
# ou
pnpm install
```

3. Configure as variáveis de ambiente (crie um arquivo `.env`):
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_APP_ID=id_do_app
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

## ⚙️ Configuração

### Supabase

O projeto utiliza Supabase como backend. Certifique-se de configurar:

1. **Schema `app_portfolio`** com as seguintes tabelas:
   - `projects` - Projetos do portfólio
   - `posts` - Posts do blog
   - `resume_items` - Itens do currículo
   - `proposals` - Propostas comerciais
   - `services` - Serviços/habilidades
   - `testimonials` - Depoimentos
   - `content` - Conteúdo geral (chave-valor)
   - `contact_info` - Informações de contato
   - `user_app_roles` - Roles de usuários

2. **Storage Bucket** para upload de imagens

3. **Autenticação** configurada

4. **Row Level Security (RLS)** configurado adequadamente

### Vercel (Deploy)

O projeto está configurado para deploy na Vercel com:
- Rewrites para SPA (Single Page Application)
- Build automático via Vite

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento na porta 3000

# Build
npm run build        # Cria build de produção

# Preview
npm run preview      # Preview do build de produção

# Verificação
npm run check        # Verifica tipos TypeScript

# Formatação
npm run format       # Formata código com Prettier
```

## 🗺 Páginas e Rotas

### Rotas Públicas

- `/` - Página inicial
- `/portfolio` - Portfólio de projetos
- `/curriculo` - Currículo
- `/blog` - Lista de posts
- `/blog/:slug` - Post individual
- `/proposta/:id` - Visualização de proposta

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
- `/admin/users/new` - Criar usuário (apenas root)

## 🔒 Sistema de Autenticação

O sistema utiliza Supabase Auth com um sistema customizado de roles:

### Roles Disponíveis

- **root**: Acesso total ao sistema
- **admin**: Acesso administrativo geral (exceto criação de usuários)
- **proposal-editor**: Acesso apenas ao gerenciamento de propostas

### Permissões

As permissões são verificadas através da tabela `user_app_roles` no Supabase, que armazena as relações entre usuários e roles. O contexto `AuthContext` gerencia o estado de autenticação e verifica permissões através do método `checkRole()`.

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
- **ImagePicker**: Upload e seleção de imagens do Supabase Storage
- **RichTextEditor**: Editor de texto rico para conteúdo

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

## 🔄 Próximas Melhorias

- [ ] Internacionalização (i18n)
- [ ] Modo claro/alto contraste
- [ ] Analytics integrado
- [ ] Otimizações de SEO adicionais
- [ ] Testes automatizados
- [ ] PWA (Progressive Web App)

## 📄 Licença

GNU General Public License v3.0

---

Desenvolvido com ❤️ por Matheus Mierzwa


