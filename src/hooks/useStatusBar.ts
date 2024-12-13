import { useFocusEffect } from '@react-navigation/native';
import { isAndroid } from '@utils/platformChecker';
import { useCallback } from 'react';
import { StatusBar, StatusBarStyle } from 'react-native';

export const useStatusBar = (style: StatusBarStyle, backgroundColor: string) => {
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(style);
      if (isAndroid()) {
        StatusBar.setBackgroundColor(backgroundColor);
      }
    }, [backgroundColor, style]),
  );
};
