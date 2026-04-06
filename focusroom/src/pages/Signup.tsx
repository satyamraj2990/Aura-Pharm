import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { getAuthErrorMessage, signUp } from '../services/auth'

export function SignupPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await signUp(email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6 shadow-2xl"
      >
        <h1 className="font-display text-2xl font-semibold text-slate-100">Create account</h1>
        <p className="mt-2 text-sm text-slate-300">Start tracking your focus sessions with FocusRoom.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm px-3 py-2 text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/50 focus:bg-slate-800/70 placeholder:text-slate-400"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm px-3 py-2 text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/50 focus:bg-slate-800/70 placeholder:text-slate-400"
              placeholder="Create a password"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 backdrop-blur-sm p-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-70"
          >
            {submitting ? 'Creating account...' : 'Signup'}
          </motion.button>

          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm px-4 py-2.5 text-sm text-slate-300 transition-all duration-300 hover:bg-slate-700/50 hover:border-slate-600/50 hover:text-slate-100"
          >
            Go to Login
          </Link>
        </form>
      </motion.div>
    </div>
  )
}
