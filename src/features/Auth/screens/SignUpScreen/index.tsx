import React from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { useTranslation } from "react-i18next"
import { useEmailSingUpMutation } from "src/api/auth/authApi"
import { CustomButton } from "@components"
import { styles } from "./styles"
import { View, Text } from "react-native"
import { Formik } from "formik"
import CustomInput from "src/components/CustomInput"
import { helpers } from "@utils/theme"
import { validationEmailSchema } from "@utils/validationSchemas"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { useNavigation } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import TermsAndConditions from "src/components/TermsAndConditions"

const SignUpScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()

  const [emailErrors, setEmailErrors] = React.useState<{ email: string }>({
    email: "",
  })

  const [emailSingUp, { isLoading: isEmailSignUpLoading }] =
    useEmailSingUpMutation()

  const handleSignUp = async (values: { email: string }) => {
    try {
      const res = await emailSingUp({ email: values.email }).unwrap()
      //TODO: REFACTOR NULL RESPONSE
      if (res === null) {
        navigation.navigate(ScreensEnum.EMAIL_VERIFICATION, {
          email: values.email,
        })
      }
    } catch (error: any) {
      setEmailErrors({
        email: t(error?.data?.errors?.email),
      })
    }
  }

  return (
    <ScreenWrapper isBackButton title={t("LogIn")} isCenterTitle>
      <Formik
        initialValues={{ email: "" }}
        validationSchema={validationEmailSchema}
        onSubmit={handleSignUp}
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({
          handleBlur,
          handleSubmit,
          setFieldValue,
          values,
          errors,
          touched,
        }) => {
          const customHandleChange = (fieldName: string) => (value: string) => {
            if (emailErrors.email) {
              setEmailErrors({
                email: "",
              })
            }
            setFieldValue(fieldName, value)
          }
          return (
            <View style={styles.container}>
              <View style={[helpers.gap24]}>
                <View style={[helpers.gap8]}>
                  <Text style={styles.title}>{t("CreateYourAccount")}</Text>
                  <Text style={styles.subtitle}>{t("CreateFreeAccount")}</Text>
                </View>

                <View>
                  <CustomInput
                    label={t("E-mail")}
                    placeholder={t("EnterYourEmail")}
                    keyboardType="email-address"
                    onBlur={handleBlur("email")}
                    onChangeText={customHandleChange("email")}
                    value={values.email}
                    error={(touched.email && errors.email) || emailErrors.email}
                  />
                </View>
              </View>
              <View style={[helpers.gap24]}>
                <TermsAndConditions />
                <View style={[helpers.gap8]}>
                  <CustomButton
                    type="primary"
                    text={t("SignUp")}
                    onPress={handleSubmit}
                    rightIcon="nextArrow"
                    isLoading={isEmailSignUpLoading}
                  />
                  <CustomButton
                    type="secondary"
                    text={t("IHaveAnAccount")}
                    onPress={() => navigation.navigate(ScreensEnum.LOGIN)}
                    isLoading={false}
                  />
                </View>
              </View>
            </View>
          )
        }}
      </Formik>
    </ScreenWrapper>
  )
}

export default SignUpScreen
