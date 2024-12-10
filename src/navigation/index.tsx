import React, {useCallback, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {navigationRef} from './RootNavigation';
import * as RootNavigation from './RootNavigation';
import SplashScreen from 'react-native-splash-screen';
import OnboardingScreen from '../features/Auth/screens/OnboardingScreen';
import {ScreensEnum} from './ScreensEnum';
import LoginScreen from '../features/Auth/screens/LoginScreen';
import BottomTabNavigator from './BottomTabNavigator';

const Stack = createNativeStackNavigator();

const Navigation: React.FC = () => {
  const getRoute = useCallback(async () => {
    RootNavigation.navigate(ScreensEnum.ONBOARDING);
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    getRoute();
  }, [getRoute]);


  const config = {
    screens: {
      emailVerifiedScreen: 'emailVerifiedScreen/:item',
    },
  };

  const linking = {
    prefixes: [
      'https://your-domain.com',
    ],
    config,
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        initialRouteName={ScreensEnum.ONBOARDING}
        screenOptions={{headerShown: false, gestureEnabled: false}}>
        <Stack.Screen
          name={ScreensEnum.ONBOARDING}
          component={OnboardingScreen}
        />
        <Stack.Screen name={ScreensEnum.LOGIN} component={LoginScreen} />

        <Stack.Screen name={ScreensEnum.MAIN} component={BottomTabNavigator} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
