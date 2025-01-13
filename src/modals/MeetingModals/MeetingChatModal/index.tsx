import React, { useState, useEffect } from "react"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"
import { screenHeight } from "@utils/screenResponsive"
import colors from "src/assets/colors"
import BottomSheet, { type BottomSheetMethods } from "@devvie/bottom-sheet"
import { useTranslation } from "react-i18next"
import { Icon } from "@components"
import { helpers } from "@utils/theme"
import CustomInput from "src/components/CustomInput"
import ModalHeader from "src/components/ModalHeader"
import { useGetUsersByIdMutation } from "src/api/userApi/userApi"
import { formatLastName } from "@utils/utils"
import { styles } from "./styles"

interface IMessage {
  userId: number
  message: string
}

interface IRenderedMessage {
  userId: number
  userName: string
  message: string
  time?: string
}

const MeetingChatModal = ({
  sheetRef,
  messages,
  sendMessage,
}: {
  sheetRef: React.RefObject<BottomSheetMethods>
  messages: IMessage[]
  sendMessage: (data: any) => void
}) => {
  const { t } = useTranslation()
  const [message, setMessage] = useState("")
  const [renderedMessages, setRenderedMessages] = useState<IRenderedMessage[]>(
    []
  )
  const [getUsersById] = useGetUsersByIdMutation()

  useEffect(() => {
    const fetchMessageData = async () => {
      const processedMessages = await Promise.all(
        messages.map(async (msg) => {
          try {
            const { user } = await getUsersById({ id: msg.userId }).unwrap()

            return {
              ...msg,
              userName: `${user.firstName} ${formatLastName(user.lastName)}`,
            }
          } catch (error) {
            console.error("Error fetching user data:", error)
            return { ...msg, userName: "Unknown User" }
          }
        })
      )
      setRenderedMessages(processedMessages)
    }

    fetchMessageData()
  }, [messages, getUsersById])

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage({ message })
      setMessage("")
    }
  }

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        height={screenHeight * 0.9}
        backdropMaskColor={colors.blackOpacity08}
        style={styles.bottomSheet}
        disableBodyPanning
        disableKeyboardHandling
      >
        <View style={styles.container}>
          <ModalHeader title={t("Chat")} sheetRef={sheetRef} />
          <ScrollView style={styles.content}>
            {renderedMessages.map((msg, idx) => (
              <View style={styles.message} key={idx}>
                <View style={[helpers.flexRowCenter, helpers.gap4]}>
                  <Text style={styles.messageText}>{msg.userName}</Text>
                  <Text
                    style={[styles.messageText, { color: colors.cadetGrey }]}
                  >
                    {msg.time}
                  </Text>
                </View>
                <Text style={[styles.messageText, { color: colors.midGrey }]}>
                  {msg.message}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
        <View style={styles.messageInputContainer}>
          <CustomInput
            placeholder={t("WriteAMessage")}
            style={styles.messageInput}
            inputType="text"
            value={message}
            onChangeText={(val) => setMessage(val as string)}
          />
          <TouchableOpacity onPress={handleSendMessage}>
            <Icon name="sendMessage" />
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  )
}

export default MeetingChatModal
