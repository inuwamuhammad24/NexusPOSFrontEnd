import React, { useState } from "react"

function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = e => {
    e.preventDefault()
    console.log({ email, password })
    // TODO: connect to backend
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="https://thumbs.dreamstime.com/b/realistic-corporate-different-type-business-logo-design-template-featuring-versatile-professional-logos-suitable-various-357594532.jpg?w=768"
            alt="Store Logo"
            className="w-16 h-16 mb-2"
          />
          <h1 className="text-2xl font-bold text-gray-800">My Store POS</h1>
          <p className="text-sm text-gray-500">Login to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
