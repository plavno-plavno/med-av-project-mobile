import { StyleSheet } from 'react-native';
import { fontFamilies, fontWeights } from '../../utils/theme';
import colors from '../../assets/colors';

export const styles = StyleSheet.create({
    text: {
        textAlign: 'center',
        ...fontFamilies.interManropeRegular12,
        ...fontWeights.fontWeight400,
        color: colors.midGrey,
    },
    link: {
        ...fontFamilies.interManropeSemiBold12,
        ...fontWeights.fontWeight600,
        color: colors.lightAqua,
    }
});