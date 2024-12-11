import React, { useMemo } from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { Trans, useTranslation } from "react-i18next"
import { Icon } from "@components"
import { View, Text, ActivityIndicator } from "react-native"
import { useRoute } from "@react-navigation/native"
import { helpers } from "@utils/theme"
import { styles } from "./styles"
import { useResendEmailMutation } from "src/api/auth/authApi"

const VerifyScreen = () => {
  const { t } = useTranslation()
  const route = useRoute()

  const { email, type } = route.params as {
    email: string
    type: "verify" | "check"
  }

  const title = useMemo(() => {
    switch (type) {
      case "verify":
        return t("VerifyYourEmail")
      case "check":
        return t("CheckYourEmail")
    }
  }, [type])

  const [resendEmail, { isLoading: isResendEmailLoading }] =
    useResendEmailMutation()

  const handleResendEmail = async ({ email }: { email: string }) => {
    console.log(email, "EMAIL")

    try {
      const res = await resendEmail({ email }).unwrap()
      console.log(res, "res login")
    } catch (error) {
      console.log(error, "error login")
    }
  }

  return (
    <ScreenWrapper isBackButton title={t("SignUp")} isCenterTitle>
      <View style={styles.container}>
        <Icon name={"mail"} />

        <View style={[helpers.gap8, helpers.mb24]}>
          <Text style={styles.title}>{title}</Text>
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
        <View style={styles.resendContainer}>
          <Text style={styles.subtitle}>{t("DontReceiveTheEmail")}</Text>
          {isResendEmailLoading ? (
            <ActivityIndicator />
          ) : (
            <Text
              style={styles.link}
              onPress={() => handleResendEmail({ email })}
            >
              {t("Resend")}
            </Text>
          )}
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default VerifyScreen
