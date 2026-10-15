# Product Requirement Document (PRD): PredictMarket PWA
**Versão:** 1.0.0 (Core Imutável)  
**Status:** Baseline de Engenharia e Produto  
**Plataforma:** Web Ecosystem (Next.js PWA Mobile-First & Desktop)

---

## 1. Visão Executiva e Problema
A inflação oficial divulgada por índices macroeconômicos (como o IPCA) não reflete a variação real de preços da cesta individual de cada família. A alternância de estabelecimentos comerciais, a variação sazonal de perecíveis, a falta de padronização na descrição de produtos em notas fiscais (NFC-e) e a prática de reduflação (*shrinkflation*) impedem que o consumidor preveja quanto gastará no mês seguinte para adquirir exatamente os mesmos itens.

O **PredictMarket** é um Progressive Web App (PWA) que converte a leitura de Notas Fiscais de Consumidor Eletrônicas (NFC-e) em um motor estatístico de previsão de gastos mensais e arbitragem de supermercados.

---

## 2. Escopo Funcional Completo (Requisitos Funcionais)

| ID | Funcionalidade | Regra de Negócio e Comportamento | Prioridade |
| :--- | :--- | :--- | :--- |
| **RF01** | **Ingestão Multi-Canal de NFC-e** | Suporte à leitura de QR Code via câmera, recebimento de URL da SEFAZ via *Web Share Target API* (compartilhamento nativo do celular) e digitação manual da Chave de Acesso de 44 dígitos. | P0 (Crítico) |
| **RF02** | **Extração Estruturada SEFAZ** | O sistema extrai emitente (CNPJ, Razão Social, Nome Fantasia, Endereço), data/hora de emissão, chave de acesso e lista de itens (`cProd`, `xProd`, `cEAN`, `uCom`, `qCom`, `vUnCom`, `vDesc`). | P0 (Crítico) |
| **RF03** | **Resolução Canônica com EAN** | Produtos com GTIN/EAN válido (8 a 14 dígitos numéricos, diferentes de `"SEM GTIN"`) são vinculados de forma única globalmente, substituindo abreviações fiscais pelo nome comercial padronizado. | P0 (Crítico) |
| **RF04** | **Normalização Semântica sem EAN** | Produtos a granel, hortifrúti, açougue e padaria (`"SEM GTIN"`) passam por limpeza léxica, geração de embedding vetorial (1536d) e *matching* por similaridade de cosseno ($\ge 0.88$) e trigramas, unificando variações regionais sob o mesmo `canonical_product_id`. | P0 (Crítico) |
| **RF05** | **Motor Preditivo de 3 Cenários** | Projeção mensal por item e por cesta consolidada nos cenários **Otimista**, **Realista** e **Pessimista**, combinando Média Móvel Exponencial Ponderada (EWMA) e Encolhimento Bayesiano (*Bayesian Shrinkage*). | P0 (Crítico) |
| **RF06** | **Clonagem de Cesta Base** | O usuário pode selecionar qualquer nota fiscal anterior (ex: compra de 10 de outubro) ou combinar itens recorrentes como "Cesta Base" para projetar o custo do mês seguinte (ex: novembro) mantendo as quantidades travadas. | P0 (Crítico) |
| **RF07** | **Duelo de Bandeiras (Mercados)** | Simula o custo total da Cesta Base em cada supermercado da cidade utilizando a matriz de preços recentes cruzados de todos os usuários da região. | P1 (Alto) |
| **RF08** | **Otimizador de Carrinho Dividido** | Calcula se a economia bruta de dividir a compra em 2 supermercados diferentes supera o **Custo de Deslocamento Configurável** (ex: R$ 35,00 de combustível/transporte + tempo). | P1 (Alto) |
| **RF09** | **Detector de Reduflação** | Identifica quando um fabricante mantém a linha de produto mas reduz o peso/volume líquido (`net_measure`) provocando aumento oculto no preço por Kg/Litro. | P1 (Alto) |
| **RF10** | **Loop Gamificado Give-to-Get** | Usuários no plano gratuito desbloqueiam automaticamente **+7 dias de acesso Pro** a cada nota fiscal válida e inédita escaneada no sistema, alimentando o grafo regional de preços. | P1 (Alto) |

---

## 3. Invariantes de Domínio e Regras de Negócio (Imutáveis)

1. **Invariante de Unicidade Fiscal (`BR01`):** Uma `access_key` (44 dígitos) nunca pode ser processada duas vezes na tabela `receipts`. Tentativas duplicadas retornam os dados já processados de forma idempotente.
2. **Invariante de Preço Efetivo (`BR02`):** Todo cálculo estatístico deve utilizar o preço unitário líquido efetivo:
   $$P_{\text{efetivo}} = \frac{(P_{\text{bruto}} \times q) - D_{\text{item}}}{q}$$
   Descontos de atacarejo ou clubes de fidelidade impressos no item são obrigatoriamente deduzidos antes de alimentar a série temporal.
3. **Invariante de Monotonicidade Preditiva (`BR03`):** Para todo produto $i$ e para a cesta total $C$, os valores projetados devem satisfazer estritamente:
   $$\hat{P}_{i, t+1}^{\text{Otimista}} \le \hat{P}_{i, t+1}^{\text{Realista}} \le \hat{P}_{i, t+1}^{\text{Pessimista}}$$
4. **Invariante de Saneamento de Outliers (`BR04`):** Variações mensais unitárias superiores a $+80\%$ ou inferiores a $-40\%$ em um único mês são submetidas a *clamping* no cálculo da tendência (EWMA) para impedir que erros de digitação do caixa ou promoções de queima de estoque distorçam a projeção anual.
5. **Invariante de Privacidade do Grafo Coletivo (`BR05`):** Os preços unitários por CNPJ e data alimentam as views analíticas regionais de forma 100% desvinculada do `user_id`. Nenhum usuário pode visualizar notas fiscais ou cestas de terceiros.

---

## 4. Histórias de Usuário e Critérios de Aceite (Gherkin)

### US01: Previsão de Compra a partir da Nota do Mês Anterior
* **Dado** que enviei minha nota fiscal do dia 10 de outubro contendo 25 itens totalizando R$ 840,00,
* **Quando** eu selecionar essa nota como "Cesta Base para Novembro",
* **Então** o sistema deve exibir o valor projetado nos cenários Otimista, Realista e Pessimista em menos de 1 segundo,
* **E** caso eu possua menos de 3 meses de histórico próprio para algum item, o motor deve ponderar automaticamente com a inflação regional (*Cold Start*) sem falhar ou exibir `NaN`.

### US02: Unificação de Hortifrúti e Itens sem Código de Barras
* **Dado** que em outubro comprei `"BANANA PRATA KG"` no Mercado A (`cEAN = "SEM GTIN"`) e em novembro comprei `"BANANA PRATA GRANEL"` no Mercado B (`cEAN = "SEM GTIN"`),
* **Quando** o pipeline de ingestão processar a segunda nota,
* **Então** ambos os registros devem apontar para o mesmo `canonical_product_id` (`Banana Prata (Kg)`), preservando a continuidade da curva de inflação e comparando os dois estabelecimentos.

### US03: Arbitragem de Carrinho Dividido com Pedágio de Deslocamento
* **Dado** que minha cesta custa R$ 920,00 inteira no Mercado A e R$ 945,00 inteira no Mercado B,
* **E** comprar os itens mais baratos de cada um resulta em R$ 860,00 (economia bruta de R$ 60,00),
* **Quando** meu custo de deslocamento extra estiver configurado em R$ 40,00,
* **Então** o sistema deve recomendar a **Compra Dividida** destacando a **Economia Líquida de R$ 20,00** e separando a lista de compras em duas abas prontas para check-in no mercado.

---

## 5. Matriz de Monetização e Feature Gating

| Recurso / Capacidade | Tier Free (Básico) | Tier Pro (R$ 14,90/mês ou Give-to-Get Ativo) |
| :--- | :--- | :--- |
| Leitura de NFC-e via QR Code / Chave | Ilimitado | Ilimitado |
| Histórico de Séries Temporais | Últimos 3 meses | Ilimitado (Anual / Multi-ano) |
| Previsão para o Próximo Mês | Apenas Cenário Realista | Otimista, Realista e Pessimista completos |
| Comparador de Supermercados | Mostra apenas o 1º colocado geral | Ranking completo + Otimizador de Carrinho Dividido |
| Alertas de Reduflação (*Shrinkflation*) | Bloqueado (Exibe contador de alertas) | Desbloqueado com indicação de marca substituta |
| Regra *Give-to-Get* (Crowdsourcing) | Escanear 1 nota nova da semana libera 7 dias Pro | Mantém assinatura ativa ou acumula créditos |