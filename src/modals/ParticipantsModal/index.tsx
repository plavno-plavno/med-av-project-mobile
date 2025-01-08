import { CustomButton, Icon } from "@components"
import BottomSheet, { BottomSheetMethods } from "@devvie/bottom-sheet"
import { screenHeight } from "@utils/screenResponsive"
import { t } from "i18next"
import React from "react"
import { View, Text, Image, ScrollView } from "react-native"
import colors from "src/assets/colors"
import { User } from "src/api/userApi/types"
import { styles } from "./styles"
import ModalHeader from "src/components/ModalHeader"
import { copyToClipboard } from "@utils/clipboard"
import { helpers } from "@utils/theme"

interface IParticipantsModal {
  participants: User[]
  sheetRef: React.RefObject<BottomSheetMethods>
  hash?: string
}

const ParticipantsModal = ({
  participants,
  sheetRef,
  hash,
}: IParticipantsModal) => {
  console.log(participants, "participants")

  return (
    <BottomSheet
      ref={sheetRef}
      //TODO: add height
      height={screenHeight * 0.9}
      backdropMaskColor={colors.blackOpacity08}
      style={styles.bottomSheet}
      disableBodyPanning
    >
      <View style={styles.container}>
        <ModalHeader
          title={t("Participants")}
          sheetRef={sheetRef}
          participants={participants}
        />
        <ScrollView
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={helpers.gap12}
          style={styles.content}
        >
          {participants.map((participant, index) => {
            return (
              <View
                style={[
                  helpers.flexRow,
                  helpers.gap12,
                  helpers.alignItemsCenter,
                ]}
                key={index}
              >
                {participant.photo ? (
                  <Image
                    source={{ uri: participant.photo?.link }}
                    style={{ width: 48, height: 48, borderRadius: 40 }}
                  />
                ) : (
                  <Icon name="avatarEmpty" width={48} height={48} />
                )}
                <View style={[helpers.flexColumn, { gap: 2 }]}>
                  <Text style={styles.participantName}>
                    {participant.firstName} {participant.lastName[0]}.
                  </Text>
                  //TODO: add role
                  {/* <Text style={styles.participantRole}>Meeting organaiser</Text> */}
                </View>
              </View>
            )
          })}
        </ScrollView>
      </View>
      <View style={[helpers.width100Percent, helpers.ph20, { bottom: 0 }]}>
        <CustomButton
          text={t("CopyMeetingLink")}
          type="secondary"
          leftIcon="copy"
          style={styles.copyMeetingLink}
          onPress={() =>
            copyToClipboard(`https://av-hims.netlify.app/meetings/${hash}`)
          }
        />
      </View>
    </BottomSheet>
  )
}
export default ParticipantsModal
