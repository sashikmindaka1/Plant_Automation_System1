CREATE TABLE IF NOT EXISTS plant_species (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Succulents', 'Herbs', 'Indoor', 'Tropical')),
  description TEXT NOT NULL,
  min_moisture INTEGER NOT NULL,
  max_moisture INTEGER NOT NULL,
  min_light_lux INTEGER NOT NULL,
  max_light_lux INTEGER NOT NULL,
  min_temp_c REAL NOT NULL,
  max_temp_c REAL NOT NULL,
  CHECK (min_moisture <= max_moisture),
  CHECK (min_light_lux <= max_light_lux),
  CHECK (min_temp_c <= max_temp_c)
);

CREATE INDEX IF NOT EXISTS idx_plant_species_category ON plant_species(category);
CREATE INDEX IF NOT EXISTS idx_plant_species_name ON plant_species(name);

INSERT OR IGNORE INTO plant_species (
  code, name, scientific_name, category, description,
  min_moisture, max_moisture, min_light_lux, max_light_lux, min_temp_c, max_temp_c
) VALUES
  ('PLANT-001', 'Aloe Vera', 'Aloe vera', 'Succulents', 'A drought-tolerant succulent that prefers bright light and a dry-down between waterings.', 15, 35, 20000, 40000, 18, 30),
  ('PLANT-002', 'Echeveria', 'Echeveria elegans', 'Succulents', 'A compact rosette succulent that grows best in bright light and fast-draining soil.', 15, 35, 20000, 40000, 18, 29),
  ('PLANT-003', 'Jade Plant', 'Crassula ovata', 'Succulents', 'A long-lived succulent with fleshy leaves that stores water and needs infrequent watering.', 15, 35, 15000, 35000, 18, 28),
  ('PLANT-004', 'Haworthia', 'Haworthiopsis attenuata', 'Succulents', 'A small striped succulent that prefers bright indirect light and moderate warmth.', 20, 40, 8000, 20000, 18, 27),
  ('PLANT-005', 'String of Pearls', 'Curio rowleyanus', 'Succulents', 'A trailing succulent with bead-like leaves that needs excellent drainage and bright light.', 15, 30, 15000, 30000, 18, 27),
  ('PLANT-006', 'Zebra Plant', 'Haworthiopsis fasciata', 'Succulents', 'A slow-growing rosette succulent that thrives in bright indirect light.', 20, 40, 8000, 22000, 18, 28),
  ('PLANT-007', 'Panda Plant', 'Kalanchoe tomentosa', 'Succulents', 'A fuzzy-leaved succulent that prefers warm conditions, bright light, and sparse watering.', 15, 35, 15000, 35000, 18, 30),
  ('PLANT-008', 'Sweet Basil', 'Ocimum basilicum', 'Herbs', 'A fragrant culinary herb that grows quickly with warm temperatures, regular moisture, and strong light.', 40, 70, 15000, 30000, 20, 30),
  ('PLANT-009', 'Spearmint', 'Mentha spicata', 'Herbs', 'A vigorous leafy herb that prefers consistently moist soil and bright indirect light.', 50, 75, 8000, 20000, 15, 25),
  ('PLANT-010', 'Rosemary', 'Salvia rosmarinus', 'Herbs', 'A woody Mediterranean herb that needs sunny conditions and soil that dries between waterings.', 25, 45, 20000, 40000, 15, 27),
  ('PLANT-011', 'Parsley', 'Petroselinum crispum', 'Herbs', 'A leafy kitchen herb that prefers evenly moist soil and moderate to bright light.', 45, 70, 8000, 20000, 15, 24),
  ('PLANT-012', 'Thyme', 'Thymus vulgaris', 'Herbs', 'A compact aromatic herb adapted to sunny sites and relatively dry, well-drained soil.', 25, 45, 15000, 35000, 15, 26),
  ('PLANT-013', 'Cilantro', 'Coriandrum sativum', 'Herbs', 'A cool-season herb that grows best with steady moisture and good light without excessive heat.', 40, 65, 8000, 20000, 15, 24),
  ('PLANT-014', 'Oregano', 'Origanum vulgare', 'Herbs', 'A hardy culinary herb that tolerates drier soil and benefits from bright light.', 30, 55, 12000, 30000, 15, 27),
  ('PLANT-015', 'Snake Plant', 'Dracaena trifasciata', 'Indoor', 'A resilient indoor plant that tolerates lower light and should dry between waterings.', 20, 40, 1000, 10000, 18, 30),
  ('PLANT-016', 'Golden Pothos', 'Epipremnum aureum', 'Indoor', 'A trailing foliage plant that adapts to many indoor conditions and prefers moderate moisture.', 35, 65, 1000, 10000, 18, 29),
  ('PLANT-017', 'Monstera', 'Monstera deliciosa', 'Indoor', 'A tropical climbing houseplant that prefers bright indirect light and evenly moist soil.', 45, 70, 5000, 20000, 18, 30),
  ('PLANT-018', 'Peace Lily', 'Spathiphyllum wallisii', 'Indoor', 'A shade-tolerant flowering houseplant that prefers consistently moist soil and indirect light.', 50, 75, 1000, 8000, 18, 27),
  ('PLANT-019', 'Spider Plant', 'Chlorophytum comosum', 'Indoor', 'An adaptable houseplant with arching leaves that grows well in bright indirect light.', 40, 65, 3000, 15000, 16, 27),
  ('PLANT-020', 'Rubber Plant', 'Ficus elastica', 'Indoor', 'A glossy-leaved houseplant that prefers bright indirect light and moderate watering.', 35, 60, 3000, 15000, 18, 29),
  ('PLANT-021', 'ZZ Plant', 'Zamioculcas zamiifolia', 'Indoor', 'A drought-tolerant indoor plant with glossy leaves that thrives with infrequent watering.', 20, 40, 500, 8000, 18, 30),
  ('PLANT-022', 'Fiddle-leaf Fig', 'Ficus lyrata', 'Indoor', 'A large-leaved indoor tree that prefers stable warmth, bright indirect light, and regular moisture.', 40, 65, 5000, 20000, 18, 29),
  ('PLANT-023', 'Bird of Paradise', 'Strelitzia reginae', 'Tropical', 'A bold tropical plant that needs warmth, bright light, and regular moisture during active growth.', 45, 70, 10000, 30000, 18, 30),
  ('PLANT-024', 'Calathea', 'Goeppertia orbifolia', 'Tropical', 'A tropical foliage plant that prefers high humidity, indirect light, and evenly moist soil.', 55, 80, 2000, 10000, 18, 27),
  ('PLANT-025', 'Anthurium', 'Anthurium andraeanum', 'Tropical', 'A tropical flowering plant that thrives in warmth, humid air, and bright filtered light.', 50, 75, 5000, 15000, 18, 28),
  ('PLANT-026', 'Phalaenopsis Orchid', 'Phalaenopsis amabilis', 'Tropical', 'An epiphytic orchid that prefers filtered light, warm temperatures, and airy roots.', 40, 65, 6000, 12000, 18, 29),
  ('PLANT-027', 'Bromeliad', 'Guzmania lingulata', 'Tropical', 'A colorful tropical plant that grows in warm, humid conditions with filtered light.', 50, 75, 4000, 12000, 18, 28),
  ('PLANT-028', 'Croton', 'Codiaeum variegatum', 'Tropical', 'A colorful tropical shrub that maintains vivid foliage with warmth, humidity, and bright light.', 45, 70, 10000, 25000, 20, 30),
  ('PLANT-029', 'Hibiscus', 'Hibiscus rosa-sinensis', 'Tropical', 'A flowering tropical shrub that needs warmth, strong light, and regular moisture for blooming.', 45, 70, 15000, 30000, 18, 30),
  ('PLANT-030', 'Alocasia', 'Alocasia macrorrhizos', 'Tropical', 'A tropical foliage plant that grows best in warmth, humidity, and consistently moist but aerated soil.', 50, 75, 5000, 18000, 20, 30);
