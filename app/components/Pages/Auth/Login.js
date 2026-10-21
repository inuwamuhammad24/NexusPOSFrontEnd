import React, { useState, useContext, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react"
import Axios from "axios"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"
import FlashMessages from "../../Reusables/FlashMessage"

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
        email: email.toLowerCase().trim(),
        password,
      })
      if (response.data.token) {
        appDispatch({ type: "login", data: response.data })
        appDispatch({
          type: "addFlashMessage",
          payload: {
            type: "sucess",
            msg: "Welcome back!",
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
        appDispatch({ type: "clearFlash" })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [appState.flashMessage])

  return (
    <>
      <FlashMessages />
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12 font-sans antialiased text-gray-900 selection:bg-indigo-500 selection:text-white">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/25 group-hover:scale-105 transition-transform">
              N
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-gray-900">
              NEXUS<span className="text-indigo-600">POS</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Sign in to your store
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Access your register, inventory, and reports
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-gray-100 p-8 sm:p-10"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Work email address
              </label>
              <div className="relative flex items-center">
                <Mail
                  className="absolute left-3.5 text-gray-400 pointer-events-none"
                  size={16}
                />
                <input
                  autoFocus
                  required
                  type="email"
                  value={email}
                  placeholder="name@store.com"
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
              </div>
              <div className="relative flex items-center">
                <Lock
                  className="absolute left-3.5 text-gray-400 pointer-events-none"
                  size={16}
                />
                <input
                  required
                  type="password"
                  value={password}
                  placeholder="••••••••"
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25 active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:shadow-none disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Context Footer Link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            Need to open a new store?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              Start 14-day free trial
            </Link>
          </div>
        </motion.div>

        {/* Small Attribution */}
        <p className="text-xs text-gray-400 mt-8">
          NexusPOS • Engineered by Nexus Point Innovation
        </p>
      </div>
    </>
  )
}
