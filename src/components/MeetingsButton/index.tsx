import { StyleSheet, Text, TouchableOpacity } from "react-native"
import { Icon } from "../Icon"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"
import { fontFamilies, fontWeights } from "@utils/theme"

const MeetingsButton = ({
  icon,
  title,
  onPress,
}: {
  icon: IconName
  title: string
  onPress?: () => void
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Icon name={icon} />
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  )
}

export default MeetingsButton

const styles = StyleSheet.create({
  container: {
    paddingVertical: moderateScale(22),
    flexDirection: "column",
    gap: moderateScale(8),
    alignItems: "center",
    borderRadius: moderateScale(12),
    backgroundColor: colors.aquaHaze,
  },
  text: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
})
