import { StyleSheet } from "react-native"
import colors from "../../assets/colors"
import { moderateScale } from "react-native-size-matters"
import { fontFamilies, fontWeights } from "../../utils/theme"

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigation_container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: moderateScale(11),
    paddingHorizontal: moderateScale(16),
  },
  title: {
    ...fontFamilies.interManropeSemiBold18,
    ...fontWeights.fontWeight600,
    color: colors.white,
  },
  empty_view: {
    width: moderateScale(50),
  },
  onboarding_container: {
    maxHeight: "40%",
    flexShrink: 1,
    backgroundColor: colors.pearlAqua,
    alignItems: "center",
    justifyContent: "center",
  },
  childrenContainer: {
    flex: 1,
    borderTopLeftRadius: moderateScale(32),
    borderTopRightRadius: moderateScale(32),
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(15),
  },
})
