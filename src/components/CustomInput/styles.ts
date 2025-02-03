import { StyleSheet } from "react-native"
import colors from "../../assets/colors"
import { moderateScale } from "react-native-size-matters"
import { fontFamilies, fontWeights, helpers } from "../../utils/theme"

export const styles = StyleSheet.create({
  container: {},
  containerStyle: {
    ...helpers.rounded12,
    marginBottom: moderateScale(6),
  },
  label: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
    marginBottom: moderateScale(8),
  },
  required: {
    color: colors.alertRed,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: colors.borderGrey,
    borderRadius: moderateScale(12),
  },
  input: {
    flexShrink: 1,
    overflow: "hidden",
    height: moderateScale(48),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.charcoal,
  },
  textInput: {
    maxWidth: "90%",
    color: colors.midGrey,
  },
  chipContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
  },
  textAreaInput: {
    minHeight: moderateScale(150),
    maxHeight: moderateScale(150),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
    textAlignVertical: 'top',
  },
  dropdownStyle: {
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
  },
  placeholderStyle: {
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.placeholder,
  },
  inputSearchStyle: {
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(12),
    ...fontFamilies.interManropeRegular16,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
  },
  iconStyle: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  focusedInput: {
    borderColor: colors.lightAqua,
    boxShadow: "0px 0px 0px 2px rgba(78, 183, 189, 0.16)",
  },
  errorInput: {
    borderColor: colors.alertRed,
    boxShadow: "none",
  },
  errorText: {
    color: colors.alertRed,
    ...fontFamilies.interManropeRegular14,
    ...fontWeights.fontWeight400,
    marginTop: moderateScale(4),
  },
  rightIcon: {
    position: "absolute",
    right: moderateScale(12),
    top: moderateScale(12),
  },
  chip: {
    marginLeft: moderateScale(6),
    marginVertical: moderateScale(4),
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: colors.borderGrey,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(8),
  },
  chipText: {
    ...fontFamilies.interManropeRegular14,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
  },
  subtitle: {
    ...fontFamilies.interManropeRegular14,
    ...fontWeights.fontWeight400,
    color: colors.midGrey,
  },
})
