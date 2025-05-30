import { useEffect, useState, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import * as Keychain from "react-native-keychain"
import Config from "react-native-config"

const SOCKET_URL = Config.SOCKET_MEETING_ACCESS_URL

const getToken = async () => {
  const credentials = await Keychain.getGenericPassword({
    service: "accessToken",
  })
  return credentials ? credentials.password : ""
}

export const useMeetingAccessSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const isShouldSocketConnect = useRef(true);

  const getAndSetToken = useCallback(async () => {
    const newToken = await getToken()
    if (newToken !== token) {
      setToken(newToken)
    }
  }, [token])

  const connectWithRetry = useCallback(async (token: string, attempts: number) => {
    return new Promise<Socket | null>((resolve, reject) => {
      socketRef.current = io(SOCKET_URL, {
        query: { token },
      })
  
      let attemptsLeft = attempts
  
      const attemptReconnect = () => {
        if(!isShouldSocketConnect.current) return
        if (socketRef.current?.connected) {
          console.log("Meeting Access Socket connected:", socketRef.current?.id)
          resolve(socketRef.current)
        } else if (attemptsLeft > 0) {
          attemptsLeft--
          console.log(
            `Reconnection attempt failed. Retrying in 2 seconds... (${attemptsLeft} attempts left)`
          )
          if(!attemptsLeft){
            socketRef.current?.off();
            socketRef.current?.close();
            socketRef.current?.disconnect();
          } else {
            setTimeout(attemptReconnect, 2000)
          }
        } else {
          reject(
            new Error("Unable to reconnect to the socket after 3 attempts")
          )
        }
      }
      socketRef.current.on("connect", attemptReconnect)
      socketRef.current.on("connect_error", (error: any) => {
        console.error("Use Meeting Access Socket connection error:", error.message)
        if(!!attemptsLeft){
          attemptReconnect()
        }
      })
    })
  }, [])

  useEffect(() => {
    const connectSocket = async () => {
      if (token) {
        try {
          isShouldSocketConnect.current = true
          const newSocket = await connectWithRetry(token, 3)
          if (newSocket) {
            setSocketInstance(newSocket)
          }
        } catch (error) {
          console.error("Reconnection failed:", error)
        }
      }
    }

    getAndSetToken()
    connectSocket()

    return () => {
      if (socketInstance) {
        socketInstance.off()
        socketInstance.close()
        socketInstance.disconnect()
        setSocketInstance(null)
        isShouldSocketConnect.current = false
      }
    }
  }, [token, getAndSetToken, connectWithRetry])

  return socketRef.current
}
