

/* ============================================================
   Government Utility Management System - SQL Server DDL
   Generated from Data Dictionary (Final)
   Target: Microsoft SQL Server
   ============================================================ */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* =========================
   1) Core Reference
   ========================= */

CREATE TABLE dbo.UtilityType (
    utility_type_id      BIGINT IDENTITY(1,1) NOT NULL,
    code                 VARCHAR(30) NOT NULL,
    name                 VARCHAR(80) NOT NULL,
    CONSTRAINT PK_UtilityType PRIMARY KEY (utility_type_id),
    CONSTRAINT UQ_UtilityType_code UNIQUE (code)
);
GO

CREATE TABLE dbo.GeoArea (
    geo_area_id          BIGINT IDENTITY(1,1) NOT NULL,
    name                 VARCHAR(120) NOT NULL,
    type                 VARCHAR(30) NOT NULL,
    parent_geo_area_id   BIGINT NULL,
    CONSTRAINT PK_GeoArea PRIMARY KEY (geo_area_id),
    CONSTRAINT FK_GeoArea_parent FOREIGN KEY (parent_geo_area_id)
        REFERENCES dbo.GeoArea(geo_area_id)
);
GO

CREATE TABLE dbo.PostalCodes (
    postal_code          VARCHAR(20) NOT NULL,
    city                 VARCHAR(120) NOT NULL,
    province             VARCHAR(120) NOT NULL,
    CONSTRAINT PK_PostalCodes PRIMARY KEY (postal_code)
);
GO

/* =========================
   2) HR & Payroll
   ========================= */

CREATE TABLE dbo.Department (
    department_id        BIGINT IDENTITY(1,1) NOT NULL,
    name                 VARCHAR(120) NOT NULL,
    utility_type_id      BIGINT NOT NULL,
    CONSTRAINT PK_Department PRIMARY KEY (department_id),
    CONSTRAINT UQ_Department_name UNIQUE (name),
    CONSTRAINT FK_Department_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id)
);
GO

CREATE TABLE dbo.Employee (
    employee_id          BIGINT IDENTITY(1,1) NOT NULL,
    first_name           VARCHAR(80) NOT NULL,
    middle_name          VARCHAR(80) NULL,
    last_name            VARCHAR(80) NOT NULL,
    employee_no          VARCHAR(30) NOT NULL,
    designation          VARCHAR(80) NOT NULL,
    role                 VARCHAR(80) NOT NULL,
    department_id        BIGINT NOT NULL,
    email                VARCHAR(255) NOT NULL,
    username             VARCHAR(80) NOT NULL,
    password_hash        VARCHAR(255) NOT NULL,
    last_login_at        DATETIME2(0) NULL,
    CONSTRAINT PK_Employee PRIMARY KEY (employee_id),
    CONSTRAINT UQ_Employee_employee_no UNIQUE (employee_no),
    CONSTRAINT UQ_Employee_email UNIQUE (email),
    CONSTRAINT UQ_Employee_username UNIQUE (username),
    CONSTRAINT FK_Employee_Department FOREIGN KEY (department_id)
        REFERENCES dbo.Department(department_id)
);
GO

CREATE TABLE dbo.EmployeePhoneNumber (
    employee_id          BIGINT NOT NULL,
    phone                VARCHAR(30) NOT NULL,
    CONSTRAINT PK_EmployeePhoneNumber PRIMARY KEY (employee_id, phone),
    CONSTRAINT FK_EmployeePhoneNumber_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

CREATE TABLE dbo.PayrollRun (
    payroll_run_id           BIGINT IDENTITY(1,1) NOT NULL,
    period_month             SMALLINT NOT NULL,
    period_year              SMALLINT NOT NULL,
    run_date                 DATE NOT NULL,
    status                   VARCHAR(20) NOT NULL,
    created_by_employee_id   BIGINT NOT NULL,
    CONSTRAINT PK_PayrollRun PRIMARY KEY (payroll_run_id),
    CONSTRAINT CK_PayrollRun_month CHECK (period_month BETWEEN 1 AND 12),
    CONSTRAINT CK_PayrollRun_year CHECK (period_year >= 2000),
    CONSTRAINT CK_PayrollRun_status CHECK (status IN ('DRAFT','PROCESSING','COMPLETED','CANCELLED')),
    CONSTRAINT FK_PayrollRun_CreatedBy FOREIGN KEY (created_by_employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

CREATE TABLE dbo.Payslip (
    payslip_id           BIGINT IDENTITY(1,1) NOT NULL,
    deductions           DECIMAL(12,2) NOT NULL,
    gross                DECIMAL(12,2) NOT NULL,
    employee_id          BIGINT NOT NULL,
    payroll_run_id       BIGINT NOT NULL,
    CONSTRAINT PK_Payslip PRIMARY KEY (payslip_id),
    CONSTRAINT CK_Payslip_gross CHECK (gross >= 0),
    CONSTRAINT CK_Payslip_deductions CHECK (deductions >= 0),
    CONSTRAINT FK_Payslip_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id),
    CONSTRAINT FK_Payslip_PayrollRun FOREIGN KEY (payroll_run_id)
        REFERENCES dbo.PayrollRun(payroll_run_id)
);
GO

CREATE TABLE dbo.SalaryComponentType (
    component_type_id    BIGINT IDENTITY(1,1) NOT NULL,
    name                 VARCHAR(80) NOT NULL,
    type                 VARCHAR(20) NOT NULL,
    CONSTRAINT PK_SalaryComponentType PRIMARY KEY (component_type_id),
    CONSTRAINT UQ_SalaryComponentType_name UNIQUE (name),
    CONSTRAINT CK_SalaryComponentType_type CHECK (type IN ('EARNING','DEDUCTION'))
);
GO

CREATE TABLE dbo.PayslipComponent (
    payslip_component_id  BIGINT IDENTITY(1,1) NOT NULL,
    name                  VARCHAR(120) NOT NULL,
    amount                DECIMAL(12,2) NOT NULL,
    payslip_id            BIGINT NOT NULL,
    component_type_id     BIGINT NOT NULL,
    CONSTRAINT PK_PayslipComponent PRIMARY KEY (payslip_component_id),
    CONSTRAINT FK_PayslipComponent_Payslip FOREIGN KEY (payslip_id)
        REFERENCES dbo.Payslip(payslip_id),
    CONSTRAINT FK_PayslipComponent_ComponentType FOREIGN KEY (component_type_id)
        REFERENCES dbo.SalaryComponentType(component_type_id)
);
GO

CREATE TABLE dbo.ReportRequest (
    report_request_id     BIGINT IDENTITY(1,1) NOT NULL,
    requested_at          DATETIME2(0) NOT NULL,
    report_type           VARCHAR(80) NOT NULL,
    params                NVARCHAR(MAX) NOT NULL,  -- JSON text
    employee_id           BIGINT NOT NULL,
    CONSTRAINT PK_ReportRequest PRIMARY KEY (report_request_id),
    CONSTRAINT FK_ReportRequest_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

CREATE TABLE dbo.Manager (
    employee_id          BIGINT NOT NULL,
    management_level     VARCHAR(30) NOT NULL,
    report_access_level  VARCHAR(30) NOT NULL,
    CONSTRAINT PK_Manager PRIMARY KEY (employee_id),
    CONSTRAINT FK_Manager_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

CREATE TABLE dbo.FieldOfficer (
    employee_id          BIGINT NOT NULL,
    service_area_type    VARCHAR(30) NOT NULL,
    shift_type           VARCHAR(30) NOT NULL,
    certification_level  VARCHAR(50) NULL,
    geo_area_id          BIGINT NOT NULL,
    CONSTRAINT PK_FieldOfficer PRIMARY KEY (employee_id),
    CONSTRAINT FK_FieldOfficer_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id),
    CONSTRAINT FK_FieldOfficer_GeoArea FOREIGN KEY (geo_area_id)
        REFERENCES dbo.GeoArea(geo_area_id)
);
GO

CREATE TABLE dbo.MeterReader (
    employee_id          BIGINT NOT NULL,
    device_id            VARCHAR(80) NULL,
    assigned_route_code  VARCHAR(50) NULL,
    CONSTRAINT PK_MeterReader PRIMARY KEY (employee_id),
    CONSTRAINT FK_MeterReader_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

CREATE TABLE dbo.Cashier (
    employee_id            BIGINT NOT NULL,
    can_override_charges   BIT NOT NULL CONSTRAINT DF_Cashier_override DEFAULT (0),
    can_approve_refunds    BIT NOT NULL CONSTRAINT DF_Cashier_refunds DEFAULT (0),
    CONSTRAINT PK_Cashier PRIMARY KEY (employee_id),
    CONSTRAINT FK_Cashier_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

CREATE TABLE dbo.AdministrativeStaff (
    employee_id              BIGINT NOT NULL,
    department               VARCHAR(120) NOT NULL,
    can_register_connections BIT NOT NULL CONSTRAINT DF_Admin_register DEFAULT (0),
    can_manage_tariffs       BIT NOT NULL CONSTRAINT DF_Admin_tariffs DEFAULT (0),
    CONSTRAINT PK_AdministrativeStaff PRIMARY KEY (employee_id),
    CONSTRAINT FK_AdministrativeStaff_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

/* =========================
   3) Customers & Connections
   ========================= */

CREATE TABLE dbo.CustomerAddress (
    customer_address_id   BIGINT IDENTITY(1,1) NOT NULL,
    postal_code           VARCHAR(20) NOT NULL,
    line1                 VARCHAR(200) NOT NULL,
    CONSTRAINT PK_CustomerAddress PRIMARY KEY (customer_address_id),
    CONSTRAINT FK_CustomerAddress_PostalCodes FOREIGN KEY (postal_code)
        REFERENCES dbo.PostalCodes(postal_code)
);
GO

CREATE TABLE dbo.Customer (
    customer_id          BIGINT IDENTITY(1,1) NOT NULL,
    first_name           VARCHAR(80) NOT NULL,
    middle_name          VARCHAR(80) NULL,
    last_name            VARCHAR(80) NOT NULL,
    password_hash        VARCHAR(255) NOT NULL,
    email                VARCHAR(255) NULL,
    customer_address_id  BIGINT NOT NULL,
    customer_type        VARCHAR(30) NOT NULL,
    registration_date    DATE NOT NULL,
    identity_type        VARCHAR(30) NOT NULL,
    identity_ref         VARCHAR(80) NOT NULL,
    employee_id          BIGINT NULL,   -- registered by staff
    tariff_category_id   BIGINT NULL,   -- default tariff (created later)
    CONSTRAINT PK_Customer PRIMARY KEY (customer_id),
    CONSTRAINT UQ_Customer_identity_ref UNIQUE (identity_ref),
    CONSTRAINT FK_Customer_Address FOREIGN KEY (customer_address_id)
        REFERENCES dbo.CustomerAddress(customer_address_id),
    CONSTRAINT FK_Customer_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
    -- FK to TariffCategory added after TariffCategory table creation
);
GO

CREATE TABLE dbo.CustomerPhoneNumbers (
    customer_id          BIGINT NOT NULL,
    phone                VARCHAR(30) NOT NULL,
    CONSTRAINT PK_CustomerPhoneNumbers PRIMARY KEY (customer_id, phone),
    CONSTRAINT FK_CustomerPhoneNumbers_Customer FOREIGN KEY (customer_id)
        REFERENCES dbo.Customer(customer_id)
);
GO

CREATE TABLE dbo.ConnectionAddress (
    connection_address_id BIGINT IDENTITY(1,1) NOT NULL,
    line1                 VARCHAR(200) NOT NULL,
    city                  VARCHAR(120) NOT NULL,
    postal_code           VARCHAR(20) NOT NULL,
    geo_area_id           BIGINT NOT NULL,
    CONSTRAINT PK_ConnectionAddress PRIMARY KEY (connection_address_id),
    CONSTRAINT FK_ConnectionAddress_GeoArea FOREIGN KEY (geo_area_id)
        REFERENCES dbo.GeoArea(geo_area_id)
);
GO

CREATE TABLE dbo.Meter (
    meter_id            BIGINT IDENTITY(1,1) NOT NULL,
    meter_serial_no     VARCHAR(80) NOT NULL,
    utility_type_id     BIGINT NOT NULL,
    installation_date   DATE NOT NULL,
    is_smart_meter      BIT NOT NULL CONSTRAINT DF_Meter_smart DEFAULT (0),
    status              VARCHAR(30) NOT NULL,
    CONSTRAINT PK_Meter PRIMARY KEY (meter_id),
    CONSTRAINT UQ_Meter_serial UNIQUE (meter_serial_no),
    CONSTRAINT FK_Meter_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id)
);
GO

/* Tariffs first (because Connection references TariffCategory) */
CREATE TABLE dbo.TariffCategory (
    tariff_category_id  BIGINT IDENTITY(1,1) NOT NULL,
    utility_type_id     BIGINT NOT NULL,
    code                VARCHAR(40) NOT NULL,
    name                VARCHAR(120) NOT NULL,
    description         NVARCHAR(MAX) NULL,
    is_subsidized       BIT NOT NULL CONSTRAINT DF_TariffCategory_sub DEFAULT (0),
    employee_id         BIGINT NULL,
    CONSTRAINT PK_TariffCategory PRIMARY KEY (tariff_category_id),
    CONSTRAINT UQ_TariffCategory_code UNIQUE (code),
    CONSTRAINT FK_TariffCategory_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id),
    CONSTRAINT FK_TariffCategory_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

ALTER TABLE dbo.Customer
ADD CONSTRAINT FK_Customer_TariffCategory FOREIGN KEY (tariff_category_id)
    REFERENCES dbo.TariffCategory(tariff_category_id);
GO

CREATE TABLE dbo.TariffSlab (
    slab_id             BIGINT IDENTITY(1,1) NOT NULL,
    from_unit           DECIMAL(14,3) NOT NULL,
    to_unit             DECIMAL(14,3) NULL,
    rate_per_unit       DECIMAL(12,4) NOT NULL,
    fixed_charge        DECIMAL(12,2) NOT NULL,
    valid_from          DATE NOT NULL,
    valid_to            DATE NULL,
    unit_price          DECIMAL(12,4) NULL,
    tariff_category_id  BIGINT NOT NULL,
    CONSTRAINT PK_TariffSlab PRIMARY KEY (slab_id),
    CONSTRAINT FK_TariffSlab_TariffCategory FOREIGN KEY (tariff_category_id)
        REFERENCES dbo.TariffCategory(tariff_category_id)
);
GO

/* Network */
CREATE TABLE dbo.NetworkNode (
    node_id            BIGINT IDENTITY(1,1) NOT NULL,
    name               VARCHAR(120) NOT NULL,
    status             VARCHAR(30) NOT NULL,
    node_type          VARCHAR(50) NOT NULL,
    utility_type_id    BIGINT NOT NULL,
    CONSTRAINT PK_NetworkNode PRIMARY KEY (node_id),
    CONSTRAINT FK_NetworkNode_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id)
);
GO

CREATE TABLE dbo.NetworkLink (
    link_id            BIGINT IDENTITY(1,1) NOT NULL,
    link_type          VARCHAR(50) NOT NULL,
    status             VARCHAR(30) NOT NULL,
    length_km          DECIMAL(10,3) NULL,
    diameter_mm        DECIMAL(10,2) NULL,
    to_node_id         BIGINT NOT NULL,
    from_node_id       BIGINT NOT NULL,
    max_capacity       DECIMAL(14,3) NULL,
    capacity_uom       VARCHAR(20) NULL,
    utility_type_id    BIGINT NOT NULL,
    CONSTRAINT PK_NetworkLink PRIMARY KEY (link_id),
    CONSTRAINT FK_NetworkLink_ToNode FOREIGN KEY (to_node_id)
        REFERENCES dbo.NetworkNode(node_id),
    CONSTRAINT FK_NetworkLink_FromNode FOREIGN KEY (from_node_id)
        REFERENCES dbo.NetworkNode(node_id),
    CONSTRAINT FK_NetworkLink_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id)
);
GO

CREATE TABLE dbo.AreaNode (
    node_id            BIGINT NOT NULL,
    geo_area_id        BIGINT NOT NULL,
    CONSTRAINT PK_AreaNode PRIMARY KEY (node_id, geo_area_id),
    CONSTRAINT FK_AreaNode_Node FOREIGN KEY (node_id)
        REFERENCES dbo.NetworkNode(node_id),
    CONSTRAINT FK_AreaNode_GeoArea FOREIGN KEY (geo_area_id)
        REFERENCES dbo.GeoArea(geo_area_id)
);
GO

/* Connection */
CREATE TABLE dbo.ServiceConnection (
    connection_id          BIGINT IDENTITY(1,1) NOT NULL,
    customer_id            BIGINT NOT NULL,
    utility_type_id        BIGINT NOT NULL,
    tariff_category_id     BIGINT NOT NULL,
    connection_status      VARCHAR(30) NOT NULL,
    meter_id               BIGINT NULL,
    connection_address_id  BIGINT NOT NULL,
    node_id                BIGINT NULL,
    CONSTRAINT PK_ServiceConnection PRIMARY KEY (connection_id),
    CONSTRAINT FK_ServiceConnection_Customer FOREIGN KEY (customer_id)
        REFERENCES dbo.Customer(customer_id),
    CONSTRAINT FK_ServiceConnection_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id),
    CONSTRAINT FK_ServiceConnection_TariffCategory FOREIGN KEY (tariff_category_id)
        REFERENCES dbo.TariffCategory(tariff_category_id),
    CONSTRAINT FK_ServiceConnection_Meter FOREIGN KEY (meter_id)
        REFERENCES dbo.Meter(meter_id),
    CONSTRAINT FK_ServiceConnection_Address FOREIGN KEY (connection_address_id)
        REFERENCES dbo.ConnectionAddress(connection_address_id),
    CONSTRAINT FK_ServiceConnection_Node FOREIGN KEY (node_id)
        REFERENCES dbo.NetworkNode(node_id)
);
GO


/* Meter readings */
CREATE TABLE dbo.MeterReading (
    reading_id         BIGINT IDENTITY(1,1) NOT NULL,
    reading_source     VARCHAR(30) NOT NULL,
    reading_date       DATETIME2(0) NOT NULL,
    import_reading     DECIMAL(14,3) NULL,
    prev_import_reading DECIMAL(14,3) NULL,
    export_reading     DECIMAL(14,3) NULL,
    prev_export_reading DECIMAL(14,3) NULL,
    created_at         DATETIME2(0) NOT NULL,
    device_id          VARCHAR(80) NULL,
    meter_id           BIGINT NOT NULL,
    meter_reader_id    BIGINT NULL,
    CONSTRAINT PK_MeterReading PRIMARY KEY (reading_id),
    CONSTRAINT FK_MeterReading_Meter FOREIGN KEY (meter_id)
        REFERENCES dbo.Meter(meter_id),
    CONSTRAINT FK_MeterReading_MeterReader FOREIGN KEY (meter_reader_id)
        REFERENCES dbo.MeterReader(employee_id)
);
GO

/* =========================
   4) Billing & Payments
   ========================= */

CREATE TABLE dbo.Bill (
    bill_id               BIGINT IDENTITY(1,1) NOT NULL,
    meter_id              BIGINT NOT NULL,
    billing_period_start  DATE NOT NULL,
    billing_period_end    DATE NOT NULL,
    bill_date             DATE NOT NULL,
    due_date              DATE NOT NULL,
    total_import_unit     DECIMAL(14,3) NOT NULL,
    total_export_unit     DECIMAL(14,3) NOT NULL CONSTRAINT DF_Bill_export DEFAULT (0),
    energy_charge_amount  DECIMAL(12,2) NOT NULL,
    fixed_charge_amount   DECIMAL(12,2) NOT NULL,
    subsidy_amount        DECIMAL(12,2) NOT NULL CONSTRAINT DF_Bill_subsidy DEFAULT (0),
    solar_export_credit   DECIMAL(12,2) NOT NULL CONSTRAINT DF_Bill_export_credit DEFAULT (0),
    CONSTRAINT PK_Bill PRIMARY KEY (bill_id),
    CONSTRAINT FK_Bill_Meter FOREIGN KEY (meter_id)
        REFERENCES dbo.Meter(meter_id)
);
GO

CREATE TABLE dbo.BillDetail (
    bill_detail_id     BIGINT IDENTITY(1,1) NOT NULL,
    slab_id            BIGINT NULL,
    units_in_slab      DECIMAL(14,3) NOT NULL,
    amount             DECIMAL(12,2) NOT NULL,
    bill_id            BIGINT NOT NULL,
    CONSTRAINT PK_BillDetail PRIMARY KEY (bill_detail_id),
    CONSTRAINT FK_BillDetail_Bill FOREIGN KEY (bill_id)
        REFERENCES dbo.Bill(bill_id),
    CONSTRAINT FK_BillDetail_TariffSlab FOREIGN KEY (slab_id)
        REFERENCES dbo.TariffSlab(slab_id)
);
GO

CREATE TABLE dbo.TaxConfig (
    tax_id            BIGINT IDENTITY(1,1) NOT NULL,
    tax_name          VARCHAR(120) NOT NULL,
    rate_percent      DECIMAL(6,3) NOT NULL,
    effective_from    DATE NOT NULL,
    effective_to      DATE NULL,
    status            VARCHAR(20) NOT NULL,
    CONSTRAINT PK_TaxConfig PRIMARY KEY (tax_id)
);
GO

CREATE TABLE dbo.BillTax (
    bill_tax_id            BIGINT IDENTITY(1,1) NOT NULL,
    rate_percent_applied   DECIMAL(6,3) NOT NULL,
    taxable_base_amount    DECIMAL(12,2) NOT NULL,
    bill_id                BIGINT NOT NULL,
    tax_id                 BIGINT NOT NULL,
    CONSTRAINT PK_BillTax PRIMARY KEY (bill_tax_id),
    CONSTRAINT FK_BillTax_Bill FOREIGN KEY (bill_id)
        REFERENCES dbo.Bill(bill_id),
    CONSTRAINT FK_BillTax_TaxConfig FOREIGN KEY (tax_id)
        REFERENCES dbo.TaxConfig(tax_id)
);
GO

CREATE TABLE dbo.Payment (
    payment_id        BIGINT IDENTITY(1,1) NOT NULL,
    payment_date      DATETIME2(0) NOT NULL,
    payment_amount    DECIMAL(12,2) NOT NULL,
    payment_method    VARCHAR(30) NOT NULL,
    payment_channel   VARCHAR(30) NULL,
    transaction_ref   VARCHAR(120) NULL,
    bill_id           BIGINT NOT NULL,
    employee_id       BIGINT NULL,
    customer_id       BIGINT NULL, -- keep if you want snapshot
    CONSTRAINT PK_Payment PRIMARY KEY (payment_id),
    CONSTRAINT FK_Payment_Bill FOREIGN KEY (bill_id)
        REFERENCES dbo.Bill(bill_id),
    CONSTRAINT FK_Payment_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id),
    CONSTRAINT FK_Payment_Customer FOREIGN KEY (customer_id)
        REFERENCES dbo.Customer(customer_id)
);
GO

/* =========================
   5) Subsidies & Solar
   ========================= */

CREATE TABLE dbo.SubsidyScheme (
    subsidy_id        BIGINT IDENTITY(1,1) NOT NULL,
    name              VARCHAR(120) NOT NULL,
    description       NVARCHAR(MAX) NULL,
    discount_type     VARCHAR(30) NOT NULL,
    discount_value    DECIMAL(12,4) NOT NULL,
    valid_from        DATE NOT NULL,
    valid_to          DATE NULL,
    CONSTRAINT PK_SubsidyScheme PRIMARY KEY (subsidy_id)
);
GO

CREATE TABLE dbo.CustomerSubsidy (
    customer_subsidy_id BIGINT IDENTITY(1,1) NOT NULL,
    approved_date       DATE NOT NULL,
    status              VARCHAR(20) NOT NULL,
    subsidy_id          BIGINT NOT NULL,
    employee_id         BIGINT NOT NULL,
    customer_id         BIGINT NOT NULL,
    CONSTRAINT PK_CustomerSubsidy PRIMARY KEY (customer_subsidy_id),
    CONSTRAINT FK_CustomerSubsidy_Subsidy FOREIGN KEY (subsidy_id)
        REFERENCES dbo.SubsidyScheme(subsidy_id),
    CONSTRAINT FK_CustomerSubsidy_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id),
    CONSTRAINT FK_CustomerSubsidy_Customer FOREIGN KEY (customer_id)
        REFERENCES dbo.Customer(customer_id)
);
GO

CREATE TABLE dbo.SubsidyApprove (
    employee_id       BIGINT NOT NULL,
    subsidy_id        BIGINT NOT NULL,
    CONSTRAINT PK_SubsidyApprove PRIMARY KEY (employee_id, subsidy_id),
    CONSTRAINT FK_SubsidyApprove_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id),
    CONSTRAINT FK_SubsidyApprove_Subsidy FOREIGN KEY (subsidy_id)
        REFERENCES dbo.SubsidyScheme(subsidy_id)
);
GO

CREATE TABLE dbo.SolarInstallation (
    solar_id                 BIGINT IDENTITY(1,1) NOT NULL,
    meter_id                 BIGINT NOT NULL,
    scheme_type              VARCHAR(30) NOT NULL,
    installation_date        DATE NOT NULL,
    installation_capacity_kw DECIMAL(10,3) NOT NULL,
    installer_company        VARCHAR(150) NULL,
    approval_ref             VARCHAR(120) NULL,
    agreement_start_date     DATE NULL,
    agreement_end_date       DATE NULL,
    status                   VARCHAR(20) NOT NULL,
    employee_id              BIGINT NULL,
    connection_id            BIGINT NOT NULL,
    CONSTRAINT PK_SolarInstallation PRIMARY KEY (solar_id),
    CONSTRAINT FK_SolarInstallation_Meter FOREIGN KEY (meter_id)
        REFERENCES dbo.Meter(meter_id),
    CONSTRAINT FK_SolarInstallation_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id),
    CONSTRAINT FK_SolarInstallation_ServiceConnection FOREIGN KEY (connection_id)
        REFERENCES dbo.ServiceConnection(connection_id)

);
GO

/* =========================
   6) Generation & Storage & Quality
   ========================= */



/* Inventory tables required for FK above; create ItemCategory/Item now */
CREATE TABLE dbo.ItemCategory (
    item_category_id    BIGINT IDENTITY(1,1) NOT NULL,
    name                VARCHAR(120) NOT NULL,
    category_type       VARCHAR(30) NOT NULL,
    utility_type_id     BIGINT NULL,
    CONSTRAINT PK_ItemCategory PRIMARY KEY (item_category_id),
    CONSTRAINT FK_ItemCategory_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id)
);
GO

CREATE TABLE dbo.Item (
    item_id               BIGINT IDENTITY(1,1) NOT NULL,
    storage_requirements  NVARCHAR(MAX) NULL,
    shelf_life_days       INT NULL,
    hazard_class          VARCHAR(50) NULL,
    is_consumable         BIT NOT NULL CONSTRAINT DF_Item_consumable DEFAULT (0),
    standard_unit_cost    DECIMAL(12,2) NOT NULL,
    uom                   VARCHAR(20) NOT NULL,
    name                  VARCHAR(150) NOT NULL,
    item_category_id      BIGINT NOT NULL,
    CONSTRAINT PK_Item PRIMARY KEY (item_id),
    CONSTRAINT FK_Item_ItemCategory FOREIGN KEY (item_category_id)
        REFERENCES dbo.ItemCategory(item_category_id)
);
GO

CREATE TABLE dbo.SiteStorageLocation (
    storage_location_id  BIGINT IDENTITY(1,1) NOT NULL,
    storage_type         VARCHAR(50) NOT NULL,
    name                 VARCHAR(120) NOT NULL,
    status               VARCHAR(30) NOT NULL,
    item_id              BIGINT NOT NULL,
    capacity_uom         VARCHAR(20) NOT NULL,
    capacity_qty         DECIMAL(14,3) NOT NULL,
    CONSTRAINT PK_SiteStorageLocation PRIMARY KEY (storage_location_id),
    CONSTRAINT FK_SiteStorageLocation_Item FOREIGN KEY (item_id)
        REFERENCES dbo.Item(item_id) -- Item created later; constraint added after Item creation if needed
);
GO

/* Fix FK for SiteStorageLocation -> Item (created after Item) */
ALTER TABLE dbo.SiteStorageLocation
DROP CONSTRAINT FK_SiteStorageLocation_Item;
GO
ALTER TABLE dbo.SiteStorageLocation
ADD CONSTRAINT FK_SiteStorageLocation_Item FOREIGN KEY (item_id)
    REFERENCES dbo.Item(item_id);
GO

CREATE TABLE dbo.GenerationSite (
    generation_site_id   BIGINT IDENTITY(1,1) NOT NULL,
    name                 VARCHAR(150) NOT NULL,
    site_type            VARCHAR(50) NOT NULL,
    status               VARCHAR(30) NOT NULL,
    commissioned_date    DATE NULL,
    storage_location_id  BIGINT NULL,
    nameplate_capacity   DECIMAL(14,3) NULL,
    capacity_uom         VARCHAR(20) NULL,
    utility_type_id      BIGINT NOT NULL,
    CONSTRAINT PK_GenerationSite PRIMARY KEY (generation_site_id),
    CONSTRAINT FK_GenerationSite_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id),
    CONSTRAINT FK_GenerationSite_StorageLocation FOREIGN KEY (storage_location_id)
        REFERENCES dbo.SiteStorageLocation(storage_location_id)
);
GO

CREATE TABLE dbo.GenerationUnit (
    generation_unit_id   BIGINT IDENTITY(1,1) NOT NULL,
    status               VARCHAR(30) NOT NULL,
    capacity_uom         VARCHAR(20) NOT NULL,
    unit_capacity        DECIMAL(14,3) NOT NULL,
    generation_site_id   BIGINT NOT NULL,
    CONSTRAINT PK_GenerationUnit PRIMARY KEY (generation_unit_id),
    CONSTRAINT FK_GenerationUnit_Site FOREIGN KEY (generation_site_id)
        REFERENCES dbo.GenerationSite(generation_site_id)
);
GO

CREATE TABLE dbo.GenerationOutputReading (
    output_reading_id    BIGINT IDENTITY(1,1) NOT NULL,
    reading_ts           DATETIME2(0) NOT NULL,
    output_value         DECIMAL(14,3) NOT NULL,
    output_uom           VARCHAR(20) NOT NULL,
    quality_flag         VARCHAR(20) NOT NULL,
    generation_unit_id   BIGINT NOT NULL,
    CONSTRAINT PK_GenerationOutputReading PRIMARY KEY (output_reading_id),
    CONSTRAINT FK_GenerationOutputReading_Unit FOREIGN KEY (generation_unit_id)
        REFERENCES dbo.GenerationUnit(generation_unit_id)
);
GO

CREATE TABLE dbo.OperationRun (
    operation_run_id     BIGINT IDENTITY(1,1) NOT NULL,
    generation_unit_id   BIGINT NULL,
    generation_site_id   BIGINT NOT NULL,
    output_qty           DECIMAL(14,3) NULL,
    run_status           VARCHAR(20) NOT NULL,
    notes                NVARCHAR(MAX) NULL,
    output_uom           VARCHAR(20) NULL,
    start_ts             DATETIME2(0) NOT NULL,
    end_ts               DATETIME2(0) NULL,
    CONSTRAINT PK_OperationRun PRIMARY KEY (operation_run_id),
    CONSTRAINT FK_OperationRun_Unit FOREIGN KEY (generation_unit_id)
        REFERENCES dbo.GenerationUnit(generation_unit_id),
    CONSTRAINT FK_OperationRun_Site FOREIGN KEY (generation_site_id)
        REFERENCES dbo.GenerationSite(generation_site_id)
);
GO

/* =========================
   7) Warehouse & Stock
   ========================= */

CREATE TABLE dbo.Warehouse (
    warehouse_id        BIGINT IDENTITY(1,1) NOT NULL,
    name                VARCHAR(150) NOT NULL,
    status              VARCHAR(30) NOT NULL,
    geo_area_id         BIGINT NOT NULL,
    CONSTRAINT PK_Warehouse PRIMARY KEY (warehouse_id),
    CONSTRAINT FK_Warehouse_GeoArea FOREIGN KEY (geo_area_id)
        REFERENCES dbo.GeoArea(geo_area_id)
);
GO

CREATE TABLE dbo.WarehouseStock (
    warehouse_id        BIGINT NOT NULL,
    item_id             BIGINT NOT NULL,
    last_stocktake_ts   DATETIME2(0) NULL,
    reorder_level       DECIMAL(14,3) NULL,
    reserved_qty        DECIMAL(14,3) NOT NULL CONSTRAINT DF_WarehouseStock_reserved DEFAULT (0),
    on_hand_qty         DECIMAL(14,3) NOT NULL,
    CONSTRAINT PK_WarehouseStock PRIMARY KEY (warehouse_id, item_id),
    CONSTRAINT FK_WarehouseStock_Warehouse FOREIGN KEY (warehouse_id)
        REFERENCES dbo.Warehouse(warehouse_id),
    CONSTRAINT FK_WarehouseStock_Item FOREIGN KEY (item_id)
        REFERENCES dbo.Item(item_id)
);
GO

/* StockTransaction */
CREATE TABLE dbo.StockTransaction (
    stock_txn_id              BIGINT IDENTITY(1,1) NOT NULL,
    txn_type                  VARCHAR(30) NOT NULL,
    reference_id              BIGINT NULL,
    reference_type            VARCHAR(30) NULL,
    txn_ts                    DATETIME2(0) NOT NULL,
    unit_cost                 DECIMAL(12,2) NOT NULL,
    qty                       DECIMAL(14,3) NOT NULL,
    warehouse_id              BIGINT NOT NULL,
    work_order_item_usage_id  BIGINT NULL,
    CONSTRAINT PK_StockTransaction PRIMARY KEY (stock_txn_id),
    CONSTRAINT FK_StockTransaction_Warehouse FOREIGN KEY (warehouse_id)
        REFERENCES dbo.Warehouse(warehouse_id)
    -- FK to WorkOrderItemUsage added after WorkOrderItemUsage is created
);
GO

CREATE TABLE dbo.ItemStockTransaction (
    stock_txn_id         BIGINT NOT NULL,
    item_id              BIGINT NOT NULL,
    CONSTRAINT PK_ItemStockTransaction PRIMARY KEY (stock_txn_id, item_id),
    CONSTRAINT FK_ItemStockTransaction_StockTxn FOREIGN KEY (stock_txn_id)
        REFERENCES dbo.StockTransaction(stock_txn_id),
    CONSTRAINT FK_ItemStockTransaction_Item FOREIGN KEY (item_id)
        REFERENCES dbo.Item(item_id)
);
GO

/* =========================
   8) Maintenance & Work Orders
   ========================= */

CREATE TABLE dbo.Asset (
    asset_id           BIGINT IDENTITY(1,1) NOT NULL,
    name               VARCHAR(150) NOT NULL,
    asset_type         VARCHAR(50) NOT NULL,
    status             VARCHAR(30) NOT NULL,
    utility_type_id    BIGINT NOT NULL,
    CONSTRAINT PK_Asset PRIMARY KEY (asset_id),
    CONSTRAINT FK_Asset_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id)
);
GO

CREATE TABLE dbo.MaintenanceRequest (
    request_id               BIGINT IDENTITY(1,1) NOT NULL,
    requested_by_customer_id BIGINT NULL,
    request_ts               DATETIME2(0) NOT NULL,
    priority                 VARCHAR(20) NOT NULL,
    issue_type               VARCHAR(50) NOT NULL,
    description              NVARCHAR(MAX) NOT NULL,
    output_uom               VARCHAR(20) NULL,
    geo_area_id              BIGINT NOT NULL,
    utility_type_id          BIGINT NOT NULL,
    CONSTRAINT PK_MaintenanceRequest PRIMARY KEY (request_id),
    CONSTRAINT FK_MaintenanceRequest_Customer FOREIGN KEY (requested_by_customer_id)
        REFERENCES dbo.Customer(customer_id),
    CONSTRAINT FK_MaintenanceRequest_GeoArea FOREIGN KEY (geo_area_id)
        REFERENCES dbo.GeoArea(geo_area_id),
    CONSTRAINT FK_MaintenanceRequest_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id)
);
GO

CREATE TABLE dbo.WorkOrder (
    work_order_id        BIGINT IDENTITY(1,1) NOT NULL,
    opened_ts            DATETIME2(0) NOT NULL,
    scheduled_start_ts   DATETIME2(0) NULL,
    resolution_notes     NVARCHAR(MAX) NULL,
    work_order_status    VARCHAR(30) NOT NULL,
    closed_ts            DATETIME2(0) NULL,
    scheduled_end_ts     DATETIME2(0) NULL,
    asset_id             BIGINT NULL,
    request_id           BIGINT NULL,
    geo_area_id          BIGINT NOT NULL,
    CONSTRAINT PK_WorkOrder PRIMARY KEY (work_order_id),
    CONSTRAINT FK_WorkOrder_Asset FOREIGN KEY (asset_id)
        REFERENCES dbo.Asset(asset_id),
    CONSTRAINT FK_WorkOrder_Request FOREIGN KEY (request_id)
        REFERENCES dbo.MaintenanceRequest(request_id),
    CONSTRAINT FK_WorkOrder_GeoArea FOREIGN KEY (geo_area_id)
        REFERENCES dbo.GeoArea(geo_area_id)
);
GO

CREATE TABLE dbo.WorkOrderLabor (
    work_order_labor_id     BIGINT IDENTITY(1,1) NOT NULL,
    work_date               DATE NOT NULL,
    hours                   DECIMAL(6,2) NOT NULL,
    hourly_rate_snapshot    DECIMAL(12,2) NOT NULL,
    work_order_id           BIGINT NOT NULL,
    CONSTRAINT PK_WorkOrderLabor PRIMARY KEY (work_order_labor_id),
    CONSTRAINT CK_WorkOrderLabor_hours CHECK (hours >= 0),
    CONSTRAINT FK_WorkOrderLabor_WorkOrder FOREIGN KEY (work_order_id)
        REFERENCES dbo.WorkOrder(work_order_id)
);
GO

CREATE TABLE dbo.WorkOrderLaborEmployee (
    work_order_labor_id  BIGINT NOT NULL,
    employee_id          BIGINT NOT NULL,
    CONSTRAINT PK_WorkOrderLaborEmployee PRIMARY KEY (work_order_labor_id, employee_id),
    CONSTRAINT FK_WOLE_Labor FOREIGN KEY (work_order_labor_id)
        REFERENCES dbo.WorkOrderLabor(work_order_labor_id),
    CONSTRAINT FK_WOLE_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

CREATE TABLE dbo.WorkOrderItemUsage (
    work_order_item_usage_id BIGINT IDENTITY(1,1) NOT NULL,
    qty_used                 DECIMAL(14,3) NOT NULL,
    unit_cost_snapshot       DECIMAL(12,2) NOT NULL,
    item_cost_amount         DECIMAL(12,2) NOT NULL,
    issued_ts                DATETIME2(0) NOT NULL,
    stock_txn_id             BIGINT NULL,
    work_order_id            BIGINT NOT NULL,
    item_id                  BIGINT NOT NULL,
    warehouse_id             BIGINT NOT NULL,
    CONSTRAINT PK_WorkOrderItemUsage PRIMARY KEY (work_order_item_usage_id),
    CONSTRAINT FK_WOIU_WorkOrder FOREIGN KEY (work_order_id)
        REFERENCES dbo.WorkOrder(work_order_id),
    CONSTRAINT FK_WOIU_Item FOREIGN KEY (item_id)
        REFERENCES dbo.Item(item_id),
    CONSTRAINT FK_WOIU_Warehouse FOREIGN KEY (warehouse_id)
        REFERENCES dbo.Warehouse(warehouse_id),
    CONSTRAINT FK_WOIU_StockTxn FOREIGN KEY (stock_txn_id)
        REFERENCES dbo.StockTransaction(stock_txn_id)
);
GO

ALTER TABLE dbo.StockTransaction
ADD CONSTRAINT FK_StockTransaction_WorkOrderItemUsage FOREIGN KEY (work_order_item_usage_id)
    REFERENCES dbo.WorkOrderItemUsage(work_order_item_usage_id);
GO

CREATE TABLE dbo.AssetOutage (
    outage_id          BIGINT IDENTITY(1,1) NOT NULL,
    outage_type        VARCHAR(20) NOT NULL,
    start_ts           DATETIME2(0) NOT NULL,
    end_ts             DATETIME2(0) NULL,
    reason             NVARCHAR(MAX) NULL,
    derate_percent     DECIMAL(5,2) NULL,
    asset_id           BIGINT NOT NULL,
    CONSTRAINT PK_AssetOutage PRIMARY KEY (outage_id),
    CONSTRAINT CK_AssetOutage_derate CHECK (derate_percent IS NULL OR (derate_percent BETWEEN 0 AND 100)),
    CONSTRAINT FK_AssetOutage_Asset FOREIGN KEY (asset_id)
        REFERENCES dbo.Asset(asset_id)
);
GO

CREATE TABLE dbo.Outage (
    outage_id          BIGINT IDENTITY(1,1) NOT NULL,
    reason             NVARCHAR(MAX) NULL,
    utility_type_id    BIGINT NOT NULL,
    start_time         DATETIME2(0) NOT NULL,
    end_time           DATETIME2(0) NULL,
    outage_type        VARCHAR(30) NOT NULL,
    employee_id        BIGINT NULL,
    CONSTRAINT PK_Outage PRIMARY KEY (outage_id),
    CONSTRAINT FK_Outage_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id),
    CONSTRAINT FK_Outage_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

CREATE TABLE dbo.DisconnectionOrder (
    disconnection_id   BIGINT IDENTITY(1,1) NOT NULL,
    reason             NVARCHAR(MAX) NULL,
    issue_date         DATE NOT NULL,
    scheduled_date     DATE NULL,
    executed_date      DATE NULL,
    status             VARCHAR(20) NOT NULL,
    connection_id      BIGINT NOT NULL,
    employee_id        BIGINT NOT NULL,
    CONSTRAINT PK_DisconnectionOrder PRIMARY KEY (disconnection_id),
    CONSTRAINT FK_DisconnectionOrder_ServiceConnection FOREIGN KEY (connection_id)
        REFERENCES dbo.ServiceConnection(connection_id),
    CONSTRAINT FK_DisconnectionOrder_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

CREATE TABLE dbo.ReconnectionOrder (
    reconnection_id    BIGINT IDENTITY(1,1) NOT NULL,
    reconnection_date  DATE NULL,
    reconnection_fee   DECIMAL(12,2) NOT NULL CONSTRAINT DF_Reconnection_fee DEFAULT (0),
    scheduled_date     DATE NULL,
    status             VARCHAR(20) NOT NULL,
    connection_id      BIGINT NOT NULL,
    employee_id        BIGINT NOT NULL,
    CONSTRAINT PK_ReconnectionOrder PRIMARY KEY (reconnection_id),
    CONSTRAINT FK_ReconnectionOrder_ServiceConnection FOREIGN KEY (connection_id)
        REFERENCES dbo.ServiceConnection(connection_id),
    CONSTRAINT FK_ReconnectionOrder_Employee FOREIGN KEY (employee_id)
        REFERENCES dbo.Employee(employee_id)
);
GO

CREATE TABLE dbo.Complaints (
    complaint_id          BIGINT IDENTITY(1,1) NOT NULL,
    complaint_type        VARCHAR(50) NOT NULL,
    created_date          DATETIME2(0) NOT NULL,
    resolved_date         DATETIME2(0) NULL,
    status                VARCHAR(20) NOT NULL,
    description           NVARCHAR(MAX) NOT NULL,
    assigned_employee_id  BIGINT NULL,
    customer_id           BIGINT NOT NULL,
    CONSTRAINT PK_Complaints PRIMARY KEY (complaint_id),
    CONSTRAINT FK_Complaints_Employee FOREIGN KEY (assigned_employee_id)
        REFERENCES dbo.Employee(employee_id),
    CONSTRAINT FK_Complaints_Customer FOREIGN KEY (customer_id)
        REFERENCES dbo.Customer(customer_id)
);
GO

/* =========================
   9) Fleet
   ========================= */

CREATE TABLE dbo.Vehicle (
    vehicle_id        BIGINT IDENTITY(1,1) NOT NULL,
    vehicle_type      VARCHAR(50) NOT NULL,
    reg_no            VARCHAR(40) NOT NULL,
    fuel_type         VARCHAR(30) NULL,
    make              VARCHAR(80) NULL,
    model             VARCHAR(80) NULL,
    purchase_date     DATE NULL,
    capacity_notes    NVARCHAR(MAX) NULL,
    status            VARCHAR(30) NOT NULL,
    geo_area_id       BIGINT NOT NULL,
    CONSTRAINT PK_Vehicle PRIMARY KEY (vehicle_id),
    CONSTRAINT UQ_Vehicle_reg UNIQUE (reg_no),
    CONSTRAINT FK_Vehicle_GeoArea FOREIGN KEY (geo_area_id)
        REFERENCES dbo.GeoArea(geo_area_id)
);
GO

CREATE TABLE dbo.VehicleServiceEvent (
    vehicle_service_event_id BIGINT IDENTITY(1,1) NOT NULL,
    service_date             DATE NOT NULL,
    service_type             VARCHAR(80) NOT NULL,
    cost_amount              DECIMAL(12,2) NOT NULL,
    description              NVARCHAR(MAX) NULL,
    odometer                 INT NULL,
    vehicle_id               BIGINT NOT NULL,
    CONSTRAINT PK_VehicleServiceEvent PRIMARY KEY (vehicle_service_event_id),
    CONSTRAINT FK_VehicleServiceEvent_Vehicle FOREIGN KEY (vehicle_id)
        REFERENCES dbo.Vehicle(vehicle_id)
);
GO

CREATE TABLE dbo.VehicleAssignment (
    vehicle_assignment_id BIGINT IDENTITY(1,1) NOT NULL,
    fuel_cost_amount      DECIMAL(12,2) NOT NULL CONSTRAINT DF_VehicleAssignment_fuel DEFAULT (0),
    assigned_from_ts      DATETIME2(0) NOT NULL,
    assigned_to_ts        DATETIME2(0) NULL,
    usage_notes           NVARCHAR(MAX) NULL,
    vehicle_id            BIGINT NOT NULL,
    work_order_id         BIGINT NOT NULL,
    CONSTRAINT PK_VehicleAssignment PRIMARY KEY (vehicle_assignment_id),
    CONSTRAINT FK_VehicleAssignment_Vehicle FOREIGN KEY (vehicle_id)
        REFERENCES dbo.Vehicle(vehicle_id),
    CONSTRAINT FK_VehicleAssignment_WorkOrder FOREIGN KEY (work_order_id)
        REFERENCES dbo.WorkOrder(work_order_id)
);
GO

/* =========================
   10) Zone Supply Metering
   ========================= */

CREATE TABLE dbo.ZoneSupplyMeter (
    zone_supply_meter_id BIGINT IDENTITY(1,1) NOT NULL,
    installed_date       DATE NULL,
    status               VARCHAR(30) NOT NULL,
    node_id              BIGINT NULL,
    utility_type_id      BIGINT NOT NULL,
    CONSTRAINT PK_ZoneSupplyMeter PRIMARY KEY (zone_supply_meter_id),
    CONSTRAINT FK_ZoneSupplyMeter_Node FOREIGN KEY (node_id)
        REFERENCES dbo.NetworkNode(node_id),
    CONSTRAINT FK_ZoneSupplyMeter_UtilityType FOREIGN KEY (utility_type_id)
        REFERENCES dbo.UtilityType(utility_type_id)
);
GO

CREATE TABLE dbo.ZoneSupplyReading (
    zone_supply_reading_id BIGINT IDENTITY(1,1) NOT NULL,
    uom                    VARCHAR(20) NOT NULL,
    value                  DECIMAL(14,3) NOT NULL,
    reading_ts             DATETIME2(0) NOT NULL,
    zone_supply_meter_id   BIGINT NOT NULL,
    CONSTRAINT PK_ZoneSupplyReading PRIMARY KEY (zone_supply_reading_id),
    CONSTRAINT FK_ZoneSupplyReading_Meter FOREIGN KEY (zone_supply_meter_id)
        REFERENCES dbo.ZoneSupplyMeter(zone_supply_meter_id)
);
GO

/* =========================
   11) Water Quality
   ========================= */

CREATE TABLE dbo.WaterQualityTest (
    quality_test_id     BIGINT IDENTITY(1,1) NOT NULL,
    sample_ts           DATETIME2(0) NOT NULL,
    parameter           VARCHAR(50) NOT NULL,
    value               DECIMAL(14,4) NOT NULL,
    uom                 VARCHAR(20) NOT NULL,
    generation_site_id  BIGINT NOT NULL,
    CONSTRAINT PK_WaterQualityTest PRIMARY KEY (quality_test_id),
    CONSTRAINT FK_WaterQualityTest_Site FOREIGN KEY (generation_site_id)
        REFERENCES dbo.GenerationSite(generation_site_id)
);
GO

/* =========================
   12) Operation Input Consumption
   ========================= */

CREATE TABLE dbo.OperationInputConsumption (
    operation_input_id     BIGINT IDENTITY(1,1) NOT NULL,
    item_id                BIGINT NOT NULL,
    stock_txn_id           BIGINT NULL,
    consumed_ts            DATETIME2(0) NOT NULL,
    total_cost_amount      DECIMAL(12,2) NOT NULL,
    unit_cost_snapshot     DECIMAL(12,2) NOT NULL,
    uom                    VARCHAR(20) NOT NULL,
    qty_used               DECIMAL(14,3) NOT NULL,
    storage_location_id    BIGINT NULL,
    operation_run_id       BIGINT NOT NULL,
    CONSTRAINT PK_OperationInputConsumption PRIMARY KEY (operation_input_id),
    CONSTRAINT FK_OperationInputConsumption_Item FOREIGN KEY (item_id)
        REFERENCES dbo.Item(item_id),
    CONSTRAINT FK_OperationInputConsumption_StockTxn FOREIGN KEY (stock_txn_id)
        REFERENCES dbo.StockTransaction(stock_txn_id),
    CONSTRAINT FK_OperationInputConsumption_StorageLocation FOREIGN KEY (storage_location_id)
        REFERENCES dbo.SiteStorageLocation(storage_location_id),
    CONSTRAINT FK_OperationInputConsumption_Run FOREIGN KEY (operation_run_id)
        REFERENCES dbo.OperationRun(operation_run_id)
);
GO

/* =========================
   Helpful indexes (optional)
   ========================= */

CREATE INDEX IX_Bill_meter_period ON dbo.Bill(meter_id, billing_period_start, billing_period_end);
CREATE INDEX IX_MeterReading_meter_date ON dbo.MeterReading(meter_id, reading_date);
CREATE INDEX IX_WorkOrder_geo_status ON dbo.WorkOrder(geo_area_id, work_order_status);
CREATE INDEX IX_StockTransaction_warehouse_ts ON dbo.StockTransaction(warehouse_id, txn_ts);
GO


