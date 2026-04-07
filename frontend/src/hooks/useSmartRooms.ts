import { useEffect, useState } from 'react'

import { listenSharedSmartRooms, type SmartRoom } from '../services/smartRooms'

export function useSmartRooms() {
  const [rooms, setRooms] = useState<SmartRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const unsubscribe = listenSharedSmartRooms(
      (nextRooms) => {
        setRooms(nextRooms)
        setLoading(false)
      },
      (message) => {
        setError(message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return { rooms, loading, error }
}
