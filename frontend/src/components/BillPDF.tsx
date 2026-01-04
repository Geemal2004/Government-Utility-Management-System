import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// Register fonts (optional - for better typography)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxP.ttf',
// });

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

interface BillPDFProps {
  bill: BillData;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #2563eb",
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.4,
  },
  billTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
    textAlign: "right",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    backgroundColor: "#f3f4f6",
    padding: 6,
    borderRadius: 3,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoColumn: {
    flex: 1,
    minWidth: "45%",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 9,
    color: "#6b7280",
    width: 100,
  },
  infoValue: {
    fontSize: 9,
    color: "#1f2937",
    fontWeight: "bold",
    flex: 1,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 3,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 2,
    borderBottomColor: "#d1d5db",
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 6,
  },
  tableRowAlt: {
    backgroundColor: "#f9fafb",
  },
  tableCol: {
    flex: 1,
  },
  tableColHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
  },
  tableCell: {
    fontSize: 9,
    color: "#1f2937",
  },
  tableCellRight: {
    textAlign: "right",
  },
  tableCellBold: {
    fontWeight: "bold",
  },
  chargesTable: {
    marginTop: 5,
  },
  chargeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  chargeRowIndent: {
    paddingLeft: 20,
  },
  chargeRowTotal: {
    backgroundColor: "#eff6ff",
    borderTopWidth: 2,
    borderTopColor: "#2563eb",
    paddingVertical: 6,
    marginTop: 5,
  },
  chargeLabel: {
    fontSize: 9,
    color: "#1f2937",
  },
  chargeLabelBold: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1f2937",
  },
  chargeAmount: {
    fontSize: 9,
    color: "#1f2937",
    textAlign: "right",
    minWidth: 80,
  },
  chargeAmountBold: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2563eb",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  statusPaid: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  statusUnpaid: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  statusOverdue: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  paymentBox: {
    backgroundColor: "#f0fdf4",
    padding: 10,
    borderRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
    marginBottom: 10,
  },
  paymentStamp: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#15803d",
    textAlign: "center",
    marginBottom: 5,
  },
  notesBox: {
    backgroundColor: "#fef3c7",
    padding: 10,
    borderRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  noteText: {
    fontSize: 8,
    color: "#78350f",
    lineHeight: 1.5,
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: "1 solid #e5e7eb",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 1.5,
  },
});

const BillPDF: React.FC<BillPDFProps> = ({ bill }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isOverdue =
    new Date(bill.dueDate) < new Date() && bill.status !== "PAID";
  const isPaid = bill.status === "PAID";

  const subtotalBeforeDeductions =
    bill.billDetails.reduce((sum, item) => sum + item.amount, 0) +
    bill.fixedCharge;
  const totalDeductions = (bill.subsidy || 0) + (bill.solarCredit || 0);
  const amountBeforeTax = subtotalBeforeDeductions - totalDeductions;
  const totalTax = bill.taxes.reduce((sum, tax) => sum + tax.taxAmount, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>
                Government Utility Services
              </Text>
              <Text style={styles.companyAddress}>
                123 Main Street, Colombo 01, Sri Lanka{"\n"}
                Phone: +94 11 234 5678{"\n"}
                Email: info@govutility.lk{"\n"}
                Web: www.govutility.lk
              </Text>
            </View>
            <View>
              <Text style={styles.billTitle}>UTILITY BILL</Text>
            </View>
          </View>
        </View>

        {/* Bill Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bill Number:</Text>
                <Text style={styles.infoValue}>#{bill.billNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bill Date:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(bill.billDate)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Due Date:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    isOverdue ? { color: "#dc2626" } : {},
                  ]}
                >
                  {formatDate(bill.dueDate)} {isOverdue && "(OVERDUE)"}
                </Text>
              </View>
            </View>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Billing Period:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(bill.billingPeriodStart)} -{" "}
                  {formatDate(bill.billingPeriodEnd)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isPaid
                      ? styles.statusPaid
                      : isOverdue
                      ? styles.statusOverdue
                      : styles.statusUnpaid,
                  ]}
                >
                  <Text>{bill.status}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Customer Name:</Text>
                <Text style={styles.infoValue}>
                  {bill.customer.firstName} {bill.customer.lastName}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Customer ID:</Text>
                <Text style={styles.infoValue}>{bill.customer.customerId}</Text>
              </View>
            </View>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contact:</Text>
                <Text style={styles.infoValue}>{bill.customer.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{bill.customer.email}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>
              {bill.serviceConnection.address}
            </Text>
          </View>
        </View>

        {/* Meter Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meter Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Meter Serial:</Text>
                <Text style={styles.infoValue}>{bill.meter.meterSerialNo}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Meter Type:</Text>
                <Text style={styles.infoValue}>{bill.meter.meterType}</Text>
              </View>
            </View>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Utility Type:</Text>
                <Text style={styles.infoValue}>
                  {bill.serviceConnection.utilityType}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tariff Category:</Text>
                <Text style={styles.infoValue}>
                  {bill.serviceConnection.tariffCategory}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Consumption Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consumption Details</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={[styles.tableCol, { flex: 1.5 }]}>
                <Text style={styles.tableColHeader}>Description</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableColHeader, styles.tableCellRight]}>
                  Previous
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableColHeader, styles.tableCellRight]}>
                  Current
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableColHeader, styles.tableCellRight]}>
                  Consumption
                </Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCol, { flex: 1.5 }]}>
                <Text style={styles.tableCell}>Reading</Text>
              </View>
              <View style={styles.tableCol}>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellRight,
                    styles.tableCellBold,
                  ]}
                >
                  {bill.consumption.previousReading.toFixed(3)}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellRight,
                    styles.tableCellBold,
                  ]}
                >
                  {bill.consumption.currentReading.toFixed(3)}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellRight,
                    styles.tableCellBold,
                  ]}
                >
                  {bill.consumption.consumedUnits.toFixed(3)} units
                </Text>
              </View>
            </View>
            <View style={[styles.tableRow, styles.tableRowAlt]}>
              <View style={[styles.tableCol, { flex: 1.5 }]}>
                <Text style={styles.tableCell}>Reading Date</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, styles.tableCellRight]}>
                  {new Date(
                    bill.consumption.previousReadingDate
                  ).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={[styles.tableCell, styles.tableCellRight]}>
                  {new Date(
                    bill.consumption.currentReadingDate
                  ).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}></Text>
              </View>
            </View>
            {bill.consumption.exportUnits &&
              bill.consumption.exportUnits > 0 && (
                <View style={styles.tableRow}>
                  <View style={[styles.tableCol, { flex: 1.5 }]}>
                    <Text style={styles.tableCell}>Solar Export</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}></Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}></Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.tableCellRight,
                        { color: "#15803d" },
                      ]}
                    >
                      {bill.consumption.exportUnits.toFixed(3)} units
                    </Text>
                  </View>
                </View>
              )}
          </View>
        </View>

        {/* Charges Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charges Breakdown</Text>
          <View style={styles.chargesTable}>
            {/* Energy Charges */}
            <View style={styles.chargeRow}>
              <Text style={styles.chargeLabelBold}>Energy Charges:</Text>
              <Text style={styles.chargeAmount}></Text>
            </View>
            {bill.billDetails.map((detail, index) => (
              <View
                key={index}
                style={[
                  styles.chargeRow,
                  styles.chargeRowIndent,
                  index % 2 === 0 ? styles.tableRowAlt : {},
                ]}
              >
                <Text style={styles.chargeLabel}>
                  {detail.slabRange} @ {formatCurrency(detail.ratePerUnit)}/unit{" "}
                  ({detail.units.toFixed(3)} units)
                </Text>
                <Text style={styles.chargeAmount}>
                  {formatCurrency(detail.amount)}
                </Text>
              </View>
            ))}

            {/* Fixed Charge */}
            <View style={[styles.chargeRow, styles.tableRowAlt]}>
              <Text style={styles.chargeLabel}>Fixed Charges</Text>
              <Text style={styles.chargeAmount}>
                {formatCurrency(bill.fixedCharge)}
              </Text>
            </View>

            {/* Subtotal */}
            <View
              style={[
                styles.chargeRow,
                { borderTopWidth: 1, borderTopColor: "#d1d5db", marginTop: 5 },
              ]}
            >
              <Text style={styles.chargeLabelBold}>Subtotal</Text>
              <Text style={[styles.chargeAmount, styles.tableCellBold]}>
                {formatCurrency(subtotalBeforeDeductions)}
              </Text>
            </View>

            {/* Deductions */}
            {bill.subsidy && bill.subsidy > 0 && (
              <View style={styles.chargeRow}>
                <Text style={[styles.chargeLabel, { color: "#15803d" }]}>
                  Subsidy (Government)
                </Text>
                <Text style={[styles.chargeAmount, { color: "#15803d" }]}>
                  -{formatCurrency(bill.subsidy)}
                </Text>
              </View>
            )}
            {bill.solarCredit && bill.solarCredit > 0 && (
              <View style={styles.chargeRow}>
                <Text style={[styles.chargeLabel, { color: "#15803d" }]}>
                  Solar Export Credit (
                  {bill.consumption.exportUnits?.toFixed(3)} units)
                </Text>
                <Text style={[styles.chargeAmount, { color: "#15803d" }]}>
                  -{formatCurrency(bill.solarCredit)}
                </Text>
              </View>
            )}

            {/* Amount Before Tax */}
            <View style={[styles.chargeRow, styles.tableRowAlt]}>
              <Text style={styles.chargeLabelBold}>Amount Before Tax</Text>
              <Text style={[styles.chargeAmount, styles.tableCellBold]}>
                {formatCurrency(amountBeforeTax)}
              </Text>
            </View>

            {/* Taxes */}
            {bill.taxes.map((tax, index) => (
              <View key={index} style={styles.chargeRow}>
                <Text style={styles.chargeLabel}>
                  {tax.taxName} ({tax.ratePercent}%)
                </Text>
                <Text style={styles.chargeAmount}>
                  {formatCurrency(tax.taxAmount)}
                </Text>
              </View>
            ))}

            {/* Total */}
            <View style={styles.chargeRowTotal}>
              <Text style={[styles.chargeLabelBold, { fontSize: 12 }]}>
                TOTAL AMOUNT DUE
              </Text>
              <Text style={styles.chargeAmountBold}>
                {formatCurrency(bill.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        {isPaid && bill.payments && bill.payments.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.paymentBox}>
              <Text style={styles.paymentStamp}>✓ PAID</Text>
              {bill.payments.map((payment, index) => (
                <View key={index}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: "#15803d" }]}>
                      Payment Date:
                    </Text>
                    <Text style={[styles.infoValue, { color: "#15803d" }]}>
                      {formatDate(payment.paymentDate)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: "#15803d" }]}>
                      Payment Method:
                    </Text>
                    <Text style={[styles.infoValue, { color: "#15803d" }]}>
                      {payment.paymentMethod}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: "#15803d" }]}>
                      Amount:
                    </Text>
                    <Text style={[styles.infoValue, { color: "#15803d" }]}>
                      {formatCurrency(payment.paymentAmount)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoColumn}>
                <Text
                  style={[
                    styles.chargeLabel,
                    styles.tableCellBold,
                    { marginBottom: 3 },
                  ]}
                >
                  Online Payment:
                </Text>
                <Text style={styles.chargeLabel}>
                  Visit: www.govutility.lk/pay{"\n"}
                  Enter Bill Number: #{bill.billNumber}
                </Text>
              </View>
              <View style={styles.infoColumn}>
                <Text
                  style={[
                    styles.chargeLabel,
                    styles.tableCellBold,
                    { marginBottom: 3 },
                  ]}
                >
                  Bank Transfer:
                </Text>
                <Text style={styles.chargeLabel}>
                  Bank: People's Bank{"\n"}
                  Account: 123-4567-8901-2345{"\n"}
                  Reference: {bill.billNumber}
                </Text>
              </View>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoColumn}>
                <Text
                  style={[
                    styles.chargeLabel,
                    styles.tableCellBold,
                    { marginBottom: 3 },
                  ]}
                >
                  Office Payment:
                </Text>
                <Text style={styles.chargeLabel}>
                  Visit any Utility Service Center{"\n"}
                  Monday - Friday: 8:00 AM - 4:00 PM
                </Text>
              </View>
              <View style={styles.infoColumn}>
                <Text
                  style={[
                    styles.chargeLabel,
                    styles.tableCellBold,
                    { marginBottom: 3 },
                  ]}
                >
                  Mobile Payment:
                </Text>
                <Text style={styles.chargeLabel}>
                  Use our mobile app{"\n"}
                  Available on App Store & Google Play
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Important Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Notes</Text>
          <View style={styles.notesBox}>
            <Text style={styles.noteText}>
              • Payment must be received by the due date to avoid late payment
              penalties.
            </Text>
            <Text style={styles.noteText}>
              • A penalty of 2% per month will be charged on overdue amounts.
            </Text>
            <Text style={styles.noteText}>
              • Service may be disconnected if payment is not received within 30
              days of due date.
            </Text>
            <Text style={styles.noteText}>
              • For billing inquiries or disputes, contact our customer service
              within 7 days.
            </Text>
            <Text style={styles.noteText}>
              • Customer Service: +94 11 234 5678 | Email: support@govutility.lk
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a computer-generated bill and does not require a signature.
            {"\n"}
            Terms and conditions apply. Visit www.govutility.lk/terms for
            details.{"\n"}
            Page 1 of 1
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default BillPDF;
