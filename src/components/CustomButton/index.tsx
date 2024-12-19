import React, { useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native"
import { Icon } from "../Icon"
import { styles } from "./styles"
import { helpers } from "@utils/theme"

interface IProps {
  onPress?: () => void
  text?: string
  disabled?: boolean
  type?: "primary" | "secondary"
  rightIcon?: IconName
  leftIcon?: IconName
  isLoading?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export const CustomButton = ({
  onPress,
  text,
  disabled,
  type = "primary",
  rightIcon,
  leftIcon,
  isLoading,
  textStyle,
  style,
}: IProps) => {
  const [isPressed, setIsPressed] = useState(false)

  const handlePressed = () => {
    !disabled && setIsPressed((prev) => !prev)
  }

  return (
    <TouchableOpacity
      onPressIn={handlePressed}
      onPressOut={handlePressed}
      onPress={onPress}
      style={[
        styles.button_primary,
        type === "secondary" && styles.button_secondary,
        disabled && styles.disabled,
        isLoading && styles.disabled,
        style,
      ]}
      disabled={disabled || isLoading}
    >
      {leftIcon && <Icon name={leftIcon} style={[helpers.mr8]} />}
      <Text
        style={[
          styles.button_primary_text,
          type === "secondary" && styles.button_secondary_text,
          textStyle,
        ]}
      >
        {text}
      </Text>

      {rightIcon && !isLoading && (
        <Icon name={rightIcon} style={[helpers.ml8]} />
      )}
      {isLoading && <ActivityIndicator size={"small"} style={[helpers.ml8]} />}
    </TouchableOpacity>
  )
}
