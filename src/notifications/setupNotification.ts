import messaging from '@react-native-firebase/messaging';
import { isIOS } from '@utils/platformChecker';

export const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  return enabled;
};

export const getNotificationToken = async () => {
  try{
  if (isIOS()) {
    const settings = await messaging().requestPermission();
    if (settings) {
      return messaging().getToken();
    }

    return null;
  }

  return messaging().getToken();
} catch (error) {
  console.log(error, 'error getPushToken');
}
};

export const checkApplicationPermission = async () => {
  const authorizationStatus = await messaging().requestPermission();

  if (authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED) {
    console.log('User has notification permissions enabled.');
    return true;
  } else if (authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL) {
    console.log('User has provisional notification permissions.');
    return true;
  } else {
    console.log('User has notification permissions disabled');
    return false;
  }
};
