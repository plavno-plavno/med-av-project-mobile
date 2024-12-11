import React from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { useTranslation } from "react-i18next"
import { CustomButton } from "@components"
import { View, Text } from "react-native"
import { Formik } from "formik"
import CustomInput from "src/components/CustomInput"
import { helpers } from "@utils/theme"
import { validationResetPasswordSchema } from "@utils/validationSchemas"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { useNavigation } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import { styles } from "./styles"
import Toast from "react-native-toast-message"

const ResetPasswordScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()

  // const onResetPassword = () => {
  //   Toast.show({
  //     type: "error",
  //     text1: t("PasswordChanged!"),
  //   })
  //   navigation.navigate(ScreensEnum.LOGIN)
  // }
  return (
    <ScreenWrapper isBackButton title={t("LogIn")} isCenterTitle>
      <Formik
        initialValues={{ password: "", confirmPassword: "" }}
        validationSchema={validationResetPasswordSchema}
        onSubmit={() => {}}
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
                <Text style={styles.title}>{t("EnterANewPassword")}</Text>
                <Text style={styles.subtitle}>{t("CreateANewPassword")}</Text>
              </View>

              <View style={[helpers.gap16]}>
                <CustomInput
                  label={t("NewPassword")}
                  placeholder={t("EnterYourPassword")}
                  onBlur={handleBlur("password")}
                  onChangeText={handleChange("password")}
                  secureTextEntry
                  isHidePassword={false}
                  value={values.password}
                  error={touched.password && errors.password}
                />
                <CustomInput
                  label={t("ConfirmPassword")}
                  placeholder={t("ConfirmYourPassword")}
                  secureTextEntry
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  value={values.confirmPassword}
                  error={touched.confirmPassword && errors.confirmPassword}
                />
              </View>
            </View>

            <CustomButton
              type="primary"
              text={t("ResetPassword")}
              onPress={handleSubmit}
              isLoading={false}
            />
          </View>
        )}
      </Formik>
    </ScreenWrapper>
  )
}

export default ResetPasswordScreen
