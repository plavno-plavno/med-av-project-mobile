import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import colors from "../assets/colors"
import { StyleSheet, View } from "react-native"
import { Icon } from "@components"
import { fontFamilies, fontWeights } from "@utils/theme"
import { ScreensEnum } from "./ScreensEnum"
import CalendarScreen from "src/features/HomeScreens/CalendarScreen"
import SettingsScreen from "src/features/HomeScreens/SettingsScreen"
import { moderateScale } from "react-native-size-matters"
import NewMeetingScreen from "src/features/HomeScreens/NewMeetingScreen"

interface RouteTypes {
  key: string
  name: string
}

interface ScreenOptionsTypes {
  route: RouteTypes
  focused: boolean
}

const Tab = createBottomTabNavigator()

const screenOptions: React.FC<ScreenOptionsTypes> = ({ route, focused }) => {
  switch (route.name) {
    case ScreensEnum.CALENDAR:
      return (
        <View
        //   style={
        //     focused && {
        //       shadowColor: colors.lightAqua,
        //       shadowOffset: { width: 2, height: 4 },
        //       shadowOpacity: 1,
        //       shadowRadius: 10,
        //       elevation: 20,
        //     }
        //   }
        >
          <Icon
            name={"calendar"}
            stroke={focused ? colors.lightAqua : colors.cadetGrey}
          />
        </View>
      )
    case ScreensEnum.NEW_MEETING:
      return (
        <View>
          {
            <Icon
              name={"newMeeting"}
              stroke={focused ? colors.lightAqua : colors.cadetGrey}
            />
          }
        </View>
      )
    case ScreensEnum.SETTINGS:
      return (
        <View>
          <Icon
            stroke-width={2}
            name={"settings"}
            stroke={focused ? colors.lightAqua : colors.cadetGrey}
          />
        </View>
      )
    default:
      return null
  }
}

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName={ScreensEnum.CALENDAR}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => screenOptions({ route, focused }),
        tabBarLabelStyle: {
          ...fontFamilies.interManropeSemiBold12,
          ...fontWeights.fontWeight600,
          textAlign: "center",
          marginTop: moderateScale(4),
        },
        tabBarStyle: {
          paddingTop: moderateScale(5),
          height: moderateScale(96),
          backgroundColor: colors.white,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.lightAqua,
        tabBarInactiveTintColor: colors.cadetGrey,
        headerShown: false,
        tabBarVisible: false,
      })}
    >
      <Tab.Screen name={ScreensEnum.CALENDAR} component={CalendarScreen} />
      <Tab.Screen name={ScreensEnum.NEW_MEETING} component={NewMeetingScreen} />
      <Tab.Screen name={ScreensEnum.SETTINGS} component={SettingsScreen} />
    </Tab.Navigator>
  )
}

export default BottomTabNavigator

const styles = StyleSheet.create({})
