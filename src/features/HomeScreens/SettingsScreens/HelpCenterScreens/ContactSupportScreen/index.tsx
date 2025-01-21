import ScreenWrapper from "src/components/ScreenWrapper"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import { isIOS } from "@utils/platformChecker"
import { moderateScale } from "react-native-size-matters"
import { useTranslation } from "react-i18next"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import colors from "src/assets/colors"
import ScreenTitle from "src/components/ScreenTitle"
import { Formik, FormikProps } from "formik"
import CustomInput from "src/components/CustomInput"
import { CustomButton } from "src/components/CustomButton"
import { useRef } from "react"
import { screenHeight } from "@utils/screenResponsive"
import { Portal } from "react-native-portalize"
import SelectTopicModal from "src/modals/SelectTopicModal"
import { BottomSheetMethods } from "@devvie/bottom-sheet"

const ContactSupportScreen = () => {
  const { t } = useTranslation()
  const formikRef = useRef<FormikProps<any>>(null)
  const sheetTopicsRef = useRef<BottomSheetMethods>(null)

  return (
    <>
      <ScreenWrapper isBackButton title={t("ContactSupport")} isCenterTitle>
        <View style={[helpers.flex1]}>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="always"
            extraScrollHeight={screenHeight * 0.2}
            bounces={false}
            enableOnAndroid
            enableAutomaticScroll
            showsVerticalScrollIndicator={false}
          >
            <ScreenTitle
              title={t("ContactSupport")}
              subtitle={t("ContactSupportDescription")}
            />
            <Formik
              ref={formikRef}
              enableReinitialize
              initialValues={{ topic: "", message: "" }}
              onSubmit={() => {}}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isValid,
              }) => (
                <View style={[helpers.flexGrow1, helpers.mt24, helpers.gap16]}>
                  <TouchableOpacity
                    onPress={() => {
                      sheetTopicsRef.current?.open()
                    }}
                  >
                    <View pointerEvents="none">
                      <CustomInput
                        inputType="dropdown"
                        label={t("Topic")}
                        placeholder={t("ChooseTopic")}
                        onChangeText={(val) =>
                          handleChange("topic")(val as string)
                        }
                        value={values.topic}
                        error={touched.topic && errors.topic}
                      />
                    </View>
                  </TouchableOpacity>
                  <CustomInput
                    inputType="textArea"
                    label={t("Message")}
                    placeholder={t("WriteYourMessage")}
                    value={values.message}
                    onChangeText={(val) =>
                      handleChange("message")(val as string)
                    }
                    error={touched.message && errors.message}
                  />
                </View>
              )}
            </Formik>
          </KeyboardAwareScrollView>
          <CustomButton
            disabled={!formikRef.current?.isValid}
            type="primary"
            text={t("SendRequest")}
            rightIcon="nextArrow"
            isLoading={false}
            onPress={() => formikRef.current?.handleSubmit()}
            style={styles.button}
          />
        </View>
      </ScreenWrapper>
      <Portal>
        <SelectTopicModal sheetRef={sheetTopicsRef} />
      </Portal>
    </>
  )
}

export default ContactSupportScreen

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: moderateScale(20),
    left: moderateScale(0),
    right: moderateScale(0),
  },
})
