-- ==============================================================================
-- MFM PHOTOGRAPHY - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- This script sets up tables, constraints, indexes, RLS policies, and seed data.
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-running (order matters due to foreign keys)
DROP TABLE IF EXISTS project_images CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;

-- ==============================================================================
-- 2. CREATE TABLES
-- ==============================================================================

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Projects Table
-- Note: ON DELETE RESTRICT ensures category cannot be deleted if referenced by any project!
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cover_image TEXT, -- Google Drive / direct image URL
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Project Images Table
-- Note: ON DELETE CASCADE automatically deletes child images when project is deleted!
CREATE TABLE project_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- Google Drive / direct image URL
    sort_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Equipment Table (Standalone inventory)
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model TEXT,
    image_url TEXT, -- Google Drive / direct image URL
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 3. INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX idx_projects_category_id ON projects(category_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX idx_project_images_project_id ON project_images(project_id);
CREATE INDEX idx_project_images_sort_order ON project_images(sort_order ASC, created_at ASC);

CREATE INDEX idx_categories_created_at ON categories(created_at DESC);
CREATE INDEX idx_equipment_created_at ON equipment(created_at DESC);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- 4.1 Categories Policies
-- Public / Anon can only read
CREATE POLICY "Allow public read access on categories"
ON categories FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated admins can insert, update, and delete
CREATE POLICY "Allow authenticated admin insert on categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin update on categories"
ON categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin delete on categories"
ON categories FOR DELETE
TO authenticated
USING (true);

-- 4.2 Projects Policies
CREATE POLICY "Allow public read access on projects"
ON projects FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow authenticated admin insert on projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin update on projects"
ON projects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin delete on projects"
ON projects FOR DELETE
TO authenticated
USING (true);

-- 4.3 Project Images Policies
CREATE POLICY "Allow public read access on project_images"
ON project_images FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow authenticated admin insert on project_images"
ON project_images FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin update on project_images"
ON project_images FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin delete on project_images"
ON project_images FOR DELETE
TO authenticated
USING (true);

-- 4.4 Equipment Policies
CREATE POLICY "Allow public read access on equipment"
ON equipment FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow authenticated admin insert on equipment"
ON equipment FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin update on equipment"
ON equipment FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin delete on equipment"
ON equipment FOR DELETE
TO authenticated
USING (true);

-- ==============================================================================
-- 5. SEED DATA (INITIAL DEMO DATA FOR MFM)
-- ==============================================================================
DO $$
DECLARE
    cat_weddings UUID := gen_random_uuid();
    cat_portraits UUID := gen_random_uuid();
    cat_landscapes UUID := gen_random_uuid();
    cat_newborn UUID := gen_random_uuid();
    cat_architecture UUID := gen_random_uuid();
    cat_products UUID := gen_random_uuid();

    proj_weddings UUID := gen_random_uuid();
    proj_portraits UUID := gen_random_uuid();
    proj_landscapes UUID := gen_random_uuid();
    proj_newborn UUID := gen_random_uuid();
    proj_architecture UUID := gen_random_uuid();
    proj_products UUID := gen_random_uuid();
BEGIN
    -- Insert Categories
    INSERT INTO categories (id, name) VALUES
        (cat_weddings, 'Weddings'),
        (cat_portraits, 'Portraits'),
        (cat_landscapes, 'Landscapes'),
        (cat_newborn, 'Newborn'),
        (cat_architecture, 'Architecture'),
        (cat_products, 'Products');

    -- Insert Projects with high-resolution thematic images for the MFM portfolio
    INSERT INTO projects (id, name, cover_image, category_id) VALUES
        (proj_weddings, 'Eternal Vows & Grace', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85', cat_weddings),
        (proj_portraits, 'Elegance In Shadows', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85', cat_portraits),
        (proj_landscapes, 'Majestic Alpine Silence', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85', cat_landscapes),
        (proj_newborn, 'Sweet Serenity Baby', 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1200&q=85', cat_newborn),
        (proj_architecture, 'Villa Solitude Modernist', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85', cat_architecture),
        (proj_products, 'Chronograph Luxury Edition', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85', cat_products);

    -- Insert Project Gallery Images for dynamic slider/lightbox view
    INSERT INTO project_images (project_id, image_url, sort_order) VALUES
        -- Weddings gallery
        (proj_weddings, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85', 0),
        (proj_weddings, 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85', 1),
        (proj_weddings, 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85', 2),

        -- Portraits gallery
        (proj_portraits, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85', 0),
        (proj_portraits, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=85', 1),
        (proj_portraits, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85', 2),

        -- Landscapes gallery
        (proj_landscapes, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85', 0),
        (proj_landscapes, 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85', 1),
        (proj_landscapes, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=85', 2),

        -- Newborn gallery
        (proj_newborn, 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1200&q=85', 0),
        (proj_newborn, 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=85', 1),

        -- Architecture gallery
        (proj_architecture, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85', 0),
        (proj_architecture, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85', 1),

        -- Products gallery
        (proj_products, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85', 0),
        (proj_products, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85', 1);

    -- Insert Equipment (Photography Gear)
    INSERT INTO equipment (name, model, image_url) VALUES
        ('Sony Alpha 1 Mirrorless Camera', 'ILCE-1 / 50.1MP Flagship', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'),
        ('Sony FE 24-70mm f/2.8 GM II Lens', 'SEL2470GM2 Master Series', 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=800&q=80'),
        ('Canon EOS R5 Full-Frame', 'EOS R5 8K Cinema', 'https://images.unsplash.com/photo-1502982720700-bfff97f2da71?auto=format&fit=crop&w=800&q=80'),
        ('Profoto B10X Plus Studio Flash', '500Ws High Speed Sync', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80');

END $$;
