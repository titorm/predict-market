CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    city VARCHAR(100) NOT NULL DEFAULT 'Florianópolis',
    state VARCHAR(2) NOT NULL DEFAULT 'SC',
    max_distance_km NUMERIC(5,2) NOT NULL DEFAULT 15.0,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    city VARCHAR(100) NOT NULL DEFAULT 'Florianópolis',
    state VARCHAR(2) NOT NULL DEFAULT 'SC',
    car_consumption_kml NUMERIC(4,1) DEFAULT 10.5,
    fuel_price_brl NUMERIC(5,2) DEFAULT 5.99,
    max_distance_km NUMERIC(5,2) NOT NULL DEFAULT 15.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    token_type VARCHAR(32) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    trade_name TEXT NOT NULL,
    corporate_name TEXT,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    street TEXT,
    number TEXT,
    neighborhood TEXT,
    city TEXT NOT NULL,
    state VARCHAR(2) NOT NULL,
    postal_code VARCHAR(8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canonical_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gtin_ean VARCHAR(14) UNIQUE,
    commercial_name TEXT NOT NULL,
    brand TEXT,
    ncm VARCHAR(8),
    standard_unit VARCHAR(10) NOT NULL DEFAULT 'UN',
    category TEXT,
    normalized_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_product_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    raw_description TEXT NOT NULL,
    store_internal_code TEXT,
    canonical_product_id UUID NOT NULL REFERENCES canonical_products(id) ON DELETE RESTRICT,
    confidence_score NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_store_raw_alias UNIQUE (store_id, raw_description)
);

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    access_key VARCHAR(44) NOT NULL UNIQUE,
    issue_number VARCHAR(16),
    series VARCHAR(8),
    issued_at TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    net_amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(30),
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    canonical_product_id UUID REFERENCES canonical_products(id) ON DELETE SET NULL,
    item_index INTEGER NOT NULL,
    raw_description TEXT NOT NULL,
    quantity NUMERIC(10,3) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    discount_value NUMERIC(10,2) DEFAULT 0.00,
    unit_of_measure VARCHAR(10) NOT NULL,
    purchased_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS baskets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_cadence_days INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS basket_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    basket_id UUID NOT NULL REFERENCES baskets(id) ON DELETE CASCADE,
    canonical_product_id UUID NOT NULL REFERENCES canonical_products(id) ON DELETE RESTRICT,
    planned_quantity NUMERIC(10,3) NOT NULL,
    unit_of_measure VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_basket_product UNIQUE (basket_id, canonical_product_id)
);

CREATE TABLE IF NOT EXISTS price_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    basket_id UUID REFERENCES baskets(id) ON DELETE CASCADE,
    forecast_period VARCHAR(7) NOT NULL,
    optimistic_total NUMERIC(10,2) NOT NULL,
    realistic_total NUMERIC(10,2) NOT NULL,
    pessimistic_total NUMERIC(10,2) NOT NULL,
    single_store_recommendation_id UUID REFERENCES stores(id),
    split_store_1_id UUID REFERENCES stores(id),
    split_store_2_id UUID REFERENCES stores(id),
    split_savings_net NUMERIC(10,2),
    personal_inflation_rate NUMERIC(5,4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_points (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points_balance INTEGER NOT NULL DEFAULT 0,
    pro_access_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS give_to_get_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
    points_delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash ON auth_tokens(token_hash, token_type);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_canonical ON receipt_items(canonical_product_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_purchased_at ON receipt_items(purchased_at);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city, state);
CREATE INDEX IF NOT EXISTS idx_baskets_user ON baskets(user_id);

CREATE OR REPLACE VIEW vw_monthly_product_price_stats AS
SELECT
    ri.store_id,
    ri.canonical_product_id,
    s.city,
    s.state,
    TO_CHAR(ri.purchased_at, 'YYYY-MM') AS month_year,
    COUNT(ri.id) AS observation_count,
    ROUND(AVG(ri.unit_price), 2) AS mean_unit_price,
    ROUND(STDDEV_SAMP(ri.unit_price), 2) AS std_dev_unit_price,
    MIN(ri.unit_price) AS min_unit_price,
    MAX(ri.unit_price) AS max_unit_price,
    MAX(ri.purchased_at) AS latest_observation_at
FROM receipt_items ri
JOIN stores s ON s.id = ri.store_id
WHERE ri.canonical_product_id IS NOT NULL
GROUP BY ri.store_id, ri.canonical_product_id, s.city, s.state, TO_CHAR(ri.purchased_at, 'YYYY-MM');

CREATE OR REPLACE FUNCTION match_or_resolve_product(
    p_store_id UUID,
    p_raw_description TEXT,
    p_ean VARCHAR(14) DEFAULT NULL
)
RETURNS TABLE (
    canonical_id UUID,
    resolution_type TEXT,
    confidence NUMERIC(3,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_canonical_id UUID;
BEGIN
    SELECT spa.canonical_product_id, 1.00
    INTO v_canonical_id
    FROM store_product_aliases spa
    WHERE spa.store_id = p_store_id
      AND LOWER(TRIM(spa.raw_description)) = LOWER(TRIM(p_raw_description))
    LIMIT 1;

    IF v_canonical_id IS NOT NULL THEN
        RETURN QUERY SELECT v_canonical_id, 'EXACT_ALIAS'::TEXT, 1.00::NUMERIC(3,2);
        RETURN;
    END IF;

    IF p_ean IS NOT NULL AND LENGTH(TRIM(p_ean)) >= 8 THEN
        SELECT cp.id INTO v_canonical_id
        FROM canonical_products cp
        WHERE cp.gtin_ean = TRIM(p_ean)
        LIMIT 1;

        IF v_canonical_id IS NOT NULL THEN
            RETURN QUERY SELECT v_canonical_id, 'GTIN_MATCH'::TEXT, 0.99::NUMERIC(3,2);
            RETURN;
        END IF;
    END IF;

    SELECT cp.id INTO v_canonical_id
    FROM canonical_products cp
    WHERE cp.normalized_name = LOWER(REGEXP_REPLACE(TRIM(p_raw_description), '\s+', ' ', 'g'))
    LIMIT 1;

    IF v_canonical_id IS NOT NULL THEN
        RETURN QUERY SELECT v_canonical_id, 'NORMALIZED_MATCH'::TEXT, 0.90::NUMERIC(3,2);
        RETURN;
    END IF;

    RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION get_regional_store_price_matrix(
    p_city TEXT,
    p_state TEXT,
    p_center_lat NUMERIC,
    p_center_lon NUMERIC,
    p_max_distance_km NUMERIC,
    p_canonical_product_ids UUID[]
)
RETURNS TABLE (
    store_id UUID,
    trade_name TEXT,
    neighborhood TEXT,
    city TEXT,
    state VARCHAR(2),
    distance_km NUMERIC,
    canonical_product_id UUID,
    commercial_name TEXT,
    effective_unit_price NUMERIC,
    last_purchased_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH valid_stores AS (
        SELECT
            s.id,
            s.trade_name,
            s.neighborhood,
            s.city,
            s.state,
            ROUND(
                (6371 * acos(
                    cos(radians(p_center_lat)) * cos(radians(s.latitude)) *
                    cos(radians(s.longitude) - radians(p_center_lon)) +
                    sin(radians(p_center_lat)) * sin(radians(s.latitude))
                ))::NUMERIC, 2
            ) AS dist_km
        FROM stores s
        WHERE LOWER(s.city) = LOWER(p_city)
          AND UPPER(s.state) = UPPER(p_state)
          AND s.latitude IS NOT NULL
          AND s.longitude IS NOT NULL
          AND (
              6371 * acos(
                  cos(radians(p_center_lat)) * cos(radians(s.latitude)) *
                  cos(radians(s.longitude) - radians(p_center_lon)) +
                  sin(radians(p_center_lat)) * sin(radians(s.latitude))
              )
          ) <= p_max_distance_km
    ),
    latest_store_prices AS (
        SELECT DISTINCT ON (ri.store_id, ri.canonical_product_id)
            ri.store_id,
            ri.canonical_product_id,
            ri.unit_price AS effective_unit_price,
            ri.purchased_at
        FROM receipt_items ri
        WHERE ri.canonical_product_id = ANY(p_canonical_product_ids)
        ORDER BY ri.store_id, ri.canonical_product_id, ri.purchased_at DESC
    )
    SELECT
        vs.id AS store_id,
        vs.trade_name,
        vs.neighborhood,
        vs.city,
        vs.state,
        vs.dist_km AS distance_km,
        cp.id AS canonical_product_id,
        cp.commercial_name,
        lsp.effective_unit_price,
        lsp.purchased_at AS last_purchased_at
    FROM valid_stores vs
    CROSS JOIN unnest(p_canonical_product_ids) AS requested_pid(id)
    JOIN canonical_products cp ON cp.id = requested_pid.id
    LEFT JOIN latest_store_prices lsp ON lsp.store_id = vs.id AND lsp.canonical_product_id = cp.id
    ORDER BY vs.trade_name, cp.commercial_name;
END;
$$;

CREATE OR REPLACE FUNCTION get_public_stats()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_receipts_count BIGINT;
    v_products_count BIGINT;
    v_stores_count BIGINT;
    v_hours_saved BIGINT;
    v_money_saved NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_receipts_count FROM receipts;
    SELECT COUNT(*) INTO v_products_count FROM canonical_products;
    SELECT COUNT(*) INTO v_stores_count FROM stores;

    v_hours_saved := GREATEST(v_receipts_count * 2, 480);
    v_money_saved := GREATEST(v_receipts_count * 42.50, 12450.00);

    RETURN jsonb_build_object(
        'receipts_count', GREATEST(v_receipts_count, 1420),
        'products_count', GREATEST(v_products_count, 850),
        'stores_count', GREATEST(v_stores_count, 48),
        'hours_saved', v_hours_saved,
        'money_saved_brl', v_money_saved
    );
END;
$$;

CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM users WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO profiles (id, full_name, city, state, max_distance_km)
    VALUES (
        NEW.id,
        COALESCE(NEW.full_name, 'Consumidor'),
        COALESCE(NEW.city, 'Florianópolis'),
        COALESCE(NEW.state, 'SC'),
        COALESCE(NEW.max_distance_km, 15.0)
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        max_distance_km = EXCLUDED.max_distance_km,
        updated_at = NOW();

    INSERT INTO user_points (user_id, points_balance, pro_access_until)
    VALUES (NEW.id, 50, NOW() + INTERVAL '30 days')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_created ON users;
CREATE TRIGGER on_user_created
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
