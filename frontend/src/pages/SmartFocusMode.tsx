import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ExternalLink, FileUp, Maximize2, Minimize2, Send, ShieldAlert, Timer, Users } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { formatRemaining, isAllowedUrl, normalizeSiteInput } from '../features/focusRooms/focusRoomUtils'
import { useRoomChat } from '../hooks/useRoomChat'
import { useRoomMembers } from '../hooks/useRoomMembers'
import {
  completeSmartRoomSession,
  getSmartRoomRemainingMs,
  listenSmartRoomById,
  type SmartRoom,
} from '../services/smartRooms'
import { joinRoom, leaveRoom, sendRoomMessage, shareRoomFile } from '../services/rooms'

const ACTIVE_SESSION_KEY = 'focusroom-active-session'
const EXTENSION_ALLOWED_SITES_KEY = 'focusroom-allowed-sites'
const STREAK_KEY = 'focusroom-streak'
const ALLOWED_SITE_GRACE_MS = 60 * 60 * 1000
const IFRAME_FALLBACK_HOSTS = ['leetcode.com', 'www.leetcode.com']

const getIframeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'www.youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtu.be') {
      const videoId = parsed.searchParams.get('v')
        ?? (hostname === 'youtu.be' ? parsed.pathname.split('/').filter(Boolean)[0] : null)
        ?? (parsed.pathname.includes('/shorts/') ? parsed.pathname.split('/shorts/')[1]?.split('/')[0] : null)

      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
      }

      return null
    }

    return url
  } catch {
    return null
  }
}

const isIframeBlockedSite = (url: string) => {
  try {
    const hostname = new URL(url).hostname
    return IFRAME_FALLBACK_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

const getDayKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getPreviousDayKey = (date = new Date()) => {
  const previous = new Date(date)
  previous.setDate(previous.getDate() - 1)
  return getDayKey(previous)
}

const updateStreakOnCompletion = (): number => {
  const today = getDayKey()
  const yesterday = getPreviousDayKey()

  let currentCount = 1
  try {
    const saved = localStorage.getItem(STREAK_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as { day?: string; count?: number }
      if (parsed.day === today) {
        currentCount = Math.max(1, Number(parsed.count ?? 1))
      } else if (parsed.day === yesterday) {
        currentCount = Math.max(1, Number(parsed.count ?? 1)) + 1
      }
    }
  } catch {
    currentCount = 1
  }

  localStorage.setItem(STREAK_KEY, JSON.stringify({ day: today, count: currentCount }))
  return currentCount
}

const readCurrentStreak = (): number => {
  try {
    const saved = localStorage.getItem(STREAK_KEY)
    if (!saved) {
      return 0
    }

    const parsed = JSON.parse(saved) as { day?: string; count?: number }
    if (parsed.day !== getDayKey()) {
      return 0
    }

    return Math.max(0, Number(parsed.count ?? 0))
  } catch {
    return 0
  }
}

const playCompletionTone = () => {
  try {
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.connect(gain)
    gain.connect(audioContext.destination)

    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.value = 0.0001

    oscillator.start()
    gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.05)
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.45)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.6)

    oscillator.stop(audioContext.currentTime + 0.62)
  } catch {
    // Audio playback can fail on restricted browsers; completion state still updates.
  }
}

const computeFocusScore = (tabSwitchCount: number): number => Math.max(0, 100 - tabSwitchCount * 14)

export function SmartFocusModePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { members } = useRoomMembers(id)
  const { messages, loading: messagesLoading, error: messagesError } = useRoomChat(id)

  const [room, setRoom] = useState<SmartRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [currentSite, setCurrentSite] = useState('')
  const [siteInput, setSiteInput] = useState('')
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)
  const [browserMode, setBrowserMode] = useState<'iframe' | 'fallback'>('iframe')
  const [iframeReady, setIframeReady] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messageSending, setMessageSending] = useState(false)
  const [fileSharing, setFileSharing] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [streakCount, setStreakCount] = useState(() => readCurrentStreak())
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))

  const completionHandledRef = useRef(false)
  const allowedSiteGraceUntilRef = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const joinedRoomRef = useRef(false)

  useEffect(() => {
    if (!id) {
      setError('Invalid focus room id.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = listenSmartRoomById(
      id,
      (nextRoom) => {
        setRoom(nextRoom)
        setLoading(false)
      },
      (message) => {
        setError(message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [id])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!room) {
      return
    }

    if (!currentSite && room.allowedSites[0]) {
      setCurrentSite(room.allowedSites[0])
      setSiteInput(room.allowedSites[0])
      setIframeReady(false)
    }
  }, [room, currentSite])

  useEffect(() => {
    let alive = true

    const syncMembership = async () => {
      if (!room || !id || !user) {
        return
      }

      try {
        await joinRoom(id, user)
        if (alive) {
          joinedRoomRef.current = true
        }
      } catch {
        // The focus room still works if membership sync fails; chat/file actions will surface their own errors.
      }
    }

    void syncMembership()

    return () => {
      alive = false
      if (joinedRoomRef.current && id && user) {
        void leaveRoom(id, user).catch(() => {})
        joinedRoomRef.current = false
      }
    }
  }, [id, room, user])

  useEffect(() => {
    if (!currentSite) {
      return
    }

    setBrowserMode(isIframeBlockedSite(currentSite) || getIframeUrl(currentSite) === null ? 'fallback' : 'iframe')
    setIframeReady(false)
  }, [currentSite])

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) {
        return
      }

      if (Date.now() < allowedSiteGraceUntilRef.current) {
        return
      }

      setTabSwitches((count) => count + 1)
      window.alert('Focus broken 🚨 Stay in the room!')
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }

    const onCopyCut = (event: ClipboardEvent) => {
      event.preventDefault()
    }

    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('copy', onCopyCut)
    document.addEventListener('cut', onCopyCut)

    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('copy', onCopyCut)
      document.removeEventListener('cut', onCopyCut)
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    if (!room) {
      return
    }

    const payload = {
      roomId: room.id,
      allowedSites: room.allowedSites,
      endsAt: room.startTime ? room.startTime.toMillis() + room.duration * 60 * 1000 : null,
    }

    localStorage.setItem(EXTENSION_ALLOWED_SITES_KEY, JSON.stringify(room.allowedSites))

    if (room.isActive) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(payload))
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY)
    }
  }, [room])

  const remainingMs = useMemo(() => {
    if (!room) {
      return 0
    }

    return getSmartRoomRemainingMs(room, nowMs)
  }, [room, nowMs])

  useEffect(() => {
    if (!room || !room.isActive || remainingMs > 0 || completionHandledRef.current) {
      return
    }

    completionHandledRef.current = true

    const complete = async () => {
      try {
        await completeSmartRoomSession(room.id)
      } catch {
        // Completion fallback: keep local completion state even if update fails.
      }

      localStorage.removeItem(ACTIVE_SESSION_KEY)
      window.dispatchEvent(new CustomEvent('focusroom:complete', { detail: { roomId: room.id } }))
      setSessionCompleted(true)
      setStreakCount(updateStreakOnCompletion())
      playCompletionTone()
    }

    void complete()
  }, [room, remainingMs])

  const focusScore = useMemo(() => computeFocusScore(tabSwitches), [tabSwitches])

  const handleGoToSite = (target: string) => {
    if (!room) {
      return
    }

    const normalized = normalizeSiteInput(target)
    if (!normalized || !isAllowedUrl(normalized, room.allowedSites)) {
      setBlockedMessage('Blocked 🚫 Focus Mode Active')
      return
    }

    setBlockedMessage(null)
    setCurrentSite(normalized)
    setSiteInput(normalized)
    setIframeReady(false)

    setBrowserMode(isIframeBlockedSite(normalized) || getIframeUrl(normalized) === null ? 'fallback' : 'iframe')
    allowedSiteGraceUntilRef.current = Date.now() + ALLOWED_SITE_GRACE_MS
  }

  const openAllowedSiteExternally = (target: string) => {
    if (!room) {
      return
    }

    const normalized = normalizeSiteInput(target)
    if (!normalized || !isAllowedUrl(normalized, room.allowedSites)) {
      setBlockedMessage('Blocked 🚫 Focus Mode Active')
      return
    }

    setBlockedMessage(null)
    setCurrentSite(normalized)
    setSiteInput(normalized)
    setIframeReady(false)
    setBrowserMode(isIframeBlockedSite(normalized) || getIframeUrl(normalized) === null ? 'fallback' : 'iframe')

    // Allow legitimate switches to this allowed external tab without penalizing focus score.
    allowedSiteGraceUntilRef.current = Date.now() + ALLOWED_SITE_GRACE_MS
    window.open(normalized, '_blank', 'noopener,noreferrer')
  }

  const handleOpenAllowedSite = () => {
    if (!currentSite || !room) {
      return
    }

    openAllowedSiteExternally(currentSite)
  }

  const iframeUrl = useMemo(() => getIframeUrl(currentSite), [currentSite])

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      setBlockedMessage('Fullscreen is not available in this browser context.')
    }
  }

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!id || !user) {
      setMessageError('Please login to send a message.')
      return
    }

    if (!messageText.trim()) {
      return
    }

    setMessageSending(true)
    setMessageError(null)
    try {
      await sendRoomMessage(id, messageText, user)
      setMessageText('')
    } catch (sendError) {
      setMessageError(sendError instanceof Error ? sendError.message : 'Unable to send message.')
    } finally {
      setMessageSending(false)
    }
  }

  const handlePickFile = () => {
    if (!fileSharing) {
      fileInputRef.current?.click()
    }
  }

  const handleShareFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    event.target.value = ''

    if (!selectedFile) {
      return
    }

    if (!id || !user) {
      setMessageError('Please login to share a file.')
      return
    }

    setFileSharing(true)
    setMessageError(null)
    try {
      await shareRoomFile(id, selectedFile, user)
    } catch (shareError) {
      setMessageError(shareError instanceof Error ? shareError.message : 'Unable to share file.')
    } finally {
      setFileSharing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <p>Preparing Focus Mode...</p>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 text-[var(--text)]">
        <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 text-center backdrop-blur-2xl shadow-[var(--card-shadow)]">
          <h1 className="text-2xl font-semibold">Unable to open focus room</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{error ?? 'Room does not exist.'}</p>
          <button
            type="button"
            onClick={() => navigate('/smart-room')}
            className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2 text-sm text-[var(--text)]"
          >
            Back to Smart Rooms
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-70" />

      <main className="relative z-10 grid min-h-screen gap-4 p-4 lg:grid-cols-[320px_1fr]">
        <motion.aside
          initial={{ x: -22, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 backdrop-blur-2xl shadow-[var(--card-shadow)]"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Smart Focus Room</p>
          <h1 className="mt-2 text-2xl font-semibold">{room.title}</h1>

          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-4">
            <p className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
              <Timer className="h-4 w-4" />
              Remaining
            </p>
            <p className="mt-2 text-5xl font-semibold tabular-nums">{formatRemaining(remainingMs)}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 text-sm text-[var(--muted)]">
            <p>Focus score: <span className="font-semibold">{focusScore}</span></p>
            <p className="mt-1">Tab switches: {tabSwitches}</p>
            <p className="mt-1">Streak: {streakCount} day{streakCount === 1 ? '' : 's'}</p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-[var(--text)]">Allowed sites</p>
            <ul className="mt-2 space-y-2">
              {room.allowedSites.map((site) => (
                <li key={site}>
                  <button
                    type="button"
                    onClick={() => handleGoToSite(site)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                      currentSite === site
                        ? 'border-[var(--text)] bg-[var(--bg-elev)] text-[var(--text)]'
                        : 'border-[var(--border)] bg-[var(--bg-elev)] text-[var(--muted)] hover:brightness-105'
                    }`}
                  >
                    {site}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Navigate (allowed only)</label>
            <input
              value={siteInput}
              onChange={(event) => setSiteInput(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--text)]"
              placeholder="https://www.khanacademy.org"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGoToSite(siteInput)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm text-[var(--text)] transition hover:brightness-105"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => openAllowedSiteExternally(siteInput)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] transition hover:brightness-105"
              >
                Open Tab
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm text-[var(--text)] transition hover:brightness-105"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/smart-room')}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm text-[var(--text)] transition hover:brightness-105"
            >
              Back to Dashboard
            </button>
          </div>

          <p className="mt-4 inline-flex items-start gap-2 text-xs text-[var(--muted)]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            For full browser blocking, install Focus Extension.
          </p>
        </motion.aside>

        <motion.section
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 backdrop-blur-2xl shadow-[var(--card-shadow)]"
        >
          <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr] xl:items-start">
            <div>
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-3">
                <p className="text-sm text-[var(--muted)]">Distraction-free browser view</p>
                <button
                  type="button"
                  onClick={handleOpenAllowedSite}
                  className="inline-flex items-center gap-1 text-xs text-[var(--text)] hover:opacity-80"
                >
                  Open in new tab
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="relative h-[58vh] min-h-[360px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)]">
                {currentSite && browserMode === 'iframe' && iframeUrl ? (
                  <iframe
                    title="focus-room-browser"
                    src={iframeUrl}
                    className="h-full w-full"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    onLoad={() => setIframeReady(true)}
                  />
                ) : currentSite ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-sm text-[var(--muted)]">
                    <div className="max-w-md space-y-2">
                      <p className="text-base font-medium text-[var(--text)]">This site is better in a dedicated tab.</p>
                      <p>
                        Open it in a new tab for a clean experience. Allowed-site tab switches are ignored for this session.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAllowedSite}
                      className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--text)] transition hover:brightness-105"
                    >
                      Open allowed site in new tab
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrowserMode('iframe')}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2 text-sm text-[var(--text)] transition hover:brightness-105"
                    >
                      Try iframe again
                    </button>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                    Select an allowed site to begin.
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between px-1 text-xs text-[var(--muted)]">
                <span>{iframeReady || browserMode === 'fallback' ? 'Site ready' : 'Loading site preview...'}</span>
                <button type="button" onClick={handleOpenAllowedSite} className="hover:text-[var(--text)]">
                  Open current site externally
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 xl:sticky xl:top-4">
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <Users className="h-4 w-4" />
                Room Chat • {members.length} member{members.length === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-[var(--muted)]">Chat and file sharing stay inside this room.</p>
            </div>

            {messagesLoading ? <p className="mt-3 text-xs text-[var(--muted)]">Loading messages...</p> : null}
            {messagesError ? <p className="mt-3 text-xs text-[var(--muted)]">{messagesError}</p> : null}

            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5 text-left">
              {!messagesLoading && messages.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">No messages yet. Start the conversation.</p>
              ) : (
                messages.map((message) => {
                  const own = user?.uid === message.senderId
                  return (
                    <article
                      key={message.id}
                      className={`rounded-lg border px-2.5 py-2 text-sm ${
                        own
                          ? 'ml-8 border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text)]'
                          : 'mr-8 border-[var(--border)] bg-[var(--card)] text-[var(--text)]'
                      }`}
                    >
                      <p className="text-xs text-[var(--muted)]">{own ? 'You' : message.senderName}</p>
                      {message.messageType === 'file' && message.fileUrl ? (
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-[var(--muted)]">Shared a file</p>
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--text)] hover:opacity-90"
                          >
                            {message.fileName ?? 'Download file'}
                          </a>
                        </div>
                      ) : (
                        <p className="mt-0.5">{message.text}</p>
                      )}
                    </article>
                  )
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Type a message"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--text)]"
              />
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleShareFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={handlePickFile}
                disabled={fileSharing}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] transition-opacity hover:opacity-90 disabled:opacity-70"
              >
                <FileUp className="h-4 w-4" />
                {fileSharing ? 'Sharing' : 'File'}
              </button>
              <button
                type="submit"
                disabled={messageSending}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text)] transition-opacity hover:opacity-90 disabled:opacity-70"
              >
                <Send className="h-4 w-4" />
                {messageSending ? 'Sending' : 'Send'}
              </button>
            </form>

            {messageError ? <p className="mt-2 text-xs text-[var(--muted)]">{messageError}</p> : null}
            </div>
          </div>
        </motion.section>
      </main>

      <AnimatePresence>
        {blockedMessage ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text)] backdrop-blur-xl shadow-[var(--card-shadow)]"
          >
            <p className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {blockedMessage}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {sessionCompleted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card)] p-7 text-center text-[var(--text)] backdrop-blur-2xl shadow-[var(--card-shadow)]"
            >
              <h2 className="text-3xl font-semibold">Session Completed 🎉</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">Your focus score: {focusScore} • Current streak: {streakCount}</p>
              <button
                type="button"
                onClick={() => navigate('/smart-room')}
                className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2 text-sm text-[var(--text)]"
              >
                Return to Smart Rooms
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
