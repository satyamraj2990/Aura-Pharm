import { Pause, Play, Clock3, LogOut, Users } from 'lucide-react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Sidebar } from '../components/Sidebar'
import { CircularProgress, LinearProgress } from '../components/ui/ProgressBar'
import { useAuth } from '../context/AuthContext'
import { getRoomById } from '../services/rooms'
import { saveSession } from '../services/sessions'
import {
  createRoomSession,
  pauseRoomSession,
  resumeRoomSession,
  completeRoomSession,
  joinRoomSession,
  leaveRoomSession,
  subscribeToRoomSession,
  type RoomSession,
} from '../services/roomSessions'
import { SoundNotification } from '../utils/soundNotification'

type RoomState = {
  roomId?: string
  roomTitle?: string
  startTime?: string
  sessionId?: string
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const formatTimeLeft = (secondsLeft: number) => {
  if (secondsLeft <= 0) return '00:00'

  const hours = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const seconds = secondsLeft % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function RoomPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const state = location.state as RoomState | null

  const [roomTitle, setRoomTitle] = useState(state?.roomTitle ?? 'Focus Room')
  const [roomSession, setRoomSession] = useState<RoomSession | null>(null)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sessionCompleted, setSessionCompleted] = useState(false)

  // Timer state
  const timerData = useMemo(() => {
    if (!roomSession) return null

    const now = currentTime.getTime() / 1000 // Convert to seconds
    const startTime = roomSession.startTime.toMillis() / 1000
    const totalDuration = roomSession.duration * 60 // Convert minutes to seconds

    let elapsed = now - startTime - roomSession.totalPausedTime

    // If paused, don't advance the timer
    if (roomSession.isPaused && roomSession.pausedAt) {
      const pausedTime = roomSession.pausedAt.toMillis() / 1000
      elapsed = pausedTime - startTime - roomSession.totalPausedTime
    }

    const progress = Math.min((elapsed / totalDuration) * 100, 100)
    const timeLeft = Math.max(totalDuration - elapsed, 0)
    const isCompleted = elapsed >= totalDuration

    return {
      elapsed: Math.floor(elapsed),
      progress: Math.max(0, Math.min(progress, 100)),
      timeLeft: Math.floor(timeLeft),
      isCompleted,
      totalDuration,
    }
  }, [roomSession, currentTime])

  // Initialize room session
  useEffect(() => {
    const initializeSession = async () => {
      if (!id || !user) return

      try {
        setIsLoading(true)

        // Check if there's an existing session for this room
        // For now, we'll create a new session. In a real app, you'd check for active sessions
        const sessionId = state?.sessionId || await createRoomSession({
          roomId: id,
          creatorId: user.uid,
          duration: 25, // Default 25 minutes - could be configurable
        })

        // Join the session
        await joinRoomSession(sessionId, user.uid)

        // Get room details
        const room = await getRoomById(id)
        if (room?.title) {
          setRoomTitle(room.title)
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize session')
      } finally {
        setIsLoading(false)
      }
    }

    initializeSession()
  }, [id, user, state?.sessionId])

  // Subscribe to room session updates
  useEffect(() => {
    if (!id || !user) return

    // For demo purposes, we'll create a session ID based on room ID
    // In a real app, you'd track active sessions per room
    const sessionId = `session_${id}`

    const unsubscribe = subscribeToRoomSession(
      sessionId,
      (session) => {
        setRoomSession(session)
        if (session?.status === 'completed' && !sessionCompleted) {
          setSessionCompleted(true)
          SoundNotification.playSessionComplete()
        }
      },
      (error) => {
        setError(error.message)
      }
    )

    return unsubscribe
  }, [id, user, sessionCompleted])

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Handle pause/resume (only room creator)
  const handleTogglePause = useCallback(async () => {
    if (!roomSession || !user || roomSession.creatorId !== user.uid) return

    try {
      if (roomSession.isPaused) {
        // Calculate additional paused time
        if (roomSession.pausedAt) {
          const resumeTime = Date.now()
          const pausedDuration = Math.floor((resumeTime - roomSession.pausedAt.toMillis()) / 1000)
          const newTotalPausedTime = roomSession.totalPausedTime + pausedDuration

          await resumeRoomSession(roomSession.id, newTotalPausedTime)
        }
      } else {
        await pauseRoomSession(roomSession.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle pause')
    }
  }, [roomSession, user])

  // Handle leaving room
  const handleLeaveRoom = useCallback(async () => {
    if (!user || !roomSession) {
      navigate('/dashboard', { replace: true })
      return
    }

    setSubmitting(true)
    try {
      // Leave the session
      await leaveRoomSession(roomSession.id, user.uid)

      // If this is the creator and session is still active, complete it
      if (roomSession.creatorId === user.uid && roomSession.status === 'active') {
        await completeRoomSession(roomSession.id)
      }

      // Save individual session record
      const endTime = new Date()
      const duration = Math.max(1, Math.round((endTime.getTime() - roomSession.startTime.toMillis()) / (1000 * 60)))

      await saveSession({
        userId: user.uid,
        roomId: roomSession.roomId,
        roomTitle,
        startTime: roomSession.startTime.toDate(),
        endTime,
        duration,
      })

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room')
    } finally {
      setSubmitting(false)
    }
  }, [user, roomSession, roomTitle, navigate])

  // Handle page visibility change (for reconnect scenarios)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible again - refresh current time
        setCurrentTime(new Date())
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Handle beforeunload to prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (roomSession?.status === 'active') {
        e.preventDefault()
        e.returnValue = 'Are you sure you want to leave? Your session will be saved.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [roomSession])

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
        <Sidebar />
        <main className="ml-72 flex min-h-screen items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Initializing focus session...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
        <Sidebar />
        <main className="ml-72 flex min-h-screen items-center justify-center p-6">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    )
  }

  const isCreator = roomSession?.creatorId === user?.uid
  const canControlTimer = isCreator && roomSession?.status !== 'completed'

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <Sidebar />

      <main className="ml-72 flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm uppercase tracking-[0.22em] text-cyan-300 mb-2"
            >
              Live Session
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-display font-semibold mb-4"
            >
              {roomTitle}
            </motion.h1>

            {/* Participants */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 backdrop-blur-sm text-sm text-slate-300"
            >
              <Users className="h-4 w-4" />
              {roomSession?.participants.length || 0} participant{(roomSession?.participants.length || 0) !== 1 ? 's' : ''}
            </motion.div>
          </div>

          {/* Timer Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center space-y-6"
          >
            {/* Circular Progress */}
            <div className="relative">
              <CircularProgress
                progress={timerData?.progress || 0}
                size={200}
                strokeWidth={12}
                className="text-cyan-400"
              >
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-display font-bold text-white mb-1">
                    {timerData ? formatTime(timerData.elapsed) : '00:00'}
                  </div>
                  <div className="text-sm text-slate-400">
                    {timerData?.isCompleted ? 'Completed' : roomSession?.isPaused ? 'Paused' : 'Active'}
                  </div>
                </div>
              </CircularProgress>

              {/* Time Left Indicator */}
              <AnimatePresence>
                {timerData && !timerData.isCompleted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
                  >
                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-cyan-300 font-medium">
                      {formatTimeLeft(timerData.timeLeft)} left
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full max-w-md">
              <LinearProgress
                progress={timerData?.progress || 0}
                height={12}
                showPercentage={true}
                className="mb-4"
              />
            </div>

            {/* Session Info */}
            <div className="text-center space-y-2">
              <div className="text-sm text-slate-400">
                Session: {roomSession?.duration || 0} minutes
              </div>
              {roomSession?.isPaused && (
                <div className="text-sm text-amber-400 font-medium">
                  Session is paused
                </div>
              )}
              {timerData?.isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-lg text-emerald-400 font-semibold"
                >
                  🎉 Session Complete!
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {/* Pause/Resume Button (Creator Only) */}
            {canControlTimer && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTogglePause}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  roomSession?.isPaused
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                } backdrop-blur-sm`}
              >
                {roomSession?.isPaused ? (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                )}
              </motion.button>
            )}

            {/* Leave Room Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLeaveRoom}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-red-400/40 bg-red-500/20 text-red-100 backdrop-blur-sm transition-all duration-300 hover:bg-red-500/30 hover:border-red-400/60 disabled:opacity-70"
            >
              <LogOut className="h-4 w-4" />
              {submitting ? 'Leaving...' : 'Leave Room'}
            </motion.button>
          </motion.div>

          {/* Creator Indicator */}
          {isCreator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-sm">
                <Clock3 className="h-4 w-4" />
                Session Creator
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
