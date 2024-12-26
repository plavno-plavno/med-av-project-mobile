import { View, Text, TouchableOpacity } from "react-native"
import ScreenWrapper from "src/components/ScreenWrapper"
import { styles } from "./styles"
import { CustomButton, Icon } from "@components"
import { useTranslation } from "react-i18next"
import { helpers } from "@utils/theme"
import colors from "src/assets/colors"
import useWebRTC from "src/hooks/useWebRtc"

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
  } = useWebRTC();

  return (
    <ScreenWrapper title="MeetingDetails" isBackButton isCenterTitle>
      <View style={styles.container}>
        <View
          // TODO: Add video
          style={{
            backgroundColor: colors.charcoal,
            marginTop: 20,
            height: "60%",
            justifyContent: "center",
            alignSelf: "center",
            borderRadius: 40,
            width: "65%",
            overflow: 'hidden',
          }}
        >
          {!isVideoOff && localStream && (
            <RTCView style={{
              height: "100%",
              width: "100%",
            }} streamURL={localStream.toURL()} mirror={true} />
          )}
          <TouchableOpacity onPress={toggleVideo} style={{ position: 'absolute', bottom: 10, alignSelf: 'center' }}>
            {!isVideoOff ?
              <Icon name={'eyeOpen'} />
              :
              <Icon name={'eyeClose'} />}
          </TouchableOpacity>

          {/* TODO make the same for isMuted and toggleAudio as toggleVideo */}
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
          />
          <CustomButton
            text={t("CopyMeetingLink")}
            type="secondary"
            leftIcon="copy"
            style={styles.copyMeetingLink}
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default MeetingDetailsScreen
