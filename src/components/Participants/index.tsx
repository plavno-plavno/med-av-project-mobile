import { StyleSheet, View } from "react-native"
import { Text } from "react-native"
import { Icon } from "../Icon"
import colors from "src/assets/colors"
import { moderateScale } from "react-native-size-matters"
import { fontFamilies, fontWeights } from "@utils/theme"

const Participants = ({
  participants,
  status,
}: {
  participants: string
  status: string
}) => {
  const participantsStatus = () => {
    switch (status) {
      case "accept":
        return <Icon name="successCheck" />
      case "decline":
        return <Icon name="errorCheck" />
      default:
        return null
    }
  }
  return (
    <View style={styles.container}>
      {participantsStatus()}
      <Text style={styles.text}>{participants}</Text>
    </View>
  )
}

export default Participants

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.borderGrey,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(6),
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(6),
    gap: moderateScale(4),
  },
  text: {
    ...fontFamilies.interManropeSemiBold14,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
})
