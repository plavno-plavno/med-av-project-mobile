import { useEffect, useRef, useCallback, useState } from "react"
import { getMeetingAccessSocket } from "./meetingAccessSocketInstance"

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

export type JoinRequestCallback = (data: RequestJoinEventPayload) => void
export type RequestRespondedCallback = (data: RespondJoinRequestPayload) => void
export type JoinResponseCallback = (data: { success: boolean }) => void

export const useMeetingAccess = () => {
  const socketRef = useRef(getMeetingAccessSocket())
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false)
  console.log("\x1b[31m%s\x1b[0m", "socketRef", socketRef)
  const joinEvent = useCallback((payload: JoinEventPayload) => {
    socketRef.current?.emit("joinEvent", payload)
    console.log("\x1b[31m%s\x1b[0m", "joinEvent", payload)
  }, [])

  const requestJoinEvent = useCallback((payload: RequestJoinEventPayload) => {
    socketRef.current?.emit("requestJoinEvent", payload)
    console.log("\x1b[31m%s\x1b[0m", "requestJoinEvent", payload)
  }, [])

  const respondJoinRequest = useCallback(
    (payload: RespondJoinRequestPayload) => {
      socketRef.current?.emit("respondJoinRequest", payload)
      console.log("\x1b[31m%s\x1b[0m", "respondJoinRequest", payload)
    },
    []
  )

  const handleJoinRequest = useCallback((data: RequestJoinEventPayload) => {
    setIsRequestModalOpen(true)
  }, [])

  const handleRequestResponded = useCallback(
    (data: RespondJoinRequestPayload) => {},
    []
  )

  const handleJoinResponse = useCallback((data: { success: boolean }) => {}, [])

  useEffect(() => {
    const socket = socketRef.current

    if (!socket) {
      return
    }

    socket.on("joinRequest", handleJoinRequest)
    socket.on("requestResponded", handleRequestResponded)
    socket.on("joinResponse", handleJoinResponse)

    return () => {
      socket.off("joinRequest", handleJoinRequest)
      socket.off("requestResponded", handleRequestResponded)
      socket.off("joinResponse", handleJoinResponse)
    }
  }, [handleJoinRequest, handleRequestResponded, handleJoinResponse, socketRef])

  return {
    joinEvent,
    requestJoinEvent,
    respondJoinRequest,
    isRequestModalOpen,
  }
}
export { getMeetingAccessSocket }
