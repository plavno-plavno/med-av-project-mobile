import { io, Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';
import * as Keychain from "react-native-keychain"
import Config from "react-native-config"

const socketURL = Config.SOCKET_WEB_RTC_URL

let socket: Socket | null = null;
let setErrorState: ((error: string | null) => void) | null = null;

const getToken = async () => {
  const credentials = await Keychain.getGenericPassword({
    service: "accessToken",
  })
  
  if (credentials) {
    return credentials?.password
  }
  return ""
}

export const initializeSocket = async () => {
  if (!socket) {
    const token = await getToken();
    socket = io(socketURL, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('WebRTC Socket connected:', socket?.id);
      setErrorState?.(null);
    });

    socket.on('disconnect', (reason) => {
      console.warn('WebRTC Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('WebRTC Socket connection error:', error.message);
      setErrorState?.(error.message);
    });

    socket.on('error', (error) => {
      console.error('WebRTC Socket error:', error);
      setErrorState?.(error.message);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket() first.');
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const useWebRtcSocketConnection = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setErrorState = setError;

    return () => {
      setErrorState = null;
    };
  }, []);

  return {
    error,
    socket: getSocket(),
  };
};
