import React, { useState, useEffect, useRef, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  ShoppingCart,
  X,
  Trash2,
  Loader2,
  User,
  CheckCircle2,
  Banknote,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import Axios from "axios"

export default function CompactSalesModal() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  // --- CORE STATE ---
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [invoice, setInvoice] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [saving, setIsSaving] = useState(false)

  // --- CUSTOMER & PAYMENT STATE ---
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState([])
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [amountPaid, setAmountPaid] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash")

  const inputRef = useRef(null)

  // --- CALCULATIONS ---
  // Updated to use item.price which is now editable
  const subtotal = invoice.reduce(
    (sum, item) => sum + (item.price * item.qty - item.discount),
    0,
  )
  const cashReceived = parseFloat(amountPaid) || 0
  const balanceToCredit = Math.max(subtotal - cashReceived, 0)
  const isOverLimit =
    selectedCustomer &&
    (selectedCustomer.creditBalance || 0) + balanceToCredit >
      (selectedCustomer.creditLimit || 50000)

  // --- PRODUCT SEARCH EFFECT ---
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setSelectedIndex(-1)
      return
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await Axios.post(
          `${appState.backendURL}/products/search`,
          { query },
        )
        setSuggestions(Array.isArray(response.data) ? response.data : [])
        setSelectedIndex(0)
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearching(false)
      }
    }, 400)
    return () => clearTimeout(delayDebounceFn)
  }, [query, appState.backendURL])

  // --- CUSTOMER SEARCH EFFECT ---
  useEffect(() => {
    if (customerSearch.length < 2 || selectedCustomer) {
      setCustomerResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingCustomer(true)
      try {
        const response = await Axios.post(
          `${appState.backendURL}/customers/search`,
          { query: customerSearch },
        )
        setCustomerResults(Array.isArray(response.data) ? response.data : [])
      } catch (e) {
        console.error("Customer search failed:", e)
        setCustomerResults([])
      } finally {
        setIsSearchingCustomer(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [customerSearch, selectedCustomer, appState.backendURL])

  const handleKeyDown = e => {
    if (suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0) addToInvoice(suggestions[selectedIndex])
    }
  }

  const addToInvoice = product => {
    const existing = invoice.find(item => item._id === product._id)
    if (existing) {
      updateItem(existing.tempId, "qty", existing.qty + 1)
    } else {
      setInvoice([
        {
          ...product,
          price: product.sellingPrice, // This will be editable
          qty: 1,
          discount: 0,
          tempId: Date.now(),
        },
        ...invoice,
      ])
    }
    setQuery("")
    setSuggestions([])
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const updateItem = (id, field, value) => {
    setInvoice(
      invoice.map(item =>
        item.tempId === id
          ? { ...item, [field]: parseFloat(value) || 0 }
          : item,
      ),
    )
  }

  const handleCheckout = async () => {
    if (invoice.length === 0 || saving) return
    if (balanceToCredit > 0 && !selectedCustomer) {
      appDispatch({
        type: "addFlashMessage",
        payload: { type: "error", msg: "Customer required for credit" },
      })
      return
    }
    setIsSaving(true)
    try {
      const saleData = {
        items: invoice.map(i => ({
          productId: i._id,
          name: i.name,
          qty: i.qty,
          priceAtSale: i.price, // Sends the negotiated price
          discount: i.discount,
          subtotal: i.price * i.qty - i.discount,
        })),
        total: subtotal,
        amountPaid: cashReceived,
        paymentMethod,
        customerId: selectedCustomer?._id || null,
        customerName: selectedCustomer.fullName || null,
        staffName: localStorage.getItem("fullName"),
        locationId: localStorage.getItem("locationId"),
      }
      const response = await Axios.post(
        `${appState.backendURL}/sales/checkout`,
        saleData,
      )
      appDispatch({ type: "openReceipt", data: response.data })
      appDispatch({ type: "closeSalesModal" })
      setInvoice([])
      setAmountPaid("")
    } catch (error) {
      console.log(error)
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: error.response?.data?.msg || "Checkout fail",
        },
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatNaira = amt =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amt || 0)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
      >
        {/* HEADER */}
        <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-indigo-600" />
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-tight">
              Sales Terminal
            </h2>
          </div>
          <button
            onClick={() => appDispatch({ type: "closeSalesModal" })}
            className="p-1.5 text-gray-300 hover:text-gray-600 bg-gray-50 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: BASKET & SEARCH */}
          <div className="flex-[1.6] flex flex-col bg-gray-50/50 border-r border-gray-100">
            <div className="p-4 relative">
              <Search
                className="absolute left-7 top-6.5 text-gray-300"
                size={16}
              />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search Product or SKU..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded text-xs font-bold text-gray-800 outline-none focus:border-indigo-400 shadow-sm"
              />
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div className="absolute left-4 right-4 mt-1 bg-white border border-gray-200 shadow-xl rounded z-50 overflow-hidden divide-y divide-gray-50">
                    {suggestions.map((p, index) => (
                      <div
                        key={p._id}
                        onClick={() => addToInvoice(p)}
                        className={`px-4 py-2 flex justify-between items-center cursor-pointer transition-colors ${index === selectedIndex ? "bg-indigo-600 text-white" : "hover:bg-indigo-50"}`}
                      >
                        <div>
                          <p
                            className={`text-[11px] font-bold ${index === selectedIndex ? "text-white" : "text-gray-800"}`}
                          >
                            {p.name}
                          </p>
                          <p
                            className={`text-[9px] uppercase ${index === selectedIndex ? "text-indigo-100" : "text-gray-400"}`}
                          >
                            {p.sku}
                          </p>
                        </div>
                        <p
                          className={`text-[11px] font-bold ${index === selectedIndex ? "text-white" : "text-indigo-600"}`}
                        >
                          {formatNaira(p.sellingPrice)}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SCROLLABLE CART */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin scrollbar-thumb-indigo-200">
              {invoice.map(item => (
                <motion.div
                  layout
                  key={item.tempId}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-800 truncate">
                      {item.name}
                    </p>
                    <p className="text-[9px] text-gray-400 uppercase">
                      Stock: {item.bulkQuantity} | Default:{" "}
                      {formatNaira(item.sellingPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* EDITABLE PRICE FIELD */}
                    <div className="flex flex-col">
                      <label className="text-[8px] font-bold text-gray-400 uppercase text-center">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        className="w-20 p-1 bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-center rounded focus:ring-1 focus:ring-indigo-400 outline-none"
                        value={item.price}
                        onChange={e =>
                          updateItem(item.tempId, "price", e.target.value)
                        }
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[8px] font-bold text-gray-400 uppercase text-center">
                        Qty
                      </label>
                      <input
                        type="number"
                        className="w-10 p-1 bg-gray-50 border border-gray-200 text-[10px] font-bold text-center rounded outline-none"
                        value={item.qty}
                        onChange={e =>
                          updateItem(item.tempId, "qty", e.target.value)
                        }
                      />
                    </div>

                    <div className="w-16 text-right flex flex-col">
                      <label className="text-[8px] font-bold text-gray-400 uppercase">
                        Total
                      </label>
                      <span className="text-[10px] font-bold text-gray-900">
                        {formatNaira(item.price * item.qty)}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setInvoice(
                          invoice.filter(i => i.tempId !== item.tempId),
                        )
                      }
                      className="text-gray-300 hover:text-red-500 mt-3"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT: SETTLEMENT */}
          <div className="flex-1 p-6 flex flex-col bg-white">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={10} /> Settlement
            </h3>
            {/* ... rest of the settlement section remains the same ... */}
            <div className="relative mb-6">
              <input
                placeholder="Search Customer Account..."
                className={`w-full pl-3 pr-10 py-2 rounded border text-xs font-bold outline-none transition-all ${selectedCustomer ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-50 border-gray-100 focus:bg-white"}`}
                value={
                  selectedCustomer
                    ? selectedCustomer.fullName || selectedCustomer.name
                    : customerSearch
                }
                onChange={e => {
                  setCustomerSearch(e.target.value)
                  if (selectedCustomer) setSelectedCustomer(null)
                }}
              />
              <div className="absolute right-3 top-2">
                {selectedCustomer ? (
                  <CheckCircle2 className="text-indigo-600" size={16} />
                ) : isSearchingCustomer ? (
                  <Loader2 className="animate-spin text-gray-300" size={16} />
                ) : (
                  <Search className="text-gray-300" size={16} />
                )}
              </div>
              <AnimatePresence>
                {customerResults.length > 0 && !selectedCustomer && (
                  <motion.div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded z-50 overflow-hidden divide-y divide-gray-50">
                    {customerResults.map(c => (
                      <div
                        key={c._id}
                        onClick={() => setSelectedCustomer(c)}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <p className="text-[11px] font-bold text-gray-800">
                            {c.fullName || c.name}
                          </p>
                          <p className="text-[9px] text-gray-400 uppercase">
                            {c.phone}
                          </p>
                        </div>
                        <ChevronRight size={12} className="text-gray-300" />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4 mb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-400 uppercase text-[9px]">
                  Received
                </span>
                <input
                  type="number"
                  className="w-20 p-1 border-b border-gray-300 bg-transparent text-right font-bold text-emerald-600 outline-none"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-400 uppercase text-[9px]">
                  Method
                </span>
                <select
                  className="bg-transparent font-bold text-indigo-600 outline-none cursor-pointer"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option>Cash</option>
                  <option>POS</option>
                  <option>Transfer</option>
                </select>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200/50">
                <span className="font-bold text-gray-400 uppercase text-[9px]">
                  Credit Balance
                </span>
                <span
                  className={`font-bold ${balanceToCredit > 0 ? "text-rose-600" : "text-gray-300"}`}
                >
                  {formatNaira(balanceToCredit)}
                </span>
              </div>
            </div>

            {isOverLimit && (
              <div className="mb-4 p-2 bg-red-50 rounded text-red-600 flex items-center gap-2 border border-red-100">
                <AlertTriangle size={14} />
                <p className="text-[8px] font-bold uppercase">
                  Credit Limit Exceeded
                </p>
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-end">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">
                  Total
                </p>
                <h2 className="text-2xl font-black text-gray-900 leading-none">
                  {formatNaira(subtotal)}
                </h2>
              </div>
              <button
                onClick={handleCheckout}
                disabled={invoice.length === 0 || saving}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded font-bold text-xs uppercase shadow-lg hover:bg-indigo-700 disabled:bg-gray-200 transition-all flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Banknote size={14} />
                )}
                Complete
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
