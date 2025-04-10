import { io, Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';
import * as Keychain from "react-native-keychain";
import Config from "react-native-config";
import { navigationRef } from 'src/navigation/RootNavigation';

const socketURL = Config.SOCKET_WEB_RTC_URL;
const isProduction = Config.ENV === 'production'

let socket: Socket | null = null;
let setErrorState: ((error: string | null) => void) | null = null;
let retryCount = 0;
const MAX_RETRIES = 3;
let scalerSocketURL = ''

const getToken = async () => {
  const credentials = await Keychain.getGenericPassword({
    service: "accessToken",
  });

  return credentials ? credentials.password : "";
};

export const initializeSocket = async (url: string) => {
  if (socket) return socket;
  scalerSocketURL = isProduction ? url : String(socketURL)
  const token = await getToken();
  socket = io(scalerSocketURL, {
    transports: ['websocket'],
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('WebRTC Socket connected:', socket?.id);
    setErrorState?.(null);
    retryCount = 0;
  });

  socket.on('disconnect', (reason) => {
    console.warn('WebRTC Socket disconnected:', reason);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Reconnecting attempt ${retryCount}/${MAX_RETRIES}...`);
      setTimeout(() => initializeSocket(scalerSocketURL), 2000 * retryCount);
    } else {
      console.error("Max reconnect attempts reached. Not retrying.");
      navigationRef.current?.goBack?.()
      setErrorState?.("Connection lost. Unable to reconnect.");
    }
  });

  socket.on('connect_error', (error) => {
    console.error('WebRTC Socket connection error:', error.message);
    setErrorState?.(error.message);
    handleReconnect();
  });

  socket.on('error', (error) => {
    console.error('WebRTC Socket error:', error);
    setErrorState?.(error.message);
  });

  return socket;
};

const handleReconnect = () => {
  if (retryCount < MAX_RETRIES) {
    retryCount++;
    console.log(`Reconnecting attempt ${retryCount}/${MAX_RETRIES}...`);
    setTimeout(() => initializeSocket(scalerSocketURL), 2000 * retryCount);
  } else {
    console.error("Max reconnect attempts reached. Not retrying.");
    setErrorState?.("Connection lost. Unable to reconnect.");
  }
};

export const getSocket = (): Socket | null => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket() first.');
    return null;
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    retryCount = 0;
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
