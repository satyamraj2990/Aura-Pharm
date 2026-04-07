import { FirebaseError } from 'firebase/app'
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'

import { db } from '../lib/firebase'

export type SmartRoom = {
  id: string
  userId: string
  title: string
  allowedSites: string[]
  duration: number
  isActive: boolean
  startTime: Timestamp | null
  createdAt: Timestamp | null
}

export type CreateSmartRoomInput = {
  userId: string
  title: string
  allowedSites: string[]
  duration: number
}

const toSafeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => String(entry).trim())
    .filter(Boolean)
}

const mapSmartRoom = (id: string, data: DocumentData): SmartRoom => ({
  id,
  userId: String(data.userId ?? ''),
  title: String(data.title ?? 'Untitled Focus Room'),
  allowedSites: toSafeStringArray(data.allowedSites),
  duration: Number(data.duration ?? 25),
  isActive: Boolean(data.isActive ?? false),
  startTime: (data.startTime as Timestamp | undefined) ?? null,
  createdAt: (data.createdAt as Timestamp | undefined) ?? null,
})

const handleFirestoreError = (error: unknown, fallback: string): never => {
  if (error instanceof FirebaseError) {
    throw new Error(`${fallback} (${error.code})`)
  }

  if (error instanceof Error) {
    throw error
  }

  throw new Error(fallback)
}

export const createSmartRoom = async (input: CreateSmartRoomInput): Promise<string> => {
  try {
    const roomsRef = collection(db, 'rooms')
    const roomDoc = await addDoc(roomsRef, {
      userId: input.userId,
      title: input.title.trim(),
      allowedSites: input.allowedSites,
      duration: Math.max(1, Math.round(input.duration)),
      isActive: false,
      startTime: null,
      createdAt: serverTimestamp(),
    })

    return roomDoc.id
  } catch (error) {
    return handleFirestoreError(error, 'Unable to create smart focus room.')
  }
}

export const listenSharedSmartRooms = (
  onData: (rooms: SmartRoom[]) => void,
  onError?: (message: string) => void,
): Unsubscribe => {
  const roomsRef = collection(db, 'rooms')

  return onSnapshot(
    roomsRef,
    (snapshot) => {
      const nextRooms = snapshot.docs
        .map((roomDoc) => mapSmartRoom(roomDoc.id, roomDoc.data()))
        .filter((room) => room.isActive || room.allowedSites.length > 0)
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis() ?? 0
          const bTime = b.createdAt?.toMillis() ?? 0
          return bTime - aTime
        })

      onData(nextRooms)
    },
    (error) => {
      if (onError) {
        onError(error instanceof FirebaseError ? `Unable to listen to rooms (${error.code})` : 'Unable to listen to rooms.')
      }
    },
  )
}

export const deleteSmartRoom = async (roomId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'rooms', roomId))
  } catch (error) {
    return handleFirestoreError(error, 'Unable to delete smart focus room.')
  }
}

export const startSmartRoomSession = async (roomId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      isActive: true,
      startTime: Timestamp.now(),
    })
  } catch (error) {
    return handleFirestoreError(error, 'Unable to start focus session.')
  }
}

export const completeSmartRoomSession = async (roomId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'rooms', roomId), {
      isActive: false,
    })
  } catch (error) {
    return handleFirestoreError(error, 'Unable to complete focus session.')
  }
}

export const listenUserSmartRooms = (
  userId: string,
  onData: (rooms: SmartRoom[]) => void,
  onError?: (message: string) => void,
): Unsubscribe => {
  const roomsRef = collection(db, 'rooms')
  const roomsQuery = query(roomsRef, where('userId', '==', userId))

  return onSnapshot(
    roomsQuery,
    (snapshot) => {
      const nextRooms = snapshot.docs
        .map((roomDoc) => mapSmartRoom(roomDoc.id, roomDoc.data()))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis() ?? 0
          const bTime = b.createdAt?.toMillis() ?? 0
          return bTime - aTime
        })

      onData(nextRooms)
    },
    (error) => {
      if (onError) {
        onError(error instanceof FirebaseError ? `Unable to listen to smart rooms (${error.code})` : 'Unable to listen to smart rooms.')
      }
    },
  )
}

export const listenSmartRoomById = (
  roomId: string,
  onData: (room: SmartRoom | null) => void,
  onError?: (message: string) => void,
): Unsubscribe => onSnapshot(
  doc(db, 'rooms', roomId),
  (snapshot) => {
    if (!snapshot.exists()) {
      onData(null)
      return
    }

    onData(mapSmartRoom(snapshot.id, snapshot.data()))
  },
  (error) => {
    if (onError) {
      onError(error instanceof FirebaseError ? `Unable to listen to room (${error.code})` : 'Unable to listen to room.')
    }
  },
)

const getSessionEndsAt = (room: SmartRoom): number | null => {
  if (!room.startTime) {
    return null
  }

  return room.startTime.toMillis() + room.duration * 60 * 1000
}

export const getSmartRoomRemainingMs = (room: SmartRoom, nowMs: number = Date.now()): number => {
  const endsAt = getSessionEndsAt(room)
  if (!endsAt) {
    return room.duration * 60 * 1000
  }

  return Math.max(0, endsAt - nowMs)
}

export const getSmartRoomStatus = (room: SmartRoom): 'active' | 'completed' | 'pending' => {
  if (room.isActive && getSmartRoomRemainingMs(room) > 0) {
    return 'active'
  }

  if (room.startTime) {
    return 'completed'
  }

  return 'pending'
}
