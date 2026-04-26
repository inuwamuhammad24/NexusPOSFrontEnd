import React, { useState, useContext, useEffect } from "react"
import { motion } from "framer-motion"
import { Lock, User, Loader2, LogIn, Loader } from "lucide-react"
import Axios from "axios"
import DispatchContext from "../../DispatchContext"
import StateContext from "../../StateContext"
import FlashMessages from "./FlashMessage"

export default function Login() {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await Axios.post(`${appState.backendURL}/login`, {
        email,
        password,
      })
      if (response.data.token) {
        // 1. Save to Global State
        appDispatch({ type: "login", data: response.data })
        // 2. Flash Success
        appDispatch({
          type: "addFlashMessage",
          payload: {
            type: "sucess",
            msg: "Login Success",
          },
        })
      }
    } catch (e) {
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: "Login failed. Please check your credentials and try again.",
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (appState.flashMessage.msgs.length > 0) {
      const timer = setTimeout(() => {
        // Create a new action called 'clearFlash' in your reducer
        appDispatch({ type: "clearFlash" })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [appState.flashMessage])

  return (
    // flash modal
    <>
      <FlashMessages />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-8 bg-blue-600 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter">
              Terminal Access
            </h1>
            <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest mt-2 opacity-70">
              Please enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Staff Email
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-3 text-gray-300"
                  size={16}
                />
                <input
                  autoFocus
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="you@example.com"
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-3 text-gray-300"
                  size={16}
                />
                <input
                  type="password"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="••••••••••••"
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-200"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <LogIn size={18} />
              )}
              {isLoading ? "Authenticating..." : "Login"}
            </button>
          </form>
        </motion.div>
      </div>
    </>
  )
}
