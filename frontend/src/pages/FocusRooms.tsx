import { motion } from 'framer-motion'
import { Globe, Loader2, Play, Plus, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Sidebar } from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { dedupeSites, formatRemaining } from '../features/focusRooms/focusRoomUtils'
import { useSmartRooms } from '../hooks/useSmartRooms'
import {
  createSmartRoom,
  deleteSmartRoom,
  getSmartRoomRemainingMs,
  getSmartRoomStatus,
  startSmartRoomSession,
} from '../services/smartRooms'

export function FocusRoomsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { rooms, loading, error } = useSmartRooms()
  const [title, setTitle] = useState('')
  const [siteInputs, setSiteInputs] = useState<string[]>([''])
  const [duration, setDuration] = useState(45)
  const [createLoading, setCreateLoading] = useState(false)
  const [actionRoomId, setActionRoomId] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleSiteChange = (index: number, value: string) => {
    setSiteInputs((current) => current.map((site, siteIndex) => (siteIndex === index ? value : site)))
  }

  const addSiteInput = () => {
    setSiteInputs((current) => [...current, ''])
  }

  const removeSiteInput = (index: number) => {
    setSiteInputs((current) => (current.length <= 1 ? current : current.filter((_, siteIndex) => siteIndex !== index)))
  }

  const handleCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)

    const allowedSites = dedupeSites(siteInputs)

    if (!title.trim()) {
      setCreateError('Please provide a room title.')
      return
    }

    if (allowedSites.length === 0) {
      setCreateError('Add at least one valid allowed website URL.')
      return
    }

    if (!user) {
      setCreateError('Please login to create a room.')
      return
    }

    setCreateLoading(true)
    try {
      await createSmartRoom({
        userId: user.uid,
        title,
        allowedSites,
        duration,
      })

      setTitle('')
      setSiteInputs([''])
      setDuration(45)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unable to create room.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleStartFocus = async (roomId: string, allowedSites: string[], roomDuration: number) => {
    setActionRoomId(roomId)
    try {
      await startSmartRoomSession(roomId)

      const endsAt = Date.now() + roomDuration * 60 * 1000
      const extensionPayload = { roomId, allowedSites, endsAt }
      localStorage.setItem('focusroom-active-session', JSON.stringify(extensionPayload))
      localStorage.setItem('focusroom-allowed-sites', JSON.stringify(allowedSites))
      window.dispatchEvent(new CustomEvent('focusroom:start', { detail: extensionPayload }))

      navigate(`/smart-room/${roomId}/focus`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unable to start focus session.')
    } finally {
      setActionRoomId(null)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    const canDelete = window.confirm('Delete this room? This action cannot be undone.')
    if (!canDelete) {
      return
    }

    setActionRoomId(roomId)
    try {
      await deleteSmartRoom(roomId)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unable to delete room.')
    } finally {
      setActionRoomId(null)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-70" />
      <Sidebar />

      <main className="relative z-10 p-4 sm:p-6 lg:ml-72">
        <header className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 backdrop-blur-2xl shadow-[var(--card-shadow)]">
          <h1 className="font-display text-2xl font-semibold">Smart Focus Rooms</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Create focused sessions with allowed-site browsing, a synced timer, and live room status.</p>
        </header>

        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 backdrop-blur-2xl shadow-[var(--card-shadow)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Create Room</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Add allowed sites, choose a duration, and launch a distraction-free focus room.</p>

          <form onSubmit={handleCreateRoom} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-[var(--muted)]">
              Room Title
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Pharmacology Sprint"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm text-[var(--text)] outline-none ring-0 placeholder:text-[var(--muted)] focus:border-[var(--text)]"
              />
            </label>

            <label className="text-sm text-[var(--muted)] sm:col-span-2">
              Duration (minutes)
              <input
                type="number"
                min={15}
                max={180}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value) || 45)}
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm text-[var(--text)] outline-none ring-0 placeholder:text-[var(--muted)] focus:border-[var(--text)]"
              />
            </label>

            <div className="sm:col-span-2 space-y-2">
              <p className="text-sm text-[var(--text)]">Allowed Websites</p>
              {siteInputs.map((site, index) => (
                <div key={`${index}-${siteInputs.length}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={site}
                    onChange={(event) => handleSiteChange(index, event.target.value)}
                    placeholder="https://www.khanacademy.org"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm text-[var(--text)] outline-none ring-0 placeholder:text-[var(--muted)] focus:border-[var(--text)]"
                  />
                  <button
                    type="button"
                    onClick={() => removeSiteInput(index)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text)] transition hover:brightness-105"
                    aria-label="Remove site"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addSiteInput}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm text-[var(--text)] transition hover:brightness-105"
              >
                <Plus className="h-4 w-4" />
                Add Website
              </button>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between gap-3">
              {createError ? <p className="text-sm text-[var(--muted)]">{createError}</p> : <span />}
              <button
                type="submit"
                disabled={createLoading}
                className="rounded-xl border border-[var(--border)] bg-[var(--text)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-70"
              >
                {createLoading ? 'Creating...' : 'Create Focus Room'}
              </button>
            </div>
          </form>
        </section>

        {loading ? (
          <div className="flex items-center gap-2 text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading rooms...
          </div>
        ) : null}

        {error ? <p className="text-sm text-[var(--muted)]">{error}</p> : null}

        {!loading && !error && rooms.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted)] backdrop-blur-2xl shadow-[var(--card-shadow)]">
            No rooms yet. Create your first Smart Focus Room to begin.
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <motion.article
              key={room.id}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 backdrop-blur-xl transition-all duration-300 shadow-[var(--card-shadow)]"
            >
              <h2 className="text-lg font-semibold text-[var(--text)]">{room.title}</h2>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1 text-xs text-[var(--muted)]">
                <Globe className="h-3.5 w-3.5" />
                {room.allowedSites.length} allowed site{room.allowedSites.length === 1 ? '' : 's'}
              </div>

              <p className="mt-3 text-sm text-[var(--muted)]">Duration: {room.duration} min</p>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Status:{' '}
                <span className="font-medium uppercase tracking-[0.08em]">
                  {getSmartRoomStatus(room)}
                </span>
              </p>

              {getSmartRoomStatus(room) === 'active' ? (
                <p className="mt-1 text-xs text-[var(--text)]">Remaining: {formatRemaining(getSmartRoomRemainingMs(room))}</p>
              ) : null}

              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartFocus(room.id, room.allowedSites, room.duration)}
                  disabled={actionRoomId === room.id}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-all duration-300 hover:brightness-105 disabled:opacity-70"
                >
                  <Play className="h-4 w-4" />
                  Start Focus
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteRoom(room.id)}
                  disabled={actionRoomId === room.id}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text)] transition hover:brightness-105 disabled:opacity-70"
                  aria-label="Delete room"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.article>
          ))}
        </section>
      </main>
    </div>
  )
}
