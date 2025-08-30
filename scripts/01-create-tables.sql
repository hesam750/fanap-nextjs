-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
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
CREATE TABLE tanks (
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
CREATE TABLE generators (
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
CREATE TABLE tasks (
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
CREATE TABLE alerts (
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
CREATE TABLE historical_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('TANK', 'GENERATOR')),
    entity_id UUID NOT NULL,
    level_value DECIMAL(5,2) NOT NULL,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tanks_type ON tanks(type);
CREATE INDEX idx_tanks_active ON tanks(is_active);
CREATE INDEX idx_generators_status ON generators(status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_historical_data_entity ON historical_data(entity_type, entity_id);
CREATE INDEX idx_historical_data_date ON historical_data(created_at);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_date ON activity_logs(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for different user roles
-- Root users can access everything
CREATE POLICY "Root users can do everything" ON users FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ROOT')
);

CREATE POLICY "Root users can manage tanks" ON tanks FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ROOT')
);

CREATE POLICY "Root users can manage generators" ON generators FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ROOT')
);

-- Managers can access most data
CREATE POLICY "Managers can view users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('MANAGER', 'ROOT'))
);

CREATE POLICY "All authenticated users can view tanks" ON tanks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Operators and managers can update tanks" ON tanks FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('OPERATOR', 'MANAGER', 'ROOT'))
);

CREATE POLICY "All authenticated users can view generators" ON generators FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Operators and managers can update generators" ON generators FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('OPERATOR', 'MANAGER', 'ROOT'))
);

-- Task policies
CREATE POLICY "Users can view their assigned tasks" ON tasks FOR SELECT USING (
    assigned_to = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('MANAGER', 'SUPERVISOR', 'ROOT'))
);

CREATE POLICY "Managers can create tasks" ON tasks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('MANAGER', 'ROOT'))
);

CREATE POLICY "Users can update their tasks" ON tasks FOR UPDATE USING (
    assigned_to = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('MANAGER', 'ROOT'))
);

-- Alert policies
CREATE POLICY "All authenticated users can view alerts" ON alerts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can create alerts" ON alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can acknowledge alerts" ON alerts FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Historical data policies
CREATE POLICY "All authenticated users can view historical data" ON historical_data FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert historical data" ON historical_data FOR INSERT WITH CHECK (true);

-- Activity logs policies
CREATE POLICY "All authenticated users can view activity logs" ON activity_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert activity logs" ON activity_logs FOR INSERT WITH CHECK (true);
