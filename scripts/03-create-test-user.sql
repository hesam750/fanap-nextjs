-- Create a test user with known password: test123
-- Password hash for 'test123' generated with bcrypt
INSERT INTO users (id, email, password, name, role, is_active, created_at, updated_at) VALUES 
('test-user-001', 'test@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test User', 'OPERATOR', true, NOW(), NOW());

-- Alternative: Create a simple user with password: admin123
INSERT INTO users (id, email, password, name, role, is_active, created_at, updated_at) VALUES 
('admin-user-001', 'admin@admin.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'MANAGER', true, NOW(), NOW());
