import React from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { useTranslation } from "react-i18next"
import { useEmailLoginMutation } from "src/api/auth/authApi"
import { CustomButton } from "@components"
import { styles } from "./styles"
import { View, Text } from "react-native"
import { Formik, FormikProps } from "formik"
import CustomInput from "src/components/CustomInput"
import { helpers } from "@utils/theme"
import { validationLoginSchema } from "@utils/validationSchemas"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { useNavigation } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import * as Keychain from "react-native-keychain"

interface FormValues {
  email: string
  password: string
}

const LoginScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()
  const formikRef = React.useRef<FormikProps<FormValues>>(null as any)

  const [emailLogin, { isLoading: isEmailLoginLoading }] =
    useEmailLoginMutation()

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      const res = await emailLogin({
        email: values.email,
        password: values.password,
      }).unwrap()
      await Keychain.setGenericPassword("accessToken", res?.token, {
        service: "accessToken",
      })
      await Keychain.setGenericPassword("refreshToken", res.refreshToken, {
        service: "refreshToken",
      })
      navigation.reset({
        index: 0,
        routes: [{ name: ScreensEnum.MAIN }],
      })
      console.log(res, "res login")
    } catch (error) {
      const { setErrors } = formikRef.current
      setErrors({ email: t("InvalidEmailOrPassword") })
    }
  }

  return (
    <ScreenWrapper isBackButton title={t("LogIn")} isCenterTitle>
      <Formik
        innerRef={formikRef}
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
        }) => {
          return (
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

                <Text
                  onPress={() =>
                    navigation.navigate(ScreensEnum.FORGOT_PASSWORD)
                  }
                  style={styles.forgotPassword}
                >
                  {t("ForgotPassword?")}
                </Text>
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
          )
        }}
      </Formik>
    </ScreenWrapper>
  )
}

export default LoginScreen
