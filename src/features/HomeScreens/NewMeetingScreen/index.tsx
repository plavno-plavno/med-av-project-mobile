import { StyleSheet, Text, View } from "react-native"
import React, { useRef } from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { useTranslation } from "react-i18next"
import { Icon } from "@components"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import colors from "src/assets/colors"
import MeetingsButton from "src/components/MeetingsButton"
import { moderateScale } from "react-native-size-matters"
import ScheduleMeetingModal from "src/modals/ScheduleMeetingModal"
import { BottomSheetMethods } from "@devvie/bottom-sheet"
import { Portal } from "react-native-portalize"
import { useNavigation } from "@react-navigation/native"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { ROUTES } from "src/navigation/RoutesTypes"
import { useCreateInstantEventMutation } from "src/api/calendarApi/calendarApi"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"

type ParamList = {
  Detail: {
    title: string
    hash?: string
    isCreatorMode?: boolean
  }
}

const NewMeetingScreen = () => {
  const { t } = useTranslation()
  const naviqation = useNavigation<ROUTES>()
  const sheetRef = useRef<BottomSheetMethods>(null)
  const scrollRef = useRef<KeyboardAwareScrollView>(null)

  const [createInstantEvent, { isLoading: isCreateInstantEventLoading }] =
    useCreateInstantEventMutation()
  const onClose = () => {
    sheetRef.current?.close()
  }

  const onOpen = () => {
    sheetRef.current?.open()
    scrollRef?.current?.scrollToPosition(0, 0, true)
  }
  const onCreateInstantEvent = async () => {
    try {
      const res = await createInstantEvent().unwrap()
      naviqation.navigate(ScreensEnum.MEETING_DETAILS, {
        hash: res?.hash,
      })
    } catch (error) {
      console.log(error)
    }
  }
  
  return (
    <>
      <ScreenWrapper title={t("NewMeeting")} isCenterTitle>
        <View style={styles.container}>
          <Icon name="meetingLogo" width={"100%"} height="250" />
          <View>
            <Text style={styles.title}>{t("StartNewMeeting")}</Text>
            <Text style={styles.subtitle}>{t("StartAMeeting")}</Text>
          </View>
          <View style={[helpers.gap8, helpers.width100Percent]}>
            <MeetingsButton
              icon="videoIcon"
              title={t("StartMeetingInstantly")}
              onPress={onCreateInstantEvent}
            />
            <MeetingsButton
              icon="scheduleMeeting"
              title={t("ScheduleMeeting")}
              onPress={onOpen}
            />
          </View>
        </View>
      </ScreenWrapper>
      <Portal>
        <ScheduleMeetingModal
          onClose={onClose}
          sheetRef={sheetRef}
          eventId={0}
          scrollRef={scrollRef}
        />
      </Portal>
    </>
  )
}

export default NewMeetingScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(20),
  },
  title: {
    ...fontFamilies.interManropeSemiBold32,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
    textAlign: "center",
  },
  subtitle: {
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
    textAlign: "center",
  },
})
