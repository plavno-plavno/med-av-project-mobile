import { useState, useEffect, useRef } from "react"
import { Socket } from "socket.io-client"
import { getSocket, initializeSocket } from "./webRtcSocketInstance"
import {
  mediaDevices,
  MediaStreamTrack,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import { useAuthMeQuery, useGetUsersByIdMutation } from "src/api/userApi/userApi"
import inCallManager from "react-native-incall-manager"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import AudioRecord from "react-native-audio-record"
import Config from "react-native-config"
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
import { isIOS } from "@utils/platformChecker"
import {
  useScalerFindFreeMachineMutation,
  useScalerFindFreeMachinePairSTTMutation,
} from "src/api/scalerApi/scalerApi"
import moment from "moment"
import { PeerConnectionType, UserInMeeting } from "@utils/meeting"
import { createPeerConnection } from "@utils/peerConnections"
import { useAudioRecorder } from "./useAudioRecorder"
import { Platform } from "react-native"
import { useScreenRecorder } from "./useScreenRecorder"
import { prepareParticipants } from "./settingUpParticipants"

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

const getFullName = (user: User) => user.firstName + ' ' + user.lastName;

// const config = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     { urls: "stun:stun1.l.google.com:19302" },
//     { urls: "stun:stun2.l.google.com:19302" },
//     { urls: "stun:stun3.l.google.com:19302" },
//     { urls: "stun:stun4.l.google.com:19302" },
//   ],
// }

const config = {
  iceServers: [
    { urls: 'stun:51.21.247.138:3478' },
    { 
      urls: 'turn:51.21.247.138:3478',
      username: 'turnuser',
      credential: 'turnpassword'
    },
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};


const sttUrl = Config.STT_URL

const SUBTITLES_QUEUE_LIMIT = 3
const TRIES_LIMIT = 7
let RETRY_ATTEMPT: number = 0

const useWebRtc = (instanceMeetingOwner: boolean, invitedParticipants: User[]) => {
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

  const [remoteVideoStreams, setRemoteVideoStreams] = useState<VideoStream[]>(
    []
  )
  const [remoteAudioStreams, setRemoteAudioStreams] = useState<AudioStream[]>(
    []
  )

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

  const [scalerFindFreeMachine] = useScalerFindFreeMachineMutation()
  const [scalerFindFreeMachinePairSTT] =
    useScalerFindFreeMachinePairSTTMutation()

  const [saveCalendarEventsLog] = useSaveCalendarEventsLogMutation()
  const eventStartedTimeRef = useRef(0)
  const [getUsersById] = useGetUsersByIdMutation()

  const { data: getCalendarEventByHashData } = useGetCalendarEventByHashQuery({
    hash: String(route?.params?.hash),
  })

  const invitedParticipantsRef = useRef<User[]>(invitedParticipants ||[])

  const socketRef = useRef<Socket | null>(null)

  const sttUrlRef = useRef<string | null>(null)

  const offerStatusCheckRef = useRef<ReturnType<typeof setInterval>>()

  const STTSocket = useRef<WebSocket | null>(null)

  const accessMeetingSocketRef = useRef<Socket | null>()

  const sttLanguageRef = useRef<string>(
    authMeData?.inputLanguage?.code?.toLowerCase?.() || "en"
  )
  const allLanguagesRef = useRef<string[]>(["en", "hi"]) // Default to 'en' and 'hi'
  const pendingCandidates: RTCIceCandidate[] = []

  let isRecording = false
  const [translatedSubtitles, setTranslatedSubtitles] = useState<ISubtitle[]>([])

  let collectorAr: Float32Array[] = []
  const screenTrackMidIdRef = useRef<string>()

  const speechLanguage = useRef("")

  const wsRef = useRef<WebSocket | null>(null)

  const messagesChannelRef = useRef<RTCDataChannel | null>(null)
  const drawChannelRef = useRef<RTCDataChannel | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [clearCanvas, setClearCanvas] = useState(false)

  const participantsRef = useRef<UserInMeeting[] | null>(null);

  const recordingNameRef = useRef<any>()
  const recordingUrl = useRef('');

  const sendChunkToServer = async (base64Chunk: any, type: string) => {
    try {
      // await saveChunkToFile(base64Chunk)
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            fileName: recordingNameRef.current,
            fileExtension: type === 'audio' ? 'raw' : "h264",
            chunks: base64Chunk,
            action: "stream",
            platform: Platform.OS,
            mediaType: type,
            streamGroup: recordingNameRef.current,
          })
        )
        console.log(type, 'chunk sent', Platform.OS);
      }
    } catch (error) {
      console.error("Failed to send chunk:", error)
    }
  }

  const sendSttAudio = (data: string) => {
    if(!isMuted){
      addToBufferAndSend(
        data,
        sttLanguageRef.current?.toLowerCase?.() || "en",
        allLanguagesRef.current
      )
    }
  }
  const { onStartRecord, onStopRecord } = useAudioRecorder({ sendChunkToServer, sendSttAudio })
  const { startRecording, stopRecording, isRecording: isScreenRecording } = useScreenRecorder({
    onChunkReceived: sendChunkToServer,
  })

  useEffect(() => {
    participantsRef.current = participants as any;
  }, [participants]);


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

  useEffect(() => {
    const setupSocket = async () => {
      if (!socketRef.current && roomId) {
        try {
          const scalerFindFreeMachineData = await scalerFindFreeMachine({
            id: roomId,
          }).unwrap()
          await scalerFindFreeMachinePairSTT({ id: roomId! })
          await new Promise((resolve) => setTimeout(resolve, 2000))
          const rtcUrl = `https://${scalerFindFreeMachineData?.ip}${
            scalerFindFreeMachineData?.port
              ? ":" + scalerFindFreeMachineData?.port
              : ":5000"
          }`
          await initializeSocket(rtcUrl)
          recordingUrl.current = `https://${scalerFindFreeMachineData?.ip}:8080`;
          socketRef.current = getSocket()
          peerConnection.current = createPeerConnection({
            socketRef,
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
          setTimeout(() => {
            startCall()
          }, 2000)
        } catch (error) {
          console.log(error, 'error startCall');
          setError(true)
        }
      }

      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect()
      }

      if (socketRef.current) {
        socketRef.current.onAny(handleOnAny)
        socketRef.current.on("offer", handleOffer)
        socketRef.current.on("answer", handleAnswer)
        socketRef.current.on("candidate", handleCandidate)
        socketRef.current.on("user-joined", handleUserJoined)
        socketRef.current.on("room-languages", handleRoomLanguages)
        socketRef.current.on("mute-audio", userToggledMedia)
        socketRef.current.on("unmute-audio", userToggledMedia)
        socketRef.current.on("mute-video", userToggledMedia)
        socketRef.current.on("unmute-video", userToggledMedia)

        socketRef.current.on("participant-room-info", handleParticipantRoomInfo)

        socketRef.current.on(UserActions.StartShareScreen, handleStartSharing)
        socketRef.current.on(UserActions.StopShareScreen, handleStopSharing)

        socketRef.current.on("transceiver-info", handleTransceiver)
        socketRef.current.on("client-disconnected", handleClientDisconnected)
        socketRef.current.on("error", handleSocketError)
        socketRef.current.on("chat-message", handleChatMessage)
      }
    }

    setupSocket()

    return () => {
      if (socketRef.current) {
        disconnectSocketEvents()
      }
    }
  }, [roomId])

  const receivedFinish = () => {
    setTimeout(() => {
      setClearCanvas(true)
      setPoints([])
    }, 2000)
  }

  const handleRoomLanguages = ({ languages }: { languages: string[] }) => {
    if (languages) {
      allLanguagesRef.current = languages
    }
  }

  const handleDrawingData = (data: string) => {
    try {
      const parsedData = JSON.parse(data)
      console.log(parsedData.type, "parsedData.type")

      if (parsedData.type === "draw") {
        setPoints((prevPoints) => [
          ...prevPoints,
          {
            x: parsedData.xRatio * (screenWidth * 0.9),
            y: parsedData.yRatio * (screenHeight * 0.5),
          },
        ])
      } else if (parsedData.type === "end") {
        receivedFinish()
      }
    } catch (e) {
      console.error("Error parsing drawing data", e)
    }
  }

  const setupDataChannel = (
    channel: RTCDataChannel | null,
    type: "Messages" | "Draw"
  ) => {
    if (!channel) {
      return
    }

    channel.addEventListener("open", () => {
      console.log(`Data channel [${type}] opened`)
    })

    channel.addEventListener("message", (event) => {
      if (type === "Messages") {
        handlePeerDataChannelMessage(event?.data)
      } else if (type === "Draw") {
        handleDrawingData(event?.data as any)
      }
    })

    channel.addEventListener("close", () => {
      console.log(`Data channel [${type}] closed`)
    })

    channel.addEventListener("error", (error) => {
      console.error(`Data channel [${type}] error`, error)
    })
  }

  const handleStartSharing = ({ socketId }: { socketId: string }) => {
    setIsScreenShare(true)
  }

  const handleStopSharing = () => {
    // setSharingOwner(null)
    setIsScreenShare(false)
  }

  const onSTTSocketMessage = (event: WebSocketMessageEvent) => {
    // console.log("onSTTSocketMessage: ", JSON.parse(event.data))
    // const data = JSON.parse(event.data);
    // if(data) {
    //   const { segments } = JSON.parse(event.data.toString());
    //   if (segments) {
    //     const currentTime = new Date().toLocaleTimeString('en-US', {
    //       hour: '2-digit',
    //       minute: '2-digit',
    //       hour12: false,
    //     });
    //     const subtitles = segments.slice(-5).map((segment: { text: string }) => ({
    //       userName: userRefName.current ?? 'Guest',
    //       message: segment.text,
    //       time: currentTime,
    //     }));
    //     // eslint-disable-next-line no-console
    //     setSubtitlesQueue(handleSubtitles(data))
    //     console.log('STT messages', subtitles);
    //     setSubtitles(subtitles);
    //   }
    // }
  }

  const disconnectSocketEvents = () => {
    if (socketRef.current) {
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
        "screen-share-updated",
        "sharing-participant-joined",
        "participant-room-info",
        "room-languages",
        "start-share-screen",
        "stop-share-screen",
      ]

      events.forEach((event) => socketRef.current?.off(event))
    }
  }

  // const createPeerConnection = () => {
  //   if (peerConnection.current) {
  //     return peerConnection.current
  //   }
  //   try {
  //     const pc = new RTCPeerConnection(config)

  //     pc.addEventListener("icecandidate", ({ candidate }) => {
  //       console.log(candidate, "onIcecandidate")
  //       if (candidate) {
  //         socketRef.current?.emit("candidate", {
  //           candidate,
  //           roomId,
  //         })
  //       }
  //     })
  //     pc.addEventListener("connectionstatechange", () => {
  //       if (pc.connectionState === "failed") {
  //         // goBack();
  //         console.error(
  //           "Connection failed. Consider renegotiating or restarting the connection."
  //         )
  //       }
  //     })

  //     pc.addEventListener("datachannel", (event) => {
  //       const { channel } = event

  //       if (channel.label.startsWith(DataChannelNames.Messages)) {
  //         messagesChannelRef.current = channel
  //         setupDataChannel(messagesChannelRef.current, "Messages")
  //       } else if (channel.label.startsWith(DataChannelNames.Draw)) {
  //         drawChannelRef.current = channel
  //         setupDataChannel(drawChannelRef.current, "Draw")
  //       }
  //     })

  //     pc.addEventListener("track", (event) => {
  //       console.log("Receive track in ontrack", event)
  //       const midId = event.transceiver.mid || ""
  //       if (event?.track?.kind === "video") {
  //         if (midId === screenTrackMidIdRef.current) {
  //           setSharedScreen(event.track)
  //           return
  //         }

  //         setRemoteVideoStreams((prevStreams) => {
  //           const exists = prevStreams.some(
  //             (stream) => stream.videoTrack.id === event.track?.id
  //           )

  //           if (!exists && event.track) {
  //             const newVideoStream: VideoStream = {
  //               videoTrack: event.track,
  //               midId: midId,
  //             }

  //             return [...prevStreams, newVideoStream]
  //           }

  //           return prevStreams
  //         })
  //       } else if (event.track?.kind === "audio") {
  //         setRemoteAudioStreams((prevStreams) => {
  //           const exists = prevStreams.some(
  //             (stream) => stream.audioTrack.id === event?.track?.id
  //           )

  //           if (!exists && event?.track) {
  //             const newAudioStream: AudioStream = {
  //               audioTrack: event?.track,
  //               midId: midId,
  //             }

  //             return [...prevStreams, newAudioStream]
  //           }

  //           return prevStreams
  //         })
  //       }
  //     })
  //     return pc
  //   } catch (error) {
  //     console.error("Failed to create PeerConnection:", error)
  //     throw new Error("Could not create RTCPeerConnection")
  //   }
  // }

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
      socketRef.current?.emit("join", {
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
        username: getFullName(authMeData as any)
      })
      if (isSpeakerOn) {
        if (isIOS()) {
          setTimeout(() => {
            inCallManager.setSpeakerphoneOn(true)
          }, 1000)
        } else {
          inCallManager.setSpeakerphoneOn(true)
        }
      }
      if (!timerRef.current) {
        startTimeRef.current = Date.now()
        timerRef.current = setInterval(() => {
          elapsedTimeRef.current = Date.now() - (startTimeRef.current || 0)
        }, 1000)
      }
    } catch (error) {
      console.error("Error starting call:", error)
    }
  }

  const endCall = () => {
    stopLocalStreamTracks()
    remoteAudioStreams?.forEach((t) => t?.audioTrack?.stop?.())
    remoteAudioStreams?.forEach((t) => t?.audioTrack?.release?.())
    remoteVideoStreams?.forEach((t) => t?.videoTrack?.stop?.())
    remoteVideoStreams?.forEach((t) => t?.videoTrack?.release?.())
    if (peerConnection.current) {
      peerConnection.current?.close()
    }
    if (socketRef.current) {
      socketRef.current?.close()
    }
    drawChannelRef.current?.removeEventListener("message")
    messagesChannelRef?.current?.removeEventListener("message")
    setRemoteVideoStreams([])
    if (STTSocket.current) {
      STTSocket.current.close()
      STTSocket.current = null
    }
    peerConnection.current = null
    disconnectSocketEvents()
    // AudioRecord.stop()
    peerConnection.current = null
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
        localStream.audioTrack.stop()
        localStream.audioTrack.release()
        localStream.audioTrack.enabled = false
        localStream.audioTrack = null
      }

      if (localStream.videoTrack) {
        localStream.videoTrack.stop()
        localStream.videoTrack.release()
        localStream.videoTrack.enabled = false

        localStream.videoTrack = null
      }

      setLocalStream(null)
    }
  }
  // sharing screen
  // const [localMediaStream, setLocalMediaStream] = useState<any>(null);
  // const startScreenShare = async () => {
  //   try {
  //     const mediaStream = await mediaDevices.getDisplayMedia();
  //     console.log(mediaStream, 'mediaStreammediaStream');
  //     setLocalMediaStream(mediaStream);

  //     // Add tracks to peer connection
  //     mediaStream.getTracks().forEach(track => {
  //       console.log(track, 'tracktracktracktrack');

  //       peerConnection.current?.addTrack(track, mediaStream);
  //     });

  //   } catch (err) {
  //     console.error('Error starting screen share:', err);
  //   }
  // };

  // const stopScreenShare = () => {
  //   if (localMediaStream) {
  //     // Stop all tracks
  //     localMediaStream?.getTracks().forEach(track => track.stop());
  //     console.log(localMediaStream, 'localMediaStreamlocalMediaStream');

  //     setLocalMediaStream(null);
  //   }
  // };

  const handleOfferCheck = async () => {
    try {
      RETRY_ATTEMPT++
      if (RETRY_ATTEMPT > TRIES_LIMIT)
        throw new Error("Something wrong with connection")
      if (peerConnection.current?.signalingState !== "stable") return

      const offer = await peerConnection.current.createOffer({})
      await peerConnection.current.setLocalDescription(offer)
      socketRef.current!.emit("offer", {
        sdp: peerConnection.current.localDescription,
        roomId,
      })
      eventStartedTimeRef.current = moment().unix()

      clearInterval(offerStatusCheckRef.current)
      if (RETRY_ATTEMPT) RETRY_ATTEMPT = 0
      return
    } catch (error) {
      console.error("Error obtaining media:", error)
      clearInterval(offerStatusCheckRef.current)
    }
  }

  const handleOffer = async ({ sdp }: { sdp: RTCSessionDescription }) => {
    if (!peerConnection.current) {
      peerConnection.current = createPeerConnection({
        socketRef,
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
    }
    try {
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
        socketRef.current?.emit("answer", { sdp: localDescription, roomId })
        clearInterval(offerStatusCheckRef.current)
        if (RETRY_ATTEMPT) RETRY_ATTEMPT = 0
      } else {
        console.error("Local description is null")
      }
    } catch (error) {
      console.error("Error processing offer:", error)
    }
  }

  const handleAnswer = async ({ sdp }: { sdp: RTCSessionDescription }) => {
    try {
      if (peerConnection.current) {
        if (peerConnection.current.signalingState === "stable") {
          console.warn("Answer ignored: already stable")
          return
        }
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(sdp)
        )
      }
    } catch (error) {
      console.error("Error setting remote description:", error)
    }
  }

  const handleUserJoined = async ({
    userId,
    participantsInfo,
  }: {
    userId: string
    participantsInfo: ParticipantsInfo[]
  }) => {
    try {
      // const sttRes = await scalerFindFreeMachinePairSTT({
      //   id: String(meetId),
      // }).unwrap()
      // sttUrlRef.current = `wss://${sttRes?.stt}`
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
console.log(invitedParticipantsRef, 'invitedParticipantsRefinvitedParticipantsRef');
console.log(participantsInfo, 'participantsInfoparticipantsInfoparticipantsInfo');

      // setParticipants((_prev: any): any => {
      //   const newUsers = participantsInfo.map(({ userId, socketId }) => {
      //     const {
      //       firstName = "Guest",
      //       lastName = "",
      //       photo = null,
      //     } = invitedParticipantsRef?.current?.find?.(
      //       (invitedParticipants) => Number(userId) === Number(invitedParticipants?.id)
      //     ) || {}
      //     return {
      //       userId,
      //       socketId,
      //       firstName,
      //       lastName,
      //       photo,
      //       isAudioOn: usersAudioVideoMap[socketId].isAudioOn,
      //       isVideoOn: usersAudioVideoMap[socketId].isVideoOn,
      //     }
      //   })
      //   return [
      //     // ...prev,
      //     ...newUsers,
      //   ]
      // })

      await prepareParticipants({
        participantsInfo,
        invitedParticipantsRef,
        setParticipants,
        getUsersById,
      });

      const anySharingOn = participantsInfo.some((p) => p.status.isSharingOn)
      setIsScreenShare(anySharingOn)

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      if (userRefId.current) {
        setLocalStream({
          socketId: socketRef.current?.id ?? "",
          audioTrack: stream.getAudioTracks()[0] || null,
          videoTrack: stream.getVideoTracks()[0] || null,
        })
      }

      if (!peerConnection.current) {
        peerConnection.current = createPeerConnection({
          socketRef,
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
      checkPeerConnection(handleOfferCheck)
    } catch (error) {
      console.error("Error handling user join:", error)
    }
  }

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

  const handleCandidate = async ({
    candidate,
  }: {
    candidate: RTCIceCandidate
  }) => {
    try {
      if (peerConnection.current) {
        if (!peerConnection.current.remoteDescription) {
          pendingCandidates.push(candidate)
          return
        }
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        )
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error)
    }
  }

  useEffect(() => {
    if (authMeData?.inputLanguage?.code) {
      sttLanguageRef.current = authMeData?.inputLanguage?.code
    }
  }, [authMeData?.inputLanguage?.code])

  const handleChangedRoomLanguage = (language: string) => {
    console.log("handleChangedRoomLanguage: ", language)
    sttLanguageRef.current = language?.toLowerCase()
    socketRef.current?.emit("change-language", {
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
    socketRef.current?.emit("chat-message", {
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
      inCallManager.setSpeakerphoneOn(false)
      setIsSpeakerOn(false)
    } else {
      inCallManager.setSpeakerphoneOn(true)
      setIsSpeakerOn(true)
    }
  }

  const switchCamera = () => {
    if (localStream) {
      const videoTrack = localStream?.videoTrack
      if (videoTrack && typeof videoTrack._switchCamera === "function") {
        videoTrack._switchCamera()
        setIsCameraSwitched(true)
      }
    }
  }

  const handleSubtitles = (newEl: any) => (prev: any[]) => {
    let newAr = [...prev, newEl]
    if (newAr.length > SUBTITLES_QUEUE_LIMIT) {
      newAr.shift()
    }
    return newAr
  }

  const handlePeerDataChannelMessage = (event: any) => {
    const data = JSON.parse(event)
    setTranslatedSubtitles(handleSubtitles(data))
  }

  useEffect(() => {
    if (authMeData && !sttLanguageRef.current) {
      sttLanguageRef.current =
        authMeData?.inputLanguage?.code?.toLowerCase?.() || "en"
    }
  }, [authMeData, sttLanguageRef.current])

  const addToBufferAndSend = async (
    data: string,
    language: string,
    sttLanguages: string[]
  ) => {
    if (!isRecording) return
    try {
      const arrayBuffer = base64ToFloat32Array(data)
      collectorAr.push(resampleTo16kHZ(arrayBuffer))

      if (collectorAr?.length !== 4) return
      if (STTSocket.current?.readyState === WebSocket.OPEN) {
        const audio = Float32ConcatAll(collectorAr)
        const packet = {
          speakerLang: language,
          allLangs: sttLanguages,
          audio: float32ArrayToBase64(audio),
        }
        STTSocket.current.send(JSON.stringify(packet))
        collectorAr = []
      } else {
        console.warn("WebSocket is not open. Saving audio locally.")
        // AudioRecord.stop().then((_res: string) => {
          isRecording = false
        // })
      }
    } catch (error) {
      console.error("Error processing and sending audio data:", error)
    }
  }

  const captureAndSendAudio = () => {
    if (isRecording) {
      isRecording = false
      // AudioRecord.stop()
    }
    AudioRecord.init({
      sampleRate: 44100, // 16 kHz
      channels: 1, // Mono
      bitsPerSample: 16, // 16-bit audio
      audioSource: 6, // Use the microphone as the audio source
      wavFile: "newTest.wav", // default 'audio.wav'
    })
    AudioRecord.start()
    isRecording = true
    AudioRecord.on("data", (data: any) => {
      addToBufferAndSend(
        data,
        sttLanguageRef.current?.toLowerCase?.() || "en",
        allLanguagesRef.current
      )
    })
  }

  useEffect(() => {
    if (sttUrlRef.current) {
      handleSetSTTSocket({ sttUrl: sttUrlRef.current })
    }
  }, [sttUrlRef.current])

  const handleSetSTTSocket = ({ sttUrl }: { sttUrl: string }) => {
    STTSocket.current = new WebSocket(sttUrl)

    STTSocket.current.onopen = onSTTSocketOpen
    STTSocket.current.onmessage = onSTTSocketMessage

    STTSocket.current.onerror = (error) => {
      console.log("STTError: ", error)

      AudioRecord.stop()
      STTSocket.current?.close()
    }

    STTSocket.current.onclose = (event) => {
      console.log("STTOnclose: ", event)
      AudioRecord.stop()
    }
  }

  const onSTTSocketOpen = () => {
    if (!userRefId.current) return
    console.log("STT SEND: ")
    STTSocket.current?.send(
      JSON.stringify({
        uid: `speaker-${userRefId.current}-${socketRef.current?.id}`,
        language: sttLanguageRef.current,
        task: "transcribe",
        model: "large-v3",
        use_vad: true,
      })
    )
    if (!isMuted) {
      // captureAndSendAudio()
    }
  }

  const toggleMedia = async (type: "audio" | "video") => {
    if (!peerConnection.current) {
      return
    }
    if (!localStream || !socketRef.current) {
      return
    }
    const isAudio = type === "audio"

    const track = isAudio ? localStream.audioTrack : localStream.videoTrack
    if (!track) {
      return
    }

    track.enabled = isAudio ? Boolean(isMuted) : Boolean(isVideoOff)

    setLocalStream((prev) => ({
      ...prev!,
      [isAudio ? "audioTrack" : "videoTrack"]: track,
    }))

    if (isAudio) {
      if (!isMuted) {
        console.log("Microphone muted. Stopping recording...")
        // AudioRecord.stop()
      } else {
        console.log("Microphone unmuted. Restarting recording...")
        // captureAndSendAudio()
      }
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

    socketRef?.current?.emit("action", {
      roomId,
      action,
      socketId: socketRef.current.id,
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

    // participantsInfo.forEach((participant) => {
    //   usersAudioVideoMap[participant.socketId] = {
    //     isAudioOn: participant.status.isAudioOn,
    //     isVideoOn: participant.status.isVideoOn,
    //     socketId: participant.socketId,
    //   }
    // })

    // setParticipants((_prev: any): any => {
    //   const newUsers = participantsInfo.map(({ userId, socketId }) => {
    //     const {
    //       firstName = "Guest",
    //       lastName = "",
    //       photo = null,
    //     } = invitedParticipantsRef.current.find(({ id }) => userId === id) || {}

    //     return {
    //       userId,
    //       socketId,
    //       firstName,
    //       lastName,
    //       photo,
    //       isAudioOn: usersAudioVideoMap[socketId].isAudioOn,
    //       isVideoOn: usersAudioVideoMap[socketId].isVideoOn,
    //     }
    //   })

    //   return [...newUsers]
    // })
    await prepareParticipants({
      participantsInfo,
      invitedParticipantsRef,
      setParticipants,
      getUsersById,
    });
  }

useEffect(() => {
  if (getCalendarEventByHashData) {
    invitedParticipantsRef.current = [
      ...new Set(
        getCalendarEventByHashData?.participants.map(
          ({ user }: { user: any }) => user
        )
      ),
    ];
  }

  if (invitedParticipants?.length) {
    invitedParticipantsRef.current = [
      ...new Set([
        ...invitedParticipantsRef.current,
        ...invitedParticipants,
      ]),
    ];
  }
}, [getCalendarEventByHashData, invitedParticipants?.length]);


  return {
    socketRef,
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
    // sharedScreen,

    sttUrl: sttUrlRef,
    localUserId: userRefId.current,
    localUserSocketId: socketRef.current?.id,
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
    // sharingOwner,

    points,
    clearCanvas,
    setClearCanvas,
    accessMeetingSocketRef,

    recordingUrl,
    onStartRecord,
    onStopRecord,
    startRecording,
    stopRecording,
    isScreenRecording,
    recordingNameRef,
  }
}

export default useWebRtc
