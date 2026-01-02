# Billing DTOs Documentation

## Overview

This directory contains all Data Transfer Objects (DTOs) for the billing module. These DTOs are used for:

- Creating and updating bills
- Filtering and querying bills
- Calculating bill amounts
- Displaying bill information to users

## DTO Categories

### 1. Creation DTOs

#### CreateBillDto

Used to generate a single bill for a meter.

**Example:**

```typescript
{
  meterId: 1,
  billingPeriodStart: "2024-01-01",
  billingPeriodEnd: "2024-01-31",
  dueDate: "2024-03-01",  // Optional, defaults to bill_date + 30 days
  applySubsidy: true,      // Optional, defaults to true
  applySolarCredit: true   // Optional, defaults to true
}
```

#### BulkBillGenerationDto

Used to generate bills for multiple meters at once.

**Example:**

```typescript
{
  billingPeriodStart: "2024-01-01",
  billingPeriodEnd: "2024-01-31",
  utilityTypeId: 1,           // Optional: filter by electricity
  customerType: "RESIDENTIAL", // Optional: filter by customer type
  meterIds: [1, 2, 3],        // Optional: specific meters only
  dryRun: false               // Optional: preview without saving
}
```

#### UpdateBillDto

Used to manually adjust bill amounts.

**Example:**

```typescript
{
  energyChargeAmount: 2500.00,
  fixedChargeAmount: 100.00,
  subsidyAmount: 100.00,
  dueDate: "2024-03-15",
  notes: "Manual adjustment approved by manager"
}
```

---

### 2. Response DTOs

#### BillResponseDto

Complete bill information with all related data.

**Example Response:**

```typescript
{
  billId: 1,
  meterId: 1,
  meterSerialNo: "ELEC-001-2024",
  customerName: "Amal Kumara Perera",
  customerEmail: "amal.perera@gmail.com",
  connectionAddress: "45/2, Gregory Road, Cinnamon Gardens, Colombo 7",
  tariffCategoryName: "Residential Standard",
  utilityTypeName: "Electricity",
  billingPeriodStart: "2024-01-01",
  billingPeriodEnd: "2024-01-31",
  billDate: "2024-02-01",
  dueDate: "2024-03-01",
  totalImportUnit: 150.0,
  totalExportUnit: 0.0,
  energyChargeAmount: 2436.00,
  fixedChargeAmount: 100.00,
  subsidyAmount: 0.00,
  solarExportCredit: 0.00,
  details: [
    {
      slabRange: "0-60 units",
      unitsInSlab: 60,
      ratePerUnit: 7.85,
      amount: 471.00
    },
    {
      slabRange: "61-90 units",
      unitsInSlab: 30,
      ratePerUnit: 10.00,
      amount: 300.00
    },
    {
      slabRange: "91-180 units",
      unitsInSlab: 60,
      ratePerUnit: 27.75,
      amount: 1665.00
    }
  ],
  taxes: [
    {
      taxName: "VAT (Value Added Tax)",
      ratePercent: 15.0,
      taxableAmount: 2536.00,
      taxAmount: 380.40
    },
    {
      taxName: "Service Tax",
      ratePercent: 2.5,
      taxableAmount: 2536.00,
      taxAmount: 63.40
    }
  ],
  totalAmount: 2979.80,
  taxAmount: 443.80,
  isPaid: false,
  isOverdue: false,
  payments: []
}
```

#### BillCalculationDto

Detailed breakdown of bill calculation.

**Example Response:**

```typescript
{
  consumption: 150.0,
  slabBreakdown: [
    {
      from: 0,
      to: 60,
      units: 60,
      rate: 7.85,
      amount: 471.00
    },
    {
      from: 60,
      to: 90,
      units: 30,
      rate: 10.00,
      amount: 300.00
    },
    {
      from: 90,
      to: 180,
      units: 60,
      rate: 27.75,
      amount: 1665.00
    }
  ],
  energyCharge: 2436.00,
  fixedCharge: 100.00,
  subtotal: 2536.00,
  subsidy: 0.00,
  solarCredit: 0.00,
  beforeTax: 2536.00,
  taxes: [
    {
      name: "VAT (Value Added Tax)",
      rate: 15.0,
      amount: 380.40
    },
    {
      name: "Service Tax",
      rate: 2.5,
      amount: 63.40
    }
  ],
  totalAmount: 2979.80
}
```

#### BillSummaryDto

Aggregate statistics for bills.

**Example Response:**

```typescript
{
  totalBills: 150,
  totalAmount: 450000.00,
  totalPaid: 380000.00,
  totalOutstanding: 70000.00,
  overdueBills: 25,
  overdueAmount: 45000.00
}
```

---

### 3. Filter DTOs

#### BillFilterDto

Filter and paginate bills.

**Example Query:**

```typescript
{
  meterId: 1,
  customerId: 5,
  utilityTypeId: 1,
  status: "UNPAID",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  isPaid: false,
  isOverdue: true,
  page: 1,
  limit: 10,
  sortBy: "billDate",
  order: "DESC"
}
```

**Status Options:**

- `PAID` - Fully paid bills
- `UNPAID` - No payments made
- `OVERDUE` - Past due date and not paid
- `PARTIAL` - Partially paid bills

---

## Bill Calculation Flow

### Step-by-Step Process:

1. **Get Consumption**
   - Current reading - Previous reading
   - Example: 2450 - 2300 = 150 units

2. **Apply Tariff Slabs** (Progressive pricing)
   - Slab 1 (0-60): 60 units × Rs 7.85 = Rs 471.00
   - Slab 2 (61-90): 30 units × Rs 10.00 = Rs 300.00
   - Slab 3 (91-180): 60 units × Rs 27.75 = Rs 1,665.00
   - **Energy Charge: Rs 2,436.00**

3. **Add Fixed Charge**
   - Monthly fixed charge: Rs 100.00
   - **Subtotal: Rs 2,536.00**

4. **Apply Subsidies** (if eligible)
   - Example: Rs 0.00 (not eligible)

5. **Apply Solar Credits** (if applicable)
   - Example: Rs 0.00 (no solar)

6. **Calculate Before Tax**
   - Subtotal - Subsidies - Credits = Rs 2,536.00

7. **Apply Taxes**
   - VAT @ 15%: Rs 2,536.00 × 0.15 = Rs 380.40
   - Service Tax @ 2.5%: Rs 2,536.00 × 0.025 = Rs 63.40
   - **Total Tax: Rs 443.80**

8. **Final Amount**
   - Before Tax + Taxes = **Rs 2,979.80**

---

## Usage Examples

### 1. Generate Single Bill

**POST** `/api/v1/billing/bills`

```typescript
const createDto: CreateBillDto = {
  meterId: 1,
  billingPeriodStart: new Date('2024-01-01'),
  billingPeriodEnd: new Date('2024-01-31'),
  applySubsidy: true,
  applySolarCredit: true,
};

const bill = await billingService.createBill(createDto);
```

### 2. Bulk Bill Generation

**POST** `/api/v1/billing/bills/bulk`

```typescript
const bulkDto: BulkBillGenerationDto = {
  billingPeriodStart: new Date('2024-01-01'),
  billingPeriodEnd: new Date('2024-01-31'),
  utilityTypeId: 1,
  customerType: 'RESIDENTIAL',
  dryRun: false,
};

const result = await billingService.generateBulkBills(bulkDto);
```

### 3. Filter Bills

**GET** `/api/v1/billing/bills?status=OVERDUE&page=1&limit=10`

```typescript
const filterDto: BillFilterDto = {
  status: BillStatusFilter.OVERDUE,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  page: 1,
  limit: 10,
  sortBy: 'dueDate',
  order: 'ASC',
};

const bills = await billingService.findBills(filterDto);
```

### 4. Get Bill Summary

**GET** `/api/v1/billing/bills/summary`

```typescript
const summary = await billingService.getBillSummary({
  customerId: 1,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});

console.log(`Total Outstanding: Rs ${summary.totalOutstanding}`);
console.log(`Overdue Bills: ${summary.overdueBills}`);
```

### 5. Calculate Bill Preview

**POST** `/api/v1/billing/calculate`

```typescript
const calculation = await billingService.calculateBill({
  meterId: 1,
  billingPeriodStart: new Date('2024-01-01'),
  billingPeriodEnd: new Date('2024-01-31'),
});

console.log('Slab Breakdown:', calculation.slabBreakdown);
console.log('Total Amount:', calculation.totalAmount);
```

---

## Validation Rules

All DTOs use `class-validator` decorators:

- **@IsNotEmpty()** - Required fields
- **@IsOptional()** - Optional fields
- **@IsNumber()** - Must be a number
- **@IsDate()** - Must be a valid date
- **@IsBoolean()** - Must be boolean
- **@Min(0)** - Minimum value 0
- **@Max(100)** - Maximum value 100
- **@MaxLength(n)** - Max string length

Date fields use `@Type(() => Date)` from `class-transformer` for automatic conversion.

---

## Error Handling

Common validation errors:

```typescript
{
  statusCode: 400,
  message: [
    "meterId must be a positive number",
    "billingPeriodStart must be a valid date",
    "page must not be less than 1"
  ],
  error: "Bad Request"
}
```

---

## Notes

- All amounts are in local currency (Rs)
- Dates are in ISO 8601 format
- All calculated fields are rounded to 2 decimal places
- Pagination defaults: page=1, limit=10
- Default sort: billDate DESC
