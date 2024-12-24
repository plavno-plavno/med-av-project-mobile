import { View, Text } from "react-native"
import ScreenWrapper from "src/components/ScreenWrapper"
import { styles } from "./styles"
import { CustomButton } from "@components"
import { useTranslation } from "react-i18next"
import { helpers } from "@utils/theme"
import colors from "src/assets/colors"

const MeetingDetailsScreen = () => {
  const { t } = useTranslation()
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
            width: "70%",
          }}
        ></View>
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
