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
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import { styles } from "./styles"
import { useEmailConfirmMutation } from "src/api/auth/authApi"
import Toast from "react-native-toast-message"

type ParamList = {
  Detail: {
    hash: string;
  };
};

const CreatePasswordScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()
  const {
    params: { hash },
  } = useRoute<RouteProp<ParamList, 'Detail'>>();

  const [emailConfirm, { isLoading: isEmailConfirmLoading }] = useEmailConfirmMutation();

  const onSignUpPress = async ({ confirmPassword }: { confirmPassword: string }) => {
    try {
      const res = await emailConfirm({
        hash,
        password: confirmPassword,
      }).unwrap();
      console.log(res, 'res onSignUpPress');
      Toast.show({
        type: "success",
        text1: t("Success"),
      })
    } catch (error) {
      console.log(error, 'error onSignUpPress');
      const typedError: any = error as Error;
      if (typedError?.errors?.hash) {
        Toast.show({
          type: "error",
          text1: JSON.stringify(typedError?.error),
        })
      }
    }
  }

  return (
    <ScreenWrapper isBackButton title={t("SignUp")} isCenterTitle>
      <Formik
        initialValues={{ password: "", confirmPassword: "" }}
        validationSchema={validationResetPasswordSchema}
        onSubmit={onSignUpPress}
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
                <Text style={styles.title}>{t("EmailVerified")}</Text>
                <Text style={styles.subtitle}>{t("CreateAPassword")}</Text>
              </View>

              <View style={[helpers.gap16]}>
                <CustomInput
                  label={t("CreatePassword")}
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

            <View style={[helpers.gap8]}>
              <CustomButton
                type="primary"
                text={t("SignUp")}
                onPress={handleSubmit}
                isLoading={isEmailConfirmLoading}
              />
              <CustomButton
                type="secondary"
                text={t("IHaveAnAccount")}
                onPress={() => navigation.navigate(ScreensEnum.LOGIN)}
              />
            </View>
          </View>
        )}
      </Formik>
    </ScreenWrapper>
  )
}

export default CreatePasswordScreen
