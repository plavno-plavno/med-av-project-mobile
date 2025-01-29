import { useEffect, useState, useRef } from "react"
import * as Keychain from "react-native-keychain"
import { io, Socket } from "socket.io-client"

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

  useEffect(() => {
    getToken()
  }, [])

  useEffect(() => {
    if (!token) return

    socketRef.current = io(
      "https://khutba-media-server.plavno.io:7000/support",
      {
        query: { token }, // Передаємо токен у query
        auth: { token },
        extraHeaders: { Authorization: `Bearer ${token}` }, // А також у заголовках
      }
    )

    const socket = socketRef.current

    console.log("🔌 Connected to WebSocket:", socket)

    socket.onAny((event, ...args) => {
      console.log(`📡 Event received: ${event}`, args)
    })

    socket.on("newMessage", (chatId) => {
      console.log("📩 New message in chat:", chatId)
      refetch()
    })

    socket.on("readAllMessages", (isRead) => {
      console.log("✅ All messages read:", isRead)
      if (isRead) {
        // Тут можна оновити стан, щоб сховати значок непрочитаних повідомлень
      }
    })

    socket.on("newRequest", (isNewRequest) => {
      console.log("🆕 New chat request:", isNewRequest)
      if (isNewRequest) {
        // Тут можна оновити індикатор нових запитів
      }
    })

    return () => {
      console.log("🔌 Disconnecting from WebSocket")
      socket.disconnect()
    }
  }, [token])

  return { socket: socketRef.current }
}

export default useWebSocket
