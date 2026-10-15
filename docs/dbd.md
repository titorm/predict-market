# Design Brief Document (DBD): PredictMarket PWA
**Versão:** 2.0.0 (Core Imutável — Arquitetura Airbnb / Editorial Discreto)  
**Status:** Baseline Definitivo de UI/UX e Design System  
**Filosofia Visual:** *Quiet Utility Marketplace* — 90% Canvas Branco + Tinta Profunda (`#222222`), Hierarquia por Densidade e Espaço, Sombra Única e Zero Clichês de IA.

---

## 1. Overview (Visão Geral e Diretriz Anti-IA)

O **PredictMarket** adota a estrutura canônica de marketplace de consumo do **Airbnb**, substituindo o peso visual de gradientes, *glassmorphism* e caixas coloridas por **clareza editorial, linhas divisórias de 1px (`hairlines`), cantos macios e contenção cromática**.

O piso de todas as páginas é **branco puro** (`{colors.canvas}` — `#ffffff`) combinado com **tinta quase-preta** (`{colors.ink}` — `#222222`) para títulos, preços, estrelas de avaliação e corpo de texto. Em vez de usar várias cores primárias e secundárias, o sistema opera com uma única voltagem de cor de marca: **Cypress** (`{colors.primary}` — `#1e4d3b`, um verde-floresta arquitetônico, sóbrio e atemporal). Ele carrega exclusivamente os CTAs primários, o orbe circular de leitura de QR Code na barra de comando e os estados ativos de salvamento.

Os cenários **Otimista**, **Realista** e **Pessimista** não pintam a tela inteira como um semáforo: seguem a regra das sub-marcas do Airbnb (*Luxe* e *Plus*). Os números principais são sempre impressos em **Ink (`#222222`)**, enquanto os sub-tokens **Mineral Moss** (`#1e4d3b`), **Terracotta** (`#9e3b24`) e **Oxblood** (`#7a1c1c`) aparecem apenas como micro-selos ou indicadores pontuais dentro do contexto de variação.

**Características-Chave (Imutáveis):**
* **Regra 90% Branco + Ink:** Nenhum fundo em degradê, nenhum desfoque translúcido (`backdrop-blur`), nenhuma sombra colorida. A página respira pelo contraste entre `#ffffff`, `#f7f7f7` e `#222222`.
* **Cor de Acento Única (`{colors.primary}` — `#1e4d3b`):** Usada com escassez rigorosa — no máximo um ou dois momentos por tela (o orbe de escaneamento/busca e o CTA principal de fechamento).
* **Tipografia de Peso Modesto:** Títulos de seção correm em pesos `500` a `600` (20px–28px), evitando o peso `800/900` exagerado de dashboards comuns. O único momento tipográfico monumental do sistema é o `{typography.forecast-display}` (`64px / 700 / -1px`), reservado para o número central de previsão ou índice de inflação pessoal.
* **Navegação Superior de 3 Pilares:** **Previsão**, **Supermercados** e **Notas Fiscais** — centralizados em uma barra de 80px com linha divisória inferior de 1px (`#dddddd`) e indicador ativo em sublinhado sólido de 2px em `#222222`.
* **Barra Global em Pílula (`{component.command-bar-pill}`):** Superfície branca totalmente arredondada (`9999px`), dividida por linhas verticais de 1px em três segmentos (**Cesta Base** / **Mês Alvo** / **Raio & Deslocamento**), terminada por um orbe circular de 48×48px em Cypress (`{component.scanner-orb}`).
* **Elevação de Nível Único:** Todo o sistema possui apenas **uma** definição de sombra (`rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px`). 95% das superfícies são planas (sem sombra).

---

## 2. Colors (Tokens de Cor)

### 2.1. Brand & Accent (Sotaque Único e Sub-Tokens de Contexto)
* **Cypress** (`{colors.primary}` — `#1e4d3b`): A única cor de marca principal. Usada nos botões primários ("Projetar Mês", "Escanear NFC-e"), no orbe de leitura de QR Code e no estado salvo de cestas.
* **Cypress Active** (`{colors.primary-active}` — `#143629`): Variante de clique/pressão (`pointer-down`). Mais densa e escura, sem transição de sombra.
* **Cypress Disabled** (`{colors.primary-disabled}` — `#d4e2dc`): Tom pálido para CTAs primários desabilitados.
* **Terracotta Sub-Accent** (`{colors.pessimistic}` — `#9e3b24`): Sub-token restrito exclusivamente ao badge do cenário **Pessimista (+1.5σ)**. Nunca usado em botões ou navegação.
* **Oxblood Sub-Accent** (`{colors.shrinkflation}` — `#7a1c1c`): Sub-token restrito ao selo de **Reduflação Detectada** (*Shrinkflation*), análogo ao *Airbnb Plus* (`#92174d`).

### 2.2. Surface (Superfícies)
* **Canvas** (`{colors.canvas}` — `#ffffff`): Piso padrão de todas as páginas e cartões. O sistema opera em modo claro editorial puro para leitura sob iluminação intensa de supermercados.
* **Surface Soft** (`{colors.surface-soft}` — `#f7f7f7`): Preenchimento sutil para campos desabilitados, hover de abas secundárias, faixa de conexão de calendário e blocos de resumo de impostos/descontos.
* **Surface Strong** (`{colors.surface-strong}` — `#f2f2f2`): Superfície para botões circulares de ícone (setas de retorno, botões de filtro e fechar modal).

### 2.3. Hairlines & Borders (Linhas de 1px)
* **Hairline** (`{colors.hairline}` — `#dddddd`): Tom padrão de borda de 1px — divisores internos da barra em pílula, contornos de cartões, separadores de colunas e divisores de tabela.
* **Hairline Soft** (`{colors.hairline-soft}` — `#ebebeb`): Divisor horizontal leve entre itens da nota fiscal e linhas de produtos canônicos.
* **Border Strong** (`{colors.border-strong}` — `#c1c1c1`): Contorno de inputs em repouso secundário e botões outline desabilitados.

### 2.4. Text (Tipografia e Ícones)
* **Ink** (`{colors.ink}` — `#222222`): Cor dominante de texto e números. Títulos, preços projetados, nomes de produtos, links de navegação e estrelas/índices de eficiência do mercado. Nunca usar preto puro (`#000000`).
* **Body** (`{colors.body}` — `#3f3f3f`): Texto corrido secundário para descrições fiscais originais (`xProd`), notas explicativas do cálculo EWMA e regras de deslocamento.
* **Muted** (`{colors.muted}` — `#6a6a6a`): Subtítulos ("Cesta de Outubro · 28 itens"), códigos EAN, unidades de medida por quilo (`R$ 5,98/kg`), abas inativas e metadados de distância.
* **Muted Soft** (`{colors.muted-soft}` — `#929292`): Texto de links desabilitados e placeholders inativos.
* **Store Score / Star** (`{colors.star-rating}` — `#222222`): Mesmo token `Ink`. O ícone de estrela e a nota de competitividade do supermercado (`4.92`) são sempre renderizados em `#222222` (estrelas amarelas ou ícones coloridos são proibidos).
* **On Primary** (`{colors.on-primary}` — `#ffffff`): Texto branco puro sobre superfícies `#1e4d3b`.

### 2.5. Semantic & Scrim
* **Error** (`{colors.primary-error-text}` — `#c13515`): Texto de erro de validação (ex: Chave SEFAZ inválida).
* **Error Hover** (`{colors.primary-error-text-hover}` — `#b32505`): Estado hover para links de erro.
* **Legal Link** (`{colors.legal-link}` — `#1e4d3b` sublinhado): Links institucionais e termos LGPD.
* **Scrim** (`{colors.scrim}` — `#000000` com `50%` de opacidade): Backdrop global de modais (Scanner QR Code, seletor de mês, confirmação de alias).

---

## 3. Typography (Tipografia e Escala)

### 3.1. Família Tipográfica
O sistema utiliza uma única família variável para toda a interface: **Inter Variable** (calibrada com `-2%` de `line-height` nos títulos para espelhar exatamente a altura de caixa e proporção geométrica da *Airbnb Cereal VF* / *Circular*). Para alinhamento tabular de preços e chaves de 44 dígitos, ativa-se `font-variant-numeric: tabular-nums` na própria fonte principal, mantendo coesão absoluta.

* **Stack CSS:** `'Inter', Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif`

### 3.2. Hierarquia Tipográfica Imutável

| Token | Tamanho | Peso | Line Height | Letter Spacing | Aplicação no PredictMarket |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `{typography.forecast-display}` | `64px` | `700` | `1.10` | `-1.00px` | Número monumental da previsão Realista (`R$ 842`) ou Inflação Pessoal (`+1,4%`) no topo do detalhe |
| `{typography.display-xl}` | `28px` | `700` | `1.40` | `-0.30px` | Título h1 do Dashboard ("Previsibilidade para sua próxima compra") |
| `{typography.display-lg}` | `22px` | `500` | `1.18` | `-0.44px` | Título h1 da Cesta ou Nota Fiscal ("Compra de Sábado · Giassi Trindade") |
| `{typography.display-md}` | `21px` | `700` | `1.40` | `0px` | Cabeçalhos de seção ("Composição da cesta", "Comparativo por supermercado") |
| `{typography.display-sm}` | `20px` | `600` | `1.20` | `-0.18px` | Subtítulos de seção ("Alertas de reduflação", "Regras do cálculo Bayesiano") |
| `{typography.title-md}` | `16px` | `600` | `1.25` | `0px` | Nome comercial do Produto Canônico ("Arroz Branco Tipo 1 Camil 5kg") e títulos de cards de mercado |
| `{typography.title-sm}` | `16px` | `500` | `1.25` | `0px` | Títulos de colunas do rodapé e cabeçalhos de grupos de categoria |
| `{typography.body-md}` | `16px` | `400` | `1.50` | `0px` | Texto corrido padrão e linhas de especificação de produtos |
| `{typography.body-sm}` | `14px` | `400` | `1.43` | `0px` | Metadados de cards: datas, código EAN, preço por Kg/L, distância do mercado |
| `{typography.caption}` | `14px` | `500` | `1.29` | `0px` | Rótulos internos dos segmentos da pílula ("Cesta Base", "Mês Alvo", "Deslocamento") |
| `{typography.caption-sm}` | `13px` | `400` | `1.23` | `0px` | Rodapé legal, chave de acesso de 44 dígitos e carimbo de sincronização SEFAZ |
| `{typography.badge}` | `11px` | `600` | `1.18` | `0px` | Badge flutuante sobre cards ("Menor preço da região", "Reduflação -12%") |
| `{typography.micro-label}` | `12px` | `700` | `1.33` | `0px` | Rótulos de cenário ("OTIMISTA", "REALISTA", "PESSIMISTA") |
| `{typography.uppercase-tag}` | `8px` | `700` | `1.25` | `0.32px` | Tag "PRO" ou "NOVO" ancorada nos ícones da navegação superior |
| `{typography.button-md}` | `16px` | `500` | `1.25` | `0px` | Rótulo de botões primários e secundários (altura 48px) |
| `{typography.button-sm}` | `14px` | `500` | `1.29` | `0px` | Botões em pílula da faixa de categorias ("Hortifrúti", "Mercearia", "Limpeza") |
| `{typography.nav-link}` | `16px` | `600` | `1.25` | `0px` | Abas principais do topo (Previsão, Supermercados, Notas Fiscais) |

---

## 4. Layout, Spacing & Elevation (Espaçamento, Grid e Sombra Única)

### 4.1. Sistema de Espaçamento (Base 4px / 8px)
* **Tokens:** `{spacing.xxs}` `2px` · `{spacing.xs}` `4px` · `{spacing.sm}` `8px` · `{spacing.md}` `12px` · `{spacing.base}` `16px` · `{spacing.lg}` `24px` · `{spacing.xl}` `32px` · `{spacing.xxl}` `48px` · `{spacing.section}` `64px`.
* **Padding Vertical de Seções:** `64px` (`{spacing.section}`) entre grandes blocos editoriais; os grids de produtos e mercados usam gap comprimido de `16px` (`{spacing.base}`) para entregar alta densidade de informação por scroll.
* **Padding Interno de Cartões:** `24px` (`{spacing.lg}`) no cartão fixo de previsão (`{component.forecast-rail-card}`) e nos blocos de duelo de supermercados; `16px` (`{spacing.base}`) nos blocos de metadados.

### 4.2. Grid e Arquitetura de Página (2-Column Sticky Rail)
* **Largura Máxima:** `1280px` centralizado no Dashboard e Comparador; `1080px` na página de detalhe da Cesta/Nota Fiscal.
* **Layout de Detalhe da Previsão (Padrão Airbnb Listing Detail):**
  * **Coluna Esquerda (~64% da largura):** Exibe o bloco monumental de índice inflacionário (`{component.inflation-display-card}`), o comparativo de estabelecimentos e a lista de itens da nota formatada como `{component.product-ledger-row}` (separada por linhas de 1px `#ebebeb`, sem bordas laterais).
  * **Coluna Direita (~32% da largura, `sticky top-28`):** Exibe o `{component.forecast-reservation-card}` — um cartão branco com borda `#dddddd` de 1px, raio de `14px` e a sombra única do sistema. Contém o preço Realista em destaque, o seletor dos 3 cenários (Otimista / Realista / Pessimista), o seletor de Carrinho Dividido, o CTA primário de largura total e o detalhamento matemático logo abaixo.

### 4.3. Geometria de Bordas (`Border Radius`)
* `{rounded.sm}` — `8px`: Botões primários, botões secundários, inputs de formulário e células internas do seletor de cenários.
* `{rounded.md}` — `14px`: Cartões de supermercados, cartão fixo de previsão (`forecast-rail-card`) e modais.
* `{rounded.xl}` — `32px`: Contêineres de filtros de categoria.
* `{rounded.full}` — `9999px`: Barra de comando em pílula (`command-bar-pill`), orbe de escaneamento (`scanner-orb`), badges flutuantes e células circulares de seleção de mês.

### 4.4. Elevação (Política de Sombra Única)
* **Flat (Sem sombra):** 95% da interface (fundo da página, lista de produtos da nota, tabela de comparação, rodapé).
* **Card Float (Sombra Única do Sistema):**
  ```css
  box-shadow: rgba(0, 0, 0, 0.02) 0px 0px 0px 1px, 
              rgba(0, 0, 0, 0.04) 0px 2px 6px 0px, 
              rgba(0, 0, 0, 0.10) 0px 4px 8px 0px;
  ```
  Aplicada **exclusivamente** na barra em pílula (`command-bar-pill`), no cartão fixo da coluna direita (`forecast-rail-card`), nos badges flutuantes e nos cards de supermercado durante `:hover`.

---

## 5. Especificação de Componentes Core

1. **`button-primary`**: Fundo `#1e4d3b`, texto `#ffffff`, raio `8px`, padding `14px 24px`, altura fixa `48px`, peso `500`. No clique (`:active`), muda apenas o fundo para `#143629` (sem scale, sem sombra).
2. **`button-secondary`**: Fundo `#ffffff`, texto `#222222`, borda sólida `1px solid #222222`, raio `8px`, altura `48px`, peso `500`.
3. **`button-tertiary-text`**: Texto `#222222` sublinhado, sem fundo e sem borda. Usado para "Ver todos os 28 itens", "Auditar fórmula EWMA" e "Separar item sem EAN".
4. **`command-bar-pill`**: Barra branca centralizada (`height: 64px`, `border-radius: 9999px`, borda `1px solid #dddddd` + sombra única). Dividida por linhas verticais `#dddddd` em:
   * **Segmento 1 (Cesta Base):** Ex: *"Outubro · 10/10 (28 itens)"*
   * **Segmento 2 (Mês Alvo):** Ex: *"Novembro 2026"*
   * **Segmento 3 (Pedágio Deslocamento):** Ex: *"Até 2 mercados (R$ 35)"*
   * **Terminação (`scanner-orb`):** Círculo `48×48px` em `#1e4d3b` com ícone de QR Code branco centralizado.
5. **`inflation-display-card`**: Equivalente direto ao `rating-display-card` do Airbnb. Exibe a projeção central ou variação percentual em `64px / 700` em `#222222`, ladeada por ornamentos vetoriais minimalistas em linha fina, seguida por uma faixa horizontal de 3 colunas estatísticas separadas por hairlines verticais (**Confiança Bayesiana**, **Amostras Regionais**, **Economia Máxima**).
6. **`store-comparison-card`**: Equivalente ao `property-card`. Cabeçalho visual em proporção retangular suave com raio `14px` (`#f7f7f7` com selo tipográfico do estabelecimento e evolução da curva), badge flutuante branco `"Mais econômico para sua cesta"` (`11px / 600` com sombra única) no canto superior esquerdo, botão circular de favoritar no canto superior direito, e 4 linhas de metadados embaixo: Nome do Mercado (`16px / 600` `#222222`), Bairro/Distância (`14px` `#6a6a6a`), Cobertura de Itens com EAN (`14px` `#6a6a6a`) e Custo Projetado da Cesta alinhado à direita em `#222222` negrito.
7. **`text-input`**: Superfície `#ffffff`, borda `1px solid #dddddd`, raio `8px`, altura `56px`, padding `14px 12px`. No `:focus`, a borda engrossa para `2px solid #222222` — **proibido usar `ring` colorido ou brilho externo**.

---

## 6. Comportamento Responsivo e Touch Targets

| Breakpoint | Largura | Mudanças Estruturais de Layout |
| :--- | :--- | :--- |
| **Mobile** | `< 744px` | Top nav colapsa para logo + barra em pílula compacta de 1 toque; o `forecast-rail-card` da coluna direita vira uma barra fixa no rodapé (`sticky bottom bar`) exibindo o Total Realista + botão `"Escanear NFC-e"`; cards de supermercados empilham em 1 coluna. |
| **Tablet** | `744px–1128px` | Top nav mantém as 3 abas; grids de supermercados exibem 2 colunas; layout de detalhe mantém as 2 colunas com o rail direito mais estreito (`340px`). |
| **Desktop** | `1128px–1440px` | Top nav completo (80px) + barra em pílula de 3 segmentos visíveis; grid de supermercados em 3 ou 4 colunas; detalhe da cesta em 2 colunas (`64%` / `32%`). |
| **Wide** | `> 1440px` | Conteúdo travado em `1280px` centralizado; margens laterais absorvem o espaço em branco (`#ffffff`). |

---

## 7. Configuração Imutável do Tailwind CSS (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#ffffff',
        surface: {
          soft: '#f7f7f7',
          strong: '#f2f2f2',
        },
        ink: '#222222',
        body: '#3f3f3f',
        muted: {
          DEFAULT: '#6a6a6a',
          soft: '#929292',
        },
        hairline: {
          DEFAULT: '#dddddd',
          soft: '#ebebeb',
          strong: '#c1c1c1',
        },
        primary: {
          DEFAULT: '#1e4d3b', // Cypress (Substituto discreto e moderno do Rausch)
          active: '#143629',
          disabled: '#d4e2dc',
        },
        scenario: {
          optimistic: '#1e4d3b', // Mineral Moss
          realistic: '#222222',  // Pure Ink
          pessimistic: '#9e3b24', // Terracotta
          shrinkflation: '#7a1c1c', // Oxblood
        },
        error: {
          DEFAULT: '#c13515',
          hover: '#b32505',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Circular',
          '-apple-system',
          'BlinkMacSystemFont',
          'Roboto',
          '"Helvetica Neue"',
          'sans-serif',
        ],
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        xl: '32px',
        full: '9999px',
      },
      spacing: {
        xxs: '2px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        base: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '64px',
      },
      boxShadow: {
        // Sombra única de todo o Design System (Idêntica à especificação do Airbnb)
        airbnb:
          'rgba(0, 0, 0, 0.02) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 2px 6px 0px, rgba(0, 0, 0, 0.10) 0px 4px 8px 0px',
        none: 'none',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 8. Componentes React/TypeScript de Produção (Padrão Airbnb)

### 8.1. Top Navigation & Pill Command Bar (`src/components/layout/TopNavAndCommandPill.tsx`)
```tsx
import React from 'react';
import { QrCode, SlidersHorizontal, Receipt, Store, TrendingUp } from 'lucide-react';

interface TopNavAndCommandPillProps {
  activeTab: 'forecast' | 'stores' | 'receipts';
  onTabChange: (tab: 'forecast' | 'stores' | 'receipts') => void;
  baseBasketLabel: string;      // Ex: "10 Out · 28 itens"
  targetMonthLabel: string;     // Ex: "Novembro 2026"
  transitPenaltyLabel: string;  // Ex: "Pedágio R$ 35,00"
  onOpenScanner: () => void;
}

export const TopNavAndCommandPill: React.FC<TopNavAndCommandPillProps> = ({
  activeTab,
  onTabChange,
  baseBasketLabel,
  targetMonthLabel,
  transitPenaltyLabel,
  onOpenScanner,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-canvas border-b border-hairline">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Linha Superior: 80px de altura */}
        <div className="h-[80px] flex items-center justify-between">
          {/* Wordmark à esquerda em Ink/Primary */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-white font-bold text-base tracking-tight">
              P
            </div>
            <span className="text-[18px] font-semibold tracking-tight text-ink">
              predictmarket
            </span>
          </div>

          {/* 3 Abas Centrais de Produto (Estilo Homes / Experiences / Services) */}
          <nav className="hidden md:flex items-center gap-8 h-full">
            <button
              type="button"
              onClick={() => onTabChange('forecast')}
              className={`relative h-full flex items-center gap-2 text-[16px] leading-[1.25] transition-colors ${
                activeTab === 'forecast'
                  ? 'font-semibold text-ink border-b-2 border-ink'
                  : 'font-normal text-muted hover:text-ink'
              }`}
            >
              <TrendingUp className="w-5 h-5 stroke-[1.75]"/>
              <span>Previsão</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('stores')}
              className={`relative h-full flex items-center gap-2 text-[16px] leading-[1.25] transition-colors ${
                activeTab === 'stores'
                  ? 'font-semibold text-ink border-b-2 border-ink'
                  : 'font-normal text-muted hover:text-ink'
              }`}
            >
              <Store className="w-5 h-5 stroke-[1.75]"/>
              <span>Supermercados</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-surface-strong text-ink text-[8px] font-bold tracking-[0.32px] uppercase">
                RANKING
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('receipts')}
              className={`relative h-full flex items-center gap-2 text-[16px] leading-[1.25] transition-colors ${
                activeTab === 'receipts'
                  ? 'font-semibold text-ink border-b-2 border-ink'
                  : 'font-normal text-muted hover:text-ink'
              }`}
            >
              <Receipt className="w-5 h-5 stroke-[1.75]"/>
              <span>Notas Fiscais</span>
            </button>
          </nav>

          {/* Utilitário Direito: Status Give-to-Get Discreto */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenScanner}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-medium text-ink hover:bg-surface-soft transition-colors"
            >
              Enviar NFC-e (+7d Pro)
            </button>
            <button
              type="button"
              aria-label="Parâmetros do motor"
              className="w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-ink hover:shadow-airbnb transition-shadow"
            >
              <SlidersHorizontal className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Barra em Pílula Global (Search-Bar-Pill 64px) */}
        <div className="pb-6 flex justify-center">
          <div className="w-full max-w-[850px] h-[64px] bg-canvas rounded-full border border-hairline shadow-airbnb flex items-center pl-6 pr-2">
            {/* Segmento 1: Cesta Base */}
            <div className="flex-1 pr-4 cursor-pointer">
              <span className="block text-[12px] font-bold text-ink tracking-tight">
                Cesta base
              </span>
              <span className="block text-[14px] text-muted truncate">
                {baseBasketLabel}
              </span>
            </div>

            <div className="h-8 w-[1px] bg-hairline" />

            {/* Segmento 2: Mês Alvo */}
            <div className="flex-1 px-6 cursor-pointer">
              <span className="block text-[12px] font-bold text-ink tracking-tight">
                Mês projetado
              </span>
              <span className="block text-[14px] text-muted truncate">
                {targetMonthLabel}
              </span>
            </div>

            <div className="hidden sm:block h-8 w-[1px] bg-hairline" />

            {/* Segmento 3: Custo de Deslocamento */}
            <div className="hidden sm:block flex-1 px-6 cursor-pointer">
              <span className="block text-[12px] font-bold text-ink tracking-tight">
                Arbitragem de locais
              </span>
              <span className="block text-[14px] text-muted truncate">
                {transitPenaltyLabel}
              </span>
            </div>

            {/* Orbe Circular de Escaneamento (48x48px em Cypress) */}
            <button
              type="button"
              onClick={onOpenScanner}
              aria-label="Escanear QR Code da Nota Fiscal"
              className="w-[48px] h-[48px] rounded-full bg-primary active:bg-primary-active text-white flex items-center justify-center shrink-0 transition-colors"
            >
              <QrCode className="w-5 h-5 stroke-[2]"/>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
```

### 8.2. Detalhe de Previsão em 2 Colunas + Sticky Reservation Rail (`src/components/forecast/ForecastMarketplaceView.tsx`)
```tsx
import React, { useState } from 'react';
import { BasketForecastReport } from '@/core/engine/GroceryForecastEngine';
import { QrCode, ArrowUpRight, Check, AlertCircle } from 'lucide-react';

interface ForecastMarketplaceViewProps {
  report: BasketForecastReport;
  targetMonthName: string; // Ex: "Novembro"
  onScanNewReceipt: () => void;
}

export const ForecastMarketplaceView: React.FC<ForecastMarketplaceViewProps> = ({
  report,
  targetMonthName,
  onScanNewReceipt,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<
    'optimistic' | 'realistic' | 'pessimistic'
  >('realistic');

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const activeTotal =
    selectedScenario === 'optimistic'
      ? report.optimisticBasketTotal
      : selectedScenario === 'realistic'
      ? report.realisticBasketTotal
      : report.pessimisticBasketTotal;

  const activeDelta = activeTotal - report.lastPaidBasketTotal;

  return (
    <main className="bg-canvas text-ink min-h-screen">
      <div className="max-w-[1080px] mx-auto px-6 py-12">
        {/* Cabeçalho Discreto de Listagem (22px / 500) */}
        <div className="mb-8">
          <h1 className="text-[22px] font-medium leading-[1.18] tracking-[-0.44px] text-ink">
            Projeção de compras para {targetMonthName} · Baseada em {report.items.length} produtos canônicos
          </h1>
          <p className="text-[14px] text-muted mt-1">
            Cálculo via Suavização Exponencial (EWMA) + Encolhimento Bayesiano · Florianópolis, SC
          </p>
        </div>

        {/* Grid 2 Colunas (64% Esquerda / 32% Sticky Rail Direita) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* COLUNA ESQUERDA (8 cols ~ 66%) */}
          <div className="lg:col-span-7 xl:col-span-8">
            {/* Momento Tipográfico Monumental (Equivalente ao Rating Display 64px do Airbnb) */}
            <section className="py-8 border-t border-b border-hairline text-center">
              <div className="inline-flex items-baseline justify-center gap-3">
                <span className="text-[64px] font-bold leading-[1.1] tracking-[-1px] text-ink tabular-nums">
                  {report.projectedMonthlyInflationPct >= 0 ? '+' : ''}
                  {report.projectedMonthlyInflationPct.toFixed(1)}%
                </span>
              </div>
              <p className="text-[16px] font-semibold text-ink mt-2">
                Inflação pessoal estimada na sua despensa
              </p>
              <p className="text-[14px] text-muted max-w-md mx-auto mt-1">
                Variação ponderada entre os preços pagos na última nota e a tendência recente dos seus itens.
              </p>

              {/* 3 Colunas Estatísticas em Ink separadas por Hairline */}
              <div className="grid grid-cols-3 border-t border-hairline mt-6 pt-6 text-center">
                <div className="border-r border-hairline px-2">
                  <span className="block text-[12px] font-bold uppercase text-muted">
                    Última Nota
                  </span>
                  <strong className="text-[16px] font-semibold text-ink tabular-nums">
                    {formatBRL(report.lastPaidBasketTotal)}
                  </strong>
                </div>
                <div className="border-r border-hairline px-2">
                  <span className="block text-[12px] font-bold uppercase text-muted">
                    Melhor Mercado Único
                  </span>
                  <strong className="text-[16px] font-semibold text-ink truncate block">
                    {report.splitCartAnalysis.bestSingleStoreName}
                  </strong>
                </div>
                <div className="px-2">
                  <span className="block text-[12px] font-bold uppercase text-muted">
                    Carrinho Dividido
                  </span>
                  <strong className="text-[16px] font-semibold text-primary tabular-nums">
                    {report.splitCartAnalysis.isWorthSplitting
                      ? ` Poupa ${formatBRL(report.splitCartAnalysis.netSavings)}`
                      : '1 local ideal'}
                  </strong>
                </div>
              </div>
            </section>

            {/* Seção: Otimizador de Local (Carrinho Único vs Dividido) */}
            <section className="py-8 border-b border-hairline">
              <h2 className="text-[21px] font-bold leading-[1.40] text-ink mb-4">
                Onde comprar em {targetMonthName}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card Mercado Único */}
                <div className="rounded-md border border-hairline p-6 bg-canvas hover:shadow-airbnb transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-surface-strong text-[11px] font-semibold text-ink">
                      Menor atrito (1 viagem)
                    </span>
                    <span className="text-[14px] font-semibold text-ink">★ 4.92</span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-ink">
                    {report.splitCartAnalysis.bestSingleStoreName}
                  </h3>
                  <p className="text-[14px] text-muted mt-1">
                    Cesta completa concentrada em um único CNPJ
                  </p>
                  <div className="mt-4 pt-4 border-t border-hairline-soft flex items-baseline justify-between">
                    <span className="text-[14px] text-muted">Total estimado</span>
                    <strong className="text-[16px] font-semibold text-ink tabular-nums">
                      {formatBRL(report.splitCartAnalysis.bestSingleStoreTotal)}
                    </strong>
                  </div>
                </div>

                {/* Card Compra Dividida */}
                <div className="rounded-md border border-hairline p-6 bg-canvas hover:shadow-airbnb transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-surface-strong text-[11px] font-semibold text-primary">
                      {report.splitCartAnalysis.isWorthSplitting
                        ? 'Recomendado após pedágio'
                        : 'Economia não paga deslocamento'}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-ink">
                    {report.splitCartAnalysis.storePairNames
                      ? `${report.splitCartAnalysis.storePairNames[0]} + ${report.splitCartAnalysis.storePairNames[1]}`
                      : 'Aguardando 2º mercado'}
                  </h3>
                  <p className="text-[14px] text-muted mt-1">
                    Inclui pedágio de {formatBRL(report.splitCartAnalysis.transitCostPenalty)} de transporte
                  </p>
                  <div className="mt-4 pt-4 border-t border-hairline-soft flex items-baseline justify-between">
                    <span className="text-[14px] text-muted">Economia líquida real</span>
                    <strong className="text-[16px] font-semibold text-primary tabular-nums">
                      {formatBRL(report.splitCartAnalysis.netSavings)}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Seção: Lista de Produtos Canônicos (Estilo Amenity Rows com Hairline Soft) */}
            <section className="py-8">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-[21px] font-bold leading-[1.40] text-ink">
                  Itens da cesta ({report.items.length})
                </h2>
                <span className="text-[14px] text-muted">
                  Exibindo cenário:{' '}
                  <strong className="text-ink capitalize">
                    {selectedScenario === 'optimistic'
                      ? 'Otimista'
                      : selectedScenario === 'realistic'
                      ? 'Realista'
                      : 'Pessimista'}
                  </strong>
                </span>
              </div>

              <div className="divide-y divide-hairline-soft border-t border-b border-hairline">
                {report.items.map((item) => {
                  const scenarioUnit =
                    selectedScenario === 'optimistic'
                      ? item.optimisticUnit
                      : selectedScenario === 'realistic'
                      ? item.realisticUnit
                      : item.pessimisticUnit;

                  const scenarioTotal =
                    selectedScenario === 'optimistic'
                      ? item.optimisticTotal
                      : selectedScenario === 'realistic'
                      ? item.realisticTotal
                      : item.pessimisticTotal;

                  const isHighInflation = item.expectedMonthlyInflationPct > 3.5;

                  return (
                    <div
                      key={item.canonicalProductId}
                      className="py-4 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[16px] font-medium text-ink truncate">
                            {item.commercialName}
                          </p>
                          {isHighInflation && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-soft border border-hairline text-[11px] font-semibold text-scenario-pessimistic shrink-0">
                              <AlertCircle className="w-3 h-3"/>+{item.expectedMonthlyInflationPct}%
                            </span>
                          )}
                        </div>
                        <p className="text-[14px] text-muted mt-0.5">
                          {item.quantity} {item.baseUnit} · Pago ant. {formatBRL(item.lastPaidUnit)} · Menor em{' '}
                          <span className="text-body font-medium">{item.cheapestStoreName}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0 tabular-nums">
                        <p className="text-[16px] font-semibold text-ink">
                          {formatBRL(scenarioTotal)}
                        </p>
                        <p className="text-[13px] text-muted">
                          {formatBRL(scenarioUnit)} / {item.baseUnit.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* COLUNA DIREITA: Sticky Reservation Card (4 cols ~ 33%) */}
          <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28">
            <div className="rounded-md bg-canvas border border-hairline shadow-airbnb p-6">
              {/* Preço Projetado Principal em Ink */}
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-[21px] font-bold text-ink tabular-nums">
                    {formatBRL(activeTotal)}
                  </span>
                  <span className="text-[14px] text-muted ml-1.5">
                    estimado em {targetMonthName}
                  </span>
                </div>
                <span className="text-[13px] font-medium text-muted tabular-nums">
                  {activeDelta >= 0 ? `+${formatBRL(activeDelta)}` : formatBRL(activeDelta)}
                </span>
              </div>

              {/* Seletor de Cenários em Grade com Hairline de 1px (Inspirado no Check-in/Check-out Box do Airbnb) */}
              <div className="rounded-sm border border-hairlinestrong overflow-hidden mb-4">
                <div className="grid grid-cols-3 divide-x divide-hairline bg-canvas">
                  <button
                    type="button"
                    onClick={() => setSelectedScenario('optimistic')}
                    className={`p-3 text-left transition-colors ${
                      selectedScenario === 'optimistic'
                        ? 'bg-surface-soft ring-2 ring-inset ring-ink'
                        : 'hover:bg-surface-soft'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-scenario-optimistic">
                      Otimista
                    </span>
                    <strong className="block text-[14px] font-semibold text-ink mt-0.5 tabular-nums">
                      {formatBRL(report.optimisticBasketTotal)}
                    </strong>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedScenario('realistic')}
                    className={`p-3 text-left transition-colors ${
                      selectedScenario === 'realistic'
                        ? 'bg-surface-soft ring-2 ring-inset ring-ink'
                        : 'hover:bg-surface-soft'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-ink">
                      Realista
                    </span>
                    <strong className="block text-[14px] font-semibold text-ink mt-0.5 tabular-nums">
                      {formatBRL(report.realisticBasketTotal)}
                    </strong>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedScenario('pessimistic')}
                    className={`p-3 text-left transition-colors ${
                      selectedScenario === 'pessimistic'
                        ? 'bg-surface-soft ring-2 ring-inset ring-ink'
                        : 'hover:bg-surface-soft'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-scenario-pessimistic">
                      Pessimista
                    </span>
                    <strong className="block text-[14px] font-semibold text-ink mt-0.5 tabular-nums">
                      {formatBRL(report.pessimisticBasketTotal)}
                    </strong>
                  </button>
                </div>

                <div className="border-t border-hairline px-3 py-2.5 bg-canvas flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-ink">
                      Estratégia recomendada
                    </span>
                    <span className="text-[13px] text-body">
                      {report.splitCartAnalysis.isWorthSplitting
                        ? 'Dividir carrinho em 2 mercados'
                        : `Comprar tudo em ${report.splitCartAnalysis.bestSingleStoreName}`}
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-ink"/>
                </div>
              </div>

              {/* Botão Primário Único (Altura 48px, Raio 8px, Cypress #1e4d3b) */}
              <button
                type="button"
                onClick={onScanNewReceipt}
                className="w-full h-[48px] rounded-sm bg-primary active:bg-primary-active text-white text-[16px] font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <QrCode className="w-5 h-5"/>
                <span>Escanear nova nota fiscal</span>
              </button>

              <p className="text-center text-[13px] text-muted mt-3">
                Cada nota escaneada melhora a precisão e libera +7 dias Pro
              </p>

              {/* Breakdown Matemático Estilo Taxas do Airbnb */}
              <div className="mt-6 pt-4 border-t border-hairline space-y-3 text-[14px]">
                <div className="flex justify-between text-body">
                  <span className="underline decoration-hairline">
                    Custo pago na nota base (Outubro)
                  </span>
                  <span className="tabular-nums">{formatBRL(report.lastPaidBasketTotal)}</span>
                </div>

                <div className="flex justify-between text-body">
                  <span className="underline decoration-hairline">
                    Variação projetada ({selectedScenario})
                  </span>
                  <span className="tabular-nums">
                    {activeDelta >= 0 ? `+${formatBRL(activeDelta)}` : formatBRL(activeDelta)}
                  </span>
                </div>

                <div className="flex justify-between text-body">
                  <span className="underline decoration-hairline">
                    Economia potencial (Carrinho Dividido)
                  </span>
                  <span className="text-primary font-medium tabular-nums">
                    -{formatBRL(report.splitCartAnalysis.netSavings)}
                  </span>
                </div>

                <div className="pt-3 border-t border-hairline flex justify-between text-[16px] font-semibold text-ink">
                  <span>Orçamento sugerido ({targetMonthName})</span>
                  <span className="tabular-nums">{formatBRL(activeTotal)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};