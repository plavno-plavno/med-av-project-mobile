import { CustomButton } from "@components"
import { useNavigation } from "@react-navigation/native"
import { isIOS } from "@utils/platformChecker"
import * as Keychain from "react-native-keychain"
import { helpers } from "@utils/theme"
import React from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { moderateScale } from "react-native-size-matters"
import Toast from "react-native-toast-message"
import {
  useLogoutMutation,
  useUpdateAuthMeMutation,
} from "src/api/userApi/userApi"
import CustomInput from "src/components/CustomInput"
import ScreenWrapper from "src/components/ScreenWrapper"
import { ROUTES } from "src/navigation/RoutesTypes"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { Formik, FormikHelpers, FormikProps } from "formik"
import { validationEmailSchema } from "@utils/validationSchemas"

interface IFormValues {
  email: string
}

const ChangeEmailScreen = () => {
  const navigation = useNavigation<ROUTES>()
  const { t } = useTranslation()
  const formikRef = React.useRef<FormikProps<IFormValues>>(null as any)
  const [logout] = useLogoutMutation()

  const [updateAuthMe, { isLoading: isUpdateAuthMeLoading }] =
    useUpdateAuthMeMutation()

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      await Keychain.resetGenericPassword({ service: "accessToken" })
      await Keychain.resetGenericPassword({ service: "refreshToken" })
      navigation.reset({
        index: 0,
        routes: [{ name: ScreensEnum.ONBOARDING }],
      })
    } catch (error) {
      console.log(error, "ERROR")
    }
  }

  const handleChangeEmail = async (values: IFormValues) => {
    try {
      await updateAuthMe({
        email: values.email,
      }).unwrap()
      Toast.show({
        type: "success",
        text1: t("EmailChanged"),
      })
      handleLogout()
    } catch (error) {
      console.log(error, "error handleUpdateProfile")
    }
  }

  return (
    <ScreenWrapper
      isBackButton
      title={t("ChangeE-mail")}
      isCenterTitle
      keyboardVerticalOffset={isIOS() ? moderateScale(-100) : undefined}
    >
      <KeyboardAwareScrollView
        style={helpers.flex1}
        bounces={false}
        enableOnAndroid
        enableAutomaticScroll
        showsVerticalScrollIndicator={false}
      >
        <Formik
          innerRef={formikRef}
          initialValues={{ email: "" }}
          onSubmit={handleChangeEmail}
          validationSchema={validationEmailSchema}
          validateOnChange={true}
        >
          {({ handleChange, values, errors, touched }) => (
            <CustomInput
              label={t("E-mail")}
              placeholder={t("EnterYourEmail")}
              value={values.email}
              onChangeText={(e) => handleChange("email")(e as string)}
              error={touched.email && errors.email}
            />
          )}
        </Formik>
      </KeyboardAwareScrollView>
      <CustomButton
        style={{ bottom: moderateScale(30) }}
        text={t("ChangeE-mail")}
        onPress={() => {
          formikRef.current?.submitForm()
        }}
        isLoading={isUpdateAuthMeLoading}
      />
    </ScreenWrapper>
  )
}

export default ChangeEmailScreen

export const styles = StyleSheet.create({})