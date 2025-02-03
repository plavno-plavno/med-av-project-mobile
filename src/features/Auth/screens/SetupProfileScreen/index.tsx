import { useTranslation } from "react-i18next"
import { View, Text, Image, ActivityIndicator } from "react-native"
import ScreenWrapper from "src/components/ScreenWrapper"
import { styles } from "./styles"
import CustomInput from "src/components/CustomInput"
import { Formik, FormikProps } from "formik"
import {
  useAuthMeQuery,
  useUpdateAuthMeMutation,
} from "src/api/userApi/userApi"
import { CustomButton, Icon } from "@components"
import { validationSetupProfileSchema } from "@utils/validationSchemas"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { helpers } from "@utils/theme"
import { isIOS } from "@utils/platformChecker"
import { useMediaUploadMutation } from "src/api/mediaApi/mediaApi"
import React, { useEffect, useState } from "react"
import Toast from "react-native-toast-message"
import { moderateScale } from "react-native-size-matters"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { useNavigation } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import ImagePicker from "src/components/ImagePicker"
import { Image as ImageType } from "react-native-image-crop-picker"
import { useGetCalendarTimezonesQuery } from "src/api/calendarApi/calendarApi"
import { ITimezone } from "src/api/calendarApi/types"
import { screenHeight } from "@utils/screenResponsive"
import { useLanguageOptionsQuery, useTimezoneQuery } from "src/api/auth/authApi"

interface IFormValues {
  photo: string
  firstName: string
  lastName: string
  gmtDelta: string | number
  language: string
}

const SetupProfileScreen = () => {
  const navigation = useNavigation<ROUTES>()
  const { t } = useTranslation()
  const formikRef = React.useRef<FormikProps<IFormValues>>(null)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [isUploadPhotoLoading, setIsUploadPhotoLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isPhotoChanged, setIsPhotoChanged] = useState(false)

  const { data: authMeData, refetch: authMeRefetch } = useAuthMeQuery()
  console.log("\x1b[31m%s\x1b[0m", "authMeData", authMeData)
  const { data: timezone, isLoading: isTimezoneLoading } = useTimezoneQuery()
  const { data: timezones } = useGetCalendarTimezonesQuery({
    page: "1",
    limit: "100",
    term: "",
  })
  const { data: languageOptions } = useLanguageOptionsQuery()

  const languagesDropdown = languageOptions?.map((item) => ({
    label: item.name,
    value: String(item.id),
  }))
  const [mediaUpload] = useMediaUploadMutation()
  const [updateAuthMe, { isLoading: isUpdateAuthMeLoading }] =
    useUpdateAuthMeMutation()

  const handleImagePicker = async (image: ImageType) => {
    setIsUploadPhotoLoading(true)
    const { setFieldValue } = formikRef.current as FormikProps<any>

    try {
      setSelectedFile(image as any)

      if (image) {
        const uploadResponse = await mediaUpload({
          file: {
            uri: image.path,
            name: image.filename || `photo_${Date.now()}.jpg`,
            type: image.mime,
          },
          prefix: "avatar",
          postfix: "avatar",
          tag: "avatar",
        })
        setFieldValue(
          "photo",
          //@ts-ignore
          uploadResponse?.data?.id || uploadResponse?.data?.[0]?.id
        )
        setIsPhotoChanged(true)
      }
    } catch (err) {
      console.error("Error during file selection or upload:", err)
    } finally {
      setIsUploadPhotoLoading(false)
    }
  }

  const handleUpdateProfile = async (values: IFormValues) => {
    try {
      const res = await updateAuthMe({
        firstName: values.firstName,
        lastName: values.lastName,
        timezone: +values.gmtDelta,
        language: +values.language,
        photo: isPhotoChanged ? values.photo : authMeData?.photo?.id,
      }).unwrap()
      authMeRefetch()
      Toast.show({
        type: "success",
        text1: t("ProfileUpdated"),
      })
      navigation.navigate(ScreensEnum.MAIN)
    } catch (error: any) {
      console.log(error, "error handleUpdateProfile")
      if (error?.data?.message) {
        Toast.show({
          type: "error",
          text1: error?.data?.message,
        })
      }
    }
  }

  const timezoneOptions = timezones?.data?.map((item: ITimezone) => ({
    label: item.text,
    value: item.id.toString(),
  }))

  useEffect(() => {
    if (authMeData?.photo?.link) {
      setSelectedFile(authMeData?.photo)
    }
  }, [authMeData])

  return (
    <>
      <ScreenWrapper
        title={t("SetupProfile")}
        isCenterTitle
        keyboardVerticalOffset={isIOS() ? moderateScale(-30) : undefined}
      >
        <KeyboardAwareScrollView
          style={helpers.flex1}
          bounces={false}
          enableOnAndroid
          enableAutomaticScroll
          showsVerticalScrollIndicator={false}
        >
          <View style={[helpers.flex1, helpers.gap24]}>
            <Text style={styles.title}>{t("PersonalInformation")}</Text>
            <Formik
              innerRef={formikRef}
              enableReinitialize
              initialValues={{
                photo: authMeData?.photo?.link || "",
                firstName: authMeData?.firstName || "",
                lastName: authMeData?.lastName || "",
                //@ts-ignore
                language: authMeData?.language?.id || "",
                gmtDelta: "",
              }}
              validationSchema={validationSetupProfileSchema}
              onSubmit={handleUpdateProfile}
            >
              {({ handleChange, handleBlur, values, errors, touched }) => (
                <View style={styles.container}>
                  <View style={styles.photoContainer}>
                    {selectedFile?.path || selectedFile?.link ? (
                      <Image
                        source={{
                          uri: selectedFile?.path || selectedFile?.link,
                        }}
                        style={{ width: 80, height: 80, borderRadius: 40 }}
                      />
                    ) : (
                      <Icon name="avatarEmpty" />
                    )}
                    <View
                      style={[helpers.flex1, helpers.gap8, helpers.flexRow]}
                    >
                      <CustomButton
                        isLoading={isUploadPhotoLoading}
                        text={t("Upload")}
                        type="secondary"
                        onPress={() => setIsModalVisible(true)}
                        style={helpers.width60Percent}
                      />
                      {selectedFile && (
                        <CustomButton
                          text={t("Delete")}
                          style={helpers.width35Percent}
                          onPress={() => setSelectedFile(null)}
                        />
                      )}
                    </View>
                  </View>
                  {isTimezoneLoading ? (
                    <ActivityIndicator
                      size={"small"}
                      style={{ marginTop: screenHeight * 0.2 }}
                    />
                  ) : (
                    <>
                      {!authMeData?.firstName && (
                        <CustomInput
                          label={t("FirstName")}
                          value={values.firstName}
                          placeholder={t("EnterYourFirstName")}
                          onChangeText={(val) =>
                            handleChange("firstName")(val as string)
                          }
                          onBlur={handleBlur("firstName")}
                          error={touched.firstName && errors.firstName}
                        />
                      )}
                      {!authMeData?.lastName && (
                        <CustomInput
                          label={t("LastName")}
                          placeholder={t("EnterYourLastName")}
                          value={values.lastName}
                          onChangeText={(val) =>
                            handleChange("lastName")(val as string)
                          }
                          onBlur={handleBlur("lastName")}
                          error={touched.lastName && errors.lastName}
                        />
                      )}

                      {!authMeData?.language && (
                        <CustomInput
                          inputType="dropdown"
                          dropdownData={languagesDropdown || []}
                          label={t("DestinationLanguage")}
                          value={values.language.toString()}
                          onChangeText={(val) =>
                            handleChange("language")(val as string)
                          }
                          onBlur={handleBlur("language")}
                          error={touched.language && errors.language}
                        />
                      )}
                      {!timezone?.id && (
                        <CustomInput
                          inputType="dropdown"
                          searchField
                          dropdownData={timezoneOptions}
                          label={t("Timezone")}
                          placeholder={t("EnterYourTimezone")}
                          value={values.gmtDelta.toString()}
                          onChangeText={(val) =>
                            handleChange("gmtDelta")(val as string)
                          }
                          onBlur={handleBlur("gmtDelta")}
                          error={touched.gmtDelta && errors.gmtDelta}
                        />
                      )}
                    </>
                  )}
                </View>
              )}
            </Formik>
          </View>
        </KeyboardAwareScrollView>
        <CustomButton
          style={{ bottom: moderateScale(30) }}
          text={t("Save")}
          onPress={() => formikRef.current?.submitForm()}
          isLoading={isUpdateAuthMeLoading}
        />
      </ScreenWrapper>

      <ImagePicker
        isModalVisible={isModalVisible}
        setIsModalVisible={() => setIsModalVisible(false)}
        handleImagePicker={handleImagePicker}
      />
    </>
  )
}

export default SetupProfileScreen
