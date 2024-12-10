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
  input: {
    height: moderateScale(48),
    borderWidth: 1,
    borderColor: colors.borderGrey,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(8),
  },
  errorInput: {
    borderColor: colors.alertRed,
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

