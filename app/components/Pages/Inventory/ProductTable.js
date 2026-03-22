import React, { useContext, useState } from "react"
import {
  Package,
  ArrowRightLeft,
  Edit3,
  Trash2,
  Search,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react"
import { motion } from "framer-motion"
import DispatchContext from "../../../DispatchContext"

export default function ProductTable() {
  // Mock Data - This will eventually come from your MongoDB Product Collection
  const appDispatch = useContext(DispatchContext)
  const [products] = useState([
    {
      id: 1,
      name: "Fresh Milk 1L",
      sku: "MK-01",
      price: 2.5,
      shelf: 5,
      store: 45,
      category: "Dairy",
    },
    {
      id: 2,
      name: "Sugar 1kg",
      sku: "SG-22",
      price: 1.2,
      shelf: 0,
      store: 120,
      category: "Pantry",
    },
    {
      id: 3,
      name: "Whole Bread",
      sku: "BD-05",
      price: 1.8,
      shelf: 12,
      store: 0,
      category: "Bakery",
    },
    {
      id: 4,
      name: "Coca Cola 500ml",
      sku: "CC-12",
      price: 1.5,
      shelf: 24,
      store: 72,
      category: "Beverages",
    },
  ])

  return (
    <div className="space-y-6">
      {/* 1. Inventory Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search SKU, Name, or Category..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition flex items-center gap-2">
            <AlertCircle size={16} /> Low Stock
          </button>
          <button
            onClick={() => appDispatch({ type: "openProductModal" })}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* 2. Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                Product Info
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                Shelf Stock
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                Store Stock
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                Price
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product, index) => (
              <motion.tr
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={product.id}
                className="hover:bg-blue-50/30 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 leading-none">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">
                        {product.sku} • {product.category}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Shelf Stock Column */}
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-black min-w-[40px] ${
                      product.shelf === 0
                        ? "bg-red-100 text-red-600 border border-red-200"
                        : product.shelf < 10
                          ? "bg-orange-100 text-orange-600 border border-orange-200"
                          : "bg-blue-50 text-blue-600 border border-blue-100"
                    }`}
                  >
                    {product.shelf}
                  </span>
                </td>

                {/* Store Stock Column */}
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    {product.store}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <p className="text-sm font-black text-gray-800">
                    ${product.price.toFixed(2)}
                  </p>
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      title="Transfer to Shelf"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <ArrowRightLeft size={16} />
                    </button>
                    <button
                      title="Edit Product"
                      className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      title="Delete"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="group-hover:hidden flex justify-end">
                    <MoreHorizontal className="text-gray-300" size={16} />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
