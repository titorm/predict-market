# Implementation Plan Document (IPD): PredictMarket PWA
**Versão:** 1.0.0 (Core Imutável)

---

## 1. Estrutura de Diretórios Imutável do Projeto

```
predictmarket-pwa/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── supabase/
│   └── migrations/
│       └── 0001_immutable_core.sql
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── scanner/
│   │   │   └── page.tsx
│   │   ├── compare/
│   │   │   └── page.tsx
│   │   ├── baskets/
│   │   │   └── [id]/page.tsx
│   │   └── api/
│   │       ├── receipts/
│   │       │   ├── ingest/route.ts
│   │       │   └── share-target/route.ts
│   │       └── forecasts/
│   │           └── generate/route.ts
│   ├── core/
│   │   ├── engine/
│   │   │   └── GroceryForecastEngine.ts
│   │   └── ingestion/
│   │       └── NfceIngestionService.ts
│   ├── components/
│   │   ├── layout/
│   │   │   └── BottomNav.tsx
│   │   ├── forecast/
│   │   │   ├── ForecastScenarioHero.tsx
│   │   │   └── ItemInflationRow.tsx
│   │   ├── comparison/
│   │   │   └── SplitCartCard.tsx
│   │   └── scanner/
│   │       └── QrScannerViewport.tsx
│   └── lib/
│       └── supabase/
│           ├── client.ts
│           └── server.ts
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. Dependências Exatas (`package.json`)

```json
{
  "name": "predictmarket-pwa",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.47.10",
    "cheerio": "^1.0.0",
    "html5-qrcode": "^2.3.8",
    "lucide-react": "^0.469.0",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2"
  }
}
```

---

## 3. Implementação dos Route Handlers Core (Next.js App Router)

### 3.1. Endpoint de Ingestão de Nota Fiscal (`src/app/api/receipts/ingest/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { NfceIngestionService } from '@/core/ingestion/NfceIngestionService';

const IngestSchema = z.object({
  qrCodeUrlOrKey: z.string().min(44, 'Informe a URL do QR Code ou os 44 dígitos da NFC-e.'),
  userId: z.string().uuid('ID de usuário inválido.'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = IngestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const service = new NfceIngestionService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      process.env.OPENAI_API_KEY!
    );

    const result = await service.ingestReceipt(
      parsed.data.qrCodeUrlOrKey,
      parsed.data.userId
    );

    return NextResponse.json(result, { status: result.isDuplicate ? 200 : 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao processar NFC-e.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### 3.2. Endpoint de Geração de Previsão da Cesta (`src/app/api/forecasts/generate/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  GroceryForecastEngine,
  BasketItemInput,
  MonthlyPriceStat,
} from '@/core/engine/GroceryForecastEngine';

export async function POST(req: NextRequest) {
  try {
    const { receiptId, transitCostPenaltyBRL } = await req.json();
    if (!receiptId) {
      return NextResponse.json({ error: 'receiptId é obrigatório.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Busca os itens da nota fiscal semente (ex: compra de 10 de outubro)
    const { data: receiptItems, error: itemsErr } = await supabase
      .from('receipt_items')
      .select(
        `
        canonical_product_id,
        store_id,
        quantity,
        effective_unit_price,
        canonical_products (
          commercial_name,
          ean,
          base_unit,
          net_measure
        )
      `
      )
      .eq('receipt_id', receiptId);

    if (itemsErr || !receiptItems || receiptItems.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum item encontrado para a nota selecionada.' },
        { status: 404 }
      );
    }

    const productIds = receiptItems.map((i) => i.canonical_product_id);

    // 2. Busca a série histórica mensal agregada da view analítica
    const { data: statsData } = await supabase
      .from('vw_monthly_product_price_stats')
      .select('*')
      .in('canonical_product_id', productIds);

    const statsByProduct = new Map<string, MonthlyPriceStat[]>();
    for (const row of statsData ?? []) {
      const list = statsByProduct.get(row.canonical_product_id) ?? [];
      list.push({
        referenceMonth: row.reference_month,
        storeId: row.store_id,
        storeName: row.store_name,
        avgPrice: Number(row.avg_price),
        minPrice: Number(row.min_price),
        maxPrice: Number(row.max_price),
        priceVolatilityStddev: Number(row.price_volatility_stddev),
        avgPricePerBaseUnit: Number(row.avg_price_per_base_unit),
      });
      statsByProduct.set(row.canonical_product_id, list);
    }

    // 3. Monta o payload para o GroceryForecastEngine
    const basketInput: BasketItemInput[] = receiptItems.map((item: any) => ({
      canonicalProductId: item.canonical_product_id,
      commercialName: item.canonical_products.commercial_name,
      ean: item.canonical_products.ean,
      baseUnit: item.canonical_products.base_unit,
      netMeasure: Number(item.canonical_products.net_measure),
      quantity: Number(item.quantity),
      currentUnitPrice: Number(item.effective_unit_price),
      currentStoreId: item.store_id,
      history: statsByProduct.get(item.canonical_product_id) ?? [],
    }));

    const engine = new GroceryForecastEngine();
    const report = engine.generateFullReport(basketInput, transitCostPenaltyBRL);

    return NextResponse.json(report, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao calcular previsão.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

---

## 4. Cronograma de Execução Passo a Passo (Runbook de Engenharia)

### Etapa 1: Provisionamento de Banco e Infraestrutura (Dia 1)
1. Inicializar projeto Next.js com TypeScript e instalar dependências do `package.json`.
2. Executar a migration `supabase/migrations/0001_immutable_core.sql` no SQL Editor do Supabase.
3. Preencher `.env.local` com as chaves do Supabase e OpenAI.

### Etapa 2: Ativação do Core de Ingestão e Resolução Vetorial (Dias 2 e 3)
1. Implementar `src/core/ingestion/NfceIngestionService.ts`.
2. Criar a rota `POST /api/receipts/ingest` e `POST /api/receipts/share-target`.
3. Validar ingestão enviando uma nota fiscal real com itens mistos (industrializados com EAN + hortifrúti `SEM GTIN`) e verificar o preenchimento automático de `canonical_products` e `store_product_aliases`.

### Etapa 3: Ativação do Motor Matemático e Otimizador Split-Cart (Dia 4)
1. Implementar `src/core/engine/GroceryForecastEngine.ts`.
2. Criar a rota `POST /api/forecasts/generate`.
3. Validar a resposta JSON garantindo que `optimisticBasketTotal <= realisticBasketTotal <= pessimisticBasketTotal` tanto em *Cold Start* (1 nota) quanto com múltiplos meses.

### Etapa 4: Construção da Interface PWA e Scanner Mobile (Dias 5 a 7)
1. Implementar os componentes `ForecastScenarioHero.tsx`, `SplitCartCard.tsx` e `QrScannerViewport.tsx`.
2. Registrar `public/manifest.json` e o Service Worker para habilitar a instalação na tela inicial do Android/iOS e o recebimento direto de links da SEFAZ via compartilhamento nativo.
3. Configurar deploy contínuo na Vercel.