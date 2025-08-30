-- Insert root user (password: rootpass123)
INSERT INTO users (id, email, password, name, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'root@system.com', '$2b$10$rQZ8kHWKQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXy', 'Root Administrator', 'ROOT');

-- Insert default users
INSERT INTO users (id, email, password, name, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'manager@company.com', '$2b$10$rQZ8kHWKQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXy', 'حسین کارجو', 'MANAGER'),
('22222222-2222-2222-2222-222222222222', 'operator1@company.com', '$2b$10$rQZ8kHWKQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXy', 'محمد بیننده', 'OPERATOR'),
('33333333-3333-3333-3333-333333333333', 'operator2@company.com', '$2b$10$rQZ8kHWKQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXy', 'سید محمد طاهری', 'OPERATOR'),
('44444444-4444-4444-4444-444444444444', 'supervisor@company.com', '$2b$10$rQZ8kHWKQYXyZxY5QYXyZOQYXyZxY5QYXyZOQYXyZOQYXyZOQYXy', 'علی رضایی', 'SUPERVISOR');

-- Insert fuel tanks
INSERT INTO tanks (id, name, type, capacity, current_level, location, updated_by) VALUES 
('tank-fuel-1', 'مخزن سوخت ۱', 'FUEL', 5000, 75.5, 'ساختمان اصلی', '00000000-0000-0000-0000-000000000001'),
('tank-fuel-2', 'مخزن سوخت ۲', 'FUEL', 5000, 45.2, 'ساختمان فرعی', '00000000-0000-0000-0000-000000000001');

-- Insert water tanks
INSERT INTO tanks (id, name, type, capacity, current_level, location, updated_by) VALUES 
('tank-water-1', 'مخزن آب اصلی', 'WATER', 20000, 85.0, 'پشت بام', '00000000-0000-0000-0000-000000000001'),
('tank-water-2', 'مخزن آب فرعی', 'WATER', 10000, 60.5, 'حیاط', '00000000-0000-0000-0000-000000000001'),
('tank-water-3', 'مخزن آب اضطراری', 'WATER', 5000, 90.0, 'زیرزمین', '00000000-0000-0000-0000-000000000001'),
('tank-water-4', 'مخزن آب کوچک', 'WATER', 2000, 25.0, 'انبار', '00000000-0000-0000-0000-000000000001');

-- Insert generators
INSERT INTO generators (id, name, capacity, current_level, status, location, updated_by) VALUES 
('gen-1', 'ژنراتور ۱', 900, 80.0, 'ONLINE', 'اتاق ژنراتور ۱', '00000000-0000-0000-0000-000000000001'),
('gen-2', 'ژنراتور ۲', 900, 65.5, 'ONLINE', 'اتاق ژنراتور ۲', '00000000-0000-0000-0000-000000000001'),
('gen-3', 'ژنراتور ۳', 900, 40.0, 'OFFLINE', 'اتاق ژنراتور ۳', '00000000-0000-0000-0000-000000000001'),
('gen-4', 'ژنراتور ۴', 900, 15.0, 'MAINTENANCE', 'اتاق ژنراتور ۴', '00000000-0000-0000-0000-000000000001');

-- Insert sample tasks
INSERT INTO tasks (id, title, description, assigned_to, assigned_by, status, priority, due_date, checklist) VALUES 
('task-1', 'بررسی سطح مخازن سوخت', 'بررسی روزانه سطح تمام مخازن سوخت و ثبت اطلاعات', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'PENDING', 'HIGH', NOW() + INTERVAL '1 day', 
'[{"id": "check-1", "text": "بررسی مخزن سوخت ۱", "completed": false}, {"id": "check-2", "text": "بررسی مخزن سوخت ۲", "completed": false}, {"id": "check-3", "text": "ثبت اطلاعات در سیستم", "completed": false}]'),
('task-2', 'تعمیر ژنراتور ۴', 'انجام تعمیرات لازم برای ژنراتور شماره ۴', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'IN_PROGRESS', 'CRITICAL', NOW() + INTERVAL '2 days',
'[{"id": "check-1", "text": "بررسی سیستم سوخت‌رسانی", "completed": true}, {"id": "check-2", "text": "تعویض فیلتر", "completed": false}, {"id": "check-3", "text": "تست عملکرد", "completed": false}]');

-- Insert sample alerts
INSERT INTO alerts (id, type, message, severity, tank_id, generator_id, acknowledged) VALUES 
('alert-1', 'LOW_WATER', 'سطح آب مخزن کوچک کمتر از ۳۰٪ است', 'HIGH', 'tank-water-4', NULL, false),
('alert-2', 'LOW_FUEL', 'سطح سوخت ژنراتور ۴ بحرانی است', 'CRITICAL', NULL, 'gen-4', false),
('alert-3', 'MAINTENANCE', 'ژنراتور ۴ نیاز به تعمیر دارد', 'HIGH', NULL, 'gen-4', true);

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
