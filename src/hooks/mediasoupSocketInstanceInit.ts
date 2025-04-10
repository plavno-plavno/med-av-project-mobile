import { io, Socket } from 'socket.io-client';
import * as Keychain from "react-native-keychain";


let socket: Socket | null = null;

  const getToken = async () => {
    const credentials = await Keychain.getGenericPassword({
      service: "accessToken",
    });

    return credentials ? credentials.password : "";
  };


export const initializeMediasoupSocketInit = async (serverUrl: string) => {
  const token = await getToken();

  if (!token) {
    console.error('❌ Не найден токен для подключения к mediasoup сокету');

    return null;
  }

  if (!serverUrl) {
    console.error('❌ Не передан URL сервера для подключения к mediasoup');

    return null;
  }

  if (!socket) {
    socket = io(`${serverUrl}/mediasoup`, {
      auth: { token },
    });

    socket.on('connect', () => {
      console.warn('🔌 Mediasoup socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('🔌 Mediasoup socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Mediasoup socket connection error:', error.message);
    });

    socket.on('error', ({ message }) => {
      console.error('❌ Mediasoup socket error:', message);
    });
  }

  return socket;
};

export const getMediasoupSocket = (): Socket | null => socket;

export const disconnectMediasoupSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.warn('🔌 Mediasoup socket disconnected manually');
  }
};
