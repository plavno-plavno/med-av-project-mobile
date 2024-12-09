import { NavigationContainerRef, ParamListBase } from '@react-navigation/native';
import React from 'react';

export const navigationRef = React.createRef<NavigationContainerRef<ParamListBase>>();

export function navigate(name: any, params?: any) {
  if (navigationRef.current?.isReady()) {
    navigationRef.current?.navigate(name as string, params as never);
  }
}

export function reset(name: any) {
  if (navigationRef.current?.isReady()) {
    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: name }],
    });
  }
}
