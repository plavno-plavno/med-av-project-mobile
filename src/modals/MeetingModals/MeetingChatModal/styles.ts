import { screenHeight } from "@utils/screenResponsive"
import { fontFamilies, fontWeights } from "@utils/theme"
import { StyleSheet } from "react-native"
import { moderateScale } from "react-native-size-matters"
import colors from "src/assets/colors"

export const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    backgroundColor: colors.white,
    gap: moderateScale(24),
  },
  title: {
    ...fontFamilies.interManropeSemiBold24,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
  },
  content: {
    flex: 1,
    height: screenHeight * 0.67,
    marginBottom: moderateScale(10),
  },
  message: {
    gap: moderateScale(4),
    marginBottom: moderateScale(4),
  },
  messageText: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight400,
    color: colors.charcoal,
  },
  messageTime: {},
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: colors.borderGrey,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(8),
  },
  messageInput: {
    flex: 1,
  },
})
