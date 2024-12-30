import { fontFamilies, fontWeights } from "@utils/theme"
import { StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

export const styles = StyleSheet.create({
  container: {
    height: "100%",
    paddingHorizontal: moderateScale(20),

    backgroundColor: colors.white,
    gap: moderateScale(24),
  },
  bottomSheet: {
    backgroundColor: colors.white,
  },
  header: {
    width: "100%",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    ...fontFamilies.interManropeSemiBold24,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  subtitle: {
    ...fontFamilies.interManropeSemiBold18,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  content: {
    gap: moderateScale(16),
  },
  infoWrapper: {
    flexDirection: "row",
    gap: moderateScale(8),
  },
  text: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight400,
    color: colors.charcoal,
  },
  participantsContainer: {
    flexShrink: 1,
    flexWrap: "wrap",
    flexDirection: "row",
    gap: moderateScale(8),
  },
})
