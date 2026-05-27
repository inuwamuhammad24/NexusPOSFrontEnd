import React, { useEffect, useState, useRef, useContext } from "react"
import Axios from "axios"
import StateContext from "../../../StateContext"
import DispatchContext from "../../../DispatchContext"
import {
  Package,
  ArrowRightLeft,
  Edit3,
  Loader2,
  Box,
  MoreHorizontal,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ADDED: onEdit prop received from InventoryPage
export default function ProductTable({ locationId, searchQuery, onEdit }) {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  const [products, setProducts] = useState([])
  const [lastId, setLastId] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)

  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const sentinelRef = useRef(null)

  const formatNaira = amount => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const fetchProducts = async (isNewSearch = false) => {
    if (isFetching || (!hasMore && !isNewSearch)) return

    setIsFetching(true)
    if (isNewSearch) setIsInitialLoading(true)

    const currentLastId = isNewSearch ? null : lastId

    try {
      const response = await Axios.post(`${appState.backendURL}/get-products`, {
        locationId: locationId,
        query: searchQuery,
        lastId: currentLastId,
        limit: 15,
      })

      if (response.data && response.data.length > 0) {
        console.log(response.data)
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
  }

  useEffect(() => {
    setLastId(null)
    setHasMore(true)
    fetchProducts(true)
  }, [searchQuery, locationId])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isFetching &&
          !isInitialLoading
        ) {
          fetchProducts()
        }
      },
      { threshold: 0.1 },
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [lastId, hasMore, isFetching, isInitialLoading])

  return (
    <div className="w-full relative">
      <div className="overflow-x-auto min-h-[400px]">
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
                  <td colSpan="5" className="py-24">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <Loader2
                          className="animate-spin text-indigo-600"
                          size={32}
                        />
                        <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">
                          Loading...
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                          Please wait while we fetch local stock data...
                        </p>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                products.map(item => (
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
                            {item.details?.name || item.name}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1.5 font-bold uppercase tracking-tighter">
                            {item.details?.sku || item.sku} •{" "}
                            {item.details?.packaging ||
                              item.packaging ||
                              "Units"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black border ${item.bulkQuantity <= 5 ? "bg-red-50 text-red-600 border-red-100" : "bg-indigo-50 text-indigo-700 border-indigo-100"}`}
                        >
                          {item.bulkQuantity || 0}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-bold text-gray-500">
                      {formatNaira(item.details?.costPrice || item.costPrice)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-black text-gray-900">
                        {formatNaira(
                          item.details?.sellingPrice || item.sellingPrice,
                        )}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() =>
                            appDispatch({ type: "openTransferModal" })
                          }
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <ArrowRightLeft size={16} />
                        </button>

                        {/* UPDATED: Edit Button connected to onEdit prop */}
                        <button
                          onClick={() => onEdit(item.details || item)}
                          className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Edit3 size={16} />
                        </button>
                      </div>
                      <div className="group-hover:hidden flex justify-end">
                        <MoreHorizontal className="text-gray-300" size={16} />
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>

        {/* --- BOTTOM SENTINEL / SCROLL LOADER --- */}
        <div
          ref={sentinelRef}
          className="py-12 flex flex-col items-center justify-center border-t border-gray-50"
        >
          {!isInitialLoading && isFetching ? (
            <div className="flex items-center gap-3 text-indigo-500">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Pulling more stock...
              </span>
            </div>
          ) : !isInitialLoading && products.length === 0 ? (
            <div className="text-center opacity-20 py-10">
              <Box size={40} className="mx-auto mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">
                Node Empty
              </p>
            </div>
          ) : !hasMore && products.length > 0 ? (
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic opacity-50">
              Catalog End
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
