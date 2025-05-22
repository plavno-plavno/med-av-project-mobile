import { useState, useEffect, useRef, useCallback } from "react"
import { Socket } from "socket.io-client"
import { useWebRtcSocketConnection } from "./webRtcSocketInstance"
import {
  mediaDevices,
  MediaStreamTrack,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import {
  useAuthMeQuery,
  useGetUsersByIdMutation,
} from "src/api/userApi/userApi"
import inCallManager from "react-native-incall-manager"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import {
  base64ToFloat32Array,
  float32ArrayToBase64,
  Float32ConcatAll,
  resampleTo16kHZ,
} from "@utils/audioData"
import {
  useGetCalendarEventByHashQuery,
  useSaveCalendarEventsLogMutation,
} from "src/api/calendarApi/calendarApi"
import RTCDataChannel from "react-native-webrtc/lib/typescript/RTCDataChannel"
import { screenHeight, screenWidth } from "@utils/screenResponsive"
import { useScalerFindFreeMachinePairSTTMutation } from "src/api/scalerApi/scalerApi"
import moment from "moment"
import {
  PeerConnectionType,
  RTCAnswerPayload,
  RTCCandidatePayload,
  UserInMeeting,
} from "@utils/meeting"
import { createPeerConnection } from "@utils/peerConnections"
import { useAudioRecorder } from "./useAudioRecorder"
import { Platform } from "react-native"
import { useScreenRecorder } from "./useScreenRecorder"
import { prepareParticipants } from "./settingUpParticipants"
import { createCandidatesManager } from "@utils/candidatesManager"
import Toast from "react-native-toast-message"
import { t } from "i18next"
import { navigationRef } from "src/navigation/RootNavigation"

export type Photo = {
  id: string
  path: string
  link: string
}

export type Departments = {
  name: string
}

export interface Organization {
  id: number | string
  location: string
  staffCount: string
  phoneNumber: string

  name: string
  domain: string
  updatedAt: string
  createdAt: string
  photo: Photo | null
  departments: any[]
}

export interface User {
  [x: string]: any
  id: number | string
  photo: Photo | null
  firstName: string
  lastName: string
  email: string
  createdAt: string
  deletedAt: null | string
  department: Departments
  provider: string
  title: string
  phone: string
  age: string
  gender: string
  gmtDelta: number
  socketId: string
  role: {
    id: number
    name: string
  }
  socialId: null | string | number
  status: {
    id: number
    name: string
  }
  language: {
    name: string
  }
  updatedAt: string
  organization: Organization
}

export interface ActionStatus {
  isAudioOn: boolean
  isVideoOn: boolean
  isSharingOn: boolean
  isRecordingOn: boolean
}

export interface ParticipantsInfo {
  userId: number
  status: ActionStatus
  socketId: string
}

export interface ISubtitle {
  speakerId: number
  text: string
}

export enum UserActions {
  MuteAudio = "mute-audio",
  UnmuteAudio = "unmute-audio",
  MuteVideo = "mute-video",
  UnmuteVideo = "unmute-video",
  StartShareScreen = "start-share-screen",
  StopShareScreen = "stop-share-screen",
  StartRecording = "start-recording",
  StopRecording = "stop-recording",
}

export type AudioStream = {
  audioTrack: MediaStreamTrack
  midId: string
}

export type VideoStream = {
  videoTrack: MediaStreamTrack
  midId: string
}

export interface RemoteStream {
  socketId: string
  audioTrack: MediaStreamTrack | null
  videoTrack: MediaStreamTrack | null
  mid: string
}

export interface LocalStream {
  socketId: number | string
  audioTrack: MediaStreamTrack | null
  videoTrack: MediaStreamTrack | null
}

export interface IUsersAudioTrackToIdMap {
  [key: number]: string
}

export interface IUsersVideoTrackToIdMap {
  [midId: number]: string
}

export enum DataChannelNames {
  Messages = "messages",
  Draw = "draw",
}

export interface Point {
  x: number
  y: number
}

type ParamList = {
  Detail: {
    hash: string
    isMuted?: boolean
    isVideoOff?: boolean
    meetId?: string
  }
}

const getFullName = (user: User) => user.firstName + " " + user.lastName

const TRIES_LIMIT = 7
let RETRY_ATTEMPT: number = 0

const useWebRtc = (
  instanceMeetingOwner: boolean,
  invitedParticipants: User[]
) => {
  const [localStream, setLocalStream] = useState<LocalStream | null>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const [participants, setParticipants] = useState<User[]>([])
  const [error, setError] = useState<any | string | null>(null)

  const { data: authMeData } = useAuthMeQuery()
  const userRefId = useRef<string | number>()
  userRefId.current = authMeData?.id

  const [usersAudioTrackToIdMap, setUsersAudioTrackToIdMap] =
    useState<IUsersAudioTrackToIdMap>({})
  const [usersVideoTrackToIdMap, setUsersVideoTrackToIdMap] =
    useState<IUsersVideoTrackToIdMap>({})

  const [remoteVideoStreams, setRemoteVideoStreams] = useState<VideoStream[]>([])
  const [remoteAudioStreams, setRemoteAudioStreams] = useState<AudioStream[]>([])

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const elapsedTimeRef = useRef<number>(0)

  const [messages, setMessages] = useState<any[]>([])

  const { reset, goBack } = useNavigation<ROUTES>()
  const route = useRoute<RouteProp<ParamList, "Detail">>()
  const [isMuted, setIsMuted] = useState(!!route.params?.isMuted)
  const [isVideoOff, setIsVideoOff] = useState(route.params?.isVideoOff)
  const [isScreenShare, setIsScreenShare] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isCameraSwitched, setIsCameraSwitched] = useState(false)

  const roomId = route?.params?.meetId
  const meetId = route.params?.meetId

  const [isSttSocketConnected, setIsSttSocketConnected] = useState(false);

  const { socket, scalerMachineUrl } = useWebRtcSocketConnection(roomId!, isSttSocketConnected);
  const [scalerFindFreeMachinePairSTT] = useScalerFindFreeMachinePairSTTMutation();

  const [saveCalendarEventsLog] = useSaveCalendarEventsLogMutation()
  const eventStartedTimeRef = useRef(0)
  const [getUsersById] = useGetUsersByIdMutation()

  const { data: getCalendarEventByHashData } = useGetCalendarEventByHashQuery({
    hash: String(route?.params?.hash),
  })

  const invitedParticipantsRef = useRef<User[]>(invitedParticipants || [])

  // const socketRef = useRef<Socket | null>(null)

  const sttUrlRef = useRef<string | null>(null)

  const offerStatusCheckRef = useRef<ReturnType<typeof setInterval>>()

  const STTSocket = useRef<WebSocket | null>(null)

  const accessMeetingSocketRef = useRef<Socket | null>()

  const sttLanguageRef = useRef<string>(
    authMeData?.inputLanguage?.code?.toLowerCase?.() || "en"
  )
  const allLanguagesRef = useRef<string[]>(["en", "hi"]) // Default to 'en' and 'hi'
  const pendingCandidates: RTCIceCandidate[] = []

  const [translatedSubtitles, setTranslatedSubtitles] = useState<string[]>([])

  const screenTrackMidIdRef = useRef<string>()

  const speechLanguage = useRef("")

  const wsRef = useRef<WebSocket | null>(null)

  const messagesChannelRef = useRef<RTCDataChannel | null>(null)
  const drawChannelRef = useRef<RTCDataChannel | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [clearCanvas, setClearCanvas] = useState(false)

  const participantsRef = useRef<UserInMeeting[] | null>(null)

  const recordingNameRef = useRef<any>()
  const recordingUrl = useRef("")

  const candidatesManager = useRef(
    createCandidatesManager(peerConnection)
  ).current

  const isRecordingStarted = useRef(false);

  const [sharedScreen, setSharedScreen] = useState<MediaStreamTrack | null>(
    null,
  );
  const sharingOwnerRef = useRef<string | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const sharePeerConnection = useRef<RTCPeerConnection | null>(null);

  const candidatesShareManager = useRef(
    createCandidatesManager(sharePeerConnection),
  ).current;

  const isSttConnected = useRef(false);
  const isShouldSttConnectionClose = useRef(false)

  const retryLimit = 3;
  const attemptCounter = useRef(0);

  // useEffect(() => {
  //   if(socket){
  //     console.log(socket, 'socketsocketsocketsocketsocketsocketsocketsocket');

  //     socketRef.current = socket
  //   }
  // }, [socket])

  const sendChunkToServer = useCallback(async (base64Chunk: any, type: string) => {
    try {
      // await saveChunkToFile(base64Chunk)
      if (!isRecordingStarted.current) return
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            fileName: recordingNameRef.current,
            fileExtension: type === "audio" ? "raw" : "h264",
            chunks: base64Chunk,
            action: "stream",
            platform: Platform.OS,
            mediaType: type,
            streamGroup: recordingNameRef.current,
          })
        )
        console.log(type, "chunk sent", Platform.OS)
      }
    } catch (error) {
      console.error("Failed to send chunk:", error)
    }
  }, [isRecordingStarted.current, wsRef.current?.readyState])

  const sendSttAudio = useCallback((data: string) => {
    if (!isMuted) {
      addToBufferAndSend(
        data,
        sttLanguageRef.current?.toLowerCase?.() || "en",
        allLanguagesRef.current
      )
    }
  }, [isMuted])

  const {
    startRecording,
    stopRecording,
    isRecording: isScreenRecording,
  } = useScreenRecorder({
    onChunkReceived: sendChunkToServer,
  })

  const { onStartRecord, onStopRecord } = useAudioRecorder({
    sendChunkToServer,
    sendSttAudio,
  })

  useEffect(() => {
    participantsRef.current = participants as any
  }, [participants])

  useEffect(() => {
    if (localStream) {
      const { audioTrack, videoTrack } = localStream

      if (audioTrack) {
        audioTrack.enabled = !isMuted
      } else {
        console.warn("No audio track available in localStream")
      }

      if (videoTrack) {
        videoTrack.enabled = !isVideoOff
      } else {
        console.warn("No video track available in localStream")
      }
    } else {
      console.warn("localStream is not defined")
    }
  }, [localStream, isMuted, isVideoOff])

  const handleFreeMachinePairSTT = async () => {
    try {
      const sttRes = await scalerFindFreeMachinePairSTT({
        id: String(meetId),
      }).unwrap()
      console.log(sttRes, 'sttRessttRessttRessttRessttRes');
      
      sttUrlRef.current = `wss://${sttRes.stt}`
    } catch (error) {
      console.log(error, 'scalerFindFreeMachinePairSTT');
    }
  }

  const setupSocket = useCallback(async () => {
    if (!socket && roomId && scalerMachineUrl) {
      recordingUrl.current = `https://${scalerMachineUrl}:8080`;
      try {
        // peerConnection.current = createPeerConnection()
        peerConnection.current = createPeerConnection({
          socket,
          roomId,
          setRemoteVideoStreams,
          setRemoteAudioStreams,
          participantsRef: participantsRef as any,
          setTranslatedSubtitles: setTranslatedSubtitles as any,
          messagesChannelRef,
          drawChannelRef,
          endCall,
          startCall,
          type: PeerConnectionType.USER,
        })
      } catch (error) {
        console.log(error, "error startCall")
        setError(true)
      }
    }

    if (socket && !socket.connected) {
      socket.connect()
    }

    if (socket) {
      socket.onAny(handleOnAny)
      socket.on("offer", handleOffer)
      socket.on("answer", handleAnswer)
      socket.on("candidate", handleCandidate)
      socket.on("user-joined", handleUserJoined)
      socket.on("room-languages", handleRoomLanguages)
      socket.on("mute-audio", userToggledMedia)
      socket.on("unmute-audio", userToggledMedia)
      socket.on("mute-video", userToggledMedia)
      socket.on("unmute-video", userToggledMedia)

      socket.on("participant-room-info", handleParticipantRoomInfo)

      socket.on(UserActions.StartShareScreen, handleStartSharing)
      socket.on(UserActions.StopShareScreen, handleStopSharing)

      socket.on("transceiver-info", handleTransceiver)
      socket.on("client-disconnected", handleClientDisconnected)
      socket.on("error", handleSocketError)
      socket.on("chat-message", handleChatMessage)
      socket.on("start-recording", handleStartRecording)
      socket.on("stop-recording", handleStopRecording)

      setTimeout(() => {
        startCall()
      }, 2000)
    }
  }, [socket, roomId, scalerMachineUrl])

  useEffect(() => {
    if (!sttUrlRef.current) {
      handleFreeMachinePairSTT();
    }
    setupSocket()
    // return () => {
    //   if (socket) {
    //     disconnectSocketEvents()
    //     // endCall();
    //   }
    // }
  }, [roomId, sttUrlRef.current, scalerMachineUrl, socket])

  useEffect(() => {
    if (socket?.id && STTSocket.current && userRefId.current && isSttSocketConnected) {
      STTSocket.current?.send(
        JSON.stringify({
          uid: `speaker-${userRefId.current}-${socket?.id}`,
          language: sttLanguageRef.current,
          task: "transcribe",
          model: "large-v3",
          use_vad: true,
        })
      )
      console.log("STT SEND: ")
    }
  }, [socket?.id, STTSocket.current, userRefId.current, isSttSocketConnected])


  const receivedFinish = () => {
    setTimeout(() => {
      setClearCanvas(true)
      setPoints([])
    }, 2000)
  }

  const handleStartRecording = ({ socketId }: {
    socketId: string;
    status: ActionStatus;
  }) => {
    Toast.show({
      type: "success",
      text1: t("RecordingStarted"),
    })
  };

  const handleStopRecording = () => {
    Toast.show({
      type: "success",
      text1: t("RecordingStopped"),
    })
  };

  const handleRoomLanguages = ({ languages }: { languages: string[] }) => {
    if (languages) {
      allLanguagesRef.current = languages
    }
  }

  const handleDrawingData = (data: string) => {
    try {
      const parsedData = JSON.parse(data)
      if (parsedData.type === "draw") {
        setPoints((prevPoints) => [
          ...prevPoints,
          {
            x: parsedData.xRatio * (screenWidth * 0.9),
            y: parsedData.yRatio * (screenHeight * 0.3),
          },
        ])
      } else if (parsedData.type === "end") {
        receivedFinish()
      }
    } catch (e) {
      console.error("Error parsing drawing data", e)
    }
  }

  const handleStartSharing = ({ socketId }: { socketId: string }) => {
    setIsScreenSharing(true);
    sharingOwnerRef.current = socketId;
  };

  const handleStopSharing = () => {
    setIsScreenSharing(false);
    sharingOwnerRef.current = null;
  };


  const onSTTSocketMessage = (event: WebSocketMessageEvent) => {
    console.log("onSTTSocketMessage: ", JSON.parse(event.data))
  }

  const disconnectSocketEvents = () => {
    if (socket) {
      const events = [
        "offer",
        "answer",
        "candidate",
        "user-joined",
        "client-disconnected",
        "chat-message",
        "transceiver-info",
        "error",
        "mute-audio",
        "unmute-audio",
        "mute-video",
        "unmute-video",
        "participant-room-info",
        "room-languages",
        "start-share-screen",
        "stop-share-screen",
        "start-recording",
        "stop-recording",
      ]

      events.forEach((event) => socket?.off(event))
    }
  }

  const handleSocketError = ({ error }: any) => {
    console.log("Socket error:", error.message)
    setError(error)
  }

  const checkPeerConnection = (func: () => void) => {
    const interval = setInterval(() => {
      if (peerConnection.current?.signalingState === "stable") {
        clearInterval(interval)
        func()
      } else {
        console.warn("Waiting for peer connection to stabilize...")
        return
      }
    }, 2000)
  }

  const startCall = async () => {
    try {
      socket?.emit("join", {
        roomId,
        language: authMeData?.outputLanguage?.code?.toLowerCase() || "en",
        meetId: meetId,
        status: {
          isAudioOn: !isMuted,
          isVideoOn: !isVideoOff,
          isSharingOn: false,
          isRecordingOn: false,
        },
        isOwner: instanceMeetingOwner,
        username: getFullName(authMeData as any),
      })
      if (!timerRef.current) {
        startTimeRef.current = Date.now()
        timerRef.current = setInterval(() => {
          elapsedTimeRef.current = Date.now() - (startTimeRef.current || 0)
        }, 1000)
      }
      eventStartedTimeRef.current = moment().unix()
    } catch (error) {
      console.error("Error starting call:", error)
    }
  }

  const endCall = () => {
    stopLocalStreamTracks()

    remoteAudioStreams?.forEach((stream) => stream?.audioTrack?.stop?.())
    remoteAudioStreams?.forEach((stream) => stream?.audioTrack?.release?.())
    remoteVideoStreams?.forEach((stream) => stream?.videoTrack?.stop?.())
    remoteVideoStreams?.forEach((stream) => stream?.videoTrack?.release?.())

    if (peerConnection.current) {
      peerConnection.current?.close()
      peerConnection.current = null
    }

    if (sharePeerConnection.current) {
      sharePeerConnection.current?.close()
      sharePeerConnection.current = null
    }

    if (STTSocket.current) {
      isShouldSttConnectionClose.current = true;
      STTSocket.current.close()
      STTSocket.current = null
    }

    disconnectSocketEvents()
    drawChannelRef.current?.removeEventListener("message", handleDrawMessage)
    drawChannelRef.current?.close?.()
    messagesChannelRef?.current?.removeEventListener("message")
    messagesChannelRef.current?.close?.();
    attemptCounter.current = 0
    setRemoteVideoStreams([])
    setRemoteAudioStreams([])
    setParticipants([])

    if (socket) {
      socket?.disconnect();
      socket?.close()
      // socket = null
    }

    saveCalendarEventsLog({
      durationInSeconds: moment().unix() - eventStartedTimeRef.current,
      event: {
        id: getCalendarEventByHashData?.id!,
      },
    })

    reset({
      index: 0,
      routes: [{ name: ScreensEnum.MAIN }],
    })
  }

  const stopLocalStreamTracks = () => {
    if (localStream) {
      if (localStream.audioTrack) {
        localStream.audioTrack.enabled = false
        localStream.audioTrack.stop()
        localStream.audioTrack.release()
        localStream.audioTrack = null
      }

      if (localStream.videoTrack) {
        localStream.videoTrack.enabled = false
        localStream.videoTrack.stop()
        localStream.videoTrack.release()

        localStream.videoTrack = null
      }
      const localStreamClone: any = localStream
      localStreamClone?.getTracks?.()?.forEach((track: any) => {
        track?.stop?.();
        track?.release?.();
      });
    }
    setLocalStream(null)
  }

  const handleOfferCheck = async () => {
    try {
      RETRY_ATTEMPT++
      if (RETRY_ATTEMPT > TRIES_LIMIT)
        throw new Error("Something wrong with connection")
      if (peerConnection.current?.signalingState !== "stable") return

      const offer = await peerConnection.current.createOffer({})
      await peerConnection.current.setLocalDescription(offer)
      socket!.emit("offer", {
        sdp: peerConnection.current.localDescription,
        roomId,
      })

      clearInterval(offerStatusCheckRef.current)
      if (RETRY_ATTEMPT) RETRY_ATTEMPT = 0
      return
    } catch (error) {
      console.error("Error obtaining media:", error)
      clearInterval(offerStatusCheckRef.current)
    }
  }

  const handleOffer = async ({ sdp, peerType }: { sdp: RTCSessionDescription, peerType: string }) => {
    if (peerType === PeerConnectionType.SHARING) {
      try {
        if (!sharePeerConnection.current) {
          sharePeerConnection.current = createPeerConnection({
            setSharedScreen,
            type: PeerConnectionType.SHARING,
          });

          sharePeerConnection.current.addTransceiver('video', {
            direction: 'recvonly',
          });
        }

        const polite = true;
        const offerCollision =
          sharePeerConnection.current.signalingState === 'have-local-offer' ||
          sharePeerConnection.current.signalingState === 'have-remote-offer';
        const ignoreOffer = !polite && offerCollision;

        if (ignoreOffer) {
          console.warn('🚫 Ignoring offer due to collision');
          return
        }

        const offer = new RTCSessionDescription(sdp);

        await sharePeerConnection.current.setRemoteDescription(offer);
        await candidatesShareManager.flushCandidates();

        const answer = await sharePeerConnection.current.createAnswer();
        await sharePeerConnection.current.setLocalDescription(answer);

        if (sharePeerConnection.current.localDescription) {
          socket?.emit('answer', {
            sdp: sharePeerConnection.current.localDescription,
            roomId,
            type: PeerConnectionType.SHARING,
          });
        } else {
          console.error('❌ Local description is null');
        }
      } catch (error) {
        console.error('❌ Error processing offer:', error);
      }
      return
    }

    if (peerType === PeerConnectionType.USER) {
      if (!peerConnection.current) {
        peerConnection.current = createPeerConnection({
          socket,
          roomId,
          setRemoteVideoStreams,
          setRemoteAudioStreams,
          participantsRef: participantsRef as any,
          setTranslatedSubtitles: setTranslatedSubtitles as any,
          messagesChannelRef,
          drawChannelRef,
          endCall,
          startCall,
          type: PeerConnectionType.USER,
        });
        // peerConnection.current = createPeerConnection()
      }
      try {
        const polite = true;
        const offerCollision =
          peerConnection.current.signalingState === 'have-local-offer' ||
          peerConnection.current.signalingState === 'have-remote-offer';
        const ignoreOffer = !polite && offerCollision;

        if (ignoreOffer) {
          return;
        }

        RETRY_ATTEMPT++
        if (RETRY_ATTEMPT > TRIES_LIMIT)
          throw new Error("Something wrong with connection")
        if (peerConnection.current?.signalingState !== "stable") return
        const offer = new RTCSessionDescription(sdp)
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        )
        await flushCandidates()
        const answer = await peerConnection.current.createAnswer()
        await peerConnection.current.setLocalDescription(answer)
        if (peerConnection.current?.localDescription) {
          const localDescription = peerConnection.current
            .localDescription as RTCSessionDescription
          socket?.emit("answer", { sdp: localDescription, roomId })
          clearInterval(offerStatusCheckRef.current)
          if (RETRY_ATTEMPT) RETRY_ATTEMPT = 0
        } else {
          console.error("Local description is null")
        }
      } catch (error) {
        console.error("RTC Error processing offer:", error)
      }
    }
  }

  const handleAnswer = async ({ sdp, peerType }: RTCAnswerPayload) => {
    if (peerType === PeerConnectionType.SHARING) {
      try {
        if (sharePeerConnection.current) {
          if (sharePeerConnection.current.signalingState === 'stable') {
            console.warn('Answer ignored: already stable');
            return;
          }

          await sharePeerConnection.current.setRemoteDescription(
            new RTCSessionDescription(sdp),
          );
        }
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
      return;
    }
    if (peerType === PeerConnectionType.USER) {
      try {
        if (peerConnection.current) {
          if (peerConnection.current.signalingState === 'stable') {
            console.warn('Answer ignored: already stable');
            return;
          }

          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(sdp),
          );
        }
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    }
  };

  const handleUserJoined = async ({
    userId,
    participantsInfo,
    socketId,
  }: {
    userId: string
    participantsInfo: ParticipantsInfo[]
    socketId: string
  }) => {
    try {
      const anySharingOn = participantsInfo.some((p) => p.status.isSharingOn);

      if (anySharingOn) {
        const sharingOwner = participantsInfo.find(
          (p) => p.status.isSharingOn === true,
        );
        sharingOwnerRef.current = sharingOwner?.socketId || '';
      }
      if (socketId === socket?.id) {
        if (!sharePeerConnection.current) {
          sharePeerConnection.current = createPeerConnection({
            setSharedScreen,
            type: PeerConnectionType.SHARING,
          });
        }
        socket?.emit('sharing-peer', {
          roomId,
        });
        setIsScreenSharing(anySharingOn);
      }
      onStartRecord()
    } catch (error) {
      console.log(error, 'error createSharePeerConnection');
    }
    try {
      const usersAudioVideoMap: Record<
        string,
        { isAudioOn: boolean; isVideoOn: boolean; socketId: string }
      > = {}
      participantsInfo.forEach((participant) => {
        usersAudioVideoMap[participant.socketId] = {
          isAudioOn: participant.status.isAudioOn,
          isVideoOn: participant.status.isVideoOn,
          socketId: participant.socketId,
        }
      })

      setParticipants((_prev: any): any => {
        const newUsers = participantsInfo.map(({ userId, socketId }) => {
          const {
            firstName = "Guest",
            lastName = "",
            photo = null,
          } = invitedParticipantsRef?.current?.find?.(
            (invitedParticipants) => userId === invitedParticipants?.id
          ) || {}
          return {
            userId,
            socketId,
            firstName,
            lastName,
            photo,
            isAudioOn: usersAudioVideoMap[socketId].isAudioOn,
            isVideoOn: usersAudioVideoMap[socketId].isVideoOn,
          }
        })
        return [
          // ...prev,
          ...newUsers,
        ]
      })

      const anySharingOn = participantsInfo.some((p) => p.status.isSharingOn)

      setIsScreenShare(anySharingOn)

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      if (userRefId.current) {
        setLocalStream({
          socketId: socket?.id ?? "",
          audioTrack: stream.getAudioTracks()[0] || null,
          videoTrack: stream.getVideoTracks()[0] || null,
        })
      }

      if (!peerConnection.current) {
        // peerConnection.current = createPeerConnection()
        peerConnection.current = createPeerConnection({
          socket,
          roomId,
          setRemoteVideoStreams,
          setRemoteAudioStreams,
          participantsRef: participantsRef as any,
          setTranslatedSubtitles: setTranslatedSubtitles as any,
          messagesChannelRef,
          drawChannelRef,
          endCall,
          startCall,
          type: PeerConnectionType.USER,
        })
      }

      stream.getTracks().forEach((track) => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream)
          const [audioTrack] = stream.getAudioTracks()
          setUsersAudioTrackToIdMap((prevMap) => ({
            ...prevMap,
            transceiverId: audioTrack?.id,
            userId: userId,
          }))
        }
      })
      if (offerStatusCheckRef.current) {
        clearInterval(offerStatusCheckRef.current)
      }
      handleOfferCheck()
      // checkPeerConnection(handleOfferCheck)
    } catch (error) {
      console.error("Error handling user join:", error)
    }
  }

  const handleDrawMessage = (event: any) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === "start") {
        handleDrawingData(event.data)
      } else if (data.type === "draw") {
        handleDrawingData(event.data)
      } else if (data.type === "end") {
        receivedFinish()
      }
    } catch (e) {
      console.error("Error parsing draw event:", e)
    }
  }

  useEffect(() => {
    if (!drawChannelRef.current) {
      return
    }

    drawChannelRef.current.addEventListener("message", handleDrawMessage)
    return () => {
      drawChannelRef.current?.removeEventListener('message', handleDrawMessage);
    };
  }, [drawChannelRef.current]);

  const flushCandidates = async () => {
    for (const candidate of pendingCandidates) {
      try {
        if (!candidate.sdpMid && candidate.sdpMLineIndex === null) {
          console.warn(
            "Skipping ICE candidate with null sdpMid and sdpMLineIndex."
          )
          continue
        }
        await peerConnection.current?.addIceCandidate(
          new RTCIceCandidate(candidate)
        )
        console.log("Buffered ICE candidate added.")
      } catch (error) {
        console.error("Error adding buffered ICE candidate:", error)
      }
    }
    pendingCandidates.length = 0
  }

  const handleCandidate = ({ candidate, peerType }: RTCCandidatePayload) => {
    if (peerType === PeerConnectionType.USER) {
      candidatesManager.addCandidate(candidate)
    }
    if (peerType === PeerConnectionType.SHARING) {
      candidatesShareManager.addCandidate(candidate);
    }
  };

  useEffect(() => {
    if (authMeData?.inputLanguage?.code) {
      sttLanguageRef.current = authMeData?.inputLanguage?.code
    }
  }, [authMeData?.inputLanguage?.code])

  const handleChangedRoomLanguage: any = (language: string) => {
    console.log("handleChangedRoomLanguage: ", language)
    sttLanguageRef.current = language?.toLowerCase()
    socket?.emit("change-language", {
      roomId,
      language: language?.toLowerCase(),
    })
  }

  const handleTransceiver = async ({
    mid,
    kind,
    type,
    socketId,
  }: {
    mid: string | null
    kind: string
    type: string
    socketId: string
  }) => {
    if (mid) {
      const midId = Number(mid)
      if (type === "screen") {
        screenTrackMidIdRef.current = mid
        return
      }
      if (kind === "audio") {
        setUsersAudioTrackToIdMap((prevMap) => ({
          ...prevMap,
          [midId]: socketId,
        }))
      } else if (kind === "video") {
        setUsersVideoTrackToIdMap((prevMap) => ({
          ...prevMap,
          [midId]: socketId,
        }))
      }
    }
  }

  const handleChatMessage = (data: any) => {
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    setMessages((prev) => [
      ...prev,
      {
        ...data,
        time: currentTime,
      },
    ])
  }

  const sendMessage = (data: any) => {
    const { message } = data
    socket?.emit("chat-message", {
      roomId,
      message,
    })
  }

  const handleClientDisconnected = ({ socketId }: { socketId: string }) => {
    setRemoteVideoStreams((prev) =>
      prev.filter((stream) => {
        const midId = Number(stream.midId)
        const userIdMap = usersVideoTrackToIdMap[midId]

        return userIdMap !== socketId
      })
    )

    setRemoteAudioStreams((prev) =>
      prev.filter((stream) => {
        const midId = Number(stream.midId)
        const userIdMap = usersAudioTrackToIdMap[midId]
        return userIdMap !== socketId
      })
    )

    setUsersVideoTrackToIdMap((prevMap) => {
      const updatedMap = { ...prevMap }
      Object.keys(updatedMap).forEach((key) => {
        if (updatedMap[Number(key)] === socketId) {
          delete updatedMap[Number(key)]
        }
      })
      return updatedMap
    })

    setUsersAudioTrackToIdMap((prevMap) => {
      const updatedMap = { ...prevMap }
      Object.keys(updatedMap).forEach((key) => {
        if (updatedMap[Number(key)] === socketId) {
          delete updatedMap[Number(key)]
        }
      })
      return updatedMap
    })

    setParticipants((prev) => prev.filter((user) => user.socketId !== socketId))
  }

  const handleOnAny = (_eventName: string, ..._args: any[]) => {
    // console.log(`!!!!! Incoming event: ${eventName} !!!!`, args);
  }

  const toggleSpeaker = () => {
    if (isSpeakerOn) {
      inCallManager.setForceSpeakerphoneOn(false)
      setIsSpeakerOn(false)
    } else {
      inCallManager.setForceSpeakerphoneOn(true)
      setIsSpeakerOn(true)
    }
  };

  const switchCamera = () => {
    if (localStream) {
      const videoTrack = localStream?.videoTrack
      if (videoTrack && typeof videoTrack._switchCamera === "function") {
        videoTrack._switchCamera()
        setIsCameraSwitched(true)
      }
    }
  }

  useEffect(() => {
    if (authMeData && !sttLanguageRef.current) {
      sttLanguageRef.current =
        authMeData?.inputLanguage?.code?.toLowerCase?.() || "en"
    }
  }, [authMeData, sttLanguageRef.current])

  let collectorAr: Float32Array[] = []

  const addToBufferAndSend = async (
    data: string,
    language: string,
    sttLanguages: string[]
  ) => {
    try {
      if (STTSocket.current?.readyState === WebSocket.OPEN) {
        const arrayBuffer = base64ToFloat32Array(data)

        collectorAr.push(resampleTo16kHZ(arrayBuffer))
        if (collectorAr?.length !== 4) return
        const audio = Float32ConcatAll(collectorAr)
        const packet = {
          speakerLang: language,
          allLangs: sttLanguages,
          audio: float32ArrayToBase64(audio),
          disableSentenceCutter: true,
          prompt: "universal"
        }
        collectorAr = []
        STTSocket.current.send(JSON.stringify(packet))
      } else {
        console.warn("WebSocket is not open. Saving audio locally.")
      }
    } catch (error) {
      console.error("Error processing and sending audio data:", error)
    }
  }

  useEffect(() => {
    if (sttUrlRef.current && !isSttConnected.current && attemptCounter.current < retryLimit) {
      isSttConnected.current = true;
      handleSetSTTSocket({ sttUrl: sttUrlRef.current });
      attemptCounter.current += 1;
    }
  }, [sttUrlRef.current, isSttConnected]);


  const handleSetSTTSocket = ({ sttUrl }: { sttUrl: string }) => {
    STTSocket.current = new WebSocket(sttUrl);

    STTSocket.current.onopen = onSTTSocketOpen;
    STTSocket.current.onmessage = onSTTSocketMessage;

    STTSocket.current.onerror = (error) => {
      console.log("STTError: ", error);
      if(isShouldSttConnectionClose.current) return
      if (attemptCounter.current < retryLimit) {
        console.log(`Retry attempt ${attemptCounter.current} failed. Retrying...`);
        handleSetSTTSocket({ sttUrl }); // Retry connecting
      } else {
        console.log('Max retry attempts reached. Could not connect.');
      }

      STTSocket.current?.close();
      isSttConnected.current = false;
    };

    STTSocket.current.onclose = (event) => {
      console.log("STTOnclose: ", event);
      if(isShouldSttConnectionClose.current) return
      if (attemptCounter.current < retryLimit) {
        handleSetSTTSocket({ sttUrl });
        attemptCounter.current += 1;
      } else {
        navigationRef.current?.goBack();
        Toast.show({
          type: 'error',
          text1: event?.reason || 'Connection to media servers cannot be established, please consider rejoining',
        });
      }
      isSttConnected.current = false;
    };
  };

  const onSTTSocketOpen = () => {
    setIsSttSocketConnected(true)
  }

  const toggleMedia = async (type: "audio" | "video") => {
    if (!peerConnection || !localStream || !socket) {
      return;
    }

    const isAudio = type === 'audio';
    const track = isAudio ? localStream.audioTrack : localStream.videoTrack;
    if (!track) {
      return;
    }

    track.enabled = isAudio ? Boolean(isMuted) : Boolean(isVideoOff)

    setLocalStream((prev) => ({
      ...prev!,
      [isAudio ? "audioTrack" : "videoTrack"]: track,
    }))

    if (isAudio) {
      setIsMuted((prev) => !prev)
    } else {
      setIsVideoOff((prev) => !prev)
    }

    const action = track.enabled
      ? isAudio
        ? UserActions.UnmuteAudio
        : UserActions.UnmuteVideo
      : isAudio
        ? UserActions.MuteAudio
        : UserActions.MuteVideo

    socket?.emit("action", {
      roomId,
      action,
      socketId: socket.id,
    })

    console.log(`Media toggled: ${type}, new state: ${track.enabled}`)
  }

  const userToggledMedia = ({
    socketId,
    status,
  }: {
    socketId: string
    status: ActionStatus
  }) => {
    setParticipants((prev) =>
      prev.map((participant) =>
        participant.socketId === socketId
          ? {
            ...participant,
            isAudioOn: status.isAudioOn,
            isVideoOn: status.isVideoOn,
          }
          : participant
      )
    )
  }

  const handleParticipantRoomInfo = async ({
    participantsInfo,
  }: {
    participantsInfo: ParticipantsInfo[]
  }) => {
    const usersAudioVideoMap: Record<
      string,
      { isAudioOn: boolean; isVideoOn: boolean; socketId: string }
    > = {}
    await prepareParticipants({
      participantsInfo,
      invitedParticipantsRef,
      setParticipants,
      getUsersById,
    })
  }

  useEffect(() => {
    if (getCalendarEventByHashData) {
      invitedParticipantsRef.current = [
        ...new Set(
          getCalendarEventByHashData?.participants.map(
            ({ user }: { user: any }) => user
          )
        ),
      ]
    }

    if (invitedParticipants?.length) {
      invitedParticipantsRef.current = [
        ...new Set([...invitedParticipantsRef.current, ...invitedParticipants]),
      ]
    }
  }, [getCalendarEventByHashData, invitedParticipants?.length])

  return {
    socket,
    localStream,
    isMuted,
    isVideoOff,
    messages,
    participants,

    roomId,
    meetId,

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
    subtitlesQueue: translatedSubtitles,

    localUserId: userRefId.current,
    localUserSocketId: socket?.id,
    wsRef,

    speechLanguage,
    handleChangedRoomLanguage,
    toggleMedia,
    startCall,
    endCall,
    sendMessage,
    toggleSpeaker,
    switchCamera,
    setLocalStream,
    sharedScreen,
    sharingOwner: sharingOwnerRef.current,
    points,
    clearCanvas,
    setClearCanvas,
    accessMeetingSocketRef,

    recordingUrl,
    onStopRecord,
    startRecording,
    stopRecording,
    isScreenRecording,
    recordingNameRef,

    isScreenSharing,
    isRecordingStarted,
    setIsSpeakerOn,
  }
}

export default useWebRtc
