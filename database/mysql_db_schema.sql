-- Use the database
USE nairfragrance;

-- Create roles table
CREATE TABLE IF NOT EXISTS app_roles (
    role_name VARCHAR(50) PRIMARY KEY
);

-- Insert default roles
INSERT IGNORE INTO app_roles (role_name) VALUES ('admin'), ('user');

-- Create user_roles table for admin access
CREATE TABLE IF NOT EXISTS user_roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role) REFERENCES app_roles(role_name),
    UNIQUE KEY unique_user_role (user_id, role)
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL UNIQUE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    image_url TEXT,
    images JSON,
    category_id CHAR(36),
    stock INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_product (user_id, product_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total DECIMAL(10,2) NOT NULL,
    shipping_address JSON,
    billing_address JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id CHAR(36) NOT NULL,
    product_id CHAR(36),
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- Drop existing procedures if they exist
DROP PROCEDURE IF EXISTS get_user_cart;
DROP PROCEDURE IF EXISTS get_user_orders;
DROP PROCEDURE IF EXISTS get_user_order_details;
DROP PROCEDURE IF EXISTS get_products;
DROP PROCEDURE IF EXISTS get_all_orders_admin;
DROP PROCEDURE IF EXISTS get_admin_stats;
DROP PROCEDURE IF EXISTS search_products;
DROP PROCEDURE IF EXISTS add_to_cart;
DROP PROCEDURE IF EXISTS remove_from_cart;
DROP PROCEDURE IF EXISTS update_cart_quantity;

-- Create procedures one by one (simplified to avoid syntax errors)
DELIMITER $$

-- Procedure 1: Get user's cart
CREATE PROCEDURE get_user_cart(IN p_user_id CHAR(36))
BEGIN
    SELECT 
        ci.id,
        ci.user_id,
        ci.product_id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        p.name as product_name,
        p.slug as product_slug,
        p.price as unit_price,
        p.image_url,
        p.stock as available_stock,
        (p.price * ci.quantity) as item_total,
        p.is_active as product_active
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = p_user_id
    AND p.is_active = TRUE
    ORDER BY ci.created_at DESC;
END$$

-- Procedure 2: Get user's orders
CREATE PROCEDURE get_user_orders(IN p_user_id CHAR(36))
BEGIN
    SELECT 
        o.*,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count,
        (SELECT SUM(oi.product_price * oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) as calculated_total
    FROM orders o
    WHERE o.user_id = p_user_id
    ORDER BY o.created_at DESC;
END$$

-- Procedure 3: Get order details (simplified)
CREATE PROCEDURE get_user_order_details(
    IN p_user_id CHAR(36),
    IN p_order_id CHAR(36)
)
BEGIN
    -- Check if user is admin or order belongs to user
    IF EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM orders WHERE id = p_order_id AND user_id = p_user_id
    ) THEN
        -- Get order info
        SELECT 
            o.*,
            p.full_name,
            p.email,
            p.avatar_url
        FROM orders o
        LEFT JOIN profiles p ON o.user_id = p.user_id
        WHERE o.id = p_order_id;
        
        -- Get order items
        SELECT 
            oi.*,
            prod.image_url as product_image,
            prod.slug as product_slug
        FROM order_items oi
        LEFT JOIN products prod ON oi.product_id = prod.id
        WHERE oi.order_id = p_order_id
        ORDER BY oi.created_at;
    END IF;
END$$

-- Procedure 4: Get products (with admin check)
CREATE PROCEDURE get_products(IN p_user_id CHAR(36))
BEGIN
    -- Check if user is admin
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin') THEN
        -- Admin sees all products
        SELECT 
            p.*,
            c.name as category_name,
            c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC;
    ELSE
        -- Regular users see only active products
        SELECT 
            p.*,
            c.name as category_name,
            c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = TRUE
        ORDER BY p.created_at DESC;
    END IF;
END$$

-- Procedure 5: Get all orders (admin only)
CREATE PROCEDURE get_all_orders_admin(IN p_user_id CHAR(36))
BEGIN
    -- Check if user is admin
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin') THEN
        SELECT 
            o.*,
            p.full_name,
            p.email,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count,
            (SELECT SUM(oi.product_price * oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) as calculated_total
        FROM orders o
        LEFT JOIN profiles p ON o.user_id = p.user_id
        ORDER BY o.created_at DESC;
    END IF;
END$$

-- Procedure 6: Get admin dashboard stats
CREATE PROCEDURE get_admin_stats(IN p_user_id CHAR(36))
BEGIN
    -- Check if user is admin
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin') THEN
        SELECT 
            (SELECT COUNT(*) FROM orders) as total_orders,
            (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
            (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders,
            (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'completed') as total_revenue,
            (SELECT COUNT(*) FROM products) as total_products,
            (SELECT COUNT(*) FROM products WHERE stock <= 5) as low_stock_products,
            (SELECT COUNT(*) FROM profiles) as total_customers,
            (SELECT COUNT(DISTINCT user_id) FROM cart_items) as active_carts,
            (SELECT COUNT(*) FROM categories) as total_categories;
    END IF;
END$$

-- Procedure 7: Search products (FIXED - no CASE in LIMIT)
CREATE PROCEDURE search_products(
    IN p_user_id CHAR(36),
    IN p_search_term VARCHAR(255),
    IN p_category_id CHAR(36),
    IN p_min_price DECIMAL(10,2),
    IN p_max_price DECIMAL(10,2),
    IN p_only_featured BOOLEAN,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE is_admin BOOLEAN DEFAULT FALSE;
    DECLARE final_limit INT;
    
    -- Check if user is admin
    SET is_admin = EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'admin');
    
    -- Set safe limit
    IF p_limit IS NULL THEN
        SET final_limit = 50;
    ELSEIF p_limit > 100 THEN
        SET final_limit = 100;
    ELSE
        SET final_limit = p_limit;
    END IF;
    
    IF p_offset IS NULL THEN
        SET p_offset = 0;
    END IF;
    
    SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 
        -- Active filter for non-admin users
        (is_admin = TRUE OR p.is_active = TRUE)
        -- Search term
        AND (p_search_term IS NULL OR p_search_term = '' OR 
             p.name LIKE CONCAT('%', p_search_term, '%') OR 
             p.description LIKE CONCAT('%', p_search_term, '%'))
        -- Category filter
        AND (p_category_id IS NULL OR p.category_id = p_category_id)
        -- Price range
        AND (p_min_price IS NULL OR p.price >= p_min_price)
        AND (p_max_price IS NULL OR p.price <= p_max_price)
        -- Featured filter
        AND (p_only_featured IS NULL OR p_only_featured = FALSE OR p.is_featured = TRUE)
    ORDER BY p.created_at DESC
    LIMIT final_limit
    OFFSET p_offset;
END$$

-- Procedure 8: Add item to cart
CREATE PROCEDURE add_to_cart(
    IN p_user_id CHAR(36),
    IN p_product_id CHAR(36),
    IN p_quantity INT
)
BEGIN
    DECLARE existing_id CHAR(36);
    DECLARE current_stock INT;
    
    -- Check product stock and active status
    SELECT stock INTO current_stock 
    FROM products 
    WHERE id = p_product_id AND is_active = TRUE;
    
    IF current_stock IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Product not found or not active';
    ELSEIF current_stock < p_quantity THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Insufficient stock';
    ELSE
        -- Check if item already exists in cart
        SELECT id INTO existing_id 
        FROM cart_items 
        WHERE user_id = p_user_id AND product_id = p_product_id;
        
        IF existing_id IS NOT NULL THEN
            -- Update existing item
            UPDATE cart_items 
            SET quantity = p_quantity, updated_at = CURRENT_TIMESTAMP
            WHERE id = existing_id;
        ELSE
            -- Insert new item
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES (p_user_id, p_product_id, p_quantity);
        END IF;
    END IF;
END$$

-- Procedure 9: Remove item from cart
CREATE PROCEDURE remove_from_cart(
    IN p_user_id CHAR(36),
    IN p_cart_item_id CHAR(36)
)
BEGIN
    DELETE FROM cart_items 
    WHERE id = p_cart_item_id AND user_id = p_user_id;
END$$

-- Procedure 10: Update cart quantity
CREATE PROCEDURE update_cart_quantity(
    IN p_user_id CHAR(36),
    IN p_cart_item_id CHAR(36),
    IN p_quantity INT
)
BEGIN
    DECLARE product_id_val CHAR(36);
    DECLARE current_stock INT;
    
    -- Get product ID from cart item
    SELECT product_id INTO product_id_val
    FROM cart_items 
    WHERE id = p_cart_item_id AND user_id = p_user_id;
    
    IF product_id_val IS NOT NULL THEN
        -- Check stock
        SELECT stock INTO current_stock 
        FROM products 
        WHERE id = product_id_val AND is_active = TRUE;
        
        IF current_stock < p_quantity THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Insufficient stock';
        ELSE
            UPDATE cart_items 
            SET quantity = p_quantity, updated_at = CURRENT_TIMESTAMP
            WHERE id = p_cart_item_id AND user_id = p_user_id;
        END IF;
    END IF;
END$$

DELIMITER ;

-- Create public views
DROP VIEW IF EXISTS v_public_products;
DROP VIEW IF EXISTS v_public_categories;
DROP VIEW IF EXISTS v_featured_products;
DROP VIEW IF EXISTS v_product_catalog;

CREATE VIEW v_public_products AS
SELECT 
    id, name, slug, description, price, compare_at_price,
    image_url, images, category_id, stock, is_featured,
    created_at
FROM products 
WHERE is_active = TRUE;

CREATE VIEW v_public_categories AS
SELECT * FROM categories;

CREATE VIEW v_featured_products AS
SELECT * FROM products 
WHERE is_active = TRUE AND is_featured = TRUE
ORDER BY created_at DESC;

CREATE VIEW v_product_catalog AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.compare_at_price,
    p.image_url,
    p.images,
    p.stock,
    p.is_featured,
    p.created_at,
    c.name as category_name,
    c.slug as category_slug,
    c.image_url as category_image
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = TRUE;

-- Insert sample data for testing
INSERT INTO categories (id, name, slug, description) VALUES 
(UUID(), 'Perfumes', 'perfumes', 'Luxury fragrances and perfumes'),
(UUID(), 'Essential Oils', 'essential-oils', 'Pure essential oils for aromatherapy'),
(UUID(), 'Candles', 'candles', 'Scented candles for home');

-- Insert sample products
INSERT INTO products (id, name, slug, description, price, category_id, stock, is_featured) VALUES 
(UUID(), 'Lavender Essential Oil', 'lavender-essential-oil', 'Pure lavender essential oil, 10ml', 15.99, 
 (SELECT id FROM categories WHERE slug = 'essential-oils'), 100, TRUE),
(UUID(), 'Rose Perfume', 'rose-perfume', 'Luxury rose fragrance, 50ml', 49.99, 
 (SELECT id FROM categories WHERE slug = 'perfumes'), 50, TRUE),
(UUID(), 'Sandalwood Candle', 'sandalwood-candle', 'Hand-poured sandalwood scented candle', 24.99, 
 (SELECT id FROM categories WHERE slug = 'candles'), 75, FALSE);

-- Insert sample user and admin (adjust UUIDs as needed)
INSERT INTO profiles (id, user_id, email, full_name) VALUES 
(UUID(), '11111111-1111-1111-1111-111111111111', 'user@example.com', 'John Doe'),
(UUID(), '22222222-2222-2222-2222-222222222222', 'admin@example.com', 'Admin User');

INSERT INTO user_roles (user_id, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'user'),
('22222222-2222-2222-2222-222222222222', 'admin'),
('22222222-2222-2222-2222-222222222222', 'user');