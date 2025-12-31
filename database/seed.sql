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
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (10, 'Colombo District', 'District', 1),
    (11, 'Gampaha District', 'District', 1),
    (12, 'Kalutara District', 'District', 1);
    
    -- Central Province Districts
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (13, 'Kandy District', 'District', 2),
    (14, 'Matale District', 'District', 2),
    (15, 'Nuwara Eliya District', 'District', 2);
    
    -- Southern Province Districts
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (16, 'Galle District', 'District', 3),
    (17, 'Matara District', 'District', 3),
    (18, 'Hambantota District', 'District', 3);
    
    -- Northern Province Districts
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (19, 'Jaffna District', 'District', 4),
    (20, 'Kilinochchi District', 'District', 4),
    (21, 'Mannar District', 'District', 4),
    (22, 'Mullaitivu District', 'District', 4),
    (23, 'Vavuniya District', 'District', 4);
    
    -- Eastern Province Districts
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (24, 'Batticaloa District', 'District', 5),
    (25, 'Ampara District', 'District', 5),
    (26, 'Trincomalee District', 'District', 5);
    
    -- North Western Province Districts
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (27, 'Kurunegala District', 'District', 6),
    (28, 'Puttalam District', 'District', 6);
    
    -- North Central Province Districts
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (29, 'Anuradhapura District', 'District', 7),
    (30, 'Polonnaruwa District', 'District', 7);
    
    -- Uva Province Districts
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (31, 'Badulla District', 'District', 8),
    (32, 'Monaragala District', 'District', 8);
    
    -- Sabaragamuwa Province Districts
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (33, 'Ratnapura District', 'District', 9),
    (34, 'Kegalle District', 'District', 9);
    
    -- Divisions/Areas (Third Level - parent is District)
    -- Colombo District Divisions
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
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
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
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
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (140, 'Kalutara', 'Division', 12),
    (141, 'Panadura', 'Division', 12),
    (142, 'Wadduwa', 'Division', 12),
    (143, 'Aluthgama', 'Division', 12),
    (144, 'Beruwala', 'Division', 12),
    (145, 'Matugama', 'Division', 12),
    (146, 'Horana', 'Division', 12),
    (147, 'Bandaragama', 'Division', 12);
    
    -- Kandy District Divisions
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (150, 'Kandy', 'Division', 13),
    (151, 'Peradeniya', 'Division', 13),
    (152, 'Katugastota', 'Division', 13),
    (153, 'Kundasale', 'Division', 13);
    
    -- Matale District Divisions
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (160, 'Matale', 'Division', 14),
    (161, 'Dambulla', 'Division', 14),
    (162, 'Sigiriya', 'Division', 14);
    
    -- Nuwara Eliya District Divisions
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (170, 'Nuwara Eliya', 'Division', 15),
    (171, 'Hatton', 'Division', 15),
    (172, 'Talawakele', 'Division', 15);
    
    -- Galle District Divisions
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (180, 'Galle', 'Division', 16),
    (181, 'Unawatuna', 'Division', 16),
    (182, 'Hikkaduwa', 'Division', 16),
    (183, 'Ambalangoda', 'Division', 16);
    
    -- Matara District Divisions
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (190, 'Matara', 'Division', 17),
    (191, 'Weligama', 'Division', 17),
    (192, 'Mirissa', 'Division', 17);
    
    -- Hambantota District Divisions
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (200, 'Hambantota', 'Division', 18),
    (201, 'Tangalle', 'Division', 18),
    (202, 'Tissamaharama', 'Division', 18);
    
    -- Jaffna District Divisions
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
    (210, 'Jaffna', 'Division', 19),
    (211, 'Chavakachcheri', 'Division', 19),
    (212, 'Point Pedro', 'Division', 19);
    
    -- Other Districts - Main Towns as Divisions
    INSERT INTO dbo.GeoArea (geo_area_id, name, type, parent_geo_area_id) VALUES
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
