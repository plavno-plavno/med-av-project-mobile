import { screenHeight } from "@utils/screenResponsive"
import { fontFamilies, fontWeights } from "@utils/theme"
import { StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

export const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: colors.white,
  },
  container: {
    height: screenHeight * 0.83,
    backgroundColor: colors.white,
  },
  title: {
    ...fontFamilies.interManropeSemiBold24,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  content: {
    flexShrink: 1,
    marginBottom: moderateScale(10),
  },
  message: {
    gap: moderateScale(4),
    marginBottom: moderateScale(4),
  },
  messageText: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight400,
    color: colors.charcoal,
    maxWidth: '90%',
  },
})
