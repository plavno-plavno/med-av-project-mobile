import { CustomButton, Icon } from "@components"
import BottomSheet, { BottomSheetMethods } from "@devvie/bottom-sheet"
import { screenHeight } from "@utils/screenResponsive"
import { t } from "i18next"
import React from "react"
import { View, Text, Image, ScrollView } from "react-native"
import colors from "src/assets/colors"
import { User } from "src/api/userApi/types"
import ModalHeader from "src/components/ModalHeader"
import { copyToClipboard } from "@utils/clipboard"
import { helpers } from "@utils/theme"
import { useTranslation } from "react-i18next"
import { formatLastName } from "@utils/utils"
import { styles } from "./styles"

interface IParticipantsModal {
  participants: User[]
  sheetRef: React.RefObject<BottomSheetMethods>
  hash?: string
  isCreatorMode?: boolean
  ownerEmail?: string
}

const ParticipantsModal = ({
  participants,
  ownerEmail,
  sheetRef,
  hash,
  isCreatorMode = false,
}: IParticipantsModal) => {
  const { t } = useTranslation()
  return (
    <BottomSheet
      ref={sheetRef}
      height={screenHeight * 0.9}
      backdropMaskColor={colors.blackOpacity08}
      style={styles.bottomSheet}
      disableBodyPanning
    >
      <View style={styles.container}>
        <ModalHeader
          title={t("Participants")}
          participants={participants}
          onClose={sheetRef.current?.close}
        />
        <ScrollView
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={helpers.gap12}
          style={styles.content}
          removeClippedSubviews={false}
        >
          {participants.map((participant, index) => {
            return (
              <View
                style={[
                  helpers.flexRow,
                  helpers.gap12,
                  helpers.alignItemsCenter,
                  helpers.width100Percent,
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
                  <Text style={styles.participantName} numberOfLines={1}>
                    {participant.firstName}{" "}
                    {formatLastName(participant.lastName)}
                  </Text>
                  {ownerEmail === participant.email && (
                    <Text style={styles.participantRole}>
                      {t("MeetingOrganaiser")}
                    </Text>
                  )}
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
            copyToClipboard(`https://svensacall.com/meetings/${hash}`)
          }
        />
      </View>
    </BottomSheet>
  )
}
export default ParticipantsModal
