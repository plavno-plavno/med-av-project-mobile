import { fontFamilies, fontWeights } from "@utils/theme"
import { StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

export const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: colors.white,
  },
  container: {
    flexGrow: 1,
    height: "85%",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    backgroundColor: colors.white,
    gap: moderateScale(24),
    paddingBottom: moderateScale(20),
  },
  title: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(12),
    backgroundColor: colors.aquaHaze,
  },
  selectButton: {
    width: "90%",
    bottom: moderateScale(10),
    left: moderateScale(20),
  },
})
