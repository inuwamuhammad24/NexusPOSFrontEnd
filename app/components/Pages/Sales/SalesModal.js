import React, { useState, useEffect, useRef, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  ShoppingCart,
  X,
  Trash2,
  Loader2,
  User,
  Banknote,
  AlertTriangle,
  ChevronRight,
  Store,
} from "lucide-react"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import Axios from "axios"
import formatNaira from "../../Reusables/NairaFormatter"

export default function CompactSalesModal({ onSaleComplete }) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  // --- CORE STATE ---
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [invoice, setInvoice] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [saving, setIsSaving] = useState(false)

  // --- LOCATIONS & TENANT CONTEXT ---
  const [locations, setLocations] = useState([])
  const [selectedLocationId, setSelectedLocationId] = useState(
    localStorage.getItem("locationId") || "",
  )

  // --- CUSTOMER & PAYMENT STATE ---
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerResults, setCustomerResults] = useState([])
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [amountPaid, setAmountPaid] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash")

  const inputRef = useRef(null)

  // --- 1. FETCH PRIMARY STORE LOCATIONS ---
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await Axios.post(
          `${appState.backendURL}/get-all-locations`,
          {
            token: appState.user?.token,
          },
        )
        if (Array.isArray(res.data) && res.data.length > 0) {
          setLocations(res.data)
          if (!selectedLocationId) {
            setSelectedLocationId(res.data[0]._id)
            localStorage.setItem("locationId", res.data[0]._id)
          }
        }
      } catch (err) {
        console.error("Failed to load store locations:", err)
      }
    }
    if (appState.user?.token) {
      fetchLocations()
    }
  }, [appState.backendURL, appState.user?.token])

  // --- 2. CALCULATIONS ---
  const subtotal = invoice.reduce(
    (sum, item) =>
      sum +
      (parseFloat(item.price || 0) * (item.qty || 1) - (item.discount || 0)),
    0,
  )
  const cashReceived = parseFloat(amountPaid) || 0
  const balanceToCredit = Math.max(subtotal - cashReceived, 0)
  const isOverLimit =
    selectedCustomer &&
    (selectedCustomer.creditBalance || 0) + balanceToCredit >
      (selectedCustomer.creditLimit || 50000)

  // Auto-sync amount paid when subtotal changes if user has not typed a custom amount
  useEffect(() => {
    if (!amountPaid || parseFloat(amountPaid) === 0) {
      setAmountPaid(subtotal > 0 ? subtotal.toString() : "")
    }
  }, [subtotal])

  const handlePaymentMethodChange = method => {
    setPaymentMethod(method)
    if (method === "Cash" || method === "POS" || method === "Transfer") {
      setAmountPaid(subtotal.toString())
    }
  }

  // --- 3. SCOPED PRODUCT SEARCH EFFECT ---
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      setSelectedIndex(-1)
      return
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await Axios.post(
          `${appState.backendURL}/products/search`,
          {
            token: appState.user?.token,
            query: query.trim(),
          },
        )
        setSuggestions(Array.isArray(response.data) ? response.data : [])
        setSelectedIndex(0)
      } catch (e) {
        console.error("Product search failed:", e)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query, appState.backendURL, appState.user?.token])

  // --- 4. SCOPED CUSTOMER SEARCH EFFECT ---
  useEffect(() => {
    if (customerSearch.trim().length < 2 || selectedCustomer) {
      setCustomerResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingCustomer(true)
      try {
        const response = await Axios.post(
          `${appState.backendURL}/customers/search`,
          {
            token: appState.user?.token,
            query: customerSearch.trim(),
          },
        )
        setCustomerResults(Array.isArray(response.data) ? response.data : [])
      } catch (e) {
        console.error("Customer search failed:", e)
        setCustomerResults([])
      } finally {
        setIsSearchingCustomer(false)
      }
    }, 350)

    return () => clearTimeout(delayDebounceFn)
  }, [
    customerSearch,
    selectedCustomer,
    appState.backendURL,
    appState.user?.token,
  ])

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
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addToInvoice(suggestions[selectedIndex])
      }
    }
  }

  const addToInvoice = product => {
    const existingIndex = invoice.findIndex(item => item._id === product._id)
    if (existingIndex > -1) {
      const updated = [...invoice]
      updated[existingIndex].qty += 1
      setInvoice(updated)
    } else {
      setInvoice([
        {
          _id: product._id,
          name: product.name,
          sku: product.sku || product.barcode || "N/A",
          price: parseFloat(product.sellingPrice) || 0,
          sellingPrice: parseFloat(product.sellingPrice) || 0,
          qty: 1,
          discount: 0,
          tempId: Date.now() + Math.random(),
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
          ? {
              ...item,
              [field]: Math.max(
                parseFloat(value) || 0,
                field === "qty" ? 1 : 0,
              ),
            }
          : item,
      ),
    )
  }

  const handleCheckout = async () => {
    if (invoice.length === 0 || saving) return

    if (!selectedLocationId) {
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: "Please select a checkout counter or branch location.",
        },
      })
      return
    }

    if (balanceToCredit > 0 && !selectedCustomer) {
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: "Customer profile required when selling on credit.",
        },
      })
      return
    }

    setIsSaving(true)
    try {
      const saleData = {
        token: appState.user?.token,
        locationId: selectedLocationId,
        items: invoice.map(i => ({
          productId: i._id,
          name: i.name,
          qty: parseFloat(i.qty),
          price: parseFloat(i.price),
          discount: parseFloat(i.discount || 0),
          subtotal:
            parseFloat(i.price) * parseFloat(i.qty) -
            (parseFloat(i.discount) || 0),
        })),
        total: subtotal,
        amountPaid: cashReceived,
        paymentMethod,
        customerId: selectedCustomer?._id || null,
        customerName: selectedCustomer
          ? selectedCustomer.fullName || selectedCustomer.name
          : "Walk-in Customer",
        staffName:
          appState.user?.username ||
          localStorage.getItem("username") ||
          "Staff",
      }

      const response = await Axios.post(
        `${appState.backendURL}/sales/checkout`,
        saleData,
      )

      appDispatch({
        type: "openReceipt",
        id: response.data._id,
        data: response.data,
      })

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "success",
          msg: `Invoice ${response.data.invoiceId} completed successfully!`,
        },
      })

      appDispatch({ type: "closeSalesModal" })

      if (typeof onSaleComplete === "function") {
        onSaleComplete()
      }

      setInvoice([])
      setAmountPaid("")
      setSelectedCustomer(null)
      setQuery("")
    } catch (error) {
      console.error("Checkout submission failed:", error)
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg:
            error.response?.data?.message ||
            error.response?.data?.msg ||
            "Checkout failed to process. Check inventory balances.",
        },
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 antialiased selection:bg-indigo-500 selection:text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
      >
        {/* TOP MODAL BAR */}
        <div className="px-6 py-3.5 border-b border-gray-200/80 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <ShoppingCart size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                POS Sales Terminal
              </h2>
              <p className="text-[10px] text-gray-400 font-medium">
                {appState.user?.businessName || "Store"} • Active Register
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Branch / Location Selector */}
            {locations.length > 0 && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1 text-xs">
                <Store size={13} className="text-indigo-600" />
                <select
                  value={selectedLocationId}
                  onChange={e => {
                    setSelectedLocationId(e.target.value)
                    localStorage.setItem("locationId", e.target.value)
                  }}
                  className="bg-transparent text-[11px] font-semibold text-gray-700 outline-none cursor-pointer"
                >
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => appDispatch({ type: "closeSalesModal" })}
              className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: CART & PRODUCT SEARCH */}
          <div className="flex-[1.5] flex flex-col bg-slate-50/50 border-r border-gray-200/80 overflow-hidden">
            {/* SEARCH BAR */}
            <div className="p-4 relative shrink-0">
              <Search
                className="absolute left-7 top-7 text-gray-400 pointer-events-none"
                size={16}
              />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scan barcode or type product name..."
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
              />
              {isSearching && (
                <Loader2
                  className="absolute right-7 top-7 text-indigo-600 animate-spin"
                  size={15}
                />
              )}

              {/* SEARCH SUGGESTIONS DROPDOWN */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-4 right-4 mt-1.5 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto"
                  >
                    {suggestions.map((p, index) => (
                      <div
                        key={p._id}
                        onClick={() => addToInvoice(p)}
                        className={`px-4 py-2.5 flex justify-between items-center cursor-pointer transition-colors ${
                          index === selectedIndex
                            ? "bg-indigo-600 text-white"
                            : "hover:bg-indigo-50/70"
                        }`}
                      >
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              index === selectedIndex
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            {p.name}
                          </p>
                          <p
                            className={`text-[10px] uppercase font-mono ${
                              index === selectedIndex
                                ? "text-indigo-200"
                                : "text-gray-400"
                            }`}
                          >
                            {p.sku || p.barcode || "Item"}
                          </p>
                        </div>
                        <p
                          className={`text-xs font-black ${
                            index === selectedIndex
                              ? "text-white"
                              : "text-indigo-600"
                          }`}
                        >
                          {formatNaira(p.sellingPrice)}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CART LINE ITEMS */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {invoice.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16 text-center">
                  <ShoppingCart
                    size={36}
                    className="text-gray-300 mb-2 stroke-[1.5]"
                  />
                  <p className="text-xs font-semibold text-gray-600">
                    Your basket is empty
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Scan an item or use the search bar above
                  </p>
                </div>
              ) : (
                invoice.map(item => (
                  <motion.div
                    layout
                    key={item.tempId}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200/80 rounded-xl shadow-sm hover:border-gray-300 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        Base: {formatNaira(item.sellingPrice)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <label className="text-[9px] font-semibold text-gray-400 uppercase text-center">
                          Rate
                        </label>
                        <input
                          type="number"
                          className="w-20 px-2 py-1 bg-indigo-50/60 border border-indigo-100 text-xs font-bold text-center rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none"
                          value={item.price}
                          onChange={e =>
                            updateItem(item.tempId, "price", e.target.value)
                          }
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[9px] font-semibold text-gray-400 uppercase text-center">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="w-12 px-2 py-1 bg-gray-50 border border-gray-200 text-xs font-bold text-center rounded-lg outline-none focus:bg-white focus:border-indigo-400"
                          value={item.qty}
                          onChange={e =>
                            updateItem(item.tempId, "qty", e.target.value)
                          }
                        />
                      </div>

                      <div className="w-20 text-right flex flex-col">
                        <label className="text-[9px] font-semibold text-gray-400 uppercase">
                          Total
                        </label>
                        <span className="text-xs font-bold text-gray-900">
                          {formatNaira(item.price * item.qty)}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          setInvoice(
                            invoice.filter(i => i.tempId !== item.tempId),
                          )
                        }
                        className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition mt-3"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: SETTLEMENT & CHECKOUT */}
          <div className="flex-1 p-6 flex flex-col justify-between bg-white overflow-y-auto">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <User size={13} className="text-indigo-600" /> Customer &
                Billing
              </h3>

              {/* Customer Lookup */}
              <div className="relative mb-5">
                <input
                  placeholder="Search customer account or walk-in..."
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                    selectedCustomer
                      ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                      : "bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-indigo-500"
                  }`}
                  value={
                    selectedCustomer
                      ? `${selectedCustomer.fullName || selectedCustomer.name} (${
                          selectedCustomer.phone || "No phone"
                        })`
                      : customerSearch
                  }
                  onChange={e => {
                    setCustomerSearch(e.target.value)
                    if (selectedCustomer) setSelectedCustomer(null)
                  }}
                />
                <div className="absolute right-3 top-3">
                  {selectedCustomer ? (
                    <button
                      onClick={() => {
                        setSelectedCustomer(null)
                        setCustomerSearch("")
                      }}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <X size={15} />
                    </button>
                  ) : isSearchingCustomer ? (
                    <Loader2 className="animate-spin text-gray-400" size={15} />
                  ) : (
                    <Search className="text-gray-400" size={15} />
                  )}
                </div>

                <AnimatePresence>
                  {customerResults.length > 0 && !selectedCustomer && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto"
                    >
                      {customerResults.map(c => (
                        <div
                          key={c._id}
                          onClick={() => setSelectedCustomer(c)}
                          className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <p className="text-xs font-bold text-gray-800">
                              {c.fullName || c.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {c.phone || "No Phone"}
                            </p>
                          </div>
                          <ChevronRight size={14} className="text-gray-400" />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Settlement Matrix */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200/80 space-y-3.5 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">
                    Settlement Method
                  </span>
                  <select
                    className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-600 outline-none cursor-pointer shadow-sm"
                    value={paymentMethod}
                    onChange={e => handlePaymentMethodChange(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="POS">POS / Card</option>
                    <option value="Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">
                    Amount Received
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-400">₦</span>
                    <input
                      type="number"
                      placeholder={subtotal.toString()}
                      className="w-28 px-2 py-1 bg-white border border-gray-200 rounded-lg text-right text-xs font-bold text-emerald-600 outline-none shadow-sm focus:border-indigo-400"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-gray-200/70">
                  <span className="text-xs font-medium text-gray-500">
                    Outstanding Balance
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      balanceToCredit > 0 ? "text-rose-600" : "text-gray-400"
                    }`}
                  >
                    {formatNaira(balanceToCredit)}
                  </span>
                </div>
              </div>

              {isOverLimit && (
                <div className="mb-4 p-3 bg-rose-50 rounded-xl text-rose-700 flex items-center gap-2 border border-rose-100 text-xs font-medium">
                  <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                  <span>
                    Customer credit limit reached. Upfront settlement required.
                  </span>
                </div>
              )}
            </div>

            {/* TOTAL & SUBMIT BUTTON */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Gross Total
                </p>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                  {formatNaira(subtotal)}
                </h2>
              </div>
              <button
                onClick={handleCheckout}
                disabled={invoice.length === 0 || saving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Banknote size={16} />
                    <span>Complete Sale</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
