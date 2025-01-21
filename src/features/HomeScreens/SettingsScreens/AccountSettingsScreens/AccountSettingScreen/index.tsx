import { useNavigation } from "@react-navigation/native"
import { isIOS } from "@utils/platformChecker"
import { helpers } from "@utils/theme"
import React from "react"
import { useTranslation } from "react-i18next"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { moderateScale } from "react-native-size-matters"
import {
  useAuthMeQuery,
  useDeleteAuthMeMutation,
} from "src/api/userApi/userApi"
import colors from "src/assets/colors"
import * as Keychain from "react-native-keychain"
import ScreenWrapper from "src/components/ScreenWrapper"
import SettingsButton from "src/components/SettingsButton"
import { ROUTES } from "src/navigation/RoutesTypes"
import { ScreensEnum } from "src/navigation/ScreensEnum"

const AccountSettingsScreen = () => {
  const navigation = useNavigation<ROUTES>()
  const { t } = useTranslation()

  const { data: authMeData } = useAuthMeQuery()
  const [deleteAuthMe] = useDeleteAuthMeMutation()

  const handleDeleteAccount = () => {
    Alert.alert(t("DeleteAccount"), t("DeleteAccountDescription"), [
      {
        text: "OK",
        onPress: async () => {
          await deleteAuthMe().unwrap()
          await Keychain.resetGenericPassword({ service: "accessToken" })
          await Keychain.resetGenericPassword({ service: "refreshToken" })
          navigation.reset({
            index: 0,
            routes: [{ name: ScreensEnum.ONBOARDING }],
          })
        },
      },
      { text: "Cancel" },
    ])
  }

  const settingsButtons = [
    {
      label: t("E-mail"),
      info: authMeData?.email || t("NoE-mailYet"),
      onPress: () => {
        navigation.navigate(ScreensEnum.CHANGE_EMAIL)
      },
    },
    {
      label: t("Password"),
      info: "* * * * * * * * * *",
      onPress: () => {
        navigation.navigate(ScreensEnum.CHANGE_PASSWORD)
      },
    },
  ]

  return (
    <ScreenWrapper
      isBackButton
      title={t("AccountSettings")}
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
          <ScrollView contentContainerStyle={helpers.gap16}>
            {settingsButtons.map((item, index) => (
              <SettingsButton
                key={index}
                label={item.label}
                info={item.info}
                onPress={item.onPress}
              />
            ))}
          </ScrollView>
          <View style={styles.deleteBtnContainer}>
            <SettingsButton
              label={t("DeleteAccount")}
              isDeleteBtn
              onPress={handleDeleteAccount}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  )
}

export default AccountSettingsScreen

export const styles = StyleSheet.create({
  deleteBtnContainer: {
    paddingTop: moderateScale(20),
    borderTopWidth: 1,
    borderColor: colors.borderGrey,
  },
})
