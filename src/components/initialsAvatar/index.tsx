import { fontFamilies, fontWeights } from "@utils/theme"
import { View, Text, StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

const InitialsAvatar = ({
  firstName,
  lastName,
}: {
  firstName: string
  lastName: string
}) => {
  const initials = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{initials}</Text>
    </View>
  )
}

export default InitialsAvatar

const styles = StyleSheet.create({
  container: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: 50,
    backgroundColor: colors.lightGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight600,
    color: colors.lightAqua,
  },
})
