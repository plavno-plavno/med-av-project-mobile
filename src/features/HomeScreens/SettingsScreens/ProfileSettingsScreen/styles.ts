import { fontFamilies, fontWeights } from "@utils/theme"
import { StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: moderateScale(16),
    justifyContent: "space-between",
    paddingBottom: moderateScale(30),
  },
  title: {
    ...fontFamilies.interManropeSemiBold24,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  photoContainer: {
    alignItems: "center",
    gap: moderateScale(10),
    flexDirection: "row",
  },
  uploadButton: {
    width: "60%",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderGrey,
    borderRadius: moderateScale(32),
  },
  deleteButton: {
    width: "35%",
    backgroundColor: colors.softPeach,
    borderRadius: moderateScale(32),
  },
})
