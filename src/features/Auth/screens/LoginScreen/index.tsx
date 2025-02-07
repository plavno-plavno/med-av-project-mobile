import React, { useEffect, useMemo, useRef } from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { useTranslation } from "react-i18next"
import { useEmailLoginMutation, useTimezoneQuery } from "src/api/auth/authApi"
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
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { isAndroid, isIOS } from "@utils/platformChecker"
import { useAuthMeQuery } from "src/api/userApi/userApi"
import useKeyboardEvents from "src/hooks/useKeyboardEvents"
import { moderateScale } from "react-native-size-matters"
import { getNotificationToken } from "src/notifications/setupNotification"

interface FormValues {
  email: string
  password: string
}

const LoginScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()
  const formikRef = React.useRef<FormikProps<FormValues>>(null as any)
  const { isKeyboardVisible } = useKeyboardEvents()
  const scrollRef = useRef<KeyboardAwareScrollView>(null)

  const { refetch: authMeRefetch } = useAuthMeQuery()
  const { refetch: timezoneRefetch } = useTimezoneQuery()

  const [emailLogin, { isLoading: isEmailLoginLoading }] =
    useEmailLoginMutation()

  const handleLogin = async (values: { email: string; password: string }) => {
    const notificationToken = await getNotificationToken()
    try {
      const res = await emailLogin({
        email: values.email,
        password: values.password,
      }).unwrap()
      console.log(res?.token, "accessToken")
      await Keychain.setGenericPassword("accessToken", res?.token, {
        service: "accessToken",
      })
      await Keychain.setGenericPassword("refreshToken", res.refreshToken, {
        service: "refreshToken",
      })

      const updatedAuthMeData = await authMeRefetch().unwrap()
      const updatedTimezoneData = await timezoneRefetch().unwrap()
      const initialCheck =
        updatedAuthMeData?.firstName &&
        updatedAuthMeData?.lastName &&
        updatedTimezoneData?.id
          ? ScreensEnum.MAIN
          : ScreensEnum.SETUP_PROFILE

      navigation.reset({
        index: 0,
        routes: [{ name: initialCheck }],
      })
    } catch (error) {
      const { setErrors } = formikRef.current
      setErrors({ email: t("InvalidEmailOrPassword") })
    }
  }

  useEffect(() => {
    if (scrollRef.current && isKeyboardVisible && isAndroid()) {
      scrollRef.current?.scrollForExtraHeightOnAndroid(moderateScale(100))
    }
  }, [isKeyboardVisible])

  return (
    <ScreenWrapper
      isBackButton
      title={t("LogIn")}
      isCenterTitle
      keyboardVerticalOffset={isIOS() ? moderateScale(-50) : 0}
    >
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={helpers.flex1}
        bounces={false}
        enableOnAndroid
        enableAutomaticScroll
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
                      onChangeText={(val) =>
                        handleChange("email")(val as string)
                      }
                      value={values.email}
                      error={touched.email && errors.email}
                    />
                    <CustomInput
                      label={t("Password")}
                      placeholder={t("EnterYourPassword")}
                      secureTextEntry
                      onChangeText={(val) =>
                        handleChange("password")(val as string)
                      }
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

                <View style={styles.buttonsContainer}>
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
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  )
}

export default LoginScreen
