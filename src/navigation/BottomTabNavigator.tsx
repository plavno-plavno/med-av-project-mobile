import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../assets/colors';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@components';
import { fontFamilies, fontWeights } from '@utils/theme';
import { ScreensEnum } from './ScreensEnum';
import CalendarScreen from 'src/features/HomeScreens/CalendarScreen/CalendarScreen';
import EventsScreen from 'src/features/HomeScreens/EventsScreen/EventsScreen';
import SettingsScreen from 'src/features/HomeScreens/SettingsScreen/SettingsScreen';
import { moderateScale } from 'react-native-size-matters';

interface RouteTypes {
    key: string;
    name: string;
}

interface ScreenOptionsTypes {
    route: RouteTypes;
    focused: boolean;
}

const Tab = createBottomTabNavigator();

const screenOptions: React.FC<ScreenOptionsTypes> = ({ route, focused }) => {
    switch (route.name) {
        case ScreensEnum.CALENDAR:
            return (
                <View
                //   style={
                //     focused && {
                //       shadowColor: colors.secondBlue,
                //       shadowOffset: { width: 2, height: 4 },
                //       shadowOpacity: 1,
                //       shadowRadius: 10,
                //       elevation: 20,
                //     }}
                >
                    <Icon name={'getStartedStar'} fill={focused ? colors.lightAqua : colors.cadetGrey} />
                </View>
            );
        case ScreensEnum.EVENTS:
            return (
                <View
                //   style={
                //     focused && {
                //       shadowColor: colors.secondBlue,
                //       shadowOffset: { width: 2, height: 4 },
                //       shadowOpacity: 1,
                //       shadowRadius: 10,
                //       elevation: 20,
                //     }}
                >
                    {<Icon name={'getStartedStar'} fill={focused ? colors.lightAqua : colors.cadetGrey} />}
                </View>
            );
        case ScreensEnum.SETTINGS:
            return (
                <View
                //   style={[
                //     styles.profileContainer,
                //     focused && {
                //       shadowColor: colors.secondBlue,
                //       shadowOffset: { width: 2, height: 4 },
                //       shadowOpacity: 1,
                //       shadowRadius: 10,
                //       elevation: 20,
                //     }]}
                >
                    <Icon name={'getStartedStar'} fill={focused ? colors.lightAqua : colors.cadetGrey} />
                </View>
            );
        default:
            return <Icon name={'getStartedStar'} fill={focused ? colors.lightAqua : colors.cadetGrey} />

    }
};

const BottomTabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            initialRouteName={ScreensEnum.CALENDAR}
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused }) => screenOptions({ route, focused }),
                tabBarLabelStyle: {
                    ...fontFamilies.interManropeSemiBold12,
                    ...fontWeights.fontWeight600,
                    textAlign: 'center',
                    marginTop: moderateScale(4),
                },
                tabBarStyle: {
                    paddingTop: moderateScale(15),
                    height: moderateScale(96),
                    backgroundColor: colors.white,
                    borderTopWidth: 0,
                    elevation: 0,
                },
                tabBarActiveTintColor: colors.lightAqua,
                tabBarInactiveTintColor: colors.cadetGrey,
                headerShown: false,
                tabBarVisible: false,
            })}>
            <Tab.Screen name={ScreensEnum.CALENDAR} component={CalendarScreen} />
            <Tab.Screen name={ScreensEnum.EVENTS} component={EventsScreen} />
            <Tab.Screen name={ScreensEnum.SETTINGS} component={SettingsScreen} />
        </Tab.Navigator>
    );
};

export default BottomTabNavigator;

const styles = StyleSheet.create({});
