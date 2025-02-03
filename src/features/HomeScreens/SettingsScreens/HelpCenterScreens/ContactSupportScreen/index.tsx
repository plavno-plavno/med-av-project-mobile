import React from "react"
import ScreenWrapper from "src/components/ScreenWrapper"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import { useTranslation } from "react-i18next"
import { helpers } from "@utils/theme"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import ScreenTitle from "src/components/ScreenTitle"
import { Formik, FormikProps } from "formik"
import CustomInput from "src/components/CustomInput"
import { CustomButton } from "src/components/CustomButton"
import { useRef, useState } from "react"
import { screenHeight } from "@utils/screenResponsive"
import { Portal } from "react-native-portalize"
import SelectTopicModal from "src/modals/SelectTopicModal"
import { BottomSheetMethods } from "@devvie/bottom-sheet"
import { HelpTopicEntity } from "src/api/helpCenterApi/types"
import { validationContactSupportSchema } from "@utils/validationSchemas"
import { useAddTopicMutation } from "src/api/helpCenterApi/helpCenterApi"
import Toast from "react-native-toast-message"
import { useNavigation } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import { ScreensEnum } from "src/navigation/ScreensEnum"

interface IFormValues {
  topic: HelpTopicEntity | null | string
  message: string | null
}

const ContactSupportScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()
  const formikRef = useRef<FormikProps<IFormValues>>(null as any)
  const sheetTopicsRef = useRef<BottomSheetMethods>(null)
  const [addTopic, { isLoading }] = useAddTopicMutation()

  const [topicId, setTopicId] = useState<number | null>(null)

  const handleAddTopic = async (values: IFormValues) => {
    console.log(values, "values")
    try {
      const res = await addTopic({
        message: values.message as string,
        category: {
          id: topicId as number,
        },
      })
      console.log(res, "res")
      Toast.show({
        type: "success",
        text1: t("TopicAdded"),
      })
      navigation.replace(ScreensEnum.MY_REQUESTS);
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <ScreenWrapper isBackButton title={t("ContactSupport")} isCenterTitle>
        <View style={[helpers.flex1]}>
          <KeyboardAwareScrollView
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
              enableReinitialize
              innerRef={formikRef}
              initialValues={{ topic: "", message: "" }}
              onSubmit={(values) => {
                handleAddTopic(values)
              }}
              validationSchema={validationContactSupportSchema}
              validateOnMount
              validateOnChange
              validateOnBlur
            >
              {({ handleChange, handleBlur, values, errors, touched }) => (
                <View style={[helpers.flexGrow1, helpers.mt24, helpers.gap16]}>
                  <TouchableOpacity
                    onPress={() => {
                      sheetTopicsRef.current?.open()
                    }}
                  >
                    <View pointerEvents="none">
                      <CustomInput
                        required
                        label={t("Topic")}
                        placeholder={t("ChooseTopic")}
                        onChangeText={(val) => {}}
                        onBlur={() => {
                          handleBlur("topic")
                        }}
                        value={values.topic as string}
                        rightIconProps={{
                          name: "downArrow",
                        }}
                        error={touched.topic && errors.topic}
                      />
                    </View>
                  </TouchableOpacity>
                  <CustomInput
                    required
                    inputType="textArea"
                    label={t("Message")}
                    placeholder={t("WriteYourMessage")}
                    value={values.message as string}
                    onBlur={() => {
                      handleBlur("message")
                    }}
                    onChangeText={(val) => {
                      handleChange("message")(val as string)
                    }}
                    error={touched.message && errors.message}
                  />
                </View>
              )}
            </Formik>
          </KeyboardAwareScrollView>
          <CustomButton
            type="primary"
            text={t("SendRequest")}
            rightIcon="nextArrow"
            onPress={() => formikRef.current?.handleSubmit()}
            style={styles.button}
            isLoading={isLoading}
          />
        </View>
      </ScreenWrapper>
      <Portal>
        <SelectTopicModal
          sheetRef={sheetTopicsRef}
          formikRef={formikRef}
          setTopicId={setTopicId}
        />
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
