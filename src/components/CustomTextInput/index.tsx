import {
  NativeSyntheticEvent,
  TextInputFocusEventData,
  StyleProp,
  ViewStyle,
  TextInput,
  TextInputKeyPressEventData,
} from "react-native"
import colors from "src/assets/colors"

interface ICustomInputProps {
  label?: string
  placeholder?: string
  value: any
  multiline?: boolean
  onChangeText: (text: string) => void
  secureTextEntry?: boolean
  isHidePassword?: boolean
  inputType?: "dropdown" | "text" | "chip"
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad"
  error?: boolean | string
  dropdownData?: { label: string; value: string }[]
  required?: boolean
  editable?: boolean
  ref?: React.RefObject<TextInput>
  rightIconProps?: {
    name: IconName
    onPress?: () => void
  }
  onSubmitEditing?: () => void
  handleFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
  handleBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
  styles?: StyleProp<ViewStyle>
  onKeyPress?: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void
  numberOfLines?: number
}

const CustomTextInput = ({
  label = "",
  placeholder,
  value,
  multiline,
  onChangeText,
  secureTextEntry: isSecure,
  editable,
  handleFocus,
  handleBlur,
  keyboardType,
  ref,
  onSubmitEditing,
  styles,
  onKeyPress,
  numberOfLines,
  ...rest
}: ICustomInputProps) => {
  return (
    <TextInput
      editable={editable}
      ref={ref}
      multiline={multiline}
      style={styles}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
      secureTextEntry={isSecure}
      keyboardType={keyboardType}
      placeholderTextColor={colors.placeholder}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyPress={onKeyPress}
      autoCorrect={false}
      numberOfLines={numberOfLines}
      {...rest}
    />
  )
}

export default CustomTextInput
