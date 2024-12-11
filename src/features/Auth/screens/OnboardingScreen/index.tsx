import React from "react"
import ScreenWrapper from "../../../../components/ScreenWrapper"
import TermsAndConditions from "../../../../components/TermsAndConditions"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { CustomButton, Icon } from "../../../../components"
import { helpers } from "../../../../utils/theme"
import { useNavigation } from "@react-navigation/native"
import { ScreensEnum } from "../../../../navigation/ScreensEnum"
import { ROUTES } from "../../../../navigation/RoutesTypes"
import { styles } from "./styles"

const OnboardingScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()
  return (
    <ScreenWrapper onboardingScreen>
      <View style={styles.container}>
        <Icon name={"getStartedStar"} />

        <View style={styles.content}>
          <View style={[helpers.gap8]}>
            <Text style={styles.title}>{t("GetStarted")}</Text>
            <Text style={styles.subtitle}>{t("ConnectAndCollaborate")}</Text>
          </View>

          <View style={[helpers.gap8]}>
            <CustomButton
              type="primary"
              text={t("LogIn")}
              onPress={() => navigation.navigate(ScreensEnum.LOGIN)}
            />
            <CustomButton
              type="secondary"
              text={t("CreateAccount")}
              onPress={() => navigation.navigate(ScreensEnum.SIGN_UP)}
            />
          </View>

          <TermsAndConditions />
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default OnboardingScreen
