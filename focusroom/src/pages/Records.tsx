import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import { Sidebar } from '../components/Sidebar'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { getSessionsByUser, type SessionRecord } from '../services/sessions'

const formatDate = (isoMs: number) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoMs))
}

export function RecordsPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const result = await getSessionsByUser(user.uid)
        setRecords(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load records.')
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [user])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <Sidebar />

      <main className="ml-72 p-6">
        <header className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-5 shadow-lg">
          <h1 className="font-display text-2xl font-semibold">Session Records</h1>
          <p className="mt-1 text-sm text-slate-300">Your complete focus room history from Firestore.</p>
        </header>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <Skeleton variant="text" height="1.125rem" width="8rem" />
                  <Skeleton variant="text" height="0.875rem" width="6rem" />
                </div>
                <Skeleton variant="text" height="0.875rem" width="6rem" />
              </div>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl p-5 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {!loading && !error && records.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-5 text-sm text-slate-300">
            No sessions found yet. Join a room to start tracking your focus time.
          </div>
        ) : null}

        <section className="grid gap-3">
          {records.map((session) => (
            <motion.article
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="group rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-4 transition-all duration-300 hover:border-slate-600/50 hover:bg-slate-800/50 hover:shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-medium text-cyan-200 transition-colors duration-300 group-hover:text-cyan-100">{session.roomTitle}</h2>
                <p className="text-sm text-slate-400">{formatDate(session.startTime.toMillis())}</p>
              </div>
              <p className="mt-2 text-sm text-slate-300">Duration: {session.duration} min</p>
            </motion.article>
          ))}
        </section>
      </main>
    </div>
  )
}
