import React, { useState, useEffect, useContext } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Store,
  Layers,
  Check,
  Tag,
} from "lucide-react"
import Axios from "axios"
import DispatchContext from "../../../DispatchContext"
import StateContext from "../../../StateContext"
import formatNaira from "../../Reusables/NairaFormatter"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export default function RegisterPage() {
  const appDispatch = useContext(DispatchContext)
  const appState = useContext(StateContext)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Read URL query params
  const initialPlanSlug = searchParams.get("plan") || "starter"
  const referralCodeFromUrl = searchParams.get("ref") || ""

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    referralCode: referralCodeFromUrl,
    selectedPlan: initialPlanSlug,
  })

  const [availablePlans, setAvailablePlans] = useState([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Fetch dynamic plans from MongoDB
  useEffect(() => {
    let isMounted = true
    async function fetchPlans() {
      try {
        setIsLoadingPlans(true)
        const endpoint = appState?.backendURL
          ? `${appState.backendURL}/get-plans`
          : "/get-plans"
        const res = await Axios.get(endpoint)
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          setAvailablePlans(res.data)
          // If query param matched a plan, ensure it is selected
          const matched = res.data.find(
            p => p.slug?.toLowerCase() === initialPlanSlug.toLowerCase(),
          )
          if (matched) {
            setFormData(prev => ({ ...prev, selectedPlan: matched.slug }))
          }
        }
      } catch (err) {
        console.error("Failed to load plans on registration:", err)
      } finally {
        if (isMounted) setIsLoadingPlans(false)
      }
    }
    fetchPlans()
    return () => {
      isMounted = false
    }
  }, [appState?.backendURL, initialPlanSlug])

  const calculatePasswordStrength = pass => {
    let score = 0
    if (!pass) return { score: 0, label: "", color: "bg-gray-200" }
    if (pass.length >= 6) score += 1
    if (pass.length >= 10) score += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
    if (/\d/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" }
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" }
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" }
    return { score: 4, label: "Strong", color: "bg-emerald-500" }
  }

  const passwordStrength = calculatePasswordStrength(formData.password)

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errorMessage) setErrorMessage("")
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify and try again.")
      return
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      const response = await Axios.post(
        `${appState.backendURL}/register-store`,
        {
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          password: formData.password,
          referralCode: formData.referralCode || null,
          plan: formData.selectedPlan || "starter",
        },
      )

      if (response.data && response.data.token) {
        // Sync persistent credentials to LocalStorage
        localStorage.setItem("nexusposToken", response.data.token)
        localStorage.setItem("nexusposUsername", response.data.username)
        localStorage.setItem("nexusposRole", response.data.role)
        localStorage.setItem("nexusposStoreId", response.data.storeId)
        localStorage.setItem("nexusposBusinessName", response.data.businessName)

        // Dispatch Session into Global React State
        appDispatch({
          type: "login",
          data: response.data,
        })

        // Trigger Global Flash Notification (Fixed typo: 'success')
        appDispatch({
          type: "addFlashMessage",
          payload: {
            type: "success",
            msg: `Store "${response.data.businessName}" created successfully! Welcome to your 14-day trial.`,
          },
        })

        navigate("/dashboard")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setErrorMessage(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to create your store. Please check your details and try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const currentSelectedPlan = availablePlans.find(
    p => p.slug === formData.selectedPlan,
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans antialiased text-gray-900 selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Brand Showcase */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="lg:w-5/12 xl:w-5/12 bg-slate-900 text-white p-8 sm:p-12 lg:p-14 xl:p-16 flex flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-300">
              N
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              NEXUS<span className="text-indigo-400">POS</span>
            </span>
          </Link>
          <p className="text-sm font-medium text-slate-400 mt-2">
            Business management, simplified.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 my-10 lg:my-0 max-w-md"
        >
          <motion.div variants={itemVariants} className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-indigo-400 uppercase">
              14-Day Free Evaluation
            </h2>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
              Smart sales, inventory tracking, and loss prevention in one place.
            </h1>
          </motion.div>

          <div className="mt-8 space-y-4">
            <motion.div
              variants={itemVariants}
              className="flex items-start gap-3.5"
            >
              <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 shrink-0 mt-0.5 border border-slate-700/60">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Sales & transactions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Fast checkout with dual-format receipt printing for thermal
                  paper and A4 invoices.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-start gap-3.5"
            >
              <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 shrink-0 mt-0.5 border border-slate-700/60">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Inventory management
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Track stock movements, arrivals, and transfers in real time
                  without discrepancies.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-start gap-3.5"
            >
              <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 shrink-0 mt-0.5 border border-slate-700/60">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Staff & security governance
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Protect profit margins by logging unauthorized price overrides
                  and transaction deletions.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-start gap-3.5"
            >
              <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 shrink-0 mt-0.5 border border-slate-700/60">
                <Store size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Multi-location oversight
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Manage multiple retail counters and branch warehouses from a
                  single account.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="mt-8 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm hidden sm:block"
          >
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Sync Active
              </span>
              <span className="text-slate-400">Multi-tenant Ready</span>
            </div>
          </motion.div>
        </motion.div>

        <div className="relative z-10 pt-6 border-t border-slate-800 text-xs text-slate-400 font-medium">
          Trusted tools for modern businesses.
        </div>
      </motion.div>

      {/* Right Column: Registration Form */}
      <div className="lg:w-7/12 xl:w-7/12 flex items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-xl py-4"
        >
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3"
            >
              <Sparkles size={13} className="text-indigo-600" /> 14-day free
              trial · Full access
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Create your NexusPOS account
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-normal">
              Get your store running in minutes. No credit card required.
            </p>
          </div>

          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 text-sm font-medium">
                  <AlertCircle size={18} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Dynamic Plan Selection Badge */}
            {availablePlans.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Selected Initial Plan Tier
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {availablePlans.map(plan => {
                    const isSelected = formData.selectedPlan === plan.slug
                    return (
                      <button
                        key={plan.slug}
                        type="button"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            selectedPlan: plan.slug,
                          }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 uppercase">
                            {plan.name}
                          </span>
                          {isSelected && (
                            <Check size={14} className="text-indigo-600" />
                          )}
                        </div>
                        <p className="text-xs font-black text-gray-900 mt-1">
                          {formatNaira(plan.price)}
                          <span className="text-[10px] font-normal text-gray-400">
                            /mo
                          </span>
                        </p>
                      </button>
                    )
                  })}
                </div>
                {currentSelectedPlan && (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Trial includes up to{" "}
                    <strong>
                      {currentSelectedPlan.limits?.locations || 1} branch(es)
                    </strong>{" "}
                    and{" "}
                    <strong>
                      {currentSelectedPlan.limits?.users || 2} staff account(s)
                    </strong>
                    .
                  </p>
                )}
              </div>
            )}

            {/* 2. Business Information */}
            <div className="border-t border-gray-100 pt-5">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Business information
                </h2>
                <p className="text-xs text-gray-500">
                  Tell us about your retail venture.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Business name
                  </label>
                  <input
                    required
                    name="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="e.g. Apex Supermarket"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Business phone
                    </label>
                    <input
                      required
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0801 234 5678"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Store location / address
                    </label>
                    <input
                      required
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Lagos, Nigeria"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Admin Account */}
            <div className="border-t border-gray-100 pt-5">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Manager profile
                </h2>
                <p className="text-xs text-gray-500">
                  Create your administrator credentials.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full name
                    </label>
                    <input
                      required
                      name="ownerName"
                      type="text"
                      value={formData.ownerName}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      required
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@apexmarket.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <input
                      required
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm password
                    </label>
                    <input
                      required
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {formData.password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1.5 pt-1 overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-500">
                          Security requirement: At least 6 characters
                        </span>
                        <span className="font-semibold text-gray-700">
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map(step => (
                          <div
                            key={step}
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              step <= passwordStrength.score
                                ? passwordStrength.color
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 4. Referral Code Section */}
            <div className="border-t border-gray-100 pt-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Tag size={14} className="text-indigo-600" />
                <span>Referral code (Optional)</span>
              </label>
              <input
                name="referralCode"
                type="text"
                value={formData.referralCode}
                onChange={handleChange}
                placeholder="Enter friend or merchant referral code"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Applying a referral code awards your referrer +30 free days upon
                subscription activation.
              </p>
            </div>

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25 active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Setting up your store...</span>
                  </>
                ) : (
                  <>
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm font-normal text-gray-500">
            Already have a NexusPOS account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
