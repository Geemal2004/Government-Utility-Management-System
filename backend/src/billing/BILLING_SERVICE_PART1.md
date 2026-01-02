# Billing Service - Part 1: Calculation Logic

## Overview

The BillingService implements the core bill calculation logic with proper progressive tariff application, subsidy handling, solar credits, and tax calculations.

## Implementation Details

### 1. calculateBill()

**Purpose:** Calculate complete bill without saving to database

**Flow:**

```
1. Get meter → 2. Get connection → 3. Get readings → 4. Calculate consumption
                     ↓
5. Apply tariff slabs → 6. Calculate subsidies → 7. Calculate solar credits
                     ↓
8. Calculate taxes → 9. Return detailed breakdown
```

**Key Features:**

- ✅ Validates meter exists
- ✅ Validates connection exists
- ✅ Validates tariff category configured
- ✅ Requires minimum 2 readings in period
- ✅ Validates consumption is positive
- ✅ Comprehensive error messages
- ✅ Detailed logging at each step

**Example Usage:**

```typescript
const calculation = await billingService.calculateBill(
  1, // meterId
  new Date('2024-01-01'), // periodStart
  new Date('2024-01-31'), // periodEnd
);

console.log(calculation);
// Output:
// {
//   consumption: 150.00,
//   slabBreakdown: [
//     { from: 0, to: 60, units: 60, rate: 7.85, amount: 471.00 },
//     { from: 60, to: 90, units: 30, rate: 10.00, amount: 300.00 },
//     { from: 90, to: 180, units: 60, rate: 27.75, amount: 1665.00 }
//   ],
//   energyCharge: 2436.00,
//   fixedCharge: 100.00,
//   subtotal: 2536.00,
//   subsidy: 0.00,
//   solarCredit: 0.00,
//   beforeTax: 2536.00,
//   taxes: [
//     { name: "VAT", rate: 15.0, amount: 380.40 },
//     { name: "Service Tax", rate: 2.5, amount: 63.40 }
//   ],
//   totalAmount: 2979.80
// }
```

---

### 2. applyTariffSlabs()

**Purpose:** Apply progressive tariff pricing to consumption

**Algorithm:**

```
For consumption = 150 units, tariff slabs: 0-60, 61-90, 91-180, 180+

1. Slab 1 (0-60):
   - Units in slab = min(consumption - 0, 60 - 0) = 60 units
   - Amount = 60 × 7.85 = Rs 471.00

2. Slab 2 (61-90):
   - Units in slab = min(consumption - 60, 90 - 60) = 30 units
   - Amount = 30 × 10.00 = Rs 300.00

3. Slab 3 (91-180):
   - Units in slab = min(consumption - 90, 180 - 90) = 60 units
   - Amount = 60 × 27.75 = Rs 1,665.00

4. Slab 4 (180+):
   - Consumption doesn't reach this slab, skip

Total Energy Charge = Rs 471.00 + Rs 300.00 + Rs 1,665.00 = Rs 2,436.00
```

**Key Features:**

- ✅ Handles unlimited slabs (toUnit = null)
- ✅ Validates tariff slabs exist
- ✅ Filters slabs valid on bill date
- ✅ Progressive calculation (each slab independent)
- ✅ Detailed logging for each slab
- ✅ Returns fixed charge from first slab

**Edge Cases Handled:**

- Consumption exactly at slab boundary
- Consumption in first slab only
- Consumption exceeding all slabs (uses unlimited slab)
- No valid slabs for date (throws error)

---

### 3. calculateSubsidy()

**Purpose:** Calculate subsidy amount for eligible customers

**Current Status:** Placeholder implementation (returns 0)

**Planned Implementation:**

```typescript
async calculateSubsidy(customerId, billAmount, billDate) {
  // Step a) Get active CustomerSubsidy for customer on billDate
  const customerSubsidy = await customerSubsidyRepository.findOne({
    where: {
      customerId,
      status: 'ACTIVE',
      approvedDate: LessThanOrEqual(billDate)
    },
    relations: ['subsidyScheme']
  });

  if (!customerSubsidy) {
    return 0;
  }

  const scheme = customerSubsidy.subsidyScheme;

  // Step b & c) Calculate based on discount_type
  let subsidy = 0;

  if (scheme.discountType === 'PERCENTAGE') {
    subsidy = (billAmount * scheme.discountValue) / 100;
  } else if (scheme.discountType === 'FIXED') {
    subsidy = scheme.discountValue;
  }

  // Step d) Ensure subsidy doesn't exceed bill amount
  return Math.min(subsidy, billAmount);
}
```

---

### 4. calculateSolarCredit()

**Purpose:** Calculate credit for exported solar energy

**Current Implementation:** Fixed rate (Rs 5.00 per unit)

**Algorithm:**

```
If exportUnits = 25 units:
  credit = 25 × 5.00 = Rs 125.00
```

**Planned Enhancement:**

```typescript
async calculateSolarCredit(exportUnits, utilityTypeId, billDate) {
  if (exportUnits <= 0) {
    return 0;
  }

  // Get export rate from configuration
  const exportRate = await getExportRate(utilityTypeId, billDate);

  // Calculate credit
  const credit = exportUnits * exportRate;

  return credit;
}
```

---

### 5. calculateTaxes()

**Purpose:** Calculate all applicable taxes on taxable amount

**Algorithm:**

```
Taxable Amount = Rs 2,536.00

Active Taxes:
1. VAT (15%):
   - Amount = 2,536.00 × 0.15 = Rs 380.40

2. Service Tax (2.5%):
   - Amount = 2,536.00 × 0.025 = Rs 63.40

Total Tax = Rs 380.40 + Rs 63.40 = Rs 443.80
```

**Key Features:**

- ✅ Filters active taxes (status = 'ACTIVE')
- ✅ Validates taxes are effective on bill date
- ✅ Handles multiple taxes
- ✅ Returns detailed breakdown
- ✅ Warns if no active taxes found

**Tax Validation:**

```typescript
// Each tax checked with isActive() method:
tax.isActive(billDate) {
  return this.status === 'ACTIVE' &&
         billDate >= this.effectiveFrom &&
         (this.effectiveTo === null || billDate <= this.effectiveTo);
}
```

---

## Complete Calculation Example

### Input

```typescript
Meter ID: 1
Period: 2024-01-01 to 2024-01-31
First Reading: 2300 units
Last Reading: 2450 units
Export: 10 units
```

### Calculation Steps

**1. Consumption**

```
Import Consumption = 2450 - 2300 = 150 units
Export Units = 10 units
```

**2. Tariff Slabs** (Residential Standard)

```
Slab 1 (0-60):    60 units × Rs 7.85  = Rs  471.00
Slab 2 (61-90):   30 units × Rs 10.00 = Rs  300.00
Slab 3 (91-180):  60 units × Rs 27.75 = Rs 1,665.00
                                        -----------
Energy Charge:                          Rs 2,436.00
Fixed Charge:                           Rs   100.00
                                        -----------
Subtotal:                               Rs 2,536.00
```

**3. Subsidies & Credits**

```
Subsidy:                                Rs    0.00
Solar Export Credit (10 × 5.00):        Rs   50.00
                                        -----------
Before Tax:                             Rs 2,486.00
```

**4. Taxes**

```
VAT (15%):          2,486.00 × 0.15  = Rs  372.90
Service Tax (2.5%): 2,486.00 × 0.025 = Rs   62.15
                                        -----------
Total Tax:                              Rs  435.05
```

**5. Final Amount**

```
Before Tax:                             Rs 2,486.00
Total Tax:                              Rs   435.05
                                        -----------
TOTAL AMOUNT PAYABLE:                   Rs 2,921.05
```

---

## Error Handling

### 1. Meter Not Found

```typescript
throw new NotFoundException(`Meter with ID ${meterId} not found`);
```

### 2. No Connection Found

```typescript
throw new NotFoundException(`No service connection found for meter ${meterId}`);
```

### 3. Tariff Not Configured

```typescript
throw new BadRequestException(`Tariff category not configured for meter ${meterId}`);
```

### 4. Insufficient Readings

```typescript
throw new BadRequestException(
  `Insufficient readings for meter ${meterId}. At least 2 readings required.`,
);
```

### 5. Invalid Consumption (Negative)

```typescript
throw new BadRequestException(
  `Invalid readings: Last reading (${last}) < First reading (${first})`,
);
```

### 6. No Tariff Slabs

```typescript
throw new BadRequestException(`No tariff slabs found for tariff category ${tariffCategoryId}`);
```

---

## Logging

All calculation steps are logged:

```
[BillingService] Calculating bill for meter 1, period: 2024-01-01 to 2024-01-31
[BillingService] Consumption: 150 units, Export: 10 units
[BillingService] Applying tariff slabs for category 1, consumption: 150
[BillingService] Slab 1: 0-60 units, 60 units @ 7.85 = 471.00
[BillingService] Slab 2: 61-90 units, 30 units @ 10.00 = 300.00
[BillingService] Slab 3: 91-180 units, 60 units @ 27.75 = 1665.00
[BillingService] Energy: 2436.00, Fixed: 100.00, Subtotal: 2536.00
[BillingService] Subsidy: 0.00, Solar credit: 50.00, Before tax: 2486.00
[BillingService] Tax: VAT @ 15% = 372.90
[BillingService] Tax: Service Tax @ 2.5% = 62.15
[BillingService] Bill calculation completed. Total: 2921.05
```

---

## Next Steps (Part 2)

Part 2 will implement:

1. **createBill()** - Save calculated bill to database
2. **generateBulkBills()** - Generate bills for multiple meters
3. **updateBill()** - Update bill amounts
4. **findBills()** - Query and filter bills
5. **getBillSummary()** - Aggregate statistics

---

## Testing Checklist

- [ ] Test with consumption in single slab
- [ ] Test with consumption spanning multiple slabs
- [ ] Test with consumption exceeding all slabs
- [ ] Test with zero consumption
- [ ] Test with negative consumption (should fail)
- [ ] Test with insufficient readings (should fail)
- [ ] Test with no tariff slabs (should fail)
- [ ] Test with inactive taxes
- [ ] Test with solar export credits
- [ ] Test amount rounding (2 decimal places)
