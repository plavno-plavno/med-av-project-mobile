import React, { useState } from "react"
import { ActivityIndicator, Pressable, Text } from "react-native"
import { Icon } from "../Icon"
import { styles } from "./styles"
import { helpers } from "@utils/theme"

interface IProps {
  onPress?: () => void
  text?: string
  disabled?: boolean
  type?: "primary" | "secondary"
  rightIcon?: IconName
  isLoading?: boolean
}

export const CustomButton = ({
  onPress,
  text,
  disabled,
  type = "primary",
  rightIcon,
  isLoading,
}: IProps) => {
  const [isPressed, setIsPressed] = useState(false)

  const handlePressed = () => {
    !disabled && setIsPressed((prev) => !prev)
  }

  return (
    <Pressable
      onPressIn={handlePressed}
      onPressOut={handlePressed}
      onPress={onPress}
      style={[
        styles.button_primary,
        type === "secondary" && styles.button_secondary,
        disabled && styles.disabled,
        isLoading && styles.disabled,
      ]}
      disabled={disabled || isLoading}
    >
      <Text
        style={[
          styles.button_primary_text,
          type === "secondary" && styles.button_secondary_text,
        ]}
      >
        {text}
      </Text>

      {rightIcon && !isLoading && <Icon name={rightIcon} />}
      {isLoading && <ActivityIndicator size={"small"} style={[helpers.ml8]} />}
    </Pressable>
  )
}
