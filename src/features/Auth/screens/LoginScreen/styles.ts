import { fontFamilies, fontWeights } from '@utils/theme';
import { StyleSheet } from 'react-native';
import colors from 'src/assets/colors';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
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
});
