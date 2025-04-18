import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocket } from './webRtcSocketInstance';
import * as mediasoupClient from 'mediasoup-client';
import { mediaDevices, MediaStream, registerGlobals, RTCPeerConnection } from "react-native-webrtc";
import { useTranslation } from 'react-i18next';
import * as Keychain from "react-native-keychain";

registerGlobals()

export const useMeetingRecording = (roomId: string | null, peerConnection: any) => {
  // const mediaStreamRef = useRef<MediaStream | null>(null);
  // const mainPeerConnectionRef = useRef<RTCPeerConnection | null>();
  // const recordingPeerConnectionRef = useRef<RTCPeerConnection | null>();
  // const recordingStreamRef = useRef<MediaStream | null>(null);
  // const {t} = useTranslation();

  const socketRef = useRef<Socket | null>(null);
  socketRef.current = getSocket();

  const localVideoRef = useRef<any | null>(null);

  // Состояния для socket.io, mediasoup device и транспорта для продюсера
  const [socket, setSocket] = useState<any | null>(null);
  const [device, setDevice] = useState<any | null>(null);
  const [producerTransport, setProducerTransport] = useState<any | null>(null);
  const [producer, setProducer] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const [transportCreated, setTransportCreated] = useState<any | null>(false);
  const [isRecording, setIsRecording] = useState(false);

  const socketRecRef = useRef<any>(null);

  const getToken = async () => {
    const credentials = await Keychain.getGenericPassword({
      service: "accessToken",
    });

    return credentials ? credentials.password : "";
  };

  const init = async () => {
    console.log("Initializing socket...");
    const token = await getToken();
    console.log("Token retrieved:", token);
    socketRecRef.current = io(socketRecRef.current, {
      transports: ['websocket'],
      autoConnect: true,
      auth: { token },
    });
    console.log("Socket initialized:", socketRecRef.current);
  };
  
  useEffect(() => {
    if (!socketRecRef.current) {
        init();
    }
  }, []);

  useEffect(() => {
    if (socketRecRef.current) {
      socketRecRef.current.on("connect", () => {
        console.log("Соединение с сервером установлено");
        setIsConnected(true);
        setError(null);
      });

      socketRecRef.current.on("connect_error", (err: any) => {
        console.error("Ошибка соединения:", err);
        setIsConnected(false);
        setError(`Ошибка соединения: ${err.message}`);
      });

      socketRecRef.current.on("disconnect", (reason: any) => {
        // console.log("Соединение разорвано:", reason);
        setIsConnected(false);
      });

      // После подключения сервер отправляет capabilities маршрутизатора mediasoup
      socketRecRef.current.on("routerRtpCapabilities", async (routerRtpCapabilities: any) => {
        // console.log("Получены routerRtpCapabilities:", routerRtpCapabilities);
        try {
          const deviceTmp = new mediasoupClient.Device();
          await deviceTmp.load({ routerRtpCapabilities });
          setDevice(deviceTmp);
          // console.log("Device загружен успешно");
        } catch (error: any) {
          console.error("Ошибка при загрузке Device:", error);
          setError(`Ошибка при загрузке Device: ${error.message}`);
        }
      });
    }

    // Очистка: отключаем сокет при размонтировании
    // return () => {
    //   if (socketRecRef.current) {
    //     socketRecRef.current.disconnect();
    //     // console.log("Сокет отключен при размонтировании");
    //   }
    // };
  }, [socketRecRef.current]); // пустой массив зависимостей: выполняется один раз

  // После того, как device и socket установлены, подписываемся на событие создания транспорта
  useEffect(() => {
    if (!socketRecRef.current || !device) return;

    // console.log("Настройка обработчика createSendTransport");

    const handleCreateSendTransport = async (transportParams: any) => {
      // console.log("Получены параметры транспорта:", transportParams);
      try {
        const transport = device.createSendTransport(transportParams);
        // console.log("Транспорт создан:", transport.id);

        // При событии «connect» передаём на сервер dtlsParameters для подключения транспорта
        transport.on("connect", ({ dtlsParameters }: any, callback: () => void, errback: any) => {
          // console.log("Событие connect транспорта, отправка dtlsParameters");
          socketRecRef.current.emit("connectTransport", transport.id, dtlsParameters);
          callback();
        });

        // При событии «produce» регистрируем продюсера на сервере
        transport.on("produce", ({ kind, rtpParameters }: any, callback: (arg0: { id: any; }) => void, errback: any) => {
          // console.log(`Событие produce транспорта, kind: ${kind}`);
          socketRecRef.current.emit(
            "registerProducer",
            { transportId: transport.id, kind, rtpParameters },
            (producerId: any) => {
              // console.log("Producer создан на сервере, id:", producerId);
              callback({ id: producerId });
            }
          );
        });

        setProducerTransport(transport);
        setTransportCreated(true);
        console.log("Транспорт сохранен в состоянии");
      } catch (error: any) {
        console.error("Ошибка при создании транспорта:", error);
        setError(`Ошибка при создании транспорта: ${error?.message}`);
      }
    };

    // Подписка на событие создания транспорта
    socketRecRef.current.on("createSendTransport", handleCreateSendTransport);

    // Очистка подписки при изменении зависимостей или размонтировании компонента
    return () => {
      socketRecRef.current.off("createSendTransport", handleCreateSendTransport);
      // console.log("Отписка от события createSendTransport");
    };
  }, [socketRecRef.current, device]);

  useEffect(() => {
    if (socketRecRef.current && device) {
      createWebRtcTransport()
    }
  }, [socketRecRef.current, device])

  // Функция для запроса создания WebRTC транспорта (отправляем запрос на сервер)
  const createWebRtcTransport = useCallback(() => {
    if (!socketRecRef.current) {
      console.error("Сокет не инициализирован");
      setError("Сокет не инициализирован");
      return;
    }

    if (!device) {
      console.error("Device не инициализирован");
      setError("Device не инициализирован");
      return;
    }

    // console.log("Отправка запроса на создание транспорта");
    socketRecRef.current.emit("createTransport");
  }, [socketRecRef.current, device]);

  // Функция запуска захвата экрана и создания Producer (отправка видеодорожки)
  const startScreenCapture = useCallback(async () => {
    if (!producerTransport) {
      console.error("Транспорт для продюсера не создан");
      setError("Транспорт для продюсера не создан. Сначала нажмите 'Создать WebRTC транспорт'");
      return;
    }

    try {
      // console.log("Начинаем захват экрана");
      // Захват экрана
      const stream = await mediaDevices.getDisplayMedia();

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // console.log("Видеопоток установлен в элемент video");
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        console.error("Нет видеодорожки для захвата экрана");
        setError("Нет видеодорожки для захвата экрана");
        return;
      }

      stream.addTrack(videoTrack);

      if (!stream) {
        console.error('No video track available for screen recording');
        return;
      }

      console.log("Screen stream started", stream);  // Log when screen stream is started

      // Add audio tracks if available from main peer connection
      // mainPeerConnectionRef.current.getReceivers().forEach((receiver) => {
      //   if (receiver.track && receiver.track.kind === 'audio') {
      //     combinedStream.addTrack(receiver.track);
      //   }
      // });

      // mainPeerConnectionRef.current.getSenders().forEach((sender) => {
      //   if (sender.track && sender.track.kind === 'audio') {
      //     combinedStream.addTrack(sender.track);
      //   }
      // });

      // combinedStream.getTracks().forEach(track => {
      //   recordingPeerConnectionRef.current?.addTrack(track, combinedStream);
      // });

      // combinedStream.getTracks().forEach(track => {
      //   console.log(`Adding transceiver for track: ${track.kind}`);
      //   if (track.kind === 'audio' || track.kind === 'video') {
      //     try {
      //       const transceiver = recordingPeerConnectionRef.current?.addTransceiver(track, { direction: 'sendrecv' });
      //       if (!transceiver) {
      //         console.error('Failed to create transceiver for track:', track);
      //       } else {
      //         console.log('Transceiver added successfully:', transceiver);
      //       }
      //     } catch (error) {
      //       console.error('Error adding transceiver:', error);
      //     }
      //   }
      // });



      // console.log("Видеодорожка получена:", videoTrack);

      // Отправляем видеодорожку через mediasoup транспорт
      // console.log("Создаем продюсер с видеодорожкой");
      const prod = await producerTransport.produce({
        track: videoTrack,
        encodings: [
          { maxBitrate: 100000 },
          { maxBitrate: 300000 },
          { maxBitrate: 900000 }
        ],
        codecOptions: {
          videoGoogleStartBitrate: 1000
        }
      });

      setProducer(prod);
      // console.log("Producer создан на клиенте, id:", prod.id);

      // Обработка закрытия видеодорожки (например, когда пользователь закрывает окно захвата)
      videoTrack.addEventListener('ended', () => {
        // console.log('Видеодорожка закрыта пользователем');
        if (prod) {
          prod.close();
          setProducer(null);
        }

        // Если запись идет, останавливаем ее
        if (isRecording) {
          stopRecording();
        }
      });
    } catch (error: any) {
      console.error("Ошибка захвата экрана:", error);
      setError(`Ошибка захвата экрана: ${error?.message}`);
    }
  }, [producerTransport, isRecording]);

  useEffect(() => {
    if (socketRecRef.current && producer) {
      startRecording()
    }
  }, [socketRecRef.current, producer])

  // Функция для начала записи
  const startRecording = useCallback(async () => {
    if (!socketRecRef.current) {
      console.error("Сокет не инициализирован");
      setError("Сокет не инициализирован");
      return;
    }

    if (!producer) {
      console.error("Продюсер не создан");
      setError("Сначала начните захват экрана");
      return;
    }

    console.log("Отправка запроса на начало записи");
    socketRecRef.current.emit("startRecording");
    setIsRecording(true);
  }, [socketRecRef.current, producer]);

  // Функция для остановки записи
  const stopRecording = useCallback(() => {
    if (!socketRecRef.current) {
      console.error("Сокет не инициализирован");
      return;
    }

    if (!isRecording) {
      console.log("Запись не ведется");
      return;
    }

    console.log("Отправка запроса на остановку записи");
    socketRecRef.current.emit("stopRecording");
    setIsRecording(false);
  }, [socketRecRef.current, isRecording]);

  return {
    startRecording: startScreenCapture,
    stopRecording,
    isRecording,
  };
};
