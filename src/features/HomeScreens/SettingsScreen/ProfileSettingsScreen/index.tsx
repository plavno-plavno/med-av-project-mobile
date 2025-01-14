import { Icon, CustomButton } from "@components"
import { useNavigation } from "@react-navigation/native"
import { isIOS } from "@utils/platformChecker"
import { helpers } from "@utils/theme"
import { timezones } from "@utils/timezones"
import { Formik, FormikProps } from "formik"
import React, { useState } from "react"
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
import { ROUTES } from "src/navigation/RoutesTypes"
import { Image as ImageType } from "react-native-image-crop-picker"
import { styles } from "./styles"
import { useLanguageOptionsQuery } from "src/api/auth/authApi"

interface IFormValues {
  photo: string
  firstName: string
  lastName: string
  gmtDelta: string | number
  language: {
    id: string
  }
}

const ProfileSettingsScreen = () => {
  const navigation = useNavigation<ROUTES>()
  const { t } = useTranslation()
  const { goBack } = useNavigation()
  const formikRef = React.useRef<FormikProps<IFormValues>>(null)
  const [selectedFile, setSelectedFile] = useState<ImageType | null>(null)
  const [isUploadPhotoLoading, setIsUploadPhotoLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const { data: authMeData, refetch: authMeRefetch } = useAuthMeQuery()
  const [mediaUpload] = useMediaUploadMutation()
  const [updateAuthMe, { isLoading: isUpdateAuthMeLoading }] =
    useUpdateAuthMeMutation()

  const { data: languageOptions } = useLanguageOptionsQuery()
  const languagesDropdown = languageOptions?.map((item) => ({
    label: item.name,
    value: String(item.id),
  }))

  const handleImagePicker = async (image: ImageType) => {
    setIsUploadPhotoLoading(true)
    const { setFieldValue } = formikRef.current as FormikProps<any>

    try {
      setSelectedFile(image as any)

      if (image) {
        const uploadResponse = await mediaUpload({
          files: image,
          prefix: "avatar",
          postfix: "avatar",
          tag: "avatar",
        })
        setFieldValue(
          "photo",
          //@ts-ignore
          uploadResponse?.data?.id || uploadResponse?.data?.[0]?.id
        )
      }
    } catch (err) {
      console.error("Error during file selection or upload:", err)
    } finally {
      setIsUploadPhotoLoading(false)
    }
  }

  const handleUpdateProfile = async (values: IFormValues) => {
    console.log("\x1b[31m%s\x1b[0m", "values", values)
    try {
      const res = await updateAuthMe({
        firstName: values.firstName,
        lastName: values.lastName,
        gmtDelta: +values.gmtDelta,
        language: +values.language,
        photo: values.photo,
      }).unwrap()
      authMeRefetch()
      Toast.show({
        type: "success",
        text1: t("ProfileUpdated"),
      })
      navigation.navigate(goBack())
    } catch (error) {
      console.log(error, "error handleUpdateProfile")
    }
  }

  const handleDeleteAvatar = () => {
    formikRef.current?.setFieldValue("photo", null)
    setSelectedFile(null)
  }

  return (
    <>
      <ScreenWrapper
        isBackButton
        title={t("ProfileSettings")}
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
                gmtDelta: authMeData?.gmtDelta || "",
              }}
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
                        text={t("Upload")}
                        type="secondary"
                        onPress={() => setIsModalVisible(true)}
                        style={helpers.width60Percent}
                      />
                      {values.photo && (
                        <CustomButton
                          text={t("Delete")}
                          style={helpers.width35Percent}
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
                    inputType="dropdown"
                    dropdownData={languagesDropdown || []}
                    label={t("DestinationLanguage")}
                    value={String(values.language)}
                    onChangeText={(val) =>
                      handleChange("language")(val as string)
                    }
                    onBlur={handleBlur("language")}
                  />
                  <CustomInput
                    inputType="dropdown"
                    dropdownData={timezones}
                    label={t("Timezone")}
                    value={String(values.gmtDelta)}
                    onChangeText={(val) =>
                      handleChange("gmtDelta")(val as string)
                    }
                    onBlur={handleBlur("gmtDelta")}
                    error={touched.gmtDelta && errors.gmtDelta}
                  />
                </View>
              )}
            </Formik>
          </View>
        </KeyboardAwareScrollView>
        <CustomButton
          style={{ bottom: moderateScale(30) }}
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
