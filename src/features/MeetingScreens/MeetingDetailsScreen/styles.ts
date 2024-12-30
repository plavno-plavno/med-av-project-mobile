import { fontFamilies, fontWeights } from "@utils/theme"
import { StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: moderateScale(30),
  },
  title: {
    ...fontFamilies.interManropeSemiBold32,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
    textAlign: "center",
  },
  subtitle: {
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
    textAlign: "center",
  },
  copyMeetingLink: {
    borderColor: colors.lavenderMist,
    borderWidth: 1,
    backgroundColor: colors.white,
  },
  iconContainer: {
    alignSelf: "center",
    position: "absolute",
    bottom: moderateScale(12),
    flexDirection: "row",
    gap: moderateScale(8),
  },
  cameraOffContainer: {
    backgroundColor: colors.charcoal,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  cameraOffText: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.ghostWhite,
  },
  videoContainer: {
    height: "60%",
    width: "65%",
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 16,
    marginTop: moderateScale(24),
    overflow: "hidden",
  },
})
