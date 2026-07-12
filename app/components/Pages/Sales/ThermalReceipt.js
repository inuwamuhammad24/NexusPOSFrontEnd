import React, { useEffect, useState, useContext } from "react"
import { Printer, X, Loader2, FileText, Receipt } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"
import formatNaira from "../../Reusables/NairaFormatter"
import Axios from "axios"

export default function ReceiptContainer({ receiptId }) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [localSaleData, setLocalSaleData] = useState(
    appState.receitData || null,
  )
  const [companyConfig, setCompanyConfig] = useState(null)
  const [isFetching, setIsFetching] = useState(false)
  const [layoutType, setLayoutType] = useState("thermal")

  // --- HARDWARE STACK PRINT IFRAME ENGINE ---
  const handlePrint = () => {
    const printableContent = document.getElementById(
      "nexus-printable-area",
    ).innerHTML

    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "none"
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document

    doc.open()
    doc.write(`
      <html>
        <head>
          <title>Invoice System Node Output</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
          <style>
            body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 20px; background-color: white !important; color: #111827 !important; }
            @page { size: auto; margin: 0mm; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          <div class="${layoutType === "thermal" ? "max-w-xs mx-auto" : "w-full"}">
            ${printableContent}
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.parent.document.body.removeChild(window.frameElement);
              }, 500);
            });
          </script>
        </body>
      </html>
    `)
    doc.close()
  }

  useEffect(() => {
    async function fetchReceiptAndConfig() {
      setIsFetching(true)
      try {
        const [receiptRes, configRes] = await Promise.all([
          receiptId
            ? Axios.post(`${appState.backendURL}/get-receipt-data`, {
                id: receiptId,
              })
            : Promise.resolve({ data: appState.receitData }),
          Axios.get(`${appState.backendURL}/get-company-config`).catch(() => ({
            data: null,
          })),
        ])

        if (receiptRes.data) setLocalSaleData(receiptRes.data)
        if (configRes?.data) setCompanyConfig(configRes.data)
      } catch (error) {
        console.error("Error aggregating document requirements:", error)
      } finally {
        setIsFetching(false)
      }
    }
    fetchReceiptAndConfig()
  }, [receiptId, appState.backendURL, appState.receitData])

  if (isFetching || !localSaleData) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-10 flex flex-col items-center">
          <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">
            Processing Invoice Node...
          </p>
        </div>
      </div>
    )
  }

  const company = {
    name: companyConfig?.companyName || "My Store POS",
    address: companyConfig?.address || "123 Business Avenue, Lagos",
    phone: companyConfig?.phone || "N/A",
    email: companyConfig?.email || "billing@enterprise.com",
    tin: companyConfig?.tin || "N/A",
    vatRate: companyConfig?.vatRate || 0,
    footer: companyConfig?.receiptFooter || "Thank you for your patronage!",
  }

  const rawSubtotal = localSaleData.total / (1 + company.vatRate / 100)
  const calculatedTaxAmount = localSaleData.total - rawSubtotal

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div
        className={`bg-white w-full transition-all rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] ${layoutType === "standard" ? "max-w-4xl" : "max-w-sm"}`}
      >
        {/* --- DYNAMIC ACTION HEADER CONTROLLER --- */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 select-none">
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setLayoutType("thermal")}
              className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${layoutType === "thermal" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
            >
              <Receipt size={12} /> Thermal 58mm
            </button>
            <button
              onClick={() => setLayoutType("standard")}
              className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${layoutType === "standard" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
            >
              <FileText size={12} /> Standard A4
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
              title="Print Document"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={() => appDispatch({ type: "closeReceipt" })}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition"
              title="Close Panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* --- DOCUMENT CANVAS WRAPPER --- */}
        <div
          id="nexus-printable-area"
          className="flex-1 overflow-y-auto p-8 scrollbar-thin"
        >
          {/* ======================================================= */}
          {/* OPTION A: THERMAL RECEIPT VIEW                          */}
          {/* ======================================================= */}
          {layoutType === "thermal" && (
            <div className="max-w-xs mx-auto flex flex-col items-center text-gray-800 font-mono">
              <div className="text-center mb-6">
                <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">
                  {company.name}
                </h2>
                <p className="text-[10px] text-gray-500 font-medium whitespace-pre-wrap mt-1">
                  {company.address}
                </p>
                <p className="text-[9px] text-gray-400 font-bold mt-0.5">
                  TEL: {company.phone}
                </p>
              </div>

              <div className="w-full border-t border-b border-dashed border-gray-300 py-2.5 mb-4 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>INVOICE ID:</span>
                  <span className="font-bold">{localSaleData.invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span>OPERATOR:</span>
                  <span className="font-bold uppercase">
                    {localSaleData.staffName || "System"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>TIMESTAMP:</span>
                  <span className="font-bold">
                    {new Date(localSaleData.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-3 mb-6 text-[11px]">
                <div className="flex justify-between font-black text-gray-400 uppercase tracking-wider text-[9px] border-b border-gray-100 pb-1">
                  <span>Item Description</span>
                  <span>Subtotal</span>
                </div>
                {localSaleData.items?.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span className="uppercase">{item.name}</span>
                      <span>
                        {formatNaira(
                          (item.priceAtSale || item.price) * item.qty,
                        )}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      {item.qty} Qty x{" "}
                      {formatNaira(item.priceAtSale || item.price)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full border-t border-dashed border-gray-300 pt-3 space-y-1.5 text-[11px]">
                <div className="flex justify-between font-medium text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatNaira(rawSubtotal)}</span>
                </div>
                {company.vatRate > 0 && (
                  <div className="flex justify-between font-medium text-gray-500">
                    <span>VAT ({company.vatRate}%)</span>
                    <span>{formatNaira(calculatedTaxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-gray-900 border-t border-gray-100 pt-2">
                  <span>TOTAL PAID</span>
                  <span>{formatNaira(localSaleData.total)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-1">
                  <span>Payment Mode:</span>
                  <span>{localSaleData.paymentMethod}</span>
                </div>
              </div>

              <div className="mt-8 text-center space-y-4 flex flex-col items-center w-full">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tight text-center whitespace-pre-wrap max-w-[200px]">
                  {company.footer}
                </p>
                <QRCodeSVG
                  value={`INV:${localSaleData.invoiceId}`}
                  size={70}
                  level={"M"}
                />
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* OPTION B: STANDARD CORPORATE INVOICE                    */}
          {/* ======================================================= */}
          {layoutType === "standard" && (
            <div className="p-4 text-gray-800 font-sans">
              <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-lg uppercase tracking-tight">
                    <span>{company.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
                    Corporate Headquarters
                  </p>
                  <p className="text-xs text-gray-500 font-medium max-w-sm mt-1 whitespace-pre-wrap leading-relaxed">
                    {company.address}
                  </p>
                  <div className="text-[11px] text-gray-400 font-bold uppercase mt-3 space-y-0.5">
                    <div>
                      TIN: <span className="text-gray-700">{company.tin}</span>
                    </div>
                    <div>
                      Email:{" "}
                      <span className="text-gray-700 font-normal lowercase">
                        {company.email}
                      </span>
                    </div>
                    <div>
                      Phone:{" "}
                      <span className="text-gray-700">{company.phone}</span>
                    </div>
                    <div className="pt-2 text-indigo-600 font-black tracking-tight">
                      METHOD:{" "}
                      <span className="uppercase">
                        {localSaleData.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <h1 className="text-3xl font-black text-gray-300 uppercase tracking-tight leading-none">
                    Tax Invoice
                  </h1>
                  <div className="mt-6 space-y-1.5 text-xs">
                    <div>
                      <span className="text-gray-400 font-bold uppercase mr-2 text-[10px]">
                        Invoice Number:
                      </span>{" "}
                      <span className="font-mono font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        {localSaleData.invoiceId}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold uppercase mr-2 text-[10px]">
                        Billing Date:
                      </span>{" "}
                      <span className="font-semibold text-gray-700">
                        {new Date(localSaleData.createdAt).toLocaleDateString(
                          undefined,
                          { dateStyle: "long" },
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold uppercase mr-2 text-[10px]">
                        Account Agent:
                      </span>{" "}
                      <span className="font-bold text-gray-800 uppercase">
                        {localSaleData.staffName || "System_Node"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matrix Table with structural modifications requested */}
              <table className="w-full border-collapse text-left text-xs mb-8">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50">
                    <th className="p-3 w-20 text-center">Qty</th>
                    <th className="p-3">Item Inventory Ledger Description</th>
                    <th className="p-3 text-right">Unit Rate</th>
                    <th className="p-3 text-right">Gross Extension</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {localSaleData.items?.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50/30 transition-colors"
                    >
                      <td className="p-3 text-center font-bold text-gray-800 bg-gray-50/30">
                        {item.qty}
                      </td>
                      <td className="p-3 font-bold text-gray-900 uppercase tracking-tight">
                        {item.name}
                      </td>
                      <td className="p-3 text-right">
                        {formatNaira(item.priceAtSale || item.price)}
                      </td>
                      <td className="p-3 text-right font-bold text-gray-900">
                        {formatNaira(
                          (item.priceAtSale || item.price) * item.qty,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-2.5 text-xs font-medium border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-gray-500">
                    <span>Taxable Subtotal:</span>
                    <span>{formatNaira(rawSubtotal)}</span>
                  </div>
                  {company.vatRate > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Value Added Tax ({company.vatRate}%):</span>
                      <span>{formatNaira(calculatedTaxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-gray-900 border-t-2 border-gray-100 pt-2.5">
                    <span>TOTAL LIQUIDATED:</span>
                    <span className="text-base text-indigo-600">
                      {formatNaira(localSaleData.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-gray-100">
                <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Regulatory Policy / Terms
                </h5>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic">
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
