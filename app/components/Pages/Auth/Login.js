import React, { useState, useContext, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Lock,
  Mail,
  Loader2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react"
import Axios from "axios"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"
import FlashMessages from "../../Reusables/FlashMessage"

export default function Login() {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)

  // View Mode: 'login' | 'forgot-email' | 'forgot-verify'
  const [view, setView] = useState("login")

  // Login State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Reset Password State
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)

  async function handleLoginSubmit(e) {
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
          msg:
            e.response?.data?.error ||
            "Login failed. Please check your credentials and try again.",
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRequestOtp(e) {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      const response = await Axios.post(
        `${appState.backendURL}/forgot-password`,
        {
          email: email.toLowerCase().trim(),
        },
      )

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "sucess",
          msg:
            response.data?.message ||
            "Verification code sent to your email address.",
        },
      })
      setView("forgot-verify")
    } catch (err) {
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg:
            err.response?.data?.error ||
            "Could not process reset request. Please try again.",
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault()

    if (newPassword.length < 6) {
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: "New password must be at least 6 characters long.",
        },
      })
      return
    }

    if (newPassword !== confirmPassword) {
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg: "Passwords do not match.",
        },
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await Axios.post(
        `${appState.backendURL}/reset-password`,
        {
          email: email.toLowerCase().trim(),
          otp: otp.trim(),
          newPassword,
        },
      )

      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "sucess",
          msg:
            response.data?.message ||
            "Password reset successfully! Sign in with your new password.",
        },
      })

      setPassword("")
      setOtp("")
      setNewPassword("")
      setConfirmPassword("")
      setView("login")
    } catch (err) {
      appDispatch({
        type: "addFlashMessage",
        payload: {
          type: "error",
          msg:
            err.response?.data?.error ||
            "Invalid or expired verification code.",
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
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-10 font-sans antialiased text-gray-900 selection:bg-indigo-500 selection:text-white">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/25 group-hover:scale-105 transition-transform">
              N
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-gray-900">
              NEXUS<span className="text-indigo-600">POS</span>
            </span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            {view === "login"
              ? "Sign in to your store"
              : view === "forgot-email"
                ? "Reset your password"
                : "Enter verification code"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {view === "login"
              ? "Access your register, inventory, and reports"
              : view === "forgot-email"
                ? "We'll send a 6-digit recovery code to your work email"
                : `Enter the code sent to ${email}`}
          </p>
        </div>

        {/* Auth Card */}
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-gray-100 p-6 sm:p-10"
        >
          {/* VIEW 1: STANDARD SIGN IN */}
          {view === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setView("forgot-email")}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock
                    className="absolute left-3.5 text-gray-400 pointer-events-none"
                    size={16}
                  />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    placeholder="••••••••"
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3.5 text-gray-400 hover:text-gray-600 p-1"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
          )}

          {/* VIEW 2: REQUEST 6-DIGIT OTP */}
          {view === "forgot-email" && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Registered work email
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
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setView("login")}
                className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1.5 transition"
              >
                <ArrowLeft size={14} />
                <span>Back to sign in</span>
              </button>
            </form>
          )}

          {/* VIEW 3: ENTER 6-DIGIT OTP & NEW PASSWORD */}
          {view === "forgot-verify" && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleRequestOtp}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Resend code
                  </button>
                </div>
                <div className="relative flex items-center">
                  <KeyRound
                    className="absolute left-3.5 text-gray-400 pointer-events-none"
                    size={16}
                  />
                  <input
                    autoFocus
                    required
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    placeholder="123456"
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-base sm:text-sm font-mono font-bold tracking-widest text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <Lock
                    className="absolute left-3.5 text-gray-400 pointer-events-none"
                    size={16}
                  />
                  <input
                    required
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    placeholder="Minimum 6 characters"
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(prev => !prev)}
                    className="absolute right-3.5 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Lock
                    className="absolute left-3.5 text-gray-400 pointer-events-none"
                    size={16}
                  />
                  <input
                    required
                    type={showNewPassword ? "text" : "password"}
                    value={confirmPassword}
                    placeholder="Re-enter new password"
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:shadow-none disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Reset Password</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setView("login")}
                className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1.5 transition"
              >
                <ArrowLeft size={14} />
                <span>Cancel & return to sign in</span>
              </button>
            </form>
          )}

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
