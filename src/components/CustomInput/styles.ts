import { StyleSheet } from 'react-native';
import colors from '../../assets/colors';
import { moderateScale } from 'react-native-size-matters';
import { fontFamilies, fontWeights } from '../../utils/theme';

export const styles = StyleSheet.create({
  container: {
    
  },
  label: {
    ...fontFamilies.interManropeSemiBold16,
    ...fontWeights.fontWeight500,
    color: colors.charcoal,
    marginBottom: moderateScale(8),
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: colors.borderGrey,
    borderRadius: moderateScale(12),
  },
  input: {
    height: moderateScale(48),
    paddingHorizontal: moderateScale(8),
    maxWidth: '90%',
  },
  focusedInput: {
    borderColor: colors.lightAqua,
    boxShadow: '0px 0px 0px 2px rgba(78, 183, 189, 0.16)',
  },
  errorInput: {
    borderColor: colors.alertRed,
    boxShadow: 'none'
  },
  errorText: {
    color: colors.alertRed,
    ...fontFamilies.interManropeRegular14,
    ...fontWeights.fontWeight400,
    marginTop: moderateScale(4),
  },
  rightIcon: {
    position: 'absolute',
    right: moderateScale(12),
    top: moderateScale(12),
  },
});

