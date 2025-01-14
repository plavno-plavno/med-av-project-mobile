import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import React from "react"
import * as Keychain from "react-native-keychain"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { useNavigation } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import { Icon } from "@components"
import { useLogoutMutation } from "src/api/userApi/userApi"
import ProfileWrapper from "src/components/ProfileWrapper.tsx"
import colors from "src/assets/colors"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import { moderateScale } from "react-native-size-matters"
import { useTranslation } from "react-i18next"

const SettingsScreen = () => {
  const { t } = useTranslation()
  const [logout] = useLogoutMutation()
  const navigation = useNavigation<ROUTES>()

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
      icon: "profileSettings",
      onPress: () => {
        navigation.navigate(ScreensEnum.PROFILE_SETTINGS, {})
      },
    },
    {
      title: t("AccountSettings"),
      icon: "accountSettings",
      onPress: () => {},
    },
    {
      title: t("MyRecordings"),
      icon: "myRecordings",
      onPress: () => {},
    },
    {
      title: t("HelpCenter"),
      icon: "helpCenter",
      onPress: () => {},
    },
  ]
  const renderItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
        <View style={[helpers.flexRow, helpers.gap8]}>
          <Icon name={item.icon} />
          <Text style={styles.menuTitle}>{item.title}</Text>
        </View>
        <Icon name={"chevronRight"} />
      </TouchableOpacity>
    )
  }
  return (
    <ProfileWrapper>
      <View style={styles.container}>
        <FlatList
          contentContainerStyle={[helpers.gap8, helpers.mt20]}
          data={profileMenu}
          keyExtractor={(item) => item.title}
          renderItem={renderItem}
        />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" />
          <Text style={styles.menuTitle}>{t("Logout")}</Text>
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
  menuItem: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: colors.aquaHaze,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
  },
  menuTitle: {
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
