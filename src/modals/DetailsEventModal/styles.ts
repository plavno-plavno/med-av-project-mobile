import { screenHeight } from "@utils/screenResponsive"
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
  srtContainer: {
    width: "100%",
    position: "absolute",
    padding: moderateScale(16),
    borderRadius: moderateScale(8),
    borderColor: colors.lightGray,
    borderWidth: moderateScale(1),
    backgroundColor: colors.white,
    height: screenHeight * 0.5,
    boxShadow: "0px 0px 0px 2px rgba(78, 183, 189, 0.16)",
    zIndex: 1,
    top: moderateScale(30),
  },
  srtTitle: {
    ...fontFamilies.interManropeBold16,
    ...fontWeights.fontWeight600,
    color: colors.dark,
  },
  srtWrapper: {
    flexDirection: "row",
    gap: moderateScale(8),
    alignItems: "center",
  },
  srtDate: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight400,
    color: colors.charcoal,
  },
})
