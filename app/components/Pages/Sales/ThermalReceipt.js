import React, { useContext } from "react"
import { Printer, X } from "lucide-react"
// 1. Import the QR Code component
import { QRCodeSVG } from "qrcode.react"
import DispatchContext from "../../../DispatchContext"

export default function ThermalReceipt({ saleData }) {
  saleData = {
    invoiceNo: "INV-2026-0882",
    date: "2026-03-30T14:45:00Z",
    customer: {
      name: "Alex Rivera",
      phone: "+234 810 123 4567",
    },
    items: [
      {
        sku: "SG-50",
        name: "Sugar (Fine Grain)",
        qty: 2,
        unit: "Sack",
        price: 45.0,
      },
      {
        sku: "MK-1L",
        name: "Fresh Milk 1L",
        qty: 1,
        unit: "Carton",
        price: 12.5,
      },
      {
        sku: "BR-WD",
        name: "Whole Wheat Bread",
        qty: 3,
        unit: "pcs",
        price: 2.2,
      },
    ],
    subtotal: 109.1,
    tax: 0.0,
    total: 109.1,
    paymentMethod: "Cash",
    amountReceived: 120.0,
    change: 10.9,
  }

  const appDispatch = useContext(DispatchContext)
  const handlePrint = () => {
    // In production, trigger the print dialog.
    // Requires specific CSS (@media print) to isolate this component.
    window.print()
  }

  // Generate a friendly name based on date/invoice for download
  const downloadFileName = `Receipt_${saleData.invoiceNo || "INV-000"}.svg`

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:p-0 print:bg-white print:block">
      {/* 2. Modal/Paper Container */}
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-h-full print:w-full">
        {/* Actions Header (Hidden during print) */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print:hidden">
          <h3 className="text-sm font-semibold text-gray-700">
            Receipt Preview
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              title="Print"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={() => appDispatch({ type: "closeReceipt" })}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* --- PHYSICAL RECEIPT PAPER CONTENT --- */}
        {/* The 'id' is for targetting in print CSS */}
        <div
          className="p-8 overflow-y-auto bg-white flex flex-col items-center print:p-2"
          id="printable-receipt"
        >
          {/* A. Shop Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight uppercase">
              My Store POS
            </h2>
            <p className="text-[11px] text-gray-500 font-medium">
              123 Business Avenue, Lagos, Nigeria
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              Tel: +234 800 000 0000
            </p>
          </div>

          {/* B. Sale Metadata (Dashed borders work great on thermal) */}
          <div className="w-full border-t border-b border-dashed border-gray-200 py-3 mb-4 space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-gray-600">
              <span>Receipt #:</span>
              <span className="font-semibold text-gray-800">
                {saleData.invoiceNo || "INV-9042"}
              </span>
            </div>
            <div className="flex justify-between text-[11px] font-medium text-gray-600">
              <span>Date:</span>
              <span className="font-semibold text-gray-800">
                {new Date().toLocaleString("en-NG")}
              </span>
            </div>
            <div className="flex justify-between text-[11px] font-medium text-gray-600">
              <span>Cashier:</span>
              <span className="font-semibold text-gray-800">Admin</span>
            </div>
          </div>

          {/* C. Items Table */}
          <div className="w-full space-y-3 mb-6">
            <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Item Description</span>
              <span>Total</span>
            </div>

            {saleData.items && saleData.items.length > 0 ? (
              saleData.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-800">
                    <span>{item.name}</span>
                    <span>${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium italic">
                    {item.qty} {item.unit || "pcs"} x ${item.price.toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs italic text-gray-400 py-2">
                No items in sale
              </div>
            )}
          </div>

          {/* D. Totals Section */}
          <div className="w-full border-t border-dashed border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-xs font-medium text-gray-600">
              <span>Subtotal</span>
              <span>${saleData.subtotal?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between text-xs font-medium text-gray-600">
              <span>Tax (0%)</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
              <span>TOTAL</span>
              <span>${saleData.total?.toFixed(2) || "0.00"}</span>
            </div>
          </div>

          {/* E. Natural Footer with QR Code */}
          <div className="mt-10 text-center space-y-4 flex flex-col items-center">
            <p className="text-[11px] font-semibold text-gray-800 italic leading-snug">
              Thank you for your business!
            </p>

            {/* 3. The QR Code Implementation */}
            {/* Using SVG ensures infinite scalability and sharp printing */}
            <div className="p-2 border border-gray-100 rounded-xl shadow-inner bg-white print:p-0 print:border-none print:shadow-none">
              <QRCodeSVG
                // In production, this can link to a digital copy:
                // `https://mystore.com/v/${saleData.invoiceNo}`
                value={`Verification ID: ${saleData.invoiceNo || "UNKNOWN"}`}
                size={90} // Standard size for thermal (80mm) paper
                bgColor={"#ffffff"} // Force white bg for high contrast
                fgColor={"#000000"} // Force black fg for thermal
                level={"M"} // Medium error correction (good balance)
                includeMargin={true} // Add white space around QR
              />
            </div>

            <p className="text-[9px] text-gray-400 font-medium leading-none">
              Software by MyStore POS
            </p>
          </div>
        </div>
        {/* --- END RECEIPT PAPER --- */}

        {/* Main Actions Footer (Hidden during print) */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 print:hidden">
          <button
            onClick={() => appDispatch({ type: "closeReceipt" })}
            className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-indigo-700 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Printer size={18} strokeWidth={2.5} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  )
}
