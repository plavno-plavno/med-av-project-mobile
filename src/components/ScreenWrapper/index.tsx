import React, { memo } from 'react';
import { ViewStyle, View, Text, StatusBar, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { styles } from './styles';
import BackButton from '../BackButton';
import { Icon } from '../Icon';
import colors from '../../assets/colors';
import { helpers } from '../../utils/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  styles?: ViewStyle | ViewStyle[];
  title?: string;
  isBackButton?: boolean;
  isCenterTitle?: boolean;
  children?: React.ReactNode;
  onboardingScreen?: boolean;
  handleBackButtonPress?: () => void;
}

const ScreenWrapper: React.FC<Props> = memo(
  ({
    children,
    isBackButton = false,
    isCenterTitle = false,
    title = '',
    onboardingScreen = false,
    handleBackButtonPress,
  }: Props) => {
    const backgroundColor = onboardingScreen
      ? colors.pearlAqua
      : colors.darkCyan;

    return (
      <>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <KeyboardAvoidingView behavior="padding" style={helpers.flex1}>
            <SafeAreaView style={{ backgroundColor }} edges={['top']} />
            <View style={[styles.container, { backgroundColor }]}>
              <StatusBar barStyle="light-content" />

              {onboardingScreen && (
                <View style={styles.onboarding_container}>
                  <Icon name="onboardingLogo" />
                </View>
              )}

              {isBackButton && (
                <View style={[styles.navigation_container, { backgroundColor }]}>
                  <BackButton handleBackButtonPress={handleBackButtonPress} />
                  <Text style={styles.title}>{title}</Text>
                  {isCenterTitle && <View style={styles.empty_view} />}
                </View>
              )}

              <View style={styles.childrenContainer}>{children}</View>

            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </>
    );
  },
);

export default ScreenWrapper;
