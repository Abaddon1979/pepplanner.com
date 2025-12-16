-- Pepplanner PostgreSQL Database Schema
-- Run this file to create the required tables

-- Users table (synced from Discourse SSO)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    discourse_user_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calculator settings per user
CREATE TABLE IF NOT EXISTS calculator_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    syringe_size VARCHAR(10) DEFAULT '1.0',
    peptide_amount DECIMAL(10,2) DEFAULT 5,
    water_amount DECIMAL(10,2) DEFAULT 2,
    desired_dose DECIMAL(10,2) DEFAULT 250,
    dose_unit VARCHAR(10) DEFAULT 'mcg',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Doses/Calendar entries
CREATE TABLE IF NOT EXISTS doses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    peptide VARCHAR(255) NOT NULL,
    dose VARCHAR(50) NOT NULL,
    notes TEXT,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    group_id VARCHAR(50), -- For recurring doses
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_doses_user_date ON doses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_doses_user_id ON doses(user_id);
CREATE INDEX IF NOT EXISTS idx_users_discourse_id ON users(discourse_user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calculator_settings_updated_at ON calculator_settings;
CREATE TRIGGER update_calculator_settings_updated_at
    BEFORE UPDATE ON calculator_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doses_updated_at ON doses;
CREATE TRIGGER update_doses_updated_at
    BEFORE UPDATE ON doses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
