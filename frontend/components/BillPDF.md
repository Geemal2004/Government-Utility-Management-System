# Bill PDF Generation

## Installation

Install the required package:

```bash
npm install @react-pdf/renderer
# or
yarn add @react-pdf/renderer
```

## Components

### 1. BillPDF.tsx

Core PDF document component that generates the bill layout with all sections.

### 2. BillPDFDownload.tsx

Wrapper component that provides download, preview, and print functionality.

## Usage

### Basic Usage (Download Button)

```tsx
import BillPDFDownload from "@/components/BillPDFDownload";

function BillDetailPage() {
  const bill = {
    // ... bill data
  };

  return (
    <div>
      <BillPDFDownload bill={bill} variant="button" showPreview />
    </div>
  );
}
```

### Link Variant

```tsx
<BillPDFDownload bill={bill} variant="link" showPreview />
```

### In Bills List Page

```tsx
// In your bills list table row actions:
<BillPDFDownload bill={bill} variant="link" />
```

### In Bill Detail Page

```tsx
// In the header actions section:
<BillPDFDownload bill={bill} variant="button" showPreview />
```

## Features

✅ **Professional Layout**: Multi-section PDF with header, customer info, consumption details, charges breakdown, payment info, and footer

✅ **Responsive Styling**: Clean, professional styling using @react-pdf/renderer StyleSheet

✅ **Status Indicators**: Visual badges for PAID/UNPAID/OVERDUE status

✅ **Complete Breakdown**: Itemized energy charges by slab, fixed charges, deductions (subsidy/solar credit), taxes

✅ **Payment Information**: Shows payment details if paid, payment methods if unpaid

✅ **Important Notes**: Late payment penalties, disconnection warnings, customer service contact

✅ **Download**: Generate and download PDF file

✅ **Preview**: View PDF before downloading in modal

✅ **Print**: Open PDF in new window for printing

✅ **Professional Footer**: Computer-generated disclaimer, terms link, page numbers

## Bill Data Structure

```typescript
interface BillData {
  billId: number;
  billNumber: string;
  billDate: string;
  dueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: string;
  totalAmount: number;
  customer: {
    customerId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  meter: {
    meterId: number;
    meterSerialNo: string;
    meterType: string;
  };
  serviceConnection: {
    connectionId: number;
    utilityType: string;
    tariffCategory: string;
    address: string;
  };
  consumption: {
    previousReading: number;
    previousReadingDate: string;
    currentReading: number;
    currentReadingDate: string;
    consumedUnits: number;
    exportUnits?: number;
  };
  billDetails: Array<{
    slabRange: string;
    units: number;
    ratePerUnit: number;
    amount: number;
  }>;
  fixedCharge: number;
  subsidy?: number;
  solarCredit?: number;
  taxes: Array<{
    taxName: string;
    ratePercent: number;
    taxAmount: number;
  }>;
  payments?: Array<{
    paymentId: number;
    paymentDate: string;
    paymentMethod: string;
    paymentAmount: number;
  }>;
}
```

## Customization

### Add Company Logo

In `BillPDF.tsx`, add an Image component in the header:

```tsx
import { Image } from "@react-pdf/renderer";

// In the header section:
<View style={styles.headerTop}>
  <Image src="/logo.png" style={{ width: 60, height: 60 }} />
  <View style={styles.companyInfo}>{/* ... rest of header */}</View>
</View>;
```

### Add QR Code

Install QR code generator:

```bash
npm install qrcode
```

Generate QR code as data URL and add to PDF:

```tsx
import QRCode from "qrcode";

// Generate QR code
const qrCodeDataUrl = await QRCode.toDataURL(
  `https://govutility.lk/pay/${bill.billNumber}`
);

// In PDF:
<Image src={qrCodeDataUrl} style={{ width: 80, height: 80 }} />;
```

### Change Colors

Modify the color scheme in `styles` object:

```tsx
const styles = StyleSheet.create({
  // Change primary color from blue to green:
  billTitle: {
    color: "#22c55e", // was '#2563eb'
  },
  // ... other styles
});
```

## File Naming

PDFs are named as: `Bill_{billNumber}_{lastName}.pdf`

Example: `Bill_BILL-2025-001_Perera.pdf`

## Notes

- PDFs are generated client-side in the browser
- No server processing required
- Works in all modern browsers
- Mobile-friendly (download on mobile devices)
- Preview uses iframe for in-browser viewing
- Print opens native browser print dialog

## Troubleshooting

### "Module not found" error

Make sure to install @react-pdf/renderer:

```bash
npm install @react-pdf/renderer
```

### Preview not showing

Check that PDFViewer is only rendered on client-side (use 'use client' directive).

### Slow generation for large bills

This is normal for complex PDFs. Consider adding a loading state.
