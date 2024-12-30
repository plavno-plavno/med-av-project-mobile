import React from "react"
import { screenHeight } from "@utils/screenResponsive"
import { Text, TouchableOpacity, View } from "react-native"
import colors from "src/assets/colors"
import BottomSheet, { type BottomSheetMethods } from "@devvie/bottom-sheet"
import { useTranslation } from "react-i18next"
import { styles } from "./styles"
import { Icon } from "@components"
import { helpers } from "@utils/theme"
import CustomInput from "src/components/CustomInput"

const MeetingChatModal = ({
  sheetRef,
}: {
  sheetRef: React.RefObject<BottomSheetMethods>
}) => {
  const { t } = useTranslation()
  const [message, setMessage] = React.useState("Have a good day!")

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        height={screenHeight * 0.9}
        backdropMaskColor={colors.blackOpacity08}
        style={styles.bottomSheet}
        disableBodyPanning
      >
        <View style={styles.container}>
          <View style={[helpers.flexRowBetween, helpers.alignItemsCenter]}>
            <Text style={styles.title}>{t("Chat")}</Text>
            <Icon
              name="closeButton"
              onPress={() => sheetRef.current?.close()}
            />
          </View>
          <View style={styles.content}>
            <View style={styles.message}>
              <View style={[helpers.flexRowCenter, helpers.gap4]}>
                <Text style={styles.messageText}>Valery J.(You)</Text>{" "}
                <Text style={[styles.messageText, { color: colors.cadetGrey }]}>
                  15:34
                </Text>
              </View>
              <Text style={[styles.messageText, { color: colors.midGrey }]}>
                Hello
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.messageInputContainer}>
          <TouchableOpacity>
            <Icon name="addButton" />
          </TouchableOpacity>
          <CustomInput
            style={styles.messageInput}
            inputType="text"
            value={message}
            onChangeText={(val) => setMessage(val as string)}
          />
          <TouchableOpacity>
            <Icon name="sendMessage" />
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  )
}

export default MeetingChatModal
