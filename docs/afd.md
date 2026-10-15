# App Flow Document (AFD): PredictMarket PWA
**Versão:** 1.0.0 (Core Imutável)

---

## 1. Arquitetura de Rotas e Guardas de Navegação (Next.js App Router)

| Rota (Path) | Nível de Acesso | Objetivo Principal da Tela |
| :--- | :--- | :--- |
| `/` | Público | Landing Page com simulador interativo de inflação pessoal e CTA de instalação do PWA. |
| `/auth/login` | Público | Autenticação via Magic Link / Google OAuth (Supabase Auth). |
| `/dashboard` | Autenticado | Visão consolidada: Card de Previsão do Próximo Mês (Otimista/Realista/Pessimista), Top 5 Vilões da Cesta, Contador *Give-to-Get* e Alertas de Reduflação. |
| `/scanner` | Autenticado | Leitor de QR Code via câmera HTML5, receptor de *Web Share Target* e input de Chave de Acesso (44 dígitos). |
| `/baskets/[id]` | Autenticado | Editor de Cesta Base (ex: "Cesta Outubro -> Previsão Novembro"), ajuste fino de quantidades e projeção item a item. |
| `/compare` | Autenticado | Duelo de Supermercados: Ranking de custo total por CNPJ e Otimizador de Carrinho Dividido (com ajuste de custo de deslocamento). |
| `/products/[id]` | Autenticado | Histórico de preços de um Produto Canônico (curva 12 meses, menor/maior preço atual por bairro e aliases vinculados). |
| `/settings` | Autenticado | Gestão de plano (Free / Pro / Give-to-Get), configuração de raio máximo de deslocamento (km) e custo de combustível/transporte. |

---

## 2. Máquinas de Estado Determinísticas dos Fluxos Principais

### 2.1. Fluxo de Ingestão e Normalização de NFC-e
```
[USUÁRIO ACIONA SCANNER OU WEB SHARE TARGET]
                     │
                     ▼
        ┌─────────────────────────┐
        │ Extrai Chave 44 Dígitos │
        └────────────┬────────────┘
                     │
         ┌───────────┴───────────┐
         ▼ (Inválida)            ▼ (Válida)
[Toast Erro de Formato]   [Verifica Chave em `receipts`]
                                 │
                     ┌───────────┴───────────┐
                     ▼ (Já Existe)           ▼ (Inédita)
          [Redireciona p/ Nota]    [Scraper SEFAZ (Timeout 8s)]
                                             │
                                 ┌───────────┴───────────┐
                                 ▼ (Offline / Captcha)   ▼ (HTML/XML Extraído)
                      [Salva em `PENDING_QUEUE`]  [Para cada Item da Nota:]
                      [Processa em Background]           │
                                             ┌───────────┴───────────┐
                                             ▼ (Com EAN)             ▼ (SEM GTIN)
                                    [Match Exato EAN]     [Busca Cache Alias Loja]
                                             │                       │
                                             │            ┌──────────┴──────────┐
                                             │            ▼ (Miss)              ▼ (Hit)
                                             │   [Gera Embedding 1536d]         │
                                             │   [Busca HNSW >= 0.88]           │
                                             └────────────┼──────────┬──────────┘
                                                          ▼          ▼
                                             [Persiste `receipt_items`]
                                             [Trigger: +7 Dias Pro (Give-to-Get)]
                                             [Recalcula Cesta -> /dashboard]
```

### 2.2. Fluxo de Criação da Previsão Mensal (Outubro $\to$ Novembro)
1. **Seleção da Semente (*Seed Basket*):** No `/dashboard`, o usuário clica em *"Projetar Próxima Compra"* e seleciona a nota fiscal do dia **10 de outubro** (ou mescla notas do mês de outubro).
2. **Congelamento de Quantidades:** O sistema cria um registro em `baskets` com os `canonical_product_id` e suas respectivas quantidades compradas em outubro.
3. **Execução do Motor Bayesiano-EWMA:**
   * Para itens onde o usuário já possui 6 a 12 meses de notas: o peso $w_n = \frac{n}{n+3}$ prioriza a variação real observada nas compras do usuário.
   * Para itens comprados pela primeira vez em outubro ($n=0$): o motor faz fallback transparente para a variação média regional daquele produto na cidade ou o $\pi_{\text{prior}}$ de $0.85\%$ a.m.
4. **Renderização dos 3 Cenários:**
   * **Aba Otimista:** Mostra a lista roteirizada pelos preços mínimos recentes.
   * **Aba Realista (Padrão):** Mostra quanto custará repetir a compra exatamente no mercado habitual.
   * **Aba Pessimista:** Mostra o teto orçamentário de segurança ($+1.5\sigma$) para reserva financeira.

---

## 3. Tratamento de Casos Extremos (Edge Cases de UX)

* **EC01 - Portal da SEFAZ Estadual Fora do Ar ou Instável:** Se o portal estadual demorar mais de 8 segundos para responder, a chave de 44 dígitos é salva com `status = 'PENDING_RETRY'` na tabela `receipts`. Um *cron job* reprocessa a nota a cada 15 minutos e notifica o usuário sem bloquear o uso do app.
* **EC02 - Falsos Positivos em Produtos a Granel (Zona Cinzenta Vetorial $0.82 \le \text{sim} < 0.88$):** Quando um produto sem EAN cai na zona cinzenta de similaridade (ex: `"MAÇA GALA KG"` vs. `"MAÇA FUJI KG"`), o sistema vincula provisoriamente e exibe um chip discreto de confirmação rápida (*"Isto é Maçã Gala?" [Sim] / [Separar Produto]*) na tela de revisão da nota.
* **EC03 - Desconto de Clube Concedido no Rodapé da Nota:** Quando o supermercado aplica desconto global no subtotal em vez de aplicar item a item, o sistema rateia o `total_discount` proporcionalmente ao peso financeiro de cada item para não inflar artificialmente o `effective_unit_price`.