# PRD — Rubrica CLI + Desacoplamento de Dados Pessoais

**Versão:** 1.1  
**Status:** Em planejamento  
**Autor:** Matheus Mierzwa  
**Produto:** Rubrica — sistema de portfólio profissional (React + Convex)

---

## 1. Visão Geral

O Rubrica hoje é um portfólio pessoal que funciona como template público. Para virar um produto real, dois problemas precisam ser resolvidos em conjunto:

1. **Dados pessoais hardcoded** espalhados pelo código — qualquer pessoa que fork o projeto herda nome, avatar, SEO, RSS e fallbacks do autor original.
2. **Ausência de ferramental de configuração** — personalização visual exige edição manual de múltiplos arquivos sem guia.

Este PRD especifica o trabalho necessário para transformar o Rubrica num template genuinamente neutro, acompanhado de uma CLI que instancia, configura e atualiza projetos derivados.

---

## 2. Objetivos

- Eliminar todos os dados pessoais hardcoded do código-fonte do template
- Criar uma tabela `siteConfig` no Convex como fonte de verdade em runtime para configurações do site
- Criar o arquivo `rubrica.config.ts` como fonte de verdade em build-time (RSS, sitemap, SEO estático)
- Adicionar seção de Aparência no painel admin (cores, fonte, radius — nunca layout)
- Entregar uma CLI com três comandos: `create`, `config` e `update`
- Garantir que atualizações do template possam ser aplicadas a projetos existentes sem perder customizações do usuário
- Todo o desenvolvimento seguirá **TDD (Test-Driven Development)**: testes escritos antes da implementação para toda lógica da CLI e mutations/queries do Convex

---

## 3. Levantamento Completo de Dados Hardcoded

### 3.1 `src/components/SEO.tsx`

| Campo | Valor atual hardcoded |
|---|---|
| `siteTitle` | `"Matheus Mierzwa \| Desenvolvedor Front-end Sênior & Tech Lead React"` |
| `defaultDescription` | `"Desenvolvedor Front-end Sênior e Tech Lead especializado em React…"` |
| `defaultImage` (OG) | `"https://i.postimg.cc/65bvTHHJ/og-image-port-math-100.jpg"` |
| `siteUrl` | `"https://www.mmlo.com.br"` |
| `og:site_name` | `"Matheus Mierzwa Portfolio"` |
| `og:locale` | `"pt_BR"` (hardcoded, não usa i18n) |
| `twitter:creator` | `"@matheusmierzwa"` |
| Lógica de `fullTitle` | `` `${title} \| Matheus Mierzwa` `` |

**Solução:** todos esses valores passam a ser lidos do `rubrica.config.ts` (fallback estático) com override do `siteConfig` do Convex em runtime via hook `useSiteConfig()`.

---

### 3.2 `src/components/Sidebar.tsx`

| Campo | Valor atual hardcoded |
|---|---|
| Fallback de avatar | `"https://i.postimg.cc/6pWwxrLf/IMG_20220823_232153-2.jpg"` |
| Fallback de nome | `"Matheus Mierzwa"` (2 ocorrências — img alt e h1) |
| Fallback de role | `"Front-End Developer"` |

**Solução:** fallbacks passam a ser strings neutras: `""`, `""`, `""`. O avatar sem imagem renderiza um placeholder com inicial do nome via `contactInfo.name`.

---

### 3.3 `src/utils/cvPDF.ts`

| Campo | Valor atual hardcoded |
|---|---|
| Fallback de nome no PDF | `"MATHEUS MIERZWA"` |

**Solução:** fallback passa a ser `contactInfo.name.toUpperCase()` ou string vazia. Nenhum nome pessoal no código.

---

### 3.4 `index.html`

| Campo | Valor atual hardcoded |
|---|---|
| `<title>` | `"Matheus Mierzwa \| Desenvolvedor Front-end Sênior…"` |
| `<meta name="description">` | Descrição pessoal |
| `<link rel="canonical">` | `"https://www.mmlo.com.br/"` |
| Todas as tags `og:*` | URLs, título, imagem e `og:site_name` pessoais |
| Todas as tags `twitter:*` | URL, título, imagem e `@matheusmierzwa` |
| `<meta name="theme-color">` | `"#6D28D9"` (cor pessoal) |
| `<meta name="author">` | `"Matheus Mierzwa"` |
| `<meta name="keywords">` | Keywords pessoais |
| `<link rel="alternate" rss>` | `"Matheus Mierzwa - Blog RSS Feed"` |
| Font import | `Chakra Petch` hardcoded no `<head>` |

**Solução:** a CLI injeta os valores corretos em `index.html` durante o `create` e `config`, lendo de `rubrica.config.ts`. O SEO dinâmico por página é responsabilidade do `SEO.tsx` via `react-helmet-async`.

---

### 3.5 `scripts/generate-rss-feed.ts`

| Campo | Valor atual hardcoded |
|---|---|
| `RSS_CONFIG.siteTitle` | `"Matheus Mierzwa - Blog"` |
| `RSS_CONFIG.siteDescription` | Descrição pessoal |
| `RSS_CONFIG.authorName` | `"Matheus Mierzwa"` |
| `RSS_CONFIG.authorEmail` | `"contato@matheusmierzwa.com"` |
| `RSS_CONFIG.copyright` | `"Copyright © Matheus Mierzwa…"` |
| Fallback de `SITE_URL` | `"https://matheusmierzwa.com"` |

**Solução:** o script passa a importar `rubrica.config.ts` diretamente. Zero dependência de Convex em build-time para esses valores.

---

### 3.6 `scripts/generate-sitemap.ts`

| Campo | Valor atual hardcoded |
|---|---|
| Fallback de `SITE_URL` | `"https://www.mmlo.com.br"` |

**Solução:** `SITE_URL` lido de `rubrica.config.ts`. Fallback neutro apenas se o campo estiver vazio no config.

---

### 3.7 `src/pages/Home.tsx`

| Campo | Valor atual hardcoded |
|---|---|
| SEO `title` | `"Desenvolvedor Front-end Sênior & Tech Lead React"` |
| SEO `description` | Descrição pessoal |

**Solução:** valores lidos do `siteConfig` Convex via `useSiteConfig()` (chaves `seo_home_title`, `seo_home_description`). Fallback estático vem de `rubrica.config.ts`.

---

## 4. Arquitetura de Configuração — Três Camadas

A configuração do Rubrica é separada em três camadas com responsabilidades distintas. **Ignorar essa separação é um erro de arquitetura** — toda nova funcionalidade que lida com configuração deve respeitar as três camadas.

### 4.1 `rubrica.config.ts` — Build-time e fallback estático

Gerado pela CLI durante o `create`, commitado no repositório do usuário, nunca sobrescrito pelo `update`. É a fonte de verdade para tudo que precisa existir **antes** do Convex estar disponível: scripts de build (RSS, sitemap), `index.html`, fallbacks do `SEO.tsx`.

```typescript
// rubrica.config.ts — gerado pela CLI, editável manualmente
export const rubricalConfig = {
  // Identidade
  siteName: "Matheus Mierzwa | Dev Full-Stack",
  siteUrl: "https://meusite.com",
  siteDescription: "Portfólio profissional de desenvolvimento e arquitetura.",
  authorName: "Matheus Mierzwa",
  authorEmail: "contato@meusite.com",
  twitterHandle: "matheusmierzwa",   // sem @
  lang: "pt-BR",

  // SEO por página
  seoHomeTitle: "Dev Full-Stack · React · TypeScript · Convex",
  seoHomeDescription: "Portfólio com projetos, artigos e propostas comerciais.",

  // RSS
  rssTitle: "Matheus Mierzwa — Blog",
  rssDescription: "Artigos sobre desenvolvimento, arquitetura e produto.",

  // OG Image (URL externa ou path relativo a /public)
  ogImageUrl: "https://meusite.com/og-image.jpg",

  // Aparência (espelho do rubrica.json — mantidos em sincronia pela CLI)
  accentColor: "#0065fe",
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
  radius: "0.5rem",
}
```

> **Regra:** `rubrica.config.ts` é território do usuário. O `update` nunca o sobrescreve. O `config` o atualiza quando o usuário reconfigura via CLI.

### 4.2 `siteConfig` no Convex — Fonte de verdade para o admin e para o build

Fonte de verdade editável pelo admin via `/admin/site-config`. **Não é consultado diretamente pelo frontend público em runtime** — serve de fonte para dois consumidores:

1. O painel admin (`/admin/site-config`): consulta `getPublic` do Convex via WebSocket em tempo real
2. O script de build (`scripts/fetch-static-data.ts`): consulta `getPublic` via HTTP no momento do deploy e grava `/public/data/site-config.json`

**A CLI não chama o Convex durante o `create`.** O seeding do `siteConfig` acontece na primeira vez que o usuário roda `npx convex dev` — via uma função de seed que lê `rubrica.config.ts` e popula o banco se as chaves ainda não existirem.

```typescript
// convex/seed.ts — roda automaticamente no primeiro deploy
export const seedSiteConfig = internalMutation({
  handler: async (ctx) => {
    // lê rubrica.config.ts compilado e insere no siteConfig
    // só executa se siteConfig estiver vazio (idempotente)
  }
})
```

Isso resolve o problema de timing: a CLI termina sem precisar de Convex, e o Convex se auto-popula na primeira vez que sobe.

### 4.3 `/public/data/site-config.json` — Build-time para páginas públicas

Gerado pelo script `scripts/fetch-static-data.ts` durante o build de produção (`pnpm build`). Contém o snapshot de `siteConfig.getPublic` do Convex no momento do deploy.

**Em produção**, páginas públicas (`SEO.tsx`, `Home.tsx`, `Sidebar.tsx`) leem este arquivo via `StaticSiteConfigRepository` e `fetch("/data/site-config.json")`. **Nunca batem no Convex em runtime.**

**Em dev**, `ConvexSiteConfigRepository` é usado — dados ao vivo via `ConvexHttpClient`.

O hook `useSiteConfig()` abstrai essa decisão via `siteConfigRepository` de `src/repositories/instances.ts` (mesmo padrão de todos os outros repositórios do projeto).

> **Regra:** toda mudança feita pelo admin reflete no site público apenas após o próximo deploy (que regenera o JSON estático). Mudanças em tempo real só aparecem para o próprio admin enquanto logado.

> **Regra de ouro:** qualquer hook ou componente que precise de dados de configuração do site **deve usar `useSiteConfig()`** — nunca `useQuery(api.siteConfig.getPublic)` diretamente em páginas públicas. A exceção é o próprio painel admin, que usa Convex diretamente para edição em tempo real.

### 4.4 Schema da tabela `siteConfig`

```typescript
// convex/schema.ts — nova tabela
siteConfig: defineTable({
  key: v.string(),
  value: v.any(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
}).index('by_key', ['key']),
```

### 4.4 Chaves previstas no `siteConfig`

| Chave | Tipo | Editável no admin |
|---|---|---|
| `site_title` | `string` | ✅ |
| `site_description` | `string` | ✅ |
| `site_url` | `string` | ✅ |
| `site_name` | `string` | ✅ |
| `og_image_url` | `string` | ✅ (upload) |
| `og_image_storage_id` | `Id<'_storage'>` | interno |
| `twitter_handle` | `string` | ✅ |
| `author_name` | `string` | ✅ |
| `author_email` | `string` | ✅ |
| `rss_title` | `string` | ✅ |
| `rss_description` | `string` | ✅ |
| `seo_home_title` | `string` | ✅ |
| `seo_home_description` | `string` | ✅ |
| `theme_accent_color` | `string` | ✅ |
| `theme_accent_hsl` | `string` | interno (gerado) |
| `theme_font_sans` | `string` | ✅ |
| `theme_font_mono` | `string` | ✅ |
| `theme_radius` | `string` | ✅ |
| `keywords` | `string[]` | ✅ |
| `lang` | `string` | ✅ |

### 4.5 Queries e Mutations

```typescript
// convex/siteConfig.ts
export const getPublic = query(...)    // chaves públicas, sem auth
export const getByKey  = query(...)    // requer auth para chaves internas
export const getAll    = query(...)    // requer role root/admin
export const set       = mutation(...) // requer role root/admin, audita
export const setBatch  = mutation(...) // upsert em lote, usado pelo seed
```

---

## 5. Alterações no Admin

### 5.1 Escopo reduzido: apenas Aparência e ajustes pontuais

A configuração inicial (identidade, SEO, RSS) é feita pela CLI e persiste em `rubrica.config.ts`. O admin não precisa ser o lugar de setup — ele é o lugar de **ajuste posterior sem necessidade de rodar a CLI**.

**Nova rota: `/admin/site-config`**

Acessível apenas para roles `root` e `admin`.

**Seção: Aparência**
- Cor de destaque — color picker + input hex, preview em tempo real das cores derivadas
- Fonte principal — select com lista curada (seção 7)
- Fonte mono — select separado
- Border radius — select: Nenhum / Suave / Médio / Arredondado / Pill

**Seção: SEO e Identidade** _(ajustes, não setup)_
- Título padrão do site
- Descrição padrão
- Imagem Open Graph — upload via Convex Storage
- Twitter/X handle
- Keywords
- Título e description específicos da página Home

> **Escopo claro:** o admin **não** permite trocar layout. Layout é decisão de infraestrutura feita pela CLI. O admin gerencia identidade textual e paleta — nunca estrutura.

### 5.2 Sidebar do admin

Adicionar item "Site & Aparência" na sidebar do admin, agrupado com Plugins e LGPD.

---

## 6. CLI — Especificação Técnica

### 6.1 Repositório e estrutura

```
rubrica/
  templates/
    layouts/
      sidebar/
        Layout.tsx
        Sidebar.tsx
      topbar/
        Layout.tsx
        Navbar.tsx
      centered/
        Layout.tsx
    themes/
      cyberpunk.css
      minimal.css
      editorial.css
      forest.css
  cli/
    src/
      commands/
        create.ts
        config.ts
        update.ts
      prompts/
        identityPrompt.ts     ← novo: nome, URL, SEO, RSS, autor
        layoutPrompt.ts
        themePrompt.ts
        fontPrompt.ts
        pluginsPrompt.ts
      transforms/
        applyLayout.ts
        applyTheme.ts
        applyFont.ts
        applyPlugins.ts
        applyIndexHtml.ts
        applyRubricalConfig.ts  ← gera rubrica.config.ts
      state/
        readState.ts
        writeState.ts
      utils/
        hexToHsl.ts
        download.ts
        detectProject.ts
      __tests__/
        hexToHsl.test.ts
        applyTheme.test.ts
        applyLayout.test.ts
        applyPlugins.test.ts
        applyIndexHtml.test.ts
        applyRubricalConfig.test.ts
        readState.test.ts
        writeState.test.ts
        update.test.ts
    package.json
    tsconfig.json
```

### 6.2 `rubrica.json` — estado da CLI

```json
{
  "version": "1.0.0",
  "layout": "sidebar",
  "theme": "cyberpunk",
  "accentColor": null,
  "fontSans": "Chakra Petch",
  "fontMono": "Chakra Petch",
  "radius": "0.5rem",
  "plugins": {
    "blog": true,
    "portfolio": true,
    "resume": true,
    "about": true,
    "proposals": true,
    "payments": false,
    "ai-resumes": false,
    "i18n": false,
    "playground": false,
    "testimonials": true,
    "testimonials-intake": true,
    "contact-wizard": true,
    "audit-log": true
  }
}
```

Criado no `create`, atualizado no `config` e `update`. Commitado. Não contém dados de identidade — esses ficam em `rubrica.config.ts`.

---

### 6.3 Comando `create`

```bash
pnpm create rubrica <nome-do-projeto>
```

**Fluxo de prompts (Clack):**

```
┌  Rubrica — Assine com a sua cara.
│
◇  Nome do projeto (pasta que será criada)
│  meu-portfolio
│
── Identidade ──────────────────────────────
│
◇  Nome do site (aparece no título do browser e SEO)
│  Matheus Mierzwa | Dev Full-Stack
│
◇  URL do site (sem barra no final)
│  https://meusite.com
│
◇  Descrição curta (SEO e Open Graph)
│  Portfólio profissional de desenvolvimento e arquitetura.
│
◇  Seu nome (para RSS e meta author)
│  Matheus Mierzwa
│
◇  Seu email (para RSS — não aparece publicamente)
│  contato@meusite.com
│
◇  Twitter/X handle (sem @, Enter para pular)
│  matheusmierzwa
│
◇  Idioma padrão
│  ● Português (pt-BR)
│  ○ Inglês (en-US)
│
── Visual ──────────────────────────────────
│
◇  Layout
│  ● Sidebar     — navegação lateral com perfil completo
│  ○ Topbar      — navbar horizontal fixa no topo
│  ○ Centered    — sem nav persistente, foco no conteúdo
│
◇  Tema visual
│  ● Cyberpunk   — neon purple + lime, atmosfera dark
│  ○ Minimal     — clean, azul neutro, máxima legibilidade
│  ○ Editorial   — creme, âmbar, tipografia serifada
│  ○ Forest      — verde musgo, off-white, orgânico
│  ○ Personalizado...
│
◆  [se Personalizado] Cor de destaque (hex)
│  #0065fe
│
◇  Fonte principal
│  ● Inter              — neutra, legível, padrão de produtos digitais
│  ○ Chakra Petch       — geométrica, tech, futurista
│  ○ Playfair Display   — elegante, editorial, sofisticada
│  ○ Space Grotesk      — moderna, startup, geométrica suave
│  ○ DM Sans            — limpa, amigável, versátil
│  ○ Outra...           — digitar nome do Google Fonts
│
◇  Border radius
│  ○ Nenhum      — 0rem, bordas retas, minimalismo severo
│  ● Suave       — 0.375rem, sutil arredondamento
│  ○ Médio       — 0.5rem, padrão shadcn/ui
│  ○ Arredondado — 0.75rem, amigável, moderno
│  ○ Pill        — 1rem, muito arredondado, jovial
│
── Funcionalidades ─────────────────────────
│
◇  Plugins ativos
│  ✅ Portfolio    ✅ Blog         ✅ Currículo
│  ✅ Sobre        ✅ Depoimentos  ✅ Contact Wizard
│  ✅ Propostas    ☐  Pagamentos   ☐  CV com IA
│  ☐  Tradução IA  ☐  Playground   ✅ Audit Log
│
── Setup ───────────────────────────────────
│
◇  Inicializar git?     ● Sim  ○ Não
◇  Instalar dependências?  ● pnpm  ○ npm  ○ Não agora
│
└  Pronto! 🎉

   cd meu-portfolio

   1. Suba o backend:
      npx convex dev
      (abre o browser para login — deixe rodando)

   2. Em outro terminal, rode o frontend:
      pnpm dev → http://localhost:3000

   3. Crie seu usuário root em /login
      (com BOOTSTRAP_ALLOWED=true setado no Convex)

   [se pagamentos ativo]
   ⚠  Adicione no Convex Dashboard:
      STRIPE_WEBHOOK_SECRET ou ASAAS_WEBHOOK_TOKEN

   [se ai-resumes ou i18n ativo]
   ⚠  Adicione no Convex Dashboard:
      OPENROUTER_API_KEY
```

**O que o `create` faz internamente:**

1. Baixa o tarball da última release do GitHub
2. Extrai em `<nome-do-projeto>/`
3. Remove as pastas `templates/` e `cli/` do projeto instanciado
4. Copia arquivos de layout de `templates/layouts/<layout>/` → `src/components/`
5. Injeta tema CSS em `src/index.css` (blocos `:root` e `.dark`)
6. Atualiza `--font-sans`, `--font-mono` e `--radius` em `src/index.css`
7. Atualiza `<link>` do Google Fonts em `index.html`
8. Atualiza `<meta name="theme-color">` em `index.html`
9. Substitui todos os meta tags pessoais em `index.html` com os valores informados
10. Seta `defaultEnabled` nos plugins em `convex/pluginRegistry.ts`
11. Atualiza `name` em `package.json`
12. **Gera `rubrica.config.ts`** com todos os valores de identidade e aparência
13. Cria `rubrica.json` com estado da CLI
14. Opcionalmente: `git init` + commit inicial + `pnpm install`

---

### 6.4 Comando `config`

```bash
rubrica config
```

Lê `rubrica.json` e `rubrica.config.ts`, exibe valores atuais como defaults, aplica o que o usuário alterar. Atualiza ambos os arquivos ao final.

```
◇  O que deseja reconfigurar?
│  ○ Identidade (nome, URL, SEO, RSS)
│  ✅ Aparência (tema, cores, fonte, radius)
│  ○ Layout
│  ○ Plugins

[se layout selecionado]
⚠  Isso sobrescreve Layout.tsx e Sidebar.tsx/Navbar.tsx.
   Customizações manuais serão perdidas.
◇  Continuar? → Sim / Não
```

---

### 6.5 Comando `update`

```bash
rubrica update
```

**Algoritmo:**

1. Lê `rubrica.json` → versão atual + configs visuais
2. Lê `rubrica.config.ts` → configs de identidade
3. Consulta GitHub API → versão mais recente
4. Se iguais: informa, encerra
5. Exibe changelog entre versões
6. Pergunta confirmação
7. Baixa tarball da nova versão
8. Sobrescreve **território do Rubrica**
9. Preserva **território do usuário**
10. Re-aplica: `applyLayout` + `applyTheme` + `applyFont` + `applyPlugins` + `applyIndexHtml` + `applyRubricalConfig`
11. Atualiza `version` no `rubrica.json`
12. Roda `pnpm install` se `package.json` mudou

#### Território do Rubrica (update sobrescreve)

```
convex/              (exceto pluginRegistry.ts)
src/pages/
src/components/ui/
src/components/admin/
src/components/playground/
src/hooks/
src/contexts/
src/i18n/
src/repositories/
src/services/
src/usecases/
src/providers/
src/utils/
src/types/
src/lib/
src/const.ts
scripts/
tests/
domain/
package.json         (merge de dependências — scripts preservados)
vercel.json
```

#### Território do usuário (update nunca toca diretamente)

```
rubrica.config.ts              ← re-aplicado via applyRubricalConfig
src/components/Layout.tsx      ← re-aplicado via applyLayout
src/components/Sidebar.tsx     ← re-aplicado via applyLayout
src/components/Navbar.tsx      ← re-aplicado via applyLayout
src/index.css                  ← re-aplicado via applyTheme + applyFont
convex/pluginRegistry.ts       ← re-aplicado via applyPlugins
index.html                     ← re-aplicado via applyIndexHtml
rubrica.json                   ← atualiza version, preserva configs
public/favicon.ico
public/favicon-*.png
public/apple-touch-icon.png
.env / .env.local
```

#### Update com mudanças no backend Convex

- **Novas tabelas** → schema copiado normalmente. O Convex aplica a migração no próximo `convex deploy`.
- **Campos novos em tabelas existentes** → sempre `v.optional(...)`. Política: nenhuma migração destrutiva fora de versão major.
- **Remoção de campos/tabelas** → apenas em versões major, com aviso obrigatório:

```
⚠  Atualização major (1.x.x → 2.0.0).
   Pode conter mudanças destrutivas no schema do Convex.

   Guia de migração: https://github.com/…/MIGRATION-2.0.md

◇  Continuar mesmo assim?
│  ○ Sim, entendo os riscos
│  ● Não, cancelar
```

- **Novas env vars** → detectadas via `required-env.json` da release. Listadas ao final do update com instruções de como configurar no Convex Dashboard.

---

## 7. Templates de Layout

O Rubrica oferece três layouts estruturalmente distintos. Todos compartilham as mesmas páginas, rotas, contextos e lógica de negócio — o que muda é exclusivamente o **shell**: como a navegação é apresentada e como o conteúdo é posicionado na tela.

O layout é escolhido uma vez no `create` e pode ser trocado via `rubrica config`. O admin nunca altera o layout.

---

### 7.1 `sidebar` — Layout atual (referência)

**Conceito:** navegação lateral fixa com identidade completa do dono do portfólio. A sidebar é um componente rico — avatar, nome, cargo, redes sociais, links de navegação, email, telefone, seletor de idioma, botão de download do CV. É o layout mais denso em informação e mais voltado para profissionais técnicos que querem tudo acessível o tempo todo.

**Tom visual:** profissional, organizado, denso. Funciona bem com temas escuros e tipografia técnica.

**Estrutura de arquivos:**
```
templates/layouts/sidebar/
  Layout.tsx     ← flex-row, sidebar fixa à esquerda (w-72), main com pl-72
  Sidebar.tsx    ← componente completo com perfil, nav, socials, footer
```

**Comportamento responsivo:** no mobile, a sidebar some e é substituída por um header fixo com avatar + nome + botão de menu (Sheet do shadcn). Ao clicar, abre a sidebar como drawer lateral.

**O que o `create` faz:** copia os dois arquivos para `src/components/`. Nenhuma alteração em `App.tsx` — o `<Layout>` já envolve as rotas públicas.

---

### 7.2 `topbar` — Navbar horizontal

**Conceito:** navegação no topo da página, estilo site convencional. O conteúdo ocupa a largura total da viewport sem recuo lateral. A navbar é mais compacta — logo/nome à esquerda, links de navegação à direita, ações secundárias (CV, idioma) em menu dropdown ou inline. Sem avatar nem informações de contato na nav — essas ficam na página Home.

**Tom visual:** clean, familiar, acessível. Funciona bem com temas claros, tipografia editorial e portfólios de designers, redatores e profissionais não-técnicos que querem presença mais convencional.

**Estrutura de arquivos:**
```
templates/layouts/topbar/
  Layout.tsx   ← flex-col, Navbar fixa no topo (h-16), main com pt-16
  Navbar.tsx   ← logo/nome, links de nav, dropdown de ações
```

**Comportamento responsivo:** no mobile, os links de navegação colapsam em um menu hamburger (Sheet). O nome/logo permanece visível. Sem header separado — a própria Navbar serve mobile e desktop.

**Diferenças de implementação em relação ao `sidebar`:**
- `Layout.tsx` usa `flex-col` em vez de `flex-row`
- `main` tem `pt-16` (altura da navbar) em vez de `pl-72`
- Não há componente `Sidebar.tsx` — substituído por `Navbar.tsx`
- O `Navbar.tsx` importa `useContactWizard`, `usePlugins` e `useSidebar` para os mesmos dados que a Sidebar usa, mas renderiza de forma compacta
- Download de CV e seletor de idioma ficam num dropdown de perfil no canto direito da navbar

**O que o `create` faz:** copia `Layout.tsx` e `Navbar.tsx` para `src/components/`. Remove `Sidebar.tsx` se existir (não se aplica a este layout). Nenhuma alteração em `App.tsx`.

---

### 7.3 `centered` — Sem navegação persistente

**Conceito:** sem sidebar, sem topbar. O conteúdo é centralizado em largura máxima com margens generosas. A navegação entre páginas acontece via links contextuais dentro do conteúdo — botões no hero da Home, links no footer, breadcrumbs nas páginas internas. É o layout mais minimalista e mais focado no conteúdo em si, sem elementos de chrome ao redor.

**Tom visual:** editorial, artístico, foco total no conteúdo. Ideal para designers, fotógrafos, escritores e qualquer profissional cuja obra fala por si. Funciona especialmente bem com temas claros, fontes serifadas e muito espaço em branco.

**Estrutura de arquivos:**
```
templates/layouts/centered/
  Layout.tsx     ← sem nav persistente, main centralizado com max-w-3xl
  Footer.tsx     ← links de navegação no rodapé de todas as páginas
```

**Comportamento responsivo:** sem header fixo no mobile. O `Footer.tsx` é o único elemento de navegação global, presente em todas as páginas. Páginas individuais podem ter seu próprio breadcrumb via o componente `PageSkeleton` já existente.

**Diferenças de implementação em relação ao `sidebar`:**
- `Layout.tsx` não importa `Sidebar` nem `Navbar` — apenas renderiza `{children}` com `Footer`
- `main` sem padding lateral forçado — usa `mx-auto max-w-3xl` e padding simétrico
- `Footer.tsx` é um componente novo, compartilhado por todas as páginas públicas, com os mesmos links de nav filtrados por plugins ativos (mesma lógica do `NAV_ITEMS` da Sidebar)
- Avatar, nome e redes sociais não aparecem na navegação — ficam na página Home (já existente)
- Sem Sheet de mobile — não há menu para abrir

**O que o `create` faz:** copia `Layout.tsx` e `Footer.tsx` para `src/components/`. Remove `Sidebar.tsx` se existir. Nenhuma alteração em `App.tsx`.

---

### 7.4 Elementos compartilhados entre os três layouts

Independente do layout escolhido, os seguintes comportamentos são idênticos:

- Filtragem de itens de navegação por plugins ativos (`usePlugins`)
- Seletor de idioma (presente nos três, posicionado diferente)
- Download de CV (presente nos três, posicionado diferente)
- Contact Wizard trigger (presente nos três quando plugin ativo)
- Responsividade mobile (cada layout tem sua estratégia, mas todos funcionam em telas pequenas)
- Terminal (`~` para abrir) — comportamento global no `AppContent`, independente de layout

---

### 7.5 O que NÃO muda entre layouts

- Todas as páginas (`src/pages/`) — idênticas nos três layouts
- Todas as rotas (`App.tsx`) — idênticas
- Admin (`/admin/*`) — tem seu próprio shell, não afetado pela escolha de layout
- Playground (`/playground/*`) — tem seu próprio `PlaygroundLayout`, não afetado
- Lógica de autenticação, plugins, i18n, contextos — idênticos

---

## 8. Catálogo de Fontes Google Fonts

### Sans-serif — Neutras e Profissionais
| Fonte | Tom |
|---|---|
| **Inter** | Neutra, altamente legível, padrão de produtos digitais modernos |
| **DM Sans** | Limpa e amigável, ótima para conteúdo denso |
| **Plus Jakarta Sans** | Moderna e versátil, transmite confiança sem ser fria |
| **Outfit** | Geométrica suave, contemporânea, bem-humorada |
| **Nunito** | Arredondada, acolhedora, acessível e humana |

### Sans-serif — Tech e Startups
| Fonte | Tom |
|---|---|
| **Space Grotesk** | Startup, levemente geométrica, tech humanizada |
| **Chakra Petch** | Futurista, geométrica angular, cyberpunk tech |
| **Syne** | Experimental, vanguarda, design-forward |
| **Exo 2** | Sci-fi moderado, clean tech, ótima para headings |
| **Rajdhani** | Compacta, eficiente, industrial digital |

### Serifadas — Editoriais e Elegantes
| Fonte | Tom |
|---|---|
| **Playfair Display** | Elegante, editorial, alta-costura digital |
| **Lora** | Clássica moderna, literária, substancial |
| **DM Serif Display** | Sofisticada e assertiva, ótima para headlines grandes |
| **Cormorant Garamond** | Refinada, intelectual, luxo discreto |
| **Source Serif 4** | Jornalística, confiável, legibilidade longa |

### Monoespaçadas
| Fonte | Tom |
|---|---|
| **JetBrains Mono** | Dev-friendly, clara, ótima em blocos de código |
| **Fira Code** | Dev clássico, com ligatures, aconchegante para devs |
| **Space Mono** | Retro digital, anos 80 computador, personalidade forte |
| **IBM Plex Mono** | Corporativo-tech, IBM heritage, séria e precisa |

### Display — Headings marcantes
| Fonte | Tom |
|---|---|
| **Bebas Neue** | Impacto máximo, bold, para quem quer ser visto |
| **Righteous** | Energética, anos 70 futurista, ótima para marcas criativas |
| **Raleway** | Elegante e leve, headings finos, fashion-forward |

> **Nota:** quando o usuário escolhe uma fonte de display, a CLI configura `--font-display` separado de `--font-sans`. O `index.css` e o Tailwind config precisam suportar essa terceira variável. Incremento opcional na Fase 2.

---

## 9. TDD — Metodologia de Desenvolvimento

Todo o desenvolvimento da CLI e das novas funcionalidades do Convex seguirá **Test-Driven Development**.

### Ciclo Red-Green-Refactor

1. **Red:** escrever o teste que descreve o comportamento desejado — falha porque a implementação não existe
2. **Green:** escrever o mínimo de código para o teste passar
3. **Refactor:** melhorar sem quebrar os testes

### Cobertura por módulo

**CLI — testes unitários (`cli/src/__tests__/`)**

| Módulo | O que testar |
|---|---|
| `hexToHsl.ts` | Conversão correta; entradas inválidas; cores limite (preto, branco) |
| `applyTheme.ts` | Injeção de variáveis CSS em `:root` e `.dark`; idempotência; preset vs custom |
| `applyLayout.ts` | Cópia dos arquivos corretos por layout; não copia arquivos de outros layouts |
| `applyPlugins.ts` | `defaultEnabled` correto por plugin; plugins inexistentes com erro descritivo |
| `applyIndexHtml.ts` | Substituição do font link; `theme-color`; meta tags de identidade |
| `applyRubricalConfig.ts` | Geração correta do arquivo; todos os campos presentes; valores corretos |
| `readState.ts` / `writeState.ts` | Leitura de `rubrica.json`; criação quando não existe; validação; forward-compat |
| `update.ts` | Comparação semver; território correto; re-aplicação de configs; versão major; já atualizado |
| `download.ts` | Mock GitHub API; parsing de release tag; extração do tarball |
| `detectProject.ts` | Detecção de `rubrica.json` em diretório atual e ancestrais; erro amigável |

**Convex — testes de integração (`tests/convex/`)**

| Módulo | O que testar |
|---|---|
| `siteConfig.getPublic` | Retorna apenas chaves públicas sem auth |
| `siteConfig.getByKey` | Requer autenticação para chaves internas |
| `siteConfig.set` | Requer role root/admin; cria ou atualiza; audita |
| `siteConfig.setBatch` | Upsert em lote; idempotente |
| `seed.seedSiteConfig` | Só executa quando `siteConfig` está vazio; valores corretos de `rubrica.config.ts` |

### Ferramentas

- **Vitest** — já está no projeto
- **`convex-test`** — testes de funções Convex em memória
- **`memfs`** — mock de filesystem nos testes de transforms
- **`msw`** — mock de HTTP nos testes de `download.ts`

### Cobertura mínima

- CLI transforms: 100% de branches
- Utils (`hexToHsl`, `detectProject`): 100%
- Convex `siteConfig`: 90%+ de linhas

---

## 10. Fases de Desenvolvimento

### Fase 1 — Desacoplamento de dados pessoais

**Pré-condição para a CLI.** Objetivo: repositório neutro antes de qualquer publicação.

1. Criar `rubrica.config.ts` com estrutura tipada e valores de exemplo neutros
2. Criar tabela `siteConfig` no schema Convex + `convex/siteConfig.ts` + testes
3. Criar `convex/seed.ts` com `seedSiteConfig` que lê `rubrica.config.ts`
4. Criar hook `useSiteConfig()` no frontend
5. Refatorar `SEO.tsx` — ler de `useSiteConfig()` com fallback para `rubrica.config.ts`
6. Limpar `Sidebar.tsx` — remover fallbacks pessoais
7. Limpar `cvPDF.ts` — remover fallback de nome
8. Limpar `index.html` — meta tags genéricas/vazias
9. Refatorar `generate-rss-feed.ts` — importar `rubrica.config.ts`
10. Refatorar `generate-sitemap.ts` — `SITE_URL` de `rubrica.config.ts`
11. Refatorar `Home.tsx` — SEO de `useSiteConfig()`
12. Criar página `/admin/site-config` com seções de Aparência e SEO
13. Adicionar item "Site & Aparência" na sidebar do admin

### Fase 2 — CLI `create` e `config`

1. Setup do pacote CLI (`cli/package.json`, Clack, build com tsup)
2. Implementar todos os `transforms/` com TDD
3. Implementar `identityPrompt.ts` — coleta nome, URL, SEO, RSS, autor
4. Implementar `create.ts` — scaffold completo com geração de `rubrica.config.ts`
5. Criar templates de layout: `topbar/` e `centered/`
6. Criar temas CSS: `minimal.css`, `editorial.css`, `forest.css`
7. Implementar `config.ts` — reconfiguração in-place de ambos os arquivos de estado
8. Testes de integração end-to-end
9. Publicar como pacote npm (`create-rubrica`)

### Fase 3 — CLI `update`

1. Implementar `download.ts` com testes
2. Lógica de diff de manifesto entre versões
3. Implementar `update.ts` com re-aplicação de configs
4. Tratamento de versões major
5. Detecção de novas env vars via `required-env.json`
6. Testes de integração de update

---

## 11. Critérios de Aceite

### Dados hardcoded
- [ ] Nenhuma string pessoal no código-fonte do template após Fase 1
- [ ] Projeto sem `rubrica.config.ts` preenchido renderiza com placeholders neutros, sem crashes
- [ ] RSS e sitemap buildados usam valores de `rubrica.config.ts`, não hardcoded

### CLI `create`
- [ ] `pnpm create rubrica meu-portfolio` cria projeto funcional em menos de 2 minutos
- [ ] `rubrica.config.ts` gerado com todos os valores informados nos prompts
- [ ] Layout, tema, fonte, radius e plugins refletidos corretamente
- [ ] `rubrica.json` criado com estado completo da CLI

### CLI `config`
- [ ] Valores atuais de ambos os arquivos de estado aparecem como defaults
- [ ] Re-aplicação não afeta arquivos fora do território do usuário
- [ ] Aviso antes de sobrescrever layout customizado

### CLI `update`
- [ ] Versão igual não modifica arquivo algum
- [ ] Território do usuário nunca sobrescrito diretamente
- [ ] `rubrica.config.ts` e `rubrica.json` preservados e re-aplicados corretamente
- [ ] Schema Convex com campos novos não quebra dados existentes
- [ ] Versão major exige confirmação explícita

### TDD
- [ ] Commits de teste precedem commits de implementação em todos os módulos da CLI
- [ ] Suite passa completa antes de cada merge na main
- [ ] CI bloqueia merge com testes falhando

---

## 12. Fora do Escopo deste PRD

- Alteração de layout via admin
- Suporte a frameworks além de React + Vite + Convex
- Interface gráfica para a CLI
- Modo multi-tenant
- Internacionalização da própria CLI (PT-BR apenas por ora)
