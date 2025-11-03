/**
 * InvoiceDownload.tsx
 * -----------------------
 * Frontend component to show invoice info and open PDF via proxy backend.
 *
 * Author: Assistant (for Edoardo Sabatini)
 * Date: 03 November 2025
 */

import React from 'react';

interface InvoiceDownloadProps {
  step: {
    status: string;
    id: string;
    invoiceUrl?: string;
  };
  totalAmount: number;
}

const InvoiceDownload: React.FC<InvoiceDownloadProps> = ({ step, totalAmount }) => {
  if (step.status !== 'completed' || step.id !== 'service-d' || !step.invoiceUrl) {
    return null;
  }

  // Extract invoice ID or fallback to timestamp
  const invoiceNumber =
    step.invoiceUrl.match(/invoices\/([0-9a-f-]+)\//i)?.[1] ||
    Date.now().toString().slice(-6);

  const currentDate = new Date().toLocaleDateString('en-US');

  const handleOpenPdf = () => {
    // Call backend proxy instead of direct S3
    const proxyUrl = `http://localhost:3007/invoice/${invoiceNumber}.pdf`;
    console.log("Call backend proxy instead of direct S3 -> proxyUrl:", proxyUrl);
    window.open(proxyUrl, '_blank');
  };

  return (
    <div className="mt-3 bg-white rounded-2xl shadow-md p-4 w-full">
      <div className="flex justify-between items-center mb-3">
        <div
          className="flex items-center gap-2 group cursor-pointer"
          onClick={handleOpenPdf}
        >
          <svg
            className="w-5 h-5 text-blue-600 transition-transform group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800">
            Invoice #{invoiceNumber}
          </h2>
        </div>
        <span className="text-sm font-medium px-2 py-1 rounded-lg bg-green-100 text-green-700">
          Paid
        </span>
      </div>

      <div className="mb-2">
        <p className="text-gray-600 text-sm">Client:</p>
        <p className="text-gray-900 font-medium">Customer</p>
      </div>

      <div className="mb-2">
        <p className="text-gray-600 text-sm">Amount:</p>
        <p className="text-gray-900 font-semibold text-lg">
          €{totalAmount.toFixed(2)}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-gray-600 text-sm">Issued Date:</p>
        <p className="text-gray-900">{currentDate}</p>
      </div>

      <div className="flex justify-center">
        <button
          className="w-full text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md"
          onClick={handleOpenPdf}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Open PDF Report
        </button>
      </div>
    </div>
  );
};

export default InvoiceDownload;
