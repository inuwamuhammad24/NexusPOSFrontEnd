import React, { useState, useEffect, useRef, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  ShoppingCart,
  X,
  Plus,
  Minus,
  Tag,
  Trash2,
  Keyboard,
} from "lucide-react"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"

export default function CompactSalesModal() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [invoice, setInvoice] = useState([])
  const inputRef = useRef(null)

  // Mock Products
  const products = [
    { id: 1, name: "Fresh Milk 1L", price: 2.5, sku: "MK-01" },
    { id: 2, name: "Whole Bread", price: 1.8, sku: "BD-05" },
    { id: 3, name: "Coca Cola 500ml", price: 1.5, sku: "CC-12" },
    { id: 4, name: "Eggs Dozen", price: 3.0, sku: "EG-20" },
    { id: 5, name: "Lontor Torch", price: 2000.0, sku: "El-119" },
    { id: 6, name: "Bananas (1kg)", price: 1.2, sku: "BN-15" },
    { id: 7, name: "Chicken Breast 500g", price: 5.5, sku: "CB-03" },
    { id: 8, name: "Orange Juice 1L", price: 3.0, sku: "OJ-09" },
  ]

  useEffect(() => {
    if (query.length > 0) {
      const filtered = products.filter(
        p =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      )
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [query])

  const addToInvoice = product => {
    const newEntry = { ...product, qty: 1, discount: 0, tempId: Date.now() }
    setInvoice([newEntry, ...invoice]) // Add to top for easy Tab access
    setQuery("")
    setSuggestions([])
  }

  const handleKeyDown = e => {
    if (e.key === "ArrowDown") {
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      )
    } else if (e.key === "ArrowUp") {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === "Enter" && suggestions.length > 0) {
      addToInvoice(suggestions[selectedIndex])
    } else if (e.key === "Escape") {
      appDispatch({ type: "closeSalesModal" })
    }
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

  const calculateTotal = () => {
    return invoice
      .reduce((sum, item) => sum + item.price * item.qty - item.discount, 0)
      .toFixed(2)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Compact Header */}
        <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
            <Keyboard size={18} />
            <span>POS TERMINAL</span>
          </div>
          <button
            onClick={() => appDispatch({ type: "closeSalesModal" })}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input Section */}
        <div className="p-6 pb-0 relative">
          <div className="relative">
            <Search className="absolute left-4 top-3 text-gray-400" size={18} />
            <input
              ref={inputRef}
              autoFocus
              className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              placeholder="Search product (Arrow keys to navigate, Enter to add)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Inline Suggestions */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div className="absolute left-6 right-6 mt-1 bg-white border border-gray-200 shadow-xl rounded-xl z-20 overflow-hidden">
                {suggestions.map((p, i) => (
                  <div
                    key={p.id}
                    onClick={() => addToInvoice(p)}
                    className={`px-4 py-2.5 flex justify-between text-sm cursor-pointer ${
                      i === selectedIndex
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span>
                      {p.name}{" "}
                      <span className="text-[10px] opacity-70 ml-2">
                        [{p.sku}]
                      </span>
                    </span>
                    <span className="font-bold">${p.price.toFixed(2)}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Invoice List (Normal Font Sizes) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {invoice.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <ShoppingCart size={40} className="mb-2 opacity-20" />
              <p className="text-sm italic">Invoice is empty</p>
            </div>
          )}

          {invoice.map(item => (
            <motion.div
              layout
              key={item.tempId}
              className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition"
            >
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800 leading-tight">
                  {item.name}
                </p>
                <p className="text-[11px] text-gray-400">
                  Unit: ${item.price.toFixed(2)}
                </p>
              </div>

              {/* Editable Fields for TAB Navigation */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">
                    Qty
                  </span>
                  <input
                    type="number"
                    className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:border-blue-500 focus:ring-0"
                    value={item.qty}
                    onChange={e =>
                      updateItem(item.tempId, "qty", e.target.value)
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-1">
                    Disc. ($)
                  </span>
                  <input
                    type="number"
                    className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:border-blue-500 focus:ring-0"
                    value={item.discount}
                    onChange={e =>
                      updateItem(item.tempId, "discount", e.target.value)
                    }
                  />
                </div>

                <div className="w-20 text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Total
                  </span>
                  <p className="text-sm font-black text-gray-800">
                    ${(item.price * item.qty - item.discount).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setInvoice(invoice.filter(i => i.tempId !== item.tempId))
                  }
                  className="mt-4 p-1.5 text-gray-300 hover:text-red-500 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Compact Sticky Footer */}
        <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Grand Total
            </p>
            <h2 className="text-3xl font-black text-blue-600 leading-none">
              ${calculateTotal()}
            </h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => appDispatch({ type: "closeSalesModal" })}
              className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => appDispatch({ type: "openReceipt" })}
              className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition active:scale-95"
            >
              CHECKOUT (F8)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
