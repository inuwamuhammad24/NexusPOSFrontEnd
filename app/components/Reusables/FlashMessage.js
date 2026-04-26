import React, { useEffect, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, AlertCircle, X } from "lucide-react"
import StateContext from "../../StateContext"
import DispatchContext from "../../DispatchContext"

export default function FlashMessages() {
  const appState = useContext(StateContext)
  const appDispatch = useContext(DispatchContext)

  return (
    <div className="fixed top-8 right-8 z-[1000] max-w-2xs flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {appState.flashMessage.msgs.map(flash => (
          <motion.div
            key={flash.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`
              pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl border min-w-[300px]
              ${
                flash.type === "error"
                  ? "bg-red-50 border-red-100 text-red-800"
                  : "bg-white border-gray-100 text-gray-800"
              }
            `}
          >
            {/* ICON SLOT */}
            <div
              className={`p-2 rounded-xl ${flash.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}
            >
              {flash.type === "error" ? (
                <AlertCircle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>

            {/* TEXT SLOT */}
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">
                {flash.type === "error" ? "System Alert" : "Update Successful"}
              </p>
              <p className="text-xs font-bold leading-tight">{flash.msg}</p>
            </div>

            {/* AUTO-CLOSE TIMER LOGIC (Optional manual close) */}
            <button
              onClick={() => {
                /* Logic to remove this specific ID */
              }}
              className="text-gray-300 hover:text-gray-500 transition-colors"
            >
              <X size={16} />
            </button>

            {/* PROGRESS BAR DECORATION */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-1 rounded-full ${flash.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
