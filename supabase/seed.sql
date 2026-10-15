INSERT INTO stores (id, cnpj, trade_name, legal_name, neighborhood, city, state, latitude, longitude)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '09313769000101', 'Fort Atacadista', 'Comper Atacado S/A', 'SC-401 (Santo Antônio)', 'Florianópolis', 'SC', -27.502800, -48.514200),
    ('a0000000-0000-0000-0000-000000000002', '83250364001490', 'Giassi Supermercados', 'Giassi & Cia Ltda', 'Santa Mônica', 'Florianópolis', 'SC', -27.592500, -48.516500),
    ('a0000000-0000-0000-0000-000000000003', '83568278002277', 'Bistek Supermercados', 'Bistek Alimentos Ltda', 'Costeira do Pirajubaé', 'Florianópolis', 'SC', -27.632100, -48.528000),
    ('a0000000-0000-0000-0000-000000000004', '83916147000801', 'Supermercados Imperatriz', 'Comercial de Alimentos Imperatriz Ltda', 'Córrego Grande', 'Florianópolis', 'SC', -27.598200, -48.508500),
    ('a0000000-0000-0000-0000-000000000005', '02831356003310', 'Super Koch', 'Super Koch Hipermercados S/A', 'Centro', 'Florianópolis', 'SC', -27.596000, -48.549000),
    ('a0000000-0000-0000-0000-000000000006', '83646984001180', 'Angeloni Supermercados', 'A. Angeloni & Cia Ltda', 'Beira-Mar Norte', 'Florianópolis', 'SC', -27.584100, -48.541200)
ON CONFLICT (cnpj) DO NOTHING;

INSERT INTO canonical_products (id, ean, commercial_name, brand_name, category, base_unit, net_measure)
VALUES
    ('b0000000-0000-0000-0000-000000000001', '7896006711124', 'Arroz Branco Tipo 1 Camil 5kg', 'Camil', 'Mercearia', 'KG', 5.0000),
    ('b0000000-0000-0000-0000-000000000002', '7896452100015', 'Feijão Preto Tipo 1 Kicaldo 1kg', 'Kicaldo', 'Mercearia', 'KG', 1.0000),
    ('b0000000-0000-0000-0000-000000000003', '7896051111018', 'Leite UHT Integral Tirol 1L', 'Tirol', 'Laticínios', 'L', 1.0000),
    ('b0000000-0000-0000-0000-000000000004', NULL, 'Banana Prata Granel (Kg)', NULL, 'Hortifrúti', 'KG', 1.0000),
    ('b0000000-0000-0000-0000-000000000005', '7891022100115', 'Detergente Líquido Neutro Ypê 500ml', 'Ypê', 'Limpeza', 'L', 0.5000),
    ('b0000000-0000-0000-0000-000000000006', '7891095000014', 'Café Torrado e Moído Tradicional Pilão 500g', 'Pilão', 'Mercearia', 'KG', 0.5000),
    ('b0000000-0000-0000-0000-000000000007', '7896036090017', 'Óleo de Soja Refinado Liza 900ml', 'Liza', 'Mercearia', 'L', 0.9000),
    ('b0000000-0000-0000-0000-000000000008', '7891910000112', 'Açúcar Refinado Especial União 1kg', 'União', 'Mercearia', 'KG', 1.0000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO store_product_aliases (store_id, canonical_product_id, raw_store_code, raw_description, confidence_score, is_manually_verified)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '1001', 'ARROZ BCO CAMIL 5KG', 1.0, true),
    ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '2001', 'ARR T1 CAMIL 5K FD', 1.0, true),
    ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', '3001', 'ARROZ CAMIL POLIDO 5KG', 1.0, true),
    ('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', '4001', 'ARROZ BRANCO CAMIL 5KG T1', 1.0, true),
    ('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', '5001', 'ARR BCO T1 CAMIL 5K', 1.0, true),
    ('a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', '6001', 'ARROZ BRANCO CAMIL T1 5KG', 1.0, true)
ON CONFLICT (store_id, raw_store_code, raw_description) DO NOTHING;

INSERT INTO baskets (id, user_id, name, target_month)
SELECT
    'c0000000-0000-0000-0000-000000000001',
    u.id,
    'Cesta Despensa Familiar Padrão (Florianópolis)',
    DATE_TRUNC('month', NOW() + INTERVAL '1 month')::DATE
FROM auth.users u
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO basket_items (basket_id, canonical_product_id, quantity, reference_unit_price, reference_store_id)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 2, 27.90, 'a0000000-0000-0000-0000-000000000001'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 3, 7.89, 'a0000000-0000-0000-0000-000000000001'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 12, 4.49, 'a0000000-0000-0000-0000-000000000001'),
    ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 3.0, 5.89, 'a0000000-0000-0000-0000-000000000001'),
    ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 4, 2.49, 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
