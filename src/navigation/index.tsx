import React, {useCallback, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {navigationRef} from './RootNavigation';
import * as RootNavigation from './RootNavigation';
import SplashScreen from 'react-native-splash-screen';
import OnboardingScreen from '../features/Auth/screens/OnboardingScreen';
import {ScreensEnum} from './ScreensEnum';
import LoginScreen from '../features/Auth/screens/LoginScreen';

const Stack = createNativeStackNavigator();

const Navigation: React.FC = () => {
  const getRoute = useCallback(async () => {
    RootNavigation.navigate(ScreensEnum.ONBOARDING);
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    getRoute();
  }, [getRoute]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={ScreensEnum.ONBOARDING}
        screenOptions={{headerShown: false, gestureEnabled: false}}>
        <Stack.Screen
          name={ScreensEnum.ONBOARDING}
          component={OnboardingScreen}
        />
        <Stack.Screen name={ScreensEnum.LOGIN} component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
