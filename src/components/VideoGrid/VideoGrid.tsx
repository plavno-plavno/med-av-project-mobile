import React, { useEffect, useRef, useMemo, useState } from "react"
import { View, StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import { MediaStream, RTCView } from "react-native-webrtc"
import colors from "src/assets/colors"
import { RemoteStream, User } from "src/hooks/useWebRtc"
import useHighlightSpeaker from "src/hooks/useHighlightSpeaker"
import { helpers } from "@utils/theme"
import RNSoundLevel from "react-native-sound-level"
import { isIOS } from "@utils/platformChecker"
import ParticipantItem from "../ParticipantItem"
import Canvas from "react-native-canvas"
import { screenHeight, screenWidth } from "@utils/screenResponsive"

export interface UserInMeeting extends User {
  isAudioOn: boolean | null
  isVideoOn: boolean | null
}

const VideoGrid = ({
  localStream,
  isVideoOff,
  remoteAudioStreams,
  usersAudioTrackToIdMap,
  remoteVideoStreams,
  usersVideoTrackToIdMap,
  participants,
  peerConnection,
  localUserSocketId,
  isMuted,
  sharedScreen,
  isScreenShare,
  points,
  clearCanvas,
  setClearCanvas,
}: any) => {
  const [activeHostSpeaker, setActiveHostSpeaker] = useState(false)
  const canvasRef = useRef<Canvas | null>(null)

  const remoteStreamsCombined = useMemo(() => {
    const result: Record<string, RemoteStream> = {}

    remoteAudioStreams.forEach((audioStream: any) => {
      const midId = Number(audioStream.midId)
      const socketId = usersAudioTrackToIdMap[midId]
      if (!socketId) return

      result[socketId] ||= {
        socketId,
        audioTrack: null,
        videoTrack: null,
        mid: String(midId),
      }
      result[socketId].audioTrack = audioStream.audioTrack
    })

    remoteVideoStreams.forEach((videoStream: any) => {
      const midId = Number(videoStream.midId)
      const socketId = usersVideoTrackToIdMap[midId]
      if (!socketId) return

      result[socketId] ||= {
        socketId,
        audioTrack: null,
        videoTrack: null,
        mid: String(midId),
      }
      result[socketId].videoTrack = videoStream.videoTrack
    })

    return Object.values(result)
  }, [
    remoteAudioStreams,
    remoteVideoStreams,
    usersAudioTrackToIdMap,
    usersVideoTrackToIdMap,
  ])
  
  const activeSpeaker = useHighlightSpeaker(
    peerConnection,
    remoteStreamsCombined
  )

  const participantsToShow = useMemo(() => {
    let streams = [...remoteStreamsCombined]

    if (localStream) {
      streams.unshift(localStream)
    }

    const totalParticipants = streams.length

    const shouldReorder =
      (isScreenShare && totalParticipants >= 3) || totalParticipants >= 7

    if (shouldReorder && activeSpeaker) {
      const activeStream = streams.find((s) => s.socketId === activeSpeaker)
      if (activeStream) {
        const rest = streams.filter((s) => s.socketId !== activeSpeaker)
        return [activeStream, ...rest]
      }
    }

    return streams
  }, [remoteStreamsCombined, localStream, isScreenShare, activeSpeaker])

  const [activeVideoSocketIds, setActiveVideoSocketIds] = useState<string[]>([])

  useEffect(() => {
    const visible = participantsToShow.slice(0, 6).map(p => p.socketId)
    const newActive = [...visible]

    if (activeSpeaker && !newActive.includes(activeSpeaker)) {
      newActive.push(activeSpeaker)
    }

    setActiveVideoSocketIds(newActive)
  }, [participantsToShow, activeSpeaker])

  const totalParticipants = participantsToShow.length

  const renderStream = (item: any, index: number) => {
    const mediaStream = new MediaStream()
    if (item?.videoTrack) mediaStream.addTrack(item.videoTrack)
    if (item?.audioTrack) mediaStream.addTrack(item.audioTrack)

    const isActiveHighlighter =
    item?.socketId === localUserSocketId
      ? activeHostSpeaker && !isMuted
      : activeSpeaker === item?.socketId

  const user = participants?.find(
    (u: User) => u.socketId === item.socketId
  ) as UserInMeeting

  const isMicMuted =
    item?.socketId === localUserSocketId ? isMuted : !user?.isAudioOn

const shouldShowVideo =
  item?.socketId === localUserSocketId
    ? !isVideoOff
    : user?.isVideoOn && activeVideoSocketIds.includes(item?.socketId)
    if (item.videoTrack) {
      item.videoTrack.enabled = shouldShowVideo
    }
    return (
      <ParticipantItem
        key={user?.id || index}
        isActiveHighlighter={isActiveHighlighter}
        user={user}
        isMicMuted={isMicMuted}
        isCameraOff={!shouldShowVideo}
        totalParticipants={totalParticipants}
        idx={index}
        sharingOwner={isScreenShare}
        mediaStream={mediaStream}
        participant={item}
      />
    )
  }

  useEffect(() => {
    if (isMuted) {
      RNSoundLevel.stop()
    } else {
      RNSoundLevel.start(250)
      RNSoundLevel.onNewFrame = (data) => {
        const threshold = isIOS() ? -40 : -130
        setActiveHostSpeaker(data?.value > threshold)
      }
    }

    return () => {
      RNSoundLevel.stop()
    }
  }, [isMuted])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = screenWidth * 0.9
    canvas.height = screenHeight * 0.5

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (clearCanvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setClearCanvas(false)
    } else {
      ctx.strokeStyle = colors.alertRed
      ctx.beginPath()
      points.forEach((point: { x: number; y: number }, index: number) => {
        index === 0
          ? ctx.moveTo(point.x, point.y)
          : ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    }
  }, [clearCanvas, points])

  const sharedScreenStream = useMemo(() => {
    if (!sharedScreen) return null
    const stream = new MediaStream()
    stream.addTrack(sharedScreen)
    return stream
  }, [sharedScreen])

  return (
    <View style={styles.container}>
      {isScreenShare && sharedScreenStream && (
        <View style={styles.sharingContainer}>
          <RTCView
            streamURL={sharedScreenStream.toURL()}
            style={[helpers.width100Percent, helpers.height100Percent]}
            objectFit="contain"
            zOrder={0}
          />
          <Canvas ref={canvasRef} style={styles.canvas} />
        </View>
      )}

      {participantsToShow.map(renderStream)}
    </View>
  )
}

export default VideoGrid

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexWrap: "wrap",
    flexDirection: "row",
    gap: moderateScale(4),
    justifyContent: "center",
    overflow: "hidden",
    paddingBottom: moderateScale(3),
  },
  sharingContainer: {
    width: "100%",
    height: "49.5%",
    borderRadius: moderateScale(12),
    overflow: "hidden",
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
})
