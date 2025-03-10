import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Keychain from "react-native-keychain";
import Config from 'react-native-config';

const SOCKET_URL = Config.SOCKET_MEETING_ACCESS_URL

let socket: Socket | null = null;

const getToken = async () => {
  const credentials = await Keychain.getGenericPassword({
    service: "accessToken",
  });

  return credentials ? credentials.password : "";
};

export const connectAccessMeetingSocket = async () => {
  const token = await getToken();

  if (socket && socket.connected && token === (socket as any).auth?.token) {
    return socket;
  }

  disconnectAccessMeetingSocket();

  const connectWithRetry = (attempts: number) => {
    return new Promise<Socket | null>((resolve, reject) => {
      socket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token },
        reconnection: false,
      });

      let attemptsLeft = attempts;

      const attemptReconnect = () => {
        if (socket?.connected) {
          console.log('Meeting Access Socket connected:', socket?.id);
          resolve(socket);
        } else if (attemptsLeft > 0) {
          attemptsLeft--;
          console.log(`Reconnection attempt failed. Retrying in 2 seconds... (${attemptsLeft} attempts left)`);
          setTimeout(attemptReconnect, 2000);
        } else {
          reject(new Error("Unable to reconnect to the socket after 3 attempts"));
        }
      };

      socket.on('connect', attemptReconnect);
      socket.on('connect_error', (error) => {
        console.error('WebRTC Socket connection error:', error.message);
        attemptReconnect();
      });
    });
  };

  try {
    return await connectWithRetry(3);
  } catch (error) {
    console.error("Reconnection failed:", error);
    return null;
  }
};

export const getMeetingAccessSocket = (): Socket | null => socket;

export const disconnectAccessMeetingSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const useSocket = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const getAndSetToken = async () => {
      const newToken = await getToken();
      if (newToken !== token) {
        setToken(newToken);
        connectAccessMeetingSocket();
      }
    };

    getAndSetToken();

    return () => {
      disconnectAccessMeetingSocket();
    };
  }, [token]);

  return getMeetingAccessSocket();
};
