import { Clock3, LogOut } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { getRoomById } from '../services/rooms'
import { saveSession } from '../services/sessions'

type RoomState = {
  roomId?: string
  roomTitle?: string
  startTime?: string
}

const formatElapsed = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function RoomPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const state = location.state as RoomState | null

  const [roomTitle, setRoomTitle] = useState(state?.roomTitle ?? 'Focus Room')
  const [startTime] = useState<Date>(() => {
    if (state?.startTime) {
      const parsed = new Date(state.startTime)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed
      }
    }
    return new Date()
  })
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const tick = window.setInterval(() => {
      const now = Date.now()
      const diffSeconds = Math.max(0, Math.floor((now - startTime.getTime()) / 1000))
      setElapsedSeconds(diffSeconds)
    }, 1000)

    return () => window.clearInterval(tick)
  }, [startTime])

  useEffect(() => {
    const run = async () => {
      if (!id) {
        return
      }
      const room = await getRoomById(id)
      if (room?.title) {
        setRoomTitle(room.title)
      }
    }

    void run()
  }, [id])

  const timerText = useMemo(() => formatElapsed(elapsedSeconds), [elapsedSeconds])

  const handleLeaveRoom = async () => {
    if (!user || !id) {
      navigate('/dashboard', { replace: true })
      return
    }

    setSubmitting(true)
    const endTime = new Date()
    const duration = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)))

    await saveSession({
      userId: user.uid,
      roomId: id,
      roomTitle,
      startTime,
      endTime,
      duration,
    })

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <Sidebar />

      <main className="ml-72 flex min-h-screen items-center justify-center p-6">
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-3xl rounded-3xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-8 text-center shadow-2xl"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Live Session</p>
          <h1 className="mt-3 font-display text-4xl font-semibold">{roomTitle}</h1>

          <div className="mx-auto mt-8 w-full max-w-xl rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-8 shadow-lg">
            <p className="mb-3 inline-flex items-center gap-2 text-sm text-slate-300">
              <Clock3 className="h-4 w-4" />
              Focus Timer
            </p>
            <p className="font-display text-7xl font-bold text-cyan-300">{timerText}</p>
          </div>

          <motion.button
            type="button"
            onClick={handleLeaveRoom}
            disabled={submitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/20 px-5 py-2.5 text-sm font-medium text-red-100 backdrop-blur-sm transition-all duration-300 hover:bg-red-500/30 hover:border-red-400/60 hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-70"
          >
            <LogOut className="h-4 w-4" />
            {submitting ? 'Leaving...' : 'Leave Room'}
          </motion.button>
        </motion.section>
      </main>
    </div>
  )
}
