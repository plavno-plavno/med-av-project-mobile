import React, { useCallback, useEffect } from "react"
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

const Stack = createNativeStackNavigator()

const Navigation: React.FC = () => {
  const getRoute = useCallback(async () => {
    const accessToken = await Keychain.getGenericPassword({
      service: "accessToken",
    })
    if(accessToken){
      RootNavigation.navigate(ScreensEnum.MAIN)
    } else {
      RootNavigation.navigate(ScreensEnum.ONBOARDING)
    }

    setTimeout(() => {
      SplashScreen.hide()
    }, 500)
  }, [])

  useEffect(() => {
    getRoute()
  }, [getRoute])

  const config = {
    screens: {
      emailVerifiedScreen: "emailVerifiedScreen/:item",
    },
  }

  const linking = {
    prefixes: ["https://av-hims.netlify.app"],
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

        <Stack.Screen name={ScreensEnum.MAIN} component={BottomTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default Navigation
