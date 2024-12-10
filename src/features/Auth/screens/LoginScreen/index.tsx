import React from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { useTranslation } from "react-i18next"
import { useEmailLoginMutation } from "src/api/auth/authApi"
import { CustomButton } from "@components"
import { styles } from "./styles"
import { View, Text } from "react-native"
import { Formik } from "formik"
import CustomInput from "src/components/CustomInput"
import { helpers } from "@utils/theme"
import { validationLoginSchema } from "@utils/validationSchemas"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { useNavigation } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"

const LoginScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()

  const [emailLogin, { isLoading: isEmailLoginLoading }] =
    useEmailLoginMutation()

  const handleLogin = async (values: { email: string; password: string }) => {
    // TODO: REFACTOR LOGIN
    try {
      const res = await emailLogin(values).unwrap()
      console.log(res, "res login")
    } catch (error) {
      console.log(error, "error login")
    }
  }

  return (
    <ScreenWrapper isBackButton title={t("LogIn")} isCenterTitle>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={validationLoginSchema}
        onSubmit={handleLogin}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
        }) => (
          <View style={styles.container}>
            <View style={[helpers.gap24]}>
              <View style={[helpers.gap8]}>
                <Text style={styles.title}>{t("WelcomeBack")}</Text>
                <Text style={styles.subtitle}>
                  {t("WeAreHappyToSeeYouBackPleaseLogInToContinue")}
                </Text>
              </View>

              <View style={[helpers.gap16]}>
                <CustomInput
                  label={t("E-mail")}
                  placeholder={t("EnterYourEmail")}
                  keyboardType="email-address"
                  onBlur={handleBlur("email")}
                  onChangeText={handleChange("email")}
                  value={values.email}
                  error={touched.email && errors.email}
                />
                <CustomInput
                  label={t("Password")}
                  placeholder={t("EnterYourPassword")}
                  secureTextEntry
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                  error={touched.password && errors.password}
                />
              </View>

              <Text style={styles.forgotPassword}>{t("ForgotPassword")}</Text>
            </View>

            <View style={[helpers.gap8]}>
              <CustomButton
                type="primary"
                text={t("LogIn")}
                onPress={handleSubmit}
                isLoading={isEmailLoginLoading}
              />
              <CustomButton
                type="secondary"
                text={t("IDontHaveAnAccount")}
                onPress={() => navigation.navigate(ScreensEnum.SIGN_UP)}
                isLoading={false}
              />
            </View>
          </View>
        )}
      </Formik>
    </ScreenWrapper>
  )
}

export default LoginScreen
