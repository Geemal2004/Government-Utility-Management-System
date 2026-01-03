"use client";

import React, { useState } from "react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import BillPDF from "./BillPDF";
import {
  ArrowDownTrayIcon,
  EyeIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

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

interface BillPDFDownloadProps {
  bill: BillData;
  variant?: "button" | "link";
  showPreview?: boolean;
}

const BillPDFDownload: React.FC<BillPDFDownloadProps> = ({
  bill,
  variant = "button",
  showPreview = false,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileName = `Bill_${bill.billNumber}_${bill.customer.lastName}.pdf`;

  const handlePrint = () => {
    // Open preview in new window for printing
    setIsPreviewOpen(true);
  };

  if (variant === "link") {
    return (
      <div className="flex items-center gap-2">
        <PDFDownloadLink
          document={<BillPDF bill={bill} />}
          fileName={fileName}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
        >
          {({ loading }) => (
            <>
              <ArrowDownTrayIcon className="w-4 h-4" />
              {loading ? "Preparing..." : "Download PDF"}
            </>
          )}
        </PDFDownloadLink>

        {showPreview && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
          >
            <EyeIcon className="w-4 h-4" />
            Preview
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <PDFDownloadLink
          document={<BillPDF bill={bill} />}
          fileName={fileName}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {({ loading }) => (
            <>
              <ArrowDownTrayIcon className="w-5 h-5" />
              {loading ? "Preparing PDF..." : "Download PDF"}
            </>
          )}
        </PDFDownloadLink>

        {showPreview && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            <EyeIcon className="w-5 h-5" />
            Preview
          </button>
        )}

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
        >
          <PrinterIcon className="w-5 h-5" />
          Print
        </button>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Bill Preview
              </h3>
              <div className="flex items-center gap-2">
                <PDFDownloadLink
                  document={<BillPDF bill={bill} />}
                  fileName={fileName}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  {({ loading }) => (
                    <>
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      {loading ? "Preparing..." : "Download"}
                    </>
                  )}
                </PDFDownloadLink>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <PDFViewer width="100%" height="100%" className="border-0">
                <BillPDF bill={bill} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BillPDFDownload;
