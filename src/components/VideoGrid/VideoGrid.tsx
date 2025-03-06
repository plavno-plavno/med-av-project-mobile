import React, { useEffect } from "react"
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
  localUserId,
  localUserSocketId,
  isMuted,
  sharedScreen,
  sharingOwner,
}: any) => {
  const [activeHostSpeaker, setActiveHostSpeaker] = React.useState(false)
  const adaptParticipantsToShow = (): RemoteStream[] => {
    const remoteStreams: Record<string | number, RemoteStream> = {}

    remoteAudioStreams.forEach((audioStream: any) => {
      const midId = Number(audioStream.midId)
      const socketId = usersAudioTrackToIdMap[midId];
      if (socketId) {
        if (!remoteStreams[socketId]) {
          remoteStreams[socketId] = {
            socketId: socketId,
            audioTrack: null,
            videoTrack: null,
            mid: String(midId),
          }
        }

        remoteStreams[socketId].audioTrack = audioStream.audioTrack
      }
    })

    remoteVideoStreams.forEach((videoStream: any) => {
      const midId = Number(videoStream.midId)
      const socketId = usersVideoTrackToIdMap[midId];

      if (socketId) {
        if (!remoteStreams[socketId]) {
          remoteStreams[socketId] = {
            socketId: socketId,
            audioTrack: null,
            videoTrack: null,
            mid: String(midId),
          }
        }

        remoteStreams[socketId].videoTrack = videoStream.videoTrack
      }
    })

    const participantsSteams = Object.values(remoteStreams)
    if (localStream) {
      participantsSteams.unshift(localStream)
    }

    // Sort the participants to ensure the active speaker comes first
    if (sharingOwner && totalParticipants >= 3) {
      const activeSpeakerStream = participantsSteams.find(
        (stream) => stream.socketId === activeSpeaker
      )
      // Remove the active speaker from the array if it exists
      const otherParticipants = participantsSteams.filter(
        (stream) => stream.socketId !== activeSpeaker
      )

      // Put the active speaker at the start
      if (activeSpeakerStream) {
        participantsSteams.length = 0 // Clear the array
        participantsSteams.push(activeSpeakerStream, ...otherParticipants)
      }
    } else if (totalParticipants >= 7) {
      const activeSpeakerStream = participantsSteams.find(
        (stream) => stream.socketId === activeSpeaker
      )
      // Remove the active speaker from the array if it exists
      const otherParticipants = participantsSteams.filter(
        (stream) => stream.socketId !== activeSpeaker
      )

      // Put the active speaker at the start
      if (activeSpeakerStream) {
        participantsSteams.length = 1 // Clear the array
        participantsSteams.push(activeSpeakerStream, ...otherParticipants)
      }
    }

    return participantsSteams
  }

  const participantsToShow = adaptParticipantsToShow()

  const activeSpeaker = useHighlightSpeaker(peerConnection, participantsToShow)
  const totalParticipants = participantsToShow.length

  const sharedScreenStream = new MediaStream()
  if (sharedScreen) sharedScreenStream.addTrack(sharedScreen)

  const renderStream = (item: any, index: number) => {
    const mediaStream = new MediaStream()

    if (item?.videoTrack) mediaStream.addTrack(item?.videoTrack)
    if (item?.audioTrack) mediaStream.addTrack(item?.audioTrack)

    const isActiveHighlighter =
      item?.socketId === localUserSocketId
        ? activeHostSpeaker && !isMuted
        : activeSpeaker !== null &&
          activeSpeaker === item?.socketId

    const user = participants?.find(
      (user: User) => user.socketId === item.socketId
    ) as UserInMeeting

    const isMicMuted = item?.socketId === localUserSocketId ? isMuted : !user?.isAudioOn
    const isCameraOff =
      item?.socketId === localUserSocketId ? isVideoOff : !user?.isVideoOn

    return (
      <ParticipantItem
        isActiveHighlighter={isActiveHighlighter}
        user={user}
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        totalParticipants={totalParticipants}
        idx={index}
        sharingOwner={sharingOwner}
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
        if (data?.value > (isIOS() ? -40 : -130)) {
          setActiveHostSpeaker(true)
        } else {
          setActiveHostSpeaker(false)
        }
      }
    }

    return () => {
      RNSoundLevel.stop()
    }
  }, [isMuted])

  useEffect(() => {
    if (sharingOwner) {
      totalParticipants >= 3 && adaptParticipantsToShow()
    } else if (totalParticipants >= 7) {
      adaptParticipantsToShow()
    }
  }, [activeSpeaker])

  return (
    <View style={styles.container}>
      {sharingOwner && (
        <View style={styles.sharingContainer}>
          <RTCView
            streamURL={sharedScreenStream.toURL()}
            style={[helpers.width100Percent, helpers.height100Percent]}
            objectFit="cover"
          />
        </View>
      )}
      {adaptParticipantsToShow().map((item, index) =>
        renderStream(item, index)
      )}
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
    // overflow: "hidden",
  },
  sharingContainer: {
    width: "100%",
    height: "48.5%",
    borderRadius: moderateScale(12),
    overflow: "hidden",
  },
  video: {
    borderRadius: moderateScale(12),
    overflow: "hidden",
    backgroundColor: colors.charcoal,
    width: "100%",
    height: "100%",
  },
})
