CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$ BEGIN
    CREATE TYPE base_unit_type AS ENUM ('KG', 'L', 'UN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_tier_type AS ENUM ('FREE', 'PRO', 'GIVE_TO_GET_PRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE receipt_status_type AS ENUM ('PROCESSED', 'PENDING_RETRY', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    city TEXT NOT NULL DEFAULT 'Florianópolis',
    state CHAR(2) NOT NULL DEFAULT 'SC',
    subscription_tier subscription_tier_type NOT NULL DEFAULT 'FREE',
    pro_expires_at TIMESTAMPTZ,
    transit_cost_penalty_brl NUMERIC(8, 2) NOT NULL DEFAULT 35.00 CHECK (transit_cost_penalty_brl >= 0),
    monthly_budget_target_brl NUMERIC(10, 2) CHECK (monthly_budget_target_brl IS NULL OR monthly_budget_target_brl > 0),
    receipts_contributed_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj VARCHAR(14) NOT NULL UNIQUE CHECK (cnpj ~ '^[0-9]{14}$'),
    trade_name TEXT NOT NULL,
    legal_name TEXT NOT NULL,
    neighborhood TEXT,
    city TEXT NOT NULL,
    state CHAR(2) NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_city_state ON stores (city, state);

CREATE TABLE IF NOT EXISTS canonical_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ean VARCHAR(14) UNIQUE CHECK (ean IS NULL OR ean ~ '^[0-9]{8,14}$'),
    commercial_name TEXT NOT NULL,
    brand_name TEXT,
    category TEXT NOT NULL DEFAULT 'Geral',
    base_unit base_unit_type NOT NULL DEFAULT 'UN',
    net_measure NUMERIC(10, 4) NOT NULL DEFAULT 1.0000 CHECK (net_measure > 0),
    previous_measure_product_id UUID REFERENCES canonical_products(id),
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canonical_products_embedding_hnsw
ON canonical_products USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_canonical_products_name_trgm
ON canonical_products USING gin (commercial_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS store_product_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    canonical_product_id UUID NOT NULL REFERENCES canonical_products(id) ON DELETE RESTRICT,
    raw_store_code TEXT NOT NULL,
    raw_description TEXT NOT NULL,
    confidence_score NUMERIC(4, 3) NOT NULL DEFAULT 1.000 CHECK (confidence_score BETWEEN 0 AND 1),
    is_manually_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (store_id, raw_store_code, raw_description)
);

CREATE INDEX IF NOT EXISTS idx_store_aliases_fast_lookup
ON store_product_aliases (store_id, raw_store_code, raw_description);

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    access_key CHAR(44) NOT NULL UNIQUE CHECK (access_key ~ '^[0-9]{44}$'),
    issued_at TIMESTAMPTZ NOT NULL,
    total_gross NUMERIC(12, 2) NOT NULL CHECK (total_gross >= 0),
    total_discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_discount >= 0),
    total_net NUMERIC(12, 2) GENERATED ALWAYS AS (total_gross - total_discount) STORED,
    status receipt_status_type NOT NULL DEFAULT 'PROCESSED',
    sefaz_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_user_issued ON receipts (user_id, issued_at DESC);

CREATE TABLE IF NOT EXISTS receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    canonical_product_id UUID NOT NULL REFERENCES canonical_products(id) ON DELETE RESTRICT,
    purchased_at TIMESTAMPTZ NOT NULL,
    quantity NUMERIC(12, 4) NOT NULL CHECK (quantity > 0),
    raw_unit VARCHAR(10) NOT NULL,
    gross_unit_price NUMERIC(12, 4) NOT NULL CHECK (gross_unit_price >= 0),
    total_item_discount NUMERIC(12, 4) NOT NULL DEFAULT 0.00 CHECK (total_item_discount >= 0),
    effective_unit_price NUMERIC(12, 4) GENERATED ALWAYS AS (
        ROUND((gross_unit_price * quantity - total_item_discount) / quantity, 4)
    ) STORED
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_timeseries
ON receipt_items (canonical_product_id, store_id, purchased_at DESC);

CREATE TABLE IF NOT EXISTS baskets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
    target_month DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS basket_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    basket_id UUID NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
    canonical_product_id UUID NOT NULL REFERENCES canonical_products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 4) NOT NULL CHECK (quantity > 0),
    reference_unit_price NUMERIC(12, 4) NOT NULL CHECK (reference_unit_price >= 0),
    reference_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    UNIQUE (basket_id, canonical_product_id)
);

CREATE TABLE IF NOT EXISTS shrinkflation_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    old_product_id UUID NOT NULL REFERENCES canonical_products(id) ON DELETE CASCADE,
    new_product_id UUID NOT NULL REFERENCES canonical_products(id) ON DELETE CASCADE,
    old_net_measure NUMERIC(10, 4) NOT NULL,
    new_net_measure NUMERIC(10, 4) NOT NULL,
    measure_reduction_pct NUMERIC(5, 2) NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (old_product_id, new_product_id)
);

CREATE OR REPLACE FUNCTION match_or_resolve_product(
    p_store_id UUID,
    p_ean VARCHAR(14),
    p_raw_code TEXT,
    p_raw_description TEXT,
    p_query_embedding vector(1536),
    p_similarity_threshold FLOAT DEFAULT 0.88
)
RETURNS TABLE (
    resolved_product_id UUID,
    match_method TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_ean IS NOT NULL AND p_ean ~ '^[0-9]{8,14}$' THEN
        RETURN QUERY
        SELECT cp.id, 'EXACT_EAN'::TEXT, 1.0::FLOAT
        FROM canonical_products cp
        WHERE cp.ean = p_ean
        LIMIT 1;

        IF FOUND THEN RETURN; END IF;
    END IF;

    RETURN QUERY
    SELECT spa.canonical_product_id, 'STORE_ALIAS_CACHE'::TEXT, spa.confidence_score::FLOAT
    FROM store_product_aliases spa
    WHERE spa.store_id = p_store_id
      AND spa.raw_store_code = p_raw_code
      AND spa.raw_description = p_raw_description
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        cp.id,
        'VECTOR_SEMANTIC_MATCH'::TEXT,
        (1 - (cp.embedding <=> p_query_embedding))::FLOAT AS sim
    FROM canonical_products cp
    WHERE cp.embedding IS NOT NULL
      AND (1 - (cp.embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY cp.embedding <=> p_query_embedding ASC
    LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION trg_fn_reward_give_to_get()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles
    SET
        receipts_contributed_count = receipts_contributed_count + 1,
        subscription_tier = CASE
            WHEN subscription_tier = 'FREE' THEN 'GIVE_TO_GET_PRO'::subscription_tier_type
            ELSE subscription_tier
        END,
        pro_expires_at = GREATEST(COALESCE(pro_expires_at, NOW()), NOW()) + INTERVAL '7 days',
        updated_at = NOW()
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_receipt_give_to_get ON receipts;
CREATE TRIGGER trg_receipt_give_to_get
AFTER INSERT ON receipts
FOR EACH ROW
EXECUTE FUNCTION trg_fn_reward_give_to_get();

CREATE OR REPLACE VIEW vw_monthly_product_price_stats AS
SELECT
    ri.canonical_product_id,
    cp.commercial_name,
    cp.ean,
    cp.base_unit,
    cp.net_measure,
    ri.store_id,
    s.trade_name AS store_name,
    s.city,
    s.state,
    DATE_TRUNC('month', ri.purchased_at)::DATE AS reference_month,
    COUNT(ri.id) AS sample_count,
    ROUND(AVG(ri.effective_unit_price), 2) AS avg_price,
    ROUND(MIN(ri.effective_unit_price), 2) AS min_price,
    ROUND(MAX(ri.effective_unit_price), 2) AS max_price,
    ROUND(COALESCE(STDDEV_SAMP(ri.effective_unit_price), 0), 4) AS price_volatility_stddev,
    ROUND(AVG(ri.effective_unit_price / cp.net_measure), 2) AS avg_price_per_base_unit
FROM receipt_items ri
JOIN canonical_products cp ON cp.id = ri.canonical_product_id
JOIN stores s ON s.id = ri.store_id
GROUP BY
    ri.canonical_product_id,
    cp.commercial_name,
    cp.ean,
    cp.base_unit,
    cp.net_measure,
    ri.store_id,
    s.trade_name,
    s.city,
    s.state,
    DATE_TRUNC('month', ri.purchased_at);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE canonical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_product_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE baskets ENABLE ROW LEVEL SECURITY;
ALTER TABLE basket_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users manage own receipts" ON receipts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own receipt items" ON receipt_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM receipts r WHERE r.id = receipt_items.receipt_id AND r.user_id = auth.uid())
    );

CREATE POLICY "Users manage own baskets" ON baskets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own basket items" ON basket_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM baskets b WHERE b.id = basket_items.basket_id AND b.user_id = auth.uid())
    );

CREATE POLICY "Authenticated read stores" ON stores
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read canonical products" ON canonical_products
    FOR SELECT TO authenticated USING (true);
