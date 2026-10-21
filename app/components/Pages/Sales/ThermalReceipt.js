import React, { useEffect, useState, useContext, useMemo } from "react"
import { Printer, X, Loader2, FileText, Receipt } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"
import formatNaira from "../../Reusables/NairaFormatter"
import Axios from "axios"

export default function ReceiptContainer({ receiptId }) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const initialData =
    appState.tempReceiptData ||
    appState.receiptData ||
    appState.receitData ||
    null

  const [localSaleData, setLocalSaleData] = useState(initialData)
  const [companyConfig, setCompanyConfig] = useState(null)
  const [isFetching, setIsFetching] = useState(false)
  const [layoutType, setLayoutType] = useState("thermal")

  // --- HARDWARE STACK PRINT IFRAME ENGINE (WITH NATIVE STYLING INJECTION) ---
  const handlePrint = () => {
    const printableContent = document.getElementById(
      "nexus-printable-area",
    )?.innerHTML
    if (!printableContent) return

    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "none"
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document

    // Thermal roll (58mm/80mm) vs Standard A4 layout rules
    const isThermal = layoutType === "thermal"

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt - ${localSaleData?.invoiceId || "POS"}</title>
          <style>
            /* 1. Global Reset & Print Margins */
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            @page {
              size: ${isThermal ? "80mm auto" : "A4 portrait"};
              margin: ${isThermal ? "0mm" : "12mm"};
            }

            body {
              font-family: ${
                isThermal
                  ? "'Courier New', Courier, monospace"
                  : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              };
              background: #fff;
              color: #000;
              padding: ${isThermal ? "4mm 3mm 8mm 3mm" : "10mm"};
              width: ${isThermal ? "74mm" : "100%"};
              margin: 0 auto;
              font-size: ${isThermal ? "11px" : "13px"};
              line-height: ${isThermal ? "1.3" : "1.4"};
            }

            /* 2. Emulated Tailwind Layout Engine for Print */
            .flex { display: flex !important; }
            .flex-col { flex-direction: column !important; }
            .items-center { align-items: center !important; }
            .items-start { align-items: flex-start !important; }
            .justify-between { justify-content: space-between !important; }
            .justify-end { justify-content: flex-end !important; }
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .text-left { text-align: left !important; }

            .font-bold { font-weight: 700 !important; }
            .font-semibold { font-weight: 600 !important; }
            .font-black { font-weight: 900 !important; }
            .uppercase { text-transform: uppercase !important; }
            .italic { font-style: italic !important; }

            /* Font Sizes */
            .text-\\[10px\\] { font-size: 9.5px !important; }
            .text-\\[11px\\] { font-size: 10.5px !important; }
            .text-xs { font-size: 11px !important; }
            .text-sm { font-size: 13px !important; }
            .text-base { font-size: 14px !important; }
            .text-xl { font-size: 18px !important; }
            .text-2xl { font-size: 22px !important; }

            /* Spacing */
            .mt-0\\.5 { margin-top: 2px !important; }
            .mt-1 { margin-top: 4px !important; }
            .mt-2 { margin-top: 6px !important; }
            .mt-3 { margin-top: 8px !important; }
            .mt-4 { margin-top: 12px !important; }
            .mt-6 { margin-top: 16px !important; }
            .mt-10 { margin-top: 24px !important; }
            .mb-2 { margin-bottom: 6px !important; }
            .mb-3 { margin-bottom: 8px !important; }
            .mb-4 { margin-bottom: 12px !important; }
            .mb-6 { margin-bottom: 16px !important; }
            
            .py-1 { padding-top: 2px !important; padding-bottom: 2px !important; }
            .py-2 { padding-top: 6px !important; padding-bottom: 6px !important; }
            .py-2\\.5 { padding-top: 7px !important; padding-bottom: 7px !important; }
            .px-3 { padding-left: 8px !important; padding-right: 8px !important; }
            .pt-1 { padding-top: 4px !important; }
            .pt-1\\.5 { padding-top: 6px !important; }
            .pt-2 { padding-top: 8px !important; }
            .pt-3 { padding-top: 10px !important; }
            .pt-4 { padding-top: 12px !important; }
            .pb-1 { padding-bottom: 4px !important; }
            .pb-6 { padding-bottom: 16px !important; }

            .space-y-0\\.5 > * + * { margin-top: 2px !important; }
            .space-y-1 > * + * { margin-top: 3px !important; }
            .space-y-2 > * + * { margin-top: 6px !important; }
            .space-y-3 > * + * { margin-top: 8px !important; }

            .w-full { width: 100% !important; }
            .w-16 { width: 45px !important; }
            .w-64 { width: 240px !important; }

            /* Borders */
            .border-t { border-top: 1px dashed #000 !important; }
            .border-b { border-bottom: 1px dashed #000 !important; }
            .border-dashed { border-style: dashed !important; }
            .border-gray-200, .border-gray-300 { border-color: #555 !important; }
            .border-collapse { border-collapse: collapse !important; }

            /* Table Formatting */
            table { width: 100% !important; border-collapse: collapse !important; }
            th, td { vertical-align: top !important; }

            /* QR & Image Scaling */
            svg { display: block !important; margin: 0 auto !important; }
          </style>
        </head>
        <body>
          <div>
            ${printableContent}
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.parent.document.body.removeChild(window.frameElement);
              }, 250);
            });
          </script>
        </body>
      </html>
    `)
    doc.close()
  }

  useEffect(() => {
    if (initialData) {
      setLocalSaleData(initialData)
    }
  }, [initialData])

  useEffect(() => {
    async function fetchReceiptAndConfig() {
      const token = appState.user?.token || localStorage.getItem("token")
      const targetId =
        receiptId || appState.tempReceiptId || appState.activeReceiptId

      if (!targetId && localSaleData?.items?.length) return

      setIsFetching(true)
      try {
        const [receiptRes, configRes] = await Promise.all([
          targetId
            ? Axios.post(`${appState.backendURL}/get-receipt-data`, {
                token,
                id: targetId,
              })
            : Promise.resolve({ data: initialData }),
          Axios.post(`${appState.backendURL}/get-company-config`, {
            token,
          }).catch(() => ({
            data: null,
          })),
        ])

        if (receiptRes?.data) setLocalSaleData(receiptRes.data)
        if (configRes?.data) setCompanyConfig(configRes.data)
      } catch (error) {
        console.error("Error retrieving invoice details:", error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchReceiptAndConfig()
  }, [
    receiptId,
    appState.tempReceiptId,
    appState.activeReceiptId,
    appState.backendURL,
    appState.user?.token,
  ])

  const company = useMemo(
    () => ({
      name:
        companyConfig?.companyName ||
        appState.user?.storeName ||
        appState.user?.businessName ||
        "NexusPOS Store",
      address: companyConfig?.address || "Commercial Hub",
      phone: companyConfig?.phone || appState.user?.phone || "N/A",
      email: companyConfig?.email || appState.user?.email || "sales@store.pos",
      tin: companyConfig?.tin || "N/A",
      vatRate: companyConfig?.vatRate || 0,
      footer: companyConfig?.receiptFooter || "Thank you for your patronage!",
    }),
    [companyConfig, appState.user],
  )

  if (isFetching || !localSaleData) {
    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white w-full max-w-xs rounded-2xl shadow-xl p-8 flex flex-col items-center">
          <Loader2 size={32} className="animate-spin text-indigo-600 mb-3" />
          <p className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">
            Generating Receipt...
          </p>
        </div>
      </div>
    )
  }

  const grandTotal = parseFloat(localSaleData.total || 0)
  const amountPaid = parseFloat(
    localSaleData.amountPaid ??
      localSaleData.paid ??
      localSaleData.payment?.amount ??
      grandTotal,
  )
  const balanceOwed = parseFloat(
    localSaleData.balanceToCredit ??
      localSaleData.balanceOwed ??
      Math.max(0, grandTotal - amountPaid),
  )
  const rawSubtotal = grandTotal / (1 + (company.vatRate || 0) / 100)
  const calculatedTax = grandTotal - rawSubtotal

  const paymentMethodLabel =
    localSaleData.payment?.method ||
    localSaleData.payment?.type ||
    localSaleData.paymentMethod ||
    "Cash"

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        className={`bg-white w-full transition-all rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] border border-gray-200 ${
          layoutType === "standard" ? "max-w-3xl" : "max-w-sm"
        }`}
      >
        {/* --- DYNAMIC ACTION HEADER --- */}
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-slate-50 select-none shrink-0">
          <div className="flex bg-gray-200/70 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setLayoutType("thermal")}
              className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                layoutType === "thermal"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Receipt size={13} /> Thermal
            </button>
            <button
              type="button"
              onClick={() => setLayoutType("standard")}
              className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                layoutType === "standard"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <FileText size={13} /> Standard A4
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm text-xs font-bold"
              title="Print Receipt"
            >
              <Printer size={15} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => appDispatch({ type: "closeReceipt" })}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* --- PRINTABLE CANVAS WRAPPER --- */}
        <div
          id="nexus-printable-area"
          className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-white"
        >
          {/* ======================================================= */}
          {/* OPTION A: THERMAL 58MM / 80MM RECEIPT VIEW             */}
          {/* ======================================================= */}
          {layoutType === "thermal" && (
            <div className="w-full mx-auto flex flex-col items-center text-gray-900 font-mono text-xs">
              <div className="text-center mb-4">
                <h2 className="text-sm font-bold uppercase tracking-tight">
                  {company.name}
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {company.address}
                </p>
                <p className="text-[10px] text-gray-500">
                  Tel: {company.phone}
                </p>
              </div>

              <div className="w-full border-t border-b border-dashed border-gray-300 py-2 mb-3 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>INVOICE:</span>
                  <span className="font-bold">{localSaleData.invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold uppercase truncate max-w-[150px]">
                    {localSaleData.customerName || "Walk-in"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>STAFF:</span>
                  <span className="font-bold uppercase">
                    {localSaleData.staffName ||
                      appState.user?.username ||
                      "Staff"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>
                    {new Date(
                      localSaleData.createdAt || Date.now(),
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="w-full space-y-2 mb-4 text-[11px]">
                <div className="flex justify-between font-bold border-b border-gray-200 pb-1 text-[10px] text-gray-500 uppercase">
                  <span>Item</span>
                  <span>Total</span>
                </div>
                {localSaleData.items?.map((item, idx) => {
                  const quantity = parseFloat(
                    item.quantity ?? item.qty ?? item.unitsSold ?? 1,
                  )
                  const rate = parseFloat(
                    item.priceAtSale ?? item.price ?? item.sellingPrice ?? 0,
                  )
                  const lineSubtotal = parseFloat(
                    item.subtotal ?? rate * quantity,
                  )

                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between font-bold">
                        <span className="uppercase truncate max-w-[170px]">
                          {item.name || "Product Item"}
                        </span>
                        <span>{formatNaira(lineSubtotal)}</span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {quantity} x {formatNaira(rate)}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Settlement Totals */}
              <div className="w-full border-t border-dashed border-gray-300 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatNaira(rawSubtotal)}</span>
                </div>
                {company.vatRate > 0 && (
                  <div className="flex justify-between">
                    <span>VAT ({company.vatRate}%):</span>
                    <span>{formatNaira(calculatedTax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5 mt-1">
                  <span>TOTAL:</span>
                  <span>{formatNaira(grandTotal)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>PAID ({paymentMethodLabel}):</span>
                  <span>{formatNaira(amountPaid)}</span>
                </div>
                {balanceOwed > 0 && (
                  <div className="flex justify-between font-bold border-t border-dashed border-gray-200 pt-1">
                    <span>BALANCE DUE:</span>
                    <span>{formatNaira(balanceOwed)}</span>
                  </div>
                )}
              </div>

              {/* Footer Notice & QR */}
              <div className="mt-6 text-center space-y-3 flex flex-col items-center w-full">
                <p className="text-[10px] text-gray-600 uppercase tracking-tight text-center max-w-[220px]">
                  {company.footer}
                </p>
                <QRCodeSVG
                  value={`INV:${localSaleData.invoiceId}|AMT:${grandTotal}`}
                  size={65}
                  level="M"
                />
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* OPTION B: STANDARD INVOICE VIEW                         */}
          {/* ======================================================= */}
          {layoutType === "standard" && (
            <div className="p-4 text-gray-900 font-sans text-xs">
              <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                <div>
                  <h1 className="text-xl font-bold uppercase tracking-tight">
                    {company.name}
                  </h1>
                  <p className="text-gray-500 text-xs mt-1 max-w-xs">
                    {company.address}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Phone: {company.phone}
                  </p>
                  <p className="text-gray-500 text-xs">TIN: {company.tin}</p>
                </div>

                <div className="text-right space-y-1">
                  <h2 className="text-2xl font-black text-gray-400 uppercase tracking-tight">
                    Sales Invoice
                  </h2>
                  <p className="text-gray-800 font-mono font-bold">
                    {localSaleData.invoiceId}
                  </p>
                  <p className="text-gray-500">
                    Date:{" "}
                    {new Date(
                      localSaleData.createdAt || Date.now(),
                    ).toLocaleDateString()}
                  </p>
                  <p className="text-gray-500">
                    Client:{" "}
                    <span className="font-bold text-gray-800">
                      {localSaleData.customerName || "Walk-in"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase text-gray-500">
                    <th className="py-2.5 px-3 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 text-left">Item Description</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {localSaleData.items?.map((item, idx) => {
                    const quantity = parseFloat(
                      item.quantity ?? item.qty ?? item.unitsSold ?? 1,
                    )
                    const rate = parseFloat(
                      item.priceAtSale ?? item.price ?? item.sellingPrice ?? 0,
                    )
                    const lineSubtotal = parseFloat(
                      item.subtotal ?? rate * quantity,
                    )

                    return (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-800">
                          {quantity}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-900 uppercase">
                          {item.name || "Product Item"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {formatNaira(rate)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                          {formatNaira(lineSubtotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Summary Balances */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-2 border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Taxable Subtotal:</span>
                    <span>{formatNaira(rawSubtotal)}</span>
                  </div>
                  {company.vatRate > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>VAT ({company.vatRate}%):</span>
                      <span>{formatNaira(calculatedTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>{formatNaira(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Amount Paid ({paymentMethodLabel}):</span>
                    <span>{formatNaira(amountPaid)}</span>
                  </div>
                  {balanceOwed > 0 && (
                    <div className="flex justify-between font-bold border-t border-dashed border-gray-200 pt-1">
                      <span>Outstanding Debt:</span>
                      <span>{formatNaira(balanceOwed)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 pt-4 border-t border-gray-100">
                <p className="text-[11px] text-gray-500 italic">
                  {company.footer}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
