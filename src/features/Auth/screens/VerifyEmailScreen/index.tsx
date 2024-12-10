import React from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { Trans, useTranslation } from "react-i18next"
import { Icon } from "@components"
import { styles } from "./styles"
import { View, Text } from "react-native"
import { useRoute } from "@react-navigation/native"
import { helpers } from "@utils/theme"

const VerifyEmailScreen = () => {
  const { t } = useTranslation()
  const route = useRoute()

  const { email } = route.params as { email: string }

  return (
    <ScreenWrapper isBackButton title={t("SignUp")} isCenterTitle>
      <View style={styles.container}>
        <Icon name={"mail"} />

        <View style={[helpers.gap8, helpers.mb24]}>
          <Text style={styles.title}>{t("VerifyYourEmail")}</Text>
          <Text style={styles.subtitle}>
            {t("WeSentAVerificationLinkToYourEmail")}
          </Text>
        </View>

        <View style={[helpers.mb24, styles.emailContainer]}>
          <Text style={styles.email}>{email}</Text>
        </View>

        <Text style={[helpers.mb24, styles.subtitle]}>
          {t("PleaseCheckYourEmail")}
        </Text>

        <View>
          <Text style={styles.subtitle}>
            <Trans
              i18nKey="DontReceiveTheEmail"
              components={{
                resend: (
                  <Text
                    style={styles.link}
                    //TODO: ADD RESEND EMAIL LOGIC
                    onPress={() => {}}
                  />
                ),
              }}
            />
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default VerifyEmailScreen
