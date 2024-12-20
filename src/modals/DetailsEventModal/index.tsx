import React from "react"
import { screenHeight } from "@utils/screenResponsive"
import { Text, View } from "react-native"
import colors from "src/assets/colors"
import BottomSheet, { type BottomSheetMethods } from "@devvie/bottom-sheet"
import { styles } from "./styles"
import { Portal } from "react-native-portalize"
import { CustomButton, Icon } from "@components"
import { helpers } from "@utils/theme"
import { useTranslation } from "react-i18next"
import {
  useDeleteEventMutation,
  useGetCalendarEventDetailsQuery,
  useGetCalendarEventsQuery,
} from "src/api/calendarApi/calendarApi"
import moment from "moment"
import Participants from "src/components/Participants"
import Toast from "react-native-toast-message"
import { ActivityIndicator } from "react-native-paper"
import { formatTime } from "@utils/utils"

const DetailsEventModal = ({
  eventId,
  sheetRef,
  onClose,
}: {
  eventId: number
  sheetRef: React.RefObject<BottomSheetMethods>
  onClose: () => void
  isVisible: boolean
}) => {
  const { t } = useTranslation()

  const { data: eventDetailsData, isLoading: isEventDetailsLoading } =
    useGetCalendarEventDetailsQuery({ id: eventId })

  const { refetch: calendarEventsRefetch } = useGetCalendarEventsQuery()

  const [deleteEvent, { isLoading: isDeleteEventLoading }] =
    useDeleteEventMutation()

  const handleDeleteEvent = async () => {
    await deleteEvent({ id: eventId }).unwrap();
    calendarEventsRefetch()
    Toast.show({
      type: "success",
      text1: t("EventDeleted"),
    })
    onClose()
  }

  const transformDate = (dateString: string) => {
    return moment(dateString).format("dddd, MMMM D")
  }

  return (
    <Portal>
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
                <Text style={styles.subtitle}>{t("DesignOnboardingCall")}</Text>
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
                  />
                </View>
                <View style={[helpers.gap12]}>
                  <View style={styles.infoWrapper}>
                    <Icon name="calendarIcon" />
                    <Text style={styles.text}>
                      {eventDetailsData?.startDate &&
                        transformDate(eventDetailsData.startDate)}
                    </Text>
                  </View>
                  <View style={styles.infoWrapper}>
                    <Icon name="clock" />
                    <Text style={styles.text}>
                      {formatTime(eventDetailsData?.startDate) +
                        "-" +
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
                  <View style={[helpers.flexRow, helpers.gap8]}>
                    <Icon name="info" />
                    <Text style={[styles.text, { color: colors.midGrey }]}>
                      {eventDetailsData?.description}
                    </Text>
                  </View>
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
                  isLoading={isDeleteEventLoading}
                  onPress={handleDeleteEvent}
                  text={t("DeleteMeeting")}
                  textStyle={{ color: colors.alertRed }}
                  style={[
                    {
                      backgroundColor: colors.errorLight,
                    },
                  ]}
                />
                <CustomButton text={t("EditDetails")} />
              </View>
            </>
          )}
        </View>
      </BottomSheet>
    </Portal>
  )
}

export default DetailsEventModal
