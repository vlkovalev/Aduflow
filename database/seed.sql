INSERT INTO models (id, model_name, model_code, square_feet, base_price, region, sort_order)
VALUES
 ('00000000-0000-0000-0000-000000000101', 'Backyard Studio 312', 'studio-312', 312, 72000, 'North America', 1),
 ('00000000-0000-0000-0000-000000000102', 'Garden Suite 624', 'suite-624', 624, 154000, 'North America', 2),
 ('00000000-0000-0000-0000-000000000103', 'Two-Bed ADU 816', 'adu-816', 816, 196000, 'North America', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO options (id, option_name, option_value, option_detail, option_category, option_price, sort_order)
VALUES
 ('00000000-0000-0000-0000-000000000201', 'Essential', 'essential', 'Durable rental-ready finish', 'finish', 0, 1),
 ('00000000-0000-0000-0000-000000000202', 'Comfort', 'comfort', 'Upgraded kitchen and bath package', 'finish', 18500, 2),
 ('00000000-0000-0000-0000-000000000203', 'Premium', 'premium', 'Higher-end millwork and fixtures', 'finish', 34500, 3),
 ('00000000-0000-0000-0000-000000000204', 'Slab', 'slab', 'Simple prepared urban site', 'foundation', 22000, 1),
 ('00000000-0000-0000-0000-000000000205', 'Helical piles', 'helical', 'Lower disturbance backyard install', 'foundation', 28500, 2),
 ('00000000-0000-0000-0000-000000000206', 'Crawlspace', 'crawl', 'Best for servicing and cold climates', 'foundation', 42000, 3),
 ('00000000-0000-0000-0000-000000000207', 'Basic tie-in', 'basic', 'Short utility run allowance', 'utilities', 14500, 1),
 ('00000000-0000-0000-0000-000000000208', 'Standard tie-in', 'standard', 'Typical water, sewer, power scope', 'utilities', 26500, 2),
 ('00000000-0000-0000-0000-000000000209', 'Complex tie-in', 'complex', 'Long run or panel upgrade allowance', 'utilities', 48500, 3),
 ('00000000-0000-0000-0000-000000000210', 'Urban lot', 'urban', 'Lane or driveway access', 'site', 8500, 1),
 ('00000000-0000-0000-0000-000000000211', 'Tight access', 'tight', 'Crane planning or smaller modules', 'site', 18500, 2),
 ('00000000-0000-0000-0000-000000000212', 'Rural lot', 'rural', 'Delivery distance and site prep allowance', 'site', 24500, 3)
ON CONFLICT (id) DO NOTHING;
