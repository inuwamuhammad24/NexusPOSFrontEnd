import React, { useContext, useEffect, useState } from "react"
import { Printer, X, Loader2 } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"
import formatNaira from "../../Reusables/NairaFormatter"
import Axios from "axios"

export default function ThermalReceipt({ receiptId }) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  // Initialize state with whatever is in appState.receitData (if anything)
  const [localSaleData, setLocalSaleData] = useState(
    appState.receitData || null,
  )
  const [isFetching, setIsFetching] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  useEffect(() => {
    // If we have a receiptId but no data yet, OR if we want to refresh based on ID
    if (receiptId) {
      async function getReceipt() {
        setIsFetching(true)
        try {
          const response = await Axios.post(
            `${appState.backendURL}/get-receipt-data`,
            {
              id: receiptId,
            },
          )
          if (response.data) {
            setLocalSaleData(response.data)
          }
        } catch (error) {
          console.error("Error fetching receipt:", error)
        } finally {
          setIsFetching(false)
        }
      }
      getReceipt()
    }
  }, [receiptId, appState.backendURL])

  // If we are loading or don't have data yet
  if (isFetching || !localSaleData) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-10 flex flex-col items-center">
          <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
          <p className="text-gray-500 font-semibold tracking-tight">
            Generating Receipt...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:p-0 print:bg-white print:block">
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
            >
              <Printer size={18} />
            </button>
            <button
              onClick={() => appDispatch({ type: "closeReceipt" })}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* --- PHYSICAL RECEIPT PAPER CONTENT --- */}
        <div
          className="p-8 overflow-y-auto bg-white flex flex-col items-center print:p-2"
          id="printable-receipt"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight uppercase">
              My Store POS
            </h2>
            <p className="text-[11px] text-gray-500 font-medium">
              123 Business Avenue, Lagos
            </p>
          </div>

          <div className="w-full border-t border-b border-dashed border-gray-200 py-3 mb-4 space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-gray-600">
              <span>Receipt #:</span>
              <span className="font-semibold text-gray-800">
                {localSaleData.invoiceId}
              </span>
            </div>
            <div className="flex justify-between text-[11px] font-medium text-gray-600">
              <span>Date:</span>
              <span className="font-semibold text-gray-800">
                {new Date(localSaleData.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="w-full space-y-3 mb-6">
            <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Description</span>
              <span>Total</span>
            </div>

            {localSaleData.items?.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-xs font-semibold text-gray-800">
                  <span>{item.name}</span>
                  <span>
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(item.priceAtSale * item.qty)}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium italic">
                  {item.qty} x {formatNaira(item.priceAtSale)}
                </div>
              </div>
            ))}
          </div>

          <div className="w-full border-t border-dashed border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
              <span>TOTAL</span>
              <span>{formatNaira(localSaleData.total)}</span>
            </div>
          </div>

          <div className="mt-10 text-center space-y-4 flex flex-col items-center">
            <p className="text-[11px] font-semibold text-gray-800 italic">
              Thank you for your business!
            </p>
            <QRCodeSVG
              value={`Verify: ${localSaleData.invoiceNo}`}
              size={80}
              level={"M"}
              includeMargin={true}
            />
          </div>
        </div>

        {/* Main Actions Footer (Hidden during print) */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 print:hidden">
          <button
            onClick={() => appDispatch({ type: "closeReceipt" })}
            className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  )
}
