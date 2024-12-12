import { StyleSheet, Text, View } from "react-native"
import React from "react"
import { useLogoutMutation } from "src/api/auth/authApi"
import * as Keychain from "react-native-keychain"
import { ScreensEnum } from "src/navigation/ScreensEnum"
import { useNavigation } from "@react-navigation/native"
import { ROUTES } from "src/navigation/RoutesTypes"
import { CustomButton } from "@components"

const SettingsScreen = () => {
  const [logout] = useLogoutMutation()
  const navigation = useNavigation<ROUTES>()

  const handleLogout = async () => {
    try {
      const res = await logout({}).unwrap()
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

  return (
    <View style={{ flex: 1, alignContent: "center", justifyContent: "center" }}>
      <CustomButton type="primary" text="Logout" onPress={handleLogout} />
    </View>
  )
}

export default SettingsScreen

const styles = StyleSheet.create({})
