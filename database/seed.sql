-- Seed script for testing authentication
-- Run this in your SQL Server Management Studio

-- First, ensure UtilityType exists
IF NOT EXISTS (SELECT 1 FROM dbo.UtilityType WHERE code = 'ELEC')
BEGIN
    SET IDENTITY_INSERT dbo.UtilityType ON;
    INSERT INTO dbo.UtilityType (utility_type_id, code, name) VALUES (1, 'ELEC', 'Electricity');
    INSERT INTO dbo.UtilityType (utility_type_id, code, name) VALUES (2, 'WATER', 'Water');
    INSERT INTO dbo.UtilityType (utility_type_id, code, name) VALUES (3, 'GAS', 'Natural Gas');
    SET IDENTITY_INSERT dbo.UtilityType OFF;
END
GO

-- Create Department if not exists
IF NOT EXISTS (SELECT 1 FROM dbo.Department WHERE name = 'Administration')
BEGIN
    SET IDENTITY_INSERT dbo.Department ON;
    INSERT INTO dbo.Department (department_id, name, utility_type_id) VALUES (1, 'Administration', 1);
    INSERT INTO dbo.Department (department_id, name, utility_type_id) VALUES (2, 'Operations', 1);
    INSERT INTO dbo.Department (department_id, name, utility_type_id) VALUES (3, 'Customer Service', 1);
    INSERT INTO dbo.Department (department_id, name, utility_type_id) VALUES (4, 'Billing', 1);
    INSERT INTO dbo.Department (department_id, name, utility_type_id) VALUES (5, 'Field Services', 2);
    SET IDENTITY_INSERT dbo.Department OFF;
END
GO

-- Create test employee (password: password123)
-- The hash below is bcrypt hash for 'password123' with 10 salt rounds
IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE username = 'admin')
BEGIN
    INSERT INTO dbo.Employee (
        first_name,
        middle_name,
        last_name,
        employee_no,
        designation,
        role,
        department_id,
        email,
        username,
        password_hash
    ) VALUES (
        'System',
        NULL,
        'Administrator',
        'EMP001',
        'System Administrator',
        'Admin',
        1,
        'admin@utility.gov',
        'admin',
        '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC'  -- password123
    );
    PRINT 'Admin user created successfully';
END
ELSE
BEGIN
    PRINT 'Admin user already exists';
END
GO

-- Create additional test employees
IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE username = 'manager')
BEGIN
    INSERT INTO dbo.Employee (
        first_name,
        middle_name,
        last_name,
        employee_no,
        designation,
        role,
        department_id,
        email,
        username,
        password_hash
    ) VALUES (
        'John',
        'Michael',
        'Smith',
        'EMP002',
        'Operations Manager',
        'Manager',
        2,
        'john.smith@utility.gov',
        'manager',
        '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC'  -- password123
    );
    PRINT 'Manager user created successfully';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE username = 'cashier')
BEGIN
    INSERT INTO dbo.Employee (
        first_name,
        middle_name,
        last_name,
        employee_no,
        designation,
        role,
        department_id,
        email,
        username,
        password_hash
    ) VALUES (
        'Sarah',
        NULL,
        'Johnson',
        'EMP003',
        'Senior Cashier',
        'Cashier',
        4,
        'sarah.johnson@utility.gov',
        'cashier',
        '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC'  -- password123
    );
    PRINT 'Cashier user created successfully';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE username = 'fieldofficer')
BEGIN
    INSERT INTO dbo.Employee (
        first_name,
        middle_name,
        last_name,
        employee_no,
        designation,
        role,
        department_id,
        email,
        username,
        password_hash
    ) VALUES (
        'Robert',
        'James',
        'Williams',
        'EMP004',
        'Field Officer',
        'FieldOfficer',
        5,
        'robert.williams@utility.gov',
        'fieldofficer',
        '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC'  -- password123
    );
    PRINT 'Field Officer user created successfully';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE username = 'meterreader')
BEGIN
    INSERT INTO dbo.Employee (
        first_name,
        middle_name,
        last_name,
        employee_no,
        designation,
        role,
        department_id,
        email,
        username,
        password_hash
    ) VALUES (
        'Emily',
        NULL,
        'Davis',
        'EMP005',
        'Meter Reader',
        'MeterReader',
        5,
        'emily.davis@utility.gov',
        'meterreader',
        '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC'  -- password123
    );
    PRINT 'Meter Reader user created successfully';
END
GO

-- Display created users
SELECT 
    employee_id,
    first_name + ' ' + last_name AS full_name,
    username,
    email,
    role,
    designation
FROM dbo.Employee
ORDER BY employee_id;
GO
