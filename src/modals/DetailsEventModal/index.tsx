import React, { useState } from "react"
import { screenHeight } from "@utils/screenResponsive"
import { FlatList, Text, TouchableOpacity, View } from "react-native"
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
import { DateTimeFormatEnum } from "@utils/enums"
import { copyToClipboard } from "@utils/clipboard"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { navigate } from "src/navigation/RootNavigation"
import { isAndroid, isIOS } from "@utils/platformChecker"
import RNFetchBlob from "react-native-blob-util"
import Share from "react-native-share"
import * as Keychain from "react-native-keychain"
import Config from "react-native-config"
import { moderateScale } from "react-native-size-matters"

const baseURL = Config.BASE_API_URL

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
  const [isOpenSrtModal, setIsOpenSrtModal] = useState(false)
  const {
    data: eventDetailsData,
    isLoading: isEventDetailsLoading,
    refetch: eventDetailsRefetch,
  } = useGetCalendarEventDetailsQuery({ id: eventId }, { skip: !eventId })
  const {
    isOwner,
    hash,
    status,
    startDate,
    endDate,
    title,
    description,
    srtFiles,
  } = eventDetailsData || {}

  const { refetch: calendarEventsRefetch } = useGetCalendarEventsQuery()
  const [updateEvent] = useUpdateEventMutation()
  const [deleteEvent, { isLoading: isDeleteEventLoading }] =
    useDeleteEventMutation()

  const isAccepted = !isOwner && status === "accept"
  const isDeclined = !isOwner && status === "decline"

  const handleDeleteEvent = async () => {
    const res = await deleteEvent({ id: eventId }).unwrap()
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

  const handleAcceptEvent = () => {
    if (isOwner) {
      handleOpenScheduleModal(eventId)
    } else {
      handleTogglerEvent({ status: "accept" })
    }
  }

  const handleSrtDownload = async ({ id }: { id: number }) => {
    try {
      const { dirs } = RNFetchBlob.fs
      const dirToSave = isIOS() ? dirs.DocumentDir : dirs.DownloadDir
      const fileName = `Transcript from Svensacall-${id}.txt`
      const filePath = `${dirToSave}/${fileName}`

      const configfb = {
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          mediaScannable: true,
          title: fileName,
          path: filePath,
          mime: "application/x-subrip",
        },
        path: filePath,
        notification: true,
        mediaScannable: true,
        title: fileName,
      }

      const accessToken = await Keychain.getGenericPassword({
        service: "accessToken",
      })
      if (!accessToken) return

      RNFetchBlob.config(configfb)
        .fetch("GET", `${baseURL}srt/download/${id}`, {
          Authorization: `Bearer ${accessToken.password}`,
          Accept: "application/octet-stream",
        })
        .then((res) => {
          console.log("SRT download successful", res)

          if (isIOS()) {
            RNFetchBlob.fs.writeFile(filePath, res.data, "base64")
            RNFetchBlob.ios.previewDocument(filePath)
          }

          if (isAndroid()) {
            console.log("File downloaded to", res.path())
          }

          Share.open({
            url: `file://${res.path()}`,
            title: "Save or Share SRT",
          }).catch((error: any) => {
            console.error("Error sharing SRT file:", error)
          })
        })
        .catch((e) => {
          console.error("SRT download error:", e)
        })
    } catch (error: any) {
      console.error("Error downloading SRT file:", error?.message || error)
    }
  }

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        height={screenHeight * (screenHeight < 700 ? 1 : 0.87)}
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
                <Text style={styles.subtitle}>{title}</Text>
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
                        hash: hash,
                        ownerEmail: eventDetailsData?.createdBy?.email,
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
                      copyToClipboard(`https://svensacall.com/meetings/${hash}`)
                    }
                  />
                </View>
                <View style={[helpers.gap12]}>
                  <View style={styles.infoWrapper}>
                    <Icon name="calendarIcon" />
                    <Text style={styles.text}>
                      {startDate &&
                        moment(startDate).format(DateTimeFormatEnum.ddddMMMMD)}
                    </Text>
                  </View>
                  <View style={styles.infoWrapper}>
                    <Icon name="clock" />
                    <Text style={styles.text}>
                      {formatTime(startDate) + " – " + formatTime(endDate)}
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
                  {description && (
                    <View
                      style={[
                        helpers.flexRow,
                        helpers.gap8,
                        helpers.maxWidth80Percent,
                      ]}
                    >
                      <Icon name="info" />
                      <Text style={[styles.text, { color: colors.midGrey }]}>
                        {description}
                      </Text>
                    </View>
                  )}
                  {isOwner && !!srtFiles?.length && (
                    <>
                      {/* <CustomButton
                        text="Open srt files list"
                        onPress={() => {
                          setIsOpenSrtModal(!isOpenSrtModal)
                        }}
                      /> */}
                      <CustomButton
                        text={t("OpenSrtFilesList")}
                        type="secondary"
                        // leftIcon="copy"
                        onPress={() => setIsOpenSrtModal(!isOpenSrtModal)}
                      />

                      {isOpenSrtModal && (
                        <FlatList
                          data={srtFiles}
                          style={[styles.srtContainer]}
                          contentContainerStyle={{ gap: moderateScale(8) }}
                          keyExtractor={(item) => item.id.toString()}
                          ListHeaderComponent={
                            <View>
                              <View
                                style={[
                                  helpers.flexRowBetween,
                                  helpers.alignItemsCenter,
                                ]}
                              >
                                <Text style={styles.srtTitle}>
                                  {t("SRTFiles")}
                                </Text>
                                <Icon
                                  name="closeButton"
                                  onPress={() => setIsOpenSrtModal(false)}
                                />
                              </View>
                            </View>
                          }
                          renderItem={({ item: srtFile }) => (
                            <TouchableOpacity
                              onPress={() =>
                                handleSrtDownload({ id: srtFile?.id })
                              }
                              style={[
                                helpers.flexRow,
                                helpers.alignItemsCenter,
                                helpers.gap8,
                                styles.srtWrapper,
                              ]}
                            >
                              <Text style={styles.srtDate}>
                                {moment(srtFile?.createdAt).format(
                                  DateTimeFormatEnum.dmmmyyyhhmm
                                )}
                              </Text>
                              <Icon name={"download"} />
                            </TouchableOpacity>
                          )}
                        />
                      )}
                    </>
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
                {!isDeclined && (
                  <CustomButton
                    isLoading={isDeleteEventLoading || isDeclineEventLoading}
                    onPress={() => {
                      if (isOwner) {
                        handleDeleteEvent()
                      } else {
                        handleTogglerEvent({ status: "decline" })
                      }
                    }}
                    text={isOwner ? t("DeleteMeeting") : t("Decline")}
                    textStyle={{ color: colors.alertRed }}
                    style={[
                      {
                        backgroundColor: colors.errorLight,
                      },
                    ]}
                  />
                )}
                {!isAccepted && (
                  <CustomButton
                    isLoading={isAcceptEventLoading}
                    text={isOwner ? t("EditDetails") : t("Accept")}
                    onPress={handleAcceptEvent}
                  />
                )}
              </View>
            </>
          )}
        </View>
      </BottomSheet>
    </>
  )
}

export default DetailsEventModal
