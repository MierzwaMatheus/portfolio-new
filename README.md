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
  - Edge Functions

### Pagamentos

- **Stripe** - Plataforma de pagamentos
  - Payment Links API
  - Produtos e Preços
  - Suporte a parcelamento
  - Integração via Edge Function

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
- **jsPDF** - Geração de PDFs no cliente
- **react-markdown** - Renderização de conteúdo markdown

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
- **Sistema de proteção por senha** (opcional)
- **Aceite eletrônico de propostas** (`/proposta/:id/aceitar`)
- **Geração de PDF do contrato** com assinatura digital
- Status visual (aprovada, pendente, expirada)
- **Banner de aceite** quando proposta foi aceita
- **Política de rescisão** expansível com renderização markdown
- Informações detalhadas do projeto
- **Sistema de sessões** para acesso seguro

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
- **Sistema de abas**: Todas / Aceitas
- **Proteção de propostas aceitas**: Não podem ser editadas ou excluídas
- Geração automática de slugs
- Validação de expiração
- Status de aprovação
- **Sistema de senha opcional** para acesso às propostas
- **Geração de senha aleatória** (8 caracteres A-Z, a-z, 0-9)
- **Botão de copiar senha** para área de transferência
- **Política de rescisão** editável com valor padrão
- **Versionamento automático**: Cria versão ao editar proposta não aceita
- Campos detalhados do projeto

#### 🏡 Gerenciamento de Home (`/admin/home`)
- Edição de conteúdo da página inicial
- Gerenciamento de serviços
- Gerenciamento de depoimentos

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
- Integração com Edge Function do Supabase

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
│   │   │   ├── PaymentLinks.tsx
│   │   │   └── Resume.tsx
│   │   ├── Blog.tsx
│   │   ├── BlogPost.tsx
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Proposal.tsx
│   │   ├── ProposalAccept.tsx
│   │   └── Resume.tsx
│   ├── App.tsx                # Componente raiz e rotas
│   ├── main.tsx               # Entry point
│   ├── constants/
│   │   └── rescisionPolicy.ts  # Política de rescisão padrão
│   ├── const.ts               # Constantes
│   └── index.css              # Estilos globais
├── supabase/
│   └── functions/             # Edge Functions
│       ├── create-user/
│       │   └── index.ts
│       └── stripe-api/
│           └── index.ts      # API para integração com Stripe
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

**Nota**: Para usar a funcionalidade de Links de Pagamento, você também precisará configurar a variável de ambiente `STRIPE_SECRET_KEY` no Supabase (veja seção [Configuração do Stripe](#configuração-do-stripe)).

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
   - `proposals` - Propostas comerciais (com campos de aceite e senha)
   - `proposal_versions` - Versões históricas das propostas
   - `proposal_sessions` - Sessões temporárias de acesso
   - `proposal_acceptances` - Registros de aceites eletrônicos
   - `services` - Serviços/habilidades
   - `testimonials` - Depoimentos
   - `content` - Conteúdo geral (chave-valor)
   - `contact_info` - Informações de contato
   - `user_app_roles` - Roles de usuários
   
2. **Funções RPC** no schema `public`:
   - `create_proposal_session` - Wrapper para criação de sessão
   - `register_proposal_acceptance` - Wrapper para registro de aceite
   - `get_proposal_acceptance` - Busca dados do aceite

2. **Storage Bucket** para upload de imagens

3. **Autenticação** configurada

4. **Row Level Security (RLS)** configurado adequadamente

### Stripe (Links de Pagamento)

Para utilizar a funcionalidade de Links de Pagamento, você precisa:

1. **Criar uma conta no Stripe**: Acesse [stripe.com](https://stripe.com) e crie sua conta

2. **Obter a chave secreta**: 
   - Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/apikeys)
   - Copie sua chave secreta (começa com `sk_`)

3. **Configurar variável de ambiente no Supabase**:
   - Acesse o Dashboard do Supabase
   - Vá em **Edge Functions** → **stripe-api** → **Settings**
   - Adicione a variável de ambiente:
     - Nome: `STRIPE_SECRET_KEY`
     - Valor: sua chave secreta do Stripe

4. **Habilitar parcelamento (opcional)**:
   - No Dashboard do Stripe, acesse **Settings** → **Payment methods**
   - Vá em **Card installments**
   - Habilite para Brasil
   - Configure os planos de parcelamento desejados (2x, 3x, 4x, etc.)

5. **Deploy da Edge Function**:
   - A Edge Function `stripe-api` já está configurada no projeto
   - Faça o deploy usando o MCP do Supabase ou CLI:
   ```bash
   supabase functions deploy stripe-api
   ```

#### Funcionalidades da Integração Stripe

- **Produtos**: Crie e gerencie produtos no Stripe
- **Preços**: Configure preços únicos ou recorrentes (assinaturas)
- **Links de Pagamento**: Gere links compartilháveis para pagamento
- **Parcelamento**: Suporte a parcelamento com ou sem juros (configurado no Dashboard do Stripe)
- **Moedas**: Suporte para BRL (Real) e USD (Dólar)
- **Exclusão**: Desativa produtos, preços e links (não é possível deletar permanentemente no Stripe)

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
- `/proposta/:id/aceitar` - Página de aceite eletrônico da proposta

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

## 🆕 Funcionalidades Recentes

### Sistema de Links de Pagamento com Stripe

O sistema implementa uma **integração completa com Stripe** para gerenciamento de pagamentos através de links compartilháveis.

#### Características Principais

- **Gerenciamento de Produtos**: Crie e gerencie produtos diretamente pela interface administrativa
- **Configuração de Preços**: 
  - Preços únicos (pagamento único)
  - Preços recorrentes (assinaturas mensais, anuais, etc.)
  - Suporte para múltiplas moedas (BRL, USD)
- **Links de Pagamento**: 
  - Gere links compartilháveis para cada produto/preço
  - Copie links para área de transferência
  - Abra links em nova aba
  - Exclua links quando necessário
- **Parcelamento**: 
  - Suporte a parcelamento com ou sem juros
  - Configuração através do Dashboard do Stripe
  - Disponibilidade automática baseada no cartão do cliente
  - Planos de 2x a 12x configuráveis

#### Interface Administrativa

A página `/admin/payment-links` oferece:

- **Visualização organizada**: Cards separados para Links, Produtos e Preços
- **Criação rápida**: Botões de ação rápida para criar novos itens
- **Valores destacados**: Badges coloridos mostrando valores formatados
- **Exclusão segura**: 
  - Confirmação antes de excluir
  - Avisos sobre dependências (preços associados a produtos, links associados a preços)
  - Desativação em vez de exclusão permanente (padrão do Stripe)
- **Filtros automáticos**: Apenas itens ativos são exibidos

#### Edge Function

A Edge Function `stripe-api` no Supabase fornece:

- `list_products` - Lista produtos ativos
- `create_product` - Cria novo produto
- `delete_product` - Desativa produto
- `list_prices` - Lista preços ativos
- `create_price` - Cria novo preço
- `delete_price` - Desativa preço
- `create_payment_link` - Cria link de pagamento
- `list_payment_links` - Lista links ativos
- `delete_payment_link` - Desativa link

#### Segurança

- Chave secreta do Stripe armazenada como variável de ambiente no Supabase
- Validação de parâmetros obrigatórios
- Tratamento de erros robusto
- CORS configurado adequadamente

### Sistema de Aceite Eletrônico de Propostas

O sistema implementa um **sistema completo de aceite eletrônico** com validade jurídica, incluindo:

#### Características Principais

- **Proteção por Senha**: Propostas podem ser protegidas com senha opcional
- **Sistema de Sessões**: Criação de sessões temporárias para acesso seguro
- **Aceite Eletrônico**: Página dedicada para aceite com coleta de dados do cliente
- **Assinatura Digital**: Registro completo do aceite com:
  - Nome completo do cliente
  - CPF/CNPJ
  - E-mail
  - Cargo/Função (opcional)
  - Declaração de poderes (para PJ)
  - Data e hora do aceite
- **Evidências Técnicas**: Registro de:
  - Hash SHA-256 do conteúdo da proposta
  - IP de origem
  - User-Agent
  - Versão da proposta aceita
- **Geração de PDF**: Contrato completo em PDF incluindo:
  - Todas as informações da proposta
  - Prazos e condições
  - Política de rescisão
  - Assinatura digital com evidências técnicas
  - Cláusula de foro

#### Versionamento

- **Criação automática de versões**: Ao editar uma proposta não aceita, uma nova versão é criada
- **Imutabilidade**: Propostas aceitas não podem ser editadas ou excluídas
- **Histórico completo**: Todas as versões são mantidas no banco de dados

#### Área Administrativa

- **Abas de organização**: Separação entre propostas "Todas" e "Aceitas"
- **Geração de senha**: Botão para gerar senha aleatória de 8 caracteres
- **Cópia de senha**: Botão para copiar senha para área de transferência
- **Campo de senha visível**: Senha exibida como texto normal (não oculto) na área admin
- **Política de rescisão**: Campo editável com valor padrão e renderização markdown

#### Segurança e Validade Jurídica

- **Cláusulas obrigatórias**: 
  - Cláusula de aceite eletrônico
  - Consentimento para tratamento de dados
  - Política de rescisão
  - Cláusula de foro
- **Integridade de dados**: Hash SHA-256 garante que o conteúdo não foi alterado
- **Rastreabilidade**: IP e User-Agent registrados para evidência técnica
- **Timestamp preciso**: Data e hora exatas do aceite

### Estrutura de Dados

O sistema utiliza as seguintes tabelas no schema `app_portfolio`:

- `proposals` - Propostas comerciais (com campos: `password`, `rescision_policy`, `version`, `is_accepted`, `accepted_at`)
- `proposal_versions` - Histórico de versões das propostas
- `proposal_sessions` - Sessões temporárias para acesso às propostas
- `proposal_acceptances` - Registros de aceites eletrônicos

### Funções RPC (Remote Procedure Calls)

- `create_proposal_session` - Cria sessão temporária para acesso à proposta
- `register_proposal_acceptance` - Registra aceite eletrônico da proposta
- `get_proposal_acceptance` - Busca dados do aceite de uma proposta

## 🔄 Próximas Melhorias

- [ ] Internacionalização (i18n)
- [ ] Modo claro/alto contraste
- [ ] Analytics integrado
- [ ] Otimizações de SEO adicionais
- [ ] Testes automatizados
- [ ] PWA (Progressive Web App)
- [ ] Notificações por e-mail ao aceitar proposta
- [ ] Dashboard de estatísticas de aceites

## 📄 Licença

GNU General Public License v3.0

---

Desenvolvido com ❤️ por Matheus Mierzwa





