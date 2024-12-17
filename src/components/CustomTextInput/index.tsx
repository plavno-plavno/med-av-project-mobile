import {
  NativeSyntheticEvent,
  TextInputFocusEventData,
  StyleProp,
  ViewStyle,
  TextInput,
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
      autoCorrect={false}
      {...rest}
    />
  )
}

export default CustomTextInput
