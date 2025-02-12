import {
  useState, useEffect, useRef,
} from 'react';
import { Socket } from 'socket.io-client';
import {  getSocket, initializeSocket } from './webRtcSocketInstance';
import { mediaDevices, MediaStreamTrack, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription, RTCView } from 'react-native-webrtc';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ROUTES } from 'src/navigation/RoutesTypes';
import { useAuthMeQuery, useGetUsersByIdMutation } from 'src/api/userApi/userApi';
import inCallManager from 'react-native-incall-manager';
import { ScreensEnum } from 'src/navigation/ScreensEnum';

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
  const [isMuted, setIsMuted] = useState(route.params?.isMuted || false)
  const [isVideoOff, setIsVideoOff] = useState(
    route.params?.isVideoOff || false
  )
  const [isScreenShare, setIsScreenShare] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [isCameraSwitched, setIsCameraSwitched] = useState(false)

  const [getUsersById] = useGetUsersByIdMutation()
  const roomId = route?.params?.hash

  const [isLeftMeeting, setIsLeftMeeting] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  socketRef.current = getSocket()

  useEffect(() => {
    if (!socketRef.current) {
      return;
    }

    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
    socketRef.current.onAny(handleOnAny);
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
    // return () => {
    //   if (socketRef.current) {
    //     socketRef.current.offAny(handleOnAny);
    //     socketRef.current.off('offer', handleOffer);
    //     socketRef.current.off('answer', handleAnswer);
    //     socketRef.current.off('candidate', handleCandidate);
    //     socketRef.current.off('user-joined', handleUserJoined);

    //     socketRef.current.off('client-disconnected');
    //     socketRef.current.off('transceiver-info', handleTransceiver);
    //     socketRef.current.off('error', handleSocketError);
    //   }
    //   console.log('UseEffect UNMOUNT');

    //   endCall();
    // };
  }, [socketRef.current, roomId]);

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

        dataChannel.addEventListener("open", (event) => {
          console.log("Data channel opened", event)
        })

        dataChannel.addEventListener("message", (event) => {
          const data = event?.data
          console.log("Message received through data channel:", data)
        })

        dataChannel.addEventListener("close", () => {
          console.log("Data channel closed")
        })

        dataChannel.addEventListener("error", (error) => {
          console.error("Data channel error:", error)
        })
      })

      pc.addEventListener('track', (event) => {
        console.log('Receive track in ontrack', event);

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
console.log(!route.params?.isMuted || !isMuted, 'route.params?.isMuted');
console.log(route.params?.isVideoOff, 'route.params?.isVideoOff');

  const startCall = async () => {
    try {
      socketRef.current?.emit('join', {
        roomId,
        language: 'en',
        status: {
          isAudioOn: !route.params?.isMuted || !isMuted,
          isVideoOn: !route.params?.isVideoOff || !isVideoOff,
          isSharingOn: false,
          isRecordingOn: false,
        },
      });

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

  const handleOffer = async ({ sdp }: { sdp: RTCSessionDescription }) => {
    if (!peerConnection.current) {
      peerConnection.current = createPeerConnection();
    }

    try {
      const polite = true;
      const offerCollision = (peerConnection.current.signalingState === 'have-local-offer' || peerConnection.current.signalingState === 'have-remote-offer');
      const ignoreOffer = !polite && offerCollision;

      if (ignoreOffer) {
        console.log('Offer ignored due to collision');
        return;
      }
      const offer = new RTCSessionDescription(sdp);
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      await flushCandidates();
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      if (peerConnection.current.localDescription) {
        const localDescription = peerConnection.current.localDescription as RTCSessionDescription;
        socketRef.current?.emit('answer', {
          sdp: localDescription,
          roomId,
        });
      } else {
        console.error('Local description is null');
      }
    } catch (error) {
      console.error('Error processing offer:', error);
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
      console.error('Error setting remote description:', error);
    }
  };

  const handleUserJoined = async ({ userId }: { userId: number }) => {
    try {
      const userData = await getUsersById({ id: userId }).unwrap()
      setParticipants((prev) => {
        const isUserExist = prev.some((participant) => participant.id === userData?.user?.id);

        if (isUserExist) {
          return prev;
        }

        return [...prev, userData.user] as User[];
      });
      // if (userData?.user) {
      //   setParticipants((prev) => [...prev, userData.user] as User[]);
      // }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      if (userRefId.current && !localStream) {
        setLocalStream({
          userId: userRefId.current,
          audioTrack: stream.getAudioTracks()[0] || null,
          videoTrack: stream.getVideoTracks()[0] || null,
        });
      }

      if (!peerConnection.current) {
        peerConnection.current = createPeerConnection();
      }

      stream.getTracks().forEach((track) => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream);
        }
      });

      const offer = await peerConnection.current.createOffer({});
      await peerConnection.current.setLocalDescription(offer);

      if (peerConnection.current.localDescription) {
        socketRef.current?.emit('offer', {
          sdp: peerConnection.current.localDescription,
          roomId,
        });
      } else {
        console.error('Failed to send offer: localDescription is null');
      }
    } catch (error) {
      console.error('Error handling user join:', error);
    }
  };

  const pendingCandidates: RTCIceCandidate[] = [];

  const flushCandidates = async () => {
    for (const candidate of pendingCandidates) {
      try {
        if (!candidate.sdpMid && candidate.sdpMLineIndex === null) {
          console.warn('Skipping ICE candidate with null sdpMid and sdpMLineIndex.');
          continue;
        }
        await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding buffered ICE candidate:', error);
      }
    }
    pendingCandidates.length = 0;
  };

  const handleCandidate = async ({ candidate }: { candidate: RTCIceCandidate }) => {
    try {
      if (peerConnection.current) {
        if (!peerConnection.current.remoteDescription) {
          pendingCandidates.push(candidate);
          console.warn('Send candidate to the queue');
          return;
        }
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
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
      // const videoTrack = localStream?.getVideoTracks?.()?.[0];
      const videoTrack = localStream?.videoTrack
      if (videoTrack && typeof videoTrack._switchCamera === 'function') {
        videoTrack._switchCamera();
        setIsCameraSwitched(true);
      }
    }
  };

  const toggleMedia = async (type: 'audio' | 'video') => {
    const isAudio = type === 'audio';
    if(isAudio){
      setIsMuted((prev) => !prev)
    } else {
      setIsVideoOff((prev) => !prev)
    }
    if (!peerConnection.current) {
      return;
    }

    if (!localStream || !socketRef.current) {
      return;
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
    // remoteStreams,
    isMuted,
    isVideoOff,
    toggleMedia,
    startCall,
    endCall,
    messages,
    sendMessage,
    participants,
    RTCView,

    roomId,

    toggleSpeaker,
    switchCamera,
    isSpeakerOn,
    isCameraSwitched,
    isScreenShare,

    setLocalStream,
    isLeftMeeting,
    setIsLeftMeeting,
    elapsedTimeRef: elapsedTimeRef.current,
    remoteVideoStreams,
    remoteAudioStreams,
    usersAudioTrackToIdMap,
    usersVideoTrackToIdMap,
    peerConnection: peerConnection.current,
    rtcError: error,
  };
};

export default useWebRtc;
