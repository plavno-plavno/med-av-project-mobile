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
  ScrollView,
} from "react-native"
import { Icon } from "../Icon"
import { Dropdown } from "react-native-element-dropdown"
import { styles } from "./styles"
import CustomTextInput from "../CustomTextInput"
import { helpers } from "@utils/theme"
import ColorPicker from "../ColorPicker"
import colors from "src/assets/colors"
import { emailRegex } from "@utils/utils"

interface CustomInputProps {
  label?: string
  placeholder?: string
  dropdownPosition?: "bottom" | "top"
  subtitle?: string
  value: string[] | string
  onChangeText: (text: string | string[]) => void
  secureTextEntry?: boolean
  isHidePassword?: boolean
  inputType?: "dropdown" | "text" | "chip" | "colorPicker" | "textArea"
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad"
  error?: boolean | string
  dropdownData?: { label: string; value: string }[]
  required?: boolean
  editable?: boolean
  inputContainerProps?: StyleProp<ViewStyle>
  rightIconProps?: {
    name: IconName
    onPress?: () => void
  }
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
  style?: StyleProp<ViewStyle>
  numberOfLines?: number
  searchField?: boolean
  maxLength?: number
}

export interface Input {
  focus: () => void
}

const CustomInput = forwardRef<Input, CustomInputProps>(
  (
    {
      label,
      dropdownPosition = "bottom",
      placeholder,
      value,
      onChangeText,
      subtitle,
      secureTextEntry = false,
      isHidePassword = true,
      keyboardType = "default",
      error,
      searchField = false,
      dropdownData,
      inputContainerProps,
      required,
      inputType = "text",
      editable = true,
      rightIconProps,
      onFocus: propOnFocus,
      onBlur: propOnBlur,
      style,
      numberOfLines,
      maxLength,
      ...rest
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null)
    const [handleError, setHandleError] = useState("")
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
              numberOfLines={numberOfLines}
              maxLength={maxLength}
              {...rest}
            />
          )
        case "dropdown": {
          return (
            <Dropdown
              dropdownPosition={dropdownPosition}
              iconColor={colors.cadetGrey}
              style={styles.input}
              selectedTextProps={{
                numberOfLines: 1,
              }}
              search={searchField}
              inputSearchStyle={styles.inputSearchStyle}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.dropdownStyle}
              containerStyle={styles.containerStyle}
              iconStyle={styles.iconStyle}
              value={value}
              data={dropdownData || []}
              maxHeight={300}
              labelField="label"
              valueField="value"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(item: any) => {
                onChangeText(item.value)
                setIsFocused(false)
              }}
            />
          )
        }
        case "chip": {
          const [chipsInputValue, setChipsInputValue] = useState("")
          const handleChange = (val: string) => {
            if (handleError) {
              setHandleError("")
            }
            setChipsInputValue(val)
          }

          const handleAddChip = () => {
            const trimmedValue = chipsInputValue.trim().toLowerCase()

            if (!trimmedValue) return

            if (!emailRegex.test(trimmedValue)) {
              return setHandleError("Please enter a valid email address")
            }

            if (!value.includes(trimmedValue)) {
              setChipsInputValue("")
              onChangeText([...value, trimmedValue])
            }
          }

          const handleRemoveChip = (chipToRemove: string) => {
            if (Array.isArray(value)) {
              const newChips = value.filter((chip) => chip !== chipToRemove)
              onChangeText(newChips)
            }
          }
          return (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.chipScrollWrapper}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.chipContainer}>
                {Array.isArray(value) &&
                  value.map((chip, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{chip}</Text>
                      <Icon
                        name="cross"
                        onPress={() => handleRemoveChip(chip)}
                      />
                    </View>
                  ))}
              </View>
              <CustomTextInput
                styles={styles.input}
                value={chipsInputValue}
                onChangeText={handleChange}
                onSubmitEditing={handleAddChip}
                label={label}
                placeholder={value.length ? "Invite Participants" : placeholder}
                secureTextEntry={isSecure}
                editable={editable}
                handleFocus={handleFocus}
                handleBlur={handleBlur}
                keyboardType={keyboardType}
                numberOfLines={numberOfLines}
                maxLength={maxLength}
                {...rest}
              />
            </ScrollView>
          )
        }
        case "colorPicker": {
          return (
            <View style={[helpers.gap8]}>
              <Text style={styles.subtitle}>{subtitle}</Text>
              <ColorPicker onChange={onChangeText} color={value.toString()} />
            </View>
          )
        }
        case "textArea": {
          const handleChange = (value: string) => {
            if (value.length > 240) {
              setHandleError("Description must be at most 240 characters")
            } else if (handleError) {
              setHandleError("")
            }
            onChangeText(value)
          }
          return (
            <CustomTextInput
              label={label}
              multiline
              placeholder={placeholder}
              value={value}
              onChangeText={handleChange}
              secureTextEntry={isSecure}
              editable={editable}
              handleFocus={handleFocus}
              handleBlur={handleBlur}
              keyboardType={keyboardType}
              styles={[styles.input, styles.textAreaInput]}
              numberOfLines={numberOfLines}
              maxLength={maxLength}
              {...rest}
            />
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

    const isErrorIconVisible =
      !secureTextEntry &&
      inputType !== "dropdown" &&
      inputType !== "colorPicker" &&
      inputType !== "textArea" &&
      !rightIconProps

    const isError = handleError || error
    return (
      <View style={[styles.container, style]}>
        {label && (
          <Text style={styles.label}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
        )}
        <View
          style={[
            inputContainerProps || styles.inputContainer,
            isFocused && styles.focusedInput,
            isError && styles.errorInput,
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
          {isError && isErrorIconVisible && (
            <Icon style={styles.rightIcon} name="errorInput" />
          )}
        </View>
        {isError && (
          <Text style={styles.errorText}>{handleError || error}</Text>
        )}
      </View>
    )
  }
)

export default CustomInput
