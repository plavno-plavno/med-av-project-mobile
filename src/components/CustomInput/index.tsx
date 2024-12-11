import React, { useImperativeHandle, useRef, useState, forwardRef } from "react"
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  ViewStyle,
  StyleProp,
} from "react-native"
import { styles } from "./styles"
import colors from "src/assets/colors"
import { Icon } from "../Icon"

interface CustomInputProps {
  label?: string
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  secureTextEntry?: boolean
  isHidePassword?: boolean
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad"
  error?: boolean | string
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
  style?: StyleProp<ViewStyle>
}

export interface Input {
  focus: () => void
}

const CustomInput = forwardRef<Input, CustomInputProps>(
  (
    {
      label,
      placeholder,
      value,
      onChangeText,
      secureTextEntry = false,
      isHidePassword = true,
      keyboardType = "default",
      error,
      onFocus: propOnFocus,
      onBlur: propOnBlur,
      style,
      ...rest
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null)

    const [isFocused, setIsFocused] = useState(false)
    const [isSecure, setIsSecure] = useState<boolean>(
      secureTextEntry && isHidePassword
    )

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus()
      },
    }))

    const toggleVisibility = () => {
      setIsSecure((prev) => !prev)
    }

    const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(true)
      propOnFocus?.(e)
    }

    const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(false)
      propOnBlur?.(e)
    }

    const isClearButtonVisible =
      !!value && isFocused && !secureTextEntry && !error

    return (
      <View style={[styles.container, style]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.focusedInput,
            error && styles.errorInput,
          ]}
        >
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={isSecure}
            keyboardType={keyboardType}
            placeholderTextColor={colors.placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />
          {secureTextEntry && (
            <TouchableOpacity
              onPress={toggleVisibility}
              style={styles.rightIcon}
            >
              <Icon name={isSecure ? "eyeClose" : "eyeOpen"} />
            </TouchableOpacity>
          )}
          {isClearButtonVisible && (
            <TouchableOpacity
              onPress={() => onChangeText("")}
              style={styles.rightIcon}
            >
              <Icon name="close" />
            </TouchableOpacity>
          )}
          {error && !secureTextEntry && (
            <Icon style={styles.rightIcon} name="errorInput" />
          )}
        </View>
        {error && typeof error === "string" && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    )
  }
)

export default CustomInput
