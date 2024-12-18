import { isIOS } from './../../../../utils/platformChecker';
import { screenHeight } from '@utils/screenResponsive';
import { fontFamilies, fontWeights } from '@utils/theme';
import { StyleSheet } from 'react-native';
import colors from 'src/assets/colors';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        height: screenHeight * (isIOS() ? 0.8 : 0.87),
    },
    keyboard: {
        flexGrow: 1,
      },
      title: {
        ...fontFamilies.interManropeSemiBold32,
        ...fontWeights.fontWeight500,
        color: colors.charcoal,
      },
      subtitle: {
        ...fontFamilies.interManropeRegular16,
        ...fontWeights.fontWeight400,
        color: colors.midGrey,
      },
      forgotPassword: {
        ...fontFamilies.interManropeBold16,
        ...fontWeights.fontWeight600,
        color: colors.lightAqua,
      },
      buttonsContainer: {
        gap: 8,
      }
});
