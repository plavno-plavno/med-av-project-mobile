import { useEffect, useState } from 'react';
import { useAppDispatch } from '../hooks/redux';
import { useGetMessageCountQuery } from 'src/api/helpCenterApi/helpCenterApi';
import * as Keychain from "react-native-keychain"
import { io } from 'socket.io-client';

const useWebSocket = () => {
  const dispatch = useAppDispatch();

  const { data, refetch } = useGetMessageCountQuery()
  const [token, setToken] = useState('');

  const getToken = async () => {
    const credentials = await Keychain.getGenericPassword({
      service: "accessToken",
    })
    if (credentials) {
      setToken(credentials.password);
    }
    return ""
  }

  useEffect(() => {
    getToken()
  }, [])

  useEffect(() => {
    if (token) {
      const createSocketConnection = () => {
        const socket = io("https://khutba-media-server.plavno.io:7000/", {
          auth: { token },
        })
        socket.onAny((eventName: any, args: any) => {
          console.log(`new message : ${eventName} !!!!`, args)
        })
        socket.on("support", (event) => {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);
          if (message.event === 'newMessage') {
            console.log('New chat instance:', message);
            // dispatch(setNewMessagesCount({ chat_id: message?.chat_id, count: message?.count }));
            
            } if (message.readAllMessages) {
              // dispatch(setNewMessagesCount({}));
            }
        })
      };

      // Initial WebSocket connection
      createSocketConnection();
    }
  }, [token]);
};

export default useWebSocket;
