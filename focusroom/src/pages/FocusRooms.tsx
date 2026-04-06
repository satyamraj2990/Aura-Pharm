import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Sidebar } from '../components/Sidebar'
import { CardSkeleton } from '../components/ui/Skeleton'
import { type Room, getRooms } from '../services/rooms'

type RoomStartState = {
  roomId: string
  roomTitle: string
  startTime: string
}

export function FocusRoomsPage() {
  const navigate = useNavigate()

  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      try {
        const result = await getRooms()
        if (isMounted) {
          setRooms(result)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load rooms.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      isMounted = false
    }
  }, [])

  const handleJoinRoom = (room: Room) => {
    const state: RoomStartState = {
      roomId: room.id,
      roomTitle: room.title,
      startTime: new Date().toISOString(),
    }

    navigate(`/room/${room.id}`, { state })
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <Sidebar />

      <main className="ml-72 p-6">
        <header className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-5 shadow-lg">
          <h1 className="font-display text-2xl font-semibold">Smart Focus Rooms</h1>
          <p className="mt-1 text-sm text-slate-300">Join an active room and start a tracked focus session.</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl p-5 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {!loading && !error && rooms.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-5 text-sm text-slate-300">
            No rooms found in Firestore. Add documents in the rooms collection to start.
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <motion.article
              key={room.id}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-xl transition-all duration-300 hover:border-slate-600/50 hover:bg-gradient-to-br hover:from-cyan-500/10 hover:to-violet-500/10 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <h2 className="text-lg font-semibold transition-colors duration-300 group-hover:text-white">{room.title}</h2>
                <p className="mt-2 text-sm text-slate-300 transition-colors duration-300 group-hover:text-white/90">{room.description}</p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-400/15 px-3 py-1 text-xs text-cyan-200 transition-all duration-300 group-hover:bg-white/20 group-hover:text-white">
                  <Users className="h-3.5 w-3.5" />
                  {room.activeUsers} active users
                </div>

                <button
                  type="button"
                  onClick={() => handleJoinRoom(room)}
                  className="mt-5 w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-100 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/20 hover:shadow-lg"
                >
                  Join Room
                </button>
              </div>
            </motion.article>
          ))}
        </section>
      </main>
    </div>
  )
}
