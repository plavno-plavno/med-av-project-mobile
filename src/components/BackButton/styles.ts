import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import colors from '../../assets/colors';
import { fontFamilies, fontWeights } from '../../utils/theme';

export const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: moderateScale(8),
        alignItems: 'center',
    },
    text: {
        ...fontFamilies.interManropeSemiBold16,
        ...fontWeights.fontWeight600,
        color: colors.white,
    }
});
