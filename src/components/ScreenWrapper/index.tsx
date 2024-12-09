import React, {memo} from 'react';
import {ViewStyle, View, Text, StatusBar} from 'react-native';
import {styles} from './styles';
import BackButton from '../BackButton';
import {Icon} from '../Icon';
import colors from '../../assets/colors';
import {helpers} from '../../utils/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  styles?: ViewStyle | ViewStyle[];
  title?: string;
  isBackButton?: boolean;
  isCenterTitle?: boolean;
  children?: React.ReactNode;
  onboardingScreen?: boolean;
}

const ScreenWrapper: React.FC<Props> = memo(
  ({
    children,
    isBackButton = false,
    isCenterTitle = false,
    title = '',
    onboardingScreen = false,
  }: Props) => {
    const backgroundColor = onboardingScreen
      ? colors.pearlAqua
      : colors.darkCyan;

    return (
      <>
        <SafeAreaView  style={{backgroundColor}} edges={['top']}/>
        <View style={[styles.container, {backgroundColor}]}>
        <StatusBar barStyle="light-content" />

        {onboardingScreen && (
          <View style={styles.onboarding_container}>
            <Icon name="onboardingLogo" />
          </View>
        )}

        {isBackButton && (
          <View style={[styles.navigation_container, {backgroundColor}]}>
            <BackButton />
            <Text style={styles.title}>{title}</Text>
            {isCenterTitle && <View style={styles.empty_view} />}
          </View>
        )}

        <View style={styles.childrenContainer}>{children}</View>

        <SafeAreaView style={{backgroundColor: colors.white}} edges={['bottom']} />
        </View>
      </>
    );
  },
);

export default ScreenWrapper;
