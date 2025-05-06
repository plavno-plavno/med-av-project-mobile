import { Image, StyleSheet, Text, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import { Icon } from "../Icon"
import { fontFamilies, fontWeights } from "@utils/theme"
import colors from "src/assets/colors"
import { MediaStream, RTCView } from "react-native-webrtc"
import LinearGradient from "react-native-linear-gradient"
import { getGridStyle } from "@utils/gridStyle"
import { useTranslation } from "react-i18next"

interface IParticipantItem {
  isActiveHighlighter: boolean
  user: any
  isMicMuted: boolean
  isCameraOff: boolean
  totalParticipants: number
  sharingOwner?: number
  participant: any
  mediaStream: MediaStream
  idx: number
}

const MicroMuted = () => (
  <Icon
    name="microMuted"
    style={{
      position: "absolute",
      top: moderateScale(12),
      right: moderateScale(12),
    }}
  />
)

const ParticipantItem = ({
  isActiveHighlighter,
  user,
  isMicMuted,
  isCameraOff,
  totalParticipants,
  sharingOwner,
  participant,
  mediaStream,
  idx,
}: IParticipantItem) => {
  const { t } = useTranslation()

  const lastNameInitial = user?.lastName?.charAt?.(0) || ""
  const morePeopleWithSharing = totalParticipants - 2
  const morePeople = totalParticipants - 6
  const isShowMorePeopleScreenShare =
    sharingOwner && totalParticipants >= 3 && idx === 1

  const isShowMorePeople = totalParticipants >= 7 && idx === 5
  const isParticipantAvatar = user?.photo?.link
  const isMorePeople = isShowMorePeopleScreenShare || isShowMorePeople

  return (
    <View
      key={participant?.id ?? idx}
      style={getGridStyle({
        idx,
        total: totalParticipants,
        sharingOwner,
      })}
    >
      {isMorePeople ? (
        <View style={styles.participant}>
          <View style={styles.withoutCamera}>
            <Text style={styles.text}>
              {isShowMorePeopleScreenShare ? morePeopleWithSharing : morePeople}{" "}
              {t("morePeople")}
            </Text>
          </View>
        </View>
      ) : (
        <>
          {isActiveHighlighter && (
            <LinearGradient
              colors={["#70DDE3", "#9FF8E1", "#B8FFC6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeSpeakerBorder}
            />
          )}

          <View style={styles.participant}>
            {isCameraOff ? (
              <View style={styles.withoutCamera}>
                {isParticipantAvatar ? (
                  <Image
                    source={{ uri: user?.photo?.link }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <Icon name="avatarEmpty" />
                )}
              </View>
            ) : (
              <View style={styles.rtcView}>
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
            {isMicMuted && <MicroMuted />}
          </View>
        </>
      )}
    </View>
  )
}

export default ParticipantItem

const styles = StyleSheet.create({
  userName: {
    position: "absolute",
    left: moderateScale(12),
    bottom: moderateScale(12),
    ...fontFamilies.interManropeBold16,
    ...fontWeights.fontWeight600,
    color: colors.white,
  },
  text: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight600,
    color: colors.ghostWhite,
  },
  rtcView: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: moderateScale(12),
  },
  withoutCamera: {
    backgroundColor: colors.charcoal,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: moderateScale(12),
    width: "100%",
    height: "100%",
    padding: moderateScale(2),
  },
  participant: {
    position: "relative",
    borderRadius: moderateScale(12),
    overflow: "hidden",
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
  userAvatar: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(100),
  },
})
