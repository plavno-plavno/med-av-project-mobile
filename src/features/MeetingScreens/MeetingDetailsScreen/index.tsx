import React from "react"
import { View, Text, TouchableOpacity } from "react-native"
import ScreenWrapper from "src/components/ScreenWrapper"
import { styles } from "./styles"
import { CustomButton, Icon } from "@components"
import { useTranslation } from "react-i18next"
import { helpers } from "@utils/theme"
import colors from "src/assets/colors"
import useWebRTC from "src/hooks/useWebRtc"
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { copyToClipboard } from "@utils/clipboard"
import { ROUTES } from "src/navigation/RoutesTypes"
import { ScreensEnum } from "src/navigation/ScreensEnum"

type ParamList = {
  Detail: {
    hash?: string
  }
}

const MeetingDetailsScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation<ROUTES>()
  const {
    localStream,
    isMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
    RTCView,
  } = useWebRTC(true)

  const route = useRoute<RouteProp<ParamList, "Detail">>()
  const { hash } = route.params

  return (
    <ScreenWrapper
      title={hash || t("DesignOnboardingCall")}
      isBackButton
      isCenterTitle
    >
      <View style={styles.container}>
        <View style={styles.videoContainer}>
          {localStream && !isVideoOff ? (
            <RTCView
              style={{
                height: "100%",
                width: "100%",
              }}
              streamURL={localStream?.toURL?.()}
              mirror={true}
            />
          ) : (
            <View style={styles.cameraOffContainer}>
              <Text style={styles.cameraOffText}>{t("CameraIsOff")}</Text>
            </View>
          )}
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={toggleAudio}>
              {isMuted ? <Icon name={"microOff"} /> : <Icon name={"microOn"} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleVideo}>
              {!isVideoOff ? (
                <Icon name={"cameraOn"} />
              ) : (
                <Icon name={"cameraOff"} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View>
          <Text style={styles.title}>{t("GettingReady")}</Text>
          <Text style={styles.subtitle}>
            {t("YoullBeAbleToJoinJustAMoment")}
          </Text>
        </View>
        <View style={helpers.gap8}>
          <CustomButton
            text={t("JoinMeeting")}
            style={{ backgroundColor: colors.lightAqua }}
            onPress={() => {
              navigate(ScreensEnum.MEETING, {
                hash: hash,
                isMuted: isMuted,
                isVideoOff: isVideoOff,
              })
            }}
          />
          <CustomButton
            text={t("CopyMeetingLink")}
            type="secondary"
            leftIcon="copy"
            style={styles.copyMeetingLink}
            onPress={() =>
              copyToClipboard(`https://av-hims.netlify.app/meetings/${hash}`)
            }
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default MeetingDetailsScreen
