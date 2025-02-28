import React, { useEffect } from "react"
import { View, StyleSheet, ViewStyle, Image, Text } from "react-native"
import { moderateScale } from "react-native-size-matters"
import { MediaStream, RTCView } from "react-native-webrtc"
import LinearGradient from "react-native-linear-gradient"
import colors from "src/assets/colors"
import { Icon } from "@components"
import { RemoteStream, User } from "src/hooks/useWebRtc"
import useHighlightSpeaker from "src/hooks/useHighlightSpeaker"
import { fontFamilies, fontWeights } from "@utils/theme"
import RNSoundLevel from "react-native-sound-level"
import { isIOS } from "@utils/platformChecker"
import { useTranslation } from "react-i18next"
import { getGridStyle } from "@utils/gridStyle"

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
  isMuted,
  sharedScreen,
  sharingOwner,
}: any) => {
  const { t } = useTranslation()
  const [activeHostSpeaker, setActiveHostSpeaker] = React.useState(false)
  const adaptParticipantsToShow = (): RemoteStream[] => {
    const remoteStreams: Record<string | number, RemoteStream> = {}

    remoteAudioStreams.forEach((audioStream: any) => {
      const midId = Number(audioStream.midId)
      const userId = usersAudioTrackToIdMap[midId]
      if (userId) {
        if (!remoteStreams[userId]) {
          remoteStreams[userId] = {
            userId: Number(userId),
            audioTrack: null,
            videoTrack: null,
            mid: String(midId),
          }
        }

        remoteStreams[userId].audioTrack = audioStream.audioTrack
      }
    })

    remoteVideoStreams.forEach((videoStream: any) => {
      const midId = Number(videoStream.midId)
      const userId = usersVideoTrackToIdMap[midId]

      if (userId) {
        if (!remoteStreams[userId]) {
          remoteStreams[userId] = {
            userId: Number(userId),
            audioTrack: null,
            videoTrack: null,
            mid: String(midId),
          }
        }

        remoteStreams[userId].videoTrack = videoStream.videoTrack
      }
    })

    const participantsSteams = Object.values(remoteStreams)
    if (localStream) {
      participantsSteams.unshift(localStream)
    }

    return participantsSteams
  }

  const participantsToShow = adaptParticipantsToShow()
  // const activeSpeaker = 1
  // console.log(participantsToShow, 'participantsToShowparticipantsToShowparticipantsToShow');
  const isLocalUser = localUserId != null
  // const activeSpeaker = useHighlightSpeaker(peerConnection, usersAudioTrackToIdMap) // for Highlight need to test it in nearest future
  const activeSpeaker = useHighlightSpeaker(peerConnection, participantsToShow)
  const totalParticipants = participantsToShow.length

  // check it for share screen, user who shared screen should be the first one in list
  // const sharingScreenStream = participantsToShow.find((stream) => stream?.userId === Number(sharingOwner));
  // const currentSharedUser = participants.find((user) => user.id === sharingScreenStream?.userId);

  // if (sharingScreenStream) {
  //   const index = participantsToShow.findIndex((stream) => stream?.userId === Number(sharingOwner));
  //   participantsToShow.splice(index, 1);
  // }

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

  const renderStream = (item: any, index: number) => {
    const isActive =
      item?.userId === localUserId
        ? activeHostSpeaker && !isMuted
        : activeSpeaker !== null &&
          Number(activeSpeaker) === Number(item?.userId)

    const mediaStream = new MediaStream()

    if (item?.videoTrack) mediaStream.addTrack(item?.videoTrack)
    if (item?.audioTrack) mediaStream.addTrack(item?.audioTrack)

    const user = participants?.find(
      (user: User) => user.id === item.userId
    ) as UserInMeeting
    const lastNameInitial = user?.lastName?.charAt?.(0) || ""

    const isMicMuted = item?.userId === localUserId ? isMuted : !user?.isAudioOn
    const isCameraOff =
      item?.userId === localUserId ? isVideoOff : !user?.isVideoOn
    const morePeopleWithSharing = totalParticipants - 2
    const morePeople = totalParticipants - 4
    const isShowMorePeopleScreenShare =
      sharingOwner && totalParticipants >= 3 && index === 1
    const isShowMorePeople = totalParticipants >= 7 && index === 5

    return (
      <View
        key={item?.id || index}
        style={getGridStyle({
          idx: index,
          total: totalParticipants,
          sharingOwner,
        })}
      >
        {isActive && (
          <LinearGradient
            colors={["#70DDE3", "#9FF8E1", "#B8FFC6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeSpeakerBorder}
          />
        )}
        <View style={styles.videoContainer}>
          {isShowMorePeopleScreenShare ? (
            <View style={styles.cameraOffContainer}>
              <Text style={styles.text}>
                {morePeopleWithSharing} {t("morePeople")}
              </Text>
            </View>
          ) : isShowMorePeople ? (
            <View style={styles.cameraOffContainer}>
              <Text style={styles.text}>
                {morePeople} {t("morePeople")}
              </Text>
            </View>
          ) : isCameraOff ? (
            <View style={styles.cameraOffContainer}>
              {user?.photo?.link ? (
                <Image
                  source={{ uri: user.photo.link }}
                  style={{
                    width: moderateScale(88),
                    height: moderateScale(88),
                    borderRadius: moderateScale(100),
                  }}
                />
              ) : (
                <Icon name="avatarEmpty" />
              )}
            </View>
          ) : (
            <View
              style={{
                borderRadius: moderateScale(12),
                overflow: "hidden",
              }}
            >
              <RTCView
                mirror={true}
                streamURL={mediaStream?.toURL?.()}
                style={styles.rtcView}
                objectFit="cover"
              />
            </View>
          )}

          <Text style={styles.userName}>
            {user?.firstName} {lastNameInitial}.
          </Text>
          {isMicMuted && (
            <Icon
              name="microMuted"
              style={{
                position: "absolute",
                top: moderateScale(12),
                right: moderateScale(12),
              }}
            />
          )}
        </View>
      </View>
    )
  }

  const sharedScreenStream = new MediaStream()
  if (sharedScreen) sharedScreenStream.addTrack(sharedScreen)

  return (
    <View style={styles.container}>
      {sharingOwner && (
        <View style={styles.sharingContainer}>
          <RTCView
            streamURL={sharedScreenStream.toURL()}
            style={{ width: "100%", height: "100%" }}
            objectFit="cover"
          />
        </View>
      )}
      {participantsToShow.map((item, index) => renderStream(item, index))}
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
  },
  sharingContainer: {
    width: "100%",
    height: "50%",
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
  rtcView: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: moderateScale(12),
  },
  videoContainer: {
    position: "relative",
    borderRadius: moderateScale(12),
    overflow: "hidden",
    width: "100%",
    height: "100%",
    padding: moderateScale(2),
  },
  cameraOffContainer: {
    backgroundColor: colors.charcoal,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: moderateScale(12),
    width: "100%",
    height: "100%",
    padding: moderateScale(2),
  },
  activeSpeakerBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(12),
  },
  userName: {
    position: "absolute",
    left: moderateScale(12),
    bottom: moderateScale(12),
    ...fontFamilies.interManropeBold16,
    ...fontWeights.fontWeight600,
    color: colors.white,
  },
  morePeopleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight600,
    color: colors.ghostWhite,
  },
})
