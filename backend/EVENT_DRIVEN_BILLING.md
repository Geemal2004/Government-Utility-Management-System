# Event-Driven Bill Generation Implementation

## Overview

Implemented an event-driven architecture for automated bill generation using `@nestjs/event-emitter`. When a new meter reading is created, the system asynchronously generates a bill without blocking the user's request.

## Installation Required

Run this command in the backend directory:

```bash
npm install @nestjs/event-emitter
```

## Architecture

### 1. Event Class

**File:** `backend/src/readings/events/meter-reading-created.event.ts`

- Carries the `MeterReading` entity payload
- Includes options for bill generation (minDaysBetweenBills, dueDaysFromBillDate)

### 2. Event Emitter (ReadingsService)

**File:** `backend/src/readings/readings.service.ts`

- Injects `EventEmitter2` from `@nestjs/event-emitter`
- After successfully saving a reading, emits `meter-reading.created` event
- Keeps legacy synchronous bill generation for backward compatibility

### 3. Event Listener (BillingEventListener)

**File:** `backend/src/billing/billing-event.listener.ts`

- Listens to `meter-reading.created` event with `@OnEvent` decorator
- Runs asynchronously (`{ async: true }`) to prevent blocking
- Implements robust validation and error handling

#### Listener Logic Flow:

1. **Validate Connection**: Checks for active connection with tariff category
2. **Find Previous Reading**: Determines billing period start
3. **Check for Duplicates**: Prevents duplicate bill generation
4. **Verify Minimum Days**: Ensures at least 25 days (configurable) between bills
5. **Count Readings**: Verifies at least 2 readings exist in period
6. **Generate Bill**: Calls `billingService.create()` with period dates
7. **Error Handling**: Logs errors without crashing the application

### 4. Module Registration

- **BillingModule**: Registers `BillingEventListener` as a provider
- **AppModule**: Imports `EventEmitterModule.forRoot()`

## Key Features

### Asynchronous Processing

- Event listener runs with `{ async: true }` option
- User doesn't experience any delay when creating readings
- Bills generate in the background

### Duplicate Prevention

```typescript
const existingBill = await this.billRepository.findOne({
  where: {
    meterId: reading.meterId,
    billingPeriodEnd: periodEnd,
  },
});
```

### Comprehensive Validation

1. ✓ Active connection check
2. ✓ Tariff category assignment
3. ✓ Minimum days between bills
4. ✓ Sufficient readings (at least 2)
5. ✓ No duplicate bills

### Error Handling

- All errors are caught and logged
- Failed bill generation doesn't crash the reading creation
- Detailed logging with emojis for easy debugging:
  - 📨 Event received
  - ⚠️ Warnings
  - ✓ Success steps
  - ❌ Errors
  - ✅ Bill generated

### Transaction Safety

- Uses TypeORM transactions in `billingService.create()`
- Ensures data consistency
- Automatic rollback on errors

## Usage

### Creating a Reading (Auto-bill enabled by default)

```typescript
POST /api/v1/readings
{
  "meterId": 27,
  "readingDate": "2026-01-03T10:00:00Z",
  "importReading": 250.5,
  "readingSource": "MANUAL"
}
```

### Disabling Auto-generation

```typescript
POST /api/v1/readings
{
  "meterId": 27,
  "readingDate": "2026-01-03T10:00:00Z",
  "importReading": 250.5,
  "autoGenerateBill": false
}
```

### Custom Bill Generation Options

```typescript
POST /api/v1/readings
{
  "meterId": 27,
  "readingDate": "2026-01-03T10:00:00Z",
  "importReading": 250.5,
  "minDaysBetweenBills": 30,
  "dueDaysFromBillDate": 20
}
```

## Logs Example

```
[ReadingsService] Created reading 10 for meter 27
[ReadingsService] 📤 Emitting meter-reading.created event for reading 10
[BillingEventListener] 📨 Event received: meter-reading.created for meter 27, reading ID 10
[BillingEventListener] ✓ Previous reading found (ID: 9, Date: 2025-12-03T00:00:00.000Z)
[BillingEventListener] 🔧 Generating bill for meter 27, period: 2025-12-03 to 2026-01-03
[BillingEventListener] ✅ AUTO-BILL GENERATED via Event: Bill #2 for meter 27, Amount: Rs 8,520.00
[BillingEventListener]    Reading ID: 10, Period: 2025-12-03 to 2026-01-03
```

## Benefits

1. **Non-blocking**: Reading creation returns immediately
2. **Scalable**: Can handle high volume of readings
3. **Resilient**: Errors don't crash the application
4. **Auditable**: Comprehensive logging for monitoring
5. **Flexible**: Easy to add more event listeners (notifications, analytics, etc.)
6. **Testable**: Event-driven code is easier to unit test
7. **Maintainable**: Separation of concerns (readings vs billing)

## Future Enhancements

### Possible Additional Events:

- `bill-generation.failed` - For monitoring failed generations
- `bill-generation.succeeded` - For notifications/analytics
- `high-consumption.detected` - For anomaly alerts
- `duplicate-bill.prevented` - For audit trails

### Retry Mechanism:

```typescript
@OnEvent('bill-generation.failed')
async handleFailedGeneration(event) {
  // Implement retry logic with exponential backoff
}
```

### Notification Integration:

```typescript
@OnEvent('meter-reading.created')
async sendNotification(event) {
  // Send SMS/Email to customer about new reading
}
```

## Testing

The event-driven system can be tested by:

1. Creating meter readings via API
2. Monitoring backend logs for event flow
3. Verifying bills are generated in database
4. Testing error scenarios (no tariff, insufficient readings, etc.)

## Migration Notes

- Legacy synchronous bill generation is still present for backward compatibility
- Can be removed once event-driven approach is fully tested
- Both methods use the same `billingService.generateBillFromReading()` logic
