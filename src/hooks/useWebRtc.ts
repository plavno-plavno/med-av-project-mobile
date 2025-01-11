import { useState, useEffect, useRef } from "react"
import {
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
} from "react-native-webrtc"
import { io } from "socket.io-client"
import * as Keychain from "react-native-keychain"
import {
  useAuthMeQuery,
  useGetUsersByIdMutation,
} from "src/api/userApi/userApi"
import { RTCSessionDescriptionInit } from "react-native-webrtc/lib/typescript/RTCSessionDescription"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { User } from "src/api/userApi/types"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { ROUTES } from "src/navigation/RoutesTypes"
import inCallManager from "react-native-incall-manager"

const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  // bundlePolicy: "max-compat",
  // offerToReceiveAudio: true,
  // offerToReceiveVideo: true,
  iceCandidatePoolSize: 10,
}

type ScreenShare = {
  userId: string
  roomId: string
  isSharing: boolean
}

export interface RemoteStream {
  userId: string | number
  audioTrack: MediaStreamTrack | null
  videoTrack: MediaStreamTrack | null
}

type ParamList = {
  Detail: {
    hash: string
    isMuted?: boolean
    isVideoOff?: boolean
  }
}

// https://av-hims.netlify.app/meetings/${slug}
const useWebRtc = (isPreview?: boolean) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([])
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const [messages, setMessages] = useState<[]>([])
  const [participants, setParticipants] = useState<User[] | []>([])
  const { reset } = useNavigation<ROUTES>()
  const route = useRoute<RouteProp<ParamList, "Detail">>()

  const nextTrackId = useRef<string | number | null>(null)

  const [isMuted, setIsMuted] = useState(route.params?.isMuted || false)
  const [isVideoOff, setIsVideoOff] = useState(route.params?.isVideoOff || false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [isCameraSwitched, setIsCameraSwitched] = useState(false)

  const roomId = route?.params?.hash
  // const roomId = 'default-room'
  const { data: authMeData } = useAuthMeQuery()
  const userRef = useRef<string | number>()
  userRef.current = authMeData?.id

  const [getUsersById] = useGetUsersByIdMutation()

  const token = async () => {
    const credentials = await Keychain.getGenericPassword({
      service: "accessToken",
    })
    if (credentials) {
      return credentials?.password
    }
    return ""
  }

  const [socket, setSocket] = useState<any>(null)

  useEffect(() => {
    if (!isPreview) {
      ;(async () => {
        const accessToken = await token()
        const newSocket = io("https://khutba-media-server.plavno.io:7000/", {
          auth: { token: accessToken },
        })
        setSocket(newSocket)
      })()
    }
  }, [isPreview])

  useEffect(() => {
    const initialize = async () => {
      let mediaConstraints = {
        audio: true,
        video: {
          frameRate: 30,
          facingMode: "user",
        },
      }
      const stream = await mediaDevices.getUserMedia(mediaConstraints)
      setLocalStream(stream)
    }
    initialize()
  }, [])

  useEffect(() => {
    if (socket && roomId) {
      startCall()

      socket.onAny((eventName: any, args: any) => {
        console.log(`!!!!! Incoming event: ${eventName} !!!!`, args)
      })
      socket.on("offer", async ({ sdp }) => await handleOffer(sdp))
      socket.on("answer", async ({ sdp }) => await handleAnswer(sdp))
      socket.on(
        "candidate",
        async ({ candidate }) => await handleCandidate(candidate)
      )
      socket.on(
        "user-joined",
        async ({ userId }: { userId: number }) => await handleUserJoined(userId)
      )
      socket.on("screen-share-updated", () => console.log('screen-share-updated'))
      socket.on("chat-message", handleChatMessage)
      socket.on("transceiver-info", handleTransceiver)
      socket.on("client-disconnected", ({ userId }: { userId: number }) => {
        setRemoteStreams((prev) =>
        {
          const test = prev.filter((stream) => stream.userId !== userId)
          console.log(test, 'testtesttesttesttesttesttest');
        }
        )
      })
    }
  }, [socket, roomId])

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }

  const toggleSpeaker = () => {
    if(isSpeakerOn){
      inCallManager.setSpeakerphoneOn(false);
      setIsSpeakerOn(false)
    } else {
      inCallManager.setSpeakerphoneOn(true);
      setIsSpeakerOn(true)
    }
  }

  const createPeerConnection = async () => {
    if (peerConnection.current) {
      return peerConnection.current
    }
    try {
      peerConnection.current = await new RTCPeerConnection(config)
      peerConnection.current.addEventListener(
        "icecandidate",
        ({ candidate }) => {
          if (candidate) {
            socket.emit("candidate", {
              candidate,
              roomId,
            })
          }
        }
      )

      peerConnection.current.addEventListener( 'iceconnectionstatechange', event => {
     console.log(event, 'event iceconnectionstatechange');
      } );

      peerConnection.current.addEventListener( 'signalingstatechange', event => {
       console.log(event, 'event signalingstatechange');
      } );

      peerConnection.current.addEventListener(
        "connectionstatechange",
        (event) => {
          console.log("Connection event state:", event)

          if (peerConnection.current?.signalingState === "stable") {
            console.warn("Skipping redundant SDP setting in stable state.")
            return
          }

          if (peerConnection.current?.connectionState === "failed") {
            console.error(
              "Connection failed. Consider renegotiating or restarting the connection."
            )
            peerConnection.current?.close()
            peerConnection.current = new RTCPeerConnection(config)
          }
        }
      )
      peerConnection.current.addEventListener("icecandidateerror", (event) => {
        console.log(event, "event icecandidateerroricecandidateerror")
      })

      peerConnection.current.addEventListener("datachannel", (event) => {
        const dataChannel = event.channel

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

      peerConnection.current.addEventListener("track", (event) => {
        console.log(event, 'event peerConnection');
        
        const processTrack = () => {
          localStream?.getTracks().forEach( 
            track => peerConnection.current?.addTrack( track, localStream )
          );

          setRemoteStreams((prev) => {
            const existingStream = prev.find(
              (stream) => stream.userId === userRef.current
            )

            if (existingStream) {
              const updatedStream = { ...existingStream }

              if (event?.track?.kind === "video") {
                updatedStream.videoTrack = event.track
              } else if (event?.track?.kind === "audio") {
                updatedStream.audioTrack = event.track
              }

              return prev?.map((stream) =>
                stream.userId === userRef.current ? updatedStream : stream
              ) || []
            } else {
              const newStream = {
                userId: userRef.current,
                audioTrack: event.track?.kind === "audio" ? event.track : null,
                videoTrack: event.track?.kind === "video" ? event.track : null,
              }

              return [...prev, newStream];
            }
          })
        }

        processTrack()
      })
    } catch (error) {
      console.error("Failed to create PeerConnection:", error)
      throw new Error("Could not create RTCPeerConnection")
    }
  }

  const startCall = async () => {
    try {
      if (!peerConnection?.current) {
        createPeerConnection()
      }
      socket.emit("join", {
        roomId: roomId,
        language: "en",
      })
    } catch (error) {
      console.error("Error starting call:", error)
    }
  }

  const endCall = () => {
    peerConnection.current?.close()
    setLocalStream(null)
    setRemoteStreams([])
    peerConnection.current = null
    if (socket) {
      socket.disconnect()
      socket.off("connect")
      socket.off("joined")
      socket.off("offer")
      socket.off("answer")
      socket.off("candidate")
      socket.off("new-client")
      socket.off("client-disconnected")
      socket.off("ice-candidate")

      socket.off("chat-message", handleChatMessage)
      socket.off("transceiver-info", handleTransceiver)
      socket.off("screen-share-updated", () => console.log('screen-share-updated'))
    }

    peerConnection.current = null
    reset({
      index: 0,
      routes: [{ name: ScreensEnum.MAIN }],
    })
  }

  const handleOffer = async ({ sdp, type }: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) {
      createPeerConnection()
    }

    try {
      const offer = new RTCSessionDescription({
        sdp,
        type,
      })
      await peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(offer)
      )
      const answer = await peerConnection.current?.createAnswer()
      await peerConnection.current?.setLocalDescription(answer)

      if (peerConnection.current?.localDescription) {
        const localDescription = peerConnection.current
          .localDescription as RTCSessionDescriptionInit
        socket.emit("answer", {
          sdp: localDescription,
          roomId,
        })
      } else {
        console.error("Local description is null")
      }
    } catch (error) {
      console.error("Error processing offer:", error)
    }
  }

  const handleAnswer = async (sdp: RTCSessionDescriptionInit) => {
    try {
      if (peerConnection.current) {
        await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(sdp))
      }
    } catch (error) {
      console.error("Error setting remote description:", error)
    }
  }

  const handleUserJoined = async (userId: number) => {
    try {
      const userExists = participants.find(
        (participant) => participant?.id === userId
      )
      if(userExists){
        return
      }

      let userData: any
      if (!userExists) {
        const response = await getUsersById({ id: userId }).unwrap()
        userData = response?.user
        setParticipants((prev) => [...prev, userData])
      }

      let mediaConstraints = {
        audio: true,
        video: {
          frameRate: 30,
          facingMode: "user",
        },
      }
      const stream = await mediaDevices.getUserMedia(mediaConstraints)
      if (userRef.current) {
        setLocalStream(stream)
      }
      if (!peerConnection?.current) {
        createPeerConnection()
      }
      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream)
        console.log("Added track", track)
      })

      const offer = await peerConnection.current?.createOffer({})

      await peerConnection.current?.setLocalDescription(offer)
      if (peerConnection.current?.localDescription) {
        socket.emit("offer", {
          sdp: peerConnection.current?.localDescription,
          roomId,
        })
      } else {
        console.error("Failed to send offer: localDescription is null")
      }
    } catch (error) {
      console.error("Error handling user join:", error)
    }
  }

  const handleCandidate = async (candidate: any) => {
    try {
      if (peerConnection.current) {
        if (!peerConnection.current.remoteDescription) {
          return
        }

        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        )
        console.log("ICE candidate successfully added")
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error)
    }
  }

  const handleTransceiver = async ({
    userId,
  }: {
    mid: string | null
    userId: number
  }) => {
    const isUserExists = participants.filter((user) => user?.id === userId)
    if(isUserExists){
      return
    }
    if (!isUserExists) {
      const userData = await getUsersById({ id: userId }).unwrap()

      setParticipants((prev) => {
        const isUserExist = prev.some(
          (participant) => participant?.id === userData?.user?.id
        )

        if (isUserExist) {
          return prev
        }

        return [...prev, userData?.user]
      })

      nextTrackId.current = userId
    }
  }

  // Meeting chat
  const handleChatMessage = (data: any) => {
    console.log(data, "data handleChatMessagehandleChatMessage")
    setMessages((prev) => [...prev, data])
  }

  const sendMessage = (data: any) => {
    const { message } = data
    socket.emit("chat-message", {
      roomId,
      message,
    })
  }

  const switchCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack._switchCamera === 'function') {
        videoTrack._switchCamera();
        setIsCameraSwitched(true);
      }
    }
  };

  return {
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
    startCall,
    endCall,
    messages,
    sendMessage,
    participants,
    RTCView,
    switchCamera,
    toggleSpeaker,
    isSpeakerOn,
    isCameraSwitched,
    roomId,
  }
}

export default useWebRtc
