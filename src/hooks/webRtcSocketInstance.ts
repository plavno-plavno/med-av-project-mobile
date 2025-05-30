import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Keychain from 'react-native-keychain';
import Config from 'react-native-config';
import { navigationRef } from 'src/navigation/RootNavigation';
import Toast from 'react-native-toast-message';
import { useScalerFindFreeMachineMutation } from 'src/api/scalerApi/scalerApi';

const socketURL = Config.SOCKET_WEB_RTC_URL;
const isProduction = Config.ENV === 'production';

const MAX_RETRIES = 3;

const getToken = async () => {
  const credentials = await Keychain.getGenericPassword({
    service: 'accessToken',
  });
  return credentials ? credentials.password : '';
};

export const useWebRtcSocketConnection = (roomId: string, isSttSocketConnected: boolean) => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const scalerMachineUrl = useRef('');
  const [error, setError] = useState<string | null>(null);
  const retryCount = useRef(0);
  const [scalerFindFreeMachine] = useScalerFindFreeMachineMutation();

  const connectSocket = useCallback(async (url: string, token: string, attempts: number) => {
    return new Promise<Socket | null>((resolve, reject) => {
      const socket = io(url, {
        transports: ['websocket'],
        auth: { token },
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      socket.on('connect', () => {
        console.log('WebRTC Socket connected:', socket.id);
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        console.error('WebRTC Socket connection error:', error.message, error.stack);
        setError(error.message);
        if (attempts > 0) {
          if (retryCount.current <= MAX_RETRIES) {
            retryCount.current++;
            console.log(`Reconnecting attempt ${retryCount.current}/${MAX_RETRIES}...`);
            setTimeout(() => connectSocket(url, token, attempts - 1), 2000);
          }
        } else {
          console.error('Max reconnect attempts reached. Not retrying.');
          navigationRef.current?.goBack();
          Toast.show({
            type: 'error',
            text1: 'Connection to media servers cannot be established, please consider rejoining',
          });
          socket.close();
          socket.disconnect();
          reject(new Error('Unable to reconnect to socket after 3 attempts.'));
        }
      });

      socket.on('error', (error) => {
        navigationRef.current?.goBack();
        Toast.show({
          type: 'error',
          text1: 'Connection to media servers cannot be established, please consider rejoining',
        });
        console.error('WebRTC Socket error:', error.message);
        setError(error.message);
      });


      socket.on('disconnect', (reason) => {
        console.warn('WebRTC Socket disconnected:', reason);
      });
    });
  }, []);

  useEffect(() => {
    const initializeSocket = async () => {
      const token = await getToken();

      if (token && roomId) {
        try {
          const scalerFindFreeMachineData = await scalerFindFreeMachine({
            id: roomId,
          }).unwrap();
          scalerMachineUrl.current = scalerFindFreeMachineData?.ip
          const rtcUrl = `https://${scalerFindFreeMachineData?.ip}${scalerFindFreeMachineData?.port ? `:${scalerFindFreeMachineData?.port}` : ':5000'
            }`;

          const newSocket = await connectSocket(rtcUrl, token, MAX_RETRIES);
          setSocketInstance(newSocket);
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }
    };
    
    if (roomId && isSttSocketConnected) {
        initializeSocket();
    }

    return () => {
      if (socketInstance) {
        socketInstance.off();
        socketInstance.disconnect();
        socketInstance.close();
        setSocketInstance(null);
      }
    };
  }, [roomId, isSttSocketConnected]);

  return {
    error,
    socket: socketInstance,
    scalerMachineUrl: scalerMachineUrl.current,
  };
};
