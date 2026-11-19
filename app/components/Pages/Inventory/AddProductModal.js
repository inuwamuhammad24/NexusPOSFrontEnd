import React, { useState, useContext, useMemo } from "react"
import {
  X,
  Package,
  Tag,
  Banknote,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Table2,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import Axios from "axios"
import formatNaira from "../../Reusables/NairaFormatter"

const createEmptyRow = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  sku: "",
  category: "General",
  unit: "pcs",
  costPrice: "",
  sellingPrice: "",
  initialStock: "",
  reorderLevel: "5",
})

export default function AddProductModal({ isOpen, onClose, onSuccess }) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [mode, setMode] = useState("bulk") // 'bulk' | 'single'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPasteBox, setShowPasteBox] = useState(false)
  const [pasteText, setPasteText] = useState("")

  // Single Mode State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "General",
    unit: "pcs",
    costPrice: "",
    sellingPrice: "",
    initialStock: "",
    reorderLevel: "5",
    description: "",
  })

  // Bulk Mode Rows State (Start with 5 ready-to-type rows)
  const [bulkRows, setBulkRows] = useState(() => [
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ])

  const categories = [
    "General",
    "Beverages & Drinks",
    "Provisions & Groceries",
    "Electronics & Gadgets",
    "Pharmacy & Health",
    "Cosmetics & Care",
    "Building Materials",
    "Apparel & Fashion",
    "Stationery & Office",
  ]

  const units = ["pcs", "box", "carton", "kg", "liter", "pack", "bag", "roll"]

  // Live Bulk Summary Metrics
  const bulkSummary = useMemo(() => {
    const validRows = bulkRows.filter(
      r => r.name.trim() !== "" && r.sellingPrice !== "",
    )
    const totalUnits = validRows.reduce(
      (sum, r) => sum + (parseInt(r.initialStock, 10) || 0),
      0,
    )
    const totalCostValue = validRows.reduce(
      (sum, r) =>
        sum +
        (parseFloat(r.costPrice) || 0) * (parseInt(r.initialStock, 10) || 0),
      0,
    )
    const totalRetailValue = validRows.reduce(
      (sum, r) =>
        sum +
        (parseFloat(r.sellingPrice) || 0) * (parseInt(r.initialStock, 10) || 0),
      0,
    )

    return {
      count: validRows.length,
      totalUnits,
      totalCostValue,
      totalRetailValue,
    }
  }, [bulkRows])

  if (!isOpen) return null

  const handleSingleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const updateBulkRow = (id, field, value) => {
    setBulkRows(prev =>
      prev.map(row => (row.id === id ? { ...row, [field]: value } : row)),
    )
  }

  const addBulkRows = (count = 5) => {
    const additions = Array.from({ length: count }, () => createEmptyRow())
    setBulkRows(prev => [...prev, ...additions])
  }

  const removeBulkRow = id => {
    setBulkRows(prev =>
      prev.length > 1 ? prev.filter(r => r.id !== id) : prev,
    )
  }

  // Parse pasted CSV / Excel rows: Name, Category, Cost, Selling, Qty, Unit
  const handleParsePaste = () => {
    setError("")
    const lines = pasteText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      return setError("Paste at least one line of product data.")
    }

    const parsed = lines.map(line => {
      // Support both Tab-separated (Excel copy-paste) and Comma-separated (CSV)
      const cols = line.includes("\t")
        ? line.split("\t").map(c => c.trim())
        : line.split(",").map(c => c.trim())

      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: cols[0] || "",
        category: cols[1] || "General",
        costPrice: cols[2] ? cols[2].replace(/[^0-9.]/g, "") : "",
        sellingPrice: cols[3] ? cols[3].replace(/[^0-9.]/g, "") : "",
        initialStock: cols[4] ? cols[4].replace(/[^0-9]/g, "") : "0",
        unit: cols[5] || "pcs",
        sku: cols[6] || "",
        reorderLevel: "5",
      }
    })

    // Replace empty blank rows or append to filled rows
    setBulkRows(prev => {
      const existingFilled = prev.filter(r => r.name.trim() !== "")
      return [...existingFilled, ...parsed]
    })

    setPasteText("")
    setShowPasteBox(false)
  }

  // Single Product Submit
  const handleSingleSubmit = async (e, keepOpen = false) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      return setError("Product name is required.")
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      return setError("Valid selling price is required.")
    }

    setLoading(true)

    try {
      await Axios.post(`${appState.backendURL}/products/create`, {
        token: appState.user.token,
        ...formData,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice),
        initialStock: parseInt(formData.initialStock, 10) || 0,
        reorderLevel: parseInt(formData.reorderLevel, 10) || 5,
      })

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "success",
          msg: `"${formData.name}" registered${
            Number(formData.initialStock) > 0
              ? ` with ${formData.initialStock} ${formData.unit} in stock`
              : ""
          }!`,
        },
      })

      setFormData({
        name: "",
        sku: "",
        category: formData.category,
        unit: formData.unit,
        costPrice: "",
        sellingPrice: "",
        initialStock: "",
        reorderLevel: "5",
        description: "",
      })

      if (typeof onSuccess === "function") onSuccess()
      if (!keepOpen) onClose()
    } catch (err) {
      console.error("Create Product Error:", err)
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to create product.",
      )
    } finally {
      setLoading(false)
    }
  }

  // Bulk Products Submit
  const handleBulkSubmit = async e => {
    e.preventDefault()
    setError("")

    const filledRows = bulkRows.filter(r => r.name.trim() !== "")

    if (filledRows.length === 0) {
      return setError("Enter at least one product name and selling price.")
    }

    const invalidPriceRow = filledRows.find(
      r => !r.sellingPrice || parseFloat(r.sellingPrice) < 0,
    )
    if (invalidPriceRow) {
      return setError(
        `Please enter a valid selling price for "${invalidPriceRow.name}".`,
      )
    }

    setLoading(true)
    try {
      const res = await Axios.post(
        `${appState.backendURL}/create-bulk-products`,
        {
          token: appState.user.token,
          products: filledRows.map(r => ({
            name: r.name.trim(),
            sku: r.sku.trim(),
            category: r.category,
            unit: r.unit,
            costPrice: parseFloat(r.costPrice) || 0,
            sellingPrice: parseFloat(r.sellingPrice),
            initialStock: parseInt(r.initialStock, 10) || 0,
            reorderLevel: parseInt(r.reorderLevel, 10) || 5,
          })),
        },
      )

      const { insertedCount = filledRows.length, skippedCount = 0 } =
        res.data || {}

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "success",
          msg: `Registered ${insertedCount} product(s) & updated inventory stock${
            skippedCount > 0 ? ` (${skippedCount} skipped)` : ""
          }!`,
        },
      })

      setBulkRows([
        createEmptyRow(),
        createEmptyRow(),
        createEmptyRow(),
        createEmptyRow(),
        createEmptyRow(),
      ])

      if (typeof onSuccess === "function") onSuccess()
      onClose()
    } catch (err) {
      console.error("Bulk Create Product Error:", err)
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Bulk registration failed.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`bg-white w-full ${
          mode === "bulk" ? "max-w-5xl" : "max-w-xl"
        } h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all`}
      >
        {/* HEADER & MODE SWITCHER */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Package size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                  Register Store Catalog
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  Add products & automatically seed opening inventory quantities
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Pills */}
            <div className="flex items-center bg-gray-200/70 p-1 rounded-xl flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => {
                  setMode("bulk")
                  setError("")
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  mode === "bulk"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Table2 size={14} />
                <span>Bulk Quick-Entry</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("single")
                  setError("")
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  mode === "single"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Package size={14} />
                <span>Single Item</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ERROR ALERT BANNER */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* =============================================================== */}
        {/* MODE A: BULK QUICK-ENTRY SPREADSHEET & CSV PASTE                */}
        {/* =============================================================== */}
        {mode === "bulk" ? (
          <form
            onSubmit={handleBulkSubmit}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Bulk Toolbar */}
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addBulkRows(5)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Plus size={14} />
                  <span>+5 Rows</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPasteBox(prev => !prev)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet size={14} />
                  <span>Paste from Excel / CSV</span>
                </button>
              </div>

              {/* Live Inventory Value Summary */}
              <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
                <span>
                  Ready:{" "}
                  <strong className="text-indigo-600">
                    {bulkSummary.count} items
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Opening Units:{" "}
                  <strong className="text-gray-900">
                    {bulkSummary.totalUnits}
                  </strong>
                </span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline">
                  Stock Value:{" "}
                  <strong className="text-emerald-600">
                    {formatNaira(bulkSummary.totalRetailValue)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Optional Paste Drawer */}
            {showPasteBox && (
              <div className="mx-4 sm:mx-6 mt-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-900">
                    Paste rows copied from Excel or CSV (Columns: Name,
                    Category, Cost Price, Selling Price, Opening Qty, Unit)
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPasteBox(false)}
                    className="text-emerald-700 hover:text-emerald-900"
                  >
                    <X size={15} />
                  </button>
                </div>
                <textarea
                  rows="3"
                  placeholder={`Peak Milk 400g\tProvisions & Groceries\t3200\t3600\t24\tpack\nIndomie Super Pack\tProvisions & Groceries\t8500\t9500\t15\tcarton`}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-mono outline-none focus:border-emerald-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParsePaste}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Import Rows into Grid
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable Multi-Row Grid */}
            <div className="flex-1 overflow-auto p-4 sm:px-6">
              {/* Desktop Grid Table */}
              <div className="hidden md:block border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Product Name *</th>
                      <th className="py-2.5 px-2 w-36">Category</th>
                      <th className="py-2.5 px-2 w-28">Cost (₦)</th>
                      <th className="py-2.5 px-2 w-28">Selling (₦) *</th>
                      <th className="py-2.5 px-2 w-28 bg-indigo-50/70 text-indigo-700">
                        Opening Qty
                      </th>
                      <th className="py-2.5 px-2 w-24">Unit</th>
                      <th className="py-2.5 px-2 w-28">SKU (Opt.)</th>
                      <th className="py-2.5 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {bulkRows.map((row, index) => (
                      <tr key={row.id} className="hover:bg-gray-50/60">
                        <td className="py-2 px-3 font-bold text-gray-400">
                          {index + 1}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="e.g. Milo Tin 500g"
                            value={row.name}
                            onChange={e =>
                              updateBulkRow(row.id, "name", e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.category}
                            onChange={e =>
                              updateBulkRow(row.id, "category", e.target.value)
                            }
                            className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-700 outline-none focus:border-indigo-500"
                          >
                            {categories.map(c => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={row.costPrice}
                            onChange={e =>
                              updateBulkRow(row.id, "costPrice", e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={row.sellingPrice}
                            onChange={e =>
                              updateBulkRow(
                                row.id,
                                "sellingPrice",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-900 focus:bg-white focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 bg-indigo-50/30">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={row.initialStock}
                            onChange={e =>
                              updateBulkRow(
                                row.id,
                                "initialStock",
                                e.target.value,
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-black text-indigo-700 focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.unit}
                            onChange={e =>
                              updateBulkRow(row.id, "unit", e.target.value)
                            }
                            className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-700 outline-none"
                          >
                            {units.map(u => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            placeholder="Auto"
                            value={row.sku}
                            onChange={e =>
                              updateBulkRow(row.id, "sku", e.target.value)
                            }
                            className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-[11px] uppercase outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeBulkRow(row.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition"
                            title="Remove row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards for Bulk Entry */}
              <div className="md:hidden space-y-3">
                {bulkRows.map((row, index) => (
                  <div
                    key={row.id}
                    className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-indigo-600 uppercase">
                        Item #{index + 1}
                      </span>
                      {bulkRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBulkRow(row.id)}
                          className="text-rose-500 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Product Name *"
                      value={row.name}
                      onChange={e =>
                        updateBulkRow(row.id, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-base font-bold text-gray-900 outline-none focus:border-indigo-500"
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-0.5">
                          Cost (₦)
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={row.costPrice}
                          onChange={e =>
                            updateBulkRow(row.id, "costPrice", e.target.value)
                          }
                          className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-base font-semibold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 block mb-0.5">
                          Selling (₦) *
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={row.sellingPrice}
                          onChange={e =>
                            updateBulkRow(
                              row.id,
                              "sellingPrice",
                              e.target.value,
                            )
                          }
                          className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-base font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-indigo-600 block mb-0.5">
                          Stock Qty
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={row.initialStock}
                          onChange={e =>
                            updateBulkRow(
                              row.id,
                              "initialStock",
                              e.target.value,
                            )
                          }
                          className="w-full px-2.5 py-2 bg-indigo-50/70 border border-indigo-200 rounded-xl text-base font-black text-indigo-700 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bulk Footer Submit */}
            <div className="p-4 sm:px-6 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-xs transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || bulkSummary.count === 0}
                className="flex-1 sm:flex-initial px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Catalog & Stock...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>
                      Register {bulkSummary.count} Product(s) & Seed{" "}
                      {bulkSummary.totalUnits} Units
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* =============================================================== */
          /* MODE B: SINGLE PRODUCT FORM (WITH SAVE & ADD ANOTHER)           */
          /* =============================================================== */
          <form
            onSubmit={e => handleSingleSubmit(e, false)}
            className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4"
          >
            {/* PRODUCT NAME */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">
                Product / Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g., Peak Full Cream Milk 400g"
                value={formData.name}
                onChange={handleSingleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-xs font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 outline-none transition"
              />
            </div>

            {/* SKU & CATEGORY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Tag size={12} className="text-indigo-500" /> SKU / Barcode
                </label>
                <input
                  type="text"
                  name="sku"
                  placeholder="Optional (Auto-generated)"
                  value={formData.sku}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-xs font-mono font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 outline-none transition uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-xs font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 outline-none transition"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PRICING (COST & SELLING) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Banknote size={12} className="text-gray-400" /> Cost Price
                  (₦)
                </label>
                <input
                  type="number"
                  step="any"
                  name="costPrice"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-xs font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Banknote size={12} className="text-emerald-500" /> Selling
                  Price (₦) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  name="sellingPrice"
                  placeholder="0.00"
                  value={formData.sellingPrice}
                  onChange={handleSingleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-xs font-bold text-gray-900 focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            {/* STOCK & UNIT SETTINGS */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                  <Layers size={12} className="text-indigo-500" /> Opening Qty
                </label>
                <input
                  type="number"
                  name="initialStock"
                  placeholder="0"
                  value={formData.initialStock}
                  onChange={handleSingleChange}
                  className="w-full px-3 py-2.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-base sm:text-xs font-black text-indigo-700 focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">
                  Unit Type
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleSingleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-xs font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 outline-none transition"
                >
                  {units.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">
                  Alert Level
                </label>
                <input
                  type="number"
                  name="reorderLevel"
                  placeholder="5"
                  value={formData.reorderLevel}
                  onChange={handleSingleChange}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-xs font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">
                Product Description (Optional)
              </label>
              <textarea
                rows="2"
                name="description"
                placeholder="Additional specifications, shelf location, or supplier notes..."
                value={formData.description}
                onChange={handleSingleChange}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-xs font-medium text-gray-900 focus:bg-white focus:border-indigo-500 outline-none transition resize-none"
              />
            </div>

            {/* ACTIONS */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={e => handleSingleSubmit(e, true)}
                className="py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition"
              >
                Save & Add Another
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Register Product
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
