# Rubrica — Tasks

> Ordenadas por dependência. Seções marcadas com **"Integração:"** são pontos de conexão entre subsistemas — devem ser revisadas sempre que os dois lados estiverem prontos.
>
> **Metodologia:** TDD em toda a CLI e nas novas funções Convex. Tasks de teste precedem tasks de implementação em cada módulo.

---

## Fase 1 — Desacoplamento de Dados Pessoais

### 1.1 rubrica.config.ts — closes #6

- [x] Criar interface `RubricalConfig` com todos os campos tipados (identidade, SEO, RSS, aparência)
- [x] Criar `rubrica.config.ts` na raiz exportando `rubricalConfig` com valores de exemplo neutros
- [x] Garantir que `siteName`, `authorName`, `authorEmail` têm valor vazio ou de exemplo sem dados pessoais
- [x] Garantir que `siteUrl` aponta para `https://exemplo.com` (nunca para domínio pessoal)
- [x] Verificar que `tsc --noEmit` passa sem erros após criação do arquivo

---

### 1.2 siteConfig Convex — closes #7

- [x] **[TESTE]** Escrever teste: `getPublic` retorna apenas chaves sem prefixo interno sem autenticação
- [x] **[TESTE]** Escrever teste: `getByKey` com chave interna (`og_image_storage_id`) requer autenticação
- [x] **[TESTE]** Escrever teste: `set` com usuário sem role root/admin retorna erro de autorização
- [x] **[TESTE]** Escrever teste: `setBatch` com array de `{key, value}` faz upsert idempotente
- [x] **[TESTE]** Escrever teste: `setBatch` chamado duas vezes com os mesmos dados não duplica registros
- [x] Adicionar tabela `siteConfig` em `convex/schema.ts` com campos: `key`, `value`, `createdAt`, `updatedAt`
- [x] Adicionar índice `by_key` em `siteConfig`
- [x] Criar `convex/siteConfig.ts` com função `getPublic` — query sem auth, retorna chaves públicas
- [x] Criar função `getByKey` — query com verificação de auth para chaves internas
- [x] Criar função `getAll` — query restrita a roles root/admin
- [x] Criar função `set` — mutation com verificação root/admin, atualiza `updatedAt`, registra em auditLog
- [x] Criar função `setBatch` — mutation upsert em lote, usada pelo seed
- [x] Definir lista de chaves públicas e internas como constante tipada
- [x] Verificar que `npx convex dev` aplica o schema sem erros

---

### 1.3 seed.ts — closes #12

- [x] **[TESTE]** Escrever teste: `seedSiteConfig` com banco vazio insere todas as chaves de `rubricalConfig`
- [x] **[TESTE]** Escrever teste: `seedSiteConfig` com banco já populado não duplica nem sobrescreve registros (idempotente)
- [x] **[TESTE]** Escrever teste: chave `site_title` recebe valor de `rubricalConfig.siteName`
- [x] **[TESTE]** Escrever teste: chave `rss_title` recebe valor de `rubricalConfig.rssTitle`
- [x] **[TESTE]** Escrever teste: chave `theme_accent_color` recebe valor de `rubricalConfig.accentColor`
- [x] Criar `convex/seed.ts` com `seedSiteConfig` como `internalMutation`
- [x] Implementar leitura de todos os campos de `rubricalConfig` e mapeamento para chaves do `siteConfig`
- [x] Implementar verificação de banco vazio antes de inserir (guard idempotente)
- [x] Usar `setBatch` internamente para inserção em lote
- [x] Registrar chamada ao seed via mecanismo de inicialização do Convex (cron ou init function)

---

### 1.4 useSiteConfig() hook — closes #13

- [x] Criar `src/hooks/useSiteConfig.ts` com hook que usa `useQuery` do Convex apontando para `siteConfig.getPublic`
- [x] Implementar merge: valores do Convex sobrescrevem `rubricalConfig` quando disponíveis
- [x] Retornar objeto com todas as chaves públicas estritamente tipadas (sem `any`)
- [x] Retornar `isLoading: boolean` para que componentes possam mostrar fallback sem flash
- [x] Garantir que retorno é `rubricalConfig` integralmente enquanto Convex está carregando
- [x] Exportar tipo `SiteConfig` inferido do retorno do hook

> **Nota arquitetural (atualizada):** `useSiteConfig` usa `@tanstack/react-query` + `siteConfigRepository` de `src/repositories/instances.ts` — em produção usa `StaticSiteConfigRepository` (lê `/public/data/site-config.json`), em dev usa `ConvexSiteConfigRepository` (HTTP ao Convex). O hook **nunca** usa `useQuery` do `convex/react` diretamente. Somente páginas admin podem acessar o Convex diretamente via `useQuery(api.siteConfig.getPublic)` do `convex/react`.

---

### 1.5 SEO.tsx — closes #16

- [x] Identificar todos os valores hardcoded em `src/components/SEO.tsx` (siteTitle, defaultDescription, defaultImage, siteUrl, og:site_name, og:locale, twitter:creator, lógica de fullTitle)
- [x] Substituir `siteTitle` por `useSiteConfig().site_title`
- [x] Substituir `defaultDescription` por `useSiteConfig().site_description`
- [x] Substituir URL da OG image por `useSiteConfig().og_image_url`
- [x] Substituir `siteUrl` por `useSiteConfig().site_url`
- [x] Substituir `og:site_name` por `useSiteConfig().site_name`
- [x] Substituir `og:locale` por `useSiteConfig().lang`
- [x] Substituir `twitter:creator` por `useSiteConfig().twitter_handle` (com `@` prefixado se necessário)
- [x] Reescrever lógica de `fullTitle` sem nome pessoal embutido — usar `site_title` como sufixo
- [x] Garantir que projeto sem `rubrica.config.ts` preenchido renderiza placeholders neutros sem crash
- [x] Verificar que `tsc --noEmit` passa sem erros

---

### 1.6 Sidebar.tsx — closes #17

- [x] Localizar as 2 ocorrências do fallback `"Matheus Mierzwa"` em `src/components/Sidebar.tsx`
- [x] Substituir fallback de nome no `img alt` por `contactInfo.name || ""`
- [x] Substituir fallback de nome no `h1` por `contactInfo.name || ""`
- [x] Substituir fallback de role `"Front-End Developer"` por `contactInfo.role || ""`
- [x] Substituir fallback de avatar URL pessoal por `""` — renderizar placeholder com inicial do nome
- [x] Implementar componente de avatar placeholder: quando sem imagem, exibir inicial de `contactInfo.name` ou ícone genérico
- [x] Garantir que Sidebar funciona normalmente quando `contactInfo` tem dados completos
- [x] Garantir que Sidebar não crasha com `contactInfo` vazio ou `undefined`

---

### 1.7 cvPDF.ts — closes #18

- [x] Localizar o fallback `"MATHEUS MIERZWA"` em `src/utils/cvPDF.ts`
- [x] Substituir fallback por `(contactInfo.name || "").toUpperCase()`
- [x] Garantir que PDF gerado com `contactInfo.name` vazio não exibe nome pessoal
- [x] Verificar que geração de PDF funciona normalmente quando `contactInfo.name` tem valor

---

### 1.8 index.html — closes #14

- [x] Substituir `<title>` pessoal por `"Rubrica Portfolio"`
- [x] Substituir `<meta name="description">` por descrição genérica de template
- [x] Remover ou esvaziar `<link rel="canonical">` (será injetado pela CLI)
- [x] Substituir `og:title` pelo título genérico
- [x] Substituir `og:url` — remover domínio pessoal
- [x] Substituir `og:image` — remover URL de imagem pessoal
- [x] Substituir `og:site_name` por `"Rubrica Portfolio"`
- [x] Substituir `twitter:creator` — remover handle pessoal (`@matheusmierzwa`)
- [x] Substituir `twitter:url`, `twitter:title`, `twitter:image` por valores neutros
- [x] Substituir `<meta name="theme-color">` por cor neutra (ex: `#6366f1`)
- [x] Substituir `<meta name="author">` por `"Portfolio Author"` ou esvaziar
- [x] Substituir `<meta name="keywords">` por keywords genéricas de template
- [x] Substituir título do `<link rel="alternate" rss>` por `"Portfolio RSS Feed"`
- [x] Verificar que build (`pnpm build`) conclui sem erros após as alterações

---

### 1.9 Scripts rss + sitemap — closes #15

- [x] Importar `rubricalConfig` de `rubrica.config.ts` em `scripts/generate-rss-feed.ts`
- [x] Substituir `RSS_CONFIG.siteTitle` hardcoded por `rubricalConfig.rssTitle`
- [x] Substituir `RSS_CONFIG.siteDescription` por `rubricalConfig.rssDescription`
- [x] Substituir `RSS_CONFIG.authorName` por `rubricalConfig.authorName`
- [x] Substituir `RSS_CONFIG.authorEmail` por `rubricalConfig.authorEmail`
- [x] Substituir `RSS_CONFIG.copyright` por copyright derivado de `rubricalConfig.authorName`
- [x] Substituir fallback de `SITE_URL` hardcoded por `rubricalConfig.siteUrl`
- [x] Importar `rubricalConfig` em `scripts/generate-sitemap.ts`
- [x] Substituir fallback de `SITE_URL` em sitemap por `rubricalConfig.siteUrl`
- [x] Executar `pnpm generate-rss` (ou equivalente) e verificar que `public/rss.xml` gerado usa valores do config
- [x] Executar `pnpm generate-sitemap` e verificar que `public/sitemap.xml` não contém domínio pessoal

---

### 1.10 Home.tsx — closes #19

- [x] Localizar valores de SEO hardcoded em `src/pages/Home.tsx` (title e description)
- [x] Substituir SEO `title` por `useSiteConfig().seo_home_title` com fallback para `rubricalConfig.seoHomeTitle`
- [x] Substituir SEO `description` por `useSiteConfig().seo_home_description` com fallback para `rubricalConfig.seoHomeDescription`
- [x] Garantir que `Home.tsx` não crasha com config vazio
- [x] Verificar que `tsc --noEmit` passa sem erros

---

### 1.11 Admin /site-config — closes #20

- [x] Criar rota `/admin/site-config` no roteador da aplicação
- [x] Proteger rota com verificação de roles root/admin (redirecionar se não autorizado)
- [x] Criar `src/pages/admin/SiteConfig.tsx` com layout de duas seções: Aparência e SEO & Identidade
- [x] **Seção Aparência — Cor de destaque:** color picker + input hex com validação de formato
- [x] **Seção Aparência — Cor de destaque:** preview em tempo real das cores derivadas (usar `hexToHsl` quando implementado na CLI, ou versão inline)
- [x] **Seção Aparência — Fonte principal:** select com opções curadas (Inter, Chakra Petch, Playfair Display, Space Grotesk, DM Sans)
- [x] **Seção Aparência — Fonte mono:** select (JetBrains Mono, Fira Code, Space Mono, IBM Plex Mono)
- [x] **Seção Aparência — Border radius:** select com 5 opções (Nenhum / Suave / Médio / Arredondado / Pill)
- [x] **Seção SEO — Título padrão:** campo de texto ligado à chave `site_title`
- [x] **Seção SEO — Descrição padrão:** textarea ligado à chave `site_description`
- [x] **Seção SEO — OG Image:** upload via Convex Storage, salva `og_image_storage_id` e gera `og_image_url`
- [x] **Seção SEO — Twitter handle:** campo sem `@`, ligado a `twitter_handle`
- [x] **Seção SEO — Keywords:** input multi-valor, ligado a `keywords`
- [x] **Seção SEO — Home title/description:** campos ligados a `seo_home_title` e `seo_home_description`
- [x] Implementar salvamento via `siteConfig.setBatch` ao submeter cada seção
- [x] Exibir toast de sucesso/erro após salvar
- [x] Garantir que alterações refletem no site sem rebuild (Convex real-time)

---

### 1.12 Admin sidebar item — closes #21

- [x] Localizar a sidebar do painel admin no codebase
- [x] Adicionar item "Site & Aparência" com ícone adequado
- [x] Apontar item para rota `/admin/site-config`
- [x] Posicionar item no grupo correto (junto com Plugins e LGPD)
- [x] Verificar que item só aparece para roles root/admin

---

### 1.13 Integração: siteConfig ↔ frontend — closes #12, #13, #16, #19

> Ponto de conexão entre o backend Convex e os componentes React. Revisar após 1.2, 1.3, 1.4, 1.5 e 1.10 estarem prontos.

- [x] **[TESTE]** Escrever teste de integração: `seedSiteConfig` popula banco → `getPublic` retorna todas as chaves inseridas
- [x] **[TESTE]** Escrever teste de integração: `set` atualiza `site_title` → `getPublic` retorna novo valor na mesma query
- [x] **[TESTE]** Escrever teste de integração: `setBatch` com 5 chaves → `getAll` retorna exatamente 5 registros, sem duplicatas
- [x] **[TESTE]** Escrever teste de integração: `useSiteConfig()` retorna valor do Convex quando disponível e fallback de `rubricalConfig` quando `getPublic` retorna `undefined`
- [x] **[TESTE]** Escrever teste de integração: `SEO.tsx` renderiza `og:title` com valor do `siteConfig`, não com valor hardcoded
- [x] **[TESTE]** Escrever teste de integração: `Home.tsx` renderiza `<title>` com `seo_home_title` do `siteConfig`
- [ ] Verificar manualmente: alterar `site_title` via admin `/admin/site-config` → título do browser atualiza sem reload

---

## Fase 2 — CLI create/config

### 2.1 Setup do pacote CLI — closes #8

- [x] Criar diretório `cli/` na raiz do projeto
- [x] Criar `cli/package.json` com nome `create-rubrica`, bin `rubrica`, scripts `build` e `test`
- [x] Criar `cli/tsconfig.json` configurado para ESM, target ES2022, Node
- [x] Adicionar dependências: `@clack/prompts`, `tsup` (dev), `vitest` (dev), `memfs` (dev), `msw` (dev)
- [x] Criar estrutura de diretórios: `src/commands/`, `src/prompts/`, `src/transforms/`, `src/state/`, `src/utils/`, `src/__tests__/`
- [x] Configurar `tsup.config.ts` para output ESM com shebang no entry point
- [x] Verificar que `pnpm install` dentro de `cli/` instala sem erros
- [x] Verificar que `pnpm build` dentro de `cli/` compila sem erros
- [x] Verificar que `pnpm test` dentro de `cli/` roda (sem falhas — ainda sem testes)

---

### 2.2 utils/ com TDD — closes #24

#### hexToHsl.ts

- [x] **[TESTE]** Escrever teste: `hexToHsl("#ff0000")` retorna `{h: 0, s: 100, l: 50}`
- [x] **[TESTE]** Escrever teste: `hexToHsl("#000000")` retorna `{h: 0, s: 0, l: 0}`
- [x] **[TESTE]** Escrever teste: `hexToHsl("#ffffff")` retorna `{h: 0, s: 0, l: 100}`
- [x] **[TESTE]** Escrever teste: `hexToHsl("#0065fe")` retorna valores HSL corretos
- [x] **[TESTE]** Escrever teste: `hexToHsl("invalid")` lança erro com mensagem descritiva
- [x] **[TESTE]** Escrever teste: `hexToHsl("#gggggg")` lança erro com mensagem descritiva
- [x] **[TESTE]** Escrever teste: `hexToHsl` aceita hex com e sem `#` inicial
- [x] Implementar `cli/src/utils/hexToHsl.ts`
- [x] Verificar 100% de cobertura de branches

#### detectProject.ts

- [x] **[TESTE]** Escrever teste: `detectProject` encontra `rubrica.json` no diretório atual (mock com `memfs`)
- [x] **[TESTE]** Escrever teste: `detectProject` encontra `rubrica.json` dois níveis acima (mock com `memfs`)
- [x] **[TESTE]** Escrever teste: `detectProject` lança erro amigável quando não encontra `rubrica.json` em nenhum ancestral
- [x] **[TESTE]** Escrever teste: `detectProject` retorna o caminho absoluto para `rubrica.json`
- [x] Implementar `cli/src/utils/detectProject.ts`
- [x] Verificar 100% de cobertura de branches

---

### 2.3 state/ com TDD — closes #23

#### readState.ts

- [x] **[TESTE]** Escrever teste: `readState` lê `rubrica.json` existente e retorna objeto tipado (mock com `memfs`)
- [x] **[TESTE]** Escrever teste: `readState` cria `rubrica.json` com defaults quando arquivo não existe
- [x] **[TESTE]** Escrever teste: `readState` lança erro descritivo quando campo obrigatório `version` está ausente
- [x] **[TESTE]** Escrever teste: `readState` lança erro descritivo quando campo obrigatório `layout` está ausente
- [x] **[TESTE]** Escrever teste: `readState` preserva campos desconhecidos no objeto retornado (forward-compat)
- [x] Implementar `cli/src/state/readState.ts`
- [x] Verificar 100% de cobertura de branches

#### writeState.ts

- [x] **[TESTE]** Escrever teste: `writeState` persiste todas as propriedades em `rubrica.json` com formatação JSON de 2 espaços
- [x] **[TESTE]** Escrever teste: `writeState` merge parcial — atualizar só `version` preserva `layout`, `theme` e `plugins`
- [x] **[TESTE]** Escrever teste: `writeState` sobrescreve o arquivo se já existir
- [x] Implementar `cli/src/state/writeState.ts`
- [x] Verificar 100% de cobertura de branches

---

### 2.4 transforms/ com TDD — closes #22

#### applyRubricalConfig.ts

> **Nota arquitetural:** `applyRubricalConfig` gera/atualiza `rubrica.config.ts` no projeto alvo (fallback estático de build). Após qualquer mudança neste arquivo, o projeto alvo precisa rodar `pnpm build` para regenerar `/public/data/site-config.json` — sem isso, páginas públicas em produção continuam usando o snapshot anterior do JSON.

- [x] **[TESTE]** Escrever teste: gera `rubrica.config.ts` com todos os campos do input
- [x] **[TESTE]** Escrever teste: campo `twitterHandle` é incluído corretamente (sem `@`)
- [x] **[TESTE]** Escrever teste: arquivo gerado é TypeScript válido (verificação de sintaxe básica)
- [x] **[TESTE]** Escrever teste: re-executar com mesmos valores produz arquivo idêntico (idempotência)
- [x] Implementar `cli/src/transforms/applyRubricalConfig.ts`
- [x] Verificar 100% de cobertura de branches

#### applyTheme.ts

- [x] **[TESTE]** Escrever teste: injeta bloco `:root` com variáveis do tema preset em `src/index.css`
- [x] **[TESTE]** Escrever teste: injeta bloco `.dark` com variáveis do tema preset
- [x] **[TESTE]** Escrever teste: substitui bloco existente sem duplicar (idempotência)
- [x] **[TESTE]** Escrever teste: tema custom com `accentColor` gera `--primary` correto
- [x] **[TESTE]** Escrever teste: preset inexistente lança erro descritivo
- [x] Implementar `cli/src/transforms/applyTheme.ts`
- [x] Verificar 100% de cobertura de branches

#### applyLayout.ts

- [x] **[TESTE]** Escrever teste: layout `sidebar` copia `Layout.tsx` e `Sidebar.tsx` para `src/components/`
- [x] **[TESTE]** Escrever teste: layout `topbar` copia `Layout.tsx` e `Navbar.tsx`, não copia `Sidebar.tsx`
- [x] **[TESTE]** Escrever teste: layout `centered` copia `Layout.tsx` e `Footer.tsx`, não copia `Sidebar.tsx` nem `Navbar.tsx`
- [x] **[TESTE]** Escrever teste: layout inexistente lança erro descritivo
- [x] Implementar `cli/src/transforms/applyLayout.ts`
- [x] Verificar 100% de cobertura de branches

#### applyFont.ts

- [x] **[TESTE]** Escrever teste: atualiza `--font-sans` em `src/index.css`
- [x] **[TESTE]** Escrever teste: atualiza `--font-mono` em `src/index.css`
- [x] **[TESTE]** Escrever teste: atualiza `--radius` em `src/index.css`
- [x] **[TESTE]** Escrever teste: substitui `<link>` do Google Fonts em `index.html` pela fonte correta
- [x] **[TESTE]** Escrever teste: re-executar com mesma fonte não duplica o `<link>` (idempotência)
- [x] Implementar `cli/src/transforms/applyFont.ts`
- [x] Verificar 100% de cobertura de branches

#### applyPlugins.ts

- [x] **[TESTE]** Escrever teste: plugins marcados como `true` têm `defaultEnabled: true` em `convex/pluginRegistry.ts`
- [x] **[TESTE]** Escrever teste: plugins marcados como `false` têm `defaultEnabled: false`
- [x] **[TESTE]** Escrever teste: plugin com id inexistente lança erro descritivo com o id
- [x] **[TESTE]** Escrever teste: re-executar com mesmos valores não altera o arquivo (idempotência)
- [x] Implementar `cli/src/transforms/applyPlugins.ts`
- [x] Verificar 100% de cobertura de branches

#### applyIndexHtml.ts

- [x] **[TESTE]** Escrever teste: substitui `<link>` do Google Fonts pelo link da fonte escolhida
- [x] **[TESTE]** Escrever teste: atualiza `<meta name="theme-color">` com a cor do tema
- [x] **[TESTE]** Escrever teste: substitui `og:title` pelo `siteName` fornecido
- [x] **[TESTE]** Escrever teste: substitui `og:url` pelo `siteUrl` fornecido
- [x] **[TESTE]** Escrever teste: substitui `twitter:creator` pelo `twitterHandle` fornecido
- [x] **[TESTE]** Escrever teste: substitui `<meta name="author">` pelo `authorName` fornecido
- [x] **[TESTE]** Escrever teste: re-executar com mesmos valores produz output idêntico (idempotência)
- [x] Implementar `cli/src/transforms/applyIndexHtml.ts`
- [x] Verificar 100% de cobertura de branches

---

### 2.5 identityPrompt.ts — closes #25

- [x] Implementar `cli/src/prompts/identityPrompt.ts` usando `@clack/prompts`
- [x] Adicionar prompt de `siteName` (texto livre)
- [x] Adicionar prompt de `siteUrl` com validação: deve começar com `http://` ou `https://`
- [x] Adicionar prompt de `siteDescription` (texto livre)
- [x] Adicionar prompt de `authorName` (texto livre)
- [x] Adicionar prompt de `authorEmail` com validação de formato básico (contém `@` e `.`)
- [x] Adicionar prompt de `twitterHandle` (opcional — Enter para pular)
- [x] Adicionar prompt de `lang` como select: `pt-BR` / `en-US`
- [x] Suportar valores default opcionais em todos os campos (usado pelo `config`)
- [x] Retornar objeto tipado com todos os campos coletados

---

### 2.6 Layouts topbar/ e centered/ — closes #9

- [x] Criar `templates/layouts/topbar/Layout.tsx` — `flex-col`, Navbar fixa no topo (`h-16`), `main` com `pt-16`
- [x] Criar `templates/layouts/topbar/Navbar.tsx` — logo/nome à esquerda, links de nav filtrados por `usePlugins` à direita
- [x] Implementar mobile responsivo na Navbar: hamburger Sheet colapsando os links de navegação
- [x] Implementar dropdown de perfil (canto direito) com CV download e seletor de idioma
- [x] Criar `templates/layouts/centered/Layout.tsx` — sem nav persistente, `main` com `max-w-3xl mx-auto`
- [x] Criar `templates/layouts/centered/Footer.tsx` — links de navegação filtrados por `usePlugins`
- [x] Garantir que ambos os layouts não contêm dados pessoais hardcoded
- [x] Testar manualmente: copiar cada layout para `src/components/` e verificar renderização no browser

---

### 2.7 Temas CSS — closes #10

- [x] Ler `src/index.css` (ou tema cyberpunk existente) para identificar todas as variáveis CSS necessárias
- [x] Criar `templates/themes/minimal.css` — paleta neutra, azul, fundo branco/cinza claro no light e cinza escuro no dark
- [x] Criar `templates/themes/editorial.css` — creme, âmbar, tipografia serifada, tons quentes
- [x] Criar `templates/themes/forest.css` — verde musgo, off-white, tons terrosos
- [x] Garantir que cada arquivo define blocos `:root` (light) e `.dark` com todas as variáveis do tema cyberpunk
- [x] Verificar: aplicar cada tema manualmente substituindo o bloco em `src/index.css` e conferir visual no browser

---

### 2.8 Comando create — closes #26

- [x] Criar `cli/src/commands/create.ts` com estrutura do comando
- [x] Implementar prompt de nome do projeto com validação (sem espaços, sem caracteres especiais)
- [x] Encadear `identityPrompt` para coleta de identidade
- [x] Implementar prompt de layout como select (sidebar / topbar / centered)
- [x] Implementar prompt de tema como select (cyberpunk / minimal / editorial / forest / personalizado)
- [x] Implementar prompt de cor custom quando "personalizado" selecionado (com validação hex)
- [x] Implementar prompt de fonte principal como select com lista curada + opção "Outra..."
- [x] Implementar prompt de fonte mono como select
- [x] Implementar prompt de border radius como select (Nenhum / Suave / Médio / Arredondado / Pill)
- [x] Implementar prompt de plugins como multi-select com defaults conforme PRD
- [x] Implementar prompt de git init (Sim/Não)
- [x] Implementar prompt de gerenciador de pacotes (pnpm / npm / Não agora)
- [x] Chamar `download.ts` para baixar tarball da última release
- [x] Extrair tarball em `<nome-do-projeto>/`
- [x] Remover diretórios `templates/` e `cli/` do projeto extraído
- [x] Chamar `applyLayout` com o layout escolhido
- [x] Chamar `applyTheme` com o tema/cor escolhido
- [x] Chamar `applyFont` com as fontes e radius escolhidos
- [x] Chamar `applyPlugins` com os plugins selecionados
- [x] Chamar `applyIndexHtml` com os dados de identidade e aparência
- [x] Chamar `applyRubricalConfig` para gerar `rubrica.config.ts`
- [x] Chamar `writeState` para criar `rubrica.json`
- [x] Atualizar `name` em `package.json` do projeto gerado
- [x] Executar `git init` + commit inicial quando solicitado
- [x] Executar instalação de dependências (pnpm/npm) quando solicitado
- [x] Exibir mensagem de next steps ao final (conforme PRD seção 6.3)
- [x] Testar manualmente: `node dist/index.js create test-project` cria projeto válido

> **Nota arquitetural:** O projeto gerado usa três camadas de config. O `next steps` exibido ao usuário deve incluir instruções para: (1) preencher `.env.local` com `VITE_CONVEX_URL`, (2) rodar `pnpm build` antes do primeiro deploy para gerar `/public/data/site-config.json`. Sem o build, páginas públicas em produção usam apenas os fallbacks de `rubrica.config.ts`.

---

### 2.9 Comando config — closes #27

- [x] Criar `cli/src/commands/config.ts`
- [x] Chamar `detectProject` para garantir que está dentro de um projeto Rubrica
- [x] Ler estado atual via `readState` e `rubricalConfig` do projeto alvo
- [x] Implementar prompt multi-select: "O que deseja reconfigurar?" (Identidade / Aparência / Layout / Plugins)
- [x] Quando **Identidade** selecionada: encadear `identityPrompt` com valores atuais como defaults, chamar `applyRubricalConfig`
- [x] Quando **Aparência** selecionada: prompts de tema, cor, fonte, radius com valores atuais como defaults, chamar `applyTheme` + `applyFont` + `applyIndexHtml`
- [x] Quando **Layout** selecionado: exibir aviso de perda de customizações manuais, pedir confirmação, chamar `applyLayout`
- [x] Quando **Plugins** selecionado: multi-select com estado atual como defaults, chamar `applyPlugins`
- [x] Atualizar `rubrica.json` e `rubrica.config.ts` ao final com os novos valores
- [x] Exibir erro amigável se executado fora de um projeto Rubrica

---

### 2.10 Testes e2e + publicação npm — closes #28

- [x] **[TESTE E2E]** Escrever teste: `create` gera projeto em tmpdir com layout `sidebar` e verifica existência dos arquivos corretos
- [x] **[TESTE E2E]** Escrever teste: `create` com layout `topbar` não inclui `Sidebar.tsx` em `src/components/`
- [x] **[TESTE E2E]** Escrever teste: `create` com layout `centered` não inclui `Navbar.tsx` em `src/components/`
- [x] **[TESTE E2E]** Escrever teste: `create` gera `rubrica.config.ts` com todos os campos dos prompts
- [x] **[TESTE E2E]** Escrever teste: `create` gera `rubrica.json` com `version`, `layout`, `theme` e `plugins` corretos
- [x] **[TESTE E2E]** Escrever teste: `config` com opção Aparência atualiza `rubrica.json` e não toca em `rubrica.config.ts`
- [x] **[TESTE E2E]** Escrever teste: `config` com opção Identidade atualiza `rubrica.config.ts` e não toca no tema
- [x] Configurar `.npmignore` excluindo `src/`, testes e arquivos de dev
- [x] Escrever `README.md` do pacote CLI com: instalação, `pnpm create rubrica`, `rubrica config`, `rubrica update`
- [x] Verificar que `npx create-rubrica test-project` funciona via npx sem instalação prévia
- [x] Publicar `create-rubrica` no npm (ou marcar como pronto para publish)

---

### 2.11 Integração: transforms em cadeia — closes #22, #26

> Ponto de conexão entre todos os transforms. Revisar após 2.2, 2.3, 2.4 e 2.8 estarem prontos.

- [x] **[TESTE]** Escrever teste de integração: `applyTheme` + `applyFont` aplicados em sequência no mesmo `src/index.css` — resultado final tem variáveis de ambos sem conflito
- [x] **[TESTE]** Escrever teste de integração: `applyLayout(topbar)` + `applyIndexHtml` — `Navbar.tsx` copiado e `index.html` com font link correto
- [x] **[TESTE]** Escrever teste de integração: `applyPlugins` desativa `blog` → `applyLayout` não inclui link de blog na navbar gerada
- [x] **[TESTE]** Escrever teste de integração: `applyRubricalConfig` + `writeState` — ambos os arquivos de estado gravados com os mesmos valores de identidade e aparência
- [x] **[TESTE]** Escrever teste de integração: re-executar todos os transforms em sequência com os mesmos inputs produz output idêntico ao da primeira execução (idempotência do pipeline completo)

### 2.12 Integração: CLI → projeto gerado — closes #26, #28

> Ponto de conexão entre o comando `create` e a validade do projeto gerado. Revisar após 2.8 estar pronto.

- [x] **[TESTE E2E]** Escrever teste: projeto gerado com layout `sidebar` passa em `tsc --noEmit` (sem erros de TypeScript)
- [x] **[TESTE E2E]** Escrever teste: projeto gerado com layout `topbar` passa em `tsc --noEmit`
- [x] **[TESTE E2E]** Escrever teste: projeto gerado com layout `centered` passa em `tsc --noEmit`
- [x] **[TESTE E2E]** Escrever teste: `rubrica.json` gerado é parseável e todos os campos obrigatórios estão presentes
- [x] **[TESTE E2E]** Escrever teste: `rubrica.config.ts` gerado é TypeScript sintaticamente válido
- [x] **[TESTE E2E]** Escrever teste: `index.html` gerado não contém nenhuma string do conjunto `["Matheus Mierzwa", "matheusmierzwa", "mmlo.com.br", "@matheusmierzwa"]`
- [x] **[TESTE E2E]** Escrever teste: `convex/pluginRegistry.ts` gerado tem `defaultEnabled: false` para todos os plugins desmarcados nos prompts
- [ ] Verificar manualmente: projeto gerado sobe com `pnpm dev` sem erros no console

---

## Fase 3 — CLI update

### 3.1 download.ts — closes #11

- [x] **[TESTE]** Escrever teste: `getLatestVersion` retorna string semver a partir de mock da GitHub API (com `msw`)
- [x] **[TESTE]** Escrever teste: `getLatestVersion` lança erro amigável quando GitHub API retorna 404
- [x] **[TESTE]** Escrever teste: `getLatestVersion` lança erro amigável quando há erro de rede
- [x] **[TESTE]** Escrever teste: `downloadRelease` baixa e extrai tarball para diretório alvo (mock com `msw` + tmpdir)
- [x] **[TESTE]** Escrever teste: `downloadRelease` lança erro descritivo quando release não tem tarball
- [x] Implementar `cli/src/utils/download.ts` com funções `getLatestVersion()` e `downloadRelease(targetDir)`
- [x] Verificar 100% de cobertura de branches

---

### 3.2 update.ts — closes #29

- [x] **[TESTE]** Escrever teste: quando versão local igual à remota, nenhum arquivo é modificado
- [x] **[TESTE]** Escrever teste: território do usuário (`rubrica.config.ts`, `rubrica.json`, `.env`) nunca é sobrescrito diretamente
- [x] **[TESTE]** Escrever teste: após update, `rubrica.config.ts` é re-aplicado via `applyRubricalConfig`
- [x] **[TESTE]** Escrever teste: após update, layout é re-aplicado via `applyLayout`
- [x] **[TESTE]** Escrever teste: update de versão major exige confirmação explícita
- [x] **[TESTE]** Escrever teste: update de versão major cancelado não altera nenhum arquivo
- [x] Criar `cli/src/commands/update.ts`
- [x] Chamar `detectProject` para verificar que está em projeto Rubrica
- [x] Ler versão atual de `rubrica.json` via `readState`
- [x] Chamar `getLatestVersion` para obter versão remota
- [x] Comparar versões com semver: encerrar com mensagem se iguais
- [ ] Exibir changelog entre as versões (se disponível na release)
- [x] Pedir confirmação antes de prosseguir
- [x] Para versão major: exibir aviso de mudanças destrutivas e link para guia de migração; exigir confirmação explícita
- [x] Baixar nova versão via `downloadRelease`
- [x] Sobrescrever território do Rubrica (lista completa do PRD seção 6.5)
- [x] Preservar território do usuário (nunca tocar diretamente)
- [x] Re-aplicar: `applyLayout` + `applyTheme` + `applyFont` + `applyPlugins` + `applyIndexHtml` + `applyRubricalConfig`
- [x] Atualizar `version` em `rubrica.json` via `writeState`
- [ ] Executar `pnpm install` se `package.json` foi modificado

---

### 3.3 required-env.json — closes #30

- [x] **[TESTE]** Escrever teste: quando `required-env.json` da nova versão lista var `STRIPE_SECRET_KEY` e `.env` não a contém, a var aparece no output
- [x] **[TESTE]** Escrever teste: quando `.env` já contém a var requerida, ela não aparece no output
- [x] **[TESTE]** Escrever teste: quando `.env` não existe, todas as vars são listadas como faltantes
- [x] **[TESTE]** Escrever teste: quando `required-env.json` está vazio ou ausente, nenhuma mensagem é exibida
- [x] Implementar parsing de `required-env.json` após extração do tarball em `update.ts`
- [x] Implementar leitura de `.env` e `.env.local` do projeto alvo
- [x] Implementar diff: vars em `required-env.json` não presentes em `.env`/`.env.local`
- [x] Exibir lista de vars faltantes com nome, descrição e instrução de configuração no Convex Dashboard
- [x] Integrar chamada ao check de env vars no final do fluxo de `update.ts`

---

### 3.4 Integração: update → projeto existente — closes #29, #30

> Ponto de conexão entre o comando `update` e a preservação do estado do usuário. Revisar após 3.1, 3.2 e 3.3 estarem prontos.

- [x] **[TESTE E2E]** Escrever teste: criar projeto com `create`, modificar manualmente `rubrica.config.ts`, rodar `update` → `rubrica.config.ts` preservado com os valores customizados
- [x] **[TESTE E2E]** Escrever teste: criar projeto com `create`, rodar `update` com nova versão simulada → `rubrica.json` tem `version` atualizado mas `layout` e `theme` preservados
- [x] **[TESTE E2E]** Escrever teste: criar projeto com `create`, adicionar `.env` com variáveis custom, rodar `update` → `.env` não é modificado
- [x] **[TESTE E2E]** Escrever teste: `update` de versão major para projeto com `rubrica.json` válido — sem confirmação explícita, nenhum arquivo é alterado
- [x] **[TESTE E2E]** Escrever teste: `update` de versão patch → projeto gerado passa em `tsc --noEmit` após atualização
- [x] **[TESTE E2E]** Escrever teste: `required-env.json` da nova versão lista `OPENROUTER_API_KEY` → aparece no output final do update quando ausente do `.env`
- [ ] Verificar manualmente: rodar `update` em projeto real gerado pelo `create` e confirmar que o site sobe sem erros após a atualização

---

## Fase 4 — CLI setup

> Novo comando `rubrica setup` que automatiza todo o bootstrap pós-`npx convex dev`: geração de JWT keys, configuração de env vars condicionais por plugin e criação do primeiro admin via `internalAction`.
>
> **Decisões arquiteturais:** sem `BOOTSTRAP_ALLOWED`; seed via `internalAction` + `npx convex run`; JWT keys geradas pela CLI com `jose`; vars de plugins lidas de `rubrica.json`.

---

### 4.1 Template: `setupAdmin` internalAction — closes #31

- [x] **[TESTE]** Escrever teste: `setupAdmin` com banco vazio cria conta com email e senha fornecidos
- [x] **[TESTE]** Escrever teste: `setupAdmin` com root já existente lança erro `"Root user already exists"`
- [x] **[TESTE]** Escrever teste: `setupAdmin` insere entrada em `userRoles` com `role: "root"` e `createdAt` numérico
- [x] **[TESTE]** Escrever teste: `setupAdmin` retorna `{ userId }` em caso de sucesso
- [x] Adicionar `setupAdmin` como `internalAction` em `convex/seed.ts`
- [x] Definir `args: { email: v.string(), password: v.string() }`
- [x] Verificar ausência de root chamando query `isSetupRequired` de `convex/users.ts`
- [x] Chamar `createAccount` de `@convex-dev/auth/server` com `provider: "password"`, `account: { id: email, secret: password }`, `profile: { email }`
- [x] Chamar `internalMutation` para inserir em `userRoles` com `role: "root"` e `createdAt: Date.now()`
- [ ] Verificar que `npx convex run seed:setupAdmin --data '{"email":"test@test.com","password":"senha123456789"}'` executa sem erro com `convex dev` ativo

---

### 4.2 CLI: `generateJwtKeys` + dep `jose` — closes #32

- [ ] **[TESTE]** Escrever teste: `generateJwtKeys()` retorna objeto com chaves `JWT_PRIVATE_KEY` e `JWKS`
- [ ] **[TESTE]** Escrever teste: `JWT_PRIVATE_KEY` retornado começa com `"-----BEGIN PRIVATE KEY-----"`
- [ ] **[TESTE]** Escrever teste: `JWT_PRIVATE_KEY` retornado termina com `"-----END PRIVATE KEY-----"`
- [ ] **[TESTE]** Escrever teste: `JWKS` retornado é JSON válido parseável com `JSON.parse`
- [ ] **[TESTE]** Escrever teste: `JWKS` parseado contém propriedade `keys` que é array com pelo menos 1 elemento
- [ ] **[TESTE]** Escrever teste: primeiro elemento de `keys` tem `use: "sig"` e `kty: "RSA"`
- [ ] **[TESTE]** Escrever teste: chamar `generateJwtKeys()` duas vezes gera pares distintos (não determinístico)
- [ ] Adicionar `jose` em `dependencies` de `cli/package.json`
- [ ] Criar `cli/src/utils/generateJwtKeys.ts` exportando `generateJwtKeys(): Promise<{ JWT_PRIVATE_KEY: string; JWKS: string }>`
- [ ] Usar `jose.generateKeyPair('RS256')` para gerar o par
- [ ] Exportar private key via `jose.exportPKCS8` (formato PEM)
- [ ] Exportar public key via `jose.exportJWK` e montar `{ keys: [{ use: "sig", ...jwk }] }`
- [ ] Serializar `JWKS` como JSON string com `JSON.stringify`
- [ ] Criar `cli/src/__tests__/generateJwtKeys.test.ts` com os testes acima
- [ ] Verificar que `pnpm test` passa em `cli/`
- [ ] Verificar que `pnpm build` compila sem erros em `cli/`

---

### 4.3 CLI: `setup.ts` core — detect, `.env.local`, JWT, SITE_URL — closes #33

- [ ] **[TESTE]** Escrever teste: `runSetup` lê `VITE_CONVEX_URL` corretamente de `.env.local` existente (mock com `memfs`)
- [ ] **[TESTE]** Escrever teste: `runSetup` lança erro amigável `"rode npx convex dev primeiro"` quando `.env.local` não existe
- [ ] **[TESTE]** Escrever teste: `runSetup` lança erro amigável quando `VITE_CONVEX_URL` está ausente no `.env.local`
- [ ] **[TESTE]** Escrever teste: `runSetup` lança erro amigável quando `VITE_CONVEX_SITE_URL` está ausente no `.env.local`
- [ ] **[TESTE]** Escrever teste: `runSetup` chama `detectProject()` e propaga erro se não estiver em projeto Rubrica
- [ ] **[TESTE]** Escrever teste: `runSetup` chama `npx convex env set JWT_PRIVATE_KEY` com valor não vazio
- [ ] **[TESTE]** Escrever teste: `runSetup` chama `npx convex env set JWKS` com JSON válido
- [ ] **[TESTE]** Escrever teste: `runSetup` chama `npx convex env set SITE_URL` com o valor confirmado no prompt
- [ ] **[TESTE]** Escrever teste: prompt de `SITE_URL` exibe `VITE_CONVEX_SITE_URL` como valor default
- [ ] Criar `cli/src/commands/setup.ts` com função `runSetup()`
- [ ] Chamar `detectProject()` no início — propagar erro como mensagem amigável via `@clack/prompts`
- [ ] Implementar leitura de `.env.local` via `node:fs/promises` com parsing linha a linha (`KEY=VALUE`)
- [ ] Validar presença de `VITE_CONVEX_URL` e `VITE_CONVEX_SITE_URL` com erros distintos
- [ ] Verificar conectividade com Convex via `fetch(VITE_CONVEX_URL)` — erro claro se inacessível
- [ ] Chamar `generateJwtKeys()` e exibir spinner durante geração
- [ ] Executar `execSync('npx convex env set JWT_PRIVATE_KEY ...')` e `execSync('npx convex env set JWKS ...')`
- [ ] Prompt `@clack/prompts` para `SITE_URL` com `initialValue = VITE_CONVEX_SITE_URL`
- [ ] Executar `execSync('npx convex env set SITE_URL ...')` com valor confirmado
- [ ] Criar `cli/src/__tests__/setup.test.ts` com os testes acima (ciclos 1–3)
- [ ] Verificar que `pnpm test` passa

---

### 4.4 CLI: `setup.ts` — vars condicionais por plugin — closes #34

- [ ] **[TESTE]** Escrever teste: com `contact-wizard: true` em `rubrica.json`, `TELEGRAM_BOT_TOKEN` é setado quando fornecido
- [ ] **[TESTE]** Escrever teste: sem plugin telegram, nenhum prompt de `TELEGRAM_BOT_TOKEN` ou `TELEGRAM_ADMIN_CHAT_ID` é exibido
- [ ] **[TESTE]** Escrever teste: `TELEGRAM_BOT_TOKEN` pulado (Enter vazio) não chama `convex env set` para essa var
- [ ] **[TESTE]** Escrever teste: com `playground: true` em `rubrica.json`, `PLAYGROUND_KEY_PEPPER` é gerado automaticamente com 64 chars hex
- [ ] **[TESTE]** Escrever teste: com `playground: true`, `PLAYGROUND_KEY_PEPPER` é setado sem prompt ao usuário
- [ ] **[TESTE]** Escrever teste: com `ai-resumes: true` ou `i18n: true`, prompt de `OPENROUTER_API_KEY` aparece
- [ ] **[TESTE]** Escrever teste: com `payments: true`, prompts de `STRIPE_WEBHOOK_SECRET` e `ASAAS_WEBHOOK_TOKEN` aparecem (skipáveis)
- [ ] **[TESTE]** Escrever teste: `VERCEL_DEPLOY_HOOK_URL` e `VERCEL_WEBHOOK_SECRET` são sempre promovidos como opcionais independente de plugins
- [ ] **[TESTE]** Escrever teste: vars opcionais puladas não geram chamada `execSync` para `convex env set`
- [ ] Expandir `runSetup()` com leitura de `rubrica.json` via `readState()`
- [ ] Implementar bloco condicional Telegram: se `plugins.contact-wizard || plugins['testimonials-intake']` → prompt `TELEGRAM_BOT_TOKEN` e `TELEGRAM_ADMIN_CHAT_ID` (skipáveis)
- [ ] Implementar bloco condicional AI: se `plugins['ai-resumes'] || plugins.i18n || plugins.playground` → prompt `OPENROUTER_API_KEY` (skipável)
- [ ] Implementar bloco playground: se `plugins.playground` → gerar `PLAYGROUND_KEY_PEPPER` com `crypto.randomBytes(32).toString('hex')` e setar silenciosamente
- [ ] Implementar bloco condicional payments: se `plugins.payments` → prompt `STRIPE_WEBHOOK_SECRET` e `ASAAS_WEBHOOK_TOKEN` (skipáveis)
- [ ] Implementar prompts sempre-presentes: `VERCEL_DEPLOY_HOOK_URL` e `VERCEL_WEBHOOK_SECRET` (skipáveis)
- [ ] Coletar todas as vars não vazias e executar `execSync('npx convex env set ...')` para cada uma em sequência
- [ ] Expandir `cli/src/__tests__/setup.test.ts` com testes acima (ciclos 4–6)
- [ ] Verificar que `pnpm test` passa

---

### 4.5 CLI: `setup.ts` — seed do admin — closes #35

- [ ] **[TESTE]** Escrever teste: prompt de email rejeita string sem `@` e repete o prompt
- [ ] **[TESTE]** Escrever teste: prompt de senha rejeita string com menos de 12 caracteres
- [ ] **[TESTE]** Escrever teste: senha e confirmação diferentes exibem erro e repetem ambos os prompts
- [ ] **[TESTE]** Escrever teste: `execSync` é chamado com `npx convex run seed:setupAdmin --data` contendo email e senha corretos
- [ ] **[TESTE]** Escrever teste: quando `execSync` lança erro contendo `"Root user already exists"`, exibe mensagem amigável sem stack trace
- [ ] **[TESTE]** Escrever teste: quando `execSync` lança erro genérico, exibe mensagem original ao usuário
- [ ] **[TESTE]** Escrever teste: em caso de sucesso, `outro()` é chamado com mensagem contendo o email usado
- [ ] Expandir `runSetup()` com prompt de email usando `@clack/prompts` — validação: contém `@` e pelo menos um `.`
- [ ] Adicionar prompt de senha com campo mascarado (`password: true`) — validação: mínimo 12 caracteres
- [ ] Adicionar prompt de confirmação de senha — validação: igual ao valor anterior
- [ ] Executar `execSync(`npx convex run seed:setupAdmin --data '${JSON.stringify({ email, password })}'`)` com `{ stdio: 'pipe' }`
- [ ] Capturar `error.stdout` / `error.stderr` para detectar `"Root user already exists"` e exibir mensagem amigável
- [ ] Exibir `outro()` com: URL de login (`/login`), email configurado, instrução para `pnpm dev`
- [ ] Expandir `cli/src/__tests__/setup.test.ts` com testes acima (ciclos 7–8)
- [ ] Verificar que `pnpm test` passa
- [ ] Verificar que `pnpm build` compila sem erros

---

### 4.6 CLI: registrar `setup` + atualizar `create.ts` outro — closes #36

- [ ] Adicionar `import { runSetup } from './commands/setup.js'` em `cli/src/index.ts`
- [ ] Adicionar `case 'setup': await runSetup(); break;` no switch de comandos de `cli/src/index.ts`
- [ ] Atualizar `outro()` em `cli/src/commands/create.ts` para incluir `rubrica setup` após `npx convex dev` nas instruções
- [ ] Garantir que `outro()` explica que `rubrica setup` deve ser rodado após o Convex estar rodando
- [ ] Verificar que `rubrica setup` (ou `node dist/index.js setup`) inicia o fluxo sem erros de import
- [ ] Verificar que comando inexistente ainda exibe mensagem de ajuda adequada
- [ ] Verificar que `pnpm build` compila sem erros

---

### 4.7 Integração: setup end-to-end — closes #31, #32, #33, #34, #35, #36

> Ponto de conexão entre o comando `setup` e o sistema Convex. Revisar após 4.1–4.6 estarem prontos.

- [ ] **[TESTE E2E]** Escrever teste: rodar `setup` com `.env.local` válido e plugin `contact-wizard` ativo → `convex env set` chamado para `TELEGRAM_BOT_TOKEN` quando valor fornecido
- [ ] **[TESTE E2E]** Escrever teste: rodar `setup` com plugin `playground` ativo → `convex env set PLAYGROUND_KEY_PEPPER` chamado com string de 64 chars hex
- [ ] **[TESTE E2E]** Escrever teste: rodar `setup` sem `.env.local` → processo encerra com mensagem clara antes de qualquer `convex env set`
- [ ] Verificar manualmente: criar projeto com `create`, rodar `npx convex dev`, rodar `rubrica setup` → JWT_PRIVATE_KEY + JWKS + SITE_URL presentes no Convex Dashboard
- [ ] Verificar manualmente: após `rubrica setup`, acessar `/login` com email e senha configurados → redireciona para `/admin` com acesso root
- [ ] Verificar manualmente: rodar `rubrica setup` pela segunda vez num projeto já configurado → exibe mensagem "Admin já configurado" sem sobrescrever keys JWT
