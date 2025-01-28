import { useRoute } from "@react-navigation/native"
import { isIOS } from "@utils/platformChecker"
import { helpers } from "@utils/theme"
import { t } from "i18next"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import ChatInput from "src/components/ChatInput"
import ScreenWrapper from "src/components/ScreenWrapper"

const MyRequestsDetailsScreen = () => {
  const route = useRoute()
  const { helpData } = route.params as { helpData: any }

  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = () => {
    setIsLoading(true)
  }

  return (
    <>
      <ScreenWrapper
        isBackButton
        title={helpData?.category?.name || "unknown"}
        isCenterTitle
        keyboardVerticalOffset={isIOS() ? moderateScale(-100) : undefined}
        childrenStyle={{ paddingHorizontal: moderateScale(0) }}
      >
        <View style={styles.chatContainer}>
          <View style={[helpers.flex1, { backgroundColor: "green" }]}>
            <Text>{helpData?.message}</Text>
          </View>
        </View>
        <ChatInput
          isAddButton
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
        />
      </ScreenWrapper>
    </>
  )
}

export default MyRequestsDetailsScreen

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
})
