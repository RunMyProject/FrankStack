// ============================================================================
//  Component: PaymentInvoice
//  Description: Displays a completed payment invoice card with openable PDF
//  Author: Edoardo Sabatini
//  Date: 28/10/2025
// ============================================================================

import React from "react";
import { FileText } from "lucide-react"; // PDF icon

// ============================================================================
//  Props Interface
// ============================================================================
interface PaymentInvoiceProps {
  invoiceNumber: string | number;
  clientName: string;
  amount: number;
  issuedDate: string;
  status: "Paid" | "Issued";
  pdfUrl: string;
}

// ============================================================================
//  PaymentInvoice Component
// ============================================================================
const PaymentInvoice: React.FC<PaymentInvoiceProps> = ({
  invoiceNumber,
  clientName,
  amount,
  issuedDate,
  status,
  pdfUrl,
}) => {
  // Handle open in browser
  const handleOpenPdf = (): void => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } else {
      console.warn(`Missing PDF URL for invoice #${invoiceNumber}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div 
          className="flex items-center gap-2 group cursor-pointer"
          onClick={handleOpenPdf}
        >
          <FileText 
            size={20} 
            className="text-blue-600 transition-transform duration-300 group-hover:scale-110" 
          />
          <h2 className="text-lg font-semibold text-gray-800">
            Invoice #{invoiceNumber}
          </h2>
        </div>
        <span
          className={`text-sm font-medium px-2 py-1 rounded-lg ${
            status === "Paid"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Client Info */}
      <div className="mb-2">
        <p className="text-gray-600 text-sm">Client:</p>
        <p className="text-gray-900 font-medium">{clientName}</p>
      </div>

      {/* Amount */}
      <div className="mb-2">
        <p className="text-gray-600 text-sm">Amount:</p>
        <p className="text-gray-900 font-semibold text-lg">€{amount}</p>
      </div>

      {/* Issued Date */}
      <div className="mb-4">
        <p className="text-gray-600 text-sm">Issued Date:</p>
        <p className="text-gray-900">{issuedDate}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-2">
        <button
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
          onClick={handleOpenPdf}
        >
          <FileText size={16} />
          Open PDF
        </button>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          Open in browser
        </a>
      </div>
    </div>
  );
};

export default PaymentInvoice;
