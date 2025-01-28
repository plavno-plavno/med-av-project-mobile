import {
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import CustomInput from "../CustomInput"
import { moderateScale } from "react-native-size-matters"
import { Icon } from "../Icon"
import colors from "src/assets/colors"
import { useTranslation } from "react-i18next"

interface IChatInput {
  message: string
  setMessage: (message: string) => void
  handleSendMessage: () => void
  isAddButton?: boolean
  onPressAddButton?: () => void
  isLoading?: boolean
}

const ChatInput = ({
  message,
  setMessage,
  handleSendMessage,
  isAddButton,
  isLoading,
  onPressAddButton,
}: IChatInput) => {
  const { t } = useTranslation()
  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={moderateScale(120)}
    >
      <View style={styles.messageInputContainer}>
        {isAddButton && (
          <TouchableOpacity onPress={() => onPressAddButton?.()}>
            <Icon name="addButton" />
          </TouchableOpacity>
        )}
        <CustomInput
          placeholder={t("WriteYourMessage")}
          style={styles.messageInput}
          inputType="text"
          value={message}
          onChangeText={(val) => setMessage(val as string)}
          numberOfLines={1}
        />

        <TouchableOpacity onPress={handleSendMessage} disabled={!message}>
          {isLoading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Icon name="sendMessage" opacity={message ? 1 : 0.5} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

export default ChatInput

const styles = StyleSheet.create({
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: colors.borderGrey,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(8),
  },
  messageInput: {
    flex: 1,
  },
})
