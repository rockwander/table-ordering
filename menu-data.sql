-- Insert Categories
INSERT INTO categories (name, description, display_order, is_active) VALUES
  ('Classic Thin Roast Dosas', 'Classic thin roast dosas - smaller size than regular dosas', 0, true),
  ('Combos', 'Value combo meals', 1, true),
  ('Tiffin @ Ramani''s', 'Traditional South Indian breakfast items', 2, true),
  ('Starters - Idly Fry', 'Crispy idly starters with various flavors', 3, true),
  ('Sweets and Beverages', 'Desserts and drinks', 4, true),
  ('Signature Pan Roast Dosas', 'Signature pan roasted dosas - regular size', 5, true),
  ('Signature Pan Uttappams', 'Thick pan-cooked uttappams', 6, true);

-- Insert Menu Items - Classic Thin Roast Dosas
INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Vadacurry Masala Dosai', 'Classic thin roast dosa with vadacurry masala', 90.00, true, true, 0
FROM categories c WHERE c.name = 'Classic Thin Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Chettinad Gobi Masala Dosai', 'Classic thin roast dosa with Chettinad gobi masala', 90.00, true, true, 1
FROM categories c WHERE c.name = 'Classic Thin Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Chettinad Paneer Masala Dosai', 'Classic thin roast dosa with Chettinad paneer masala', 100.00, true, true, 2
FROM categories c WHERE c.name = 'Classic Thin Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Masala Dosai', 'Classic thin roast masala dosa', 75.00, true, true, 3
FROM categories c WHERE c.name = 'Classic Thin Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Chettinad Paneer Masala (Ghee)', 'Classic thin roast dosa with Chettinad paneer masala and ghee', 120.00, true, true, 4
FROM categories c WHERE c.name = 'Classic Thin Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Vadacurry Masala (Ghee)', 'Classic thin roast dosa with vadacurry masala and ghee', 110.00, true, true, 5
FROM categories c WHERE c.name = 'Classic Thin Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Chettinad Gobi Masala (Ghee)', 'Classic thin roast dosa with Chettinad gobi masala and ghee', 110.00, true, true, 6
FROM categories c WHERE c.name = 'Classic Thin Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Ghee Roast', 'Classic thin roast dosa with ghee', 80.00, true, true, 7
FROM categories c WHERE c.name = 'Classic Thin Roast Dosas';

-- Combos
INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, '2 x Classic Thin Roast Dosas', 'Combo of 2 classic thin roast dosas', 169.00, true, true, 0
FROM categories c WHERE c.name = 'Combos';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, '6 x Classic Thin Roast Dosas', 'Combo of 6 classic thin roast dosas', 499.00, true, true, 1
FROM categories c WHERE c.name = 'Combos';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Grand Chola Combo', '2 Classic Thin Roast Dosai, 1 Kanchipuram/Vadacurry Idly, 1 Medhu Vada, Kumbakonam Filter Coffee, Sweet', 349.00, true, true, 2
FROM categories c WHERE c.name = 'Combos';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Sweet + Coffee Combo', 'Sweet and coffee combo', 99.00, true, true, 3
FROM categories c WHERE c.name = 'Combos';

-- Tiffin @ Ramani's
INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Kanchipuram Idly - 2', 'Pair of Kanchipuram idlies', 100.00, true, true, 0
FROM categories c WHERE c.name = 'Tiffin @ Ramani''s';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Idly Vadacurry - 2', 'Pair of idlies with vadacurry', 100.00, true, true, 1
FROM categories c WHERE c.name = 'Tiffin @ Ramani''s';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Sponge Dosai Vadacurry - 2', 'Pair of sponge dosas with vadacurry', 120.00, true, true, 2
FROM categories c WHERE c.name = 'Tiffin @ Ramani''s';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Medhu Vada - 2', 'Pair of crispy medhu vadas', 80.00, true, true, 3
FROM categories c WHERE c.name = 'Tiffin @ Ramani''s';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Masala Vada - 2', 'Pair of masala vadas', 80.00, true, true, 4
FROM categories c WHERE c.name = 'Tiffin @ Ramani''s';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Ghee Sambhar Vada - 2', 'Pair of vadas in ghee sambhar', 100.00, true, true, 5
FROM categories c WHERE c.name = 'Tiffin @ Ramani''s';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Dahi Vada - 2', 'Pair of dahi vadas', 110.00, true, true, 6
FROM categories c WHERE c.name = 'Tiffin @ Ramani''s';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Idly - 2', 'Pair of steamed idlies', 70.00, true, true, 7
FROM categories c WHERE c.name = 'Tiffin @ Ramani''s';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Ghee Sambhar Idly', 'Idlies in ghee sambhar', 100.00, true, true, 8
FROM categories c WHERE c.name = 'Tiffin @ Ramani''s';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Kara Appam - 5', '5 pieces of kara appam', 120.00, true, true, 9
FROM categories c WHERE c.name = 'Tiffin @ Ramani''s';

-- Starters - Idly Fry
INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Special Podi', 'Idly fry with special podi', 100.00, true, true, 0
FROM categories c WHERE c.name = 'Starters - Idly Fry';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Peri Peri', 'Idly fry with peri peri seasoning', 100.00, true, true, 1
FROM categories c WHERE c.name = 'Starters - Idly Fry';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Chilli Garlic Manchurian', 'Idly fry Manchurian style with chilli garlic', 120.00, true, true, 2
FROM categories c WHERE c.name = 'Starters - Idly Fry';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Dahi Chat', 'Idly fry dahi chat', 120.00, true, true, 3
FROM categories c WHERE c.name = 'Starters - Idly Fry';

-- Sweets and Beverages
INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Kumbakonam Filter Coffee (Regular)', 'Traditional South Indian filter coffee', 35.00, true, true, 0
FROM categories c WHERE c.name = 'Sweets and Beverages';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Kumbakonam Filter Coffee (Large)', 'Traditional South Indian filter coffee - Large', 50.00, true, true, 1
FROM categories c WHERE c.name = 'Sweets and Beverages';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Payasam', 'Traditional South Indian sweet dessert', 90.00, true, true, 2
FROM categories c WHERE c.name = 'Sweets and Beverages';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Chakkara/Sweet Pongal', 'Sweet pongal', 90.00, true, true, 3
FROM categories c WHERE c.name = 'Sweets and Beverages';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Special Seasonal Halwa', 'Seasonal halwa variety', 80.00, true, true, 4
FROM categories c WHERE c.name = 'Sweets and Beverages';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Cold Coffee Shake', 'Thick cold coffee shake', 140.00, true, true, 5
FROM categories c WHERE c.name = 'Sweets and Beverages';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Gulkand Rose Shake', 'Thick gulkand rose shake', 140.00, true, true, 6
FROM categories c WHERE c.name = 'Sweets and Beverages';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Coconut Shake', 'Thick coconut shake', 140.00, true, true, 7
FROM categories c WHERE c.name = 'Sweets and Beverages';

-- Signature Pan Roast Dosas
INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Mysore Masala Dosai (Ghee)', 'Signature pan roast Mysore masala dosa with ghee', 145.00, true, true, 0
FROM categories c WHERE c.name = 'Signature Pan Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Mysore Dosai (Ghee)', 'Signature pan roast Mysore dosa with ghee', 120.00, true, true, 1
FROM categories c WHERE c.name = 'Signature Pan Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Podi Masala Dosai (Ghee)', 'Signature pan roast podi masala dosa with ghee', 145.00, true, true, 2
FROM categories c WHERE c.name = 'Signature Pan Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Ghee Roast', 'Signature pan roast dosa with ghee', 110.00, true, true, 3
FROM categories c WHERE c.name = 'Signature Pan Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Chettinad Paneer Masala (Ghee)', 'Signature pan roast with Chettinad paneer masala and ghee', 160.00, true, true, 4
FROM categories c WHERE c.name = 'Signature Pan Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Ghee Vadacurry Masala (Ghee)', 'Signature pan roast with vadacurry masala and ghee', 145.00, true, true, 5
FROM categories c WHERE c.name = 'Signature Pan Roast Dosas';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Chettinad Gobi Masala (Ghee)', 'Signature pan roast with Chettinad gobi masala and ghee', 145.00, true, true, 6
FROM categories c WHERE c.name = 'Signature Pan Roast Dosas';

-- Signature Pan Uttappams
INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Onion Uttappam', 'Signature pan uttappam with onions', 130.00, true, true, 0
FROM categories c WHERE c.name = 'Signature Pan Uttappams';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Mix Veg Uttappam', 'Signature pan uttappam with mixed vegetables', 140.00, true, true, 1
FROM categories c WHERE c.name = 'Signature Pan Uttappams';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Tomato Uttappam', 'Signature pan uttappam with tomatoes', 130.00, true, true, 2
FROM categories c WHERE c.name = 'Signature Pan Uttappams';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Podi Uttappam', 'Signature pan uttappam with podi', 130.00, true, true, 3
FROM categories c WHERE c.name = 'Signature Pan Uttappams';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Cheese Uttappam', 'Signature pan uttappam with cheese', 150.00, true, true, 4
FROM categories c WHERE c.name = 'Signature Pan Uttappams';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Schezwan Uttappam', 'Signature pan uttappam with schezwan sauce', 150.00, true, true, 5
FROM categories c WHERE c.name = 'Signature Pan Uttappams';

INSERT INTO menu_items (category_id, name, description, price, is_available, is_vegetarian, display_order)
SELECT c.id, 'Paneer Uttappam', 'Signature pan uttappam with paneer', 160.00, true, true, 6
FROM categories c WHERE c.name = 'Signature Pan Uttappams';
