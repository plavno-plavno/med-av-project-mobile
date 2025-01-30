import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import React, { useCallback } from "react"
import * as Keychain from "react-native-keychain"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import { Icon } from "@components"
import { useLogoutMutation } from "src/api/userApi/userApi"
import ProfileWrapper from "src/components/ProfileWrapper.tsx"
import colors from "src/assets/colors"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import { moderateScale } from "react-native-size-matters"
import { useTranslation } from "react-i18next"
import NavigationItem from "src/components/NavigationItem"
import { useGetMessageCountQuery } from "src/api/helpCenterApi/helpCenterApi"
import useWebSocket from "src/socket/socket"

const SettingsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<ROUTES>()

  const [logout] = useLogoutMutation()
  const { data: messageCount, refetch } = useGetMessageCountQuery()

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      await Keychain.resetGenericPassword({ service: "accessToken" })
      await Keychain.resetGenericPassword({ service: "refreshToken" })
      navigation.reset({
        index: 0,
        routes: [{ name: ScreensEnum.ONBOARDING }],
      })
    } catch (error) {
      console.log(error, "ERROR")
    }
  }

  const profileMenu = [
    {
      title: t("ProfileSettings"),
      leftIcon: "profileSettings" as IconName,
      rightIcon: "chevronRight" as IconName,
      onPress: () => {
        navigation.navigate(ScreensEnum.PROFILE_SETTINGS, {})
      },
    },
    {
      title: t("AccountSettings"),
      leftIcon: "accountSettings" as IconName,
      rightIcon: "chevronRight" as IconName,
      onPress: () => {
        navigation.navigate(ScreensEnum.ACCOUNT_SETTINGS, {})
      },
    },
    {
      title: t("MyRecordings"),
      leftIcon: "myRecordings" as IconName,
      rightIcon: "chevronRight" as IconName,
      onPress: () => {
        navigation.navigate(ScreensEnum.MY_RECORDS, {})
      },
    },
    {
      title: t("HelpCenter") + ` (${messageCount || 0})`,
      leftIcon: "helpCenter" as IconName,
      rightIcon: "chevronRight" as IconName,
      onPress: () => {
        navigation.navigate(ScreensEnum.HELP_CENTER, {})
      },
    },
  ]

  useWebSocket(refetch)

  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [])
  )

  return (
    <ProfileWrapper>
      <View style={styles.container}>
        <FlatList
          contentContainerStyle={[helpers.gap8, helpers.mt20]}
          data={profileMenu}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => <NavigationItem {...item} />}
        />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" />
          <Text style={styles.text}>{t("Logout")}</Text>
        </TouchableOpacity>
      </View>
    </ProfileWrapper>
  )
}

export default SettingsScreen

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(20),
  },
  text: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  logoutButton: {
    flexDirection: "row",
    gap: moderateScale(8),
    alignItems: "center",
    padding: moderateScale(16),
    marginTop: moderateScale(20),
  },
})
