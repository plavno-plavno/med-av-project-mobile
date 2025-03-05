import { fontFamilies, fontWeights } from "@utils/theme"
import { StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

export const styles = StyleSheet.create({
  container: {
    paddingRight: 0,
  },
  hourStyle: {
    ...fontFamilies.interManropeSemiBold12,
    ...fontWeights.fontWeight500,
    color: colors.cadetGrey,
  },
  cellStyle: {
    backgroundColor: colors.brandColor,
    borderRadius: moderateScale(6),
    maxWidth: "95%",
  },
  eventText: {
    ...fontWeights.fontWeight500,
    color: colors.ghostWhite,
  },
  eventContainer: {
    minHeight: moderateScale(21),
    paddingTop: moderateScale(1),
  },
})
