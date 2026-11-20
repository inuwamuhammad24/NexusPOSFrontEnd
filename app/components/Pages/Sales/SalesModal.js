// components/Pages/Sales/SalesModal.js
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
  Plus,
  Minus,
  CreditCard,
  ArrowRight,
  Edit3,
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
  const [saving, setSaving] = useState(false)

  // Mobile Active Tab: 'basket' | 'payment'
  const [mobileTab, setMobileTab] = useState("basket")

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
  const [amountPaid, setAmountPaid] = useState("") // Starts empty (₦0) until cashier enters an amount
  const [paymentMethod, setPaymentMethod] = useState("Cash")

  const inputRef = useRef(null)

  // Confirm before closing if the basket contains unsaved items
  const handleCloseModal = () => {
    if (invoice.length > 0 && !saving) {
      const confirmed = window.confirm(
        `You have ${invoice.length} item(s) in the active basket. Are you sure you want to close and discard this sale?`,
      )
      if (!confirmed) return
    }
    appDispatch({ type: "closeSalesModal" })
  }

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
      (parseFloat(item.price || 0) * (parseFloat(item.qty) || 0) -
        (item.discount || 0)),
    0,
  )
  const totalItemCount = invoice.reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0),
    0,
  )
  const cashReceived = parseFloat(amountPaid) || 0
  const balanceToCredit = Math.max(subtotal - cashReceived, 0)
  const isOverLimit =
    selectedCustomer &&
    (selectedCustomer.creditBalance || 0) + balanceToCredit >
      (selectedCustomer.creditLimit || 50000)

  const handlePaymentMethodChange = method => {
    setPaymentMethod(method)
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
      updated[existingIndex].qty =
        (parseFloat(updated[existingIndex].qty) || 0) + 1
      setInvoice(updated)
    } else {
      setInvoice([
        {
          _id: product._id,
          name: product.name,
          originalName: product.name,
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

  // Supports editing product name, direct quantity input (including temporary empty string while typing), and price
  const updateItem = (id, field, value) => {
    setInvoice(prev =>
      prev.map(item => {
        if (item.tempId !== id) return item
        if (field === "name") {
          return { ...item, name: value }
        }
        if (field === "qty") {
          if (value === "") {
            return { ...item, qty: "" }
          }
          const parsed = parseFloat(value)
          return { ...item, qty: isNaN(parsed) ? "" : Math.max(0, parsed) }
        }
        return {
          ...item,
          [field]: Math.max(parseFloat(value) || 0, 0),
        }
      }),
    )
  }

  // Ensure quantity defaults back to 1 if left blank or 0 on blur
  const normalizeItemQty = id => {
    setInvoice(prev =>
      prev.map(item => {
        if (item.tempId !== id) return item
        const parsed = parseFloat(item.qty)
        return { ...item, qty: !parsed || parsed <= 0 ? 1 : parsed }
      }),
    )
  }

  const incrementQty = id => {
    setInvoice(prev =>
      prev.map(item =>
        item.tempId === id
          ? { ...item, qty: (parseFloat(item.qty) || 0) + 1 }
          : item,
      ),
    )
  }

  const decrementQty = id => {
    setInvoice(prev =>
      prev.map(item =>
        item.tempId === id
          ? { ...item, qty: Math.max(1, (parseFloat(item.qty) || 1) - 1) }
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
          msg: "Customer profile required when selling on credit (balance owed > ₦0).",
        },
      })
      setMobileTab("payment")
      return
    }

    setSaving(true)
    try {
      const saleData = {
        token: appState.user?.token,
        locationId: selectedLocationId,
        items: invoice.map(i => {
          const resolvedName =
            String(i.name || "").trim() || i.originalName || "Product Item"
          const resolvedQty = Math.max(1, parseFloat(i.qty) || 1)
          const resolvedPrice = parseFloat(i.price) || 0
          return {
            productId: i._id,
            name: resolvedName,
            productName: resolvedName,
            qty: resolvedQty,
            quantity: resolvedQty,
            price: resolvedPrice,
            sellingPrice: resolvedPrice,
            discount: parseFloat(i.discount || 0),
            subtotal:
              resolvedPrice * resolvedQty - (parseFloat(i.discount) || 0),
          }
        }),
        total: subtotal,
        totalAmount: subtotal,
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

      const receiptPayload = {
        ...saleData,
        ...(response.data || {}),
        items:
          Array.isArray(response.data?.items) && response.data.items.length > 0
            ? response.data.items
            : saleData.items,
      }

      appDispatch({
        type: "openReceipt",
        id: receiptPayload._id,
        data: receiptPayload,
        payload: receiptPayload,
      })

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "success",
          msg: `Invoice ${
            receiptPayload.invoiceId || receiptPayload.receiptNumber || ""
          } completed successfully!`,
        },
      })

      // Close modal directly without unsaved-sale prompt since sale succeeded
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
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 antialiased selection:bg-indigo-500 selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="bg-white w-full max-w-5xl h-[100dvh] sm:h-[88vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
      >
        {/* TOP MODAL BAR */}
        <div className="px-3.5 sm:px-6 py-3 border-b border-gray-200/80 flex justify-between items-center gap-2 bg-white shrink-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <ShoppingCart size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-tight truncate">
                POS Terminal
              </h2>
              <p className="text-[10px] text-gray-400 font-medium truncate hidden sm:block">
                {appState.user?.businessName || "Store"} • Active Register
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Branch / Location Selector */}
            {locations.length > 0 && (
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs max-w-[125px] sm:max-w-[180px]">
                <Store size={12} className="text-indigo-600 shrink-0" />
                <select
                  value={selectedLocationId}
                  onChange={e => {
                    setSelectedLocationId(e.target.value)
                    localStorage.setItem("locationId", e.target.value)
                  }}
                  className="bg-transparent text-[11px] font-semibold text-gray-700 outline-none cursor-pointer truncate w-full"
                >
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Close Button with Unsaved-Sale Guard */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex items-center gap-1 px-2.5 py-2 text-gray-600 hover:text-rose-600 bg-gray-100 hover:bg-rose-50 rounded-xl transition shrink-0 active:scale-95"
              aria-label="Close terminal"
            >
              <X size={16} />
              <span className="text-[11px] font-bold sm:hidden">Close</span>
            </button>
          </div>
        </div>

        {/* MOBILE SEGMENTED CONTROL TAB (< md) */}
        <div className="md:hidden flex border-b border-gray-100 bg-slate-50/80 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("basket")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === "basket"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <ShoppingCart size={13} />
            <span>Basket ({totalItemCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("payment")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === "payment"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <CreditCard size={13} />
            <span>Payment & Client</span>
          </button>
        </div>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* --- LEFT: CART & PRODUCT SEARCH --- */}
          <div
            className={`flex-1 md:flex-[1.55] flex-col bg-slate-50/50 border-r border-gray-200/80 overflow-hidden ${
              mobileTab === "basket" ? "flex" : "hidden md:flex"
            }`}
          >
            {/* SEARCH BAR */}
            <div className="p-3 sm:p-4 relative shrink-0">
              <Search
                className="absolute left-6 sm:left-7 top-6 sm:top-7 text-gray-400 pointer-events-none"
                size={16}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scan barcode or type product name..."
                className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-base sm:text-xs font-semibold text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
              />
              {isSearching && (
                <Loader2
                  className="absolute right-6 sm:right-7 top-6 sm:top-7 text-indigo-600 animate-spin"
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
                    className="absolute left-3 right-3 sm:left-4 sm:right-4 mt-1.5 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto"
                  >
                    {suggestions.map((p, index) => (
                      <div
                        key={p._id}
                        onClick={() => addToInvoice(p)}
                        className={`px-4 py-3 flex justify-between items-center cursor-pointer transition-colors ${
                          index === selectedIndex
                            ? "bg-indigo-600 text-white"
                            : "hover:bg-indigo-50/70"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p
                            className={`text-xs font-bold truncate ${
                              index === selectedIndex
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            {p.name}
                          </p>
                          <p
                            className={`text-[10px] uppercase font-mono truncate ${
                              index === selectedIndex
                                ? "text-indigo-200"
                                : "text-gray-400"
                            }`}
                          >
                            {p.sku || p.barcode || "Item"}
                          </p>
                        </div>
                        <p
                          className={`text-xs font-black shrink-0 ${
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
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-6 space-y-2.5">
              {invoice.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12 sm:py-16 text-center">
                  <ShoppingCart
                    size={36}
                    className="text-gray-300 mb-2 stroke-[1.5]"
                  />
                  <p className="text-xs font-semibold text-gray-600">
                    Your basket is empty
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Scan an item or type in the search bar above
                  </p>
                </div>
              ) : (
                invoice.map(item => (
                  <motion.div
                    layout
                    key={item.tempId}
                    className="p-3 bg-white border border-gray-200/80 rounded-xl shadow-sm hover:border-gray-300 transition flex flex-col gap-2"
                  >
                    {/* Editable Product Name Row */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <Edit3
                          size={12}
                          className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none"
                        />
                        <input
                          type="text"
                          value={item.name}
                          onChange={e =>
                            updateItem(item.tempId, "name", e.target.value)
                          }
                          placeholder="Product name / description..."
                          className="w-full pl-7 pr-2.5 py-1.5 bg-gray-50/80 hover:bg-gray-100/70 focus:bg-white border border-transparent focus:border-indigo-300 rounded-lg text-base sm:text-xs font-bold text-gray-900 outline-none transition"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setInvoice(
                            invoice.filter(i => i.tempId !== item.tempId),
                          )
                        }
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition active:scale-90 shrink-0"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Controls Row: Price Override, Direct Quantity Input + Steppers, & Line Total */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-100">
                      {/* Price override */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                          Price:
                        </span>
                        <input
                          type="number"
                          step="any"
                          className="w-24 px-2 py-1 bg-indigo-50/60 border border-indigo-100 text-base sm:text-xs font-bold text-center text-indigo-900 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none"
                          value={item.price}
                          onChange={e =>
                            updateItem(item.tempId, "price", e.target.value)
                          }
                        />
                      </div>

                      {/* Direct Quantity Input + Increment/Decrement Buttons */}
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => decrementQty(item.tempId)}
                          className="p-1.5 hover:bg-white rounded text-gray-600 active:scale-90 transition"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          aria-label="Item quantity"
                          value={item.qty}
                          onChange={e =>
                            updateItem(item.tempId, "qty", e.target.value)
                          }
                          onBlur={() => normalizeItemQty(item.tempId)}
                          className="w-12 text-center bg-white border border-gray-200/80 rounded py-0.5 text-base sm:text-xs font-bold text-gray-900 focus:border-indigo-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => incrementQty(item.tempId)}
                          className="p-1.5 hover:bg-white rounded text-gray-600 active:scale-90 transition"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-black text-gray-900 block truncate">
                          {formatNaira(
                            (parseFloat(item.price) || 0) *
                              (parseFloat(item.qty) || 0),
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* --- RIGHT: SETTLEMENT & CHECKOUT --- */}
          <div
            className={`flex-1 p-4 sm:p-6 flex-col justify-between bg-white overflow-y-auto ${
              mobileTab === "payment" ? "flex" : "hidden md:flex"
            }`}
          >
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-1.5">
                <User size={13} className="text-indigo-600" /> Customer &
                Billing
              </h3>

              {/* Customer Lookup */}
              <div className="relative mb-4">
                <input
                  placeholder="Search customer account or walk-in..."
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-base sm:text-xs font-semibold outline-none transition-all ${
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
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null)
                        setCustomerSearch("")
                      }}
                      className="text-indigo-600 hover:text-indigo-800 p-0.5"
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
                          className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex justify-between items-center active:bg-indigo-50"
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
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-gray-200/80 space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-600">
                    Payment Method
                  </span>
                  <select
                    className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-base sm:text-xs font-bold text-indigo-600 outline-none cursor-pointer shadow-sm"
                    value={paymentMethod}
                    onChange={e => handlePaymentMethodChange(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="POS">POS / Card</option>
                    <option value="Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-600">
                      Amount Paid
                    </span>
                    {subtotal > 0 && cashReceived !== subtotal && (
                      <button
                        type="button"
                        onClick={() => setAmountPaid(String(subtotal))}
                        className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition"
                      >
                        Exact
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-400">₦</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      className="w-28 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-right text-base sm:text-xs font-bold text-emerald-600 outline-none shadow-sm focus:border-indigo-400"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-gray-200/70">
                  <span className="text-xs font-medium text-gray-600">
                    Outstanding Debt
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
                    Customer credit limit exceeded. Upfront settlement required.
                  </span>
                </div>
              )}
            </div>

            {/* DESKTOP TOTAL & SUBMIT BAR */}
            <div className="hidden md:flex pt-4 border-t border-gray-100 items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Gross Total
                </p>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                  {formatNaira(subtotal)}
                </h2>
              </div>
              <button
                type="button"
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

        {/* --- MOBILE PERSISTENT BOTTOM SUMMARY BAR (< md) --- */}
        <div className="md:hidden p-3.5 bg-white border-t border-gray-200/80 flex items-center justify-between gap-3 shrink-0 shadow-lg z-20">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">
              Total ({totalItemCount} items)
            </p>
            <p className="text-base font-black text-gray-900 mt-1 leading-none">
              {formatNaira(subtotal)}
            </p>
          </div>

          {mobileTab === "basket" ? (
            <button
              type="button"
              disabled={invoice.length === 0}
              onClick={() => setMobileTab("payment")}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-40 transition"
            >
              <span>Review & Pay</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileTab("basket")}
                className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold active:scale-95 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={invoice.length === 0 || saving}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-40 transition"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Finishing...</span>
                  </>
                ) : (
                  <>
                    <Banknote size={14} />
                    <span>Pay {formatNaira(cashReceived)}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
