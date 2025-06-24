-- V10__create_disc_master_table.sql
-- Description: Create DiscMaster table for disc catalog

CREATE TABLE disc_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    speed INT NOT NULL,
    glide INT NOT NULL,
    turn INT NOT NULL,
    fade INT NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    added_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disc_master_brand_model ON disc_master(brand, model);
CREATE INDEX idx_disc_master_approved ON disc_master(approved);