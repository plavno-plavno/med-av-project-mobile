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

  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const screenTrackRef = useRef<MediaStreamTrack | null>(null)
  const [sharingOwner, setSharingOwner] = useState<string | null>(null)
  const nextTrackId = useRef<string | number | null>(null)

  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const route = useRoute<RouteProp<ParamList, "Detail">>()

  const roomId = route?.params?.hash

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
        const newSocket = io("https://khutba-media-server.plavno.io:7000", {
          auth: { token: accessToken },
        })
        setSocket(newSocket)
      })()
    }
  }, [isPreview])

  useEffect(() => {
    const initialize = async () => {
      // const stream = await mediaDevices.getUserMedia({
      //     audio: true,
      //     video: true
      // });
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

    // return () => {
    //     if (peerConnection.current) {
    //         peerConnection.current?.close?.();
    //     }
    // };
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
      // socket.on('added-new-participant', async ({ userId }: { userId: number }) => await handleUserJoined(userId));

      // Screen sharing
      socket.on("screen-share-updated", handleUpdateSharing)
      // Meeting chat
      socket.on("chat-message", handleChatMessage)
      socket.on("transceiver-info", handleTransceiver)
      socket.on("client-disconnected", ({ userId }: { userId: number }) => {
        setRemoteStreams((prev) =>
          prev.filter((stream) => stream.userId !== userId)
        )
      })
    }

    // return () => {
    //     endCall();
    // }
  }, [socket, roomId])

  const toggleAudio = () => {
    if (localStream) {
      localStream?.getAudioTracks?.()?.forEach((track) => {
        track._enabled = isMuted
      })
      setIsMuted((prev) => !prev)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      localStream?.getVideoTracks?.()?.forEach((track) => {
        track.enabled = isVideoOff
      })
      setIsVideoOff((prev) => !prev)
    }
  }

  const createPeerConnection = async () => {
    console.log("Creating  PeerConnection first attempt")

    if (peerConnection.current) {
      return peerConnection.current
    }

    console.log("Creating new PeerConnection")

    try {
      peerConnection.current = await new RTCPeerConnection(config)
      peerConnection.current.addEventListener(
        "icecandidate",
        ({ candidate }) => {
          console.log(candidate, "onIcecandidate")

          if (candidate) {
            socket.emit("candidate", {
              candidate,
              roomId,
            })
          }
        }
      )

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

        // You can ignore some candidate errors.
        // Connections can still be made even when errors occur.
      })

      peerConnection.current.addEventListener("datachannel", (event) => {
        const dataChannel = event.channel

        dataChannel.addEventListener("open", (event) => {
          console.log("Data channel opened", event)
        })

        dataChannel.addEventListener("message", (event) => {
          const data = event?.data
          // eslint-disable-next-line no-console
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
        console.log(event, "tracktracktracktracktracktracktrack")

        const MAX_RETRIES = 5
        let attempts = 0

        const processTrack = () => {
          const userId = nextTrackId.current

          if (!userId) {
            if (attempts < MAX_RETRIES) {
              attempts++
              console.warn(
                `Retrying to fetch userId... Attempt ${attempts}/${MAX_RETRIES}`
              )
              setTimeout(processTrack, 2000)

              return
            }

            console.error(
              "User ID is not available for this track after maximum retries."
            )

            return
          }

          setRemoteStreams((prev) => {
            const existingStream = prev.find(
              (stream) => stream.userId === userId
            )

            if (existingStream) {
              const updatedStream = { ...existingStream }

              if (event?.track?.kind === "video") {
                updatedStream.videoTrack = event.track
              } else if (event?.track?.kind === "audio") {
                updatedStream.audioTrack = event.track
              }

              return prev.map((stream) =>
                stream.userId === userId ? updatedStream : stream
              )
            } else {
              const newStream = {
                userId,
                audioTrack: event.track?.kind === "audio" ? event.track : null,
                videoTrack: event.track?.kind === "video" ? event.track : null,
              }

              return [...prev, newStream]
            }
          })
        }

        processTrack()
      })

      // return pc;
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
      socket.off("screen-share-updated", handleUpdateSharing)
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
      console.log(peerConnection.current?.signalingState, "signalingState")

      const offer = new RTCSessionDescription({
        sdp,
        type,
      })
      console.log("Setting remote description for offer")
      await peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(offer)
      )
      const answer = await peerConnection.current?.createAnswer()
      await peerConnection.current?.setLocalDescription(answer)

      if (peerConnection.current?.localDescription) {
        const localDescription = peerConnection.current
          .localDescription as RTCSessionDescriptionInit
        console.log("Local description is set")
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
        await peerConnection.current?.setRemoteDescription(
          new RTCSessionDescription(sdp)
        )
        // const answerDescription = new RTCSessionDescription( sdp );
        // await peerConnection?.current?.setRemoteDescription( answerDescription );
      }
    } catch (error) {
      console.error("Error setting remote description:", error)
    }
  }

  const handleUserJoined = async (userId: number) => {
    try {
      console.log("User joined " + userId)

      const userExists = participants.find(
        (participant) => participant?.id === userId
      )

      let userData: any
      if (!userExists) {
        const response = await getUsersById({ id: userId }).unwrap()
        userData = response?.user
        setParticipants((prev) => [...prev, userData])
      }

      // const stream = await mediaDevices.getUserMedia({
      //     audio: true,
      //     video: true
      // });

      let mediaConstraints = {
        audio: true,
        video: {
          frameRate: 30,
          facingMode: "user",
        },
      }

      const stream = await mediaDevices.getUserMedia(mediaConstraints)
      console.log("Media stream tracks:", stream.getTracks())
      console.log("Video track:", stream.getVideoTracks())
      if (userRef.current) {
        setLocalStream({
          userId: userRef.current || "",
          audioTrack: stream.getAudioTracks()[0] || null,
          videoTrack: stream.getVideoTracks()[0] || null,
        })
      }
      console.log("Stream settings:", stream.getVideoTracks()[0].getSettings())

      if (!peerConnection?.current) {
        createPeerConnection()
      }

      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream)
        console.log("Added track", track)
      })

      const offer = await peerConnection.current?.createOffer({})

      await peerConnection.current?.setLocalDescription(offer)
      // await peerConnection.current?.setLocalDescription(await peerConnection.current?.createAnswer());
      // eslint-disable-next-line no-console

      if (peerConnection.current?.localDescription) {
        // const localDescription = peerConnection.current.localDescription as RTCSessionDescriptionInit;
        socket.emit("offer", {
          sdp: peerConnection.current?.localDescription,
          roomId,
        })
        // eslint-disable-next-line no-console
        console.log("Sent offer")
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
    if (!isUserExists.length) {
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

  // screen sharing

  const handleUpdateSharing = (data: ScreenShare) => {
    const { userId, isSharing } = data
    setIsScreenSharing(isSharing)

    if (isSharing) {
      setSharingOwner(userId)
    } else {
      setSharingOwner(null)
    }
  }

  const startScreenShare = async () => {
    try {
      const screenStream = await mediaDevices.getDisplayMedia()

      // const screenStream = await mediaDevices.getDisplayMedia({
      //     video: true,
      // });

      const micStream = await mediaDevices.getUserMedia({
        audio: true,
      })

      const screenTrack = screenStream.getVideoTracks()[0]
      const micTrack = micStream.getAudioTracks()[0]

      if (!screenTrack) {
        console.error("No video track available for screen sharing")

        return
      }

      screenTrackRef.current = screenTrack

      const videoSender = peerConnection.current
        ?.getSenders()
        ?.find((s) => s.track?.kind === "video")

      if (videoSender) {
        await videoSender.replaceTrack(screenTrack)
      } else {
        console.warn("No video sender found. Adding track...")
        peerConnection.current?.addTrack(screenTrack)
      }

      const audioSender = peerConnection.current
        ?.getSenders()
        .find((s) => s.track?.kind === "audio")

      if (audioSender) {
        await audioSender.replaceTrack(micTrack)
      } else {
        console.warn("No audio sender found. Adding track...")
        peerConnection.current?.addTrack(micTrack)
      }

      setLocalStream({
        userId: authMeData?.id || "",
        audioTrack: micStream.getAudioTracks()[0] || null,
        videoTrack: screenStream.getVideoTracks()[0] || null,
      })

      socket.emit("toggle-screenshare", {
        roomId,
        userId: socket.id,
        isSharing: true,
      })

      screenTrack.addEventListener("ended", () => {
        stopScreenShare()
      })
    } catch (error) {
      console.error("Error starting screen sharing:", error)
    }
  }

  const stopScreenShare = async () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop()
      screenTrackRef.current = null
    }

    try {
      if (localStream) {
        // const cameraStream = await mediaDevices.getUserMedia({
        //     video: true,
        //     audio: true,
        // });
        let mediaConstraints = {
          audio: true,
          video: {
            frameRate: 30,
            facingMode: "user",
          },
        }
        const cameraStream = await mediaDevices.getUserMedia(mediaConstraints)

        const videoTrack = cameraStream.getVideoTracks()[0]

        if (!videoTrack) {
          console.error("Failed to get video track from camera stream")

          return
        }

        const sender = peerConnection.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video")

        if (sender) {
          sender.replaceTrack(videoTrack)
        }

        setLocalStream({
          userId: authMeData?.id || "",
          audioTrack: cameraStream.getAudioTracks()[0] || null,
          videoTrack: cameraStream.getVideoTracks()[0] || null,
        })

        socket.emit("toggle-screenshare", {
          roomId,
          userId: socket.id,
          isSharing: false,
        })
      }
    } catch (error) {
      console.error(
        "Error while stopping screen share and switching to camera:",
        error
      )
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
    setLocalStream,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    sharingOwner,
    participants,
    RTCView,

    roomId,
  }
}

export default useWebRtc
