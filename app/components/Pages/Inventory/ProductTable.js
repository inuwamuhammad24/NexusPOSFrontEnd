// components/Pages/Inventory/ProductTable.js
import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
} from "react"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import { Package, ArrowRightLeft, Edit3, Loader2, Box } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function ProductTable({
  locationId,
  searchQuery,
  onEdit,
  refreshSignal = 0,
}) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [products, setProducts] = useState([])
  const [lastId, setLastId] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const sentinelRef = useRef(null)

  const formatNaira = amount =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount || 0)

  const fetchProducts = useCallback(
    async (isNewSearch = false) => {
      if (isFetching || (!hasMore && !isNewSearch)) return

      const token = appState.user?.token || localStorage.getItem("token")
      if (!token) return

      setIsFetching(true)
      if (isNewSearch) setIsInitialLoading(true)

      const currentLastId = isNewSearch ? null : lastId

      try {
        const response = await Axios.post(
          `${appState.backendURL}/get-products`,
          {
            token,
            locationId: locationId || undefined,
            query: searchQuery?.trim() || undefined,
            lastId: currentLastId,
            limit: 15,
          },
        )

        if (response.data && response.data.length > 0) {
          setProducts(prev =>
            isNewSearch ? response.data : [...prev, ...response.data],
          )
          setLastId(response.data[response.data.length - 1]._id)
          setHasMore(response.data.length === 15)
        } else {
          if (isNewSearch) setProducts([])
          setHasMore(false)
        }
      } catch (e) {
        console.error("Inventory Fetch Error:", e)
        setHasMore(false)
      } finally {
        setIsFetching(false)
        setIsInitialLoading(false)
      }
    },
    [
      appState.backendURL,
      appState.user?.token,
      locationId,
      searchQuery,
      lastId,
      hasMore,
      isFetching,
    ],
  )

  useEffect(() => {
    setLastId(null)
    setHasMore(true)
    fetchProducts(true)
  }, [searchQuery, locationId, refreshSignal])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isFetching &&
          !isInitialLoading
        ) {
          fetchProducts(false)
        }
      },
      { threshold: 0.1 },
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, isFetching, isInitialLoading, fetchProducts])

  return (
    <div className="w-full relative">
      {/* --- A. MOBILE ADAPTIVE CARDS (< md) --- */}
      <div className="md:hidden divide-y divide-gray-100">
        {isInitialLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-indigo-600">
            <Loader2 className="animate-spin" size={26} />
            <span className="text-xs text-gray-400 font-semibold uppercase">
              Loading inventory...
            </span>
          </div>
        ) : (
          products.map(item => {
            const prod = item.details || item
            const stockCount = item.bulkQuantity ?? item.quantity ?? 0

            return (
              <div
                key={item._id}
                className="p-4 bg-white flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                      <Package size={17} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 leading-tight">
                        {prod.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 uppercase mt-0.5 font-semibold">
                        {prod.sku || "N/A"} •{" "}
                        {item.unitType || prod.unitType || "Units"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border shrink-0 ${
                      stockCount <= 5
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {stockCount} in stock
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-50">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-medium">
                      Selling Price:{" "}
                    </span>
                    <span className="font-bold text-gray-900">
                      {formatNaira(prod.sellingPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => appDispatch({ type: "openTransferModal" })}
                      aria-label="Transfer product"
                      className="p-2 text-indigo-600 bg-indigo-50 active:bg-indigo-100 rounded-lg transition"
                    >
                      <ArrowRightLeft size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit && onEdit(prod)}
                      aria-label="Edit product details"
                      className="p-2 text-gray-600 bg-gray-100 active:bg-gray-200 rounded-lg transition"
                    >
                      <Edit3 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* --- B. DESKTOP DATA TABLE (md and above) --- */}
      <div className="hidden md:block overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Product Identity
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                In-Stock (Bulk)
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Cost Price
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Selling Price
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50 relative">
            <AnimatePresence mode="wait">
              {isInitialLoading ? (
                <motion.tr
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan="5" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-indigo-600">
                      <Loader2 className="animate-spin" size={28} />
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Loading stock catalog...
                      </p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                products.map(item => {
                  const prod = item.details || item
                  const stockCount = item.bulkQuantity ?? item.quantity ?? 0

                  return (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={item._id}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-50 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-all shadow-sm">
                            <Package size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 leading-none">
                              {prod.name}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1.5 font-bold uppercase tracking-tighter">
                              {prod.sku || "N/A"} •{" "}
                              {item.unitType || prod.unitType || "Units"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black border ${
                            stockCount <= 5
                              ? "bg-red-50 text-red-600 border-red-100"
                              : "bg-indigo-50 text-indigo-700 border-indigo-100"
                          }`}
                        >
                          {stockCount}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs font-bold text-gray-500">
                        {formatNaira(prod.costPrice)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-gray-900">
                          {formatNaira(prod.sellingPrice)}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              appDispatch({ type: "openTransferModal" })
                            }
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Transfer Item"
                            aria-label="Transfer item"
                          >
                            <ArrowRightLeft size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEdit && onEdit(prod)}
                            className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                            title="Edit Product"
                            aria-label="Edit product"
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* --- SENTINEL / PAGINATION SPINNER --- */}
      <div
        ref={sentinelRef}
        className="py-8 flex flex-col items-center justify-center border-t border-gray-100"
      >
        {!isInitialLoading && isFetching ? (
          <div className="flex items-center gap-2 text-indigo-500 text-xs font-semibold">
            <Loader2 className="animate-spin" size={16} />
            <span>Loading next items...</span>
          </div>
        ) : !isInitialLoading && products.length === 0 ? (
          <div className="text-center opacity-40 py-8">
            <Box size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              No Products Found
            </p>
          </div>
        ) : !hasMore && products.length > 0 ? (
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-60">
            End of catalog ({products.length} products)
          </span>
        ) : null}
      </div>
    </div>
  )
}
