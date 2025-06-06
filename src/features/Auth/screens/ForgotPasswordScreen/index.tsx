import React from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { useTranslation } from "react-i18next"
import { useForgotPasswordMutation } from "src/api/auth/authApi"
import { CustomButton } from "@components"
import { styles } from "./styles"
import { View, Text } from "react-native"
import { Formik, FormikProps } from "formik"
import CustomInput from "src/components/CustomInput"
import { helpers } from "@utils/theme"
import { validationEmailSchema } from "@utils/validationSchemas"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { useNavigation } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"

interface FormValues {
  email: string
}

const ForgotPasswordScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()
  const formikRef = React.useRef<FormikProps<FormValues>>(null as any)

  const [forgotPassword, { isLoading: isForgotPasswordLoading }] =
    useForgotPasswordMutation()

  const handleRequestPasswordReset = async ({ email }: { email: string }) => {
    try {
      console.log(email, 'emailemailemail');
      
      const res = await forgotPassword({ email: email.toLowerCase() }).unwrap()
      navigation.navigate(ScreensEnum.VERIFICATION, {
        email,
        type: "check",
      })
      console.log(res, 'resresresresresresresresres');
      
    } catch (error) {
      const typedError: any = error as Error
      const { setErrors } = formikRef.current
      const errorMsg = typedError?.data?.errors?.email
      setErrors({ email: t(errorMsg) })
      console.log(error, "error handleRequestPasswordReset")
    }
  }

  return (
    <ScreenWrapper isBackButton title={t("ForgotPassword")} isCenterTitle>
      <Formik
        innerRef={formikRef}
        initialValues={{ email: "" }}
        validationSchema={validationEmailSchema}
        onSubmit={handleRequestPasswordReset}
      >
        {({
          handleChange,
          handleBlur,
          setErrors,
          handleSubmit,
          values,
          errors,
          touched,
        }) => (
          <View style={styles.container}>
            <View style={[helpers.gap24]}>
              <View style={[helpers.gap8]}>
                <Text style={styles.title}>{t("ResetPassword")}</Text>
                <Text style={styles.subtitle}>
                  {t("EnterYourEmailAddress")}
                </Text>
              </View>

              <View style={[helpers.gap16]}>
                <CustomInput
                  label={t("E-mail")}
                  placeholder={t("EnterYourEmail")}
                  keyboardType="email-address"
                  onBlur={handleBlur("email")}
                  onChangeText={(val) => handleChange("email")(val as string)}
                  value={values.email}
                  error={touched.email && errors.email}
                />
              </View>
            </View>

            <View style={[helpers.gap8]}>
              <CustomButton
                type="primary"
                text={t("RequestPasswordReset")}
                onPress={handleSubmit}
                isLoading={isForgotPasswordLoading}
              />
              <CustomButton
                type="secondary"
                text={t("IDontHaveAnAccount")}
                onPress={() => navigation.navigate(ScreensEnum.SIGN_UP)}
              />
            </View>
          </View>
        )}
      </Formik>
    </ScreenWrapper>
  )
}

export default ForgotPasswordScreen
