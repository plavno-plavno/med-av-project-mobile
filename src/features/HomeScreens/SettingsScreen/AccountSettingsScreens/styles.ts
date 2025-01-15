import { fontFamilies, fontWeights } from "@utils/theme"
import { StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: moderateScale(16),
    justifyContent: "space-between",
  },
  title: {
    ...fontFamilies.interManropeSemiBold24,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  photoContainer: {
    alignItems: "center",
    gap: moderateScale(16),
    flexDirection: "row",
  },
})
