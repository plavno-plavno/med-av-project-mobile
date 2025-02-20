import React, { useCallback, useEffect, useState } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import ScreenWrapper from "src/components/ScreenWrapper"
import { styles } from "./styles"
import { CustomButton, Icon } from "@components"
import { useTranslation } from "react-i18next"
import { helpers } from "@utils/theme"
import colors from "src/assets/colors"
import useWebRTC from "src/hooks/useWebRtc"
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native"
import { copyToClipboard } from "@utils/clipboard"
import { ROUTES } from "src/navigation/RoutesTypes"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { mediaDevices, MediaStream, RTCView } from "react-native-webrtc"
import { initializeSocket } from "src/hooks/webRtcSocketInstance"

type ParamList = {
  Detail: {
    title: string
    hash?: string
    isCreatorMode?: boolean
  }
}

const MeetingDetailsScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation<ROUTES>()
  const route = useRoute<RouteProp<ParamList, "Detail">>()
  const { hash, isCreatorMode, title } = route.params

  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [preview, setPreview] = useState<MediaStream>();

  const toggleAudio = () => {
    if (preview) {
      preview.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted(prev => !prev);
  };
  
  const toggleVideo = () => {
    if (preview) {
      preview.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoOff(prev => !prev);
  };

  useFocusEffect(useCallback(() => {
    const initialize = async () => {
      let mediaConstraints = {
        audio: true,
        video: {
          frameRate: 30,
          facingMode: "user",
        },
      }
      const stream = await mediaDevices.getUserMedia(mediaConstraints)
      setPreview(stream)
    }
      initialize()
      initializeSocket();
      return () => {
        preview?.getTracks().forEach(t => t.stop());
        preview?.getTracks().forEach(t => t.release());
      }
  }, []))

  return (
    <ScreenWrapper title={title || hash} isBackButton isCenterTitle>
      <View style={styles.container}>
        <View style={styles.videoContainer}>
          {preview && !isVideoOff ? (
            <RTCView
              style={{
                height: "100%",
                width: "100%",
              }}
              streamURL={preview?.toURL?.()}
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
                isCreatorMode: isCreatorMode,
                title: title,
                instanceMeetingOwner: true,
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
