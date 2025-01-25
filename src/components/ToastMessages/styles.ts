import { fontFamilies, fontWeights } from "@utils/theme"
import { StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

export const styles = StyleSheet.create({
  toastContainer: {
    minWidth: "90%",
    maxWidth: "90%",
    borderRadius: moderateScale(16),
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(18),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: moderateScale(8),
    borderLeftWidth: moderateScale(3),
    borderColor: colors.successGreen,
    boxShadow: "0px 4px 32px 0px #17393B29",
  },
  toastText: {
    maxWidth: "75%",
    ...fontFamilies.interManropeSemiBold14,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  errorToast: {
    borderColor: colors.alertRed,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
})
