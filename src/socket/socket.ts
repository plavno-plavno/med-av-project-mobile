import { useFocusEffect } from "@react-navigation/native"
import { useEffect, useState, useRef, useCallback } from "react"
import * as Keychain from "react-native-keychain"
import { io, Socket } from "socket.io-client"
import Config from "react-native-config"

const socketSupportUrl = Config.SOCKET_SUPPORT_URL

const useWebSocket = (refetch: () => void) => {
  const [token, setToken] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const getToken = async () => {
    const credentials = await Keychain.getGenericPassword({
      service: "accessToken",
    })
    if (credentials) {
      setToken(credentials.password)
    }
  }

  const connectWebSocket = () => {
    if (!token) return

    if (socketRef.current) {
      socketRef.current.off()
      socketRef.current.close();
      socketRef.current.disconnect()
    }

    socketRef.current = io(socketSupportUrl, {
      query: { token },
    })

    const socket = socketRef.current

    socket.on("connect", () => {
      console.log("WebSocket connected")
    })

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected")
    })

     socket.on("error", () => {
      console.log("WebSocket error")
    })

         socket.on("connect_error", () => {
      console.log("WebSocket connect_error")
    })

    socket.on("newMessage", () => {
      console.log("NEW MESSAGE")
      refetch()
    })
  }

  useEffect(() => {
    getToken()
  }, [])

  useEffect(() => {
    connectWebSocket()
    return () => {
      socketRef.current?.disconnect()
    }
  }, [token])

  useFocusEffect(
    useCallback(() => {
      connectWebSocket() // Reconnect when the screen is focused
      return () => socketRef.current?.disconnect() // Cleanup on unfocus
    }, [token])
  )

  return { socket: socketRef.current }
}

export default useWebSocket
