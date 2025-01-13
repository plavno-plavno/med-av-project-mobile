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
    height: "80%",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    backgroundColor: colors.white,
    gap: moderateScale(24),
  },
  copyMeetingLink: {
    borderColor: colors.lavenderMist,
    borderWidth: 1,
    backgroundColor: colors.white,
  },
  participantName: {
    ...fontFamilies.interManropeSemiBold14,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  participantRole: {
    ...fontFamilies.interManropeRegular12,
    ...fontWeights.fontWeight400,
    color: colors.cadetGrey,
  },
  content: {},
})
