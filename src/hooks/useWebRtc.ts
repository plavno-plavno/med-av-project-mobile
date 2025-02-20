import {
  useState, useEffect, useRef,
} from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, initializeSocket } from './webRtcSocketInstance';
import { mediaDevices, MediaStreamTrack, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription, RTCView } from 'react-native-webrtc';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ROUTES } from 'src/navigation/RoutesTypes';
import { useAuthMeQuery, useGetUsersByIdMutation } from 'src/api/userApi/userApi';
import inCallManager from 'react-native-incall-manager';
import { ScreensEnum } from 'src/navigation/ScreensEnum';
import AudioRecord from "react-native-audio-record";

export type Photo = {
  id: string;
  path: string;
  link: string;
};

export type Departments = {
  name: string;
};

export interface Organization {
  id: number | string;
  location: string;
  staffCount: string
  phoneNumber: string;

  name: string;
  domain: string;
  updatedAt: string;
  createdAt: string;
  photo: Photo | null;
  departments: any[];
}

export interface User {
  id: number | string;
  photo: Photo | null;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  deletedAt: null | string;
  department: Departments;
  provider: string;
  title: string;
  phone: string;
  age: string;
  gender: string;
  gmtDelta: number;
  role: {
    id: number;
    name: string;
  };
  socialId: null | string | number;
  status: {
    id: number;
    name: string;
  };
  language: {
    name: string
  }
  updatedAt: string;
  organization: Organization;
}

export interface ActionStatus {
  isAudioOn: boolean;
  isVideoOn: boolean;
  isSharingOn: boolean;
  isRecordingOn: boolean;
}

export interface ParticipantsInfo {
  userId: string;
  status: ActionStatus;
}

export interface ISubtitle {
  userName: string;
  message: string;
  time: string;
}

export enum UserActions {
  MuteAudio = 'mute-audio',
  UnmuteAudio = 'unmute-audio',
  MuteVideo = 'mute-video',
  UnmuteVideo = 'unmute-video',
  StartShareScreen = 'start-share-screen',
  StopShareScreen = 'stop-share-screen',
  StartRecording = 'start-recording',
  StopRecording = 'stop-recording',
}


export type AudioStream = {
  audioTrack: MediaStreamTrack;
  midId: string;
};

export type VideoStream = {
  videoTrack: MediaStreamTrack;
  midId: string;
};

export interface RemoteStream {
  userId: number | string;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  mid: string;
}

export interface IUsersAudioTrackToIdMap {
  [midId: number]: string;
}

export interface IUsersVideoTrackToIdMap {
  [midId: number]: string;
}

type ParamList = {
  Detail: {
    hash: string
    isMuted?: boolean
    isVideoOff?: boolean
  }
}

const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

const SUBTITLES_QUEUE_LIMIT = 3;
const TRIES_LIMIT = 7;
let RETRY_ATTEMPT: number = 0;

const useWebRtc = () => {
  const [localStream, setLocalStream] = useState<RemoteStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [error, setError] = useState<any | string | null>(null);

  const { data: authMeData } = useAuthMeQuery()
  const userRefId = useRef<string | number>()
  userRefId.current = authMeData?.id

  const [usersAudioTrackToIdMap, setUsersAudioTrackToIdMap] = useState<IUsersAudioTrackToIdMap>({});
  const [usersVideoTrackToIdMap, setUsersVideoTrackToIdMap] = useState<IUsersVideoTrackToIdMap>({});

  const [remoteVideoStreams, setRemoteVideoStreams] = useState<VideoStream[]>([]);
  const [remoteAudioStreams, setRemoteAudioStreams] = useState<AudioStream[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedTimeRef = useRef<number>(0);

  const [messages, setMessages] = useState<any[]>([]);

  const { reset } = useNavigation<ROUTES>()
  const route = useRoute<RouteProp<ParamList, "Detail">>()
  const [isMuted, setIsMuted] = useState(route.params?.isMuted)
  const [isVideoOff, setIsVideoOff] = useState(route.params?.isVideoOff)
  const [isScreenShare, setIsScreenShare] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isCameraSwitched, setIsCameraSwitched] = useState(false)

  const [getUsersById] = useGetUsersByIdMutation()
  const roomId = route?.params?.hash

  const socketRef = useRef<Socket | null>(null);

  const sttUrlRef = useRef<string | null>(null);

  const offerStatusCheckRef = useRef<ReturnType<typeof setInterval>>();

  const [activeSpeakerId, setActiveSpeakerId] = useState<number | null>(null);
  const [isSTTOpened, setSTTOpen] = useState<boolean>(false);

  const STTSocket = useRef<WebSocket | null>(null);
  const sttLanguageRef = useRef<string | undefined>(authMeData?.language?.code?.toLowerCase?.());
  const isConnectingRef = useRef<boolean>(false);
  const allLanguagesRef = useRef<string[] | undefined>(['en', 'hi']);

  const pendingCandidates: RTCIceCandidate[] = [];

  const audioLevelMapRef = useRef<Record<string, number>>({});
  const [transceiversInfo, setTransceiversInfo] = useState<RemoteStream[]>([]);

  const sttLanguagesRef = useRef<any[]>([
    authMeData?.language?.code
  ]);

  let isRecording = false;
  const audioCheckIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const [subtitlesQueue, setSubtitesQueue] = useState<any[]>([]);

    let collectorAr: Float32Array[] = [];

console.log(isSTTOpened, 'isSTTOpened');
console.log(subtitlesQueue, 'subtitlesQueue');

console.log(activeSpeakerId, 'activeSpeakerIdactiveSpeakerIdactiveSpeakerId');

  socketRef.current = getSocket()

  useEffect(() => {
    if (!socketRef.current) {
      initializeSocket().then(() => {
        socketRef.current = getSocket()
        peerConnection.current = createPeerConnection();
      })
      return;
    }

    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
    socketRef.current.onAny(handleOnAny);
    // socketRef.current.on('offer', (event) => checkPeerConnection(() => handleOffer(event)));
    // socketRef.current.on('answer', (event) => checkPeerConnection(() => handleAnswer(event)));
    socketRef.current.on('offer', handleOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('candidate', handleCandidate);
    socketRef.current.on('user-joined', handleUserJoined);
    socketRef.current.on("screen-share-updated", (e) => setIsScreenShare(e?.isSharing))

    socketRef.current.on('mute-audio', userToggledMedia);
    socketRef.current.on('unmute-audio', userToggledMedia);
    socketRef.current.on('mute-video', userToggledMedia);
    socketRef.current.on('unmute-video', userToggledMedia)

    socketRef.current.on('transceiver-info', handleTransceiver);
    socketRef.current.on('client-disconnected', handleClientDisconnected);
    socketRef.current.on('error', handleSocketError);

    socketRef.current.on('chat-message', handleChatMessage);

    peerConnection.current = createPeerConnection();
    // return () => {
    //   disconnectSocketEvents()
    //   endCall();
    // };
  }, [socketRef.current, roomId]);

  const handleAudioCheck = () => {
    if (!peerConnection.current) return;

    try {
      peerConnection.current?.getStats().then(stats => {
        let maxAudioLevel = 0;
        let newActiveSpeakerId: number | null = null;

        stats.forEach((report: any) => {
          if (
            report.type === "inbound-rtp" &&
            report.kind === "audio" &&
            report.audioLevel !== undefined
          ) {
            const trackId = report.trackIdentifier || report.trackId;
            const userId = transceiversInfo!.find(
              str => str.audioTrack!.id === trackId,
            )?.userId;

            if (userId) {
              audioLevelMapRef.current[userId] = report.audioLevel;

              if (report.audioLevel > maxAudioLevel) {
                maxAudioLevel = report.audioLevel;
                newActiveSpeakerId = Number(userId) || null;
              }
            }
          }
        });

        if (maxAudioLevel > 0.01) {
          setActiveSpeakerId(newActiveSpeakerId!);
        } else {
          setActiveSpeakerId(null);
        }
      });
    } catch (error) {
      console.error("Error fetching audio levels:", error);
    }
  };

  const onSTTSocketMessage = (event: WebSocketMessageEvent) => {
    console.log("onSocketMessage: ", !!JSON.parse(event.data));
    return;
  };

  const disconnectSocketEvents = () => {
    if (socketRef.current) {
      const events = [
        'offer',
        'answer',
        'candidate',
        'user-joined',
        'client-disconnected',
        'chat-message',
        'transceiver-info',
        'error',
        'mute-audio',
        'unmute-audio',
        'mute-video',
        'unmute-video',
      ];
  
      events.forEach(event => socketRef.current?.off(event));
    }
  }

  const createPeerConnection = () => {
    if (peerConnection.current) {
      return peerConnection.current;
    }
    try {
      const pc = new RTCPeerConnection(config);

      pc.addEventListener('icecandidate', ({ candidate }) => {
        console.log(candidate, 'onIcecandidate');
        if (candidate) {
          socketRef.current?.emit('candidate', {
            candidate,
            roomId,
          });
        }
      });
      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'failed') {
          console.error('Connection failed. Consider renegotiating or restarting the connection.');
        }
      });

      pc.addEventListener('datachannel', (event) => {
      const dataChannel = event.channel;

      dataChannel.addEventListener("open", () => {
        console.log("Data channel opened");
      });

      dataChannel.addEventListener("message", handlePeerDataChannelMessage);

      dataChannel.addEventListener("close", () => {
        console.log("Data channel closed");
      });

      dataChannel.addEventListener("error", error => {
        console.error("Data channel error:", error);
      });
      })

      pc.addEventListener('track', (event) => {
        const midId = event.transceiver.mid || '';
        if (event?.track?.kind === 'video') {
          setRemoteVideoStreams((prevStreams) => {
            const exists = prevStreams.some((stream) => stream.videoTrack.id === event?.track?.id);

            if (!exists && event?.track) {
              const newVideoStream: VideoStream = {
                videoTrack: event.track,
                midId: midId,
              };

              return [...prevStreams, newVideoStream];
            }

            return prevStreams;
          });
        } else if (event?.track?.kind === 'audio') {
          setRemoteAudioStreams((prevStreams) => {
            const exists = prevStreams.some((stream) => stream.audioTrack.id === event?.track?.id);

            if (!exists && event.track) {
              const newAudioStream: AudioStream = {
                audioTrack: event.track,
                midId: midId,
              };

              return [...prevStreams, newAudioStream];
            }

            return prevStreams;
          });
        }
      });
      return pc;
    } catch (error) {
      console.error('Failed to create PeerConnection:', error);
      throw new Error('Could not create RTCPeerConnection');
    }
  };

  const handleSocketError = ({ error }: any) => {
    console.log('Socket error:', error.message);
    setError(error);
  };

  const checkPeerConnection = (func: () => void) => {
     const interval = setInterval(() => {
        if (peerConnection.current?.signalingState === 'stable') {
          clearInterval(interval);
          func()
           } else {
          console.warn('Waiting for peer connection to stabilize...');
          return
        }
      }, 2000);
  };

  const startCall = async ({isAudioOn, isVideoOn}:{isAudioOn: boolean, isVideoOn: boolean}) => {
    try {
          socketRef.current?.emit('join', {
            roomId,
            language: 'en',
            status: {
              isAudioOn,
              isVideoOn,
              isSharingOn: false,
              isRecordingOn: false,
            },
          });
  
          inCallManager.setSpeakerphoneOn(true);
  
          if (!timerRef.current) {
            startTimeRef.current = Date.now();
            timerRef.current = setInterval(() => {
              elapsedTimeRef.current = Date.now() - (startTimeRef.current || 0);
            }, 1000);
          }
 
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };
  
  const endCall = () => {
    stopLocalStreamTracks();
    remoteAudioStreams?.forEach(t => t?.audioTrack?.stop?.());
    remoteAudioStreams?.forEach(t => t?.audioTrack?.release?.());
    remoteVideoStreams?.forEach(t => t?.videoTrack?.stop?.());
    remoteVideoStreams?.forEach(t => t?.videoTrack?.release?.());
    peerConnection.current?.close()

    peerConnection.current = null
    disconnectSocketEvents();
    peerConnection.current = null
    reset({
      index: 0,
      routes: [{ name: ScreensEnum.MAIN }],
    })
  };

  const stopLocalStreamTracks = () => {
    if (localStream) {
      if (localStream.audioTrack) {
        localStream.audioTrack.stop();
        localStream.audioTrack.release();
        localStream.audioTrack.enabled = false;
        localStream.audioTrack = null;
      }

      if (localStream.videoTrack) {
        localStream.videoTrack.stop();
        localStream.videoTrack.release();
        localStream.videoTrack.enabled = false;

        localStream.videoTrack = null;
      }

      setLocalStream(null);
    }
  };

  const handleOfferCheck = async () => {
    try {
      RETRY_ATTEMPT++;
      if (RETRY_ATTEMPT > TRIES_LIMIT)
        throw new Error("Something wrong with connection");
      if (peerConnection.current?.signalingState !== "stable") return;
      const offer = await peerConnection.current.createOffer({});
      await peerConnection.current.setLocalDescription(offer);
      socketRef.current!.emit("offer", {
        sdp: peerConnection.current.localDescription,
        roomId,
      });
      clearInterval(offerStatusCheckRef.current);
      if (RETRY_ATTEMPT) RETRY_ATTEMPT = 0;
      return
    } catch (error) {
      console.error("Error obtaining media:", error);
      clearInterval(offerStatusCheckRef.current);
    }
  };

  const handleOffer = async ({ sdp }: { sdp: RTCSessionDescription }) => {
    if (!peerConnection.current) {
      peerConnection.current = createPeerConnection();
    }
    try {
        RETRY_ATTEMPT++;
        if (RETRY_ATTEMPT > TRIES_LIMIT)
          throw new Error("Something wrong with connection");
        if (peerConnection.current?.signalingState !== "stable") return;
      const offer = new RTCSessionDescription(sdp);
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      await flushCandidates();
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      if (peerConnection.current?.localDescription) {
        const localDescription = peerConnection.current.localDescription as RTCSessionDescription;
        socketRef.current?.emit("answer", { sdp: localDescription, roomId });
        clearInterval(offerStatusCheckRef.current);
        if (RETRY_ATTEMPT) RETRY_ATTEMPT = 0;
      } else {
        console.error("Local description is null");
      }
    } catch (error) {
      console.error("Error processing offer:", error);
    }
  };

  const handleAnswer = async ({ sdp }: { sdp: RTCSessionDescription }) => {
    try {
      if (peerConnection.current) {
        if (peerConnection.current.signalingState === 'stable') {
          console.warn('Answer ignored: already stable');
          return;
        }
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(sdp));
      }
    } catch (error) {
      console.error("Error setting remote description:", error);
    }
  };

  const handleUserJoined = async (event: { userId: string, actionStatus: ActionStatus, participantsInfo: ParticipantsInfo[] }) => {
    try {
    if (!peerConnection.current) {
      peerConnection.current = createPeerConnection();
    }
      // sttUrlRef.current = 'wss://c17836126.plavno.app:20277';
      const existingUserIds = new Set(participants.map((participant) => participant.id));
      const usersToFetch = event.participantsInfo.filter((participant) => !existingUserIds.has(participant.userId));
      const userFetchPromises = usersToFetch.map(async participant => await getUsersById({ id: Number(participant.userId) }).unwrap());
      const results = await Promise.allSettled(userFetchPromises);

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

       const newUsers = results
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          const user = result.value.user;
          return {
            ...user,
            isAudioOn: event.participantsInfo[index].status.isAudioOn,
            isVideoOn: event.participantsInfo[index].status.isVideoOn,
          };

        } else {
          console.error(`Failed to fetch user ${event.participantsInfo[index].userId}:`, result.reason);
          return null;
        }
      })
      .filter(Boolean);
      setParticipants((prev) => {
        const existingUserIds = new Set(prev.map((participant) => participant.id));
      
        return [
          ...prev,
          ...newUsers.filter((newUser): newUser is any => newUser !== null && !existingUserIds.has(newUser.id)),
        ];
      });

      if (userRefId.current && !localStream) {
        setLocalStream({
          userId: userRefId.current,
          audioTrack: stream.getAudioTracks()[0] || null,
          videoTrack: stream.getVideoTracks()[0] || null,
        } as RemoteStream);
      }

      await stream.getTracks().forEach((track) => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream);
        }
      });
      if (offerStatusCheckRef.current) {
        clearInterval(offerStatusCheckRef.current);
      }
      checkPeerConnection(handleOfferCheck)
    } catch (error) {
      console.error('Error handling user join:', error);
    }
  };

  const flushCandidates = async () => {
    for (const candidate of pendingCandidates) {
      try {
        if (!candidate.sdpMid && candidate.sdpMLineIndex === null) {
          console.warn(
            "Skipping ICE candidate with null sdpMid and sdpMLineIndex.",
          );
          continue;
        }
        await peerConnection.current?.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
        console.log("Buffered ICE candidate added.");
      } catch (error) {
        console.error("Error adding buffered ICE candidate:", error);
      }
    }
    pendingCandidates.length = 0;
  };

  const handleCandidate = async ({ candidate }: { candidate: RTCIceCandidate }) => {
    try {
      if (peerConnection.current) {
        if (!peerConnection.current.remoteDescription) {
          pendingCandidates.push(candidate);
          return;
        }
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  useEffect(() => {
    if(authMeData?.language?.code){
      sttLanguageRef.current = authMeData?.language?.code;
    }
  }, [authMeData?.language?.code])

  const handleChangedRoomLanguage = ({ languages }: {languages: any}) => {
    console.log("handleChangedRoomLanguage: ", languages);
    sttLanguagesRef.current = languages;
  };

  const handleTransceiver = async ({
    mid,
    userId,
    kind,
  }: {
    mid: string | null;
    userId: number;
    kind: string;
  }) => {
    const isUserExists = participants.some((user) => user.id === userId);

    const userIdStr = String(userId);

    if (!isUserExists) {
      try {
        const userData = await getUsersById({ id: userId }).unwrap()
        setParticipants((prev) => {
          const isUserExist = prev.some(
            (participant) => participant.id === userData?.user?.id,
          );

          if (isUserExist) {
            return prev;
          }

          return [...prev, userData.user] as User[];
        });

      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    const existingStream = transceiversInfo?.find(
      stream => stream.mid === String(mid) || stream?.userId === userId,
    );
    if (!existingStream) {
      setTransceiversInfo(current =>
        current.concat({ mid: String(mid), userId, audioTrack: null, videoTrack: null }),
      );
    } else {
      const updatedStream = { ...existingStream };
      updatedStream.userId = userId;
      setTransceiversInfo(current =>
        current.map(stream =>
          stream.mid === updatedStream.mid ? updatedStream : stream,
        ),
      );
    }

    if (mid) {
      const midId = Number(mid);

      if (kind === 'audio') {
        setUsersAudioTrackToIdMap((prevMap) => ({
          ...prevMap,
          [midId]: userIdStr,
        }));
      } else if (kind === 'video') {
        setUsersVideoTrackToIdMap((prevMap) => ({
          ...prevMap,
          [midId]: userIdStr,
        }));
      }
    }
  };

  const handleChatMessage = (data: any) => {
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    setMessages((prev) => [...prev, {
      ...data,
      time: currentTime
    }]);
  };

  const sendMessage = (data: any) => {
    const { message } = data;
    socketRef.current?.emit('chat-message', {
      roomId,
      message
    });
  };

  const handleClientDisconnected = ({ userId }: { userId: number }) => {
    setRemoteVideoStreams((prev) => prev.filter((stream) => {
      const midId = Number(stream.midId);
      const userIdMap = usersVideoTrackToIdMap[midId];

      return userIdMap !== userId.toString();
    }));

    setRemoteAudioStreams((prev) => prev.filter((stream) => {
      const midId = Number(stream.midId);
      const userIdMap = usersAudioTrackToIdMap[midId];
      return userIdMap !== userId.toString();
    }));

    setUsersVideoTrackToIdMap((prevMap) => {
      const updatedMap = { ...prevMap };
      Object.keys(updatedMap).forEach((key) => {
        if (updatedMap[Number(key)] === userId.toString()) {
          delete updatedMap[Number(key)];
        }
      });
      return updatedMap;
    });

    setTransceiversInfo(current =>
      current.filter(stream => stream.userId !== userId),
    );

    setUsersAudioTrackToIdMap((prevMap) => {
      const updatedMap = { ...prevMap };
      Object.keys(updatedMap).forEach((key) => {
        if (updatedMap[Number(key)] === userId.toString()) {
          delete updatedMap[Number(key)];
        }
      });
      return updatedMap;
    });

    setParticipants((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleOnAny = (eventName: string, ...args: any[]) => {
    // console.log(`!!!!! Incoming event: ${eventName} !!!!`, args);
  };

  const toggleSpeaker = () => {
    if (isSpeakerOn) {
      inCallManager.setSpeakerphoneOn(false);
      setIsSpeakerOn(false)
    } else {
      inCallManager.setSpeakerphoneOn(true);
      setIsSpeakerOn(true)
    }
  }

  const switchCamera = () => {
    if (localStream) {
      const videoTrack = localStream?.videoTrack
      if (videoTrack && typeof videoTrack._switchCamera === 'function') {
        videoTrack._switchCamera();
        setIsCameraSwitched(true);
      }
    }
  };

  const handleClearInterval = (
    int: string | number | NodeJS.Timeout | null | undefined,
  ) => {
    if (int) {
      clearInterval(int);
      int = null;
    }
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
    AudioRecord.on("data", (data: any) =>
      addToBufferAndSend(
        data,
        sttLanguageRef.current || 'en',
        allLanguagesRef.current || [] ,
      ),
    );
  };

  const onSocketOpen = () => {
    isConnectingRef.current = false;

    if (STTSocket.current?.readyState === WebSocket.OPEN) {
      STTSocket.current?.send(
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
    console.log(`WebSocket state: ${STTSocket.current?.readyState}`);

    startStreaming();
  };


  const handleSubtitles = (newEl: any) => (prev: any[]) => {
    let newAr = [...prev, newEl];
    if (newAr.length > SUBTITLES_QUEUE_LIMIT) {
      newAr.shift(); // Remove the oldest item if at limit
    }
    return newAr;
  };

  const handlePeerDataChannelMessage = (event: any) => {
    console.log("handlePeerDataChannelMessage: ", event);
    const data = JSON.parse(event.data);
    const { userId, language, text, participantId, participantLang } = data;
    setSubtitesQueue(handleSubtitles(data));
  };

  useEffect(() => {
    sttLanguageRef.current = authMeData?.language?.code?.toLowerCase?.();
  }, [authMeData]);

  useEffect(() => {
    console.log('Stt url ' + sttUrlRef.current);
    console.log(`WebSocket state: ${STTSocket.current?.readyState}`);

    if (!sttUrlRef.current) {
      return;
    }

    STTSocket.current = new WebSocket(sttUrlRef.current);
    console.log(`WebSocket state: ${STTSocket.current?.readyState}`);
    console.log('UseSttConnection hook initialized');

    STTSocket.current.onopen = () => {
      onSocketOpen();
    };

    STTSocket.current.onmessage = (event) => {
      console.log(event, 'eventeventeventeventeventevent');
    };

    STTSocket.current.onerror = (event: Event) => {
      const error = event
        setError(error as any);
      console.error('WebSocket error', error);
    };

    STTSocket.current.onclose = (event) => {
      console.log(event, 'event close');
    };
    return () => {
      console.log('Unmount Stt hook');
    };
  }, [sttUrlRef?.current, socketRef]);

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
        if (STTSocket.current?.readyState === WebSocket.OPEN) {
          const audio = Float32ConcatAll(collectorAr);
          const packet = {
            speakerLang: sttLanguageRef.current,
            allLangs: allLanguagesRef.current,
            audio: float32ArrayToBase64(audio),
          };
  // console.log(packet, 'packetpacketpacket');
          // Send the packet via WebSocket
          STTSocket.current.send(JSON.stringify(packet));
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

    const currentLanguageRef = useRef<string>(
      authMeData?.language?.code!,
    );

  const captureAndSendAudio = () => {
    console.log("captureAndSendAudio");
    if (isRecording) {
      isRecording = false;
      handleClearInterval(audioCheckIntervalRef.current);
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
    audioCheckIntervalRef.current = setInterval(handleAudioCheck, 1000); // Polling every 100ms
    isRecording = true;
    AudioRecord.on("data", (data: any) =>
      addToBufferAndSend(
        data,
        currentLanguageRef.current,
        sttLanguagesRef.current,
      ),
    );
  };

  useEffect(() => {
    if(sttUrlRef.current){
      handleSetSTTSocket({sttUrl: sttUrlRef.current})
    }
  }, [sttUrlRef.current])

  const handleSetSTTSocket = ({sttUrl} : { sttUrl: string }) => {
    STTSocket.current = new WebSocket(sttUrl);
    console.log({ STTSocket });

    STTSocket.current.onopen = onSTTSocketOpen;
    STTSocket.current.onmessage = onSTTSocketMessage;

    STTSocket.current.onerror = error => {
      console.log("STTError: ", error);

      AudioRecord.stop();
      STTSocket.current?.close();
    };

    STTSocket.current.onclose = event => {
      console.log("STTOnclose: ", event);
    };
  };
  const onSTTSocketOpen = () => {
    if (!userRefId.current) return;
    setSTTOpen(true);
    console.log("STT SEND: ");
    STTSocket.current!.send(
      JSON.stringify({
        uid: `tester-${userRefId.current}`,
        language: sttLanguageRef.current,
        task: 'transcribe',
        model: 'large-v3',
        use_vad: true,
      }),
    );
    if (!isMuted) {
      captureAndSendAudio();
    }
  };

  const toggleMedia = async (type: 'audio' | 'video') => {
    if (!peerConnection.current) {
      return;
    }
    if (!localStream || !socketRef.current) {
      return;
    }
    const isAudio = type === 'audio';
    if(isAudio){
      setIsMuted((prev) => !prev)
      if (!isMuted) {
        console.log("Microphone muted. Stopping recording...");
        AudioRecord.stop();
      } else {
        console.log("Microphone unmuted. Restarting recording...");
        // captureAndSendAudio();
      }
    } else {
      setIsVideoOff((prev) => !prev)
    }
    const track = isAudio ? localStream.audioTrack : localStream.videoTrack;
    if (!track) {
      return;
    }
    track.enabled = !track.enabled;

    setLocalStream((prev) => ({
      ...prev!,
      [isAudio ? 'audioTrack' : 'videoTrack']: track,
    }));

    const action = track.enabled
      ? isAudio
        ? UserActions.UnmuteAudio
        : UserActions.UnmuteVideo
      : isAudio
        ? UserActions.MuteAudio
        : UserActions.MuteVideo;

    socketRef?.current?.emit('action', {
      roomId,
      action,
      userId: userRefId.current,
    });

    console.log(`Media toggled: ${type}, new state: ${track.enabled}`);
  };

  const userToggledMedia = ({ userId, status }: { userId: string; status: ActionStatus }) => {
    setParticipants((prev) => prev.map((participant) => participant.id === userId
      ? {
        ...participant,
        isAudioOn: status.isAudioOn,
        isVideoOn: status.isVideoOn,
      }
      : participant,
    ),
    );
  };

  return {
    localStream,
    isMuted,
    isVideoOff,
    messages,
    participants,
    
    roomId,
    
    isSpeakerOn,
    isCameraSwitched,
    isScreenShare,
    
    elapsedTimeRef: elapsedTimeRef.current,
    remoteVideoStreams,
    remoteAudioStreams,
    usersAudioTrackToIdMap,
    usersVideoTrackToIdMap,
    peerConnection: peerConnection.current,
    rtcError: error,
    
    sttUrl: sttUrlRef,

    toggleMedia,
    startCall,
    endCall,
    sendMessage,
    toggleSpeaker,
    switchCamera,
    setLocalStream,
  };
};

export default useWebRtc;
