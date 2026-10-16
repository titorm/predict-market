export type CanonicalProductCategory =
  | 'Mercearia'
  | 'Laticínios'
  | 'Açougue'
  | 'Hortifrúti'
  | 'Padaria'
  | 'Bebidas'
  | 'Limpeza'
  | 'Higiene';

export const CANONICAL_CATEGORIES: readonly CanonicalProductCategory[] = [
  'Mercearia',
  'Laticínios',
  'Açougue',
  'Hortifrúti',
  'Padaria',
  'Bebidas',
  'Limpeza',
  'Higiene',
] as const;

export interface CategorizationResult {
  category: CanonicalProductCategory;
  confidence: number;
  normalizedName: string;
  source: 'browser-llm' | 'semantic-engine';
}

interface CompoundRule {
  pattern: RegExp;
  category: CanonicalProductCategory;
  scoreBoost: number;
}

interface TokenWeightRule {
  pattern: RegExp;
  category: CanonicalProductCategory;
  weight: number;
}

interface BrowserLanguageModelSession {
  prompt: (input: string) => Promise<string>;
  destroy?: () => void;
}

interface BrowserLanguageModelFactory {
  create: (options?: { systemPrompt?: string }) => Promise<BrowserLanguageModelSession>;
}

interface WindowWithBuiltInAI {
  ai?: {
    languageModel?: BrowserLanguageModelFactory;
  };
  LanguageModel?: BrowserLanguageModelFactory;
}

const STORAGE_CACHE_KEY = 'predict_market_browser_ai_categories_v1';

export function stripAccents(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function cleanFiscalProductName(rawName: string): string {
  const foodContextPattern =
    /\b(maionese|biscoito|bisc|iogurte|iog|chocolate|choc|refri|refrigerante|suco|bala|bolo|gelatina|pipoca|macarrao|lasanha|sorvete|wafer|torrada|temper|caldo|molho|creme|leite|doce|pasta)\b/i;

  let text = rawName.trim();
  if (foodContextPattern.test(stripAccents(text))) {
    text = text.replace(/\bSABAO\b/gi, 'Sabor');
    text = text.replace(/\bSAB\b/gi, 'Sabor');
  }
  return text.replace(/\s+/g, ' ').trim();
}

const COMPOUND_PRIORITY_RULES: readonly CompoundRule[] = [
  {
    pattern: /\b(papel\s+manteiga|papel\s+aluminio|filme\s+pvc|papel\s+toalha|filtro\s+de?\s*cafe|palito\s+dente|saco\s+freezer|forma\s+aluminio)\b/,
    category: 'Mercearia',
    scoreBoost: 25,
  },
  {
    pattern: /\b(maionese|ketchup|catchup|mostarda|molho\s+de?\s*tomate|extrato\s+de?\s*tomate|molho\s+shoyu|molho\s+ingles|molho\s+pimenta|vinagre|azeite)\b/,
    category: 'Mercearia',
    scoreBoost: 25,
  },
  {
    pattern: /\b(leite\s+de\s+coco|doce\s+de?\s*coco|coco\s+ralado|creme\s+de\s+avela|pasta\s+de\s+amendoim)\b/,
    category: 'Mercearia',
    scoreBoost: 22,
  },
  {
    pattern: /\b(agua\s+sanitaria|agua\s+destilada|limpa\s+vidro|limpa\s+piso|limpa\s+forno|multi\s*uso| tira\s+manchas|ap\s+sanit|aparelho\s+sanitario|pedra\s+sanitaria|saco\s+de?\s*lixo)\b/,
    category: 'Limpeza',
    scoreBoost: 25,
  },
  {
    pattern: /\b(papel\s+higienico|creme\s+dental|pasta\s+de\s+dente|escova\s+dental|fio\s+dental|sabonete|shampoo|condicionador|desodorante|absorvente|cotonete|hastes\s+flexiveis|enxaguante\s+bucal|manteiga\s+de\s+cacau)\b/,
    category: 'Higiene',
    scoreBoost: 25,
  },
  {
    pattern: /\b(agua\s+mineral|agua\s+m\b|agua\s+min\b|agua\s+c\s*gas|agua\s+s\s*gas|agua\s+de?\s*coco|beb\s+lactea|bebida\s+lactea|beb\s+energ|bebida\s+energetica|cha\s+gelado|ice\s+tea)\b/,
    category: 'Bebidas',
    scoreBoost: 24,
  },
  {
    pattern: /\b(batata\s+palha|milho\s+pipoca|milho\s+verde|ervilha\s+lata|atum\s+ralado|sardinha\s+lata|caldo\s+knorr|caldo\s+maggi|caldo\s+de?\s*galinha|caldo\s+de?\s*carne|tempero\s+fit|erva\s+doce)\b/,
    category: 'Mercearia',
    scoreBoost: 22,
  },
  {
    pattern: /\b(pao\s+de\s+queijo|pao\s+de\s+qj|pao\s+frances|pao\s+de\s+forma|pao\s+integral|bolo\s+pronto|rap\s*10|massa\s+para\s+wrap)\b/,
    category: 'Padaria',
    scoreBoost: 20,
  },
  {
    pattern: /\b(peito\s+de?\s*frango|peito\s+fgo|coracao\s+de?\s*frango|coracao\s+fgo|coxinha\s+da?\s*asa|moela\s+de?\s*frango|carne\s+moida|nuggets|empanado|linguica|ling\s+cal|ling\s+fgo|ling\s+seara|ling\s+copacol)\b/,
    category: 'Açougue',
    scoreBoost: 24,
  },
  {
    pattern: /\b(creme\s+de\s+leite|cr\s+leite|leite\s+condensado|l\s*cond|requeijao|req\s+tirol|queijo\s+minas|queijo\s+mussarela|queijo\s+prato|iogurte|iog\s+nestle|manteiga\s+com\s+sal|manteiga\s+sem\s+sal|manteiga\s+extra|manteiga\s+lac|manteiga\s+batavo)\b/,
    category: 'Laticínios',
    scoreBoost: 22,
  },
];

const TOKEN_WEIGHT_RULES: readonly TokenWeightRule[] = [
  {
    pattern: /^(arroz|feijao|macarrao|massa|espaguete|farinha|far|fuba|polvilho|acucar|cafe|achocolatado|achoc|oleo|azeite|vinagre|maionese|ketchup|mostarda|molho|sal|tempero|alecrim|oregano|canela|pimenta|caldo|biscoito|bisc|wafer|chocolate|choc|bala|pacoca|doce|gelatina|pipoca|aveia|granola|mel|cereal|ovos|ovo)$/,
    category: 'Mercearia',
    weight: 6,
  },
  {
    pattern: /^(leite|queijo|manteiga|margarina|iogurte|iog|requeijao|req|nata|ricota|coalhada|chantilly)$/,
    category: 'Laticínios',
    weight: 6,
  },
  {
    pattern: /^(carne|frango|fgo|bovina|bovino|suina|suino|peito|alcatra|patinho|acem|costela|picanha|contrafile|maminha|fraldinha|linguica|ling|salsicha|bacon|presunto|mortadela|salame|peixe|tilapia|salmao|camarao|moela|coracao|nuggets|empanado|hamburguer)$/,
    category: 'Açougue',
    weight: 6,
  },
  {
    pattern: /^(banana|maca|laranja|limao|mamao|melancia|melao|uva|morango|abacaxi|manga|pera|kiwi|abacate|tomate|batata|cebola|alho|cenoura|beterraba|abobrinha|chuchu|pepino|pimentao|mandioca|aipim|alface|rucula|agriao|couve|brocolis|repolho|espinafre|cheiro|salsinha|cebolinha|coentro|hortifruti)$/,
    category: 'Hortifrúti',
    weight: 6,
  },
  {
    pattern: /^(pao|paes|torrada|bolo|croissant|bisnaguinha|sonho|brioche|panetone)$/,
    category: 'Padaria',
    weight: 6,
  },
  {
    pattern: /^(refrigerante|refri|refrig|suco|nectar|agua|cerveja|vinho|energetico|isotonic|isotonico|guarana|coca|pepsi|fanta|sprite|chopp|vodka|gin|whisky|espumante)$/,
    category: 'Bebidas',
    weight: 6,
  },
  {
    pattern: /^(detergente|deterg|det|sabao|amaciante|desinfetante|desengordurante|deseng|alvejante|cloro|sanitaria|esponja|la|vassoura|rodo|pano|lustra|cera|inseticida|naftalina|desoflor)$/,
    category: 'Limpeza',
    weight: 6,
  },
  {
    pattern: /^(shampoo|shamp|condicionador|sabonete|desodorante|dental|colgate|oralb|rexona|dove|palmolive|nivea|absorvente|fralda|lenço|cotonete|barbear|depilatorio|hidratante|protetor)$/,
    category: 'Higiene',
    weight: 6,
  },
];

const NOISE_TOKENS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'com',
  'sem',
  'para',
  'em',
  'pc',
  'un',
  'un1',
  'und',
  'kg',
  'kg1',
  'g',
  'ml',
  'l',
  'lt',
  'tp',
  'bg',
  'pt',
  'cx',
  'fd',
  'fd12',
  'pet',
  'fr',
  'rf',
  'tb',
  'br',
  'pp',
  'emb',
  'c',
  's',
  't1',
  'zero',
  'tradicional',
  'trad',
  'especial',
  'premium',
]);

export function classifyProductCategorySemantic(rawInput: string): CategorizationResult {
  const cleanedName = cleanFiscalProductName(rawInput);
  const normalized = stripAccents(cleanedName)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return {
      category: 'Mercearia',
      confidence: 0.5,
      normalizedName: cleanedName,
      source: 'semantic-engine',
    };
  }

  const scores: Record<CanonicalProductCategory, number> = {
    Mercearia: 0,
    Laticínios: 0,
    Açougue: 0,
    Hortifrúti: 0,
    Padaria: 0,
    Bebidas: 0,
    Limpeza: 0,
    Higiene: 0,
  };

  for (const rule of COMPOUND_PRIORITY_RULES) {
    if (rule.pattern.test(normalized)) {
      scores[rule.category] += rule.scoreBoost;
    }
  }

  const rawTokens = normalized.split(' ').filter((t) => t.length > 1 && !/^\d+[a-z]*$/.test(t));
  const meaningfulTokens = rawTokens.filter((t) => !NOISE_TOKENS.has(t));
  const headToken = meaningfulTokens[0] ?? '';

  meaningfulTokens.forEach((token, idx) => {
    const positionalMultiplier = idx === 0 ? 3.5 : idx === 1 ? 1.8 : 0.85;

    for (const rule of TOKEN_WEIGHT_RULES) {
      if (rule.pattern.test(token)) {
        scores[rule.category] += rule.weight * positionalMultiplier;
      }
    }
  });

  if (headToken === 'papel') {
    scores.Laticínios = 0;
    if (normalized.includes('higienico')) {
      scores.Higiene += 30;
    } else {
      scores.Mercearia += 20;
    }
  }

  if (
    /^(maionese|biscoito|bisc|molho|ketchup|mostarda|chocolate|choc|bala|doce|pipoca|arroz|feijao|farinha|far|macarrao|cafe|acucar|vinagre|azeite|oleo|tempero|caldo)$/.test(
      headToken
    )
  ) {
    scores.Limpeza = 0;
    scores.Higiene = 0;
    scores.Mercearia += 15;
  }

  if (headToken === 'agua' && normalized.includes('sanitaria')) {
    scores.Bebidas = 0;
    scores.Limpeza += 30;
  }

  let bestCategory: CanonicalProductCategory = 'Mercearia';
  let maxScore = -1;
  let totalPositiveScore = 0;

  for (const cat of CANONICAL_CATEGORIES) {
    const s = scores[cat];
    if (s > 0) {
      totalPositiveScore += s;
    }
    if (s > maxScore) {
      maxScore = s;
      bestCategory = cat;
    }
  }

  if (maxScore <= 0) {
    return {
      category: 'Mercearia',
      confidence: 0.6,
      normalizedName: cleanedName,
      source: 'semantic-engine',
    };
  }

  const confidence = Math.min(
    0.99,
    Math.max(0.65, Number((maxScore / Math.max(maxScore + 4, totalPositiveScore)).toFixed(2)))
  );

  return {
    category: bestCategory,
    confidence,
    normalizedName: cleanedName,
    source: 'semantic-engine',
  };
}

export function classifyProductCategory(rawInput: string): CanonicalProductCategory {
  return classifyProductCategorySemantic(rawInput).category;
}

function readBrowserCache(): Record<string, CategorizationResult> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CategorizationResult>;
  } catch {
    return {};
  }
}

function writeBrowserCache(cache: Record<string, CategorizationResult>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

function getBrowserLanguageModelFactory(): BrowserLanguageModelFactory | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as WindowWithBuiltInAI;
  if (win.ai?.languageModel?.create) {
    return win.ai.languageModel;
  }
  if (win.LanguageModel?.create) {
    return win.LanguageModel;
  }
  return null;
}

export async function classifyProductsWithBrowserAI<
  T extends { id: string; commercialName: string; category: string }
>(
  products: T[]
): Promise<{
  items: T[];
  corrections: Array<{ id: string; commercialName: string; category: CanonicalProductCategory }>;
}> {
  if (products.length === 0) {
    return { items: products, corrections: [] };
  }

  const cache = readBrowserCache();
  let cacheUpdated = false;
  const corrections: Array<{
    id: string;
    commercialName: string;
    category: CanonicalProductCategory;
  }> = [];

  const updatedItems: T[] = products.map((item) => {
    const cacheKey = stripAccents(item.commercialName);
    const cached = cache[cacheKey];

    const semantic = cached ?? classifyProductCategorySemantic(item.commercialName);
    if (!cached) {
      cache[cacheKey] = semantic;
      cacheUpdated = true;
    }

    const cleanedCommercialName = semantic.normalizedName;
    const resolvedCategory = semantic.category;

    if (
      item.category !== resolvedCategory ||
      item.commercialName !== cleanedCommercialName
    ) {
      corrections.push({
        id: item.id,
        commercialName: cleanedCommercialName,
        category: resolvedCategory,
      });
      return {
        ...item,
        commercialName: cleanedCommercialName,
        category: resolvedCategory,
      };
    }

    return item;
  });

  const aiFactory = getBrowserLanguageModelFactory();
  if (aiFactory) {
    const lowConfidenceItems = updatedItems.filter((it) => {
      const key = stripAccents(it.commercialName);
      const entry = cache[key];
      return entry && entry.confidence < 0.72 && entry.source !== 'browser-llm';
    });

    if (lowConfidenceItems.length > 0) {
      try {
        const session = await aiFactory.create({
          systemPrompt:
            'Você classifica produtos de supermercado do Brasil em exatamente uma categoria: Mercearia, Laticínios, Açougue, Hortifrúti, Padaria, Bebidas, Limpeza ou Higiene. Responda apenas com o nome exato da categoria.',
        });

        for (const item of lowConfidenceItems.slice(0, 8)) {
          const reply = (await session.prompt(`Produto: "${item.commercialName}". Categoria:`)).trim();
          const matchedCat = CANONICAL_CATEGORIES.find(
            (c) => stripAccents(c) === stripAccents(reply)
          );
          if (matchedCat) {
            const key = stripAccents(item.commercialName);
            cache[key] = {
              category: matchedCat,
              confidence: 0.95,
              normalizedName: item.commercialName,
              source: 'browser-llm',
            };
            cacheUpdated = true;
            if (item.category !== matchedCat) {
              item.category = matchedCat;
              corrections.push({
                id: item.id,
                commercialName: item.commercialName,
                category: matchedCat,
              });
            }
          }
        }

        session.destroy?.();
      } catch {}
    }
  }

  if (cacheUpdated) {
    writeBrowserCache(cache);
  }

  return { items: updatedItems, corrections };
}
