import React, { useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { navigationRef } from "./RootNavigation"
import * as RootNavigation from "./RootNavigation"
import SplashScreen from "react-native-splash-screen"
import OnboardingScreen from "../features/Auth/screens/OnboardingScreen"
import { ScreensEnum } from "./ScreensEnum"
import LoginScreen from "../features/Auth/screens/LoginScreen"
import BottomTabNavigator from "./BottomTabNavigator"
import SignUpScreen from "src/features/Auth/screens/SignUpScreen"
import VerifyScreen from "src/features/Auth/screens/VerifyScreen"
import CreatePasswordScreen from "src/features/Auth/screens/CreatePasswordScreen"
import ForgotPasswordScreen from "src/features/Auth/screens/ForgotPasswordScreen"
import ResetPasswordScreen from "src/features/Auth/screens/ResetPasswordScreen"
import * as Keychain from "react-native-keychain"
import { Linking } from "react-native"
import queryString from "query-string"
import SetupProfileScreen from "src/features/Auth/screens/SetupProfileScreen"
import MeetingDetailsScreen from "src/features/MeetingScreens/MeetingDetailsScreen"
import MeetingScreen from "src/features/MeetingScreens/MeetingScreen"
import { useAuthMeQuery } from "src/api/userApi/userApi"
import ProfileSettingsScreen from "src/features/HomeScreens/SettingsScreens/ProfileSettingsScreen"
import AccountSettingsScreen from "src/features/HomeScreens/SettingsScreens/AccountSettingsScreens/AccountSettingScreen"
import ChangeEmailScreen from "src/features/HomeScreens/SettingsScreens/AccountSettingsScreens/ChangeEmailScreen"
import ChangePasswordScreen from "src/features/HomeScreens/SettingsScreens/AccountSettingsScreens/ChangePasswordScreen"
import { useTimezoneQuery } from "src/api/auth/authApi"
import MyRecordsScreen from "src/features/HomeScreens/SettingsScreens/MyRecordsScreen"
import FAQScreen from "src/features/HomeScreens/SettingsScreens/HelpCenterScreens/FAQScreen"
import HelpCenterScreen from "src/features/HomeScreens/SettingsScreens/HelpCenterScreens/HelpCenterScreen"
import ContactSupportScreen from "src/features/HomeScreens/SettingsScreens/HelpCenterScreens/ContactSupportScreen"
import MyRequestsScreen from "src/features/HomeScreens/SettingsScreens/HelpCenterScreens/MyRequestsScreens/MyRequestsScreen"
import MyRequestsDetailsScreen from "src/features/HomeScreens/SettingsScreens/HelpCenterScreens/MyRequestsScreens/MyRequestsDetailsScreen"
import PrivacyPolicyScreen from "src/features/PrivacyPolicyScreen"

const Stack = createNativeStackNavigator()

const Navigation: React.FC = () => {
  const { refetch: authMeRefetch } = useAuthMeQuery()
  const { refetch: timezoneRefetch } = useTimezoneQuery()

  const getRoute = async () => {
    try {
      const accessToken = await Keychain.getGenericPassword({
        service: "accessToken",
      })
      if (accessToken) {
        const updatedAuthMeData = await authMeRefetch().unwrap()
        const updatedTimezoneData = await timezoneRefetch().unwrap()
        const initialCheck =
          updatedAuthMeData?.firstName &&
          updatedAuthMeData?.lastName &&
          updatedTimezoneData?.id
            ? ScreensEnum.MAIN
            : ScreensEnum.SETUP_PROFILE

        RootNavigation.navigate(initialCheck)
      } else {
        RootNavigation.navigate(ScreensEnum.ONBOARDING)
      }
    } catch (error) {
      console.log(error, "error getRoute")
      await Keychain.resetGenericPassword({ service: "accessToken" })
      await Keychain.resetGenericPassword({ service: "refreshToken" })
      RootNavigation.navigate(ScreensEnum.ONBOARDING)
    } finally {
      setTimeout(() => {
        SplashScreen.hide()
      }, 500)
    }
  }

  useEffect(() => {
    getRoute()
  }, [])

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event
      if (url) {
        console.log("Received URL:", url)
        const parsed = queryString.parseUrl(url)
        const { query } = parsed

        const pathMatch = url.match(/^.*:\/\/([^?]*)/)
        const pathname = pathMatch ? `/${pathMatch[1]}` : undefined

        const hash = query.hash

        if (hash) {
          if (pathname === "/password-change") {
            console.log("Navigating to ResetPasswordScreen")
            navigationRef?.current?.navigate(ScreensEnum.RESET_PASSWORD, {
              hash,
            })
          } else if (pathname === "/auth/setPassword") {
            console.log("Navigating to CreatePasswordScreen")
            navigationRef?.current?.navigate(ScreensEnum.CREATE_PASSWORD, {
              hash,
            })
          } else {
            console.log("Unknown Path:", pathname)
          }
        } else {
          console.log("Hash is missing in the URL.")
        }
      }
    }

    Linking.addEventListener("url", handleDeepLink)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url })
    })
  }, [])

  const config = {
    screens: {
      [ScreensEnum.CREATE_PASSWORD]: "auth/setPassword",
      [ScreensEnum.RESET_PASSWORD]: "password-change",
    },
  }

  const linking = {
    prefixes: ["https://av-hims.netlify.app", "https://med-app-av.plavno.io"],
    config,
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        initialRouteName={ScreensEnum.ONBOARDING}
        screenOptions={{ headerShown: false, gestureEnabled: false }}
      >
        <Stack.Screen
          name={ScreensEnum.ONBOARDING}
          component={OnboardingScreen}
        />
        <Stack.Screen name={ScreensEnum.LOGIN} component={LoginScreen} />
        <Stack.Screen name={ScreensEnum.SIGN_UP} component={SignUpScreen} />
        <Stack.Screen
          name={ScreensEnum.CREATE_PASSWORD}
          component={CreatePasswordScreen}
        />
        <Stack.Screen
          name={ScreensEnum.VERIFICATION}
          component={VerifyScreen}
        />
        <Stack.Screen
          name={ScreensEnum.FORGOT_PASSWORD}
          component={ForgotPasswordScreen}
        />
        <Stack.Screen
          name={ScreensEnum.RESET_PASSWORD}
          component={ResetPasswordScreen}
        />
        <Stack.Screen
          name={ScreensEnum.SETUP_PROFILE}
          component={SetupProfileScreen}
        />
        <Stack.Screen
          name={ScreensEnum.MEETING_DETAILS}
          component={MeetingDetailsScreen}
        />
        <Stack.Screen
          name={ScreensEnum.PROFILE_SETTINGS}
          component={ProfileSettingsScreen}
        />
        <Stack.Screen
          name={ScreensEnum.ACCOUNT_SETTINGS}
          component={AccountSettingsScreen}
        />
        <Stack.Screen
          name={ScreensEnum.CHANGE_EMAIL}
          component={ChangeEmailScreen}
        />
        <Stack.Screen
          name={ScreensEnum.CHANGE_PASSWORD}
          component={ChangePasswordScreen}
        />
        <Stack.Screen
          name={ScreensEnum.MY_RECORDS}
          component={MyRecordsScreen}
        />
        <Stack.Screen name={ScreensEnum.FAQ} component={FAQScreen} />
        <Stack.Screen
          name={ScreensEnum.HELP_CENTER}
          component={HelpCenterScreen}
        />
        <Stack.Screen
          name={ScreensEnum.MY_REQUESTS}
          component={MyRequestsScreen}
        />
        <Stack.Screen
          name={ScreensEnum.MY_REQUEST_DETAILS}
          component={MyRequestsDetailsScreen}
        />

        <Stack.Screen
          name={ScreensEnum.CONTACT_SUPPORT}
          component={ContactSupportScreen}
        />
        <Stack.Screen
          name={ScreensEnum.PRIVACY_FILES}
          component={PrivacyPolicyScreen}
        />
        <Stack.Screen name={ScreensEnum.MEETING} component={MeetingScreen} />
        <Stack.Screen name={ScreensEnum.MAIN} component={BottomTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default Navigation
