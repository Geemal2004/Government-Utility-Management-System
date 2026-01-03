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
        '$2b$10$CDcKKre4IsSoQwtNJxpQmuNvd7P1WDm9hwyG4qKEKnA6sXp6VuqXi'  -- password123
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
        '$2b$10$CDcKKre4IsSoQwtNJxpQmuNvd7P1WDm9hwyG4qKEKnA6sXp6VuqXi'  -- password123
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
        '$2b$10$CDcKKre4IsSoQwtNJxpQmuNvd7P1WDm9hwyG4qKEKnA6sXp6VuqXi'  -- password123
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
        '$2b$10$CDcKKre4IsSoQwtNJxpQmuNvd7P1WDm9hwyG4qKEKnA6sXp6VuqXi'  -- password123
    );
    PRINT 'Meter Reader user created successfully';
END
GO

-- =====================
-- GEOGRAPHIC AREAS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.GeoArea)
BEGIN
    SET IDENTITY_INSERT dbo.GeoArea ON;
    
    -- Provinces (Top Level - no parent)
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (1, 'Western Province', 'Province', NULL),
    (2, 'Central Province', 'Province', NULL),
    (3, 'Southern Province', 'Province', NULL),
    (4, 'Northern Province', 'Province', NULL),
    (5, 'Eastern Province', 'Province', NULL),
    (6, 'North Western Province', 'Province', NULL),
    (7, 'North Central Province', 'Province', NULL),
    (8, 'Uva Province', 'Province', NULL),
    (9, 'Sabaragamuwa Province', 'Province', NULL);
    
    -- Districts (Second Level - parent is Province)
    -- Western Province Districts
    
    (11, 'Gampaha District', 'District', 1),
    (12, 'Kalutara District', 'District', 1);
    
    -- Central Province Districts

    (13, 'Kandy District', 'District', 2),
    (14, 'Matale District', 'District', 2),
    (15, 'Nuwara Eliya District', 'District', 2);
    
    -- Southern Province Districts
    
    (16, 'Galle District', 'District', 3),
    (17, 'Matara District', 'District', 3),
    (18, 'Hambantota District', 'District', 3);
    
    -- Northern Province Districts
    
    (19, 'Jaffna District', 'District', 4),
    (20, 'Kilinochchi District', 'District', 4),
    (21, 'Mannar District', 'District', 4),
    (22, 'Mullaitivu District', 'District', 4),
    (23, 'Vavuniya District', 'District', 4);
    
    -- Eastern Province Districts
    
    (24, 'Batticaloa District', 'District', 5),
    (25, 'Ampara District', 'District', 5),
    (26, 'Trincomalee District', 'District', 5);
    
    -- North Western Province Districts
    
    (27, 'Kurunegala District', 'District', 6),
    (28, 'Puttalam District', 'District', 6);
    
    -- North Central Province Districts
    
    (29, 'Anuradhapura District', 'District', 7),
    (30, 'Polonnaruwa District', 'District', 7);
    
    -- Uva Province Districts
    
    (31, 'Badulla District', 'District', 8),
    (32, 'Monaragala District', 'District', 8);
    
    -- Sabaragamuwa Province Districts
    
    (33, 'Ratnapura District', 'District', 9),
    (34, 'Kegalle District', 'District', 9);
    
    -- Divisions/Areas (Third Level - parent is District)
    -- Colombo District Divisions
    
    (100, 'Colombo Fort', 'Division', 10),
    (101, 'Slave Island', 'Division', 10),
    (102, 'Kollupitiya', 'Division', 10),
    (103, 'Bambalapitiya', 'Division', 10),
    (104, 'Havelock Town', 'Division', 10),
    (105, 'Wellawatte', 'Division', 10),
    (106, 'Cinnamon Gardens', 'Division', 10),
    (107, 'Borella', 'Division', 10),
    (108, 'Dematagoda', 'Division', 10),
    (109, 'Maradana', 'Division', 10),
    (110, 'Pettah', 'Division', 10),
    (111, 'Hulftsdorp', 'Division', 10),
    (112, 'Kotahena', 'Division', 10),
    (113, 'Grandpass', 'Division', 10),
    (114, 'Modara', 'Division', 10),
    (115, 'Nugegoda', 'Division', 10),
    (116, 'Dehiwala', 'Division', 10),
    (117, 'Mount Lavinia', 'Division', 10),
    (118, 'Moratuwa', 'Division', 10),
    (119, 'Ratmalana', 'Division', 10),
    (120, 'Piliyandala', 'Division', 10),
    (121, 'Maharagama', 'Division', 10),
    (122, 'Kesbewa', 'Division', 10),
    (123, 'Homagama', 'Division', 10);
    
    -- Gampaha District Divisions
    
    (130, 'Negombo', 'Division', 11),
    (131, 'Ja-Ela', 'Division', 11),
    (132, 'Wattala', 'Division', 11),
    (133, 'Kelaniya', 'Division', 11),
    (134, 'Gampaha', 'Division', 11),
    (135, 'Yakkala', 'Division', 11),
    (136, 'Veyangoda', 'Division', 11),
    (137, 'Mirigama', 'Division', 11),
    (138, 'Minuwangoda', 'Division', 11);
    
    -- Kalutara District Divisions
    
    (140, 'Kalutara', 'Division', 12),
    (141, 'Panadura', 'Division', 12),
    (142, 'Wadduwa', 'Division', 12),
    (143, 'Aluthgama', 'Division', 12),
    (144, 'Beruwala', 'Division', 12),
    (145, 'Matugama', 'Division', 12),
    (146, 'Horana', 'Division', 12),
    (147, 'Bandaragama', 'Division', 12);
    
    -- Kandy District Divisions
    
    (150, 'Kandy', 'Division', 13),
    (151, 'Peradeniya', 'Division', 13),
    (152, 'Katugastota', 'Division', 13),
    (153, 'Kundasale', 'Division', 13);
    
    -- Matale District Divisions
    
    (160, 'Matale', 'Division', 14),
    (161, 'Dambulla', 'Division', 14),
    (162, 'Sigiriya', 'Division', 14);
    
    -- Nuwara Eliya District Divisions
    
    (170, 'Nuwara Eliya', 'Division', 15),
    (171, 'Hatton', 'Division', 15),
    (172, 'Talawakele', 'Division', 15);
    
    -- Galle District Divisions
    
    (180, 'Galle', 'Division', 16),
    (181, 'Unawatuna', 'Division', 16),
    (182, 'Hikkaduwa', 'Division', 16),
    (183, 'Ambalangoda', 'Division', 16);
    
    -- Matara District Divisions
    
    (190, 'Matara', 'Division', 17),
    (191, 'Weligama', 'Division', 17),
    (192, 'Mirissa', 'Division', 17);
    
    -- Hambantota District Divisions
    
    (200, 'Hambantota', 'Division', 18),
    (201, 'Tangalle', 'Division', 18),
    (202, 'Tissamaharama', 'Division', 18);
    
    -- Jaffna District Divisions
    
    (210, 'Jaffna', 'Division', 19),
    (211, 'Chavakachcheri', 'Division', 19),
    (212, 'Point Pedro', 'Division', 19);
    
    -- Other Districts - Main Towns as Divisions
    
    (220, 'Kilinochchi', 'Division', 20),
    (221, 'Mannar', 'Division', 21),
    (222, 'Mullaitivu', 'Division', 22),
    (223, 'Vavuniya', 'Division', 23),
    (224, 'Batticaloa', 'Division', 24),
    (225, 'Kattankudy', 'Division', 24),
    (226, 'Kalmunai', 'Division', 25),
    (227, 'Ampara', 'Division', 25),
    (228, 'Trincomalee', 'Division', 26),
    (229, 'Kurunegala', 'Division', 27),
    (230, 'Kuliyapitiya', 'Division', 27),
    (231, 'Puttalam', 'Division', 28),
    (232, 'Chilaw', 'Division', 28),
    (233, 'Anuradhapura', 'Division', 29),
    (234, 'Mihintale', 'Division', 29),
    (235, 'Polonnaruwa', 'Division', 30),
    (236, 'Badulla', 'Division', 31),
    (237, 'Bandarawela', 'Division', 31),
    (238, 'Haputale', 'Division', 31),
    (239, 'Ella', 'Division', 31),
    (240, 'Monaragala', 'Division', 32),
    (241, 'Wellawaya', 'Division', 32),
    (242, 'Ratnapura', 'Division', 33),
    (243, 'Balangoda', 'Division', 33),
    (244, 'Embilipitiya', 'Division', 33),
    (245, 'Kegalle', 'Division', 34),
    (246, 'Mawanella', 'Division', 34);
    
    SET IDENTITY_INSERT dbo.GeoArea OFF;
    PRINT 'Geographic areas created successfully';
END
GO

-- =====================
-- POSTAL CODES
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.PostalCodes)
BEGIN
    INSERT INTO dbo.PostalCodes (postal_code, city, province) VALUES
    -- Western Province - Colombo District
    ('00100', 'Colombo 1 - Fort', 'Western'),
    ('00200', 'Colombo 2 - Slave Island', 'Western'),
    ('00300', 'Colombo 3 - Kollupitiya', 'Western'),
    ('00400', 'Colombo 4 - Bambalapitiya', 'Western'),
    ('00500', 'Colombo 5 - Havelock Town', 'Western'),
    ('00600', 'Colombo 6 - Wellawatte', 'Western'),
    ('00700', 'Colombo 7 - Cinnamon Gardens', 'Western'),
    ('00800', 'Colombo 8 - Borella', 'Western'),
    ('00900', 'Colombo 9 - Dematagoda', 'Western'),
    ('01000', 'Colombo 10 - Maradana', 'Western'),
    ('01100', 'Colombo 11 - Pettah', 'Western'),
    ('01200', 'Colombo 12 - Hulftsdorp', 'Western'),
    ('01300', 'Colombo 13 - Kotahena', 'Western'),
    ('01400', 'Colombo 14 - Grandpass', 'Western'),
    ('01500', 'Colombo 15 - Modara', 'Western'),
    -- Western Province - Gampaha District
    ('10100', 'Negombo', 'Western'),
    ('10200', 'Ja-Ela', 'Western'),
    ('10300', 'Wattala', 'Western'),
    ('10400', 'Kelaniya', 'Western'),
    ('10500', 'Maharagama', 'Western'),
    ('10600', 'Homagama', 'Western'),
    ('10700', 'Nugegoda', 'Western'),
    ('10800', 'Dehiwala', 'Western'),
    ('10900', 'Mount Lavinia', 'Western'),
    ('11000', 'Moratuwa', 'Western'),
    ('11100', 'Ratmalana', 'Western'),
    ('11200', 'Piliyandala', 'Western'),
    ('11300', 'Kesbewa', 'Western'),
    ('11400', 'Bandaragama', 'Western'),
    ('11500', 'Kalutara', 'Western'),
    ('11600', 'Panadura', 'Western'),
    ('11700', 'Wadduwa', 'Western'),
    ('12000', 'Gampaha', 'Western'),
    ('12100', 'Yakkala', 'Western'),
    ('12200', 'Veyangoda', 'Western'),
    ('12300', 'Mirigama', 'Western'),
    ('12400', 'Minuwangoda', 'Western'),
    -- Western Province - Kalutara District  
    ('12500', 'Aluthgama', 'Western'),
    ('12510', 'Beruwala', 'Western'),
    ('12520', 'Matugama', 'Western'),
    ('12530', 'Agalawatta', 'Western'),
    ('12538', 'Halthota', 'Western'),
    ('12540', 'Bulathsinhala', 'Western'),
    ('12550', 'Horana', 'Western'),
    ('12560', 'Ingiriya', 'Western'),
    ('12570', 'Palindanuwara', 'Western'),
    ('12580', 'Millaniya', 'Western'),
    -- Central Province
    ('20000', 'Kandy', 'Central'),
    ('20100', 'Peradeniya', 'Central'),
    ('20200', 'Katugastota', 'Central'),
    ('20300', 'Kundasale', 'Central'),
    ('20400', 'Matale', 'Central'),
    ('20500', 'Dambulla', 'Central'),
    ('20600', 'Sigiriya', 'Central'),
    ('22000', 'Nuwara Eliya', 'Central'),
    ('22100', 'Hatton', 'Central'),
    ('22200', 'Talawakele', 'Central'),
    -- Southern Province
    ('80000', 'Galle', 'Southern'),
    ('80100', 'Unawatuna', 'Southern'),
    ('80200', 'Hikkaduwa', 'Southern'),
    ('80300', 'Ambalangoda', 'Southern'),
    ('81000', 'Matara', 'Southern'),
    ('81100', 'Weligama', 'Southern'),
    ('81200', 'Mirissa', 'Southern'),
    ('82000', 'Hambantota', 'Southern'),
    ('82100', 'Tangalle', 'Southern'),
    ('82200', 'Tissamaharama', 'Southern'),
    -- Northern Province
    ('40000', 'Jaffna', 'Northern'),
    ('40100', 'Chavakachcheri', 'Northern'),
    ('40200', 'Point Pedro', 'Northern'),
    ('40300', 'Kilinochchi', 'Northern'),
    ('40400', 'Vavuniya', 'Northern'),
    ('40500', 'Mannar', 'Northern'),
    ('40600', 'Mullaitivu', 'Northern'),
    -- Eastern Province
    ('30000', 'Batticaloa', 'Eastern'),
    ('30100', 'Kattankudy', 'Eastern'),
    ('30200', 'Kalmunai', 'Eastern'),
    ('30300', 'Ampara', 'Eastern'),
    ('31000', 'Trincomalee', 'Eastern'),
    -- North Western Province
    ('60000', 'Kurunegala', 'North Western'),
    ('60100', 'Kuliyapitiya', 'North Western'),
    ('60200', 'Puttalam', 'North Western'),
    ('61000', 'Chilaw', 'North Western'),
    -- Sabaragamuwa Province
    ('70000', 'Ratnapura', 'Sabaragamuwa'),
    ('70100', 'Kegalle', 'Sabaragamuwa'),
    ('70200', 'Mawanella', 'Sabaragamuwa'),
    ('70300', 'Balangoda', 'Sabaragamuwa'),
    ('70400', 'Embilipitiya', 'Sabaragamuwa'),
    -- Uva Province
    ('90000', 'Badulla', 'Uva'),
    ('90100', 'Bandarawela', 'Uva'),
    ('90200', 'Haputale', 'Uva'),
    ('90300', 'Ella', 'Uva'),
    ('91000', 'Monaragala', 'Uva'),
    ('91100', 'Wellawaya', 'Uva'),
    -- North Central Province
    ('50000', 'Anuradhapura', 'North Central'),
    ('50100', 'Mihintale', 'North Central'),
    ('51000', 'Polonnaruwa', 'North Central');
    PRINT 'Sri Lankan postal codes created successfully';
END
GO

-- =====================
-- TARIFF CATEGORIES
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.TariffCategory)
BEGIN
    SET IDENTITY_INSERT dbo.TariffCategory ON;
    INSERT INTO dbo.TariffCategory (tariff_category_id, code, name, description, utility_type_id) VALUES
    (1, 'RES-STD', 'Residential Standard', 'Standard residential tariff', 1),
    (2, 'RES-LOW', 'Residential Low Income', 'Discounted tariff for low income households', 1),
    (3, 'COM-SM', 'Commercial Small', 'Small business tariff', 1),
    (4, 'COM-LG', 'Commercial Large', 'Large business tariff', 1),
    (5, 'IND', 'Industrial', 'Industrial tariff', 1),
    (6, 'WAT-RES', 'Water Residential', 'Standard water residential tariff', 2),
    (7, 'WAT-COM', 'Water Commercial', 'Commercial water tariff', 2),
    (8, 'GAS-RES', 'Gas Residential', 'Standard gas residential tariff', 3),
    (9, 'GAS-COM', 'Gas Commercial', 'Commercial gas tariff', 3);
    SET IDENTITY_INSERT dbo.TariffCategory OFF;
    PRINT 'Tariff categories created successfully';
END
GO

-- =====================
-- TARIFF SLABS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.TariffSlab)
BEGIN
    SET IDENTITY_INSERT dbo.TariffSlab ON;
    
    -- Residential Standard Tariff Slabs (tariff_category_id = 1)
    INSERT INTO dbo.TariffSlab (slab_id, tariff_category_id, from_unit, to_unit, rate_per_unit, fixed_charge, unit_price, valid_from, valid_to) VALUES
    (1, 1, 0.000, 60.000, 7.8500, 100.00, NULL, '2024-01-01', NULL),
    (2, 1, 60.001, 90.000, 10.0000, 100.00, NULL, '2024-01-01', NULL),
    (3, 1, 90.001, 120.000, 27.7500, 100.00, NULL, '2024-01-01', NULL),
    (4, 1, 120.001, 180.000, 32.0000, 100.00, NULL, '2024-01-01', NULL),
    (5, 1, 180.001, NULL, 45.0000, 100.00, NULL, '2024-01-01', NULL),
    
    -- Residential Low Income Tariff Slabs (tariff_category_id = 2) - Subsidized rates
    
    (6, 2, 0.000, 60.000, 2.5000, 50.00, NULL, '2024-01-01', NULL),
    (7, 2, 60.001, 90.000, 6.0000, 50.00, NULL, '2024-01-01', NULL),
    (8, 2, 90.001, NULL, 10.0000, 50.00, NULL, '2024-01-01', NULL),
    
    -- Commercial Small Tariff Slabs (tariff_category_id = 3)
    
    (9, 3, 0.000, 300.000, 21.0000, 300.00, NULL, '2024-01-01', NULL),
    (10, 3, 300.001, NULL, 25.0000, 300.00, NULL, '2024-01-01', NULL),
    
    -- Commercial Large Tariff Slabs (tariff_category_id = 4)
    
    (11, 4, 0.000, 1000.000, 28.0000, 1000.00, NULL, '2024-01-01', NULL),
    (12, 4, 1000.001, NULL, 32.0000, 1000.00, NULL, '2024-01-01', NULL),
    
    -- Industrial Tariff (tariff_category_id = 5) - Flat rate
    
    (13, 5, 0.000, NULL, 18.5000, 2000.00, NULL, '2024-01-01', NULL),
    
    -- Water Residential Tariff Slabs (tariff_category_id = 6)
    
    (14, 6, 0.000, 10.000, 15.0000, 50.00, NULL, '2024-01-01', NULL),
    (15, 6, 10.001, 20.000, 35.0000, 50.00, NULL, '2024-01-01', NULL),
    (16, 6, 20.001, NULL, 85.0000, 50.00, NULL, '2024-01-01', NULL),
    
    -- Water Commercial Tariff Slabs (tariff_category_id = 7)
    
    (17, 7, 0.000, 50.000, 45.0000, 200.00, NULL, '2024-01-01', NULL),
    (18, 7, 50.001, NULL, 95.0000, 200.00, NULL, '2024-01-01', NULL),
    
    -- Gas Residential Tariff Slabs (tariff_category_id = 8)
    
    (19, 8, 0.000, 100.000, 75.0000, 150.00, NULL, '2024-01-01', NULL),
    (20, 8, 100.001, NULL, 95.0000, 150.00, NULL, '2024-01-01', NULL),
    
    -- Gas Commercial Tariff Slabs (tariff_category_id = 9)
    
    (21, 9, 0.000, 500.000, 85.0000, 500.00, NULL, '2024-01-01', NULL),
    (22, 9, 500.001, NULL, 105.0000, 500.00, NULL, '2024-01-01', NULL);
    
    SET IDENTITY_INSERT dbo.TariffSlab OFF;
    PRINT 'Tariff slabs created successfully';
END
GO

-- =====================
-- TAX CONFIGURATION
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.TaxConfig)
BEGIN
    SET IDENTITY_INSERT dbo.TaxConfig ON;
    
    INSERT INTO dbo.TaxConfig (tax_id, tax_name, rate_percent, effective_from, effective_to, status) VALUES
    (1, 'VAT (Value Added Tax)', 15.000, '2024-01-01', NULL, 'ACTIVE'),
    (2, 'Environmental Levy', 2.500, '2024-01-01', NULL, 'ACTIVE'),
    (3, 'Service Tax', 1.000, '2024-01-01', NULL, 'ACTIVE'),
    (4, 'Old VAT Rate', 12.000, '2023-01-01', '2023-12-31', 'INACTIVE');
    
    SET IDENTITY_INSERT dbo.TaxConfig OFF;
    PRINT 'Tax configurations created successfully';
END
GO

-- =====================
-- SERVICE CONNECTIONS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.ServiceConnection)
BEGIN
    SET IDENTITY_INSERT dbo.ServiceConnection ON;
    
    -- Electricity Service Connections (utility_type_id = 1)
    -- Residential Standard Tariff (tariff_category_id = 1)
    INSERT INTO dbo.ServiceConnection (connection_id, customer_id, utility_type_id, tariff_category_id, meter_id, connection_status, connection_address_id) VALUES
    (1, 1, 1, 1, 1, 'ACTIVE', 1),
    (2, 2, 1, 1, 2, 'ACTIVE', 2),
    (3, 3, 1, 1, 3, 'ACTIVE', 3),
    (4, 4, 1, 1, 4, 'ACTIVE', 4),
    (5, 5, 1, 1, 5, 'ACTIVE', 5),
    
    -- Commercial Small Tariff (tariff_category_id = 3)
    (6, 6, 1, 3, 6, 'ACTIVE', 6),
    (7, 8, 1, 3, 8, 'ACTIVE', 8),
    
    -- Commercial Large Tariff (tariff_category_id = 4)
    (8, 7, 1, 4, 7, 'ACTIVE', 7),
    
    -- Industrial Tariff (tariff_category_id = 5)
    (9, 9, 1, 5, 9, 'ACTIVE', 9),
    
    -- Government (using Residential Standard for simplicity)
    (10, 10, 1, 1, 10, 'ACTIVE', 10),
    
    -- Additional connections for testing
    (11, 1, 1, 1, 13, 'ACTIVE', 1),
    (12, 2, 1, 1, 14, 'ACTIVE', 2),
    (13, 3, 1, 1, 15, 'ACTIVE', 3),
    
    -- Water Service Connections (utility_type_id = 2, tariff_category_id = 6)
    (14, 1, 2, 6, 16, 'ACTIVE', 1),
    (15, 2, 2, 6, 17, 'ACTIVE', 2),
    (16, 3, 2, 6, 18, 'ACTIVE', 3),
    (17, 4, 2, 6, 19, 'ACTIVE', 4),
    (18, 5, 2, 6, 20, 'ACTIVE', 5),
    
    -- Water Commercial (tariff_category_id = 7)
    (19, 6, 2, 7, 21, 'ACTIVE', 6),
    (20, 7, 2, 7, 23, 'ACTIVE', 7),
    (21, 8, 2, 7, 24, 'ACTIVE', 8),
    (22, 9, 2, 7, 25, 'ACTIVE', 9),
    
    -- Gas Service Connections (utility_type_id = 3, tariff_category_id = 8)
    (23, 1, 3, 8, 26, 'ACTIVE', 1),
    (24, 2, 3, 8, 27, 'ACTIVE', 2),
    (25, 3, 3, 8, 28, 'ACTIVE', 3),
    (26, 4, 3, 8, 29, 'ACTIVE', 4),
    (27, 5, 3, 8, 30, 'ACTIVE', 5),
    
    -- Gas Commercial (tariff_category_id = 9)
    (28, 6, 3, 9, 32, 'ACTIVE', 6),
    (29, 7, 3, 9, 33, 'ACTIVE', 7),
    (30, 8, 3, 9, 34, 'ACTIVE', 8),
    (31, 9, 3, 9, 35, 'ACTIVE', 9);
    
    SET IDENTITY_INSERT dbo.ServiceConnection OFF;
    PRINT 'Service connections created successfully';
END
GO

-- =====================
-- METER READINGS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.MeterReading)
BEGIN
    SET IDENTITY_INSERT dbo.MeterReading ON;
    
    -- Meter Readings for ELEC-001-2024 (meter_id = 1) - 150 units consumption per month
    INSERT INTO dbo.MeterReading (reading_id, meter_id, reading_date, import_reading, export_reading, reading_source, meter_reader_id) VALUES
    -- December 2023
    (1, 1, '2023-12-01', 1000.000, 0.000, 'MANUAL', 5),
    -- January 2024 (150 units)
    (2, 1, '2024-01-01', 1150.000, 0.000, 'MANUAL', 5),
    -- February 2024 (150 units)
    (3, 1, '2024-02-01', 1300.000, 0.000, 'MANUAL', 5),
    -- March 2024 (150 units)
    (4, 1, '2024-03-01', 1450.000, 0.000, 'MANUAL', 5),
    -- April 2024 (150 units)
    (5, 1, '2024-04-01', 1600.000, 0.000, 'MANUAL', 5),
    -- May 2024 (150 units)
    (6, 1, '2024-05-01', 1750.000, 0.000, 'MANUAL', 5),
    -- June 2024 (150 units)
    (7, 1, '2024-06-01', 1900.000, 0.000, 'MANUAL', 5),
    
    -- Meter Readings for ELEC-002-2024 (meter_id = 2) - 200 units consumption per month
    (8, 2, '2024-01-20', 500.000, 0.000, 'MANUAL', 5),
    (9, 2, '2024-02-20', 700.000, 0.000, 'MANUAL', 5),
    (10, 2, '2024-03-20', 900.000, 0.000, 'MANUAL', 5),
    (11, 2, '2024-04-20', 1100.000, 0.000, 'MANUAL', 5),
    (12, 2, '2024-05-20', 1300.000, 0.000, 'MANUAL', 5),
    
    -- Meter Readings for ELEC-003-2024 (meter_id = 3) - 80 units consumption per month
    (13, 3, '2024-02-10', 1000.000, 0.000, 'SMART', NULL),
    (14, 3, '2024-03-10', 1080.000, 0.000, 'SMART', NULL),
    (15, 3, '2024-04-10', 1160.000, 0.000, 'SMART', NULL),
    (16, 3, '2024-05-10', 1240.000, 0.000, 'SMART', NULL),
    
    -- Meter Readings for ELEC-004-2024 (meter_id = 4) - 120 units consumption per month
    (17, 4, '2024-03-05', 2000.000, 0.000, 'MANUAL', 5),
    (18, 4, '2024-04-05', 2120.000, 0.000, 'MANUAL', 5),
    (19, 4, '2024-05-05', 2240.000, 0.000, 'MANUAL', 5),
    
    -- Meter Readings for ELEC-005-2024 (meter_id = 5) - 50 units consumption with solar export
    (20, 5, '2024-04-12', 3000.000, 0.000, 'SMART', NULL),
    (21, 5, '2024-05-12', 3050.000, 20.000, 'SMART', NULL),
    (22, 5, '2024-06-12', 3100.000, 45.000, 'SMART', NULL),
    
    -- Commercial Small (meter_id = 6) - 400 units per month
    (23, 6, '2024-01-20', 5000.000, 0.000, 'SMART', NULL),
    (24, 6, '2024-02-20', 5400.000, 0.000, 'SMART', NULL),
    (25, 6, '2024-03-20', 5800.000, 0.000, 'SMART', NULL),
    (26, 6, '2024-04-20', 6200.000, 0.000, 'SMART', NULL),
    (27, 6, '2024-05-20', 6600.000, 0.000, 'SMART', NULL),
    
    -- Commercial Large (meter_id = 7) - 1500 units per month
    (28, 7, '2024-02-28', 10000.000, 0.000, 'MANUAL', 5),
    (29, 7, '2024-03-28', 11500.000, 0.000, 'MANUAL', 5),
    (30, 7, '2024-04-28', 13000.000, 0.000, 'MANUAL', 5),
    (31, 7, '2024-05-28', 14500.000, 0.000, 'MANUAL', 5),
    
    -- Commercial Small (meter_id = 8) - 350 units per month
    (32, 8, '2024-03-15', 7500.000, 0.000, 'SMART', NULL),
    (33, 8, '2024-04-15', 7850.000, 0.000, 'SMART', NULL),
    (34, 8, '2024-05-15', 8200.000, 0.000, 'SMART', NULL),
    
    -- Industrial (meter_id = 9) - 5000 units per month
    (35, 9, '2024-04-01', 20000.000, 0.000, 'MANUAL', 5),
    (36, 9, '2024-05-01', 25000.000, 0.000, 'MANUAL', 5),
    (37, 9, '2024-06-01', 30000.000, 0.000, 'MANUAL', 5),
    
    -- Government (meter_id = 10) - 180 units per month
    (38, 10, '2024-05-01', 8000.000, 0.000, 'SMART', NULL),
    (39, 10, '2024-06-01', 8180.000, 0.000, 'SMART', NULL),
    
    -- Additional meters for testing
    (40, 13, '2024-06-01', 100.000, 0.000, 'MANUAL', 5),
    (41, 13, '2024-07-01', 220.000, 0.000, 'MANUAL', 5),
    
    (42, 14, '2024-06-15', 500.000, 0.000, 'SMART', NULL),
    (43, 14, '2024-07-15', 590.000, 0.000, 'SMART', NULL),
    
    (44, 15, '2024-07-01', 1000.000, 0.000, 'MANUAL', 5),
    (45, 15, '2024-08-01', 1175.000, 0.000, 'MANUAL', 5),
    
    -- Water Meters (cubic meters, typically much lower consumption)
    -- meter_id = 16, 17, 18, 19, 20 - 15 cubic meters per month
    (46, 16, '2024-01-10', 50.000, 0.000, 'MANUAL', 5),
    (47, 16, '2024-02-10', 65.000, 0.000, 'MANUAL', 5),
    (48, 16, '2024-03-10', 80.000, 0.000, 'MANUAL', 5),
    
    (49, 17, '2024-02-15', 100.000, 0.000, 'SMART', NULL),
    (50, 17, '2024-03-15', 115.000, 0.000, 'SMART', NULL),
    (51, 17, '2024-04-15', 130.000, 0.000, 'SMART', NULL),
    
    (52, 18, '2024-03-05', 200.000, 0.000, 'MANUAL', 5),
    (53, 18, '2024-04-05', 215.000, 0.000, 'MANUAL', 5),
    (54, 18, '2024-05-05', 230.000, 0.000, 'MANUAL', 5),
    
    (55, 19, '2024-04-10', 75.000, 0.000, 'SMART', NULL),
    (56, 19, '2024-05-10', 90.000, 0.000, 'SMART', NULL),
    
    (57, 20, '2024-05-08', 150.000, 0.000, 'MANUAL', 5),
    (58, 20, '2024-06-08', 165.000, 0.000, 'MANUAL', 5),
    
    -- Water Commercial - 60 cubic meters per month
    (59, 21, '2024-01-25', 500.000, 0.000, 'SMART', NULL),
    (60, 21, '2024-02-25', 560.000, 0.000, 'SMART', NULL),
    (61, 21, '2024-03-25', 620.000, 0.000, 'SMART', NULL),
    
    (62, 23, '2024-03-18', 300.000, 0.000, 'SMART', NULL),
    (63, 23, '2024-04-18', 360.000, 0.000, 'SMART', NULL),
    (64, 23, '2024-05-18', 420.000, 0.000, 'SMART', NULL),
    
    (65, 24, '2024-04-05', 1000.000, 0.000, 'MANUAL', 5),
    (66, 24, '2024-05-05', 1060.000, 0.000, 'MANUAL', 5),
    
    (67, 25, '2024-05-02', 2000.000, 0.000, 'SMART', NULL),
    (68, 25, '2024-06-02', 2060.000, 0.000, 'SMART', NULL),
    
    -- Gas Meters (cubic meters) - 120 cubic meters per month
    (69, 26, '2024-02-01', 1000.000, 0.000, 'SMART', NULL),
    (70, 26, '2024-03-01', 1120.000, 0.000, 'SMART', NULL),
    (71, 26, '2024-04-01', 1240.000, 0.000, 'SMART', NULL),
    
    (72, 27, '2024-03-10', 500.000, 0.000, 'MANUAL', 5),
    (73, 27, '2024-04-10', 620.000, 0.000, 'MANUAL', 5),
    (74, 27, '2024-05-10', 740.000, 0.000, 'MANUAL', 5),
    
    (75, 28, '2024-04-15', 2000.000, 0.000, 'SMART', NULL),
    (76, 28, '2024-05-15', 2120.000, 0.000, 'SMART', NULL),
    
    (77, 29, '2024-05-20', 3000.000, 0.000, 'MANUAL', 5),
    (78, 29, '2024-06-20', 3120.000, 0.000, 'MANUAL', 5),
    
    (79, 30, '2024-06-05', 4000.000, 0.000, 'SMART', NULL),
    (80, 30, '2024-07-05', 4120.000, 0.000, 'SMART', NULL),
    
    -- Gas Commercial - 600 cubic meters per month
    (81, 32, '2024-03-20', 5000.000, 0.000, 'SMART', NULL),
    (82, 32, '2024-04-20', 5600.000, 0.000, 'SMART', NULL),
    (83, 32, '2024-05-20', 6200.000, 0.000, 'SMART', NULL),
    
    (84, 33, '2024-04-25', 10000.000, 0.000, 'MANUAL', 5),
    (85, 33, '2024-05-25', 10600.000, 0.000, 'MANUAL', 5),
    
    (86, 34, '2024-05-30', 15000.000, 0.000, 'SMART', NULL),
    (87, 34, '2024-06-30', 15600.000, 0.000, 'SMART', NULL),
    
    (88, 35, '2024-06-10', 20000.000, 0.000, 'MANUAL', 5),
    (89, 35, '2024-07-10', 20600.000, 0.000, 'MANUAL', 5);
    
    SET IDENTITY_INSERT dbo.MeterReading OFF;
    PRINT 'Meter readings created successfully';
END
GO

-- =====================
-- CUSTOMER ADDRESSES
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.CustomerAddress)
BEGIN
    SET IDENTITY_INSERT dbo.CustomerAddress ON;
    INSERT INTO dbo.CustomerAddress (customer_address_id, postal_code, line1) VALUES
    (1, '00700', '45/2, Gregory Road'),
    (2, '00300', '123, Galle Road'),
    (3, '10700', '78, Wijerama Mawatha'),
    (4, '00600', '12A, Marine Drive'),
    (5, '10500', 'No. 56, High Level Road'),
    (6, '20000', '89, Peradeniya Road'),
    (7, '80000', '34, Church Street'),
    (8, '00100', '1st Floor, 45 York Street'),
    (9, '10100', '23, Beach Road'),
    (10, '12000', 'No. 145, Main Street');
    SET IDENTITY_INSERT dbo.CustomerAddress OFF;
    PRINT 'Customer addresses created successfully';
END
GO

-- =====================
-- CUSTOMERS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.Customer)
BEGIN
    SET IDENTITY_INSERT dbo.Customer ON;
    -- Residential Customers
    INSERT INTO dbo.Customer (
        customer_id, first_name, middle_name, last_name, password_hash, email,
        customer_address_id, customer_type, registration_date, identity_type, identity_ref, employee_id
    ) VALUES
    (1, 'Amal', 'Kumara', 'Perera', '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC', 
     'amal.perera@gmail.com', 1, 'RESIDENTIAL', '2024-01-15', 'NIC', '901234567V', 1),
    
    (2, 'Nimal', NULL, 'Fernando', '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC',
     'nimal.fernando@gmail.com', 2, 'RESIDENTIAL', '2024-02-20', 'NIC', '851234568V', 1),
    
    (3, 'Kamala', 'Dilani', 'Silva', '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC',
     'kamala.silva@yahoo.com', 3, 'RESIDENTIAL', '2024-03-10', 'NIC', '881234569V', 1),
    
    (4, 'Sunil', NULL, 'Jayawardena', '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC',
     'sunil.j@outlook.com', 4, 'RESIDENTIAL', '2024-04-05', 'NIC', '791234570V', 1),
    
    (5, 'Malini', 'Priya', 'Rajapaksa', '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC',
     'malini.r@gmail.com', 5, 'RESIDENTIAL', '2024-05-12', 'NIC', '921234571V', 1),
    
    -- Commercial Customers
    (6, 'Lanka', NULL, 'Traders', '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC',
     'info@lankatraders.lk', 6, 'COMMERCIAL', '2024-01-20', 'BRN', 'PV12345', 1),
    
    (7, 'Southern', NULL, 'Hotels', '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC',
     'reservations@southernhotels.lk', 7, 'COMMERCIAL', '2024-02-28', 'BRN', 'PV23456', 1),
    
    (8, 'City', NULL, 'Pharmacy', '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC',
     'citypharmacy@gmail.com', 8, 'COMMERCIAL', '2024-03-15', 'BRN', 'PV34567', 1),
    
    -- Industrial Customer
    (9, 'Negombo', NULL, 'Fisheries', '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC',
     'admin@negombofisheries.lk', 9, 'INDUSTRIAL', '2024-04-01', 'BRN', 'PV45678', 1),
    
    -- Government Customer
    (10, 'Gampaha', 'District', 'Secretariat', '$2b$10$rPqG3K7YFOqCkjKB6WcJd.VD4gPkPjXHfDlVYEYdWPNXuHJSfWKpC',
     'ds.gampaha@gov.lk', 10, 'GOVERNMENT', '2024-05-01', 'GOV', 'GOV001', 1);
    
    SET IDENTITY_INSERT dbo.Customer OFF;
    PRINT 'Customers created successfully';
END
GO

-- =====================
-- CUSTOMER PHONE NUMBERS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.CustomerPhoneNumbers)
BEGIN
    INSERT INTO dbo.CustomerPhoneNumbers (customer_id, phone) VALUES
    (1, '+94771234567'),
    (1, '+94112234567'),
    (2, '+94772345678'),
    (3, '+94773456789'),
    (3, '+94113456789'),
    (4, '+94774567890'),
    (5, '+94775678901'),
    (6, '+94776789012'),
    (6, '+94116789012'),
    (7, '+94777890123'),
    (8, '+94778901234'),
    (9, '+94779012345'),
    (10, '+94332123456');
    PRINT 'Customer phone numbers created successfully';
END
GO

-- =====================
-- METERS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.Meter)
BEGIN
    SET IDENTITY_INSERT dbo.Meter ON;
    
    -- Electricity Meters (utility_type_id = 1)
    INSERT INTO dbo.Meter (meter_id, meter_serial_no, utility_type_id, installation_date, is_smart_meter, status) VALUES
    (1, 'ELEC-001-2024', 1, '2024-01-15', 1, 'ACTIVE'),
    (2, 'ELEC-002-2024', 1, '2024-02-20', 0, 'ACTIVE'),
    (3, 'ELEC-003-2024', 1, '2024-03-10', 1, 'ACTIVE'),
    (4, 'ELEC-004-2024', 1, '2024-04-05', 0, 'ACTIVE'),
    (5, 'ELEC-005-2024', 1, '2024-05-12', 1, 'ACTIVE'),
    (6, 'ELEC-006-2024', 1, '2024-01-20', 1, 'ACTIVE'),
    (7, 'ELEC-007-2024', 1, '2024-02-28', 0, 'ACTIVE'),
    (8, 'ELEC-008-2024', 1, '2024-03-15', 1, 'ACTIVE'),
    (9, 'ELEC-009-2024', 1, '2024-04-01', 0, 'ACTIVE'),
    (10, 'ELEC-010-2024', 1, '2024-05-01', 1, 'ACTIVE'),
    (11, 'ELEC-011-2024', 1, '2023-12-10', 0, 'FAULTY'),
    (12, 'ELEC-012-2024', 1, '2023-11-05', 1, 'DISCONNECTED'),
    (13, 'ELEC-013-2024', 1, '2024-06-01', 0, 'ACTIVE'),
    (14, 'ELEC-014-2024', 1, '2024-06-15', 1, 'ACTIVE'),
    (15, 'ELEC-015-2024', 1, '2024-07-01', 0, 'ACTIVE'),
    
    -- Water Meters (utility_type_id = 2)
    (16, 'WATER-001-2024', 2, '2024-01-10', 0, 'ACTIVE'),
    (17, 'WATER-002-2024', 2, '2024-02-15', 1, 'ACTIVE'),
    (18, 'WATER-003-2024', 2, '2024-03-05', 0, 'ACTIVE'),
    (19, 'WATER-004-2024', 2, '2024-04-10', 1, 'ACTIVE'),
    (20, 'WATER-005-2024', 2, '2024-05-08', 0, 'ACTIVE'),
    (21, 'WATER-006-2024', 2, '2024-01-25', 1, 'ACTIVE'),
    (22, 'WATER-007-2024', 2, '2024-02-20', 0, 'FAULTY'),
    (23, 'WATER-008-2024', 2, '2024-03-18', 1, 'ACTIVE'),
    (24, 'WATER-009-2024', 2, '2024-04-05', 0, 'ACTIVE'),
    (25, 'WATER-010-2024', 2, '2024-05-02', 1, 'ACTIVE'),
    
    -- Gas Meters (utility_type_id = 3)
    (26, 'GAS-001-2024', 3, '2024-02-01', 1, 'ACTIVE'),
    (27, 'GAS-002-2024', 3, '2024-03-10', 0, 'ACTIVE'),
    (28, 'GAS-003-2024', 3, '2024-04-15', 1, 'ACTIVE'),
    (29, 'GAS-004-2024', 3, '2024-05-20', 0, 'ACTIVE'),
    (30, 'GAS-005-2024', 3, '2024-06-05', 1, 'ACTIVE'),
    (31, 'GAS-006-2024', 3, '2024-02-10', 0, 'DISCONNECTED'),
    (32, 'GAS-007-2024', 3, '2024-03-20', 1, 'ACTIVE'),
    (33, 'GAS-008-2024', 3, '2024-04-25', 0, 'ACTIVE'),
    (34, 'GAS-009-2024', 3, '2024-05-30', 1, 'ACTIVE'),
    (35, 'GAS-010-2024', 3, '2024-06-10', 0, 'ACTIVE');
    
    SET IDENTITY_INSERT dbo.Meter OFF;
    PRINT 'Meters created successfully';
END
GO

-- =====================
-- NETWORK NODES
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.NetworkNode)
BEGIN
    SET IDENTITY_INSERT dbo.NetworkNode ON;
    
    -- Electricity Network Nodes (utility_type_id = 1)
    -- Substations
    INSERT INTO dbo.NetworkNode (node_id, name, status, node_type, utility_type_id) VALUES
    (1, 'Colombo Central Substation', 'ACTIVE', 'SUBSTATION', 1),
    (2, 'Fort Primary Substation', 'ACTIVE', 'SUBSTATION', 1),
    (3, 'Kollupitiya Distribution Center', 'ACTIVE', 'DISTRIBUTION_CENTER', 1),
    (4, 'Bambalapitiya Transformer Station', 'ACTIVE', 'TRANSFORMER', 1),
    (5, 'Wellawatte Local Station', 'ACTIVE', 'DISTRIBUTION_CENTER', 1),
    (6, 'Nugegoda Main Substation', 'ACTIVE', 'SUBSTATION', 1),
    (7, 'Dehiwala Distribution Hub', 'ACTIVE', 'DISTRIBUTION_CENTER', 1),
    (8, 'Mount Lavinia Transformer', 'ACTIVE', 'TRANSFORMER', 1),
    (9, 'Moratuwa Grid Station', 'ACTIVE', 'SUBSTATION', 1),
    (10, 'Ratmalana Distribution Point', 'ACTIVE', 'DISTRIBUTION_CENTER', 1),
    (11, 'Maharagama Substation', 'ACTIVE', 'SUBSTATION', 1),
    (12, 'Piliyandala Local Station', 'ACTIVE', 'DISTRIBUTION_CENTER', 1),
    (13, 'Homagama Distribution Center', 'ACTIVE', 'DISTRIBUTION_CENTER', 1),
    (14, 'Kesbewa Transformer Station', 'ACTIVE', 'TRANSFORMER', 1),
    (15, 'Negombo Main Substation', 'ACTIVE', 'SUBSTATION', 1),
    (16, 'Ja-Ela Distribution Hub', 'ACTIVE', 'DISTRIBUTION_CENTER', 1),
    (17, 'Wattala Transformer', 'ACTIVE', 'TRANSFORMER', 1),
    (18, 'Kelaniya Grid Station', 'ACTIVE', 'SUBSTATION', 1),
    (19, 'Gampaha Primary Substation', 'ACTIVE', 'SUBSTATION', 1),
    (20, 'Kalutara Substation', 'ACTIVE', 'SUBSTATION', 1),
    (21, 'Panadura Distribution Center', 'ACTIVE', 'DISTRIBUTION_CENTER', 1),
    (22, 'Kandy Main Substation', 'ACTIVE', 'SUBSTATION', 1),
    (23, 'Peradeniya Grid Station', 'ACTIVE', 'SUBSTATION', 1),
    (24, 'Galle Primary Substation', 'ACTIVE', 'SUBSTATION', 1),
    (25, 'Matara Distribution Hub', 'ACTIVE', 'DISTRIBUTION_CENTER', 1),
    
    -- Water Network Nodes (utility_type_id = 2)
    -- Water Treatment Plants and Pumping Stations
    
    (101, 'Ambatale Water Treatment Plant', 'ACTIVE', 'TREATMENT_PLANT', 2),
    (102, 'Labugama Reservoir', 'ACTIVE', 'RESERVOIR', 2),
    (103, 'Kalatuwawa Reservoir', 'ACTIVE', 'RESERVOIR', 2),
    (104, 'Colombo Main Pumping Station', 'ACTIVE', 'PUMPING_STATION', 2),
    (105, 'Fort Water Distribution Center', 'ACTIVE', 'DISTRIBUTION_CENTER', 2),
    (106, 'Kollupitiya Pumping Station', 'ACTIVE', 'PUMPING_STATION', 2),
    (107, 'Wellawatte Distribution Point', 'ACTIVE', 'DISTRIBUTION_CENTER', 2),
    (108, 'Nugegoda Water Tower', 'ACTIVE', 'WATER_TOWER', 2),
    (109, 'Dehiwala Pumping Station', 'ACTIVE', 'PUMPING_STATION', 2),
    (110, 'Moratuwa Distribution Center', 'ACTIVE', 'DISTRIBUTION_CENTER', 2),
    (111, 'Maharagama Water Treatment Plant', 'ACTIVE', 'TREATMENT_PLANT', 2),
    (112, 'Kelaniya Water Distribution Hub', 'ACTIVE', 'DISTRIBUTION_CENTER', 2),
    (113, 'Gampaha Main Reservoir', 'ACTIVE', 'RESERVOIR', 2),
    (114, 'Negombo Water Tower', 'ACTIVE', 'WATER_TOWER', 2),
    (115, 'Kalutara Treatment Plant', 'ACTIVE', 'TREATMENT_PLANT', 2),
    (116, 'Panadura Pumping Station', 'ACTIVE', 'PUMPING_STATION', 2),
    (117, 'Kandy Water Treatment Plant', 'ACTIVE', 'TREATMENT_PLANT', 2),
    (118, 'Peradeniya Reservoir', 'ACTIVE', 'RESERVOIR', 2),
    (119, 'Galle Water Distribution Hub', 'ACTIVE', 'DISTRIBUTION_CENTER', 2),
    (120, 'Matara Pumping Station', 'ACTIVE', 'PUMPING_STATION', 2),
    
    -- Gas Network Nodes (utility_type_id = 3)
    -- Gas Distribution Centers and Pressure Regulation Stations
    
    (201, 'Colombo Gas Terminal', 'ACTIVE', 'TERMINAL', 3),
    (202, 'Kerawalapitiya Storage Facility', 'ACTIVE', 'STORAGE', 3),
    (203, 'Fort Pressure Regulation Station', 'ACTIVE', 'PRESSURE_STATION', 3),
    (204, 'Kollupitiya Distribution Point', 'ACTIVE', 'DISTRIBUTION_CENTER', 3),
    (205, 'Nugegoda Gas Hub', 'ACTIVE', 'DISTRIBUTION_CENTER', 3),
    (206, 'Moratuwa Pressure Station', 'ACTIVE', 'PRESSURE_STATION', 3),
    (207, 'Kelaniya Gas Distribution Center', 'ACTIVE', 'DISTRIBUTION_CENTER', 3),
    (208, 'Negombo Pressure Regulation Station', 'ACTIVE', 'PRESSURE_STATION', 3),
    (209, 'Gampaha Gas Hub', 'ACTIVE', 'DISTRIBUTION_CENTER', 3),
    (210, 'Kalutara Distribution Point', 'ACTIVE', 'DISTRIBUTION_CENTER', 3),
    (211, 'Kandy Gas Terminal', 'ACTIVE', 'TERMINAL', 3),
    (212, 'Galle Pressure Station', 'ACTIVE', 'PRESSURE_STATION', 3),
    (213, 'Matara Distribution Center', 'ACTIVE', 'DISTRIBUTION_CENTER', 3);
    
    SET IDENTITY_INSERT dbo.NetworkNode OFF;
    PRINT 'Network nodes created successfully';
END
GO

-- =====================
-- NETWORK LINKS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.NetworkLink)
BEGIN
    SET IDENTITY_INSERT dbo.NetworkLink ON;
    
    -- Electricity Network Links (utility_type_id = 1)
    -- Transmission and Distribution Lines
    INSERT INTO dbo.NetworkLink (link_id, link_type, status, length_km, diameter_mm, from_node_id, to_node_id, max_capacity, capacity_uom, utility_type_id) VALUES
    -- Main transmission lines
    (1, 'TRANSMISSION_LINE', 'ACTIVE', 5.5, NULL, 1, 2, 250.000, 'MVA', 1),
    (2, 'TRANSMISSION_LINE', 'ACTIVE', 3.2, NULL, 2, 3, 150.000, 'MVA', 1),
    (3, 'DISTRIBUTION_LINE', 'ACTIVE', 2.1, NULL, 3, 4, 50.000, 'MVA', 1),
    (4, 'DISTRIBUTION_LINE', 'ACTIVE', 1.8, NULL, 4, 5, 30.000, 'MVA', 1),
    (5, 'TRANSMISSION_LINE', 'ACTIVE', 8.5, NULL, 1, 6, 200.000, 'MVA', 1),
    (6, 'DISTRIBUTION_LINE', 'ACTIVE', 3.5, NULL, 6, 7, 60.000, 'MVA', 1),
    (7, 'DISTRIBUTION_LINE', 'ACTIVE', 2.2, NULL, 7, 8, 40.000, 'MVA', 1),
    (8, 'DISTRIBUTION_LINE', 'ACTIVE', 3.8, NULL, 8, 9, 50.000, 'MVA', 1),
    (9, 'DISTRIBUTION_LINE', 'ACTIVE', 2.5, NULL, 9, 10, 35.000, 'MVA', 1),
    (10, 'TRANSMISSION_LINE', 'ACTIVE', 6.2, NULL, 6, 11, 120.000, 'MVA', 1),
    (11, 'DISTRIBUTION_LINE', 'ACTIVE', 4.5, NULL, 11, 12, 45.000, 'MVA', 1),
    (12, 'DISTRIBUTION_LINE', 'ACTIVE', 5.8, NULL, 11, 13, 50.000, 'MVA', 1),
    (13, 'DISTRIBUTION_LINE', 'ACTIVE', 3.1, NULL, 13, 14, 30.000, 'MVA', 1),
    (14, 'TRANSMISSION_LINE', 'ACTIVE', 35.5, NULL, 1, 15, 180.000, 'MVA', 1),
    (15, 'DISTRIBUTION_LINE', 'ACTIVE', 8.2, NULL, 15, 16, 55.000, 'MVA', 1),
    (16, 'DISTRIBUTION_LINE', 'ACTIVE', 5.5, NULL, 16, 17, 40.000, 'MVA', 1),
    (17, 'DISTRIBUTION_LINE', 'ACTIVE', 4.8, NULL, 17, 18, 45.000, 'MVA', 1),
    (18, 'TRANSMISSION_LINE', 'ACTIVE', 12.5, NULL, 1, 19, 150.000, 'MVA', 1),
    (19, 'TRANSMISSION_LINE', 'ACTIVE', 28.5, NULL, 1, 20, 140.000, 'MVA', 1),
    (20, 'DISTRIBUTION_LINE', 'ACTIVE', 7.5, NULL, 20, 21, 50.000, 'MVA', 1),
    (21, 'TRANSMISSION_LINE', 'ACTIVE', 115.0, NULL, 1, 22, 300.000, 'MVA', 1),
    (22, 'DISTRIBUTION_LINE', 'ACTIVE', 8.5, NULL, 22, 23, 80.000, 'MVA', 1),
    (23, 'TRANSMISSION_LINE', 'ACTIVE', 95.0, NULL, 1, 24, 250.000, 'MVA', 1),
    (24, 'DISTRIBUTION_LINE', 'ACTIVE', 35.0, NULL, 24, 25, 70.000, 'MVA', 1),
    
    -- Water Network Links (utility_type_id = 2)
    -- Pipelines from reservoirs to treatment plants to distribution
    
    (101, 'MAIN_PIPELINE', 'ACTIVE', 12.5, 1200.00, 102, 101, 150.000, 'MLD', 2),
    (102, 'MAIN_PIPELINE', 'ACTIVE', 8.5, 1200.00, 103, 101, 120.000, 'MLD', 2),
    (103, 'MAIN_PIPELINE', 'ACTIVE', 15.5, 1000.00, 101, 104, 200.000, 'MLD', 2),
    (104, 'DISTRIBUTION_PIPE', 'ACTIVE', 3.2, 800.00, 104, 105, 80.000, 'MLD', 2),
    (105, 'DISTRIBUTION_PIPE', 'ACTIVE', 2.5, 600.00, 105, 106, 50.000, 'MLD', 2),
    (106, 'DISTRIBUTION_PIPE', 'ACTIVE', 2.8, 600.00, 106, 107, 45.000, 'MLD', 2),
    (107, 'MAIN_PIPELINE', 'ACTIVE', 8.5, 800.00, 104, 108, 90.000, 'MLD', 2),
    (108, 'DISTRIBUTION_PIPE', 'ACTIVE', 4.2, 600.00, 108, 109, 55.000, 'MLD', 2),
    (109, 'DISTRIBUTION_PIPE', 'ACTIVE', 3.5, 600.00, 109, 110, 50.000, 'MLD', 2),
    (110, 'MAIN_PIPELINE', 'ACTIVE', 12.0, 900.00, 104, 111, 100.000, 'MLD', 2),
    (111, 'MAIN_PIPELINE', 'ACTIVE', 18.5, 1000.00, 101, 112, 110.000, 'MLD', 2),
    (112, 'MAIN_PIPELINE', 'ACTIVE', 25.0, 1000.00, 101, 113, 120.000, 'MLD', 2),
    (113, 'DISTRIBUTION_PIPE', 'ACTIVE', 15.0, 700.00, 113, 114, 60.000, 'MLD', 2),
    (114, 'MAIN_PIPELINE', 'ACTIVE', 38.0, 900.00, 101, 115, 90.000, 'MLD', 2),
    (115, 'DISTRIBUTION_PIPE', 'ACTIVE', 12.0, 600.00, 115, 116, 50.000, 'MLD', 2),
    (116, 'MAIN_PIPELINE', 'ACTIVE', 95.0, 1000.00, 101, 117, 100.000, 'MLD', 2),
    (117, 'DISTRIBUTION_PIPE', 'ACTIVE', 8.0, 700.00, 117, 118, 65.000, 'MLD', 2),
    (118, 'MAIN_PIPELINE', 'ACTIVE', 108.0, 900.00, 101, 119, 85.000, 'MLD', 2),
    (119, 'DISTRIBUTION_PIPE', 'ACTIVE', 35.0, 600.00, 119, 120, 45.000, 'MLD', 2),
    
    -- Gas Network Links (utility_type_id = 3)
    -- High-pressure and medium-pressure pipelines
    
    (201, 'HIGH_PRESSURE', 'ACTIVE', 8.5, 600.00, 201, 202, 50.000, 'MMSCMD', 3),
    (202, 'HIGH_PRESSURE', 'ACTIVE', 12.0, 500.00, 202, 203, 40.000, 'MMSCMD', 3),
    (203, 'MEDIUM_PRESSURE', 'ACTIVE', 3.5, 400.00, 203, 204, 20.000, 'MMSCMD', 3),
    (204, 'MEDIUM_PRESSURE', 'ACTIVE', 8.5, 400.00, 203, 205, 25.000, 'MMSCMD', 3),
    (205, 'MEDIUM_PRESSURE', 'ACTIVE', 6.5, 350.00, 205, 206, 18.000, 'MMSCMD', 3),
    (206, 'HIGH_PRESSURE', 'ACTIVE', 15.0, 500.00, 202, 207, 35.000, 'MMSCMD', 3),
    (207, 'HIGH_PRESSURE', 'ACTIVE', 28.0, 450.00, 202, 208, 30.000, 'MMSCMD', 3),
    (208, 'MEDIUM_PRESSURE', 'ACTIVE', 10.0, 350.00, 208, 209, 22.000, 'MMSCMD', 3),
    (209, 'MEDIUM_PRESSURE', 'ACTIVE', 32.0, 400.00, 202, 210, 25.000, 'MMSCMD', 3),
    (210, 'HIGH_PRESSURE', 'ACTIVE', 98.0, 500.00, 201, 211, 40.000, 'MMSCMD', 3),
    (211, 'HIGH_PRESSURE', 'ACTIVE', 105.0, 450.00, 201, 212, 35.000, 'MMSCMD', 3),
    (212, 'MEDIUM_PRESSURE', 'ACTIVE', 35.0, 350.00, 212, 213, 20.000, 'MMSCMD', 3);
    
    SET IDENTITY_INSERT dbo.NetworkLink OFF;
    PRINT 'Network links created successfully';
END
GO

-- =====================
-- AREA NODE MAPPINGS
-- =====================
IF NOT EXISTS (SELECT 1 FROM dbo.AreaNode)
BEGIN
    -- Electricity Nodes to Geographic Areas
    -- Colombo District nodes
    INSERT INTO dbo.AreaNode (node_id, geo_area_id) VALUES
    (1, 10), (2, 100), (3, 102), (4, 103), (5, 105),
    (6, 115), (7, 116), (8, 117), (9, 118), (10, 119),
    (11, 121), (12, 120), (13, 123), (14, 122),
    
    -- Gampaha District nodes
    (15, 11), (16, 132), (17, 132), (18, 133), (19, 134),
    
    -- Kalutara District nodes
    (20, 12), (21, 141),
    
    -- Kandy District nodes
    (22, 13), (23, 151),
    
    -- Galle and Matara nodes
    (24, 16), (25, 17),
    
    -- Water Nodes to Geographic Areas
    (101, 10), (102, 10), (103, 10), (104, 10), (105, 100),
    (106, 102), (107, 105), (108, 115), (109, 116), (110, 118),
    (111, 121), (112, 133), (113, 11), (114, 130), (115, 12),
    (116, 141), (117, 13), (118, 151), (119, 16), (120, 17),
    
    -- Gas Nodes to Geographic Areas
    (201, 10), (202, 10), (203, 100), (204, 102), (205, 115),
    (206, 118), (207, 133), (208, 130), (209, 134), (210, 12),
    (211, 13), (212, 16), (213, 17);
    
    PRINT 'Area-Node mappings created successfully';
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
