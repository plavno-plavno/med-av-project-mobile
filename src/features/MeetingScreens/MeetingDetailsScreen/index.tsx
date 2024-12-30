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
    hash?: string;
  }
}

const MeetingDetailsScreen = () => {
  const { t } = useTranslation()
  const {
    localStream,
    remoteStreams,
    startCall,
    endCall,
    isMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
    messages,
    sendMessage,
    setLocalStream,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    sharingOwner,
    participants,
    RTCView,
  } = useWebRTC(true);
    const route = useRoute<RouteProp<ParamList, "Detail">>()
    const { navigate } = useNavigation<ROUTES>();

  return (
    <ScreenWrapper title="Meeting Details" isBackButton isCenterTitle>
      <View style={styles.container}>
        <View
          // TODO: Add video
          style={{
            
            marginTop: 20,
            height: "60%",
            justifyContent: "center",
            alignSelf: "center",
            borderRadius: 40,
            width: "65%",
            overflow: "hidden",
          }}
        >
          {localStream && !isVideoOff ? 
            <RTCView
            style={{
              height: "100%",
              width: "100%",
            }}
            streamURL={localStream?.toURL?.()}
            mirror={true}
            />
            :
            <View style={{backgroundColor: colors.charcoal, width: '100%', height: '100%'}}/>
          }
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
          <Text style={styles.title}>Getting ready...</Text>
          <Text style={styles.subtitle}>
            You’ll be able to join just a moment
          </Text>
        </View>
        <View style={helpers.gap8}>
          <CustomButton
            text={t("JoinMeeting")}
            style={{ backgroundColor: colors.lightAqua }}
            onPress={() => navigate(ScreensEnum.MEETING, {hash: route?.params?.hash})}
          />
          <CustomButton
            text={t("CopyMeetingLink")}
            type="secondary"
            leftIcon="copy"
            style={styles.copyMeetingLink}
            onPress={() => copyToClipboard(`https://av-hims.netlify.app/meetings/${route?.params?.hash}`)}
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default MeetingDetailsScreen
