import { useEffect, useRef, useCallback, useState } from "react"
import {
  connectAccessMeetingSocket,
  getMeetingAccessSocket,
} from "./meetingAccessSocketInstance"
import { Socket } from "socket.io-client"

export interface JoinEventPayload {
  eventId: string
}

export interface RequestJoinEventPayload {
  eventId: string
  userId: string
}

export interface RespondJoinRequestPayload {
  eventId: string
  socketId: string
  userId: string
  accepted: boolean
}

export const useMeetingAccess = () => {
  const socketRef = useRef<Socket | null>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false)

  // ------------------- EMIT -------------------
  const joinEvent = useCallback((payload: JoinEventPayload) => {
    socketRef.current?.emit("joinEvent", payload)
    console.log("\x1b[36m[emit] joinEvent:\x1b[0m", payload)
  }, [])

  const requestJoinEvent = useCallback((payload: RequestJoinEventPayload) => {
    socketRef.current?.emit("requestJoinEvent", payload)
    console.log("\x1b[36m[emit] requestJoinEvent:\x1b[0m", payload)
  }, [])

  const respondJoinRequest = useCallback(
    (payload: RespondJoinRequestPayload) => {
      socketRef.current?.emit("respondJoinRequest", payload)
      console.log("\x1b[36m[emit] respondJoinRequest:\x1b[0m", payload)
    },
    []
  )

  // ------------------- LISTEN -------------------
  const handleJoinRequest = useCallback((data: RequestJoinEventPayload) => {
    console.log("\x1b[32m[on] joinRequest:\x1b[0m", data)
    setIsRequestModalOpen(true)
  }, [])

  const handleRequestResponded = useCallback(
    (data: RespondJoinRequestPayload) => {
      console.log("\x1b[32m[on] requestResponded:\x1b[0m", data)
      // todo: обробка відповіді
    },
    []
  )

  const handleJoinResponse = useCallback((data: { success: boolean }) => {
    console.log("\x1b[32m[on] joinResponse:\x1b[0m", data)
    // todo: обробка результату
  }, [])

  // ------------------- INIT SOCKET -------------------
  useEffect(() => {
    const initSocket = async () => {
      const connectedSocket = await connectAccessMeetingSocket()
      if (!connectedSocket) {
        console.warn("⚠️ Could not connect to meeting access socket")
        return
      }

      socketRef.current = connectedSocket

      connectedSocket.onAny(() => {
        console.log("ON ANY SOCKET EVENT")
      })

      connectedSocket.on("connect", () => {
        console.log("\x1b[35m[Socket] Connected:\x1b[0m", connectedSocket.id)
      })

      connectedSocket.onAny((event, ...args) => {
        console.log("\x1b[33m[Socket Event]\x1b[0m", event, args)
      })

      connectedSocket.on("joinRequest", handleJoinRequest)
      connectedSocket.on("requestResponded", handleRequestResponded)
      connectedSocket.on("joinResponse", handleJoinResponse)
    }

    initSocket()

    return () => {
      const socket = socketRef.current
      if (!socket) return

      socket.off("joinRequest", handleJoinRequest)
      socket.off("requestResponded", handleRequestResponded)
      socket.off("joinResponse", handleJoinResponse)
      socket.offAny()
    }
  }, [handleJoinRequest, handleRequestResponded, handleJoinResponse, socketRef])

  return {
    joinEvent,
    requestJoinEvent,
    respondJoinRequest,
    isRequestModalOpen,
    setIsRequestModalOpen,
  }
}
