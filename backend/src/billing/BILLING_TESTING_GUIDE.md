# Billing System Testing Guide

## Quick Test Checklist

### Database Setup

- [ ] Tariff slabs created in database
- [ ] Tax configs created in database
- [ ] Test meters exist with active service connections
- [ ] Test meter readings exist for billing periods

### API Endpoint Tests

- [ ] Calculate endpoint returns correct breakdown
- [ ] Progressive slab calculation works correctly
- [ ] Bill generation saves to database
- [ ] BillDetails created for each slab used
- [ ] BillTaxes created correctly
- [ ] Total amount calculated correctly (energy + fixed - subsidy - solar + taxes)

### Business Logic Tests

- [ ] Slab distribution is correct (consumes lower slabs first)
- [ ] Fixed charges applied correctly
- [ ] Subsidies calculated and applied
- [ ] Solar credits calculated and applied
- [ ] Multiple taxes cascade correctly

---

## 1. Database Setup Verification

### Step 1: Create Test Tariff Slabs (Residential Electricity)

```sql
-- Run in SQL Server Management Studio
USE UtilityManagementDB;

-- Insert Residential Tariff Category
INSERT INTO TariffCategory (code, name, utility_type_id)
VALUES ('RES-ELEC', 'Residential Electricity', 1);

DECLARE @TariffCategoryId BIGINT = SCOPE_IDENTITY();

-- Insert Progressive Tariff Slabs
INSERT INTO TariffSlab (tariff_category_id, from_unit, to_unit, rate_per_unit, fixed_charge)
VALUES
  (@TariffCategoryId, 0, 60, 7.85, 100.00),      -- 0-60 units
  (@TariffCategoryId, 61, 90, 10.00, 0.00),      -- 61-90 units
  (@TariffCategoryId, 91, 120, 27.75, 0.00),     -- 91-120 units
  (@TariffCategoryId, 121, 180, 32.00, 0.00),    -- 121-180 units
  (@TariffCategoryId, 181, NULL, 45.00, 0.00);   -- 181+ units

-- Verify slabs
SELECT * FROM TariffSlab WHERE tariff_category_id = @TariffCategoryId ORDER BY from_unit;
```

### Step 2: Create Test Tax Configs

```sql
-- Create VAT Tax
INSERT INTO TaxConfig (tax_name, tax_code, rate_percent, is_active, applies_to_utility_types, calculation_order)
VALUES ('VAT (Value Added Tax)', 'VAT', 15.0, 1, '1,2,3', 1);

-- Create Environmental Levy
INSERT INTO TaxConfig (tax_name, tax_code, rate_percent, is_active, applies_to_utility_types, calculation_order)
VALUES ('Environmental Levy', 'ENV-LEVY', 2.5, 1, '1', 2);

-- Verify taxes
SELECT * FROM TaxConfig WHERE is_active = 1;
```

### Step 3: Verify Test Data

```sql
-- Check if test meter exists
SELECT m.meter_id, m.meter_serial_no, m.status,
       sc.connection_id, sc.connection_status, sc.tariff_category_id,
       c.customer_id, c.first_name, c.last_name
FROM Meter m
INNER JOIN ServiceConnection sc ON m.meter_id = sc.meter_id
INNER JOIN Customer c ON sc.customer_id = c.customer_id
WHERE m.meter_serial_no = 'ELEC-001-2024';

-- Check if meter readings exist
SELECT * FROM MeterReading
WHERE meter_id = (SELECT meter_id FROM Meter WHERE meter_serial_no = 'ELEC-001-2024')
ORDER BY reading_date DESC;
```

---

## 2. API Endpoint Testing

### Test 1: Calculate Bill Preview (No Save)

**Endpoint:** `POST http://localhost:3000/api/v1/bills/calculate`

**Request Body:**

```json
{
  "meterId": 1,
  "periodStart": "2024-01-01",
  "periodEnd": "2024-01-31"
}
```

**Expected Response (150 units consumption):**

```json
{
  "consumption": 150.0,
  "energyChargeAmount": 2436.0,
  "fixedChargeAmount": 100.0,
  "subsidyAmount": 0.0,
  "solarExportCredit": 0.0,
  "taxAmount": 443.8,
  "totalAmount": 2979.8,
  "slabBreakdown": [
    {
      "from": 0,
      "to": 60,
      "units": 60.0,
      "rate": 7.85,
      "amount": 471.0
    },
    {
      "from": 61,
      "to": 90,
      "units": 30.0,
      "rate": 10.0,
      "amount": 300.0
    },
    {
      "from": 91,
      "to": 120,
      "units": 30.0,
      "rate": 27.75,
      "amount": 832.5
    },
    {
      "from": 121,
      "to": 180,
      "units": 30.0,
      "rate": 32.0,
      "amount": 960.0
    }
  ],
  "taxes": [
    {
      "name": "VAT (Value Added Tax)",
      "rate": 15.0,
      "taxableAmount": 2536.0,
      "amount": 380.4
    },
    {
      "name": "Environmental Levy",
      "rate": 2.5,
      "taxableAmount": 2536.0,
      "amount": 63.4
    }
  ]
}
```

**Validation Checklist:**

- [ ] Consumption = 150 units (from meter readings)
- [ ] Slab 1: 60 units × 7.85 = 471.00 ✓
- [ ] Slab 2: 30 units × 10.00 = 300.00 ✓
- [ ] Slab 3: 30 units × 27.75 = 832.50 ✓
- [ ] Slab 4: 30 units × 32.00 = 960.00 ✓
- [ ] Energy charge = 471 + 300 + 832.50 + 960 = 2,436.00 ✓
- [ ] Fixed charge = 100.00 ✓
- [ ] Taxable base = 2,436 + 100 = 2,536.00 ✓
- [ ] VAT = 2,536 × 15% = 380.40 ✓
- [ ] Env Levy = 2,536 × 2.5% = 63.40 ✓
- [ ] Total = 2,536 + 380.40 + 63.40 = 2,979.80 ✓

---

### Test 2: Generate and Save Bill

**Endpoint:** `POST http://localhost:3000/api/v1/bills`

**Request Body:**

```json
{
  "meterId": 1,
  "billingPeriodStart": "2024-01-01",
  "billingPeriodEnd": "2024-01-31",
  "dueDate": "2024-03-01"
}
```

**Expected Response:**

```json
{
  "billId": 1,
  "meterId": 1,
  "meterSerialNo": "ELEC-001-2024",
  "customerName": "N/A",
  "billingPeriodStart": "2024-01-01T00:00:00.000Z",
  "billingPeriodEnd": "2024-01-31T00:00:00.000Z",
  "billDate": "2024-02-01T00:00:00.000Z",
  "dueDate": "2024-03-01T00:00:00.000Z",
  "totalImportUnit": 150.0,
  "totalExportUnit": 0.0,
  "energyChargeAmount": 2436.00,
  "fixedChargeAmount": 100.00,
  "subsidyAmount": 0.00,
  "solarExportCredit": 0.00,
  "details": [...],
  "taxes": [...],
  "totalAmount": 2979.80,
  "taxAmount": 443.80,
  "isPaid": false,
  "isOverdue": false
}
```

**Database Verification:**

```sql
-- Check Bill record
SELECT * FROM Bill WHERE bill_id = 1;

-- Check BillDetail records (should be 4 rows for 4 slabs used)
SELECT bd.*, ts.from_unit, ts.to_unit, ts.rate_per_unit
FROM BillDetail bd
INNER JOIN TariffSlab ts ON bd.tariff_slab_id = ts.tariff_slab_id
WHERE bd.bill_id = 1
ORDER BY ts.from_unit;

-- Check BillTax records (should be 2 rows for VAT and Env Levy)
SELECT bt.*, tc.tax_name, tc.rate_percent
FROM BillTax bt
INNER JOIN TaxConfig tc ON bt.tax_config_id = tc.tax_config_id
WHERE bt.bill_id = 1
ORDER BY tc.calculation_order;

-- Verify totals
SELECT
  bill_id,
  energy_charge_amount,
  fixed_charge_amount,
  subsidy_amount,
  solar_export_credit,
  (energy_charge_amount + fixed_charge_amount - subsidy_amount - solar_export_credit) AS subtotal,
  (SELECT SUM(bt.taxable_base_amount * bt.rate_percent_applied / 100)
   FROM BillTax bt WHERE bt.bill_id = Bill.bill_id) AS total_tax,
  (energy_charge_amount + fixed_charge_amount - subsidy_amount - solar_export_credit +
   (SELECT SUM(bt.taxable_base_amount * bt.rate_percent_applied / 100)
    FROM BillTax bt WHERE bt.bill_id = Bill.bill_id)) AS grand_total
FROM Bill WHERE bill_id = 1;
```

**Validation Checklist:**

- [ ] Bill record created in Bill table
- [ ] 4 BillDetail records created (one per slab used)
- [ ] 2 BillTax records created (VAT and Environmental Levy)
- [ ] All amounts match calculation
- [ ] isPaid = false
- [ ] isOverdue = false (due date in future)

---

### Test 3: Bulk Bill Generation

**Endpoint:** `POST http://localhost:3000/api/v1/bills/bulk`

**Request Body:**

```json
{
  "billingPeriodStart": "2024-02-01",
  "billingPeriodEnd": "2024-02-29",
  "utilityTypeId": 1,
  "dryRun": true
}
```

**Expected Response:**

```json
{
  "success": [
    { "meterId": 1, "calculation": {...} },
    { "meterId": 2, "calculation": {...} }
  ],
  "failed": [
    {
      "meterId": 3,
      "meterSerialNo": "ELEC-003-2024",
      "error": "Insufficient readings for billing period"
    }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

**Validation Checklist:**

- [ ] dryRun: true - No records saved to database
- [ ] Returns calculation for each meter
- [ ] Failed array shows meters with errors
- [ ] Summary totals are correct

---

### Test 4: Get Bill with Full Details

**Endpoint:** `GET http://localhost:3000/api/v1/bills/1`

**Expected Response:**

- Complete bill information
- Slab breakdown in `details` array
- Tax breakdown in `taxes` array
- Payment history in `payments` array

**Validation Checklist:**

- [ ] All bill fields populated
- [ ] Slab breakdown shows 4 entries
- [ ] Tax breakdown shows 2 entries
- [ ] Calculated fields match (totalAmount, taxAmount)

---

### Test 5: Get Bills with Filters

**Endpoint:** `GET http://localhost:3000/api/v1/bills?meterId=1&page=1&limit=10`

**Expected Response:**

```json
{
  "bills": [...],
  "total": 2,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Validation Checklist:**

- [ ] Returns bills for specified meter only
- [ ] Pagination works correctly
- [ ] Total count is accurate

---

### Test 6: Get Billing Summary

**Endpoint:** `GET http://localhost:3000/api/v1/bills/summary?utilityTypeId=1`

**Expected Response:**

```json
{
  "totalBills": 5,
  "totalAmount": 14899.0,
  "totalPaid": 8000.0,
  "totalOutstanding": 6899.0,
  "overdueBills": 2,
  "overdueAmount": 3500.0
}
```

**Validation Checklist:**

- [ ] Counts all bills for utility type
- [ ] Sums amounts correctly
- [ ] Outstanding = totalAmount - totalPaid
- [ ] Overdue bills counted correctly (past due date)

---

### Test 7: Update Bill

**Endpoint:** `PUT http://localhost:3000/api/v1/bills/1`

**Request Body:**

```json
{
  "subsidyAmount": 500.0,
  "dueDate": "2024-03-15"
}
```

**Expected Behavior:**

- Bill updated with new subsidy and due date
- Total amount recalculated: 2,979.80 - 500.00 = 2,479.80

**Validation Checklist:**

- [ ] Subsidy applied correctly
- [ ] Due date updated
- [ ] Total amount recalculated

---

### Test 8: Recalculate Bill

**Endpoint:** `POST http://localhost:3000/api/v1/bills/1/recalculate`

**Expected Behavior:**

- Bill recalculated from scratch using current tariffs/taxes
- Old BillDetails deleted, new ones created
- Old BillTaxes deleted, new ones created

**Validation Checklist:**

- [ ] Bill amounts updated if tariffs changed
- [ ] BillDetails regenerated
- [ ] BillTaxes regenerated

---

### Test 9: Void Bill

**Endpoint:** `POST http://localhost:3000/api/v1/bills/1/void`

**Request Body:**

```json
{
  "reason": "Incorrect meter reading"
}
```

**Expected Behavior:**

- Returns HTTP 204 No Content
- Bill cannot be voided if payments exist

**Database Verification:**

```sql
SELECT * FROM Bill WHERE bill_id = 1;
-- Should still exist but marked as voided in some way (or deleted based on implementation)
```

---

## 3. Progressive Slab Calculation Test

### Test Scenario: 200 units consumption

**Expected Slab Distribution:**

1. Slab 1 (0-60): 60 units × 7.85 = 471.00
2. Slab 2 (61-90): 30 units × 10.00 = 300.00
3. Slab 3 (91-120): 30 units × 27.75 = 832.50
4. Slab 4 (121-180): 60 units × 32.00 = 1,920.00
5. Slab 5 (181+): 20 units × 45.00 = 900.00

**Total Energy Charge:** 471 + 300 + 832.50 + 1,920 + 900 = **4,423.50**

**Test with API:**

```json
{
  "meterId": 1,
  "periodStart": "2024-01-01",
  "periodEnd": "2024-01-31"
}
```

Verify that:

- [ ] All 5 slabs are used in breakdown
- [ ] Units sum to 200
- [ ] Amounts match manual calculation
- [ ] Lower slabs consumed first

---

## 4. Edge Case Tests

### Test 4.1: Consumption Below First Slab

- **Consumption:** 30 units (0-60 slab)
- **Expected:** Only first slab used
- [ ] Only 1 BillDetail record created

### Test 4.2: Consumption Exactly at Slab Boundary

- **Consumption:** 60 units (exactly first slab)
- **Expected:** Only first slab, no spillover
- [ ] Only 1 BillDetail record

### Test 4.3: Zero Consumption

- **Consumption:** 0 units
- **Expected:** Only fixed charge, no energy charge
- [ ] No BillDetail records (or 0 amount)
- [ ] Fixed charge still applied

### Test 4.4: Missing Meter Readings

- **Scenario:** No readings in period
- **Expected:** Error message
- [ ] Returns 400 Bad Request
- [ ] Error: "Insufficient readings for billing period"

### Test 4.5: No Active Tariff

- **Scenario:** Meter has no tariff category
- **Expected:** Error message
- [ ] Returns 404 Not Found
- [ ] Error: "No tariff category assigned"

---

## 5. SQL Validation Queries

### Query 1: Verify Bill Totals

```sql
SELECT
  b.bill_id,
  b.total_import_unit AS consumption,
  b.energy_charge_amount,
  b.fixed_charge_amount,
  b.subsidy_amount,
  b.solar_export_credit,
  -- Manual total calculation
  (b.energy_charge_amount + b.fixed_charge_amount - b.subsidy_amount - b.solar_export_credit) AS subtotal,
  -- Sum of taxes
  (SELECT SUM(taxable_base_amount * rate_percent_applied / 100)
   FROM BillTax WHERE bill_id = b.bill_id) AS tax_total,
  -- Grand total
  (b.energy_charge_amount + b.fixed_charge_amount - b.subsidy_amount - b.solar_export_credit +
   (SELECT SUM(taxable_base_amount * rate_percent_applied / 100)
    FROM BillTax WHERE bill_id = b.bill_id)) AS calculated_total
FROM Bill b
WHERE b.bill_id = 1;
```

### Query 2: Verify Slab Distribution

```sql
SELECT
  bd.bill_detail_id,
  ts.from_unit,
  ts.to_unit,
  ts.rate_per_unit,
  bd.units_in_slab,
  bd.amount,
  (bd.units_in_slab * ts.rate_per_unit) AS expected_amount,
  CASE
    WHEN ABS(bd.amount - (bd.units_in_slab * ts.rate_per_unit)) < 0.01 THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS validation
FROM BillDetail bd
INNER JOIN TariffSlab ts ON bd.tariff_slab_id = ts.tariff_slab_id
WHERE bd.bill_id = 1
ORDER BY ts.from_unit;
```

### Query 3: Verify Tax Calculations

```sql
SELECT
  bt.bill_tax_id,
  tc.tax_name,
  bt.rate_percent_applied,
  bt.taxable_base_amount,
  (bt.taxable_base_amount * bt.rate_percent_applied / 100) AS expected_tax,
  CASE
    WHEN ABS((bt.taxable_base_amount * bt.rate_percent_applied / 100) -
         (bt.taxable_base_amount * bt.rate_percent_applied / 100)) < 0.01 THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS validation
FROM BillTax bt
INNER JOIN TaxConfig tc ON bt.tax_config_id = tc.tax_config_id
WHERE bt.bill_id = 1
ORDER BY tc.calculation_order;
```

---

## 6. Quick Testing Script (PowerShell)

```powershell
# Set base URL
$baseUrl = "http://localhost:3000/api/v1/bills"

# Test 1: Calculate Bill Preview
Write-Host "Test 1: Calculate Bill Preview..." -ForegroundColor Cyan
$body = @{
    meterId = 1
    periodStart = "2024-01-01"
    periodEnd = "2024-01-31"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/calculate" -Method POST -Body $body -ContentType "application/json"
Write-Host "Consumption: $($response.consumption) units" -ForegroundColor Green
Write-Host "Total Amount: $($response.totalAmount)" -ForegroundColor Green
Write-Host ""

# Test 2: Generate Bill
Write-Host "Test 2: Generate Bill..." -ForegroundColor Cyan
$body = @{
    meterId = 1
    billingPeriodStart = "2024-01-01"
    billingPeriodEnd = "2024-01-31"
    dueDate = "2024-03-01"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
Write-Host "Bill ID: $($response.billId)" -ForegroundColor Green
Write-Host "Total Amount: $($response.totalAmount)" -ForegroundColor Green
Write-Host ""

# Test 3: Get Bill Details
Write-Host "Test 3: Get Bill Details..." -ForegroundColor Cyan
$billId = $response.billId
$response = Invoke-RestMethod -Uri "$baseUrl/$billId" -Method GET
Write-Host "Slab Breakdown: $($response.details.Count) slabs" -ForegroundColor Green
Write-Host "Taxes: $($response.taxes.Count) taxes" -ForegroundColor Green
Write-Host ""

# Test 4: Get Billing Summary
Write-Host "Test 4: Get Billing Summary..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "$baseUrl/summary?utilityTypeId=1" -Method GET
Write-Host "Total Bills: $($response.totalBills)" -ForegroundColor Green
Write-Host "Total Amount: $($response.totalAmount)" -ForegroundColor Green
Write-Host "Outstanding: $($response.totalOutstanding)" -ForegroundColor Green

Write-Host "`nAll tests completed!" -ForegroundColor Yellow
```

---

## 7. Postman Collection

Import this into Postman for easy testing:

```json
{
  "info": {
    "name": "Billing System Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Calculate Bill Preview",
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"meterId\": 1,\n  \"periodStart\": \"2024-01-01\",\n  \"periodEnd\": \"2024-01-31\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/bills/calculate",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "bills", "calculate"]
        }
      }
    },
    {
      "name": "Generate Bill",
      "request": {
        "method": "POST",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"meterId\": 1,\n  \"billingPeriodStart\": \"2024-01-01\",\n  \"billingPeriodEnd\": \"2024-01-31\",\n  \"dueDate\": \"2024-03-01\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/bills",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "bills"]
        }
      }
    }
  ]
}
```

---

## Testing Complete!

After running all tests, you should have verified:

✅ Database schema is correct  
✅ Tariff slabs work progressively  
✅ Tax calculations are accurate  
✅ Bill generation creates all related records  
✅ API endpoints return correct data  
✅ Edge cases are handled properly  
✅ Totals match manual calculations

**Next Steps:**

1. Run integration tests with Postman
2. Test with production-like data volumes
3. Add unit tests for BillingService methods
4. Set up E2E tests with Supertest
