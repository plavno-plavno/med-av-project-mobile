import { fontFamilies, fontWeights } from '@utils/theme';
import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import colors from 'src/assets/colors';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        marginVertical: moderateScale(162)
    },
      title: {
        marginTop: moderateScale(16),
        textAlign: 'center',
        ...fontFamilies.interManropeSemiBold32,
        ...fontWeights.fontWeight500,
        color: colors.charcoal,
      },
      subtitle: {
        alignItems: 'center',
        textAlign: 'center',
        ...fontFamilies.interManropeRegular16,
        ...fontWeights.fontWeight400,
        color: colors.midGrey,
      },
      link: {
        ...fontFamilies.interManropeSemiBold16,
        ...fontWeights.fontWeight600,
        color: colors.lightAqua,
    },
    emailContainer: {
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateScale(9),
      borderRadius: moderateScale(48),
      backgroundColor: colors.backgroundGrey,
    },
    email: {
      ...fontFamilies.interManropeRegular16,
      ...fontWeights.fontWeight400,
      color: colors.charcoal,
    }
    ,
    resendContainer: {
      alignItems: 'center',
      gap: moderateScale(8),
      flexDirection: 'row',
    }
});
