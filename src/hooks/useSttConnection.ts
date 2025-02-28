import {
  useState, useEffect, useRef,
} from 'react';
import { ISubtitle, RemoteStream, AudioStream } from './useWebRtc';
import { mediaDevices } from 'react-native-webrtc';
import { useAuthMeQuery } from 'src/api/userApi/userApi';
import AudioRecord from "react-native-audio-record";

export type Message = {
  userId: string;
  message: string;
  time?: string;
};

export type Language = {
  id: number;
  name: string;
  code: string;
};

interface IUseSttConnectionProps {
  sttUrl: string | null;
  callLanguage?: Language;
  roomLanguages?: string[];
  isAudioOn: boolean;
}

const useSttConnection = ({ sttUrl, isAudioOn }: IUseSttConnectionProps) => {
    const { data: user } = useAuthMeQuery()
    let isRecording = false;
    let collectorAr: Float32Array[] = [];

  const [isSttConnected, setIsSttConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const isConnectingRef = useRef<boolean>(false);
  const [localSttStream, setLocalSttStream] = useState<Pick<RemoteStream, 'userId' | 'audioTrack'> | null>(null);

  const [, setSttLanguage] = useState<string | undefined>(user?.language?.code || '');
  const sttLanguageRef = useRef<string | undefined>(user?.language?.code?.toLowerCase?.());
  const [, setAllLanguages] = useState<string[] | undefined>(['en', 'hi']);
  const allLanguagesRef = useRef<string[] | undefined>(['en', 'hi']);
  const [subtitles, setSubtitles] = useState<ISubtitle[]>([]);

  const userRefId = useRef<number>();
  const userRefName = useRef<string>();

  userRefId.current = user?.id;
  userRefName.current = user?.firstName + ' ' + user?.lastName?.slice(0, 1) + '.';

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    sttLanguageRef.current = user?.language?.code?.toLowerCase?.();
  }, [user]);

  useEffect(() => {
    if (!sttUrl || isConnectingRef.current || isSttConnected) {
      return;
    }
    isConnectingRef.current = true;
    socketRef.current = new WebSocket(sttUrl);

    socketRef.current.onopen = () => {
      onSocketOpen();
    };

    socketRef.current.onmessage = (event) => {
      onSocketMessage(event as any);
    };

    socketRef.current.onerror = (event: Event) => {
      const error = event
        setError(error as any);
      console.error('WebSocket error', error);
    };

    socketRef.current.onclose = (event) => {
      onSocketClose(event);
    };

    return () => {
      // eslint-disable-next-line no-console
      console.log('Unmount Stt hook');
      stopStreaming();
    };
  }, [sttUrl, socketRef]);

  const handleChangeSttLanguage = (languageCode: string) => {
    sttLanguageRef.current = languageCode;
    setSttLanguage(languageCode);
  };

  const handleChangeAllLanguages = (allLanguagesCodes: string[]) => {
    allLanguagesRef.current = allLanguagesCodes;
    setAllLanguages(allLanguagesCodes);
  };
console.log(socketRef.current, 'socketRef.currentsocketRef.current');

  const onSocketOpen = () => {
    setIsSttConnected(true);
    isConnectingRef.current = false;

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          uid: `tester-${userRefId.current}`,
          language: sttLanguageRef.current,
          task: 'transcribe',
          model: 'large-v3',
          use_vad: true,
        }),
      );
    }

    console.log('Socket connected.');
    console.log(`WebSocket state: ${socketRef.current?.readyState}`);

    startStreaming();
  };

  const onSocketMessage = (event: MessageEvent) => {
    try {
      const { segments } = JSON.parse(event.data.toString());

      if (segments) {
        const currentTime = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        const subtitles = segments.slice(-5).map((segment: { text: string }) => ({
          userName: userRefName.current ?? 'Guest',
          message: segment.text,
          time: currentTime,
        }));
        console.log(subtitles, 'subtitlessubtitlessubtitlessubtitles');
        
        console.log('STT messages', subtitles);
        setSubtitles(subtitles);
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  };

  const onSocketClose = (event: any) => {
    setIsSttConnected(false);
    isConnectingRef.current = false;
    setIsStreaming(false);
    setLocalSttStream(null);

    console.log(`WebSocket closed: Code=${event.code}, Reason=${event.reason}`);
    console.log(`WebSocket state: ${socketRef.current?.readyState}`);
    socketRef.current = null;
  };

  const handleClearInterval = (
    int: string | number | NodeJS.Timeout | null | undefined,
  ) => {
    if (int) {
      clearInterval(int);
      int = null;
    }
  };

  const startStreaming = async () => {
    console.log("captureAndSendAudio");
    if (isRecording) {
      isRecording = false;
      AudioRecord.stop();
    }
    AudioRecord.init({
      sampleRate: 44100, // 16 kHz
      channels: 1, // Mono
      bitsPerSample: 16, // 16-bit audio
      audioSource: 6, // Use the microphone as the audio source
      wavFile: "newTest.wav", // default 'audio.wav'
    });
    AudioRecord.start();
    isRecording = true;
    AudioRecord.on("data", data =>
      addToBufferAndSend(
        data,
        sttLanguageRef.current || 'en',
        allLanguagesRef.current || [] ,
      ),
    );
  };

  const base64ToFloat32Array = (base64: string): Float32Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
  
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
  
    return new Float32Array(bytes.buffer);
  };
  
  const Float32ConcatAll = (arrays: Float32Array[]): Float32Array => {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Float32Array(totalLength);
  
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
  
    return result;
  };
  
  
  const addToBufferAndSend = async (
    data: string,
    language: string,
    sttLanguages: string[],
  ) => {
    if (!isRecording) return;
    try {
      const arrayBuffer = base64ToFloat32Array(data);
      collectorAr.push(resampleTo16kHZ(arrayBuffer));

      if (collectorAr?.length !== 4) return;
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        const audio = Float32ConcatAll(collectorAr);
        // const packet = {
        //   speakerLang: language || "en", // Speaker language
        //   // allLangs: ["en", "es", "ar", "de"], // Example supported languages
        //   allLangs: sttLanguages, // Example supported languages
        //   audio: float32ArrayToBase64(audio),
        // };

        const packet = {
          speakerLang: sttLanguageRef.current,
          allLangs: allLanguagesRef.current,
          audio: float32ArrayToBase64(audio),
        };

        const jsonPacket = JSON.stringify(packet);
        // Send the packet via WebSocket
        socketRef.current.send(JSON.stringify(jsonPacket));
        collectorAr = [];
      } else {
        console.warn("WebSocket is not open. Saving audio locally.");
        AudioRecord.stop().then((res: string) => {
          isRecording = false;
        });
      }
    } catch (error) {
      console.error("Error processing and sending audio data:", error);
    }
  };

  const stopStreaming = () => {
    console.log('Stop streaming in STT');

    if (socketRef.current?.readyState !== 1) {
      return;
    }

    setIsStreaming(false);
    setIsSttConnected(false);
    setLocalSttStream(null);
    setSubtitles([]);

    if (socketRef.current) {
      // eslint-disable-next-line no-console
      console.log('Close socket in STT');
      socketRef.current.close(1000);
      // eslint-disable-next-line no-console
      console.log(`WebSocket state: ${socketRef.current?.readyState}`);
    }
  };

  const toggleSttMicrophoneMute = () => {
    if (localSttStream) {
      const audioTrack = localSttStream.audioTrack;

      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  const resampleTo16kHZ = (audioData: Float32Array | number[], origSampleRate = 44100) => {
    const data = new Float32Array(audioData);
    const targetLength = Math.round(data.length * (16000 / origSampleRate));
    const resampledData = new Float32Array(targetLength);
    const springFactor = (data.length - 1) / (targetLength - 1);
    resampledData[0] = data[0];
    resampledData[targetLength - 1] = data[data.length - 1];

    for (let i = 1; i < targetLength - 1; i++) {
      const index = i * springFactor;
      const leftIndex = Math.floor(index);
      const rightIndex = Math.ceil(index);
      const fraction = index - leftIndex;
      resampledData[i] = data[leftIndex] + (data[rightIndex] - data[leftIndex]) * fraction;
    }

    return resampledData;
  };

  const float32ArrayToBase64 = (float32Array: Float32Array): string => {
    const uint8Array = new Uint8Array(float32Array.buffer);

    let binaryString = '';

    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }

    return btoa(binaryString);
  };
console.log(subtitles, 'subtitlessubtitlessubtitles');

  return {
    isSttConnected,
    sttError: error,
    startStreaming,
    stopStreaming,
    setSttLanguage,
    handleChangeSttLanguage,
    handleChangeAllLanguages,
    subtitles,
    toggleSttMicrophoneMute,
  };
};

export default useSttConnection;
