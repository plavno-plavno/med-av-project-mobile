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
  videoCall: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(12),
    backgroundColor: colors.charcoal,
  },

  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  videoContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    borderRadius: moderateScale(12),
  },
  video: {
    width: "30%",
    height: "30%",
  },
})
