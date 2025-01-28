import {
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
}

const ChatInput = ({
  message,
  setMessage,
  handleSendMessage,
  isAddButton,
}: IChatInput) => {
  const { t } = useTranslation()
  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={moderateScale(120)}
    >
      <View style={styles.messageInputContainer}>
        {isAddButton && (
          <TouchableOpacity>
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

        <TouchableOpacity onPress={handleSendMessage}>
          <Icon name="sendMessage" />
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
