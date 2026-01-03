# Billing Dashboard Installation Guide

## Required Package

The BillingDashboard component uses **recharts** for data visualization.

### Installation

```bash
npm install recharts
# or
yarn add recharts
```

## TypeScript Types (Optional)

```bash
npm install --save-dev @types/recharts
# or
yarn add -D @types/recharts
```

## Usage

The BillingDashboard component has been integrated into the main dashboard page at:
`src/app/dashboard/page.tsx`

## Component Location

- **Main Component**: `components/BillingDashboard.tsx`
- **Dashboard Page**: `src/app/dashboard/page.tsx`

## Features

✅ **4 Statistics Cards**:

- Total Revenue (with trend indicator)
- Outstanding Bills (clickable)
- Overdue Amount (clickable)
- Collection Rate (with progress bar)

✅ **3 Interactive Charts**:

- Revenue Trend (Line Chart) - Last 6 months, billed vs collected
- Bills by Status (Pie Chart) - Distribution with percentages
- Average Bill Amount by Utility Type (Bar Chart)

✅ **Recent Bills Table**:

- Shows last 10 bills
- Clickable rows navigate to bill details
- Includes Bill ID, Customer, Amount, Status, Due Date

✅ **Overdue Alerts Section**:

- Top 5 overdue bills
- Days overdue calculation
- "Send Reminder" action button
- Clickable rows navigate to bill details

## API Endpoints Required

The component fetches data from these endpoints:

1. **GET** `/api/v1/bills/summary`

   - Returns: billing summary, revenue trend, bills by status, average by utility

2. **GET** `/api/v1/bills?limit=10&sortBy=billDate&order=DESC`

   - Returns: recent bills list

3. **GET** `/api/v1/bills/overdue?limit=5`

   - Returns: overdue bills list

4. **POST** `/api/v1/bills/:billId/send-reminder`
   - Sends payment reminder to customer

## Data Structure

### BillingSummary

```typescript
interface BillingSummary {
  totalRevenue: number;
  totalRevenueLastMonth: number;
  revenueTrend: number; // percentage
  outstandingAmount: number;
  outstandingCount: number;
  overdueAmount: number;
  overdueCount: number;
  collectionRate: number; // percentage
  collectionTarget: number; // percentage
}
```

### RevenueTrend

```typescript
interface RevenueTrend {
  month: string; // "Jan", "Feb", etc.
  billed: number;
  collected: number;
}
```

### BillsByStatus

```typescript
interface BillsByStatus {
  status: string; // "PAID", "UNPAID", "OVERDUE", "VOIDED"
  count: number;
  percentage: number;
  amount: number;
}
```

### AverageByUtility

```typescript
interface AverageByUtility {
  utilityType: string; // "Water", "Electricity", "Gas"
  averageAmount: number;
  billCount: number;
}
```

## Responsive Design

The dashboard is fully responsive:

- **Mobile**: Single column layout
- **Tablet**: 2-column grid for cards and charts
- **Desktop**: 4-column grid for stat cards, 2-column for charts

## Interactive Features

1. **Click Statistics Cards**: Navigate to filtered bills list

   - Outstanding Bills → `/bills?status=UNPAID`
   - Overdue Amount → `/bills?status=OVERDUE`

2. **Click Recent Bills**: Navigate to bill detail page

   - Row click → `/bills/:billId`

3. **Send Reminder**: Click button to send payment reminder

   - Shows success/error alert

4. **View All Links**: Navigate to full lists
   - Recent Bills → `/bills`
   - Overdue Alerts → `/bills?status=OVERDUE`

## Customization

### Change Colors

Edit the PIE_COLORS array in `BillingDashboard.tsx`:

```typescript
const PIE_COLORS = ["#22c55e", "#fbbf24", "#ef4444", "#6b7280"];
```

### Modify Chart Heights

Change ResponsiveContainer height prop:

```typescript
<ResponsiveContainer width="100%" height={300}>
```

### Adjust Data Refresh

Add polling or real-time updates:

```typescript
useEffect(() => {
  fetchDashboardData();
  const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
  return () => clearInterval(interval);
}, []);
```

## Troubleshooting

### Charts not rendering

1. Ensure recharts is installed:

   ```bash
   npm list recharts
   ```

2. Check that data is in correct format with console logs:
   ```typescript
   console.log("Revenue Trend:", revenueTrend);
   ```

### API errors

1. Check API base URL in component
2. Verify backend endpoints are running
3. Check browser console for CORS errors

### Loading state persists

1. Verify API responses are successful
2. Check network tab for failed requests
3. Ensure data structure matches interfaces

## Performance

- All API calls are parallelized using `Promise.all()`
- Charts use ResponsiveContainer for optimal rendering
- Click handlers use event delegation for efficiency
- Loading state prevents flickering

## Future Enhancements

Consider adding:

- Real-time data updates with WebSockets
- Export dashboard data to PDF/Excel
- Date range filters for charts
- Drill-down capabilities on charts
- Comparison with previous periods
- Budget vs actual analysis
