import React, { useState, useEffect, useRef } from "react"
import { FlatList, KeyboardAvoidingView, Text, TouchableOpacity, View } from "react-native"
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
import { moderateScale } from "react-native-size-matters"

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
  const [renderedMessages, setRenderedMessages] = useState<IRenderedMessage[]>([])
  const scrollViewRef = useRef<FlatList>(null)
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
      setTimeout(() => {
        scrollViewRef.current?.scrollToOffset({ offset: screenHeight * (messages?.length || 1), animated: true })
      }, 100)
    }

    fetchMessageData()
  }, [messages, getUsersById])

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current?.scrollToEnd()
    }
  }, [renderedMessages])

  const handleSendMessage = async () => {
    if (message.trim()) {
      await sendMessage({ message })
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
        keyboardBehavior="interactive"
      >
        <View style={styles.container}>
          <View style={[helpers.ph20, helpers.flex1]}>
            <ModalHeader title={t("Chat")} sheetRef={sheetRef} />
            <FlatList
              keyExtractor={(_item, index) => String(index)}
              extraData={renderedMessages}
              data={renderedMessages}
              contentContainerStyle={[helpers.mt24, helpers.pb16]}
              showsVerticalScrollIndicator={false}
              ref={scrollViewRef}
              renderItem={({ item: msg, index: idx }) => (
                <View style={styles.message} key={idx}>
                  <View style={[helpers.flexRowCenter, helpers.gap4]}>
                    <Text style={styles.messageText}>{msg.userName}</Text>
                    <Text style={[styles.messageText, { color: colors.cadetGrey }]}>
                      {msg.time}
                    </Text>
                  </View>
                  <Text style={[styles.messageText, { color: colors.midGrey }]}>
                    {msg.message}
                  </Text>
                </View>
              )
              }
            />
          </View>

          <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={moderateScale(120)}
          >
            <View style={styles.messageInputContainer}>
              <CustomInput
                placeholder={t("WriteAMessage")}
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
        </View>
      </BottomSheet>
    </>
  )
}

export default MeetingChatModal
