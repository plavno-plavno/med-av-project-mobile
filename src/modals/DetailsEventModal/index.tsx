import React, { useState } from "react"
import { screenHeight } from "@utils/screenResponsive"
import { Text, View } from "react-native"
import colors from "src/assets/colors"
import BottomSheet, { type BottomSheetMethods } from "@devvie/bottom-sheet"
import { styles } from "./styles"
import { CustomButton, Icon } from "@components"
import { helpers } from "@utils/theme"
import { useTranslation } from "react-i18next"
import {
  useDeleteEventMutation,
  useGetCalendarEventDetailsQuery,
  useGetCalendarEventsQuery,
  useUpdateEventMutation,
} from "src/api/calendarApi/calendarApi"
import moment from "moment"
import Participants from "src/components/Participants"
import Toast from "react-native-toast-message"
import { ActivityIndicator } from "react-native-paper"
import { formatTime } from "@utils/utils"
import { useAuthMeQuery } from "src/api/userApi/userApi"
import { DateTimeFormatEnum } from "@utils/enums"
import { copyToClipboard } from "@utils/clipboard"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { navigate } from "src/navigation/RootNavigation"

const DetailsEventModal = ({
  handleOpenScheduleModal,
  eventId,
  sheetRef,
  onClose,
}: {
  handleOpenScheduleModal: (val: number) => void
  eventId: number
  sheetRef: React.RefObject<BottomSheetMethods>
  onClose: () => void
}) => {
  const { t } = useTranslation()

  const [isAcceptEventLoading, setIsAcceptEventLoading] = useState(false)
  const [isDeclineEventLoading, setIsDeclineEventLoading] = useState(false)

  const {
    data: eventDetailsData,
    isLoading: isEventDetailsLoading,
    refetch: eventDetailsRefetch,
  } = useGetCalendarEventDetailsQuery({ id: eventId }, { skip: !eventId })

  const { data: authMeData } = useAuthMeQuery()
  const { refetch: calendarEventsRefetch } = useGetCalendarEventsQuery()
  const [updateEvent, { isLoading: isUpdateEventLoading }] =
    useUpdateEventMutation()
  const [deleteEvent, { isLoading: isDeleteEventLoading }] =
    useDeleteEventMutation()

  const isCreatorMode = authMeData?.email === eventDetailsData?.createdBy?.email

  const handleDeleteEvent = async () => {
    await deleteEvent({ id: eventId }).unwrap()
    calendarEventsRefetch()
    Toast.show({
      type: "success",
      text1: t("EventDeleted"),
    })
    onClose()
  }

  const handleTogglerEvent = async ({ status }: { status: string }) => {
    status === "accept"
      ? setIsAcceptEventLoading(true)
      : setIsDeclineEventLoading(true)
    try {
      await updateEvent({
        id: eventId,
        status: status,
      }).unwrap()
      Toast.show({
        type: "success",
        text1: status === "accept" ? t("EventAccepted") : t("EventDeclined"),
      })
      eventDetailsRefetch()
      calendarEventsRefetch()
      onClose()
    } catch (error) {
      console.log(error, "ERROR")
    } finally {
      setIsAcceptEventLoading(false)
      setIsDeclineEventLoading(false)
    }
  }
  return (
    <>
      <BottomSheet
        ref={sheetRef}
        height={screenHeight * 0.87}
        backdropMaskColor={colors.blackOpacity08}
        style={styles.bottomSheet}
        disableBodyPanning
      >
        <View style={styles.container}>
          {isEventDetailsLoading ? (
            <ActivityIndicator size={"small"} style={{ top: "40%" }} />
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>{t("Details")}</Text>
                <Icon name={"closeButton"} onPress={onClose} />
              </View>
              <View style={styles.content}>
                <Text style={styles.subtitle}>{eventDetailsData?.title}</Text>
                <View
                  style={[
                    helpers.gap8,
                    helpers.flexRow,
                    helpers.width100Percent,
                  ]}
                >
                  <CustomButton
                    text={t("JoinMeeting")}
                    style={[
                      helpers.width50Percent,
                      {
                        backgroundColor: colors.lightAqua,
                      },
                    ]}
                    onPress={() => {
                      onClose()
                      navigate(ScreensEnum.MEETING_DETAILS, {
                        hash: eventDetailsData?.hash,
                        title: eventDetailsData?.title,
                        isCreatorMode,
                      })
                    }}
                  />
                  <CustomButton
                    text={t("CopyLink")}
                    type="secondary"
                    leftIcon="copy"
                    style={[
                      helpers.width50Percent,
                      {
                        borderWidth: 1,
                        backgroundColor: colors.white,
                        borderColor: colors.lavenderMist,
                      },
                    ]}
                    onPress={() =>
                      copyToClipboard(
                        `https://av-hims.netlify.app/meetings/${eventDetailsData?.hash}`
                      )
                    }
                  />
                </View>
                <View style={[helpers.gap12]}>
                  <View style={styles.infoWrapper}>
                    <Icon name="calendarIcon" />
                    <Text style={styles.text}>
                      {eventDetailsData?.startDate &&
                        moment(eventDetailsData.startDate).format(
                          DateTimeFormatEnum.ddddMMMMD
                        )}
                    </Text>
                  </View>
                  <View style={styles.infoWrapper}>
                    <Icon name="clock" />
                    <Text style={styles.text}>
                      {formatTime(eventDetailsData?.startDate) +
                        " – " +
                        formatTime(eventDetailsData?.endDate)}
                    </Text>
                  </View>
                  <View style={styles.infoWrapper}>
                    <Icon name="participants" />
                    <View style={styles.participantsContainer}>
                      {eventDetailsData?.participants.map(
                        (participant: any) => (
                          <Participants
                            key={participant?.id}
                            participants={participant?.email}
                            status={participant?.status}
                          />
                        )
                      )}
                    </View>
                  </View>
                  {eventDetailsData?.description && (
                    <View style={[helpers.flexRow, helpers.gap8]}>
                      <Icon name="info" />
                      <Text style={[styles.text, { color: colors.midGrey }]}>
                        {eventDetailsData?.description}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View
                style={[
                  helpers.gap8,
                  {
                    position: "absolute",
                    bottom: 80,
                    width: "100%",
                    right: 20,
                  },
                ]}
              >
                <CustomButton
                  isLoading={isDeleteEventLoading || isDeclineEventLoading}
                  onPress={() => {
                    if (isCreatorMode) {
                      handleDeleteEvent()
                    } else {
                      handleTogglerEvent({ status: "decline" })
                    }
                  }}
                  text={isCreatorMode ? t("DeleteMeeting") : t("Decline")}
                  textStyle={{ color: colors.alertRed }}
                  style={[
                    {
                      backgroundColor: colors.errorLight,
                    },
                  ]}
                />
                <CustomButton
                  isLoading={isAcceptEventLoading}
                  text={isCreatorMode ? t("EditDetails") : t("Accept")}
                  onPress={() => {
                    if (isCreatorMode) {
                      handleOpenScheduleModal(eventId)
                    } else {
                      handleTogglerEvent({ status: "accept" })
                    }
                  }}
                />
              </View>
            </>
          )}
        </View>
      </BottomSheet>
    </>
  )
}

export default DetailsEventModal
