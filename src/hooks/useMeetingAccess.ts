import { useEffect, useRef, useCallback, useState } from "react"
import { useMeetingAccessSocket } from "./useMeetingAccessSocket"
import {
  useAuthMeQuery,
  useGetUsersByIdMutation,
} from "src/api/userApi/userApi"
import { useGetRequestsByEventIdMutation } from "src/api/calendarApi/calendarApi"

export const useMeetingAccess = ({
  setInvitedParticipants,
  setMeInvited,
  invitedParticipants,
  eventId,
}: any) => {
  const socketInstance = useMeetingAccessSocket()
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [newUser, setNewUser] = useState<any | null>(null)
  const [isRequestingJoin, setIsRequestingJoin] = useState(false)

  const pendingRequests = useRef<any[]>([])
  const invitedParticipantsRef = useRef(invitedParticipants)

  const { data: authMeData } = useAuthMeQuery()
  const [getRequestsByEventId] = useGetRequestsByEventIdMutation()
  const [getUsersById] = useGetUsersByIdMutation()

  const userRefId = useRef(authMeData?.id)
  useEffect(() => {
    userRefId.current = authMeData?.id
  }, [authMeData])

  useEffect(() => {
    invitedParticipantsRef.current = invitedParticipants
  }, [invitedParticipants])

  // 🧩 Init socket listeners
  useEffect(() => {
    if (!socketInstance) return

    const handleConnect = () => {
      console.log("[Socket] Connected")
      setIsSocketConnected(true)
      if (eventId) joinEvent({ eventId })
    }

    const handleDisconnect = () => {
      console.log("[Socket] Disconnected")
      setIsSocketConnected(false)
    }

    const handleJoinRequest = async ({
      userId,
      socketId,
    }: {
      userId: string
      socketId: string
    }) => {
      console.log("[Socket] joinRequest", { userId, socketId })
      await handleNewJoinRequest(userId, socketId)
    }

    const handleRequestResponded = () => {
      console.log("[Socket] requestResponded")
      closeRequestModalAndProceed()
    }

    const handleJoinResponse = async ({ accepted }: { accepted: boolean }) => {
      console.log("[Socket] joinResponse", accepted)
      if (accepted) {
        const user = await getUsersById({
          id: Number(userRefId.current),
        }).unwrap()
        setInvitedParticipants([...invitedParticipantsRef.current, user.user])
        setMeInvited(true)
      }
      setIsRequestingJoin(false)
    }

    const handleOnAny = (eventName: string) => {
      console.log(`[Socket] Incoming event: ${eventName}`)
    }

    socketInstance.on("connect", handleConnect)
    socketInstance.on("disconnect", handleDisconnect)
    socketInstance.on("joinRequest", handleJoinRequest)
    socketInstance.on("requestResponded", handleRequestResponded)
    socketInstance.on("joinResponse", handleJoinResponse)
    socketInstance.onAny(handleOnAny)

    return () => {
      socketInstance.off("connect", handleConnect)
      socketInstance.off("disconnect", handleDisconnect)
      socketInstance.off("joinRequest", handleJoinRequest)
      socketInstance.off("requestResponded", handleRequestResponded)
      socketInstance.off("joinResponse", handleJoinResponse)
      socketInstance.offAny(handleOnAny)
    }
  }, [socketInstance, eventId])

  // 🔄 Fetch pending requests on init
  useEffect(() => {
    if (!eventId) return
    fetchPendingRequests(eventId)
  }, [eventId])

  const fetchPendingRequests = async (eventId: string) => {
    try {
      const requests = await getRequestsByEventId({ eventId }).unwrap()
      if (requests.length) {
        console.log("[MeetingAccess] Pending requests:", requests)
        for (const req of requests) {
          await handleNewJoinRequest(String(req.createdBy.id), req.socketId)
        }
      }
    } catch (error) {
      console.error("[MeetingAccess] Error fetching pending requests:", error)
    }
  }

  const handleNewJoinRequest = async (userId: string, socketId: string) => {
    if (!userId) {
      console.error("User ID is required")
      return
    }

    // Check if the user already exists in the invited participants
    const existingUser = invitedParticipantsRef.current.find(
      ({ id }: any) => String(id) === userId
    )

    let newUserRequest: any

    try {
      // If user does not exist, fetch user details
      if (!existingUser) {
        const { user } = await getUsersById({ id: Number(userId) }).unwrap()
        newUserRequest = { ...user, socketId }
        setInvitedParticipants((prevParticipants: any) => [
          ...prevParticipants,
          newUserRequest,
        ])
      } else {
        // If the user already exists, just update their socket ID
        newUserRequest = { ...existingUser, socketId }
      }

      // Push the new or updated user to the pending requests queue
      pendingRequests.current.push(newUserRequest)

      // Show the request modal if it's not already open
      if (!isRequestModalOpen) {
        showNextRequest()
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error)
    }
  }

  const showNextRequest = () => {
    // Retrieve the next user from the pending requests list
    const nextUser = pendingRequests.current.shift()
    if (nextUser) {
      setNewUser(nextUser) // Update the new user state
      setIsRequestModalOpen(true) // Open the request modal
    }
  }

  const closeRequestModalAndProceed = () => {
    setIsRequestModalOpen(false)
    setNewUser(null)
    setTimeout(showNextRequest, 300)
  }

  // 🔌 Public API methods
  const joinEvent = (payload: any) => {
    console.log("[MeetingAccess] joinEvent", payload)
    socketInstance?.emit("joinEvent", payload)
  }

  const requestJoinEvent = (payload: any) => {
    console.log("[MeetingAccess] requestJoinEvent", payload)
    socketInstance?.emit("requestJoinEvent", payload)
    setIsRequestingJoin(true)
  }

  const respondJoinRequest = (payload: any) => {
    console.log("[MeetingAccess] respondJoinRequest", payload)
    socketInstance?.emit("respondJoinRequest", payload)
  }

  return {
    joinEvent,
    requestJoinEvent,
    respondJoinRequest,
    isRequestModalOpen,
    setIsRequestModalOpen,
    newUser,
    isRequestingJoin,
    isSocketConnected,
    socketInstance, // якщо потрібно буде для зовнішніх useEffect
  }
}
