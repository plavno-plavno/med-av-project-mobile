import React, { useCallback, useEffect, useRef, useState } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import ScreenWrapper from "src/components/ScreenWrapper"
import { styles } from "./styles"
import { CustomButton, Icon } from "@components"
import { useTranslation } from "react-i18next"
import { helpers } from "@utils/theme"
import colors from "src/assets/colors"
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native"
import { copyToClipboard } from "@utils/clipboard"
import { ROUTES } from "src/navigation/RoutesTypes"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { mediaDevices, MediaStream, RTCView } from "react-native-webrtc"
import { useGetCalendarEventByHashQuery } from "src/api/calendarApi/calendarApi"
import { useAuthMeQuery } from "src/api/userApi/userApi"
import { useMeetingAccess } from "src/hooks/useMeetingAccess"
import { ActivityIndicator } from "react-native-paper"

type ParamList = {
  Detail: {
    title: string
    hash?: string
    ownerEmail?: string
  }
}

const MeetingDetailsScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation<ROUTES>()
  const route = useRoute<RouteProp<ParamList, "Detail">>()
  const { hash, ownerEmail } = route.params

  const { data: authMe } = useAuthMeQuery()
  const isCreatorMode = authMe?.email === ownerEmail

  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [preview, setPreview] = useState<MediaStream>()
  const { data: getCalendarEventByHashData } = useGetCalendarEventByHashQuery({
    hash: String(hash),
  })
  const roomId = getCalendarEventByHashData?.meetId

  const [invitedParticipants, setInvitedParticipants] = useState<any[]>([])
  const [meInvited, setMeInvited] = useState<boolean | null>(null)

  const { isRequestingJoin, requestJoinEvent, isSocketConnected } =
    useMeetingAccess({
      setInvitedParticipants,
      setMeInvited,
      invitedParticipants,
      eventId: String(getCalendarEventByHashData?.id),
    })

  const isMeetingOwner =
    authMe?.id === getCalendarEventByHashData?.createdBy?.id

  const handleJoinRequest = () => {
    if (isSocketConnected && !meInvited && !isRequestingJoin) {
      requestJoinEvent({
        eventId: String(getCalendarEventByHashData?.id),
        userId: String(authMe?.id),
      })
    }
    if (meInvited) {
      if (isMuted) {
        preview?.getTracks().forEach((t) => t.stop())
      }
      navigate(ScreensEnum.MEETING, {
        hash: hash,
        isMuted: isMuted,
        isVideoOff: isVideoOff,
        isCreatorMode: isCreatorMode,
        title: getCalendarEventByHashData?.title,
        instanceMeetingOwner: isMeetingOwner,
        meetId: roomId,
        eventId: getCalendarEventByHashData?.id,
      })
    }
  }

  const toggleAudio = () => {
    if (preview) {
      preview.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
    }
    setIsMuted((prev) => !prev)
  }

  const toggleVideo = () => {
    if (preview) {
      preview.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
    }
    setIsVideoOff((prev) => !prev)
  }

  useFocusEffect(
    useCallback(() => {
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
      return () => {
        preview?.getTracks().forEach((t) => t.stop())
        preview?.getTracks().forEach((t) => t.release())
      }
    }, [])
  )
  useEffect(() => {
    if (getCalendarEventByHashData) {
      setInvitedParticipants(
        getCalendarEventByHashData?.participants.map(
          ({ user }: { user: any }) => user
        )
      )
      const isCurrentUserInvited = getCalendarEventByHashData.participants.some(
        ({ user }: { user: any }) => user.id === authMe?.id
      )
      setMeInvited(isCurrentUserInvited)
    }
  }, [getCalendarEventByHashData])

  return (
    <ScreenWrapper
      title={getCalendarEventByHashData?.title || hash}
      isBackButton
      isCenterTitle
    >
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
            text={
              !meInvited && !isRequestingJoin ? (
                t("AskToJoin")
              ) : !meInvited && isRequestingJoin ? (
                <ActivityIndicator size={"small"} color={"#fff"} />
              ) : (
                t("JoinMeeting")
              )
            }
            style={{ backgroundColor: colors.lightAqua }}
            onPress={handleJoinRequest}
          />

          <CustomButton
            text={t("CopyMeetingLink")}
            type="secondary"
            leftIcon="copy"
            style={styles.copyMeetingLink}
            onPress={() =>
              copyToClipboard(`https://svensacall.com/meetings/${hash}`)
            }
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default MeetingDetailsScreen
