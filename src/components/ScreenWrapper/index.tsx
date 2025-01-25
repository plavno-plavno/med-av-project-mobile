import React, { memo } from "react"
import {
  ViewStyle,
  View,
  Text,
  StatusBar,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBarProps,
} from "react-native"
import { styles } from "./styles"
import BackButton from "../BackButton"
import { Icon } from "../Icon"
import colors from "../../assets/colors"
import { helpers } from "../../utils/theme"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import MonthsToggler from "../Calendar/MonthsToggler"

interface Props {
  childrenStyle?: ViewStyle | ViewStyle[]
  title?: string
  isBackButton?: boolean
  isCenterTitle?: boolean
  children?: React.ReactNode
  onboardingScreen?: boolean
  handleBackButtonPress?: () => void
  statusBarColor?: StatusBarProps["barStyle"]
  isCalendarScreen?: boolean
  keyboardVerticalOffset?: number
}

const ScreenWrapper: React.FC<Props> = memo(
  ({
    children,
    isBackButton = false,
    isCenterTitle = false,
    title = "",
    onboardingScreen = false,
    statusBarColor = "light-content",
    handleBackButtonPress,
    childrenStyle,
    isCalendarScreen,
    keyboardVerticalOffset,
  }: Props) => {
    const { t } = useTranslation()
    const backgroundColor = onboardingScreen
      ? colors.pearlAqua
      : colors.darkCyan

    return (
      <>
        <KeyboardAvoidingView
          behavior="padding"
          style={helpers.flex1}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <SafeAreaView style={{ backgroundColor }} edges={["top"]} />
          <View style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle={statusBarColor} />

            {onboardingScreen && (
              <View style={styles.onboarding_container}>
                <Icon name="onboardingLogo" />
              </View>
            )}

            {title && (
              <View style={[styles.navigation_container, { backgroundColor }]}>
                {isBackButton ? (
                  <BackButton handleBackButtonPress={handleBackButtonPress} />
                ) : (
                  <View style={styles.empty_view} />
                )}
                <Text style={styles.title}>{title}</Text>
                {isCenterTitle && <View style={styles.empty_view} />}
              </View>
            )}

            {isCalendarScreen && <MonthsToggler />}

            <View style={[styles.childrenContainer, childrenStyle]}>
              {children}
            </View>
          </View>
        </KeyboardAvoidingView>
      </>
    )
  }
)

export default ScreenWrapper
