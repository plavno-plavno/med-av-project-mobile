import { Icon } from "@components"
import { fontFamilies, fontWeights, helpers } from "@utils/theme"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

interface NewJoinRequestModalProps {
  name: string
  onAccept: () => void
  onDecline: () => void
}

const NewJoinRequestModal = ({
  name,
  onAccept,
  onDecline,
}: NewJoinRequestModalProps) => {
  if (!name) return null
  return (
    <View style={styles.container}>
      <View style={[helpers.gap4]}>
        <Text style={styles.requestText}>New Join Request</Text>
        <Text style={styles.participantNameText}>{name}</Text>
      </View>
      <View style={[helpers.gap8, helpers.flexRow]}>
        <TouchableOpacity onPress={onDecline}>
          <Icon name={"declineButton"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onAccept}>
          <Icon name={"acceptButton"} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default NewJoinRequestModal

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    position: "absolute",
    top: moderateScale(2),
    left: moderateScale(20),
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    zIndex: 1,
    backgroundColor: colors.white,
  },
  requestText: {
    ...fontFamilies.interManropeSemiBold14,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  participantNameText: {
    ...fontFamilies.interManropeSemiBold14,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
  },
})
