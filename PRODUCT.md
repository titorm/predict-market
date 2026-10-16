# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Famílias e consumidores no Brasil (iniciando em Santa Catarina) que compram em supermercados e atacarejos, enfrentam a inflação real dos alimentos e precisam planejar o orçamento doméstico mensal.

## Product Purpose
O PredictMarket é um Progressive Web App (PWA) que converte cupons fiscais eletrônicos (NFC-e) em um motor estatístico de previsão de compras mensais e arbitragem de preços entre supermercados.

## Positioning
Diferente de índices macroeconômicos abstratos ou listas de compras estáticas, o PredictMarket usa dados reais de cupons fiscais emitidos pela SEFAZ, resolução canônica de produtos por EAN e semântica vetorial, projeção preditiva de 3 cenários (EWMA + Encolhimento Bayesiano) e otimizador de carrinho dividido com cálculo de pedágio de deslocamento.

## Operating Context
Uso móvel na hora da compra e em casa para planejar o mês. O usuário importa notas fiscais por leitura de QR Code pela câmera, compartilhamento nativo do link da SEFAZ (Web Share Target API) ou digitação manual da chave de 44 dígitos. Acesso multiplataforma via navegador e PWA instalado no smartphone ou tablet.

## Capabilities and Constraints
- Ingestão fiscal idempotente por chave de 44 dígitos (BR01).
- Cálculo obrigatório pelo preço unitário líquido efetivo com deduções de descontos (BR02).
- Projeção em 3 cenários respeitando monotonicidade: Otimista <= Realista <= Pessimista (BR03).
- Filtro de outliers (clamping de -40% a +80%) em variações anômalas (BR04).
- Privacidade restrita: grafos de preços agregados e anônimos por CNPJ (BR05).
- Mecanismo gamificado Give-to-Get: 1 nota nova inédita desbloqueia 7 dias de acesso Pro.
- PWA instalável com suporte offline e responsividade nativa para smartphones, tablets e desktop.

## Brand Commitments
- Nome: PredictMarket.
- Estética limpa, funcional e inspirada no design utilitário premium, com paleta centrada no verde floresta (`#1e4d3b`), fundo canvas branco (`#ffffff`) e bordas suaves (`#dddddd`).
- Biblioteca de ícones exclusiva: Phosphor Icons (peso bold para ações e ênfase).

## Evidence on Hand
- Fixtures e dados de validação de cupons fiscais em `src/core/ingestion/known-receipts.ts`.
- Base oficial de 295 municípios de Santa Catarina em `src/data/santa-catarina-cities.ts`.
- Motores estatísticos testados (`GroceryForecastEngine.ts`, `PantryReplenishmentEngine.ts`, `LocalProductCategorizer.ts`).

## Product Principles
1. Dados fiscais reais superam estimativas manuais e índices abstratos.
2. Cada centavo e cada desconto devem ser auditáveis pelo consumidor.
3. Velocidade e ergonomia móvel: a captura da nota deve levar menos de 5 segundos.
4. Clareza e privacidade: previsões determinísticas sem expor compras individuais a terceiros.

## Accessibility & Inclusion
- Contraste visual elevado entre texto e fundos.
- Touch targets com dimensão mínima de 44x44px em telas sensíveis ao toque.
- Respeito às Safe Areas de dispositivos móveis (notches e home bars).
- Navegação fluida por teclado e leitores de tela em elementos semânticos.
