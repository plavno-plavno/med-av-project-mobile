import { fontFamilies, fontWeights } from "@utils/theme"
import { StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
    gap: moderateScale(16),
  },
  mainWrapper: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(20),
  },
  upperControlContainer: {
    flexShrink: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    marginTop: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  title: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.ghostWhite,
    alignSelf: "center",
  },
  bottomControlContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopLeftRadius: moderateScale(32),
    borderTopRightRadius: moderateScale(32),
    backgroundColor: colors.charcoal,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(24),
  },
  actionButton: {
    height: moderateScale(48),
    width: moderateScale(48),
  },

  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  participansCountContainer: {
    position: "absolute",
    right: moderateScale(-4),
    top: moderateScale(-5),
    zIndex: 1,
    backgroundColor: colors.white,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    width: moderateScale(20),
    height: moderateScale(20),
  },
  participantsCount: {
    ...fontFamilies.interManropeSemiBold12,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
})
