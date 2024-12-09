import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { StatusBar, StatusBarStyle } from 'react-native';
import { isAndroid } from './platformChecker';

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
