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
  isSecureProps?: boolean
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
      secureTextEntry,
      keyboardType,
      error,
      isSecureProps = true,
      onFocus: propOnFocus,
      onBlur: propOnBlur,
      style,
      ...rest
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null)

    const [isFocused, setIsFocused] = useState(false)
    const [isSecure, setIsSecure] = useState<boolean>(isSecureProps)
    const isNotAPasswordInput = !secureTextEntry
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus()
      },
    }))

    const toggleVisibility = () => {
      setIsSecure((prev) => !prev)
    }

    const onFocusHandler = (
      e: NativeSyntheticEvent<TextInputFocusEventData>
    ) => {
      setIsFocused(true)
      propOnFocus?.(e)
    }

    const onBlurHandler = (
      e: NativeSyntheticEvent<TextInputFocusEventData>
    ) => {
      setIsFocused(false)
      propOnBlur?.(e)
    }

    return (
      <View style={[styles.container, style]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View>
          <TextInput
            ref={inputRef}
            style={[styles.input, error && styles.errorInput]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={isSecure}
            keyboardType={keyboardType}
            placeholderTextColor={colors.placeholder}
            onFocus={onFocusHandler}
            onBlur={onBlurHandler}
            {...rest}
          />

          {secureTextEntry && (
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={toggleVisibility}
              style={styles.rightIcon}
            >
              <Icon name={isSecure ? "eyeClose" : "eyeOpen"} />
            </TouchableOpacity>
          )}
          {error && isNotAPasswordInput && (
            <Icon style={styles.rightIcon} name={"errorInput"} />
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    )
  }
)

export default CustomInput
