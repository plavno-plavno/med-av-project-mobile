import { CustomButton } from "@components"
import { isIOS } from "@utils/platformChecker"
import { helpers } from "@utils/theme"
import React from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { moderateScale } from "react-native-size-matters"
import Toast from "react-native-toast-message"
import { useUpdateAuthMeMutation } from "src/api/userApi/userApi"
import CustomInput from "src/components/CustomInput"
import ScreenWrapper from "src/components/ScreenWrapper"
import { Formik, FormikProps } from "formik"
import { validationChangePasswordSchema } from "@utils/validationSchemas"
import { ROUTES } from "src/navigation/RoutesTypes"
import { useNavigation } from "@react-navigation/native"

interface IFormValues {
  oldPassword: string
  newPassword: string
  confirmNewPassword: string
}

const ChangePasswordScreen = () => {
  const { t } = useTranslation()
  const formikRef = React.useRef<FormikProps<IFormValues>>(null as any)

  const navigation = useNavigation<ROUTES>()
  const [updateAuthMe, { isLoading: isUpdateAuthMeLoading }] =
    useUpdateAuthMeMutation()

  const handleChangePassword = async (values: IFormValues) => {
    try {
      const res = await updateAuthMe({
        password: values.newPassword,
        oldPassword: values.oldPassword,
      }).unwrap()

      formikRef.current.resetForm()
      navigation.goBack()
      Toast.show({
        type: "success",
        text1: t("Password Changed"),
      })
    } catch (error: any) {
      const { setErrors } = formikRef.current
      setErrors({ oldPassword: t(error?.data?.errors?.oldPassword) })
      console.log(error, "error handleUpdateProfile")
    }
  }

  return (
    <ScreenWrapper
      isBackButton
      title={t("ChangePassword")}
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
          initialValues={{
            newPassword: "",
            oldPassword: "",
            confirmNewPassword: "",
          }}
          onSubmit={handleChangePassword}
          validationSchema={validationChangePasswordSchema}
          validateOnChange={true}
        >
          {({ handleChange, values, errors, touched }) => (
            <View style={helpers.gap16}>
              <CustomInput
                secureTextEntry
                label={t("OldPassword")}
                placeholder={t("EnterYourOldPassword")}
                value={values.oldPassword}
                onChangeText={(e) => handleChange("oldPassword")(e as string)}
                error={touched.oldPassword && errors.oldPassword}
              />
              <CustomInput
                secureTextEntry
                label={t("NewPassword")}
                placeholder={t("EnterYourNewPassword")}
                value={values.newPassword}
                onChangeText={(e) => handleChange("newPassword")(e as string)}
                error={touched.newPassword && errors.newPassword}
              />
              <CustomInput
                secureTextEntry
                label={t("ConfirmNewPassword")}
                placeholder={t("ConfirmYourNewPassword")}
                value={values.confirmNewPassword}
                onChangeText={(e) =>
                  handleChange("confirmNewPassword")(e as string)
                }
                error={touched.confirmNewPassword && errors.confirmNewPassword}
              />
            </View>
          )}
        </Formik>
      </KeyboardAwareScrollView>
      <CustomButton
        style={{ bottom: moderateScale(30) }}
        text={t("ChangePassword")}
        onPress={() => {
          formikRef.current?.submitForm()
        }}
        isLoading={isUpdateAuthMeLoading}
      />
    </ScreenWrapper>
  )
}

export default ChangePasswordScreen

export const styles = StyleSheet.create({})
