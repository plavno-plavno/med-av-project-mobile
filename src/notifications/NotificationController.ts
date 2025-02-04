import { useAppDispatch } from './../hooks/redux';
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { isAndroid } from '../utils/platformChecker';

PushNotification.createChannel(
  {
    channelId: 'channel-id',
    channelDescription: 'A channel to categorise your notifications',
    soundName: 'default',
    channelName: 'My channel',
    importance: 4,
    playSound: true,
    vibrate: true,
  },
  (created: any) => console.log(`createChannel returned ${created}`),
);

const NotificationController = (props: any) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    PushNotification.configure({
      onRegister: function ({ token }: { token: string }) {
        console.log('TOKEN:', token);
      },

      onNotification: function (notification) {
        console.log("NOTIFICATION:", notification);

        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },

      onAction: function (notification) {
        console.log("ACTION:", notification.action);
        console.log("NOTIFICATION:", notification);

      },

      onRegistrationError: function (err: { message: any }) {
        console.error(err.message, err);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: true,
    });

    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      if (!!remoteMessage && !!remoteMessage.data) {
        console.log(remoteMessage, 'remoteMessage onNotificationOpenedApp');
      }
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        console.log('Notification caused app to open from quit state:', remoteMessage);
        if (remoteMessage) {
          if (!!remoteMessage && !!remoteMessage.data) {
            console.log(remoteMessage, 'remoteMessage getInitialNotification');
          }
        }
      });

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log(remoteMessage?.notification, 'onMessage');
      if (isAndroid()) {
        PushNotification.localNotification({
          // ticker: "My Notification Ticker", // (optional)
          // showWhen: true, // (optional) default: true
          // autoCancel: true, // (optional) default: true
          // largeIcon: "ic_launcher", // (optional) default: "ic_launcher". Use "" for no large icon.
          // largeIconUrl: "https://www.example.tld/picture.jpg", // (optional) default: undefined
          // bigText: "My big text that will be shown when notification is expanded. Styling can be done using HTML tags(see android docs for details)", // (optional) default: "message" prop
          // subText: "This is a subText", // (optional) default: none
          // bigLargeIcon: "ic_launcher", // (optional) default: undefined
          // bigLargeIconUrl: "https://www.example.tld/bigicon.jpg", // (optional) default: undefined
          // color: "red", // (optional) default: system default
          vibrate: true, // (optional) default: true
          vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
          // tag: "some_tag", // (optional) add tag to message
          // group: "group", // (optional) add group to message
          // groupSummary: false, // (optional) set this notification to be the group summary for a group of notifications, default: false
          // ongoing: false, // (optional) set whether this is an "ongoing" notification
          priority: "high", // (optional) set notification priority, default: high
          // visibility: "private", // (optional) set notification visibility, default: private
          // ignoreInForeground: false, // (optional) if true, the notification will not be visible when the app is in the foreground (useful for parity with how iOS notifications appear). should be used in combine with `com.dieam.reactnativepushnotification.notification_foreground` setting
          // shortcutId: "shortcut-id", // (optional) If this notification is duplicative of a Launcher shortcut, sets the id of the shortcut, in case the Launcher wants to hide the shortcut, default undefined
          // onlyAlertOnce: false, // (optional) alert will open only once with sound and notify, default: false

          // when: null, // (optional) Add a timestamp (Unix timestamp value in milliseconds) pertaining to the notification (usually the time the event occurred). For apps targeting Build.VERSION_CODES.N and above, this time is not shown anymore by default and must be opted into by using `showWhen`, default: null.
          // usesChronometer: false, // (optional) Show the `when` field as a stopwatch. Instead of presenting `when` as a timestamp, the notification will show an automatically updating display of the minutes and seconds since when. Useful when showing an elapsed time (like an ongoing phone call), default: false.
          // timeoutAfter: null, // (optional) Specifies a duration in milliseconds after which this notification should be canceled, if it is not already canceled, default: null

          // messageId: "google:message_id", // (optional) added as `message_id` to intent extras so opening push notification can find data stored by @react-native-firebase/messaging module. 

          // actions: ["Yes", "No"], // (Android only) See the doc for notification actions to know more
          // invokeApp: true, // (optional) This enable click on actions to bring back the application to foreground or stay in background, default: true

          /* iOS only properties */
          category: "", // (optional) default: empty string
          /* iOS and Android properties */
          id: 0, // (optional) Valid unique 32 bit integer specified as string. default: Autogenerated Unique ID
          message: String(remoteMessage?.notification?.body),
          title: remoteMessage?.notification?.title,
          bigPictureUrl: remoteMessage?.notification?.android?.imageUrl,
          smallIcon: remoteMessage?.notification?.android?.imageUrl,
          channelId: remoteMessage?.notification?.android?.channelId ?? 'channel-id',
          // picture: "https://www.example.tld/picture.jpg", // (optional) Display an picture with the notification, alias of `bigPictureUrl` for Android. default: undefined
          // userInfo: {}, // (optional) default: {} (using null throws a JSON value '<null>' error)
          // playSound: false, // (optional) default: true
          // soundName: "default", // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)
          // number: 10, // (optional) Valid 32 bit integer specified as string. default: none (Cannot be zero)
          // repeatType: "day", // (optional) Repeating interval. Check 'Repeating Notifications' section for more info.
        });
      }
    });
    return unsubscribe;
  }, []);
  return null;
};

export default NotificationController;
