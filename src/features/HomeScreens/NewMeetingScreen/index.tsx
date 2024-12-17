import { StyleSheet, Text, View } from "react-native"
import React from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { useTranslation } from "react-i18next"
import { Icon } from "@components"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import colors from "src/assets/colors"
import MeetingsButton from "src/components/MeetingsButton"
import { moderateScale } from "react-native-size-matters"
import ScheduleMeetingModal from "src/components/ScheduleMeetingModal"

const NewMeetingScreen = () => {
  const { t } = useTranslation()
  const [isModalVisible, setIsModalVisible] = React.useState(false)
  return (
    <ScreenWrapper title={t("NewMeeting")} isCenterTitle>
      <View style={styles.container}>
        <Icon name="meetingLogo" />
        <View>
          <Text style={styles.title}>{t("StartNewMeeting")}</Text>
          <Text style={styles.subtitle}>{t("StartAMeeting")}</Text>
        </View>
        <View style={[helpers.gap8, helpers.width100Percent]}>
          <MeetingsButton icon="videoIcon" title={t("StartMeetingInstantly")} />
          <MeetingsButton
            icon="scheduleMeeting"
            title={t("ScheduleMeeting")}
            onPress={() => setIsModalVisible(true)}
          />
        </View>
      </View>
      <ScheduleMeetingModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </ScreenWrapper>
  )
}

export default NewMeetingScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(24),
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
