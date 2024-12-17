import React, {
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  useCallback,
} from "react"
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  ViewStyle,
  StyleProp,
  ScrollView,
} from "react-native"
import { Icon } from "../Icon"
import { Dropdown } from "react-native-element-dropdown"
import { styles } from "./styles"
import CustomTextInput from "../CustomTextInput"
import { helpers } from "@utils/theme"

interface CustomInputProps {
  label?: string
  placeholder?: string
  value: string[] | string
  onChangeText: (text: string | string[]) => void
  secureTextEntry?: boolean
  isHidePassword?: boolean
  inputType?: "dropdown" | "text" | "chip"
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad"
  error?: boolean | string
  dropdownData?: { label: string; value: string }[]
  required?: boolean
  editable?: boolean
  rightIconProps?: {
    name: IconName
    onPress?: () => void
  }
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
      dropdownData,
      required,
      inputType = "text",
      editable = true,
      rightIconProps,
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

    const renderContent = () => {
      switch (inputType) {
        case "text":
          return (
            <CustomTextInput
              label={label}
              placeholder={placeholder}
              value={value}
              onChangeText={onChangeText}
              secureTextEntry={isSecure}
              editable={editable}
              handleFocus={handleFocus}
              handleBlur={handleBlur}
              keyboardType={keyboardType}
              styles={[styles.input, styles.textInput]}
              {...rest}
            />
          )
        case "dropdown":
          return (
            <Dropdown
              style={styles.input}
              placeholderStyle={styles.dropdownStyle}
              selectedTextStyle={styles.dropdownStyle}
              iconStyle={styles.iconStyle}
              data={dropdownData || []}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isFocused ? "Select item" : "..."}
              value={value}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(item: any) => {
                onChangeText(item.value)
                setIsFocused(false)
              }}
            />
          )
        case "chip": {
          const [chipsInputValue, setChipsInputValue] = useState("")

          const handleAddChip = useCallback(() => {
            if (
              chipsInputValue.trim() &&
              !value.includes(chipsInputValue.trim())
            ) {
              const newChips = [...value, chipsInputValue.trim()]
              setChipsInputValue("")
              onChangeText(newChips)
            }
          }, [chipsInputValue, onChangeText])

          const handleRemoveChip = useCallback(
            (chipToRemove: string) => {
              if (Array.isArray(value)) {
                const newChips = value.filter((chip) => chip !== chipToRemove)
                onChangeText(newChips)
              }
            },
            [value, onChangeText]
          )
          return (
            <ScrollView
              horizontal
              contentContainerStyle={[helpers.alignItemsCenter]}
            >
              {Array.isArray(value) &&
                value.map((chip, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{chip}</Text>
                    <TouchableOpacity onPress={() => handleRemoveChip(chip)}>
                      <Icon name="cross" />
                    </TouchableOpacity>
                  </View>
                ))}
              <CustomTextInput
                styles={[styles.input]}
                value={chipsInputValue}
                onChangeText={(text) => setChipsInputValue(text)}
                onSubmitEditing={handleAddChip}
                label={label}
                placeholder={placeholder}
                secureTextEntry={isSecure}
                editable={editable}
                handleFocus={handleFocus}
                handleBlur={handleBlur}
                keyboardType={keyboardType}
                {...rest}
              />
            </ScrollView>
          )
        }
        default:
          return null
      }
    }

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
      !!value &&
      isFocused &&
      !secureTextEntry &&
      !error &&
      inputType !== "dropdown" &&
      inputType !== "chip"

    return (
      <View style={[styles.container, style]}>
        {label && (
          <Text style={styles.label}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
        )}
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.focusedInput,
            error && styles.errorInput,
          ]}
        >
          {renderContent()}
          {secureTextEntry && (
            <TouchableOpacity
              onPress={toggleVisibility}
              style={styles.rightIcon}
            >
              <Icon name={isSecure ? "eyeClose" : "eyeOpen"} />
            </TouchableOpacity>
          )}
          {rightIconProps && (
            <TouchableOpacity
              onPress={rightIconProps.onPress}
              style={styles.rightIcon}
            >
              <Icon name={rightIconProps.name} />
            </TouchableOpacity>
          )}
          {isClearButtonVisible && (
            <TouchableOpacity
              onPress={() => onChangeText("")}
              style={styles.rightIcon}
            >
              <Icon name="cross" />
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
