import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'

import { db } from '../lib/firebase'

export type RoomSession = {
  id: string
  roomId: string
  creatorId: string
  startTime: Timestamp
  endTime: Timestamp | null
  duration: number // in minutes
  isPaused: boolean
  pausedAt: Timestamp | null
  totalPausedTime: number // in seconds
  status: 'active' | 'paused' | 'completed'
  participants: string[] // user IDs
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type RoomSessionInput = {
  roomId: string
  creatorId: string
  duration: number // in minutes
}

const mapRoomSession = (id: string, data: DocumentData): RoomSession => ({
  id,
  roomId: String(data.roomId ?? ''),
  creatorId: String(data.creatorId ?? ''),
  startTime: data.startTime as Timestamp,
  endTime: data.endTime as Timestamp | null,
  duration: Number(data.duration ?? 0),
  isPaused: Boolean(data.isPaused ?? false),
  pausedAt: data.pausedAt as Timestamp | null,
  totalPausedTime: Number(data.totalPausedTime ?? 0),
  status: String(data.status ?? 'active') as 'active' | 'paused' | 'completed',
  participants: Array.isArray(data.participants) ? data.participants.map(String) : [],
  createdAt: data.createdAt as Timestamp,
  updatedAt: data.updatedAt as Timestamp,
})

export const createRoomSession = async (input: RoomSessionInput): Promise<string> => {
  try {
    const now = serverTimestamp()
    const docRef = await addDoc(collection(db, 'roomSessions'), {
      ...input,
      startTime: now,
      endTime: null,
      isPaused: false,
      pausedAt: null,
      totalPausedTime: 0,
      status: 'active',
      participants: [input.creatorId],
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(`Failed to create room session: ${error.message}`)
    }
    throw new Error('Failed to create room session')
  }
}

export const getRoomSession = async (sessionId: string): Promise<RoomSession | null> => {
  try {
    const docRef = doc(db, 'roomSessions', sessionId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return mapRoomSession(docSnap.id, docSnap.data())
    }
    return null
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(`Failed to get room session: ${error.message}`)
    }
    throw new Error('Failed to get room session')
  }
}

export const pauseRoomSession = async (sessionId: string): Promise<void> => {
  try {
    const now = serverTimestamp()
    await updateDoc(doc(db, 'roomSessions', sessionId), {
      isPaused: true,
      pausedAt: now,
      status: 'paused',
      updatedAt: now,
    })
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(`Failed to pause room session: ${error.message}`)
    }
    throw new Error('Failed to pause room session')
  }
}

export const resumeRoomSession = async (sessionId: string, additionalPausedTime: number): Promise<void> => {
  try {
    const now = serverTimestamp()
    await updateDoc(doc(db, 'roomSessions', sessionId), {
      isPaused: false,
      pausedAt: null,
      totalPausedTime: additionalPausedTime,
      status: 'active',
      updatedAt: now,
    })
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(`Failed to resume room session: ${error.message}`)
    }
    throw new Error('Failed to resume room session')
  }
}

export const completeRoomSession = async (sessionId: string): Promise<void> => {
  try {
    const now = serverTimestamp()
    await updateDoc(doc(db, 'roomSessions', sessionId), {
      endTime: now,
      status: 'completed',
      updatedAt: now,
    })
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(`Failed to complete room session: ${error.message}`)
    }
    throw new Error('Failed to complete room session')
  }
}

export const joinRoomSession = async (sessionId: string, userId: string): Promise<void> => {
  try {
    const session = await getRoomSession(sessionId)
    if (!session) {
      throw new Error('Room session not found')
    }

    const participants = [...new Set([...session.participants, userId])]
    await updateDoc(doc(db, 'roomSessions', sessionId), {
      participants,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(`Failed to join room session: ${error.message}`)
    }
    throw new Error('Failed to join room session')
  }
}

export const leaveRoomSession = async (sessionId: string, userId: string): Promise<void> => {
  try {
    const session = await getRoomSession(sessionId)
    if (!session) {
      throw new Error('Room session not found')
    }

    const participants = session.participants.filter(id => id !== userId)
    await updateDoc(doc(db, 'roomSessions', sessionId), {
      participants,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new Error(`Failed to leave room session: ${error.message}`)
    }
    throw new Error('Failed to leave room session')
  }
}

export const subscribeToRoomSession = (
  sessionId: string,
  callback: (session: RoomSession | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const docRef = doc(db, 'roomSessions', sessionId)

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const session = mapRoomSession(docSnap.id, docSnap.data())
        callback(session)
      } else {
        callback(null)
      }
    },
    (error) => {
      if (onError) {
        onError(new Error(`Failed to subscribe to room session: ${error.message}`))
      }
    }
  )

  return unsubscribe
}