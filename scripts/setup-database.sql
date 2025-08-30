-- =====================================================
-- PostgreSQL Database Setup for Rasa Next Project
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if not exists (run this as superuser)
-- CREATE DATABASE rasa_next_db;

-- Connect to the database
-- \c rasa_next_db;

-- =====================================================
-- Create Tables
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ROOT', 'MANAGER', 'OPERATOR', 'SUPERVISOR')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tanks table
CREATE TABLE IF NOT EXISTS tanks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('FUEL', 'WATER')),
    capacity INTEGER NOT NULL,
    current_level DECIMAL(5,2) NOT NULL DEFAULT 0,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES users(id),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generators table
CREATE TABLE IF NOT EXISTS generators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 900,
    current_level DECIMAL(5,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE')),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES users(id),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    priority VARCHAR(50) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    checklist JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('LOW_FUEL', 'LOW_WATER', 'MAINTENANCE', 'SYSTEM')),
    message TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    tank_id UUID REFERENCES tanks(id),
    generator_id UUID REFERENCES generators(id),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historical data table for tracking changes
CREATE TABLE IF NOT EXISTS historical_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('TANK', 'GENERATOR')),
    entity_id UUID NOT NULL,
    level_value DECIMAL(5,2) NOT NULL,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tanks_type ON tanks(type);
CREATE INDEX IF NOT EXISTS idx_tanks_active ON tanks(is_active);
CREATE INDEX IF NOT EXISTS idx_tanks_updated_by ON tanks(updated_by);
CREATE INDEX IF NOT EXISTS idx_tanks_location ON tanks(location);

CREATE INDEX IF NOT EXISTS idx_generators_status ON generators(status);
CREATE INDEX IF NOT EXISTS idx_generators_active ON generators(is_active);
CREATE INDEX IF NOT EXISTS idx_generators_updated_by ON generators(updated_by);
CREATE INDEX IF NOT EXISTS idx_generators_location ON generators(location);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_tank_id ON alerts(tank_id);
CREATE INDEX IF NOT EXISTS idx_alerts_generator_id ON alerts(generator_id);

CREATE INDEX IF NOT EXISTS idx_historical_data_entity ON historical_data(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_historical_data_date ON historical_data(created_at);
CREATE INDEX IF NOT EXISTS idx_historical_data_recorded_by ON historical_data(recorded_by);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- =====================================================
-- Create Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tasks table
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Insert Initial Data
-- =====================================================

-- Insert root user (password: rootpass123)
INSERT INTO users (id, email, password, name, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'root@system.com', '$2b$10$rQZ8kHWKQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXy', 'Root Administrator', 'ROOT')
ON CONFLICT (id) DO NOTHING;

-- Insert default users
INSERT INTO users (id, email, password, name, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'manager@company.com', '$2b$10$rQZ8kHWKQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXy', 'حسین کارجو', 'MANAGER'),
('22222222-2222-2222-2222-222222222222', 'operator1@company.com', '$2b$10$rQZ8kHWKQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXy', 'محمد بیننده', 'OPERATOR'),
('33333333-3333-3333-3333-333333333333', 'operator2@company.com', '$2b$10$rQZ8kHWKQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXy', 'سید محمد طاهری', 'OPERATOR'),
('44444444-4444-4444-4444-444444444444', 'supervisor@company.com', '$2b$10$rQZ8kHWKQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXyZOQYXyZOQYXy', 'علی رضایی', 'SUPERVISOR')
ON CONFLICT (id) DO NOTHING;

-- Insert fuel tanks
INSERT INTO tanks (id, name, type, capacity, current_level, location, updated_by) VALUES 
('tank-fuel-1', 'مخزن سوخت ۱', 'FUEL', 5000, 75.5, 'ساختمان اصلی', '00000000-0000-0000-0000-000000000001'),
('tank-fuel-2', 'مخزن سوخت ۲', 'FUEL', 5000, 45.2, 'ساختمان فرعی', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert water tanks
INSERT INTO tanks (id, name, type, capacity, current_level, location, updated_by) VALUES 
('tank-water-1', 'مخزن آب اصلی', 'WATER', 20000, 85.0, 'پشت بام', '00000000-0000-0000-0000-000000000001'),
('tank-water-2', 'مخزن آب فرعی', 'WATER', 10000, 60.5, 'حیاط', '00000000-0000-0000-0000-000000000001'),
('tank-water-3', 'مخزن آب اضطراری', 'WATER', 5000, 90.0, 'زیرزمین', '00000000-0000-0000-0000-000000000001'),
('tank-water-4', 'مخزن آب کوچک', 'WATER', 2000, 25.0, 'انبار', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert generators
INSERT INTO generators (id, name, capacity, current_level, status, location, updated_by) VALUES 
('gen-1', 'ژنراتور ۱', 900, 80.0, 'ONLINE', 'اتاق ژنراتور ۱', '00000000-0000-0000-0000-000000000001'),
('gen-2', 'ژنراتور ۲', 900, 65.5, 'ONLINE', 'اتاق ژنراتور ۲', '00000000-0000-0000-0000-000000000001'),
('gen-3', 'ژنراتور ۳', 900, 40.0, 'OFFLINE', 'اتاق ژنراتور ۳', '00000000-0000-0000-0000-000000000001'),
('gen-4', 'ژنراتور ۴', 900, 15.0, 'MAINTENANCE', 'اتاق ژنراتور ۴', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (id, title, description, assigned_to, assigned_by, status, priority, due_date, checklist) VALUES 
('task-1', 'بررسی سطح مخازن سوخت', 'بررسی روزانه سطح تمام مخازن سوخت و ثبت اطلاعات', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'PENDING', 'HIGH', NOW() + INTERVAL '1 day', 
'[{"id": "check-1", "text": "بررسی مخزن سوخت ۱", "completed": false}, {"id": "check-2", "text": "بررسی مخزن سوخت ۲", "completed": false}, {"id": "check-3", "text": "ثبت اطلاعات در سیستم", "completed": false}]'),
('task-2', 'تعمیر ژنراتور ۴', 'انجام تعمیرات لازم برای ژنراتور شماره ۴', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'IN_PROGRESS', 'CRITICAL', NOW() + INTERVAL '2 days',
'[{"id": "check-1", "text": "بررسی سیستم سوخت‌رسانی", "completed": true}, {"id": "check-2", "text": "تعویض فیلتر", "completed": false}, {"id": "check-3", "text": "تست عملکرد", "completed": false}]')
ON CONFLICT (id) DO NOTHING;

-- Insert sample alerts
INSERT INTO alerts (id, type, message, severity, tank_id, generator_id, acknowledged) VALUES 
('alert-1', 'LOW_WATER', 'سطح آب مخزن کوچک کمتر از ۳۰٪ است', 'HIGH', 'tank-water-4', NULL, false),
('alert-2', 'LOW_FUEL', 'سطح سوخت ژنراتور ۴ بحرانی است', 'CRITICAL', NULL, 'gen-4', false),
('alert-3', 'MAINTENANCE', 'ژنراتور ۴ نیاز به تعمیر دارد', 'HIGH', NULL, 'gen-4', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample historical data (last 7 days)
INSERT INTO historical_data (entity_type, entity_id, level_value, recorded_by, created_at) 
SELECT 
    'TANK',
    'tank-fuel-1',
    75.5 + (random() * 10 - 5), -- Random variation
    '22222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '1 day' * generate_series(0, 6)
FROM generate_series(0, 6);

INSERT INTO historical_data (entity_type, entity_id, level_value, recorded_by, created_at) 
SELECT 
    'GENERATOR',
    'gen-1',
    80.0 + (random() * 8 - 4), -- Random variation
    '22222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '1 day' * generate_series(0, 6)
FROM generate_series(0, 6);

-- =====================================================
-- Grant Permissions (if using separate user)
-- =====================================================

-- Uncomment and modify if you want to use a separate database user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if tables were created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check if data was inserted
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Tanks', COUNT(*) FROM tanks
UNION ALL
SELECT 'Generators', COUNT(*) FROM generators
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'Alerts', COUNT(*) FROM alerts
UNION ALL
SELECT 'Historical Data', COUNT(*) FROM historical_data
UNION ALL
SELECT 'Activity Logs', COUNT(*) FROM activity_logs;

-- Check sample data
SELECT 'Sample Users' as info, name, role FROM users LIMIT 3;
SELECT 'Sample Tanks' as info, name, type, current_level FROM tanks LIMIT 3;
SELECT 'Sample Generators' as info, name, status, current_level FROM generators LIMIT 3;

