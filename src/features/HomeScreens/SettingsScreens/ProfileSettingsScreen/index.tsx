//@ts-nocheck
import { Icon, CustomButton } from "@components"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { isIOS } from "@utils/platformChecker"
import { helpers } from "@utils/theme"
import { Formik, FormikProps } from "formik"
import React, { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { View, Text, Image } from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { moderateScale } from "react-native-size-matters"
import Toast from "react-native-toast-message"
import { useMediaUploadMutation } from "src/api/mediaApi/mediaApi"
import {
  useAuthMeQuery,
  useUpdateAuthMeMutation,
} from "src/api/userApi/userApi"
import CustomInput from "src/components/CustomInput"
import ImagePicker from "src/components/ImagePicker"
import ScreenWrapper from "src/components/ScreenWrapper"
import { Image as ImageType } from "react-native-image-crop-picker"
import { styles } from "./styles"
import { useLanguageOptionsQuery, useTimezoneQuery } from "src/api/auth/authApi"
import { useGetCalendarTimezonesQuery } from "src/api/calendarApi/calendarApi"
import { ITimezone } from "src/api/calendarApi/types"
import { validationProfileSettingsSchema } from "@utils/validationSchemas"

interface IFormValues {
  photo: string
  firstName: string
  lastName: string
  gmtDelta: string | number
  speechLanguage: {
    id: string
  }
  subtitlesLanguage: {
    id: string
  }
}

const ProfileSettingsScreen = () => {
  const { t } = useTranslation()
  const { goBack } = useNavigation()
  const formikRef = React.useRef<FormikProps<IFormValues>>(null)
  const [selectedFile, setSelectedFile] = useState<ImageType | null>(null)
  const [isUploadPhotoLoading, setIsUploadPhotoLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isPhotoChanged, setIsPhotoChanged] = useState(false)

  const { data: authMeData, refetch: authMeRefetch } = useAuthMeQuery()
  const { data: timezoneData, refetch: timezoneRefetch } = useTimezoneQuery()
  const { data: timezones } = useGetCalendarTimezonesQuery({
    page: "1",
    limit: "100",
    term: "",
  })

  useFocusEffect(
    useCallback(() => {
      authMeRefetch()
      timezoneRefetch()
    }, [])
  )

  const [mediaUpload] = useMediaUploadMutation()
  const [updateAuthMe, { isLoading: isUpdateAuthMeLoading }] =
    useUpdateAuthMeMutation()

  const { data: languageOptions } = useLanguageOptionsQuery()

  const languagesDropdown = languageOptions?.map((item) => ({
    label: item.name,
    value: String(item.id),
  }))

  const timezoneOptions = useMemo(() => {
    return (
      timezones?.data?.map((item: ITimezone) => ({
        label: item.text,
        value: item.id.toString(),
      })) || []
    )
  }, [timezones?.data])

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
        })
        setFieldValue(
          "photo",
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
        inputLanguage: +values.speechLanguage,
        outputLanguage: +values.subtitlesLanguage,
        photo: isPhotoChanged ? values.photo : authMeData?.photo?.id,
      }).unwrap()
      authMeRefetch()
      timezoneRefetch()
      Toast.show({
        type: "success",
        text1: t("ProfileUpdated"),
      })
      goBack()
    } catch (error: any) {
      console.log(error, "error handleUpdateProfile")
      Toast.show({
        type: "error",
        text1: error?.data?.message,
      })
    }
  }

  const handleDeleteAvatar = () => {
    formikRef.current?.setFieldValue("photo", null)
    setSelectedFile(null)
  }

  return (
    <>
      <ScreenWrapper isBackButton title={t("ProfileSettings")} isCenterTitle>
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
                subtitlesLanguage: authMeData?.outputLanguage?.id || "",
                speechLanguage: authMeData?.inputLanguage?.id || "",
                gmtDelta: timezoneData?.id || "",
              }}
              validationSchema={validationProfileSettingsSchema}
              onSubmit={handleUpdateProfile}
            >
              {({ handleChange, handleBlur, values, errors, touched }) => (
                <View style={styles.container}>
                  <View style={styles.photoContainer}>
                    {values.photo ? (
                      <Image
                        source={{
                          uri: selectedFile?.path || values.photo,
                        }}
                        style={{
                          width: moderateScale(88),
                          height: moderateScale(88),
                          borderRadius: 50,
                        }}
                      />
                    ) : (
                      <Icon
                        name="avatarEmpty"
                        width={moderateScale(88)}
                        height={moderateScale(88)}
                      />
                    )}
                    <View
                      style={[helpers.flex1, helpers.gap8, helpers.flexRow]}
                    >
                      <CustomButton
                        isLoading={isUploadPhotoLoading}
                        text={t("UploadPhoto")}
                        type="secondary"
                        onPress={() => setIsModalVisible(true)}
                        style={styles.uploadButton}
                      />
                      {values.photo && (
                        <CustomButton
                          type="secondary"
                          text={t("Delete")}
                          style={styles.deleteButton}
                          onPress={handleDeleteAvatar}
                        />
                      )}
                    </View>
                  </View>
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

                  <CustomInput
                    dropdownPosition="top"
                    inputType="dropdown"
                    dropdownData={timezoneOptions}
                    searchField
                    label={t("Timezone")}
                    value={String(values.gmtDelta)}
                    onChangeText={(val) =>
                      handleChange("gmtDelta")(val as string)
                    }
                    onBlur={handleBlur("gmtDelta")}
                    error={touched.gmtDelta && errors.gmtDelta}
                  />

                  <CustomInput
                    inputType="dropdown"
                    dropdownData={languagesDropdown || []}
                    label={t("SpeechLanguage")}
                    value={String(values.speechLanguage)}
                    dropdownPosition="top"
                    onChangeText={(val) =>
                      handleChange("speechLanguage")(val as string)
                    }
                    onBlur={handleBlur("speechLanguage")}
                  />
                  <CustomInput
                    inputType="dropdown"
                    dropdownPosition="top"
                    dropdownData={languagesDropdown || []}
                    label={t("SubtitlesLanguage")}
                    value={String(values.subtitlesLanguage)}
                    onChangeText={(val) =>
                      handleChange("subtitlesLanguage")(val as string)
                    }
                    onBlur={handleBlur("subtitlesLanguage")}
                  />
                </View>
              )}
            </Formik>
          </View>
        </KeyboardAwareScrollView>
        <CustomButton
          style={{ bottom: moderateScale(10) }}
          text={t("Save")}
          rightIcon={"saveDisk"}
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

export default ProfileSettingsScreen
